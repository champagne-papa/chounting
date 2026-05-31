# Ring 2B implementation — scope-lock (implementation arc, tenth arc)

**Date:** 2026-05-30 · **Anchor:** `origin/staging` = `90bf2c38` (Ring 2B substrate
design-authoring closeout, ninth arc) · **Lock:** `ring-2b-impl-90bf2c38`.

Scope-locked after a HEAD-pass that ran canon (ADR-0027, ratified `d6175f4d`) against
disk and surfaced the reconciled scope + four deferred decisions for advisor
adjudication. The advisor adjudicated both migrations (`20240163` template, `20240165`
RPC) and all four leans from `90bf2c38`, greenlit single-arc A1a, and folded in four
enforcement-shape refinements (below). This record is arc-canon for scope; **ADR-0027 is
the decision record and wins any tiebreak.**

## What this arc is

The fresh second arc against ratified ADR-0027 — turns the design into substrate code.
Ring 2B = **make pattern (vendor) rules actually win on the drag-drop-bill scope** by
landing the storage the shipped-but-inert evaluator needs. The matching engine
(`core/rules/`), `ruleEvaluationService.evaluate`/`recordEvaluation`, and the agent-layer
`evaluateAndDispatch` coordinator are **already shipped** (Ring 2A-core); they are inert
in production because `branchSource` defaults to `noBranchSource = () => []`
(`ruleEvaluationService.ts:47`) → branchless rules → `almost_match`/no winner, and
`evaluateAndDispatch` has **no production caller** (`ruleEvaluationOrchestrator.ts:52`,
test-exercised only via `ruleEvaluateAndDispatch.integration.test.ts`).

## Locked scope (A1a — substrate-only, shadow/diagnostic, no live auto-post)

1. **Migration `20240169`** (highest on disk is `20240168`, confirmed):
   - `CREATE TYPE branch_type AS ENUM ('primary','otherwise_if')` — a **new** enum
     (`condition_type`/`action_type`/`trigger_type` shipped at `20240163:113,126,134`;
     `branch_type` absent). Matches the TS `BranchType` at `core/rules/types.ts:21`.
   - `rule_branches`: `id`, `rule_id REFERENCES rule_registry(id) ON DELETE CASCADE`,
     `branch_order`, `branch_type`, `max_outcome_action action_type`,
     `applies_to_evaluation_triggers trigger_type[]`, `applies_to_source_triggers
     trigger_type[]` (nullable). Rule-scoped uniqueness `(rule_id, branch_order)`; **no
     `org_id`** (Decision 1).
   - `rule_conditions`: `id`, `branch_id REFERENCES rule_branches(id) ON DELETE CASCADE`,
     `condition_order`, `condition_type`, `target_field`, `condition_value jsonb`.
     Uniqueness `(branch_id, condition_order)`. JSONB only for the polymorphic
     `condition_value` (TS-typed `unknown`, validated at the assembly boundary).
   - **RLS** mirroring `rule_track_records` (`20240163:233-257`): through-parent SELECT
     (`user_has_org_access`) + INSERT (`user_is_controller`); UPDATE/DELETE `USING(false)`.
     `rule_conditions` derives org two-hop through `rule_branches` → `rule_registry`
     (Decision 3).
   - **§5.1 column-immutability trigger** on both tables (Decision 2 / OQ-2B-1 ratified
     toward trigger) — belt-and-suspenders over the RLS `USING(false)`, all-path
     (fires for `service_role` too). **This is INV-RULE-004** (Layer 1a), registered this
     arc (below).
   - **Extend `create_vendor_rule_atomic`** (`20240165`) with a `p_branches JSONB` arg
     (Decision 7 / OQ-2B-2, adjudicated → **extend, not a dedicated RPC**). Atomic
     branches→conditions loop (1:many:many) inside the existing single plpgsql
     transaction; the **exactly-one-primary-per-rule** cross-row CHECK lands here
     (Decision 1, RPC-layer).
   - `types.ts` regen (additive).
2. **Single-writer `ruleBranchService`** (absent on disk; `services/rules/` has 6 others)
   owns `rule_branches`/`rule_conditions` (§5.10 disjoint-by-table).
3. **Production `branchSource`** — replaces `noBranchSource`; reads
   `rule_branches`+`rule_conditions`, assembles `Branch[]`, validates `condition_value`
   per `condition_type` at the assembly boundary (Decision 4). `noBranchSource` retained
   for tests.
4. **Thin Seam-1 shadow call** to the existing `evaluateAndDispatch` (Decision 5) —
   supplies the production `branchSource`, records MatchResult + Logic Receipt, **does not
   auto-post** (A1a). Live auto-posting is a later workflow arc.
5. **`default_account_id` + vendor-name resolution** (Decision 6) — resolved + recorded in
   the trace at shadow scope; posting consumption defers to the workflow arc.

**Out of scope (guardrails):** no temporal/inferential evaluator-building (`branchEvaluator`
throws by design; §10 later workflow ships); **no live auto-post wiring (A1a)** — defers to
a workflow arc once `docs/02_specs/document-v2-workflow.md` exists (absent on disk);
retroactive `created_*`-anchor triggers on `rule_registry`/`rule_track_records` (the
`20240163` deferral) out of scope.

## Four deferred decisions — adjudicated (ADR-0027 deferred these to implementation)

1. **OQ-2B-2 — extend `create_vendor_rule_atomic`** (not a dedicated branch-authoring RPC).
   Disk-confirmed: the RPC does atomic `registry→track_record→vendor_rules` in one plpgsql
   txn and **is SECURITY DEFINER** (`20240165`). A dedicated RPC breaks the single
   transaction (ADR-0025 Correction 1: no service-layer txn threading) or duplicates the
   wrapper. Extend with `p_branches JSONB`. The RPC becomes the enforcement site for the
   cross-row exactly-one-primary CHECK.
2. **INV-RULE-004 timing — register THIS arc.** The enforcing trigger+RLS land in
   `20240169`, so the spec-without-enforcement rule's trigger fires now. Follow
   `invariants.md` §"How to add a new invariant" (leaf → code annotation → table row →
   `control_matrix` row → bidirectional-reachability diff) + `invariants: [INV-RULE-004]`
   frontmatter on the implementing commit. **Leaf Scope precision:** INV-RULE-004 is
   **trigger-authoritative / all-path** (BEFORE UPDATE/DELETE fires even for `service_role`,
   like INV-AUDIT-002) — **stronger** than INV-RULE-001's RLS-only user-path append-only
   (the `20240164` header draws exactly this distinction). Write the leaf so the two RULE
   invariants are not miscategorized as the same enforcement shape.
3. **Arc shape (RI-7) — single-arc, internal Path-C seams.** One cohesive migration; A1a
   already withholds the consumer (posting), so the substrate/consumer split is
   internal-commit-grade, not a second arc. Firm the estimate at each commit. **Watch:** if
   the `20240169` commit gets heavy (enum + 2 tables + RLS + immutability trigger + RPC
   extension), split the migration internally (tables+RLS, then trigger+RPC-extension) — a
   Path-C-internal call, not a second arc.
4. **Eval-subset enforcement — DB CHECK.** `applies_to_evaluation_triggers` is `trigger_type[]`
   (8-value enum) but only the 2-value `EvaluationTrigger` subset is legal
   (`shared/rules/types.ts:39-42` → `proposed_mutation_generated` /
   `proposed_mutation_bundle_generated`). Static closed grammar + Decision 2's fiduciary
   posture favor DB-level (vs. `condition_value`'s open polymorphism, correctly
   service-layer). **Non-empty guard required** (`<@` permits `{}`, a never-evaluated dead
   branch): `CHECK (cardinality(applies_to_evaluation_triggers) >= 1 AND
   applies_to_evaluation_triggers <@ ARRAY['proposed_mutation_generated',
   'proposed_mutation_bundle_generated']::trigger_type[])`. Parallel guard on
   `applies_to_source_triggers`: `CHECK (applies_to_source_triggers IS NULL OR
   cardinality(applies_to_source_triggers) >= 1)` (null = meaningfully "any"; empty non-null
   = dead filter); **no** subset CHECK there (SourceTrigger = full `trigger_type`).

## Four enforcement-shape refinements (advisor, folded in)

- **Two-vocabulary non-conflation.** `rule_evaluation_log.winning_branch_type` text CHECK
  is `('primary','guardrail')` (`20240164` §a); the new `branch_type` enum is
  `('primary','otherwise_if')`. Deliberately distinct: `branch_type` is the structural
  authored kind (§5.2); `winning_branch_type` is the win-time classification where a winning
  `otherwise_if` maps to `guardrail` (`evaluator.ts:20-21`). **The migration must not
  conflate the new enum with that CHECK** — the "two near-identical enums" trap.
- **Re-surfaced DEFINER hygiene flag — carry, don't absorb.** `create_vendor_rule_atomic`
  is SECURITY DEFINER while its precedent `write_journal_entry_atomic` is SECURITY INVOKER,
  flagged for a future security-mode hygiene review (spans create+approve_vendor_rule_atomic,
  T4-adjacent). Re-touching this function in Ring 2B re-surfaces that flag — carry it
  explicitly; do **not** absorb the hygiene resolution into this arc. (A3 is "extends a
  function already carrying an unresolved DEFINER-vs-INVOKER question.")
- **All-path INV-RULE-004 leaf scope** — see decision 2 above.
- **Non-empty eval-trigger CHECK** — see decision 4 above.

## Standing flags — carried, not absorbed

- **A3** SECURITY-DEFINER forward-flag extends to the modified creation RPC (and re-surfaces
  the DEFINER-vs-INVOKER hygiene flag above).
- **§5.10 footnote** touch-up (structure-vs-parameter split) + **§3/§11.1 spec-staleness**
  footnotes — footnote-grade; batch in this arc's docs touches.
- **`adr/0026` INDEX.md** one-line prior-arc hygiene fix — fold into docs touches or keep
  separate (scope-lock call: fold).
- **α/β late-emerging-substrate codification — stays DEFERRED** (obs-grain N=1). If this
  arc's work fires the late-emerging-substrate resolution decision a **second time across
  contexts**, that's its N=2 — flag it, do not force it.

## Internal commit plan (single-arc, Path-C seams)

1. **Migration `20240169`** + `types.ts` regen (split internally to tables+RLS / trigger+RPC
   if heavy).
2. **`ruleBranchService` + production `branchSource`** (+ assembly-boundary validation).
3. **Seam-1 shadow caller** + `default_account_id`/vendor-name resolution.
4. **Docs touches** — INV-RULE-004 registration (leaf → annotation → table → control_matrix
   → bidirectional diff); §5.10/§3/§11.1 footnotes; `adr/0026` INDEX.md line.

Per-commit prose surfaced for advisor adjudication **before each commit fires**, starting
with the `20240169` migration. Migration-arc gates: RLS/migration gates + `adr:check`;
`types.ts` regen after the table change; `pnpm test:full` summary line as Condition-1
evidence at close. One arc, one lock, one push event; operator-held push; bilateral push
verification at close.

## HEAD-pass findings (disk-verified this session, from `90bf2c38`)

- Anchor `git ls-remote origin staging` = `90bf2c38f4f6…` (authoritative); tree clean
  except the 4 standing untracked; no foreign lock.
- Highest migration `20240168`; `rule_branches`/`rule_conditions`/`branch_type` enum absent.
- `rule_track_records` (`20240163:210-257`) = the FK/RLS template (simple `rule_id` cascade,
  no `org_id`, through-parent RLS, UPDATE/DELETE `USING(false)`).
- `EvaluationTrigger` = 2-value subset (`shared/rules/types.ts:39-42`); `BranchType` already
  `'primary'|'otherwise_if'` in TS core (`core/rules/types.ts:21`).
- BranchSource seam live (`ruleEvaluationService.ts:46-47,131`); `evaluateAndDispatch`
  shipped, zero production callers (`ruleEvaluationOrchestrator.ts:52-58`).
- `create_vendor_rule_atomic` (`20240165`): 3-JSONB-arg, SECURITY DEFINER, atomic
  registry→track_record→vendor_rules; `approve_vendor_rule_atomic` (`20240168`) sets
  `rule_registry.lifecycle_state='active'` (the freeze boundary).
- `ruleBranchService` absent (`services/rules/` has 6 services).
- `winning_branch_type` vs `branch_type` — investigated clean (distinct vocabularies).

## Next

Author migration `20240169` per the locked scope + four refinements. **Surface its prose
for the advisor's adjudication (branch_type/trigger_type[] columns, through-parent RLS,
immutability-trigger semantics, extended RPC) before committing.** No migration commit
until greenlight.
