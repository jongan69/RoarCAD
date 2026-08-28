import { expect, test } from "bun:test"
import {
  applyChange,
  captureBridgeSnapshot,
  createProject,
  indicatorSnapshot,
  previewChange,
} from "../src/domain"
import { chooseStartupProject } from "../src/storage"

test("a pristine PocketRoar reference never becomes the live demo startup", async () => {
  const indicator = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const pocketRoar = await createProject(
    "capture",
    "PocketRoar Capture Bridge",
    captureBridgeSnapshot,
  )

  expect(chooseStartupProject(pocketRoar, indicator, pocketRoar)).toBe(indicator)

  const preview = await previewChange(pocketRoar, pocketRoar.currentRevisionId, "Move U1", [
    { type: "move-component", reference: "U1", x: 1, y: 1, rotation: 0, side: "top" },
  ])
  const revisedPocketRoar = await applyChange(pocketRoar, preview)
  expect(chooseStartupProject(revisedPocketRoar, indicator, pocketRoar)).toBe(revisedPocketRoar)
})
