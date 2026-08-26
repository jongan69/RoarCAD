# Hackathon completion checklist

Mode: autonomous execution with review pauses at hardware claim freeze, final video, and final submission. PocketRoar remains engineering-only until the hardware gates in `docs/POCKETROAR_TO_DEVPOST_PLAN.md` pass.

- [x] **1. Establish the generic PCB domain**
  Spec ref: `spec.md > BoardProject and BoardGraph`
  What to build: Bounded generic graph, immutable revisions, and evidence/readiness model.
  Acceptance: Indicator and PocketRoar use the same project-independent compiler.
  Verify: `bun test tests/domain.test.ts`

- [x] **2. Complete the shared manual and WebMCP actions**
  Spec ref: `spec.md > WebMCP`
  What to build: Exactly five tools sharing the same validated domain actions as the UI.
  Acceptance: Draft, inspect, preview, apply, and validate/export work without duplicated logic.
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

- [ ] **6. Demonstrate a third generic board**
  Spec ref: `scope.md > public hosted application`
  What to build: Draft a non-fixture board through `draft_board`, then inspect, preview, apply, and export it.
  Acceptance: No project-name/template branch and agent evidence remains unreviewed.
  Verify: recorded deployed Chrome journey.

- [ ] **7. Upgrade PocketRoar to the strongest defensible candidate**
  Spec ref: `scope.md > PocketRoar engineering-candidate package`
  What to build: Apply the product, vendor, mechanical, library, power, and schematic steps A1–A6 from the master plan without guessing missing data.
  Acceptance: Every remaining omission appears as an explicit blocker; no unsupported fabrication claim.
  Verify: engineering export plus independent evidence review.

- [ ] **8. Capture the complete WebMCP proof**
  Spec ref: `prd.md > real browser agent`
  What to build: Record Chrome executing all five tools against the deployed app.
  Acceptance: The recording shows preview non-mutation, human approval, new revision, export, and PocketRoar quote rejection.
  Verify: replay the raw capture end to end.

- [ ] **9. Finish public repository evidence**
  Spec ref: `scope.md > source and documentation`
  What to build: Stable demo link, detected MIT license, current README, safety/architecture/testing docs, and secret scan.
  Acceptance: A clean visitor can run and understand the project without private context.
  Verify: GitHub public page, `git grep` secret review, and clean clone smoke test.

- [ ] **10. Produce the under-three-minute demo**
  Spec ref: `docs/POCKETROAR_TO_DEVPOST_PLAN.md > B6`
  What to build: Real product screen capture with reviewed AI narration, captions, edits, and audio.
  Acceptance: Under three minutes, public YouTube URL, no fabricated behavior, no secrets.
  Verify: watch the final upload logged out with captions enabled.

- [ ] **11. Complete and review the Devpost packet**
  Spec ref: `devpost-submission.md`
  What to build: Corrected story, official form answers, URLs, testing instructions, screenshots, AI/Codex disclosure, and limitations.
  Acceptance: Every required field is filled and every claim is demonstrated.
  Verify: compare the draft line by line with the live Devpost requirements and judging criteria.

- [ ] **12. Submit with confirmation**
  Spec ref: `docs/POCKETROAR_TO_DEVPOST_PLAN.md > B8`
  What to build: Final clean-browser link test and Devpost submission.
  Acceptance: User explicitly confirms immediately before submission; Devpost returns a public project page.
  Verify: open the resulting public Devpost URL logged out.
