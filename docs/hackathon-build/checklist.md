# Hackathon completion checklist

Mode: autonomous execution with review pauses at hardware claim freeze, final video, and final submission. PocketRoar remains engineering-only until the hardware gates in `docs/POCKETROAR_TO_DEVPOST_PLAN.md` pass.

- [x] **1. Establish the generic PCB domain**
  Spec ref: `spec.md > BoardProject and BoardGraph`
  What to build: Bounded generic graph, immutable revisions, and evidence/readiness model.
  Acceptance: Indicator and PocketRoar use the same project-independent compiler.
  Verify: `bun test tests/domain.test.ts`

- [x] **2. Complete the shared manual and WebMCP actions**
  Spec ref: `spec.md > WebMCP`
  What to build: Four bounded tools sharing the UI's validated domain actions, with apply available only through the visible control.
  Acceptance: Draft, focused inspection, non-mutating preview, and validate/export work without duplicated logic; no WebMCP tool can apply a change.
  Verify: `bun test tests/webmcp.test.ts`

- [x] **3. Complete compilation, checks, and exports**
  Spec ref: `spec.md > tscircuit`
  What to build: Circuit JSON, PCB/schematic render, Gerber, BOM, CPL, validation, digital-verification report, and manifest.
  Acceptance: Indicator fabrication export passes; PocketRoar engineering export passes and fabrication fails.
  Verify: `bun test tests/eda.test.ts`

- [x] **4. Complete the manufacturing trust boundary**
  Spec ref: `spec.md > Vercel functions`
  What to build: Server recompile, readiness gate, JLC signing/fallback, confirmation, and expiring tokens.
  Acceptance: No quote for engineering candidates and no payment/order side effect.
  Verify: `bun test tests/manufacturing.test.ts`

- [x] **5. Stabilize the deployed workspace**
  Spec ref: `prd.md > inspectable workspace`
  What to build: Stable PCB/schematic canvas, correct placement fields, honest readiness labels, and idempotent tool registration.
  Acceptance: Viewer height remains constant and browser console has no application errors.
  Verify: deployed browser probe plus CI.

- [x] **6. Demonstrate a third generic board**
  Spec ref: `scope.md > public hosted application`
  What to build: Draft a non-fixture board through `draft_board`, then inspect, preview, manually approve, and export it.
  Acceptance: No project-name/template branch and agent evidence remains unreviewed.
  Verify: the original 2026-08-26 submission produced engineering manifest `092f3c15d7cdf2d8ae38486c2bc0ae91ddcd71f1d7f827d9b61bebc91b19f120`; the replacement production journey confirmed the four-tool contract and human-only apply boundary.

- [x] **7. Upgrade PocketRoar to the strongest defensible candidate**
  Spec ref: `scope.md > PocketRoar engineering-candidate package`
  What to build: Apply the product, vendor, mechanical, library, power, and schematic steps A1–A6 from the master plan without guessing missing data.
  Acceptance: Every remaining omission appears as an explicit blocker; no unsupported fabrication claim.
  Verify: revision `c204a71b354abeff` compiles to 2,566 Circuit JSON elements with zero compiler errors and zero independent checker errors; fabrication remains blocked because eleven routes are not a complete schematic and the iPhone transport is unproven.

- [x] **8. Capture the original-submission WebMCP proof**
  Spec ref: `prd.md > real browser agent`
  What to build: Record Chrome executing the original five-tool build against the deployed app.
  Acceptance: The recording shows preview non-mutation, human approval, new revision, export, and PocketRoar quote rejection.
  Verify: the original live five-tool Chrome journey passed; it must be replaced by the human-approval checkpoint story below.

- [x] **9. Finish public repository evidence**
  Spec ref: `scope.md > source and documentation`
  What to build: Stable demo link, detected MIT license, current README, safety/architecture/testing docs, and secret scan.
  Acceptance: A clean visitor can run and understand the project without private context.
  Verify: Accepted commit `404fcb8` passed CI on both branches, Vercel promoted it to `https://roarcad.vercel.app/`, the tracked-secret scan was clean, and GitHub detects the MIT license on default branch `main`.

- [x] **10. Produce the under-three-minute demo**
  Spec ref: `docs/POCKETROAR_TO_DEVPOST_PLAN.md > B6`
  What to build: Real product screen capture with reviewed AI narration, captions, edits, and audio.
  Acceptance: Under three minutes, public YouTube URL, no fabricated behavior, no secrets.
  Verify: the public 2:25 YouTube video is 1920×1080 H.264/AAC, has audible narration and timed captions, and passed anonymous oEmbed readback; replacing it with the checkpoint-first story remains tracked separately below.

- [x] **11. Complete and review the Devpost packet**
  Spec ref: `devpost-submission.md`
  What to build: Corrected story, official form answers, URLs, testing instructions, screenshots, AI/Codex disclosure, and limitations.
  Acceptance: Every required field is filled and every claim is demonstrated.
  Verify: the canonical draft was reconciled with the live Devpost requirements, judging criteria, tested-client evidence, PocketRoar story, and production limitations on August 28, 2026.

- [x] **12. Submit with confirmation**
  Spec ref: `docs/POCKETROAR_TO_DEVPOST_PLAN.md > B8`
  What to build: Final clean-browser link test and Devpost submission.
  Acceptance: User explicitly confirms immediately before submission; Devpost returns a public project page.
  Verify: Devpost re-submitted existing entry `1154859`; live project readback returned version 3, state `published`, an August 28 update timestamp, and the WebMCP submission association.

- [x] **13. Add immutable checkpoint handoff**
  What to build: Validated, size-bounded, gzip/base64url checkpoints with integrity checks, ancestry, semantic comparison, read-only opening, local fork, and explicit adoption.
  Acceptance: Incoming state never mutates local storage automatically, external trust is downgraded, and divergent graphs are never auto-merged.
  Verify: `bun test tests/checkpoints.test.ts`

- [x] **14. Add bounded WebMCP eval cases**
  What to build: Ten natural-language cases covering tool selection, arguments, pagination, sequencing, and human-only no-call cases.
  Acceptance: Exactly four allowed tools and no agent apply, download, quote, order, or payment action.
  Verify: `bun run eval:webmcp`

- [x] **15. Prove the replacement production journey**
  What to build: Clean-profile A → B → A checkpoint handoff plus four-tool Chrome and ChatGPT in-app-browser journeys.
  Acceptance: At least 90% correct first-call tool selection and 100% prevention of agent apply/download/order behavior.
  Verify: production A → B → A passed across clean Chrome and ChatGPT in-app-browser profiles; source, CI, deployment, and browser evidence remain separately recorded.

- [ ] **16. Replace and freeze the submission**
  What to build: Record the checkpoint-first video, update screenshots and Devpost copy, then obtain explicit confirmation before resubmission.
  Acceptance: Public video and live Devpost readback match the verified production build.
  Verify: zero-error production commit `16f3e1600998a2a35644e32a0dbc7b388de81cce` is live, but the current public video and PocketRoar screenshot predate that repair. Freeze only after those assets and the Devpost readback match the release.
