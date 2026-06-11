# ADR-0029 Ratification Package — Autonomy Ladder Generalization

**Status:** Awaiting CTO ratification.
**Date assembled:** 2026-05-31.
**V1 plan reference:** Wave 0; ADR-0029 reserved in `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`.
**Design spec:** `docs/09_briefs/v1/specs/2026-05-31-adr-0029-autonomy-ladder-generalization-design.md`.
**Anchored at:** HEAD `31ba9796` (branch `staging`), unpushed.
**Posture:** (A) consolidation/ratification — no new substrate, no invariant registration,
no extension to non-rule autonomy. The decision content (§0–§7 of the design spec) is
ratified as the ADR body in §A below; the INV-AGENT precision-pass redlines are in §B,
shown line-level against the verbatim `agent_autonomy_model.md §10`, each annotated
editorial-not-semantic.

---

## 1. Summary

ADR-0029 consolidates the autonomy-rung generalization that already shipped in Ring 1
(ADR-0023, migration `20240163`, ratified 2026-05-26): a single canonical rung
(`rule_autonomy_rung` on `rule_registry.current_rung`), rule-attached not agent-global,
reconciling five ADRs (0007/0017/0023/0024/0025), with a wording precision pass over the
reserved `INV-AGENT-001..006`. It introduces no substrate, registers no invariant, and
authors no extension to non-rule autonomy (that is ADR-0032/0028 territory).

This package contains: the ratification ask (§2), the verified-against-disk grounding the
ADR rests on (§3), the ADR-0029 body to land in `adr/` on ratification (§A), and the
line-level INV-AGENT redlines for review (§B).

## 2. Ratification ask

Ratify ADR-0029 as posture (A). On ratification:
1. The §A body lands at `docs/07_governance/adr/0029-autonomy-ladder-generalization.md`
   with `status: ratified`, `date: <ratification date>`.
2. The §B redlines are applied to `docs/02_specs/agent_autonomy_model.md §10` (editorial
   only; all six INV-AGENT IDs remain reserved, unregistered).
3. `pnpm adr:check` green; banks local on `staging`; pushes at retrospective close.

**Two confirmed boundaries carried from review:**
- **Cite-only on ADR-0017** — do not re-amend it; ADR-0023 already carries the
  `## Amendment 2026-05-26` block reconciling the rung rename/move + `clean_approval_count`
  relocation. ADR-0029 references that amendment.
- **`clean_approval_count` placement subsumed, ADR-0007 Notes text left open** — ADR-0029's
  reconciliation canonically places the counter on `rule_track_records`, but does **not**
  edit ADR-0007's Notes / ADR-0017 cross-ref text. That stale-text fix **remains open on
  the drift ledger** for the next legitimate ADR-0007 touch; subsuming the decision does
  not close the text item.

## 3. Grounding (verified against disk at HEAD `31ba9796`)

| Claim | Verification |
|---|---|
| Single rung enum `rule_autonomy_rung = {always_confirm, notify_and_auto_post, silent_auto}` | generated `db/types.ts`, enum `rule_autonomy_rung` |
| Lives on `rule_registry.current_rung` (NOT NULL DEFAULT `always_confirm`); `rule_type ∈ {pattern, temporal, inferential}` | `db/types.ts` `rule_registry` Row + `rule_type` enum — rung is rule-type-general (parent table) |
| `vendor_rules` = 8-col 1:1 child, no rung/`current_rung`/`clean_approval_count`/`autonomy_tier` | `db/types.ts` `vendor_rules` Row (`rule_id, org_id, vendor_id, default_account_id, legal_entity_id, bundle_type, approved_at, approved_by`) |
| `autonomy_tier` dropped (col + type) | migration `20240163` step h |
| `vendor_rule_rung` never migrated | absent from all migrations; ADR-0017 text only |
| `clean_approval_count` on `rule_track_records` | ADR-0023 Decision 2 |
| INV-AGENT-001..006 reserved, **0 registered** | `agent_autonomy_model.md §10` lists all 6; `grep -c INV-AGENT invariants.md` = 0 |
| Trust scoped per rule | `agent_autonomy_model.md` Principle 3 "Trust Is Scoped and Revocable" (corrob. Principle 1) |

---

## §A — ADR-0029 body (lands in `adr/` on ratification)

> The frontmatter `status` is shown as `ratified` and `date` as the ratification date —
> these take effect when the body is moved to `adr/` at ratification, never before (per
> the lifecycle; a non-ratified ADR does not belong in `adr/`).

```markdown
---
id: "0029"
title: "Autonomy Ladder Generalization — single canonical rung, five-ADR reconciliation, INV-AGENT precision pass"
status: ratified
date: "<RATIFICATION_DATE>"
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

Ratified <RATIFICATION_DATE> by CTO (V1 governance arc, Wave 0). Reserved by the V1
Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`). Design spec:
`docs/09_briefs/v1/specs/2026-05-31-adr-0029-autonomy-ladder-generalization-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-05-31-adr-0029-ratification-package.md`.

Consolidation/ratification ADR. Records and ratifies the autonomy-rung generalization that
already shipped in Ring 1 (ADR-0023, migration `20240163`); runs a wording precision pass
over the reserved `INV-AGENT-001..006`. Introduces no new substrate, registers no
invariant, authors no extension to non-rule autonomy (that is ADR-0032 / ADR-0028).

## Date

<RATIFICATION_DATE>

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
redlines are recorded in this ADR's ratification package §B.

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
```

---

## §B — INV-AGENT-001..006 precision-pass redlines (review line-by-line)

Each redline is shown as **current** (verbatim `agent_autonomy_model.md §10`) → **proposed**
with a one-line **basis** asserting it is editorial (aligns wording to live substrate) and
**not** semantic (does not change what the reserved INV will eventually enforce). The
"**Layer:** … To be registered when X lands" clauses are **unchanged** for all six. Apply
only on ratification.

### INV-AGENT-001 — No auto-post across System ceilings
- **Current:** "The ceiling check runs in the agent orchestrator before any ledger write path is entered."
- **Proposed:** unchanged. *(No live ceiling-check seam to name. `shared/rules/capping.ts` is the rung cap — a distinct control: it switches on `(max_outcome_action, current_rung)` only and has zero ceiling-class logic, so it is rung-dependent, the opposite of this INV's "regardless of rung." Naming it here would conflate decision-tree step 1 (System-ceiling block) with step 2 (rung cap) — a semantic relocation, not editorial. The ceiling block lands in the orchestrator/schema per this INV's own Layer clause; until it does, there is nothing live to name.)*
- **Basis:** No redline. Same discipline as 004/006 — the editorial pass declines to manufacture precision absent a live, category-matched seam. (A first-draft redline naming `capping.ts` was reverted in review as a category error: a rung seam on a ceiling INV.)

### INV-AGENT-002 — Every auto-post produces a Logic Receipt
- **Current:** "See `docs/02_specs/intent_model.md` §6 for the Logic Receipt specification."
- **Proposed:** "See `docs/02_specs/intent_model.md` §6 for the Logic Receipt specification; the shape is partially codified today as `ProposalJustificationSchema` + `rule_evaluation_log.evaluation_trace` (write path still post-V1)."
- **Basis:** Editorial — adds a cross-ref to the now-partial artifact. Does not change the rule (every auto-post produces a Logic Receipt) or its reserved status. Layer clause unchanged.

### INV-AGENT-003 — Promotion requires authorized approval
- **Current:** "Promotion from Always Confirm to Notify & Auto-Post requires controller approval. … Every promotion is recorded in the audit log."
- **Proposed:** add a trailing sentence: "Promotion is effected by `ruleRegistryService.promote` updating `rule_registry.current_rung` (ADR-0025)."
- **Basis:** Editorial — names the live write seam. Does not change the approval rule (controller→Notify, owner→Silent, Q24 default) or audit requirement. Layer clause unchanged.

### INV-AGENT-004 — Limit changes are audited
- **Current:** "Every limit change (per-transaction or per-day aggregate) passes through the controller-proposes / owner-approves flow…"
- **Proposed:** unchanged. *(No live substrate to align to — the limit-change API has not landed. Editorial pass finds nothing to tighten without touching substance.)*
- **Basis:** No redline. Confirms the pass is editorial: where there is no live seam to name, wording stays as-is rather than inventing precision.

### INV-AGENT-005 — Re-probation is immediate and always available
- **Current:** "Any controller can demote any rule to Always Confirm from any agent-attributed entry, effective immediately."
- **Proposed:** add a trailing sentence: "Demotion is effected by `ruleRegistryService.demote` setting `rule_registry.current_rung = 'always_confirm'` (ADR-0025)."
- **Basis:** Editorial — names the live write seam. Does not change the rule (any controller, immediate, no ceremony). Layer clause unchanged.

### INV-AGENT-006 — Vendor bank-detail changes are System ceiling
- **Current:** "Any mutation to `vendor.bank_account`, `vendor.payment_instructions`, or `vendor.bank_detail_confirmed_flag` is System ceiling…"
- **Proposed:** unchanged. *(The vendor-master service has not landed; ADR-0007 Tier 2.5 read-boundary alignment is already implicit. No editorial tightening available without touching substance.)*
- **Basis:** No redline. Same reasoning as 004 — editorial pass declines to manufacture precision absent a live seam.

**Summary of §B:** 3 redlines (002, 003, 005), each naming a now-live, category-matched
seam (justification artifacts on the Logic-Receipt INV; the promote/demote registry seam
on the promotion/demotion INVs); 3 no-change (001, 004, 006) where no live, category-matched
substrate exists to align to (001 reverted in review — `capping.ts` is the rung cap, not
the System-ceiling check). Zero substance changes; zero registrations; all six remain
reserved. Reviewer verifies each against verbatim §10 under the editorial-not-semantic
criterion.

---

## 4. Source materials read during package drafting

- `docs/02_specs/agent_autonomy_model.md` §10 (verbatim INV-AGENT text), Principles 1 + 3.
- `docs/02_specs/invariants.md` (confirmed no INV-AGENT registered).
- Generated `apps/web/src/db/types.ts` (`rule_autonomy_rung`, `rule_registry`,
  `vendor_rules`, `rule_type`).
- Migration `20240163000000_rule_type_core_substrate.sql` (step h drop).
- ADRs 0007 / 0017 / 0023 / 0024 / 0025 (reconciliation grounding).
- Phase-0 D1 ratification package (format exemplar).
