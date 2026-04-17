# Institutional Memory View (Learned Rules) — Phase 2 Brief

A canvas view titled "Learned Rules" showing every rule the agent
has learned for the current org. For each rule: the pattern
description, confidence class, current rung, the transactions
that established it, and edit/disable controls. The controller can
inspect, rename, tighten, or disable any rule.

The product vision promises "rule-based institutional memory that
controllers can review, edit, or override." Without a view, this
promise is invisible. The Learned Rules view is how "trust is
earned incrementally" becomes a user-facing feature rather than a
brochure claim — the controller can see what the agent has learned,
verify it is correct, and intervene when it is not.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not the Agent Policies canvas view (which focuses on rung +
  limits — see `agent_autonomy_model.md` §8). This view focuses
  on the **pattern content** of each rule: what it learned, from
  which transactions, how the pattern is described. Policies and
  Learned Rules are related but distinct surfaces.
- Not a generic "AI memory" view — it shows only rules with
  structured justification. Opaque model memory (embeddings,
  fine-tuning weights, context-window state) is not part of the
  product and is not surfaced here.
- Not editable at the raw-pattern level in v1 — the controller
  can rename, disable, or re-probate a rule, but cannot rewrite
  its matching logic. Full rule editing is Phase 3.

## Cross-references

- `docs/02_specs/agent_autonomy_model.md` §8 (Agent Policies
  view — the sibling surface that focuses on rungs and limits).
- `docs/02_specs/intent_model.md` §6 (Logic Receipts — each
  rule's match history is a set of Logic Receipts).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
