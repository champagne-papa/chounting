# Invariants Index

The canonical index for the 28 invariants.
The single place to look up "what are all the rules, where are
they documented, and where are they enforced in code?"

This file is contributor-facing — it answers "is X already a
rule, and if so what's its INV-ID and where is it enforced?"
For audit-side evidence (the test that proves each rule is
enforced, the rationale for implicit coverage where no
dedicated test exists), see `docs/06_audit/control_matrix.md`.
For the full per-invariant rationale, Phase 2 evolution notes,
and interactions, see the leaves in
`docs/02_specs/ledger_truth_model.md`.

**The spec-without-enforcement rule.** An invariant only appears
in this file if it has corresponding enforcement in code today.
Aspirational rules (the Phase 2 posting rules engine, the Phase
2 event-sourcing projection, a future `rule_id` column on
journal entries) do not appear here — they live in Phase 2
briefs under `docs/09_briefs/phase-2/`. See
`docs/02_specs/README.md` for the full rule.

## Bidirectional reachability statement

As of commit `65bcfe0` (Waypoint F verification, completed
during the Phase 1.1 closeout docs restructure), confirmed
again at the Arc A Step 11 doc-sync (Arc A added INV-AUDIT-002
at Step 1, INV-ADJUSTMENT-001 at Step 9a, and INV-RECURRING-001
at Step 10a; Step 11 of Arc A formalizes all three in this
index), and re-verified at the Wave 6 D8 doc-sync (live run at
`c42a402f`; D8's doc-only edits are outside both grep scopes), and again at
board #4 slice-2 T4 (2026-07-11), which registered INV-WORKFLOW-003 (Layer 2;
total 28→29, Layer 2 12→13) and reconciled INV-EVIDENCE-001's committed-marking-
site enumeration to the T3-3b two-site reality (count-neutral — EVIDENCE-001
already registered):

- **29 registered INV-IDs** documented in
  `docs/02_specs/ledger_truth_model.md` (**16 Layer 1a**, **13 Layer 2**,
  0 Layer 1b)
- **29 registered INV-IDs** annotated in code (`apps/web/src/` +
  `supabase/migrations/`) (16 Layer 1a, 13 Layer 2, 0 Layer 1b)
- **Symmetric difference at the registered-set grain: empty.**
  Every registered invariant has at least one annotation site in
  code; every registered INV-ID annotated in code has a
  corresponding leaf in the doc. The raw command output carries
  exactly four named exceptions outside the registered set —
  `INV-CHECKPOINT-001` (doc-side; Phase-2 Layer-1b reserved stub,
  ADR-0008), `INV-AGENT-002` (code-side; ADR-0029 reserved,
  comment-grain citations), and `INV-AP-001` / `INV-AP-002`
  (code-side; Phase-5 registration gap, enforced-but-unregistered
  — carry-forward) — and nothing else.

Phase 5.1 chunk 5.1a (2026-05-19) added INV-DOC-001 (Layer 2;
evidence completeness for committed bills) per ADR-0011 §15
reservation graduation. Layer 2 count updates from 6 → 7.

ADR-0024 (2026-05-26) added INV-RULE-001 (Layer 1a; `rule_evaluation_log`
is append-only against the user path) per the Ring 2A-core migration arc,
introducing the new **`INV-RULE-*`** domain family (rule-core
invariants). Layer 1a count updates from 14 → 15; total distinct INV-IDs
from 21 → 22. INV-RULE-001 is *user-path* append-only (RLS-only;
`service_role` bypasses, service-path append-only by single-writer
discipline) — not the trigger-authoritative all-path shape of
INV-AUDIT-002; see its leaf "Scope" subsection.

ADR-0025 (2026-05-26) added INV-RULE-002 (Layer 2; the pure-core rule evaluator
is deterministic) at the Ring 2A-core authoring rollout's Commit 1, when the
evaluator + its determinism test landed. Layer 2 count updates from 7 → 8; total
distinct INV-IDs from 22 → 23. INV-RULE-002 is the **first test-verified INV** in
the registry — a property *across invocations* (byte-identical output for identical
input), verified by a unit test rather than DB-enforced or runtime-guarded; see its
leaf "Scope" subsection. (The "## The 20 invariants" heading below + the
`control_matrix.md` section-heading counts remain frozen snapshots, reconciled at a
dedicated doc-sync pass — not per-addition; the reachability statement here is the
live count.)

ADR-0025 (2026-05-27) added INV-RULE-003 (Layer 2; `rule_evaluation_log` has a
single writer — `ruleEvaluationService.recordEvaluation` is the sole append site)
at the Ring 2A-core authoring rollout's Commit 3, when that service became the
sole writer. Layer 2 count updates from 8 → 9; total distinct INV-IDs from
23 → 24. INV-RULE-003 establishes the **second Layer-2 enforcement sub-type**:
*runtime/structural* (the enforcement site is a code pattern + reviewer
attention), distinct from INV-RULE-002's *test-verified* sub-type. The Layer-2
family now spans two sub-types — (a) test-verified (INV-RULE-002: a deterministic
test failure surfaces a violation) and (b) runtime/structural (INV-RULE-003:
sole-writer service pattern + code-review discipline; no test asserts "only this
function writes," no DB constraint binds it). Future Layer-2 INVs should name which
sub-type they fall under; see its leaf "Scope" + "Enforcement" subsections.

ADR-0027 (2026-05-30) added INV-RULE-004 (Layer 1a; `rule_branches` /
`rule_conditions` are logic-frozen — the §5.1 write-once branch/condition substrate)
at the Ring 2B implementation arc, when the column-immutability trigger + RLS landed
in `20240169`. Layer-1a count updates from 15 → 16; total distinct INV-IDs from
24 → 25. INV-RULE-004 is the **first hybrid-scope INV**: UPDATE + TRUNCATE are
*all-path* (the trigger fires for `service_role` too — stronger than INV-RULE-001's
RLS-only user-path, the INV-AUDIT-002 shape), while DELETE is *user-path only* (RLS
`USING(false)` + `ruleBranchService` single-writer discipline — the same model as
INV-RULE-001, deliberately not trigger-blocked so the `rule_registry`
`ON DELETE CASCADE` cleanup path works; the service-path-direct-DELETE residual is
named in its leaf "Residual"). Future INVs whose scope differs by mutation verb
should state the per-verb scope, as INV-RULE-004's leaf does.

Wave 6 D2.1 (2026-06-03, `49179fba`) added INV-WORKFLOW-002 (Layer 2; every
pipeline-processed document case reaches a terminal disposition — no silent
drops; `needs_review` = the terminal hand-off to the human, not a final state)
at the live-routing arc, registered atomically with the routing wiring.
Layer 2 count updates from 9 → 10; total distinct INV-IDs from 25 → 26.
INV-WORKFLOW-002 is *runtime/structural* (Layer-2 sub-type (b)) with
test-verified support; its eventual-consistency backstop is the D2.3
stranded-case sweep (`sweepStrandedCases`), whose one-time backlog-clearing
run retired the transitional Class-1 residual on 2026-06-04.

Wave 6 D5 (2026-06-05, `9510173d`) added INV-EVIDENCE-001 (Layer 2; every AP
posting committed through the review path produces exactly one canonical
evidence object per subject — org-scoped — before the case reaches
`committed`; completeness descriptive at V1) per ADR-0033 D-0033.7's
realization (Amendment 2026-06-05). Layer 2 count updates from 10 → 11; total
distinct INV-IDs from 26 → 27. The enforcement is two-half: Layer-1 UNIQUE
(`evidence_objects_subject_unique`, migration `20240177`) plus
runtime/structural persist-before-marking at the sole committed-marking site.

Wave 6 D6 (2026-06-05, `aa85390c`) added INV-WORKFLOW-001 (Layer 2; every
Intent in the producer registry has ≥1 non-AI producer; `query` carved out at
V1 by the ratified Q2 scope-out, with its binding re-include trigger) per
ADR-0031's teeth-flip. Layer 2 count updates from 11 → 12; total distinct
INV-IDs from 27 → 28. INV-WORKFLOW-001 establishes the **third Layer-2
enforcement sub-type**: *build-time structural* — the producer-coverage check
exits non-zero on any unscoped gap, wired as a blocking ci.yml job + the root
validation harness; merge-blocking is operator-grain (branch protection). Its
registration closed a reverse-only reachability window open since Wave 4 (the
registry had carried the token warn-only).

Board #4 slice-2 T4 (2026-07-11) added INV-WORKFLOW-003 (Layer 2; a `committed`
document_case bearing α has every α carrying `posted_bill_id` — the aggregate
committed-marking **safety direction**, `committed ⇒ all-α-posted`) per
build-spec §1.5.3's atomicity-posture lock, registered on enforcement (the guard
landed at T3 3b, `9597dc45`). Layer 2 count updates from
12 → 13; total distinct INV-IDs from 28 → 29. Runtime/structural,
INV-EVIDENCE-001-templated (the same approve-post `committed` transition). Only
the safety direction is registered; the completeness reverse
(`all-posted ⇒ committed`) is transiently false in the crash window and stays
unregistered (a WORKFLOW-002-shaped sweep backstop, deferred). The same pass
reconciled INV-EVIDENCE-001's now-stale "sole committed-marking site" enumeration
(its leaf + this file's row 27 + `control_matrix.md`) to the **two**
committed-marking sites T3 3b created — both in the approve-post route, both
persist-before-marking, so EVIDENCE-001 still holds (a descriptive fix, not a
violated-invariant one); a second `INV-EVIDENCE-001` annotation now sits on the
multi-branch persist seam.

The Ring 2B implementation-arc close (2026-05-30) reconciled the frozen-count
snapshots to the live 25 in the same pass as the per-addition note above (the arc's
Condition-2 doc-sync): the heading below (`## The 24 invariants` → `## The 25
invariants`) and the `control_matrix.md` section-heading counts (24/15/9 → 25/16/9).

The `hygiene-post-ring2a-core` doc-sync pass (2026-05-27) reconciled the frozen-count
snapshots to the live 24: the heading below (`## The 20 invariants` → `## The 24
invariants`) and the `control_matrix.md` section-heading counts (20/14/6 → 24/15/9). It
also corrected the reverse-direction grep in the verification command below — and its
twin in `control_matrix.md` — from `src/` to `apps/web/src/` (post-monorepo path). Per
the convention above: the per-addition notes in this narrative are the live count; the
heading + `control_matrix.md` counts reconcile in dedicated doc-sync passes, not
per-addition.

The Wave 6 D8 doc-sync pass (2026-06-05) reconciled the frozen-count
snapshots to the live 28: the heading below (`## The 25 invariants` → `## The
28 invariants`), the layer sub-counts (16/9 → 16/12), and the
`control_matrix.md` counts — including the intro-line straggler ("the 24
invariants") carried forward from the hygiene pass. It also replaced the
literal "empty" expectation on the verification command — here and in the
`control_matrix.md` twin — with the named-exception framing in the statement
above: the raw output has carried the four exceptions since at least the
Ring 2B close (verified by re-run at `11633dc6`); the registered set is what
both directions must reach. The remaining live pointer surfaces
(`glossary.md` Bidirectional-reachability + Evidence-object tail,
`CLAUDE.md` navigation, `authority-gradient.md`) reconcile in the same D8
pass.

The verification command, reproducible at any future point:

```bash
diff <(grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u) \
     <(grep -rho 'INV-[A-Z]\+-[0-9]\+' apps/web/src/ supabase/migrations/ | sort -u)
```

Expected raw output: exactly the four named exceptions (`<`
INV-CHECKPOINT-001; `>` INV-AGENT-002; `>` INV-AP-001; `>` INV-AP-002) and
nothing else — symmetric difference empty at the registered-set grain.

## The 28 invariants

The order matches the leaf's Summary section: Layer 1 first
(16 invariants), then Layer 2 (12 invariants). Within each
layer, the order matches the order the invariants appear in
`ledger_truth_model.md`.

| # | INV-ID | Layer | Rule (one line) | Enforcement type | Leaf | Code site(s) |
|---|---|---|---|---|---|---|
| 1 | INV-LEDGER-001 | 1a | Debit = credit per journal entry | Deferred CONSTRAINT TRIGGER | [leaf](ledger_truth_model.md#inv-ledger-001--debit--credit-per-journal-entry) | `supabase/migrations/20240101000000_initial_schema.sql` (function `enforce_journal_entry_balance`) |
| 2 | INV-LEDGER-002 | 1a | Posting to a locked period is rejected | Trigger with `SELECT ... FOR UPDATE` | [leaf](ledger_truth_model.md#inv-ledger-002--posting-to-a-locked-period-is-rejected) | `supabase/migrations/20240101000000_initial_schema.sql` (function `enforce_period_not_locked`) |
| 3 | INV-LEDGER-003 | 1a | The events table is append-only | 3 triggers + 3 REVOKEs (defense in depth) | [leaf](ledger_truth_model.md#inv-ledger-003--the-events-table-is-append-only) | `supabase/migrations/20240101000000_initial_schema.sql` (function `reject_events_mutation` + REVOKE TRUNCATE block) |
| 4 | INV-LEDGER-006 | 1a | Journal line amounts are non-negative | CHECK constraint | [leaf](ledger_truth_model.md#inv-ledger-006--journal-line-amounts-are-non-negative) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_amounts_nonneg`) |
| 5 | INV-LEDGER-004 | 1a | A journal line is debit XOR credit | CHECK constraint | [leaf](ledger_truth_model.md#inv-ledger-004--a-journal-line-is-debit-xor-credit) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_is_debit_xor_credit`) |
| 6 | INV-LEDGER-005 | 1a | A journal line is never all-zero | CHECK constraint | [leaf](ledger_truth_model.md#inv-ledger-005--a-journal-line-is-never-all-zero) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_is_not_all_zero`) |
| 7 | INV-MONEY-002 | 1a | Original amount matches base amount | CHECK constraint | [leaf](ledger_truth_model.md#inv-money-002--original-amount-matches-base-amount) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_amount_original_matches_base`) |
| 8 | INV-MONEY-003 | 1a | CAD amount matches FX-converted original | CHECK constraint | [leaf](ledger_truth_model.md#inv-money-003--cad-amount-matches-fx-converted-original) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `line_amount_cad_matches_fx`) |
| 9 | INV-IDEMPOTENCY-001 | 1a | Agent-sourced entries require idempotency key | CHECK constraint + Zod refine pairing | [leaf](ledger_truth_model.md#inv-idempotency-001--agent-sourced-entries-require-idempotency-key) | `supabase/migrations/20240101000000_initial_schema.sql` (CONSTRAINT `idempotency_required_for_agent`); `src/shared/schemas/accounting/journalEntry.schema.ts` (`idempotencyRefinement` — Phase 1.1 dead code, activates Phase 1.2) |
| 10 | INV-RLS-001 | 1a | Cross-org data is never visible outside the org | RLS policies (collective) + SECURITY DEFINER helpers | [leaf](ledger_truth_model.md#inv-rls-001--cross-org-data-is-never-visible-outside-the-org) | `supabase/migrations/20240101000000_initial_schema.sql` (RLS HELPER FUNCTIONS section) |
| 11 | INV-REVERSAL-002 | 1a | Reversal entries require a non-empty reason | CHECK constraint | [leaf](ledger_truth_model.md#inv-reversal-002--reversal-entries-require-a-non-empty-reason) | `supabase/migrations/20240102000000_add_reversal_reason.sql` (CONSTRAINT `reversal_reason_required_when_reversing`) |
| 12 | INV-AUDIT-002 | 1a | The audit_log table is append-only | 3 triggers + 2 RLS policies + 3 REVOKEs (defense in depth) | [leaf](ledger_truth_model.md#inv-audit-002--the-audit_log-table-is-append-only-layer-1a) | `supabase/migrations/20240122000000_audit_log_append_only.sql` (function `reject_audit_log_mutation` + RLS policies `audit_log_no_update` / `audit_log_no_delete` + REVOKE block) |
| 13 | INV-ADJUSTMENT-001 | 1a | Adjusting entries require a non-empty reason | CHECK constraint + Zod refine pairing | [leaf](ledger_truth_model.md#inv-adjustment-001--adjusting-entries-require-a-non-empty-reason-layer-1a) | `supabase/migrations/20240128000000_add_adjustment_reason.sql` (CONSTRAINT `adjustment_reason_required_for_adjusting`); `src/shared/schemas/accounting/journalEntry.schema.ts` (`AdjustmentInputSchema`) |
| 14 | INV-RECURRING-001 | 1a | Recurring journal templates balance (debits = credits) | Deferred CONSTRAINT TRIGGER + Zod refine pairing | [leaf](ledger_truth_model.md#inv-recurring-001--recurring-journal-templates-balance-layer-1a) | `supabase/migrations/20240131000000_recurring_journal_templates.sql` (function `enforce_template_balance`); `src/shared/schemas/accounting/recurringJournal.schema.ts` (`RecurringTemplateInputSchema.refine`) |
| 15 | INV-AUTH-001 | 2 | Every mutating service call is authorized | TypeScript middleware (4 pre-flight checks) | [leaf](ledger_truth_model.md#inv-auth-001--every-mutating-service-call-is-authorized) | `src/services/middleware/withInvariants.ts` (primary); `src/services/auth/canUserPerformAction.ts` (permission source) |
| 16 | INV-SERVICE-001 | 2 | Every mutating service function is invoked through `withInvariants` | Structural pattern (export contract + wrap site) | [leaf](ledger_truth_model.md#inv-service-001--every-mutating-service-function-is-invoked-through-withinvariants) | `src/services/accounting/journalEntryService.ts` (export contract); `src/app/api/orgs/[orgId]/journal-entries/route.ts` (wrap site) |
| 17 | INV-SERVICE-002 | 2 | The service layer uses `adminClient`, never `userClient` | Structural pattern (import discipline) | [leaf](ledger_truth_model.md#inv-service-002--the-service-layer-uses-adminclient-never-userclient) | `src/services/accounting/journalEntryService.ts` (adminClient discipline) |
| 18 | INV-MONEY-001 | 2 | Money at the service boundary is string-typed, never JavaScript `Number` | Branded types + Zod schemas + arithmetic helpers + decimal.js confinement (collective) | [leaf](ledger_truth_model.md#inv-money-001--money-at-the-service-boundary-is-string-typed-never-javascript-number) | `src/shared/schemas/accounting/money.schema.ts` (collective enforcement) |
| 19 | INV-REVERSAL-001 | 2 | Reversal lines must mirror the original | TypeScript service function (5-step algorithm) | [leaf](ledger_truth_model.md#inv-reversal-001--reversal-lines-must-mirror-the-original) | `src/services/accounting/journalEntryService.ts` (function `validateReversalMirror`) |
| 20 | INV-AUDIT-001 | 2 | Every mutating service call writes an `audit_log` row in the same transaction | TypeScript service function + call-site discipline | [leaf](ledger_truth_model.md#inv-audit-001--every-mutating-service-call-writes-an-audit_log-row-in-the-same-transaction) | `src/services/audit/recordMutation.ts` (primary); `src/services/accounting/journalEntryService.ts` (call site in `post`) |
| 21 | INV-DOC-001 | 2 | Bills require attached primary document | TypeScript service function (Zod schema + business-logic check) | [leaf](ledger_truth_model.md#inv-doc-001--evidence-completeness-for-committed-bills-layer-2) | `src/services/spend/billService.ts` (function `post`) |
| 22 | INV-RULE-001 | 1a | `rule_evaluation_log` is append-only (user-path) | RLS policy (user-path; UPDATE/DELETE `USING(false)`, no user INSERT) | [leaf](ledger_truth_model.md#inv-rule-001--rule_evaluation_log-is-append-only-user-path-layer-1a) | `supabase/migrations/20240164000000_rule_evaluation_log.sql` (policies `rule_evaluation_log_no_update` / `rule_evaluation_log_no_delete`) |
| 23 | INV-RULE-002 | 2 | The pure-core rule evaluator is deterministic | Pure-function property (test-verified) | [leaf](ledger_truth_model.md#inv-rule-002--the-pure-core-rule-evaluator-is-deterministic-layer-2) | `apps/web/src/core/rules/evaluator.ts` (`evaluate`); verified by `apps/web/tests/unit/ruleEvaluator.test.ts` |
| 24 | INV-RULE-003 | 2 | `rule_evaluation_log` has a single writer | Runtime/structural (sole-writer service pattern + code-review discipline) | [leaf](ledger_truth_model.md#inv-rule-003--rule_evaluation_log-has-a-single-writer-layer-2) | `apps/web/src/services/rules/ruleEvaluationService.ts` (`recordEvaluation`, the sole append site; `// INV-RULE-003`) |
| 25 | INV-RULE-004 | 1a | `rule_branches` / `rule_conditions` are logic-frozen (write-once) | Column-immutability triggers (UPDATE+TRUNCATE, all-path) + RLS `USING(false)` (DELETE user-path) + REVOKE TRUNCATE | [leaf](ledger_truth_model.md#inv-rule-004--rule_branches--rule_conditions-are-logic-frozen-layer-1a) | `supabase/migrations/20240169000000_ring2b_branch_condition_substrate.sql` (functions `reject_rule_branches_mutation` / `reject_rule_conditions_mutation` + triggers); `apps/web/src/services/rules/ruleBranchService.ts` (single-writer contract) |
| 26 | INV-WORKFLOW-002 | 2 | Every pipeline-processed document case reaches a terminal disposition (no silent drops; `needs_review` = the terminal hand-off to the human, not a final state) | Runtime/structural (orchestrator routing path + automation chain-advance + Subsystem-2 routing; test-verified support) | [leaf](ledger_truth_model.md#inv-workflow-002--terminal-disposition-completeness--no-silent-drops-layer-2) | `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` (Stage-6.5 routing + park-exit hand-offs; `INV-WORKFLOW-002` annotation); `apps/web/src/services/document-platform/documentCaseService.ts` (`advanceCaseAutomation`); `apps/web/src/services/document-platform/documentRouterService.ts` (`resolveCandidates`); `apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts` (D2.3 sweep — the eventual-consistency backstop; Class-1 RETIRED 2026-06-04 via the backlog-clearing run, run_trace_id `2855c8e3-…`) |
| 27 | INV-EVIDENCE-001 | 2 | Every AP posting committed through the review path produces exactly one canonical evidence object per subject (org-scoped) before the case reaches `committed`; completeness is descriptive at V1 | Layer-1 UNIQUE `(org_id, subject_type, subject_id)` + runtime/structural persist-before-marking at the approve-post route's committed-marking sites (two as of board #4 T4 — the single-invoice path's mark + the multi-invoice N-branch's aggregate guard, each persist-first; the route remains the sole committed-marking surface) (test-verified support) | [leaf](ledger_truth_model.md#inv-evidence-001--canonical-evidence-object-required-at-commit-layer-2) | `supabase/migrations/20240177000000_wave_6_d5_evidence_objects_persistence_substrate.sql` (constraint `evidence_objects_subject_unique` — the Layer-1 half); `apps/web/src/app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts` (persist-before-marking seam; `INV-EVIDENCE-001` annotation); `apps/web/src/services/evidence/evidenceObjectService.ts` (`persist` — subject-ownership guard + idempotent upsert) |
| 28 | INV-WORKFLOW-001 | 2 | Every Intent in the producer registry has ≥1 non-AI producer (no AI-only path to any intent; `query` carved out at V1 by the ratified Q2 scope-out, re-include trigger named at the carve-out) | Build-time structural — the producer-coverage check exits non-zero on any unscoped gap, wired as a blocking ci.yml job + the root validation harness; a red CI run blocks merge only where branch protection requires the check (operator-grain); the CI job's first execution occurs at the wave-close push (test-verified support) | [leaf](ledger_truth_model.md#inv-workflow-001--no-ai-only-paths--producer-coverage-layer-2) | `apps/web/src/core/intent/producers.ts` (the registry + `runCheck` + `V1_TEETH_SCOPE_OUT`; `INV-WORKFLOW-001` annotation — the grep-visible anchor; the enforcing mechanism — `scripts/check-intent-producers.ts` + the ci.yml `intent-producers` job — is grep-invisible by location and cited from the anchor) |
| 29 | INV-WORKFLOW-003 | 2 | A `committed` document_case bearing α (`extracted_invoices`) rows has every α carrying `posted_bill_id` (the aggregate committed-marking **safety direction**: `committed ⇒ all-α-posted`; the completeness reverse is unregistered — transiently false in the crash window; α-less single-invoice cases are vacuously satisfied) | Runtime/structural — the approve-post multi-invoice N-branch's aggregate committed guard (`advanceCaseAutomation('committed')` reached only when every α is posted; a partial post holds at `approved`; test-verified support); a Layer-1 committed-transition trigger is named, deferred defense-in-depth | [leaf](ledger_truth_model.md#inv-workflow-003--aggregate-committed-marking-a-committed-case-has-all-its-extracted-invoices-posted-layer-2) | `apps/web/src/app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts` (`postMultiInvoiceCase` aggregate committed guard; `INV-WORKFLOW-003` annotation); verified by `apps/web/tests/integration/reviewApprovePostMultiInvoice.integration.test.ts` (test 1 all-posted→`committed`; test 2 partial→`approved` then recovery→`committed`) |

## Cross-layer pairings

Six invariants participate in pairings — same rule expressed at
two layers, or two complementary rules that together enforce a
single contract. The "only paired invariants may cross-reference
across layers" rule (established during Waypoint E.1) means
these are the only INV-IDs that legitimately appear annotated
in code at sites belonging to a different layer than their
primary.

| INV-A | INV-B | Relationship | Pairing site |
|---|---|---|---|
| INV-REVERSAL-002 (L1a) | INV-REVERSAL-001 (L2) | Layer 1a reason CHECK + Layer 2 mirror service-check; both apply to reversal entries | Cross-references in both directions: `20240102000000_add_reversal_reason.sql` annotation cites INV-REVERSAL-001; `journalEntryService.ts validateReversalMirror` annotation cites INV-REVERSAL-002 |
| INV-IDEMPOTENCY-001 (L1a) | INV-IDEMPOTENCY-001 (L2 pre-flight) | Same INV at two layers: Layer 1a CHECK constraint + Layer 2 Zod refine pre-flight (currently dead code in Phase 1.1; activates Phase 1.2) | `20240101000000_initial_schema.sql` (CONSTRAINT) and `journalEntry.schema.ts` (`idempotencyRefinement`) |
| INV-AUTH-001 (L2 primary) | INV-AUTH-001 (L2 permission source) | Same INV at two sites: middleware enforcement + role-action matrix | `withInvariants.ts` (primary) and `canUserPerformAction.ts` (permission source) |
| INV-AUDIT-001 (L2 primary) | INV-AUDIT-001 (L2 call site) | Same INV at two sites: enforcement function + call site inside caller's transaction | `recordMutation.ts` (primary) and `journalEntryService.ts` post function (call site) |
| INV-SERVICE-001 (L2 export contract) | INV-SERVICE-001 (L2 wrap site) | Same INV at two sites: service module exports unwrapped + route handler wraps | `journalEntryService.ts` (export contract) and `journal-entries/route.ts` POST handler (wrap site) |
| INV-LEDGER-003 (L1a primary) | INV-LEDGER-003 (L1a defense in depth) | Same INV at two sites: trigger function + REVOKE TRUNCATE block | `20240101000000_initial_schema.sql` (function `reject_events_mutation` + REVOKE block) |
| INV-AUDIT-001 (L2) | INV-AUDIT-002 (L1a) | Layer 2 service-layer write guarantee + Layer 1a database-level permanence guarantee; AUDIT-001 gets the row in, AUDIT-002 keeps it there | `recordMutation.ts` (L2 primary) and `20240122000000_audit_log_append_only.sql` (L1a primary — function `reject_audit_log_mutation` + RLS policies + REVOKE block) |
| INV-LEDGER-001 (L1a) | INV-RECURRING-001 (L1a) | LEDGER-001 guards posted entries; RECURRING-001 guards recurring-journal templates. A broken template cannot produce an unbalanced posted run because either (a) the template write fails at RECURRING-001's commit-time CONSTRAINT TRIGGER, or (b) approveRun reads balanced template lines and the resulting journal_entries / journal_lines INSERT must also balance per LEDGER-001 | `20240131000000_recurring_journal_templates.sql` (RECURRING-001 — function `enforce_template_balance`) and `20240101000000_initial_schema.sql` (LEDGER-001 — function `enforce_journal_entry_balance`) |

## Discipline backstops (not invariants)

Two database-level enforcement sites participate in documented
disciplines without warranting their own INV-IDs. These sites
are annotated in their migrations with discoverability comments
that explicitly state the non-promotion (Waypoint E.3).

| Site | Discipline | Rationale for non-promotion |
|---|---|---|
| `unique_entry_number_per_org_period` UNIQUE constraint in `20240104000000_add_entry_number.sql` | The "retroactive collision detector" for the no-FOR-UPDATE entry-number allocation pattern (Transaction Isolation section of `ledger_truth_model.md`) | The rule the codebase actually cares about is sequentiality (entries numbered 1, 2, 3...), not uniqueness. UNIQUE enforces uniqueness but cannot enforce sequentiality (a sequence with gaps still satisfies UNIQUE). Phase 1.1 deliberately accepts gaps under failure conditions. Promoting to INV would contradict the Transaction Isolation section's "discipline, not invariant" classification. |
| `je_attachments_select` RLS policy in `20240106000000_add_attachments.sql` | Collective participant in INV-RLS-001 — the leaf's Phase 2 evolution note states: "The collective invariant does not change; the set of policies that enforce it grows." | INV-RLS-001 is annotated at a single load-bearing point (the SECURITY DEFINER helper functions in migration 001). Per-table replication of the annotation would defeat the rollup framing and inflate the bidirectional sweep count without adding grep value. |
| `reportService.trialBalance()` footer check in `src/services/reporting/reportService.ts` | Trial balance debits equal credits (theorem of INV-LEDGER-001 (Layer 1a)) | Theorem, not axiom; follows mechanically from INV-LEDGER-001 (Layer 1a) holding per-entry. Backstop exists to surface violations at the report boundary; the underlying rule is unchanged. The equivalent UI check in `BasicTrialBalanceView.tsx` covers the render path; this service-layer throw covers non-UI consumers. |

Both sites are annotated in their migrations with comments that
quote the leaf's authoritative phrasing, making the
non-promotion findable from the migration site rather than
requiring a future reader to consult the leaf to understand why
the site has no INV-ID.

## How to add a new invariant

When Phase 1.2 or later phases add new enforcement, follow this
order to keep bidirectional reachability intact:

1. **Write the leaf in `ledger_truth_model.md` first.** Define
   the invariant text, the enforcement mechanism, the layer
   classification, and the interactions with existing
   invariants. For Layer 1 invariants, classify as 1a or 1b per
   ADR-0008's three tests (single-row-or-transaction-scoped?
   synchronous cost acceptable? scheduled cadence adequate?).
   Layer 2 invariants do not require sub-layer classification.
   The leaf is the canonical statement of the rule.
2. **Add the annotation in code or audit prompt.** A
   `-- INV-XYZ-NNN (Layer 1a)` comment in SQL migrations for
   Layer 1a rules; a SQL file under
   `docs/07_governance/audits/` (header-tagged with
   `INV-XYZ-NNN (Layer 1b)`) for Layer 1b rules; a
   `// INV-XYZ-NNN` comment in TypeScript source for Layer 2.
   The annotation establishes bidirectional reachability — a
   future grep finds both the doc and the code (or audit) site.
3. **Add the row to this file's main table.** New row at the
   end of the layer's section, with the leaf anchor and the
   code site(s).
4. **Add the audit row to `control_matrix.md`.** The
   audit-side evidence table needs the test coverage and the
   enforcement-mechanism specifics.
5. **Verify bidirectional reachability.** Run the diff command
   from the "Bidirectional reachability statement" section
   above. Expected output: the four named exceptions and nothing
   else — a correctly-added invariant appears on neither side of
   the diff (see that statement for the exception list).

**Sub-layer classification.** Layer 1 invariants carry a
`(Layer 1a)` or `(Layer 1b)` tag in their leaf header, their
`invariants.md` table row (column value `1a` or `1b`), and
their code annotations. See
`docs/07_governance/adr/0008-layer-1-enforcement-modes.md` for
the classification procedure.

The order is non-negotiable per the
`docs/02_specs/README.md` spec-without-enforcement rule:
**no INV-ID is added to this file before its enforcement
exists in code today.** Aspirational rules belong in Phase 2
briefs.
