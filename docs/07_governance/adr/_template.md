<!--
ADR Frontmatter Schema (per ADR-0021):

- id: string, zero-padded to 4 digits, must match filename prefix.
- title: human title; can be longer than the filename slug.
- status: one of: ratified, accepted, superseded, deprecated.
  No `proposed` — chounting uses external design specs at
  `docs/09_briefs/<phase>/specs/` for the pre-ratification stage
  (see `## Pre-ratification design specs` in this folder's README).
- date: ISO date of ratification (not draft date).
- deciders: array of names / handles who signed off.
- modules: array; values must exist in `docs/02_specs/taxonomy.md`
  Modules section.
- features: array; values must exist in `docs/02_specs/taxonomy.md`
  Features section. Optional (empty array allowed).
- phase: string from `docs/02_specs/taxonomy.md` Delivery-phases
  section, or empty for cross-phase ADRs.
- supersedes: array of ADR IDs this replaces (e.g., ["0007"]).
- superseded_by: array; set when this ADR is later replaced.
- related: array of loosely related ADR IDs.
- invariants: array of INV-DOMAIN-NNN IDs this ADR establishes,
  modifies, or relies on. Linter verifies each ID matches regex
  `^INV-[A-Z]+-\d{3}$` AND exists in `docs/02_specs/invariants.md`.
  The chounting-specific load-bearing field — closes the
  ADR ↔ INV reachability loop.
-->
---
id: "NNNN"
title: ""
status: ratified
date: YYYY-MM-DD
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
