# Netlify release

## Scope and acceptance

Keep React, Bun, BoardGraph, IndexedDB, WebMCP, and the shared manufacturing
handlers. Add native Netlify Functions and static hosting configuration, not a
second backend. Preserve Vercel as a working fallback.

Release requires:

- CI typecheck, lint, tests, and build from the release commit.
- Native Netlify packaging and a published deployment of that commit.
- Live static guides, crawl files, security headers, and mobile layout.
- Live server refusal of invalid, oversized, and engineering-only manufacturing
  requests; the indicator must return the honest manual-upload fallback.
- Live four-tool WebMCP registration, non-mutating preview, visible human
  approval, export preparation, and immutable checkpoint handoff.
- No claim of physical PCB proof, universal agent compatibility, live pricing,
  or a separate Netlify prize.

## Failure modes and migration

Netlify runs Node functions, while the original Vercel functions use Bun. Native
Request/Response handlers are shared; packaging and live execution must prove
runtime compatibility. Static routes must not swallow API errors. Server
responses must be non-cacheable and request bodies bounded before parsing.

IndexedDB is origin-scoped. A new hostname cannot read projects on the Vercel
hostname. Export the project JSON on the old site, then explicitly import it on
the new site. Keep the old site accessible; do not redirect users away from their
stored projects. Checkpoint fragments can also cross hosts, but intentionally
downgrade incoming review claims and do not transfer full local history.

No database migration, new authentication service, or production credential
copy is required. Live quoting remains disabled even when credentials exist
until the provider contract and abuse controls are independently verified.

## Rollout

1. Test shared request boundaries and Netlify routing on `dev`.
2. Run full CI and Netlify deploy-preview build.
3. Exercise the deployed app with WebMCP and manual controls.
4. Review the diff, merge `dev` into `main`, and verify production separately.
5. Record exact commits, deploy IDs, checks, and open evidence gaps here.
6. Update the submission packet with the verified URL. Obtain explicit approval
   before changing the final Devpost entry.

Rollback: republish the previous verified Netlify deploy; keep Vercel available.
Never clear browser storage to repair a deployment.

## Sponsor facts checked September 2, 2026

The live Devpost prize feed lists ten winners at $3,500 each, including $500
from Netlify. There are no judging tracks. The resource page describes 3,000
Netlify credits for each of the first 1,000 eligible builders, not 3 million
credits per project. The official rules listed September 1 at noon PT as the
credit-request deadline. Hosting on Netlify is permitted, not required.

Sources: [prizes](https://webmcp.devpost.com/),
[rules](https://webmcp.devpost.com/rules),
[resources](https://webmcp.devpost.com/resources). The official website prevails
over this dated record. Do not alter the submitted repo, site, or entry after
September 3 at 1 PM PT during judging.
