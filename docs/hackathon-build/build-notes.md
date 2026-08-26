# Build notes

The first build deliberately supports three bounded edits: board resize, resistance change, and component move. That is enough to prove preview/apply semantics without accepting arbitrary agent-generated code.

Live JLCPCB prices and cart creation remain disabled until developer access supplies a documented, account-approved contract. The fallback is part of the safety design, not a mock quote.

## 2026-08-26 execution-plan refresh

Jonathan chose an AI-led demo centered on visibly building the PocketRoar design. The plan therefore uses autonomous execution with review pauses at hardware-claim freeze, final video approval, and final submission. The submission story treats RoarCAD as the completed product and PocketRoar as an engineering stress test; physical PocketRoar completion continues on a separate evidence-gated ladder after the hackathon entry is ready.
