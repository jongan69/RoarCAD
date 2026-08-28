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
export const INSPECT_FOCUSES = [
  "overview",
  "requirements",
  "components",
  "nets",
  "evidence",
  "risks",
  "validation",
  "history",
] as const
export const inspectFocusSchema = z.enum(INSPECT_FOCUSES)
export type InspectFocus = z.infer<typeof inspectFocusSchema>
const inspectInput = z.object({
  revisionId: z.string(),
  focus: inspectFocusSchema,
  ids: z.array(z.string().min(1).max(120)).max(20).optional(),
  cursor: z.number().int().min(0).optional(),
})
const previewInput = z.object({
  revisionId: z.string(),
  request: z.string().min(1).max(500),
  operations: z.array(changeOperationSchema).min(1).max(50),
})
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
  inspect(
    revisionId: string,
    focus: InspectFocus,
    ids?: string[],
    cursor?: number,
  ): Promise<unknown>
  preview(revisionId: string, request: string, operations: ChangeOperation[]): Promise<DesignChange>
  prepare(revisionId: string, targets: string[], artifactClass: ArtifactClass): Promise<unknown>
}

const objectSchema = (properties: Record<string, unknown>, required: string[]) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
})

const placementJsonSchema = objectSchema(
  {
    x: { type: "number", minimum: -500, maximum: 500 },
    y: { type: "number", minimum: -500, maximum: 500 },
    rotation: { type: "number", minimum: 0, maximum: 359 },
    side: { enum: ["top", "bottom"] },
  },
  ["x", "y"],
)

const footprintJsonSchema = objectSchema(
  {
    source: { enum: ["footprinter", "kicad-library", "jlcpcb", "pad-map"] },
    identifier: { type: "string", minLength: 1, maxLength: 240 },
    sha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
    pads: {
      type: "array",
      maxItems: 512,
      items: {
        type: "object",
        description:
          "Bounded embedded pad: pcb_smtpad or pcb_plated_hole with geometry and portHints.",
      },
    },
    reviewed: { type: "boolean", description: "Ignored for agent input; always stored false." },
  },
  ["source", "identifier", "pads"],
)

const componentJsonSchema = objectSchema(
  {
    kind: {
      enum: [
        "resistor",
        "capacitor",
        "inductor",
        "diode",
        "led",
        "transistor",
        "mosfet",
        "fuse",
        "crystal",
        "connector",
        "switch",
        "testpoint",
        "chip",
      ],
    },
    reference: { type: "string", pattern: "^[A-Z]+[0-9]+$" },
    mpn: { type: "string", minLength: 1, maxLength: 120 },
    manufacturer: { type: "string", minLength: 1, maxLength: 120 },
    value: { type: "string", maxLength: 80 },
    pins: {
      type: "array",
      minItems: 1,
      maxItems: 256,
      items: objectSchema(
        {
          number: { type: "string", minLength: 1, maxLength: 40 },
          label: { type: "string", minLength: 1, maxLength: 80 },
        },
        ["number", "label"],
      ),
    },
    footprint: footprintJsonSchema,
    placement: placementJsonSchema,
    reviewStatus: {
      enum: ["candidate", "reviewed"],
      description: "Ignored for agent input; always stored candidate.",
    },
    evidenceIds: { type: "array", minItems: 1, maxItems: 10, items: { type: "string" } },
    supplierPartIds: { type: "object", additionalProperties: { type: "string" } },
    doNotPlace: { type: "boolean" },
  },
  ["kind", "reference", "mpn", "manufacturer", "pins", "footprint", "placement", "evidenceIds"],
)

const boardJsonSchema = objectSchema(
  {
    outline: {
      oneOf: [
        objectSchema(
          {
            shape: { const: "rectangle" },
            widthMm: { type: "number", minimum: 5, maximum: 500 },
            heightMm: { type: "number", minimum: 5, maximum: 500 },
          },
          ["shape", "widthMm", "heightMm"],
        ),
        objectSchema(
          {
            shape: { const: "polygon" },
            points: {
              type: "array",
              minItems: 3,
              maxItems: 128,
              items: objectSchema({ x: { type: "number" }, y: { type: "number" } }, ["x", "y"]),
            },
          },
          ["shape", "points"],
        ),
      ],
    },
    layers: { enum: [1, 2, 4, 6, 8, 10] },
    material: { enum: ["fr4", "fr1", "flex"] },
    thicknessMm: { type: "number", minimum: 0.2, maximum: 8 },
    solderMaskColor: { enum: ["green", "red", "blue", "purple", "black", "white", "yellow"] },
    allowBlindAndBuriedVias: { type: "boolean" },
    doubleSidedAssembly: { type: "boolean" },
    stackup: { type: "array", maxItems: 10, items: { type: "string" } },
  },
  ["outline", "layers", "solderMaskColor"],
)

const boardGraphJsonSchema = objectSchema(
  {
    board: boardJsonSchema,
    components: { type: "array", minItems: 1, maxItems: 200, items: componentJsonSchema },
    nets: {
      type: "array",
      maxItems: 500,
      items: objectSchema(
        {
          name: { type: "string", minLength: 1, maxLength: 80 },
          members: { type: "array", minItems: 2, maxItems: 200, items: { type: "string" } },
          className: { type: "string" },
        },
        ["name", "members"],
      ),
    },
    netClasses: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: objectSchema(
        {
          name: { type: "string" },
          traceWidthMm: { type: "number", exclusiveMinimum: 0 },
          clearanceMm: { type: "number", minimum: 0 },
          targetImpedanceOhms: { type: "number", exclusiveMinimum: 0 },
        },
        ["name", "traceWidthMm", "clearanceMm"],
      ),
    },
    differentialPairs: { type: "array", maxItems: 100, items: { type: "object" } },
    pours: { type: "array", maxItems: 50, items: { type: "object" } },
    holes: { type: "array", maxItems: 100, items: { type: "object" } },
    keepouts: { type: "array", maxItems: 100, items: { type: "object" } },
    routingHints: { type: "array", maxItems: 200, items: { type: "string" } },
  },
  ["board", "components", "nets", "netClasses"],
)

const operationJsonSchema = {
  type: "object",
  required: ["type"],
  properties: {
    type: {
      enum: [
        "set-board",
        "upsert-component",
        "remove-component",
        "move-component",
        "upsert-net",
        "remove-net",
        "upsert-differential-pair",
        "remove-differential-pair",
        "upsert-pour",
        "remove-pour",
        "upsert-hole",
        "remove-hole",
        "upsert-keepout",
        "remove-keepout",
        "update-requirement",
        "upsert-evidence",
        "add-risk",
        "resolve-risk",
      ],
    },
    board: boardJsonSchema,
    component: componentJsonSchema,
    reference: { type: "string", pattern: "^[A-Z]+[0-9]+$" },
    x: { type: "number" },
    y: { type: "number" },
    rotation: { type: "number" },
    side: { enum: ["top", "bottom"] },
    net: { type: "object" },
    pair: { type: "object" },
    pour: { type: "object" },
    hole: { type: "object" },
    keepout: { type: "object" },
    requirement: { type: "object" },
    evidence: { type: "object" },
    name: { type: "string" },
    id: { type: "string" },
    risk: { type: "string", maxLength: 500 },
  },
} as const

const MAX_TOOL_OUTPUT_CHARACTERS = 1_500

const text = (value: unknown): ToolResult => {
  const output = JSON.stringify(value)
  if (output.length > MAX_TOOL_OUTPUT_CHARACTERS) {
    throw new Error("WebMCP tool output exceeds the 1,500 character budget.")
  }
  return { content: [{ type: "text", text: output }] }
}

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
            ...boardGraphJsonSchema,
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
        "Read one focused, paginated section of a board revision without changing project state.",
      inputSchema: objectSchema(
        {
          revisionId: { type: "string" },
          focus: {
            enum: INSPECT_FOCUSES,
          },
          ids: { type: "array", maxItems: 20, items: { type: "string", maxLength: 120 } },
          cursor: { type: "integer", minimum: 0 },
        },
        ["revisionId", "focus"],
      ),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input) => {
        const parsed = inspectInput.parse(input)
        return text(
          await actions.inspect(parsed.revisionId, parsed.focus, parsed.ids, parsed.cursor),
        )
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
            items: operationJsonSchema,
            description:
              "Allowlisted structured operations. Each operation is revalidated against its type-specific application schema.",
          },
        },
        ["revisionId", "request", "operations"],
      ),
      annotations: { untrustedContentHint: true },
      execute: async (input) => {
        const parsed = previewInput.parse(input)
        const change = await actions.preview(parsed.revisionId, parsed.request, parsed.operations)
        return text({
          changeId: change.id,
          candidateHash: change.candidateHash,
          readinessBefore: change.readinessBefore,
          readinessAfter: change.readinessAfter,
          operationCount: change.operations.length,
          waitingForHumanApproval: true,
        })
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
