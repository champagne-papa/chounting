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

## 4. Build item #1 — the document-bytes endpoint (BUILT — merged 2026-07-31)

**Status: shipped.** `20b1c63b` (PR #19), merged to `main` at `8a96a86e`, as
specified below (302 redirect). Added beyond this spec: an org-filtered read
(`getStorageProviderForOrgSourceDocument`) because the read-side membership
guard proves the CALLER belongs to the named org, not that the DOCUMENT does —
without it a member of org A could mint a signed URL for org B's document by
id. Cross-org now returns NOT_FOUND (never 403; no existence leak),
mutation-verified. Screens 4/5/6/7 are unblocked.

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
3. ~~**Document-bytes endpoint**~~ — **DONE** (§4; `20b1c63b`, PR #19).
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

## 7b. Edit-fields scoping outcome (added 2026-07-31, after §7 was written)

A read-only pass answered §8 Q3. It inverted the premise the question was
framed on, so the conclusion differs from what §0.2 anticipated.

### The pipeline has a cheap partial re-run — and it is why edit is hard

`buildReviewPreview` (`reviewPreview.ts:3-18`) is a **review-time rebuild**:
*"rebuild, not persist… no Modal, no Claude, no writes."* On every review load
it re-runs Stage 4 extraction, Stage 5 `matchVendor` (`:312`), and Stage 7
`buildProposal` (`:41`).

So "re-run matching" is **free and automatic**, not a pipeline re-entry. That
half is good news, and it means `vendor_name` edits are not blocked by re-run
cost.

But the fields it rebuilds come from OCR, not from any stored value —
`reviewPreview.ts:428-429`:

```ts
const ocrText = extractOcrText(artifact);
const extracted = tierAFieldsFor(caseRow.document_type as string, ocrText);
```

A grep for `confirmed|override|human|edited` across that file returns **zero
hits**. Nothing reads `extracted_invoices.extracted_fields` back for review or
post. `approve-post` posts from this rebuild (`approve-post/route.ts:149` →
`buildPostBillInput`).

**Consequence — the load-bearing one.** An edit persisted today would be
silently discarded at the next preview, and the ledger would post the
OCR-derived value. The endpoint is therefore **larger** than a field write: it
requires an override-precedence layer that both `buildReviewPreview` and
`buildPostBillInput` consult, inverting the deliberate "rebuild, not persist"
decision (brief D-2). Scoping this as "wire the UI to a value flow the backend
already honours" would ship edits that appear to save and then vanish.

### Field consumption — PROVEN for vendor_invoice, NOT for other types

Read from `buildPostBillInput` (`ingestDocument.ts:1278-1360`):

| Field | Class |
|---|---|
| `amount` | consumed, required (null-guard at `:1291`) |
| `accounting_date` / `issue_date` | consumed, required (`:1296-1302`) |
| `vendor_invoice_number` | consumed → `bill_number` |
| `due_date` | consumed |
| `vendor_name` | **NOT consumed** — post reads `card.vendor_match.vendor_id`, so an edited name changes the display and not the posted vendor |
| `tax_amount` | not consumed — `tax_amount_total: '0'` hardcoded |
| `currency` | not consumed — `currency: 'CAD'` hardcoded |
| `line_items`, `account_code`, `tax_code_id` | not consumed — single synthetic line; account from matched rule or org default |

**This table is proven for `vendor_invoice` only.** `buildRecordPaymentInput`
(`:1408+`) consumes a DIFFERENT set — `cited_bill_id`, `amount` — so the
boundary is **per-document-type**. Receipt and payment_confirmation paths are
unmapped. Treating this table as universal would ship a wrong "safe write" on a
non-invoice document.

### Tripwires do not re-run at review time

`looksLikeBankDetailPresent` / `looksLikeStatementNotInvoice` are referenced 5×
in `ingestDocument.ts` and **zero** times in `reviewPreview.ts` (its one
apparent hit, `:136`, is a comment about a dedup-triple probe). So an edited
`vendor_name` would be re-matched but would **not** re-fire
`bank_detail_change_suspected` or duplicate detection. That is the real reason
to defer `vendor_name` — a fraud-check bypass, not re-run cost.

### v1 scope

| | |
|---|---|
| **The work** | The override-precedence layer. Until it exists no edit persists, and every field is equally blocked. |
| **Ship after it** | `amount`, `accounting_date`, `vendor_invoice_number`, `due_date` (vendor_invoice) — consumed by post, no tripwire implication |
| **Defer** | `vendor_name` — technically works (auto re-match) but bypasses pipeline-only tripwires |
| **Do not build** | `tax_amount`, `currency`, `line_items`, `account_code` — not consumed; editing them is theatre |

### Correction (2026-08-01): the rebuild has TWO paths, not one

§7b above states flatly that the review surface re-derives fields from OCR.
**That is true for single-invoice cases and false for multi-invoice ones.**
The blanket claim was generalized from the single-invoice path without reading
the other; correcting it here rather than editing the original, so the error
and its correction both stay visible.

| Case type | Field source at review | Evidence |
|---|---|---|
| **Multi-invoice (α)** | reads **stored** `α.extracted_fields` — *"no re-extraction"* | `reviewPreview.ts:67`, `:279-281` |
| **Single-invoice** | **re-extracts from OCR** via `tierAFieldsFor` | `reviewPreview.ts:428-429` |

The split rule is stated at `reviewPreview.ts:281`: *"Only multi-invoice cases
carry α (T2c writes N≥2; single-invoice writes none)."*

**Why it matters for the override design.** The override is not one problem
with one shape:

- **α path — the easier half.** The review surface already reads stored
  `extracted_fields`, so an override written there has somewhere to live *and*
  is already consulted on the read side. The work is a write path plus
  precedence.
- **Single-invoice path — the harder half.** There is no α row at all, and the
  rebuild re-derives from OCR, so an override is discarded no matter where it
  is stored **until post is changed to read it**. Here "design a store" also
  means "change what the post path reads" — a larger change than the α case,
  and the one that inverts the deliberate "rebuild, not persist" decision
  (brief D-2).

Sizing the endpoint off the α path alone would under-scope it by the whole
single-invoice half.

### Gates before the endpoint is built

1. **Design the override layer — net-new, confirmed on BOTH sides.**
   - *Read side:* nothing consumes an override — a grep for
     `confirmed|override|human|edited` in `reviewPreview.ts` returns zero.
   - *Write side:* `extracted_invoices` is **insert-only** — a repo-wide grep
     for `update|upsert` against it returns nothing; the sole post-creation
     mutation is `postExtractedInvoice` → `post_extracted_invoice_with_audit`,
     which writes only `posted_bill_id` / `post_status`;
     `createExtractedInvoice` has exactly one caller
     (`ingestDocument.ts:254`, the pipeline).
   - No override/confirmed-value table exists in the schema.

   So this is a **design pass, not a wiring pass**: there is no existing store
   to connect and no orphaned mechanism to investigate. Design where an edit
   persists, how precedence works against the rebuild, and — per the correction
   above — how the single-invoice path's post read changes to honour it.
2. ~~**Prove the field boundary per document type.**~~ **DISCHARGED
   2026-08-01 — see §7c.**

## 7c. Gate-2 discharged — the per-type field boundary, proven

Read 2026-08-01, one consumer at a time. Every row below is grounded in that
type's OWN consumer; no row is carried over from another type's reading. That
constraint is the point: generalizing `vendor_invoice`'s table — the error that
produced §7b's correction and this plan's two prior amendments — would have
missed four fields and invented four others.

### Two structural corrections to the question itself

1. **The post consumer is keyed on `proposed_action`, not `document_type`**
   (`approve-post/route.ts:166, 203`). The map is
   *type -> proposal builder -> action -> consumer*, not type -> consumer.
2. **Of the 18 `document_type` enum values, only 3 have extractors**
   (`extractFields.ts:40-46`) and only **2** reach a post consumer.

### The boundary

| Type | Proposal builder | `proposed_action` | Post consumer | Fields consumed |
|---|---|---|---|---|
| `vendor_invoice` | `buildVendorInvoiceProposal` (`proposalBuilder.ts:50`) | `post_bill` (`:223`) | `buildPostBillInput` (`ingestDocument.ts:1278-1360`) | `amount`*, `accounting_date`/`issue_date`*, `vendor_invoice_number`, `due_date` |
| `payment_confirmation` | `buildPaymentConfirmationProposal` (`:53`) | `record_bill_payment` (`:255`) | `buildRecordPaymentInput` (`ingestDocument.ts:1408-1466`) | `amount`*, `cited_bill_id`+, `payment_date`, `payment_method`, `payment_reference` |
| `receipt` | `buildReceiptProposal` (`:56`) | attachment card / `receipt_unmatched_defensive_guard` only | **none** | **none reach post** |

`*` required — the consumer returns `null` without it.
`+` or `matched_candidate.linked_entity_id` (`ingestDocument.ts:1420-1428`).

`vendor_invoice` can also emit a `proposed_attachment_card`, but attachment
cards have nothing to post, so the row is unchanged. Non-postable actions are
rejected at `route.ts:243`.

**The two consumed sets overlap on `amount` alone.** Everything else differs.

**Consumed by NEITHER path** — editing these changes the display and not the
ledger: `tax_amount` (`tax_amount_total: '0'` hardcoded), `currency` (`'CAD'`
hardcoded), `line_items`, `account_code`, `tax_code_id`, and `vendor_name`
(post reads `vendor_match.vendor_id`).

### A fourth consumer, with a different field source

`buildRecordPaymentInputFromChildMutation` (`ingestDocument.ts:1468+`) reads
**`child.params`**, NOT `extracted_fields` — a different source, so an override
on extracted fields would never reach it.

It is **currently unreachable from review**: `route.ts:29-32` records that
*"born-paid BUNDLES are structurally unreachable under the Tier-A-only rebuild
and route to manual entry (409)."* So it adds no boundary row today. Recorded
because it is a fourth consumer with a different source, and if bundles become
review-reachable the override design must account for it. Omitting it is
exactly how the next reader would generalize wrongly.

### What this gives the override design

- Precedence needs **two field sets**, not one.
- **`receipt` needs no override at all** — nothing it produces posts. Editable
  fields on a receipt review screen would be theatre, the same finding as
  `tax_amount` but for a whole document type.
- `cited_bill_id` is a special case: it can come from the extracted field **or**
  from `matched_candidate.linked_entity_id`, so an override there competes with
  a *matcher result* rather than an OCR value — a different precedence question
  from the rest.

### Correction (2026-07-31): `vendor_invoice_number` is safe-write on the SINGLE-INVOICE path only

The boundary table above lists `vendor_invoice_number` among the fields
`buildPostBillInput` consumes, which reads as "safe write — post rebuilds the
bill from it." **That is true on the single-invoice path and a double-post
hazard on the multi-invoice (α) path.** Correcting it here rather than editing
the row, so the original claim and its correction both stay visible — the same
shape as the §7b two-path correction.

The α path does not only *consume* this field; it **derives the ledger
idempotency key from it**. Two mechanisms, both re-verified at the lines cited.

**Mechanism 1 — the key is derived from the overridable field.**
`childKeyFor` (`approve-post/route.ts:375-382`) reads
`inv.extracted_fields.vendor_invoice_number` (`:376`) and returns
`` `${caseId}:bill:${suffix}` `` (`:381`), where the suffix is that number when
unique within the case and the α `ordinal` otherwise (`:377-380`). The result is
used as the JE `source_external_id` (`:423`, passed at `:428`).

The double-post guard is the `23505` on `idx_je_source_external`, caught as
`DUPLICATE_SOURCE_EXTERNAL_ID` at `:431-434` — and it **only fires if the key
repeats**. The window is named in that catch's own comment (`:436-437`):
*"Crash between `billService.post` and the α write."* Between the successful post
(`:427`) and `postExtractedInvoice` (`:474`) the α is still `pending`, so a
re-approve re-attempts it (`:389-397` skips only `post_status === 'posted'`). If
`vendor_invoice_number` is overridden inside that window, the retry computes a
**different** key, the `23505` never fires, and the invoice **posts to the ledger
twice**.

**Mechanism 2 — an override on one invoice can change another invoice's key.**
`numberCounts` is computed **set-wide** across the case's N α
(`approve-post/route.ts:368-374`), and the suffix falls back to `ordinal` when a
number is *non-unique* (`:378`). So overriding invoice B's number to collide with
invoice A's flips **A's** key from its number to its ordinal — an invoice the
reviewer never touched. Same consequence as mechanism 1, on a different row.

Note also that `extracted_invoices.idempotency_key` is **write-once** (the
`enforce_extracted_invoices_immutability` trigger, migration
`20240181000000`), so the first-resolved key is durable and a later
differently-keyed post cannot be reconciled by rewriting it.

**The single-invoice path is immune.** Its key is
`` `${caseId}:bill` `` (`approve-post/route.ts:167`) — field-independent, as is
the payment key `` `${caseId}:payment` `` (`:204`).

**Consequence for the override design.** `vendor_invoice_number` is admissible
as a v1 override on the single-invoice path. On the α path it is **not** safe
until the key derivation stops depending on it, and any α override work needs a
test proving the `23505` still fires after an override — CI runs no tests
(`docs/05_operations/ci-runs-no-tests.md`), so that guard's absence is a
ledger-integrity hole, not a coverage gap. Treating the boundary table's
consumed-set as a uniform safe-write list is exactly how this ships.

## 8. Open questions

1. **Redirect or proxy** for the bytes endpoint (§4)? Recommendation: redirect.
2. **Amber flagging** — defer to hard-failure-only, or fund field-to-line
   attribution (§1)?
3. ~~**Edit-fields in scope**~~ — **ANSWERED, see §7b.** The premise inverted:
   re-matching is free (the review rebuild already does it), but nothing reads a
   persisted field back, so the endpoint needs an override-precedence layer and
   is LARGER than a field write. Two gates remain in §7b.
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
