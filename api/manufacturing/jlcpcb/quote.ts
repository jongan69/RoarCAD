import { prepareExport } from "../../../src/eda.js"
import { MAX_PROJECT_BYTES } from "../../../src/manufacturing.js"
import {
  fallbackQuote,
  jlcCredentials,
  parseQuoteRequest,
  readRequestJson,
  requestErrorResponse,
} from "./shared.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = parseQuoteRequest(await readRequestJson(request, MAX_PROJECT_BYTES))
    const prepared = await prepareExport(parsed.project, "fabrication")
    if (!jlcCredentials()) {
      return Response.json(
        fallbackQuote(
          "JLCPCB API credentials are not configured; download the verified package and upload it manually.",
          prepared.manifestHash,
        ),
      )
    }
    if (process.env.JLCPCB_QUOTE_ENABLED !== "true") {
      return Response.json(
        fallbackQuote(
          "The signed JLCPCB adapter is configured, but live quoting is disabled by the server kill switch.",
          prepared.manifestHash,
        ),
      )
    }
    return Response.json(
      fallbackQuote(
        "JLCPCB credentials are present, but the approved quote endpoint contract has not been verified; live quoting remains disabled.",
        prepared.manifestHash,
      ),
    )
  } catch (error) {
    return requestErrorResponse(error)
  }
}

export default { fetch: POST }
