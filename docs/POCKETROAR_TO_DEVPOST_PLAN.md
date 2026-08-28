# PocketRoar PCB to Devpost execution plan

## Objective

Ship RoarCAD as the complete hackathon product and use PocketRoar as its ambitious, evidence-gated reference design. The demo must show an agent drafting, inspecting, changing, validating, and exporting a real board while RoarCAD blocks unsupported fabrication claims.

The PocketRoar hardware has three separate completion gates:

1. **Schematic-complete:** exact symbols, footprints, pins, rails, support parts, and nets have passed independent review.
2. **Fabrication-ready:** placement, routing, stackup, SI/PI, DFM, firmware assumptions, and manufacturing files have passed their reviews.
3. **Product-validated:** assembled hardware, firmware, HDMI sources, USB-C iPads, thermal behavior, and compliance have passed physical testing.

The September 3 hackathon entry must not depend on gates 2 or 3. Its success gate is a complete RoarCAD product journey plus an honestly labeled PocketRoar engineering package.

## Workstream A — complete the PocketRoar hardware

### A1. Freeze the product contract

- Select the exact USB-C iPad model and iPadOS version.
- Freeze video-only, unprotected HDMI input, 1080p30 YCbCr 4:2:2, and UVC output.
- Explicitly exclude audio, HDCP, iPhone compatibility, and simultaneous charging from revision A.
- Measure or bound the USB-C current available from the target host.

**Gate:** every required product input is verified and linked to evidence.

### A2. Acquire the missing vendor package

- Request Toshiba's TC358743 functional specification, register map, reference schematic, power sequence, decoupling guidance, errata, and simulation models.
- Obtain the Infineon/e-con CX3 reference schematic or a formal schematic review path.
- Confirm the CX3 SDK, boot-flash programming flow, USB VID/PID plan, and production lifecycle.

**Gate:** no critical connection or firmware sequence depends on guessed vendor behavior.

### A3. Resolve mechanical architecture

- Replace the 0.8 mm-only USB-C connector or change the mechanical strategy so it is compatible with the HDMI connector's 1.6 mm PCB requirement.
- Freeze board outline, mounting holes, connector edge locations, insertion loads, cable clearance, enclosure datum, and board thickness.
- Obtain a JLCPCB eight-layer controlled-impedance stackup and via-in-pad/BGA escape rules.

**Gate:** both connector drawings and the selected fabricator stackup agree with the board geometry.

### A4. Build verified CAD libraries

- Create ball-accurate TC358743 and CYUSB3065 symbols.
- Audit every power, ground, DNU, reset, strap, clock, high-speed, and low-speed pin.
- Create or import manufacturer footprints for both BGAs, connectors, mux, protection, clocks, regulators, flash, and passives.
- Verify pad dimensions, paste apertures, courtyard, pin-one orientation, assembly rotation, and component height.

**Gate:** two-person symbol/footprint review with source drawings and hashes.

### A5. Complete the power tree

- Finalize the 5 V Type-C sink path, CC current detection, 5.95 V OVP, eFuse/current limit, and inrush control.
- Finalize 3.3 V, 1.8 V, 1.2 V, and low-noise 2.5 V rails.
- Add every converter inductor, feedback divider, compensation part, ferrite bead, bulk capacitor, and local decoupler.
- Implement the required reset and rail sequencing.
- Run vendor-model startup and CX3 USB PHY load-step simulations.

**Gate:** every rail remains within limits across startup, reset release, PHY enable, and worst-case load.

### A6. Complete the schematic

- Connect all four HDMI TMDS pairs plus DDC, CEC, HPD, EDID, 5 V sensing, shields, and protection.
- Connect all four MIPI CSI-2 data lanes and clock lane between TC358743 and CX3.
- Connect USB 3 TX/RX, USB 2 D+/D−, Type-C orientation, CC, ESD, and mux control.
- Connect SPI boot flash, I²C control, oscillators, clock buffer, reset supervisor, straps, LEDs, and test points.
- Add named power domains, no-connect declarations, and bring-up measurement points.
- Run ERC, pin-direction, DNU, rail-ownership, and unconnected-required-pin audits.

**Gate:** zero unexplained ERC findings and an independent schematic review.

### A7. Implement minimum bring-up firmware

- Configure CX3 boot and recovery.
- Program TC358743, EDID, HPD sequencing, CSI timing, and error recovery.
- Implement the 1080p30 UVC descriptors and reject unsupported modes.
- Expose diagnostic counters for HDMI lock, CSI errors, USB errors, resets, and dropped frames.
- Unit-test descriptor lengths, initialization order, failures, and recovery using fixtures.

**Gate:** deterministic firmware tests and a documented flash/recovery procedure.

### A8. Place the eight-layer board

- Place connectors from the frozen mechanical datum.
- Place ESD and protection immediately behind connector pins.
- Place BGAs for short HDMI, MIPI, and USB paths with viable fan-out.
- Place clocks, regulators, decouplers, and rail islands according to their owners.
- Preserve continuous return paths and keep noisy switch nodes away from clocks and receivers.

**Gate:** placement review covers mechanics, assembly, return paths, thermal flow, and probing access.

### A9. Route and digitally verify

- Route HDMI, MIPI, and USB differential channels before low-speed nets.
- Match pairs and lanes to the approved timing/skew limits.
- Route clocks, power, SPI/I²C, resets, and test points.
- Complete ground/power planes and copper pours.
- Run DRC, length/skew checks, HDMI/MIPI/USB channel analysis, power-plane analysis, and thermal estimates.

**Gate:** zero unexplained DRC findings and reviewed SI/PI reports using the final stackup and route extraction.

### A10. Run DFM and generate revision-A artifacts

- Run JLCPCB DFM/assembly review, BGA/via-in-pad review, impedance review, and component-availability check.
- Freeze BOM substitutions; no silent alternatives.
- Generate Gerbers, drill files, BOM, CPL, schematic, assembly drawings, fabrication notes, validation report, and manifest.
- Obtain an independent final design review.

**Gate:** fabrication-ready status is granted manually only after all review evidence is attached.

### A11. Order and bring up prototypes

- Obtain a current quote and explicitly approve checkout; never automate payment.
- Inspect the unpowered boards and X-ray the BGAs/via-in-pad structures.
- Bring up with current limiting and verify resistance, rails, clocks, reset, boot, and thermals.
- Prove HDMI lock, CSI activity, USB enumeration, and a reference frame before extended testing.

**Gate:** a controlled bring-up report with measurements and failures, not a visual inspection claim.

### A12. Validate the product and release revision B

- Test 720p60 and 1080p30 with representative HDMI sources, cables, hot-plug orderings, and invalid/protected modes.
- Test USB 2 fallback, USB 3, reconnect, suspend/resume, brownout, firmware recovery, and multi-hour streaming.
- Test every claimed iPad/iPadOS/cable combination and measure current draw, temperature, and dropped frames.
- Run USB, HDMI, EMC/ESD, thermal, enclosure, DFM/DFT, pilot-yield, and programming-fixture work.
- Apply findings in revision B before any production claim.

**Gate:** only measured, repeatable compatibility and manufacturing claims are published.

## Workstream B — submit a winning RoarCAD hackathon project

### B1. Freeze the submission story

Position RoarCAD as the product: a transparent browser PCB workbench where humans and agents share requirements, evidence, revisions, validation, and manufacturing gates. PocketRoar is the stress test that proves the system knows when not to fabricate.

### B2. Close the live product journey

- Verify the four bounded tools in deployed WebMCP-enabled Chrome.
- Prove draft → focused inspect → non-mutating preview → visible human approval → validate/export.
- Complete a clean-profile share → continue → return → compare → adopt checkpoint handoff.
- Show the indicator reaching fabrication-ready.
- Show PocketRoar exporting engineering-only artifacts while fabrication and quoting remain blocked.
- Verify manual mode in the ChatGPT in-app browser and zero console errors.

### B3. Make the generic capability visible

- Use `draft_board` with a structured board that is not either bundled fixture.
- Show that the same compiler, checks, viewers, revisions, and exports work without a project-name branch.
- Keep the agent-provided parts/evidence visibly unreviewed until manual approval.

### B4. Finish repository evidence

- Keep the repository public and source-complete.
- Make GitHub detect the existing MIT license and display it in the repository About area.
- Point the README at the stable public demo URL.
- Keep CI, architecture, safety, testing, and reproducible run instructions current.
- Scan tracked files for secrets before the final submission.

### B5. Capture the demo assets

- Record only the clean RoarCAD browser tab; hide credentials, notifications, and unrelated tabs.
- Capture a scripted agent journey rather than hours of research or autorouting.
- Collect stills for the initial requirements, WebMCP tool list, preview diff, approved revision, fabrication export, and PocketRoar engineering block.

### B6. Produce the under-three-minute AI-assisted video

Target duration: 2:30–2:50 with public YouTube audio.

1. **0:00–0:15 — problem:** AI-generated PCBs can look finished while hiding dangerous assumptions.
2. **0:15–0:35 — product:** show RoarCAD's requirements, PCB/schematic, validation, and revision workspace.
3. **0:35–1:25 — WebMCP build:** the agent inspects PocketRoar, previews a real structured change, and the human approves it.
4. **1:25–1:55 — generic proof:** draft or modify a second custom board through the same tools.
5. **1:55–2:20 — manufacturing boundary:** export the indicator, then show PocketRoar fabrication and quote rejection.
6. **2:20–2:40 — impact:** explain transparent collaboration, evidence gates, and human control.
7. **2:40–2:50 — close:** public demo, repository, and future physical validation.

Use a real screen recording for the product interaction. AI may create the narration, captions, cuts, zooms, and title card, but must not fabricate browser behavior or hardware results. Review the final audio and captions before upload.

### B7. Complete the official Devpost packet

- Update the title, pitch, description, implementation explanation, AI/Codex disclosure, limitations, and testing instructions.
- Fill submitter type, countries, new/existing status, tested clients, AI tools, learning level, and career-value fields.
- Add the stable live URL, public repository URL, and public YouTube URL.
- State that Chrome with WebMCP enabled is the tested agent surface and the in-app browser retains manual mode unless live tool support is confirmed there.

### B8. Final review and submission

- Review the entry against WebMCP leverage, execution, potential impact, and creativity.
- Test every public link in a clean browser session.
- Confirm the demo contains no secrets or misleading claims.
- Submit by September 2, one day before the September 3, 1:00 PM Pacific deadline.
- Require explicit user confirmation immediately before the final Devpost submission.

## Recommended execution order before the hackathon deadline

1. Complete B1–B4 while advancing A1–A6 only as far as authoritative evidence permits.
2. Record B5–B6 from a clean, reproducible RoarCAD session.
3. Complete B7 and run B8.
4. Resume A7–A12 after submission without turning missing physical proof into a hackathon blocker.

## Non-negotiable claims boundary

The hackathon can be complete and competitive while PocketRoar remains engineering-only. PocketRoar becomes fabrication-ready only after A1–A10 pass, and product-ready only after A11–A12 pass.
