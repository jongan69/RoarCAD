# Title

RoarCAD

## One-line Summary

Git-like PCB handoff for people and their agents, with immutable checkpoints and human-only manufacturing gates.

## Problem

PocketRoar Mobile needed a direct, wired video path from a Sony or other dedicated camera into an iPhone so the phone could monitor, record, and ultimately stream that feed. Sony cameras can expose USB Video Class output in USB Streaming mode, but Apple documents external UVC camera access for USB-C iPads—not iPhones—and explicitly says only iPad supports external cameras through AVFoundation. An iPad can already consume that class of source without a custom board; the iPhone is the missing host.

The product benchmark is Accsoon SeeMo 4K. It accepts a camera's HDMI output, compresses the video as H.264, sends it over USB, and exposes it inside Accsoon's own iOS app. PocketRoar needs the same core outcome: bridge clean camera HDMI into a format and accessory transport that PocketRoar Mobile can receive on an iPhone. That is why I needed to design a PCB rather than treat this as an app-only integration.

That exposed a second problem. AI-generated PCB designs can look complete while hiding missing requirements, unverified component evidence, incorrect footprints, stale edits, or unresolved physical constraints. A visual render or clean DRC result is not enough to justify fabrication, especially when a bad handoff can become an expensive board spin.

## Solution

RoarCAD is a local-first, agent-native PCB review and handoff system built to develop that iPhone capture bridge without hiding the remaining engineering risk. One engineer shares an immutable checkpoint, a coauthor continues it with an agent, and the original author reviews the common ancestry and semantic diff before adopting the returned revision. Four page-bound WebMCP tools let agents draft, inspect, preview, and validate designs; only the visible human approval control can create the proposed revision.

## Why WebMCP

PCB work is a poor fit for agents guessing their way through buttons or editing opaque files. WebMCP gives the agent four bounded operations over the exact board revision already open in the browser. The agent can reason over a focused slice of requirements or design state and propose a deterministic change, while the person sees the semantic diff and remains the only authority that can apply it.

This was difficult to do safely with ordinary browser automation. A visual agent could move the wrong component, act on a stale revision, or mistake a clean-looking render for manufacturing approval. RoarCAD's schemas, revision hashes, non-mutating previews, and human-only evidence review turn those hidden assumptions into explicit product state.

## Why This Matters

Hardware mistakes cost money and time after a file leaves the browser. RoarCAD shortens the path from an engineering question to a reviewable board while preserving the provenance and approval trail needed to reject unsafe exports. Teams can hand work to a coauthor or agent without deploying accounts, a database, or realtime infrastructure, and without letting the agent silently certify supplier data or cross irreversible manufacturing boundaries.

## How We Used AI

The browser agent converts natural-language PCB requests into bounded `BoardGraph` objects and allowlisted change operations. It can inspect evidence and risks, prepare non-mutating previews, and request validation/export preparation. AI-created supplier or datasheet information remains untrusted until reviewed in the visible UI, and no AI tool can quote, order, pay, store shipping details, or accept substitutions.

## How We Used Codex

Codex helped research WebMCP, tscircuit, PCB validation, PocketRoar’s HDMI-to-iPhone bridge, the SeeMo 4K comparison, and the JLCPCB trust boundary. It implemented and debugged the typed domain model, generic compiler, viewers, immutable revision flow, server-side manufacturing revalidation, tests, deployment, documentation, and submission materials. Jonathan Gan directed the product, claims, safety boundaries, and approval decisions.

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

PocketRoar is the deliberate stress test. The current eight-layer graph explores clean non-HDCP HDMI into a Toshiba `TC358743XBG`, four-lane MIPI CSI-2 into an Infineon `CYUSB3065-BZXC` CX3 bridge, then UVC over USB-C. RoarCAD compiles it and produces engineering-review artifacts, but the research exposed a decisive limitation: standard UVC is a supported native path on USB-C iPads, not a demonstrated iPhone ingest path.

The intended PocketRoar product therefore needs a SeeMo-class architecture—HDMI ingest, hardware video compression, an iPhone-compatible USB/accessory transport, and a native PocketRoar Mobile integration—rather than merely shipping the current UVC candidate. RoarCAD blocks fabrication because that transport architecture, connector mechanics, power, firmware, signal integrity, licensing, and physical iPhone evidence remain unresolved. That refusal is intentional proof that an ambitious design can be useful without being falsely certified for manufacture.

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
- The checkpoint-first release is on production `main` at merge commit `4f3e1b42140b34ca905491ac9771d26cd2b5b922`; GitHub Actions run `33205270075` passed the full test, build, typecheck, and Biome gate before Vercel deployment `6147517275` succeeded.
- Production exposes exactly four WebMCP tools. `apply_design_change` is absent, preview output is bounded to the six safe summary fields, and only the visible **Approve & apply** control creates a revision.
- A clean production A → B → A handoff passed across Chrome and ChatGPT's in-app browser: read-only checkpoint open, explicit backup-gated fork, live inspection and preview, human apply, common-ancestor return diff, and manual immutable adoption.
- The 390×844 production regression passed without horizontal overflow or application console errors.
- Twenty-eight targeted local tests passed across seven files, and the complete remote CI gate passed independently.
- Indicator, PocketRoar, and environmental-monitor screenshots are tracked in the public repository.
- The final local video master is 2:24 at 1920×1080 with audible Grady narration and 234 Whisper-timed caption cards. Its SHA-256 is `b40d8626f7bdceb93daab855df8ec064db786f21b1897386922e05e043c3bcb0`.
- Production is live at `https://roarcad.vercel.app/`, `main` passed CI, and GitHub detects the MIT license.
- The public video was verified through YouTube's anonymous oEmbed endpoint.
- Devpost accepted submission `1154859` on August 26, 2026 at 10:37:25 EDT and live
  readback confirmed the public project at `https://devpost.com/software/roarcad`.
- On August 28, Devpost project version 3 replaced the original five-tool writeup with the checkpoint-first architecture, production proof, tested-client evidence, value case, and the honest PocketRoar/Apple-host origin story; a post-submit live readback confirmed the project remained published and submitted.
- Devpost project version 4 corrected that origin story to the actual iPhone requirement: USB-C iPad is the already-supported UVC control case, SeeMo 4K is the functional comparison, and the current CX3/UVC graph is explicitly an unfinished engineering study rather than the final iPhone bridge.

## Known Limitations

- RoarCAD does not execute arbitrary TSX or uploaded KiCad files.
- It does not replace professional schematic, SI/PI, DFM, compliance, or physical validation.
- JLCPCB live quoting remains disabled until the approved endpoint contract is verified.
- PocketRoar is an engineering candidate, not a fabrication-ready or physically validated product.
- The current CX3/UVC graph is not the final iPhone bridge. It does not yet implement SeeMo-class H.264 compression or an app-specific iPhone accessory transport.
- iPhone ingest, accessory/compliance requirements, cable behavior, thermals, sustained frames, reconnects, and simultaneous cellular streaming all require physical proof before compatibility is claimed.

## Inspiration Sources

- [Apple: Support external cameras in your iPadOS app](https://developer.apple.com/videos/play/wwdc2023/10106/)
- [Sony: Connecting via HDMI/UVC](https://helpguide.sony.net/promobile/mc/v1/en/contents/connecting_hdmi_uvc.html)
- [Accsoon SeeMo 4K iOS HDMI Adapter](https://accsoonusa.com/accsoon-seemo-4k-ios-hdmi-adapter/)
- [Accsoon SeeMo 4K user manual](https://accsoon.com/wp-content/uploads/2024/10/SeeMo-4K-User-Manual-ENCN.pdf)

## Official Form Fields

- `28249` — Submitter Type: `Individual`
- `28250` — Country: `United States`
- `28251` — Organization: leave blank; not applicable
- `28252` — App Status: `New`
- `28253` — Existing-project explanation: leave blank. The repository began August 25, 2026 at 23:34 UTC, after the submission period opened.
- `28254` — Live URL: `https://roarcad.vercel.app/`
- `28255` — Testing instructions: use the eight numbered steps above; no credentials required
- `28256` — Public repository: `https://github.com/jongan69/RoarCAD`
- `28257` — Tested clients: `Chrome 149 with WebMCP testing enabled and ChatGPT's in-app browser. Both completed the production checkpoint journey; Chrome executed the four live tools and ChatGPT completed the clean-profile handoff and manual fallback surfaces.`
- `28258` — AI tools: `Codex and ChatGPT. Codex assisted research, implementation, debugging, browser acceptance testing, documentation, and submission preparation. ChatGPT supported product exploration and the in-app-browser fallback review.`
- `28259` — Learning: `Significant`
- `28260` — Career AI value: `Yes`
- Demo video URL: `https://youtu.be/wxrciZWlEIk`

## Judging-Criteria Review

- **WebMCP Leverage:** four non-trivial page-bound tools expose bounded engineering work while the absence of agent-callable apply makes the human authorization boundary verifiable.
- **Execution:** the live product compiles three boards, renders PCB and schematic views, creates immutable revisions, runs checks, and prepares internally hashed artifacts.
- **Potential Impact:** visible evidence and manufacturing gates reduce the cost and safety risk of hidden assumptions in AI-assisted hardware design.
- **Creativity & Ambition:** RoarCAD combines browser agents, typed PCB modeling, EDA compilation, provenance, and manufacturing authorization in one human-agent workspace.
