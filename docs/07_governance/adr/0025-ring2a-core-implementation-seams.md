---
id: "0025"
title: "Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas"
status: ratified
date: "2026-05-26"
deciders: [phil]
modules: [db, agent, core]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0010", "0011", "0017", "0020", "0023", "0024"]
invariants: ["INV-RULE-002"]
---

# ADR-0025: Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas

## Status

Ratified 2026-05-26 by phil per the Ring 2A-core implementation-seams design spec
(`docs/09_briefs/post-mvp/specs/2026-05-26-adr-0025-ring2a-core-implementation-seams-design.md`,
V0.2 at `a209008c`) and the CTO chat-ratification of that design spec on
2026-05-26.

This ADR is **net-new implementation seams consuming the ADR-0024 substrate**. It
does **not** amend or supersede any prior ADR: ADR-0024's substrate
(`rule_evaluation_log`, the 30-day view, INV-RULE-001) and the high-level Ring
2A-core shape are ratified canon, consumed here and made concrete — not
relitigated. The `related` set records the ADRs these seams read from; none is
amended. `supersedes: []`.

**Amended 2026-05-26** (Ring 2A-core authoring rollout, Commit 1) to add
INV-RULE-002 to the frontmatter `invariants:` field, following its registration in
`invariants.md` / `ledger_truth_model.md` / `control_matrix.md` when the pure-core
evaluator + its determinism test landed. The frontmatter was `[]` at ratification
(no enforcement existed yet — the spec-without-enforcement rule); it now reflects
the registered invariant. INV-RULE-002 (evaluator determinism; Layer 2;
test-verified) is the **first of two** INV-RULE candidates this rollout registers —
the second, INV-RULE-003 (single-writer for `rule_evaluation_log`), is expected to
land an analogous amendment at Commit 3 close, when
`ruleEvaluationService.recordEvaluation` becomes the sole writer.

## Date

2026-05-26

## Triggered by

The Ring 2A-core implementation-seams pre-design chain, on `origin/staging`:
brainstorm (`db43fadc`, Decisions A–K + the F-layering reframe) → pre-ADR
verification (`6214c603`, OQ-2/OQ-3/OQ-4 grounded against disk) → verification
ratifications (`3016b8c2`, §11: OQ-1/3a/3b/3c/7 locked) → design spec V0.2
(`a209008c`, ratification-ready). ADR-0025 is authored from the cleared design spec
per the ADR-0021 §4 pre-ratification lifecycle (the V0.1 draft and the V0.2 review
patch — naming/scope, sequencing-vs-append, every-evaluation + skip semantics, and
the resolution of the V0.1-review-surfaced OQ-8/OQ-9 to decisions — both landed in
the `a209008c` commit).

## Context

ADR-0024 ratified the Ring 2A-core **substrate**: `rule_evaluation_log`,
`rule_evaluation_30d_view` (`security_invoker = true`), INV-RULE-001, and the
high-level core/gate/canvas boundary, atop the ADR-0023 Ring 1 registry substrate.
The schema is live, migrated (`20240164000000`), RLS-verified, and green at HEAD.

**ADR-0024 vs ADR-0025 boundary (substrate → seams).** ADR-0024 ratified the
*substrate and the high-level shape*. **ADR-0025 ratifies the *implementation
seams* that consume it** — the file homes, the `shared/rules/` types + capping
table, the five `services/rules/` APIs, the four row-action route handlers, the
permission-catalog change, the canvas action patterns, and the five-commit
authoring rollout. It adds **no new domain tables**: only an atomicity RPC
(Decision 6) and a permissions seed (Decision 9). Naming the arc "Authoring" would
invite a misread — the conversational rule-*authoring* path (agent drafting →
approval → create) is the separate later **Ring 2A-authoring** arc, which depends
on the Logic Receipt write path (INV-AGENT-002) as a Tier-1 prerequisite. The
CTO-settled **H = split** holds: this ADR is Ring 2A-**core** scope only.

**Modules taxonomy note (forward-flag).** V0.2 framed the `modules` frontmatter as
`[db, agent, core, shared]`, reflecting that this ADR's implementation seams touch
`shared/rules/`. A disk check found `shared` is **not** a registered token in
`docs/02_specs/taxonomy.md` Modules (the lint vocabulary covers domain-layer
modules — `accounting`, `agent`, `core`, `db`, `document-platform`, etc. — not
cross-layer primitive folders like `shared/` or `contracts/`). The frontmatter
therefore omits `shared`, matching ADR-0024's `[db, agent, core]`. The
`shared/rules/` work is fully described in Decisions 3 and 5; only the frontmatter
taxonomy can't represent it. This is the same shape of taxonomy gap V0.2 flagged
for app-components (no token for `apps/web/src/components/`); both gaps want a
future taxonomy-vocabulary hygiene pass that decides how Modules should represent
cross-layer folders. Flagged, not fixed here (a vocabulary change is governance
work that wants its own pass, not a rider on a ratification commit).

**Disk-grounded corrections folded in.** The pre-ADR verification and the V0.1
review found four points where the brainstorm/brief framing was wrong against disk;
each correction is load-bearing and carried into the decisions: (1) the capping
table cannot live in `core/` and be gate-imported — `agent ↛ core` is forbidden, so
it lives in `shared/rules/` (Decision 3); (2) the project has no service-layer
transaction threading — multi-table atomicity is an RPC concern (Decision 6); (3)
the canvas has no confirm-dialog convention — destructive actions use an inline
warning + red button (Decision 10); (4) boundary-crossing evaluation types cannot
live in `core/` for the same reason as the capping table, so they live in
`shared/rules/types.ts` (Decision 5).

## Decision

### 1. Pure-core Rule / Branch / Condition types at `core/rules/types.ts`

Plain TypeScript types; pure, in-memory only. **No predicate-storage substrate**
this arc (ADR-0023 / ADR-0024 Non-decision): the service layer assembles `Rule[]`
from `rule_registry` rows; Branch/Condition are typed fixtures / service-assembled
objects.

- `Rule`: `id`, `org_id`, `rule_type`, `current_rung` (`rule_autonomy_rung`,
  default `always_confirm`), `lifecycle_state` (`rule_lifecycle_state`), `name`
  (nullable), lineage anchors (`promoted_at`, `demoted_at`, `retired_at`,
  `created_at`), `branches: Branch[]`.
- `Branch`: `branch_order`, `branch_type` (`primary | otherwise_if`),
  `applies_to_evaluation_triggers`, `applies_to_source_triggers` (the §6.1 step-2
  branch-level filter), `max_outcome_action` (`action_type`), `conditions:
  Condition[]`.
- `Condition`: `condition_type`, `condition_order`, target-field reference, typed
  `condition_value`.
- `EvaluationContext` (the proposal's typed fields + source trigger) stays here.

**Boundary-crossing types live in `shared/rules/types.ts`, not here** —
`MatchResult` (§5.7), `EvaluationSkipped`, and the shared enums `ActionType` /
`RuleAutonomyRung` (Decision 5 / Correction 4). `Rule`, `Branch`, `Condition`,
`EvaluationContext` stay in `core/rules/types.ts` (used by `core` and, via the
legal `services → core` edge, by `ruleEvaluationService`). Zod schemas are reserved
for the persistence boundary (`shared/schemas/rules/`) at a future Branch-substrate
ring — not authored here. Migration: none.

### 2. Predicate evaluator registry at `core/rules/predicates.ts`

A `Record<ConditionType, { evaluate, specificityWeight }>` map co-locating each
pattern evaluator with its specificity weight (the §5.5 closed condition library).
Pure; no I/O.

- **Specificity weights as named constants (OQ-1, ratified):**
  `SPECIFICITY_CLOSED_SET = 3`, `SPECIFICITY_RANGE = 2`, `SPECIFICITY_PATTERN = 1`.
- **Six v1 pattern entries:** `field_equals` (3), `field_in_set` (3),
  `source_trigger_equals` (3), `field_in_range` (2), `field_outside_range` (2),
  `field_matches_pattern` (1). Each `evaluate: (conditionValue, contextFieldValue)
  → boolean`.
- **Ring 2B extensibility:** temporal/inferential predicates
  (`category_classification_matches`, `semantic_match_above_threshold`) are added
  as new map entries with weight constants honoring §5.5's tier ordering (closed-set
  3, range/threshold 2). Re-numbering is reserved for a future tier-insertion need.

Migration: none.

### 3. Capping table at `shared/rules/capping.ts` (OQ-2 boundary resolution)

The §6.1 step-3 capping table is needed in two layers — the pure core (step-3
tiebreak) and the Agent Ladder gate (step-7 authoritative). The brainstorm assumed
it could live in `core/rules/` and be gate-imported; **disk refuted that**: ADR-0020
Appendix A forbids `agent → core` (Block 1 omits `core` from `agent`'s allow-list;
the `agent-first-import-boundaries` ESLint rule is live at `'error'`). Both `core`
and `agent` *may* import `shared/`, and `shared/` already holds pure helpers
(`tabTitleForDirective`), so the capping table lives at **`shared/rules/capping.ts`**
— a pure module importing nothing outside `shared/`.

`cap(maxOutcomeAction: ActionType, currentRung: RuleAutonomyRung): ActionType`
implements §6.1 step 3's ratified 9-row table verbatim (canon — not derived):

| `max_outcome_action` | `current_rung` | capped action |
|---|---|---|
| `auto_post_at_rung_3` | `silent_auto` | `auto_post_at_rung_3` |
| `auto_post_at_rung_3` | `notify_and_auto_post` | `auto_post_at_rung_2` |
| `auto_post_at_rung_3` | `always_confirm` | `suggest_with_required_approval` |
| `auto_post_at_rung_2` | `silent_auto` | `auto_post_at_rung_2` |
| `auto_post_at_rung_2` | `notify_and_auto_post` | `auto_post_at_rung_2` |
| `auto_post_at_rung_2` | `always_confirm` | `suggest_with_required_approval` |
| `suggest_with_required_approval` | any | `suggest_with_required_approval` |
| `route_to_exception_queue_with_reason` | any | `route_to_exception_queue_with_reason` |
| `block_with_reason` | any | `block_with_reason` |

**v1 asymmetry:** since v1 `current_rung` is only `always_confirm`, every
`auto_post_at_rung_*` caps to `suggest_with_required_approval`. Migration: none
(application logic; correctly absent from the DB).

### 4. Pure-core evaluator at `core/rules/`

Files: `types.ts` (Decision 1), `predicates.ts` (Decision 2), `branchEvaluator.ts`,
`conflictResolver.ts`, `evaluator.ts`. Entry point (pure, deterministic,
reproducible byte-for-byte per §7):

`evaluate(rules: Rule[], context: EvaluationContext): MatchResult`

- **Branch evaluation (§6.1 step 2):** walk branches in `branch_order`,
  first-match-wins (`primary`, then `otherwise_if`); filtered by
  `applies_to_evaluation_triggers` and `applies_to_source_triggers`; conditions
  AND'd in `condition_order`.
- **Conflict resolution (§6.1 step 4, ratified per Decision C):** (4a) specificity
  = **sum** of the matched branch's condition weights (Decision 2); (4b) tie → most
  conservative `tiebreak_effective_action` (compute via `cap()`, Decision 3:
  `block_with_reason` > `route_to_exception_queue_with_reason` >
  `suggest_with_required_approval` > `auto_post_at_rung_2` > `auto_post_at_rung_3`);
  (4c) tie → most-recently activated/promoted (`COALESCE(promoted_at, created_at)`
  descending); (4d) → stable `id` UUID order. Total ordering.
- **`MatchResult` (§5.7):** `winning_rule_id`, `winning_branch`,
  `winning_branch_type` (`primary | guardrail`), `winning_branch_max_action`,
  `match_classification` (`primary_match | guardrail_match | almost_match`),
  `also_matched_rules`, `almost_match_rules` (`rule_id`, `closest_branch_id`,
  `failed_conditions`), `track_record_snapshot`, `four_questions_population`,
  `evaluation_trace`. **No `effective_action`** — the load-bearing pure-core-vs-gate
  separation (§6.1.1); the core may compute `tiebreak_effective_action` internally
  for ordering (4b) but does not propagate it as authoritative.
- **Imports:** `shared/rules/capping.ts` and `shared/rules/types.ts` only. No DB, no
  services, no agent. ESLint `agent-first-import-boundaries` (`'error'`) guards this.

Migration: none.

### 5. Agent Ladder gate at `agent/policies/agent-ladder/` (OQ-9 boundary resolution)

Files: `gate.ts`, `stubs.ts`. Orchestrator-layer (reads canonical rung/limit state).

`gate(matchResult: MatchResult, ruleRegistryRow: RuleRegistryRow, limitContext:
LimitContext): ActionType`. Sequential composition (§6.1 step 7):
`cap(matchResult.winning_branch_max_action, ruleRegistryRow.current_rung)` →
`checkPerTransactionLimit` → `checkDailyAggregate` → `checkTrackRecordHealth` →
`effective_action`.

**Three inert stubs** (`stubs.ts`), each `(action: ActionType, ctx: LimitContext) →
ActionType` returning the input unchanged with an explicit `// activates post-v1`
marker; post-v1 activation is a single-file body replacement. At v1 the gate's
output equals `cap(max, rung)`.

**Imports are boundary-forced (Correction 4 — resolves V0.1-review OQ-9).** The gate
needs `cap()` plus `MatchResult` / `ActionType` / `RuleAutonomyRung`. `agent ↛ core`
**and** `agent ↛ db` (ADR-0020 Block 1), so the gate cannot import these from
`core/rules/types.ts` or the generated `db/types.ts`. The **boundary-crossing
evaluation types therefore live in `shared/rules/types.ts`**, alongside
`shared/rules/capping.ts` — importable by `core` (its `evaluate()` return type),
`agent` (the gate's input + `ActionType` output), and the capping module itself.
**This is the identical boundary problem OQ-2 resolved for the capping table — same
boundary (`agent ↛ core`), same resolution (`shared/rules/`).** `contracts/` is not
the home: it is conventionally for cross-service type *contracts* at API/RPC
boundaries, whereas the boundary crossed here is the `agent ↛ core` *import*
boundary (a category mismatch); splitting capping from types across two homes would
fragment one coherent rule-evaluation-grammar module. The gate imports **only** from
`shared/`. Migration: none.

### 6. Services at `services/rules/` (five services + one atomic RPC)

`services/rules/` is the correct greenfield home (`services/` is `<domain>/`
subdirectories; no `rules/` yet). All obtain `adminClient()` internally; signature
`async fn(input, ctx: ServiceContext): Promise<T>`. Each service is the sole writer
of its table.

- **`ruleRegistryService`** — sole writer of `rule_registry` for **lifecycle
  mutations**: `promote(rule_id, target_rung, ctx)`, `demote(rule_id, ctx)`,
  `rename(rule_id, name, ctx)`, `retire(rule_id, ctx)` (single-table UPDATEs setting
  the matching lineage anchor + actor column); read methods for canvas joins.
- **`ruleTrackRecordService`** — sole updater of `rule_track_records`:
  `recordEvaluation(rule_id, classification, disposition, ctx)` (counter increments
  + `last_*_at` stamps per disposition outcome; service-role write); counter reads.
- **`vendorRuleService`** — sole writer of `vendor_rules`: `create(rule_id, org_id,
  vendor_id, default_account_id, bundle_type, ctx)` (single-table child insert;
  composite FK to `rule_registry`). Post-`20240163` columns only — `autonomy_tier` /
  `created_*` live on the parent registry (class-table-inheritance), `bundle_type`
  is the step-e addition.
- **`ruleEvaluationService`** — sole writer of `rule_evaluation_log` (INV-RULE-001).
  **Two methods (OQ-3c, ratified):**
  - `evaluate(proposal, ctx): MatchResult | EvaluationSkipped` — §6.1 step-1
    trigger-index lookup + input assembly (read `rule_registry` candidates +
    `rule_track_records` snapshot), calls pure-core `evaluate(rules, context)`,
    returns `MatchResult` — or `EvaluationSkipped(reason = system_ceiling_class)` for
    ceiling/reversal-class proposals (§5.6 / §6.3 defensive guard). **No log write.**
  - `recordEvaluation(matchResult, effectiveAction, disposition, ctx): { ids }` —
    appends to `rule_evaluation_log`. **Ownership split:** this service owns the
    *append operation* (the table write); it does **not** own the decision of *when*
    to append — that sequencing is the orchestrator's (Decision 7). **`recordEvaluation`
    must not collapse into `evaluate`** for "atomicity": the row needs
    `effective_action`, which exists only *after* the gate runs.
- **`ruleCreationOrchestrator`** — `createVendorRule(input, ctx): { rule_id }`.
  All-or-nothing creation of `rule_registry` (parent) + `rule_track_records`
  (co-created, ADR-0023 Decision 5) + `vendor_rules` (child) via a **new atomic RPC**
  `create_vendor_rule_atomic(p_registry, p_track_record, p_vendor_rule)` doing all
  three inserts in one DB transaction — mirroring `write_journal_entry_atomic`. This
  is the project's only multi-table atomicity primitive; there is **no service-layer
  transaction threading** (Correction 1 — resolves V0.1-review OQ-8). No production
  caller wires the orchestrator this arc (the conversational-drafting approval is
  Ring 2A-authoring); it exists + is integration-testable against seeded inputs.

**Logging semantics (every-evaluation; ADR-0024 carry-forward, made explicit).**
`rule_evaluation_log` is **row-per-candidate-rule**, not row-per-proposal: a proposal
evaluated against N candidate rules (trigger matched) writes **N rows** sharing one
`trace_id`, with winner-attribute columns (`winning_branch_type`,
`winning_branch_max_action`, `effective_action`, `disposition`) populated on the
winning row and **null on non-winners**. `recordEvaluation` expands the `MatchResult`
(winner + `also_matched` + `almost_match`) into that row set in one statement. It is
**not** row-per-condition or row-per-branch — branch/condition detail lives inside
`evaluation_trace` (jsonb). A proposal with **zero candidate rules** (no trigger
match) writes **no row** (`rule_id` is `NOT NULL` per ADR-0024; a synthetic
"no-rule" row would force a nullable `rule_id` or a sentinel, both rejected) — "no
rules triggered" is captured by the proposal pipeline's own audit trail. A pure
`almost_match` evaluation (no winner → no gate → no dispatch) writes its candidate
rows with `effective_action = null`, `disposition = null`.

**`EvaluationSkipped` is not logged** to `rule_evaluation_log` this arc. The schema's
`match_classification` CHECK (`primary_match | guardrail_match | almost_match`) has
no skip value, and ceiling handling is an upstream concern (the proposal pipeline /
agent-ladder ceiling check) — `EvaluationSkipped` here is a defensive guard, not a
logged event. A future ADR may extend the schema if ceiling-skip visibility becomes
useful.

**Migration (Commit 3): one** — `create_vendor_rule_atomic` RPC (`SECURITY DEFINER`,
service-role-callable; three inserts in one transaction). No new tables.

### 7. Orchestrator-coordinated `evaluate → gate → recordEvaluation` flow

Home: `agent/policies/agent-ladder/ruleEvaluationOrchestrator.ts` (agent layer —
**must** live here because `services ↛ agent`, so a service cannot call the gate).
`evaluateAndDispatch(proposal, ctx): EvaluationDispatchResult`. Flow:

`ceilingCheck → ruleEvaluationService.evaluate → gate(matchResult, …) →
ruleEvaluationService.recordEvaluation(…, effective_action, disposition) →
ruleTrackRecordService.recordEvaluation(…)`.

The shape is **forced, not chosen**, by three independent constraints: (1)
`MatchResult` carries no `effective_action` (§5.7) → the log cannot be written at
evaluate-time; (2) INV-RULE-001 append-only → no UPDATE → a single append *after*
the gate; (3) ADR-0020 `services ↛ agent` → the service cannot call the gate → the
orchestrator (agent layer) coordinates.

**Ownership split (the load-bearing distinction).** The orchestrator owns
*sequencing* — *when* each step fires, and specifically that the append happens
*after* the gate. `ruleEvaluationService.recordEvaluation` owns the *append
operation*. Keeping these separate prevents the append from migrating back into
`evaluate`; the sole-writer property is orthogonal to — and does not imply — that
the service decides *when* to write.

**Transaction boundary (OQ-3a, ratified): separate.** The `recordEvaluation` log
append is its own statement; the `ruleTrackRecordService.recordEvaluation` counter
update is a separate mutating call (independently audit-eligible). If the log append
succeeds and the counter update fails, the log is source-of-truth and counters are
reconcilable from the log corpus. Migration: none.

### 8. Logic Receipt reconciliation (OQ-3b Path A)

`rule_evaluation_log` (INV-RULE-001) is the concrete realization of the abstract
"Logic Receipt" surface that `rule-type-core.md` §5.7 names. **INV-AGENT-002** was
reserved at the spec level before the substrate landed and **remains reserved** for
the broader cross-agent Logic Receipt concern serving Ring 2A-authoring (a Tier-1
prerequisite); `rule_evaluation_log` is the rule-core-specific append, not the
entirety of the Logic Receipt. The `rule-type-core.md` §5.7 prose amendment
(updating "recorded on the Logic Receipt per INV-AGENT-002" to reflect this
relationship) is **forward-flagged for future doc-hygiene, not this arc**.

### 9. Route handlers at `app/api/orgs/[orgId]/rules/`

- **List route** `GET /api/orgs/[orgId]/rules/route.ts`. Service-role client;
  `ctx.caller.org_ids.includes(orgId)` + `WHERE org_id = orgId`. Joins
  `rule_registry ⋈ rule_track_records ⋈ rule_evaluation_30d_view`. Response per rule:
  identity, `current_rung` + `lifecycle_state` badges, cumulative counters, 30-day
  windowed indicators, and the winning-match timestamp **from
  `rule_track_records.last_winning_match_at`** (the Q-RC-AT-2 column already
  provisioned at Ring 1 — no view amendment). Sort/filter as query params (`?sort=`,
  `?rung=`, `?lifecycle=`, `?health=`).
- **Four row-action sub-routes** (OQ-4 confirmed: separate sub-routes, not an
  `action`-param route) under `/api/orgs/[orgId]/rules/[ruleId]/`: `promote/`,
  `demote/`, `rename/`, `retire/`. Each follows the established mutation-route
  pattern: extract URL params → parse a `.strict()` Zod input spreading `…json` over
  params → `buildServiceContext(req)` → `withInvariants(ruleRegistryService.<verb>, {
  action: 'rule.<verb>' })(parsed, ctx)` → `NextResponse.json(result, { status: 200
  })`. Controller-grade authority: `withInvariants` checks `rule.<verb>` via
  `canUserPerformAction`; RLS `user_is_controller` on `rule_registry` is the DB
  backstop.
- **Permissions = migration + count-drift discipline (Commit 4, atomic; Correction
  2).** Add `rule.promote` / `rule.demote` / `rule.rename` / `rule.retire` to
  `ACTION_NAMES` (`apps/web/src/services/auth/canUserPerformAction.ts`, 30 → 34); a
  permissions seed migration (template `20240140000000_bill_action_permissions.sql`)
  inserting four `permissions` rows + `role_permissions` rows (**controller only** —
  rule governance is controller authority; `ap_specialist` / `executive` get none);
  CA-27 parity auto-passes; bump CA-28 (`permissionCatalogSeed.test.ts`, ~5 hardcoded
  sites: total 30 → 34, controller count, exact-set list) and CA-37
  (`crossOrgRlsIsolation.test.ts` RLS-surface counts) — **all in the same commit**,
  per the Permission Catalog Count Drift convention.

**Migration (Commit 4): one** — the `rule.*` permissions seed.

### 10. `RuleRegistryView` Stage 1 canvas

Component `apps/web/src/components/canvas/RuleRegistryView.tsx` (the `OpenBillsView`
read-view shape).

- **List view** — `'use client'` + `fetch('/api/orgs/${orgId}/rules')` (the
  fetch/loading/error/empty/data idiom); table with `current_rung` &
  `lifecycle_state` badges (two separate badges), 30-day indicators,
  `last_winning_match_at`, sort/filter.
- **Row actions** — raw `fetch()` POST to each sub-route, then **refetch the list**
  on success (Correction 3: the rule persists in the registry, so refetch-in-place,
  not navigate-away; no optimistic update). Inline error (`border-red-300 bg-red-50`,
  no toast lib); `401` → sign-in redirect; `400 {details}` → field errors.
  - `demote` / `retire` → inline **amber warning banner + red high-friction button**
    (the `BillReverseCard` pattern), **not a confirm modal** — the project has no
    confirm-dialog convention.
  - `rename` → inline edit / small form.
  - `promote` → opens the **inert promotion-ceremony modal** ("intentionally
    disabled, not broken" per ADR-0024) — targets disabled with a visible "available
    post-v1" affordance. This is a ceremony surface, *not* a confirm dialog.
- **Detail surface — behavior, not logic:** track-record breakdown, recent matches
  (from `rule_evaluation_log`), last winning match, lifecycle anchors. **Not**
  Trigger/Condition/Action structure (Stage 2); **not** the Four Questions (chat
  surface, Ring 2A-authoring).
- **Open placeholders (product/UX):** OQ-5 indicator label — the winner-only
  timestamp is already free via `rule_track_records.last_winning_match_at`, so any
  winner-only label costs zero substrate work ("last evaluated" uses the 30d-view
  aggregate); OQ-6 inert-modal copy. Both resolve in or before Commit 5; neither
  blocks Commits 1–4.

Migration: none.

### 11. Test fixtures and integration scope

- **Shared fixtures** — `apps/web/tests/fixtures/rules.ts` (verify co-location vs
  `core/rules/__fixtures__/` at authoring). In-memory `Rule[]` objects are the
  source; DB-seeding derives from them. Canonical: one **primary-match** rule
  (`field_equals vendor=Amazon` + `field_in_range amount=[0,500]` → categorize 5100);
  one **guardrail** rule (`field_outside_range`, the §11.2 Spotify-$1,399 →
  `guardrail_match`); one **almost-match** scenario (trigger matches, no branch
  matches).
- **Pure-core unit tests** (Vitest, in-memory): six predicate evaluators; branch
  first-match; conflict resolution (specificity sum, conservatism, recency, UUID);
  capping (9 rows + tiebreak path).
- **Service integration tests** (admin-client direct seed; the substrate cycle's
  `ruleCoreRlsIsolation` / `ruleEvaluationLogRlsIsolation` RLS-isolation pattern):
  each of the five services; the `create_vendor_rule_atomic` RPC all-or-nothing
  (incl. rollback-on-child-failure).
- **Route tests** — cross-org RLS isolation + controller-only authorization for each
  of the four row-action routes (controller passes; non-controller and cross-org
  denied).
- **Component tests** — `RuleRegistryView` (jsdom + RTL, per the Phase 8
  component-test infra precedent).

## Migration outline

ADR-0025 ships **two small migrations** (no new domain tables); ordered DDL outlines,
not executable SQL (separate authoring within the rollout commits):

**Commit 3 — `create_vendor_rule_atomic` RPC.** A `SECURITY DEFINER`,
service-role-callable function inserting, in one transaction: the `rule_registry`
parent row, the co-created `rule_track_records` row (ADR-0023 Decision 5), and the
`vendor_rules` child row (composite FK to `rule_registry`). Mirrors
`write_journal_entry_atomic`. Rolls back all three on any failure (the
orphaned-`rule_registry`-row integrity gap is the reason atomicity is required).

**Commit 4 — `rule.*` permissions seed.** Insert four rows into `permissions`
(`rule.promote`, `rule.demote`, `rule.rename`, `rule.retire`) + `role_permissions`
rows granting them to **controller** only. Template:
`20240140000000_bill_action_permissions.sql`. Lands atomically with the `ACTION_NAMES`
constant addition and the CA-28 / CA-37 count bumps (Permission Catalog Count Drift
convention). The `.claude/rules/migrations.md` substrate-mod test-staleness review
fires at authoring time.

## Authoring rollout (five module-seam commits)

One ADR (Decisions 1–11); authoring lands across five reviewable commits along clean
module boundaries (OQ-7 ratified). The full integration suite is each commit's
verification gate (substrate-cycle precedent).

1. **`shared/rules/` foundations + `core/rules/` pure core.** `shared/rules/types.ts`
   (boundary-crossing types, Decision 5) + `shared/rules/capping.ts` (Decision 3)
   land **here** — `core` imports both (the conflict resolver's step-4b tiebreak
   calls `cap()`), so they must precede `core`. Then `core/rules/` (`types`,
   `predicates`, `branchEvaluator`, `conflictResolver`, `evaluator`) + unit tests.
2. **`agent/policies/agent-ladder/` gate + inert stubs** + unit tests. Imports the
   already-landed `shared/rules/` modules.
3. **`services/rules/` (five services) + `create_vendor_rule_atomic` RPC migration**
   + service integration tests.
4. **`app/api/orgs/[orgId]/rules/…` list + four row-action routes + `rule.*`
   permissions seed migration** (atomic with `ACTION_NAMES` + CA-28 / CA-37 bumps) +
   route RLS tests.
5. **`components/canvas/RuleRegistryView.tsx`** + component tests + inert promotion
   modal. OQ-5 / OQ-6 product/UX resolutions land here (or just before).

## Non-decisions

This ADR explicitly does **not**:

- Author predicate-storage substrate (Branch/Condition persistence) — a future
  Branch-substrate ring / Ring 2B; the evaluator evaluates typed inputs handed in by
  the service layer and must not invent a predicate-storage shape.
- Author temporal or inferential evaluators (`category_classification_matches`,
  `semantic_match_above_threshold`) — Ring 2B.
- Author the agent conversational-drafting path — Ring 2A-authoring.
- Author the Logic Receipt write path / register INV-AGENT-002 — a Tier-1
  prerequisite serving Ring 2A-authoring.
- Amend `rule-type-core.md` §5.7 prose — future doc-hygiene (OQ-3b Path A
  forward-flag).
- Define the refinement loop (Ring 3, §9.3).
- Wire a production caller for `ruleCreationOrchestrator` or `evaluateAndDispatch` —
  both exist + are test-only this arc (the hot-path wiring is Ring 2A-authoring /
  pipeline integration).
- Register any INV in `invariants.md` (none established here; INV-RULE-001 is
  consumed, registered at ADR-0024).
- Add a `shared` module token to `taxonomy.md`, or otherwise change the module
  vocabulary — the taxonomy gap is flagged (Context), not fixed here.
- Sync ADR-0020's stale ESLint-severity ratification note (`'off'` vs the live
  `'error'`) — a forward-flag only.

## Consequences

**Enables.** A complete, deterministic, unit-tested rule-evaluation core; an Agent
Ladder gate whose three limit dimensions are inert-but-defined (post-v1 activation =
body replacement); five `services/rules/` with single-writer discipline and an
INV-RULE-001-respecting append; a controller-governed rule-registry management
surface (list + promote/demote/rename/retire); the Stage 1 canvas. Ring 2A-authoring
inherits a live evaluation path to wire conversational drafting onto.

**Constrains.** The capping table is canon in one place (`shared/rules/capping.ts`)
consumed by two layers — any §6.1-step-3 change is single-source. The forced
`evaluate → gate → recordEvaluation` layering means the orchestrator (agent layer)
is the only legal coordinator; services stay free of agent dependencies. The
atomic-create RPC is the only all-or-nothing rule-creation path.

**Costs.** Two small migrations (atomicity RPC + permissions seed) — neither a new
domain table. The Permission Catalog count-drift discipline (CA-28 / CA-37) adds
mechanical edits to Commit 4. Boundary-crossing types and the capping table land in
`shared/rules/`, which the `modules` taxonomy cannot tag (the documented gap). Five
module-seam commits is more ceremony than a single drop, but each is independently
reviewable / rollback-able (the F-coupling argued against a sub-arc split, not
against commit seams).

## Alternatives considered

- **Capping table in `core/rules/` with the gate importing it** (the brainstorm's
  lean). Rejected against disk: `agent ↛ core` is forbidden (ADR-0020 Block 1; ESLint
  `'error'`). `shared/rules/` is the both-importable home (Decision 3).
- **Boundary-crossing types in `core/rules/types.ts`** (the brief's assumption).
  Rejected for the same reason, plus `agent ↛ db` (so the `db/types.ts` enum surface
  is also unreachable from the gate). `shared/rules/types.ts` (Decision 5).
- **`contracts/` as the home for the evaluation types** (OQ-9 alternative). Rejected:
  `contracts/` is for API/RPC type contracts, not the `agent ↛ core` import boundary;
  splitting capping from types fragments one module.
- **Service-layer transaction threading for rule creation** (the brief's "thread one
  client" framing). Rejected: the project has no such pattern; multi-table atomicity
  is an RPC (`write_journal_entry_atomic` precedent). Decision 6.
- **Non-atomic sequential writes + idempotency for creation** (the
  `billService.recordPayment` precedent). Rejected: idempotency is retry-shaped, but
  rule creation isn't (a duplicate create is a duplicate-*rule* problem, not an
  idempotent no-op), and an orphaned `rule_registry` row from a failed `vendor_rules`
  insert is a real integrity gap.
- **A confirm-dialog for destructive row actions.** Rejected: the project has no
  confirm-modal convention; the inline warning + red button (`BillReverseCard`) is
  the idiom. The inert *promotion* modal is a distinct artifact (a disabled ceremony
  surface), not a confirm dialog.
- **`modules: [db, agent, core, shared]`** (V0.2's planned frontmatter). Rejected:
  `shared` is not a `taxonomy.md` module token; including it fails `adr:lint`. The
  gap is flagged for a future taxonomy-vocabulary pass.
- **Logging `EvaluationSkipped` to `rule_evaluation_log`.** Rejected: the
  `match_classification` CHECK has no skip value, ceiling handling is upstream, and
  the skip is a defensive guard, not an evaluation event.
- **A single `rule_evaluation_log` row per proposal** (row-per-proposal). Rejected:
  ADR-0024's substrate is row-per-candidate-rule (N rows, winner attrs null on
  non-winners); the canvas/30d-view aggregates depend on it.

## Open questions

Carried forward for product/UX (parallel; non-blocking for Commits 1–4):

1. **OQ-5 — Q-RC-AT-2 UI label.** Pick from `last fired` / `last selected` / `last
   won` / `last decisive match` (or "last evaluated"). The data is settled: a
   winner-only label reads `rule_track_records.last_winning_match_at` directly (zero
   substrate work); "last evaluated" uses the 30d-view aggregate. Recorded at canvas
   implementation (Commit 5).
2. **OQ-6 — inert promotion-modal copy.** The "available post-v1" affordance wording;
   product/UX's call, deferrable to Commit 5.

*(All CTO-ratification questions are resolved: OQ-1 / OQ-3a / OQ-3b / OQ-3c / OQ-7 at
§11 ratifications; the V0.1-review-surfaced OQ-8 (atomic RPC, Decision 6) and OQ-9
(`shared/rules/types.ts`, Decision 5) resolved to decisions in V0.2.)*

## Cross-references

- `docs/09_briefs/post-mvp/specs/2026-05-26-adr-0025-ring2a-core-implementation-seams-design.md`
  — the design spec this ADR ratifies (V0.2 at `a209008c`); preserved as historical
  reference per ADR-0021 §4.
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-core-authoring-brainstorm.md` — leans
  (db43fadc, point-in-time).
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-core-authoring-pre-adr-verification.md`
  — the pre-ADR verification (`6214c603`) + §11 ratifications (`3016b8c2`): OQ-2 →
  `shared/rules/`, OQ-3 forced layering, OQ-4 route convention, §5.7/INV-AGENT-002
  reconciliation.
- **ADR-0024** ([`./0024-ring2a-core.md`](./0024-ring2a-core.md)) — the Ring 2A-core
  substrate these seams consume (`rule_evaluation_log`, the 30d view, INV-RULE-001,
  the high-level core/gate/canvas boundary). **Not amended.**
- **ADR-0023** ([`./0023-rule-type-core-substrate.md`](./0023-rule-type-core-substrate.md))
  — Ring 1 substrate (`rule_registry`, `rule_track_records`, `vendor_rules` composite
  FK + `bundle_type`; Decision 5 co-creation; nine enums). **Not amended.**
- **ADR-0007** ([`./0007-three-tier-agent-architecture.md`](./0007-three-tier-agent-architecture.md))
  §Tier 1 — Logic Receipt ownership (INV-AGENT-002), a Tier-1 prerequisite for Ring
  2A-authoring, not this arc (Decision 8).
- **ADR-0010** ([`./0010-reserved-enum-states.md`](./0010-reserved-enum-states.md)) —
  reserved-enum-states discipline (the inert gate stubs + v1-active rung subset).
- **ADR-0011** ([`./0011-document-platform.md`](./0011-document-platform.md)) §1 —
  the canonical `recordMutation` / INV-AUDIT-001 audit writer, against which the
  one-write evaluation-log posture is read.
- **ADR-0017** ([`./0017-vendor-template-substrate.md`](./0017-vendor-template-substrate.md))
  — `vendor_rules` substrate; `vendorRuleService` (Decision 6) is its sole writer.
  **Not amended.**
- **ADR-0020** ([`./0020-agent-first-authority-gradient-source-architecture.md`](./0020-agent-first-authority-gradient-source-architecture.md))
  — Authority Gradient + Appendix A import boundaries: the `agent ↛ core` / `agent ↛
  db` constraints forcing Decisions 3 and 5, and the `services ↛ agent` constraint
  forcing Decision 7. (Forward-flag: the ratification note's `'off'` ESLint severity
  is stale; live config is `'error'`.)
- `docs/02_specs/rule-type-core.md` — §5.4 (trigger roles), §5.5 (specificity
  ordering), §5.6 (System-ceiling skip), §5.7 (`MatchResult`; the "Logic Receipt"
  prose reconciled in Decision 8), §6.1 (evaluation ordering + capping table +
  §6.1.1 pure-core/gate separation), §6.3 (reversal defensive guard), §7 (purity
  contract).
- `docs/02_specs/invariants.md` — INV-RULE-001 (registered at the ADR-0024 migration
  arc); consumed here, none registered.
- **ADR-0021** ([`./0021-adr-frontmatter-and-tooling.md`](./0021-adr-frontmatter-and-tooling.md))
  §4 — the pre-ratification design-spec lifecycle this ADR follows.
