# Wave 6 D3 — Task Decomposition

**Status:** DRAFT — surfaced for advisor read-back. Implementation
starts task-by-task after green, each task getting a per-task code
read-back (code + runs surfaced together).
**Anchors:** the LOCKED brief
(`2026-06-04-wave-6-d3-review-approve-post-brief.md`, committed
`2aa3c911`) — design decisions D-1…D-6 are settled there and are NOT
relitigated here; this document orders the work and pins each task's
files, tests, and impl-onset verify items.
**Grounding HEAD:** `2aa3c911`.

Dependency spine: T1 → T2 → {T3, T4} → T5 → T6 → T7 → T8. Tasks
commit individually under the lock (`COORD_SESSION='wave-6-ap-review'`);
TDD within each task; no push.

---

## T1 — Substrate: RPC amendment + chunk_9 CHECK (two migrations)

**Files:**
- Create `supabase/migrations/<next>_wave_6_d3_write_journal_entry_atomic_source_external_id.sql`
- Create `supabase/migrations/<next+1>_wave_6_d3_document_cases_state_check_broaden.sql`

**Scope:**
1. `CREATE OR REPLACE FUNCTION write_journal_entry_atomic` — additive:
   `source_external_id` added to the INSERT column list + VALUES
   (`NULLIF(p_entry->>'source_external_id','')` per the RPC's own
   NULLIF convention). Brief D-4.5, confirmed at read-back (the
   current body omits the column — migration `20240134`).
   **Impl-onset verify (G-2 remainder):** transcribe the RPC's
   current body from disk before amending — no drafting from memory.
2. `document_cases_state_chunk_9_active`: drop chunk_8, add chunk_9
   admitting the prior 8 states **+ `committed`** (`archived` stays
   out). Linear chunk suffix per the codified convention.
   **Impl-onset verify (G-4):** grep all `chunk_8` literal references
   (the 3 known test pins match `/chunk_\d+_active/` and pass; any
   exact-`chunk_8` literal must be found before the rename).

**Tests (integration):**
- Direct RPC call with `source_external_id` set → `journal_entries`
  row carries it; second call with the same
  `(org_id, source_system, source_external_id)` triple → 23505.
- Direct RPC call WITHOUT the field → NULL, two NULL-id inserts both
  succeed (the partial-index skip preserved — manual entries
  unaffected).
- `document_cases` UPDATE to `'committed'` via the state RPC succeeds
  (CHECK admits); to `'archived'` fails (still excluded).

**Commit:** `feat(db): Wave 6 D3 T1 — write_journal_entry_atomic +source_external_id; document_cases CHECK chunk_9 (+committed)`

## T2 — Schema chain: Zod broadens + the pass-through

**Files (modify):**
- `shared/schemas/accounting/journalEntry.schema.ts` —
  `PostJournalEntryInputSchema` + optional `source_external_id`
  (string, min 1).
- `shared/schemas/document-platform/documentCase.schema.ts` —
  `TransitionInputSchema` + `proposed` variant (optional reason);
  `AdvanceCaseAutomationInputSchema.target_state` + `'committed'`;
  `DocumentCaseStateSchema` + `'committed'` (the Layer-1-CHECK-broaden
  ⇒ Zod-broaden checklist — the read-back schema must admit what the
  CHECK now admits, or committed cases fail read-back parsing).
- `shared/schemas/spend/bill.schema.ts` + `recordPayment.schema.ts` —
  optional `source_external_id` pass-through fields.
- `services/accounting/journalEntryService.ts` — `post()` forwards
  `parsed.source_external_id ?? null` into the RPC `p_entry`; maps a
  23505 naming `idx_je_source_external` to the NEW typed code
  `'DUPLICATE_SOURCE_EXTERNAL_ID'` (ServiceErrorCode additive — the
  route's already-posted discriminant; POST_FAILED stays the
  catchall for other 23505s).
- `services/spend/billService.ts` + `paymentService.ts` — thread the
  optional field into the delegated JE input.

**Decomposition decisions flagged for read-back:**
- (a) New `ServiceErrorCode` `'DUPLICATE_SOURCE_EXTERNAL_ID'`
  (additive) vs reusing POST_FAILED: the route MUST distinguish
  already-posted from generic failure to drive recovery, so a typed
  code is load-bearing, not cosmetic.
- (b) `DocumentCaseStateSchema` +`committed` is in this task even
  though no D3 list endpoint filters on committed — read-back parsing
  of a committed case requires it (checklist discipline).

**Tests:** schema unit tests (variants parse/reject); integration:
`billService.post` with `source_external_id` → JE row carries it;
duplicate via the service → `DUPLICATE_SOURCE_EXTERNAL_ID`.

**Commit:** `feat(document-platform): Wave 6 D3 T2 — Zod broadens + source_external_id pass-through chain + typed duplicate code`

## T3 — IDOR in-service checks (the §5(A) supersession commit)

**Files (modify):**
- `services/document-platform/documentCaseService.ts` —
  `transition()`: after `readDocumentCase`, verify
  `ctx.caller.org_ids.includes(current.org_id)` else
  `ORG_ACCESS_DENIED`. Header comment names the §5(A) supersession
  with provenance (brief D-1.1).
- `services/document-platform/documentExceptionService.ts` —
  `resolveException()`: same in-service check after the entry read
  (brief D-1.1a).

**Tests (integration — the IDOR-negative suite, part 1; line-by-line
read-back target):**
- Cross-org human ctx + valid foreign caseId → `transition()` throws
  `ORG_ACCESS_DENIED` (BEFORE any state change — assert state
  unchanged).
- Same for `resolveException()` (exception stays open, case
  unmoved).
- Same-org happy paths unaffected: `needs_review → proposed` (the new
  variant), `→ rejected` (reason required), resolveException one
  action.
- System-actor paths unaffected: `advanceCaseAutomation` +
  sweep regression (the D2.3 suite re-run green — `transition()`
  isn't on the sweep path, but the suite is the cheap proof).

**Commit:** `feat(document-platform): Wave 6 D3 T3 — in-service org verification at transition() + resolveException() (D2.1 §5(A) superseded, provenance in brief D-1)`

## T4 — advanceCaseAutomation: the approved→committed edge

**Files (modify):** `documentCaseService.ts` —
`AUTOMATION_ADVANCE_EDGES` + `['approved', 'committed']`; AND the
`advanceCaseAutomation` docstring updated — it currently names the
system-actor orchestrator as "the designed caller class," which goes
stale when D3 adds the human-ctx caller (read-back fold-in: the
docstring gains the D3 human-reviewer caller class + the attribution
rationale).

**Tests (integration):** approved case → `advanceCaseAutomation(→committed)`
succeeds with audited hop; human `transition()` to committed refused
(AUTOMATION_ONLY — existing Layer 3b); no-op at/past committed;
**ctx-attribution decision exercised** (below).

**Decomposition decision flagged for read-back — the committed-mark
ctx:** the post-success advance (D-4 step 6) runs under the
**human reviewer's `ServiceContext`** passed into
`advanceCaseAutomation` (it accepts the union; `actingUserId(ctx)` →
the human user_id). Rationale: honest attribution — the reviewer's
approval caused the commit; a synthetic system actor would obscure
the causal human in the audit chain. The AUTOMATION_ONLY refusal
lives at `transition()` (the human *boundary*), not at
`advanceCaseAutomation` (the *mechanism*) — a human-ctx call through
the mechanism is the designed shape for "automation triggered by a
ledger commit the human caused." Alternative (system actor
`'review_commit_marker'`) rejected: adds an identity for no
authorization gain and breaks the who-caused-this audit read.

**Commit:** `feat(document-platform): Wave 6 D3 T4 — approved→committed automation edge`

## T5 — Review read endpoints (list + detail + preview rebuild)

**Files:**
- Create `app/api/orgs/[orgId]/review/cases/route.ts` (GET list)
- Create `app/api/orgs/[orgId]/review/cases/[caseId]/route.ts` (GET detail)
- Create `agent/orchestrator/extraction/reviewPreview.ts` (the
  rebuild: artifacts + candidates + case → preview card; agent-layer
  per ADR-0020 — it reuses Stage-4 `extractFields` + `buildProposal`)

**Scope:** cards-pattern org-verification verbatim (explicit
`ctx.caller.org_ids.includes(orgId)` + `.eq('org_id', orgId)` on
every query; detail fetches the case org-scoped, then candidates /
artifacts / source-doc / open-exception join FROM the verified row's
ids). List covers `needs_review | proposed | approved` with the
exception join + post-status (approved cases show whether the JE
exists — the operator-visible stranding window). Preview per brief
D-2: persisted candidates verbatim; Stage-4 re-extract over persisted
OCR; `NOT_POSTABLE` when the builder returns null.

**Impl-onset verify:** **G-1** (read `proposalBuilder.ts` +
`extractFields` bodies — pin population→proposed_action mapping +
Stage-4 determinism; this task's preview shape locks only after);
**G-5** (document_artifacts RLS through-parent read path).

**Tests:** IDOR negatives part 2 (foreign orgId at list/detail →
ORG_ACCESS_DENIED; foreign caseId under own orgId → 404-not-found
because the org-scoped fetch misses — assert NO existence leak);
both populations listed; preview fields for a Tier-A doc; NOT_POSTABLE
for a builder-null doc.

**Commit:** `feat(document-platform): Wave 6 D3 T5 — review list/detail endpoints + preview rebuild (IDOR org-scoped reads)`

## T6 — Approve→post + reject + resolve-exception routes

**Files:**
- Create `app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts`
- Create `app/api/orgs/[orgId]/review/cases/[caseId]/reject/route.ts`
- Create `app/api/orgs/[orgId]/review/cases/[caseId]/resolve-exception/route.ts`

**Scope:** the D-4 sequence with a **STATE-AWARE RESUME** (read-back
catch: `transition()` THROWS on illegal/self transitions — there is
no idempotent no-op, `LEGAL_TRANSITIONS` has no self-loops — so the
route computes only the legal forward transitions from the case's
CURRENT state; "no-op if there" was wrong and would have broken the
recovery path at the opening transition):

| Entry state | Route executes |
|---|---|
| `needs_review` | `transition(→proposed)` → `transition(→approved)` → post → committed |
| `proposed` | `transition(→approved)` → post → committed |
| `approved` | post (→ 23505 → recover existing JE) → committed |
| `committed` | no-op (200, already complete) |
| anything else | 409 NOT_IN_REVIEW_TRACK |

The `approved` entry row is the load-bearing one: T5 deliberately
surfaces `approved` cases (the operator-visible stranding window), so
the route IS entered on them, and the double-post recovery — the
entire reason the guard exists — depends on getting past the opening
transition. Rebuild + post input (`source_external_id =
document_case_id`) happen before the `→approved` hop;
`withInvariants(billService.post | paymentService.record)({...,
org_id: orgId}, humanCtx)`; on success OR on
`DUPLICATE_SOURCE_EXTERNAL_ID` (look up existing JE by triple) →
`advanceCaseAutomation(→committed, humanCtx)`. Reject =
`transition(→rejected)` with required reason. Resolve-exception =
thin wrapper over the (now org-checked) `resolveException`.

**Impl-onset verify:** **G-3** (`lookupBillCommitDefaults` source
tables + null modes — the NOT_POSTABLE rate); **G-6** (seeded roles
carry `bill.post` / `payment.record` — the permitted-reviewer test
fixture).

**Tests (line-by-line read-back targets both live here):**
- Happy path: parked vendor_invoice → approve-post → exactly one new
  `journal_entries` row (row-delta — the D7 seam), `created_by =
  ctx.caller.user_id`, JE carries `source_external_id = caseId`, case
  `committed`, human-attributed audit chain end-to-end.
- **Double-post recovery:** seed the step-5/6 crash shape (JE posted
  with the triple, case at `approved`) → re-approve-post → service
  hits 23505 → `DUPLICATE_SOURCE_EXTERNAL_ID` → route looks up the
  existing JE → case completes to `committed` → **row-count
  assertion: journal_entries count unchanged**.
- **Entry-state coverage (the resume ladder, asserted explicitly):**
  happy path enters at `needs_review`; a partial-crash case seeded at
  `proposed` resumes (→approved→post→committed, exactly one JE); the
  recovery case enters at `approved` (above); a `committed` case
  returns 200-already-complete with zero writes; a `classified` case
  → 409 NOT_IN_REVIEW_TRACK.
- PERIOD_LOCKED → 422-class, case stays `approved`, no JE.
- NOT_POSTABLE → 409, case not past `proposed`.
- Invariant 4 negative: role without `bill.post` → PERMISSION_DENIED.
- IDOR negative: foreign-org approve-post → denied before any
  transition.
- Reject + one resolve-exception action per landing state
  (proposed/rejected/classified).

**Commit:** `feat(document-platform): Wave 6 D3 T6 — approve→post (human ctx, double-post-guarded) + reject + resolve-exception routes`

## T7 — UI: review inbox + detail (Zone 3 canvas)

**Files:**
- Create `components/canvas/ReviewInboxView.tsx` +
  `ReviewCaseDetailView.tsx`
- Modify `Zone1ConsolidatedPanel.tsx` (nav entry after Pending
  Documents) + the canvas-directive router (new `review_inbox`
  directive)

**Scope:** inbox lists both populations with state + exception badges
+ post-status; detail shows preview (sources labeled), Approve&Post /
Reject for parked-postable, the 9 resolution actions for
exception-bearing, NOT_POSTABLE banner steering to
`route_to_manual_entry`. Component tests per the jsdom-per-file infra
(render both populations; approve button gated on postable; reject
requires reason). UI-session screenshot gate noted for the wave's
UI closeout (not per-task).

**Commit:** `feat(document-platform): Wave 6 D3 T7 — review inbox + case detail UI`

## T8 — Close: validation + brief reconciliation

`pnpm agent:validate` + full D3 test files + typecheck + scoped lint
claim (the Q33-class module additions named, if any) + brief-vs-shipped
reconciliation (every D-1…D-6 item checked against disk) + the D3
close surface for read-back. No doc-sync gate (charter), but the
brief's §3 scope fences re-verified (no ADR/invariant text touched).

---

## Read-back asks (decomposition-level decisions)

1. **T2(a)** — new typed `ServiceErrorCode 'DUPLICATE_SOURCE_EXTERNAL_ID'`.
2. **T4** — committed-mark runs under the human reviewer's ctx
   (attribution rationale above).
3. **T1** — two migrations (RPC amend / CHECK broaden) rather than one.
4. Task order T3 before T4/T5 (the org checks land before any
   exposure — T5/T6 routes never exist against an unguarded service).
