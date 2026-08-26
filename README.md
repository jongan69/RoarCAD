# RoarCAD

RoarCAD is a browser PCB workbench where a human and an AI agent can inspect the same requirements, preview the same changes, and pass through the same validation gates. The MVP compiles a small two-layer power-indicator board with [tscircuit](https://tscircuit.com), renders PCB and schematic views, produces manufacturing artifacts, and exposes five page-bound [WebMCP](https://learn.chatgpt.com/docs/webmcp) tools.

- [Verified preview](https://roarcad-e64j06b89-jongan69s-projects.vercel.app)
- [Public source](https://github.com/jongan69/RoarCAD)

The included PocketRoar Capture Bridge is a requirements package, not a fabrication-ready design. It stays blocked until its camera, device, OS, transport, video-mode, charging, and physical-validation inputs are proven.

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
bun run build
```

## Workflow

1. Inspect requirements, exact MPNs, official evidence, and unresolved risks.
2. Preview a bounded change. A preview never mutates the design.
3. Approve and apply the preview to create an immutable revision.
4. Validate the requirements and generated Circuit JSON.
5. Prepare Gerber, BOM, placement, validation, project, and hash-manifest artifacts.
6. Explicitly download the package or request a JLCPCB quote.

Browsers without WebMCP retain the complete manual workflow. Agents cannot order, pay, store an address, or accept a substitution.

## WebMCP tools

- `draft_board`
- `inspect_design`
- `preview_design_change`
- `apply_design_change`
- `validate_and_export`

Enable WebMCP in Chrome 149+ or open the hosted app in ChatGPT's in-app browser. Direct tool calls can be exercised in DevTools with `document.modelContext.executeTool(toolName, JSON.stringify(input))`.

## Manufacturing status

The JLCPCB server boundary validates a current artifact package and supports bare-PCB and PCBA configurations. Without approved credentials and an account-specific API contract, it returns no invented price and directs the human to [JLCPCB's upload flow](https://jlcpcb.com/quote). Live cart handoff remains intentionally disabled until it can be verified against an approved API account.

See [architecture](docs/ARCHITECTURE.md), [safety limits](docs/SAFETY.md), and the [demo script](docs/DEMO.md).

MIT © Jonathan Gan
