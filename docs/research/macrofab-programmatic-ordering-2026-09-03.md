# MacroFab quote-to-order API boundary

Checked: 2026-09-03. Sources are limited to MacroFab's public API documentation,
knowledge base, legal terms, and the current first-party web application bundle.
No order was created, no payment endpoint was called, and no cost was incurred.

## Decision

MacroFab supports bare-PCB quotes and orders in its logged-in web platform, but it
does **not** currently publish a supported API contract for programmatically
creating, shipping, or paying for a bare-PCB order. RoarCAD can safely automate
project creation, file upload, processing, and a read-only quote, then hand the
user to MacroFab to review and complete checkout. It should not call MacroFab's
undocumented order-creation endpoint.

MacroFab added bare-PCB ordering to its platform in May 2024. Its public API
reference is older and documents PCB project and quote operations, but not the
new platform control that changes a design from `PCB + Assembly` to `PCB`.
[Bare-PCB workflow](https://help.macrofab.com/knowledge/ordering-bare-pcbs-vs-assembled-pcbs)
[Public API index](https://apidocs.macrofab.com/llms.txt)

## Authentication and proven access

The public API uses an account API key in the `apikey` query parameter. Keys are
created or revoked in the logged-in user's Settings page. No per-scope or
capability-discovery endpoint is documented.
[Authentication](https://apidocs.macrofab.com/reference/getting-started-with-your-api)
[API-key management](https://apidocs.macrofab.com/docs/accessing-your-api-key)

The current RoarCAD key was tested without exposing it. These non-billable calls
all returned HTTP 200:

- `GET /api/v2/pcbs`
- `GET /api/v2/orders` (zero orders)
- `GET /api/v2/sign_s3_upload` for an existing PCB/version; the file was not uploaded
- `GET /api/v3/pcb/{pcb_id}/{pcb_version}/ready/{quantity}`
- `GET /api/v4/quote/pcb/{pcb_id}/{pcb_version}/{quantity}`

This proves authenticated project, order-readback, upload-authorization,
readiness, and quote access. It does not prove order-creation or payment access;
there is no non-mutating documented probe for those capabilities.

## Supported quote path

The published project/file path is:

1. The public reference documents `POST /api/v2/pcb`, but that path returned HTTP
   404 in a live non-billable probe on September 3, 2026. The live provider flow
   currently accepts `POST /api/v2/pcbs` with `{ "pcb": { "name", "short" } }`
   and returns `pcb.pcb_id`. This undocumented plural path must keep a strict
   response contract and fail closed if it changes.
2. `GET /api/v2/pcb/{pcb_id}` to obtain the current version.
3. `GET /api/v2/sign_s3_upload` with `filename`, `upload_type=pcb`, `pcb_id`, and
   `pcb_revision`; response contains an S3 `uri` and signed `form_fields`.
4. Upload each Gerber/drill file to that signed S3 target.
5. Check the PCB files, processing errors, and manufacturability before quoting.

[Create PCB](https://apidocs.macrofab.com/reference/post_api-v2-pcb)
[Sign upload](https://apidocs.macrofab.com/reference/get_api-v2-sign-s3-upload)
[PCB files](https://apidocs.macrofab.com/reference/get_api-v2-pcb-pcb-id-pcb-version-layers)
[Processing errors](https://apidocs.macrofab.com/reference/get_api-v3-pcb-pcb-id-pcb-version-errors)
[Manufacturability](https://apidocs.macrofab.com/reference/get_api-v3-pcb-pcb-id-pcb-version-ready-quantity)

The public reference advertises
`GET /api/v3/pcb/{pcb_id}/{pcb_version}/quote`, but live probes returned a generic
HTTP 404 for both account projects and MacroFab demo projects. MacroFab's current
web application instead calls:

```text
GET /api/v4/quote/pcb/{pcb_id}/{pcb_version}/{quantity}
```

The current UI supplies quote tiers (`extreme`, `fast`, `standard`, `budget`) and
optional sourcing/panel inputs. The observed response is `{ "quote": ... }` and
includes `valid`, `invalid_reasons`, `warnings`, `lead_time`, `panel`,
`specifications`, and `totals`. The values RoarCAD needs are:

- `quote.totals.total.total_price`
- `quote.totals.total.unit_price`
- `quote.lead_time.business_days`
- `quote.panel.base_pcb.manufacturable`
- the returned PCB ID, version, quantity, and manufacturing specifications

[Published quote reference](https://apidocs.macrofab.com/reference/get_api-v3-pcb-pcb-id-pcb-version-quote)
[Current first-party application bundle](https://factory.macrofab.com/master-b323ef0f133752c84a8ef49bc77d994d86823915/build/shared.bundle.js)

Because `/api/v4/quote/...` is used by MacroFab's current application but omitted
from its public API reference, it is usable for a time-boxed quote demo only with
strict response validation and an honest provider-unavailable fallback. It is
not a stable published integration contract.

## Order creation and checkout boundary

The current first-party web application calls:

```text
POST /api/v3/order/pcb
```

with a body shaped as follows:

```json
{
  "order": {
    "pcb_id": "...",
    "pcb_version": 1,
    "quantity": 5,
    "tier": "standard",
    "force_all": false,
    "user_session_id": "...",
    "part_origins": {},
    "captured_panel_data": {},
    "captured_additional_service_costs": {},
    "include_mechanical_bom": false,
    "captured_component_costs": []
  }
}
```

It expects an `order_id`, then redirects the browser to
`/order/{order_id}?tab=...`. Crucially, the application invokes this endpoint
with `credentials: "same-origin"`, meaning the logged-in browser session, not
the documented API-key flow. The endpoint and request schema are absent from
the public API reference. No `Idempotency-Key`, client request ID, deduplication
rule, retry rule, or expiration behavior is documented.
[Current first-party application bundle](https://factory.macrofab.com/master-b323ef0f133752c84a8ef49bc77d994d86823915/build/shared.bundle.js)

MacroFab describes checkout as two human steps: shipping and payment, with
separate billing and shipping addresses supported. Its agreement requires the
product/quote identifier, quantity, schedule, ship-to location, and transport
instructions. Payment is 100% due at commencement unless separately agreed;
prices are in USD and may exclude taxes, duties, export fees, and uncaptured
NRE. Online orders become firm and final once paid.
[Checkout flow](https://www.macrofab.com/blog/platform-update-new-order-experience/)
[Manufacturing Services Agreement](https://www.macrofab.com/legal/msa)

The POST appears to create an unpaid checkout record before the shipping and
payment steps, but that is an inference from the redirect and legal terms—not a
published guarantee that it is a harmless draft or cart operation. Treat the
call as externally mutating and potentially consequential.

## Status and readback

MacroFab publicly documents:

- `GET /api/v2/orders` — list orders
- `GET /api/v2/order/{order_id}` — order details

The detail response includes status, events, submission/payment dates, PCB ID
and version, quantity, tier, invoice totals, shipping service/cost, tracking,
and delivery dates. It can also include shipping-address PII and payment
transaction metadata. RoarCAD must never proxy or log the raw response; expose
only a validated minimum such as order ID, status, dates, carrier, and tracking.
[Order list](https://apidocs.macrofab.com/reference/get_api-v2-orders)
[Order details](https://apidocs.macrofab.com/reference/get_api-v2-order-order-id)
[Privacy policy](https://www.macrofab.com/legal/privacy)

## Build recommendation

- Ship **live informational quoting**, not programmatic ordering.
- Upload only after a visible human quote request and disclose that Gerbers are
  sent to MacroFab.
- Validate every returned identifier, specification, amount, and readiness
  field; never calculate or invent a provider price.
- Show shipping, tax, and final acceptance as unavailable unless MacroFab
  returns them.
- Link the quoted PCB to `https://factory.macrofab.com/pcb/{pcb_id}` so the user
  can review, choose bare-PCB mode if necessary, and complete shipping/payment
  inside their provider-owned session.
- Keep order/payment endpoints out of WebMCP and RoarCAD server actions.
- Request a current supported order API, authentication contract, and
  idempotency guarantee from MacroFab before any future programmatic order
  implementation.
