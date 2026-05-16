<!--
ADR Frontmatter Schema (per ADR-0021).

File path: `docs/07_governance/adr/NNNN-kebab-slug.md` where NNNN
is the next free ADR id, 4-digit zero-padded. Find the next free
id by listing the folder and incrementing the highest, OR by
inspecting the generated `## Current ADRs` table in `README.md`.
The slug is lowercase kebab-case (letters / digits / hyphens
only) and must match the linter's filename regex
`^\d{4}-[a-z0-9-]+\.md$`.

Section structure (forward-only): new ADRs use Decision-item
numbering under a single `## Decision` header (per ADR-0012 /
0015 / 0016 / 0018 / 0019 precedent). Earlier ADRs (0007 / 0011
/ 0013 / 0014) use §-numbering as historical artifact and are
preserved per δ-i preservation discipline. See `README.md` §
"Decision section structure (forward-only)" for the convention's
codification provenance.

Field semantics:

- id: string, zero-padded to 4 digits, must match filename prefix.
- title: human title; can be longer than the filename slug.
- status: one of: ratified, accepted, superseded, deprecated.
  No `proposed` — chounting uses external design specs at
  `docs/09_briefs/<phase>/specs/` for the pre-ratification stage
  (see `## Pre-ratification design specs` in this folder's README).
- date: ISO date of ratification (not draft date). **Quote the
  value as a string** (`date: "2026-05-15"`), not bare
  (`date: 2026-05-15`) — YAML auto-parses unquoted ISO dates to
  Date objects. The linter and generator normalize Date → string
  in code, but quoting at write time is the simpler discipline.
- deciders: array of names / handles who signed off (e.g., `[phil]`).
- modules: array; values must exist in `docs/02_specs/taxonomy.md`
  Modules section.
- features: array; values must exist in `docs/02_specs/taxonomy.md`
  Features section. Optional (empty array allowed).
- phase: string from `docs/02_specs/taxonomy.md` Delivery-phases
  section, or empty for cross-phase ADRs.
- supersedes: array of ADR IDs this replaces (e.g., ["0007"]).
  See ADR-0022 for the supersession workflow (paired updates
  required: ADR-A's `supersedes` + ADR-B's `superseded_by` +
  ADR-B's status flip; linter checks 12 / 13 enforce frontmatter
  consistency).
- superseded_by: array; set when this ADR is later replaced.
- related: array of loosely related ADR IDs.
- invariants: array of INV-DOMAIN-NNN IDs this ADR establishes,
  modifies, or relies on. Linter verifies each ID matches regex
  `^INV-[A-Z]+-\d{3}$` AND exists in `docs/02_specs/invariants.md`.
  The chounting-specific load-bearing field — closes the
  ADR ↔ INV reachability loop.

Status-line format (in the body's `## Status` section):
`Ratified YYYY-MM-DD by [authority] per [ratification artifact
reference].`
- `[authority]` — the signing decider name (e.g., `phil`); for
  multi-decider ADRs, list all. Match the frontmatter
  `deciders` array.
- `[ratification artifact reference]` — the artifact that
  records the ratification: a commit SHA, a friction-journal
  entry date, a brief / scoping doc filename, or a session
  identifier (e.g., "round-2 docs reorganization Session 4").
- For amendments, append clauses chronologically per ADR-0022
  Decision item 3 (e.g., `Ratified DATE … ; amended DATE per
  scope`).

Amendment vs supersession: see ADR-0022 for the decision rule
(amend when parent + amendment can be read as a coherent
decision; supersede when the original framework is replaced).
-->
---
id: "NNNN"
title: ""
status: ratified
date: "YYYY-MM-DD"
deciders: []
modules: []
features: []
phase: ""
supersedes: []
superseded_by: []
related: []
invariants: []
---

# ADR-NNNN: [Decision Title]

## Status

Ratified YYYY-MM-DD by [authority] per [ratification artifact reference].

## Date

YYYY-MM-DD

## Triggered by

[Conversation, PR, brief, or incident that prompted this decision.
Include the commit SHA or filepath if applicable.]

## Context

[Problem and constraints. What needed solving and why.]

## Decision

[Decision-item-numbered list per the forward-only convention
codified in this folder's README 2026-05-08.]

1. ...
2. ...

## Consequences

[Honest enable / constrain pairs. Be explicit about the cost, not
just the benefit.]

## Alternatives considered

[Each rejected alternative + the architectural cost it would have
imposed. Not "we thought about X" — *why X was wrong for this
situation*.]

## Cross-references

[Links to other ADRs, spec leaves, INV-IDs, briefs, or external
docs the reader should follow for more detail.]
