# RoarCAD demo video packet

Target: 2:40, 1920×1080, public YouTube, audible narration, reviewed captions.

Every product frame must come from the live app. Do not simulate WebMCP results, provider prices, fabrication approval, or physical PocketRoar behavior.

## Locked delivery

Confident technical founder, neutral American accent, warm dry timbre, brisk but understandable, no hype voice, start each line immediately.

## Narration and capture manifest

| Window | Narration | Real capture |
| --- | --- | --- |
| 0:00–0:10 | AI can generate a PCB that looks finished while hiding bad footprints, missing evidence, stale edits, and unsafe manufacturing assumptions. RoarCAD makes every one of those risks visible. | Open on PocketRoar warnings and engineering badge. |
| 0:10–0:20 | This is a browser PCB workbench where a person and an agent share the same requirements, board graph, schematic, validation results, and immutable revision history. | Pan across left requirements, center viewer, right checks, bottom history. |
| 0:20–0:30 | The board is real structured data, compiled through tscircuit. The agent never edits arbitrary code, and the manual interface still works when WebMCP is unavailable. | Show PCB, schematic tab, and Manual/WebMCP badge. |
| 0:30–0:40 | With WebMCP enabled, RoarCAD exposes exactly five bounded tools: draft, inspect, preview, apply, and validate or export. They call the same actions as the visible interface. | Show Chrome WebMCP tool list. |
| 0:40–0:50 | First the agent inspects PocketRoar, an HDMI-to-USB-C capture bridge candidate. It sees exact parts, official evidence, unresolved risks, and why the design is engineering-only. | Execute `inspect_design`; show result and evidence. |
| 0:50–1:00 | Next it proposes a low-risk placement change. The preview is deterministic and non-mutating, so the current revision stays unchanged while the human reviews the semantic diff. | Execute `preview_design_change`; show unchanged revision and diff. |
| 1:00–1:10 | Only after visible approval does RoarCAD apply the change. A new content-addressed revision appears, and stale previews are rejected instead of silently overwriting newer work. | Click Apply; show new revision in history. |
| 1:10–1:20 | The agent can validate and prepare an engineering bundle containing Circuit JSON, Gerbers, BOM, placement, checks, project data, and a SHA-256 manifest. Download still requires a person. | Execute engineering `validate_and_export`; show prepared bundle and Download button. |
| 1:20–1:30 | This is not a PocketRoar-specific demo. Here a fresh environmental monitor starts from a structured brief and enters the exact same compiler, viewers, checks, and revision workflow. | Execute `draft_board` with environmental-monitor design. |
| 1:30–1:40 | Agent-provided requirements, supplier evidence, parts, and footprints enter as unreviewed candidates. No tool can mark its own homework or promote a board to fabrication-ready. | Inspect the new board and show unreviewed states. |
| 1:40–1:50 | The small power indicator proves the complete fabrication path. It uses exact manufacturer part numbers, reviewed evidence, a two-layer board, and zero unresolved fabrication blockers. | Switch to indicator and prepare fabrication export. |
| 1:50–2:00 | RoarCAD prepares manufacturing files, but the browser cannot order, pay, store shipping details, accept substitutions, or download anything without an explicit human action. | Show manufacturing panel and human Download button. |
| 2:00–2:10 | Switch back to PocketRoar and the same boundary refuses fabrication export and JLCPCB quoting. That refusal is a product feature, not a failed demo. | Attempt fabrication export or quote; show blocked message. |
| 2:10–2:20 | Under the hood, Zod validates every input, one generic compiler produces Circuit JSON, immutable hashes protect revisions, and Vercel functions independently recompile manufacturing requests. | Show architecture diagram or repository architecture section beside app. |
| 2:20–2:30 | WebMCP turns an agent from a screen-scraping guesser into a constrained engineering collaborator, while the person keeps evidence review, approval, manufacturing, checkout, and payment authority. | Return to WebMCP-ready workspace and five-tool list. |
| 2:30–2:40 | RoarCAD is live, open source, and tested on three different boards. Agents move faster, humans keep control, and unsafe designs cannot pretend they are ready to manufacture. | Show `roarcad.vercel.app`, GitHub URL, and closing mark. |

## Capture acceptance

- Record a fresh Chrome session with WebMCP enabled.
- Show all five tools executing against the live production URL.
- Keep the browser tab, product output, approval click, and revision change visible.
- Include the indicator fabrication path and PocketRoar manufacturing rejection.
- Hide provider consoles, credentials, notifications, other tabs, and personal data.
- If PocketRoar's tscircuit findings are visible, explain them as unresolved engineering-review findings; never crop them out or imply the board is fabrication-ready.

## Caption plan

Generate timings from the finished narration audio with Whisper. Burn the authored wording back onto those timings using the `clean` style. Never estimate caption timestamps from this manifest.

## YouTube packet

**Title:** RoarCAD — A WebMCP PCB Workbench With Human Approval

**Description:**

RoarCAD is a WebMCP-enabled PCB workbench where agents draft and inspect structured board designs, humans approve deterministic changes, and unsafe designs cannot cross the manufacturing boundary.

This demo shows five real page-bound WebMCP tools, a generic custom-board journey, fabrication artifacts for a reviewed indicator board, and an engineering-only PocketRoar HDMI-to-USB-C capture bridge that RoarCAD correctly refuses to quote or manufacture.

Live app: https://roarcad.vercel.app/

Source: https://github.com/jongan69/RoarCAD

Built for The WebMCP Challenge. PocketRoar remains an engineering candidate and has not been physically validated or approved for fabrication.

## Upload checklist

- Export one MP4 under three minutes at 1080p.
- Confirm narration is audible and captions match the spoken words.
- Upload publicly to YouTube.
- Watch the entire upload logged out at 1080p with captions enabled.
- Copy the public URL into `devpost-submission.md` and the Devpost project only after verification.
