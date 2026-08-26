# RoarCAD — Devpost draft

## One-line pitch

RoarCAD makes AI-assisted PCB design inspectable: every requirement is visible, every change is previewed, and manufacturing remains human-approved.

## Inspiration

Hardware agents can generate impressive-looking designs while hiding missing requirements, stale assumptions, and risky manufacturing claims. We wanted the agent and builder to work in the same browser surface with the same evidence and safety gates.

## What it does

RoarCAD compiles a real two-layer power-indicator board with tscircuit, renders its PCB and schematic, previews bounded design changes without mutation, creates immutable approved revisions, runs design checks, and prepares Gerber, BOM, placement, validation, project, and SHA-256 manifest artifacts. Five WebMCP tools expose that exact workflow to an agent. A PocketRoar capture-bridge reference demonstrates the other half of trustworthy design: refusing to draft an integrated board while transport facts remain unknown.

## How we built it

Bun, Vite, React, TypeScript, Zod, tscircuit core/viewers/checks/exporters, Web Crypto, WebMCP, Vercel functions, and a server-only JLCPCB boundary.

## Challenges

We made preview/apply semantics stale-safe, kept generated artifacts out of browser persistence, resolved a tscircuit/Zod runtime compatibility issue, and treated missing manufacturer API access as an explicit fallback instead of inventing quotes.

## Accomplishments

- A generated board that routes, passes checks, and exports internally consistent artifacts.
- Exactly five page tools sharing the manual UI actions.
- A visible requirements block that prevents premature PocketRoar fabrication claims.
- Separate bare-PCB and PCBA handoff configurations without agent ordering or payment.

## What we learned

WebMCP is most useful here as progressive enhancement: it gives the agent structured access to a capable site without creating a second backend tool implementation. Trust comes from shared state, small change operations, and explicit human control at irreversible boundaries.

## What's next

Verify an approved JLCPCB quote/cart API account, add measured PocketRoar transport evidence, physically manufacture the indicator reference, and expand the structured design vocabulary only when real projects require it.

## Links

- Source: https://github.com/jongan69/RoarCAD
- Demo: https://roarcad-e64j06b89-jongan69s-projects.vercel.app
- Video: pending final recording

## AI disclosure

Codex assisted research, implementation, debugging, tests, documentation, and submission preparation. Jonathan Gan directed the product, safety boundaries, and acceptance decisions.
