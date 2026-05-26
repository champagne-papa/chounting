# ADR-0024 Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate — Design Spec

**Status:** Pre-ratification design spec per ADR-0021 §4 (Decision item 4). **NOT an ADR** and carries no `proposed` status — routes through the design-spec genre. Informs the eventual `docs/07_governance/adr/0024-ring2a-core.md` (`status: ratified` at CTO ratification). Reserves the **0024** ADR number. Container precedent: `docs/09_briefs/post-mvp/specs/2026-05-26-adr-0023-rule-type-core-substrate-design.md`.

**Date:** 2026-05-26 · **HEAD anchor:** `63c1d65c`, branch `staging`. · **Revision:** V0.1 (first draft).

**Voice:** decision-bearing. Ring 2A-core decisions are made, not opened. Where the brainstorm and verification diverge, **verification wins**. Substrate (ADR-0023, the migration, the green suite) is ratified canon, not relitigated. **H = split is settled** — this is Ring 2A-core; Ring 2A-authoring (agent conversational-drafting + Logic Receipt Tier-1 prerequisite) is a separate later arc.

**Inputs:**
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-brainstorm.md` (leans; point-in-time).
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-pre-adr-verification.md` (corrections; supersedes brainstorm on conflict — esp. the capping-table correction and the Logic Receipt distinction).
- `docs/02_specs/rule-type-core.md` (V3.2) — §5.7, §6.1, §6.4, §7. ADR-0023, ADR-0020, ADR-0007 §Tier 1.

---

## Empirical HEAD pass (targeted re-check)

The brainstorm + verification did the heavy pass; this re-check grounds the spec's shapes and surfaced two refinements (flagged inline below and folded into Decisions 1/2/5).

- **(a) Service-file convention.** `apps/web/src/services/` is `services/<domain>/` subdirectories (`accounting`, `agent`, `audit`, `document-platform`, `org`, `spend`, …). No `rules/` yet → **`services/rules/` is the correct greenfield home** (Decision 6).
- **(b/REFINEMENT) `document_cards_view` shape + RLS reality.** Plain `CREATE OR REPLACE VIEW` with INNER JOINs + `GRANT SELECT TO service_role, authenticated` (`20240154`). **But its RLS posture is not "views inherit RLS" as the brainstorm/prompt assumed.** The migration comment (lines 66–80) is explicit: a plain view runs as **owner (SECURITY INVOKER default = false in PG15)** and **bypasses RLS** for direct authenticated access; `document_cards_view` is safe only because its **v1 read path is service_role at the route handler with app-code org-scoping** (`ctx.caller.org_ids.includes(orgId)` + `WHERE org_id`). The comment even misstates the Postgres default ("default is SECURITY INVOKER for views" — it is not). **Refinement:** `rule_evaluation_30d_view` ships with **`WITH (security_invoker = true)`** (PG15) so it genuinely inherits `rule_evaluation_log`'s RLS for any caller — closing the precedent's latent cross-org footgun — while the canvas still reads via the route-handler pattern (Decisions 2, 5).
- **(c) `ai_actions` one-write pattern.** `aiActionsService.ts` writes `ai_actions` with **no `recordMutation`** call (grep: no `recordMutation` import in the file) — a tenant-scoped structured agent log that stands alone, no paired `audit_log` row. This is the live one-write precedent Verification 3 leaned on; confirmed against code (Decision 1).
- **(d) `*View.tsx` structure.** `components/canvas/` holds read-only views (`OpenBillsView`, `PendingDocumentsView`, …). `RuleRegistryView.tsx` follows the same shape (Decision 5).
- **(e/REFINEMENT) §5.7 MatchResult fields (verbatim).** Confirmed: `winning_rule_id`, `winning_branch`, **`winning_branch_type` = `primary | guardrail`** (NOT `primary | otherwise_if` — an `otherwise_if` branch winning yields classification `guardrail`), `winning_branch_max_action` (the permitted `max_outcome_action`; MatchResult carries **no** `effective_action`), `match_classification` ∈ `primary_match | guardrail_match | almost_match`, `also_matched_rules`, `almost_match_rules` (with `closest_branch_id` + `failed_conditions`), `track_record_snapshot`, `four_questions_population`, `evaluation_trace`. **Refinement:** `rule_evaluation_log.winning_branch_type` CHECK is `('primary','guardrail')` per §5.7, not the prompt's `('primary','otherwise_if')` (Decision 1).
- **(f) `recordMutation.ts` contract.** `recordMutation(db, ctx, {action, entity_type, entity_id, before_state, …})` inserts one `audit_log` row in the caller's transaction (INV-AUDIT-001). Universal for *mutating* service calls; the evaluation event is read-shaped and not a mutation (Decision 1 / Verification 3).

---

## Planned ADR-0024 frontmatter (finalized at ratification)

```yaml
id: "0024"
title: "Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate"
status: ratified            # set at ratification; no `proposed` in the chounting enum (ADR-0021)
date: "<ratification-date>"
deciders: [phil]
modules: [db, agent, core, ui]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0010", "0011", "0017", "0020", "0023"]
invariants: []              # Ring 2A-core may establish an evaluator-determinism / single-writer INV;
                            # INV-ID assignment is a ratification-time call. (INV-AGENT-002 Logic Receipt
                            # is a Tier-1 prerequisite consumed by Ring 2A-authoring, NOT established here.)
```

---

## Context

The Rule Type Core substrate is ratified (ADR-0023): `rule_registry`, `rule_track_records`, the nine enums, the `vendor_rules` reconciliation, and the `org_settings` reservations all shipped in migration `20240163000000` and are green at HEAD. Ring 2A-core is **the first ring that consumes that substrate** — it makes the defined-but-inert tables do work.

Per the CTO-settled **H = split**, this design spec covers Ring 2A-**core**: the pure-core evaluator, the Agent Ladder gate, the Stage 1 canvas (read view + controller row actions), the Q-RC-AT-1 windowed read path, and the `rule_evaluation_log` payload landing. It does **not** cover Ring 2A-authoring (the agent conversational-drafting → approval → create path), which is a separate later arc that depends on the Logic Receipt write path as a **Tier-1 prerequisite** (Verification 1: INV-AGENT-002 is a broader cross-agent concern rule-core consumes, not authors).

This spec is the third pre-design artifact in the Ring 2A chain: brainstorm (`2de50113`, leans) → verification (`63c1d65c`, corrections) → this design spec (decisions). Two verification corrections are load-bearing here: **the capping table is ratified in `rule-type-core.md §6.1`** (Decision 4 implements it as canon, does not derive values), and **the Logic Receipt is broader than rule-core** (2A-core is unblocked by it; 2A-authoring depends on it).

---

## Decision

### 1. `rule_evaluation_log` table (Decision B substrate; one-write ratified)

Create `rule_evaluation_log` — the structured, queryable record of every evaluation. Columns (grounded against §5.7 MatchResult + the gate's `effective_action`):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `org_id` | `uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE` | tenant scope |
| `rule_id` | `uuid NOT NULL REFERENCES rule_registry(id) ON DELETE CASCADE` | the rule this record is about |
| `trace_id` | `uuid NOT NULL` | cross-event correlation (pino + audit) |
| `match_classification` | `text NOT NULL CHECK (match_classification IN ('primary_match','guardrail_match','almost_match'))` | §5.7 |
| `winning_branch_type` | `text NULL CHECK (winning_branch_type IN ('primary','guardrail'))` | §5.7 (`primary \| guardrail`, **not** `otherwise_if`); null on `almost_match` |
| `winning_branch_max_action` | `action_type NULL` | what the rule logic permitted (§5.7); null on `almost_match` |
| `effective_action` | `action_type NULL` | the gate's output (Decision 4); null when no proposal dispatched |
| `proposed_mutation_id` | `uuid NULL` | the proposal this evaluation ran against, if any |
| `disposition` | `text NULL` | approved / rejected / auto_posted / routed / pending; null until disposed |
| `evaluation_trace` | `jsonb NOT NULL` | the §5.7 typed trace (triggers fired, rules evaluated, branches considered, conflict-resolution decision, tiebreak-capping) |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |

**Indexes:** `(rule_id, created_at)` (the windowed read, Decision 2); `(org_id, created_at)` (tenant queries); `(trace_id)` (cross-event lookup).

**RLS:** `ENABLE ROW LEVEL SECURITY`; SELECT `USING (user_has_org_access(org_id))`; **no user-path INSERT** (evaluation is service-emitted — INSERT only via service_role, which bypasses RLS); UPDATE `USING (false)`; DELETE `USING (false)` (evaluation records are append-only — mirrors the substrate's service-emitted-append-only posture).

**One-write decision (ratify Verification 3's lean):** `rule_evaluation_log` is the **sole record** for evaluation events — `rule_evaluated` does **not** also emit a canonical `audit_log` row. This follows the live `ai_actions` precedent (HEAD pass (c)): a tenant-scoped structured agent log that stands alone. This is **not an INV-AUDIT-001 amendment** — INV-AUDIT-001 governs *mutating* service calls; an evaluation is read-shaped (the pure core does no I/O; the service assembles inputs and logs the outcome), not a state mutation. The genuinely-mutating downstream events — counter updates on `rule_track_records` (Decision 4) — remain separately audit-eligible via the existing `recordMutation` path if/when they route through a mutating service call.

*Alternatives rejected:* `before_state`-stuffing (ADR-0023 explicit reject; and Verification 1 distinguishes the Logic Receipt's `before_state` use from `rule_evaluated`); `audit_log` JSONB payload bloat (Verification 3: pollutes the canonical trail with rule-specific high-volume payload); two-writes (defensible under a strict INV-AUDIT-001 reading, but the `ai_actions` precedent shows read-shaped agent logs stand alone — adopting two-writes would add a per-evaluation canonical-trail row for a non-mutation, the wrong shape).

### 2. `rule_evaluation_30d_view` (Decision A read path)

Create a **plain SQL view** (not materialized), `CREATE VIEW rule_evaluation_30d_view WITH (security_invoker = true) AS …`, over `rule_evaluation_log`, windowed to the trailing 30 days, aggregating per `(org_id, rule_id)`.

- **`security_invoker = true`** (HEAD pass (b) refinement) — the view inherits `rule_evaluation_log`'s RLS for any caller, rather than running as owner and bypassing it. This corrects the latent cross-org footgun in the `document_cards_view` precedent (which is safe only via route-handler discipline).
- **Window:** rolling `created_at >= now() - interval '30 days'` (rolling 30×24h, not calendar-day — simpler and matches the "real-time, not daily-batch" §7 bar; no project cron/analytics precedent argues for calendar boundaries).
- **Aggregates per rule** (the canvas's data dependency, from brief §4 + §6.4 Q3): `evaluation_count`, `primary_match_count`, `guardrail_match_count`, `almost_match_count`, `clean_count` (primary_match with approved/auto_posted disposition), `rejection_count` (primary_match rejected), counts by `effective_action`, and `last_evaluated_at`. (The cumulative counters + `last_winning_match_at` come from `rule_track_records` directly; the view supplies the 30-day windowed numbers.)
- **Always-fresh:** query-time computation; no refresh mechanism. Meets §7 ("real-time or near-real-time, not daily-batch") by construction. At v1 scale (few rules, modest evaluation volume), the live aggregate over the `(rule_id, created_at)` index is cheap; a materialized view earns its place only if measured volume later makes the live view slow.
- **Canvas data access (HEAD pass (b)):** the canvas reads via a **route handler using the service-role client**, enforcing org-scoping in app code (`ctx.caller.org_ids.includes(orgId)` + `WHERE org_id = orgId`) — the `document_cards_view` / cards-endpoint pattern. The view's `security_invoker` RLS is defense-in-depth for any future direct authenticated query.

*Alternatives rejected:* materialized view (no matview/cron precedent in the project; freshness-wrong against the §7 bar; first-of-kind machinery); incremental windowed table (write-amplification on every evaluation, before measurement justifies it).

### 3. Pure-core evaluator at `apps/web/src/core/rules/`

The ratified empty home (spec §7; ADR-0020). **No DB / I/O / agent imports** — pure, deterministic, reproducible byte-for-byte (pattern rules; spec §5.3).

- **Entry point:** `evaluate(rules: Rule[], context: EvaluationContext): MatchResult` — pure function; the service layer assembles `rules` (registry rows + branches) and `context` (the proposal's typed fields + source trigger) and hands them in.
- **Closed-grammar predicate evaluators (pattern-only, Decision C):** `field_equals`, `field_in_range`, `field_outside_range`, `field_in_set`, `field_matches_pattern`, `source_trigger_equals`. Temporal (`schedule_matches`, `cadence_matches`) and inferential (`semantic_match_above_threshold`, `category_classification_matches`) predicates **defer to Ring 2B** — they need clock/model inputs that break purity differently and have no v1 rules to evaluate.
- **Branch evaluation:** walk branches in `branch_order`, first-match-wins; evaluate `primary` and `otherwise_if` branches (`otherwise` reserved post-v1, §5.2). Conditions AND'd in `condition_order`.
- **Conflict resolution (§6.1 step 4; type-agnostic, ships fully):** (4a) most-specific predicate wins (deterministic specificity weights, §5.5); (4b) tied → most-conservative `tiebreak_effective_action`; (4c) tied → most-recently activated/promoted; (4d) → stable `rule_id` UUID order.
- **`MatchResult` (§5.7):** `winning_rule_id`, `winning_branch`, `winning_branch_type` (`primary|guardrail`), `winning_branch_max_action`, `match_classification`, `also_matched_rules`, `almost_match_rules`, `track_record_snapshot`, `four_questions_population`, `evaluation_trace`. **No `effective_action`** — the load-bearing pure-core-vs-gate separation (§6.1.1). The pure core may compute a `tiebreak_effective_action` internally for ordering (4b) but does not propagate it as authoritative.

### 4. Agent Ladder gate at `apps/web/src/agent/policies/agent-ladder/`

The ratified empty home (ADR-0020). Orchestrator-layer (not pure-core — it reads canonical rung/limit state).

- **Capping (CORRECTED per Verification 2 — implement, don't derive):** implement `rule-type-core.md §6.1`'s **ratified 9-row capping table** as canon. The gate function takes `(MatchResult, rule_registry_row)` → `effective_action`, capping `winning_branch_max_action` by `current_rung` per the table (`auto_post_at_rung_*` are rung-capped; the three conservative actions pass through; a higher rung never *elevates*). At v1 (`current_rung = always_confirm` only), capping trivially routes every `auto_post_at_rung_*` to `suggest_with_required_approval` — human approval — consistent with the v1 asymmetry; the post-v1 rows ship as the inert capping function.
- **Three downstream gate components ship as defined-but-inert stubs** with explicit `// activates post-v1` markers, each a named function returning pass-through at v1, structured so post-v1 activation is a single-file change: `checkPerTransactionLimit(...)`, `checkDailyAggregate(...)`, `checkTrackRecordHealth(...)`. They have nothing to gate at v1 (no rung above `always_confirm`). The gate decision-tree *structure* (the 5 steps, `agent_autonomy_model.md §7`) is the pipeline; §6.1's table is the rung-step's numeric output.
- **Counter writes:** on disposition, the gate routes counter increments to `rule_track_records` via `ruleTrackRecordService.recordEvaluation(...)` on the **service-role client** — honoring the migration's `USING(false)` user-path UPDATE/DELETE RLS mechanically (service_role bypasses; no user path mutates counters).

### 5. Stage 1 canvas

- **Component:** `apps/web/src/components/canvas/RuleRegistryView.tsx` (matches `OpenBillsView`/`PendingDocumentsView` shape; HEAD pass (d)).
- **List view:** rule `name`, scope (vendor + `bundle_type` for vendor rules), `current_rung` badge, `lifecycle_state` badge (two separate badges), 30-day track-record indicator (from `rule_evaluation_30d_view`), last winning match (from `rule_track_records.last_winning_match_at`), sort/filter (by rung, lifecycle, track-record health, recency).
- **Data access (HEAD pass (b)):** a route handler (`GET /api/orgs/[orgId]/rules` or similar) on the **service-role client**, checking `ctx.caller.org_ids.includes(orgId)` and filtering `WHERE org_id = orgId`, joining `rule_registry` ⋈ `rule_track_records` ⋈ `rule_evaluation_30d_view`. The `document_cards_view` route-handler precedent; not direct operator-RLS reads.
- **4 row actions (controller-only — `rule_registry` CUD RLS = `user_is_controller`):** promote (modal — see sub-question), demote (one-click), rename, retire (with confirm). All write `rule_registry` via `ruleRegistryService`.
- **Detail surface — behavior, not logic:** track-record breakdown, recent matches (from `rule_evaluation_log`), last winning match, lifecycle anchors. Does **NOT** render Trigger/Condition/Action structure (Stage 2). The **Four Questions are NOT canvas content** (brainstorm correction) — they render on chat proposal cards (Ring 2A-authoring), and carry the Logic Receipt dependency the canvas does not.
- **Promotion-modal-at-v1 (sub-question → ratified decision):** **ship the modal with inert post-v1 targets**, surfaced in-UI as "promotion ceremony available post-v1 (rungs above Always Confirm not yet active)." Justification: the affordance is the brief's centerpiece tuning surface, the scaffolding earns its place before rung activation, and shipping it inert mirrors the substrate-only-v1 posture. **Flag for product/UX at ratification** — if they prefer deferral until rung activation, demote/rename/retire ship and promote defers.

### 6. Services (greenfield authoring at `apps/web/src/services/rules/`)

All three Ring 1 services + the evaluation service are greenfield (Ring 1 deferred service code; HEAD pass (a)). Dependency direction: orchestrator → services → repositories + pure core; core imports nothing (§7 / ADR-0020).

- **`ruleRegistryService.ts`** — sole writer for `rule_registry`. `create(rule, ctx)` **co-creates the `rule_track_records` row in the same transaction** (Ring 1 Decision 5 co-creation rule, honored); `promote(rule_id, target_rung, ctx)`, `demote(rule_id, ctx)`, `rename(rule_id, name, ctx)`, `retire(rule_id, ctx)` (controller-authority via RLS); identity-anchored read methods for the canvas join.
- **`ruleTrackRecordService.ts`** — sole *updater* of `rule_track_records` after creation. `recordEvaluation(rule_id, classification, disposition, ctx)` (the gate's write path, service_role); counter read methods.
- **`vendorRuleService.ts`** — sole writer for `vendor_rules`. `create(rule_id, org_id, vendor_id, bundle_type, ctx)` (the vendor-rule child; composite FK to `rule_registry`).
- **Creation orchestration:** creating a vendor rule co-ordinates two single-writers in one transaction — `ruleRegistryService.create` (registry + track_records co-created) then `vendorRuleService.create` (the `vendor_rules` child). Named home: `ruleCreationOrchestrator` (a service-layer-top helper). **Note:** the *caller* of creation (the agent conversational-drafting approval) is Ring 2A-authoring; Ring 2A-core authors the orchestrator + services so the creation path exists and is unit-testable against seeded inputs, but no production creation surface wires it yet.
- **`ruleEvaluationService.ts`** — orchestrator-layer. Assembles inputs (registry + track_records reads), calls the pure-core `evaluate(...)`, returns `MatchResult`; writes the `rule_evaluation_log` row (Decision 1/7). **No state mutation** beyond the append-only evaluation-log insert.

### 7. `rule_evaluated` event integration

- The event vocabulary is reserved (ADR-0023 §8.5). Ring 2A-core authors the emitter at `ruleEvaluationService`'s boundary.
- **Emit pattern:** `ruleEvaluationService` writes the `rule_evaluation_log` row on **every** evaluation (win or lose) — this is the `rule_evaluated` landing (one-write, Decision 1). The disposition handler (downstream of the gate's `effective_action`) updates counters via `ruleTrackRecordService.recordEvaluation`, which is where the `rule_match_confirmed` / `rule_match_rejected` semantics live (the counter deltas). 
- **One-write honored:** `rule_evaluation_log` is the sole record for `rule_evaluated`; no paired `audit_log` row. Counter mutations on `rule_track_records` are separately audit-eligible via `recordMutation` if they route through a mutating service call.

### 8. Reserved enums consumed (no new enums)

- Evaluator consumes `condition_type` — six pattern values active; four (temporal/inferential) reserve-only until Ring 2B.
- Gate consumes `action_type` — full closed set (five values).
- Orchestrator consumes `trigger_type` — eight values (trigger lookup at the evaluator entry point).
- `rule_autonomy_rung`, `rule_type`, `rule_lifecycle_state` consumed by the canvas + gate reads. **No enum creations** — all shipped at Ring 1.

---

## Migration outline

ADR-0024 ships **one migration** creating `rule_evaluation_log` + its view. Ordered DDL outline (not executable SQL — a separate authoring pass after ratification, per the ADR-0023 → migration sequence):

a. **Create `rule_evaluation_log`** — all columns per Decision 1 (`winning_branch_type` CHECK = `('primary','guardrail')`; `match_classification` CHECK = three states; FKs to `organizations`/`rule_registry` with `ON DELETE CASCADE`).
b. **Create indexes** — `(rule_id, created_at)`, `(org_id, created_at)`, `(trace_id)`.
c. **Enable RLS** — `ENABLE ROW LEVEL SECURITY`; SELECT `user_has_org_access(org_id)`; INSERT service_role only (no user-path policy); UPDATE `USING(false)`; DELETE `USING(false)`.
d. **Create `rule_evaluation_30d_view`** — plain view `WITH (security_invoker = true)` over `rule_evaluation_log`, rolling-30-day window, aggregates per Decision 2; `GRANT SELECT TO service_role, authenticated`.

No `vendor_rules` / `rule_registry` / `rule_track_records` changes (substrate settled at ADR-0023). No new enums. The substrate-mod test-staleness review (`.claude/rules/migrations.md`) fires at migration-authoring time (new table + new RLS + new index).

---

## Non-decisions

This spec explicitly does **not**:
- Author temporal or inferential evaluators (Ring 2B).
- Author the agent conversational-drafting path (Ring 2A-authoring).
- Author the Logic Receipt write path / register INV-AGENT-002 (a Tier-1 prerequisite serving Ring 2A-authoring; Verification 1).
- Modify ADR-0023 substrate or add reserved enums.
- Define the refinement loop (Ring 3, §9.3) or the rule-amendment lineage *create* path (Ring 2A-authoring; immutability + retire-and-create-new is canon per ADR-0023).
- Wire a production rule-creation surface (the creation orchestrator + services are authored and unit-testable against seeded inputs; the caller is 2A-authoring).

---

## Consequences

**Enables.**
- The substrate does work: the evaluator runs against seeded rules, the gate caps via §6.1, the canvas renders behavior, the windowed view materializes always-fresh, and `rule_evaluation_log` captures every evaluation.
- `rule_evaluation_30d_view` with `security_invoker = true` is RLS-safe for any caller — an improvement over the `document_cards_view` precedent's route-handler-only safety.
- Clean exit criteria for Ring 2A-core, independent of authoring: evaluator green against seeded rules, gate caps correctly, canvas renders, view + log verified.

**Constrains / costs.**
- `rule_evaluation_log` one-write means evaluation events are **not** in the canonical `audit_log` trail. Accepted per the `ai_actions` precedent (read-shaped agent log); the design spec records this as the deliberate INV-AUDIT-001 interpretation (evaluation ≠ mutation), not an amendment. A future auditor querying "every system action" must union `audit_log` + `rule_evaluation_log` (as they already must for `ai_actions`).
- The promotion modal ships inert at v1 — UI scaffolding present before its target rungs activate (the substrate-only-v1 cost, accepted; flagged for product/UX).
- Three gate components ship inert — gate-pipeline surface exists ahead of post-v1 activation (ADR-0010 reserved-state cost shape, one level up).
- Pattern-only evaluator means temporal/inferential rules can't be evaluated until Ring 2B — acceptable, since no such rules exist at v1.

## Open questions

Carried forward for CTO / product-UX:
1. **Decision F — UI label (product/UX, parallel).** Pick from `last fired` / `last selected` / `last won` / `last decisive match`. Spec records the chosen label at ratification.
2. **Promotion-modal-at-v1 (Decision 5).** Ratified as ship-with-inert-targets; flag if product/UX prefers deferral.
3. **INV-ID assignment (ratification).** Whether Ring 2A-core establishes an evaluator-determinism or single-writer INV-* (the substrate became *enforced* once the evaluator wires runtime behavior). Frontmatter `invariants: []` pending that call.
4. **Ring 2A-authoring (separate arc).** Opens with the Logic Receipt write path as a known Tier-1 prerequisite (Verification 1) — whether a Tier-1 arc lands it or 2A-authoring does is that arc's opening question.

---

## Cross-references

- ADR-0023 (`0023-rule-type-core-substrate.md`) — the substrate Ring 2A-core consumes.
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-brainstorm.md` — leans (point-in-time).
- `docs/09_briefs/post-mvp/2026-05-26-ring2a-pre-adr-verification.md` — corrections; **Verification 2** (capping table ratified in §6.1 — Decision 4 implements as canon) and **Verification 1** (Logic Receipt is Tier-1, not rule-core — 2A-core unblocked).
- `docs/02_specs/rule-type-core.md` — §5.7 (MatchResult), §6.1 (capping table + pure-core/gate separation), §6.4 (Four Questions — chat surface, not canvas), §7 (evaluator home + purity).
- ADR-0007 §Tier 1 — Logic Receipt ownership (INV-AGENT-002); ADR-0020 — Authority Gradient source-tree homes (`core/rules/`, `agent/policies/agent-ladder/`).
- `supabase/migrations/20240154000000_document_cards_view.sql` — the plain-view + route-handler precedent (and its RLS footgun, corrected here via `security_invoker = true`).
- ADR-0021 §4 — pre-ratification design-spec lifecycle.

---

*Pre-ratification design spec. The ADR-0024 file (`status: ratified`) is authored from this spec at CTO ratification; the executable migration is a separate pass after that. Not committed; not pushed.*
