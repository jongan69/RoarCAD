import { describe, expect, test } from "bun:test"
import {
  authorizeHandoff,
  fallbackQuote,
  parseQuoteRequest,
} from "../api/manufacturing/jlcpcb/shared"

describe("manufacturing boundary", () => {
  test("falls back honestly and requires explicit confirmation", () => {
    const quote = fallbackQuote("Credentials are missing.")
    expect(quote.configured).toBe(false)
    expect(quote.price).toBeUndefined()
    expect(() => authorizeHandoff({ quoteId: "q1", manifestHash: "a".repeat(64) })).toThrow()
    expect(
      authorizeHandoff({ quoteId: "q1", manifestHash: "a".repeat(64), confirmed: true }).confirmed,
    ).toBe(true)
    expect(() =>
      parseQuoteRequest(
        JSON.stringify({
          mode: "bare-pcb",
          quantity: 5,
          layers: 2,
          thicknessMm: 1.6,
          finish: "ENIG",
          manifestHash: "a".repeat(64),
          bundleBytes: 10,
        }),
        9,
      ),
    ).toThrow("size")
  })
})
