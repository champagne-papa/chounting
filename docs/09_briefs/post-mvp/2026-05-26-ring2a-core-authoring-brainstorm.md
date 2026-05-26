# Ring 2A-core Authoring Arc — Brainstorm

**Date:** 2026-05-26 · **HEAD anchor:** `9071abd2`, branch `staging`.
**Status:** Brainstorm (decision-mapping; not a design spec, not code). Maps the
HOW of ADR-0024's Decisions 3–6 (evaluator, gate, canvas+route, services). Input
to a pre-ADR verification pass → Ring 2A-core authoring design spec(s).

## 1. Preamble — standing posture

**Empirical HEAD pass.** Every decision turning on "the existing X behavior" gets
a disk-grep before tradeoff analysis. The substrate cycle's near-misses (spec-says-live
vs disk-says-unbuilt; RLS-safe vs owner-rights footgun; deferred vs ratified) were
the discipline doing its job.

**Canon-grounded shift.** Unlike prior arcs, the substrate this arc consumes is on
disk and tested (migration applied, RLS verified, types regenerated, INV-RULE-001
reachable). The HEAD pass verifies *consumer-side greenfield* (the still-unbuilt
surface ADR-0024 ratified boundaries for) rather than substrate-side prediction —
the substrate can't be misdescribed because the spec describes something tested.

**Prompt frames, disk refines, flag-and-propose.** Where this brainstorm's framing
is wrong against disk or spec, it flags and proposes the corrected framing rather
than bending the evidence.

## 2. Empirical HEAD pass

**Substrate-side (canon-grounded — all confirmed):**

- **(a)** `rg -c "rule_evaluation_log" apps/web/src/db/types.ts` → 3. The regenerated
  types from the test-update arc are at HEAD: `rule_evaluation_log` Row/Insert/Update
  + `rule_evaluation_30d_view` Row-only, `action_type` enum reused. No substrate drift.
- **(b)** `supabase/migrations/20240164000000_rule_evaluation_log.sql` present; RLS as
  authored (UPDATE/DELETE `USING(false)`, no INSERT policy, `security_invoker = true`
  view) — matches ADR-0024 Decisions 1/2.
- **(c)** INV-RULE-001 reachable in all three: `invariants.md`, `ledger_truth_model.md`
  (leaf), `control_matrix.md` (row). Pre-existing reachability drift stays out of scope.

**Consumer-side (greenfield — this is where authoring lands):**

- **(d)** `apps/web/src/core/rules/` **does not exist**. `core/` holds `README.md` +
  `evidence/`. The ADR-0020 "ratified empty home" is `core/`; `core/rules/` is created
  when the evaluator lands. *(Minor framing refinement vs the prompt's "empty home":
  the home is `core/`, not a pre-existing `core/rules/` dir.)*
- **(e)** `apps/web/src/agent/policies/agent-ladder/` **exists with a README placeholder
  only** (746 bytes; "Implementation begins: Phase 2"). The README confirms it's the
  home for Agent Ladder *policy logic*; *durable state* is persisted through services +
  db (ADR-0020 dependency direction). The gate lands here.
- **(f)** `apps/web/src/services/rules/` **does not exist**. `services/` has 13 domain
  subdirs (accounting, agent, audit, auth, document-platform, errors, evidence,
  middleware, org, reporting, spend, storage, user). `services/rules/` is the greenfield
  home; the `<domain>/` convention is intact.
- **(g)** `rg "RuleRegistryView|rule_registry|ruleRegistry" apps/web/src/components
  apps/web/src/app` → zero matches. No canvas component, no app references. Greenfield.
- **(h)** No `*rule*` route dirs under `apps/web/src/app/api`. The route handler is
  greenfield.
- **(i)** 19 `*View.tsx` in `components/canvas/` (incl. ADR-named `OpenBillsView`,
  `PendingDocumentsView`). `OpenBillsView` read end-to-end: `'use client'` +
  `useEffect`/`fetch('/api/orgs/${orgId}/...')` + loading/error/empty/data states,
  read-only table, **no sort/filter**. RuleRegistryView (sort/filter + 4 row-action
  mutations + promotion modal) is meaningfully more elaborate than this read-only
  precedent.
- **(j)** `services/` domain-subdirectory structure confirmed (see (f)).

**Spec-side (decisions ADR-0024 defers to authoring):**

- **(k)** §5.5 fixes the **specificity ordering** (3 tiers: closed-set conditions >
  range/threshold > pattern-match) but states *"the exact weight table is owned by Ring
  2; the ordering is fixed at Ring 0… the weight table is total."* So the weight
  **values** are **this arc's to assign** within the fixed ordering — an open question
  (Decision C / OQ-1), as the prompt anticipated. §6.1 step 4a fixes the composition
  rule: specificity is the **sum** of the matched branch's condition weights.
- **(l)** §6.1 step 3 carries the canonical **9-row capping table** verbatim — identical
  to what the migration arc confirmed (Verification 2). The gate implements it byte-for-byte;
  the pure core references it for the tiebreak-only computation (step 3).
- **(m)** §5.7 MatchResult fields confirmed: `winning_rule_id`, `winning_branch`,
  `winning_branch_type` (`primary|guardrail`), `winning_branch_max_action`,
  `match_classification` (3 states), `also_matched_rules`, `almost_match_rules`
  (`closest_branch_id` + `failed_conditions`), `track_record_snapshot`,
  `four_questions_population`, `evaluation_trace`. **No `effective_action`** (gate's
  output). Surfaced: §5.6/§6.3 specify a non-MatchResult return —
  `EvaluationSkipped(reason)` for system-ceiling-class proposals (reversals) — relevant
  to Decision F.
- **(n)** §6.1 step 1 ("Trigger index lookup") is **explicitly the service layer**
  (`ruleEvaluationService`): it finds Rules whose Trigger Set includes a matching
  Evaluation Trigger and assembles Rule rows + TrackRecord snapshots as inputs for the
  pure core. §5.4 clarifies the two trigger roles: **Evaluation Triggers**
  (`proposed_mutation_generated`, `proposed_mutation_bundle_generated`) are what rule
  evaluation runs *against* and what the Trigger Set matches; **Proposal-Source
  Triggers** (the other six) are filtered via a `source_trigger_equals` *Condition*, not
  via trigger lookup. → **Decision D is spec-resolved** (service pre-filters; not open).

## 3. Decision A — Predicate evaluator structure

Six v1 pattern condition types (each `(condition_value, context_field_value) → boolean`):
`field_equals`, `field_in_range`, `field_outside_range`, `field_in_set`,
`field_matches_pattern`, `source_trigger_equals`.

- **Option 1 — discriminated union + single `switch(condition_type)` evaluator.** Compact
  for the closed set; exhaustiveness-checkable.
- **Option 2 — `Record<ConditionType, PredicateEvaluator>` map.** One entry per type;
  Ring 2B (temporal/inferential) predicates are a map-entry addition, not a switch edit.

**Lean: Option 2 (map).** The project's closer precedent for type→handler dispatch is
the `Record<…Type, …>` map (`Record<DocumentType, …>` in the classifier,
`Record<AccountType, …>` in canvas), and §5.5 frames conditions as a *"closed library"*
— a registry maps cleanly onto a library. The map also localizes the Ring 2B extension
to map entries. (Switch-on-discriminator exists in the project too — canvas directives —
so Option 1 is defensible; the lean is mild.) Either way, the **specificity weight**
lives alongside each evaluator (the weight table is per-condition-type), so a
`Record<ConditionType, { evaluate, specificityWeight }>` shape unifies A with C's weight
table.

## 4. Decision B — Rule / Branch / Condition in-memory shape

ADR-0024's Non-decision: no Branch/Condition persistence substrate this arc; rules are
typed in-memory fixtures / service-assembled objects.

- **Shape:** plain TypeScript types in `core/rules/types.ts`. The pure core *receives*
  already-assembled `Rule[]` (the service does step-1 assembly); it does not validate or
  parse — so it needs **types**, not Zod schemas. `Rule` carries `id`, `org_id`,
  `rule_type`, `current_rung`, `lifecycle_state`, lineage/recency anchors, and a `branches:
  Branch[]`. `Branch` carries `branch_order`, `branch_type` (`primary | otherwise_if`),
  `applies_to_evaluation_triggers`, `applies_to_source_triggers` (the §6.1-step-2
  branch-level trigger filter), `max_outcome_action`, and `conditions: Condition[]`.
  `Condition` carries `condition_type`, `condition_order`, the target field reference, and
  the typed `condition_value`.
- **Location:** `core/rules/types.ts` (pure; no imports). When Branch/Condition
  persistence lands (Ring 2B or a Branch substrate ring), **Zod schemas** validate at the
  persistence/service boundary under `shared/schemas/rules/` (the established Zod home);
  the pure-core types and the persistence schemas stay distinct (core evaluates; schemas
  validate at the boundary).

**Lean:** TS types in `core/rules/types.ts` now; `shared/schemas/rules/` reserved for the
persistence boundary later. Don't invent a predicate-storage shape (ADR-0024 Non-decision).

## 5. Decision C — Conflict-resolution algorithm shape

§6.1 step 4 + §5.7 specify the ordering **fully**; most of C is spec-resolved:

- **(4a) specificity = SUM** of the matched branch's condition weights (§6.1 step 4a,
  verbatim). Composition rule resolved — *not* product/max.
- **(4b) conservatism ordering, verbatim:** `block_with_reason` >
  `route_to_exception_queue_with_reason` > `suggest_with_required_approval` >
  `auto_post_at_rung_2` > `auto_post_at_rung_3`, computed over each candidate's
  **`tiebreak_effective_action`** (the step-3 capped value, not the raw max).
- **(4c) recency:** most-recently activated/promoted wins — reads `rule_registry`
  (`promoted_at` then `created_at` / the lifecycle anchors). The exact recency key
  (promoted_at-then-activated vs a single anchor) is a small interpretation point;
  lean: `COALESCE(promoted_at, created_at)` descending, consistent with §5.8's
  "activated/promoted."
- **(4d)** stable `rule_id` UUID order. Total; never reached in practice.

**The one genuinely open piece (→ OQ-1):** the specificity **weight values**. §5.5 fixes
the 3-tier ordering and says the table is "owned by Ring 2" (this arc). Lean: assign a
total table consistent with the fixed ordering — e.g., closed-set conditions
(`field_equals`, `field_in_set`, `source_trigger_equals`, and the Ring 2B
`category_classification_matches`) = 3; range/threshold (`field_in_range`,
`field_outside_range`, Ring 2B `semantic_match_above_threshold`) = 2; pattern-match
(`field_matches_pattern`) = 1. Values are arbitrary within the ordering as long as the
3-tier separation holds under summation; surface for ratification because it's a
canon-setting choice (the weight table is "total" and "fixed at Ring 2 ratification").

## 6. Decision D — Trigger lookup → rule selection

**Spec-resolved (§6.1 step 1, verbatim): the service layer pre-filters.**
`ruleEvaluationService` does the trigger-index lookup (Rules whose Trigger Set includes
the event's Evaluation Trigger) and assembles Rule rows + TrackRecord snapshots; the pure
core (`evaluate(rules, context)`) receives the **already-filtered candidate set**. This is
the right side of §7's purity contract: the index/DB-read concern is the service's; the
pure core does branch/condition logic only. Branch-level trigger filtering
(`applies_to_evaluation_triggers` / `applies_to_source_triggers`, §6.1 step 2) happens
*inside* the pure core on the candidate set — a separate, pure operation. No tradeoff to
resolve; implement as spec'd.

## 7. Decision E — Gate function shape, inert stubs, capping placement

Gate at `agent/policies/agent-ladder/` (ADR-0024 Decision 4; orchestrator-layer).

- **Capping function signature:** `cap(maxOutcomeAction, currentRung) → action_type` —
  the 9-row table (§6.1 step 3 / l). **Placement question (→ OQ-2):** the capping table is
  used in **two** places — the pure core (step 3, tiebreak-only) and the gate (step 7,
  authoritative). The pure core imports nothing (ADR-0020), so the table must live where
  the core can use it: **`core/rules/capping.ts`** (pure). The gate (`agent/`) then needs
  to *import from `core/`* — verify that agent→core import is permitted under ADR-0020
  Appendix A's six import-boundary blocks. If permitted (likely — `core` is the foundation
  of the gradient), the gate imports `core/rules/capping.ts` (single source of truth). If
  not, the table needs a shared-reachable home or the gate reaches it via a service. Lean:
  `core/rules/capping.ts`, gate imports; flag the boundary check for the design spec.
- **Gate entry:** `gate(matchResult, ruleRegistryRow, limitContext) → effective_action`.
  Composition is sequential per §6.1 step 7: `cap(max, rung) → checkPerTransactionLimit →
  checkDailyAggregate → checkTrackRecordHealth → effective_action`.
- **Three inert stubs:** `checkPerTransactionLimit(action, ctx)`,
  `checkDailyAggregate(action, ctx)`, `checkTrackRecordHealth(action, ctx)`, each
  `(action_type, context) → action_type`, returning the input action unchanged at v1 with
  an explicit `// activates post-v1` marker. Sequential pass-through means at v1 the gate's
  output equals `cap(max, rung)` — and since v1 `current_rung` is only `always_confirm`,
  every `auto_post_at_rung_*` caps to `suggest_with_required_approval` (the v1 asymmetry).
  Post-v1 activation is a single-file body replacement per stub.

## 8. Decision F — ruleEvaluationService boundary (most consequential)

The append-only + dependency-direction interaction reshapes the naive "service writes the
log" reading:

- **`rule_evaluation_log` is append-only (INV-RULE-001)** and carries `effective_action`
  (gate output) + `disposition` (insert-time dispatch outcome). The gate runs *downstream*
  of MatchResult. So the log row **cannot** be written at MatchResult time and updated
  later (no UPDATE path).
- **ADR-0020 dependency direction:** `agent → services`, never `services → agent`. The
  gate is at `agent/policies/agent-ladder/`. So `ruleEvaluationService` (a service)
  **cannot call the gate**. The **orchestrator** (agent layer) coordinates.

**Resulting shape (lean):** split `ruleEvaluationService` into two methods —
1. `evaluate(proposal, ctx): MatchResult | EvaluationSkipped` — does step-1 trigger lookup
   + input assembly, calls the pure core `evaluate(rules, context)`, returns the
   MatchResult (or `EvaluationSkipped(reason)` for a defensively-caught ceiling/reversal
   class per §6.3). **No log write here** (effective_action not yet known).
2. `recordEvaluation(matchResult, effectiveAction, disposition, ctx): { id }` — the single
   append to `rule_evaluation_log`, called by the orchestrator *after* the gate. Keeps
   `ruleEvaluationService` the **sole writer** (single-writer discipline / INV-RULE-001).

Orchestrator flow: `ceilingCheck → ruleEvaluationService.evaluate → gate(matchResult,…) →
ruleEvaluationService.recordEvaluation(…, effective_action, disposition)`. For
`almost_match` (no winner → no gate → no dispatch), the append carries `effective_action =
null`, `disposition = null`. **Transaction boundary:** the log append is its own statement;
downstream `rule_track_records` counter updates (via `ruleTrackRecordService.recordEvaluation`)
are a separate mutating call — whether the log append + counter update share one transaction
is a design-spec question (lean: separate; the log is read-shaped/append-only, the counter
update is the mutating one and is independently audit-eligible per ADR-0024). Surface as a
sub-point. (Whether `recordEvaluation` belongs on `ruleEvaluationService` or a thin
orchestrator helper is a naming call; the *sole-writer* constraint is the load-bearing part.)

## 9. Decision G — ruleCreationOrchestrator shape

- **Signature:** `createVendorRule(input, ctx): { rule_id }` (or `create(...)`).
- **Transaction:** one transaction, all-or-nothing — `ruleRegistryService.create`
  (registry row **+** co-created `rule_track_records` row, the Ring 1 Decision-5 co-creation
  rule) then `vendorRuleService.create` (the `vendor_rules` child, composite FK). If
  `vendorRuleService.create` fails, the registry + track_records inserts roll back (single
  transaction). Each service stays sole-writer of its table; the orchestrator threads one
  client/transaction through both.
- **Scope:** vendor is the only Ring 1 materialization — the orchestrator handles only the
  vendor-rule path this arc. Non-vendor materializations inherit the registry-as-identity
  pattern later. No production caller wires it this arc (the agent conversational-drafting
  approval is Ring 2A-authoring); the orchestrator exists + is unit-testable against seeded
  inputs.

**Lean:** as above; the only real choice is whether co-creation lives in
`ruleRegistryService.create` (named co-creation deviation, per ADR-0023 Decision 5) or in
the orchestrator — ADR-0023 already ratified it on `ruleRegistryService.create`, so keep it
there; the orchestrator only adds the `vendor_rules` child in the same txn.

## 10. Decision H — Route handler shape

- **List route:** `GET /api/orgs/[orgId]/rules` — service-role client, `ctx.caller.org_ids.includes(orgId)`
  + `WHERE org_id = orgId`, joining `rule_registry ⋈ rule_track_records ⋈
  rule_evaluation_30d_view`. Response: per-rule rows with identity + rung/lifecycle badges +
  cumulative counters + 30-day windowed indicator + `last_winning_match_at`. Sort/filter as
  query params (`?sort=`, `?rung=`, `?lifecycle=`, `?health=`) per ADR-0024 Decision 5's
  list-view requirement.
- **Four row actions (controller-only):** promote / demote / rename / retire, each writing
  `rule_registry` via `ruleRegistryService`. **Shape question (→ OQ-4):** separate sub-routes
  (`POST /api/orgs/[orgId]/rules/[ruleId]/promote`, `…/demote`, `…/rename`, `…/retire`) vs a
  single mutation route with an `action` body param. Lean: **separate sub-routes** — cleaner
  per-action auth + payload typing, and RESTful-resource-action is the more legible
  convention. Verify against the existing mutation-route convention (e.g., how
  `journal-entries` / bills routes structure non-POST mutations) at design-spec time.
- **Auth:** the route-handler service-role + app-code org-scope pattern (the
  `document_cards_view` / cards-endpoint precedent); controller-grade actions check
  controller authority (RLS `user_is_controller` is the DB backstop; the route checks
  before dispatch).

## 11. Decision I — RuleRegistryView component structure

More elaborate than the read-only `OpenBillsView` precedent (sort/filter + mutations +
modal + detail surface). Decomposition:

- **List view** — `'use client'` + `fetch('/api/orgs/${orgId}/rules')` (the OpenBillsView
  fetch/loading/error/empty/data pattern), table with two badges (`current_rung`,
  `lifecycle_state`), 30-day indicator, `last_winning_match_at`, client-side or
  query-param sort/filter.
- **Row actions** — demote (one-click), rename (inline/modal), retire (confirm), promote
  (modal). Each POSTs to its row-action route, then refetches.
- **Detail surface** — behavior, not logic: track-record breakdown, recent matches (from
  `rule_evaluation_log`), last winning match, lifecycle anchors. **Not** Trigger/Condition/Action
  structure (Stage 2); **not** the Four Questions (chat surface, Ring 2A-authoring).
- **Inert promotion modal** — per ADR-0024 "intentionally disabled, not broken": the
  promote control opens a modal whose targets are disabled with a visible "promotion
  ceremony available post-v1 (rungs above Always Confirm not yet active)" affordance — a
  styled informational state, not a dead/erroring control. Exact copy is product/UX (OQ-6).

**Lean:** state management follows the OpenBillsView client-fetch idiom + mutation handlers
with refetch; verify the project's prevailing mutation-from-canvas pattern (optimistic vs
refetch) at design-spec time against the closest mutating canvas precedent (e.g.,
`PaymentApprovalQueueView`).

## 12. Decision J — Test fixture strategy

- **Pure-core unit tests** (`core/rules/` evaluator): in-memory `Rule[]` fixtures — typed
  objects, no DB. The deterministic pure function is tested input→output (predicate
  evaluators, branch first-match, conflict-resolution ordering, capping-table tiebreak).
- **Service + integration tests:** DB-seeded rules via **admin-client direct insert**,
  mirroring the `ruleCoreRlsIsolation` / `ruleEvaluationLogRlsIsolation` fixture pattern
  (per-run `crypto.randomUUID()`, `adminClient` seeds, `userClientFor` for RLS reads).
- **Shared fixtures module** — a `tests/fixtures/rules.ts` (or `core/rules/__fixtures__/`)
  with canonical seeded rules consumed by both unit and integration, so the in-memory rule
  objects and the DB-seeded rules derive from one source. Canonical example: the brief's
  *"Amazon office supplies under $500 → categorize as 5100"* pattern (a `field_equals`
  vendor + `field_in_range` amount primary branch), plus a guardrail example (the
  Spotify-$1,399 `field_outside_range` from §11.2) to exercise `guardrail_match`.

**Lean:** shared fixtures module; in-memory objects are the source, DB seeding inserts
them; one canonical primary-match rule + one guardrail rule + one almost-match scenario.

## 13. Decision K — Authoring arc scoping (meta)

**Lean: one design spec (Decisions A–J coherent), authoring split into multiple commits
along module seams.** The decisions are tightly coupled — the pure-core `MatchResult` shape
drives the gate input, the service boundary, the log-append columns, and the canvas's data
dependency — so splitting the *design spec* would fragment coupled decisions and risk the
exact spec-vs-disk drift the HEAD pass discipline guards against. One design spec keeps the
architecture coherent; the **authoring** splits into reviewable commits along clean module
boundaries:

1. `core/rules/` — types + predicate evaluators + conflict resolution + capping (pure;
   unit-tested in isolation).
2. `agent/policies/agent-ladder/` — gate + three inert stubs (imports core capping).
3. `services/rules/` — `ruleRegistryService`, `ruleTrackRecordService`, `vendorRuleService`,
   `ruleEvaluationService`, `ruleCreationOrchestrator` (+ integration tests).
4. `app/api/orgs/[orgId]/rules/` — list route + four row-action routes.
5. `components/canvas/RuleRegistryView.tsx` — canvas (+ component tests).

A sub-arc split (separate brainstorm→spec per seam) is defensible only if the design spec
surfaces genuinely independent decision spaces — but the F-layering finding (core ↔ gate ↔
service ↔ log) shows the seams are coupled, which argues for one coherent spec. The
commit-boundary split keeps reviewable units bounded without fragmenting the architecture.

## 14. Open questions

- **OQ-1 (Decision C, ratification):** the specificity **weight values**. §5.5 fixes the
  3-tier ordering and declares the table "owned by Ring 2 ratification, total." This arc
  assigns the values (lean: 3/2/1 by tier). Canon-setting — ratify explicitly.
- **OQ-2 (Decision E, verify):** does ADR-0020 Appendix A permit **agent→core import** (the
  gate importing `core/rules/capping.ts`)? If not, the shared capping table needs a
  boundary-legal home / service indirection. Resolve against Appendix A at the verification
  pass.
- **OQ-3 (Decision F, ratify):** confirm the **orchestrator-coordinated `evaluate → gate →
  recordEvaluation`** shape and the single-append timing (forced by append-only +
  dependency direction). Sub-point: does the log append share a transaction with the
  downstream `rule_track_records` counter update, or are they separate? (Lean: separate.)
- **OQ-4 (Decision H, verify):** row-action route shape — separate sub-routes (lean) vs
  single action-param route. Verify against the prevailing mutation-route convention.
- **OQ-5 (product/UX, carried from ADR-0024):** Q-RC-AT-2 indicator **UI label** — `last
  fired` / `last selected` / `last won` / `last decisive match`.
- **OQ-6 (product/UX, carried from ADR-0024):** the inert promotion-modal **copy** ("available
  post-v1" affordance) — intentionally-disabled styling, product/UX's call.
- **OQ-7 (Decision K, confirm):** ratify one-design-spec-multi-commit vs a sub-arc split
  before the next pass.

**Escalations before the next pass:** OQ-1 (weight values) and OQ-3 (the F-layering shape)
are the two that most shape the design spec — both worth chat resolution at the pre-ADR
verification pass. OQ-2 (import boundary) is a cheap disk check that gates Decision E's
capping placement. The rest can ride into the design spec as leans.

---

*Brainstorm. Next: a pre-ADR verification pass on OQ-1/2/3/4, then the Ring 2A-core
authoring design spec (one spec per Decision K). Not committed; not pushed.*
