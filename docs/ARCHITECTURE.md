# Architecture

RoarCAD has one canonical `BoardProjectV2`. Every immutable revision contains requirements, architecture, evidence, risks, and a generic `BoardGraph`: board geometry, 1–10 layers, exact components and pins, bounded footprints, placement, nets, net classes, differential pairs, pours, holes, keepouts, and routing hints. IndexedDB keeps at most 30 lightweight revisions; Circuit JSON and manufacturing artifacts are regenerated.

The React UI and exactly five WebMCP registrations call the same domain actions. The deep compiler interface is `BoardGraph → Circuit JSON`; its implementation maps only allowlisted tscircuit primitives and never evaluates generated TSX. A change contains allowlisted operations, a base revision, and a candidate hash. Previewing is non-mutating; applying stale or altered previews fails.

Readiness is independent from a clean compile: `blocked` cannot compile, `engineering` can export a watermarked review package, and `fabrication-ready` may request manufacturing. Evidence, parts, and footprints supplied by an agent are forcibly downgraded to unreviewed; only visible human actions can approve them.

The browser sends a size-bounded project and manufacturing configuration to same-origin Vercel functions. The server parses `BoardProjectV2`, verifies the current revision and layer count, recompiles a fabrication package, and only then considers JLCPCB. Credentials, request signing, and expiring quote tokens remain server-only. The current provider adapter returns an honest manual-upload fallback until the approved quote contract is known.

Both the indicator and PocketRoar are ordinary fixture data using the same compiler. PocketRoar remains a separate, untouched codebase; its RoarCAD project is an engineering candidate and preserves every physical and provider evidence gate.
