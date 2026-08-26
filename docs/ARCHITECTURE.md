# Architecture

RoarCAD has one canonical, versioned `BoardProject`. Every revision contains the requirements, architecture, exact components, official evidence metadata, board specification, risks, and validation outcome. Browser storage keeps at most 30 revision records; Circuit JSON and large manufacturing artifacts are regenerated.

The React UI and WebMCP registrations call the same validated domain actions. A change is a structured operation bound to a base revision. Previewing is non-mutating; applying a stale preview fails. Export requires both requirements validation and `@tscircuit/checks`, then hashes every artifact with SHA-256.

The browser sends a size-bounded bundle to same-origin Vercel functions. JLCPCB credentials are server-only. The current public build provides an honest manual-upload fallback because the account-specific API request/response contract is unavailable without approved access.

PocketRoar remains a separate, untouched codebase. RoarCAD only records its frozen native-source compatibility questions and evidence gates.
