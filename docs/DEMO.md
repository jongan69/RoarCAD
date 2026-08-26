# RoarCAD demo script — 2:45 target

The recording must show real browser behavior. AI may supply narration, captions, cuts, and zooms, but it must not fabricate tool calls, hardware results, provider prices, or physical validation.

## 0:00–0:15 — problem

Narration: “AI can generate a PCB that looks finished while hiding missing evidence, unreviewed footprints, and unsafe manufacturing assumptions. RoarCAD makes those assumptions visible.”

Show the RoarCAD workspace and the WebMCP-ready badge.

## 0:15–0:35 — product

Show requirements and evidence on the left, PCB and schematic in the center, validation and manufacturing on the right, and immutable revisions below. Point out that canvas placement is locked until a human unlocks it.

## 0:35–1:25 — PocketRoar collaboration

1. Open PocketRoar.
2. Call `inspect_design` for readiness and blockers.
3. Call `preview_design_change` to move a low-risk component.
4. Show that the revision ID has not changed.
5. Approve the preview in the visible UI.
6. Show the new immutable revision.
7. Call `validate_and_export` for an engineering package.

Narration must say the board compiles and exports review artifacts, not that it is fabrication-ready.

## 1:25–1:55 — generic-board proof

1. Load the environmental-monitor graph from `src/samples.ts` through `draft_board`.
2. Inspect it and show that agent-supplied parts, footprints, and requirements are unreviewed.
3. Confirm one requirement manually without pretending the other engineering gates disappeared.

## 1:55–2:20 — manufacturing boundary

1. Switch to the indicator and prepare its fabrication bundle.
2. Show the human-controlled download.
3. Switch back to PocketRoar and show fabrication export or quote rejection.

Narration: “The same workflow can produce manufacturing files, but only a fabrication-ready revision can cross the quote boundary.”

## 2:20–2:40 — impact

Explain that WebMCP gives the agent structured access to the open page while the human retains review, download, manufacturing, checkout, and payment decisions.

## 2:40–2:45 — close

Show the public demo URL and GitHub repository. End with: “RoarCAD turns PCB generation into a transparent engineering collaboration.”

## Capture checklist

- Record only the clean RoarCAD tab.
- Hide credentials, provider consoles, notifications, and unrelated tabs.
- Capture at 1440p or higher and edit to 1080p.
- Keep the final public YouTube video below three minutes with audible narration and reviewed captions.
- Watch the upload logged out before placing its URL in Devpost.
