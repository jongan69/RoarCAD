import { expect, test } from "bun:test"
import { createProject, indicatorSnapshot } from "../src/domain"
import { compileSnapshot, prepareExport, validateCircuit } from "../src/eda"

test("indicator compiles, validates, and exports consistent artifacts", async () => {
  const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const circuitJson = await compileSnapshot(indicatorSnapshot)
  expect(circuitJson.some(({ type }) => type === "pcb_board")).toBe(true)
  expect((await validateCircuit(indicatorSnapshot, circuitJson)).status).toBe("passed")

  const prepared = await prepareExport(project)
  expect(prepared.manifest.files.map(({ name }) => name).sort()).toEqual(
    Object.keys(prepared.files)
      .filter((name) => name !== "manifest.json")
      .sort(),
  )
  expect(prepared.files["gerbers.zip"].byteLength).toBeGreaterThan(100)
  expect(prepared.files["bom.csv"].byteLength).toBeGreaterThan(50)
  expect(prepared.files["placement.csv"].byteLength).toBeGreaterThan(20)
})
