# PocketRoar PCB verification ladder

Checked: 2026-08-28. This note uses RoarCAD source plus first-party EDA, silicon-vendor, standards-body, platform-owner, adapter-maker, and fabricator sources.

## Decision

RoarCAD can prevent many bad fabrication orders, but **software cannot prove that PocketRoar works**. The honest target is a staged evidence system in which each check proves one narrow thing and never silently promotes a design past the next gate.

PocketRoar is currently an **engineering candidate**, not a fabrication-ready or iPhone-compatible design. Its present HDMI → TC358743 → MIPI CSI-2 → CYUSB3065 → UVC architecture resembles the external-camera path Apple documents for USB-C iPad. Apple explicitly says only iPad supports external cameras in that API, while the SeeMo comparison product accepts HDMI, compresses the video, and uses a companion iOS app. The current graph therefore does not yet prove the actual iPhone product premise. [Apple's iPad external-camera session](https://developer.apple.com/videos/play/wwdc2023/10106/), [Accsoon SeeMo 4K](https://accsoonusa.com/accsoon-seemo-4k-ios-hdmi-adapter/), and [the existing PocketRoar source review](./pocketroar-iphone-capture-inspiration.md)

The safest path is:

1. prove the iPhone transport with evaluation hardware or a known SeeMo-class device;
2. freeze the exact electrical architecture, parts, firmware, stackup, and test plan;
3. pass automated and independent design review;
4. order a small prototype run;
5. prove the assembled hardware on the bench and on the exact iPhone.

## What RoarCAD verifies today

| Check | Current implementation | What it proves | What it does **not** prove |
| --- | --- | --- | --- |
| Input and graph structure | Zod bounds board geometry, layers, components, pins, pads, nets, net classes, differential pairs, pours, holes, keepouts, evidence, and requirements. It rejects duplicate references/pins/nets and references to unknown pins, nets, or net classes. [`src/domain.ts`](../../src/domain.ts) | The stored `BoardGraph` is structurally valid and internally referentially consistent. | Correct circuit behavior, correct vendor pinout, safe values, complete support circuitry, or manufacturability. |
| Footprint metadata | Each part has an MPN, manufacturer, footprint source/identifier, review state, and evidence IDs. Custom pad maps must contain pads, and pad hints must resolve to declared component pins. [`src/domain.ts`](../../src/domain.ts) | RoarCAD can detect internally inconsistent pad maps and preserve review provenance. | That a library footprint matches the package drawing, that ball/pad numbering is correct, or that solder-paste/courtyard/mechanical details are suitable. |
| Human/evidence gates | Required inputs, components, footprints, and official evidence must be visibly reviewed; unresolved risks hold readiness at engineering. Incoming checkpoint approvals are reset. [`src/domain.ts`](../../src/domain.ts), [`docs/SAFETY.md`](../SAFETY.md) | Agent assertions cannot independently make a revision fabrication-ready. | That a reviewer was qualified, that a linked document supports the exact claim, or that a supplier page is current. |
| Compile and basic PCB checks | RoarCAD compiles the graph with tscircuit and calls `runAllChecks` on Circuit JSON. The installed `@tscircuit/checks` 0.0.171 covers placement, basic netlist/pin specification, and routing checks such as out-of-board geometry, overlaps, keepouts, copper-edge clearance, missing routes, trace/pad/via clearance, via spacing, and connector/test-point accessibility. [`src/eda.tsx`](../../src/eda.tsx) and [tscircuit checks v0.0.171](https://github.com/tscircuit/checks/tree/v0.0.171) | The generated Circuit JSON compiled and passed the checks that this exact checker version implements. | Full ERC, vendor-specific electrical rules, impedance, return paths, crosstalk, power integrity, thermal behavior, EMC, or a fabricator's process rules. |
| Reproducible manufacturing package | RoarCAD generates Circuit JSON, Gerber/drill, BOM, placement CSV, validation output, project data, and a SHA-256 manifest. Engineering exports include `ENGINEERING_ONLY.md`; fabrication export requires fabrication readiness. [`src/eda.tsx`](../../src/eda.tsx) | The files correspond to the immutable revision and can be checked for corruption or substitution. | That the files describe a working board or will be accepted by a manufacturer. |

The generated `digital-verification.md` already states that analog/power SPICE, HDMI/MIPI/USB SI, firmware/UVC, and host compatibility were **not run**. That boundary should remain truthful. [`src/eda.tsx`](../../src/eda.tsx)

## Production-honest verification ladder

### Gate 0 — freeze the product claim and test matrix

**Feasible next; must precede schematic completion.**

- Record the exact Sony camera and firmware, HDMI mode, color encoding, resolution/frame rate, audio scope, target iPhone and iOS version, cable, power source, companion app/API, latency target, and reconnect/thermal requirements.
- Decide whether PocketRoar is a standards-class UVC device or a SeeMo-class compressed accessory with a companion app. Do not design both by accident.
- Treat direct iPhone UVC as unproven. Apple documents USB-C iPad UVC external cameras and states that only iPad supports external cameras in this API; its iPhone USB-C guide documents storage, microphones, displays, and data rates but not UVC camera input. [Apple WWDC23](https://developer.apple.com/videos/play/wwdc2023/10106/) and [Apple iPhone USB-C guide](https://support.apple.com/en-us/105099)
- A SeeMo-class architecture is also not proven merely by observing the commercial product. Accsoon says SeeMo accepts HDMI, works with recent iPhones/iPads, streams video, charges the device, and uses the Accsoon SEE app; its public product page does not disclose a cloneable internal protocol. [Accsoon SeeMo 4K](https://accsoonusa.com/accsoon-seemo-4k-ios-hdmi-adapter/)

**Exit evidence:** a written, bounded requirement set plus a bench capture showing the chosen transport on the exact iPhone. Until then, downstream PCB work is exploratory.

### Gate 1 — schema and connectivity integrity

**Implemented today; strengthen next.**

Keep the current Zod/reference checks. Add deterministic audits for:

- every required pin connected or explicitly marked intentionally unconnected;
- exactly one owner/driver for each power rail and no incompatible outputs shorted together;
- required power, ground, reset, reference clock, boot-mode, debug, shield, and test pins;
- no isolated net islands, duplicate physical pads, or net-name polarity mistakes;
- complete HDMI TMDS/DDC/HPD/CEC/shield, MIPI clock/data lanes, USB 2 D+/D−, USB 3 TX/RX, CC/orientation, VBUS/protection, and every rail/return connection required by the selected architecture.

This is the correct place for fast unit tests. It still checks the model, not the real schematic.

### Gate 2 — symbol, footprint, and pad mapping

**Partly implemented; high-priority next.**

- Compare every symbol pin/ball, footprint pad, and net assignment against the exact manufacturer package drawing and pin table.
- Store the document revision and hash used for each review. Reject package aliases unless the land pattern is explicitly reviewed.
- Check BGA pitch, ball map orientation, pin-1 marker, exposed pads, no-connect balls, thermal vias, paste apertures, courtyard, component height, connector shell tabs, board-edge relationship, and mating orientation.
- Require a second-person review for the TC358743 and CYUSB3065 BGA maps and both external connectors.

KiCad warns that ERC is only useful when symbol electrical pin types are correct, and that incorrect symbol-to-simulation-model pin assignments can produce misleading simulation results. The same principle applies to symbol-to-footprint mapping. [KiCad schematic/ERC documentation](https://docs.kicad.org/9.0/en/eeschema/eeschema.html)

**Exit evidence:** signed pin/ball/pad comparison sheets tied to exact datasheet and package-drawing revisions. A footprint hash proves unchanged data, not that the data is correct.

### Gate 3 — full electrical rules check (ERC)

**Not implemented as a full ERC; feasible next through KiCad interoperability or a larger BoardGraph electrical model.**

RoarCAD currently knows pin names/numbers but not enough electrical semantics to reproduce a mature ERC. A real ERC must model input/output/bidirectional/open-drain/passive/power-in/power-out types and required connections. KiCad's ERC detects incorrect and missing connections, but KiCad also states that incorrect pin electrical types make ERC results invalid. [KiCad ERC documentation](https://docs.kicad.org/9.0/en/eeschema/eeschema.html)

Required PocketRoar rules include rail-voltage compatibility, required decoupling and bulk capacitance, regulator enable and feedback networks, reset timing, clock source/loading, I2C pull-ups, boot flash/straps, USB-C role/orientation, ESD placement intent, unused-pin treatment, and prohibition of output-to-output connections.

**Exit evidence:** zero unexplained ERC findings plus an independent schematic review against each vendor checklist. Do not suppress errors without a reason attached to the revision. KiCad's CLI can emit ERC reports and fail CI when violations exist. [KiCad CLI ERC](https://docs.kicad.org/9.0/en/cli/cli.html)

### Gate 4 — PCB design rules check (DRC)

**Basic checks implemented; full board/fabricator rule deck remains next.**

Keep tscircuit's checks as an early guardrail. Before fabrication, run a mature layout DRC against the final stackup and manufacturer limits, including:

- copper, hole, annular ring, solder-mask, silkscreen, courtyard, board-edge, slot, keepout, and assembly clearances;
- unconnected items and schematic/PCB parity;
- BGA escape and via-in-pad/microvia rules;
- differential-pair gap, uncoupled length, routed length, and skew;
- plane continuity, return-path changes, stitching vias, and reference-plane splits.

KiCad says DRC verifies board-setup requirements and pad connectivity and should be run before manufacturing files; it separately reports violations, unconnected items, and schematic/PCB differences. It supports custom rules for length, skew, differential gap, and uncoupled length. [KiCad DRC and differential-pair documentation](https://docs.kicad.org/9.0/en/pcbnew/pcbnew.html)

**Exit evidence:** zero unexplained DRC findings using the exact release files and frozen rule deck.

### Gate 5 — BOM, evidence, lifecycle, and supply

**Evidence/review metadata implemented; live supply qualification not implemented.**

- Resolve every designator to exact manufacturer, MPN, package, value/tolerance/rating, lifecycle state, approved supplier, and quantity.
- Check voltage/current/power/temperature derating and alternate parts. Never silently substitute a regulator, clock, connector, ESD device, BGA, or impedance-sensitive passive.
- Validate BOM-to-placement designators one-to-one, including DNP parts and side/rotation.
- Cache source snapshots with retrieval time and document revision; treat live price/stock as expiring evidence.

JLCPCB requires Gerber, BOM, and CPL files for PCBA and warns that matching can fail because of stock or incomplete/non-standard BOM information; assembly uses the components the customer confirms in its matching list. [JLCPCB component matching guidance](https://jlcpcb.com/help/article/component-matching-guidelines-for-pcba-orders)

**Exit evidence:** frozen approved-vendor list, no unresolved shortages, complete ratings, and explicit substitution policy. This reduces procurement failure; it cannot guarantee future availability or assembly yield.

### Gate 6 — SPICE and power integrity

**Not implemented; feasible in stages.**

Start with simulations that match available models:

- DC operating points and worst-case rail currents;
- regulator startup/shutdown, sequencing, enable/reset timing, inrush, brownout, and load steps;
- clock/crystal networks where vendor models and guidance permit;
- temperature/tolerance corners and component power dissipation.

KiCad integrates ngspice and supports DC, AC, transient, noise, S-parameter, and other analyses. It can load external vendor SPICE and IBIS models, but ideal inferred passives omit parasitics, model compatibility varies, and pin mapping errors can invalidate results. [KiCad simulator documentation](https://docs.kicad.org/9.0/en/eeschema/eeschema.html)

Power integrity is a separate extracted-layout problem: use the final planes/vias/traces, capacitor parasitics and mounting inductance, regulator impedance/model, and realistic dynamic load profiles to check rail drop, target impedance, anti-resonance, and return current. Infineon's FX3 hardware guide calls for separate supply/ground treatment, close decoupling, short routing, and its schematic/layout checklist; these are design inputs, not proof from a generic SPICE run. [Infineon AN70707](https://www.infineon.com/assets/row/public/documents/24/42/infineon-an70707-ez-usb-fx3-fx3s-sx3-hardware-design-guidelines-and-schematic-checklist-applicationnotes-en.pdf)

**Exit evidence:** versioned models, netlists, corner definitions, plots, pass/fail limits, and reviewer sign-off. Simulation narrows risk; oscilloscope measurements must confirm startup, ripple, droop, and transients on assembled boards.

### Gate 7 — high-speed SI for HDMI, MIPI CSI-2, and USB

**Constraints are stored; analysis is not implemented.**

RoarCAD stores target impedance and skew, but a numeric target is not proof that routed copper meets it. Analyze the final routed geometry with the actual stackup, dielectric/copper data, connector/cable/package discontinuities, vias/stubs, ESD and mux S-parameters, and transmitter/receiver models.

- MIPI: Infineon specifies for CX3 MIPI CSI-2 traces no longer than 100 mm, 100 Ω ±10% differential impedance, under 0.5 mm P/N mismatch, under 1.5 mm inter-lane mismatch, and P/N spacing twice trace width. [Infineon AN90369](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)
- USB: the full channel includes CX3, AC coupling, mux, protection, connector, cable, and iPhone. Infineon's throughput note says results depend on transfer type, buffering, host controller, OS, and external data path; internally generated FX3 benchmark data overstates external-input throughput. [Infineon AN86947](https://www.infineon.com/assets/row/public/documents/24/42/infineon-an86947-optimizing-usb-3.0-throughput-with-ez-usb-fx3-applicationnotes-en.pdf)
- HDMI: verify all receiver lanes and control signals against the Toshiba design material and model the connector/protection/channel. Toshiba's public datasheet establishes the TC358743's HDMI-to-CSI function, package, pins, rails, and headline format limit; it is not a complete routed-board validation. [Toshiba TC358743 product and datasheet](https://toshiba.semicon-storage.com/eu/semiconductor/product/interface-bridge-ics-for-mobile-peripheral-devices/hdmir-interface-bridge-ics/detail.TC358743XBG.html)

**Exit evidence:** reviewed topology, impedance calculations, extracted-channel reports/eye margins, and explicit model gaps. Final electrical compliance still requires physical test fixtures and instruments; USB-IF identifies SigTest and USBET20 as official electrical signal-quality tools. [USB-IF compliance tools](https://usb.org/compliancetools)

### Gate 8 — stackup, impedance, DFM, and fabrication-file audit

**File generation implemented; manufacturer-specific approval not implemented.**

- Select an actual orderable stackup before routing; bind every controlled-impedance rule to its layer/reference plane, copper weight, dielectric thickness/material, trace width, and gap.
- Run manufacturer DFM on the exact Gerber/drill/BOM/CPL release and resolve every danger/warning or record an approved disposition.
- Independently view Gerber and drill output: outline/cutouts, layer mapping, drill alignment/plating, mask, paste, silkscreen, and rotations.
- Review assembly constraints, BGA process, stencil, X-ray/AOI needs, test access, panelization, impedance coupons, and any engineering questions from the fabricator.

JLCPCB's impedance calculator requires the selected stackup, layer, copper, reference plane, trace geometry, and material assumptions; its published values are reference values that may change. JLCPCB's DFM tool analyzes uploaded fabrication data and classifies findings, and its Gerber guidance recommends third-party output review before upload. [JLCPCB impedance calculator](https://jlcpcb.com/help/article/user-guide-to-the-jlcpcb-impedance-calculator), [JLCPCB DFM](https://jlcpcb.com/help/article/dfm-main-interface-help%3A-pcb), and [JLCPCB Gerber guidance](https://jlcpcb.com/help/article/how-to-generate-gerber-and-drill-files-in-kicad-6)

**Exit evidence:** exact stackup/order configuration, clean independent Gerber review, DFM report, resolved manufacturer questions, and a release manifest matching the reviewed files. Manufacturer acceptance proves processability, not electrical function.

### Gate 9 — firmware, USB/UVC, and iPhone software assumptions

**Not implemented and cannot be closed from the PCB alone.**

If CX3/UVC remains in the architecture:

- build reproducible firmware from source with frozen toolchain, descriptors, VID/PID ownership, endpoint/transfer type, supported formats/frame intervals, bandwidth and buffering calculations, boot flash, update/recovery path, and diagnostics;
- statically validate descriptors against USB Video Class 1.5 and run USB framework/class tests;
- test unsupported-mode rejection, hot plug, suspend/resume, orientation, USB 2 fallback if supported, and error recovery.

USB-IF publishes the UVC 1.5 document set and USB3CV for device-framework testing. These checks validate protocol behavior; they do not establish iPhone application compatibility. [USB-IF UVC 1.5](https://www.usb.org/document-library/video-class-v15-document-set) and [USB-IF compliance tools](https://usb.org/compliancetools)

Infineon's UVC guide is an implementation starting point, not finished PocketRoar firmware. [Infineon AN75779](https://www.infineon.com/dgdl/Infineon-AN75779_How_to_Implement_an_Image_Sensor_Interface_with_EZ-USB_FX3_in_a_USB_Video_Class_%28UVC%29_Framework-ApplicationNotes-v13_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073ad2b85f0d)

If PocketRoar instead uses a custom companion-app accessory transport, freeze the documented Apple-supported transport, entitlement/MFi boundary, framing, authentication if applicable, update/recovery, and app behavior before committing the PCB. Apple says USB Device Class accessories that use no MFi licensed technology are outside MFi, while External Accessory is for MFi accessory protocols; the selected transport determines which rules apply. [Apple MFi FAQ](https://mfi.apple.com/en/faqs) and [Apple accessory technologies](https://developer.apple.com/accessories/)

### Gate 10 — independent expert review

**Always required for PocketRoar.**

At minimum, review the requirement matrix, schematics, symbol/footprint maps, power tree and sequence, clocks/reset/boot, USB-C role and power, ESD/EMI, high-speed routing/return paths, thermal estimate, mechanics, DFM/DFT, firmware descriptors, licensing/compliance scope, and validation plan. The reviewer must receive the exact immutable revision and output manifest.

**Exit evidence:** named review, dated checklist, source revisions, findings, dispositions, and a new immutable RoarCAD revision after corrections. “Zero tool errors” is not a substitute.

### Gate 11 — assembled prototype and bench validation

**Impossible before hardware.**

Use a small prototype run with safe current limiting and staged bring-up:

1. inspect assembly, shorts, orientation, and rail resistance before power;
2. power rails one stage at a time; measure voltage, sequencing, inrush, ripple, load transients, and thermal rise;
3. prove clocks, reset, boot source, debug access, firmware load, and recovery;
4. prove HDMI HPD/EDID and lock with representative unprotected camera modes;
5. prove CSI lane activity/error counters and correct frame payload;
6. prove USB enumeration/descriptors and sustained video without drops;
7. measure latency, power, temperatures, hot-plug/reconnect, cable orientation, brownout, suspend/resume, and multi-hour soak;
8. perform pre-compliance USB electrical, ESD/EMI, and thermal tests before certification or production claims.

USB-IF's own compliance path requires physical fixtures and captured measurements for signal quality and inrush; this cannot be replaced by a DRC or simulation result. [USB-IF compliance tools](https://usb.org/compliancetools)

### Gate 12 — exact iPhone product validation

**Impossible without the target devices and the final app/firmware/hardware combination.**

Test every supported matrix entry, not “an iPhone” generically:

- exact iPhone model, iOS version, cable, power arrangement, app build, Sony camera/firmware, resolution, frame rate, pixel format, and orientation;
- discovery/connection, negotiated mode, first frame, sustained capture, dropped/corrupt frames, latency, audio if in scope, charging/power behavior, cellular/Wi-Fi coexistence, disconnect/reconnect, background/foreground, phone lock/unlock, thermal limits, and five-hour soak;
- unsupported phones, cables, modes, HDCP/protected sources, low-power conditions, and recovery behavior.

Apple's iPhone guide warns that cables differ in USB speed and that noncompliant accessories may fail or interfere with wireless connections. Those are physical matrix variables, not paperwork. [Apple iPhone USB-C guide](https://support.apple.com/en-us/105099)

**Exit evidence:** captured logs, video, measurements, failures, and pass criteria tied to the exact revision and binaries. Only this gate can support an iPhone compatibility claim.

## Recommended RoarCAD roadmap

### Clean wrap-up now

1. Keep PocketRoar at engineering readiness and keep fabrication/quote rejection.
2. Preserve the current schema, tscircuit checks, immutable exports, evidence review, and manifest checks.
3. Make the exported verification report show this ladder as explicit `passed`, `failed`, or `not run` evidence—not one ambiguous “validated” badge.
4. Keep the research and requirements in the revision; do not imply that every checklist item is automated.

### Highest-return next automation

1. Add required-pin/no-connect, power-owner, rail, and interface-completeness rules to BoardGraph.
2. Add a machine-readable symbol ↔ package-ball ↔ footprint-pad audit with document revision/hash.
3. Add KiCad export/round-trip only when it enables real ERC/DRC reports; do not build a second CAD model merely for appearance.
4. Attach versioned DFM, SPICE, SI/PI, firmware-test, and bench-test artifacts to immutable revisions.
5. Make fabrication readiness a policy over required evidence types and reviewer approvals, never a count of zero tscircuit findings.

### PocketRoar critical path

The eleven-net feasibility slice is now routed with zero compiler/checker errors. The next milestone should **not** be “make the render greener” or route more placeholder nets. It should be a bench architecture spike that proves one iPhone ingestion path. If direct UVC is the candidate, test it on the exact iPhone before more PCB work. If a SeeMo-class companion-app transport is required, identify a documented/licensable silicon and software path first. Only then freeze the complete schematic and invest in full differential-pair, SI/PI, and DFM work.

That is the smallest route to a genuinely useful PocketRoar board and the strongest guardrail against paying to print a polished but fundamentally incompatible design.
