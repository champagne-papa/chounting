---
id: "0024"
title: "Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate"
status: ratified
date: "2026-05-26"
deciders: [phil]
modules: [db, agent, core]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0010", "0011", "0017", "0020", "0023"]
invariants: []
---

# ADR-0024: Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate

## Status

Ratified 2026-05-26 by phil per the Ring 2A-core design spec
(`docs/09_briefs/post-mvp/specs/2026-05-26-adr-0024-ring2a-core-design.md`,
V0.1 at `29a92a92`) and the CTO chat-ratification of that design spec on
2026-05-26.

This ADR is **net-new substrate plus consumer wiring**. It does **not** amend or
supersede any prior ADR: ADR-0023's substrate (the registry, track-record, enum,
and `vendor_rules` reconciliation) is ratified canon and is consumed here, not
relitigated. The `related` set records the ADRs Ring 2A-core reads from; none is
amended.

## Date

2026-05-26

## Triggered by

The Rule Type Core substrate ratified at ADR-0023 (`docs/07_governance/adr/0023-rule-type-core-substrate.md`):
`rule_registry`, `rule_track_records`, the nine enums, the `vendor_rules`
reconciliation, and the `org_settings` reservations shipped in migration
`20240163000000` and are green at HEAD. ADR-0023 shipped that substrate
**defined-but-inert** — zero service callers, zero evaluation consumers. Ring
2A-core is **the first ring that consumes it** and makes the inert tables do work.

The Ring 2A design arc, on `origin/staging`: brainstorm (`2de50113`, leans) →
pre-ADR verification (`63c1d65c`, corrections) → design spec V0.1 (`29a92a92`,
decisions). ADR-0024 is authored from the cleared design spec per the ADR-0021 §4
pre-ratification lifecycle.

## Context

Per the CTO-settled **H = split**, this ADR covers Ring 2A-**core**: the pure-core
evaluator, the Agent Ladder gate, the Stage 1 canvas (read view + controller row
actions), the Q-RC-AT-1 windowed read path, and the `rule_evaluation_log` payload
landing — all against **seeded** rules. It does **not** cover Ring
2A-**authoring** (the agent conversational-drafting → approval → create path),
which is a separate later arc that depends on the Logic Receipt write path as a
**Tier-1 prerequisite** (Verification 1: INV-AGENT-002 is a broader cross-agent
concern rule-core *consumes*, not authors).

Two verification corrections are load-bearing here:

- **The capping table is ratified, not deferred.** The brainstorm assumed the
  rung→action capping values were "owned by Ring 2 ratification." That is wrong
  against disk: `rule-type-core.md §6.1` (ratified 2026-05-26) carries the full
  9-row capping table. Ring 2A-core **implements §6.1 as canon** (Decision 4); it
  does not invent or derive the values.
- **The Logic Receipt is broader than rule-core.** INV-AGENT-002 (`agent_autonomy_model.md §10`,
  reserved-not-registered) is a Tier-1 / Authority-Gradient concern serving rules,
  bundles, reversals, and journal entries equally. 2A-core has **no** Logic Receipt
  dependency (the canvas reads substrate directly; the evaluator returns
  `MatchResult`; the gate caps). 2A-authoring carries it as a known prerequisite.

A targeted empirical HEAD re-check (design spec §"Empirical HEAD pass") grounded
the substrate shapes and surfaced two refinements folded into the decisions below:
the `document_cards_view` precedent **bypasses RLS** (plain view = owner-rights in
PG15, not `security_invoker`), so the windowed view ships `WITH (security_invoker = true)`
(Decision 2); and §5.7's `MatchResult.winning_branch_type` is `primary | guardrail`
(an `otherwise_if` branch winning yields classification `guardrail`), **not**
`primary | otherwise_if` (Decision 1 CHECK).

## Decision

### 1. `rule_evaluation_log` table (one-write ratified)

Create `rule_evaluation_log` — the structured, queryable record of every
evaluation, grounded against §5.7 `MatchResult` + the gate's `effective_action`:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `org_id` | `uuid NOT NULL` | tenant scope; integrity via the composite FK below |
| `rule_id` | `uuid NOT NULL` | the rule this record is about; part of the composite FK below |
| `trace_id` | `uuid NOT NULL` | cross-event correlation (pino + audit) |
| `match_classification` | `text NOT NULL CHECK (match_classification IN ('primary_match','guardrail_match','almost_match'))` | §5.7 |
| `winning_branch_type` | `text NULL CHECK (winning_branch_type IN ('primary','guardrail'))` | §5.7 (`primary \| guardrail`, **not** `otherwise_if`); null on `almost_match` |
| `winning_branch_max_action` | `action_type NULL` | what the rule logic permitted (§5.7); null on `almost_match` |
| `effective_action` | `action_type NULL` | the gate's output (Decision 4); null when no proposal dispatched |
| `proposed_mutation_id` | `uuid NULL` | the proposal this evaluation ran against, if any |
| `disposition` | `text NULL CHECK (disposition IS NULL OR disposition IN ('auto_posted','routed','blocked','pending'))` | the gate's dispatch outcome, set at insert time (semantics below); null on non-winner / no-dispatch rows. v1-active subset `pending`/`routed`/`blocked`/null; `auto_posted` reserved post-v1 |
| `evaluation_trace` | `jsonb NOT NULL` | the §5.7 typed trace (triggers fired, rules evaluated, branches considered, conflict-resolution decision, tiebreak-capping) |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |

**Indexes:** `(rule_id, created_at)` (the windowed read, Decision 2);
`(org_id, created_at)` (tenant queries); `(trace_id)` (cross-event lookup).

**Composite identity FK (mirrors ADR-0023 `vendor_rules`).** A single constraint
`FOREIGN KEY (rule_id, org_id) REFERENCES rule_registry (id, org_id) ON DELETE CASCADE`
**replaces** the separate `rule_id → rule_registry(id)` and
`org_id → organizations(org_id)` FKs. It targets `rule_registry`'s
`UNIQUE (id, org_id)` (ADR-0023 Decision 1), so a log row cannot pair org A's
`org_id` with org B's rule, and org-scope integrity + the org-delete cascade run
transitively through `rule_registry` (`rule_registry.org_id → organizations`) —
exactly the `vendor_rules` shape, which carries no direct `org_id → organizations`
FK either.

**Row-per-rule-evaluation, not row-per-proposal.** A proposal that evaluates N
candidate rules may produce **N rows** — one per rule evaluated. A proposal with
**zero** candidate rules (no trigger fired) produces **no** `rule_evaluation_log`
rows; that proposal's existence is captured by the proposal pipeline's own audit
trail, not here. The winner-attribute columns — `winning_branch_type`,
`winning_branch_max_action`, `effective_action`, `disposition` — are populated on
the **winning** rule's row (`match_classification` ∈ `primary_match | guardrail_match`)
and are **null** on non-winner rows (`also_matched` losers, `almost_match`
candidates), which record only their `match_classification` and trace.

**RLS (append-only, service-emitted):** `ENABLE ROW LEVEL SECURITY`; SELECT
`USING (user_has_org_access(org_id))`; **no user-path INSERT policy** — evaluation
records are written only by the service on the service-role client, which bypasses
RLS; UPDATE `USING (false)`; DELETE `USING (false)`. Evaluation records are
**append-only**, mirroring the substrate's service-emitted-append-only posture.
This append-only property is reserved as **INV-RULE-001** (Decision 9).

**One-write decision.** `rule_evaluation_log` is the **sole record** for evaluation
events — `rule_evaluated` does **not** also emit a canonical `audit_log` row. This
follows the live `ai_actions` precedent (HEAD pass (c): `aiActionsService` writes
`ai_actions` with no paired `recordMutation`): a tenant-scoped structured agent log
that stands alone. **This is not an INV-AUDIT-001 amendment** — INV-AUDIT-001
governs *mutating* service calls; an evaluation is read-shaped (the pure core does
no I/O; the service assembles inputs and logs the outcome), not a state mutation.
The genuinely-mutating downstream events — counter updates on `rule_track_records`
(Decision 4) — remain separately audit-eligible via the existing `recordMutation`
path if/when they route through a mutating service call. (`before_state`-stuffing
is rejected per ADR-0023; and per Verification 1, `rule_evaluated` ≠ the Logic
Receipt, which piggybacks on `audit_log.before_state` — they are distinct artifacts
and that distinction is preserved.)

**Evaluation log vs. Logic Receipt (distinct artifacts, distinct consumers).**
`rule_evaluation_log` is the structured *backend* trace of an evaluation
(machine-queryable, per-rule, the canvas + tuning surface's data source); the Logic
Receipt is the *user-facing* explanation derived from `ProposedMutation.justification`
(rendered on chat proposal cards, INV-AGENT-002, Ring 2A-authoring). They are
distinct artifacts with distinct consumers and must not be conflated.

**`disposition` semantics (set at insert time only).** `disposition` records the
dispatch disposition **known at evaluation/gate time**, not later human approval
state, on the winning rule's row:

- `auto_posted` — gate `effective_action` was `auto_post_at_rung_2 / _3` and the post
  succeeded synchronously *(reserved at v1 — no `auto_post_at_rung_*` emits while
  `current_rung = always_confirm`)*.
- `routed` — `effective_action` was `route_to_exception_queue_with_reason`.
- `blocked` — `effective_action` was `block_with_reason`.
- `pending` — `effective_action` was `suggest_with_required_approval`; the controller
  approval flow opens and the **terminal** disposition lives downstream (the proposal
  pipeline + `rule_track_records` counters), not in this row.
- `null` — non-winner / no-dispatch rows (`also_matched`, `almost_match`).

Later controller approval/rejection of a `pending` outcome is reflected through
`ruleTrackRecordService.recordEvaluation(...)` and `rule_track_records` counter
updates — **never** by updating the log row, preserving INV-RULE-001's strict
append-only posture. Because writes are insert-time-only, `null` is never a
transient/uninitialized state: it unambiguously means "no dispatch." **v1-active
subset:** `pending | routed | blocked | null`; `auto_posted` is reserved for post-v1
rung activation (mirrors the ADR-0023 v1-active-vs-reserved distinction).

### 2. `rule_evaluation_30d_view` (windowed read path, `security_invoker = true`)

Create a **plain SQL view** (not materialized), windowed to the trailing 30 days,
aggregating per `(org_id, rule_id)` over `rule_evaluation_log`:

```
CREATE VIEW rule_evaluation_30d_view WITH (security_invoker = true) AS …
```

- **`security_invoker = true`** (PG15) — the view inherits `rule_evaluation_log`'s
  RLS for any caller, rather than running as owner and bypassing it. This corrects
  the latent cross-org footgun in the `document_cards_view` precedent (migration
  `20240154`), which is safe only via route-handler discipline. (The precedent's
  migration comment even misstates the PG default as `security_invoker` — it is
  not; the default is owner-rights. This ADR sets the default explicitly.)
- **Window:** rolling `created_at >= now() - interval '30 days'` (rolling 30×24h,
  not calendar-day) — matches the "real-time, not daily-batch" §7 bar; no project
  cron/analytics precedent argues for calendar boundaries.
- **Aggregates per rule** (the canvas's data dependency, design spec §4 + §6.4 Q3):
  `evaluation_count`, `primary_match_count`, `guardrail_match_count`,
  `almost_match_count`, counts by `effective_action`, counts by `disposition`
  (`auto_posted` / `routed` / `blocked` / `pending`), and `last_evaluated_at`.
  (Cumulative counters + `last_winning_match_at` come from `rule_track_records`
  directly; the view supplies the 30-day windowed numbers.)
- **Windowed human-approval metrics are not log-derivable** under Decision 1's
  insert-time-only `disposition`. The log records `pending` for
  `suggest_with_required_approval` dispatches, **not** the terminal controller
  approve/reject (which lives in `rule_track_records` counters + the proposal
  pipeline). A 30-day *clean-approval / rejection rate* therefore sources from a
  windowed join to the proposal disposition (by `proposed_mutation_id`) or from
  track-record deltas — settled at canvas-implementation time, not ratified here.
- **Always-fresh:** query-time computation; no refresh mechanism. At v1 scale (few
  rules, modest volume), the live aggregate over the `(rule_id, created_at)` index
  is cheap; a materialized view earns its place only if measured volume later makes
  the live view slow.
- **Canvas data access:** the canvas reads via a **route handler on the
  service-role client**, enforcing org-scoping in app code
  (`ctx.caller.org_ids.includes(orgId)` + `WHERE org_id = orgId`) — the
  `document_cards_view` route-handler pattern. The view's `security_invoker` RLS is
  defense-in-depth for any future direct authenticated query.

### 3. Pure-core evaluator at `apps/web/src/core/rules/`

The ratified empty home (spec §7; ADR-0020). **No DB / I/O / agent imports** —
pure, deterministic, reproducible byte-for-byte (pattern rules; spec §5.3).

- **Entry point:** `evaluate(rules: Rule[], context: EvaluationContext): MatchResult`
  — a pure function; the service layer assembles `rules` (registry rows + branches)
  and `context` (the proposal's typed fields + source trigger) and hands them in.
- **Closed-grammar predicate evaluators (pattern-only):** `field_equals`,
  `field_in_range`, `field_outside_range`, `field_in_set`, `field_matches_pattern`,
  `source_trigger_equals`. Temporal (`schedule_matches`, `cadence_matches`) and
  inferential (`semantic_match_above_threshold`, `category_classification_matches`)
  predicates **defer to Ring 2B** — they need clock/model inputs that break purity
  differently and have no v1 rules to evaluate.
- **Branch evaluation:** walk branches in `branch_order`, first-match-wins; evaluate
  `primary` and `otherwise_if` branches (`otherwise` reserved post-v1, §5.2).
  Conditions AND'd in `condition_order`.
- **Conflict resolution (§6.1 step 4; type-agnostic, ships fully):** (4a)
  most-specific predicate wins (deterministic specificity weights, §5.5); (4b)
  tied → most-conservative `tiebreak_effective_action`; (4c) tied → most-recently
  activated/promoted; (4d) → stable `rule_id` UUID order.
- **`MatchResult` (§5.7):** `winning_rule_id`, `winning_branch`, `winning_branch_type`
  (`primary | guardrail`), `winning_branch_max_action`, `match_classification`,
  `also_matched_rules`, `almost_match_rules`, `track_record_snapshot`,
  `four_questions_population`, `evaluation_trace`. **No `effective_action`** — the
  load-bearing pure-core-vs-gate separation (§6.1.1). The pure core may compute a
  `tiebreak_effective_action` internally for ordering (4b) but does not propagate it
  as authoritative.

### 4. Agent Ladder gate at `apps/web/src/agent/policies/agent-ladder/`

The ratified empty home (ADR-0020). Orchestrator-layer (not pure-core — it reads
canonical rung/limit state).

- **Capping — implement `§6.1`'s ratified 9-row table as canon, do not derive.**
  The gate function takes `(MatchResult, rule_registry_row) → effective_action`,
  capping `winning_branch_max_action` by `current_rung` per the table
  (`auto_post_at_rung_*` are rung-capped; the three conservative actions
  — `suggest_with_required_approval`, `route_to_exception_queue_with_reason`,
  `block_with_reason` — pass through; a higher rung never *elevates*). At v1
  (`current_rung = always_confirm` only), capping trivially routes every
  `auto_post_at_rung_*` to `suggest_with_required_approval` (human approval),
  consistent with the v1 asymmetry; the post-v1 rows ship as the inert capping
  function.
- **Three downstream gate components ship as defined-but-inert stubs** with explicit
  `// activates post-v1` markers, each a named function returning pass-through at
  v1, structured so post-v1 activation is a single-file change:
  `checkPerTransactionLimit(...)`, `checkDailyAggregate(...)`,
  `checkTrackRecordHealth(...)`. They have nothing to gate at v1 (no rung above
  `always_confirm`). The gate decision-tree *structure* (the 5 steps,
  `agent_autonomy_model.md §7`) is the pipeline; §6.1's table is the rung-step's
  numeric output.
- **Counter writes:** on disposition, the gate routes counter increments to
  `rule_track_records` via `ruleTrackRecordService.recordEvaluation(...)` on the
  **service-role client** — honoring the migration's `USING(false)` user-path
  UPDATE/DELETE RLS mechanically (service_role bypasses; no user path mutates
  counters).

### 5. Stage 1 canvas

- **Component:** `apps/web/src/components/canvas/RuleRegistryView.tsx` (matches the
  `OpenBillsView` / `PendingDocumentsView` read-only-view shape; HEAD pass (d)).
- **List view:** rule `name`, scope (vendor + `bundle_type` for vendor rules),
  `current_rung` badge, `lifecycle_state` badge (two separate badges), 30-day
  track-record indicator (from `rule_evaluation_30d_view`), last winning match (from
  `rule_track_records.last_winning_match_at`), sort/filter (by rung, lifecycle,
  track-record health, recency).
- **Data access:** a route handler (`GET /api/orgs/[orgId]/rules` or similar) on the
  **service-role client**, checking `ctx.caller.org_ids.includes(orgId)` and
  filtering `WHERE org_id = orgId`, joining `rule_registry` ⋈ `rule_track_records`
  ⋈ `rule_evaluation_30d_view`. The `document_cards_view` route-handler precedent;
  not direct operator-RLS reads.
- **4 row actions (controller-only — `rule_registry` CUD RLS = `user_is_controller`):**
  promote (modal — see Open questions), demote (one-click), rename, retire (with
  confirm). All write `rule_registry` via `ruleRegistryService`.
- **Detail surface — behavior, not logic:** track-record breakdown, recent matches
  (from `rule_evaluation_log`), last winning match, lifecycle anchors. Does **not**
  render Trigger/Condition/Action structure (Stage 2). The **Four Questions are not
  canvas content** — they render on chat proposal cards (Ring 2A-authoring) and
  carry the Logic Receipt dependency the canvas does not.
- **Promotion modal at v1:** **ship the modal with inert post-v1 targets**, surfaced
  in-UI as "promotion ceremony available post-v1 (rungs above Always Confirm not yet
  active)." The affordance is the brief's centerpiece tuning surface; shipping it
  inert mirrors the substrate-only-v1 posture. Flagged for product/UX (Open
  questions) — if they prefer deferral, demote/rename/retire ship and promote
  defers. The inert state must read as **intentionally disabled, not broken** (a
  visible "available post-v1" affordance, not a dead/erroring control); the exact
  copy is product/UX's call.

### 6. Services (greenfield authoring at `apps/web/src/services/rules/`)

`services/rules/` is the correct greenfield home (HEAD pass (a): `services/` is
`<domain>/` subdirectories; no `rules/` yet). All three Ring 1 services + the
evaluation service are greenfield (Ring 1 deferred service code). Dependency
direction: orchestrator → services → repositories + pure core; core imports nothing
(§7 / ADR-0020).

- **`ruleRegistryService.ts`** — sole writer for `rule_registry`. `create(rule, ctx)`
  **co-creates the `rule_track_records` row in the same transaction** (Ring 1
  Decision 5 co-creation rule, honored); `promote(rule_id, target_rung, ctx)`,
  `demote(rule_id, ctx)`, `rename(rule_id, name, ctx)`, `retire(rule_id, ctx)`
  (controller-authority via RLS); identity-anchored read methods for the canvas join.
- **`ruleTrackRecordService.ts`** — sole *updater* of `rule_track_records` after
  creation. `recordEvaluation(rule_id, classification, disposition, ctx)` (the gate's
  write path, service_role); counter read methods.
- **`vendorRuleService.ts`** — sole writer for `vendor_rules`.
  `create(rule_id, org_id, vendor_id, bundle_type, ctx)` (the vendor-rule child;
  composite FK to `rule_registry`).
- **`ruleEvaluationService.ts`** — orchestrator-layer. Assembles inputs (registry +
  track_records reads), calls the pure-core `evaluate(...)`, returns `MatchResult`;
  writes the `rule_evaluation_log` row (Decisions 1 / 7). **No state mutation**
  beyond the append-only evaluation-log insert.
- **Creation orchestration:** creating a vendor rule co-ordinates two single-writers
  in one transaction — `ruleRegistryService.create` (registry + track_records
  co-created) then `vendorRuleService.create` (the `vendor_rules` child). Named home:
  `ruleCreationOrchestrator` (a service-layer-top helper). The *caller* of creation
  (the agent conversational-drafting approval) is Ring 2A-authoring; Ring 2A-core
  authors the orchestrator + services so the creation path **exists and is
  unit-testable against seeded inputs**, but no production creation surface wires it.

### 7. `rule_evaluated` event integration

- The event vocabulary is reserved (ADR-0023 §8.5). Ring 2A-core authors the emitter
  at `ruleEvaluationService`'s boundary.
- **Emit pattern:** `ruleEvaluationService` writes the `rule_evaluation_log` row on
  **every** evaluation (win or lose) — this is the `rule_evaluated` landing
  (one-write, Decision 1). The disposition handler (downstream of the gate's
  `effective_action`) updates counters via `ruleTrackRecordService.recordEvaluation`,
  which is where the `rule_match_confirmed` / `rule_match_rejected` semantics live
  (the counter deltas).
- **One-write honored:** `rule_evaluation_log` is the sole record for
  `rule_evaluated`; no paired `audit_log` row. Counter mutations on
  `rule_track_records` are separately audit-eligible via `recordMutation` if they
  route through a mutating service call.

### 8. Reserved enums consumed (no new enums)

All enums shipped at Ring 1 (ADR-0023 Decision 6). Ring 2A-core creates **no enums**:

- The evaluator consumes `condition_type` — six pattern values active; four
  (temporal/inferential) reserve-only until Ring 2B.
- The gate consumes `action_type` — full closed set (five values).
- The orchestrator consumes `trigger_type` — eight values (trigger lookup at the
  evaluator entry point).
- `rule_autonomy_rung`, `rule_type`, `rule_lifecycle_state` are consumed by the
  canvas + gate reads.

### 9. Reserve `INV-RULE-001` and the `INV-RULE-*` domain prefix

This ADR **reserves** (does not register) the append-only property of
`rule_evaluation_log` (Decision 1) as **INV-RULE-001**, the first member of a
**new `INV-RULE-*` domain prefix** for rule-core runtime invariants.

- **Frontmatter `invariants: []` is forced**, not chosen. The ADR-0021 linter
  cross-checks every value in `invariants:` against `docs/02_specs/invariants.md`,
  and the `invariants.md` spec-without-enforcement rule forbids adding an INV-ID
  before its enforcement exists in code today. At ratification, the
  `rule_evaluation_log` table + RLS land in the *migration* arc (not yet on disk),
  so INV-RULE-001 cannot appear in `invariants.md` or this ADR's frontmatter without
  breaking the linter. The reservation lives in **this ADR's text**; registration is
  the migration arc's concern (when the table + `USING(false)` RLS land,
  enforcement-in-code exists and the migration arc registers INV-RULE-001 in
  `invariants.md` + `control_matrix.md`, and introduces the `INV-RULE-*` prefix to
  any prefix registry per the project's add-an-invariant procedure).
- **Why append-only, and only append-only.** Append-only has a **concrete
  enforcement site** — the RLS `USING(false)` UPDATE/DELETE + no-user-INSERT posture
  — fitting the INV-LEDGER-003 / INV-AUDIT-002 append-only family pattern, with the
  enforcement landing in the very next arc. The two other candidate properties from
  the design spec are deferred to Ring 2A-authoring (see Non-decisions): **single-writer
  for `rule_evaluation_log`** is a service/structural-pattern invariant whose
  enforcement site (the `ruleEvaluationService` boundary) lands with the service
  code in the authoring arc; **evaluator determinism** is a test-verified *property*,
  not a constraint or structural pattern with a single enforcement site, so it is the
  weakest of the three as a registrable INV and is most naturally named in the
  authoring arc's own design-spec pass alongside the core code.
- This **refines ADR-0023's Non-decision** ("the runtime INV-* invariant with an
  assigned ID lands when Ring 2 wires the evaluator"): ADR-0024 reserves **one**
  `INV-RULE-*` by name now (append-only, with its enforcement in the immediately
  following migration arc) and defers the rest to the authoring arc, following the
  INV-AGENT-002 reserved-not-registered pattern (name now, register when enforcement
  lands).

## Migration outline

ADR-0024 ships **one migration** creating `rule_evaluation_log` + its view. Ordered
DDL outline (not executable SQL — a separate authoring pass after ratification, per
the ADR-0023 → migration sequence; filename timestamp after `20240163000000`):

a. **Create `rule_evaluation_log`** — all columns per Decision 1
   (`winning_branch_type` CHECK = `('primary','guardrail')`; `match_classification`
   CHECK = three states; `disposition` CHECK = nullable +
   `('auto_posted','routed','blocked','pending')`; the **composite**
   `FOREIGN KEY (rule_id, org_id) REFERENCES rule_registry (id, org_id) ON DELETE CASCADE`
   — not separate `rule_id` / `org_id` FKs, mirroring ADR-0023 `vendor_rules`).
b. **Create indexes** — `(rule_id, created_at)`, `(org_id, created_at)`,
   `(trace_id)`.
c. **Enable RLS** — `ENABLE ROW LEVEL SECURITY`; SELECT `user_has_org_access(org_id)`;
   INSERT service_role only (no user-path policy); UPDATE `USING(false)`; DELETE
   `USING(false)`. This is the INV-RULE-001 enforcement site (Decision 9); the
   migration arc registers INV-RULE-001 in `invariants.md` / `control_matrix.md`.
d. **Create `rule_evaluation_30d_view`** — plain view `WITH (security_invoker = true)`
   over `rule_evaluation_log`, rolling-30-day window, aggregates per Decision 2;
   `GRANT SELECT TO service_role, authenticated`.

No `vendor_rules` / `rule_registry` / `rule_track_records` changes (substrate settled
at ADR-0023). No new enums. The substrate-mod test-staleness review
(`.claude/rules/migrations.md`) fires at migration-authoring time (new table + new
RLS + new index). The migration HEAD pass confirms: the filename convention
(timestamp after `20240163000000`), the `ai_actions` no-INSERT-policy RLS shape
(whether "no policy" vs `USING(false)` is the convention for the service-emitted
INSERT path), and the `security_invoker` view syntax against PG15 documentation.

## Non-decisions

This ADR explicitly does **not**:

- Author temporal or inferential evaluators (Ring 2B).
- Author the agent conversational-drafting path (Ring 2A-authoring).
- Author the Logic Receipt write path / register INV-AGENT-002 (a Tier-1
  prerequisite serving Ring 2A-authoring; Verification 1).
- Modify ADR-0023 substrate or add reserved enums.
- **Create Branch/Condition persistence substrate.** Seeded rules are typed
  in-memory fixtures / service-layer objects in Ring 2A-core; persistent
  Branch/Condition storage (and any predicate JSON schema) lands with Ring
  2A-authoring or a separate Branch substrate ring. The evaluator PR must **not**
  invent a predicate-storage shape — it evaluates typed inputs handed in by the
  service layer.
- Define the refinement loop (Ring 3, §9.3) or the rule-amendment lineage *create*
  path (Ring 2A-authoring; immutability + retire-and-create-new is canon per
  ADR-0023).
- Wire a production rule-creation surface (the creation orchestrator + services are
  authored and unit-testable against seeded inputs; the caller is 2A-authoring).
- **Register any INV-* in `invariants.md`.** INV-RULE-001 is *reserved by name* in
  Decision 9; its registration is the migration arc's concern (enforcement lands
  there). **Single-writer for `rule_evaluation_log`** and **evaluator determinism**
  are not named as INV-* here — they defer to the Ring 2A-authoring design-spec pass,
  where their enforcement sites (service boundary, core code) become concrete.

## Consequences

**Enables.**

- The substrate does work: the evaluator runs against seeded rules, the gate caps via
  §6.1, the canvas renders behavior, the windowed view materializes always-fresh, and
  `rule_evaluation_log` captures every evaluation.
- `rule_evaluation_30d_view` with `security_invoker = true` is RLS-safe for any
  caller — an improvement over the `document_cards_view` precedent's
  route-handler-only safety.
- Clean exit criteria for Ring 2A-core, independent of authoring: evaluator green
  against seeded rules, gate caps correctly, canvas renders, view + log verified.
- `INV-RULE-*` exists as a named domain prefix for rule-core runtime invariants;
  future members (single-writer, evaluator determinism, conflict-resolution
  determinism, lineage immutability) land in the same family as their enforcement
  sites materialize.

**Constrains / costs.**

- `rule_evaluation_log` one-write means evaluation events are **not** in the canonical
  `audit_log` trail. Accepted per the `ai_actions` precedent (read-shaped agent log);
  recorded as the deliberate INV-AUDIT-001 interpretation (evaluation ≠ mutation), not
  an amendment. A future auditor querying "every system action" must union `audit_log`
  + `rule_evaluation_log` (as they already must for `ai_actions`).
- The promotion modal ships inert at v1 — UI scaffolding present before its target
  rungs activate (the substrate-only-v1 cost, accepted; flagged for product/UX).
- Three gate components ship inert — gate-pipeline surface exists ahead of post-v1
  activation (the ADR-0010 reserved-state cost shape, one level up).
- Pattern-only evaluator means temporal/inferential rules can't be evaluated until
  Ring 2B — acceptable, since no such rules exist at v1.
- Introducing the `INV-RULE-*` prefix is a precedent-setting governance act (a new
  INV domain family). Deliberate: the rule core warrants its own family rather than
  misfiling under INV-AGENT (System-ceiling semantics) or INV-LEDGER (ledger-specific).

## Alternatives considered

- **Two writes for `rule_evaluated` (canonical-audit reading).** Defensible under a
  strict INV-AUDIT-001 reading, but the `ai_actions` precedent shows read-shaped agent
  logs stand alone — adopting two-writes would add a per-evaluation canonical-trail row
  for a non-mutation (the wrong shape), and `rule_evaluated` fires on every evaluation
  (high-volume, mostly no-commit at v1). Rejected.
- **`before_state`-stuffing the evaluation trace.** Rejected (ADR-0023 explicit
  reject); and Verification 1 distinguishes the Logic Receipt's `before_state` use from
  `rule_evaluated` — the two are distinct artifacts.
- **Materialized view for the 30-day window.** Rejected — no matview/cron precedent in
  the project; freshness-wrong against the §7 "real-time, not daily-batch" bar;
  first-of-kind machinery. A live view over the `(rule_id, created_at)` index is cheap
  at v1 scale.
- **Incremental windowed table.** Rejected — write-amplification on every evaluation,
  before measurement justifies it.
- **Plain view without `security_invoker` (the `document_cards_view` shape).** Rejected
  — runs as owner and bypasses RLS, safe only via route-handler discipline; this ADR
  closes the latent cross-org footgun by setting `security_invoker = true`.
- **Derive the 30-day numbers from `rule_track_records`.** Rejected — track_records
  holds cumulative counters, not windowed; the windowed view is the dedicated
  windowed-read surface (Q-RC-AT-1).
- **Assign all three candidate INVs at ratification** (append-only, single-writer,
  evaluator determinism). Rejected — the ADR-0021 linter + `invariants.md`
  spec-without-enforcement rule make registration structurally impossible before the
  enforcement code lands; and single-writer / determinism have weaker (or no) concrete
  enforcement sites at this ADR's grain. Reserve append-only; defer the rest.
- **Defer all three INVs (mirror ADR-0023 verbatim).** Rejected as the worse epistemic
  state — append-only is a real property with concrete DB enforcement landing in the
  *next* arc; reserving it now lets the migration arc register it cleanly, rather than
  forcing the authoring arc to rediscover both that the property exists and that it
  warrants registration.

## Open questions

Carried forward for CTO / product-UX:

1. **Decision F — UI label (product/UX, parallel).** Pick from `last fired` /
   `last selected` / `last won` / `last decisive match` for the `last_winning_match_at`
   indicator. The chosen label is recorded at canvas-implementation time.
2. **Promotion-modal-at-v1 (Decision 5).** Ratified as ship-with-inert-targets; flag if
   product/UX prefers deferral until rung activation (then demote/rename/retire ship and
   promote defers).
3. **Ring 2A-authoring (separate arc).** Opens with the Logic Receipt write path as a
   known Tier-1 prerequisite (Verification 1) — whether a Tier-1 arc lands it or
   2A-authoring does is that arc's opening question. The authoring arc also names the
   single-writer and evaluator-determinism invariants (deferred per Decision 9 /
   Non-decisions).

*(The INV-ID assignment question the design spec carried as open is resolved here:
reserve INV-RULE-001 only, frontmatter `invariants: []` — Decision 9.)*

## Cross-references

- `docs/09_briefs/post-mvp/specs/2026-05-26-adr-0024-ring2a-core-design.md` — the
  design spec this ADR ratifies (V0.1 at `29a92a92`); preserved as historical
  reference per ADR-0021 §4.
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-brainstorm.md` — leans (point-in-time).
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-pre-adr-verification.md` — corrections;
  **Verification 2** (capping table ratified in §6.1 — Decision 4 implements as canon)
  and **Verification 1** (Logic Receipt is Tier-1, not rule-core — 2A-core unblocked).
- `docs/02_specs/rule-type-core.md` (V3.2) — §5.2 / §5.3 (branch + rule types), §5.5
  (specificity), §5.6 (`action_type`), §5.7 (`MatchResult`), §6.1 (capping table +
  pure-core/gate separation §6.1.1), §6.4 (Four Questions — chat surface, not canvas),
  §7 (evaluator home + purity), §9.3 (lifecycle + lineage).
- **ADR-0023** ([`./0023-rule-type-core-substrate.md`](./0023-rule-type-core-substrate.md))
  — the substrate Ring 2A-core consumes (registry, track-records, enums,
  `vendor_rules` reconciliation); §8.5 reserved audit-event vocabulary; its
  Non-decision on INV-* deferral, refined here (Decision 9).
- **ADR-0007** ([`./0007-three-tier-agent-architecture.md`](./0007-three-tier-agent-architecture.md))
  §Tier 1 — Logic Receipt ownership (INV-AGENT-002), a Tier-1 prerequisite for
  Ring 2A-authoring, not 2A-core.
- **ADR-0010** ([`./0010-reserved-enum-states.md`](./0010-reserved-enum-states.md))
  — reserved-enum-states discipline (Decision 8 consumes Ring 1's reserved enums).
- **ADR-0011** ([`./0011-document-platform.md`](./0011-document-platform.md))
  §1 — the canonical `recordMutation` audit writer / INV-AUDIT-001, against which the
  one-write decision (Decision 1) is read.
- **ADR-0017** ([`./0017-vendor-template-substrate.md`](./0017-vendor-template-substrate.md))
  — vendor-rule substrate; `vendorRuleService` (Decision 6) is its sole writer.
  **Not amended** here.
- **ADR-0020** ([`./0020-agent-first-authority-gradient-source-architecture.md`](./0020-agent-first-authority-gradient-source-architecture.md))
  — Authority Gradient source-tree homes (`core/rules/`, `agent/policies/agent-ladder/`,
  `services/rules/`).
- **ADR-0012** ([`./0012-proposed-mutation-bundle.md`](./0012-proposed-mutation-bundle.md))
  §6 — `ProposedMutation` / `proposalJustification` (the `proposed_mutation_id` the
  evaluation log references).
- `docs/02_specs/agent_autonomy_model.md` §7 (gate decision-tree, 5 steps), §10
  (INV-AGENT family, reserved-not-registered pattern INV-RULE-001 follows).
- `docs/02_specs/invariants.md` — the registry; INV-RULE-001 registers here at the
  migration arc (spec-without-enforcement rule).
- `supabase/migrations/20240154000000_document_cards_view.sql` — the plain-view +
  route-handler precedent (and its RLS footgun, corrected here via
  `security_invoker = true`).
- **ADR-0021** ([`./0021-adr-frontmatter-and-tooling.md`](./0021-adr-frontmatter-and-tooling.md))
  §4 — pre-ratification design-spec lifecycle; the `invariants:` linter cross-check
  that forces frontmatter `[]` (Decision 9).
