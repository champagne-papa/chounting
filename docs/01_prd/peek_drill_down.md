# Peek Drill-Down — Phase 2 Brief

Shift+Click on a financial statement line (e.g., a P&L row) opens
a Peek Window — an inline, temporary panel showing the 10–20
transactions making up that total. Escape collapses the panel.
The user never leaves the statement view, preserving spatial flow.

Accountants constantly need to verify where a number came from.
Traditional software requires navigating to a detail view, losing
your place in the statement. Peek preserves the report-level
context while surfacing the detail momentarily — the user reads
the answer and returns to the report without a navigation event.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not a full drill-down — Peek shows a summary of the underlying
  transactions; full transaction detail still requires
  click-through to the transaction detail view.
- Not a filter — Peek is read-only inspection of a single
  statement line's composition. Filtering the statement is a
  separate action that changes which lines are visible.
- Not available on statement categories that are aggregations
  across dimensions (consolidated P&L, multi-entity rollups) —
  those require Phase 3 patterns because the aggregation-to-
  transaction mapping is non-trivial (see
  `canvas_context_injection.md` note on P&L drill-down deferral).

## Cross-references

- `docs/09_briefs/phase-1.2/canvas_context_injection.md` (explains
  why P&L line selection is Phase 2 — Peek is the Phase 2 answer
  to the deferred P&L drill-down).
- `docs/03_architecture/ui_architecture.md` (the canvas surface
  Peek overlays onto).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
