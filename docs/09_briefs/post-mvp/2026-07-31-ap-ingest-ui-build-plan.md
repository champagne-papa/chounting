# AP Ingest UI — Build Plan

**Grounded against** `main` = `cf6b0c3f`, 2026-07-31. Every claim carries a
`file:line`. Produced by a read-only codebase pass against seven designed
screens plus a shell redesign; nothing was changed during grounding.

**Purpose.** Bind the design to what the pipeline and UI actually provide,
before build. Four findings invert assumptions in the design brief — two of
them are safety/correctness issues, not sequencing ones. They lead.

---

## 0. Corrections that reshape the plan

### 0.1 ⚠️ TOP-LINE: "approve parks it, safe to click" is FALSE — approve POSTS TO THE LEDGER

**This is the highest-severity finding in the pass. It is a correctness and
audit problem, not a build-sequencing one.** A bookkeeper trusting a
"parks it, safe" label would commit a bill to the ledger believing they had
merely staged it.

Two different paths were conflated in the design brief:

- **Pipeline auto-post — DISABLED.**
  `agent/orchestrator/extraction/ingestDocument.ts:15` — *"the orchestrator
  PARKS matched proposals (status='parked_unposted'); the
  withInvariants(billService.post/paymentService.record) auto-post is
  DISABLED"* (Wave -1 bleed-stop, ADR-0007 §Tier 2 Q78). Four park sites:
  `:303, :382, :540, :626`.
- **Human approve — POSTS.**
  `api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts:11` documents
  the sequence `needs_review → proposed → approved → post → committed`, calling
  `billService.post` (`:180`) and `journalEntryService` (`:194`), driving the
  case to `committed` (`:305`). Ledger truth is written under the **reviewer's**
  identity (`ctx.caller.user_id → created_by`; the route header calls this
  "INV-5 realized").

The route is a state-aware resume and is idempotent: the JE write carries
`source_external_id = ${caseId}:bill | ${caseId}:payment`, and a `23505` on
`idx_je_source_external` is caught and reconciled rather than double-written
(`:14-24`). Partial multi-invoice posts hold the case at `approved`, and the
existing UI already surfaces that (`ReviewCaseDetailView.tsx:176`).

**Required design changes**

- Remove every "parks it" / "safe to click" affordance from screens 4, 5, 6.
- Approve is a real, audited, consequential write: explicit
  "this posts to the ledger" copy, a confirm step, and irreversible-action
  framing.
- The stepper (screen 5) is the sharpest case — rapid sequential approves means
  rapid sequential ledger commits. It needs more friction than a queue, not
  less.

### 0.2 ⚠️ Editable fields have NO backend — every such input is currently unbacked

The mockups show editable extracted fields. **There is no field-mutation
endpoint anywhere.** The review surface exposes exactly three actions
(approve-post, reject, resolve-exception — §3); none of them accept edited
field values.

This is the one place the design silently assumed a backend capability that is
entirely absent. Drawing the input is not the work; the endpoint is.

**And it is core AP work, not a nicety.** Bookkeepers will need to correct a
mis-extracted amount, date, or account code before approving — and per §0.1
approving *posts*, so an uncorrected field becomes a wrong ledger entry. Either
edit is in scope (net-new backend: endpoint, validation, audit, and a decision
about whether edits re-run matching) or the review screens must route
mis-extractions to reject/resolve rather than offering an input that cannot
save.

**This is a scope call, not a checkbox.** See §8 Q3.

### 0.3 PDF serving is a THIN build — risk DOWNGRADED

The brief read this as *"nothing exists; you're proxying app-only Graph
credentials to the browser."* Half right. There is genuinely **no**
byte-serving route — a search for
`ArrayBuffer|application/pdf|previewUrl|getDownloadUrl` across every
`src/app/api/**/route.ts` returns nothing.

But the hard part is already built and unused:

| Provider | Implementation | Returns |
|---|---|---|
| `sharepoint_drive` | `providers/sharepointDriveProvider.ts:169` | Graph `@microsoft.graph.downloadUrl` |
| `supabase_storage` | `providers/supabaseStorageProvider.ts:358` | Supabase signed URL |

Declared on the interface at `storageProviderService.ts:118`, returning
`{url, expires_at, provider}` (`services/storage/types.ts:161-172`). It has
**zero callers** — stated outright at `stages/byteFetch.ts:34`.

Both return **pre-authenticated** URLs the browser can hit directly. No Graph
token reaches the frontend; no app-only credential is proxied. The Graph URL
carries its own ~1h expiry; the provider clamps its *reported* TTL to ≤30 min so
callers re-mint early (`sharepointDriveProvider.ts:178-182`).

**Consequence:** build item #1 is a route calling an existing method. Still
first — the review half needs it — but scope it as a route, not an integration.

### 0.4 Source tracking already exists — DELETE this build item

The brief lists "capture source at ingest" as backend work. Already captured,
twice:

- `source_documents.ingest_channel` / `ingest_batches.ingest_channel`, enum
  `ingest_channel` = `drag_drop_pdf | forwarded_mailbox | direct_upload | api_ingest`
- Email specifics in `ingest_batches.channel_metadata` (JSONB), schema-**required**
  for `forwarded_mailbox` to carry `from / to / subject / message_id /
  attachment_count` (`shared/schemas/document-platform/ingestBatch.schema.ts:112`)

The queue's source tags are a **read**. Item removed.

---

## 1. What extraction actually produces

`shared/schemas/extraction/vendorInvoiceExtractionSchema.ts:41-56` — every field
`.optional()`:

```
amount: number                     currency: string
vendor_name: string                vendor_id: uuid | null
vendor_invoice_number: string      accounting_date: string
account_code: string               tax_code_id: string
due_date: string                   tax_amount: number
line_items: [{ description, amount, account_code, tax_code_id }]   (:35-40)
```

**No PO field.** Sibling schemas exist for `receipt` and
`payment_confirmation` in the same directory.

### Confidence: document-grain yes, field-grain no

The amber "check this flagged field" behaviour has no data source today.

- **Present:** `document_cases.classification_confidence`,
  `document_artifacts.confidence` (both numeric), per-type thresholds in
  `org_settings.confidence_threshold_{vendor_invoice,receipt,payment_confirmation,ambiguity_margin}`.
- **Absent:** any per-field score. Extractors return only a boolean
  `ai_fallback_invoked` (`vendorInvoiceExtractor.ts:181, 214, 222`). A repo-wide
  grep for `field_confidence|fieldConfidence|per_field|confidence_by_field`
  returns nothing.

**Cheaper path than adding scoring to every extractor.** OCR already emits
per-**line** confidence *and* bounding boxes — verified empirically against a
real ingested document:

```json
{ "bbox": [[85,58],[387,58],[387,81],[85,81]],
  "text": "O ROGERS BUSINESS",
  "confidence": 0.9217867851257324 }
```

So: attribute each extracted field to the OCR line(s) it came from and inherit
that line's confidence. The attribution mapping does not exist and is the real
work — but it is smaller and more testable than extractor-wide scoring, and it
delivers **highlight-provenance** (click a field → highlight its source region
on the page) from the same change.

**Recommended v1:** flag hard failures only (required field absent). Defer
amber-by-confidence until field-to-line attribution is scoped.

---

## 2. States, sources, and the "UI per state" assumption

The brief's four values mix three orthogonal axes. Modelling them as one list
produces a UI that cannot represent real cases.

| Axis | Column | Values |
|---|---|---|
| Case state | `document_cases.state` (`document_case_state`) | `received, extracting, classified, matched, proposed, needs_review, approved, committed, rejected, archived` (10) |
| Exception reason | `exception_queue_entries.exception_reason` | 15, incl. `unknown_document_type`, `bank_detail_change_suspected`, `duplicate_invoice_suspected`, `statement_not_invoice_suspected`, `multi_invoice`, `provider_unavailable` |
| Exception status | `exception_queue_entries.exception_status` | `open, resolved, cancelled` |
| Post status | `extracted_invoices.post_status` | `pending, posted, unrepairable` |

`parked_unposted` is **not** a DB enum value — it is the in-code
`ProposalResult.status` (`ingestDocument.ts:303` et al). `document_type` has
**18** values, not the 3–4 the mockups assume.

A queue row is a tuple *(state, document_type, open exception?, post_status)*.
A real observed example: `state=needs_review, document_type=unknown,
exception=bank_detail_change_suspected/open` — one row, three axes.

---

## 3. Actions the backend supports

| Action | Endpoint / service | Status |
|---|---|---|
| Approve & post | `review/cases/[caseId]/approve-post/route.ts` | EXISTS — **posts** (§0.1), idempotent, state-aware |
| Reject | `review/cases/[caseId]/reject/route.ts:15` → `documentCaseService.transition` | EXISTS — reason required |
| Resolve exception | `review/cases/[caseId]/resolve-exception/route.ts:20` → `documentExceptionService.resolveException` | EXISTS |
| List / detail cases | `review/cases/route.ts`, `review/cases/[caseId]/route.ts` | EXISTS |
| Case count (badge) | `documents/cases?count_only=true` | EXISTS — used at `Zone1ConsolidatedPanel.tsx:167` |
| Email ingest | `api/webhooks/postmark-inbound/route.ts:288` → `handleForwardedMailbox` | EXISTS |
| **Edit extracted fields** | — | **NEW — nothing exists (§0.2)** |
| **Serve document bytes** | — | **NEW — §4** |

---

## 4. Build item #1 — the document-bytes endpoint (critical path)

Everything in the review half waits on this.

**Proposed shape**

```
GET /api/orgs/[orgId]/documents/[sourceDocumentId]/preview
  → 302 redirect to the provider's pre-authenticated URL
```

**Auth pattern to copy** — `documents/cases/[caseId]/route.ts:30-33`:
`buildServiceContext(req)`, then an explicit
`ctx.caller.org_ids.includes(orgId)` guard. That file's `:14` records that
read-side routes take *"No withInvariants per Rule 2 + 50-route read-side
convention"* and use the explicit org check instead. Follow it; do not invent a
new pattern. There is **no** document-specific permission key today — org
membership is the gate.

**The whole-PDF-vs-page-images fork is already settled by what exists.**
`previewUrl` returns one URL to one stored object. Per-page images would require
a rendering service that does not exist (no `pdfjs`, no image pipeline, nothing
in `apps/web/package.json`). Images are a build-from-scratch option, not an
available alternative.

**The real fork is redirect vs. proxy-stream:**

| | 302 → signed URL | Proxy bytes through the route |
|---|---|---|
| Effort | Low — return what `previewUrl` gives | Higher — stream, headers, range requests |
| Bandwidth | None through your server | All through your server |
| URL leakage | A copied URL works until expiry (≤30 min reported; Graph's own ~1h) | Nothing leakable |
| Range requests | Provider handles | You implement |
| Audit | URL-minting explicitly **not** audited (`storageProviderService.ts:50`) | You control audit |

**Recommendation: 302 redirect for v1.** Reuses working code; both providers
return pre-authenticated URLs; expiry is short. Not a one-way door — the route
signature is unchanged if the handler body later becomes a proxy.

**Watch:** `PreviewOptions.mode ('preview' | 'download')` exists in the type but
`sharepointDriveProvider.ts:180-181` records it is **not enforced** — Graph's
downloadUrl offers no `Content-Disposition` control. Inline-vs-download is not
controllable for SharePoint orgs at v1.

---

## 5. The seven screens

| # | Screen | Class | Depends on | Grounding |
|---|---|---|---|---|
| 1 | Rail shell | **PARTIAL** | — | §6 |
| 2 | Pre-send composer + preview tiles | **PARTIAL** | none | `AgentChatPanel.tsx:286` holds `File[]`; tray at `:864-900` renders text rows (emoji + name + KB), not visual tiles |
| 3 | Email-in → queue | **EXISTS** | — | `webhooks/postmark-inbound/route.ts:288`; no UI work |
| 4 | Review queue list + detail | **PARTIAL** | §4 route | `ReviewInboxView.tsx` (160 ln) + `ReviewCaseDetailView.tsx` (490 ln); all three actions wired; `:232` renders `Object.entries(extracted_fields)` |
| 5 | Stepper / review-all | **NEW** | §4 route | `ReviewInboxView.tsx:8`: *"one canvas directive at v1"* — no multi-case navigation. Highest §0.1 exposure |
| 6 | Single-bill split review | **PARTIAL** | §4 route + viewer | Detail half exists; document half is the gap |
| 7 | Multi-page ghost modal | **NEW** | §4 route + viewer | Nothing exists; `InertPromotionModal.tsx` is a modal precedent only |

**Screen 2 is the only review-adjacent screen with no PDF dependency** — it
previews files the user is uploading (already in browser memory as `File`
objects), not stored documents. The genuine quick win.

**Frontend PDF rendering is entirely new.** No `pdfjs`, `react-pdf`,
`<iframe>`, or `<embed>` anywhere in `src/components` or `src/app`; no PDF
dependency in `apps/web/package.json`. The single `application/pdf` hit is a
MIME check choosing an emoji (`AgentChatPanel.tsx:881`).

---

## 6. Shell redesign — regroup, not rebuild

**The pattern being designed already ships.** `Zone1ConsolidatedPanel.tsx:75-107`
declares `WORKSPACE_TABS` (`billing | reports`) plus `BILLING_NAV_ITEMS` (10),
`REPORTS_NAV_ITEMS` (3), `FOOTER_ITEMS` (4) — all `ReadonlyArray<NavItem>`.
Category tabs that swap the list beneath them are existing behaviour, persisted
to `localStorage` (`chounting:shell:activeWorkspace`, `SplitScreenLayout.tsx:52`).

| Question | Finding |
|---|---|
| Data-driven? | Yes — arrays of `{id, label, icon, primaryAction?}`. Regrouping into Home/Sales/Purchases/Banking/Reports = editing arrays + adding tab entries |
| Existing tab pattern? | Yes — `WORKSPACE_TABS`; not new |
| New routes needed? | **No.** `navItemToDirective()` (`:113-140`) maps item id → `CanvasDirective`. Only three real routes exist under `[orgId]`: `page.tsx`, `settings/org`, `agent/actions`. Nav is client-side view state |
| Backend change to regroup? | None. Items are decoupled from routes by the directive map. Caveat: permissions gate per-route/service (e.g. `agent/actions/page.tsx:54` redirects on `forbidden=ai-actions-read`) — a regrouped item still gates where it always did |
| Home today? | **NEW** — no dashboard in the rail or the directive map |
| Tile counts? | Precedent exists: `Zone1ConsolidatedPanel.tsx:167` fetches `documents/cases?count_only=true` for the Pending Documents badge. "To review" reuses it; "open bills" / "due this week" extend `reports/open-bills` and `reports/ap-aging`, which exist |
| Chat history? | `agent_sessions` (`session_id, user_id, org_id, locale, started_at, last_activity_at, state, conversation, turns`). But `agentSessionService.ts:30-46` exposes only `getMostRecentForUser` with `.limit(1)`. Pinned/recent needs a new list method, endpoint, and a pin column. `AgentChatPanel.tsx:285` notes client persistence is "post-v1 candidate" |

**Riskiest part is the three-pane layout, not the nav.** `SplitScreenLayout.tsx`
(366 ln) holds per-tab `directive` / `selectedEntity` / `history` /
`historyIndex` plus Cmd+\ shortcuts (`:18-23, :52`). A third persistent pane
touches that state machine. The rail arrays do not.

---

## 7. Build order

**Design corrections — before any review screen is built**
1. **Re-label approve** as a posting action with confirmation (§0.1). Blocks
   screens 4/5/6 from being built wrong.
2. **Settle edit-fields scope** (§0.2). Determines whether review screens draw
   editable inputs at all.

**Foundation — the review half cannot render without these**
3. **Document-bytes endpoint** (§4). Decide redirect-vs-proxy; recommendation
   redirect. Unblocks screens 4/5/6/7.
4. **PDF viewer integration.** Library choice, bundle cost, zoom/paginate for
   screen 7. Depends on #3.

**Parallel, unblocked — start now**
5. **Screen 2 — composer tiles.** No dependency on 1–4.
6. **Shell regroup.** Independent of the PDF track; low risk.
7. **Home dashboard.** Lags the regroup; needs tile-count aggregation.

**Gated on the foundation, in this order**
8. Screen 4 (queue + detail) → 6 (split review) → 5 (stepper) → 7 (ghost modal).
   Source tags are free (§0.4). Approve labelled honestly (§0.1).

**Deferred**
9. Amber confidence flagging — hard-failure flags for v1; field-to-line
   attribution when funded (§1).

**Deleted from the brief's plan:** source tracking (§0.4 — already exists).

---

## 8. Open questions

1. **Redirect or proxy** for the bytes endpoint (§4)? Recommendation: redirect.
2. **Amber flagging** — defer to hard-failure-only, or fund field-to-line
   attribution (§1)?
3. **Edit-fields in scope** (§0.2)? This is "do we build a mutation endpoint,"
   including validation, audit, and whether an edit re-runs matching — not a UI
   checkbox.
4. **Queue modelling** — one row per case, and how is the
   (state × exception × post_status) tuple rendered (§2)?
5. **SharePoint inline preview** — `mode` is unenforceable on Graph (§4 Watch).
   Acceptable for v1?

---

## Appendix — verification method

All findings are first-hand reads of the working tree at `cf6b0c3f`, not
inference from documentation. Where a claim could have been taken from a doc
comment, it was confirmed against code or live data instead — the OCR
bbox/confidence shape in §1 was read from a real `document_artifacts` row
produced by an actual ingested document, not from the schema's `z.unknown()`
type. Absences ("no PDF dependency", "no mutation endpoint") are reported as
searched-and-not-found, with the search stated, rather than assumed.
