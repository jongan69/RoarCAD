# RoarCAD wrap-up checkpoint

Checked: 2026-08-28.

## Product decision

RoarCAD remains a local-first, agent-visible PCB review and handoff system. This checkpoint does not replace its compiler, persistence, WebMCP, revision, checkpoint, or manufacturing architecture.

The product direction is simplicity without false certainty:

- explain general electronics terms in ordinary language;
- show exact connections derived from the current revision;
- keep technical identifiers and evidence available for expert review;
- never let an explanation, render, or clean automated check claim physical proof;
- keep BoardGraph as the single design authority and every edit behind preview plus visible human approval.

## Implemented in this checkpoint

- A beginner guide defines parts, connections, footprints, schematics, PCB layout, and engineering readiness in the existing project panel.
- Every supported part kind has a general plain-English definition. Exact purpose is not guessed.
- Technical part and footprint identifiers remain visible directly below the explanation.
- Section names now lead with `How it works`, `Parts`, `Connections`, and `Evidence: why we trust it`.
- `Move parts on the board` makes the existing drag-preview behavior discoverable without weakening approval.
- The PocketRoar fixture is labeled as a UVC bridge study and explicitly blocks the unproven iPhone transport.
- The PocketRoar feasibility slice now uses exact upstream KiCad HDMI and USB-C connector pad geometry, the documented TC358743 ball map, net-class trace widths, explicit BGA escape paths, and intentional via-in-pad rules.
- Its generated Circuit JSON now has zero core errors and zero independent checker errors. Differential-pair impedance, coupling, and skew remain explicit unverified constraints rather than hidden behind that count.
- Untouched PocketRoar reference fixtures from older releases reset to the clean indicator on startup; edited work remains preserved.

## Proven before this checkpoint

- Production exposes four bounded WebMCP tools: draft, focused inspection, preview, and validation/export preparation. Apply remains human-only.
- Immutable checkpoint links open read-only, preserve ancestry, detect changed content, and require explicit fork or adoption.
- The indicator, environmental monitor, and PocketRoar study compile through the same BoardGraph-to-Circuit-JSON path.
- The indicator demonstrates RoarCAD's digital fabrication-package path. It has not been physically built or independently certified.
- PocketRoar prepares an engineering-only package while fabrication export and quoting remain blocked.
- The production A-to-B-to-A checkpoint journey, mobile 390 x 844 regression, CI, build, and public deployment were verified separately.

## PocketRoar truth

### Product target

PocketRoar needs a camera-to-**iPhone** bridge. A USB-C iPad is the documented UVC comparison case, not the product need. SeeMo-class products indicate that the final solution may require HDMI ingest, hardware compression, and an app-compatible iPhone accessory transport.

### Current RoarCAD design

The bundled board is a standards-based HDMI-to-CX3/UVC **routed feasibility slice**, not the final iPhone bridge or a complete schematic. In the current installed toolchain it produces:

- 26 placed parts and 11 routed feasibility nets;
- revision `c204a71b354abeff` and 2,566 generated Circuit JSON elements;
- zero compiler-emitted errors and zero independent `@tscircuit/checks` errors;
- 69 warnings for incomplete courtyard, schematic styling, pin-role, power, and ground metadata;
- an explicit warning that differential-pair impedance, coupling, and routed-length skew are not yet verified.

The zero-error result is now a useful regression boundary: exact connector geometry, placement, clearances, trace connectivity, and the eleven modeled routes are internally clean. It does **not** prove the other hundreds of connections that a complete schematic needs, high-speed electrical behavior, firmware, the final iPhone transport, manufacturability, or physical operation.

### Next hardware gate

Prove the transport before committing to the final PCB architecture:

1. Freeze the exact Sony camera mode, iPhone model, iOS version, cable, latency target, power source, and PocketRoar app boundary.
2. Test the camera directly and record why it does or does not appear to the iPhone application.
3. Test a known SeeMo-class device and document enumeration, video format, app access, latency, thermals, reconnects, and simultaneous cellular streaming.
4. Choose a legally and technically supportable transport: documented accessory/SDK, standards-based path proven on iPhone, or another explicit architecture.
5. Prove that path with development hardware before laying out a custom board.

Only then should the final schematic replace or supersede the UVC study.

## Verification ladder

| Gate | Evidence | What it can prove | What it cannot prove |
| --- | --- | --- | --- |
| 0. Product contract and transport | Exact devices, modes, interfaces, and a development-hardware transport test | The chosen architecture can reach PocketRoar on the target iPhone | A custom PCB will be electrically correct |
| 1. Requirements and sources | Official datasheets, reference designs, lifecycle, connector drawings, stackup, licensing | The design inputs are known and attributable | The implementation matches them |
| 2. Structural verification | Zod parsing, pin/net integrity, deterministic compilation, hashes | The BoardGraph is internally coherent and reproducible | Correct electrical behavior |
| 3. Schematic verification | Complete support circuits, ERC, power ownership, DNU/no-connect audit, two-person symbol/footprint review | The intended circuit is explicitly represented | Layout or high-speed performance |
| 4. Layout verification | Routed board, zero unexplained DRC, exact stackup, impedance and length/skew checks, return-path review | The PCB follows the selected physical rules | Real channel margin or assembled behavior |
| 5. Engineering analysis | Vendor-model SPICE, SI/PI, thermal estimates, worst-case budgets | Modeled margins under stated assumptions | Manufacturing variation or real-device compatibility |
| 6. DFM and release review | Fabricator DFM, assembly review, frozen BOM/substitutions, independent design review, artifact hashes | The package is reviewable and buildable by the selected process | That fabricated units work |
| 7. Prototype bring-up | Inspection/X-ray as needed, current-limited rails, clocks, reset, boot, firmware, HDMI/CSI/USB measurements | The assembled prototype functions at the bench | Product reliability across the claim matrix |
| 8. Product validation | Exact Sony/iPhone/iOS/cable tests, recovery, latency, thermal soak, cellular coexistence, compliance and pilot yield | The documented product claims are repeatable | Future untested devices or revisions |

Every gate is cumulative. A later gate cannot repair missing evidence from an earlier one.

## Research retained in the repository

- [iPhone capture inspiration](research/pocketroar-iphone-capture-inspiration.md): why the target is iPhone and what SeeMo demonstrates publicly.
- [UVC board refresh](research/pocketroar-board-refresh.md): the standards-based iPad/UVC comparison and its limits.
- [Electrical completion](research/pocketroar-electrical-completion.md): missing rails, support circuits, vendor data, firmware, SI/PI, compliance, and physical gates for the current CX3 study.
- [Visual editor options](research/visual-circuit-editor-options.md): why the existing tscircuit interaction seam is safer than importing a second CAD model.
- [PCB verification ladder](research/pcb-verification-ladder.md): current automated coverage, feasible guardrails, and unavoidable hardware proof.

## Ideas deliberately not implemented

- Clickable schematic explanations and connection tracing.
- Reviewed per-component purpose notes.
- Friendly issue translations that retain the original engineering message.
- Functional blocks such as USB power, status light, button, or sensor port.
- Pin-to-pin connection proposals through the existing preview boundary.
- React Flow as a non-authoritative concept map.
- KiCad interoperability after real users identify it as the adoption blocker.

These remain useful ideas, not current product claims. Drag-and-drop must never introduce a second authoritative graph or bypass preview, validation, and approval.

## Devpost boundary

The current submission may accurately say that RoarCAD makes common part types easier to understand and that the PocketRoar feasibility slice deterministically reaches zero compiler/checker errors while remaining engineering-only. It must not claim clickable auditing, functional-block design, a complete PocketRoar schematic, a fabrication-ready PocketRoar PCB, or iPhone compatibility.

Updating this repository draft is safe. Updating the live Devpost entry remains a separate user-approved action followed by public readback.
