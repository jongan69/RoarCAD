# RoarCAD

RoarCAD helps people and browser agents create, review, version, explain, and hand off PCB designs without confusing digital checks with physical proof.

## Language

**BoardGraph**:
The structured description of a board's geometry, parts, pins, connections, placement, and constraints. It is RoarCAD's single design authority.
_Avoid_: Canvas state, generated TSX

**Revision**:
An immutable BoardGraph snapshot plus its requirements, evidence, risks, validation state, and parent revision.
_Avoid_: Save, mutable draft

**Reference design**:
A bundled example used to demonstrate or stress-test RoarCAD. A reference design is not automatically a proven product.
_Avoid_: Certified board, finished product

**Engineering study**:
A design that can compile and produce review artifacts while still containing known unanswered electrical, physical, firmware, compatibility, or manufacturing questions.
_Avoid_: Working board, fabrication-ready board

**Schematic-complete candidate**:
A design whose required parts, pins, support circuits, and connections are explicit, with zero unexplained electrical-rule findings and an independent schematic review.
_Avoid_: Compiles successfully

**Fabrication-ready revision**:
A revision that has passed RoarCAD's digital evidence and validation gates and may prepare manufacturing files. It is not physical certification or proof that the assembled product will work.
_Avoid_: Guaranteed working, certified

**Product-validated prototype**:
An assembled board and firmware combination that repeatedly passes the documented bench, compatibility, recovery, thermal, and application tests on the exact claimed hardware.
_Avoid_: Rendered board, clean DRC

**Structural verification**:
Automated proof that the structured design parses, references valid pins and nets, compiles, and passes the implemented deterministic checks.
_Avoid_: Hardware validation

**Physical validation**:
Recorded measurements from fabricated hardware, including power-up, signal behavior, thermals, compatibility, recovery, and sustained operation.
_Avoid_: Simulation, visual inspection

**Transport proof**:
Evidence that the exact source, bridge, cable, iPhone, iOS version, and PocketRoar app can enumerate, deliver, decode, render, recover, and sustain the claimed video path.
_Avoid_: USB-C compatibility, UVC assumption

**General definition**:
A plain-language description of what a kind of part normally does. It does not claim that part's exact role in a particular design.
_Avoid_: Reviewed design intent

**Derived connection fact**:
A statement calculated from the current BoardGraph, such as which pins share a net.
_Avoid_: Inferred electrical purpose
