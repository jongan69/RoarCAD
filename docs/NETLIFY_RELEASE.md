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
Before selecting **Continue as local fork**, download the recipient's local
backup and confirm it was saved; this is required even across different hosts.
Adopting a returned checkpoint retains the recipient's existing local history
and records incoming provenance, but resets incoming approval claims to
unreviewed. Adoption replaces the snapshot; it never auto-merges PCB graphs.

No database migration, new authentication service, or production credential
copy is required. Live quoting remains disabled even when credentials exist
until the provider contract and abuse controls are independently verified.

The native function declares a 20-request / 60-second limit per IP and domain.
This protects the public compilation boundary without application-level state.
It is not a global spending cap; shared-IP users share the allowance. Netlify
documents up to ten seconds of enforcement delay, and an invalid rule does not
fail the deploy. Verify deployment logs and a bounded live 429 test before
claiming enforcement. Normal smoke checks stay below this limit. Source:
[Netlify rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).

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

- Production release: [PR #10](https://github.com/jongan69/RoarCAD/pull/10)
  merged as `3895452567e767bbf2df5c1bb1ac46766af48fa6`. Netlify production
  deploy `6a987be18688ed000897bd4b` reached `ready` and published to
  <https://roarcad.netlify.app/> at 19:42:07 UTC.
  [Main CI run 33674811226](https://github.com/jongan69/RoarCAD/actions/runs/33674811226)
  passed typecheck, Biome, all 38 tests across 12 files, and build.
- Production HTTP smoke passed all seven HTML routes, discovery files, headers,
  invalid/oversized request refusals, indicator server compilation/manual
  fallback, and PocketRoar fabrication refusal. A clean production browser
  executed live WebMCP preview without changing history; visible approval
  created `d03a628e2c8e8f9d`. Worker-backed fabrication preparation returned
  manifest `637a2bffd909eeceff546f1a48aa54f0e5764ee3e3025b8796cc71865b0f899e`
  with `humanDownloadRequired: true`. No application console errors appeared.
- The pre-release Netlify handoff, PocketRoar bundle verification, cancellation,
  and mobile results below are separate from the production smoke. Chrome
  additionally passed manual preview, approval, and worker-backed indicator
  export. Its initial control-channel error came from the browser extension;
  no new Chrome WebMCP execution benchmark is claimed.
- CodeRabbit completed a full review through `59123ce`; its only new finding
  was the missing explicit backup prerequisite in migration guidance. That
  prerequisite and judge instructions were corrected in `0daa73d`; both review
  threads are resolved. Final Devpost publication, refreshed presentation
  assets, blind agent-selection measurement, and physical hardware validation
  remain distinct from this deployed software release.

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
- After explicit permission for disposable Netlify projects, the visible
  approval control created revision `d03a628e2c8e8f9d`; preview alone retained
  the original revision. A separate immutable-deploy origin opened its link
  read-only, required a backup before forking, and reset incoming approvals.
  The downloaded backup was verified as valid v2 JSON (6,610 bytes).
- Reviewer B returned `b83febfd32320e30`; author A saw common ancestor
  `d03a628e2c8e8f9d` and the D1 semantic diff. Explicit adoption created
  `6a6536c3499548f5`, retained both older local revisions, and stayed at
  engineering readiness. Engineering preparation exposed a human download
  button and disabled quoting. No Vercel project was changed.
- The journey exposed a same-tab link bug: checkpoint decoding ran only on
  initial load. The navigation watcher now handles hash changes, suppresses
  superseded decoding, and locks mutation controls during verification. Its
  focused regression covers valid links, invalid links, navigation away, and
  cleanup. Same-tab review and stale-checkpoint adoption refusal passed on
  branch deploy `6a98749335ca110007be77d8` from `1913e2a` without refreshing.
- PocketRoar export consumed the browser UI thread long enough to time out
  browser commands. CI measured approximately 59 seconds for its export test.
  Compilation and export now use a native module worker around the same shared
  implementation, with progress, cancellation, a three-minute ceiling, and
  stale-result protection. Real worker tests cover artifacts, cancellation,
  and fabrication refusal. The live Netlify branch completed PocketRoar
  compilation with zero viewer errors, then prepared and downloaded an
  engineering bundle while the schematic tab remained interactive. All nine
  manifest entries and the manifest hash verified against the downloaded ZIP:
  `a4f658eea46a66a0e8955e104c74797f272ef32590c94fa428a85cd5c4ea69f5`.
  The bundle contains 2,566 Circuit JSON elements, zero compiler errors, and
  159 review/check warnings. Fabrication was refused through live WebMCP.
  Starting another export and canceling it returned an explicit canceled
  notice. Production browser verification remains a separate gate.
- Source PR: [#10](https://github.com/jongan69/RoarCAD/pull/10). Production merge
  and final Netlify readback subsequently passed as recorded above. Devpost
  publication remains confirmation-gated. Historical Vercel browser evidence
  is not substituted for Netlify verification.
- Native rate limiting was deployed with `24b62c8` on branch deploy
  `6a98697276f4f20008805194`. A bounded sequential GET probe recorded 24 method
  refusals (405), followed by a provider throttle (429), consistent with
  Netlify's documented enforcement delay. No valid manufacturing request was
  sent in this probe. CLI deploy-log retrieval returned 404, so enforcement
  proof comes from the live response, not a claimed log inspection.
- [CI run 33666824234](https://github.com/jongan69/RoarCAD/actions/runs/33666824234)
  passed for the rate-limit and plain-English retry changes. CodeRabbit reviewed
  the migration through `b3aa189`; its one actionable documentation finding was
  addressed by distinguishing the submission deadline from judging start and
  citing the event-specific repo/site-freeze FAQ. Later small rate-limit changes
  have targeted tests and CI but are not claimed as independently reviewed.

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
over this dated record. Submissions close September 3 at 1 PM PT; judging
starts September 4 at 10 AM PT. The official resources FAQ, under “Can I edit
my submission after the deadline?”, explicitly includes the repo and live site
in its freeze until winners are announced. Preserve the submitted repo, site,
and entry after the deadline; use a separate fork for further work.
