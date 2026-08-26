import { authorizeHandoff, JLC_FALLBACK_URL, verifyQuoteToken } from "./shared.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const handoff = authorizeHandoff(await request.json())
    const secret = process.env.JLCPCB_SECRET_KEY
    if (!secret) {
      return Response.json(
        {
          error: "JLCPCB handoff is not configured.",
          warnings: ["No order, payment, address, or substitution was submitted."],
          fallbackUrl: JLC_FALLBACK_URL,
        },
        { status: 503 },
      )
    }
    const quote = await verifyQuoteToken(handoff.quoteToken, secret)
    return Response.json({
      checkoutUrl: quote.checkoutUrl,
      warnings: [
        quote.checkoutUrl
          ? "Continue in the user-owned JLCPCB checkout. No payment, address, or substitution was submitted by RoarCAD."
          : "The approved quote has no provider checkout URL; no order, payment, address, or substitution was submitted.",
      ],
      fallbackUrl: JLC_FALLBACK_URL,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid handoff request." },
      { status: 400 },
    )
  }
}
