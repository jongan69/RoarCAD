# RoarCAD AI visibility audit

Checked: 2026-08-31. This is a search-grounded retrieval test from one assistant and one search index at one point in time. It is **not** a claim about every answer that ChatGPT, Gemini, Claude, Perplexity, or another assistant will produce. Results can vary by model, location, personalization, and index freshness.

## Product profile used for the test

- **Product:** RoarCAD
- **Category:** agent-native, browser-based PCB design, review, revision, and handoff workbench
- **Ideal customer:** early-stage hardware startups and small product teams that want people and AI agents to work on the same inspectable PCB model
- **Core problem:** letting an agent help draft, inspect, and propose PCB changes without silently applying, ordering, or presenting unverified work as fabrication-ready
- **Official URL:** [roarcad.vercel.app](https://roarcad.vercel.app/)
- **Primary competitors:** Flux, Quilter, and Circuit Mind

This framing comes from RoarCAD's current [public source and product description](https://github.com/jongan69/RoarCAD): one versioned `BoardGraph`, four WebMCP tools, human-only approval, immutable checkpoints, checks, and engineering/fabrication exports.

## Why these competitors

These products overlap with different parts of RoarCAD rather than being identical:

| Product | Relevant official positioning | Main overlap with RoarCAD |
| --- | --- | --- |
| [Flux](https://www.flux.ai/p) | Browser-based AI ECAD covering planning, schematic/BOM generation, layout, manufacturing output, collaboration, version control, and reviewable AI actions | Closest broad product comparison |
| [Quilter](https://www.quilter.ai/free-ai-pcb-design) | Physics-driven automated PCB placement and routing from an existing schematic, returning native ECAD files | Closest autonomous-layout comparison |
| [Circuit Mind](https://www.circuitmind.io/) | Converts a hardware architecture into a verified schematic and BOM and optimizes component selection | Closest requirements-to-schematic comparison |

Flux says its AI plans, explains, generates schematics/BOMs, places and routes, and checks in at key decisions. Quilter's [official workflow explanation](https://docs.quilter.ai/about-quilter/how-does-quilter-work) emphasizes physics-level constraints, multiple candidates, and Physics Rule Checks. Circuit Mind says it automatically generates schematics and BOMs optimized for size, cost, power, availability, and lifecycle.

## Results

"Cited" means a live result linked to the product's own site or a page specifically about that product. A product merely named in another result's snippet counts as mentioned, not directly cited.

| Query | RoarCAD mentioned? | RoarCAD cited with a link? | Top recommendations and citations | Notes |
| --- | --- | --- | --- | --- |
| `best AI PCB design tool for hardware startups` | No | No | [ProtoFlow](https://www.protoflow.ai/compare/best-ai-pcb-design-tools-for-professionals) ranked first; [MakerPCB](https://www.makerpcb.com/learn/detail/ai-pcb-design-tools-2026-auto-routing-eda-suites-dfm.html) named Flux and Quilter; [AtlasPCB](https://www.atlaspcb.com/blog/ai-pcb-design-tools-landscape-2026-copilot-autonomous-layout/) categorized Flux as a copilot and Quilter as autonomous layout; [Quilter's comparison](https://www.quilter.ai/blog/the-2026-guide-to-autonomous-pcb-design-quilter-vs-deeppcb-vs-flux-ai) also surfaced | Results favor pages that explicitly define categories and compare tools. RoarCAD had no ranking or category association. |
| `Flux.ai alternatives` | No | No | The first result treated Flux as an image generator. The first PCB-specific result was [Palpable's alternatives guide](https://palpable.technology/guides/flux-alternatives), which ranked KiCad first; [AlternativeTo](https://alternativeto.net/software/flux-ai/) also ranked KiCad first and named Fritzing, QUCS, EAGLE, and EasyEDA | The query is highly ambiguous because "Flux" also names image, finance, batch-processing, and consulting products. Neither Quilter nor Circuit Mind was prominent in this retrieval. RoarCAD has no entity signal strong enough to enter the PCB-specific branch. |
| `how do I safely design a PCB with AI agents` | No | No | [Siemens](https://blogs.sw.siemens.com/cicv/2026/07/29/self-verifying-eda-ai-agents/) surfaced first among relevant official sources; [SemiEngineering](https://semiengineering.com/the-architecture-decisions-behind-a-production-ready-eda-ai-agent/) emphasized boundaries and human oversight; [PCB Flow](https://github.com/NijoP/pcbflow) emphasized versioning and human review; a [JLCPCB Flux tutorial](https://jlcpcb.com/blog/how-to-design-a-pcb-with-fluxai) linked Flux | This query closely matches RoarCAD's strongest safety differentiation, yet RoarCAD was absent. Search results already reward governance, provenance, validation, versioning, and human-in-the-loop language. |
| `cheapest AI PCB design tool for startups` | No | No | [ProtoFlow's free-tools guide](https://www.protoflow.ai/compare/free-ai-pcb-design-tools) ranked first and positioned itself as free; [Volnara](https://www.volnara.com/) advertised a free tier; [Trace pricing](https://buildwithtrace.com/pricing) advertised pay-as-you-go and paid plans; Flux, Quilter, and DeepPCB appeared in comparisons, with [Flux](https://www.flux.ai/p/) and [DeepPCB pricing](https://deeppcb.ai/pricing/) also directly linked | RoarCAD's free, MIT-licensed, local-first value did not surface because the live site has no indexable pricing/license page or "free AI PCB tool" landing-page signal. |
| `Flux.ai vs Quilter vs RoarCAD` | No | No | [Flux's official documentation](https://docs.flux.ai/reference/model-selection) ranked first; [Quilter's Flux/DeepPCB comparison](https://www.quilter.ai/blog/the-2026-guide-to-autonomous-pcb-design-quilter-vs-deeppcb-vs-flux-ai) ranked second; [DeepPCB](https://deeppcb.ai/deeppcb-vs-quilter-open-source-routing-compared-2026/) and [SourceForge's Flux-vs-Quilter page](https://sourceforge.net/software/compare/Flux.ai-vs-Quilter/) followed | This is the strongest negative signal: even an exact branded comparison query dropped RoarCAD and answered around the two established entities. No three-way comparison or RoarCAD source appeared. |

### Mention and citation totals

- RoarCAD mentions: **0 of 5 queries**
- RoarCAD direct citations: **0 of 5 queries**
- RoarCAD appearances in the exact branded comparison: **0**
- Extra brand check (`RoarCAD PCB WebMCP`, exact-domain, Devpost, and GitHub variants): **no RoarCAD result returned**

## Assessment

**Visibility score: Invisible in this test.**

The product is live and relevant, but the search index did not recognize RoarCAD as an entity even when the query supplied its name. This is primarily a discovery and authority problem, not evidence that the product is a poor fit.

The current live HTML exposes only the title `RoarCAD` and the description `Transparent, agent-assisted PCB design in the browser.` The repository currently has no `robots.txt`, sitemap, canonical URL, Open Graph metadata, or structured `SoftwareApplication` data. Most detailed product language lives in a client-rendered app and a GitHub README. That gives retrieval systems much less crawlable, connected evidence than the competitors' dedicated product, guide, pricing, comparison, and documentation pages.

## Highest-ROI improvements

### 1. Establish one crawlable product entity

Use a stable branded domain as the canonical home. Keep `roarcad.vercel.app` as the deployment target, but make every public surface—site, GitHub, Devpost, demo video, and profiles—use the same product name, one-sentence definition, canonical URL, logo, author/organization, and license.

The homepage should include static, crawlable HTML that directly states:

> RoarCAD is a free, open-source, agent-native PCB review and collaboration workbench for hardware startups. AI can draft, inspect, and preview changes; a person must approve every revision and manufacturing action.

Add a descriptive title, canonical link, Open Graph/Twitter cards, `SoftwareApplication` JSON-LD, `robots.txt`, and a sitemap. These are entity basics, not a substitute for useful content.

### 2. Publish pages that answer the tested questions

Create a small set of honest, specific pages rather than a generic SEO blog:

- **Safe AI PCB design:** turn the existing verification ladder into an indexable guide answering `how do I safely design a PCB with AI agents`.
- **RoarCAD vs Flux vs Quilter:** explain that Flux is broad browser ECAD, Quilter automates physical layout, and RoarCAD focuses on inspectable agent changes, immutable handoff, and human approval. Do not claim feature parity.
- **Flux.ai alternatives for safe agent workflows:** include "PCB design" in the title and URL to disambiguate the image-model Flux.
- **Free/open-source AI PCB workflow:** clearly state what is free, local, open source, and excluded; link the MIT license and public source.
- **PocketRoar case study:** show the design objective, exact revision, zero digital-check errors, remaining physical proof gates, and why RoarCAD refused to overstate readiness.

Each page should answer its question in the first paragraph, show a comparison table where appropriate, cite primary competitor sources, name an author, include a checked date, and link to the live product plus source.

### 3. Create evidence other sites can cite

Publish a reproducible benchmark/evaluation page for:

- agent tool selection and safety no-call cases;
- preview-versus-approval state integrity;
- checkpoint corruption and tamper rejection;
- compiler/checker results and known limitations;
- a real A → B → A checkpoint handoff.

Expose exact commands, fixtures, result files, versions, dates, and limitations. Citation systems prefer concrete evidence over unsupported adjectives.

### 4. Earn third-party entity links

Link the canonical site from the GitHub repository and Devpost entry, publish a tagged GitHub release, and seek relevant listings or references from the tscircuit ecosystem, WebMCP directories, hardware-startup communities, and EDA publications. A few relevant, independent links are more valuable than many generic directory submissions.

### 5. Retest mentions and citations separately

Run these same five prompts monthly in logged-out sessions across several answer engines. Record:

- whether RoarCAD is named;
- whether a RoarCAD-owned page is linked;
- whether an independent source is linked;
- position and recommendation context;
- which page supplied the claim.

The first practical milestone is not "rank number one." It is for the exact branded comparison to resolve RoarCAD correctly, then for the safety and free/open-source queries to cite one authoritative RoarCAD page.

## What not to prioritize

- Do not create dozens of thin AI-written pages.
- Do not invent customer counts, reviews, pricing, certifications, or fabrication success.
- Do not treat `llms.txt` or schema markup as a shortcut around crawlable content and independent authority.
- Do not position RoarCAD as a proven replacement for professional PCB engineering; its truthful human-approval and evidence-boundary story is the differentiator worth making discoverable.
