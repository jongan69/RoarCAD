import {
  handoffSchema,
  manufacturingRequestSchema,
  type QuoteResult,
} from "../../../src/manufacturing.js"

export const JLC_FALLBACK_URL = "https://jlcpcb.com/quote"
export const JLC_OPEN_API_BASE = "https://open.jlcpcb.com"

export function fallbackQuote(reason: string, manifestHash?: string): QuoteResult {
  return {
    configured: false,
    provider: "JLCPCB",
    substitutions: [],
    warnings: [
      reason,
      "No provider price, shipping estimate, or design acceptance has been claimed.",
    ],
    fallbackUrl: JLC_FALLBACK_URL,
    manifestHash,
  }
}

export function parseQuoteRequest(source: unknown) {
  const request = manufacturingRequestSchema.parse(source)
  if (request.project.currentRevisionId !== request.revisionId) {
    throw new Error("Only the current project revision can be quoted.")
  }
  const revision = request.project.revisions.find(({ id }) => id === request.revisionId)
  if (!revision?.snapshot.design) throw new Error("The requested revision has no BoardGraph.")
  if (revision.snapshot.design.board.layers !== request.configuration.layers) {
    throw new Error("Manufacturing layer count does not match the design.")
  }
  return request
}

export function authorizeHandoff(source: unknown) {
  return handoffSchema.parse(source)
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function toBase64Url(value: string): string {
  return toBase64(new TextEncoder().encode(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

function fromBase64Url(value: string): string {
  const base64 = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=")
  const binary = atob(base64)
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
}

export async function hmacSha256Base64(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return toBase64(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))))
}

export async function jlcAuthorization(input: {
  method: string
  path: string
  body: string
  appId: string
  accessKey: string
  secretKey: string
  timestamp: string
  nonce: string
}): Promise<string> {
  const canonical = `${input.method.toUpperCase()}\n${input.path}\n${input.timestamp}\n${input.nonce}\n${input.body}\n`
  const signature = await hmacSha256Base64(input.secretKey, canonical)
  return `JOP appid="${input.appId}",accesskey="${input.accessKey}",nonce="${input.nonce}",timestamp="${input.timestamp}",signature="${signature}"`
}

export function jlcCredentials(environment: NodeJS.ProcessEnv = process.env) {
  const appId = environment.JLCPCB_APP_ID
  const accessKey = environment.JLCPCB_ACCESS_KEY
  const secretKey = environment.JLCPCB_SECRET_KEY
  return appId && accessKey && secretKey ? { appId, accessKey, secretKey } : null
}

export async function issueQuoteToken(
  payload: { quoteId: string; manifestHash: string; expiresAt: string; checkoutUrl?: string },
  secret: string,
): Promise<string> {
  const encoded = toBase64Url(JSON.stringify(payload))
  const signature = (await hmacSha256Base64(secret, encoded))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
  return `${encoded}.${signature}`
}

export async function verifyQuoteToken(token: string, secret: string) {
  const [encoded, signature, extra] = token.split(".")
  if (!encoded || !signature || extra) throw new Error("Invalid quote token.")
  const expected = (await hmacSha256Base64(secret, encoded))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
  if (signature.length !== expected.length) throw new Error("Invalid quote token.")
  let mismatch = 0
  for (let index = 0; index < signature.length; index += 1)
    mismatch |= signature.charCodeAt(index) ^ expected.charCodeAt(index)
  if (mismatch) throw new Error("Invalid quote token.")
  const payload = JSON.parse(fromBase64Url(encoded)) as {
    quoteId: string
    manifestHash: string
    expiresAt: string
    checkoutUrl?: string
  }
  if (!payload.quoteId || !/^[a-f0-9]{64}$/.test(payload.manifestHash))
    throw new Error("Invalid quote token payload.")
  if (Date.parse(payload.expiresAt) <= Date.now()) throw new Error("Quote token has expired.")
  if (payload.checkoutUrl) {
    const hostname = new URL(payload.checkoutUrl).hostname
    if (hostname !== "jlcpcb.com" && !hostname.endsWith(".jlcpcb.com"))
      throw new Error("Invalid checkout URL.")
  }
  return payload
}

export async function signedJlcRequest(input: {
  path: string
  body: string
  credentials: { appId: string; accessKey: string; secretKey: string }
  fetcher?: typeof fetch
}): Promise<Response> {
  if (!input.path.startsWith("/") || input.path.includes(".."))
    throw new Error("Invalid JLCPCB path.")
  const timestamp = `${Math.floor(Date.now() / 1000)}`
  const nonce = crypto.randomUUID().replaceAll("-", "")
  const authorization = await jlcAuthorization({
    method: "POST",
    path: input.path,
    body: input.body,
    timestamp,
    nonce,
    ...input.credentials,
  })
  return (input.fetcher ?? fetch)(`${JLC_OPEN_API_BASE}${input.path}`, {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: input.body,
    signal: AbortSignal.timeout(15_000),
  })
}
