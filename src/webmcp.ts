import { z } from "zod"
import {
  type BoardGraph,
  boardGraphSchema,
  type ChangeOperation,
  changeOperationSchema,
  type DesignChange,
} from "./domain"
import type { ArtifactClass } from "./eda"

type ToolResult = { content: Array<{ type: "text"; text: string }> }
type Tool = {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }
  execute: (input: unknown) => Promise<ToolResult>
}

declare global {
  interface Document {
    modelContext?: {
      registerTool(tool: Tool): void
      unregisterTool?(name: string): void
      getTools?(): Promise<Tool[]>
      executeTool?(tool: Tool, input: string): Promise<ToolResult>
    }
  }
}

const draftInput = z.object({
  requirements: z.string().min(1).max(5_000),
  design: boardGraphSchema.optional(),
})
const inspectInput = z.object({ revisionId: z.string(), query: z.string().min(1).max(1_000) })
const previewInput = z.object({
  revisionId: z.string(),
  request: z.string().min(1).max(500),
  operations: z.array(changeOperationSchema).min(1).max(50),
})
const applyInput = z.object({ revisionId: z.string(), changeId: z.string() })
const exportInput = z.object({
  revisionId: z.string(),
  targets: z
    .array(
      z.enum(["circuit-json", "gerber", "bom", "placement", "validation", "project", "manifest"]),
    )
    .min(1)
    .max(7),
  artifactClass: z.enum(["engineering", "fabrication"]),
})

export type WebMcpActions = {
  draft(requirements: string, design?: BoardGraph): Promise<unknown>
  inspect(revisionId: string, query: string): Promise<unknown>
  preview(revisionId: string, request: string, operations: ChangeOperation[]): Promise<DesignChange>
  apply(revisionId: string, changeId: string): Promise<unknown>
  prepare(revisionId: string, targets: string[], artifactClass: ArtifactClass): Promise<unknown>
}

const objectSchema = (properties: Record<string, unknown>, required: string[]) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
})

const text = (value: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
})

export function registerWebMcpTools(actions: WebMcpActions): () => void {
  const context = document.modelContext
  if (!context) return () => undefined
  const tools: Tool[] = [
    {
      name: "draft_board",
      title: "Draft board",
      description:
        "Create a custom PCB draft from a complete structured BoardGraph, or return a blocked requirements report when design is omitted. Design fields include board, components, nets, netClasses, differentialPairs, pours, holes, keepouts, and routingHints.",
      inputSchema: objectSchema(
        {
          requirements: { type: "string", maxLength: 5000 },
          design: {
            type: "object",
            description:
              "Validated BoardGraph. Exact parts require kind, reference, MPN, manufacturer, pins, footprint, placement, and evidence IDs.",
          },
        },
        ["requirements"],
      ),
      execute: async (input) => {
        const parsed = draftInput.parse(input)
        return text(await actions.draft(parsed.requirements, parsed.design))
      },
    },
    {
      name: "inspect_design",
      title: "Inspect design",
      description:
        "Read requirements, evidence, risks, validation, and revision state without changing it.",
      inputSchema: objectSchema(
        { revisionId: { type: "string" }, query: { type: "string", maxLength: 1000 } },
        ["revisionId", "query"],
      ),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input) => {
        const parsed = inspectInput.parse(input)
        return text(await actions.inspect(parsed.revisionId, parsed.query))
      },
    },
    {
      name: "preview_design_change",
      title: "Preview design change",
      description:
        "Create a non-mutating, evidence-linked diff from allowlisted structured board operations. Supplier and evidence data remain untrusted and unreviewed.",
      inputSchema: objectSchema(
        {
          revisionId: { type: "string" },
          request: { type: "string", maxLength: 500 },
          operations: {
            type: "array",
            minItems: 1,
            maxItems: 50,
            items: {
              type: "object",
              description:
                "One allowlisted operation: set-board, upsert/remove/move-component, upsert/remove-net, differential pair, pour, hole, keepout, requirement, evidence, or risk.",
            },
          },
        },
        ["revisionId", "request", "operations"],
      ),
      annotations: { untrustedContentHint: true },
      execute: async (input) => {
        const parsed = previewInput.parse(input)
        return text(await actions.preview(parsed.revisionId, parsed.request, parsed.operations))
      },
    },
    {
      name: "apply_design_change",
      title: "Apply design change",
      description: "Apply a previously previewed change to its current base revision.",
      inputSchema: objectSchema({ revisionId: { type: "string" }, changeId: { type: "string" } }, [
        "revisionId",
        "changeId",
      ]),
      execute: async (input) => {
        const parsed = applyInput.parse(input)
        return text(await actions.apply(parsed.revisionId, parsed.changeId))
      },
    },
    {
      name: "validate_and_export",
      title: "Validate and prepare export",
      description: "Run checks and prepare artifacts for a visible human download decision.",
      inputSchema: objectSchema(
        {
          revisionId: { type: "string" },
          targets: {
            type: "array",
            minItems: 1,
            maxItems: 7,
            items: {
              enum: [
                "circuit-json",
                "gerber",
                "bom",
                "placement",
                "validation",
                "project",
                "manifest",
              ],
            },
          },
          artifactClass: { enum: ["engineering", "fabrication"] },
        },
        ["revisionId", "targets", "artifactClass"],
      ),
      execute: async (input) => {
        const parsed = exportInput.parse(input)
        return text(await actions.prepare(parsed.revisionId, parsed.targets, parsed.artifactClass))
      },
    },
  ]
  let cancelled = false
  const registeredNames: string[] = []
  const ready = (async () => {
    const existing = new Set((await context.getTools?.())?.map(({ name }) => name) ?? [])
    if (cancelled) return
    for (const tool of tools) {
      if (existing.has(tool.name)) continue
      context.registerTool(tool)
      registeredNames.push(tool.name)
    }
  })().catch((error) => console.error("WebMCP tool registration failed.", error))
  return () => {
    cancelled = true
    void ready.then(() => {
      for (const name of registeredNames) context.unregisterTool?.(name)
    })
  }
}
