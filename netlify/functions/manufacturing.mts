import { POST as handoff } from "../../api/manufacturing/jlcpcb/handoff.js"
import { POST as quote } from "../../api/manufacturing/jlcpcb/quote.js"

export const config = {
  path: ["/api/manufacturing/jlcpcb/quote", "/api/manufacturing/jlcpcb/handoff"],
}

export default async function manufacturing(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname
  const response =
    path === config.path[0]
      ? await quote(request)
      : path === config.path[1]
        ? await handoff(request)
        : Response.json({ error: "Unknown manufacturing endpoint." }, { status: 404 })
  response.headers.set("cache-control", "no-store")
  response.headers.set("x-content-type-options", "nosniff")
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin")
  return response
}
