import { expect, test } from "bun:test"

type EvalCase = {
  id: string
  prompt: string
  expectedTool: string | null
  expectedArguments?: Record<string, unknown>
  expectedManualAction?: string
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
    if (evalCase.expectedTool) expect(exposedTools.has(evalCase.expectedTool)).toBe(true)
    else expect(evalCase.expectedManualAction?.length).toBeGreaterThan(10)
  }
  expect(cases.some(({ expectedTool }) => expectedTool === "apply_design_change")).toBe(false)
  expect(cases.filter(({ expectedTool }) => expectedTool === null)).toHaveLength(3)
})
