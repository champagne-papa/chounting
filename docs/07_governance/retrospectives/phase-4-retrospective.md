# Phase 4 retrospective — Document Relationship Router (Subsystems 1+2+3)

**Status.** Closes Phase 4 at chunk-3 substrate-complete (commit
`5d4e954`, 2026-05-14). Three Phase 4 retrospective commits sequenced
A → B → C: Commit A (ADR-0018 amendment, `e9a3cd5`); Commit B
(ADR-0016 amendment, `fc36c6e`); Commit C (this retrospective +
CLAUDE.md `Verify-forward-at-scope-lock` addition +
retrospective-process meta-observations friction-journal entry).
1050/1050 vitest; 26/26 agent:validate; documentation-only batch.

**Surface-precedence note.** Three artifact surfaces ship from this
retrospective work: T3 (the ADR amendments at Commits A and B);
T4 (the CLAUDE.md addition); T1 (this retrospective writeup). The
surface-precedence ordering when a future reader needs the
canonical statement of any Phase 4 codification is
**T3 > T4 > T1** per the CLAUDE.md "When in doubt" leaf-discipline
(ADRs are tiebreakers for architectural questions; CLAUDE.md is
the standing-rules layer; retrospectives are the war-diary layer).
This note is positioned at the end of §7; the writeup itself
follows the seven-section sequence below.

## 1. Arc summary

Phase 4 ships the Document Relationship Router — the Tier 2.5
subsystem that consumes ADR-0014's classifier output plus
committed AP/Spend domain state and produces document-to-entity
relationship candidates, with three subsystems per ADR-0018
§item 1: **Subsystem 1** (Ledger-State Candidate Completion),
**Subsystem 2** (Ambiguity Resolution), **Subsystem 3**
(Re-Evaluation Logic). The arc shipped in three chunks:

- **Chunk 1** (commit `6f3c2ad`, 2026-05-13): Subsystem 1
  substrate — `document_relationship_candidates` table +
  `documentRouterService.completeCandidate()` per ADR-0018 §item 2
  + Framing B' scoring shape. 980/980 vitest baseline (945 + 35
  new = 23 integration + 12 unit). Six friction-journal entries
  (5 pre-drafted per (D) filter + 1 impl-time column-name
  discovery at the `bills.issue_date` / `payments.amount`
  cross-domain-read helper boundary).

- **Chunk 2** (commit `8c036be`, 2026-05-14): Subsystem 2 substrate
  — Layer-1 CHECK broaden `_chunk_6_active → _chunk_7_active`
  admitting `'matched'`; head-pointer FK activation ON DELETE
  RESTRICT; two new RPCs (`set_case_head_pointer_with_audit` with
  split `p_audit` atomic; `record_router_decision` pure-audit
  suffix-dropped); Zod widening + three new schemas
  (`ResolveCandidatesInputSchema`,  `RouterDecisionSchema`,
  `DecisionRecordBeforeStateSchema`);
  `documentRouterService.resolveCandidates()` Subsystem 2
  dispatcher per ADR-0018 §item 3 + envelope-less v1
  substrate-collapse. 1010/1010 vitest (980 + 30 new). Eight
  friction-journal entries; two β reconciliations
  (`INTEGRITY_VIOLATION` does-not-exist; chunk-6 `'matched'`
  still-reserved assertion stale after chunk-2-Phase-4
  broadening). The chunk-2 brief named retrospective inventory
  item 6 — "ADR-0018 §item 3 amendment for branch (b)/(c)
  substrate-collapse" — at chunk close; the present
  retrospective Commit A discharges that obligation.

- **Chunk 3** (split via Path C dispatcher-isolated invocation;
  commits `c3782e9` (3a) + `5d4e954` (3b), 2026-05-14): Subsystem
  3 dispatcher + cross-phase emission wiring per ADR-0018 §item 4
  + Framing F (T1/T3/T5/T8/T10 v1-active-emission-wired;
  T2/T4/T6 reserved pending `paymentService.ts` +
  `vendorCreditService.ts`). Substrate: CHECK broaden
  `exception_status_chunk_6_active → _chunk_8_active` admitting
  `'cancelled'` + trigger extension cancelled-is-terminal +
  `cancel_exception_with_audit` RPC + `EXCEPTION_ALREADY_CANCELLED`
  ServiceErrorCode + `DispatchTriggerInputSchema` 5-branch
  discriminated union + `RouterDecisionOutcomeSchema` 5-value
  fresh introduction (including `dispatch_failed` per
  substrate-now-amendment-later RI-2) + `dispatchTrigger` fan-out
  + 6 P3-i post-commit wrappers (Pattern B 5+1 split: 5
  external-wrap; 1 internal-wrap for `periodService.unlock`).
  1050/1050 vitest. Thirteen friction-journal entries
  (F-J-1/2/3/4/5/6/7 + F-J-13/14/15 tier-1 + F-J-8/10/11/12) +
  correction-notes section (β-numbering fix + RI-5 N=4 + RI-10
  sub-discipline + RI-6 grain-4 cross-reference + F-J-14
  workflow-interaction note); F-J-9 demoted to memory-only per
  (D) filter. Four β reconciliations: β-3 (carried-in trigger
  errcode `feature_not_supported`); β-4 (PK column fix
  `id → exception_queue_entry_id`; fourth notational-drift
  instance, met RI-5 N=4 threshold); β-5 (`count_after =
  newCandidates.length` under D-partial-no-idempotency); β-6
  (rule 5 → `no_change` per no-supersedes-on-empty-rerun).

**What Phase 4 closes.** Phase 4 closes here at chunk-3
substrate-complete (1.a closure per scope-lock Round 1):
multi-feature scoring is deferred per RI-7's
codify-then-ignore-at-N+1 avoidance pathway, not pulled into
Phase 4. Phase 4's downstream consumers — Phase 5.1 reviewer
chunk + Phase 7 envelope substrate — sit downstream of this
retrospective; named carry-forwards in §6 below.

## 2. Per-chunk learnings

### Chunk 1 — Subsystem 1 substrate

The brief-vs-implementation grain was clean: zero implementation-
time substrate surprises beyond the `bills.issue_date` /
`payments.amount` column-name discovery at the cross-domain-read
helper site. The carry-forward from chunk-1 close — "psql `\d
<table>` at brief-draft for cross-domain-read helpers" — became
the codified discipline for Phase 4 chunks 2+ and is one of the
inputs to the `Verify-forward-at-scope-lock` discipline cluster
codified in §4 below (RI-6 read-substrate verification at
scope-lock).

Five pre-drafted friction-journal entries plus the impl-time
column-name discovery shipped per the (D) filter pattern from
Phase 4 chunk 2's `F-J-γ` precedent. 16 pattern codifications
were preserved at scope-lock §5 for chunks-2+ navigation; the
substrate-walkable phase-done bar held at chunk-1 close
(chunk-1's `completeCandidate` was substrate-walkable at the
service level without requiring Subsystem 2 or Subsystem 3 wiring).

### Chunk 2 — Subsystem 2 substrate

Two real implementation-time deviations reconciled at chunk close:

**β-1 — `INTEGRITY_VIOLATION` does-not-exist.** Chunk-2 brief R3.4
claimed `INTEGRITY_VIOLATION` ServiceErrorCode as
chunks-5-6-inherited substrate. Verify-from-disk at impl: the code
does not exist in the ServiceErrorCode union; actual precedent is
`POST_FAILED` catchall (collapsing FK violations 23503/P0002 →
`POST_FAILED`). Implementation switched to `POST_FAILED`; brief
R3.4 reconciled at close. The β-1 reconciliation graduated the
codification carry-forward: **brief-text type / code-name
verification against TypeScript unions or type definitions before
transcription** — grep canonical source file for every
`ServiceErrorCode` literal cited, especially in implicit-inheritance
R3.4-style claims. This carry-forward landed in
`feedback_verify_from_disk_at_brief_loop.md` as Item C.

**β-2 — chunk-6 `'matched'` still-reserved test stale.** Chunk-6
test asserted `'matched'` remained reserved at the v1 boundary; after
chunk-2-Phase-4's Layer-1 CHECK broaden `_chunk_6_active →
_chunk_7_active` admitting `'matched'`, the assertion went stale.
Switched to `'extracting'` as the still-reserved value. **Broadening-
event-test-staleness pattern** — third firing of the test-fragility
family at cross-phase substrate modifications (chunk-2-Phase-2's
constraint-rename + chunk-6-Phase-2's CHECK suffix + this chunk-2-
Phase-4 broadening). The codification carry-forward — audit tests
for hardcoded constraint names / reserved-value assertions at every
Layer-1 CHECK broaden — graduated at chunk-3-Phase-4 to lifecycle-
wide application via F-J-1 chunk-N suffix discipline.

Chunk-2's envelope-less v1 substrate-collapse interpretation (branch
(b) → branch (c) at substrate-mutation level, exception_reason
discriminator, `before_state.branch` forward-compat) explicitly
named retrospective inventory item 6 as the deferred ADR-0018 §item
3 amendment. The present retrospective Commit A discharges that
obligation. v1 operational reality confirmed at chunk-2 close: any
N≥2 case routes to branch (b) (chunk-1 single-feature scoring zeros
all margins); branch (a) margin-filter path structurally unreachable
until multi-feature scoring activates per ADR-0018 §item 2 future
amendment.

### Chunk 3 — Subsystem 3 dispatcher + cross-phase emission wiring

Chunk 3 was the structural-shape break: first chunk-atomicity break
at chunks-1-6 + Phase 4 chunks 1-2 grain (Path C dispatcher-isolated
invocation; F-J-14 tier-1 codification). Five framing-touching
findings accumulated mid-implementation crossing the brief-as-
canonical-reference threshold and forcing a brief amendment cycle
(F-J-15 tier-1 codification; RI-10 ratification at multi-finding-
shape-changing scale). The five framings — γ' re-eval primitive +
γ'-partial per-trigger coverage + D-partial 6-rule discriminator +
D-partial-no-idempotency + Path C split — are unpacked in §3 below
as the framing-discovery arc centerpiece.

Four β reconciliations at chunk-3 (one carried-in + three new at 3a
impl) extended the notational-drift catch family to N=4, meeting and
exceeding the RI-5 codification threshold. Two of the β
reconciliations (β-5 count_after semantic + β-6 rule 5
reachability) are second-order consequences of Pause 5 (D-partial-
no-idempotency) that the amended brief absorbed at framing-level
but didn't trace through to count-semantics and discriminator-rule-
reachability — the evidence basis for RI-10's sub-discipline
(amendment-cycle second-order-consequence tracing at N≥3 framings).

Chunk-2-Phase-4 carry-forward 7 (Layer-1 CHECK suffix discipline for
cross-phase broadening) closed at chunk-3-Phase-4 Round 4.a (α-iii)
lock with F-J-1 tier-1 codification: `_chunk_N_active` arc-extended-
lifecycle-sequence discipline (Phase 2 chunks 1-6 = positions 1-6;
chunks that don't participate don't extend the count; single chunk
introducing/broadening multiple CHECKs gets same position-suffix on
all; Phase 4 chunk 3 = position 8).

**Cross-phase ESM circular import resolution.** Chunk-3 introduced a
cross-service module cycle (`documentExceptionService` imports
`dispatchTrigger` from `documentRouterService`;
`documentRouterService` imports `enqueueException` from
`documentExceptionService`). The cycle resolved cleanly via
function-export lazy binding (both imports are function exports used
inside async function bodies, not at module-init time); TypeScript +
tsc + vitest all green. Memory-only candidate (ii) names this as
N=1 evidence for the cross-service-circular-import discipline
sibling to F-J-7 (direct-call cross-service pattern).

## 3. Framing-discovery arc (centerpiece)

Chunk 3 is the chunk where Phase 4's organizing structural shape
broke: the 7-round scope-lock for chunk 3 missed
*computational-shape under-specification* systematically, and the
shape surfaced as a five-pause sequence during implementation. The
arc is the substantive centerpiece of this retrospective because
the discipline cluster it surfaces (codified at §4 as the
`Verify-forward-at-scope-lock for computational-shape chunks`
cluster) is the durable carry-forward to Phase 5.1 and Phase 7.

### The five pauses

Each pause surfaced a framing-touching finding during chunk-3
implementation. Each finding required mid-arc adjudication. The
amended brief at `c76d264` absorbed all five framings as the
authoritative chunk-3 specification:

**Pause 2 — γ' re-eval primitive.** Chunk-3 brief Task 4 step 3
prescribed "reconstruct CompleteCandidateInput in the dispatcher
loop." Implementation surfaced: this reconstruction is the same
shape across triggers and warrants a private wrapper function.
Framing: `rematchCandidate(case_id, trace_id, ctx)` as the γ'
re-eval primitive — a thin private wrapper over chunk-1's
`completeCandidate` that reconstructs `CompleteCandidateInput` from
the case's head-of-chain `document_relationship_candidates.candidate_features`
substrate plus a vendor_id fallback via `linked_entity_id`
(`bills.vendor_id` / `vendor_prepayments.vendor_id`). Honors ADR-0018
§item 4 "Subsystem 3 re-evaluates pre-commit cases" at matching-
semantic level for cases-with-prior-candidates.

**Pause 3 — γ'-partial per-trigger semantic coverage.** γ' covers
cases-with-prior-candidates only. Chunk-1's `completeCandidate`
doesn't persist substrate on failure paths; stranded cases
(T1/T3/T4 fan-out scope; T10-without-priors) have no
`candidate_features` rows. Framing: v1 per-trigger coverage table
— T5/T6/T8/T10-with-priors re-routing-functional via reconstruction;
T1/T3/T10-stranded audit-only (`rematchCandidate` returns `[]`;
caller maps to `decision_outcome='no_change'`). Full γ (any-case-
reconstructable) activates when Phase 7 ships classification +
extraction + vendor-matching substrate for stranded cases. The
γ'-partial framing isn't a long-term contract; it's the chunk-3-
shipped reality.

**Pause 4 — D-partial 6-rule discriminator.** Original brief Task 4
step 5 had a 3-rule discriminator: rule 1 (count_after > 0 → emit
candidate), rule 2 (count_after = 0 → enqueue exception), rule 3
(stranded → no_change). Implementation surfaced: T5/T6/T8
invalidation produces `re_routed_to_exception` (enqueue exception
for ADR-0018 conformance); T1/T3/T10-stranded produces `no_change`
(γ'-partial coverage). The 3-rule shape conflated these surfaces.
Framing: 6-rule discriminator over `(count_before, count_after,
open_exception_present)` — rule 1 re-routed-from-exception with
cancel; rule 2 candidate-superseded; rule 3 unreachable defensive
throw; rule 4 re-routed-to-exception; rule 5 no-change-with-open-
exception (operationally reachable under T5/T8 invalidation + T1/T3
fan-out sequence, ratified at β-6); rule 6 no-change-stranded.

**Pause 5 — D-partial-no-idempotency at v1.** ADR-0018:792-805
specifies dispatcher idempotency by `(case_id,
classifier_output_fingerprint, domain_state_fingerprint)`. Chunk-3's
`rematchCandidate` doesn't implement fingerprint-based dedup
against existing `document_relationship_candidates` rows; chunk-1's
`completeCandidate` dedups against `source_document_links` only.
Framing: explicit non-implementation of the ADR-0018:792-805
idempotency contract at chunk 3, named as D-partial-no-idempotency
in the v1 contract; RI-9 tracks ADR-0018 idempotency contract
activation for a future fingerprint-dedup chunk. Acceptable at v1
with low trigger volume; noisy `candidate_superseded` events +
growing supersession chains accepted.

**Path C-dispatcher-isolated split.** Brief's one-bundled-commit
implicit assumption replaced with two-commit split: 3a (dispatcher
service + dispatcher tests + dispatcher-side friction-journal) +
3b (cross-phase wirings + cross-phase tests + remaining
friction-journal + memory rename). Wiring-with-tests pairing
preserved at each commit boundary. Triggering condition: five
framing-touching findings accumulated mid-implementation arc; volume-
vs-budget arithmetic exceeded reliable single-session delivery.
F-J-14 tier-1 codifies Path C invocation conditions; RI-7 captures
session-budget-feasibility verification at scope-lock for future
chunks of substantively-novel-logic scope.

### Brief amendment cycle (`c76d264`)

The five framings collectively crossed the single-finding-divergence
threshold that chunks-1-6 + Phase 4 chunks 1-2 had operated under.
Brief-stands-with-friction-journal-deviations discipline holds at
single-finding scale; at multi-finding-shape-changing scale, the
brief loses its canonical-reference quality and an amendment cycle
is the right tool. The amended brief at `c76d264` ratifies all five
framings as the authoritative chunk-3 specification; F-J-15 tier-1
codifies the brief amendment cycle discipline (RI-10 ratification at
multi-finding-shape-changing scale; chunk-3's five framings is the
first instance and the current upper bound of empirical evidence).

### RI-10 sub-discipline emergence

β-5 (count_after semantic ambiguity) and β-6 (rule 5 reachability)
surfaced as second-order consequences of Pause 5 (D-partial-no-
idempotency) that the amended brief absorbed at framing-level but
didn't trace through. The amendment process must explicitly trace
each framing's interaction-with-every-other-framing — not just
absorb the framings as-stated — when N≥3 framings are in scope.
RI-10's sub-discipline (amendment-cycle second-order-consequence
tracing) emerged from this evidence; future amendment cycles with
N≥3 framings should produce a "framing-interaction matrix" as part
of the amendment cycle, surfacing second-order consequences before
impl. Empirical bound: 5 framings is current upper evidence point;
lower bound undetermined (future chunks calibrate downward).

### Meta-observation — what the 7-round scope-lock missed

The 7-round scope-lock for chunk 3 produced thorough substrate-shape
locks (CHECK rename + trigger extension + RPC additions + Zod
schemas + service extensions + test surface) but did not lock the
*computational-shape* of the dispatcher's re-evaluation semantic
(coverage per trigger × per prior-state; decision-outcome
discriminator rule structure; idempotency contract conformance).
The substrate locks were specified at "what tables and columns and
function signatures" grain; the computational shape sits at
"what semantic does the dispatcher actually compute, per trigger,
per prior-state, per decision-outcome" grain.

The chunk-1 (Subsystem 1) and chunk-2 (Subsystem 2) scope-locks did
not surface this discrimination because Subsystem 1's
`completeCandidate` and Subsystem 2's `resolveCandidates` operate on
fully-specified-at-input-shape data structures; the computation is
mechanical given the input. Subsystem 3 operates over a richer
input shape (`case_id × trigger_type × prior-state × current-domain-
state`); the computational shape is where the framing-discovery
arc fires.

The discipline-cluster carry-forward: **Verify-forward-at-scope-lock
for computational-shape chunks** (codified at §4 below; ratified to
CLAUDE.md as the T4 top-level section in Commit C). For dispatcher-
style, re-evaluator-style, and substantively-novel-logic chunks,
scope-lock must explicitly verify-forward at four substrate grains
(per RI-6): substrate-shape; per-trigger semantic coverage; per-
trigger × per-decision-outcome conformance; idempotency-and-side-
effect-contract conformance. Without verify-forward at these grains,
the framing-discovery arc surfaces mid-implementation and forces
brief amendment cycles + Path C splits + correction-notes sections.

### RI-6 four-grain refinement as codification synthesis

RI-6 (read-substrate verification at scope-lock; four-grain
refinement) synthesizes chunk-3's discipline-graduation lessons into
one inventory item. The four grains:

1. **Substrate-shape grain.** What tables, columns, function
   signatures, type definitions, and constants exist? Verify-from-
   disk on every cited substrate.
2. **Per-trigger semantic coverage grain.** For each trigger /
   branch / input shape the chunk dispatches over, what is the
   per-trigger semantic? Are stranded paths handled? What does
   "audit-only" vs "re-routing-functional" mean per trigger?
3. **Per-trigger × per-decision-outcome conformance grain.** For
   each combination of (trigger, prior-state, decision-outcome),
   what is the per-cell behavior? Is the discriminator's rule
   structure exhaustive? Are there unreachable cells?
4. **Idempotency-and-side-effect-contract conformance grain.** For
   each cited contract (ADR-cited or chunk-cited), is the contract
   implemented at chunk close? If not, is the deferral explicit
   and named (forward-pointer inventory item)?

Chunk-3's evidence per grain:
- Grain 1: β-3 (carried-in trigger errcode) + β-4 (PK column fix);
  notational-drift catch family.
- Grain 2: Pause 3 (γ'-partial per-trigger coverage); first
  evidence point.
- Grain 3: Pause 4 (D-partial 6-rule discriminator) + β-5 +
  β-6; second-order consequence surfacing.
- Grain 4: Pause 5 (D-partial-no-idempotency); RI-9 forward-pointer
  for ADR-0018:792-805 activation.

The four-grain refinement is itself the codification: future
dispatcher-style chunks consult RI-6's four-grain checklist at
scope-lock.

## 4. Codified patterns

Phase 4's codification graduation surface is structured per Round 5
lock — patterns grouped by where they graduate (T3 ADR amendment
cluster / T3' ADR amendment cluster / T4 CLAUDE.md cluster /
memory-only-stays cluster / carry-forward cluster).

### T3 cluster — graduated to ADR-0018 (Commit A)

- **§item 2 v1-active `linked_entity_type` 8→6.** Closes chunk-2-
  Phase-4 carry-forward 1. Evidence basis: Phase 2.5 Commit A
  (`9d788e2`) corrected §1 + §3 + §5 + §Schema-deltas + §Closes Q55
  but didn't reach ADR-0018 §item 2's inline list; the ADR-0018
  amendment carries the same correction through. Cross-reference:
  Phase 2 retrospective + Phase 2.5 Commit A.

- **§item 3 v1 substrate-collapse interpretation.** Closes
  chunk-2-Phase-4 carry-forward 6. Evidence basis: chunk-2-Phase-4
  brief explicitly named the deferred amendment at retrospective
  inventory item 6 + envelope-less v1 shape (branches (b)/(c)
  substrate-collapse at mutation level; exception_reason
  discriminator; `before_state.branch` forward-compat). Four-
  paragraph sub-block appended to §item 3 codifies the v1
  substrate-collapse interpretation + branch (a) v1 operational
  reality + forward-compat preservation + ProposedEntryCard
  amendment trigger.

- **§item 4 v1 dispatcher contract refinements
  (γ'-partial + D-partial 6-rule + D-partial-no-idempotency).**
  Closes chunk-3-Phase-4 RI-9 (forward-pointer placement;
  activation itself remains open at a future fingerprint-dedup
  chunk). Evidence basis: chunk-3 amended brief at `c76d264` +
  chunk-3 3a impl at `c3782e9` + chunk-3 3b impl at `5d4e954`.
  Three-subsection sub-block appended to §item 4 codifies the
  three contract refinements + full γ'-partial coverage table +
  full D-partial 6-rule discriminator table + idempotency
  deferral with RI-9 forward-pointer.

- **§Schema-deltas `dispatch_failed` 5th `decision_outcome` value.**
  Closes chunk-3-Phase-4 RI-2. Evidence basis: chunk-3 substrate
  ships `dispatch_failed` as Layer-2 (Zod) + Layer-3 (TS const +
  service emission) per `RouterDecisionOutcomeSchema`; no Layer-1
  CHECK introduced per ADR-0018 §Schema-deltas convention.
  Substrate-now-amendment-later pattern (chunk-6
  `backfill_vendor_prepayment_suggested` precedent at Phase 2.5
  Commit B).

### T3' cluster — graduated to ADR-0016 (Commit B)

- **§Reserved-enums-and-audit-events table v1-active subset 8→6.**
  Closes chunk-2-Phase-4 carry-forward 2. Evidence basis: Phase 2.5
  Commit A corrected ADR-0016 §1 + §3 + §5 + §Schema-deltas +
  §Closes Q55 but the §Reserved-enums-and-audit-events table row
  was missed in that pass. This amendment closes the missed-cell
  drift by updating the table cell to 6 values; no re-litigation
  of the substantive justification (Phase 2.5 Commit A precedent
  carries).

- **§6 `pre_commit_link_rerouted` v1 emission deferral forward-
  pointer.** Closes chunk-3-Phase-4 RI-4. Evidence basis: chunk-3
  Round 2.b-C2 lock (defer 10-field cascade event to future chunk;
  chunk 3 ships `router_re_evaluation_fired` alone with coarse
  `decision_outcome`). New "v1 emission deferral" paragraph
  appended after §6's "Pre-commit re-routing audit event" sub-
  block codifies the deferral + relationship to chunk-3's
  `router_re_evaluation_fired` event + activation trigger
  (Phase 5.1 reviewer or Phase 7 envelope substrate) + reserved-
  not-omitted shape per ADR-0010 substrate-now-enforcement-later.

### T4 cluster — graduated to CLAUDE.md (Commit C)

The T4 cluster ships as a new top-level CLAUDE.md section,
`Verify-forward-at-scope-lock for computational-shape chunks`,
covering five sub-disciplines:

- **(RI-1) Consumer-presence verification for substrate additions.**
  Four-instance precedent: `vendor_credits` (Phase 5 substrate
  reservation) / `backfill_vendor_prepayment_suggested` (Phase 2.5
  Commit B follow-on) / `paymentService` gap (Phase 4 chunk 3
  Framing F T2/T6 reserved) / `cancelled_at` column at chunk-3
  Round 4.c (γ) lock declined. Discipline: before adding a
  substrate field / enum value / table reservation, verify v1
  consumer presence; "land schema with consumer code" reverse-
  discipline. Codification graduation: chunk-3 close (N=4) per
  RI-1 ratification.

- **(RI-6) Read-substrate verification at scope-lock, four grains.**
  Detailed at §3 above (chunk-3 evidence per-grain). Discipline:
  for dispatcher-style / re-evaluator-style / substantively-novel-
  logic chunks, verify-forward at substrate-shape grain (1) +
  per-trigger semantic coverage grain (2) + per-trigger × per-
  decision-outcome conformance grain (3) + idempotency-and-side-
  effect-contract conformance grain (4). Codification graduation:
  chunk-3 close (single-arc N=1 with four sub-grain refinement) per
  RI-6 ratification.

- **(RI-7) Session-budget-feasibility verification + Path C
  invocation conditions.** Chunk-3 evidence: five framings + brief
  amendment cycle + 8 source files + 1 migration + 1 generated
  types.ts pushed chunk-3 over single-session reliable delivery;
  Path C dispatcher-isolated split (3a + 3b) was the response.
  Discipline: when a chunk's volume-vs-budget arithmetic at scope-
  lock or mid-implementation exceeds single-session reliable
  delivery, invoke Path C split with explicit fault-line
  declaration; preserve wiring-with-tests pairing at each commit
  boundary; require validation-gate-green at each commit. F-J-14
  tier-1 codifies. Codification graduation: chunk-3 close (first
  Path C invocation; upper-bound chunk-3 evidence calibrates future
  Path C-or-not decisions).

- **(RI-10) Brief amendment cycle threshold + framing-interaction-
  tracing sub-discipline at N≥3.** Chunk-3 evidence: five framings
  + amended brief at `c76d264` + β-5 + β-6 (second-order
  consequences). F-J-15 tier-1 codifies. Discipline: at single-
  finding scale (one or two β reconciliations), friction-journal-
  only divergence is sufficient; at multi-finding-shape-changing
  scale (N≥3 framings), brief amendment cycle is the right tool
  AND the amendment process must explicitly trace each framing's
  interaction-with-every-other-framing (framing-interaction matrix
  as part of the amendment cycle, surfacing second-order
  consequences before impl). Codification graduation: chunk-3 close
  (first instance; empirical bound 5 framings upper, undetermined
  lower).

- **(Memory-only candidate (iii) graduation) Codification
  convention: observation-grain vs application-grain N count.**
  Chunk-3 close evidence: F-J-11 (Pattern B variant split) prose
  conflated observation-grain N=1 (chunk-3 surfaced the split as a
  single finding at Round 6) with application-grain N=6 (chunk-3
  applied the split across 6 service-method modifications at 3b).
  Discipline: codification threshold is observation-grain N=3
  (pattern surfaces as a new finding in 3 distinct sessions /
  chunks / contexts before graduating); application-grain N within
  a single session / chunk is one instance from threshold-counting
  perspective. Codification graduation: chunk-3 close (single
  observation-grain instance; codification convention itself
  graduates and applies retroactively to F-J-11 and other
  ambiguous-N codifications).

### Memory-only-stays cluster — sub-threshold codification candidates

Two sub-threshold codification candidates surfaced at chunk-3 close
and remain in `project_phase_4_chunk_3_implementation_notes.md` at
N=1 evidence. Each carries one instance of evidence; codification
graduates at the second or third instance. Tracking provenance is
preserved in the memory file:

- **Candidate (i) — spy-on-call-boundary test pattern for
  downstream best-effort emission.** Chunk-3 close N=1. Cross-phase
  tests for the 6 P3-i post-commit wrappers at 3b consolidated into
  a single new test file using `vi.spyOn(routerMod, 'dispatchTrigger')`
  to verify the wiring fires with the expected envelope, rather
  than asserting on the downstream `router_re_evaluation_fired`
  audit emission. Test grain shifts from "did the chain work end-
  to-end" to "did the caller invoke the dispatcher with the right
  envelope at the right time, with correct best-effort isolation /
  fail-and-propagate semantics." Sibling to F-J-7 (direct-call
  cross-service pattern at v1). Codification graduation pathway:
  future Phase 4+ chunk reaches for spy-on-call-boundary at N=2;
  third instance triggers formal codification (likely F-J-7' or
  F-J-16 depending on retrospective bundling).

- **Candidate (ii) — cross-service circular import resolution via
  function-export lazy binding.** Chunk-3 close N=1.
  `documentExceptionService` ↔ `documentRouterService` cycle
  resolved cleanly because both circular imports are function
  exports used inside async function bodies (not at module-init
  time). TypeScript + tsc + vitest all green; no deferred-import
  workaround needed. Discipline that makes it work: "function-
  export cycles work; module-init-time cycles don't." F-J-7
  generalization territory at second instance (likely Phase 5.1
  `paymentService` bidirectional with `documentRouterService` for
  T2 wiring).

### Carry-forward cluster — items not graduating at Phase 4 retrospective

- **(RI-3) `created_by` Zod tightening discipline.** Phase 4 chunk-3
  carry-forward; six files at chunk-3 close currently ship
  `created_by: z.string()` (broad) instead of UUID-tight. Question
  is project-wide normalization. Insufficient codification basis at
  chunk-3 close; next retro cycle (Phase 5.1 or Phase 7) consolidates.

- **chunk-2-Phase-4 carry-forward 3 — `created_by` Zod tightening
  discipline.** Same item as RI-3 (chunk-2-Phase-4 named it; chunk-3
  inherits; chunk-3 close redirects to RI-3 framing). Tracked in §6.

- **chunk-2-Phase-4 carry-forward 5 — `services/evidence/` substrate-
  allocation realization status.** Phase 5.1 reviewer chunk
  carry-forward; the `services/evidence/` directory has `.gitkeep`
  only at chunk-3 close; substrate allocation pending Phase 5.1
  reviewer surface design. Tracked in §6.

- **chunk-2-Phase-4 carry-forward 8 —
  `AMBIGUITY_MARGIN_V1_PROVISIONAL = 0.05` value calibration.**
  Phase 4 chunk-2 named; pending ADR-0019 first calibration cycle
  (v1_ship_at + 6 months per ADR-0014 §6 Q65 + ADR-0007 §Q77
  precedent). Tracked in §6.

## 5. Inventory documentation

### `services/evidence/` empty-with-`.gitkeep` at chunk-3 close

`services/evidence/` exists in the source tree with `.gitkeep` only;
no service files yet. Allocated at Phase 4 chunk-1 scope-lock as the
home for evidence-gathering / classifier-output substrate; chunk-3
close has not realized it (chunks-1/2/3 each shipped service files
in `services/document-platform/` rather than `services/evidence/`).
Realization is gated on Phase 5.1 reviewer surface design — the
reviewer-side workflow is the natural consumer of evidence-side
substrate. Carry-forward item per §6 below.

### `created_by` permissiveness pattern at chunk-3 close

Six files at chunk-3 close currently ship `created_by: z.string()`
rather than UUID-tight (`z.string().uuid()`). The permissiveness
predates Phase 4 (chunk-1 inherited the pattern from chunks-5-6
Phase-2 + Phase 4 chunk 1 didn't tighten); chunk-3 inherits without
tightening. The discipline question — when does `created_by` tighten
to UUID-strict? — is project-wide and stays in carry-forward
inventory per §6 below.

### Memory-only candidates (i) and (ii)

Both candidates ship in `project_phase_4_chunk_3_implementation_notes.md`
with N=1 evidence per §4 cluster above. Codification graduation
pathway is named in the memory file; future-instance accumulation
triggers formal codification.

### RI-5 N=4 trail mention

The notational-drift catch family has accumulated four instances
through Phase 4: (a) `dispatch_failed` introduce-vs-extends (chunk-3
brief-draft); (b) idempotency-key field-order (chunk-3 brief-draft);
(c) trigger errcode `feature_not_supported` (chunk-3 carried-in β-3);
(d) PK column fix `id` → `exception_queue_entry_id` (chunk-3 β-4).
RI-5 codification threshold (N=3) met and exceeded at chunk-3 close;
N=4 trail is the canonical-citation point for the discipline. The
discipline's prose body lives in
`feedback_verify_from_disk_at_brief_loop.md` Item C — chunk-3
extended the four-instance trail to "verify against TypeScript
unions + grep canonical source file for every literal cited";
chunks 4+ inherit.

## 6. Carry-forwards to future retrospectives

The carry-forward inventory at Phase 4 retrospective close has three
subsections per Round 7 lock: (6.a) carry-forward inventory items
themselves; (6.b) cross-phase consumer inventory (Phase 5.1 +
Phase 7 per-consumer two-inventory shape); (6.c) named-future-
feedback-loops at consumer-application time.

### 6.a Carry-forward inventory items

The following items did not graduate at Phase 4 retrospective; each
is named with codification statement + named-future-trigger:

1. **RI-3 — `created_by` Zod tightening discipline.** Codification
   statement: project-wide normalization to UUID-strict for
   `created_by` across service Zod schemas. Named-future-trigger:
   next retro cycle (Phase 5.1 or Phase 7).

2. **Chunk-2-Phase-4 carry-forward 3 — same as RI-3 above** (chunk-3
   close redirects to RI-3 framing).

3. **Chunk-2-Phase-4 carry-forward 5 — `services/evidence/`
   substrate-allocation realization status.** Codification statement:
   `services/evidence/` directory ships with `.gitkeep` at v1; first
   realization at Phase 5.1 reviewer surface design (the natural
   consumer of evidence-side substrate). Named-future-trigger:
   Phase 5.1 reviewer chunk.

4. **Chunk-2-Phase-4 carry-forward 8 —
   `AMBIGUITY_MARGIN_V1_PROVISIONAL = 0.05` value calibration.**
   Codification statement: provisional v1 value at the top of
   `documentRouterService.ts`; ADR-0019 ratifies at v1_ship_at + 6
   months per ADR-0014 §6 Q65 + ADR-0007 §Q77 precedent. Named-
   future-trigger: ADR-0019 first calibration cycle.

5. **RI-9 — ADR-0018:792-805 idempotency contract activation.**
   Codification statement: future chunk implements fingerprint-based
   dedup against existing `document_relationship_candidates` rows,
   activating the dispatcher idempotency contract specified at
   ADR-0018 §item 4's "Subsystem 3 idempotency" paragraph. Named-
   future-trigger: chunk that ships fingerprint-dedup substrate
   (likely Phase 7 envelope substrate or Phase 5.1 reviewer chunk,
   depending on which surfaces the fingerprinting first).

### 6.b Cross-phase consumer inventory (Phase 5.1 + Phase 7)

Two known downstream consumers inherit Phase 4 substrate and
discipline. Each consumer carries a two-inventory shape per Round 7
Q3 refinement: activation-trigger inventory (what Phase-4-reserved
substrate / hook activates at the consumer) + discipline-reference
inventory (which Phase-4-codified disciplines apply at the consumer).
Both inventories may be non-empty.

#### Phase 5.1 reviewer chunk inheritance

**Activation-trigger inventory:**
- Chunk-3 reserved T2/T4/T6 dispatcher slots
  (`DispatchTriggerInputSchema` branches + `dispatchTrigger`
  switch handlers + fan-out helpers) activate when
  `paymentService.ts` + `vendorCreditService.ts` ship. Phase 5.1
  reviewer chunk introduces `paymentService` (per Phase 5 close
  inventory) — T2 activation fires when `paymentService.record()`
  ships its post-commit dispatch hook.
- `services/evidence/` substrate-allocation realization fires at
  Phase 5.1 reviewer surface design (the natural consumer; no v1
  service files yet).

**Discipline-reference inventory:**
- RI-1 (consumer-presence verification before substrate addition)
  applies at Phase 5.1 reviewer chunk's own substrate additions.
- RI-6 (read-substrate verification at scope-lock, four grains)
  applies if Phase 5.1 reviewer's dispatcher-style surfaces a
  computational-shape question.
- RI-7 (session-budget-feasibility verification at scope-lock; Path
  C invocation conditions) applies at Phase 5.1 reviewer scope-lock.
- RI-10 (brief amendment cycle threshold; framing-interaction
  matrix at N≥3) applies if Phase 5.1 reviewer's implementation
  surfaces multi-finding-shape-changing framings.

#### Phase 7 envelope substrate inheritance

**Activation-trigger inventory:**
- γ'-partial coverage gap (T1/T3/T10-stranded re-routing-functional
  via pipeline substrate) activates when Phase 7 ships
  classification + extraction + vendor-matching substrate for
  stranded cases.
- RI-9 (ADR-0018:792-805 idempotency contract activation) — Phase 7
  envelope substrate is the likely activation chunk if it
  introduces fingerprint-based dedup against existing candidates.
- ADR-0018 §item 3 amendment trigger fires: when envelope substrate
  ships (Phase 7), ADR-0018 §item 3 amendment fires to either
  promote branch (b) to envelope emission per §item 3's original
  framing OR ratify chunk-2-Phase-4's substrate-collapse as
  canonical v1+ shape.
- ADR-0016 §6 `pre_commit_link_rerouted` v1 emission deferral
  forward-pointer activates at the first chunk shipping prior-
  candidate-aware dispatcher re-routing — likely Phase 7 or
  Phase 5.1, depending on which materializes prior-candidate-target
  reads first.

**Discipline-reference inventory:**
- RI-1 (consumer-presence verification before substrate addition)
  applies at Phase 7's own substrate additions (envelope-side TS
  types currently have zero codebase references at chunk-3 ship).
- RI-6 four-grain (per-trigger semantic coverage + per-trigger ×
  per-decision-outcome conformance + idempotency-and-side-effect-
  contract conformance) applies at Phase 7 envelope substrate
  scope-lock.
- RI-7 (session-budget-feasibility) applies at Phase 7 scope-lock
  given envelope substrate scope (likely large).
- RI-10 (brief amendment cycle + framing-interaction matrix)
  applies if Phase 7 implementation surfaces multi-finding-shape-
  changing framings (envelope substrate may surface them given the
  cross-phase consumer surface area).

### 6.c Named-future-feedback-loops

Phase 5.1 + Phase 7 scope-locks produce evidence about Phase 4
codifications operating as designed at consumer-application time:

- **Phase 5.1 reviewer chunk scope-lock fires RI-6 four-grain at
  consumer-application time.** Evidence to track: does the four-
  grain checklist surface computational-shape questions that
  scope-lock would otherwise miss? If yes, RI-6 is operating as
  designed; if no, RI-6's grain refinement may need
  consumer-context tightening (e.g., reviewer-side dispatcher
  surfaces fewer prior-state combinations than Subsystem 3 did).

- **Phase 7 envelope substrate scope-lock fires RI-7 +
  RI-10 at consumer-application time.** Evidence to track: does
  session-budget-feasibility verification at scope-lock catch the
  envelope substrate's volume-vs-budget arithmetic before
  implementation? If multi-finding framing-discovery surfaces at
  Phase 7 mid-implementation despite RI-6 four-grain + RI-7 at
  scope-lock, the framing-discovery arc surfaces again and
  retrospective material accumulates for an RI-10 second-instance
  refinement.

- **Cross-phase chunk-3-Phase-4 RI-9 activation at the future
  fingerprint-dedup chunk** fires the ADR-0018:792-805 idempotency
  contract. Evidence to track: does the idempotency-contract
  activation expose D-partial-no-idempotency's noisy
  `candidate_superseded` events as a real operational concern at
  v1+? If yes, the deferral was justified; if pre-activation noise
  becomes operationally distracting (low-likelihood at chunk-3-
  estimated trigger volume), the deferral may need to advance
  earlier than the natural fingerprint-dedup chunk.

## 7. Surface-precedence note (T3 > T4 > T1)

When future readers encounter a discrepancy across Phase 4 artifacts
— say, a CLAUDE.md description that drifts from an ADR amendment,
or a retrospective summary that drifts from the CLAUDE.md
description — the surface-precedence ordering is **T3 > T4 > T1**:

- **T3 (ADR amendments at Commits A and B) wins** for any contract /
  invariant / substrate question. ADRs are the architectural-
  decision tiebreaker per CLAUDE.md "When in doubt" leaf-discipline.
  §item 4's γ'-partial coverage table + D-partial 6-rule
  discriminator table + D-partial-no-idempotency contract are the
  canonical statement of v1 Subsystem 3 contract.

- **T4 (CLAUDE.md `Verify-forward-at-scope-lock` addition) wins** for
  process / discipline / scope-lock questions. The CLAUDE.md
  addition is the standing-rules layer for future chunks of
  computational-shape scope.

- **T1 (this retrospective writeup) is the war-diary layer.** The
  evidence basis + the codification reasoning + the carry-forward
  inventory live here; if the retrospective drifts from T3 or T4,
  T3 or T4 win. The retrospective preserves provenance but doesn't
  itself carry the canonical contract or the standing rule.

This precedent-ordering is positioned at the end of §7 (here) so
future readers see it legibly. It is also positioned in CLAUDE.md
"When in doubt" §4 (canonical-source-wins discipline). The two
positions are consistent: this retrospective's §7 names T3 > T4 > T1
explicitly for the Phase 4 artifacts; CLAUDE.md "When in doubt"
gives the general project-wide rule that ADRs and canonical specs
win over standing rules and retrospectives. Both apply.

---

**Retrospective shipped at Phase 4 retrospective Commit C
(2026-05-14).** Cross-references: Phase 4 retrospective Commit A
(`e9a3cd5`, ADR-0018 amendment); Phase 4 retrospective Commit B
(`fc36c6e`, ADR-0016 amendment); Phase 4 retrospective Commit C
(this commit, retrospective + CLAUDE.md addition +
retrospective-process meta-observations F-J entry); chunk-1 commit
`6f3c2ad`; chunk-2 commit `8c036be`; chunk-3 commits `c3782e9` (3a)
+ `5d4e954` (3b). Phase 2 retrospective shape precedent at commit
`8f6e49f`. The Phase 4 retrospective extends the Phase 2 retrospective
shape with the framing-discovery arc centerpiece and the cross-phase
consumer two-inventory documentation; both extensions reflect Phase
4's chunk-3 computational-shape novelty.

## Post-close correction — Phase 5.1 framing + Phase 6 sequencing (2026-05-15)

The §6.b cross-phase consumer inventory above + §3 framing-discovery
arc cross-references + §4 codified patterns cluster references + §5
inventory documentation references + §1 arc-summary references in
this writeup contain naming and sequencing drift discovered the day
after Commit C shipped, at the next-session-recommendation grain
(2026-05-15 verify-from-disk against canonical sequencing documents).
The corrections below restate the canonical reading; original
sections above preserved for provenance per the same additive-
provenance-preserving discipline Phase 2.5 codified for ADR
amendments. The discovery grain is itself codified at the
friction-journal entry dated 2026-05-15.

### Canonical Phase 5.1 framing (per Phase 2 retrospective §6:588)

> "Phase 5 amendment work (INV-DOC-001 enforcement wiring; vendor_credits substrate) is the other parallel candidate; could ship as Phase 5.1 amendments before or alongside Phase 3/4/7."

**Phase 5.1 = Phase 5 amendments** (INV-DOC-001 enforcement +
vendor_credits substrate + paymentService introduction territory
per chunk-3-Phase-4 scope-lock framing of T2/T6 as "Phase 5
amendment territory"). The §6.b heading + cross-references in this
writeup framed Phase 5.1 as "Phase 5.1 reviewer chunk" — that
naming was fabricated at Commit C drafting time without grounding
against canonical sources. "Reviewer chunk" appears in no canonical
doc other than the Commit C artifacts themselves; replace with
"Phase 5.1 amendments" wherever read.

Vendor onboarding + vendor_credits operational rollout remain
post-v1 per **Phase 5 retrospective §6 lines 396-414**
("reserved schema seats" framing). Phase 5.1 amendments could
include INV-DOC-001 enforcement + paymentService introduction +
vendor_credits substrate ratification but operational realization
is contingent on founder + two real users hitting operational
need; absent that signal, vendor_credits stays reserved-seat
substrate.

### Canonical sequencing (per Phase 5 retrospective §6:380-381)

> "**Phase 5 closes → Phase 2 → Phase 3 → Phase 4 → Phase 6 → Phase 7 → Phase 8**. Canonical per the reframe spec §2."

After Phase 4 closes, **Phase 6 (Ingestion) is the canonical next
phase**, not Phase 5.1. The Round 7 scope-lock's cross-phase
consumer two-inventory shape framing (§6.b above) missed Phase 6
entirely — Round 7 framed only Phase 5.1 + Phase 7 as cross-phase
consumers. The omission is corrected below.

**Phase 3** (Document Relationship Graph consolidation per Phase 2
retrospective §6:570-574) likely substantively shipped at
chunk-5-Phase-2 (`source_document_links`); a Phase 3 closeout-
verify precursor session ratifies or surfaces residual scope
before Phase 6 scope-lock.

### Corrected cross-phase consumer inventory (replaces §6.b)

Three consumer shapes are instantiated in Phase 4's downstream
consumer set, **ratifying the Round 7 Q3 three-shape theoretical
framing as operationally complete** (Round 7 Q3 framed the third
shape — pure discipline-reference consumer — as theoretical-possible
for "hypothetical Phase 8"; Phase 6 is the actual instance):

**Phase 6 (Ingestion) — pure discipline-reference consumer.**
Canonical next phase per Phase 5 retrospective §6 sequencing.

- *Activation-trigger inventory:* empty. Phase 6 does not activate
  chunk-3 reserved T2/T4/T6 dispatcher slots (those are Phase 5.1
  amendment territory); does not activate γ'-partial coverage gap
  (Phase 7 substrate); does not directly consume Phase 4 substrate
  beyond standing read-boundary access at ADR-0011 §1 documentation.
- *Discipline-reference inventory:* RI-1 (consumer-presence
  verification before substrate addition) applies at Phase 6's own
  substrate additions; RI-6 four-grain applies at Phase 6
  scope-lock if Phase 6's pipeline-orchestrator surface introduces
  computational-shape decisions; RI-7 (session-budget-feasibility
  + Path C invocation conditions) applies at Phase 6 scope-lock;
  RI-10 (brief amendment cycle + framing-interaction matrix at
  N≥3) applies if Phase 6 implementation surfaces
  multi-finding-shape-changing framings.

**Phase 5.1 amendments — both-shapes consumer.** Per Phase 2
retrospective §6:588 framing; could ship before, alongside, or
after Phase 6 per operational priority.

- *Activation-trigger inventory:* chunk-3 reserved T2 dispatcher
  slot activates at `paymentService.record()` post-commit dispatch
  hook (per chunk-3-Phase-4 scope-lock framing of T2/T6 as "Phase
  5 amendment territory"). T4 (vendor_credit activation) gated on
  vendor_credits operational signal per Phase 5 retrospective §6
  reserved-schema-seats framing. INV-DOC-001 enforcement wiring is
  the third activation-trigger surface. `services/evidence/`
  substrate-allocation realization is a downstream consumer
  surface — could be Phase 5.1 amendments scope or later post-v1
  chunk depending on operational priority.
- *Discipline-reference inventory:* RI-1 + RI-6 four-grain + RI-7
  + RI-10 apply at Phase 5.1 amendment scope-lock and
  implementation.

**Phase 7 Tier 2 pipeline — both-shapes consumer.** Downstream of
Phase 6 (consumes Phase 6 ingestion substrate); larger scope per
Phase 2 retrospective §6:580-585.

- *Activation-trigger inventory:* γ'-partial coverage gap
  (T1/T3/T10-stranded re-routing-functional via pipeline substrate)
  activates when Phase 7 ships classification + extraction +
  vendor-matching substrate for stranded cases; RI-9 (ADR-0018:792-805
  idempotency contract activation) likely activates at Phase 7 if
  fingerprint-dedup introduced; ADR-0018 §item 3 amendment trigger
  fires at envelope-substrate ship; ADR-0016 §6
  `pre_commit_link_rerouted` v1 emission deferral activation at the
  chunk shipping prior-candidate-aware re-routing.
- *Discipline-reference inventory:* same as Phase 6 + Phase 5.1
  (RI-1 + RI-6 four-grain + RI-7 + RI-10).

### Corrected next-session sequencing

(1) **Phase 3 closeout-verify session** (small precursor; 1-2 hour
scope). Verify chunks-5-6-Phase-2 + Phase 2.5 amendment cycles
cover Phase 3's original "ships the link table" scope per ADR-0011
§1 + ADR-0016. Produce closeout memory pointer + (if residual
scope surfaces) a small brief.

(2) **Phase 6 (Ingestion) substantive scope-lock** as the canonical
next phase per Phase 5 retrospective §6. Pure discipline-reference
consumer of Phase 4 codifications.

(3) **Phase 5.1 amendments + Phase 7 + post-v1 prepayments/credits/
vendor onboarding** downstream per operational priority. Phase 5.1
amendments interleave with Phase 6/7 per Phase 2 retrospective
§6:588 framing if operational priority demands.

### Why this correction ships at post-close grain

Verify-from-disk-applied-at-next-session-recommendation-grain
surfaced the drift; codify-while-deciding-not-while-implementing
applies reflexively. Fix-now-while-context-is-high amortizes the
cost across one fix-commit rather than across N future-session
reconciliations of mis-framed forward-pointers. The post-close
correction shape is **provenance-preserving** — original sections
preserved; correction appends at end; both visible to future
readers. Below ADR-amendment-cycle threshold (no ADR amendment
needed; canonical readings already exist in Phase 2 + Phase 5
retrospectives). Above leave-implicit threshold (forward-pointer
drift compounds in cost across future sessions reading the
inheritance trail).

### Surface-precedence note (revisited)

The §7 surface-precedence T3 > T4 > T1 statement above also gets
ratified at this correction: T3 (ADR amendments) carry contract
correctness; T4 (CLAUDE.md) carries process/discipline
correctness; T1 (this retrospective) carries war-diary
correctness. The Phase 5.1 reviewer fabrication operated entirely
at T1 grain (no T3 contract claim; no T4 discipline claim; the
phase-naming-attribution was a T1 war-diary forward-pointer).
Surface-precedence held — T1 drift didn't propagate to T3 or T4
canonical contracts/disciplines. The post-close correction at T1
grain preserves T3 + T4 unchanged.

### Discriminator added for future retrospective drafting cycles

When a retrospective writeup contains forward-pointers to
downstream phases, the verify-at-impl item set MUST include
**phase-naming-attribution verification against canonical
sequencing documents** (Phase 2 retrospective + Phase 5
retrospective + reframe spec + any phase-specific retrospectives
that name future phases) before drafting close. This extends RI-6
four-grain at retrospective-drafting grain with a fifth grain
(phase-naming-attribution-against-canonical-sequencing); see
friction-journal 2026-05-15 entry for the codification rationale
+ codification threshold framing (N=1; observation-only at
chunks-1-6 + Phase 4 grain; future retrospectives surface N=2+
for formal graduation).
