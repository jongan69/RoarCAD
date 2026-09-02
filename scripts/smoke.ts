import assert from "node:assert/strict"
import { captureBridgeSnapshot, createProject, indicatorSnapshot } from "../src/domain"
import { MAX_PROJECT_BYTES } from "../src/manufacturing"

const target = new URL(process.argv[2] ?? "https://roarcad.netlify.app")
assert.equal(target.protocol, "https:", "Smoke tests require an explicit HTTPS deployment")
assert.equal(target.href, `${target.origin}/`, "Pass an origin, without a path or credentials")

async function request(path: string, init?: RequestInit) {
  return fetch(new URL(path, target), { ...init, signal: AbortSignal.timeout(60_000) })
}

for (const path of [
  "/",
  "/guides/safe-ai-pcb-design/",
  "/compare/flux-quilter/",
  "/alternatives/flux-ai-pcb/",
  "/open-source-ai-pcb/",
  "/case-studies/pocketroar/",
  "/evidence/",
]) {
  const response = await request(path)
  assert.equal(response.status, 200, path)
  assert.match(response.headers.get("content-type") ?? "", /text\/html/, path)
  assert.equal(response.headers.get("permissions-policy"), "tools=(self)", path)
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", path)
  const html = await response.text()
  assert.ok(html.includes(`href="https://roarcad.netlify.app${path}"`), `${path} canonical`)
  if (path === "/") {
    const script = html.match(/<script[^>]+src="([^"]+)"/)?.[1]
    assert.ok(script, "Built app script exists")
    const asset = await request(script)
    assert.equal(asset.status, 200, "Built script is served")
    assert.match(asset.headers.get("content-type") ?? "", /javascript/, "Script is not HTML")
  }
  console.log(`PASS page ${path}`)
}

for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
  const response = await request(path)
  assert.equal(response.status, 200, path)
  assert.ok((await response.text()).includes("https://roarcad.netlify.app/"), path)
  console.log(`PASS discovery ${path}`)
}

for (const endpoint of ["quote", "handoff"]) {
  const path = `/api/manufacturing/jlcpcb/${endpoint}`
  const get = await request(path)
  assert.equal(get.status, 405, `${endpoint} rejects GET`)
  assert.equal(get.headers.get("allow"), "POST")
  for (const [body, status] of [
    ["{", 400],
    [JSON.stringify({ confirmed: false, quoteToken: "x".repeat(80) }), 400],
    ["x".repeat(endpoint === "quote" ? MAX_PROJECT_BYTES + 1 : 16_385), 413],
  ] as const) {
    const response = await request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    })
    assert.equal(response.status, status, `${endpoint} failure status`)
    assert.equal(response.headers.get("cache-control"), "no-store")
    assert.equal(response.headers.get("x-content-type-options"), "nosniff")
    assert.equal(typeof (await response.json()).error, "string")
  }
  console.log(`PASS ${endpoint}: method, malformed, unconfirmed, oversized, non-cacheable`)
}

for (const [name, snapshot, expected] of [
  ["indicator", indicatorSnapshot, 200],
  ["capture", captureBridgeSnapshot, 422],
] as const) {
  const project = await createProject(name, `Smoke ${name}`, snapshot)
  const response = await request("/api/manufacturing/jlcpcb/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      project,
      revisionId: project.currentRevisionId,
      configuration: {
        mode: "bare-pcb",
        quantity: 5,
        layers: snapshot.design?.board.layers,
        thicknessMm: snapshot.design?.board.thicknessMm,
        finish: "ENIG",
      },
    }),
  })
  assert.equal(response.status, expected, `${name} quote gate`)
  const result = await response.json()
  if (expected === 200) {
    assert.equal(result.configured, false, "Live quoting stays disabled")
    assert.equal(result.price, undefined, "No invented price")
    assert.match(result.manifestHash, /^[a-f0-9]{64}$/)
  } else assert.match(result.error, /fabrication-ready|Export blocked/)
  console.log(
    `PASS ${name}: ${expected === 200 ? "compiled manual fallback" : "fabrication refused"}`,
  )
}

console.log(`PASS live HTTP smoke at ${target.origin}; browser and hardware proof are separate.`)
