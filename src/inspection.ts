import { type BoardProject, boardProjectSchema, validateSnapshot } from "./domain"
import type { InspectFocus } from "./webmcp"

const PAGE_SIZE = 2
const short = (value: string, maximum = 120) =>
  value.length <= maximum ? value : `${value.slice(0, maximum - 1)}…`

function page<T>(items: T[], cursor = 0) {
  const start = Math.min(cursor, items.length)
  const values = items.slice(start, start + PAGE_SIZE)
  return {
    items: values,
    ...(start + values.length < items.length ? { nextCursor: start + values.length } : {}),
  }
}

export function inspectProject(
  project: BoardProject,
  revisionId: string,
  focus: InspectFocus,
  ids?: string[],
  cursor?: number,
) {
  const parsed = boardProjectSchema.parse(project)
  const revision = parsed.revisions.find(({ id }) => id === revisionId)
  if (!revision) throw new Error("Revision not found.")
  const snapshot = revision.snapshot
  const validation = validateSnapshot(snapshot)
  const design = snapshot.design
  const selected = ids?.length ? new Set(ids) : undefined
  const base = {
    revisionId,
    focus,
    readiness: validation.readiness,
    nextAction: "Inspect another page or preview a focused change.",
  }

  if (focus === "overview") {
    return {
      ...base,
      summary: `${parsed.name}: ${validation.readiness}`,
      board: design
        ? {
            layers: design.board.layers,
            components: design.components.length,
            nets: design.nets.length,
            differentialPairs: design.differentialPairs.length,
          }
        : null,
      requirements: snapshot.requirements.length,
      evidence: snapshot.evidence.length,
      risks: snapshot.unresolvedRisks.length,
      nextAction: "Inspect a focused section by ID before proposing a change.",
    }
  }

  if (focus === "requirements") {
    const result = page(
      snapshot.requirements
        .filter(({ id }) => !selected || selected.has(id))
        .map(({ id, label, value, required, status, evidenceIds }) => ({
          id,
          label: short(label, 80),
          value: value ? short(value, 80) : undefined,
          required,
          status,
          evidenceIds: evidenceIds.slice(0, 6).map((id) => short(id, 40)),
        })),
      cursor,
    )
    return { ...base, summary: "Requirements and review state.", ...result }
  }

  if (focus === "components") {
    const result = page(
      (design?.components ?? [])
        .filter(({ reference }) => !selected || selected.has(reference))
        .map(({ reference, mpn, manufacturer, value, footprint, placement, reviewStatus }) => ({
          reference,
          mpn: short(mpn, 80),
          manufacturer: short(manufacturer, 80),
          value: value ? short(value, 80) : undefined,
          footprint: short(footprint.identifier, 80),
          footprintReviewed: footprint.reviewed,
          reviewStatus,
          placement,
        })),
      cursor,
    )
    return { ...base, summary: "Parts, footprints, and placement.", ...result }
  }

  if (focus === "nets") {
    const result = page(
      (design?.nets ?? [])
        .filter(({ name }) => !selected || selected.has(name))
        .map(({ name, className, members }) => ({
          name,
          className,
          members: members.slice(0, 6).map((member) => short(member, 40)),
          memberCount: members.length,
        })),
      cursor,
    )
    return { ...base, summary: "Net membership and classes.", ...result }
  }

  if (focus === "evidence") {
    const result = page(
      snapshot.evidence
        .filter(({ id }) => !selected || selected.has(id))
        .map(({ id, title, kind, official, reviewed, revision: sourceRevision }) => ({
          id,
          title: short(title, 80),
          kind,
          sourceRevision,
          official,
          reviewed,
        })),
      cursor,
    )
    return { ...base, summary: "External evidence is untrusted until human review.", ...result }
  }

  if (focus === "risks") {
    const result = page(
      snapshot.unresolvedRisks.map((risk) => short(risk, 180)),
      cursor,
    )
    return { ...base, summary: "Unresolved engineering risks.", ...result }
  }

  if (focus === "validation") {
    const result = page(
      [
        ...validation.errors.map((message) => ({
          severity: "error",
          message: short(message, 180),
        })),
        ...validation.warnings.map((message) => ({
          severity: "warning",
          message: short(message, 180),
        })),
      ],
      cursor,
    )
    return {
      ...base,
      summary: `${validation.errors.length} blockers and ${validation.warnings.length} warnings.`,
      status: validation.status,
      ...result,
    }
  }

  const result = page(
    [...parsed.revisions]
      .reverse()
      .map(({ id, parentId, summary, validation: storedValidation }) => ({
        id,
        parentId,
        summary: short(summary),
        readiness: storedValidation.readiness,
      })),
    cursor,
  )
  return { ...base, summary: "Immutable revision history.", ...result }
}
