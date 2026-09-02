# Title

RoarCAD

## One-line Summary

RoarCAD is a browser workbench where people and AI design circuit boards together, save tamper-evident versions, and keep manufacturing under human control.

## Problem

PocketRoar Mobile needed a direct cable connection from a Sony or other dedicated camera into an iPhone. The goal was to let the iPhone see the camera's live picture so it could monitor, record, and eventually stream it.

Sony cameras can send video using **UVC**, short for USB Video Class. UVC is the common language used by many USB webcams. Apple lets USB-C iPads expose those external cameras to apps, but does not document the same native camera-input path for iPhone. An iPad can already accept this kind of feed without a custom circuit board. The iPhone is the missing host.

The product benchmark is Accsoon SeeMo 4K. It accepts **HDMI**—the digital video signal sent by many cameras—compresses that video as **H.264**, a widely used format that makes video smaller, and sends it over USB to Accsoon's own iPhone app. PocketRoar needs the same basic outcome: translate a camera's output into a form that PocketRoar Mobile can receive on an iPhone. That translation needs dedicated electronics, so this could not be solved by an iPhone app alone.

That exposed a second problem. AI-generated circuit boards can look finished while still hiding missing requirements, unverified parts, incorrect physical pad layouts, old edits, or parts that cannot physically fit together. A clean picture or automated rule check does not prove a board is safe to manufacture. One missed detail can cause an expensive **board spin**, which means paying to manufacture another corrected version.

## Solution

RoarCAD is a local-first circuit-board review and handoff system built to develop that iPhone capture bridge without hiding the remaining risk. **Local-first** means the project stays in the user's browser unless the user chooses to share it.

The workflow is like passing a save file to a teammate. One person shares a protected checkpoint. A teammate opens it without changing their own work, creates a separate copy, and continues with an AI agent. The first person can then compare the returned board with the version both people started from. Nothing is silently merged. The person must choose whether to adopt the returned board.

RoarCAD gives the AI four narrow WebMCP tools to draft, inspect, preview, and validate. The AI cannot apply its own proposal. Only the visible **Approve & apply** button can create a new saved version.

## Plain-English Definitions

- **PCB (printed circuit board):** the flat board that holds electronic parts and connects them with copper paths.
- **Agent:** AI software that can reason about a task and call approved tools.
- **WebMCP:** a browser standard that lets a web page offer named, structured tools to an AI. The AI receives exact data instead of guessing from pixels and mouse clicks.
- **Revision:** one saved version of a project.
- **Immutable:** unable to be secretly changed after it is saved. RoarCAD creates a new revision instead of rewriting an old one.
- **Checkpoint:** a portable package containing one board revision and its history information. It works like a save point that can be handed to another person.
- **Read-only:** viewable but not editable. Incoming checkpoints always start this way.
- **Fork:** a separate working copy made from a checkpoint. Changes to the fork do not change the sender's project.
- **Common ancestor:** the last revision that two copies share. It tells RoarCAD where the work split.
- **Semantic diff:** a list of meaningful engineering changes, such as a moved component or changed connection, rather than a list of changed text characters.
- **Adopt:** deliberately copy an incoming board snapshot into the local project as a new revision.
- **Provenance:** the recorded history of where a revision came from.
- **Schema:** a set of rules describing what valid data must contain and what type each value must be.
- **Hash:** a short digital fingerprint calculated from data. If the data changes, the fingerprint changes.
- **SHA-256:** the specific, widely used fingerprint algorithm RoarCAD uses for revisions, checkpoints, and export manifests.
- **Tamper-evident:** able to show that content changed. A hash proves unchanged content; it does not prove who sent it.
- **BoardGraph:** RoarCAD's structured map of a board, including parts, pins, connections, layers, placement, holes, and safety constraints.
- **Component:** a physical electronic part, such as a resistor, connector, or chip.
- **Pin:** one electrical contact on a component.
- **Net:** a named electrical connection joining one or more pins.
- **Footprint:** the exact copper pads and physical space a component needs on the board.
- **Differential pair:** two carefully matched copper paths that carry one high-speed signal together and reject noise.
- **Copper pour:** a larger filled copper area, often used for ground or power.
- **Keepout:** an area where parts or copper are not allowed.
- **Compile:** turn RoarCAD's structured board description into diagrams, checks, and manufacturing files.
- **Background worker:** a browser helper that does heavy calculations separately, so the page can still respond. RoarCAD uses one for board compilation and export, with progress, cancellation, and a time limit.
- **tscircuit:** the open-source electronics toolchain RoarCAD uses to compile and render boards.
- **DRC (design-rule check):** an automated check for layout problems such as copper paths being too close together. Passing DRC does not prove the whole product works.
- **Evidence:** a source or test result supporting an engineering claim, such as a manufacturer datasheet or physical measurement.
- **Engineering candidate:** a design useful for review and testing that still has known unanswered questions.
- **Fabrication-ready:** a design that has passed RoarCAD's required evidence and validation gates for preparing manufacturing files.
- **Preview:** a proposed change shown before it is saved.
- **Non-mutating:** unable to change stored project data. Agent previews are non-mutating.
- **Stale change:** a proposal created from an older revision after the board has already changed. RoarCAD rejects it.
- **JSON:** a common text format for structured data.
- **IndexedDB:** the database built into modern browsers. RoarCAD uses it for local project history.
- **gzip:** a standard way to compress data so it takes less space.
- **base64url:** a way to turn compressed data into characters that are safe inside a web link.
- **URL fragment:** the part of a link after `#`. Browsers do not send this fragment to the web server, so checkpoint data stays client-side.
- **Server-side:** code that runs on a hosted server instead of inside the user's browser.
- **Netlify Function:** a small server-side program. RoarCAD uses one to independently recheck manufacturing requests. The Vercel fallback uses the same underlying logic.
- **HDMI:** a digital connection that carries video and often audio from cameras and other devices.
- **UVC (USB Video Class):** the standard language that makes many USB cameras behave like webcams.
- **H.264:** a common video-compression format that reduces the amount of data needed to carry video.
- **MIPI CSI-2:** a fast chip-to-chip connection commonly used to move camera pixels inside hardware.
- **USB-C:** the reversible connector shape. The connector alone does not guarantee that a device supports every USB feature or video format.
- **Gerber files:** the layer-by-layer drawing files a PCB factory uses to make the board.
- **BOM (bill of materials):** the shopping list of electronic parts.
- **CPL or placement file:** the list telling an assembly machine where each part goes and how it is rotated.
- **SI (signal integrity):** whether fast electrical signals arrive clearly enough to be understood.
- **PI (power integrity):** whether every chip receives clean, stable power.
- **DFM (design for manufacturing):** checking that a factory can reliably build the design.

## Why WebMCP

Circuit-board work is a poor fit for AI that guesses by looking at buttons. A wrong click could move the wrong part or edit an old version. WebMCP gives the agent four clearly named tools over the exact revision already open in the browser. The agent can inspect one small area, propose a repeatable change, and explain the result. The person sees the meaningful difference and remains the only one who can save it.

Ordinary browser automation mostly sees pixels and clickable areas. RoarCAD instead gives the AI validated data. Schemas reject malformed inputs, hashes detect changed content, previews cannot change storage, and evidence stays untrusted until a person reviews it.

## Why This Matters

Software can often be fixed after release. Hardware mistakes become physical objects. They cost parts, factory time, shipping, and another board spin. RoarCAD helps people reach a reviewable design faster while preserving who changed what and why. It also keeps the final manufacturing decision with a person.

## How We Used AI

The browser agent turns plain-English requests into a bounded `BoardGraph`, RoarCAD's structured board map. **Bounded** means the agent can only use supported parts and operations. It can inspect risks, prepare a preview, and ask RoarCAD to run validation. Information suggested by AI stays marked as unreviewed until a person checks it. No AI tool can download manufacturing files, request a quote, place an order, pay, store shipping details, or accept replacement parts.

## How We Used Codex

Codex helped research WebMCP, tscircuit, PCB validation, PocketRoar’s HDMI-to-iPhone bridge, the SeeMo 4K comparison, and the JLCPCB trust boundary. It implemented and debugged the typed domain model, generic compiler, viewers, immutable revision flow, server-side manufacturing revalidation, tests, deployment, documentation, and submission materials. Jonathan Gan directed the product, claims, safety boundaries, and approval decisions.

## Key Features

- Four focused WebMCP tools that use the same checked actions as the buttons in the app. There is no AI-callable apply tool.
- Checkpoint links and JSON files for safe review, separate forks, meaningful comparison, return, and deliberate adoption.
- A generic 1–10 layer `BoardGraph` covering parts, pins, connections, physical pad layouts, placement, copper, holes, and safety rules.
- PCB and schematic diagrams, automated checks, and manufacturing-file preparation through tscircuit.
- Plain-English definitions for every supported part kind, with exact part and footprint details retained for technical review.
- Digital fingerprints for previews and revisions, plus rejection of proposals based on old work.
- Human-only review of requirements, evidence, parts, and footprints.
- Clear separation between an engineering candidate and a fabrication-ready board.
- Gerber factory drawings, BOM part lists, CPL placement lists, structured project data, validation reports, and SHA-256 manifests.
- A server-side manufacturing recheck so changing a browser label cannot unlock a quote.
- A complete manual workflow when WebMCP is unavailable.

## What Works Today

The contest update supports `draft_board` → focused `inspect_design` → `preview_design_change` → visible **Approve & apply** → `validate_and_export`. Checkpoint links open read-only and never overwrite IndexedDB; continuing or adopting requires an explicit human action. The same app remains fully usable in manual mode when WebMCP is unavailable.

Three boards demonstrate one project-independent compiler:

| Board | Demonstrated result |
| --- | --- |
| Power indicator | Compiles, passes the fabrication gate, and prepares Gerber/BOM/CPL artifacts for a human-controlled download. |
| Environmental monitor | Starts from a new structured brief and completes the bounded engineering workflow with agent inputs visibly unreviewed. |
| PocketRoar Capture Bridge | Compiles a 2,566-element eight-layer feasibility slice with zero compiler/checker errors and prepares review artifacts while fabrication export and quoting remain blocked. |

PocketRoar is the deliberate stress test. The current eight-layer graph explores clean non-HDCP HDMI into a Toshiba `TC358743XBG`, four-lane MIPI CSI-2 into an Infineon `CYUSB3065-BZXC` CX3 bridge, then UVC over USB-C. The repaired feasibility slice uses exact upstream KiCad connector geometry, documented bridge-critical BGA balls, the correct 19.2 MHz CX3 clock part, net-class widths, and explicit via-in-pad escapes. RoarCAD deterministically produces 2,566 Circuit JSON elements with zero compiler or independent checker errors.

That is useful digital evidence, not a claim that the complete product works. Only eleven routes are modeled; the full support schematic, differential impedance/coupling/skew, power behavior, firmware, manufacturing process, and physical hardware remain unproven. The research also exposed a decisive product limitation: standard UVC is a supported native path on USB-C iPads, not a demonstrated iPhone ingest path.

The intended PocketRoar product therefore needs a SeeMo-class architecture—HDMI ingest, hardware video compression, an iPhone-compatible USB/accessory transport, and a native PocketRoar Mobile integration—rather than merely shipping the current UVC candidate. RoarCAD blocks fabrication because that transport architecture, connector mechanics, power, firmware, signal integrity, licensing, and physical iPhone evidence remain unresolved. That refusal is intentional proof that an ambitious design can be useful without being falsely certified for manufacture.

RoarCAD also begins translating the engineering surface for newcomers. The app explains what each general kind of part normally does and uses clearer labels such as **How it works**, **Parts**, and **Connections**, while preserving exact manufacturer data, footprints, nets, evidence, and validation results for expert audit. It never guesses a part's exact purpose from its type alone.

## Architecture

React builds the visible interface, and TypeScript helps catch incorrect data while the code is being written. Zod checks every project and tool input at runtime. One `compileBoardGraph()` function translates every supported board into tscircuit; there is no hidden special-case compiler for PocketRoar. IndexedDB stores limited revision history inside the browser. The WebMCP tools call the same checked actions as the buttons. A native Netlify Function independently reads, compiles, and validates manufacturing requests using the same handlers as the Vercel fallback. Private credentials never enter browser code.

The Netlify deployment needs no hosted database or AI API key. Netlify serves the website and its guides, while the board remains in the browser. The server reads manufacturing requests with a strict byte limit, rejects unsupported methods, and does not cache private responses. Live provider quoting stays disabled; the app does not invent a price or place an order.

Heavy board calculations run in a native browser worker, using the same compiler as the server. This keeps the page usable while an engineering export runs. A person can cancel, and changing revisions discards obsolete work. Checkpoint links also work when opened in an existing tab; integrity checks finish before editing is allowed.

WebMCP is a tool connection inside a browser page, not a remote MCP-server address. A coding agent needs a browser integration that exposes these page tools. RoarCAD does not claim that pasting its website URL into any agent's MCP settings will work.

## Verified Software Release

The Netlify production release is commit `3895452567e767bbf2df5c1bb1ac46766af48fa6`.
Its build, hosting-provider status, public HTTP checks, and live browser checks
are separately recorded in `docs/NETLIFY_RELEASE.md`.

- **CI (continuous integration)** automatically checked types, formatting,
  all 38 tests across 12 files, and the production build.
- The production **smoke test**, a quick check of essential behavior, passed
  the website, six guides, discovery files, and manufacturing safety boundary.
- Live production WebMCP preview preserved the saved revision. The visible
  approval button created a new revision, and background export prepared
  fabrication artifacts while still requiring a human download click.
- On the Netlify release candidate, an **end-to-end test** followed the whole
  share → backup → fork → return → adopt journey across isolated origins.
  Older local history and incoming provenance survived adoption; incoming
  approvals did not survive as trusted claims.
- PocketRoar's engineering bundle downloaded successfully. All nine file
  fingerprints and the manifest fingerprint matched; the bundle contains
  2,566 Circuit JSON elements and zero compiler errors. Its 159 review/check
  warnings remain visible, and fabrication is refused. This is digital
  verification of the modeled slice, not proof of working iPhone hardware.
- Mobile checks at 390×844 found no sideways overflow and a stable schematic
  height. Chrome also passed the manual preview, approval, and worker-export
  journey. A blind first-call AI-selection benchmark is not yet measured.

### Earlier Vercel evidence

- A **smoke test** is a quick check that the most important parts of a product start and respond. RoarCAD's public production URL passed its clean-browser smoke test.
- An **end-to-end test** follows a whole user journey across the real product. RoarCAD passed a production A → B → A handoff: one browser shared a checkpoint, another continued it, and the first reviewed and adopted the returned revision.
- **CI (continuous integration)** is an automated robot that checks every proposed code change. RoarCAD's CI passed type checking, formatting and code-quality checks, all Bun tests, and the production build.
- A **regression test** proves that an old bug did not return. The 390×844 mobile test passed without sideways scrolling or an endlessly growing schematic.
- Thirty focused tests across nine files covered the board model, checkpoints, WebMCP tools, electronics compilation, browser storage, manufacturing gates, and interface contracts.
- Chrome 149 executed the four live WebMCP tools. ChatGPT's in-app browser completed the clean-profile checkpoint journey and the manual fallback interface.

## Testing Instructions

1. Open the live URL in ChatGPT’s in-app browser, or enable `chrome://flags/#enable-webmcp-testing` in Chrome and relaunch.
2. Confirm the header says `WebMCP ready` when the browser exposes `document.modelContext`; otherwise use the complete manual workflow.
3. Open the indicator, create a checkpoint link, and open it in a clean browser profile. Confirm it starts read-only.
4. Click **Download local backup** and confirm the file is saved before choosing **Continue as local fork**. Preview moving D1 with an agent, confirm the revision ID is unchanged, then click **Approve & apply** and observe a new revision.
5. Return the new checkpoint to the original profile. Confirm the common ancestor and semantic diff, then manually adopt it as a new local revision.
6. Select the bundled indicator to test fabrication export. Incoming checkpoint approvals are intentionally reset, so an adopted board is not automatically fabrication-ready. Confirm the browser requires a visible download click.
7. Open PocketRoar, prepare an engineering bundle, then confirm fabrication export and quoting remain blocked.
8. Load the environmental-monitor sample and confirm its agent-supplied requirements, parts, footprints, and evidence are unreviewed.

No credentials are required.

## Public Demo Link

https://roarcad.netlify.app/

Vercel remains available at https://roarcad.vercel.app/ so existing browser-local
projects are not stranded. This document is the updated draft; changing the
live Devpost entry still requires Jonathan's final confirmation.

## Public Repository Link

https://github.com/jongan69/RoarCAD

## Demo Video

https://youtu.be/wxrciZWlEIk

The public video is 2:25, 1920×1080, H.264/AAC, with AI narration disclosure enabled.
It uses genuine live-product captures and passed YouTube's copyright and Community
Guidelines checks.

It predates the four-tool checkpoint workflow and zero-error PocketRoar repair.
The replacement script and current screenshot inventory are in
`docs/PRESENTATION_REPLACEMENT.md`; a new video has not yet been rendered or
published. Do not present the historical video as proof of the current release.

## Screenshot Shot List

1. Returned checkpoint, common ancestor, and semantic diff:
   `docs/screenshots/netlify-checkpoint-review.png`.
2. Manual adoption, retained three-revision history, and incoming trust reset:
   `docs/screenshots/netlify-checkpoint-adopted.png`.
3. Production indicator at fabrication-ready with an explicit package download:
   `docs/screenshots/netlify-indicator-fabrication.png`.
4. Current PocketRoar `c204a71b354abeff`, **0 errors**, and the iPhone blocker:
   `docs/screenshots/netlify-pocketroar-engineering.png`.

Older `pocketroar-*.jpg`, `pocketroar-webmcp-engineering.png`,
`indicator-fabrication.jpg`, and `environment-monitor-webmcp.png` are historical
evidence, not current-release screenshots. The replacement assets above have
not been uploaded to Devpost.

## Submission Readiness Notes

- September 2 Netlify migration: native Node function packaging, live HTTP
  smoke, inspection, pagination, non-mutating preview, and mobile layout passed
  on the `dev` deployment. An authorized disposable A → B → A handoff passed,
  including a saved backup, immutable adoption, retained history, and downgraded
  trust. Same-tab checkpoint navigation was repaired and retested. Final
  production verification subsequently passed as recorded above. No Netlify-specific award is claimed:
  the official prize feed still lists ten equal winners and no tracks.
- September 2 live Devpost readback confirmed the project is published and
  still uses the Vercel URL. The Netlify/zero-error update in this repository
  has not been published to Devpost.

- Devpost authentication, registration, and official form requirements were
  verified again on September 2, 2026.

### Historical Vercel evidence
- The zero-error PocketRoar release is on production `main` at commit `16f3e1600998a2a35644e32a0dbc7b388de81cce`. GitHub Actions run `33217786830` passed typecheck, Biome, every Bun test, and the production build; Vercel deployed the same commit as production deployment `roarcad-jp63mhv62-jongan69s-projects.vercel.app` and marked it `READY`.
- The release candidate's in-app-browser smoke showed PocketRoar revision `c204a71b354abeff`, exact corrected connector/clock data, four WebMCP tools, a bounded validation inspection, and **0 viewer errors**. A clean Chrome production profile independently loaded `https://roarcad.vercel.app/` with `WebMCP ready` and the fabrication-ready indicator.
- Production exposes exactly four WebMCP tools. `apply_design_change` is absent, preview output is bounded to the six safe summary fields, and only the visible **Approve & apply** control creates a revision.
- A clean production A → B → A handoff passed across Chrome and ChatGPT's in-app browser: read-only checkpoint open, explicit backup-gated fork, live inspection and preview, human apply, common-ancestor return diff, and manual immutable adoption.
- The 390×844 production regression passed without horizontal overflow or application console errors.
- Thirty tests passed across nine files in the complete remote CI gate.
- Indicator, PocketRoar, and environmental-monitor screenshots are tracked in the public repository.
- The final local video master is 2:24 at 1920×1080 with audible Grady narration and 234 Whisper-timed caption cards. Its SHA-256 is `b40d8626f7bdceb93daab855df8ec064db786f21b1897386922e05e043c3bcb0`.
- Production is live at `https://roarcad.vercel.app/`, `main` passed CI, and GitHub detects the MIT license.
- The public video was verified through YouTube's anonymous oEmbed endpoint.
- Devpost accepted submission `1154859` on August 26, 2026 at 10:37:25 EDT and live
  readback confirmed the public project at `https://devpost.com/software/roarcad`.
- On August 28, Devpost project version 3 replaced the original five-tool writeup with the checkpoint-first architecture, production proof, tested-client evidence, value case, and the honest PocketRoar/Apple-host origin story; a post-submit live readback confirmed the project remained published and submitted.
- Devpost project version 4 corrected that origin story to the actual iPhone requirement: USB-C iPad is the already-supported UVC control case, SeeMo 4K is the functional comparison, and the current CX3/UVC graph is explicitly an unfinished engineering study rather than the final iPhone bridge.
- Devpost project version 5 rewrote the story in simple English, added a plain-language glossary for the browser, PCB, video, revision, and manufacturing terms, and preserved the full technical architecture and evidence limits. Live readback confirmed the simplified tagline, glossary, iPhone premise, and human-only approval boundary.
- The next Devpost revision must add the zero-error PocketRoar paragraph already present in this canonical draft and replace the stale PocketRoar screenshot. Do not re-submit until the updated public page is read back and the replacement image is visually checked.

## Known Limitations

- RoarCAD does not execute arbitrary TSX or uploaded KiCad files.
- It does not replace professional schematic, SI/PI, DFM, compliance, or physical validation.
- JLCPCB live quoting remains disabled until the approved endpoint contract is verified.
- PocketRoar is an engineering candidate, not a fabrication-ready or physically validated product.
- PocketRoar's zero-error feasibility slice is not a complete schematic; differential-pair impedance, coupling, and skew remain unverified.
- The current CX3/UVC graph is not the final iPhone bridge. It does not yet implement SeeMo-class H.264 compression or an app-specific iPhone accessory transport.
- iPhone ingest, accessory/compliance requirements, cable behavior, thermals, sustained frames, reconnects, and simultaneous cellular streaming all require physical proof before compatibility is claimed.

## What's Next

The next RoarCAD usability step is clickable schematic auditing: select a part, read its general definition, see its exact BoardGraph connections, and keep proposed design intent separate from reviewed evidence. Functional drag-and-drop blocks such as USB power or a status light are research ideas, not shipped features; any future visual edit must still become a typed preview and wait for visible human approval.

For PocketRoar, the next gate is transport proof on the exact Sony camera, iPhone, iOS version, cable, and PocketRoar app. After that comes a complete reviewed schematic, zero unexplained ERC and DRC findings, vendor-model power and high-speed analysis, fabricator DFM review, current-limited prototype bring-up, and sustained physical-device testing. A clean render or manufacturing-file export cannot replace those gates.

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
- `28254` — Live URL: `https://roarcad.netlify.app/`
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
