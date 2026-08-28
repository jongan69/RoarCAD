import { expect, test } from "bun:test"
import {
  adoptCheckpoint,
  checkpointSchema,
  compareCheckpoint,
  createCheckpoint,
  decodeCheckpoint,
  encodeCheckpoint,
  forkCheckpoint,
  parseCheckpointFile,
} from "../src/checkpoints"
import {
  applyChange,
  captureBridgeSnapshot,
  createProject,
  currentRevision,
  indicatorSnapshot,
  previewChange,
  validateSnapshot,
} from "../src/domain"

test("round-trips a checkpoint without changing its immutable head", async () => {
  for (const [id, name, snapshot, note] of [
    ["indicator", "Power indicator", indicatorSnapshot, "Please review this handoff"],
    ["pocketroar", "PocketRoar", captureBridgeSnapshot, undefined],
  ] as const) {
    const project = await createProject(id, name, snapshot)
    const checkpoint = await createCheckpoint(project, note)
    const decoded = await decodeCheckpoint(await encodeCheckpoint(checkpoint))

    expect(decoded.projectId).toBe(id)
    expect(decoded.head).toEqual(currentRevision(project))
    expect(decoded.note).toBe(note)
  }
})

test("rejects corrupted and oversized checkpoint links", async () => {
  const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const encoded = await encodeCheckpoint(await createCheckpoint(project))
  const checkpoint = await createCheckpoint(project)
  const replacement = encoded.endsWith("a") ? "b" : "a"

  await expect(decodeCheckpoint(`${encoded.slice(0, -1)}${replacement}`)).rejects.toThrow()
  await expect(decodeCheckpoint(`v1.${"a".repeat(100_001)}`)).rejects.toThrow("large")
  await expect(
    parseCheckpointFile(JSON.stringify({ ...checkpoint, note: "modified after hashing" })),
  ).rejects.toThrow("integrity")
})

test("rejects oversized ancestry IDs and non-HTTP evidence URLs", async () => {
  const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const checkpoint = await createCheckpoint(project)

  expect(
    checkpointSchema.safeParse({ ...checkpoint, ancestorRevisionIds: ["x".repeat(81)] }).success,
  ).toBe(false)

  const unsafeSnapshot = structuredClone(indicatorSnapshot)
  unsafeSnapshot.evidence[0].sourceUrl = "javascript:alert(1)"
  const unsafeProject = await createProject("unsafe", "Unsafe evidence", unsafeSnapshot)
  const unsafeCheckpoint = await createCheckpoint(unsafeProject)
  await expect(encodeCheckpoint(unsafeCheckpoint)).rejects.toThrow("HTTP")
})

test("classifies returned and stale checkpoints without merging them", async () => {
  const original = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const shared = await createCheckpoint(original)
  let collaborator = await forkCheckpoint(shared)
  const preview = await previewChange(collaborator, collaborator.currentRevisionId, "Move D1", [
    { type: "move-component", reference: "D1", x: 3, y: 1, rotation: 0, side: "top" },
  ])
  collaborator = await applyChange(collaborator, preview)
  const returned = await createCheckpoint(collaborator)

  expect(compareCheckpoint(original, returned).relation).toBe("incoming-ahead")
  expect(compareCheckpoint(collaborator, shared).relation).toBe("incoming-behind")
})

test("forks an external checkpoint with ancestry and downgraded trust", async () => {
  const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
  expect(validateSnapshot(currentRevision(project).snapshot).readiness).toBe("fabrication-ready")

  const checkpoint = await createCheckpoint(project)
  const fork = await forkCheckpoint(checkpoint)
  const snapshot = currentRevision(fork).snapshot

  expect(fork.externalAncestorRevisionIds).toContain(checkpoint.head.id)
  expect(snapshot.requirements.every(({ status }) => status !== "verified")).toBe(true)
  expect(snapshot.evidence.every(({ reviewed }) => !reviewed)).toBe(true)
  expect(
    snapshot.design?.components.every(({ reviewStatus }) => reviewStatus === "candidate"),
  ).toBe(true)
  expect(validateSnapshot(snapshot).readiness).toBe("engineering")
})

test("reviews divergent work before adopting it as a new local revision", async () => {
  const original = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const shared = await createCheckpoint(original)
  let collaborator = await forkCheckpoint(shared)
  const collaboratorPreview = await previewChange(
    collaborator,
    collaborator.currentRevisionId,
    "Move D1",
    [{ type: "move-component", reference: "D1", x: 4, y: 2, rotation: 0, side: "top" }],
  )
  collaborator = await applyChange(collaborator, collaboratorPreview)
  const returned = await createCheckpoint(collaborator)

  const originalPreview = await previewChange(original, original.currentRevisionId, "Move R1", [
    { type: "move-component", reference: "R1", x: -4, y: 0, rotation: 0, side: "top" },
  ])
  const locallyChanged = await applyChange(original, originalPreview)
  const comparison = compareCheckpoint(locallyChanged, returned)

  expect(comparison.relation).toBe("diverged")
  expect(comparison.changes.components).toEqual(["R1 changed", "D1 changed"])
  expect(comparison.changes.requirements).toEqual([])
  expect(comparison.changes.evidence).toEqual([])

  const adopted = await adoptCheckpoint(locallyChanged, returned)
  expect(adopted.currentRevisionId).not.toBe(locallyChanged.currentRevisionId)
  expect(currentRevision(adopted).parentId).toBe(locallyChanged.currentRevisionId)
  expect(currentRevision(adopted).summary).toContain(returned.head.id)
  expect(adopted.externalAncestorRevisionIds).toContain(returned.head.id)
  expect(
    currentRevision(adopted).snapshot.design?.components.find(({ reference }) => reference === "D1")
      ?.placement.x,
  ).toBe(4)
})

test("never adopts a checkpoint from another project identity", async () => {
  const original = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const other = await createProject("other", "Other board", indicatorSnapshot)
  const checkpoint = await createCheckpoint(other)

  expect(compareCheckpoint(original, checkpoint).relation).toBe("unrelated")
  await expect(adoptCheckpoint(original, checkpoint)).rejects.toThrow("different project")
})
