import { describe, expect, test } from "bun:test"
import {
  applyChange,
  boardGraphSchema,
  captureBridgeSnapshot,
  createProject,
  currentRevision,
  importProject,
  indicatorSnapshot,
  previewChange,
  sanitizeAgentOperations,
  sanitizeAgentSnapshot,
  stableStringify,
  validateSnapshot,
} from "../src/domain"

describe("generic board domain", () => {
  test("one BoardGraph validates simple and high-speed projects", () => {
    expect(boardGraphSchema.parse(indicatorSnapshot.design).board.layers).toBe(2)
    expect(boardGraphSchema.parse(captureBridgeSnapshot.design).board.layers).toBe(8)
    expect(validateSnapshot(indicatorSnapshot).readiness).toBe("fabrication-ready")
    expect(validateSnapshot(captureBridgeSnapshot).readiness).toBe("engineering")
    expect(captureBridgeSnapshot.requirements).toContainEqual(
      expect.objectContaining({ id: "req-video-only", status: "verified" }),
    )
    expect(captureBridgeSnapshot.requirements).toContainEqual(
      expect.objectContaining({
        id: "req-host",
        status: "blocked",
        label: expect.stringContaining("iPhone"),
      }),
    )
    expect(captureBridgeSnapshot.design?.components).toContainEqual(
      expect.objectContaining({ reference: "U10", mpn: "TPD1S514-1YZR" }),
    )
  })

  test("preview is non-mutating and stale structured changes are rejected", async () => {
    const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
    const before = stableStringify(project)
    const preview = await previewChange(project, project.currentRevisionId, "move D1", [
      { type: "move-component", reference: "D1", x: 3, y: 2, rotation: 0, side: "top" },
    ])
    expect(stableStringify(project)).toBe(before)

    const changed = await applyChange(project, preview)
    expect(changed.currentRevisionId).not.toBe(project.currentRevisionId)
    expect(
      currentRevision(changed).snapshot.design?.components.find(
        ({ reference }) => reference === "D1",
      )?.placement,
    ).toMatchObject({ x: 3, y: 2 })
    await expect(applyChange(changed, preview)).rejects.toThrow("stale")
  })

  test("revision hashes are deterministic and bounds reject oversized graphs", async () => {
    const first = await createProject("indicator", "Power indicator", indicatorSnapshot)
    const second = await createProject("indicator", "Power indicator", indicatorSnapshot)
    expect(first.schemaVersion).toBe(2)
    expect(first.currentRevisionId).toBe(second.currentRevisionId)

    const indicatorDesign = boardGraphSchema.parse(indicatorSnapshot.design)
    const oversized = structuredClone(indicatorDesign)
    oversized.components = Array.from({ length: 201 }, (_, index) => ({
      ...structuredClone(indicatorDesign.components[0]),
      reference: `R${index + 1}`,
    }))
    expect(() => boardGraphSchema.parse(oversized)).toThrow()

    const duplicatePin = structuredClone(indicatorDesign)
    duplicatePin.components[0].pins[1].number = duplicatePin.components[0].pins[0].number
    expect(() => boardGraphSchema.parse(duplicatePin)).toThrow("Duplicate pin number")
  })

  test("v1 imports migrate and agent input cannot self-certify", async () => {
    const migrated = await importProject(
      JSON.stringify({
        schemaVersion: 1,
        id: "legacy-indicator",
        name: "Legacy indicator",
        currentRevisionId: "old",
        revisions: [{ snapshot: {} }],
      }),
    )
    expect(migrated.schemaVersion).toBe(2)

    const agentSnapshot = sanitizeAgentSnapshot(indicatorSnapshot)
    expect(agentSnapshot.evidence.every(({ reviewed }) => !reviewed)).toBe(true)
    expect(
      agentSnapshot.design?.components.every(
        ({ reviewStatus, footprint }) => reviewStatus === "candidate" && !footprint.reviewed,
      ),
    ).toBe(true)
    expect(
      sanitizeAgentOperations([
        {
          type: "update-requirement",
          requirement: {
            id: "agent-claim",
            label: "Agent claim",
            required: true,
            status: "verified",
            evidenceIds: [],
          },
        },
      ])[0],
    ).toMatchObject({ requirement: { status: "unverified" } })
  })

  test("rejects pours that reference unknown nets", () => {
    const design = boardGraphSchema.parse(indicatorSnapshot.design)
    expect(() =>
      boardGraphSchema.parse({
        ...design,
        pours: [{ id: "bad-pour", layer: "top", net: "MISSING", clearanceMm: 0.2, outline: [] }],
      }),
    ).toThrow("unknown net")
  })
})
