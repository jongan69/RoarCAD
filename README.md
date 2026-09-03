# RoarCAD

RoarCAD is a local-first browser PCB workbench where people and AI agents operate the same versioned `BoardGraph`. It supports custom 1–10 layer boards, exact parts and pin maps, library or embedded footprints, nets, differential pairs, placement, checks, editable PCB and schematic views, engineering/fabrication exports, four page-bound [WebMCP](https://developer.chrome.com/docs/ai/webmcp/) tools, and immutable team checkpoints.

- [Netlify app](https://roarcad.netlify.app)
- [Vercel fallback and existing local projects](https://roarcad.vercel.app)
- [Public source](https://github.com/jongan69/RoarCAD)
- [Safe AI PCB design guide](https://roarcad.netlify.app/guides/safe-ai-pcb-design/)
- [RoarCAD, Flux, and Quilter comparison](https://roarcad.netlify.app/compare/flux-quilter/)
- [Reproducible product evidence](https://roarcad.netlify.app/evidence/)

The two-layer indicator proves the fabrication-ready path. The included eight-layer PocketRoar Capture Bridge proves the same generic compiler on a routed feasibility slice that has zero compiler/checker errors and exports a clearly marked engineering package. A third environmental-monitor sample proves that a new structured brief uses the same compiler without a project-name branch. PocketRoar remains incomplete and cannot request a quote until its full schematic, differential-pair, electrical, physical, licensing, and compatibility gates are proven.

The current product status, precise readiness vocabulary, retained research, and PocketRoar verification ladder are collected in the [wrap-up checkpoint](docs/PROJECT_CHECKPOINT.md). The interface now pairs each general part type with a plain-English definition while keeping exact technical data visible.

## Run

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

Quality gates:

```sh
bun run typecheck
bun run check
bun test
bun run eval:webmcp
bun run build
```

## Workflow

1. Draft or import a structured custom `BoardGraph` containing geometry, parts, footprints, pins, nets, and constraints.
2. Inspect requirements, exact MPNs, official evidence, and unresolved risks.
3. Preview a structured change or explicitly unlock placement and drag a PCB component. The canvas is locked by default and a preview never mutates stored design state.
4. A person approves and applies the preview in the visible UI to create an immutable revision.
5. Validate the graph and generated Circuit JSON.
6. Prepare engineering or fabrication Gerber, BOM, placement, validation, digital-verification, project, and hash-manifest artifacts.
7. Request a live MacroFab bare-PCB quote, then open that exact provider project to review shipping, payment, and place the order; JLCPCB remains a manual-upload fallback.

Browsers without WebMCP retain the complete manual workflow. Agents cannot order, pay, store an address, or accept a substitution.

## WebMCP tools

- `draft_board`
- `inspect_design`
- `preview_design_change`
- `validate_and_export`

`draft_board` accepts requirements plus an optional structured `design`. `inspect_design` returns one focused, paginated section at a time. `preview_design_change` accepts allowlisted operations but cannot commit them. Supplier, agent, and shared-checkpoint evidence always enters unreviewed; only the visible manual UI can approve evidence, parts, footprints, or a pending change.

The complete structured schemas are exposed on the registered tools and are revalidated by Zod inside the application. Reproducible prompts for requirements-only, custom-board, change, export, and PocketRoar journeys are in [sample prompts](docs/SAMPLE_PROMPTS.md).

In Chrome, enable `chrome://flags/#enable-webmcp-testing` and relaunch before opening the hosted app. Unsupported browsers show **Manual mode** and retain the full workflow. Direct tool calls use the current Chrome contract: resolve the registered tool with `await document.modelContext.getTools()`, then call `document.modelContext.executeTool(tool, JSON.stringify(input))`.

### Use it with your agent

Open the app in a WebMCP-capable browser connected to your agent. Select the
indicator example, then ask: “Inspect this revision's components. Explain D1
and its connections in simple English. Preview moving D1 to x=3, y=2, but do
not apply the change.” Review the proposed diff and click **Approve & apply**
yourself. Then ask the agent to validate and prepare an engineering export;
you control the download.

WebMCP is a page-bound browser API, not a remote MCP server URL. A coding agent
needs a browser integration that exposes page tools; adding the website as a
generic MCP server will not work. Browsers without that integration retain the
same manual workflow. See [sample prompts](docs/SAMPLE_PROMPTS.md) and the
[release evidence](docs/NETLIFY_RELEASE.md) for tested paths and limitations.

## Team checkpoints

**Copy checkpoint link** packages the current immutable revision and ancestry into a gzip-compressed URL fragment. The fragment is not sent to the hosting server, but anyone who receives it can read the design. A `.roarcad-checkpoint.json` download is available as a portable fallback.

A recipient reviews the checkpoint before choosing **Continue as local fork**. They can make and human-approve changes, then share a new checkpoint back. The original author sees the common ancestor and semantic diff before choosing **Adopt as new revision**. Divergent PCB graphs are never auto-merged, checkpoint integrity does not prove sender identity, and all incoming review claims are reset to unreviewed.

## Manufacturing status

The manufacturing server receives the current project and configuration, validates the revision, and recompiles its artifacts. For supported two-layer bare PCBs, the visible MacroFab flow creates a provider project, uploads only the generated Gerber and drill files through MacroFab's signed S3 flow, processes and imports the recognized layers, and returns a short-lived polling token. The status route displays MacroFab's returned total only after the provider marks the base PCB quote valid and manufacturable. MacroFab's API omits a currency field; USD comes from its published [Manufacturing Services Agreement](https://www.macrofab.com/legal/msa), which states that its prices are in U.S. dollars. A valid quote links to the exact authenticated MacroFab project, where MacroFab collects shipping and payment and places the order. RoarCAD does not call an undocumented purchase endpoint, hold addresses or payment details, or claim that an order was placed. PCBA remains unavailable. JLCPCB remains an honest [manual-upload fallback](https://jlcpcb.com/quote).

Server variables:

```text
JLCPCB_APP_ID
JLCPCB_ACCESS_KEY
JLCPCB_SECRET_KEY
JLCPCB_TOKENIZATION_PUBLIC_KEY
JLCPCB_TOKENIZATION_PRIVATE_KEY
JLCPCB_QUOTE_ENABLED=false
MACROFAB_API_KEY
```

The tokenization keys remain unused unless an approved endpoint explicitly requires them. Configure and verify provider-side abuse controls for `/api/manufacturing/jlcpcb/quote` before enabling live quoting; the deployment alone does not enable it.

## Hosting and moving existing projects

Netlify serves the Vite build and routes the four manufacturing endpoints through
one native Node function. It reuses the Vercel handlers and all their validation;
no hosted database or AI API key is needed. `netlify.toml` contains the build,
function, cache, and security settings. Use `bunx netlify-cli dev` to exercise
both frontend and functions locally. Deployment and rollback instructions are
in [the Netlify release record](docs/NETLIFY_RELEASE.md).

Your local designs stay in the browser at the hostname where you made them.
To move from Vercel to Netlify, click **Export project** on Vercel and
use **Import project** on Netlify. Do not clear browser storage. The old
site stays available; opening the new host does not transfer or delete projects.

PocketRoar remains an **engineering-only UVC bridge study**. Its product target is iPhone, while USB-C iPad is the documented UVC comparison case. The routed feasibility slice has zero compiler/checker errors, but its eleven nets are not a complete schematic and its differential-pair impedance, coupling, and skew are not yet verified. The current graph also does not implement or prove the SeeMo-class compression and app-compatible iPhone transport that the product needs. The [iPhone inspiration research](docs/research/pocketroar-iphone-capture-inspiration.md), [electrical completion brief](docs/research/pocketroar-electrical-completion.md), and [verification ladder](docs/research/pcb-verification-ladder.md) record the transport, connector, power, firmware, simulation, compliance, manufacturing, and physical-test gates that still block fabrication and quoting.

## Screenshots

![RoarCAD demo thumbnail](docs/screenshots/roarcad-youtube-thumbnail.png)

![Fabrication-ready indicator workflow](docs/screenshots/indicator-fabrication.jpg)

![PocketRoar engineering-only workflow](docs/screenshots/pocketroar-engineering.jpg)

See the [domain glossary](CONTEXT.md), [architecture](docs/ARCHITECTURE.md), [safety limits](docs/SAFETY.md), [sample prompts](docs/SAMPLE_PROMPTS.md), [demo script](docs/DEMO.md), and [final video packet](docs/VIDEO_PACKET.md).

MIT © Jonathan Gan
