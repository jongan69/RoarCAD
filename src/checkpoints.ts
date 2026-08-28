import { z } from "zod"
import {
  type BoardProject,
  boardProjectSchema,
  computeRevisionId,
  createRevision,
  currentRevision,
  type DesignSnapshot,
  revisionSchema,
  sanitizeAgentSnapshot,
  sha256,
  snapshotSchema,
  stableStringify,
  validateSnapshot,
} from "./domain"

export const MAX_CHECKPOINT_ENCODED_CHARACTERS = 100_000
export const MAX_CHECKPOINT_BYTES = 2_000_000

const checkpointBodySchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string().min(1).max(80),
  projectName: z.string().min(1).max(120),
  head: revisionSchema,
  ancestorRevisionIds: z.array(z.string()).max(100),
  note: z.string().max(500).optional(),
})

export const checkpointSchema = checkpointBodySchema.extend({
  checkpointHash: z.string().regex(/^[a-f0-9]{64}$/),
})

export type Checkpoint = z.infer<typeof checkpointSchema>
export type CheckpointRelation =
  | "same"
  | "incoming-ahead"
  | "incoming-behind"
  | "diverged"
  | "unrelated"

export type CheckpointComparison = {
  relation: CheckpointRelation
  commonAncestorId?: string
  senderReadiness: ReturnType<typeof validateSnapshot>["readiness"]
  adoptionReadiness: ReturnType<typeof validateSnapshot>["readiness"]
  changes: {
    board: string[]
    components: string[]
    nets: string[]
    requirements: string[]
    evidence: string[]
    risks: string[]
  }
}

const uniqueTail = (values: string[], maximum = 100) => [...new Set(values)].slice(-maximum)

function sanitizeExternalSnapshot(snapshot: DesignSnapshot): DesignSnapshot {
  const next = sanitizeAgentSnapshot(snapshot)
  next.requirements = next.requirements.map((requirement) => ({
    ...requirement,
    status: requirement.status === "verified" ? "unverified" : requirement.status,
  }))
  return snapshotSchema.parse(next)
}

async function verifyCheckpoint(source: unknown): Promise<Checkpoint> {
  const checkpoint = checkpointSchema.parse(source)
  const { checkpointHash: _checkpointHash, ...body } = checkpoint
  if ((await sha256(stableStringify(body))) !== checkpoint.checkpointHash) {
    throw new Error("Checkpoint integrity verification failed.")
  }
  const expectedRevisionId = await computeRevisionId(
    checkpoint.head.parentId,
    checkpoint.head.summary,
    checkpoint.head.snapshot,
  )
  if (expectedRevisionId !== checkpoint.head.id) {
    throw new Error("Checkpoint revision integrity verification failed.")
  }
  return checkpoint
}

export async function createCheckpoint(project: BoardProject, note?: string): Promise<Checkpoint> {
  const parsed = boardProjectSchema.parse(project)
  const head = currentRevision(parsed)
  const normalizedNote = note?.trim()
  const body = checkpointBodySchema.parse({
    schemaVersion: 1,
    projectId: parsed.id,
    projectName: parsed.name,
    head,
    ancestorRevisionIds: uniqueTail([
      ...parsed.externalAncestorRevisionIds,
      ...parsed.revisions.filter(({ id }) => id !== head.id).map(({ id }) => id),
    ]),
    ...(normalizedNote ? { note: normalizedNote } : {}),
  })
  return checkpointSchema.parse({
    ...body,
    checkpointHash: await sha256(stableStringify(body)),
  })
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Checkpoint encoding is invalid.")
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=")
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function transformBytes(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  maximumBytes: number,
): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(transform).getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > maximumBytes) {
      await reader.cancel()
      throw new Error("Checkpoint is too large.")
    }
    chunks.push(value)
  }
  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

export async function encodeCheckpoint(checkpoint: Checkpoint): Promise<string> {
  const verified = await verifyCheckpoint(checkpoint)
  const source = new TextEncoder().encode(stableStringify(verified))
  if (source.byteLength > MAX_CHECKPOINT_BYTES) throw new Error("Checkpoint is too large.")
  const compressed = await transformBytes(
    source,
    new CompressionStream("gzip"),
    MAX_CHECKPOINT_BYTES,
  )
  const encoded = bytesToBase64Url(compressed)
  if (encoded.length > MAX_CHECKPOINT_ENCODED_CHARACTERS) {
    throw new Error("Checkpoint link is too large; download the checkpoint file instead.")
  }
  return `v1.${encoded}`
}

function encodedCheckpointFrom(source: string): string {
  const marker = "#checkpoint="
  if (source.includes(marker)) return source.slice(source.indexOf(marker) + marker.length)
  return source.startsWith("checkpoint=") ? source.slice("checkpoint=".length) : source
}

export async function decodeCheckpoint(source: string): Promise<Checkpoint> {
  const encoded = encodedCheckpointFrom(source)
  if (!encoded.startsWith("v1.")) throw new Error("Unsupported checkpoint link version.")
  const payload = encoded.slice(3)
  if (payload.length > MAX_CHECKPOINT_ENCODED_CHARACTERS) {
    throw new Error("Checkpoint link is too large.")
  }
  const compressed = base64UrlToBytes(payload)
  const decompressed = await transformBytes(
    compressed,
    new DecompressionStream("gzip"),
    MAX_CHECKPOINT_BYTES,
  )
  return verifyCheckpoint(JSON.parse(new TextDecoder().decode(decompressed)) as unknown)
}

export async function parseCheckpointFile(source: string): Promise<Checkpoint> {
  if (new TextEncoder().encode(source).byteLength > MAX_CHECKPOINT_BYTES) {
    throw new Error("Checkpoint file is too large.")
  }
  return verifyCheckpoint(JSON.parse(source) as unknown)
}

export function checkpointFile(checkpoint: Checkpoint): string {
  return `${stableStringify(checkpoint)}\n`
}

export async function checkpointUrl(checkpoint: Checkpoint, baseUrl: string): Promise<string> {
  const url = new URL(baseUrl)
  url.hash = `checkpoint=${await encodeCheckpoint(checkpoint)}`
  return url.toString()
}

function changedItems<T>(
  local: T[],
  incoming: T[],
  key: (item: T) => string,
  label: (id: string, kind: "added" | "removed" | "changed") => string,
  normalize: (item: T) => unknown = (item) => item,
): string[] {
  const localItems = new Map(local.map((item) => [key(item), item]))
  const incomingItems = new Map(incoming.map((item) => [key(item), item]))
  const changes: string[] = []
  for (const [id, item] of incomingItems) {
    const previous = localItems.get(id)
    if (!previous) changes.push(label(id, "added"))
    else if (stableStringify(normalize(previous)) !== stableStringify(normalize(item))) {
      changes.push(label(id, "changed"))
    }
  }
  for (const id of localItems.keys()) {
    if (!incomingItems.has(id)) changes.push(label(id, "removed"))
  }
  return changes
}

function lineage(project: BoardProject): string[] {
  return uniqueTail([
    ...project.externalAncestorRevisionIds,
    ...project.revisions.map(({ id }) => id),
  ])
}

export function compareCheckpoint(
  project: BoardProject,
  checkpoint: Checkpoint,
): CheckpointComparison {
  const parsed = boardProjectSchema.parse(project)
  const localHead = currentRevision(parsed)
  const localLineage = lineage(parsed)
  const incomingLineage = uniqueTail([...checkpoint.ancestorRevisionIds, checkpoint.head.id])
  const commonAncestorId = [...localLineage].reverse().find((id) => incomingLineage.includes(id))
  const relation: CheckpointRelation =
    parsed.id !== checkpoint.projectId
      ? "unrelated"
      : localHead.id === checkpoint.head.id
        ? "same"
        : checkpoint.ancestorRevisionIds.includes(localHead.id)
          ? "incoming-ahead"
          : localLineage.includes(checkpoint.head.id)
            ? "incoming-behind"
            : commonAncestorId
              ? "diverged"
              : "unrelated"
  const local = localHead.snapshot
  const incoming = checkpoint.head.snapshot
  const sanitized = sanitizeExternalSnapshot(incoming)
  const localDesign = local.design
  const incomingDesign = incoming.design
  return {
    relation,
    commonAncestorId,
    senderReadiness: validateSnapshot(incoming).readiness,
    adoptionReadiness: validateSnapshot(sanitized).readiness,
    changes: {
      board:
        stableStringify(localDesign?.board) === stableStringify(incomingDesign?.board)
          ? []
          : ["Board settings changed"],
      components: changedItems(
        localDesign?.components ?? [],
        incomingDesign?.components ?? [],
        ({ reference }) => reference,
        (id, kind) => `${id} ${kind}`,
        ({ reviewStatus: _reviewStatus, footprint, ...component }) => {
          const { reviewed: _reviewed, ...unreviewedFootprint } = footprint
          return { ...component, footprint: unreviewedFootprint }
        },
      ),
      nets: changedItems(
        localDesign?.nets ?? [],
        incomingDesign?.nets ?? [],
        ({ name }) => name,
        (id, kind) => `${id} ${kind}`,
      ),
      requirements: changedItems(
        local.requirements,
        incoming.requirements,
        ({ id }) => id,
        (id, kind) => `${id} ${kind}`,
        ({ status: _status, ...requirement }) => requirement,
      ),
      evidence: changedItems(
        local.evidence,
        incoming.evidence,
        ({ id }) => id,
        (id, kind) => `${id} ${kind}`,
        ({ reviewed: _reviewed, ...evidence }) => evidence,
      ),
      risks: changedItems(
        local.unresolvedRisks,
        incoming.unresolvedRisks,
        (risk) => risk,
        (id, kind) => `${kind}: ${id}`,
      ),
    },
  }
}

export async function forkCheckpoint(checkpoint: Checkpoint): Promise<BoardProject> {
  const verified = await verifyCheckpoint(checkpoint)
  const snapshot = sanitizeExternalSnapshot(verified.head.snapshot)
  const revision = await createRevision(
    verified.head.id,
    `Continue shared checkpoint ${verified.head.id}`,
    snapshot,
  )
  return boardProjectSchema.parse({
    schemaVersion: 2,
    id: verified.projectId,
    name: verified.projectName,
    currentRevisionId: revision.id,
    revisions: [revision],
    externalAncestorRevisionIds: uniqueTail([...verified.ancestorRevisionIds, verified.head.id]),
  })
}

export async function adoptCheckpoint(
  project: BoardProject,
  checkpoint: Checkpoint,
): Promise<BoardProject> {
  const verified = await verifyCheckpoint(checkpoint)
  const comparison = compareCheckpoint(project, verified)
  if (comparison.relation === "unrelated") {
    throw new Error("This checkpoint belongs to a different project or has no common ancestry.")
  }
  if (comparison.relation === "same" || comparison.relation === "incoming-behind") {
    throw new Error("This checkpoint does not contain a newer design state.")
  }
  const revision = await createRevision(
    project.currentRevisionId,
    `Adopt checkpoint ${verified.head.id}`,
    sanitizeExternalSnapshot(verified.head.snapshot),
  )
  return boardProjectSchema.parse({
    ...project,
    currentRevisionId: revision.id,
    revisions: [...project.revisions, revision].slice(-30),
    externalAncestorRevisionIds: uniqueTail([
      ...project.externalAncestorRevisionIds,
      ...verified.ancestorRevisionIds,
      verified.head.id,
    ]),
  })
}
