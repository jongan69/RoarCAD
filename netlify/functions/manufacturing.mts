import { POST as handoff } from "../../api/manufacturing/jlcpcb/handoff.js"
import { POST as quote } from "../../api/manufacturing/jlcpcb/quote.js"
import { POST as macroFabQuote } from "../../api/manufacturing/macrofab/quote.js"
import { POST as macroFabStatus } from "../../api/manufacturing/macrofab/status.js"

export const config = {
  path: [
    "/api/manufacturing/jlcpcb/quote",
    "/api/manufacturing/jlcpcb/handoff",
    "/api/manufacturing/macrofab/quote",
    "/api/manufacturing/macrofab/status",
  ],
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
}

export default async function manufacturing(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname
  const response =
    path === config.path[0]
      ? await quote(request)
      : path === config.path[1]
        ? await handoff(request)
        : path === config.path[2]
          ? await macroFabQuote(request)
          : path === config.path[3]
            ? await macroFabStatus(request)
            : Response.json({ error: "Unknown manufacturing endpoint." }, { status: 404 })
  response.headers.set("cache-control", "no-store")
  response.headers.set("x-content-type-options", "nosniff")
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin")
  return response
}
