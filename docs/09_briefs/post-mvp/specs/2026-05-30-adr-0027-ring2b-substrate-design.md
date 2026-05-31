# ADR-0027 design spec — Ring 2B: branch/condition substrate + production branchSource + Seam-1 wiring

**Pre-ratification design spec.** Authored 2026-05-30 in the Ring 2B substrate
design-authoring arc (`ring-2b-substrate-8680e323`), anchored at `origin/staging`
`8680e323`. Ratifies as **ADR-0027** on CTO chat-ratification. Scope-lock:
`docs/09_briefs/post-mvp/2026-05-30-ring2b-substrate-scope-lock.md`.

All decisions below are disk-grounded (HEAD-pass + pre-ADR verification this arc);
citations are to shipped code/migrations so each is cheap to re-check.

## Context

Ring 0 (rule-type-core spec) / Ring 1 (ADR-0023, `20240163` — registry, track-records,
ADR-0017 drift) / Ring 2A-core (ADR-0024/0025 — evaluator stack, `ruleEvaluationService`,
`evaluateAndDispatch`) are shipped. The matching engine is **structurally inert in
production**: `ruleEvaluationService.evaluate` assembles `Rule[]` via
`branchSource ?? noBranchSource` where `noBranchSource = () => []` → branchless rules →
`almost_match`/no winner; and `evaluateAndDispatch` has **zero production callers**
(test-exercised only). What's missing is (a) real branches to feed the seam and (b) a
live caller. `core/rules/types.ts` header: *"no predicate-storage substrate this arc
(ADR-0025 Non-decision); the service layer assembles Rule[] from rule_registry rows."*
Ring 2B is that substrate, for **pattern (vendor) rules on the drag-drop-bill scope**.

**Scope boundary (A1a, substrate-only):** ships storage + production `branchSource` +
the thin Seam-1 call, **shadow/diagnostic-capable (§9.2)**, but does **not** live-wire
auto-posting (deferred to a workflow arc once `document-v2-workflow.md` exists). **No
temporal/inferential evaluator-building** — `predicates.ts` is pattern-complete (6 of
§5.5's 10 conditions); the 4 temporal/inferential are absent-by-design (`branchEvaluator`
throws), and per §10 belong to separate later workflow ships.

## Decision 1 — Branch/condition storage: normalized child tables + JSONB for the one polymorphic field

Two new tables, mirroring the **`rule_track_records` registry-child pattern** (`20240163`,
Decision 2), *not* the `vendor_rules` composite-scoped-FK pattern. The distinction is
load-bearing: `vendor_rules` carries `org_id` + composite FK because it has an org-scoped
business key (the `(org_id, legal_entity_id, vendor_id, bundle_type)` index); the composite
FK's "parent/child can't diverge on org_id" guarantee only means something with an
independent child `org_id`. Branch/condition uniqueness is **rule-scoped**
(`(rule_id, branch_order)` / `(branch_id, condition_order)`) — no org-scoped key — so
carrying `org_id` would reintroduce the scope-drift the composite FK exists to prevent.

- **`rule_branches`** — `id uuid PK`; `rule_id uuid NOT NULL REFERENCES rule_registry(id)
  ON DELETE CASCADE` (simple cascade FK, no `org_id`); `branch_order int NOT NULL`;
  `branch_type branch_type NOT NULL` (**new enum — must `CREATE TYPE branch_type AS ENUM
  ('primary','otherwise_if')`; NOT shipped** — or `text` + CHECK); `max_outcome_action
  action_type NOT NULL` (shipped, `20240163` reserve-only); `applies_to_evaluation_triggers
  trigger_type[] NOT NULL`; `applies_to_source_triggers trigger_type[]` (nullable = any);
  `UNIQUE(rule_id, branch_order)`. CHECK: exactly one `primary` per rule enforced at the
  service/RPC layer (cross-row, not a column CHECK).

  **Trigger-enum grounding (disk):** there is **no `evaluation_trigger`/`source_trigger`
  Postgres enum** — `trigger_type` is the only shipped trigger enum (`20240163`).
  `shared/rules/types.ts` realizes the §5.4 distinction at the **TS layer**:
  `EvaluationTrigger = Extract<TriggerType,'proposed_mutation_generated' |
  'proposed_mutation_bundle_generated'>`, `SourceTrigger = TriggerType`. So both columns
  are **`trigger_type[]`**; the two-value evaluation-trigger subset is enforced at the
  `ruleBranchService` assembly boundary (the same place `condition_value` is validated) — or
  via a DB CHECK (ADR micro-decision). The §5.4 eval/source distinction is real but lives at
  the TS layer, not as two DB enums.
- **`rule_conditions`** — `id uuid PK`; `branch_id uuid NOT NULL REFERENCES rule_branches(id)
  ON DELETE CASCADE`; `condition_order int NOT NULL`; `condition_type condition_type NOT
  NULL`; `target_field text NOT NULL`; `condition_value jsonb NOT NULL`; `UNIQUE(branch_id,
  condition_order)`.

**Why hybrid (normalized rows + JSONB `condition_value`):** `core/rules/types.ts` defines
`Condition.condition_value: unknown`, *"typed per condition_type at the predicate boundary
(range = {min,max}, set = unknown[], equals/pattern = scalar/string), validated by the
service layer that assembles rules; the pure core trusts the assembled shape."* So the one
genuinely-polymorphic field is JSONB (validated at the `ruleBranchService` assembly
boundary against the per-`condition_type` shape); everything else is normalized for
ordering, querying, and per-row immutability. This dissolves the normalized-vs-JSONB
binary rather than picking a side — JSONB only where the contract is polymorphic. (The
§5.7 `closest_branch_id`/`failed_conditions` diagnostics are computed at runtime from the
in-memory `Branch[]`, not queried from storage, so they do not argue for or against JSONB.)

## Decision 2 — §5.1 logic-freeze: column-immutability trigger on the new tables

§5.1: `triggers`/`branches` (incl. conditions + `max_outcome_action`) are **immutable
after `lifecycle_state = active`**; amendment is **retire-and-create-new** (new `rule_id`,
predecessor/successor links, fresh track record). Rationale (§5.1): *"every historical
MatchResult points at a `rule_id` whose logic is guaranteed to be the logic that fired —
audit reproducibility holds without a `rule_version_id`."*

Branches/conditions are **write-once at creation** (`proposed` state), frozen at `active`.
RLS (Decision 3) blocks user UPDATE/DELETE entirely. **Lean: also land a column-immutability
trigger** on `rule_branches`/`rule_conditions` that rejects mutation once the parent
`rule_registry.lifecycle_state` is past `proposed` — belt-and-suspenders over RLS + the
retire-and-create-new discipline. Rationale for the trigger (stronger than `20240163`'s
deferred `created_*`-anchor case): branches *are* the fiduciary logic the §5.1
audit-reproducibility guarantee depends on, so the immutability stakes justify the trigger
even though triggers aren't a uniform convention (~7/55 tables) and `vendor_rules` lacks
them. **Open question OQ-RTC-2B-1:** trigger vs RLS-`USING(false)`-only — CTO call at
ratification.

**Separable (flag, do NOT bundle):** retroactively landing column-immutability triggers on
the *existing* `rule_registry`/`rule_track_records` `created_*`/lineage anchors (the
`20240163:65-73` "CONSIDERED, DEFERRED" concern) widens scope into existing tables; it is
**not** this arc's work.

## Decision 3 — RLS: mirror `rule_track_records` (through-parent SELECT/INSERT; UPDATE/DELETE `USING(false)`)

Both tables: no direct `org_id`; derive org through the parent `rule_registry` row.
- SELECT — through-parent `EXISTS (rule_registry r WHERE r.id = rule_id AND
  user_has_org_access(r.org_id))`.
- INSERT — through-parent `user_is_controller(r.org_id)` (branches co-created with the rule
  at creation, controller-only).
- UPDATE / DELETE — `USING (false)` (no user mutation; matches the write-once-immutable
  semantics, and `rule_track_records`' own "policies match the actual mutation semantics,
  not the registry CUD shape"). `rule_conditions` derives through `rule_branches` →
  `rule_registry` (two-hop through-parent).

## Decision 4 — production `branchSource` replaces `noBranchSource`

A production `BranchSource` (`(registryRow) => Branch[]`) reads `rule_branches` +
`rule_conditions` for the rule and assembles the in-memory `Branch[]` the pure core
consumes — validating `condition_value` against the per-`condition_type` shape at this
boundary (the assembly point `types.ts` names). `ruleEvaluationService.evaluate` already
threads `input.branchSource ?? noBranchSource`; the production caller (Decision 5) supplies
the real one. `noBranchSource` remains for tests.

## Decision 5 — thin Seam-1 call to the existing `evaluateAndDispatch`

`evaluateAndDispatch` (shipped, ADR-0025 §7) implements the full `evaluate → gate →
recordEvaluation → counter` flow and is proven end-to-end by
`ruleEvaluateAndDispatch.integration.test.ts` with a fixture `branchSource`. Ring 2B adds a
**production caller** at Seam-1 that supplies the production `branchSource`, running in
**shadow/diagnostic mode (§9.2)** — the MatchResult + Logic Receipt (`rule_evaluation_log`)
are recorded, but the effective action is **not** auto-posted (A1a). Live auto-posting is a
later workflow arc. (Exact Seam-1 production site is an implementation-arc concern;
candidates surface against the drag-drop-bill pipeline at implementation scope-lock.)

## Decision 6 — `default_account_id` + vendor-name resolution

Turning a winning vendor rule into a usable posting needs `default_account_id` resolution
(the Ring 2A OQ-2 defer; `vendor_rules.default_account_id` already exists) + **vendor-name
resolution** (the service comment flags *"NO vendor-name resolution at v1 (vendor_id is a
uuid)"*). These are **domain-parameter** resolution (per the §5.10 reconciliation below),
distinct from branch/condition structure. v1 shadow scope: resolve + record in the trace;
posting consumption defers to the workflow arc.

## Decision 7 — single-writer `ruleBranchService`, atomic write inside the extended SECURITY-DEFINER creation RPC

Per §5.10 disjoint-by-table: a new **`ruleBranchService`** owns `rule_branches` /
`rule_conditions` (TS-layer disjointness). Because branches are **co-created with the rule
in one atomic transaction** at creation (`proposed` state), the physical write extends the
existing `create_vendor_rule_atomic` RPC (or a sibling) to insert branch/condition rows
alongside the registry/track-record/vendor rows. **A3: the SECURITY-DEFINER forward-flag
extends** to the modified RPC (create/approve lineage). **OQ-RTC-2B-2:** extend
`create_vendor_rule_atomic` vs a dedicated branch-authoring RPC — implementation-arc call.

## §5.10 reconciliation (ADR-scoped doc-internal inconsistency)

§5.10's intro says domain tables "hold the type-specific FK structure and Branch /
Condition / Action **details**," but its allocation says `vendor_rules` owns
"vendor-specific scope **only**" (vendor_id, default_account_id, bundle_type,
legal_entity_id, unique constraint) and never places branches on the registry — so the
spec, taken whole, does not say where branches live. This ADR reconciles:

- Branch/condition **structure** is **uniform** across rule types (`core/rules/types.ts` —
  `Branch`/`Condition` carry no `rule_type`-specific fields; the core consumes `Branch[]`
  uniformly) → **registry-keyed child tables** (`rule_branches`/`rule_conditions` keyed by
  `rule_id`, parallel to `rule_track_records`), **not** per-materialization.
- Action **type** (`max_outcome_action`) is uniform → on the branch.
- Action **domain parameters** (`default_account_id`, vendor-name) are domain-specific →
  already on `vendor_rules` (Decision 6).

The §5.10 intro conflates *structure* (uniform → registry-keyed) with *parameters*
(domain-specific → materialization). **Flag a §5.10 intro touch-up** to state the
structure/parameter split. (This is a concrete, ADR-scoped doc reconciliation; it does
**not** touch the deferred α/β codification — graduate nothing.)

## Migration outline

One migration (`20240169`): **`CREATE TYPE branch_type AS ENUM ('primary','otherwise_if')`**
(NOT shipped; `condition_type`/`action_type`/`trigger_type` already exist `20240163`
reserve-only) → `CREATE TABLE rule_branches` + `rule_conditions` (trigger columns
`trigger_type[]` per Decision 1's grounding) → their RLS policies (Decision 3) → the §5.1
immutability trigger (Decision 2, pending OQ-RTC-2B-1) → extend the creation RPC to write
branch/condition rows (Decision 7, pending OQ-RTC-2B-2). Table-shape change → `types.ts`
regen. SECURITY-DEFINER on the modified RPC (A3).

## Open questions for ratification

- **OQ-RTC-2B-1** — immutability trigger vs RLS-only for the §5.1 freeze (lean: trigger).
- **OQ-RTC-2B-2** — extend `create_vendor_rule_atomic` vs dedicated branch-authoring RPC.
- **OQ-RTC-2B-3 (invariant registration)** — the §5.1 branch/condition logic-freeze warrants
  a new **`INV-RULE-004`** (Layer 1a, DB-trigger/RLS-enforced, sibling to INV-RULE-001's
  append-only log). **Not `INV-RULE-002`** — that is taken (the pure-core evaluator
  *determinism* invariant, ADR-0025; INV-RULE-003 is the `rule_evaluation_log` single-writer).
  **Timing:** per `invariants.md`'s spec-without-enforcement rule (no INV-ID is added before
  its enforcement exists in code), INV-RULE-004 registers **at the implementation arc** when
  the freeze trigger/RLS actually lands — **not** at this design-authoring ADR's ratification.
  This ADR reserves the *intent*; the `invariants.md` edit + the implementing commit's
  `invariants: [INV-RULE-004]` frontmatter land **with the enforcing code**.
- **modules-taxonomy fold (N=3, forced here)** — ADR-0027 is squarely a `services/rules/`
  ADR, but `docs/02_specs/taxonomy.md` Modules has **no `rules` token** (the gap that bit
  adr:lint at ADR-0025/0026). **Lean: FOLD** — add a `rules` row (Source:
  `apps/web/src/services/rules/`; rule registry / evaluation / track-records / vendor rules
  / authoring / branch substrate) so ADR-0027 tags `modules: [rules, db, agent]` accurately,
  retiring the recurring gap. Alternative: mistag `[db, agent]` and defer (perpetuates the
  gap). One-row addition; CTO call at ratification.

## Parked carry-forwards (unchanged)

α/β codification stays DEFERRED (obs-grain N=1; graduate nothing). §3 four-item-drift table
+ §11.1 INV-AGENT-002→INV-RULE-001 spec-staleness touch-ups (footnote-grade). Concern (i)
existing-table `created_*` immutability triggers (separable, not this arc).
