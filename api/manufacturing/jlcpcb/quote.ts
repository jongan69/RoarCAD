import { fallbackQuote, parseQuoteRequest } from "./shared"

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST")
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  try {
    const form = await request.formData()
    const source = form.get("request")
    const bundle = form.get("bundle")
    if (typeof source !== "string" || !(bundle instanceof File)) {
      return Response.json(
        { error: "A request and manufacturing bundle are required." },
        { status: 400 },
      )
    }
    parseQuoteRequest(source, bundle.size)
    if (!process.env.JLCPCB_API_KEY) {
      return Response.json(
        fallbackQuote(
          "JLCPCB API credentials are not configured; download the verified package and upload it manually.",
        ),
      )
    }
    return Response.json(
      fallbackQuote(
        "JLCPCB credentials are present, but the account-specific API contract has not been approved and verified; live quoting remains disabled.",
      ),
    )
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid quote request." },
      { status: 400 },
    )
  }
}
