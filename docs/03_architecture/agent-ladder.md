# Agent Ladder

The autonomy model that wraps the runtime authority gradient.
Three rungs of progressive trust, four limit dimensions, a
System ceiling that no rung can cross. This is a **pointer
document**; the canonical authority lives elsewhere.

## What the Agent Ladder is

The Agent Ladder is the policy layer that answers "what is the
agent allowed to do *at all* on this rule, in this context?"
while the runtime layers (services, db) answer "given that it's
allowed, how does the request execute?"

Per `docs/02_specs/agent_autonomy_model.md` §4, the Agent Ladder
defines three rungs:

1. **Always Confirm** — every proposed mutation requires
   explicit user approval before execution. v1 default for all
   rules.
2. **Notify & Auto-Post** — proposed mutation auto-executes;
   user receives a notification with a 24-hour reversal window.
   Controller-authorized per §4.1 promotion ceremony.
3. **Silent Auto** — proposed mutation auto-executes without
   notification. Owner-authorized per §4.1.

Promotion and demotion are ceremonies that emit audit events and
update durable state in `vendor_rules.current_rung` (per ADR-0017
substrate) or analogous per-rule columns when the substrate
extends to additional rule types.

## Canonical authority

This document does NOT redraft the Agent Ladder; the canonical
authority lives at:

- **`docs/02_specs/agent_autonomy_model.md`** — full Agent Ladder
  specification.
  - **§2** — Authority Gradient Extended (Layer 4 framing).
  - **§4** — The Agent Ladder (three rungs, mechanics).
  - **§4.1** — Promotion Ceremony (controller for Notify &
    Auto-Post; owner for Silent Auto).
  - **§4.2** — Promotion Thresholds (Q23 system-fixed for v1;
    per-org tunable post-v1).
  - **§4.3** — Demotion ("Re-Probate"; one-click immediate).
  - **§6** — System vs Policy boundary (the seven uncappable
    row classes).
  - **§10** — Reserved INV-IDs (INV-AGENT-001..006).
  - **Principle 1** — System ceiling is uncappable regardless
    of rung, limit, or rule maturity.

- **`docs/07_governance/adr/0007-three-tier-agent-architecture.md`**
  — three-tier agent architecture; the runtime structure that
  the Agent Ladder gates.

- **`docs/07_governance/adr/0017-vendor-template-substrate.md`**
  — `vendor_rules` table substrate (v1 schema-only); the durable
  state that promotion / demotion ceremonies will update post-v1.
  Reserved enum members `vendor_rule_rung`
  (`always_confirm` / `notify_and_auto_post` / `silent_auto`)
  mirror the Agent Ladder rungs verbatim.

## Source-tree home

ADR-0020 Decision item 5 ratifies the empty home for Agent Ladder
implementation code:

```
apps/web/src/agent/policies/agent-ladder/
  README.md                       ← created in 2026-05-05 substrate session
  canInvokeTool.ts                ← Phase 2
  promotionRules.ts               ← Phase 2
  demotionRules.ts                ← Phase 2
  types.ts                        ← Phase 2
```

The folder is empty in v1 except for the README. Phase 2
(interaction model extraction) populates it.

**Implementation begins:** Phase 2.

The README at the empty home pins the load-bearing distinction
between Agent Ladder *policy logic* and Agent Ladder *durable
state*:

- **Policy logic** (decision rules, promotion/demotion conditions,
  rung-vs-tool eligibility) lives at
  `apps/web/src/agent/policies/agent-ladder/`.
- **Durable state** (track records, current rung per rule, audit
  events for promotion / demotion ceremonies) is persisted
  through services and the database — never held only in agent
  memory. Per the ADR-0020 Appendix A dependency direction:
  agent code calls services; services write to db. The Agent
  Ladder is not an exception to that rule.

## How the Agent Ladder consumes the runtime layers

Per `docs/03_architecture/agent-tool-architecture.md` (the
canonical call chain), the Agent Ladder gates appear at Seam 1 of
the call chain:

```
agent/orchestrator/
  ↓
agent/policies/agent-ladder/         ← gate fires HERE
  - reads current_rung for this rule (org_id, rule_key)
  - if rung = 'always_confirm': route through approval flow
  - if rung = 'notify_and_auto_post': route through notification flow
  - if rung = 'silent_auto': route directly to tool dispatch
  ↓
agent/tools/<capability>/<tool>.tool.ts
  ...
```

The gate is a *pre-tool-dispatch* check. The tool itself never
needs to know which rung the rule is on; the orchestrator resolves
the rung and adapts the dispatch accordingly. This separation
keeps the tool's body focused on its single responsibility (input
validation + service call) while the rung-aware routing lives in
the policy layer.

## What the Agent Ladder does NOT do

- **It does not bypass invariants.** A rule on Silent Auto still
  flows through the service's `withInvariants` wrapper, the DB
  CHECK constraints, and the audit-log emission. Silent Auto means
  "no user-facing approval click required"; it does NOT mean "no
  invariant enforcement."
- **It does not bypass the System ceiling.** Per
  `agent_autonomy_model.md` §6 + Principle 1, seven row classes
  are uncappable regardless of rung: locked-period posting,
  reversal entries, intercompany entries, period-end adjustments,
  equity postings, first-time vendors above floor, and vendor
  bank-detail changes (INV-AGENT-006). A rule on Silent Auto whose
  proposed mutation falls into any of these seven classes still
  requires user approval — the System ceiling fires regardless of
  the rule's rung.
- **It does not promote or demote rules in v1.** The substrate
  ships at v1 (per ADR-0017's `vendor_rules` substrate-only-v1
  framing); v1 emits only `'always_confirm'`. Promotion and
  demotion ceremonies fire post-v1 when the consuming code
  materializes.
- **It does not own the limit model.** Per
  `agent_autonomy_model.md`, the limit model (four dimensions:
  monetary cap, scope, frequency, recoverability) is a separate
  policy mechanism that bounds rule autonomy *within* a rung.
  Rung says "how much approval is required at all"; limit model
  says "for this rung, what mutations are eligible regardless."
  The two compose; neither substitutes for the other.

## v1 behavior summary

- Every rule defaults to **Always Confirm**. The Layer 4 substrate
  (`vendor_rules.current_rung`) ships at v1 schema time per
  ADR-0017 Decision item 1; v1 emits only `'always_confirm'` per
  ADR-0017 Decision items 3 and 5.
- No promotion ceremony fires in v1. The
  `vendor_rule_promotion_authority` enum is reserved per ADR-0017
  Decision item 5; no v1 row carries a non-null value.
- No demotion path fires in v1. v1 has no rules above Always
  Confirm to demote.
- The System ceiling is enforced at the service layer regardless
  of substrate state. INV-AGENT-006 (vendor bank-detail changes)
  fires at `vendorService.update()` per ADR-0015 §9; the
  enforcement does not consult `vendor_rules`.

## v2+ trajectory

When Phase 2 (interaction model extraction) ships:

- `agent/policies/agent-ladder/canInvokeTool.ts` reads the rule's
  current rung from the substrate and routes the orchestrator's
  call accordingly.
- `agent/policies/agent-ladder/promotionRules.ts` consumes the
  audit corpus (controller approval / rejection events) and
  proposes rule promotions per `agent_autonomy_model.md` §4.2
  thresholds.
- `agent/policies/agent-ladder/demotionRules.ts` consumes the
  rejection-rate window and triggers automatic demotion per §4.3.
- The post-v1 enforcement ADR (forthcoming, post-Phase-0) ratifies
  the threshold values and the calibration cadence.

Each of these is a separate consumer of the substrate ADR-0017
ratifies; the Agent Ladder doc here forward-points without
specifying.

## Cross-references

- `docs/02_specs/agent_autonomy_model.md` — full canonical
  Agent Ladder specification.
- `docs/03_architecture/authority-gradient.md` — Layer 4
  framing within the four-layer authority gradient.
- `docs/03_architecture/agent-tool-architecture.md` — call chain;
  the Agent Ladder gate at Seam 1.
- ADR-0007 — three-tier agent architecture.
- ADR-0017 — `vendor_rules` substrate; reserved
  `vendor_rule_rung` enum mirrors the three rungs.
- ADR-0020 Decision item 5 — empty home at
  `apps/web/src/agent/policies/agent-ladder/` ratified in
  2026-05-05 substrate session.
