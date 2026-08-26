# Build specification

The canonical `BoardProject` is Zod-validated and revisioned by SHA-256. `@tscircuit/core` generates Circuit JSON; viewers render it; checks block errors; converter packages generate Gerber and placement files. The browser builds the exact-MPN BOM and artifact manifest. Five `document.modelContext.registerTool` calls wrap the same React actions. Vercel functions own the JLCPCB trust boundary.
