# Title

RoarCAD

## One-line Summary

A WebMCP PCB workbench where agents draft, humans approve, and unsafe designs cannot reach manufacturing.

## Problem

AI-generated PCB designs can look complete while hiding missing requirements, unverified component evidence, incorrect footprints, stale edits, or unresolved physical constraints. A visual render or clean DRC result is not enough to justify fabrication.

## Solution

RoarCAD is a local-first browser PCB workbench where a person and an AI agent operate the same structured, versioned `BoardGraph`. The agent can draft, inspect, preview, apply, validate, and prepare exports through five page-bound WebMCP tools. The person sees the same requirements, evidence, diff, readiness, artifacts, and manufacturing boundary and retains the approval decisions.

## Why WebMCP

PCB work is a poor fit for agents guessing their way through buttons or editing opaque files. WebMCP gives the agent five bounded operations over the exact board revision already open in the browser. That creates a shared, inspectable workflow: the agent can reason over requirements and propose a deterministic change, while the person can see its evidence, semantic diff, generated board, readiness, and manufacturing consequences before approving it.

This was difficult to do safely with ordinary browser automation. A visual agent could move the wrong component, act on a stale revision, or mistake a clean-looking render for manufacturing approval. RoarCAD's schemas, revision hashes, non-mutating previews, and human-only evidence review turn those hidden assumptions into explicit product state.

## Why This Matters

Hardware mistakes cost money and time after a file leaves the browser. RoarCAD makes the agent useful without letting it silently certify supplier data or cross irreversible manufacturing boundaries. The workflow is useful for makers, hardware startups, educators, and engineers who want faster iteration with visible provenance and review gates.

## How We Used AI

The browser agent converts natural-language PCB requests into bounded `BoardGraph` objects and allowlisted change operations. It can inspect evidence and risks, prepare non-mutating previews, and request validation/export preparation. AI-created supplier or datasheet information remains untrusted until reviewed in the visible UI, and no AI tool can quote, order, pay, store shipping details, or accept substitutions.

## How We Used Codex

Codex helped research WebMCP, tscircuit, PCB validation, PocketRoar’s HDMI-to-UVC candidate, and the JLCPCB trust boundary. It implemented and debugged the typed domain model, generic compiler, viewers, immutable revision flow, server-side manufacturing revalidation, tests, deployment, documentation, and submission materials. Jonathan Gan directed the product, claims, safety boundaries, and approval decisions.

## Key Features

- Exactly five WebMCP tools sharing the manual UI’s validated actions.
- Generic 1–10 layer `BoardGraph` with bounded components, pins, nets, footprints, placement, differential pairs, pours, holes, keepouts, and constraints.
- tscircuit PCB and schematic compilation, viewing, checks, and manufacturing exports.
- Deterministic preview hashes, stale-change rejection, and immutable revisions.
- Human-only requirements, evidence, part, and footprint review.
- Engineering versus fabrication readiness with visible blockers.
- Gerber, BOM, placement, Circuit JSON, validation, project, and SHA-256 manifest bundles.
- Server-side JLCPCB recompile and quote gate with an honest manual fallback.
- Complete manual workflow in browsers without WebMCP.

## What Works Today

The deployed app completes the full `draft_board` → `inspect_design` → `preview_design_change` → `apply_design_change` → `validate_and_export` journey in WebMCP-enabled Chrome. The same app remains fully usable in manual mode when WebMCP is unavailable.

Three boards demonstrate one project-independent compiler:

| Board | Demonstrated result |
| --- | --- |
| Power indicator | Compiles, passes the fabrication gate, and prepares Gerber/BOM/CPL artifacts for a human-controlled download. |
| Environmental monitor | Starts from a new structured brief and completes the five-tool engineering workflow with agent inputs visibly unreviewed. |
| PocketRoar Capture Bridge | Compiles an eight-layer engineering candidate and prepares review artifacts while fabrication export and quoting remain blocked. |

PocketRoar's refusal is intentional proof of the product's safety model: an ambitious design can be useful for engineering review without being falsely certified for manufacture.

## Architecture

React and TypeScript own the workspace. Zod validates every project and tool argument. One `compileBoardGraph()` path maps allowlisted primitives to tscircuit; it has no project-name branches. IndexedDB stores capped revision metadata while generated artifacts are regenerated. Page-bound WebMCP tools call the same actions as the UI. Vercel functions independently parse, recompile, validate, and gate manufacturing requests; credentials never enter browser code.

## Testing Instructions

1. Open the live URL in ChatGPT’s in-app browser, or enable `chrome://flags/#enable-webmcp-testing` in Chrome and relaunch.
2. Confirm the header says `WebMCP ready` when the browser exposes `document.modelContext`; otherwise use the complete manual workflow.
3. Open the indicator, preview moving D1, confirm the revision ID is unchanged, approve it, and observe a new revision.
4. Prepare a fabrication bundle and confirm the browser requires a visible download click.
5. Open PocketRoar, prepare an engineering bundle, then confirm fabrication export and quoting remain blocked.
6. In the manual BoardGraph editor, load the environmental-monitor sample, draft it, and confirm its agent-supplied requirements, parts, footprints, and evidence are unreviewed.

No credentials are required.

## Public Demo Link

https://roarcad.vercel.app/

## Public Repository Link

https://github.com/jongan69/RoarCAD

## Demo Video

Pending Jonathan’s public YouTube upload of the final approved under-three-minute MP4.

## Screenshot Shot List

1. Power indicator at fabrication-ready with prepared artifacts: `docs/screenshots/indicator-fabrication.jpg`.
2. PocketRoar at engineering readiness with visible blockers: `docs/screenshots/pocketroar-engineering.jpg`.
3. WebMCP-ready PocketRoar workspace: `docs/screenshots/pocketroar-webmcp-engineering.png`.
4. Environmental-monitor generic-board proof: `docs/screenshots/environment-monitor-webmcp.png`.
5. Video frame: non-mutating preview before human approval.
6. Video frame: PocketRoar fabrication/quote rejection.

## Submission Readiness Notes

- Devpost authentication and registration were verified live on August 26, 2026.
- The accepted `dev` revision passed CI and deployed successfully.
- WebMCP-enabled Chrome exposed exactly five tools and completed the full generic-board journey with no application console errors.
- ChatGPT's in-app browser completed the manual fallback journey without horizontal overflow or application console errors.
- Indicator, PocketRoar, and environmental-monitor screenshots are tracked in the public repository.
- Production is live at `https://roarcad.vercel.app/`, `main` passed CI, and GitHub detects the MIT license.
- The final public YouTube URL and explicit final Devpost confirmation remain open gates.

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
- `28255` — Testing instructions: use the six numbered steps above; no credentials required
- `28256` — Public repository: `https://github.com/jongan69/RoarCAD`
- `28257` — Tested clients: `Google Chrome 149+ with WebMCP enabled for all five tools; ChatGPT in-app browser for the complete manual progressive-enhancement workflow.`
- `28258` — AI tools: `Codex and ChatGPT. Codex assisted research, implementation, debugging, browser acceptance testing, documentation, and submission preparation. ChatGPT supported product exploration and the in-app-browser fallback review.`
- `28259` — Learning: `Significant`
- `28260` — Career AI value: `Yes`
- Demo video URL: pending the final public YouTube upload

## Judging-Criteria Review

- **WebMCP Leverage:** five non-trivial page-bound tools expose a complete, stateful engineering workflow rather than a prompt wrapper.
- **Execution:** the live product compiles three boards, renders PCB and schematic views, creates immutable revisions, runs checks, and prepares internally hashed artifacts.
- **Potential Impact:** visible evidence and manufacturing gates reduce the cost and safety risk of hidden assumptions in AI-assisted hardware design.
- **Creativity & Ambition:** RoarCAD combines browser agents, typed PCB modeling, EDA compilation, provenance, and manufacturing authorization in one human-agent workspace.
