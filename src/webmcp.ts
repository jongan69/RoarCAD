import { z } from "zod"
import type { DesignChange } from "./domain"

type ToolResult = { content: Array<{ type: "text"; text: string }> }
type Tool = {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean }
  execute: (input: unknown) => Promise<ToolResult>
}

declare global {
  interface Document {
    modelContext?: {
      registerTool(tool: Tool): void
      unregisterTool?(name: string): void
      executeTool?(name: string, input: string): Promise<ToolResult>
    }
  }
}

const draftInput = z.object({ requirements: z.string().min(1).max(5_000) })
const inspectInput = z.object({ revisionId: z.string(), query: z.string().min(1).max(1_000) })
const previewInput = z.object({ revisionId: z.string(), request: z.string().min(1).max(500) })
const applyInput = z.object({ revisionId: z.string(), changeId: z.string() })
const exportInput = z.object({
  revisionId: z.string(),
  targets: z
    .array(z.enum(["gerber", "bom", "placement", "validation"]))
    .min(1)
    .max(4),
})

export type WebMcpActions = {
  draft(requirements: string): Promise<unknown>
  inspect(revisionId: string, query: string): Promise<unknown>
  preview(revisionId: string, request: string): Promise<DesignChange>
  apply(revisionId: string, changeId: string): Promise<unknown>
  prepare(revisionId: string, targets: string[]): Promise<unknown>
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
      description: "Create a board draft or a blocked requirements report from user requirements.",
      inputSchema: objectSchema({ requirements: { type: "string", maxLength: 5000 } }, [
        "requirements",
      ]),
      execute: async (input) => text(await actions.draft(draftInput.parse(input).requirements)),
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
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const parsed = inspectInput.parse(input)
        return text(await actions.inspect(parsed.revisionId, parsed.query))
      },
    },
    {
      name: "preview_design_change",
      title: "Preview design change",
      description: "Create a non-mutating, evidence-linked design diff for human review.",
      inputSchema: objectSchema(
        { revisionId: { type: "string" }, request: { type: "string", maxLength: 500 } },
        ["revisionId", "request"],
      ),
      execute: async (input) => {
        const parsed = previewInput.parse(input)
        return text(await actions.preview(parsed.revisionId, parsed.request))
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
            maxItems: 4,
            items: { enum: ["gerber", "bom", "placement", "validation"] },
          },
        },
        ["revisionId", "targets"],
      ),
      execute: async (input) => {
        const parsed = exportInput.parse(input)
        return text(await actions.prepare(parsed.revisionId, parsed.targets))
      },
    },
  ]
  for (const tool of tools) context.registerTool(tool)
  return () => {
    for (const tool of tools) context.unregisterTool?.(tool.name)
  }
}
