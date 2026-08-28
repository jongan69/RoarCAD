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

  const previousSnapshot = structuredClone(captureBridgeSnapshot)
  const hostRequirement = previousSnapshot.requirements.find(({ id }) => id === "req-host")
  if (!hostRequirement) throw new Error("PocketRoar host requirement is missing.")
  hostRequirement.label = "Exact USB-C iPad and iPadOS version"
  hostRequirement.value = "iPad Pro 11-inch (3rd generation), iPad13,4; iPadOS and cable pending"
  hostRequirement.status = "unverified"
  previousSnapshot.architecture.splice(
    1,
    2,
    "CYUSB3065 UVC output → HD3SS3212 mux → USB-C iPad host",
  )
  previousSnapshot.validationPlan[3] =
    "Prove known UVC capture on the exact iPad, OS, cable, and orientation."
  previousSnapshot.unresolvedRisks[6] = "Exact iPad compatibility requires physical-device proof."
  const previousBundledPocketRoar = await createProject(
    "capture",
    "PocketRoar Capture Bridge",
    previousSnapshot,
  )
  const legacyPocketRoar = structuredClone(previousBundledPocketRoar)
  legacyPocketRoar.currentRevisionId = "56147af9ff46a3ee"
  legacyPocketRoar.revisions[0].id = "56147af9ff46a3ee"
  expect(chooseStartupProject(legacyPocketRoar, indicator, pocketRoar)).toBe(indicator)

  const priorPocketRoar = structuredClone(previousBundledPocketRoar)
  priorPocketRoar.currentRevisionId = "fbfe09aae1d80347"
  priorPocketRoar.revisions[0].id = "fbfe09aae1d80347"
  expect(chooseStartupProject(priorPocketRoar, indicator, pocketRoar)).toBe(indicator)

  const unrelatedSnapshot = structuredClone(captureBridgeSnapshot)
  unrelatedSnapshot.requirements[0].value = "A different imported design"
  const unrelated = await createProject("capture", "Imported capture design", unrelatedSnapshot)
  expect(chooseStartupProject(unrelated, indicator, pocketRoar)).toBe(unrelated)

  const preview = await previewChange(pocketRoar, pocketRoar.currentRevisionId, "Move U1", [
    { type: "move-component", reference: "U1", x: 1, y: 1, rotation: 0, side: "top" },
  ])
  const revisedPocketRoar = await applyChange(pocketRoar, preview)
  expect(chooseStartupProject(revisedPocketRoar, indicator, pocketRoar)).toBe(revisedPocketRoar)
})
