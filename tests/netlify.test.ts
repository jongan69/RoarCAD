import { expect, test } from "bun:test"
import handler, { config } from "../netlify/functions/manufacturing.mts"
import { createProject, indicatorSnapshot } from "../src/domain"

test("Netlify routes only the four manufacturing boundaries", async () => {
  expect(config.path).toEqual([
    "/api/manufacturing/jlcpcb/quote",
    "/api/manufacturing/jlcpcb/handoff",
    "/api/manufacturing/macrofab/quote",
    "/api/manufacturing/macrofab/status",
  ])
  expect(config.rateLimit).toEqual({
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  })
  for (const path of config.path) {
    const response = await handler(new Request(`https://roarcad.test${path}`))
    expect(response.status).toBe(405)
    expect(response.headers.get("allow")).toBe("POST")
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  }
  expect((await handler(new Request("https://roarcad.test/api/unknown"))).status).toBe(404)
})

test("Netlify executes the shared compiler and honest quote fallback", async () => {
  const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
  const response = await handler(
    new Request("https://roarcad.test/api/manufacturing/jlcpcb/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project,
        revisionId: project.currentRevisionId,
        configuration: {
          mode: "bare-pcb",
          quantity: 5,
          layers: 2,
          thicknessMm: 1.6,
          finish: "ENIG",
        },
      }),
    }),
  )
  expect(response.status).toBe(200)
  const quote = await response.json()
  expect(quote.configured).toBe(false)
  expect(quote.price).toBeUndefined()
  expect(quote.manifestHash).toMatch(/^[a-f0-9]{64}$/)
})
