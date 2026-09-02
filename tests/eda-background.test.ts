import { expect, test } from "bun:test"
import { captureBridgeSnapshot, createProject, indicatorSnapshot } from "../src/domain"
import { compileInBackground, prepareInBackground } from "../src/eda-background"

test("background compiler returns real artifacts and supports cancellation", async () => {
  const controller = new AbortController()
  const json = await compileInBackground(indicatorSnapshot, controller.signal)
  expect(json.some(({ type }) => type === "pcb_board")).toBe(true)
  const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const stages: string[] = []
  const prepared = await prepareInBackground(
    project,
    "fabrication",
    (stage) => stages.push(stage),
    controller.signal,
  )
  expect(prepared.revisionId).toBe(project.currentRevisionId)
  expect(prepared.bundle.size).toBeGreaterThan(100)
  expect(stages).toContain("Running design checks…")
  const engineering = await createProject("capture", "PocketRoar", captureBridgeSnapshot)
  await expect(
    prepareInBackground(engineering, "fabrication", () => undefined, controller.signal),
  ).rejects.toThrow("not fabrication-ready")
  const canceled = compileInBackground(indicatorSnapshot, controller.signal)
  controller.abort()
  await expect(canceled).rejects.toThrow("canceled")
  await expect(compileInBackground(indicatorSnapshot, controller.signal)).rejects.toThrow()
}, 30_000)
