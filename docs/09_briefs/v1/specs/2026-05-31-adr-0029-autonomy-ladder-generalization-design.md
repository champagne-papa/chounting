# ADR-0029 — Autonomy Ladder Generalization — Design Spec

**Status:** DRAFT for review · 2026-05-31 · pre-ratification design spec (lifecycle stage 1
of 3: `specs/` → `ratification-packages/` → ratified ADR in `docs/07_governance/adr/`).
**Reserves:** ADR-0029 (per the V1 Governance Plan, `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`).
**Anchored at:** HEAD `31ba9796` (branch `staging`).
**Posture: (A) consolidation/ratification** — this ADR records and tightens what already
shipped (the rung generalization landed in Ring 1, ADR-0023/migration 20240163); it
introduces **no new substrate** and **registers no invariant**. A one-line non-binding
future-direction pointer is included; the actual extension to non-rule autonomy is
authored in ADR-0032 / ADR-0028 when a consumer lands (not here).

---

## 0. What this ADR does (and does not do)

**Does:** ratifies a single canonical autonomy rung (`rule_autonomy_rung` on
`rule_registry.current_rung`) as the system's autonomy-ladder substrate; records the
five-ADR reconciliation (0007 / 0017 / 0023 / 0024 / 0025) as a coherent end-state,
naming for each what it already settled vs. what 0029 affirms; and runs a wording
**precision pass** over the reserved `INV-AGENT-001..006`.

**Does NOT:** create or alter any table, column, enum, or migration; register any
invariant in `invariants.md` (the INV-AGENT family stays reserved per the project's
register-on-enforcement rule); extend the autonomy ladder to non-rule actors (workflow
autonomy, agent-global autonomy) — that is ADR-0032 (Autonomy Gate Seam) + ADR-0028
(Workflow Core) territory, authored when a consumer exists.

This is an **evolve-don't-rewrite** consolidation: the generalization is a fact on disk;
this ADR makes it a named, single-source-of-truth decision.

---

## 1. Context — why a generalization ADR, when the substrate already shipped

The autonomy rung began vendor-scoped and migrated to rule-scoped across two arcs, leaving
the decision recorded across five ADRs with one drift source. The substrate landed in
Ring 1 (ADR-0023, migration `20240163`, ratified 2026-05-26) but no single ADR states the
consolidated end-state. ADR-0029 is that statement. The V1 governance arc surfaced the
need: the V1 proposal's correction log flagged the historical "two rung enums" claim as
drift, and the charter reserved 0029 to close it.

**Verified live substrate (HEAD `31ba9796`):**

- **Single rung enum:** `rule_autonomy_rung = {always_confirm, notify_and_auto_post, silent_auto}`
  (`db/types.ts:3878`/`4323`).
- **Lives on the parent identity table:** `rule_registry.current_rung rule_autonomy_rung
  NOT NULL DEFAULT 'always_confirm'` (`db/types.ts:2573`). `rule_registry.rule_type ∈
  {pattern, temporal, inferential}` (`db/types.ts:3883`) — so the rung is **already
  rule-type-general**: it is a property of the registry shared by all three rule types,
  not of any one materialization.
- **`vendor_rules` is an 8-column 1:1 child** (`{rule_id, org_id, vendor_id,
  default_account_id, legal_entity_id, bundle_type, approved_at, approved_by}`,
  `db/types.ts` Row) joined to `rule_registry` by composite FK. It carries **no** rung,
  **no** `current_rung`, **no** `clean_approval_count`, **no** `autonomy_tier`.
- **`autonomy_tier` is dropped** — column + type both removed in `20240163` step h
  (`…rule_type_core_substrate.sql:347–348`), under the comment that `current_rung` "is now
  the sole source-of-truth for the rung."
- **`vendor_rule_rung` never existed** — described in ADR-0017's text, never migrated.
- **Per-rule counters** (`clean_approval_count`) live on `rule_track_records`, not
  `vendor_rules` (ADR-0023 Decision 2).

> **Drift caught during this spec's grounding (recorded so the next reader doesn't
> re-trip it):** an automated read reported the "live `vendor_rules`" as the 9-column
> shell including `autonomy_tier` — that is ADR-0023's *description of the pre-migration
> state*, not HEAD. The live table is the 8-column post-`20240163` shape above, verified
> against generated `db/types.ts`. A report quoting a doc quoting an older state is the
> exact failure the arc's verify-against-disk discipline exists to catch.

---

## 2. Decision (proposed) — single canonical autonomy rung

**D-0029.1 — `rule_autonomy_rung` on `rule_registry.current_rung` is the sole autonomy-rung
substrate for all rule types.** No other rung enum or column exists or is sanctioned.
`autonomy_tier` (dropped) and `vendor_rule_rung` (never migrated) are retired naming; any
doc still referencing them is drift to fix on touch.

**D-0029.2 — The Autonomy Ladder is rule-attached, not agent-global.** Trust attaches to a
*rule* (a `rule_registry` row), not to the agent globally (per `agent_autonomy_model.md`
Principle 3). The three canonical rungs (`always_confirm` → `notify_and_auto_post` →
`silent_auto`) are the rung axis; the four-dimension limit model (per-transaction,
per-day aggregate, per-rule scope, category hard ceilings) and the five-step policy
decision tree (`agent_autonomy_model.md` §5 / §-policy-tree) compose with the rung but are
distinct controls. ADR-0029 changes none of these definitions — it affirms them as the
canonical ladder and names `rule_registry.current_rung` as the rung's physical home.

**D-0029.3 — Orthogonality preserved (ADR-0007).** The Agent Ladder (autonomy on the
commit path) and the tier policy (architecture on non-commit paths) remain orthogonal per
ADR-0007. ADR-0029 generalizes the *rung substrate*, not the tier policy; they still do
not interact.

**D-0029.4 — V1 posture unchanged.** At V1 only `always_confirm` is emitted; the
Ring 2A-core gate caps every `auto_post_at_rung_*` outcome to a conservative action under
`always_confirm` (`shared/rules/capping.ts`, ADR-0024/0025). The rung *substrate* is
general and shipped; rung *exercise* (governed auto-commit at `notify_and_auto_post` /
`silent_auto`) is post-V1, gated on the eval harness per ADR-0007 Q78 V1-rescoping and
ADR-0032. ADR-0029 does not change this gate.

---

## 3. The five-ADR reconciliation (affirm vs. settled-elsewhere — none changed by 0029)

Per the ratified-contract-scope discipline: 0029 records the end-state; it does not
re-litigate what a prior ADR already settled. For each, what 0029 *affirms* vs. what was
*already settled*:

| ADR | What it established re: the rung | 0029's relationship |
|---|---|---|
| **0017** (vendor template substrate) | Described `vendor_rule_rung` + `current_rung`/`clean_approval_count` **on `vendor_rules`** (≈18-col text). **Drift source** — never migrated as written. | **Already amended by ADR-0023** (`## Amendment 2026-05-26`). 0029 records the consolidated end-state; does **not** re-amend 0017. |
| **0023** (rule-type-core substrate) | Created `rule_autonomy_rung` on `rule_registry.current_rung`; dropped `autonomy_tier`; moved `clean_approval_count` → `rule_track_records`; amended 0017's naming. **The substrate settlement.** | **Affirmed.** 0029 ratifies 0023's rung decision as canonical; changes nothing. |
| **0024** (ring2a-core) | Gate caps `winning_branch_max_action` by `current_rung` (9-row table); pure-core evaluator emits no `effective_action`. | **Affirmed.** The capping table is the rung's operational consumer; 0029 does not alter it. |
| **0025** (ring2a-core seams) | Capping table codified at `shared/rules/capping.ts` (canon, not derived); `promote`/`demote` update `rule_registry.current_rung` via `ruleRegistryService`. | **Affirmed.** 0029 names these as the rung's write/read seams; changes nothing. |
| **0007** (three-tier agent arch) | Agent Ladder ⊥ tier policy; INV-AGENT-002 (Logic Receipt); Q78 V1-rescoping gates auto-commit on rung (post-V1). | **Affirmed.** 0029 preserves the orthogonality and the Q78 gate; does not touch the auth model. |

**Net:** the only ADR that ever disagreed with a single-rung world is 0017, and 0023
already amended it. ADR-0029 is therefore a *consolidation that re-litigates nothing* — it
states the settled end-state once, canonically.

---

## 4. INV-AGENT-001..006 precision pass (wording only — no registration)

**Verified:** all six are RESERVED in `agent_autonomy_model.md §10`; **zero** are
registered in `invariants.md` (`grep -c INV-AGENT invariants.md` = 0). So the precision
pass tightens *reserved wording* and touches **no enforced surface** — consistent with the
register-on-enforcement rule (an INV enters `invariants.md` only when enforcement code/
migration lands; the ADR-0021 linter rejects an INV without enforcement).

**Scope of the pass (proposed):** for each of INV-AGENT-001..006, confirm the statement
still reads correctly against the *post-Ring-1* substrate (the rung is on `rule_registry`,
counters on `rule_track_records`, capping in `shared/rules/capping.ts`) and tighten any
wording that still implies the pre-migration `vendor_rules`-centric shape. **No ID is
registered, removed, renumbered, or moved to `invariants.md`.** The six remain reserved
with their "to be registered when X lands" clauses intact.

*Proposed per-INV wording deltas* — to be filled in the ADR body and reviewed against
`agent_autonomy_model.md §10` line-by-line; this design spec commits to the *scope* of the
pass (wording-tightening, reservation-preserving), not yet the exact redlines. The
reviewer asked to verify this surface stays unenforced — it does; the pass is editorial.

| INV | Current thrust (agent_autonomy_model.md §10) | Precision-pass intent |
|---|---|---|
| INV-AGENT-001 | No auto-post across System ceilings | Confirm ceiling-check site language matches the live gate (`capping.ts` + orchestrator); no substrate rename needed. |
| INV-AGENT-002 | Every auto-post produces a Logic Receipt | Cross-ref the now-partial Logic Receipt artifact (`ProposalJustificationSchema` + `rule_evaluation_log.evaluation_trace`); still reserved (write path post-V1). |
| INV-AGENT-003 | Promotion requires authorized approval | Confirm "promotion" = `ruleRegistryService.promote` updating `rule_registry.current_rung` (per ADR-0025); tighten to the registry seam. |
| INV-AGENT-004 | Limit changes are audited | Unchanged in substance; confirm limit-model wording matches `agent_autonomy_model.md §5`. |
| INV-AGENT-005 | Re-probation immediate + always available | Confirm "demote to always_confirm" = `ruleRegistryService.demote` on `current_rung`. |
| INV-AGENT-006 | Vendor bank-detail changes are System ceiling | Unchanged; confirm vendor-control-field language matches ADR-0007 Tier 2.5 read boundary. |

---

## 5. Future direction (non-binding pointer — NOT authored here)

The rung substrate is positioned to extend to non-rule autonomy (workflow-level autonomy;
agent-global autonomy) when a consumer lands — but that extension is **authored in
ADR-0032 (Canonical Autonomy Gate Seam) and ADR-0028 (Workflow Core Substrate), not in
0029.** Folding it in here would over-architect ahead of a consumer (Simplification-3) and
blur the 0032/0028 boundary. This pointer exists so a future reader knows where the
extension goes; it grants nothing and reserves nothing.

---

## 6. Consequences

- **Single source of truth named:** future autonomy work reads `rule_registry.current_rung`
  and the `rule_autonomy_rung` enum; no ambiguity about which rung concept is live.
- **Drift closed:** docs still naming `vendor_rule_rung` / `autonomy_tier` /
  `vendor_rules.current_rung` are flagged drift-to-fix-on-touch (notably ADR-0017's
  pre-amendment text, already carrying its `## Amendment 2026-05-26` block; and the
  `clean_approval_count`-on-`vendor_rules` mention in ADR-0007's Notes / ADR-0017 cross-ref
  — the carry-forward logged in the A-now hotfix change-spec, which this ADR's
  reconciliation table subsumes by pointing the rung/counter substrate at
  `rule_registry`/`rule_track_records`).
- **No code, no migration, no invariant registration** — purely a governance
  consolidation. Costs nothing at runtime; the value is a future reader finding one
  canonical decision instead of reconstructing it from five ADRs + two migrations.

---

## 7. Open questions for the ADR body / reviewer

1. **INV-AGENT redlines:** the exact per-INV wording deltas (§4 table → line-level edits
   against `agent_autonomy_model.md §10`) — author in the ADR body, reviewer verifies each
   stays reserved + unenforced.
2. **Does 0029 amend 0017 again, or only cite 0023's amendment?** Proposed: **cite only** —
   0023 already carries the `## Amendment 2026-05-26` block; a second amendment from 0029
   would duplicate provenance. 0029 references it; does not re-amend. (Reviewer's call.)
3. **`clean_approval_count` cross-ref drift (ADR-0007 Notes / ADR-0017):** the A-now hotfix
   change-spec logged this as a carry-forward "to ADR-0029's reconciliation pass." Proposed:
   0029's §3 table + §6 *subsume* it by canonically placing the counter on
   `rule_track_records` — but 0029 does **not** edit ADR-0007's Notes text (that is its own
   touch-on-fix). Confirm this is the right scope boundary.

---

## 8. Lifecycle next steps (not this spec)

Per the ADR README lifecycle — **design spec → ratification package → ratified ADR** — and
its rule that an ADR body is the *post-ratification* artifact (a non-ratified ADR does not
belong in `docs/07_governance/adr/`; the allowed `status` set has no pre-ratification
value by design):

1. Reviewer verifies this design spec (INV-AGENT reserved+unenforced; 5-ADR reconciliation
   = affirm-not-change; the live-schema claims).
2. Author the **ratification package** at `docs/09_briefs/v1/ratification-packages/`
   (Phase-0 D1–D6 analog). This is where the ADR-0029 body *content* and the line-level §4
   INV-AGENT redlines are produced and reviewed line-by-line under the
   editorial-not-semantic constraint (§4).
3. **On ratification**, the ADR-0029 body lands as the ratified artifact at
   `docs/07_governance/adr/0029-autonomy-ladder-generalization.md` (`status: ratified`) —
   never before. The design spec is then preserved as historical reference.
4. Banks local on `staging`; pushes at retrospective close.
