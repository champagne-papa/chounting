# Briefs

**Document class: briefs.** Execution briefs and phase-specific
working documents. Phase folders organize by phase; sub-buckets
within each phase organize by document type.

## Convention

Each phase folder contains the sub-buckets the phase needs:

- `specs/`              — pre-ratification design specs (per ADR-0021).
- `plans/`              — multi-step execution plans.
- `chunks/`             — mid-arc working briefs.
- `ratification-packages/` — formal substrate enacting ADR ratification (added round-2 Session 5B; 6-consumer evidence from Phase 0's D1-D6 ratification cluster).

Phases use the subset that applies. Sub-buckets are added as their
consumers emerge; current convention ships with four because four
have current consumers. The `ratification-packages/` sub-bucket
exercises the rule's first concrete invocation (Session 5B's Layer
2 migration; consumer evidence: D1-D6 ratification packages from
Phase 0's governance arc). Future sub-buckets land when consumer
evidence forces the shape.

The same deferral logic applies to brief tooling — a linter and
index-generator (paralleling `scripts/adr/`) defer to N=3 brief
instances OR a friction trigger. Substrate-now-enforcement-later:
trim convention to actually-consumed surface; expansion follows
consumer evidence.

## Top-level structure

Top-level folders are phase folders or sibling-arc folders:

- `phase-0/` — Phase 0 governance arc work (D1-D6 ratification
  chain; ADR-0011-0019 substrate). Closed.
- `phase-1.1/`, `phase-1.2/`, `phase-1.3/`, `phase-1.5/`, `phase-2/` —
  Phase 1.x and Phase 2 work.
- `phase-5/` — Phase 5 (spend initiative) chunks. In progress.
- `post-mvp/` — sibling-arc work that surfaced post-MVP (e.g.,
  test-hygiene fix arc).

## Index

- `CURRENT_STATE.md` — where the project is right now.
- `_template.md` — phase-folder skeleton; copy and customize when
  creating a new phase folder.
- `phase-0/`, `phase-1.1/`, `phase-1.2/`, `phase-1.3/`, `phase-1.5/`,
  `phase-2/`, `phase-5/` — phase folders.
- `post-mvp/` — sibling-arc plans + briefs.
- `session-config-cleanup-0430-brief.md` — flat orphan-arc brief
  (legacy; pre-convention).

## Authoring

New briefs follow `_template.md` as a starting skeleton. Phase
folders are created on-demand; if a needed phase folder doesn't
exist, create it from the template and add it to the structure
above. AI agents may create new files in `09_briefs/[current-phase]/`
or relevant sub-bucket per the convention.
