# ADR-0002: Confidence as Policy Input, Not UI Hint

## Status

Accepted

## Date

2026-04-16

## Triggered by

The agent autonomy design sprint (see
`docs/07_governance/friction-journal.md` entry dated 2026-04-16,
"Agent Autonomy Design Sprint"). The sprint's second external CTO
review identified displayed confidence scores as the single most
user-hostile pattern in the working design. The correction landed
here.

## Context

The pre-existing `ProposedEntryCard` type in
`src/shared/types/proposedEntryCard.ts` carries a
`confidence: 'high' | 'medium' | 'low' | 'novel'` field that is
currently rendered in the Phase 1.1 UI. The Phase 1.2 brief
`docs/09_briefs/phase-1.2/agent_architecture.md` states confidence
is "display only in Phase 1, drives routing in Phase 2."

The design sprint supersedes both. The decision: confidence is
never displayed to users. Ever. In any form.

### Why raw confidence scores fail as user-facing information

Raw confidence scores (e.g., "Confidence: 87%") are
uncalibratable by users against domain risk tolerance. An
accounting controller cannot evaluate whether 87% is good enough
for a $1,500 Amazon invoice because the number has no concrete
meaning in their workflow. It invites vibes-based override of
policy ("eh, 87% is probably fine") and damages trust in the
policy engine when users see scores they cannot interpret.

The mature analog: credit underwriting, fraud detection, and
medical triage all compute confidence internally but surface
policy outcomes to users. "Your application was declined because
your debt-to-income ratio exceeds our threshold" is actionable.
"Your application was declined — confidence: 64%" is not. This is
not novel — it is the convergent practice of every mature risk
system that has iterated past its first version.

The user-facing surface is the policy outcome with a legible
reason: "Requires your approval: $1,800 exceeds this rule's
$1,500 limit" — not "Requires your approval: confidence 73%."

## Decision

Raw confidence scores are never displayed to users in any surface:
confirmation cards, the Agent Policies canvas, the Agency Health
view, exported Logic Receipts, API responses, error messages, or
anywhere else. Confidence is stored internally on
`ProposedMutation.justification.confidence_score` and feeds the
policy decision tree (rung assignment, track-record thresholds)
but does not appear in any user-facing surface.

The user-facing equivalent is
`ProposedMutation.policy_evaluation.required_action` rendered with
a legible reason template. The reason names the concrete policy
condition that triggered the outcome (limit exceeded, ceiling
class, rung disallows, recent rejection), not a probability.

This decision supersedes the Phase 1.2 brief's "display only in
Phase 1" framing. When Phase 1.2 implementation begins, the brief
will be updated to match this ADR.

## Consequences

### What this enables

- Users reason about policy (limits, rungs, ceilings) rather than
  probabilities they cannot calibrate. The reasoning surface is
  the Agent Ladder and its five-step decision tree, not a number.
- The agent's error language is consistent and predictable across
  surfaces — every rejection has a named cause.
- Auditors receive structured Logic Receipts with no probability
  noise. Every auto-post or rejection traces to a named policy
  condition that can be defended to a regulator.
- Support conversations improve. "Why did the agent require my
  approval?" is answered by a named policy condition, not by a
  calibration debate about what 87% means.

### What this constrains

- **ProposedEntryCard migration obligation.** The Phase 1.1
  display-shell `ProposedEntryCard` type has a `confidence` field
  that is currently rendered. When `ProposedMutation` lands as the
  canonical internal object, the card's confidence rendering is
  removed. This is documented in `agent_autonomy_model.md` §8 as
  a migration obligation, not a Phase 1.2 scope change. The
  `proposedEntryCard.ts` file is not edited by this ADR.
- **Internal debugging surface required.** Debugging the agent's
  rung-assignment behavior requires an engineer-facing (not
  user-facing) surface to inspect raw confidence. This surface is
  Phase 2+ scope. v1 engineers debug via database queries against
  the internal `confidence_score` field on Logic Receipts.
- **Phase 1.2 brief reconciliation.** The Phase 1.2 brief's
  "Confidence Routing" section is now superseded. The brief is not
  rewritten in this session but will be reconciled during Phase 1.2
  execution.

### What this does NOT change

- The agent still computes confidence internally. This ADR is
  about display discipline, not computation.
- `ProposedMutation.justification.confidence_score` exists on the
  type and is stored in Logic Receipts for reproducibility. It is
  never surfaced via API response (reserved INV-INTENT-002 in
  `intent_model.md`).

## Alternatives considered

### Alternative 1: Show confidence and policy side-by-side

Display both "Confidence: 87%" and "Requires your approval: limit
exceeded" on the confirmation card. Rejected because users
immediately reason "I can override the policy because I can see
the model thinks it's fine." The policy surface becomes advisory
rather than controlling. Every support conversation turns into
calibration debates ("why did it say 87% not 92%?"). The score
dominates the policy in the user's attention hierarchy because
numbers feel more authoritative than words — even when the number
is less informative.

### Alternative 2: Show confidence only, no policy outcome

This is the current Phase 1.1 state:
`ProposedEntryCard.confidence` is displayed and no policy surface
exists yet. Rejected because users have no action to take. A
"medium" confidence card tells them nothing about what to do. The
user has to reason from probability to action themselves, which is
exactly what the Agent Ladder and policy engine are designed to
prevent. Displaying raw confidence without policy is passing the
decision back to the user in a form they cannot act on.

### Alternative 3: Show policy outcome, with raw confidence available via a debug / advanced view

Considered seriously. The appeal: power users and engineers could
inspect raw scores when they need to. The architectural cost:
debug surfaces in production software drift into user-facing UX
over time. Every "power user" request to promote a debug toggle to
a preference is one step toward Alternative 1. The hard discipline
of "not displayed anywhere" is the only discipline that survives
feature creep.

Additionally, debug-surface confidence creates an audit problem:
if the number is visible to the user at all, an auditor may ask
"did the user see and override a low-confidence entry?" The
exposure creates a new audit question that "not displayed" does
not. The simplest audit posture is "the number was not available
to the user."

### Alternative 4: User-configurable — let each org choose whether to display confidence

Rejected. Per-org display settings create inconsistent audit
trails. Two orgs using the same rule set at the same rung would
produce different user-facing evidence trails, making cross-org
comparison and shared tooling harder. The setting also invites
ongoing support debate ("should we turn on confidence display?")
that the hard discipline prevents. In a family-office context
with shared controllers across entities, per-org divergence is a
governance risk, not a preference.

### Alternative 5: Show confidence only for novel patterns (rule_id = null) where "novel" is more informative than policy

The narrow case is real — "no rule matched" is a different user
experience than "rule matched but policy requires approval."
Rejected because the novel-pattern experience can be surfaced
without displaying a score: "Novel pattern — the agent has not
seen this transaction type before. Human approval required." The
semantic carries the same signal without introducing a probability
into the UI. The user needs to know it is novel; they do not need
to know how novel.

## Cross-references

- `docs/02_specs/agent_autonomy_model.md` Principle 2 and §8
  (policy outcome language, ProposedEntryCard.confidence migration).
- `docs/02_specs/intent_model.md` §3 (`ProposedMutation` shape)
  and §7 (reserved INV-INTENT-002 — confidence is never
  API-surfaced).
- `docs/09_briefs/phase-1.2/agent_architecture.md` (the
  "Confidence Routing" section is superseded by this ADR).
- `docs/07_governance/friction-journal.md` entry dated 2026-04-16.
- `docs/02_specs/open_questions.md` Q23, Q26.
