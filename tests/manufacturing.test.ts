import { describe, expect, test } from "bun:test"
import { POST as handoffPost } from "../api/manufacturing/jlcpcb/handoff"
import { POST as quotePost } from "../api/manufacturing/jlcpcb/quote"
import {
  authorizeHandoff,
  fallbackQuote,
  issueQuoteToken,
  jlcAuthorization,
  parseQuoteRequest,
  verifyQuoteToken,
} from "../api/manufacturing/jlcpcb/shared"
import { POST as macroFabQuotePost } from "../api/manufacturing/macrofab/quote"
import {
  createMacroFabProject,
  issueMacroFabToken,
  macroFabRequest,
  parseMacroFabQuote,
  verifyMacroFabToken,
} from "../api/manufacturing/macrofab/shared"
import { POST as macroFabStatusPost } from "../api/manufacturing/macrofab/status"
import { captureBridgeSnapshot, createProject, indicatorSnapshot } from "../src/domain"
import { MAX_PROJECT_BYTES, parseProviderResponse } from "../src/manufacturing"

describe("manufacturing boundary", () => {
  test("falls back honestly and requires explicit confirmation", async () => {
    const quote = fallbackQuote("Credentials are missing.")
    expect(quote.configured).toBe(false)
    expect(quote.price).toBeUndefined()
    expect(() => authorizeHandoff({ quoteToken: "q1", confirmed: true })).toThrow()
    expect(authorizeHandoff({ quoteToken: "a".repeat(80), confirmed: true }).confirmed).toBe(true)

    const project = await createProject("indicator", "Power indicator", indicatorSnapshot)
    expect(
      parseQuoteRequest({
        project,
        revisionId: project.currentRevisionId,
        configuration: {
          mode: "bare-pcb",
          quantity: 5,
          layers: 2,
          thicknessMm: 1.6,
          finish: "ENIG",
        },
      }).revisionId,
    ).toBe(project.currentRevisionId)
    expect(() =>
      parseQuoteRequest({
        project,
        revisionId: project.currentRevisionId,
        configuration: {
          mode: "bare-pcb",
          quantity: 5,
          layers: 2,
          thicknessMm: 0.8,
          finish: "ENIG",
        },
      }),
    ).toThrow("thickness")
  })

  test("builds the documented JLC authorization shape", async () => {
    const authorization = await jlcAuthorization({
      method: "POST",
      path: "/api/example",
      body: "{}",
      appId: "app",
      accessKey: "access",
      secretKey: "secret",
      timestamp: "1700000000",
      nonce: "12345678901234567890123456789012",
    })
    expect(authorization).toMatch(/^JOP appid="app",accesskey="access",nonce="1234/)
    expect(authorization).toContain('timestamp="1700000000"')
    expect(authorization).toContain('signature="')
  })

  test("server recompiles fabrication projects and blocks engineering candidates", async () => {
    const indicator = await createProject("indicator", "Power indicator", indicatorSnapshot)
    const accepted = await quotePost(
      new Request("https://roarcad.test/api/manufacturing/jlcpcb/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project: indicator,
          revisionId: indicator.currentRevisionId,
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
    expect(accepted.status).toBe(200)
    expect((await accepted.json()).configured).toBe(false)

    const capture = await createProject("capture", "PocketRoar", captureBridgeSnapshot)
    const blocked = await quotePost(
      new Request("https://roarcad.test/api/manufacturing/jlcpcb/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project: capture,
          revisionId: capture.currentRevisionId,
          configuration: { mode: "pcba", quantity: 5, layers: 8, thicknessMm: 1.6, finish: "ENIG" },
        }),
      }),
    )
    expect(blocked.status).toBe(422)
  })

  test("quote tokens are signed and expire", async () => {
    const token = await issueQuoteToken(
      {
        quoteId: "quote-1",
        manifestHash: "a".repeat(64),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        checkoutUrl: "https://jlcpcb.com/checkout",
      },
      "secret",
    )
    expect((await verifyQuoteToken(token, "secret")).quoteId).toBe("quote-1")
    await expect(verifyQuoteToken(`${token}x`, "secret")).rejects.toThrow("Invalid")
    for (const overrides of [
      { expiresAt: "not-a-date" },
      { expiresAt: new Date(0).toISOString() },
      { checkoutUrl: "http://jlcpcb.com/checkout" },
      { checkoutUrl: "https://evil.test/checkout" },
      { checkoutUrl: "https://user:password@jlcpcb.com/checkout" },
    ]) {
      const invalid = await issueQuoteToken(
        {
          quoteId: "quote-1",
          manifestHash: "a".repeat(64),
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          ...overrides,
        },
        "secret",
      )
      await expect(verifyQuoteToken(invalid, "secret")).rejects.toThrow()
    }
  })

  test("both endpoints reject methods and bound streamed bodies", async () => {
    for (const endpoint of [quotePost, handoffPost, macroFabQuotePost, macroFabStatusPost]) {
      const get = await endpoint(new Request("https://roarcad.test/api"))
      expect(get.status).toBe(405)
      expect(get.headers.get("allow")).toBe("POST")
      const response = await endpoint(
        new Request("https://roarcad.test/api", {
          method: "POST",
          body: "x".repeat(MAX_PROJECT_BYTES + 1),
        }),
      )
      expect(response.status).toBe(413)
    }
  })

  test("rejects oversized quote requests before parsing", async () => {
    const response = await quotePost(
      new Request("https://roarcad.test/api/manufacturing/jlcpcb/quote", {
        method: "POST",
        body: "x".repeat(MAX_PROJECT_BYTES + 1),
      }),
    )
    expect(response.status).toBe(413)
  })

  test("reports non-JSON provider failures without leaking their body", async () => {
    await expect(
      parseProviderResponse(
        new Response("A server error occurred", { status: 401 }),
        "Quote failed",
      ),
    ).rejects.toThrow("Quote failed (HTTP 401)")
    await expect(
      parseProviderResponse(new Response("Netlify rate limit", { status: 429 }), "Quote failed"),
    ).rejects.toThrow("Wait a minute and try again")
  })

  test("MacroFab tokens reject tampering and unsupported money", async () => {
    const payload = {
      pcbId: "abc123",
      pcbVersion: 1,
      revisionId: "revision-1",
      manifestHash: "a".repeat(64),
      quantity: 5,
      layers: 2 as const,
      impedanceControl: false,
    }
    const token = await issueMacroFabToken(payload, "secret", 1_000)
    expect((await verifyMacroFabToken(token, "secret", 2_000)).pcbId).toBe("abc123")
    await expect(verifyMacroFabToken(`${token}x`, "secret", 2_000)).rejects.toThrow("Invalid")
    await expect(verifyMacroFabToken(token, "secret", 16 * 60_000)).rejects.toThrow("expired")

    const verified = await verifyMacroFabToken(token, "secret", 2_000)
    expect(() => parseMacroFabQuote({ quote: { totals: { total: 12.5 } } }, verified)).toThrow(
      "unsupported quote format",
    )
    const quote = parseMacroFabQuote(
      {
        quote: {
          totals: { total: "42.50", currency: "USD" },
          lead_time: { days: 10 },
          warnings: ["Provider warning"],
        },
      },
      verified,
    )
    expect(quote.price).toEqual({ amount: "42.50", currency: "USD" })
    expect(quote.leadTime).toBe("10 days")
    expect(quote.shipping).toBeUndefined()
    expect(quote.tax).toBeUndefined()
  })

  test("MacroFab boundaries reject PCBA and engineering-only projects before upload", async () => {
    const indicator = await createProject("indicator", "Power indicator", indicatorSnapshot)
    const pcba = await macroFabQuotePost(
      new Request("https://roarcad.test/api/manufacturing/macrofab/quote", {
        method: "POST",
        body: JSON.stringify({
          project: indicator,
          revisionId: indicator.currentRevisionId,
          configuration: { mode: "pcba", quantity: 5, layers: 2, thicknessMm: 1.6, finish: "ENIG" },
        }),
      }),
    )
    expect(pcba.status).toBe(422)

    const capture = await createProject("capture", "PocketRoar", captureBridgeSnapshot)
    const engineering = await macroFabQuotePost(
      new Request("https://roarcad.test/api/manufacturing/macrofab/quote", {
        method: "POST",
        body: JSON.stringify({
          project: capture,
          revisionId: capture.currentRevisionId,
          configuration: {
            mode: "bare-pcb",
            quantity: 5,
            layers: 8,
            thicknessMm: 1.6,
            finish: "ENIG",
          },
        }),
      }),
    )
    expect(engineering.status).toBe(422)

    const originalKey = process.env.MACROFAB_API_KEY
    delete process.env.MACROFAB_API_KEY
    try {
      const unavailable = await macroFabQuotePost(
        new Request("https://roarcad.test/api/manufacturing/macrofab/quote", {
          method: "POST",
          body: JSON.stringify({
            project: indicator,
            revisionId: indicator.currentRevisionId,
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
      expect(unavailable.status).toBe(503)
      expect((await unavailable.json()).state).toBe("fallback")
    } finally {
      if (originalKey !== undefined) process.env.MACROFAB_API_KEY = originalKey
    }
  })

  test("MacroFab status preserves polling tokens until recognized layers are ready", async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.MACROFAB_API_KEY
    process.env.MACROFAB_API_KEY = "test-secret"
    try {
      const token = await issueMacroFabToken(
        {
          pcbId: "abc123",
          pcbVersion: 1,
          revisionId: "revision-1",
          manifestHash: "a".repeat(64),
          quantity: 5,
          layers: 2,
          impedanceControl: false,
        },
        "test-secret",
      )
      const responses = [
        Response.json({ errors: [] }),
        Response.json({
          pcb_layers: [
            { id: "board_outline", files: [{ state: "processed" }] },
            { id: "top_copper", files: [] },
          ],
        }),
      ]
      globalThis.fetch = Object.assign(
        () => Promise.resolve(responses.shift() ?? Response.json({})),
        { preconnect: () => undefined },
      )
      const response = await macroFabStatusPost(
        new Request("https://roarcad.test/api/manufacturing/macrofab/status", {
          method: "POST",
          body: JSON.stringify({ quoteToken: token }),
        }),
      )
      expect(response.status).toBe(202)
      const result = await response.json()
      expect(result.state).toBe("processing")
      expect(result.quoteToken).toBe(token)
      expect(JSON.stringify(result)).not.toContain("test-secret")

      const processedLayers = [
        "board_outline",
        "top_soldermask",
        "top_copper",
        "bottom_copper",
        "bottom_soldermask",
        "drill",
      ].map((id) => ({ id, files: [{ state: "processed" }] }))

      const rejectedResponses = [
        Response.json({ errors: [] }),
        Response.json({ pcb_layers: processedLayers }),
        Response.json({
          manufacturable: { prototype: false, production: false },
          errors: { dimensions: "too_small" },
        }),
      ]
      globalThis.fetch = Object.assign(
        () => Promise.resolve(rejectedResponses.shift() ?? Response.json({})),
        { preconnect: () => undefined },
      )
      const rejected = await macroFabStatusPost(
        new Request("https://roarcad.test/api/manufacturing/macrofab/status", {
          method: "POST",
          body: JSON.stringify({ quoteToken: token }),
        }),
      )
      expect((await rejected.json()).state).toBe("rejected")

      const quoteResponses = [
        Response.json({ errors: [] }),
        Response.json({ pcb_layers: processedLayers }),
        Response.json({ manufacturable: { prototype: true, production: true }, errors: {} }),
        Response.json({ quote: { totals: { total: "42.50", currency: "USD" } } }),
      ]
      globalThis.fetch = Object.assign(
        () => Promise.resolve(quoteResponses.shift() ?? Response.json({})),
        { preconnect: () => undefined },
      )
      const quoted = await macroFabStatusPost(
        new Request("https://roarcad.test/api/manufacturing/macrofab/status", {
          method: "POST",
          body: JSON.stringify({ quoteToken: token }),
        }),
      )
      expect((await quoted.json()).price).toEqual({ amount: "42.50", currency: "USD" })
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.MACROFAB_API_KEY
      else process.env.MACROFAB_API_KEY = originalKey
    }
  })

  test("MacroFab network failures are sanitized", async () => {
    await expect(
      macroFabRequest(
        "/api/v2/pcbs",
        "secret-key",
        {},
        Object.assign(
          () => Promise.reject(new Error("https://api.macrofab.com?apikey=secret-key")),
          { preconnect: () => undefined },
        ),
      ),
    ).rejects.toThrow("did not respond in time")
    await expect(
      createMacroFabProject(
        "Indicator",
        "a".repeat(64),
        "invalid-key",
        Object.assign(() => Promise.resolve(Response.json({}, { status: 401 })), {
          preconnect: () => undefined,
        }),
      ),
    ).rejects.toThrow("authentication failed")
  })

  test("MacroFab start creates one project and uploads the reviewed Gerber set", async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.MACROFAB_API_KEY
    process.env.MACROFAB_API_KEY = "test-secret"
    let projects = 0
    let uploads = 0
    globalThis.fetch = Object.assign(
      async (input: string | URL | Request) => {
        const url = new URL(input instanceof Request ? input.url : input)
        if (url.hostname === "uploads.macrofab.test") {
          uploads += 1
          return new Response(null, { status: 204 })
        }
        if (url.pathname === "/api/v2/pcbs") {
          projects += 1
          return Response.json({ pcb: { pcb_id: "abc123" } })
        }
        if (url.pathname === "/api/v2/pcb/abc123") {
          return Response.json({ pcb: { current_version: 1 } })
        }
        if (url.pathname === "/api/v2/sign_s3_upload") {
          return Response.json({
            uri: "https://uploads.macrofab.test/",
            form_fields: { key: url.searchParams.get("filename") ?? "file" },
          })
        }
        return Response.json({}, { status: 404 })
      },
      { preconnect: () => undefined },
    )
    try {
      const indicator = await createProject("indicator", "Power indicator", indicatorSnapshot)
      const response = await macroFabQuotePost(
        new Request("https://roarcad.test/api/manufacturing/macrofab/quote", {
          method: "POST",
          body: JSON.stringify({
            project: indicator,
            revisionId: indicator.currentRevisionId,
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
      expect(response.status).toBe(202)
      const result = await response.json()
      expect(result.state).toBe("processing")
      expect(result.quoteToken).toBeString()
      expect(projects).toBe(1)
      expect(uploads).toBe(11)
      expect(JSON.stringify(result)).not.toContain("test-secret")
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.MACROFAB_API_KEY
      else process.env.MACROFAB_API_KEY = originalKey
    }
  })
})
