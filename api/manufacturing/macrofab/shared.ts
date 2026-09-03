import JSZip from "jszip"
import { z } from "zod"
import type { PreparedExport } from "../../../src/eda.js"
import type { macroFabConfigurationSchema, QuoteResult } from "../../../src/manufacturing.js"
import { hmacSha256Base64 } from "../jlcpcb/shared.js"

const API_BASE = "https://api.macrofab.com"
export const MACROFAB_FALLBACK_URL = "https://www.macrofab.com/"
const TOKEN_LIFETIME_MS = 15 * 60_000

const tokenPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  pcbId: z.string().regex(/^[a-z0-9]{6,32}$/i),
  pcbVersion: z.number().int().positive(),
  revisionId: z.string().min(1).max(128),
  manifestHash: z.string().regex(/^[a-f0-9]{64}$/),
  quantity: z.number().int().min(5).max(10_000),
  layers: z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(8)]),
  impedanceControl: z.boolean(),
  copperWeightOz: z.literal(1),
  solderMaskColor: z.literal("green"),
  silkscreenColor: z.literal("white"),
  manufacturing: z.literal("Standard"),
  workflowId: z.string().min(1).max(128),
  importRunId: z.string().uuid().optional(),
  expiresAt: z.string().datetime(),
})

export type MacroFabTokenPayload = z.infer<typeof tokenPayloadSchema>

const createResponseSchema = z.object({ pcb: z.object({ pcb_id: z.string().min(1) }) })
const projectResponseSchema = z.object({
  pcb: z.object({ current_version: z.number().int().positive() }),
})
const signResponseSchema = z.object({
  uri: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://")),
  form_fields: z.record(z.string()),
})
export const errorsResponseSchema = z.object({
  errors: z.array(z.object({ message: z.string().optional() }).passthrough()),
})

const ingestionFileSchema = z.object({
  filename: z.string().min(1).max(200),
  file_type: z.enum(["gerber", "excellon", "unknown"]),
  source: z.string().min(1).max(80),
  layer_name: z.string().nullable().optional(),
})
const ingestionFilesSchema = z.array(ingestionFileSchema)

export const workflowResponseSchema = z.object({
  current_stage: z.string(),
  process_percentage: z.number().min(0).max(100),
  failure_reason: z.string().nullable().optional(),
  errors: z.array(z.unknown()).optional(),
  tasks: z.array(
    z.object({
      task_type: z.string(),
      status: z.string(),
      errors: z.array(z.unknown()).nullable().optional(),
      result: z
        .object({ files: z.array(z.unknown()) })
        .passthrough()
        .nullable()
        .optional(),
    }),
  ),
})

const workflowStartResponseSchema = z.object({
  id: z.string().min(1).max(128),
})

export const ingestionAcceptResponseSchema = z.object({ run_id: z.string().uuid() })

export const importStatusResponseSchema = z.object({
  current_stage: z.string(),
  process_percentage: z.number().min(0).max(100),
  failure_reason: z.string().nullable().optional(),
  errors: z.array(z.unknown()).optional(),
})

export const processedFilesResponseSchema = z.array(
  z.object({
    basename: z.string(),
    state: z.string(),
    metadata: z
      .object({
        "file-type": z.string().optional(),
        "pcb-layer": z.string().optional(),
      })
      .passthrough()
      .optional(),
  }),
)

const quoteResponseSchema = z
  .object({
    quote: z
      .object({
        pcb_id: z.string(),
        pcb_version: z.number().int().positive(),
        quantity: z.number().int().positive(),
        region: z.literal("us"),
        tier: z.string(),
        lead_time: z.object({ business_days: z.number().int().nonnegative() }).passthrough(),
        panel: z
          .object({ base_pcb: z.object({ manufacturable: z.boolean() }).passthrough() })
          .passthrough(),
        specifications: z
          .object({
            layer_count: z.number().int(),
            impedance_control: z.boolean(),
            outer_copper_weight: z.number(),
            soldermask_color: z.string(),
            silkscreen_color: z.string(),
            manufacturing_type: z.string(),
            surface_finish: z.string(),
            thickness: z.number(),
          })
          .passthrough(),
        totals: z
          .object({
            total: z
              .object({
                total_price: z.number().finite().nonnegative(),
                unit_price: z.number().finite().nonnegative(),
              })
              .strict(),
          })
          .passthrough(),
        valid: z.boolean(),
        invalid_reasons: z.record(z.unknown()),
        warnings: z.array(z.string()),
      })
      .passthrough(),
  })
  .passthrough()

const gerberNames: Record<string, string> = {
  F_Cu: "roarcad.gtl",
  F_SilkScreen: "roarcad.gto",
  F_Mask: "roarcad.gts",
  F_Paste: "roarcad.gtp",
  B_Cu: "roarcad.gbl",
  B_SilkScreen: "roarcad.gbo",
  B_Mask: "roarcad.gbs",
  B_Paste: "roarcad.gbp",
  Edge_Cuts: "roarcad.bor",
  "plated.drl": "roarcad-PTH.drl",
  "unplated.drl": "roarcad-NPTH.drl",
}

const expectedLayers: Record<string, string> = {
  "roarcad.gtl": "top_copper",
  "roarcad.gto": "top_silkscreen",
  "roarcad.gts": "top_soldermask",
  "roarcad.gtp": "top_paste",
  "roarcad.gbl": "bottom_copper",
  "roarcad.gbo": "bottom_silkscreen",
  "roarcad.gbs": "bottom_soldermask",
  "roarcad.gbp": "bottom_paste",
  "roarcad.bor": "board_outline",
  "roarcad-PTH.drl": "drill",
  "roarcad-NPTH.drl": "drill",
}

export const macroFabUploadNames = Object.values(gerberNames)

const toBase64Url = (value: string) =>
  btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")

const fromBase64Url = (value: string) =>
  atob(
    value
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "="),
  )

const tokenSignature = async (value: string, secret: string) =>
  (await hmacSha256Base64(secret, value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")

export function macroFabApiKey(environment: NodeJS.ProcessEnv = process.env): string | null {
  return environment.MACROFAB_API_KEY?.trim() || null
}

export async function issueMacroFabToken(
  payload: Omit<MacroFabTokenPayload, "schemaVersion" | "expiresAt">,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const encoded = toBase64Url(
    JSON.stringify({
      schemaVersion: 1,
      ...payload,
      expiresAt: new Date(now + TOKEN_LIFETIME_MS).toISOString(),
    }),
  )
  return `${encoded}.${await tokenSignature(encoded, secret)}`
}

export async function verifyMacroFabToken(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<MacroFabTokenPayload> {
  const [encoded, signature, extra] = token.split(".")
  if (!encoded || !signature || extra) throw new Error("Invalid MacroFab quote token.")
  const expected = await tokenSignature(encoded, secret)
  if (signature.length !== expected.length) throw new Error("Invalid MacroFab quote token.")
  let mismatch = 0
  for (let index = 0; index < signature.length; index += 1)
    mismatch |= signature.charCodeAt(index) ^ expected.charCodeAt(index)
  if (mismatch) throw new Error("Invalid MacroFab quote token.")
  let source: unknown
  try {
    source = JSON.parse(fromBase64Url(encoded))
  } catch {
    throw new Error("Invalid MacroFab quote token.")
  }
  const payload = tokenPayloadSchema.parse(source)
  if (Date.parse(payload.expiresAt) <= now) throw new Error("MacroFab quote token has expired.")
  return payload
}

export async function macroFabRequest(
  path: string,
  apiKey: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (!path.startsWith("/api/") || path.includes("..")) throw new Error("Invalid MacroFab path.")
  const url = new URL(path, API_BASE)
  url.searchParams.set("apikey", apiKey)
  try {
    return await fetcher(url, {
      ...init,
      headers: { accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error("MacroFab did not respond in time.")
  }
}

async function providerJson(response: Response, message: string): Promise<unknown> {
  if (response.status === 401 || response.status === 403)
    throw new Error("MacroFab authentication failed.")
  if (!response.ok) throw new Error(`${message} (HTTP ${response.status}).`)
  try {
    return await response.json()
  } catch {
    throw new Error(`${message}: MacroFab returned invalid JSON.`)
  }
}

export async function macroFabContract<T>(
  response: Response,
  schema: z.ZodType<T>,
  label: string,
): Promise<T> {
  const parsed = schema.safeParse(await providerJson(response, `MacroFab ${label} request failed`))
  if (!parsed.success) throw new Error(`MacroFab returned an unsupported ${label} format.`)
  return parsed.data
}

export function macroFabErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "MacroFab request failed."
  if (!message.startsWith("MacroFab")) return Response.json({ error: message }, { status: 400 })
  return Response.json(
    { error: message },
    { status: message.includes("did not respond in time") ? 504 : 502 },
  )
}

export async function createMacroFabProject(
  name: string,
  manifestHash: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<{ pcbId: string; pcbVersion: number }> {
  const created = await macroFabContract(
    await macroFabRequest(
      "/api/v2/pcbs",
      apiKey,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pcb: { name: `RoarCAD ${name}`.slice(0, 100), short: manifestHash.slice(0, 16) },
        }),
      },
      fetcher,
    ),
    createResponseSchema,
    "project creation",
  )
  const pcbId = created.pcb.pcb_id
  const project = await macroFabContract(
    await macroFabRequest(`/api/v2/pcb/${encodeURIComponent(pcbId)}`, apiKey, {}, fetcher),
    projectResponseSchema,
    "project",
  )
  return { pcbId, pcbVersion: project.pcb.current_version }
}

export async function uploadMacroFabGerbers(
  prepared: PreparedExport,
  pcbId: string,
  pcbVersion: number,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const archive = prepared.files["gerbers.zip"]
  if (!archive || archive.byteLength > 5_000_000)
    throw new Error("Generated Gerbers are missing or too large.")
  const zip = await JSZip.loadAsync(archive)
  for (const [sourceName, targetName] of Object.entries(gerberNames)) {
    const entry = zip.file(sourceName)
    if (!entry) throw new Error(`Generated Gerber file is missing: ${sourceName}.`)
    const bytes = await entry.async("uint8array")
    const params = new URLSearchParams({
      filename: targetName,
      upload_type: "pcb",
      pcb_id: pcbId,
      pcb_revision: `${pcbVersion}`,
      pending_files_enabled: "false",
      macrofab_only: "false",
    })
    const signed = await macroFabContract(
      await macroFabRequest(`/api/v2/sign_s3_upload?${params}`, apiKey, {}, fetcher),
      signResponseSchema,
      "upload authorization",
    )
    const form = new FormData()
    for (const [field, value] of Object.entries(signed.form_fields)) form.append(field, value)
    const uploadBytes = new Uint8Array(bytes.byteLength)
    uploadBytes.set(bytes)
    form.append("file", new Blob([uploadBytes.buffer]), targetName)
    let uploaded: Response
    try {
      uploaded = await fetcher(signed.uri, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30_000),
      })
    } catch {
      throw new Error("MacroFab file upload did not respond in time.")
    }
    if (!uploaded.ok) throw new Error(`MacroFab file upload failed (HTTP ${uploaded.status}).`)
  }
}

export async function startMacroFabIngestion(
  pcbId: string,
  pcbVersion: number,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const workflow = await macroFabContract(
    await macroFabRequest(
      `/api/v3/pcb/${encodeURIComponent(pcbId)}/${pcbVersion}/ingestion/workflow`,
      apiKey,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ files: macroFabUploadNames }),
      },
      fetcher,
    ),
    workflowStartResponseSchema,
    "file processing",
  )
  return workflow.id
}

export function acceptedMacroFabFiles(workflow: z.infer<typeof workflowResponseSchema>) {
  const task = workflow.tasks.find(({ task_type }) => task_type === "processing_gerbers")
  if (task?.status !== "completed" || task.errors?.length || !task.result)
    throw new Error("MacroFab could not process the uploaded fabrication files.")
  const files = ingestionFilesSchema.safeParse(task.result.files)
  if (!files.success) throw new Error("MacroFab returned unsupported processed fabrication files.")
  return macroFabUploadNames.map((filename) => {
    const file = files.data.find((candidate) => candidate.filename === filename)
    const expectedLayer = expectedLayers[filename]
    const expectedType = filename.endsWith(".drl") ? "excellon" : "gerber"
    if (
      !file ||
      file.file_type !== expectedType ||
      (expectedType === "gerber" && file.layer_name !== expectedLayer)
    ) {
      throw new Error(`MacroFab did not recognize ${filename} correctly.`)
    }
    return {
      filename: file.filename,
      file_type: file.file_type,
      source: file.source,
      ...(file.file_type === "gerber" ? { layer_name: file.layer_name } : {}),
    }
  })
}

export function macroFabFilesProcessed(
  files: z.infer<typeof processedFilesResponseSchema>,
): boolean {
  return macroFabUploadNames.every((filename) =>
    files.some(({ basename, state }) => basename === filename && state === "processed"),
  )
}

export function macroFabFallback(reason: string, manifestHash?: string): QuoteResult {
  return {
    configured: false,
    provider: "MacroFab",
    state: "fallback",
    substitutions: [],
    warnings: [reason, "No provider price, shipping, tax, or manufacturing acceptance is claimed."],
    fallbackUrl: MACROFAB_FALLBACK_URL,
    manifestHash,
  }
}

export function quotePath(payload: MacroFabTokenPayload): string {
  return `/api/v4/quote/pcb/${encodeURIComponent(payload.pcbId)}/${payload.pcbVersion}/${payload.quantity}`
}

export function parseMacroFabQuote(source: unknown, payload: MacroFabTokenPayload): QuoteResult {
  const parsed = quoteResponseSchema.safeParse(source)
  if (!parsed.success) throw new Error("MacroFab returned an unsupported quote format.")
  const quote = parsed.data.quote
  const specifications = quote.specifications
  if (
    quote.pcb_id !== payload.pcbId ||
    quote.pcb_version !== payload.pcbVersion ||
    quote.quantity !== payload.quantity ||
    specifications.layer_count !== payload.layers ||
    specifications.impedance_control !== payload.impedanceControl ||
    specifications.outer_copper_weight !== payload.copperWeightOz ||
    specifications.soldermask_color !== payload.solderMaskColor ||
    specifications.silkscreen_color !== payload.silkscreenColor ||
    specifications.manufacturing_type !== payload.manufacturing ||
    specifications.surface_finish !== "enig" ||
    specifications.thickness !== 1.6
  ) {
    throw new Error("MacroFab returned a quote for unsupported specifications.")
  }
  if (!quote.valid || !quote.panel.base_pcb.manufacturable) {
    return {
      configured: true,
      provider: "MacroFab",
      state: "rejected",
      substitutions: [],
      warnings: [
        "MacroFab did not mark this bare PCB quote valid and manufacturable.",
        ...Object.keys(quote.invalid_reasons).map(
          (reason) => `MacroFab flagged ${reason.replaceAll("_", " ")}.`,
        ),
      ],
      fallbackUrl: MACROFAB_FALLBACK_URL,
      manifestHash: payload.manifestHash,
    }
  }
  return {
    configured: true,
    provider: "MacroFab",
    state: "quoted",
    quoteId: `${payload.pcbId}:${payload.pcbVersion}`,
    price: {
      amount: quote.totals.total.total_price.toFixed(2),
      currency: "USD",
    },
    leadTime: `${quote.lead_time.business_days} business days`,
    quotedAt: new Date().toISOString(),
    substitutions: [],
    warnings: [
      ...quote.warnings,
      "This is MacroFab's complete returned project total; RoarCAD did not recalculate or remove provider fees.",
      "Currency is USD under MacroFab's published Manufacturing Services Agreement; its quote API omits the currency field.",
      "Shipping is unavailable.",
      "Tax is unavailable.",
      "This informational quote does not prove electrical function or final manufacturing acceptance.",
    ],
    fallbackUrl: MACROFAB_FALLBACK_URL,
    manifestHash: payload.manifestHash,
  }
}

export function macroFabConfiguration(input: z.infer<typeof macroFabConfigurationSchema>): {
  layers: 2 | 4 | 6 | 8
} {
  if (input.layers !== 2)
    throw new Error("MacroFab quoting is currently verified only for two-layer boards.")
  if (input.thicknessMm !== 1.6 || input.finish !== "ENIG")
    throw new Error("MacroFab quoting is verified only for 1.6 mm ENIG boards.")
  return { layers: input.layers as 2 | 4 | 6 | 8 }
}
