import { type BoardProject, boardProjectSchema, validateSnapshot } from "./domain"
import type { InspectFocus } from "./webmcp"

const PAGE_SIZE = 5
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
          label: short(label),
          value: value ? short(value) : undefined,
          required,
          status,
          evidenceIds,
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
          mpn: short(mpn),
          manufacturer: short(manufacturer),
          value,
          footprint: short(footprint.identifier),
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
          members: members.slice(0, 12),
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
          title: short(title),
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
      snapshot.unresolvedRisks.map((risk) => short(risk, 240)),
      cursor,
    )
    return { ...base, summary: "Unresolved engineering risks.", ...result }
  }

  if (focus === "validation") {
    const result = page(
      [
        ...validation.errors.map((message) => ({
          severity: "error",
          message: short(message, 240),
        })),
        ...validation.warnings.map((message) => ({
          severity: "warning",
          message: short(message, 240),
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
