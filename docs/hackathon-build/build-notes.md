# Build notes

The first build deliberately supports three bounded edits: board resize, resistance change, and component move. That is enough to prove preview/apply semantics without accepting arbitrary agent-generated code.

Live JLCPCB prices and cart creation remain disabled until developer access supplies a documented, account-approved contract. The fallback is part of the safety design, not a mock quote.

## 2026-08-26 execution-plan refresh

Jonathan chose an AI-led demo centered on visibly building the PocketRoar design. The plan therefore uses autonomous execution with review pauses at hardware-claim freeze, final video approval, and final submission. The submission story treats RoarCAD as the completed product and PocketRoar as an engineering stress test; physical PocketRoar completion continues on a separate evidence-gated ladder after the hackathon entry is ready.

## 2026-08-26 deployed acceptance evidence

- Vercel preview `610b609` passed its remote build and GitHub CI.
- The 640 px in-app-browser viewport rendered without horizontal overflow after the responsive workspace fix; the PCB canvas stayed inside the viewport and placement remained locked by default.
- Chrome exposed exactly five page-bound tools. A fresh environmental-monitor BoardGraph completed the full draft, inspect, preview, apply, and engineering-export journey through `document.modelContext.executeTool`.
- The preview was based on revision `962e3edb038dcf4c`, applying it created immutable revision `9fdddf9136557146`, and export produced manifest `092f3c15d7cdf2d8ae38486c2bc0ae91ddcd71f1d7f827d9b61bebc91b19f120`.
- PocketRoar revision `56147af9ff46a3ee` exported an engineering manifest and rejected a fabrication-class export. The indicator exported fabrication manifest `7b910301cbcf3feb0e282e49b3794319ba2756d4fc75621a03bb098e987d41ac`.
- Both browser clients reported no application console errors during these journeys.
- Preview deployment protection currently prevents a same-origin quote fetch from completing without Vercel authentication. The response boundary now reports the HTTP failure safely; public production and the authenticated fallback still require final deployment verification.
