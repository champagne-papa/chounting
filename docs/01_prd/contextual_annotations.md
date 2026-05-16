# Contextual Annotations — Phase 2 Brief

Subtle inline markers on financial statements (P&L, balance sheet)
that attach narrative context to significant variances. Hovering
over a marker opens a Logic Receipt explaining why the category
moved — "Marketing is up 20% MoM — three new SaaS subscriptions
started in March." The marker is visible; the detail is
hover-to-reveal.

Financial statements are numbers; founders need narrative. Today,
the CFO or controller reconstructs the "why" by cross-referencing
transactions, calendar events, and memory. Contextual annotations
let the agent attach the narrative automatically at the moment it
is computed, so the report explains itself without a separate
analysis step.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not automated commentary generation for management reports —
  that is a separate Phase 3 pattern. This is hover-to-reveal
  detail on individual statement lines, not auto-generated
  prose appended to report exports.
- Not a replacement for Logic Receipts on the underlying
  transactions — the annotation surfaces *why* a variance
  exists by pointing to Logic Receipts, not by creating new
  ones.
- Not editable by users in v1 — annotations are
  system-computed. Manual override (user-written annotations
  on statement lines) is deferred.

## Cross-references

- `docs/02_specs/intent_model.md` §6 (Logic Receipts — the
  annotation renders Logic Receipt content in summary form).
- `docs/07_governance/adr/0002-confidence-as-policy-input.md`
  (annotations use policy-outcome language, never raw
  confidence).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
