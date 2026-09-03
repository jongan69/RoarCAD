import { z } from "zod"
import type { QuoteResult } from "../../../src/manufacturing.js"
import { readRequestJson, requestErrorResponse } from "../jlcpcb/shared.js"
import {
  errorsResponseSchema,
  layersResponseSchema,
  MACROFAB_FALLBACK_URL,
  macroFabApiKey,
  macroFabContract,
  macroFabErrorResponse,
  macroFabRequest,
  parseMacroFabQuote,
  quotePath,
  readinessResponseSchema,
  verifyMacroFabToken,
} from "./shared.js"

const statusRequestSchema = z.object({ quoteToken: z.string().min(80).max(8_000) })
const requiredLayers = [
  "board_outline",
  "top_soldermask",
  "top_copper",
  "bottom_copper",
  "bottom_soldermask",
  "drill",
]

const safeWarnings = (errors: Record<string, unknown> | undefined): string[] =>
  Object.entries(errors ?? {})
    .filter(([, value]) => Boolean(value))
    .slice(0, 8)
    .map(([name]) => `MacroFab flagged ${name.replaceAll("_", " ")}.`)

export async function POST(request: Request): Promise<Response> {
  try {
    const { quoteToken } = statusRequestSchema.parse(await readRequestJson(request, 10_000))
    const apiKey = macroFabApiKey()
    if (!apiKey)
      return Response.json({ error: "MacroFab credentials are not configured." }, { status: 503 })
    const payload = await verifyMacroFabToken(quoteToken, apiKey)
    const base = `/api/v3/pcb/${encodeURIComponent(payload.pcbId)}/${payload.pcbVersion}`
    const providerErrors = await macroFabContract(
      await macroFabRequest(`${base}/errors`, apiKey),
      errorsResponseSchema,
      "file errors",
    )
    if (providerErrors.errors.length) {
      return Response.json({
        configured: true,
        provider: "MacroFab",
        state: "rejected",
        substitutions: [],
        warnings: providerErrors.errors.map(
          ({ message }) => message || "MacroFab reported a file error.",
        ),
        fallbackUrl: MACROFAB_FALLBACK_URL,
        manifestHash: payload.manifestHash,
      } satisfies QuoteResult)
    }
    const layers = await macroFabContract(
      await macroFabRequest(
        `/api/v2/pcb/${encodeURIComponent(payload.pcbId)}/${payload.pcbVersion}/layers`,
        apiKey,
      ),
      layersResponseSchema,
      "layer processing",
    )
    const readyLayers = new Set(
      layers.pcb_layers
        .filter(({ files }) => files.some(({ state }) => state === "processed" || !state))
        .map(({ id }) => id),
    )
    if (!requiredLayers.every((layer) => readyLayers.has(layer))) {
      return Response.json(
        {
          configured: true,
          provider: "MacroFab",
          state: "processing",
          quoteToken,
          expiresAt: payload.expiresAt,
          retryAfterMs: 5_000,
          substitutions: [],
          warnings: ["MacroFab is still processing the uploaded fabrication layers."],
          fallbackUrl: MACROFAB_FALLBACK_URL,
          manifestHash: payload.manifestHash,
        } satisfies QuoteResult,
        { status: 202 },
      )
    }
    const readiness = await macroFabContract(
      await macroFabRequest(`${base}/ready/${payload.quantity}`, apiKey),
      readinessResponseSchema,
      "manufacturability",
    )
    if (!readiness.manufacturable.production) {
      return Response.json({
        configured: true,
        provider: "MacroFab",
        state: "rejected",
        substitutions: [],
        warnings: [
          "MacroFab did not mark this board manufacturable.",
          ...safeWarnings(readiness.errors),
        ],
        fallbackUrl: MACROFAB_FALLBACK_URL,
        manifestHash: payload.manifestHash,
      } satisfies QuoteResult)
    }
    const response = await macroFabRequest(quotePath(payload), apiKey)
    if (response.status === 404) {
      return Response.json(
        {
          configured: true,
          provider: "MacroFab",
          state: "processing",
          quoteToken,
          expiresAt: payload.expiresAt,
          retryAfterMs: 5_000,
          substitutions: [],
          warnings: ["MacroFab is still preparing the quote."],
          fallbackUrl: MACROFAB_FALLBACK_URL,
          manifestHash: payload.manifestHash,
        } satisfies QuoteResult,
        { status: 202 },
      )
    }
    if (!response.ok) throw new Error(`MacroFab quote request failed (HTTP ${response.status}).`)
    return Response.json(parseMacroFabQuote(await response.json(), payload))
  } catch (error) {
    return error instanceof Error && error.message.startsWith("MacroFab")
      ? macroFabErrorResponse(error)
      : requestErrorResponse(error)
  }
}

export default { fetch: POST }
