import { authorizeHandoff, JLC_FALLBACK_URL } from "./shared.js"

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST")
    return Response.json({ error: "Method not allowed" }, { status: 405 })
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
