import {
  handoffSchema,
  manufacturingRequestSchema,
  type QuoteResult,
} from "../../../src/manufacturing.js"

export const JLC_FALLBACK_URL = "https://jlcpcb.com/quote"

export function fallbackQuote(reason: string): QuoteResult {
  return {
    configured: false,
    provider: "JLCPCB",
    substitutions: [],
    warnings: [
      reason,
      "No provider price, shipping estimate, or design acceptance has been claimed.",
    ],
    fallbackUrl: JLC_FALLBACK_URL,
  }
}

export function parseQuoteRequest(source: string, actualBundleBytes: number) {
  const request = manufacturingRequestSchema.parse(JSON.parse(source))
  if (request.bundleBytes !== actualBundleBytes)
    throw new Error("Uploaded bundle size does not match.")
  return request
}

export function authorizeHandoff(source: unknown) {
  return handoffSchema.parse(source)
}
