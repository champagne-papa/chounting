# ADR-0030 — Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy — Design Spec

**Status:** DRAFT for review · 2026-05-31 · pre-ratification design spec (lifecycle stage 1
of 3: `specs/` → `ratification-packages/` → ratified ADR in `docs/07_governance/adr/`).
**Reserves:** ADR-0030 (V1 Governance Plan, `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`).
**Anchored at:** HEAD `6af5d776` (branch `staging`).
**Posture:** Part 1 (decision-module composition) = (A) consolidation/affirm-not-build, like
ADR-0029. Part 2 (Decision 11) = **OPEN — CTO decides at the ratification-package stage**;
this spec presents the grounded options. Part 3 (Learning Trichotomy) = V2-deferred,
define-by-pointer. No new substrate, no invariant registration, no code.

> **Decision 11 is OPEN and stays OPEN in this stage-1 artifact.** A design spec may carry
> a charter-OPEN decision as an options section; the **ratification package** is where the
> CTO direction folds in, and ADR-0030 cannot ratify with Part 2 still open (ratifying
> ADR-0030 is what closes Decision 11). Parts 1 + 3 are authored to completion now.

---

## 0. What this ADR will do

- **Part 1:** ratify the **composition principle** — "decision modules, not a Decision
  Core": services *compose* a set of decision modules; there is no god-object decision
  folder. Name each module's live seam (affirm-not-build, like ADR-0029). No new code.
- **Part 2 (Decision 11):** reconcile the proposed 5-value gate-disposition vocabulary
  (`allow|deny|require_approval|require_more_evidence|queue_manual_review`) against the
  **shipped `ActionType`** gate-command enum — *not* against `Disposition` (the outcome
  layer, which does not compete). Presented OPEN with options i′/i/ii/iii; CTO decides.
- **Part 3:** name the Learning Trichotomy (TaskPlan / WorkflowDefinition /
  AutonomyParameter) and point it to its V2 home; author nothing (Simplification-3).

---

## 1. Part 1 — Decision-module composition (consolidation; affirm-not-build)

The V1 thesis names "decision modules, not a Decision Core." The modules already exist on
disk, named by function rather than as a "decision module" tier. ADR-0030 ratifies the
composition principle and names each live seam. **No module is built or changed here.**

| Decision module | Live seam (verified at HEAD `6af5d776`) | Status |
|---|---|---|
| **Rules Core** (= Rule Type Core) | Pure-core evaluator `apps/web/src/core/rules/evaluator.ts` (`evaluate(): MatchResult`, INV-RULE-002 deterministic) + the gate `apps/web/src/agent/policies/agent-ladder/gate.ts` (`gate(...): ActionType`). `MatchResult` (`shared/rules/types.ts`) carries **no** `effective_action` — that is the gate's output, not the pure core's. | 🟢 shipped |
| **Authorization Core** | `apps/web/src/services/auth/canUserPerformAction.ts` + `withInvariants` (`services/middleware/withInvariants.ts`, Invariant 4 role authorization on every service call). | 🟢 shipped |
| **Autonomy Core** | `apps/web/src/shared/rules/capping.ts` (`cap(maxOutcomeAction, currentRung)`, the 9-row table), reading `rule_registry.current_rung` (`rule_autonomy_rung`, per ADR-0029). | 🟢 shipped |
| **Workflow Routing** | net-new — reserved for ADR-0028 (Workflow Core Substrate, Wave 1). Nothing on disk today. | ⚫ net-new |
| **Receipt Assembly** | `ProposalJustificationSchema` (`shared/schemas/accounting/proposalJustification.schema.ts`) — the Logic Receipt shape; producer-side deferred (proposalBuilder omits `justification` at V1). | 🟡 partial |

**Composition principle (the Part-1 decision):** services compose these modules; no
"Decision Core" folder aggregates them. The gate (`gate.ts`) is the composition site for
the rule path — it consumes the pure-core `MatchResult`, applies Autonomy Core (`cap`),
and emits `ActionType`. Authorization Core composes orthogonally at the service boundary
(`withInvariants`). Workflow Routing (when ADR-0028 lands) and Receipt Assembly compose at
their own seams. The principle prevents policy-logic centralization into one module while
keeping each module's boundary explicit.

**Editorial-not-semantic discipline (Part 1):** the seam names above are *descriptions of
what ships*, verified file-by-file. Authoring the ADR body must name each seam against
disk (same as the ADR-0029 INV pass) and must **not** assert a module does more than its
live code does — e.g., Receipt Assembly is *partial* (schema-yes, producer-no); Workflow
Routing is *net-new* (do not imply it exists). Naming ≠ building.

---

## 2. Part 2 — Decision 11 (OPEN; CTO decides at ratification-package stage)

### 2.1 The layering, stated affirmatively (Decision 11's reconciliation work)

Two enums exist in the rule path; they are **different layers**, verified at HEAD:

- **`ActionType`** — the **one typed decision contract**: the gate's output (`gate(...):
  ActionType`, `gate.ts:40`), the `action_type` DB enum, 5 values:
  `auto_post_at_rung_2`, `auto_post_at_rung_3`, `block_with_reason`,
  `route_to_exception_queue_with_reason`, `suggest_with_required_approval`. This is "what
  the gate directs."
- **`Disposition`** — the **reconciled outcome-label**: 4 values
  (`auto_posted|blocked|routed|pending`), derived from `ActionType` via
  `dispositionForAction(action): Disposition` (`shared/rules/disposition.ts`), persisted
  to `rule_evaluation_log.disposition` (CHECK-constrained, 4 values; migration `20240164`).
  The two auto-post arms collapse to `auto_posted`.

This **satisfies charter INV-4 as written** ("one typed decision contract — reconciled with
the shipped `Disposition` enum"): the contract is `ActionType`; it *reconciles with*
`Disposition` via `dispositionForAction`. The charter names `Disposition` as the
reconciliation partner, not as the contract — consistent with disk. ADR-0030 states this
layering as a **positive clarification** (the contract is `ActionType`; `Disposition` is
its outcome-label), not as a charter correction; there is no charter defect to log.

### 2.2 The actual Decision-11 tension

The proposed 5-value vocabulary
(`allow|deny|require_approval|require_more_evidence|queue_manual_review`, from the V1
proposal / deep-research report) is **absent in code** (verified: zero occurrences in
`apps/web/src`). The tension is **proposed vocabulary vs. the shipped `ActionType`** — the
*same* command layer — **not** proposed-command vs. `Disposition` (different layers, no
conflict). The shipped→proposed mapping:

| Proposed (gloss) | Shipped `ActionType` | Note |
|---|---|---|
| `allow` | `auto_post_at_rung_2` / `auto_post_at_rung_3` | proposed collapses the rung split |
| `deny` | `block_with_reason` | 1:1 |
| `require_approval` | `suggest_with_required_approval` | 1:1 |
| `queue_manual_review` | `route_to_exception_queue_with_reason` | 1:1 |
| **`require_more_evidence`** | **— (no `ActionType` home)** | the one genuinely-new value; evidence-gating capability (INV-EVIDENCE territory, post-V1) |

### 2.3 Options (stated against `ActionType`; CTO chooses — not picked here)

- **(i′) Ratify `ActionType` as the canonical decision contract.** The "one typed
  contract" INV-4 wants is the already-shipped `ActionType`, already reconciled to
  `Disposition`. The proposed 5-value is a semantic gloss mapped onto it;
  `require_more_evidence` becomes a future `ActionType` addition when evidence-gating
  lands. No new enum, no migration, no shipped surface touched. Arguably already satisfies
  R2 ("settle before V2 extends the enum"). *(Reviewer's advisory lean: lightest on
  shipped surface, most faithful to disk — a lean, not the pick.)*
- **(i) Proposed 5-value as the semantic contract over `ActionType`-as-resolved-mechanism.**
  Coherent only if `ActionType` is explicitly *demoted to mechanism* — a `GateCommand
  (5-value) → ActionType → Disposition` chain, one contract at the top. A real layering
  decision (not just "add an enum"); introduces a new enum + the chain mapping.
- **(ii) Re-vocab `ActionType` to the proposed vocabulary.** Migrate the `action_type` DB
  enum to the 5 proposed values + rework `dispositionForAction`. Touches shipped substrate
  (migration + the gate + capping's exhaustive switch + the disposition map). Heaviest;
  collapses the rung split (`allow` for both rung-2/3) unless preserved separately.
- **(iii) Defer the vocabulary to post-V1.** Ratify only "the layers are distinct
  (`ActionType` contract, `Disposition` outcome); the gate-command *vocabulary* question
  lands with governed auto-commit (ADR-0032)." Most conservative; **risk:** the charter
  wants Decision 11 *settled* in Wave 0 (R2), so deferral may under-deliver — call this out
  if chosen.

**`require_more_evidence` gap applies to all options:** it has no `ActionType` home today
and is evidence-gating (post-V1, INV-EVIDENCE). Under any option it is a *future* addition,
not a V1 value — name it so.

**Decision 11 is the CTO's.** This section is OPEN; the ratification package folds in the
chosen option and ADR-0030 ratifies with Part 2 closed.

---

## 3. Part 3 — Learning Trichotomy (V2-deferred; define-by-pointer)

The charter reserves ADR-0030 to also name the "(V2) Learning Trichotomy." Verified: **zero
code** (no `TaskPlan` / `WorkflowDefinition` / `AutonomyParameter` definitions in
`apps/web/src`); no canonical definition doc. So ADR-0030 **names** it and **points** to its
V2 home; it authors nothing.

- **The three learning-artifact classes** (from the V1/V2 proposal lineage): **TaskPlan**
  (a multi-step plan proposal), **WorkflowDefinition** (a learned/proposed workflow shape),
  **AutonomyParameter** (a proposed autonomy-policy change, e.g. a rung promotion). These
  are the three things workflow-learning may *propose* — each with its own ratification
  ceremony (proposed, not authored here).
- **V2 home:** workflow learning is the V2 track gated on consumers producing trace data
  (per the V2 preflight; the sibling of ADR-0029's future-direction pointer). The trichotomy
  is authored when that track opens — in **ADR-0028 (Workflow Core)** / the V2
  learning-substrate ADRs / **ADR-0032** territory, **not** in 0030.
- **Why not here (Simplification-3):** no consumer, no trace data, no live shape to inform
  the design. Authoring it now would over-architect ahead of the consumer. This is a
  pointer; it grants nothing and reserves nothing.

---

## 4. Cross-cutting: what ADR-0030 does NOT do

- No new table/column/enum/migration (Part 2 (ii) *would* require a migration **if chosen** —
  flagged in the option, not pre-committed).
- No invariant registration. (INV-4 is already in the charter's 9; this ADR clarifies its
  layering, does not register or alter an invariant.)
- No charter correction — INV-4 is consistent with disk (§2.1); the layering is stated as a
  positive clarification.
- No Learning-Trichotomy authoring (Part 3 is a pointer).
- No re-amendment of prior ADRs (the composition modules are affirmed at their existing
  ADRs: Rules Core ADR-0023/0024/0025; Autonomy Core ADR-0029; Authorization the service
  layer; Receipt Assembly ADR-0007 Q30 / Phase 8 chunk 9).

---

## 5. Lifecycle next steps (not this spec)

Per the ADR README lifecycle — **design spec → ratification package → ratified ADR** — and
its rule that an ADR body is the *post-ratification* artifact (a non-ratified ADR does not
belong in `docs/07_governance/adr/`):

1. Reviewer verifies this design spec (Part 1 seams against disk; Part 2 options stated
   against `ActionType` with the `require_more_evidence` gap; Part 3 V2-deferred).
2. **CTO supplies the Decision-11 direction** (i′/i/ii/iii) — by the ratification-package
   stage at the latest. Part 2 cannot stay open through ratification.
3. Author the **ratification package** at `docs/09_briefs/v1/ratification-packages/`
   (Phase-0 D1–D6 analog) — produces the ADR-0030 body *content* with Part 2 resolved.
4. **On ratification**, the ADR-0030 body lands at
   `docs/07_governance/adr/0030-decision-module-composition.md` (`status: ratified`) —
   never before; `adr:check` green. The design spec is preserved as historical reference.
5. Banks local on `staging`; pushes at retrospective close.
