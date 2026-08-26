# Title

RoarCAD

## One-line Summary

A WebMCP PCB workbench where agents draft, humans approve, and unsafe designs cannot reach manufacturing.

## Problem

AI-generated PCB designs can look complete while hiding missing requirements, unverified component evidence, incorrect footprints, stale edits, or unresolved physical constraints. A visual render or clean DRC result is not enough to justify fabrication.

## Solution

RoarCAD is a local-first browser PCB workbench where a person and an AI agent operate the same structured, versioned `BoardGraph`. The agent can draft, inspect, preview, apply, validate, and prepare exports through five page-bound WebMCP tools. The person sees the same requirements, evidence, diff, readiness, artifacts, and manufacturing boundary and retains the approval decisions.

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

https://roarcad-git-dev-jongan69s-projects.vercel.app/

Replace with the verified production alias after explicit production promotion.

## Public Repository Link

https://github.com/jongan69/RoarCAD

## Demo Video

Pending Jonathan’s public YouTube upload of the final approved under-three-minute MP4.

## Screenshot Shot List

1. Power indicator at fabrication-ready with prepared artifacts.
2. PocketRoar at engineering readiness with visible blockers.
3. WebMCP preview before human approval.
4. Immutable revision after approval.
5. Environmental-monitor custom draft with unreviewed agent inputs.
6. PocketRoar fabrication/quote rejection.

## Submission Readiness Notes

- Working `dev` preview and public repository exist.
- Indicator and PocketRoar screenshots exist.
- Final production promotion, browser recording, YouTube URL, rules acknowledgment, and Devpost write/submit remain confirmation gates.

## Known Limitations

- RoarCAD does not execute arbitrary TSX or uploaded KiCad files.
- It does not replace professional schematic, SI/PI, DFM, compliance, or physical validation.
- JLCPCB live quoting remains disabled until the approved endpoint contract is verified.
- PocketRoar is an engineering candidate, not a fabrication-ready or physically validated product.
- The target iPad is identified as an 11-inch iPad Pro, third generation (`iPad13,4`), but iPadOS, cable, UVC, thermal, and sustained-frame evidence remain open.

## TODO Official Form Fields

- Submitter Type: Individual
- Country: United States
- Organization: Not applicable
- App Status: New; the repository was initialized after the submission period opened
- Tested agents/clients: record only the live ChatGPT in-app browser and/or WebMCP-enabled Chrome journeys that pass
- AI tools: Codex and ChatGPT
- Learning level: Significant
- Career AI value: Yes
- Final live URL: pending production promotion
- Final YouTube URL: pending Jonathan upload
