import { z } from "zod"
import { type BoardProject, boardProjectSchema } from "./domain"

export const MAX_PROJECT_BYTES = 2_000_000

export const manufacturingConfigurationSchema = z.object({
  mode: z.enum(["bare-pcb", "pcba"]),
  quantity: z.number().int().min(5).max(10_000),
  layers: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(6),
    z.literal(8),
    z.literal(10),
  ]),
  thicknessMm: z.union([
    z.literal(0.8),
    z.literal(1),
    z.literal(1.2),
    z.literal(1.6),
    z.literal(2),
  ]),
  finish: z.enum(["HASL-lead-free", "ENIG"]),
})

export const manufacturingRequestSchema = z.object({
  project: boardProjectSchema,
  revisionId: z.string().min(1),
  configuration: manufacturingConfigurationSchema,
})

export const macroFabConfigurationSchema = manufacturingConfigurationSchema.extend({
  copperWeightOz: z.literal(1),
  solderMaskColor: z.literal("green"),
  silkscreenColor: z.literal("white"),
  manufacturing: z.literal("Standard"),
})

export const macroFabRequestSchema = manufacturingRequestSchema.extend({
  configuration: macroFabConfigurationSchema,
})

export type ManufacturingConfiguration = z.infer<typeof manufacturingConfigurationSchema>
export type ManufacturingRequest = z.infer<typeof manufacturingRequestSchema>

export type QuoteResult = {
  configured: boolean
  provider: "JLCPCB" | "MacroFab"
  state: "processing" | "quoted" | "rejected" | "fallback"
  quoteId?: string
  quoteToken?: string
  expiresAt?: string
  price?: { amount: string; currency: string }
  shipping?: { amount: string; currency: string }
  tax?: { amount: string; currency: string }
  orderUrl?: string
  leadTime?: string
  quotedAt?: string
  retryAfterMs?: number
  substitutions: string[]
  warnings: string[]
  fallbackUrl: string
  manifestHash?: string
}

export const handoffSchema = z.object({
  quoteToken: z.string().min(80).max(8_000),
  confirmed: z.literal(true),
})

export async function parseProviderResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.text()
  if (response.status === 429)
    throw new Error("Too many manufacturing requests. Wait a minute and try again.")
  let result: T & { error?: string }
  try {
    result = JSON.parse(body) as T & { error?: string }
  } catch {
    throw new Error(`${fallback} (HTTP ${response.status}).`)
  }
  if (!response.ok) throw new Error(result.error ?? `${fallback} (HTTP ${response.status}).`)
  return result
}

export async function requestJlcQuote(
  project: BoardProject,
  configuration: ManufacturingConfiguration,
): Promise<QuoteResult> {
  const payload = manufacturingRequestSchema.parse({
    project,
    revisionId: project.currentRevisionId,
    configuration,
  })
  const body = JSON.stringify(payload)
  if (new TextEncoder().encode(body).byteLength > MAX_PROJECT_BYTES) {
    throw new Error("Project exceeds the manufacturing request limit.")
  }
  const response = await fetch("/api/manufacturing/jlcpcb/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  })
  return parseProviderResponse<QuoteResult>(response, "JLCPCB quote request failed")
}

export async function requestMacroFabQuote(
  project: BoardProject,
  configuration: ManufacturingConfiguration,
): Promise<QuoteResult> {
  const payload = macroFabRequestSchema.parse({
    project,
    revisionId: project.currentRevisionId,
    configuration: {
      ...configuration,
      copperWeightOz: 1,
      solderMaskColor: "green",
      silkscreenColor: "white",
      manufacturing: "Standard",
    },
  })
  const body = JSON.stringify(payload)
  if (new TextEncoder().encode(body).byteLength > MAX_PROJECT_BYTES) {
    throw new Error("Project exceeds the manufacturing request limit.")
  }
  const response = await fetch("/api/manufacturing/macrofab/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  })
  return parseProviderResponse<QuoteResult>(response, "MacroFab quote request failed")
}

export async function requestMacroFabStatus(quoteToken: string): Promise<QuoteResult> {
  const response = await fetch("/api/manufacturing/macrofab/status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ quoteToken }),
  })
  return parseProviderResponse<QuoteResult>(response, "MacroFab quote status failed")
}

export async function requestJlcHandoff(input: z.input<typeof handoffSchema>): Promise<{
  checkoutUrl?: string
  warnings: string[]
  fallbackUrl: string
}> {
  const parsed = handoffSchema.parse(input)
  const response = await fetch("/api/manufacturing/jlcpcb/handoff", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parsed),
  })
  return parseProviderResponse<{
    error?: string
    checkoutUrl?: string
    warnings: string[]
    fallbackUrl: string
  }>(response, "JLCPCB handoff failed")
}
