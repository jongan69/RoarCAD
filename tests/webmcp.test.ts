import { expect, test } from "bun:test"
import type { DesignChange } from "../src/domain"
import { registerWebMcpTools } from "../src/webmcp"

type RegisteredTool = {
  name: string
  annotations?: { readOnlyHint?: boolean }
  execute(input: unknown): Promise<unknown>
}

test("registers and directly executes exactly five page tools", async () => {
  const tools = new Map<string, RegisteredTool>()
  const context = {
    registerTool(tool: RegisteredTool) {
      tools.set(tool.name, tool)
    },
    unregisterTool(name: string) {
      tools.delete(name)
    },
    executeTool(name: string, input: string) {
      const tool = tools.get(name)
      if (!tool) throw new Error("Tool not found")
      return tool.execute(JSON.parse(input))
    },
  }
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { modelContext: context },
  })
  const change: DesignChange = {
    id: "change-1",
    baseRevisionId: "revision-1",
    request: "move D1 to 3, 2",
    summary: "Move D1",
    evidenceIds: [],
    operation: { type: "move-component", reference: "D1", x: 3, y: 2 },
  }
  const cleanup = registerWebMcpTools({
    draft: async () => ({ status: "drafted" }),
    inspect: async () => ({ status: "inspected" }),
    preview: async () => change,
    apply: async () => ({ status: "applied" }),
    prepare: async () => ({ status: "prepared", humanDownloadRequired: true }),
  })

  expect([...tools.keys()].sort()).toEqual([
    "apply_design_change",
    "draft_board",
    "inspect_design",
    "preview_design_change",
    "validate_and_export",
  ])
  expect(tools.get("inspect_design")?.annotations?.readOnlyHint).toBe(true)
  await context.executeTool("draft_board", JSON.stringify({ requirements: "green LED" }))
  await context.executeTool(
    "inspect_design",
    JSON.stringify({ revisionId: "revision-1", query: "risks" }),
  )
  await context.executeTool(
    "preview_design_change",
    JSON.stringify({ revisionId: "revision-1", request: "move D1 to 3, 2" }),
  )
  await context.executeTool(
    "apply_design_change",
    JSON.stringify({ revisionId: "revision-1", changeId: "change-1" }),
  )
  await context.executeTool(
    "validate_and_export",
    JSON.stringify({ revisionId: "revision-1", targets: ["gerber"] }),
  )
  cleanup()
  expect(tools.size).toBe(0)
})
