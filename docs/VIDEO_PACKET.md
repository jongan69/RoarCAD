# RoarCAD demo video packet

Final master: 2:24, 1920×1080, public YouTube, audible narration, reviewed captions.

Every product frame must come from the live app. Do not simulate WebMCP results, provider prices, fabrication approval, or physical PocketRoar behavior.

## Locked delivery

Confident technical founder, neutral American accent, warm dry timbre, brisk but understandable, no hype voice, start each line immediately.

## Narration and capture manifest

| Window | Narration | Real capture |
| --- | --- | --- |
| 0:00–0:05 | I share this exact PCB revision with a teammate. | Create a checkpoint link in profile A. |
| 0:05–0:10 | They continue it locally with an agent and return a new immutable checkpoint. | In profile B, continue, show agent preview, click **Approve & apply**, then copy the returned link. |
| 0:10–0:15 | I see our common ancestor and the semantic diff before I adopt anything. | Back in profile A, open the returned read-only review and adopt it. |
| 0:15–0:28 | RoarCAD is Git-like PCB handoff for people and their agents. Links carry a hashed revision and ancestry in the URL fragment, so no account or server database is required. | Show checkpoint metadata, hash, ancestry, and URL fragment without exposing other browser data. |
| 0:28–0:41 | An incoming checkpoint never overwrites local work. Continuing downloads a backup first; divergent boards are compared and deliberately replaced, never auto-merged. | Show read-only state, backup download, relation, and explicit Continue/Adopt controls. |
| 0:41–0:54 | With WebMCP enabled, RoarCAD exposes four bounded tools: draft, focused inspection, preview, and validation or export preparation. Apply is intentionally absent. | Show the live four-tool Chrome list. |
| 0:54–1:07 | The agent inspects only the requested revision slice, then proposes a deterministic placement change. Preview leaves the stored revision unchanged and returns no hidden operation payload. | Execute focused `inspect_design`, then `preview_design_change`; show unchanged revision and compact result. |
| 1:07–1:20 | Only this visible approval click creates the new content-addressed revision. Stale or altered previews are rejected. | Click **Approve & apply** and show the new history entry. |
| 1:20–1:33 | Shared requirements, evidence, parts, and footprints are untrusted again on arrival. A checkpoint hash proves unchanged content, not who sent it. | Show the checkpoint warning and readiness downgrade. |
| 1:33–1:46 | The same typed BoardGraph, Zod schemas, immutable revisions, and tscircuit compiler power the human interface and every agent action. No arbitrary generated code is executed. | Show board, schematic, checks, and the architecture summary. |
| 1:46–1:59 | The reviewed indicator demonstrates the fabrication path, while download, quoting, checkout, payment, and substitution decisions remain human-only. | Prepare the indicator bundle and show the visible Download control. |
| 1:59–2:12 | PocketRoar is the stress test: its eight-layer feasibility slice now has zero digital errors, while the complete circuit and iPhone transport remain unproven. | Switch to PocketRoar, show zero errors, and prepare the engineering bundle. |
| 2:12–2:25 | Its unresolved electrical, mechanical, thermal, and evidence risks prevent fabrication export and quoting. RoarCAD refuses to turn an impressive render into a false safety claim. | Attempt fabrication preparation or quote and show the blockers. |
| 2:25–2:35 | RoarCAD is live and open source: immutable PCB handoff, faster agent iteration, and human authority where hardware mistakes become expensive. | Show the live URL, repository, and closing mark. |

## Capture acceptance

- Record a fresh Chrome session with WebMCP enabled.
- Show the four tools executing against the live production URL; confirm no apply, download, quote, order, or payment tool exists.
- Complete the real A → B → A checkpoint handoff in clean browser profiles.
- Keep the browser tab, product output, approval click, and revision change visible.
- Include the indicator fabrication path and PocketRoar manufacturing rejection.
- Hide provider consoles, credentials, notifications, other tabs, and personal data.
- Show PocketRoar's zero-error count together with its incomplete-schematic, differential-pair, and iPhone-transport warnings; never crop those warnings out or imply the board is fabrication-ready.

## Caption plan

Generate timings from the finished narration audio with Whisper. Burn the authored wording back onto those timings using the `clean` style. Never estimate caption timestamps from this manifest.

Final caption result: 405 authored words, 234 timed caption cards, 0.936 authored-text
similarity, and a final spoken word at 2:23.700.

## YouTube packet

**Thumbnail:** `docs/screenshots/roarcad-youtube-thumbnail.png`

**Title:** RoarCAD — A WebMCP PCB Workbench With Human Approval

**Description:**

RoarCAD is a WebMCP-enabled, Git-like PCB handoff system where teammates share immutable revisions, agents draft and inspect structured board designs, humans approve deterministic changes, and unsafe designs cannot cross the manufacturing boundary.

This demo shows four real page-bound WebMCP tools with a deliberately human-only apply boundary, an A → B → A checkpoint handoff, fabrication artifacts for a reviewed indicator board, and an engineering-only PocketRoar HDMI-to-USB-C capture bridge that RoarCAD correctly refuses to quote or manufacture.

Live app: https://roarcad.vercel.app/

Source: https://github.com/jongan69/RoarCAD

Built for The WebMCP Challenge. PocketRoar remains an engineering candidate and has not been physically validated or approved for fabrication.

## Upload checklist

- [x] Export one MP4 under three minutes at 1080p.
- [x] Confirm narration is audible and captions match the spoken words.
- Upload publicly to YouTube.
- Watch the entire upload logged out at 1080p with captions enabled.
- Copy the public URL into `devpost-submission.md` and the Devpost project only after verification.
