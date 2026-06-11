# Wave 6 D3 Brief — Review/Inbox UI + Approve→Post (Human Ctx)

**Status:** DRAFT — surfaced for advisor read-back.
**Charter (plan-of-record §3, verbatim):** "Review/inbox UI (net-new) +
approve→post (net-new) under human identity (ctx.caller.user_id →
created_by)." Registers/amends: nothing. IDOR surface: yes.
**Grounding HEAD:** `5f1e0521` (25 banked-local; D1 + D2.1 + D2.3 fully
closed).
**Predecessors:** D1 + D2 closed. Unblocks D4 (default_account_id
posting consumer) + D7 (human-approve→post row-delta test).

---

## 1. Grounded surface (what exists at HEAD)

### 1.1 The IDOR findings (centerpiece evidence)

1. **`transition()` is org-blind at the human boundary — and unexposed.**
   `documentCaseService.ts:158-238`: `transition(caseId, input,
   ctx: ServiceContext)` reads the case via `readDocumentCase(caseId,
   ctx)` — by-id, `adminClient`, **no org verification** — and audits
   with the row's own `current.org_id` (`:207`). It never checks
   `ctx.caller.org_ids.includes(current.org_id)`. `withInvariants`
   Invariant 3 cannot compensate: it keys off `input.org_id`
   (`withInvariants.ts:130-146`) and `TransitionInputRaw` carries no
   org_id field. **Mitigant:** zero `src/app` callers at HEAD (grep
   verified 2026-06-04) — the gap is latent. **D3 is the first
   exposer and must close it at the service layer before exposure.**
2. **The system-actor read-backs must not be reused on the human path.**
   `readDocumentCase` (`documentCaseService.ts:128-156`) and
   `readExceptionQueueEntry` (`documentExceptionService.ts:223-251`)
   are by-id `adminClient` reads, documented as safe only as
   post-RPC read-backs inside trusted orchestrations.
3. **The canonical org-scoped read pattern exists and works.** The
   cards endpoints (`src/app/api/orgs/[orgId]/documents/cases/route.ts:50-172`
   and `.../[caseId]/route.ts:24-104`): `buildServiceContext(req)` →
   explicit `ctx.caller.org_ids.includes(orgId)` check → `adminClient`
   query with **explicit `.eq('org_id', orgId)`** (+ id filter on the
   detail read — the row is fetched org-scoped, never trusted by id
   alone). RLS on all four read tables is `user_has_org_access(org_id)`
   (migrations 20240143/20240148/20240149/20240135), but the
   adminClient + explicit-WHERE pattern is the established route shape.
4. **Approve-endpoint precedent:**
   `POST /api/orgs/[orgId]/recurring-runs/[runId]/approve`
   (`route.ts:1-50`): Zod parse → `buildServiceContext` →
   `withInvariants(service, { action })({ ...ids, org_id: orgId },
   ctx)` — the org_id is injected into the input by the route, so
   Invariant 3 fires; Invariant 4 checks the action permission.

### 1.2 What the inbox reads (persisted at `parked_unposted`)

- `document_cases` at `needs_review` (`document_type`,
  `classification_confidence`, `current_relationship_candidate_id`,
  `trace_id`).
- `document_relationship_candidates` rows: `linked_entity_type`,
  `linked_entity_id` (nullable — Scenario A), `link_role`,
  `confidence_score`, `candidate_features` JSONB, `trace_id`.
- `document_artifacts` (migration 20240146:232-253): **full OCR
  output persisted** — `pages`/`lines`/`words` JSONB +
  `pipeline_trace` JSONB + `confidence`. RLS through-parent.
- `source_documents` metadata (filename, mime, hash, storage key).
- **NOT persisted:** the proposal itself (no proposals table exists;
  `proposal_id: null` returned), `extractedFields` verbatim,
  `VendorMatchResult` verbatim, `ClassificationResult` verbatim.
- `exception_queue_entries` for exception-routed cases
  (`exception_reason`, `exception_status='open'`).

### 1.3 The post path (preserved intact by the bleed-stop)

- `journalEntryService.post()` (`journalEntryService.ts:72-229`):
  sole `journal_entries` writer (Law 2, `:12-14`); `created_by:
  ctx.caller.user_id` (`:193`) + audit `user_id` (`:208`); INV-1 via
  Zod `.refine()` + DB deferred constraint; **period-lock check
  inside** (`:115-126`, INV-LEDGER-002 inherited automatically).
- `billService.post` (`billService.ts:271-459`, action `'bill.post'`)
  and `paymentService.record` (`paymentService.ts:191-363`, action
  `'payment.record'`) both delegate to `journalEntryService.post`;
  both actions exist in `ACTION_NAMES`.
- The bleed-stop (`ingestDocument.ts:562-617`) disabled only the
  *pipeline's* call; ADR-0007 §Tier 2 (Q78 V1 re-scoping): "**a human
  approves and the post fires under the human's `ServiceContext` —
  not the system actor.**" The preserved `commitProposedEntryCard` /
  `commitProposedMutationBundle` are system-actor-shaped and
  @deprecated-preserved for the post-V1 auto-commit re-wire — **the
  human path does NOT reuse them**; it drives
  `withInvariants(billService.post / paymentService.record)(input,
  humanCtx)` directly (the hotfix-spec §5 shape).
- Input builders exist and are reusable: `buildPostBillInput`
  (`ingestDocument.ts:862-920`) maps `card.extracted_fields` +
  `card.vendor_match` + `lookupBillCommitDefaults(org_id)` (existing
  default-expense-account / AP-control / fiscal-period lookup — the
  D4 seam) into `PostBillInputRaw`. Returns null when vendor/amount/
  date are missing (those cases cannot one-click post).

### 1.4 The state machine (transitions D3 rides)

- `LEGAL_TRANSITIONS` (`documentCaseService.ts:36-47`):
  `needs_review → [rejected, matched, proposed, classified]` (all
  human); `proposed → [approved, rejected]` (human);
  `approved → committed` (AUTOMATION_ONLY); `committed → archived` /
  `rejected → archived` (automation, delayed cadence).
- `TransitionInputSchema` admits **only `approved` | `rejected`**
  (`documentCase.schema.ts:46-55`) — `needs_review → proposed`
  (human, matrix-legal) is NOT currently expressible through
  `transition()`. D2.1 §5(A)'s byte-untouched constraint bound D2.1,
  not D3; D3 amends.
- **Layer-1 CHECK `chunk_8_active` does NOT admit `committed` or
  `archived`** (migration 20240174:30-39: received, proposed,
  approved, rejected, needs_review, classified, matched, extracting).
- `AUTOMATION_ADVANCE_EDGES` (D2.1 T2) = exactly
  `{received→extracting, extracting→classified, matched→needs_review}`
  — no `approved→committed` emitter exists.
- Exception resolution: `resolveException` (9-action mapping,
  migration 20240148:447-463) lands cases at `proposed` (5 actions) /
  `rejected` (3) / `classified` (reprocess → `dispatchTrigger`
  T10_manual_override). This machinery exists end-to-end; it has no
  endpoint or UI.

### 1.5 UI shell anchors

Three-zone shell (`SplitScreenLayout.tsx`; Zone 1
`Zone1ConsolidatedPanel`, Zone 3 `ContextualCanvas` with canvas
directives). `pending_documents` nav + `PendingDocumentsView` (cards
endpoint consumer) is the closest precedent. Component tests: per-file
`// @vitest-environment jsdom` (Phase 8 chunk 5a infra).

---

## 2. Design decisions (positions for read-back)

### D-1 — IDOR org-verification (the centerpiece)

**Rule: every human-path read or mutation derives org from a
verified row fetched org-scoped — no by-id read ever trusts a
caller-supplied id.** Concretely:

1. **`transition()` gains an in-service org check** (defense in
   depth — route-level checks die by copy-paste): after reading the
   case, `if (!ctx.caller.org_ids.includes(current.org_id)) throw
   ORG_ACCESS_DENIED`. Deriving org from the READ ROW (not a
   caller-supplied input org_id) is deliberate — it adds nothing for
   a caller to forge. System actors don't call `transition()` (they
   use `advanceCaseAutomation`), so the check binds exactly the human
   boundary.
   **[SUPERSESSION, named with provenance (the T4
   attachment-residual precedent):** D2.1 §5(A)'s "human
   `transition()` + its Zod stay byte-untouched" was correct when
   ratified — `transition()` had zero callers, so the org-blind read
   was unexposed. D3 is the first exposer; exposure is precisely
   what changes the posture. §5(A) is superseded FOR D3's amendments
   only (the org check + the Zod `proposed` variant, D-3.2); the
   D2.1-era semantics it protected — approved|rejected human
   semantics, automation-refusal layering — remain byte-compatible.**]**
1a. **`resolveException()` gains the same in-service org check** — it
   is the same by-id org-blind class as `transition()` (entry read via
   the by-id pattern; RPC derives org from the row). D-5's
   "wiring only" covers the *resolution semantics*, NOT the
   boundary: without this check the inbox's second population
   reopens the hole D-1 closes for the first. Same shape: after
   reading the entry, verify its org_id ∈ `ctx.caller.org_ids`.
2. **New endpoints follow the cards pattern verbatim**: explicit
   `ctx.caller.org_ids.includes(orgId)` at the route + explicit
   `.eq('org_id', orgId)` in every query. Detail reads fetch the row
   org-scoped (`.eq('org_id', orgId).eq('id', caseId)`) — the
   verified row then sources every downstream org_id (audit, post
   input `org_id`, candidate/artifact/source-doc lookups all join
   from the verified case row's ids, re-filtered by org where the
   table carries org_id).
3. **Mutating endpoints inject `org_id: orgId` into the service
   input** (recurring-runs precedent) so `withInvariants` Invariant 3
   + Invariant 4 (`bill.post` / `payment.record`) fire. The
   approve→post route additionally verifies the case row org-scoped
   BEFORE building the post input.
4. **No reuse of `readDocumentCase` / `readExceptionQueueEntry` on
   any human-facing path.**

### D-2 — Proposal REBUILD at review time (not persistence)

**Recommendation: rebuild.** Evidence: no proposals table exists;
ADR-0007 mandates routing-to-review, not persistence; D3 registers
nothing (a new spine table = migration + RLS + doc-sync — scope D3
doesn't carry); `buildProposal` is pure (no DB reads,
`proposalBuilder.ts:38`, inputs `types.ts:306-313`); and the full OCR
output IS persisted (`document_artifacts.pages/lines/words`), so
rebuild inputs are recoverable:

| `ProposalBuilderInput` field | Review-time source |
|---|---|
| `source_document_id` / `trace_id` | case row + `document_jobs` |
| `classification` | `document_cases.document_type` + `classification_confidence` (tier/rationale reconstructed as review-time stubs — preview-only fields) |
| `extractedFields` | re-run Stage-4 `extractFields` over the persisted `document_artifacts` OCR (deterministic for Tier-A docs; **no Modal re-run — bytes never re-OCR'd**) |
| `vendorMatch` | re-run Stage-5 `matchVendor` (pure org-scoped read per D1) |
| `relationshipCandidates` | persisted `document_relationship_candidates` rows verbatim — **routing is NOT re-run; the recorded decision stands** |

**Named residuals:** (a) Tier-C-extracted docs — Stage-4 re-run may
abstain where the original used Claude; v1 disposition: the preview
shows candidate/case-derived fields and the one-click post is
unavailable when `buildPostBillInput` returns null → reviewer routes
via `route_to_manual_entry`. No AI calls on the review path at v1.
(b) Rebuild drift — a deterministic re-extract could differ from the
original run's fields; mitigated by (a)'s null-guard + the preview
showing its sources. **Impl-onset must-confirm (G-1):** read
`proposalBuilder.ts` + `extractFields` bodies to pin the
population→`proposed_action` mapping (post_bill vs
record_bill_payment vs bundle) and Stage-4 determinism before the
task decomposition is locked.

### D-3 — State mechanics: CHECK chunk_9 (+committed), Zod broadens, advance-edge extension

1. **Layer-1 CHECK broaden → `document_cases_state_chunk_9_active`
   (+`committed`; `archived` stays out — archival cadence is
   post-V1).** The human-posted case's honest terminus is `committed`
   (the INV-WORKFLOW-002 leaf names "a terminal case state
   (`rejected` / `committed`)"). The D2.1 "'committed' is
   V1-unreachable" parenthetical binds the **pipeline status**
   (`IngestDocumentOutput.status` — its appearance on the automation
   path stays a bleed-stop-regression signal, JSDoc untouched), NOT
   the case state reached via the human path. Linear chunk suffix per
   the codified convention; the 3 test sites pinning
   `/document_cases_state_chunk_\d+_active/` pass.
2. **Zod broadens (the Layer-1-CHECK-broaden ⇒ Zod-broaden
   checklist):** `TransitionInputSchema` + a `proposed` variant
   (optional reason) — expresses the human `needs_review → proposed`;
   `AdvanceCaseAutomationInputSchema.target_state` + `'committed'`.
3. **`AUTOMATION_ADVANCE_EDGES` + `approved→committed`** — the edge
   is already in `AUTOMATION_ONLY_TRANSITIONS` and the ADR-0011 §3
   matrix ("automation (ledger commit succeeds)"); D2.1's "EXACTLY
   the gap transitions" set extends by the one edge whose
   automation-emitter D3 creates. Single ownership holds: the
   approve→post route is the sole `approved→committed` driver, and
   `PIPELINE_ORDER` already ranks committed=7. The change-set
   explicitly includes the `AdvanceCaseAutomationInputSchema.target_state`
   enum broaden (+`'committed'`, D-3.2) — routing the edge through
   `advanceCaseAutomation` is unreachable without it.
   **Ownership decision (named):** `approved→committed` STAYS
   automation-owned. The alternative — drop it from
   AUTOMATION_ONLY and make `transition()` own it end-to-end — is
   semantically tidier ("human-post-triggered terminal marking") but
   would amend the ratified ADR-0011 §3 matrix row ("automation
   (ledger commit succeeds)"), and D3's charter is
   "registers/amends: nothing." The matrix's semantics also hold up:
   the *ledger commit succeeding* is the trigger, the human is the
   trigger's cause — the marking itself is mechanical. The route
   drives the advance post-success as the system-actor-class caller.

### D-4 — Approve→post sequencing (compensating, not atomic)

```
POST .../cases/[caseId]/approve-post
  1. verify org-scoped case row (state must be needs_review|proposed)
  2. transition(needs_review→proposed) [human, no-op if already proposed]
  3. rebuild proposal → buildPostBillInput-equivalent
     (null → 409 NOT_POSTABLE; reviewer uses manual routes)
  4. transition(proposed→approved) [human]
  5. withInvariants(billService.post | paymentService.record)
     ({...input, org_id: orgId}, humanCtx)   ← THE LEDGER WRITE
  6. advanceCaseAutomation(→committed) [the new edge; system-actor-
     class call made by the route post-success]
```

Steps are separate transactions — **compensating, not atomic** (the
D2.1 post-hoc-at-decision precedent).

**Double-post guard — D3 PREREQUISITE (core scope, reclassified at
read-back).** Grounded 2026-06-04: the Layer-1 guard EXISTS —
`idx_je_source_external`, partial UNIQUE `(org_id, source_system,
source_external_id) WHERE source_external_id IS NOT NULL` (migration
`20240111:56-60`, built to "prevent double-ingestion of the same
external transaction", test-proven `journalSourceExternalId.test.ts`)
— **but the service path cannot reach it**: `journalEntryService.post()`
writes `source_system: parsed.source` (`journalEntryService.ts:187`)
and never writes `source_external_id` (zero references in the service
or its schemas); `billService.post` hardcodes `source: 'manual'`
(`billService.ts:342`) with no external id. As drafted, every D3 post
carries `source_external_id = NULL` → skipped by the partial index →
**re-entry after a step-5/6 crash double-posts — an INV-1-adjacent
ledger-integrity break**. Not shippable as a carry-forward.

The guard, in scope at D3:
1. `PostJournalEntryInputSchema` gains optional `source_external_id`
   (string); `post()` passes it through to the RPC payload.
2. `billService.post` + `paymentService.record` gain the same
   optional pass-through field (threaded to the JE input).
3. The approve-post route sets `source_external_id =
   document_case_id` deterministically (one post per case; scope
   `(org_id, 'manual', case_id)` is unique by construction).
4. **Re-entry semantics:** a 23505 on `idx_je_source_external` at
   step 5 means "already posted" → the route looks up the existing
   JE by the triple and proceeds to step 6 (completes the marking).
   Recovery is deterministic and Layer-1-guarded — the DB, not a
   read-side check, is the authority.
5. **`write_journal_entry_atomic` RPC amendment — CONFIRMED
   change-set item (G-2 resolved at the brief read-back, advisor
   grounding):** the RPC's INSERT column list (migration `20240134`)
   writes `source_system` (`p_entry->>'source_system'`) but does NOT
   include `source_external_id` — absent from both the column list
   and the VALUES. Without the amendment, the service writes a value
   the RPC drops on the floor and the unique index never binds. D3
   ships an additive migration: `CREATE OR REPLACE` adding
   `source_external_id` to the INSERT/VALUES
   (`p_entry->>'source_external_id'`, NULLIF-empty per the RPC's own
   convention). Task 1 does not lock without it.

Crash classes, named (now all double-post-safe):
- Crash after 4, before 5: case at `approved`, no JE — visible,
  re-drivable; re-entry runs 5–6 (the unique triple admits the first
  post).
- Crash after 5, before 6: JE posted, case stranded at `approved` —
  re-entry hits the 23505 → completes step 6 without a second write.
  The stranding class remains outside the D2.3 sweep's eligibility
  (`received/extracting/classified/matched`); extending the sweep
  (+`approved` with a posted-JE discriminator) stays a named
  carry-forward — now safe to defer BECAUSE recovery is
  double-post-guarded; until then the inbox lists `approved` cases
  with post status (operator-visible, not silent).

### D-5 — Populations & scope split

The `needs_review` inbox lists BOTH populations, one list, two action
sets:
- **Parked-matched** (hand-off cases, no open exception): preview
  rebuilt card → **Approve & Post** (D-4) / **Reject**
  (`transition(→rejected)`, reason required).
- **Exception-bearing** (open `exception_queue_entries` row): show
  `exception_reason` → actions = the existing 9-action
  `resolveException` (new thin endpoint over the existing service;
  the 5 `proposed`-landing actions place the case in the
  approve-track at `proposed`). No new resolution machinery — wiring
  only.

### D-6 — API + UI surface (net-new)

Endpoints (all under the org-scoped route shape, cards-pattern
org-verification):

| Route | Method | Action |
|---|---|---|
| `/api/orgs/[orgId]/review/cases` | GET | inbox list: needs_review + proposed + approved cases, exception join, pagination |
| `/api/orgs/[orgId]/review/cases/[caseId]` | GET | detail: case + candidates + rebuilt preview + source-doc metadata + open exception |
| `/api/orgs/[orgId]/review/cases/[caseId]/approve-post` | POST | D-4 sequence (Invariant 4: `bill.post`/`payment.record`) |
| `/api/orgs/[orgId]/review/cases/[caseId]/reject` | POST | transition(→rejected), reason required |
| `/api/orgs/[orgId]/review/cases/[caseId]/resolve-exception` | POST | thin wrapper over `resolveException` |

UI: new `review_inbox` canvas directive in Zone 3 +
`ReviewInboxView` / `ReviewCaseDetailView` components
(PendingDocumentsView precedent); nav entry in Zone 1 Billing group
(after Pending Documents). Component tests via the jsdom-per-file
infra; one e2e assertion block optional, named.

---

## 3. What D3 does NOT do (scope fences)

- No invariant registration, no ADR (charter: "registers/amends:
  nothing"). The CHECK broaden is a migration, not a registration.
- No proposal persistence table.
- No AI calls on the review path (Tier-C preview degradation per D-2a).
- No auto-commit re-wire (`commitProposedEntryCard` /
  `commitProposedMutationBundle` stay @deprecated-preserved, byte-untouched).
- No re-run of routing at review (persisted candidates stand).
- Exception-resolution semantics unchanged (wiring only).
- `default_account_id` enrichment beyond the existing
  `lookupBillCommitDefaults` is D4's.

## 4. Impl-onset must-confirms

- **G-1:** `proposalBuilder.ts` + `extractFields` bodies — pin
  population→proposed_action mapping + Stage-4 determinism (decides
  the preview-build task's exact shape).
- **G-2: RESOLVED at the brief read-back** (advisor grounding,
  2026-06-04): the RPC does NOT write `source_external_id` — the
  additive `CREATE OR REPLACE` migration is a confirmed D-4
  change-set item (see D-4.5), no longer an impl-onset question.
  Impl carries only the verify-from-disk transcription of the RPC's
  current body before amending.
- **G-3:** `lookupBillCommitDefaults` source tables + failure modes
  (the null path = NOT_POSTABLE rate).
- **G-4:** chunk_9 CHECK migration — verify the 3 test-site pins +
  any other `chunk_8` literal references before renaming.
- **G-5:** `document_artifacts` read path RLS (through-parent) for
  the detail endpoint's preview build.
- **G-6:** permission rows — do seeded roles carry `bill.post` /
  `payment.record` (D7's row-delta test will need a permitted
  reviewer role)?

## 5. Test surface (summary — full TDD decomposition at plan stage)

- **IDOR negatives (the centerpiece tests):** foreign-org caller vs
  list (empty), detail (404/denied), approve-post (denied),
  transition-with-foreign-caseId (ORG_ACCESS_DENIED from the new
  in-service check).
- Approve→post happy path: vendor_invoice parked card → JE row delta
  (the D7 seam), `created_by = ctx.caller.user_id`, case →
  `committed`, audit chain human-attributed.
- Period-locked post → `PERIOD_LOCKED`, case stays `approved`
  (compensating-path visibility).
- **Double-post guard:** re-entry after a simulated step-5/6 crash
  (case `approved`, JE posted) → second approve-post hits the 23505
  → NO second `journal_entries` row (row-count assertion) → case
  completes to `committed`. The unique-triple write is asserted on
  the happy path (`source_external_id = document_case_id`).
- NOT_POSTABLE (null builder) → 409, no state change past `proposed`.
- Reject path; exception-resolve path (one action per landing state);
  permission-denied (Invariant 4) negative.
- Component tests: inbox renders both populations; detail preview
  fields; approve button gating.

## 6. Cadence

Brief read-back → green-light → task-by-task implementation (per-task
code read-back, grounded against disk) → commits under the lock — no
push without the CTO's explicit terminal go. No doc-sync gate this
deliverable; the IDOR org-verification and the INV-1 ledger write get
line-by-line read-back.
