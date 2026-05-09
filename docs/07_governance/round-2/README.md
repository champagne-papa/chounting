# Round-2 Docs Reorganization Governance

Governance home for round-2 docs reorganization work. Round-2 is a
meta-arc that operates on the structure used by all phases — it is
not phase-N work. Round-2 lives at the governance surface (this
folder, `docs/07_governance/adr/` for ratified decisions,
`docs/07_governance/friction-journal.md` for entries, and
`docs/restructure-plan.md` at root for the V1 plan that will move
here as `DOCS_RESTRUCTURE_V1.md` at Session 7's V1→V2 ratification).

## Namespace shape

Round-2 has **one arc-level brief and N session-level plans**:

- **Arc-level brief:** `docs/restructure-plan.md` (V1; will migrate
  to `docs/07_governance/DOCS_RESTRUCTURE_V1.md` at Session 7
  alongside the new `DOCS_RESTRUCTURE_V2.md`).
- **Session-level plans:** here, named `YYYY-MM-DD-session-NL-plan.md`
  where `N` is the session number and `L` is the layer letter (e.g.,
  `2026-05-08-session-5a-plan.md`).

This pattern differs from `docs/09_briefs/post-mvp/`'s pattern
(one-brief-plus-one-plan per arc): round-2 has one arc-level brief
covering the entire seven-session sequence, with per-session plans
for execution. The asymmetry reflects asymmetric epistemic status —
round-2 is a structured multi-session arc rather than a discrete
fix.

## Index

- `2026-05-08-session-5a-plan.md` — Session 5A Layer 0 substrate
  (briefs convention + `docs/superpowers/` elimination + ADR README
  pre-ratification-home update + new phase-0/ and phase-5/ READMEs).

(Future session plans land alongside; Session 7's V1→V2 ratification
will migrate `docs/restructure-plan.md` to `DOCS_RESTRUCTURE_V1.md`
in this folder's parent directory.)

## When to use this folder

Place a session-level plan here when the work is:
- Round-2 internal (a session of the docs-reorganization arc).
- Not phase-N substantive work (phase work goes to `09_briefs/<phase>/plans/`).
- Not sibling-of-round-2 deferred work (those go to `09_briefs/post-mvp/`).

Round-2 closes at Session 7. After closure, this folder becomes a
historical archive of round-2's per-session execution.
