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
