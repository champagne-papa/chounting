# ADR-0030 Ratification Package — Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy

**Status:** Awaiting CTO ratification.
**Date assembled:** 2026-05-31.
**V1 plan reference:** Wave 0; ADR-0030 reserved in `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`.
**Design spec:** `docs/09_briefs/v1/specs/2026-05-31-adr-0030-decision-module-composition-disposition-design.md`.
**Anchored at:** HEAD `d9628a9e` (branch `staging`), unpushed.
**Decision 11:** **RESOLVED — option i′** (CTO, 2026-05-31). `ActionType` is the one typed
decision contract; the proposed 5-value vocabulary is a semantic gloss over it, not a
competing enum; `require_more_evidence` is a future `ActionType` addition when evidence-gating
lands (post-V1). No new enum, no migration, no shipped surface touched.
**Posture:** (A) consolidation/affirm-not-build, like ADR-0029. Part 1 (composition) and
Part 2 (Decision 11 = i′) are ratified as the ADR body in §A; Part 3 (Learning Trichotomy)
is a V2 pointer. The OPEN→ratified pointer reconcile (glossary + system_overview) is in §B,
shown line-level against verbatim current text, each annotated editorial-not-semantic.

---

## 1. Summary

ADR-0030 ratifies three things, all (A)-posture (affirm what ships; build nothing):

- **Part 1 — decision-module composition.** "Decision modules, not a Decision Core":
  services *compose* a set of decision modules (Rules Core, Authorization Core, Autonomy
  Core, Workflow Routing, Receipt Assembly); no god-object decision folder aggregates them.
  Each live seam is named against disk. No module is built or changed.
- **Part 2 — Decision 11 = option i′.** The one typed decision contract is the shipped
  `ActionType` (the gate's output; the `action_type` DB enum, 5 values), already reconciled
  to `Disposition` (the outcome label) via `dispositionForAction`. This satisfies charter
  INV-4 as written. The proposed 5-value vocabulary
  (`allow|deny|require_approval|require_more_evidence|queue_manual_review`) is a semantic
  gloss mapped onto `ActionType`, not a competing enum; `require_more_evidence` is the one
  proposed value with no `ActionType` home and becomes a future `ActionType` addition when
  evidence-gating lands (post-V1, INV-EVIDENCE territory). No new enum, no migration, no
  shipped surface touched.
- **Part 3 — Learning Trichotomy (V2).** Names the three learning-artifact classes
  (TaskPlan, WorkflowDefinition, AutonomyParameter) and points them to their V2 home;
  authors nothing (Simplification-3).

This package contains: the ratification ask (§2), the verified-against-disk grounding the
ADR rests on (§3), the ADR-0030 body to land in `adr/` on ratification (§A), and the
line-level OPEN→ratified pointer reconcile for review (§B).

## 2. Ratification ask

Ratify ADR-0030 as posture (A) with Decision 11 = i′. On ratification:

1. The §A body lands at `docs/07_governance/adr/0030-decision-module-composition.md` with
   `status: ratified`, `date: <ratification date>`.
2. The §B redlines are applied to `docs/02_specs/glossary.md` (Decision-modules entry +
   the proposed-5-value entry) and `docs/03_architecture/system_overview.md` (the banner's
   ADR-0030 references only — ADR-0036/Decision 10 stays OPEN).
3. `pnpm adr:check` green; banks local on `staging`; pushes at retrospective close.

**Three confirmed boundaries carried from review:**

- **No charter correction.** Charter INV-4 ("one typed decision contract — reconciled with
  the shipped `Disposition` enum") is consistent with disk: the contract is `ActionType`; it
  *reconciles with* `Disposition` via `dispositionForAction`. ADR-0030 states this layering
  as a positive clarification; there is no charter defect to log.
- **system_overview full-body rewrite stays deferred to Wave-0 close.** This ADR touches
  only the banner's ADR-0030 references (Decision 11 → ratified). The banner's deferral
  rationale still holds while ADR-0036 / Decision 10 is open; the full reconcile fires at
  Wave-0 close when both decisions have landed. The banner names both ADRs on shared lines
  — this ratification clears only the 0030 half; the 0036 half stays OPEN, narrated as such.
- **`require_more_evidence` is named as a future addition, not a V1 value.** Under i′ it has
  no `ActionType` home today; ADR-0030 names it as the one proposed value that becomes a
  future `ActionType` member when evidence-gating lands (post-V1). It is not added here.

## 3. Grounding (verified against disk at HEAD `d9628a9e`)

| Claim | Verification |
|---|---|
| `ActionType = Database['public']['Enums']['action_type']` | `shared/rules/types.ts:14` |
| `action_type` enum = 5 values `{auto_post_at_rung_2, auto_post_at_rung_3, suggest_with_required_approval, route_to_exception_queue_with_reason, block_with_reason}` | generated `db/types.ts` (`action_type` enum, 5 members) |
| Gate emits `ActionType` | `agent/policies/agent-ladder/gate.ts:36–40` — `export function gate(matchResult: MatchResult, ruleRegistryRow: RuleRegistryRow, limitContext: LimitContext): ActionType` |
| Gate is the rule-path composition site (consumes MatchResult, applies cap, then limit/aggregate/health checks) | `gate.ts:41–51` — `cap(max, ruleRegistryRow.current_rung)` → `checkPerTransactionLimit` → `checkDailyAggregate` → `checkTrackRecordHealth` |
| Pure-core `evaluate(): MatchResult`, deterministic (INV-RULE-002) | `core/rules/evaluator.ts:74` (+ determinism comment :5, :71) |
| `MatchResult` carries **no** `effective_action` (the field is `winning_branch_max_action`) | `shared/rules/types.ts:61–67` (explicit "NO effective_action — the gate's output, not the pure core's") |
| `effective_action` is the gate's output, held by the orchestrator (not on MatchResult) | `agent/policies/agent-ladder/ruleEvaluationOrchestrator.ts:72` — `let effective_action: ActionType \| null = null` |
| Autonomy Core: `cap(maxOutcomeAction: ActionType, currentRung: RuleAutonomyRung): ActionType`, "9-row table" | `shared/rules/capping.ts:18, 25–28` (label is the code's own comment) |
| `RuleAutonomyRung` = 3 values `{always_confirm, notify_and_auto_post, silent_auto}` | `shared/rules/types.ts:15`; capping switch arms `:37–52` |
| `Disposition` = 4 values `auto_posted\|blocked\|routed\|pending`; `dispositionForAction(action: ActionType): Disposition`; two auto-post arms collapse to `auto_posted` | `shared/rules/disposition.ts:15, 22, 24–26` |
| `disposition` persisted, CHECK-constrained to 4 values, migration `20240164` | `supabase/migrations/20240164000000_rule_evaluation_log.sql:107–108` — `CHECK (disposition IS NULL OR disposition IN ('auto_posted','routed','blocked','pending'))` |
| Proposed 5-value vocabulary absent in code | `grep` in `apps/web/src`: `require_more_evidence`=0, `queue_manual_review`=0, `require_approval`(word-boundary)=0 |
| Authorization Core seam | `services/middleware/withInvariants.ts:148–152` (Invariant 4 role authorization → `canUserPerformAction`); `services/auth/canUserPerformAction.ts` exists |
| Receipt Assembly partial: `ProposalJustificationSchema` shipped, producer omits at V1 | `shared/schemas/accounting/proposalJustification.schema.ts:58` (export); `agent/orchestrator/extraction/stages/proposalBuilder.ts` — 0 `justification` references |

---

## §A — ADR-0030 body (lands in `adr/` on ratification)

> The frontmatter `status` is shown as `ratified` and `date` as `<RATIFICATION_DATE>` —
> these take effect when the body is moved to `adr/` at ratification, never before (per the
> lifecycle; a non-ratified ADR does not belong in `adr/`). Frontmatter `related` lists only
> *authored* ADRs (`adr:lint` Check 10 rejects references to unauthored ADRs); the reserved
> ADR-0028 / ADR-0032 are cross-referenced in prose only, mirroring the ADR-0029 precedent.

```markdown
---
id: "0030"
title: "Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy"
status: ratified
date: "<RATIFICATION_DATE>"
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

Ratified <RATIFICATION_DATE> by CTO (V1 governance arc, Wave 0). Reserved by the V1
Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`). Design spec:
`docs/09_briefs/v1/specs/2026-05-31-adr-0030-decision-module-composition-disposition-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-05-31-adr-0030-ratification-package.md`.

Consolidation/affirm-not-build ADR. Ratifies the decision-module composition principle,
resolves Decision 11 (the typed decision contract is the shipped `ActionType`), and names
the (V2) Learning Trichotomy by pointer. Introduces no new substrate, registers no
invariant, authors no code.

## Date

<RATIFICATION_DATE>

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
- ADR-0028 — Workflow Routing (net-new) + Learning Trichotomy V2 home.
- ADR-0032 — Canonical Autonomy Gate Seam; where the gate-command vocabulary extension and
  governed auto-commit land post-V1.
- `docs/02_specs/glossary.md` — "Decision modules" + "proposed 5-value gate disposition"
  (reconciled OPEN→ratified by this ADR; redlines in the ratification package §B).
- `docs/03_architecture/phase_simplifications.md` — Simplification 3 (governs (A)-not-(B);
  Part 3 pointer).
```

---

## §B — OPEN→ratified pointer reconcile (review line-by-line)

Each redline shows **current** (verbatim) → **proposed**, with a one-line **basis** asserting
it is editorial (a now-settled decision was previously narrated as OPEN/parked) and does not
pre-state anything still open. Apply only on ratification. **Scope boundary:** these touch
only ADR-0030 / Decision-11 references; every ADR-0036 / Decision-10 reference stays OPEN
verbatim, and the system_overview full-body rewrite stays deferred to Wave-0 close.

### B.1 — `glossary.md`, "Decision modules" entry (composition-principle pointer)
- **Current:** "The composition principle is the Part-1 decision of ADR-0030 (spec stage; ratifies with ADR-0030, which is parked on Decision 11 — not yet ratified)."
- **Proposed:** "The composition principle is the Part-1 decision of **ADR-0030 (ratified)**."
- **Basis:** Editorial — the term itself is unchanged; only its status pointer moves from
  "spec stage / parked / not yet ratified" to "ratified," which is now true. Decision 11's
  resolution is the substance, carried by B.2.

### B.2 — `glossary.md`, "proposed 5-value gate disposition" entry (Decision-11 resolution)
- **Current:**
  > **proposed 5-value gate disposition.** *(Decision 11 — OPEN, see ADR-0030.)* A proposed vocabulary (`allow` / `deny` / `require_approval` / `require_more_evidence` / `queue_manual_review`) glossing the shipped **ActionType** ([A](#a)); `require_more_evidence` is the one value with no ActionType home (evidence-gating, post-V1). Reconciliation (which vocabulary is canonical) is OPEN — not defined as an outcome until ADR-0030 ratifies.
- **Proposed:**
  > **proposed 5-value gate disposition.** *(Decision 11 — RESOLVED at ADR-0030, option i′.)* A proposed vocabulary (`allow` / `deny` / `require_approval` / `require_more_evidence` / `queue_manual_review`) glossing the shipped **ActionType** ([A](#a)). ADR-0030 ratifies **ActionType** as the one typed decision contract; this vocabulary is a semantic gloss over it, **not** a competing enum. `require_more_evidence` is the one value with no ActionType home — a future ActionType addition when evidence-gating lands (post-V1, INV-EVIDENCE territory).
- **Basis:** Editorial — flips the OPEN narration to the ratified resolution (i′) without
  adding any new vocabulary to code; states exactly what D-0030.2 decides.
- **⚠️ Placement note for reviewer (not a unilateral move):** this term sits under the
  "**V1 deferred / decision-pending vocabulary**" subsection. Once Decision 11 resolves, a
  *resolved* term under a *decision-pending* header is mild drift. Two options — (a) leave it
  in place with the B.2 redline (minimal; the entry self-documents as resolved), or
  (b) relocate it to the settled "V1 workflow-native vocabulary" section. I lean (a) for this
  ratification (smallest diff; relocation is a structural call better made at the Wave-0-close
  full reconcile, when the deferred-vocabulary subsection is revisited wholesale). Flagging
  for your call rather than picking silently.

### B.3 — `system_overview.md`, banner — Wave-0 status line (shared 0030/0036 line)
- **Current:** "underway — ADR-0029 ratified; ADR-0030 / ADR-0036 parked on open decisions; later waves ahead)."
- **Proposed:** "underway — ADR-0029 ratified; ADR-0030 ratified (Decision 11); ADR-0036 parked on Decision 10; later waves ahead)."
- **Basis:** Editorial — clears only the 0030 half of a line naming both ADRs; ADR-0036 stays
  "parked on Decision 10" (still OPEN, narrated as such). No pre-stating of Decision 10.

### B.4 — `system_overview.md`, banner — deferral-rationale line (shared 0030/0036 clause)
- **Current:** "decision-module composition + the disposition contract close with **ADR-0030 (Decision 11, OPEN)**, and the compliance/jurisdiction posture closes with **ADR-0036 (Decision 10, OPEN)**. Narrating those as settled here now would pre-state unratified decisions —"
- **Proposed:** "decision-module composition + the disposition contract closed with **ADR-0030 (Decision 11, ratified)**, and the compliance/jurisdiction posture closes with **ADR-0036 (Decision 10, OPEN)**. Narrating the *latter* as settled here now would pre-state an unratified decision —"
- **Basis:** Editorial — flips the 0030 clause to ratified; leaves the 0036 clause OPEN; the
  banner's deferral rationale (full reconcile at Wave-0 close) **still holds** because
  Decision 10 remains open, so the banner stays in place rather than being removed. The
  "pre-state" caution narrows from "those" (both) to "the latter" (0036 only).

**Summary of §B:** 4 redlines (2 glossary, 2 system_overview banner), each flipping a
now-resolved Decision-11 / ADR-0030 narration from OPEN/parked to ratified; zero touch to any
ADR-0036 / Decision-10 reference; the system_overview banner stays in place (its deferral
rationale survives on the still-open Decision 10) and its full-body rewrite stays deferred to
Wave-0 close. One placement question flagged (B.2) for the reviewer rather than decided
unilaterally.

---

## 4. Source materials read during package drafting

- `docs/09_briefs/v1/specs/2026-05-31-adr-0030-decision-module-composition-disposition-design.md`
  (the parked design spec; Parts 1/2/3).
- `apps/web/src/shared/rules/types.ts` (`ActionType`, `RuleAutonomyRung`, `MatchResult`).
- `apps/web/src/shared/rules/capping.ts` (`cap`, the 9-row table, the 3 rungs).
- `apps/web/src/shared/rules/disposition.ts` (`Disposition`, `dispositionForAction`).
- `apps/web/src/agent/policies/agent-ladder/gate.ts` (`gate(): ActionType`, the composition body).
- `apps/web/src/agent/policies/agent-ladder/ruleEvaluationOrchestrator.ts` (`effective_action` local).
- `apps/web/src/core/rules/evaluator.ts` (`evaluate(): MatchResult`).
- `apps/web/src/services/middleware/withInvariants.ts` + `services/auth/canUserPerformAction.ts` (Invariant 4).
- `apps/web/src/shared/schemas/accounting/proposalJustification.schema.ts` +
  `agent/orchestrator/extraction/stages/proposalBuilder.ts` (Receipt Assembly partial).
- Generated `apps/web/src/db/types.ts` (`action_type` enum, 5 members).
- `supabase/migrations/20240164000000_rule_evaluation_log.sql` (disposition CHECK).
- `docs/02_specs/glossary.md` (verbatim current text for §B.1/B.2).
- `docs/03_architecture/system_overview.md` (verbatim banner text for §B.3/B.4).
- ADR-0029 ratification package (house-form exemplar).
