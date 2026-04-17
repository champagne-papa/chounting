# Mini-Map for Large Ledgers — Phase 2 Brief

A vertical heat-map scroll bar on the right edge of long ledger
and bank-feed views. Dot colors mark uncategorized rows (amber),
error/flagged rows (red), and draft rows (neutral gray per the
ghost-row palette). Clicking a dot jumps the canvas to that
position.

Navigating 500 rows in a bank feed or 2,000 lines in a trial
balance is cognitively taxing. The mini-map gives the user a
whole-view heat map at a glance — they can see where problems
cluster across the entire period without scrolling. The spatial
signal ("the red cluster is in the middle of the month") conveys
information that row-count badges and filter counts do not.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not a replacement for filters — filters narrow the dataset;
  the mini-map indexes the current dataset visually. Both are
  useful; they serve different cognitive modes.
- Not a progress indicator — it is spatial (where in the list),
  not temporal (how far through a process).
- Not appearing on short tables — the mini-map activates at a
  row-count threshold (exact threshold deferred to Phase 2
  scoping) so small lists are not cluttered with an unnecessary
  control.

## Cross-references

- `docs/03_architecture/ui_architecture.md` (the canvas host
  surface the mini-map attaches to).
- `docs/07_governance/adr/0004-ghost-rows-visual-contract.md`
  (draft-row indicator color reserved from the ghost-row
  neutral-gray palette).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
