import { prepareExport } from "../../../src/eda.js"
import { MAX_PROJECT_BYTES } from "../../../src/manufacturing.js"
import { fallbackQuote, jlcCredentials, parseQuoteRequest } from "./shared.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const declaredBytes = Number(request.headers.get("content-length") ?? 0)
    if (declaredBytes > MAX_PROJECT_BYTES) {
      return Response.json({ error: "Manufacturing request is too large." }, { status: 413 })
    }
    const source = await request.text()
    if (new TextEncoder().encode(source).byteLength > MAX_PROJECT_BYTES) {
      return Response.json({ error: "Manufacturing request is too large." }, { status: 413 })
    }
    const parsed = parseQuoteRequest(JSON.parse(source))
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
    const message = error instanceof Error ? error.message : "Invalid quote request."
    return Response.json(
      { error: message },
      { status: /fabrication-ready|Export blocked/.test(message) ? 422 : 400 },
    )
  }
}

export default { fetch: POST }
