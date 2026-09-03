# Build notes

The first build deliberately supports three bounded edits: board resize, resistance change, and component move. That is enough to prove preview/apply semantics without accepting arbitrary agent-generated code.

Live JLCPCB prices and cart creation remain disabled until developer access supplies a documented, account-approved contract. The fallback is part of the safety design, not a mock quote.

## 2026-08-26 execution-plan refresh

Jonathan chose an AI-led demo centered on visibly building the PocketRoar design. The plan therefore uses autonomous execution with review pauses at hardware-claim freeze, final video approval, and final submission. The submission story treats RoarCAD as the completed product and PocketRoar as an engineering stress test; physical PocketRoar completion continues on a separate evidence-gated ladder after the hackathon entry is ready.

## 2026-08-26 deployed acceptance evidence

- Vercel preview `610b609` passed its remote build and GitHub CI.
- The 640 px in-app-browser viewport rendered without horizontal overflow after the responsive workspace fix; the PCB canvas stayed inside the viewport and placement remained locked by default.
- The original submitted build exposed five page-bound tools. A fresh environmental-monitor BoardGraph completed its draft, inspect, preview, apply, and engineering-export journey through `document.modelContext.executeTool`; the replacement build deliberately removes agent apply and requires fresh acceptance evidence.
- The preview was based on revision `962e3edb038dcf4c`, applying it created immutable revision `9fdddf9136557146`, and export produced manifest `092f3c15d7cdf2d8ae38486c2bc0ae91ddcd71f1d7f827d9b61bebc91b19f120`.
- PocketRoar revision `56147af9ff46a3ee` exported an engineering manifest and rejected a fabrication-class export. The indicator exported fabrication manifest `7b910301cbcf3feb0e282e49b3794319ba2756d4fc75621a03bb098e987d41ac`.
- Both browser clients reported no application console errors during these journeys.
- Preview deployment protection currently prevents a same-origin quote fetch from completing without Vercel authentication. The response boundary now reports the HTTP failure safely; public production and the authenticated fallback still require final deployment verification.
- A camera-state regression test zoomed the PCB, switched to the schematic, then returned to PCB. With hover-only overlays removed, the before/after screenshots had the same SHA-256 (`b96364f5c8b07508c6d14f17a5242336e08d51307a4bfd8fb455950249f6a54b`).
- The Vercel Bun functions now use the required default `fetch` handler and root TypeScript options. The deployed handoff route returned structured validation JSON; repeated quote probes were rejected by the configured fixed-window WAF before a function invocation was logged.
- Preview protection remains intentionally distinct from public-production acceptance. A judge-accessible production alias is still blocked on explicit promotion approval.

## 2026-08-26 production promotion

- Jonathan authorized the speed-run to the judge-ready finish line.
- Commit `404fcb8` passed the complete remote CI suite on both `dev` and `main`.
- Vercel promoted that commit to `https://roarcad.vercel.app/`; the public route returned HTTP 200.
- GitHub now detects the root MIT license on the public repository's default `main` branch.
- The final public demo video and explicit Devpost submission confirmation remain open; nothing has been sent to Devpost.

## 2026-08-26 final video master

- Grady narration completed as 16 consistent, pause-free takes and was assembled without time-stretching.
- The final local master is `artifacts/demo/roarcad-demo-final.mp4`: 2:24, 1920×1080, H.264 video, stereo AAC audio, SHA-256 `b40d8626f7bdceb93daab855df8ec064db786f21b1897386922e05e043c3bcb0`.
- Whisper timed 405 authored words into 234 clean caption cards with 0.936 authored-text similarity; the sidecar is `artifacts/demo/roarcad-demo-final.srt`.
- Every product frame comes from the deployed application. The preview and approved revision captures were regenerated through the live Chrome WebMCP page before assembly.
- Jonathan still owns the public YouTube upload, logged-out replay, URL handoff, and final Devpost submit action.

## 2026-08-28 zero-error PocketRoar production release

- The shared footprint compiler was the root cause of the large false-error count: raw pad arrays created copper pads without routable PCB ports.
- The repaired fixture uses exact KiCad-derived HDMI and USB-C pad geometry, corrected bridge-critical BGA balls, the correct 19.2 MHz CX3 clock part, net-class widths, and explicit BGA escape paths.
- PocketRoar revision `c204a71b354abeff` produces 2,566 Circuit JSON elements with zero compiler errors and zero independent checker errors. It still models only eleven routes and remains engineering-only.
- PR `#6` merged to production as `16f3e1600998a2a35644e32a0dbc7b388de81cce`; GitHub Actions run `33217786830` passed 30 tests across nine files plus typecheck, Biome, and build, and the matching Vercel production deployment reached `READY`.
- The in-app-browser release-candidate smoke showed zero viewer errors, stable 390×844 schematic height, exactly four WebMCP tools, and bounded focused inspection. A clean Chrome profile independently loaded the public production origin with WebMCP ready.
- Existing edited IndexedDB projects remain preserved. A previously edited browser profile can therefore show an older PocketRoar fork until the user explicitly selects the current reference or opens a clean profile; RoarCAD does not silently delete that work.
- The canonical Devpost draft now includes the zero-error evidence. The public entry and replacement screenshot remain separate, confirmation-gated publication work.

## 2026-09-03 final submission

- Live WebMCP created a three-part environmental monitor from a structured brief,
  returned focused inspection, previewed a move without mutating revision
  `a5926b6e38c9e3b7`, and created revision `849f7e21d4758f5f` only after the
  visible **Approve & apply** click. The board displayed zero viewer errors.
- The replacement master is 2:46.635 at 1920×1080 with H.264 video and narrated
  AAC audio. Its SHA-256 is
  `8724ca4064235bf83d49cd909f2b88d1ec6c2d7146e590ac1c7fe6d10b20c2da`.
- YouTube published `https://youtu.be/DEJ6Mwa9TYU`; anonymous oEmbed returned the
  final title, author, and thumbnail after copyright and Community Guidelines
  checks completed with no issues.
- Devpost project version 7 and submission `1154859` now point to Netlify and the
  replacement video. Live project readback confirmed the final tagline,
  description, video, website URL, published state, and WebMCP association.
