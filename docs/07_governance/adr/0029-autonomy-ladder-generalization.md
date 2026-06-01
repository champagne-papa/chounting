---
id: "0029"
title: "Autonomy Ladder Generalization — single canonical rung, five-ADR reconciliation, INV-AGENT precision pass"
status: ratified
date: "2026-05-31"
deciders: [phil]
modules: [agent, db]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0017", "0023", "0024", "0025"]
invariants: []
---

# ADR-0029: Autonomy Ladder Generalization

## Status

Ratified 2026-05-31 by CTO (V1 governance arc, Wave 0). Reserved by the V1
Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`). Design spec:
`docs/09_briefs/v1/specs/2026-05-31-adr-0029-autonomy-ladder-generalization-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-05-31-adr-0029-ratification-package.md`.

Consolidation/ratification ADR. Records and ratifies the autonomy-rung generalization that
already shipped in Ring 1 (ADR-0023, migration `20240163`); runs a wording precision pass
over the reserved `INV-AGENT-001..006`. Introduces no new substrate, registers no
invariant, authors no extension to non-rule autonomy (that is ADR-0032 / ADR-0028).

## Date

2026-05-31

## Triggered by

The V1 governance arc. The V1 Final System Proposal's correction log flagged the historical
"two rung enums" framing as drift, and the V1 Governance Plan reserved ADR-0029 to close
it: state the consolidated autonomy-rung end-state once, canonically, rather than leaving
it reconstructable only from five ADRs plus two migrations.

## Context

The autonomy rung began vendor-scoped and migrated to rule-scoped across two arcs. The
substrate landed in Ring 1 (ADR-0023, migration `20240163`, ratified 2026-05-26) but no
single ADR states the consolidated end-state. This ADR is that statement.

Verified live substrate (name-anchored; line numbers omitted as they rot on type regen):

- Single rung enum `rule_autonomy_rung = {always_confirm, notify_and_auto_post,
  silent_auto}` (generated `db/types.ts`).
- Lives on the parent identity table `rule_registry.current_rung` (`rule_autonomy_rung NOT
  NULL DEFAULT 'always_confirm'`). `rule_registry.rule_type ∈ {pattern, temporal,
  inferential}` — so the rung is already rule-type-general: a property of the registry
  shared by all three rule types, not of any one materialization.
- `vendor_rules` is an 8-column 1:1 child (`{rule_id, org_id, vendor_id,
  default_account_id, legal_entity_id, bundle_type, approved_at, approved_by}`) joined to
  `rule_registry` by composite FK. It carries no rung, no `current_rung`, no
  `clean_approval_count`, no `autonomy_tier`.
- `autonomy_tier` is dropped — column + type both removed in migration `20240163` step h,
  under the comment that `current_rung` "is now the sole source-of-truth for the rung."
- `vendor_rule_rung` never existed — described in ADR-0017's text; never migrated.
- Per-rule counters (`clean_approval_count`) live on `rule_track_records`, not
  `vendor_rules` (ADR-0023 Decision 2).

The canonical autonomy-ladder concept (three rungs + four-dimension limit model + policy
decision tree) lives in `docs/02_specs/agent_autonomy_model.md`; trust is scoped per rule,
not agent-global (Principle 3, "Trust Is Scoped and Revocable"; corroborated by Principle
1's "Scoped — earned per rule, not globally").

## Decision

**D-0029.1 — `rule_autonomy_rung` on `rule_registry.current_rung` is the sole
autonomy-rung substrate for all rule types.** No other rung enum or column exists or is
sanctioned. `autonomy_tier` (dropped) and `vendor_rule_rung` (never migrated) are retired
naming; any doc still referencing them is drift to fix on touch.

**D-0029.2 — The Autonomy Ladder is rule-attached, not agent-global.** Trust attaches to a
rule (a `rule_registry` row), not to the agent globally (`agent_autonomy_model.md`
Principle 3). The three canonical rungs (`always_confirm` → `notify_and_auto_post` →
`silent_auto`), the four-dimension limit model (per-transaction, per-day aggregate,
per-rule scope, category hard ceilings), and the policy decision tree compose as distinct
controls; this ADR affirms those definitions unchanged and names
`rule_registry.current_rung` as the rung's physical home.

**D-0029.3 — Orthogonality preserved (ADR-0007).** The Agent Ladder (autonomy on the
commit path) and the tier policy (architecture on non-commit paths) remain orthogonal.
This ADR generalizes the rung substrate, not the tier policy; they still do not interact.

**D-0029.4 — V1 posture unchanged.** At V1 only `always_confirm` is emitted; the
Ring 2A-core gate caps every `auto_post_at_rung_*` outcome to a conservative action under
`always_confirm` (`shared/rules/capping.ts`, ADR-0024/0025). The rung substrate is general
and shipped; rung exercise (governed auto-commit at `notify_and_auto_post` / `silent_auto`)
is post-V1, gated on the eval harness per ADR-0007 Q78 V1-rescoping and ADR-0032. This ADR
does not change that gate.

### Five-ADR reconciliation (affirm vs. settled-elsewhere — none changed here)

Per the ratified-contract-scope discipline, this ADR records the end-state; it does not
re-litigate what a prior ADR already settled.

| ADR | What it established re: the rung | This ADR's relationship |
|---|---|---|
| 0017 (vendor template substrate) | Described `vendor_rule_rung` + `current_rung`/`clean_approval_count` on `vendor_rules`. Drift source — never migrated as written. | Already amended by ADR-0023 (its `## Amendment 2026-05-26` block). This ADR cites that amendment; it does not re-amend 0017. |
| 0023 (rule-type-core substrate) | Created `rule_autonomy_rung` on `rule_registry.current_rung`; dropped `autonomy_tier`; moved `clean_approval_count` → `rule_track_records`; amended 0017's naming. The substrate settlement. | Affirmed as canonical. Unchanged. |
| 0024 (ring2a-core) | Gate caps `winning_branch_max_action` by `current_rung` (9-row table); pure-core evaluator emits no `effective_action`. | Affirmed. The capping table is the rung's operational consumer; unchanged. |
| 0025 (ring2a-core seams) | Capping table at `shared/rules/capping.ts` (canon, not derived); `promote`/`demote` update `rule_registry.current_rung` via `ruleRegistryService`. | Affirmed. Named as the rung's write/read seams; unchanged. |
| 0007 (three-tier agent arch) | Agent Ladder ⊥ tier policy; INV-AGENT-002 (Logic Receipt); Q78 V1-rescoping gates auto-commit on rung (post-V1). | Affirmed. Orthogonality + Q78 gate preserved; auth model untouched. |

The only ADR that ever disagreed with a single-rung world is 0017, and ADR-0023 already
amended it. This ADR re-litigates nothing.

### INV-AGENT-001..006 precision pass (wording only — no registration)

All six are RESERVED in `agent_autonomy_model.md §10`; zero are registered in
`invariants.md`. The precision pass tightens reserved wording to match the post-Ring-1
substrate (rung on `rule_registry`, counters on `rule_track_records`, capping in
`shared/rules/capping.ts`) and touches no enforced surface.

Binding constraint: editorial, not semantic. Tightening may align wording to the live
substrate; it may not narrow or broaden what a reserved INV will eventually enforce. No
INV-AGENT ID is registered, removed, renumbered, or moved to `invariants.md`; all six
remain reserved with their "to be registered when X lands" clauses intact. The exact
redlines are recorded in this ADR's ratification package §B — applied as: seam-naming
sentences added to INV-AGENT-002 (`ProposalJustificationSchema` +
`rule_evaluation_log.evaluation_trace`), INV-AGENT-003 (`ruleRegistryService.promote`),
INV-AGENT-005 (`ruleRegistryService.demote`); INV-AGENT-001/004/006 unchanged (no live,
category-matched seam — notably 001's ceiling check is distinct from the rung cap in
`capping.ts`, so naming the latter would be a semantic relocation, not editorial).

## Future direction (non-binding pointer — not authored here)

The rung substrate is positioned to extend to non-rule autonomy (workflow-level autonomy;
agent-global autonomy) when a consumer lands — but that extension is authored in ADR-0032
(Canonical Autonomy Gate Seam) and ADR-0028 (Workflow Core Substrate), not here. Folding
it in now would over-architect ahead of a consumer (Simplification-3) and blur the
0032/0028 boundary. This pointer grants nothing and reserves nothing.

## Consequences

- Single source of truth named. Future autonomy work reads `rule_registry.current_rung` /
  the `rule_autonomy_rung` enum; no ambiguity about which rung concept is live.
- Drift closed at the decision layer. Docs still naming `vendor_rule_rung` /
  `autonomy_tier` / `vendor_rules.current_rung` are drift-to-fix-on-touch. This ADR
  subsumes the canonical-placement decision (the counter lives on `rule_track_records`) but
  does not edit ADR-0007's Notes text — that stale-text fix remains open on the drift
  ledger for the next legitimate ADR-0007 touch (it is not closed by this ADR). ADR-0007
  was just amended for Q78 (commit `7cb68895`); re-touching it for a Notes cross-ref now
  would be scope creep.
- No code, no migration, no invariant registration. Purely a governance consolidation;
  zero runtime cost. The value is a future reader finding one canonical decision instead of
  reconstructing it.

## Alternatives considered

**Author the generalization to non-rule autonomy here.** Rejected — adds scope beyond the
charter and ahead of a consumer; reserved homes are ADR-0032 / ADR-0028; Simplification-3
governs.

**Re-amend ADR-0017 from this ADR.** Rejected — ADR-0023 already carries the
`## Amendment 2026-05-26` block; a second amendment duplicates provenance and cuts against
ratified-contract-scope. This ADR cites the existing amendment.

**Register INV-AGENT-001..006 now.** Rejected — the register-on-enforcement rule (ADR-0021
linter rejects an INV without enforcement) means an INV enters `invariants.md` only when
its enforcement lands. None has; the family stays reserved.

## Cross-references

- `docs/02_specs/agent_autonomy_model.md` — canonical Autonomy Ladder + §10 reserved
  INV-AGENT IDs.
- `docs/02_specs/invariants.md` — canonical 25-invariant index (no INV-AGENT; reserved).
- ADR-0023 — the substrate settlement this ADR ratifies; carries the ADR-0017 amendment.
- ADR-0017 — drift source, already amended by ADR-0023 (cited, not re-amended).
- ADR-0024 / ADR-0025 — the capping table and its code seams.
- ADR-0007 — Agent Ladder ⊥ tier policy; Q78 V1-rescoping; INV-AGENT-002.
- ADR-0032 / ADR-0028 — homes for any future non-rule autonomy extension.
- `docs/03_architecture/phase_simplifications.md` — Simplification 3 (governs (A)-not-(B)).
