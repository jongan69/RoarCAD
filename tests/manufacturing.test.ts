import { describe, expect, test } from "bun:test"
import { POST as quotePost } from "../api/manufacturing/jlcpcb/quote"
import {
  authorizeHandoff,
  fallbackQuote,
  issueQuoteToken,
  jlcAuthorization,
  parseQuoteRequest,
  verifyQuoteToken,
} from "../api/manufacturing/jlcpcb/shared"
import { captureBridgeSnapshot, createProject, indicatorSnapshot } from "../src/domain"
import { MAX_PROJECT_BYTES } from "../src/manufacturing"

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
})
