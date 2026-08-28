# RoarCAD sample prompts

These prompts exercise the public WebMCP tools. Replace revision and change placeholders with the IDs returned by the preceding tool.

## Requirements-only draft

> Draft a two-layer 3.3 V I2C temperature and humidity breakout with a four-pin host connector, one Sensirion SHT40 sensor, and local decoupling. If exact pins, footprints, or evidence are missing, return a blocked requirements report instead of inventing them.

## Structured third-board proof

> Call `draft_board` using the environmental-monitor requirements and the structured `environmentMonitorGraph` defined in `src/samples.ts`. Then inspect the returned revision for evidence, footprint, and fabrication blockers.

The resulting design must stay at engineering readiness because agent-provided requirements, parts, footprints, and evidence are unreviewed.

## Preview and approval

> Inspect revision `<revision-id>` for readiness and unresolved risks. Preview moving U1 to x 3 mm, y 1 mm without changing stored state. Return the change ID and readiness transition, then wait for human approval.

Then use the visible **Approve & apply** button. There is deliberately no agent-callable apply tool.

## Export boundary

> Validate the current revision and prepare Circuit JSON, Gerber, BOM, placement, validation, project, and manifest artifacts as an engineering package. Do not download or order anything.

## PocketRoar stress test

> Inspect the current PocketRoar revision. Separate compile/check results from missing electrical, firmware, SI/PI, DFM, and physical iPad evidence. Prepare an engineering package, then explain why fabrication and quoting remain blocked.
