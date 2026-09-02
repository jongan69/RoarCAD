# Checkpoint-first demo packet

Status: recording script and current screenshots, not a finished replacement
video. The existing public video remains historical. Jonathan reviews the final
video and explicitly approves the Devpost update before publication.

## Acceptance and recording boundaries

- Target 2:45; final export must be strictly shorter than three minutes, with
  audible narration and readable captions. Measure the finished file, not this
  script's estimated timing.
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
| 0:00–0:15 | Quick cuts: share, coauthor preview, returned diff, visible adoption and new history entry. Label author A and coauthor B. | Share a circuit board, let a teammate and their agent improve it, then review exactly what came back. RoarCAD saves your decision as a new revision without erasing the old one. |
| 0:15–0:40 | Open the indicator; show the current path, part explanations, and official evidence links. | A printed circuit board connects electronic parts with copper paths. RoarCAD makes that design easier to inspect. Here, power travels through a resistor, which limits current, then an LED, which makes light. Plain-English explanations sit beside exact parts and their evidence. |
| 0:40–1:05 | Display four discovered tools; call inspection and D1 placement preview. Keep the unchanged revision visible, then click Approve & apply. | WebMCP gives a browser agent structured tools for this open page. It can inspect the board and propose a change. Moving this LED first creates a preview, not a saved edit. Only this visible approval control applies the proposal and creates the next revision. |
| 1:05–1:30 | Share A's checkpoint; B opens read-only, saves backup, forks, previews a move, approves it, and returns a checkpoint. | A checkpoint is a saved design snapshot you can hand to someone else. The recipient first sees a read-only review. They save their existing work before starting a local fork, a separate working copy. Their agent can then help prepare another change for human approval. |
| 1:30–1:50 | A opens B's return; show common ancestor and D1 semantic diff, then manually adopt. | Back with the author, RoarCAD shows the shared starting point and what changed. Adoption keeps the old local history and records where the incoming design came from. Incoming approvals become unreviewed. Conflicting boards are never silently merged. |
| 1:50–2:10 | Show PocketRoar's iPhone requirement and engineering architecture. | This started with PocketRoar Mobile. I needed a Sony camera's video feed on an iPhone. USB-C iPads already have a native external-camera path; iPhones lack that documented path. Accsoon SeeMo shows the outcome we want, but our own electronics and app still need proof. |
| 2:10–2:35 | Show revision c204a71b354abeff and 0 viewer errors. Prepare engineering export, then request fabrication and show refusal. Mark any compilation cut. | PocketRoar now compiles with zero errors in the modeled design. That is not a working-hardware certificate. The study still needs a complete circuit and a proven iPhone connection. RoarCAD prepares an engineering review package, but refuses fabrication. Preventing an unsupported manufacturing decision is part of its value. |
| 2:35–2:45 | End on real application, Netlify URL, public source, and a concise limitation caption. | RoarCAD is open source and live on Netlify. People keep control; agents help them understand, review, and hand off their designs. |

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

## Remaining gates

1. Capture the continuous interaction footage and current PocketRoar export /
   refusal footage. The prior release receipt proves the behavior, not a video.
2. Record narration, assemble, caption, listen, and visually review the complete
   export. Check duration, audio, revision continuity, no secrets, and no implied
   hardware success. Obtain Jonathan's final video approval.
3. Publish the approved video and verify anonymous playback. Update Devpost's
   copy, live URL, and screenshots only with explicit final confirmation, then
   read the public page back. Do not overwrite the old local video master.
4. Keep the blind selection evaluation separate. Use fresh client sessions with
   full discovered schemas and only each case's prompt and required inputs;
   never expose the expected answers from `evals/webmcp-evals.json`. Record the
   client/version, date, first call or no-call, arguments, sequence, output size,
   and observed state. Grade after all responses are captured. A definition
   test, a prompted rehearsal, and direct tool execution are not a blind score.

See [the Netlify release receipt](NETLIFY_RELEASE.md) for source, CI, hosting,
browser, download-integrity, and hardware-evidence boundaries.
