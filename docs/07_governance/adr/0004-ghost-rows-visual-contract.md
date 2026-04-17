# ADR-0004: Ghost Rows Visual Contract (Four-Signal Defense in Depth)

## Status

Accepted

## Date

2026-04-16

## Triggered by

The agent autonomy design sprint (see
`docs/07_governance/friction-journal.md` entry dated 2026-04-16,
"Agent Autonomy Design Sprint"). Both external CTO reviews
independently identified the dual-state canvas (stable substrate
vs. transient overlay) as conceptually elegant but visually
ambiguous in practice. The single greatest risk: a user exporting
a financial report that includes draft/speculative entries because
they visually looked posted.

## Context

Phase 2+ features (Triage Bucket, bulk AI proposals, bank-feed
ingestion) will produce proposed-but-not-posted entries that need
to be visible in ledger views for the user to evaluate impact.
This is the "speculative execution" capability — showing the user
what the books would look like if these entries were posted.

"Draft" or "speculative" entries embedded in a ledger view create
a specific risk: a user exports the ledger, or generates a report,
and the draft data leaks into a surface that looks authoritative.
The cost of this failure is catastrophic — a P&L report with draft
entries misstates financial position. In a family-office context,
this misstates positions across multiple entities and can cascade
into bad consolidation decisions.

A single visual signal (e.g., italic text, or a different color)
is insufficient defense. Colorblind users lose color-only signals.
Screenshots lose background tints. Users scanning quickly miss
subtle italicization. Every single-signal approach has known
failure modes at the margins, and the margins matter because the
consequence of failure is a materially incorrect financial report.

## Decision

When an AI-proposed entry appears in a ledger view before posting,
it uses **four independent visual signals simultaneously**:

1. **Italic text** on all content within the row.
2. **Muted / lower-contrast color** (text at 60% opacity
   equivalent; exact token defined in the UI spec).
3. **Persistent left-border stripe** in a reserved neutral gray.
   Not tied to success/warning/danger color semantics —
   semantically "draft," a status orthogonal to the traditional
   color-coded states.
4. **Inline "Draft" pill** in the row's identifier column,
   rendered as a text badge in the same reserved gray.

All four signals must be present simultaneously. A renderer
missing any one signal is a bug, not a configuration choice.

**Schema-level export exclusion.** Draft rows are excluded from
all exports and reports via schema-level filtering — a report
query includes `WHERE lifecycle_state IN ('finalized', ...)` at
the database layer, not at the UI layer. A report that includes
draft rows is a bug caught at the query layer, not a UX decision
the user makes.

**The commit animation.** The draft → posted transition is a
discrete UI event with a one-time animation: the ghost row
"solidifies" (opacity and font-weight transition from
muted/italic to normal over ~300ms). This is the single place
motion is permitted in ledger views. All other visual transitions
are instant. The information content is "this just became real"
— the user needs to feel the commit.

## Consequences

### What this enables

- Users can see the impact of proposed entries on the ledger —
  what the P&L would look like if these entries were posted —
  without risking draft data leaking into authoritative surfaces.
- The speculative-execution capability (the user sees the books
  as they would look) becomes safe to build in Phase 2+.
- Colorblind users retain the signal via italic + stripe + pill
  (three non-color cues).
- Screenshots of the ledger retain the signal via italic +
  stripe + pill even if color is lost in reproduction.
- The schema-level export exclusion means a UI filtering bug
  cannot produce a bad report — the database refuses to produce
  one.

### What this constrains

- Every new ledger-like view must implement all four visual
  signals for draft rows. Lists, reports, reconciliation views,
  consolidated views — every surface that renders entries must
  honor the contract.
- The schema-level filter requires every report query to be
  explicit about lifecycle status. This is a small ongoing
  discipline cost for contributors writing report queries.
- The reserved gray cannot be reused semantically elsewhere.
  Once "this gray means draft," it cannot also mean "inactive"
  or "archived" without creating ambiguity. The color token is
  committed.
- The commit animation is the single allowed motion — the
  precedent must not drift. Every other visual transition stays
  instant or uses only functional transitions (focus rings,
  hover states). Future contributors cannot add celebratory
  animations to other ledger actions without violating this
  contract.

### What this does NOT change

- The append-only ledger rule. Draft entries are not ledger rows —
  they live in `ProposedMutation` (or a Phase 2 staging table).
  The append-only RLS on `journal_entries` (INV-LEDGER-003) is
  unaffected.
- The Four Questions grammar. Draft rows are rendered with the
  same grammar as posted rows; the visual contract is orthogonal
  to the confirmation grammar.

## Alternatives considered

### Alternative 1: Single visual signal (italic only, or color only, or pill only)

Rejected. Single-signal designs have known failure modes:

- **Italic-only** fails in dense tables where italic vs. roman
  is hard to distinguish at a glance, especially in monospace or
  tabular numeral fonts used in financial views.
- **Color-only** fails for colorblind users (~8% of male users)
  and in screenshots, printouts, and shared-screen video calls.
- **Pill-only** requires the user to look at a specific column;
  rows glanced at peripherally from the overall table layout are
  misread as posted.

The architectural cost of any single-signal failure: a user
exports an incorrect financial report. Defense in depth at the
visual layer is cheap; the schema-level filter alone is correct
but visual redundancy catches UI bugs before they reach the query
layer.

### Alternative 2: Modal separation — drafts in a separate drawer or side panel

Considered seriously. The appeal: no ambiguity. Drafts are
physically separated from posted entries; no visual signal needed.
Rejected because it loses the feature the visual contract is
designed to enable: seeing the impact of proposed entries **in
context**. Separating drafts into a drawer means the user must
mentally combine the ledger view and the drawer to understand
"what would my books look like if these post?" The modal
separation eliminates the ambiguity but also eliminates the value.

### Alternative 3: Text-badge only (a "DRAFT" tag with no color/italic differentiation)

Rejected. A text-only badge is scannable when the user is
deliberately looking at the badge column but ambiguous on
screenshots, in compressed table layouts, and when the badge
column is scrolled out of viewport in wide tables with many
columns. The badge is necessary (signal 4 in the contract) but
not sufficient by itself.

### Alternative 4: No in-ledger draft view at all — drafts visible only in a review queue

The safest design: zero risk of export contamination by
construction, because draft entries never appear in a surface
that looks like the ledger. Rejected because it eliminates the
speculative-execution feature entirely. Phase 2's Triage Bucket,
bulk proposals, and "what-if" impact preview all require showing
draft entries in ledger context. The four-signal contract +
schema-level filter is the design that preserves the feature
while managing the risk.

## Cross-references

- `docs/03_architecture/ui_architecture.md` "Ghost Rows Visual
  Contract" section.
- `docs/02_specs/mutation_lifecycle.md` §2 (the lifecycle states
  that determine which entries are ghosts — Pending, Needs
  Attention).
- `docs/02_specs/ledger_truth_model.md` INV-LEDGER-003 (events
  table append-only — draft rows do not violate this because
  they are not ledger rows).
- `docs/07_governance/friction-journal.md` entry dated 2026-04-16.
