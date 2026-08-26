import { expect, test } from "bun:test"
import { boardGraphSchema, type DesignChange, indicatorSnapshot } from "../src/domain"
import { registerWebMcpTools } from "../src/webmcp"

type RegisteredTool = {
  name: string
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }
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
    getTools() {
      return Promise.resolve([...tools.values()])
    },
    executeTool(tool: RegisteredTool, input: string) {
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
    request: "move D1",
    summary: "Move D1",
    evidenceIds: [],
    operations: [{ type: "move-component", reference: "D1", x: 3, y: 2, rotation: 0, side: "top" }],
    candidateHash: "a".repeat(64),
    readinessBefore: "fabrication-ready",
    readinessAfter: "fabrication-ready",
  }
  const cleanup = registerWebMcpTools({
    draft: async () => ({ status: "drafted" }),
    inspect: async () => ({ status: "inspected" }),
    preview: async () => change,
    apply: async () => ({ status: "applied" }),
    prepare: async () => ({ status: "prepared", humanDownloadRequired: true }),
  })
  await Promise.resolve()

  expect([...tools.keys()].sort()).toEqual([
    "apply_design_change",
    "draft_board",
    "inspect_design",
    "preview_design_change",
    "validate_and_export",
  ])
  expect(tools.get("inspect_design")?.annotations?.readOnlyHint).toBe(true)
  expect(tools.get("inspect_design")?.annotations?.untrustedContentHint).toBe(true)
  const tool = (name: string) => {
    const registered = tools.get(name)
    if (!registered) throw new Error(`Tool not found: ${name}`)
    return registered
  }
  await context.executeTool(
    tool("draft_board"),
    JSON.stringify({
      requirements: "green LED",
      design: boardGraphSchema.parse(indicatorSnapshot.design),
    }),
  )
  await context.executeTool(
    tool("inspect_design"),
    JSON.stringify({ revisionId: "revision-1", query: "risks" }),
  )
  await context.executeTool(
    tool("preview_design_change"),
    JSON.stringify({
      revisionId: "revision-1",
      request: "move D1",
      operations: [
        { type: "move-component", reference: "D1", x: 3, y: 2, rotation: 0, side: "top" },
      ],
    }),
  )
  await context.executeTool(
    tool("apply_design_change"),
    JSON.stringify({ revisionId: "revision-1", changeId: "change-1" }),
  )
  await context.executeTool(
    tool("validate_and_export"),
    JSON.stringify({
      revisionId: "revision-1",
      targets: ["gerber"],
      artifactClass: "fabrication",
    }),
  )
  cleanup()
  await Promise.resolve()
  expect(tools.size).toBe(0)
})

test("registration is idempotent when Chrome cannot unregister tools", async () => {
  const tools = new Map<string, RegisteredTool>()
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      modelContext: {
        registerTool(tool: RegisteredTool) {
          if (tools.has(tool.name))
            throw new DOMException("Duplicate tool name", "InvalidStateError")
          tools.set(tool.name, tool)
        },
        getTools: () => Promise.resolve([...tools.values()]),
      },
    },
  })
  const actions = {
    draft: async () => ({}),
    inspect: async () => ({}),
    preview: async () => ({}) as DesignChange,
    apply: async () => ({}),
    prepare: async () => ({}),
  }
  registerWebMcpTools(actions)
  await Promise.resolve()
  registerWebMcpTools(actions)
  await Promise.resolve()
  expect(tools.size).toBe(5)
})
