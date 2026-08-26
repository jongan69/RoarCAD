# Demo script — under three minutes

1. Open the indicator reference. Point out its exact MPNs, official datasheets, PCB, schematic, and immutable revision ID.
2. Ask the agent: “Inspect the current design and tell me what would block fabrication.”
3. Ask: “Preview moving D1 to 3, 2.” Show the visual diff and that the revision ID did not change.
4. Approve the preview. Show the new revision and history entry.
5. Ask the agent to validate and prepare Gerber, BOM, placement, and validation artifacts. Emphasize that the agent prepared them but the human controls download.
6. Select bare PCB or PCBA and request a JLCPCB quote. With no credentials, show the explicit no-price fallback and verified download package.
7. Switch to PocketRoar. Show the transport questionnaire, blocked canvas, and refusal to draft or export an integrated board.

Sample prompts:

- “Draft a small green power-indicator board.”
- “Inspect revision `<id>` for evidence and unresolved risks.”
- “Preview resizing the board to 28 by 18 mm.”
- “Apply change `<change-id>` to revision `<id>`.”
- “Validate revision `<id>` and prepare Gerber, BOM, placement, and validation outputs.”
