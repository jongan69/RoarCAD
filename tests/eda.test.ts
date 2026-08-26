import { expect, test } from "bun:test"
import {
  boardGraphSchema,
  captureBridgeSnapshot,
  createProject,
  indicatorSnapshot,
} from "../src/domain"
import { compileBoardGraph, compileSnapshot, prepareExport, validateCircuit } from "../src/eda"
import { environmentMonitorGraph } from "../src/samples"

test("indicator compiles, validates, and exports consistent artifacts", async () => {
  const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const circuitJson = await compileSnapshot(indicatorSnapshot)
  expect(circuitJson.some(({ type }) => type === "pcb_board")).toBe(true)
  expect((await validateCircuit(indicatorSnapshot, circuitJson)).status).toBe("passed")

  const prepared = await prepareExport(project, "fabrication")
  expect(prepared.manifest.artifactClass).toBe("fabrication")
  expect(prepared.manifest.files.map(({ name }) => name).sort()).toEqual(
    Object.keys(prepared.files)
      .filter((name) => name !== "manifest.json")
      .sort(),
  )
  expect(prepared.files["gerbers.zip"].byteLength).toBeGreaterThan(100)
  expect(prepared.files["bom.csv"].byteLength).toBeGreaterThan(50)
  expect(prepared.files["placement.csv"].byteLength).toBeGreaterThan(20)
  expect(new TextDecoder().decode(prepared.files["digital-verification.md"])).toContain(
    "physical certification",
  )
  expect((await prepareExport(project, "fabrication")).manifestHash).toBe(prepared.manifestHash)
})

test("PocketRoar uses the generic compiler and exports engineering-only artifacts", async () => {
  const project = await createProject("capture", "PocketRoar Capture Bridge", captureBridgeSnapshot)
  const circuitJson = await compileBoardGraph(boardGraphSchema.parse(captureBridgeSnapshot.design))
  expect(circuitJson.some(({ type }) => type === "pcb_board")).toBe(true)

  const prepared = await prepareExport(project, "engineering")
  expect(prepared.manifest.artifactClass).toBe("engineering")
  expect(new TextDecoder().decode(prepared.files["ENGINEERING_ONLY.md"])).toContain(
    "not fabrication-ready",
  )
  expect(new TextDecoder().decode(prepared.files["digital-verification.md"])).toContain(
    "Analog/power SPICE | not run",
  )
  await expect(prepareExport(project, "fabrication")).rejects.toThrow("fabrication-ready")
}, 15_000)

test("a third custom board compiles through the same generic path", async () => {
  const circuitJson = await compileBoardGraph(environmentMonitorGraph)
  expect(circuitJson.some(({ type }) => type === "pcb_board")).toBe(true)
  expect(circuitJson.filter(({ type }) => type === "source_component").length).toBe(3)
})
