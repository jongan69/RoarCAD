import { z } from "zod"

export const MAX_BUNDLE_BYTES = 4_000_000

export const manufacturingRequestSchema = z.object({
  mode: z.enum(["bare-pcb", "pcba"]),
  quantity: z.number().int().min(5).max(10_000),
  layers: z.literal(2),
  thicknessMm: z.union([z.literal(1), z.literal(1.2), z.literal(1.6), z.literal(2)]),
  finish: z.enum(["HASL-lead-free", "ENIG"]),
  manifestHash: z.string().regex(/^[a-f0-9]{64}$/),
  bundleBytes: z.number().int().positive().max(MAX_BUNDLE_BYTES),
})

export type ManufacturingRequest = z.infer<typeof manufacturingRequestSchema>

export type QuoteResult = {
  configured: boolean
  provider: "JLCPCB"
  quoteId?: string
  expiresAt?: string
  price?: { amount: string; currency: string }
  shipping?: { amount: string; currency: string }
  substitutions: string[]
  warnings: string[]
  fallbackUrl: string
}

export const handoffSchema = z.object({
  quoteId: z.string().min(1),
  manifestHash: z.string().regex(/^[a-f0-9]{64}$/),
  confirmed: z.literal(true),
})

export async function requestJlcQuote(
  request: ManufacturingRequest,
  bundle: Blob,
): Promise<QuoteResult> {
  const parsed = manufacturingRequestSchema.parse(request)
  if (bundle.size !== parsed.bundleBytes) throw new Error("Bundle size does not match the request.")
  const form = new FormData()
  form.set("request", JSON.stringify(parsed))
  form.set("bundle", bundle, "roarcad-manufacturing.zip")
  const response = await fetch("/api/manufacturing/jlcpcb/quote", { method: "POST", body: form })
  const result = (await response.json()) as QuoteResult & { error?: string }
  if (!response.ok) throw new Error(result.error ?? "JLCPCB quote request failed.")
  return result
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
  const result = (await response.json()) as {
    error?: string
    warnings: string[]
    fallbackUrl: string
  }
  if (!response.ok) throw new Error(result.error ?? "JLCPCB handoff failed.")
  return result
}
