import { prepareExport } from "../../../src/eda.js"
import {
  MAX_PROJECT_BYTES,
  macroFabRequestSchema,
  type QuoteResult,
} from "../../../src/manufacturing.js"
import { parseQuoteRequest, readRequestJson, requestErrorResponse } from "../jlcpcb/shared.js"
import {
  createMacroFabProject,
  issueMacroFabToken,
  macroFabApiKey,
  macroFabConfiguration,
  macroFabErrorResponse,
  macroFabFallback,
  startMacroFabIngestion,
  uploadMacroFabGerbers,
} from "./shared.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const source = await readRequestJson(request, MAX_PROJECT_BYTES)
    const macroFabRequest = macroFabRequestSchema.parse(source)
    const parsed = parseQuoteRequest(source)
    if (parsed.configuration.mode !== "bare-pcb") {
      return Response.json(
        { error: "MacroFab PCBA quoting is not implemented or verified." },
        { status: 422 },
      )
    }
    const configuration = macroFabConfiguration(macroFabRequest.configuration)
    const prepared = await prepareExport(parsed.project, "engineering")
    const apiKey = macroFabApiKey()
    if (!apiKey) {
      return Response.json(
        macroFabFallback("MacroFab credentials are not configured.", prepared.manifestHash),
        { status: 503 },
      )
    }
    const { pcbId, pcbVersion } = await createMacroFabProject(
      parsed.project.name,
      prepared.manifestHash,
      apiKey,
    )
    await uploadMacroFabGerbers(prepared, pcbId, pcbVersion, apiKey)
    const workflowId = await startMacroFabIngestion(pcbId, pcbVersion, apiKey)
    const revision = parsed.project.revisions.find(({ id }) => id === parsed.revisionId)
    const quoteToken = await issueMacroFabToken(
      {
        pcbId,
        pcbVersion,
        revisionId: parsed.revisionId,
        manifestHash: prepared.manifestHash,
        quantity: parsed.configuration.quantity,
        layers: configuration.layers,
        impedanceControl: Boolean(
          revision?.snapshot.design?.netClasses.some(
            ({ targetImpedanceOhms }) => targetImpedanceOhms,
          ),
        ),
        copperWeightOz: macroFabRequest.configuration.copperWeightOz,
        solderMaskColor: macroFabRequest.configuration.solderMaskColor,
        silkscreenColor: macroFabRequest.configuration.silkscreenColor,
        manufacturing: macroFabRequest.configuration.manufacturing,
        workflowId,
      },
      apiKey,
    )
    const result: QuoteResult = {
      configured: true,
      provider: "MacroFab",
      state: "processing",
      quoteToken,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      retryAfterMs: 5_000,
      substitutions: [],
      warnings: [
        "MacroFab is processing the generated Gerber and drill files.",
        "No price or manufacturing acceptance has been claimed yet.",
      ],
      fallbackUrl: "https://www.macrofab.com/",
      manifestHash: prepared.manifestHash,
    }
    return Response.json(result, { status: 202 })
  } catch (error) {
    return error instanceof Error && error.message.startsWith("MacroFab")
      ? macroFabErrorResponse(error)
      : requestErrorResponse(error)
  }
}

export default { fetch: POST }
