---
id: "0027"
title: "Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring"
status: ratified
date: "2026-05-30"
deciders: [phil]
modules: [rules, db, agent]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0010", "0017", "0020", "0023", "0024", "0025"]
invariants: []
---

# ADR-0027: Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring

## Status

Ratified 2026-05-30 by phil per the Ring 2B substrate design spec
(`docs/09_briefs/post-mvp/specs/2026-05-30-adr-0027-ring2b-substrate-design.md`,
committed `ee8b3a82`) and the CTO chat-ratification of that design spec on
2026-05-30. Scope-lock: `docs/09_briefs/post-mvp/2026-05-30-ring2b-substrate-scope-lock.md`
(`04e9807e`).

## Date

2026-05-30

## Triggered by

Ring 2A-core (ADR-0024/0025) shipped the rule evaluator stack, `ruleEvaluationService`,
and the `evaluateAndDispatch` coordinator, but they are **structurally inert in
production**: `evaluate` assembles `Rule[]` via `branchSource ?? noBranchSource` where
`noBranchSource = () => []` → branchless rules → `almost_match`/no winner, and
`evaluateAndDispatch` has **zero production callers** (test-exercised only). `core/rules/
types.ts`: *"no predicate-storage substrate this arc (ADR-0025 Non-decision); the service
layer assembles Rule[] from rule_registry rows."* Ring 2B is that substrate, for **pattern
(vendor) rules on the drag-drop-bill scope**.

## Context

Ring 1 (ADR-0023, `20240163`) shipped `rule_registry` / `rule_track_records` / the
ADR-0017 drift. Ring 2A-core (ADR-0024/0025) shipped the pure evaluator (`core/rules/`),
`ruleEvaluationService.evaluate`/`recordEvaluation`, `evaluateAndDispatch`, and
`rule_evaluation_log` (INV-RULE-001). What is absent on disk: branch/condition **storage**
(highest rule-migration is `20240168`; no `rule_branches`/condition table/predicate column),
a production `branchSource`, and a live caller. The §5.5 evaluator is **pattern-complete**
(six conditions + 3-tier weights); the four temporal/inferential evaluators are
absent-by-design (`branchEvaluator` throws) and belong to separate later workflow ships
per §10 — **not this arc**.

Scope is **A1a (substrate-only)**: ships the substrate + a shadow/diagnostic-capable
(§9.2) wiring, but does **not** live-wire auto-posting (deferred to a workflow arc once
`document-v2-workflow.md` exists). Arc shape is **two-arc** (this design-authoring arc →
a fresh implementation arc), per the RI-7 estimate (5 ADR-resolving framings + volume near
chunk-3's bound).

## Decision

1. **Branch/condition storage — normalized child tables + JSONB for the one polymorphic
   field.** Two new tables keyed by `rule_id`, mirroring the `rule_track_records`
   registry-child pattern (`20240163`), **not** the `vendor_rules` composite-scoped-FK
   pattern: branch/condition uniqueness is rule-scoped (`(rule_id, branch_order)` /
   `(branch_id, condition_order)`), so there is no org-scoped business key and no `org_id`
   column. `rule_branches`: `id`, `rule_id REFERENCES rule_registry(id) ON DELETE CASCADE`,
   `branch_order`, `branch_type`, `max_outcome_action action_type`,
   `applies_to_evaluation_triggers trigger_type[]`, `applies_to_source_triggers
   trigger_type[]` (nullable). `rule_conditions`: `id`, `branch_id REFERENCES
   rule_branches(id) ON DELETE CASCADE`, `condition_order`, `condition_type`, `target_field`,
   `condition_value jsonb`. `condition_value` is JSONB because `core/rules/types.ts` types it
   `unknown` (per-`condition_type` shape, validated at the `ruleBranchService` assembly
   boundary); everything else is normalized for ordering/querying/immutability. **Enum
   grounding:** `branch_type` is a **new** enum (`CREATE TYPE branch_type AS ENUM
   ('primary','otherwise_if')`); `condition_type`/`action_type`/`trigger_type` are shipped
   (`20240163`). There is **no `evaluation_trigger`/`source_trigger` Postgres enum** — the
   §5.4 eval/source distinction lives at the TS layer (`EvaluationTrigger = Extract<
   TriggerType,…2 values>`, `SourceTrigger = TriggerType`); both columns are `trigger_type[]`,
   the two-value eval subset enforced at the assembly boundary or a DB CHECK.

2. **§5.1 logic-freeze enforced by a column-immutability trigger** on the new tables (the
   ratified resolution of the design spec's OQ-2B-1). Branches/conditions are write-once at
   creation (`proposed`), frozen at `active`; amendment is retire-and-create-new (§5.1, no
   `rule_version_id`). The trigger is belt-and-suspenders over the RLS `USING(false)` of
   Decision 3 — justified (over `20240163`'s deferred `created_*`-anchor case) because the
   branch logic *is* the fiduciary substrate the §5.1 audit-reproducibility guarantee rests
   on. **This freeze is `INV-RULE-004` (Layer 1a)** — *reserved here, registered at the
   implementation arc* when the enforcing trigger/RLS lands (per `invariants.md`'s
   spec-without-enforcement rule; `INV-RULE-002` = evaluator determinism and `003` = log
   single-writer are taken). Retroactive `created_*`-anchor triggers on existing
   `rule_registry`/`rule_track_records` (the `20240163` deferral) are **out of scope**.

3. **RLS mirrors `rule_track_records`:** through-parent SELECT (`user_has_org_access`) +
   INSERT (`user_is_controller`, branches co-created with the rule); UPDATE/DELETE
   `USING(false)` (write-once-immutable, matching the actual mutation semantics, not the
   registry CUD shape). `rule_conditions` derives org two-hop through `rule_branches` →
   `rule_registry`. No direct `org_id`.

4. **Production `branchSource`** replaces the `noBranchSource` no-op — reads
   `rule_branches`+`rule_conditions` and assembles the in-memory `Branch[]` the pure core
   consumes, validating `condition_value` per `condition_type` at this boundary.
   `noBranchSource` remains for tests.

5. **Thin Seam-1 call** to the existing `evaluateAndDispatch` (shipped, ADR-0025 §7;
   proven end-to-end by `ruleEvaluateAndDispatch.integration.test.ts`). Ring 2B adds a
   production caller supplying the production `branchSource`, in **shadow/diagnostic mode
   (§9.2)** — MatchResult + Logic Receipt recorded, effective action **not** auto-posted
   (A1a). Live auto-posting is a later workflow arc.

6. **`default_account_id` + vendor-name resolution** (domain-parameter resolution; the
   Ring 2A OQ-2 defer) — resolved + recorded in the trace at v1 shadow scope; posting
   consumption defers to the workflow arc.

7. **Single-writer `ruleBranchService`** owns `rule_branches`/`rule_conditions` (§5.10
   disjoint-by-table). Branches are co-created with the rule in one atomic transaction; the
   write extends the SECURITY-DEFINER creation RPC (A3 — the SECURITY-DEFINER forward-flag
   extends; create/approve lineage). **Deferred to implementation (OQ-2B-2):** extend
   `create_vendor_rule_atomic` vs a dedicated branch-authoring RPC.

**§5.10 reconciliation.** §5.10's intro says domain tables "hold the type-specific FK
structure and Branch / Condition / Action **details**," but its allocation says
`vendor_rules` owns "vendor-specific scope **only**" and never places branches on the
registry — so the spec, taken whole, does not say where branches live. This ADR reconciles:
branch/condition **structure** is uniform (`core/rules/types.ts` — no `rule_type`-specific
fields) → registry-keyed child tables; action **type** (`max_outcome_action`) is uniform →
on the branch; action **domain parameters** (`default_account_id`, vendor-name) are
domain-specific → on `vendor_rules`. The §5.10 intro conflates structure with parameters;
a footnote touch-up to §5.10 states the split (footnote-grade; lands with the spec edit).

## Consequences

- **Enables** pattern (vendor) rules to actually match end-to-end in production (shadow):
  real branches feed the shipped-but-inert evaluator; the Logic Receipt records winners.
  The §5.1 immutability trigger makes the audit-reproducibility guarantee DB-enforced, not
  just service-disciplined.
- **Constrains** to A1a: no auto-posting until a later workflow arc — the diagnostic value
  is real (matching + logging) but the fiduciary action is withheld pending the workflow
  spec. Storage is write-once (retire-and-create-new amendment); no in-place branch edits,
  matching §5.1 but adding operational ceremony for rule changes.
- **Cost:** a new enum (`branch_type`), two tables + their RLS + an immutability trigger, an
  extended SECURITY-DEFINER RPC, and a `types.ts` regen. The trigger is non-uniform
  convention (~7/55 tables) — accepted for the fiduciary-logic stakes.

## Alternatives considered

- **`vendor_rules` composite-scoped-FK pattern for the new tables** — rejected: branch/
  condition uniqueness is rule-scoped, so carrying `org_id` to enable the composite FK would
  reintroduce the scope-drift the composite FK exists to prevent. The `rule_track_records`
  simple-cascade pattern is the disk-canon for org_id-less registry-child detail tables.
- **Pure JSONB predicate blob** — rejected as the primary shape: loses per-row immutability-
  trigger granularity + ordering/query structure for the uniform parts; JSONB is retained
  only for `condition_value` (genuinely polymorphic). (The §5.7 diagnostics are computed at
  runtime from in-memory `Branch[]`, not queried, so they neither favor nor disfavor JSONB.)
- **RLS-`USING(false)`-only for the §5.1 freeze** (no trigger) — viable, but the trigger is
  the belt-and-suspenders the fiduciary-logic stakes justify (OQ-2B-1, ratified toward trigger).
- **Per-materialization branch storage** (§5.10 intro's literal reading) — rejected: the
  Branch contract is uniform across rule types, so per-domain storage duplicates identical
  structure; registry-keyed child tables are CTI-consistent with `rule_track_records`.
- **Live auto-post wiring this arc (A1b)** — rejected: couples to an unwritten
  `document-v2-workflow.md`; A1a's substrate-then-consumer split is lineage-consistent.

## Cross-references

- Spec: `docs/02_specs/rule-type-core.md` §4 / §5.1 / §5.2 / §5.5 / §5.7 / §5.10 / §9.2 / §10.
- ADRs: 0023 (Ring 1 substrate), 0024 (Ring 2A-core, INV-RULE-001), 0025
  (implementation-seams, INV-RULE-002/003, INV-AGENT-002 reserved §8), 0010 (Reserved Enum
  States — the reserve-only-enum / substrate-now-enforcement-later lineage grounding the
  reserve-only `condition_type`/`action_type`/`trigger_type` and the new `branch_type`),
  0017 (vendor-template substrate), 0020 (authority gradient).
- Invariants: INV-RULE-004 (Layer 1a, the §5.1 branch/condition logic-freeze) — *reserved
  here, registered at implementation when enforcement lands*.
- Design spec: `docs/09_briefs/post-mvp/specs/2026-05-30-adr-0027-ring2b-substrate-design.md`.
