import { expect, test } from "bun:test"

const origin = "https://roarcad.vercel.app"
const pages = [
  ["index.html", `${origin}/`],
  ["public/guides/safe-ai-pcb-design/index.html", `${origin}/guides/safe-ai-pcb-design/`],
  ["public/compare/flux-quilter/index.html", `${origin}/compare/flux-quilter/`],
  ["public/alternatives/flux-ai-pcb/index.html", `${origin}/alternatives/flux-ai-pcb/`],
  ["public/open-source-ai-pcb/index.html", `${origin}/open-source-ai-pcb/`],
  ["public/case-studies/pocketroar/index.html", `${origin}/case-studies/pocketroar/`],
  ["public/evidence/index.html", `${origin}/evidence/`],
] as const

test("every public discovery page has unique crawlable metadata", async () => {
  const titles = new Set<string>()
  for (const [path, canonical] of pages) {
    const html = await Bun.file(path).text()
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
    expect(title).toBeTruthy()
    expect(titles.has(title ?? "")).toBe(false)
    titles.add(title ?? "")
    expect(html).toContain(`<link rel="canonical" href="${canonical}"`)
    expect(html).toContain('name="description"')
    expect(html).toContain('name="robots"')
    expect(html).toContain('property="og:title"')
  }
})

test("sitemap and AI summary include every canonical page", async () => {
  const sitemap = await Bun.file("public/sitemap.xml").text()
  const llms = await Bun.file("public/llms.txt").text()
  for (const [, canonical] of pages) {
    expect(sitemap).toContain(`<loc>${canonical}</loc>`)
    expect(llms).toContain(canonical)
  }
  expect(await Bun.file("public/robots.txt").text()).toContain(`${origin}/sitemap.xml`)
})

test("positioning preserves the human approval and physical-proof boundaries", async () => {
  const homepage = await Bun.file("index.html").text()
  const safety = await Bun.file("public/guides/safe-ai-pcb-design/index.html").text()
  const pocketRoar = await Bun.file("public/case-studies/pocketroar/index.html").text()
  expect(homepage).toContain("only a person can approve")
  expect(safety).toContain("Only a person may")
  expect(safety).toContain("apply a design change")
  expect(pocketRoar).toContain("does not mean the final product works")
})
