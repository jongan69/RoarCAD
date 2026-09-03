# Checkpoint-first demo packet

Status: final 2:46.635 replacement master rendered from live-product captures
with narrated audio and published at `https://youtu.be/DEJ6Mwa9TYU`. Anonymous
YouTube oEmbed readback confirmed the public title and thumbnail.

## Acceptance and recording boundaries

- The measured master is 2:46.635 at 1920x1080, H.264/AAC, with audible
  narration and readable section captions.
- Record the deployed application and real WebMCP calls. Keep the visible
  approval click, revision IDs, comparison, and fabrication refusal on screen.
- Use disposable projects in isolated browser profiles. Save and verify a local
  backup before replacing a project with a fork. Never clear browser storage.
- Present time-consuming compilation with a clearly marked time cut; do not
  imply instant export or use generated product screens.
- Show the current four tools. Do not reuse footage of `apply_design_change`.
- No claim of a working physical PocketRoar board, native iPhone UVC support,
  universal coding-agent support, live quotes, or a separate Netlify award.

## Narration and shot sequence

These are editing windows, not measured speech durations. Let a natural read set
the timing; shorten wording if needed rather than speeding up the voice.

| Window | Real screen action | Narration |
| --- | --- | --- |
| 0:00–0:17 | Open on the real checkpoint comparison and adopted revision. | Share a circuit board, let a teammate and their agent improve it, then review exactly what came back. RoarCAD saves your decision as a new revision without erasing the old one. |
| 0:17–0:45 | Show the environmental monitor created by the live `draft_board` call, including its three parts, four nets, plain-English explanations, and zero viewer errors. | A printed circuit board connects electronic parts with copper paths. RoarCAD makes that design easier to inspect. Plain-English explanations sit beside exact parts and their evidence. |
| 0:45–1:25 | Show the live `preview_design_change` result, unchanged base revision, visible **Approve & apply**, and the new second revision. | WebMCP gives a browser agent structured tools for this open page. It can create a board from a structured brief, inspect it, and propose a change. Only the visible approval control applies the proposal and creates the next revision. |
| 1:25–2:07 | Return to the read-only checkpoint comparison and immutable adopted history. | A checkpoint is a saved design snapshot you can hand to someone else. The recipient first sees a read-only review. Adoption keeps the old local history and records where the incoming design came from. Conflicting boards are never silently merged. |
| 2:07–2:38 | Show PocketRoar revision `c204a71b354abeff`, zero viewer errors, the iPhone transport blocker, and engineering-only readiness. | This started with PocketRoar Mobile. I needed a Sony camera's HDMI video feed on an iPhone. PocketRoar compiles with zero errors in the modeled design, but that is not a working-hardware certificate. RoarCAD prepares engineering review while refusing fabrication. |
| 2:38–2:46.635 | End on the fabrication-ready indicator, live Netlify URL, and public-source caption. | RoarCAD is open source and live on Netlify. People keep control; agents help them understand, review, and hand off their designs. |

## Current screenshot inventory

Captured September 2 from the deployed release, not mocked. These are static
evidence and editing references; they do not replace a recording of interaction.

- `screenshots/netlify-indicator-fabrication.png`: production indicator revision
  `d03a628e2c8e8f9d`, prepared fabrication package, explicit download control,
  and two saved revisions. This is digital readiness, not physical validation.
- `screenshots/netlify-checkpoint-review.png`: production read-only return from
  `b83febfd32320e30`, common ancestor `d03a628e2c8e8f9d`, D1 semantic diff, and
  explicit adoption control. The sender is a disposable test coauthor.
- `screenshots/netlify-checkpoint-adopted.png`: production revision
  `6a6536c3499548f5`, three retained history entries, and unreviewed incoming
  claims. No application console errors appeared during this capture journey.
- `screenshots/netlify-pocketroar-engineering.png`: immutable production deploy
  `6a987dc2f723f70008bf6ba7`, revision `c204a71b354abeff`, zero compiler errors,
  and the explicit iPhone transport blocker. This pre-export view has 90 domain
  review warnings; the previously verified engineering export adds 69 checker
  warnings for 159 total. No application console errors appeared.

Keep historical screenshots for provenance, but do not present their old error
counts, iPad requirements, or five-tool behavior as the current product.

## Remaining evaluation

The final master is `artifacts/demo/roarcad-demo-2026-final.mp4`; the historical
master remains. Devpost project version 7 points to the public replacement video
and Netlify URL, and the submitted project readback passed.

Keep the blind selection evaluation separate. Use fresh client sessions with
full discovered schemas and only each case's prompt and required inputs; never
expose the expected answers from `evals/webmcp-evals.json`. Record the
client/version, date, first call or no-call, arguments, sequence, output size,
and observed state. Grade after all responses are captured. A definition test,
a prompted rehearsal, and direct tool execution are not a blind score.

See [the Netlify release receipt](NETLIFY_RELEASE.md) for source, CI, hosting,
browser, download-integrity, and hardware-evidence boundaries.
