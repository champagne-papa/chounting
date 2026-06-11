# Phase 5.1 retrospective — paymentService + INV-DOC-001 + vendor_credits β substrate amendment cycle (chunks 5.1a → 5.1c)

**Status.** Closes Phase 5.1 at chunk-5.1c substrate-fix complete
(this retrospective + ADR-0018 §item 4 amendment at Commit A
`83a5405` + scope-lock.md + plan-authoring.md convention extensions
at Commit B `b7ec879` + this Commit C writeup + friction-journal
banking entries). Three Phase 5.1 retrospective commits sequenced
A → B → C per surface-precedence T3 > T4 > T1, inheriting Phase 6.5
retrospective three-commit ceremony shape (`1752f06` + `82a4854` +
Phase 6.5 Commit C). 1156/1156 vitest; 26/26 agent:validate;
documentation-only batch at retrospective grade.

**Surface-precedence note.** Three artifact surfaces ship from this
retrospective work. T3 = ADR-0018 §item 4 amendment at Commit A
`83a5405` (bidirectional dispatcher activation discipline; second
amendment to ADR-0018; additive provenance-preserving per ADR-0022
§5). T4 = scope-lock.md "Verify-from-disk-at-non-standard-grain
pattern" extension (parent consolidation 7-sub-shape brainstorming-
side metafact drift family) + plan-authoring.md "Volume-forecast"
four-curve calibration sub-curve extension at Commit B `b7ec879`. T1
= this retrospective writeup + friction-journal banking entries at
this Commit C. The surface-precedence ordering when a future reader
needs the canonical statement of any Phase 5.1 codification is **T3 >
T4 > T1**, inherited from CLAUDE.md "When in doubt" leaf-discipline
+ Phase 6.5 retrospective §7 precedent. This note is positioned at
the end of §7; the writeup itself follows the seven-section sequence
below.

## 1. Arc summary

Phase 5.1 is the amendment cycle following Phase 5 close + Phase 6
ingestion close + Phase 6.5 bridge close. The cycle ships three
chunks addressing accumulated Phase 5 retrospective inventory items
(INV-DOC-001 + vendor_credits substrate + paymentService greenfield)
plus a Cat 2 substrate-fix follow-on. Scope ratified at scope-lock
cycle Rounds 1-4 (`72a40bf` + `2560ef6` + `5121569` + `8631a5d`)
with 14 sub-questions + 8 sub-decisions LOCKED across the four
rounds.

The arc shipped in three implementation chunks plus this
retrospective consolidation:

- **Chunk 5.1a** (commit `c228512`, Session 20): INV-DOC-001
  graduation from named-future-trigger (Phase 5 retrospective §6:404
  banked) to v1-active enforcement at `billService.post()` +
  `EVIDENCE_INCOMPLETE` ServiceErrorCode + `bills.override_evidence_completeness`
  Layer 1 NOT NULL DEFAULT false + `bills.primary_document_id`
  nullable FK + `vendor_credits` β substrate ratification + ADR-0016
  third amendment (linked_entity_type 8 v1-active reorganization
  with vendor_credit + vendor_credit_application moved to reserved-
  post-v1). 977 insertions across 18 files. Single-commit Phase C
  ceremony per Sub-Q4 Option (i) lock.

- **Chunk 5.1b** (commit `12847bf`, Session 22): paymentService.ts
  greenfield introduction with `paymentService.record()` payment-
  flow primitive per Sub-Q2 2.β LOCKED (partial extraction —
  payment-flow primitive vs AP-domain orchestration retained at
  `billService.recordPayment` unchanged). T2_new_payment dispatcher
  slot bidirectional activation: emit-side from paymentService
  .record() post-commit dispatch hook (Pattern B external-wrap +
  P3-i F-J-4 best-effort isolation); admit-side at
  DispatchTriggerInputSchema discriminated-union extension (5 → 6
  v1-active-emission-wired branches) + dispatchTrigger() switch
  case addition + computeT1T3FanOut → computeT1T2T3FanOut helper
  rename (semantic class extension to T1/T2/T3 "new-domain-entity-
  created" class). RecordPaymentInputSchema mirrors
  RecordBillPaymentInputSchema field-for-field (10 fields;
  intentional duplication at v1 substrate-without-consumer pattern
  per Sub-Q2 2.β). 5 integration test fixtures at
  paymentServiceRecord.test.ts. 830 insertions / 22 deletions
  across 5 files. Single-commit Phase C ceremony.

- **Chunk 5.1c** (commit `9ec9235`, Session 24): apReportService
  `loadBillsWithAmountDue` helper refactor from 2-query SELECT IN
  pattern to single PostgREST nested-select query per Fix A
  adjudication. Cat 2 apReport URI-too-long N=3 graduation
  substrate-fix (Phase 6.5 chunk 6.2b N=1 → Phase 5.1 chunk 5.1a
  c228512 N=2 → Phase 5.1 chunk 5.1b 12847bf N=3 → standalone
  substrate-fix chunk at chunk 5.1c per Option β disposition).
  Scope-lock 2026-05-10 disposition preserved (nested-select IS a
  supabase-js JOIN-side aggregation per PostgREST embed semantics).
  Behavior preservation: BillWithAmountDue[] return interface
  unchanged; all 4 consumer methods (aging / openBills /
  paymentApprovalQueue / activePayments) zero-change. Cat 2 5 → 0
  transition observed cleanly at validation gate. +12 net LOC
  (43 insertions / 31 deletions; single file). Single-commit Phase
  C ceremony.

**Chunks ordering rationale.** Sub-Q5 5.1a → 5.1b sequenced LOCKED
at scope-lock cycle Round 3 (`5121569`) per dependency analysis:
chunk 5.1a's INV-DOC-001 enforcement at `billService.post()` is
upstream substrate that chunk 5.1b's `paymentService.record()`
greenfield can reference (paymentService doesn't enforce
INV-DOC-001 at v1 per Sub-Q2 2.β partial extraction; future
consumer chunks may inherit). Chunk 5.1c was added post-Session-22
per Cat 2 N=3 graduation discipline (Option β standalone substrate-
fix chunk over Option α retrospective-grain ship + Option γ defer-
to-Phase-7). The three-chunk decomposition produces clean substrate-
fix narrowness at chunk 5.1c grade (no overlap with chunks 5.1a +
5.1b substrate scope).

**Operational-flex collapse pattern at scope-lock Round 4.** Phase
5.1 scope-lock cycle convened 4 rounds (Rounds 1-4 at `72a40bf` +
`2560ef6` + `5121569` + `8631a5d`); Round 4 substantively closed
the cycle (14 sub-questions + 8 sub-decisions LOCKED). Round 4's
collapse pattern empirically extends the Phase 6.5 operational-flex
collapse heuristic codified at CLAUDE.md (N=3 graduation at Sessions
6+9+12); chunk 5.1c was added post-Round-4 via brainstorming-side
adjudication (not within the formal scope-lock cycle), preserving
the collapse pattern at the amendment-cycle grain. The amendment-
cycle collapse precedent extends the chunk-grade decomposition
heuristic — see Observation #11 below for the extension framing.

**What Phase 5.1 closes.** Phase 5.1 closes here at chunk-5.1c
substrate-fix complete: INV-DOC-001 v1-active enforcement shipped;
vendor_credits β substrate (tables + Layer 1 CHECK + 3 enums)
ratified as reserved-post-v1 per Phase 5 retro §6:404 framing;
paymentService.ts greenfield + T2 dispatcher activation shipped;
apReportService Cat 2 substrate-fix shipped. Phase 5.1's downstream
consumers — Phase 7+ Tier 2 pipeline (classification + extraction +
vendor-matching) consuming paymentService.ts as the payment-flow
primitive; future vendorCreditService chunk consuming the
vendor_credits β substrate; T4/T6 dispatcher activations inheriting
the four-part bidirectional activation discipline codified at
ADR-0018 §item 4 Phase 5.1 amendment — sit downstream of this
retrospective; named carry-forwards in §6 below. Per Sub-Q7 LOCKED
placement, this retrospective lives at
`docs/07_governance/retrospectives/phase-5-1-retrospective.md`
standalone (not absorbed into Phase 5 retrospective).

## 2. Chunk-by-chunk recapitulation

### 2.1 Chunk 5.1a — INV-DOC-001 graduation + vendor_credits β substrate + ADR-0016 third amendment

Chunk 5.1a is the substrate-spine chunk of Phase 5.1. It graduates
INV-DOC-001 (document-evidence-completeness invariant) from
named-future-trigger status (Phase 5 retrospective §6:404 banked) to
v1-active enforcement at `billService.post()`. The graduation
follows the N≥2 named-future-trigger discipline established at
ADR-0011 §15: the invariant carried as reserved through chunks 5
+ 6 + 6.5; chunk 5.1a graduates per the N=3 evidence basis
accumulated at Phase 5 retrospective inventory.

**Scope shipped:**

- INV-DOC-001 leaf at `docs/02_specs/ledger_truth_model.md` (new
  leaf; bill commits require `primary_document_id` OR
  `override_evidence_completeness=true`).
- Layer 1: migration 20240138000000 adds `bills.primary_document_id`
  nullable FK + `bills.override_evidence_completeness` boolean NOT
  NULL DEFAULT false.
- Layer 2: `billService.post()` enforces invariant; throws
  `ServiceError('EVIDENCE_INCOMPLETE')` when neither
  primary_document_id nor override_evidence_completeness=true is
  provided.
- `EVIDENCE_INCOMPLETE` ServiceErrorCode addition to closed union.
- PostBillInputSchema extension (primary_document_id +
  override_evidence_completeness).
- `documentLinkService.create()` invocation at billService.post()
  when primary_document_id provided (same transaction window;
  link_role='primary_invoice').
- billEvidenceCompleteness.test.ts (3 fixtures: enforcement +
  override + primary_document_id path).
- vendor_credits β substrate: vendor_credits + vendor_credit_applications
  tables (migration 20240156000000) + 3 enums (vendor_credit_state
  + vendor_credit_kind + vendor_credit_application_kind) + Layer 1
  CHECKs. **No service layer at chunk 5.1a per Phase 5 retro §6:404
  framing** (post-v1 operational-signal-contingent; tables shipped
  pre-service per "land schema with consumer code" reverse-
  discipline ADR-0010 substrate-now-enforcement-later instance).
- ADR-0016 third amendment: linked_entity_type 8 v1-active
  reorganization with vendor_credit + vendor_credit_application
  moved to reserved-post-v1; Phase 2.5 Commit A's "8 v1-active to
  6 v1-active" reconciliation re-expanded back to 8 v1-active
  including the two β substrate values (reserved as enum members
  but β substrate ships at v1 for forward-compat).

**Brief commit:** `8f9df9b` (Session 19 chunk 5.1a brief, 938
lines). **Ship commit:** `c228512` (Session 20). **Forecast vs
realized:** brief §1.3 implementation forecast ~800-1500 LOC;
realized 977 insertions across 18 files. **Within band; at-or-
above cycle-substantive sub-curve (a)** per plan-authoring.md
Volume-forecast convention (extension at Phase 5.1 close — see
Observation #24 + #27).

**Path C invocation:** not invoked. Session 19 brief evaluated
Path C at Grain 1 (brief-draft prospective); negative.

**Carry-forwards to chunk 5.1b:** EVIDENCE_INCOMPLETE
ServiceErrorCode present at ServiceError.ts; paymentService.record()
at chunk 5.1b doesn't enforce INV-DOC-001 (Sub-Q2 2.β partial
extraction); RecordPaymentInputSchema authored as RecordBillPaymentInputSchema
mirror (10 fields).

**Notable patterns surfaced:** Cat 2 apReport URI-too-long pattern
N=2 firing (chunk 5.1a c228512 commit body banking); ADR-0016
third amendment additive provenance-preserving (third amendment
trajectory shape; Observation #3 below); paired-Zod-shape-at-
partial-extraction anticipation (Observation #17 below; firing
prediction surfaced at brief grade for chunk 5.1b).

### 2.2 Chunk 5.1b — paymentService greenfield + T2 dispatcher activation

Chunk 5.1b is the greenfield-with-no-v1-callers chunk of Phase 5.1.
It introduces `paymentService.ts` as the payment-flow primitive per
Sub-Q2 2.β LOCKED (partial extraction — payment-flow primitive vs
AP-domain orchestration). `billService.recordPayment` retains
AP-domain orchestration (bill state transitions + lifecycle_state
UPDATE + T5 conditional dispatch on fully_paid) unchanged at chunk
5.1b. paymentService.record() ships as substrate-without-consumer
pattern (parallels vendor_credits β substrate at chunk 5.1a); future
consumer chunks may refactor billService.recordPayment to delegate.

**Scope shipped:**

- `paymentService.ts` greenfield at `apps/web/src/services/spend/`
  with `paymentService.record()` payment-flow primitive (12-step
  operations sequence: Zod parse + bill load + Sub-L precondition +
  fiscal_period + accounts validate + JE compose + journalEntryService
  .post() delegate + payments INSERT + bill_payment_allocations
  INSERT + payment_recorded audit + T2_new_payment dispatch).
- `RecordPaymentInputSchema` at recordPayment.schema.ts (10 fields;
  mirrors RecordBillPaymentInputSchema).
- T2 dispatcher slot bidirectional activation:
  - Emit-side: paymentService.record() post-commit dispatch via
    `dispatchTrigger({trigger_type: 'T2_new_payment', ...})`
    (Pattern B external-wrap variant + P3-i F-J-4 best-effort
    isolation; try/catch + log; never propagate).
  - Admit-side: `DispatchTriggerInputSchema` discriminated-union
    extension (5 → 6 v1-active-emission-wired branches; added
    T2_new_payment branch with payload `{org_id, payment_id,
    vendor_id, bill_id, trace_id}`).
  - Consumer admit: `dispatchTrigger()` switch case addition
    (`case 'T2_new_payment':` falling through to T1/T3 helper per
    shared "new-domain-entity-created" semantic class).
  - Helper rename: `computeT1T3FanOut` → `computeT1T2T3FanOut`
    (semantic class extension).
  - File header + JSDoc comment refreshes across affected file
    (Zod schema header §402 5→6 v1-active; dispatchTrigger
    comments at §1370 + §1492 + §1517).
- `paymentServiceRecord.test.ts` integration tests (5 fixtures:
  positive path + Sub-L precondition rejection + Zod validation +
  NOT_FOUND bill + T2 dispatcher isolation via vi.spyOn).

**Brief commit:** `65680c8` (Session 21 chunk 5.1b brief, 788
lines). **Ship commit:** `12847bf` (Session 22). **Forecast vs
realized:** brief §1.3 implementation forecast ~700-1170 LOC;
realized 830 insertions across 5 files. **Within band; at-or-
above cycle-substantive sub-curve (a).**

**Path C invocation:** not invoked. Session 21 brief evaluated
Path C at Grain 1 (brief-draft prospective); negative. Risk 1
fired at Session 22 Phase A Step 4 verify-from-disk (dispatchTrigger
switch exhaustive over 5 branches without default case; T2 admission
required consumer-side amendment beyond brief §2.1 enumeration);
mitigation expanded Task 4 within brief scope (not Path C reactive
invocation per F-J-14 mid-impl-reactive sub-grain).

**Cat 2 N=3 firing.** Full-suite vitest at validation gate
surfaced 6 failures (or 5 fixtures per Session 23 verify-from-disk
re-attribution — see Observation #23 below) at apReport family
(apAging + openBills + paymentApprovalQueue) with
`bill_payment_allocations lookup failed: URI too long`. Pattern
matches chunk 5.1a c228512 N=2 banking + Phase 6.5 chunk 6.2b N=1
banking. **Three-instance evidence basis graduates Cat 2 from
"pre-existing pollution acknowledged" to "substrate-fix
candidate."** Brainstorming-side escalation contract fired at
Session 22 close per directive escalation contract; chunk 5.1c
ratified as standalone substrate-fix chunk per Option β disposition.

**Carry-forwards to chunk 5.1c:** Cat 2 N=3 substrate-fix scope
(apReportService loadBillsWithAmountDue refactor; Fix A
adjudication); brainstorming-side metafact drift family parent
consolidation candidate (push-state-claim N=4 + brief-citation-
line-drift N=2 surfaced at Sessions 19-22 onset — see Observation
#16 + #19 below).

**Notable patterns surfaced:** Bidirectional dispatcher admit-half
operational refinement (Observation #18 below; ADR-0018 §item 4
amendment candidate at Phase 5.1 close); paired-Zod-shape-at-
partial-extraction (Observation #17 below; N=1 ratified at impl-
time per Risk 7 brief prediction); Cat 2 N=3 graduation.

### 2.3 Chunk 5.1c — apReportService SELECT IN → nested-select refactor (Cat 2 N=3 substrate-fix)

Chunk 5.1c is the standalone substrate-fix chunk added post-Session
22 per Cat 2 N=3 graduation discipline. The fix is narrow: single
helper refactor at `apReportService.loadBillsWithAmountDue`
replacing the 2-query SELECT IN pattern with a single PostgREST
nested-select query (Fix A per brief §5.1 adjudication). Scope-lock
2026-05-10 disposition preserved (nested-select IS a supabase-js
JOIN-side aggregation per PostgREST embed semantics); no migration;
no schema changes; no consumer-side changes by construction.

**Scope shipped:**

- `apReportService.loadBillsWithAmountDue` helper body refactor:
  2-query SELECT IN → single PostgREST nested-select. Per-bill
  aggregation moves from index-then-loop (prior 2-query pattern) to
  per-row reduce over embedded `bill_payment_allocations` array.
- File header comment block §13-22 refresh: acknowledges nested-
  select pattern preserves scope-lock 2026-05-10 disposition; adds
  Phase 5.1 chunk 5.1c brief cross-reference + Cat 2 N=3 graduation
  context.
- Inline JSDoc at refactored helper site: documents Cat 2 N=3
  evidence basis + Fix A adjudication + accumulated-state validation
  gate framing.

**Brief commit:** `0593f23` (Session 23 chunk 5.1c brief, 583
lines). **Ship commit:** `9ec9235` (Session 24). **Forecast vs
realized:** brief §1.3 implementation forecast ~100-300 LOC;
realized +12 net LOC (43 insertions / 31 deletions; single file).
**Below floor; substrate-fix-narrowness sub-curve (b)** per plan-
authoring.md Volume-forecast convention extension (this Phase 5.1
close codification; Observation #24 + #27 evidence basis).

**Path C invocation:** not invoked. Session 23 brief + Session 24
Phase A evaluated Path C at Grains 1+2; negative at both grains.

**Cat 2 5 → 0 transition observed cleanly:**
- Pre-fix: 5/5 fixtures failed with `[READ_FAILED] ap_report:
  bill_payment_allocations lookup failed: URI too long` at
  loadBillsWithAmountDue:283. Captured at Session 24 Phase B Task
  0 via isolated run of 3 failing test files.
- Post-fix: 5/5 fixtures pass; full vitest suite 1156/1156 green.

**Cat 2 root-cause diagnostic refined at impl-onset.** Brief framed
Cat 2 as "accumulated bill_payment_allocations row state exceeds
PostgREST URL length"; Session 24 Phase A empirical evidence
revealed firing comes from "OPEN BILLS count in the SECOND-query
IN clause" (254 open bills × ~37 chars/UUID ≈ 9.4KB IN list
exceeded ~8KB PostgREST URL limit), NOT from accumulated allocation
rows (bpa_count = 0 at Session 24 onset). Different mechanism; same
fix shape (nested-select eliminates the second SELECT IN entirely).
See Observation #25 below for the URL-shape misidentification sub-
shape banking.

**Notable patterns surfaced:** Cat 2 mechanism / URL-shape
misidentification (Observation #25 below; brief-drafting metafact-
assertion grain firing); path (i) natural-accumulation premise-
broken (Observation #26 below; brief-drafting metafact-assertion
grain firing — assumption about test cleanup behavior not verify-
from-disk-grounded at brief grade); four-curve calibration impl-
grade confirmation (Observation #27; two-grain consistency with
brief grade per Observation #24).

## 3. Patterns observed

The 27-candidate Phase 5.1 retrospective input pile accumulated
across chunks 5.1a + 5.1b + 5.1c + scope-lock cycle Rounds 1-4 +
chunk-brief drafting sessions (Sessions 19 + 21 + 23) + impl
sessions (Sessions 20 + 22 + 24) ships dispositions across four
canonical venues per the founder-ratified routing rule + three-
commit ceremony A→B→C per T3>T4>T1 surface-precedence (inheriting
Phase 6.5 retrospective shape).

The candidates cluster into five thematic groups:
- **Cluster A — Pre-existing Phase 5 inventory carry-forwards** (#1-4 + #15)
- **Cluster B — Cycle-grade discipline observations** (#5-14 minus consolidations)
- **Cluster C — Substrate-fix + amendment observations** (#16-20)
- **Cluster D — Brainstorming-side metafact drift family** (#16 + #19 + #21 + #22 + #23 + #25 + #26) — parent consolidation candidate
- **Cluster E — Volume-forecast four-curve calibration** (#24 + #27) — two-grain consistency

Cluster C overlaps with Cluster D at #16 + #19; Cluster D is the
load-bearing parent consolidation for codification routing. Cluster
E is two-grain evidence basis for the existing Volume-forecast
convention extension. Below: per-candidate dispositions in input-
pile order, with consolidation framings where clusters apply.

### Candidate #1 — ADR-0011 §15 editorial cluster (2 candidates; T1-only-narrative)

**Pattern.** ADR-0011 §15 surfaced two editorial drift candidates
across the scope-lock cycle: (a) adjacent-commit-paths drift (the
section's commit-path references became stale post-Phase 2.5
amendment cycle reorganization) and (b) primary link_role naming
inconsistency (the section's link_role examples drifted from the
chunk-5.1a INV-DOC-001 substrate vocabulary).

**Disposition.** Both candidates assessed as below codification
threshold; ADR-0011 §15 edits did not ship at chunk-5.1a commit
window (c228512) per scope-lock cycle Round 4 ratification (the
editorial drift is non-load-bearing for v1 readers; the section's
load-bearing claim — INV-DOC-001 reservation status — graduated
out of reserved status at chunk 5.1a). T1-only-narrative
disposition: the carry-forward is acknowledged here for future
ADR-0011 editorial pass scheduling; not a codification candidate.

**Carry-forward.** Future ADR-0011 editorial pass (post-Phase-7
opportunity at next ADR-0011 amendment cycle) should refresh §15
commit-path references + link_role naming examples.

### Candidate #2 — Phase 5 retro §6:404 vendor_credits assertion correction (T1-only-narrative)

**Pattern.** Phase 5 retrospective §6 at line 404 asserted "vendor_credits
substrate ships at chunk 5.1a per Phase 5 retro framing"; Phase 5.1
scope-lock cycle Round 2 Sub-Q3 β LOCKED ratified that vendor_credits
ships as β substrate WITHOUT vendorCreditService (post-v1
operational-signal-contingent). The Phase 5 retro §6:404 assertion
was strictly correct for the table substrate but not for the service
layer; the gap surfaces at retrospective-authoring fourth-grain
(N=1).

**Disposition.** T1-only-narrative; the assertion correction lives
in this retrospective writeup at this candidate entry + the chunk
5.1a brief's Sub-Q3 β LOCKED disposition. No upstream Phase 5 retro
edit required (the §6 assertion stays as historical record;
provenance preserves the brainstorming-side framing at Phase 5
close). Below codification threshold; retrospective-authoring
fourth-grain N=1 inherits the framework from Phase 6.5
retrospective §3 candidate-disposition fourth-grain precedent.

### Candidate #3 — ADR-0016 third amendment additive provenance-preserving (T1-only-narrative exemplar)

**Pattern.** ADR-0016 has now received three amendments: Phase 2.5
Commit A (`9d788e2`, 8→6 v1-active reconciliation); Phase 4
retrospective Commit B (`fc36c6e`, missed-cell + pre_commit_link_rerouted
deferral); Phase 5.1 chunk 5.1a (`c228512`, third amendment with
linked_entity_type 8 v1-active reorganization with vendor_credit +
vendor_credit_application moved to reserved-post-v1). Each
amendment is additive provenance-preserving per ADR-0022 §5; the
ADR sequence reads chronologically with three amendment blocks.

**Disposition.** T1-only-narrative exemplar. ADR-0022 §5 systematic
application is the canonical rule; ADR-0016's three-amendment
trajectory is one of multiple instances now demonstrating the
additive shape (ADR-0018 also at second amendment via Phase 5.1
Commit A). Phase 6.5 retrospective §3 Candidate #12 codified
ADR-0022 §5 systematic application as T1-only exemplar; this
Phase 5.1 retrospective Candidate #3 extends the exemplar inventory.

**Adjacent patterns.** Cousin to ADR-0018 second amendment at Phase
5.1 Commit A (`83a5405`) per shared additive provenance-preserving
amendment shape. Cousin to ADR-0011 third amendment hypothetical
at Phase 5.1 close (declined per Candidate #1 below-threshold
disposition; no third amendment shipped).

### Candidate #4 — controller_override_memo + T4/T6 dispatcher slots named-future-activation cluster (T1-only-narrative)

**Pattern.** Phase 5.1 scope-lock cycle Round 2 Refinement 2
captured the T4/T6 dispatcher slot reservation: T4_new_vendor_credit
+ T6_payment_state_transition remain reserved per Framing F pending
`vendorCreditService.ts` shipping in a future Phase 5 amendment
chunk (post-v1 operational-signal-contingent). Adjacent reservation
at controller_override_memo (Phase 5 retrospective banking item)
similarly stays as named-future-activation pending operational
signal.

**Disposition.** T1-only-narrative carry-forward. The named-future-
activation cluster is operational-signal-contingent; codification
would be premature at retrospective-grade (the activation triggers
are operational facts not surfaced at Phase 5.1 close). Phase 7+
or post-v1 amendment cycle is the right grain for activation
adjudication.

**Adjacent patterns.** Cousin to ADR-0018 §item 4 Phase 5.1 amendment
codification of the four-part bidirectional activation discipline
(Observation #18 below) — the discipline applies at T4/T6 activation
time; the codification at the ADR ensures future activations read
the discipline at the ADR rather than re-deriving it ad-hoc.

### Candidate #5 — Cat 2 apReport URI-too-long N=2 → N=3 graduation pattern (closed)

**Pattern.** Cat 2 apReport URI-too-long pattern fired at three
distinct observation-grain instances: Phase 6.5 chunk 6.2b (N=1;
banked at chunk 6.2b retrospective candidate inventory) → Phase
5.1 chunk 5.1a c228512 (N=2; acknowledged in commit body +
brainstorming-side escalation framing "if N=3 fires, escalate") →
Phase 5.1 chunk 5.1b 12847bf (N=3; brainstorming-side escalation
contract fired at Session 22 close per directive escalation
contract).

**Disposition.** **CLOSED** by Observation #20 (Cat 2 N=3
substrate-fix graduation; chunk 5.1c standalone substrate-fix ship
per Option β disposition). T1-only-narrative trajectory exemplar.

**Adjacent patterns.** Mirrors INV-DOC-001's N≥2 named-future-
trigger graduation that fired into chunk 5.1a (Phase 5 retro
§6:404 N≥2 → chunk 5.1a graduation). Two-arc independent evidence
basis for the N≥2/N=3 graduation discipline operating at substrate-
fix grade.

### Candidate #6 — Multi-grain detective catalog Grain 4 (implementation-authoring; T1-only-narrative)

**Pattern.** Multi-grain detective discipline catalog at Phase 6.5
codified at scope-lock.md as 4-grain catalog (Grain 1 substrate-
shape + Grain 2 per-trigger semantic coverage + Grain 3 per-trigger
× per-decision-outcome conformance + Grain 4 idempotency-and-side-
effect-contract conformance). Grain 4 (implementation-authoring
sub-grain) accreted N=1 evidence basis at Phase 5.1 chunk 5.1a
Session 20 Phase B (constraint-name drift discovered at impl-
authoring grain).

**Disposition.** T1-only-narrative; below N≥3 graduation threshold
for catalog extension. Carry-forward: Grain 4 evidence accretion
candidate at future implementation-authoring grain firings.

### Candidate #7 — Multi-grain detective catalog Grain 5 sub-shapes (T1-only-narrative)

**Pattern.** Grain 5 (consumer-application grain at scope-lock)
codified at Phase 6.3a scope-lock.md as 2-sub-grain catalog
(substrate-shape consumer-application + UI-consumer-contract).
Phase 5.1 chunk 5.1a + 5.1b firings did not surface new sub-grains
at Grain 5.

**Disposition.** T1-only-narrative; sub-grain enumeration stays
at N=2 per Phase 6.3a precedent. Carry-forward acknowledgment;
Phase 7+ Tier 2 pipeline UI consumer chunks likely surface
additional sub-grains.

### Candidate #8 — Phase B intermediate-state surfacing discipline at long-session grain (T1-only-narrative)

**Pattern.** Long-session implementations (chunks 5.1a + 5.1b
spanned multi-hour sessions) benefit from intermediate-state
surfacing at Phase B (post-substrate-load, pre-final-validation)
to allow course-correction before final commit. Phase 6.5
implementation precedent surfaced this pattern; Phase 5.1 chunks
5.1a + 5.1b inherited it.

**Disposition.** T1-only-narrative observation. Below codification
threshold for dedicated convention; pattern is operationally absorbed
at Phase B closeout discipline (existing Phase 6.5 retrospective
codification at conventions/session/). Carry-forward acknowledgment.

### Candidate #9 — Mechanism B fresh-path-citation density dominance over Mechanism A discipline internalization

**Pattern.** Mechanism A discipline internalization (the team-side
attempting to internalize discipline from prior retrospectives)
proved dominated by Mechanism B fresh-path-citation density (the
brainstorming-side asserting metafacts that fail verify-from-disk
grounding). Sessions 19-22 onset firings surfaced the brainstorming-
side metafact drift family at 7-sub-shape evidence basis; Mechanism
A internalization at WSL Claude impl-side caught the drifts
prophylactically.

**Disposition.** Subsumed into Observation #19 parent consolidation
(brainstorming-side metafact drift family). The Mechanism A vs B
framing is a meta-observation about the codification's load-bearing
home (parent consolidation at scope-lock.md per Commit B `b7ec879`).
T1-only-narrative meta-observation; no additional codification
beyond Observation #19 parent consolidation.

### Candidate #10 — Volume forecast grain-specific calibration (three curves; consolidated into #24+#27)

**Pattern.** Volume forecast grain-specific calibration (three
curves: walk-grain stable; cycle-close below; chunk-brief at-or-
above) codified at Phase 6.5 retrospective Candidate #9. Phase
5.1 chunk 5.1c surfaced the fourth-curve extension at substrate-
fix-narrowness sub-curve.

**Disposition.** Merged with Observations #24 + #27 (four-curve
calibration). The three-curve calibration extends to four curves
via sub-curve split at chunk-brief grade: sub-curve (a) cycle-
substantive at-or-above + sub-curve (b) substrate-fix-narrowness
at-or-below. Codified at Commit B `b7ec879` (plan-authoring.md
Volume-forecast convention extension).

### Candidate #11 — Operational-flex collapse heuristic extends to amendment-cycle grain (T1-only-narrative)

**Pattern.** Phase 6.5 retrospective Candidate #11 codified
operational-flex collapse heuristic at chunk-grade decomposition
(N=3 at Sessions 6+9+12). Phase 5.1 scope-lock cycle Round 4
substantively closed the cycle with 14 sub-questions + 8 sub-
decisions LOCKED — empirically extending the collapse heuristic to
amendment-cycle grade. Chunk 5.1c was added post-Round-4 via
brainstorming-side adjudication preserving the collapse pattern
(the cycle did NOT re-convene to ratify chunk 5.1c; the chunk
shipped as direct adjudication).

**Disposition.** T1-only-narrative extension of Phase 6.5 codified
pattern. Below codification threshold for separate amendment-cycle-
grade convention (the chunk-grade collapse heuristic generalizes;
the amendment-cycle grade is an instance, not a distinct
discipline). Carry-forward acknowledgment: future amendment cycles
extend the collapse-grade evidence accretion.

### Candidate #12 — Bill integration test naming convention candidate (T1-only-narrative)

**Pattern.** Bill integration test naming (billPostBill +
billRecordPayment + billReverse + billEcA1 + billEcA2 +
billEvidenceCompleteness) follows the pattern
`bill[Method][Discriminator].test.ts`. Chunk 5.1b's
`paymentServiceRecord.test.ts` extended the naming pattern to the
service-method grade (paymentService[Action].test.ts mirror).

**Disposition.** T1-only-narrative. Below codification threshold;
naming pattern is convention-by-precedent rather than codified
rule. Carry-forward acknowledgment; Phase 7+ service-method tests
inherit the naming pattern.

### Candidate #13 — Late-stage detective discipline at brief grain (Session 19; T1-only-narrative)

**Pattern.** Chunk 5.1a brief drafting at Session 19 exercised
late-stage detective discipline (verify-from-disk pass at brief
§6 + §7 sections to catch drift before brief commit). The
discipline produced 0 new drift findings at chunk 5.1a brief grade.

**Disposition.** T1-only-narrative observation. The discipline is
already codified at scope-lock.md "Verify-from-disk-at-non-standard-
grain pattern"; Session 19 application is an instance, not a
distinct discipline.

### Candidate #14 — Session-lock convention refinement (Sessions 14-24 without session-lock; T1-only-narrative)

**Pattern.** Sessions 14-24 operated without `scripts/session-init.sh`
session-lock per the coordination warning emitted at each commit
("no session lock in use; consider running scripts/session-init.sh
<label> before starting new work"). Per the founder-ratified
operational discipline (memory: feedback_coord_lock_hostile_takeover),
foreign session-lock is not a problem to solve. The absence of
session-lock across Phase 5.1 amendment cycle did not produce any
coordination collisions.

**Disposition.** T1-only-narrative observation. The session-lock
convention may benefit from refinement at convention surface
(documenting when session-lock IS required vs when its absence is
operationally acceptable); below codification threshold at Phase
5.1 close. Carry-forward acknowledgment.

### Candidate #15 — Pre-existing reachability asymmetry INV-AP-001/002 + INV-CHECKPOINT-001 (T1-only-narrative)

**Pattern.** Bidirectional reachability check at chunk 5.1a +
5.1b + 5.1c surfaced pre-existing asymmetry: INV-AP-001 (over-
allocation prevention) + INV-AP-002 (state-transition path
enforcement) + INV-CHECKPOINT-001 (checkpoint invariant) are
referenced at billService.ts + invariants.md but the cross-
references between invariants.md ↔ control_matrix.md ↔
ledger_truth_model.md are not bidirectionally complete.

**Disposition.** T1-only-narrative carry-forward. The asymmetry is
pre-existing; chunk 5.1a + 5.1b + 5.1c did not address it (scope-
lock 2026-05-10 disposition + chunk scope-lock cycle Rounds 1-4
ratified scope did not include bidirectional reachability remediation).
Carry-forward to future Phase 5 amendment cycle Sub-Q OR Phase 7+
audit cycle.

### Candidate #16 — Push-state-claim sub-shape (parent: #19 brainstorming-side metafact drift family)

**Pattern.** Session 19 + 20 + 21 + 22 onset directives cited
`origin/staging` push state without verify-from-disk grounding;
actual push state diverged across all four sessions (N=4 evidence
basis). Session directive at session-prompt-authoring grain made
the metafact assertion; WSL Claude impl-side verify-from-disk at
session-onset caught the drift each time.

**Disposition.** Codified at Commit B `b7ec879` as **sub-shape of
parent consolidation** within scope-lock.md sub-grain #7
(session-prompt-authoring / directive-authoring grain). Sub-shape
catalog entry within #7 captures N=4 evidence basis. **Remediation
trajectory empirically validated:** Sessions 23 + 24 directive
citations explicitly verified push state via `git log origin/staging
-1` at directive-authoring grain (avoidance trajectory; N=4 stable
post-codification across two sessions).

**Adjacent patterns.** Cousin to Observations #19 + #21 + #22 +
#23 + #25 + #26 per parent consolidation framing (see Observation
#19 for full parent consolidation).

### Candidate #17 — Paired-Zod-shape-at-partial-extraction sub-shape (N=1 ratified; T1-only-narrative)

**Pattern.** Chunk 5.1b brief §8 Risk 7 predicted: "RecordPaymentInputSchema
vs RecordBillPaymentInputSchema convention drift" — two near-
identical Zod schemas in parallel at v1 per Sub-Q2 2.β partial
extraction disposition. Chunk 5.1b 12847bf impl-time evidence
ratifies N=1: RecordPaymentInputSchema fields exactly mirror
RecordBillPaymentInputSchema (10 fields, same shape). Brief Risk 7
prediction held; no drift surfaced at impl-time.

**Disposition.** T1-only-narrative observation. N=1 ratification
below codification threshold; future consumer chunks may consolidate
the two schemas if billService.recordPayment refactors to delegate
to paymentService.record(). Carry-forward acknowledgment per Phase
5.1 retrospective Observation #17 (this entry).

### Candidate #18 — Bidirectional dispatcher admit-half operational refinement (T3 ADR-0018 §item 4 amendment)

**Pattern.** Chunk 5.1b 12847bf Phase A Step 4 verify-from-disk
surfaced: `dispatchTrigger()` switch in `documentRouterService.ts`
exhaustive over 5 v1-active-emission-wired branches without
default case. T2 admission required consumer-side amendment beyond
brief §2.1 enumeration (Risk 1 firing). Mitigation expanded Task
4 within brief scope (case 'T2_new_payment': fall-through to
T1/T3 helper + `computeT1T3FanOut` → `computeT1T2T3FanOut` rename
+ comment refreshes at file header §402 + dispatchTrigger comments
§1370 + §1492 + §1517). Single-instance evidence basis (N=1); pattern
likely recurs at T4/T6 vendorCreditService activation.

**Disposition.** **T3 ADR-0018 §item 4 amendment at Commit A
`83a5405`** — codifies the four-part bidirectional activation
discipline (schema admit + consumer admit + helper rename + comment
refresh) at the ADR level so future T4/T6 activations inherit the
discipline by reading the ADR rather than re-deriving the four-part
shape ad-hoc. Cross-references: chunk 5.1b brief §8 Risk 1
prediction; Phase 4 retrospective ADR-0018 first amendment
(2026-05-14) Framing F substrate-collapse codification.

**Why ADR-level codification at N=1.** ADR amendments don't follow
the N≥3 convention threshold; ADR text catches up to substrate
ship state per "ADR text catches up to chunks-shipped substrate
reality" principle. T2 graduated from "reserved per Framing F" to
"v1-active-emission-wired" at chunk 5.1b — the ADR must capture
the activation reality. The four-part operational discipline
captured at the same amendment block ensures future T4/T6
activations read it at the ADR.

### Candidate #19 — Brief-citation-line-drift sub-grain (parent consolidation: brainstorming-side metafact drift family)

**Pattern.** Session 22 directive references to chunk 5.1b brief
cited two line ranges that drifted from disk reality: brief said
`EVIDENCE_INCOMPLETE at ServiceError.ts:109-114` (actual 103-108)
and `RecordBillPaymentInputSchema at bill.schema.ts:117-130`
(actual 111-122). Consistent ~5-6 line offset; substrate shape
correct. Verify-from-disk at impl-onset surfaced the drift. N=2
evidence basis at Session 22 directive.

**Disposition.** Codified at Commit B `b7ec879` as **sub-shape of
parent consolidation** within scope-lock.md sub-grain #8 (brief-
drafting metafact-assertion grain). Sub-shape catalog entry within
#8 captures N=2 evidence basis + remediation pattern (structural-
anchor citations preferred over absolute line citations at brief-
drafting grade; line citations remain valid at impl-time verify-
from-disk grade).

**Parent consolidation framing (load-bearing for Phase 5.1
retrospective).** Observations #16 + #19 + #21 + #22 + #23 + #25 +
#26 form a seven-sub-shape family at "brainstorming-side metafact
drift at directive-authoring + brief-drafting + session-close-
report grain." Seven-sub-shape evidence basis at Phase 5.1 close:

| # | Sub-shape | Grain | N |
|---|---|---|---|
| #16 | Push-state-claim | Sub-grain #7 (directive-authoring) | 4 |
| #21 | Dev-DB-state-assumption | Sub-grain #7 (directive-authoring) | 1 |
| #22 | Directive-substrate-coverage | Sub-grain #7 (directive-authoring) | 1 |
| #19 | Brief-citation-line-drift | Sub-grain #8 (brief-drafting) | 2 |
| #25 | Cat 2 URL-shape misidentification | Sub-grain #8 (brief-drafting) | 1 |
| #26 | Test-cleanup-behavior assumption | Sub-grain #8 (brief-drafting) | 1 |
| #23 | Fixture-count-attribution | Sub-grain #9 (session-close-report) | 1 |

**Total: N=11 instances across 7 sub-shapes spanning 3 sub-grains.**
The parent shape: brainstorming-side asserts a metafact at
authoring grain (directive, brief, session-close-report) that
fails verify-from-disk grounding at downstream-consumption grain
(session-onset, impl-onset, next-session brief-drafting). The
remediation pattern is consistent across all seven sub-shapes:
verify-from-disk grounding at brainstorming-side BEFORE asserting
metafacts. The discipline's load-bearing home is scope-lock.md sub-
grain catalog extension per Commit B `b7ec879`; cousin firings at
future phases extend the sub-grain or sub-shape enumeration as
evidence accretes.

**Adjacent patterns.** Mirrors Phase 6.5 retrospective Candidate #5
partial-information-recommendation-drift sub-grain #7 first instance
at session-prompt-authoring grain (Phase 6.5 N=11 evidence basis for
the prophylactic discipline application surface). Phase 5.1 evidence
extends the catalog with N=11 additional instances across the three
sub-grains; the discipline's parent-shape codification at scope-
lock.md is the canonical statement post-Phase-5.1.

### Candidate #20 — Cat 2 N=3 substrate-fix graduation (closed by chunk 5.1c)

**Pattern.** Cat 2 apReport URI-too-long N=3 graduation (Phase 6.5
chunk 6.2b N=1 + Phase 5.1 chunk 5.1a c228512 N=2 + Phase 5.1
chunk 5.1b 12847bf N=3) graduates from "pre-existing pollution
acknowledged" to "substrate-fix candidate." Brainstorming-side
adjudication post-Session-22 ratified Option β disposition
(standalone substrate-fix chunk over Option α retrospective-grain
ship + Option γ defer-to-Phase-7).

**Disposition.** **CLOSED** by chunk 5.1c ship at `9ec9235`. T1-
only-narrative exemplar of N=3 graduation discipline. Cross-
references: chunks 5.1a + 5.1b commit-body banking (Cat 2 N=2 +
N=3 acknowledgment + brainstorming-side escalation contract); chunk
5.1c brief at `0593f23` (Option β disposition operationalization +
Fix A adjudication); chunk 5.1c implementation at `9ec9235` (Cat
2 5 → 0 transition observed + Cat 2 root-cause diagnostic refined
at impl-onset per Observation #25).

**Adjacent patterns.** Mirrors INV-DOC-001 N≥2 named-future-trigger
graduation that fired into chunk 5.1a (Phase 5 retro §6:404 →
chunk 5.1a graduation per N≥2 evidence basis). Two-arc independent
evidence basis for the N≥2/N=3 graduation discipline operating at
substrate-fix grade (general substrate-fix graduation pattern; not
Cat-2-specific).

### Candidate #21 — Dev-DB-state-reset-between-sessions sub-grain (parent: #19 brainstorming-side metafact drift family)

**Pattern.** Session 23 brief drafting directive assumed
`bill_payment_allocations` accumulated state for Cat 2 reproduction
(brief path (i) "natural accumulation via test runs"); verify-from-
disk at Session 23 onset surfaced row count = 0 (dev DB reset
between Session 22 close and Session 23 onset; Cat 2 firing
mechanism details surfaced at Session 24 Phase A — see Observation
#25). N=1 evidence basis at Session 23 onset.

**Disposition.** Codified at Commit B `b7ec879` as sub-shape of
parent consolidation within scope-lock.md sub-grain #7 (directive-
authoring grain). Sub-shape catalog entry within #7 captures N=1
evidence basis; cousin sub-shape to #16 + #22 within the same sub-
grain.

### Candidate #22 — Directive substrate-coverage drift sub-grain (parent: #19 brainstorming-side metafact drift family)

**Pattern.** Session 23 brief drafting directive cited "4 consumer
methods (aging / openBills / paymentApprovalQueue / activePayments)"
with implication of 4 direct integration tests; verify-from-disk
surfaced 3 direct integration tests + 1 route-grade test
(activePayments via `vi.spyOn` mocking; no direct service-grade
test). Validation-gate scope at Session 24 Phase C necessarily
enumerated 3 direct + 1 route-grade + full-suite sweep per test-
coverage gap. N=1 evidence basis at Session 23 onset.

**Disposition.** Codified at Commit B `b7ec879` as sub-shape of
parent consolidation within scope-lock.md sub-grain #7 (directive-
authoring grain). Cousin sub-shape to #16 + #21 within the same
sub-grain.

### Candidate #23 — Fixture-count-attribution-drift sub-grain (parent: #19 brainstorming-side metafact drift family)

**Pattern.** Session 22 close report enumerated "6 failures across
apAging.test.ts + openBills.test.ts (×2) + paymentApprovalQueue.test.ts
(×3) = 6"; Session 23 brief drafting verify-from-disk fixture count
= 5 (apAging:2 + openBills:2 + paymentApprovalQueue:1). Minor 5↔6
attribution discrepancy at session-close-report grain. The (×N)
parenthetical likely counted failed assertions within a fixture
rather than fixtures themselves; vitest's "Tests N failed" output
counts test cases (the canonical count), not assertions.

**Disposition.** Codified at Commit B `b7ec879` as sub-shape of
parent consolidation within scope-lock.md sub-grain #9 (session-
close-report attribution grain). Sub-shape catalog entry captures
N=1 evidence basis + remediation pattern (verify-from-disk on
vitest output structure at session-close authorship grain).

### Candidate #24 — Chunk-brief grain four-curve calibration brief-grade evidence (consolidated with #27)

**Pattern.** Phase 6.5 retrospective Candidate #9 codified three-
curve calibration (walk-grain stable; cycle-close below; chunk-
brief at-or-above). Chunk 5.1c brief at `0593f23` realized 583
LOC vs ~600-1000 forecast band (~3% below floor at brief-drafting
authorship grain). First substrate-fix-narrowness chunk-brief
instance — the "at-or-above" framing held for cycle-substantive
chunks 5.1a (938 LOC) + 5.1b (788 LOC) but broke for chunk 5.1c
brief.

**Disposition.** Merged with Observation #27 (impl-grade
confirmation). Codified at Commit B `b7ec879` as plan-authoring.md
Volume-forecast convention four-curve calibration sub-curve extension
(sub-curve (b) substrate-fix-narrowness at-or-below). N=2 two-grain
evidence basis at Phase 5.1 close (brief-grade Session 23 + impl-
grade Session 24); codified at exploratory framing per codify-
convention §Graduation criteria pending N=3 cross-phase evidence
accretion.

### Candidate #25 — Cat 2 mechanism / URL-shape misidentification (parent: #19 brainstorming-side metafact drift family)

**Pattern.** Chunk 5.1c brief framed Cat 2 apReport URI-too-long
firing as "accumulated bill_payment_allocations row state exceeds
PostgREST URL length"; Session 24 Phase B Task 0 impl-onset empirical
evidence revealed firing comes from "OPEN BILLS count in the SECOND-
query IN clause" (254 open bills × ~37 chars/UUID ≈ 9.4KB IN list
exceeded ~8KB PostgREST URL limit), NOT from accumulated allocation
rows (bpa_count = 0 at Session 24 onset). Different mechanism; same
fix shape. N=1 evidence basis at Session 24.

**Disposition.** Codified at Commit B `b7ec879` as sub-shape of
parent consolidation within scope-lock.md sub-grain #8 (brief-
drafting metafact-assertion grain). Sub-shape catalog entry within
#8 captures N=1 evidence basis + remediation pattern (verify-from-
disk URL-shape calculation at brief-drafting grade for URL-pressure
firings; compute the URL string and check against PostgREST/nginx
URL length limit before asserting the mechanism).

### Candidate #26 — Path (i) natural-accumulation premise-broken (parent: #19 brainstorming-side metafact drift family)

**Pattern.** Chunk 5.1c brief assumed "natural accumulation via
test runs" (path (i)) would produce `bill_payment_allocations`
accumulation state for Cat 2 reproduction; verify-from-disk on
helper-consumer test files (billRecordPayment.test.ts +
paymentServiceRecord.test.ts + billEcA1.test.ts) at Session 24
Phase A revealed all DELETE allocations in `afterAll` cleanup.
Happy-path test runs do not accumulate; brief's path (i) premise-
broken. Impl-onset adjudication shifted to path (iii) "natural
state with 254 open bills" once root-cause refinement at #25
revealed accumulation wasn't required. N=1 evidence basis at
Session 24.

**Disposition.** Codified at Commit B `b7ec879` as sub-shape of
parent consolidation within scope-lock.md sub-grain #8 (brief-
drafting metafact-assertion grain). Sub-shape catalog entry within
#8 captures N=1 evidence basis + remediation pattern (verify-from-
disk on test cleanup behavior at brief-drafting grade before
asserting accumulation paths).

### Candidate #27 — Four-curve calibration impl-grade confirmation (consolidated with #24)

**Pattern.** Chunk 5.1c impl at `9ec9235` realized +12 net LOC
(43 insertions / 31 deletions) vs ~100-300 forecast band (~88%
below floor at implementation-authorship grain). Two-grain
consistency with chunk 5.1c brief (~3% below floor at brief-
drafting authorship grain per #24) confirms substrate-fix-
narrowness sub-curve at-or-below realization at BOTH brief-grade
and impl-grade.

**Disposition.** Merged with Observation #24. See #24 disposition
(plan-authoring.md Volume-forecast convention sub-curve (b)
extension at Commit B `b7ec879`). N=2 two-grain consistency forms
the evidence basis for the sub-curve codification at exploratory
framing.

## 4. Findings — adjacent-substrate

Phase 5.1 amendment cycle surfaced or re-confirmed several pre-
existing adjacent-substrate findings outside the chunk 5.1a + 5.1b
+ 5.1c scope. The findings below are banked for post-Phase-5.1
attention queue.

### §4.A — INV-AP-001/002 + INV-CHECKPOINT-001 bidirectional reachability asymmetry (pre-existing)

Phase 5.1 chunks 5.1a + 5.1b bidirectional reachability checks
re-confirmed the pre-existing asymmetry (see Candidate #15).
Remediation candidate for future Phase 5 amendment cycle Sub-Q OR
Phase 7+ audit cycle. Substrate scope: invariants.md ↔
control_matrix.md ↔ ledger_truth_model.md cross-reference completeness.

### §4.B — Pre-existing dev-DB seed accumulation (254 open bills)

The dev DB seed produces 254 open bills in ORG_HOLDING at fresh
state. The accumulation pre-exists Phase 5.1; chunk 5.1c
implementation surfaced it as the load-bearing Cat 2 firing
condition (254 bills' IN clause URL pressure was itself the firing
mechanism; accumulated allocation rows were NOT required per
Observation #25 root-cause refinement). The seed state is not a
chunk 5.1c regression; the dev-DB seed scale is intentional per
dev-environment fixtures.

Banking acknowledgment: the dev-DB seed at 254 open bills is the
operational state that fires Cat 2 at any apReport-family integration
test against ORG_HOLDING. Chunk 5.1c fix eliminates the firing by
construction (nested-select removes the second SELECT IN entirely).
Future dev-DB seed changes (if open-bills count grows substantially)
should re-evaluate whether other SELECT IN sites in
apReportService.ts approach URL pressure (Observation: §item 8.7
Risk 7 in chunk 5.1c brief banks the broader-refactor scope as
named-future-trigger at Phase 7 grade).

### §4.C — activePayments service-grade integration test gap (chunk-5.1c-revealed)

Chunk 5.1c brief drafting verify-from-disk surfaced: `activePayments`
method on apReportService has NO direct service-grade integration
test. Only `activePaymentsReportRoute.test.ts` (route-grade with
`vi.spyOn` mocking of the service method) + `activePaymentsSchema
.test.ts` (unit schema test) provide coverage. Chunk 5.1c refactor
behavior preservation for `activePayments` relies on indirect
signals (route-grade test + full-suite sweep) per brief §8 Risk 3
banking.

Banking acknowledgment: future Phase 7+ test-coverage hardening
chunk should add `activePaymentsService.test.ts` direct service-
grade integration test. Below codification threshold; banked at
adjacent-finding grade.

### §4.D — Session-lock absence across Sessions 14-24 (operational observation)

Sessions 14-24 operated without `scripts/session-init.sh` session-
lock; coordination warning emitted at each commit but no
coordination collisions surfaced. Per founder-ratified operational
discipline (memory: feedback_coord_lock_hostile_takeover), foreign
session-lock is not a problem to solve. The absence does not block
ship-readiness.

Banking acknowledgment: see Candidate #14 carry-forward — session-
lock convention may benefit from refinement at convention surface
(documenting when session-lock IS required vs operationally
acceptable absence); below codification threshold at Phase 5.1
close.

## 5. Codifications shipped

The 27-candidate input pile ships across three canonical venues per
the founder-ratified routing rule + three-commit ceremony A → B → C
per T3 > T4 > T1 surface-precedence (Phase 6.5 retrospective
precedent).

**T3 (Commit A `83a5405`):**

- ADR-0018 §item 4 amendment covering Observation #18:
  - T2_new_payment graduation from "reserved per Framing F" to v1-
    active-emission-wired at chunk 5.1b 12847bf.
  - Four-part bidirectional activation discipline (schema admit +
    consumer admit + helper rename + comment refresh) codified for
    future T4/T6 activations.
  - Additive provenance-preserving per ADR-0022 §5; second
    amendment to ADR-0018 (Phase 4 retrospective first amendment
    2026-05-14 preserved; Phase 5.1 amendment appends).

**T4 (Commit B `b7ec879`):**

- scope-lock.md "Verify-from-disk-at-non-standard-grain pattern"
  extension covering parent consolidation (Observations #16 + #19
  + #21 + #22 + #23 + #25 + #26):
  - Sub-grain #7 broadened from session-prompt-authoring to
    session-prompt-authoring / directive-authoring grain; Phase
    5.1 evidence accretion adds 3 sub-shapes (push-state-claim
    N=4 + dev-DB-state-assumption N=1 + directive-substrate-
    coverage N=1).
  - New sub-grain #8 brief-drafting metafact-assertion grain (N=4
    across 3 sub-shapes: brief-citation-line-drift N=2 + Cat 2
    URL-shape misidentification N=1 + test-cleanup-behavior
    assumption N=1).
  - New sub-grain #9 session-close-report attribution grain (N=1
    fixture-count-attribution).
  - Parent consolidation framing: "brainstorming-side metafact
    drift at directive-authoring + brief-drafting + session-close-
    report grain" with N=11 instances across 7 sub-shapes; common
    remediation pattern (verify-from-disk grounding at
    brainstorming-side BEFORE asserting metafacts).
- plan-authoring.md "Volume-forecast — Phase-A-realized forecast
  trumps cycle-grade forecast" four-curve calibration sub-curve
  extension covering Observations #24 + #27:
  - Sub-curve (a) cycle-substantive at-or-above (chunks 5.1a +
    5.1b + Phase 6.5 + Phase 6 chunk 6.2b evidence basis).
  - Sub-curve (b) substrate-fix-narrowness at-or-below (chunk
    5.1c brief 583 LOC + impl +12 LOC two-grain consistency
    evidence basis; codified at exploratory framing pending N=3
    cross-phase evidence accretion).

**T1 (this Commit C):**

- This retrospective writeup at
  `docs/07_governance/retrospectives/phase-5-1-retrospective.md`:
  - 17 T1-only-narrative dispositions: Candidates #1-15 (Cluster
    A + B pre-existing inventory carry-forwards + cycle-grade
    discipline observations) + #17 (paired-Zod-shape) + #20 (Cat
    2 N=3 graduation closed by chunk 5.1c).
  - Per-candidate dispositions + cross-references for all 27
    candidates at §3.
- friction-journal.md banking entries (sub-task at this Commit C):
  - No new tier-1 banking entries at Phase 5.1 close (all load-
    bearing patterns codified at scope-lock.md or plan-authoring.md
    via Commit B; the parent consolidation is the load-bearing
    home).

## 6. Forward-looking implications

Phase 5.1's downstream consumers inherit substrate + patterns +
banked findings. The carry-forwards below name the consumer + the
inherited surface + the inheritance grain.

**INV-DOC-001 v1-active enforcement.** Phase 7+ Tier 2 pipeline
(classification + extraction + vendor-matching surfaces) inherits
INV-DOC-001 enforcement at `billService.post()` — future
classification-driven bill creation flows must provide either
`primary_document_id` OR `override_evidence_completeness=true`.
The substrate (Layer 1 + Layer 2 + Layer 3) is shipped; consumer
contracts inherit by reading the leaf at
`docs/02_specs/ledger_truth_model.md` INV-DOC-001.

**paymentService.ts greenfield-with-no-v1-callers.** Phase 7+ Tier
2 pipeline + future vendorCreditService chunk + post-v1 direct
payment recording paths inherit `paymentService.record()` as the
payment-flow primitive. Consumer activation requires route handler
authorship + withInvariants(action: 'payment.record') wrap + Pattern
B INV-SERVICE-001 contract preservation. Schema-duplication between
RecordPaymentInputSchema and RecordBillPaymentInputSchema is
intentional at v1; future consumer chunks may consolidate if
billService.recordPayment refactors to delegate.

**T2_new_payment dispatcher slot v1-active.** Phase 7+ Tier 2 +
post-v1 consumer chunks inherit the T2 dispatcher activation;
dispatcher fan-out via `computeT1T2T3FanOut` shares semantics with
T1_new_bill + T3_new_vendor_prepayment (org-wide stranded-cases
fan-out). T4/T6 dispatcher slots remain reserved per Framing F
pending `vendorCreditService.ts` shipping; activation follows the
four-part bidirectional activation discipline codified at ADR-0018
§item 4 Phase 5.1 amendment (this Commit A).

**vendor_credits β substrate (reserved-post-v1).** Future
`vendorCreditService.ts` chunk inherits the β substrate (tables +
Layer 1 CHECK + 3 enums) shipped at chunk 5.1a per "land schema
with consumer code" reverse-discipline. Activation trigger: founder
+ two real users hitting operational need per Phase 5 retro §6:404
framing.

**apReportService nested-select pattern.** Phase 7+ Tier 2
pipeline inherits the nested-select pattern at
`apReportService.loadBillsWithAmountDue`. Other SELECT IN sites in
apReportService.ts (billDetail at L689 single-bill scope) are NOT
Cat 2 firing sites at chunk 5.1c grade; Phase 7+ broader-refactor
scope is named-future-trigger per chunk 5.1c brief §2.2 + Risk 7
banking. If Phase 7+ surfaces additional Cat 2-class firings at
apReport family, the substrate-fix narrowness sub-curve calibration
extends with additional evidence (Observation #24 + #27 banking).

**Brainstorming-side metafact discipline graduation watch.** The
parent consolidation 7-sub-shape family codified at scope-lock.md
+ ADR-0018 §item 4 amendment graduate the brainstorming-side
metafact drift discipline to a load-bearing convention. Future
phases' directive-authoring + brief-drafting + session-close-report
authoring surfaces inherit the discipline. Sub-grain or sub-shape
enumeration extends as evidence accretes; Phase 7+ first sub-grain
extension is the named-future-trigger.

**ADR-0018 §item 4 second amendment exemplar.** Future ADR
amendments at ADR-0018 (or any other multi-amendment ADR) inherit
the additive provenance-preserving shape per ADR-0022 §5 — both
amendment blocks stay; the ADR sequence reads chronologically.
ADR-0016 three-amendment trajectory (Phase 2.5 + Phase 4 + Phase
5.1) + ADR-0018 two-amendment trajectory (Phase 4 + Phase 5.1) are
the exemplar inventory.

**Volume-forecast sub-curve (b) graduation watch.** Phase 5.1 close
codified sub-curve (b) substrate-fix-narrowness at exploratory
framing per codify-convention §Graduation criteria (N=2 two-grain
consistency at Phase 5.1; below N=3 cross-phase threshold). Next
substrate-fix-narrowness chunk at Phase 7+ extends the evidence
basis; full N=3 cross-phase evidence accretes the sub-curve to
standard codification.

**Adjacent-findings §4.A-D banked for post-Phase-5.1 attention
queue.** Bidirectional reachability asymmetry (audit-cycle
candidate); dev-DB seed accumulation (operational observation; not
a regression); activePayments service-grade test gap (test-coverage
hardening candidate); session-lock absence (operational observation
+ convention refinement candidate). Each named in §4 with banking
shape.

**Carry-forward: Candidate #4 T4/T6 dispatcher activation.** When
`vendorCreditService.ts` ships in a future Phase 5 amendment chunk
(post-v1 operational-signal-contingent), T4_new_vendor_credit +
T6_payment_state_transition activations apply the four-part
bidirectional activation discipline codified at ADR-0018 §item 4
Phase 5.1 amendment. Activation trigger: founder + two real users
hitting vendor-credit operational need.

**Carry-forward: Candidate #11 amendment-cycle collapse heuristic
extension.** Phase 5.1 scope-lock cycle Round 4 collapse extends
Phase 6.5 chunk-grade collapse heuristic to amendment-cycle grade
(T1-only-narrative). Future amendment cycles extend the collapse-
grade evidence accretion; the chunk-grade collapse heuristic
generalizes — amendment-cycle is an instance.

**Carry-forward: Candidate #1 ADR-0011 §15 editorial pass.** Future
ADR-0011 editorial pass (post-Phase-7 opportunity at next ADR-0011
amendment cycle) should refresh §15 commit-path references +
link_role naming examples.

## 7. Surface-precedence note (T3 > T4 > T1)

When future readers encounter a discrepancy across Phase 5.1
artifacts — say, a scope-lock.md sub-grain catalog description that
drifts from ADR-0018 §item 4 Phase 5.1 amendment, or this
retrospective summary that drifts from the plan-authoring.md
Volume-forecast convention sub-curve framing — the surface-
precedence ordering is **T3 > T4 > T1**:

- **T3 (ADR-0018 §item 4 Phase 5.1 amendment at Commit A `83a5405`)
  wins** for any contract / invariant / substrate question.
  ADRs are the architectural-decision tiebreaker per CLAUDE.md
  "When in doubt" leaf-discipline. The bidirectional dispatcher
  activation four-part discipline (schema admit + consumer admit
  + helper rename + comment refresh) at ADR-0018 §item 4 is the
  canonical statement of Phase 5.1's dispatcher-activation
  contract; the T2_new_payment v1-active-emission-wired status at
  ADR-0018 §item 4 is the canonical activation reality
  documentation. Future T4/T6 activations read the four-part
  discipline at the ADR, not at this retrospective or at the
  scope-lock.md catalog extension.

- **T4 (scope-lock.md + plan-authoring.md convention extensions at
  Commit B `b7ec879`) wins** for process / discipline / scope-lock /
  authoring convention questions. The parent consolidation 7-sub-
  shape brainstorming-side metafact drift family at scope-lock.md
  sub-grain catalog extension is the canonical statement of Phase
  5.1's discipline-graduation; the four-curve calibration sub-
  curve (b) extension at plan-authoring.md Volume-forecast
  convention is the canonical statement of substrate-fix-narrowness
  forecast-realization. Future directive-authoring + brief-
  drafting + session-close-report authoring surfaces inherit the
  discipline from these convention extensions, not from this
  retrospective's §3 candidate dispositions.

- **T1 (this retrospective writeup at Commit C) is the war-diary
  layer.** The evidence basis + the codification reasoning + the
  carry-forward inventory live here; if the retrospective drifts
  from T3 or T4, T3 or T4 win. The retrospective preserves
  provenance but doesn't itself carry the canonical contract or
  the standing rule. Candidates #1-15 (Cluster A + B pre-existing
  inventory + cycle-grade discipline observations) + #17 + #20
  ship as T1-only-narrative entries (below codification threshold
  at Phase 5.1 close OR exemplars of existing canonical rules) —
  these candidates intend to stay at T1 grain unless future
  evidence elevates them.

**Brainstorming-side metafact drift family graduation acknowledgment.**
The Phase 5.1 close codifies the seven-sub-shape family as the
parent consolidation at scope-lock.md (sub-grain #7 broadened +
sub-grains #8 + #9 added). The graduation reads: Phase 6.5 sub-
grain #7 codification (N=11 evidence basis at session-prompt-
authoring grain) extends at Phase 5.1 to a parent consolidation
across three sub-grains (directive-authoring + brief-drafting +
session-close-report) with seven sub-shapes and N=11 additional
instances. The discipline's canonical statement is the scope-lock.md
catalog extension; this retrospective's §3 Observation #19 entry
preserves the parent consolidation framing's discovery provenance.

**Avoidance trajectory empirical validation.** Sessions 23 + 24
directive citations explicitly verified push state via
`git log origin/staging -1` at directive-authoring grain per
Observation #16 push-state-claim remediation pattern. Two-session
avoidance trajectory validates the discipline's stability post-
codification at Commit B `b7ec879`. The empirical validation lives
at this §7 surface-precedence note + at the scope-lock.md sub-
grain #7 entry's "remediation trajectory empirically validated"
paragraph; the two positions are consistent.

This precedent-ordering is positioned at the end of §7 (here) so
future readers see it legibly. It is also positioned in CLAUDE.md
"When in doubt" canonical-source-wins discipline. The two
positions are consistent: this retrospective's §7 names T3 > T4 >
T1 explicitly for Phase 5.1 artifacts; CLAUDE.md "When in doubt"
gives the general project-wide rule that ADRs and canonical specs
win over standing rules and retrospectives. Both apply.

---

**Retrospective shipped at Phase 5.1 retrospective Commit C
(2026-05-19).** Cross-references: Phase 5.1 retrospective Commit A
(`83a5405`, ADR-0018 §item 4 amendment); Phase 5.1 retrospective
Commit B (`b7ec879`, scope-lock.md + plan-authoring.md convention
extensions); Phase 5.1 retrospective Commit C (this commit,
retrospective writeup); chunk 5.1a commit `c228512`; chunk 5.1b
commit `12847bf`; chunk 5.1c commit `9ec9235`; chunk 5.1a brief
`8f9df9b`; chunk 5.1b brief `65680c8`; chunk 5.1c brief `0593f23`;
Phase 5.1 scope-lock cycle Rounds 1-4 at `72a40bf` + `2560ef6` +
`5121569` + `8631a5d`. Phase 6.5 retrospective three-commit ceremony
shape precedent at commits `1752f06` (A) + `82a4854` (B) + Phase
6.5 Commit C (T1).
