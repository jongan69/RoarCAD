import { describe, expect, test } from "bun:test"
import {
  applyChange,
  captureBridgeSnapshot,
  createProject,
  currentRevision,
  indicatorSnapshot,
  previewChange,
  stableStringify,
  validateSnapshot,
} from "../src/domain"

describe("revision workflow", () => {
  test("preview is non-mutating and stale changes are rejected", async () => {
    const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
    const before = stableStringify(project)
    const preview = await previewChange(project, project.currentRevisionId, "move D1 to 3, 2")
    expect(stableStringify(project)).toBe(before)

    const changed = await applyChange(project, preview)
    expect(changed.currentRevisionId).not.toBe(project.currentRevisionId)
    expect(currentRevision(changed).snapshot.boardSpec?.placements[1]).toMatchObject({ x: 3, y: 2 })
    await expect(applyChange(changed, preview)).rejects.toThrow("stale")
  })

  test("revision hashes are deterministic and capture transport stays blocked", async () => {
    const first = await createProject("indicator", "Power indicator", indicatorSnapshot)
    const second = await createProject("indicator", "Power indicator", indicatorSnapshot)
    expect(first.currentRevisionId).toBe(second.currentRevisionId)
    expect(validateSnapshot(captureBridgeSnapshot).status).toBe("blocked")
    expect(validateSnapshot(indicatorSnapshot).status).toBe("passed")
  })
})
