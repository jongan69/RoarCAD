import { authorizeHandoff, JLC_FALLBACK_URL } from "./shared.js"

export async function POST(request: Request): Promise<Response> {
  try {
    authorizeHandoff(await request.json())
    return Response.json({
      warnings: [
        "No current provider quote or approved cart API is configured; no order, payment, address, or substitution was submitted.",
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
