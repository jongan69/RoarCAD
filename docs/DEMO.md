# Demo script — under three minutes

1. Open the indicator reference. Show that it is an ordinary two-layer `BoardGraph` with reviewed exact parts, footprints, evidence, nets, PCB, schematic, and immutable revision.
2. Ask the agent to inspect the revision and readiness. It should report `fabrication-ready` without claiming physical validation.
3. Drag D1 or call `preview_design_change` with a move operation. Show the visual diff and unchanged revision ID, then approve it and show the new history entry.
4. Ask `validate_and_export` for a fabrication package. The agent prepares it, but the human controls the download.
5. Request a JLCPCB quote. Show the server-recompiled manifest and honest no-price fallback while the provider endpoint remains disabled.
6. Switch to PocketRoar. Show the same compiler rendering an eight-layer candidate with TC358743XBG, CYUSB3065-BZXC, exact connectors, clocks, power, and high-speed pairs.
7. Export its `ENGINEERING_ONLY` package, then show that fabrication export and JLCPCB quoting are rejected.

Sample prompts:

- “Draft this custom sensor board using the supplied structured BoardGraph.”
- “Inspect revision `<id>` for evidence and unresolved risks.”
- “Preview moving component D1 to x 3 mm, y 2 mm with a structured operation.”
- “Apply change `<change-id>` to revision `<id>`.”
- “Validate revision `<id>` and prepare a fabrication Gerber, BOM, placement, validation, project, and manifest package.”
