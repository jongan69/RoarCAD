# Title

RoarCAD

## One-line Summary

A WebMCP PCB workbench where agents draft, humans approve, and unsafe designs cannot reach manufacturing.

## Problem

AI-generated PCB designs can look complete while hiding missing requirements, unverified component evidence, incorrect footprints, stale edits, or unresolved physical constraints. A visual render or clean DRC result is not enough to justify fabrication.

## Solution

RoarCAD is a local-first, agent-native PCB review and handoff system. One engineer shares an immutable checkpoint, a coauthor continues it with an agent, and the original author reviews the common ancestry and semantic diff before adopting the returned revision. Four page-bound WebMCP tools let agents draft, inspect, preview, and validate designs; only the visible human approval control can create the proposed revision.

## Why WebMCP

PCB work is a poor fit for agents guessing their way through buttons or editing opaque files. WebMCP gives the agent four bounded operations over the exact board revision already open in the browser. The agent can reason over a focused slice of requirements or design state and propose a deterministic change, while the person sees the semantic diff and remains the only authority that can apply it.

This was difficult to do safely with ordinary browser automation. A visual agent could move the wrong component, act on a stale revision, or mistake a clean-looking render for manufacturing approval. RoarCAD's schemas, revision hashes, non-mutating previews, and human-only evidence review turn those hidden assumptions into explicit product state.

## Why This Matters

Hardware mistakes cost money and time after a file leaves the browser. RoarCAD makes the agent useful without letting it silently certify supplier data or cross irreversible manufacturing boundaries. The workflow is useful for makers, hardware startups, educators, and engineers who want faster iteration with visible provenance and review gates.

## How We Used AI

The browser agent converts natural-language PCB requests into bounded `BoardGraph` objects and allowlisted change operations. It can inspect evidence and risks, prepare non-mutating previews, and request validation/export preparation. AI-created supplier or datasheet information remains untrusted until reviewed in the visible UI, and no AI tool can quote, order, pay, store shipping details, or accept substitutions.

## How We Used Codex

Codex helped research WebMCP, tscircuit, PCB validation, PocketRoar’s HDMI-to-UVC candidate, and the JLCPCB trust boundary. It implemented and debugged the typed domain model, generic compiler, viewers, immutable revision flow, server-side manufacturing revalidation, tests, deployment, documentation, and submission materials. Jonathan Gan directed the product, claims, safety boundaries, and approval decisions.

## Key Features

- Four focused WebMCP tools sharing the manual UI’s validated domain actions, with no agent-callable apply operation.
- Immutable, integrity-checked checkpoint links and JSON files for read-only review, explicit local forks, semantic comparison, return, and adoption.
- Generic 1–10 layer `BoardGraph` with bounded components, pins, nets, footprints, placement, differential pairs, pours, holes, keepouts, and constraints.
- tscircuit PCB and schematic compilation, viewing, checks, and manufacturing exports.
- Deterministic preview hashes, stale-change rejection, and immutable revisions.
- Human-only requirements, evidence, part, and footprint review.
- Engineering versus fabrication readiness with visible blockers.
- Gerber, BOM, placement, Circuit JSON, validation, project, and SHA-256 manifest bundles.
- Server-side JLCPCB recompile and quote gate with an honest manual fallback.
- Complete manual workflow in browsers without WebMCP.

## What Works Today

The contest update supports `draft_board` → focused `inspect_design` → `preview_design_change` → visible **Approve & apply** → `validate_and_export`. Checkpoint links open read-only and never overwrite IndexedDB; continuing or adopting requires an explicit human action. The same app remains fully usable in manual mode when WebMCP is unavailable.

Three boards demonstrate one project-independent compiler:

| Board | Demonstrated result |
| --- | --- |
| Power indicator | Compiles, passes the fabrication gate, and prepares Gerber/BOM/CPL artifacts for a human-controlled download. |
| Environmental monitor | Starts from a new structured brief and completes the bounded engineering workflow with agent inputs visibly unreviewed. |
| PocketRoar Capture Bridge | Compiles an eight-layer engineering candidate and prepares review artifacts while fabrication export and quoting remain blocked. |

PocketRoar's refusal is intentional proof of the product's safety model: an ambitious design can be useful for engineering review without being falsely certified for manufacture.

## Architecture

React and TypeScript own the workspace. Zod validates every project and tool argument. One `compileBoardGraph()` path maps allowlisted primitives to tscircuit; it has no project-name branches. IndexedDB stores capped revision metadata while generated artifacts are regenerated. Page-bound WebMCP tools call the same actions as the UI. Vercel functions independently parse, recompile, validate, and gate manufacturing requests; credentials never enter browser code.

## Testing Instructions

1. Open the live URL in ChatGPT’s in-app browser, or enable `chrome://flags/#enable-webmcp-testing` in Chrome and relaunch.
2. Confirm the header says `WebMCP ready` when the browser exposes `document.modelContext`; otherwise use the complete manual workflow.
3. Open the indicator, create a checkpoint link, and open it in a clean browser profile. Confirm it starts read-only.
4. Continue the checkpoint as a local fork, preview moving D1 with an agent, confirm the revision ID is unchanged, then click **Approve & apply** and observe a new revision.
5. Return the new checkpoint to the original profile. Confirm the common ancestor and semantic diff, then manually adopt it as a new local revision.
6. Prepare a fabrication bundle and confirm the browser requires a visible download click.
7. Open PocketRoar, prepare an engineering bundle, then confirm fabrication export and quoting remain blocked.
8. Load the environmental-monitor sample and confirm its agent-supplied requirements, parts, footprints, and evidence are unreviewed.

No credentials are required.

## Public Demo Link

https://roarcad.vercel.app/

## Public Repository Link

https://github.com/jongan69/RoarCAD

## Demo Video

https://youtu.be/wxrciZWlEIk

The public video is 2:25, 1920×1080, H.264/AAC, with AI narration disclosure enabled.
It uses genuine live-product captures and passed YouTube's copyright and Community
Guidelines checks.

## Screenshot Shot List

1. Power indicator at fabrication-ready with prepared artifacts: `docs/screenshots/indicator-fabrication.jpg`.
2. PocketRoar at engineering readiness with visible blockers: `docs/screenshots/pocketroar-engineering.jpg`.
3. WebMCP-ready PocketRoar workspace: `docs/screenshots/pocketroar-webmcp-engineering.png`.
4. Environmental-monitor generic-board proof: `docs/screenshots/environment-monitor-webmcp.png`.
5. Non-mutating PocketRoar preview: `docs/screenshots/pocketroar-preview.jpg`.
6. Approved immutable PocketRoar revision: `docs/screenshots/pocketroar-applied-revision.jpg`.

## Submission Readiness Notes

- Devpost authentication and registration were verified live on August 26, 2026.
- The accepted `dev` revision passed CI and deployed successfully.
- The original submitted build exposed five tools; the contest update intentionally removes agent-callable apply and requires a new four-tool Chrome and ChatGPT browser acceptance run before publication.
- ChatGPT's in-app browser completed the manual fallback journey without horizontal overflow or application console errors.
- Indicator, PocketRoar, and environmental-monitor screenshots are tracked in the public repository.
- The final local video master is 2:24 at 1920×1080 with audible Grady narration and 234 Whisper-timed caption cards. Its SHA-256 is `b40d8626f7bdceb93daab855df8ec064db786f21b1897386922e05e043c3bcb0`.
- Production is live at `https://roarcad.vercel.app/`, `main` passed CI, and GitHub detects the MIT license.
- The public video was verified through YouTube's anonymous oEmbed endpoint.
- Devpost accepted submission `1154859` on August 26, 2026 at 10:37:25 EDT and live
  readback confirmed the public project at `https://devpost.com/software/roarcad`.

## Known Limitations

- RoarCAD does not execute arbitrary TSX or uploaded KiCad files.
- It does not replace professional schematic, SI/PI, DFM, compliance, or physical validation.
- JLCPCB live quoting remains disabled until the approved endpoint contract is verified.
- PocketRoar is an engineering candidate, not a fabrication-ready or physically validated product.
- The target iPad is identified as an 11-inch iPad Pro, third generation (`iPad13,4`), but iPadOS, cable, UVC, thermal, and sustained-frame evidence remain open.

## TODO Official Form Fields

- `28249` — Submitter Type: `Individual`
- `28250` — Country: `United States`
- `28251` — Organization: leave blank; not applicable
- `28252` — App Status: `New`
- `28253` — Existing-project explanation: leave blank. The repository began August 25, 2026 at 23:34 UTC, after the submission period opened.
- `28254` — Live URL: `https://roarcad.vercel.app/`
- `28255` — Testing instructions: use the eight numbered steps above; no credentials required
- `28256` — Public repository: `https://github.com/jongan69/RoarCAD`
- `28257` — Tested clients: update only after the four-tool Chrome and ChatGPT in-app-browser checkpoint journeys pass against production.
- `28258` — AI tools: `Codex and ChatGPT. Codex assisted research, implementation, debugging, browser acceptance testing, documentation, and submission preparation. ChatGPT supported product exploration and the in-app-browser fallback review.`
- `28259` — Learning: `Significant`
- `28260` — Career AI value: `Yes`
- Demo video URL: `https://youtu.be/wxrciZWlEIk`

## Judging-Criteria Review

- **WebMCP Leverage:** four non-trivial page-bound tools expose bounded engineering work while the absence of agent-callable apply makes the human authorization boundary verifiable.
- **Execution:** the live product compiles three boards, renders PCB and schematic views, creates immutable revisions, runs checks, and prepares internally hashed artifacts.
- **Potential Impact:** visible evidence and manufacturing gates reduce the cost and safety risk of hidden assumptions in AI-assisted hardware design.
- **Creativity & Ambition:** RoarCAD combines browser agents, typed PCB modeling, EDA compilation, provenance, and manufacturing authorization in one human-agent workspace.
