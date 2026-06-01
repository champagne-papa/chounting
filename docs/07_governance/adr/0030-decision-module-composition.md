---
id: "0030"
title: "Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy"
status: ratified
date: "2026-05-31"
deciders: [phil]
modules: [agent, db]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0023", "0024", "0025", "0029"]
invariants: []
---

# ADR-0030: Decision-Module Composition + Disposition Reconciliation + (V2) Learning Trichotomy

## Status

Ratified 2026-05-31 by CTO (V1 governance arc, Wave 0). Reserved by the V1
Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`). Design spec:
`docs/09_briefs/v1/specs/2026-05-31-adr-0030-decision-module-composition-disposition-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-05-31-adr-0030-ratification-package.md`.

Consolidation/affirm-not-build ADR. Ratifies the decision-module composition principle,
resolves Decision 11 (the typed decision contract is the shipped `ActionType`), and names
the (V2) Learning Trichotomy by pointer. Introduces no new substrate, registers no
invariant, authors no code.

## Date

2026-05-31

## Triggered by

The V1 governance arc. The V1 thesis names "decision modules, not a Decision Core," and the
V1 Final System Proposal raised Decision 11 (reconcile the proposed 5-value gate-disposition
vocabulary against what ships). The V1 Governance Plan reserved ADR-0030 to (1) state the
composition principle canonically and (2) close Decision 11 — settling the contract before
V2 extends the enum (reservation R2).

## Context

Two layers exist in the rule path, verified at HEAD `d9628a9e` (name-anchored; line numbers
omitted as they rot on type regen):

- **`ActionType`** — the typed decision contract: the gate's output (`gate(...): ActionType`,
  `agent/policies/agent-ladder/gate.ts`), aliasing the `action_type` DB enum
  (`shared/rules/types.ts`). Five values: `auto_post_at_rung_2`, `auto_post_at_rung_3`,
  `suggest_with_required_approval`, `route_to_exception_queue_with_reason`,
  `block_with_reason`. This is "what the gate directs."
- **`Disposition`** — the reconciled outcome-label: four values
  (`auto_posted | blocked | routed | pending`), derived from `ActionType` via
  `dispositionForAction(action): Disposition` (`shared/rules/disposition.ts`) and persisted
  to `rule_evaluation_log.disposition` (CHECK-constrained to those four; migration
  `20240164`). The two auto-post arms collapse to `auto_posted`.

The decision modules already exist on disk, named by function rather than as a "decision
module" tier:

- **Rules Core** (= Rule Type Core) — the pure-core evaluator `core/rules/evaluator.ts`
  (`evaluate(): MatchResult`, deterministic per INV-RULE-002) plus the gate
  `agent/policies/agent-ladder/gate.ts` (`gate(...): ActionType`). `MatchResult`
  (`shared/rules/types.ts`) carries **no** `effective_action` — that is the gate's output
  (held by `ruleEvaluationOrchestrator`), not the pure core's. The pure core emits
  `winning_branch_max_action`; the gate caps it.
- **Authorization Core** — `services/auth/canUserPerformAction.ts` invoked by
  `withInvariants` (`services/middleware/withInvariants.ts`, Invariant 4: role authorization
  on every service call).
- **Autonomy Core** — `shared/rules/capping.ts` (`cap(maxOutcomeAction, currentRung)`, the
  9-row table), reading `rule_registry.current_rung` (`rule_autonomy_rung`, three rungs, per
  ADR-0029).
- **Workflow Routing** — net-new; reserved for ADR-0028 (Workflow Core Substrate, Wave 1).
  Nothing on disk today.
- **Receipt Assembly** — `ProposalJustificationSchema`
  (`shared/schemas/accounting/proposalJustification.schema.ts`), the Logic Receipt shape.
  Partial: the schema ships; the producer side is deferred (`proposalBuilder` omits
  `justification` at V1).

The proposed 5-value vocabulary
(`allow | deny | require_approval | require_more_evidence | queue_manual_review`, from the V1
proposal lineage) is **absent in code** (zero occurrences in `apps/web/src`).

## Decision

**D-0030.1 — Composition principle: decision modules, not a Decision Core.** Services
*compose* the decision modules above; no "Decision Core" folder aggregates them. The gate
(`gate.ts`) is the composition site for the rule path — it consumes the pure-core
`MatchResult`, applies Autonomy Core (`cap` against `current_rung`), then the limit /
aggregate / track-record checks, and emits `ActionType`. Authorization Core composes
orthogonally at the service boundary (`withInvariants`). Workflow Routing (when ADR-0028
lands) and Receipt Assembly compose at their own seams. This prevents policy-logic
centralization into one module while keeping each module's boundary explicit. No module is
built or changed by this ADR.

The seam names are descriptions of what ships, verified file-by-file (§3 of the ratification
package). A module is named at exactly its live capability: Receipt Assembly is *partial*
(schema-yes, producer-no); Workflow Routing is *net-new* (does not exist yet). Naming ≠
building.

**D-0030.2 — Decision 11: `ActionType` is the one typed decision contract (option i′).** The
"one typed decision contract" charter INV-4 names is the already-shipped `ActionType`,
already reconciled to `Disposition` (the outcome label) via `dispositionForAction`. This
satisfies INV-4 as written — the charter names `Disposition` as the reconciliation partner,
not as the contract; consistent with disk. The proposed 5-value vocabulary is a **semantic
gloss** mapped onto `ActionType`, **not a competing enum**:

| Proposed (gloss) | Shipped `ActionType` | Note |
|---|---|---|
| `allow` | `auto_post_at_rung_2` / `auto_post_at_rung_3` | proposed collapses the rung split |
| `deny` | `block_with_reason` | 1:1 |
| `require_approval` | `suggest_with_required_approval` | 1:1 |
| `queue_manual_review` | `route_to_exception_queue_with_reason` | 1:1 |
| `require_more_evidence` | — (no `ActionType` home) | the one genuinely-new value; a **future** `ActionType` addition when evidence-gating lands (post-V1, INV-EVIDENCE territory) |

No new enum, no migration, no change to any shipped surface. This arguably already satisfies
reservation R2 ("settle the contract before V2 extends the enum"): the contract is settled
as `ActionType`; any future vocabulary extension (e.g. adding `require_more_evidence`) is an
`ActionType` addition, governed by the same reconciliation. The layering — `ActionType`
contract, `Disposition` outcome — is stated as a positive clarification, not a charter
correction.

**D-0030.3 — Learning Trichotomy named by pointer (V2).** The three learning-artifact
classes are **TaskPlan** (a multi-step plan proposal), **WorkflowDefinition** (a
learned/proposed workflow shape), and **AutonomyParameter** (a proposed autonomy-policy
change, e.g. a rung promotion) — the three things workflow-learning may *propose*, each with
its own ratification ceremony. Verified: zero code, no canonical definition doc. ADR-0030
names them and points to their V2 home (ADR-0028 Workflow Core / the V2 learning-substrate
ADRs / ADR-0032 territory); it authors nothing. Authoring now would over-architect ahead of
a consumer (Simplification-3). This pointer grants nothing and reserves nothing.

## Consequences

- Composition principle named canonically. Future work reads "services compose decision
  modules; the gate composes the rule path"; no ambiguity about a centralized Decision Core
  (there is none).
- Decision 11 closed. The typed contract is `ActionType`; the proposed vocabulary is a gloss
  over it. V2 extends `ActionType` (not a parallel enum) when it adds capability;
  `require_more_evidence` is the named first candidate, gated on evidence-gating (post-V1).
- No code, no migration, no invariant registration. INV-4 is already in the charter's nine;
  this ADR clarifies its layering, it does not register or alter an invariant. Zero runtime
  cost.
- Reservation R2 satisfied at the contract layer. The "don't fork the enum before V2"
  obligation is met by naming `ActionType` canonical now.

## Alternatives considered

These are the Decision-11 options the design spec presented; the CTO chose i′.

- **(i) Proposed 5-value as the semantic contract over `ActionType`-as-mechanism.** A
  `GateCommand (5-value) → ActionType → Disposition` chain with one contract at the top.
  Rejected — coherent only if `ActionType` is explicitly demoted to mechanism; introduces a
  new enum + chain mapping for no V1 benefit (the contract is already typed and reconciled).
- **(ii) Re-vocab `ActionType` to the proposed vocabulary.** Migrate the `action_type` DB
  enum + rework `dispositionForAction` + the gate + capping's exhaustive switch. Rejected —
  heaviest; touches shipped substrate; collapses the rung split (`allow` for both rung-2/3)
  with no V1 benefit.
- **(iii) Defer the vocabulary to post-V1.** Ratify only "the layers are distinct" and push
  the vocabulary question to governed auto-commit (ADR-0032). Rejected — under-delivers
  against R2, which wants Decision 11 settled in Wave 0. Option i′ settles it now at the
  lightest cost.

## Cross-references

- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` — charter; Decision 11, INV-4,
  reservation R2.
- ADR-0023 / ADR-0024 / ADR-0025 — Rules Core: the substrate, the gate/capping table, the
  code seams.
- ADR-0029 — Autonomy Core: the single `rule_autonomy_rung` the gate caps against.
- ADR-0007 — Receipt Assembly lineage (Q30); Agent Ladder ⊥ tier policy.
- ADR-0028 — Workflow Routing (net-new) + Learning Trichotomy V2 home. *(Reserved; not yet
  authored — prose reference only.)*
- ADR-0032 — Canonical Autonomy Gate Seam; where the gate-command vocabulary extension and
  governed auto-commit land post-V1. *(Reserved; not yet authored — prose reference only.)*
- `docs/02_specs/glossary.md` — "Decision modules" + "proposed 5-value gate disposition"
  (reconciled OPEN→ratified by this ADR; redlines in the ratification package §B).
- `docs/03_architecture/phase_simplifications.md` — Simplification 3 (governs (A)-not-(B);
  Part 3 pointer).
