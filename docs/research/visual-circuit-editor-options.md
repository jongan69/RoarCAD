# Visual circuit editor options for RoarCAD

Checked: 2026-08-28. Sources are RoarCAD source, installed package declarations, and first-party project documentation only.

## Decision

**Do not replace RoarCAD's editor stack before the WebMCP deadline.** The lowest-risk path is to expose and explain capabilities already present in the installed tscircuit viewers:

1. Keep `BoardGraph` as the only design authority.
2. Keep PCB drag events as non-mutating previews until the visible **Approve & apply** action creates a revision.
3. Add a beginner audit layer around the existing schematic and PCB: selectable components, plain-English definitions, an electrical-flow story, connections, and translated validation messages.
4. After the contest, test connection authoring through the same preview boundary. Do not make raw viewer events or a second graph model authoritative.

This produces most of the beginner value without a new dependency, file format, compiler, persistence model, or safety path.

## What is already installed

RoarCAD pins `@tscircuit/core` 0.0.1763, `@tscircuit/pcb-viewer` 1.11.392, `@tscircuit/schematic-viewer` 2.0.88, and `@tscircuit/checks` 0.0.171. See [`package.json`](../../package.json) and [`bun.lock`](../../bun.lock).

The installed PCB viewer already accepts Circuit JSON and exposes `allowEditing`, `editEvents`, and `onEditEventsChanged`. Its official feature list includes component placement editing, trace routing, DRC visualization, layers, measurement, pan, and zoom. [tscircuit PCB Viewer README](https://github.com/tscircuit/pcb-viewer/blob/main/README.md)

RoarCAD already uses that seam. Unlocking placement lets a person drag a component; the emitted `edit_pcb_component_location` event is translated into RoarCAD's allowlisted `move-component` operation, previewed against the current revision, and applied only by the human approval button. See [`src/App.tsx`](../../src/App.tsx) and [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

The installed schematic viewer is a viewer, not a schematic editor, but version 2.0.88 exposes component-click and port-click callbacks. RoarCAD does not currently connect those callbacks to an inspector. That is the smallest useful integration gap.

tscircuit itself is MIT-licensed and compiles typed circuit definitions into Circuit JSON for schematic display, PCB display, checks, and manufacturing conversions. [tscircuit core](https://github.com/tscircuit/core) and [Circuit JSON](https://github.com/tscircuit/circuit-json)

### Important limitation

`BoardGraph` records component kind, reference, value, pins, physical placement, and net membership, but it does not record a reviewed plain-English purpose for each component. General explanations can be derived safely—“a resistor limits current”—and exact connections can be listed from nets. RoarCAD must not infer an exact design role—“this resistor is a pull-up”—unless the revision explicitly provides or a human reviews that claim.

## Option comparison

| Option | What can be edited | License and embedding | Mobile and accessibility | Fit with RoarCAD's safety model | Decision |
| --- | --- | --- | --- | --- | --- |
| **Existing tscircuit viewers** | PCB placement today; the upstream viewer also advertises trace routing. Schematic selection is available, but schematic editing is not exposed by the installed viewer API. | MIT; already embedded as React components and already consumes RoarCAD's generated Circuit JSON. | Canvas interaction needs large touch targets and a separate keyboard/HTML path. No official WCAG conformance claim was located, so the component list and inspector must remain usable without the canvas. | Best fit. Viewer events can remain proposals that become typed `ChangeOperation`s, validation results, a hash-bound preview, and then a human-approved revision. | **Use now.** No new dependency. |
| **React Flow** | Drag nodes, connect edges, validate connections, save/restore, and build custom nodes. It is a generic node editor, not an electrical schematic or PCB engine. | MIT React library. [Official repository](https://github.com/xyflow/xyflow) | Official docs provide keyboard-focusable nodes/edges, screen-reader support, customizable ARIA text, and a touch-device connection pattern. [Accessibility](https://reactflow.dev/learn/advanced-use/accessibility) and [examples](https://reactflow.dev/examples) | Safe only as a disposable proposal or explanatory view. RoarCAD would have to implement every electrical rule, port mapping, graph conversion, validation, and synchronization step itself. Making it authoritative would create a second graph model. | **Later prototype only:** a plain-English system-flow map, not PCB CAD. |
| **KiCanvas** | Pan, zoom, select, inspect, and download KiCad 6+ schematic/board files. Editing is an explicit non-goal. | MIT Web Component, but its embedding API is alpha and partly unimplemented. [Embedding API](https://kicanvas.org/embedding/) and [license](https://github.com/theacodes/kicanvas/blob/main/LICENSE.md) | The project says automated browser coverage is for desktop Chrome, Firefox, and Safari; mobile UI and mobile-browser coverage remain roadmap items. | Read-only use could preserve RoarCAD safety, but it first requires trustworthy KiCad import/export and adds a second representation. It cannot supply drag-and-drop editing. | **Defer** until KiCad interoperability becomes a proven adoption blocker. |
| **CircuitVerse** | Drag digital-logic elements, connect them with wires, edit properties, and run logic simulations. | MIT web application; completed simulations can be embedded by iframe. [Official features](https://docs.circuitverse.org/chapter1/chapter1-keyfeatures/) and [official repository](https://github.com/CircuitVerse/CircuitVerse) | Its primary interface is a canvas with movable panels. No first-party WCAG conformance claim was located, so accessibility would need independent proof. | Its model is digital logic—gates, buses, truth tables—not physical components, footprints, layers, routing, DRC, or manufacturing. Translation into `BoardGraph` would be a separate CAD implementation. | **Do not integrate.** Use only as interaction inspiration. |

## Lowest-risk beginner experience

This can be built entirely over current revision data and viewers:

1. **Click a part to understand it.** Wire the schematic viewer's component-click callback to a normal HTML inspector. Show a friendly name, a general definition, its value, its exact board connections, and the technical part data behind an expandable section.
2. **Tell the electricity story.** Present the revision's existing architecture steps as a short ordered path, for example: “Power enters → the resistor limits current → the LED turns on → current returns to ground.” Selecting a step should highlight or list the involved parts; the text remains usable without the canvas.
3. **Separate facts from explanations.** Label component-kind definitions as general knowledge, connections as facts from this revision, and any proposed role as unreviewed until a human confirms it.
4. **Translate every problem.** Keep the original engineering message, but lead with “what happened,” “why it matters,” “what to do next,” and whether it blocks manufacturing.
5. **Make current dragging discoverable.** Rename or explain **Unlock placement** as “Move parts on the board,” then retain the current preview and approval flow. Dragging must never silently create a revision.

No schema migration is required for this first pass. Current `kind`, `value`, `nets`, `architecture`, and validation results are enough to provide useful explanations without fabricating design intent. Add a reviewed per-component `purpose` field only after real users show that the general-definition-plus-connections model is insufficient.

## Safe follow-up experiment after submission

Prototype “connect two pins” only within the current tscircuit/BoardGraph stack:

1. Select a start pin and end pin in the schematic.
2. Build an `upsert-net` proposal; do not mutate the viewer or project.
3. Validate references and electrical constraints through the existing Zod/domain checks.
4. Show the semantic diff and readiness change.
5. Require the visible approval action to create the revision.

Gate the experiment on keyboard operation, 390 × 844 touch use, undo/cancel behavior, stale-preview rejection, and proof that neither a canvas action nor WebMCP can apply it automatically. If the installed schematic viewer cannot support reliable pin selection, stop there; a new diagram engine would not solve the underlying electrical-authoring problem cheaply.
