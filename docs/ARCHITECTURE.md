# Architecture

RoarCAD has one canonical `BoardProjectV2`. Every immutable revision contains requirements, architecture, evidence, risks, and a generic `BoardGraph`: board geometry, 1–10 layers, exact components and pins, bounded footprints, placement, nets, net classes, differential pairs, pours, holes, keepouts, and routing hints. IndexedDB keeps at most 30 lightweight revisions; Circuit JSON and manufacturing artifacts are regenerated.

The React UI and four WebMCP registrations call the same domain actions. The agent can draft, inspect, preview, and prepare validation/export results. Applying a preview is deliberately absent from WebMCP: only the visible UI can create the resulting immutable revision. The deep compiler interface is `BoardGraph → Circuit JSON`; its implementation maps only allowlisted tscircuit primitives and never evaluates generated TSX. A change contains allowlisted operations, a base revision, and a candidate hash. Previewing is non-mutating; applying stale or altered previews fails.

An immutable `CheckpointV1` contains one revision, bounded ancestor IDs, an optional note, and a SHA-256 integrity hash. Native browser gzip encodes it into a URL fragment, with a JSON file fallback. Opening a checkpoint is read-only. Continuing creates a local fork; adopting creates a new local revision after a semantic diff. External approval state is downgraded before readiness is recalculated, and divergent board graphs are never auto-merged.

Readiness is independent from a clean compile: `blocked` cannot compile, `engineering` can export a watermarked review package, and `fabrication-ready` may request manufacturing. Evidence, parts, and footprints supplied by an agent are forcibly downgraded to unreviewed; only visible human actions can approve them.

Plain-language component definitions are presentation aids only. They do not add evidence, resolve requirements, identify a part's exact circuit role, or change readiness.

The browser sends a size-bounded project and manufacturing configuration to same-origin Vercel functions. The server parses `BoardProjectV2`, verifies the current revision and layer count, recompiles a fabrication package, and only then considers JLCPCB. Credentials, request signing, and expiring quote tokens remain server-only. The current provider adapter returns an honest manual-upload fallback until the approved quote contract is known.

Both the indicator and PocketRoar are ordinary fixture data using the same compiler. PocketRoar remains a separate, untouched codebase; its RoarCAD project is an engineering candidate and preserves every physical and provider evidence gate.
