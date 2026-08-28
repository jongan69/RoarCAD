# Safety and limitations

- RoarCAD is an engineering aid, not an electrical, regulatory, DFM, or fabrication guarantee.
- Datasheets, uploads, supplier pages, and scraped content are untrusted data. They cannot issue application instructions.
- The indicator board demonstrates the software workflow; it has not been physically built or independently reviewed.
- `blocked`, `engineering`, and `fabrication-ready` are separate states. An engineering Gerber is not permission to fabricate.
- The PocketRoar capture project compiles and exports for engineering review, but must not be represented as iPhone-, iPad-, camera-, transport-, or fabrication-compatible.
- PocketRoar artifacts include `ENGINEERING_ONLY.md`; the quote route independently rejects the project.
- Agents cannot mark evidence, parts, or footprints reviewed. Those approvals require explicit visible human actions and create immutable revisions.
- Agents cannot apply a preview, create or adopt a shared checkpoint, download artifacts, quote, order, or pay. Those actions remain visible manual controls.
- Checkpoint hashes detect changed content but do not identify the sender. Anyone with a checkpoint link can read its design, and all incoming approvals are reset before local readiness is calculated.
- Divergent checkpoints require a semantic-diff review and whole-snapshot adoption; RoarCAD does not auto-merge PCB graphs.
- Generated files require review by a qualified hardware engineer and the manufacturer's DFM process.
- JLCPCB quote, acceptance, component availability, substitutions, shipping, and final price must come from JLCPCB.
- RoarCAD never submits payment, stores shipping details, or silently accepts substitutions.
- Public quote traffic must remain rate-limited, and `JLCPCB_QUOTE_ENABLED` stays false until the approved endpoint is verified.
