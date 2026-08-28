import { expect, test } from "bun:test"
import {
  type BoardProject,
  boardGraphSchema,
  createDraftSnapshot,
  createProject,
  currentRevision,
  type DesignChange,
  indicatorSnapshot,
  previewChange,
  validateSnapshot,
} from "../src/domain"
import { prepareExport } from "../src/eda"
import { environmentMonitorGraph, environmentMonitorRequirements } from "../src/samples"
import { registerWebMcpTools } from "../src/webmcp"

type RegisteredTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }
  execute(input: unknown): Promise<{ content: Array<{ type: "text"; text: string }> }>
}

test("registers four bounded tools and keeps approval human-only", async () => {
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
    prepare: async () => ({ status: "prepared", humanDownloadRequired: true }),
  })
  await Promise.resolve()

  expect([...tools.keys()].sort()).toEqual([
    "draft_board",
    "inspect_design",
    "preview_design_change",
    "validate_and_export",
  ])
  expect(tools.get("inspect_design")?.annotations?.readOnlyHint).toBe(true)
  expect(tools.get("inspect_design")?.annotations?.untrustedContentHint).toBe(true)
  const draftTool = tools.get("draft_board")
  if (!draftTool) throw new Error("draft_board was not registered.")
  const draftProperties = draftTool.inputSchema.properties as Record<string, unknown>
  const designSchema = draftProperties.design as Record<string, unknown>
  expect(designSchema.properties).toBeDefined()
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
    JSON.stringify({ revisionId: "revision-1", focus: "risks" }),
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

test("executes the agent journey without applying the preview", async () => {
  const tools = new Map<string, RegisteredTool>()
  const context = {
    registerTool(tool: RegisteredTool) {
      tools.set(tool.name, tool)
    },
    unregisterTool(name: string) {
      tools.delete(name)
    },
    getTools: () => Promise.resolve([...tools.values()]),
    executeTool(tool: RegisteredTool, input: string) {
      return tool.execute(JSON.parse(input))
    },
  }
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { modelContext: context },
  })
  let project: BoardProject | null = null
  let pending: DesignChange | null = null
  const requireProject = (): BoardProject => {
    if (!project) throw new Error("Project not found.")
    return project
  }
  registerWebMcpTools({
    draft: async (requirements, design) => {
      project = await createProject(
        "webmcp-custom",
        "WebMCP custom board",
        createDraftSnapshot(requirements, design),
      )
      return { revisionId: project.currentRevisionId }
    },
    inspect: async (revisionId, focus) => {
      const revision = project?.revisions.find(({ id }) => id === revisionId)
      if (!revision) throw new Error("Revision not found.")
      return { focus, validation: validateSnapshot(revision.snapshot) }
    },
    preview: async (revisionId, request, operations) => {
      pending = await previewChange(requireProject(), revisionId, request, operations)
      return pending
    },
    prepare: async (revisionId, _targets, artifactClass) => {
      const current = requireProject()
      if (current.currentRevisionId !== revisionId) throw new Error("Revision mismatch.")
      const prepared = await prepareExport(current, artifactClass)
      return { manifestHash: prepared.manifestHash, readiness: prepared.validation.readiness }
    },
  })
  await Promise.resolve()
  const execute = async (name: string, input: unknown) => {
    const tool = tools.get(name)
    if (!tool) throw new Error(`Tool not found: ${name}`)
    return context.executeTool(tool, JSON.stringify(input))
  }

  await execute("draft_board", {
    requirements: environmentMonitorRequirements,
    design: environmentMonitorGraph,
  })
  const draftedRevision = currentRevision(requireProject()).id
  await execute("inspect_design", { revisionId: draftedRevision, focus: "validation" })
  const previewResult = await execute("preview_design_change", {
    revisionId: draftedRevision,
    request: "Move U1 for airflow",
    operations: [{ type: "move-component", reference: "U1", x: 3, y: 1, rotation: 0, side: "top" }],
  })
  const previewText = JSON.parse(previewResult.content[0].text) as {
    changeId: string
    operationCount: number
    waitingForHumanApproval: boolean
  }
  expect(previewText.changeId).toMatch(/^[a-f0-9]{16}$/)
  expect(previewText.operationCount).toBe(1)
  expect(previewText.waitingForHumanApproval).toBe(true)
  await execute("validate_and_export", {
    revisionId: draftedRevision,
    targets: ["circuit-json", "gerber", "bom", "placement", "validation", "project", "manifest"],
    artifactClass: "engineering",
  })
  expect(requireProject().revisions).toHaveLength(1)
}, 15_000)

test("keeps descriptions and every tool output within Chrome budgets", async () => {
  const tools = new Map<string, RegisteredTool>()
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      modelContext: {
        registerTool(tool: RegisteredTool) {
          tools.set(tool.name, tool)
        },
        getTools: () => Promise.resolve([...tools.values()]),
      },
    },
  })
  registerWebMcpTools({
    draft: async () => ({ message: "x".repeat(2_000) }),
    inspect: async () => ({ message: "x".repeat(2_000) }),
    preview: async () => ({
      id: "change-1",
      baseRevisionId: "revision-1",
      request: "Move D1",
      summary: "Move D1",
      evidenceIds: [],
      operations: [
        { type: "move-component", reference: "D1", x: 3, y: 2, rotation: 0, side: "top" },
      ],
      candidateHash: "a".repeat(64),
      readinessBefore: "engineering",
      readinessAfter: "engineering",
    }),
    prepare: async () => ({ message: "x".repeat(2_000) }),
  })
  await Promise.resolve()

  for (const tool of tools.values()) expect(tool.description.length).toBeLessThanOrEqual(500)
  const inspect = tools.get("inspect_design")
  if (!inspect) throw new Error("inspect_design was not registered.")
  await expect(inspect.execute({ revisionId: "revision-1", focus: "overview" })).rejects.toThrow(
    "1,500",
  )
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
    prepare: async () => ({}),
  }
  registerWebMcpTools(actions)
  await Promise.resolve()
  registerWebMcpTools(actions)
  await Promise.resolve()
  expect(tools.size).toBe(4)
})
