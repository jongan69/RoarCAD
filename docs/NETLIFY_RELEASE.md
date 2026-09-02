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

Repeat the deployed HTTP checks with:

```sh
bun run smoke https://roarcad.netlify.app
```

This sends only the public bundled example projects to the selected deployment.
It checks static content, discovery files, headers, rejected methods, malformed
and oversized bodies, the indicator's compiled fallback, and PocketRoar's
fabrication refusal. It does not place orders or prove browser behavior.

## Evidence recorded September 2

- Native packaging and live HTTP checks passed for `9c9f7d3` on Netlify deploy
  `6a9866f1cb3dc423aa941f67`. The published function uses Node 22 and maps exactly
  the quote and handoff paths. The repeatable smoke script was added in
  `b3aa189` and passed against that deployment.
- [Branch CI run 33665544929](https://github.com/jongan69/RoarCAD/actions/runs/33665544929)
  passed typecheck, Biome, 36 tests across 11 files, and the production build.
- In-app-browser calls to inspection (overview, exact part, pagination, history)
  and preview passed on the Netlify branch origin. Preview returned
  `waitingForHumanApproval: true`; revision `5989bc5823543c90` still had one
  history entry afterwards. No apply, download, quote, order, or payment tool
  was registered.
- At 390 x 844, document width stayed 390 and schematic viewer height stayed
  483 pixels across two observations. No application console errors appeared.
- The saved-revision browser test was stopped by the browser safety check at
  the explicit approval click. Permission for disposable test revisions,
  checkpoint fork/adoption, and test backups was requested. Those steps are
  not reported as passing on Netlify yet.
- Source PR: [#10](https://github.com/jongan69/RoarCAD/pull/10). Production merge,
  final Netlify production readback, and Devpost publication are still separate
  gates. Historical Vercel browser evidence is not substituted for them.

The deterministic eval-file test checks ten case definitions, not measured AI
selection accuracy. Live tool execution above is direct integration evidence,
not a blind first-call benchmark across coding agents.

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
