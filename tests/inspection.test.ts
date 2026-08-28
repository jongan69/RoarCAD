import { expect, test } from "bun:test"
import { captureBridgeSnapshot, createProject, indicatorSnapshot } from "../src/domain"
import { inspectProject } from "../src/inspection"

test("returns focused, paginated inspection results within the tool budget", async () => {
  const project = await createProject("capture", "PocketRoar", captureBridgeSnapshot)
  const focuses = [
    "overview",
    "requirements",
    "components",
    "nets",
    "evidence",
    "risks",
    "validation",
    "history",
  ] as const

  for (const focus of focuses) {
    const result = inspectProject(project, project.currentRevisionId, focus)
    expect(result.revisionId).toBe(project.currentRevisionId)
    expect(result.focus).toBe(focus)
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(1_500)
  }

  const first = inspectProject(project, project.currentRevisionId, "components") as {
    items: unknown[]
    nextCursor?: number
  }
  expect(first.nextCursor).toBe(5)
  const second = inspectProject(project, project.currentRevisionId, "components", undefined, 5) as {
    items: unknown[]
  }
  expect(second.items).not.toEqual(first.items)
})

test("filters component inspection by exact IDs", async () => {
  const project = await createProject("indicator", "Indicator", indicatorSnapshot)
  const result = inspectProject(project, project.currentRevisionId, "components", ["D1"]) as {
    items: unknown[]
  }

  expect(result.items).toEqual([
    expect.objectContaining({ reference: "D1", reviewStatus: "reviewed" }),
  ])
})
