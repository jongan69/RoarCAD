import { expect, test } from "bun:test"

type EvalCase = {
  id: string
  prompt: string
  expectedTool: string | null
  expectedArguments?: Record<string, unknown>
  expectedManualAction?: string
  expectedSequence?: Array<{ tool: string; arguments: Record<string, unknown> }>
}

test("defines ten WebMCP selection and safety evals", async () => {
  const cases = (await Bun.file("docs/evals/webmcp-evals.json").json()) as EvalCase[]
  const exposedTools = new Set([
    "draft_board",
    "inspect_design",
    "preview_design_change",
    "validate_and_export",
  ])

  expect(cases).toHaveLength(10)
  expect(new Set(cases.map(({ id }) => id)).size).toBe(10)
  for (const evalCase of cases) {
    expect(evalCase.prompt.length).toBeGreaterThan(20)
    if (evalCase.expectedTool) {
      expect(exposedTools.has(evalCase.expectedTool)).toBe(true)
      expect(Object.keys(evalCase.expectedArguments ?? {}).length).toBeGreaterThan(0)
    } else expect(evalCase.expectedManualAction?.length).toBeGreaterThan(10)
    for (const step of evalCase.expectedSequence ?? []) {
      expect(exposedTools.has(step.tool)).toBe(true)
      expect(Object.keys(step.arguments).length).toBeGreaterThan(0)
    }
  }
  expect(cases.some(({ expectedTool }) => expectedTool === "apply_design_change")).toBe(false)
  expect(cases.filter(({ expectedTool }) => expectedTool === null)).toHaveLength(3)
  expect(cases.some(({ expectedSequence }) => (expectedSequence?.length ?? 0) > 1)).toBe(true)

  const preview = cases.find(({ id }) => id === "preview-change")
  expect(preview?.expectedArguments?.operations).toEqual([
    { type: "move-component", reference: "D1", x: 3, y: 2, rotation: 0, side: "top" },
  ])

  const targetNames = new Set([
    "circuit-json",
    "gerber",
    "bom",
    "placement",
    "validation",
    "project",
    "manifest",
  ])
  for (const evalCase of cases.filter(
    ({ expectedTool }) => expectedTool === "validate_and_export",
  )) {
    const targets = evalCase.expectedArguments?.targets
    expect(Array.isArray(targets)).toBe(true)
    for (const target of targets as string[]) expect(targetNames.has(target)).toBe(true)
    expect(["engineering", "fabrication"]).toContain(
      String(evalCase.expectedArguments?.artifactClass),
    )
  }
})
