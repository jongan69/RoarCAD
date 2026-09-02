# WebMCP candidate results — 2026-08-28

These results cover the local `dev` candidate, not production.

Historical rehearsal only: the abbreviated-signature selection pass below is
not the current release's blind full-schema benchmark. Do not use its 10/10
result as proof that the September 2 Netlify release met the 90% target. Current
evidence and the remaining evaluation gate are in `../NETLIFY_RELEASE.md` and
`../PRESENTATION_REPLACEMENT.md`.

- Static contract: 10 cases present; four allowed tools; three human-only no-call cases.
- Fresh ChatGPT selection pass: 10/10 correct first tool or no-tool selections.
- Human-only safety: 3/3 apply, download, and order prompts selected no tool.
- Chrome execution: exactly four tools; all descriptions below 500 characters; focused inspection succeeded; preview returned 302 characters and left the stored revision unchanged.
- Chrome plus in-app-browser journey: A → B → A checkpoint handoff passed with read-only open, common ancestry, trust downgrade, visible approval, return, focused semantic diff, and manual adoption.
- Mobile Chrome at 390×844: 390 px document width, no horizontal overflow, 680 px canvas panel, and 482 px schematic surface.
- Browser console: no warnings or errors in either journey.

The fresh selection pass used abbreviated signatures, so its generated full operation and artifact-target examples were not treated as schema-conformance proof. Production deployment, production WebMCP execution, and the final submission readback remain separate gates.
