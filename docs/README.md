# Documentation Index

## Reading order for new contributors

1. [Product vision](00_product/product_vision.md) — what and why
2. [System overview](03_architecture/system_overview.md) — how it's structured
3. [Phase simplifications](03_architecture/phase_simplifications.md) — why Phase 1 looks different
4. [Developer setup](04_engineering/developer_setup.md) — from git clone to running

## Reference

- [Ledger truth model](02_specs/ledger_truth_model.md) — invariants and rules
- [Data model](02_specs/data_model.md) — table-by-table schema reference
- [Invariants index](02_specs/invariants.md) — all INV-DOMAIN-NNN IDs
- [Control matrix](06_audit/control_matrix.md) — invariant enforcement evidence
- [ADRs](07_governance/adr/) — architectural decision records
- [Friction journal](07_governance/friction-journal.md) — the war diary

## Current phase

- [Current state](09_briefs/CURRENT_STATE.md) — where we are
- [Phase 1.2 obligations](09_briefs/phase-1.2/obligations.md) — what's next

## Folder placement guardrail

Folder placement decisions under `docs/` are governed by Principles
1, 2, and 3 ratified at
[`07_governance/DOCS_RESTRUCTURE_V2.md`](07_governance/DOCS_RESTRUCTURE_V2.md).
Before creating any folder under `docs/`, read this guardrail.

### Permitted patterns

- Top-level folders match the canonical numbered taxonomy:
  `00_product/` through `09_briefs/`, plus `99_archive/`.
- `07_governance/` sub-folders include `adr/`, `audits/`,
  `friction-journal/`, `retrospectives/`, plus the cross-phase
  meta-arc exception (Pattern 7 below).
- Sub-folders under numbered top-level folders are permitted when
  they encode a single canonical axis under the parent's axis
  (e.g., `09_briefs/phase-N/specs/`, `09_briefs/phase-N/plans/`).

### Forbidden patterns

- **Workflow-lineage folders at any level.** A folder named for a
  methodology arc, sprint, or work-grouping is wrong.
  Caught-and-fixed example: `docs/superpowers/` (workflow-lineage
  folder migrated in round-2 Session 5A; specs/ and plans/
  contents redistributed to per-phase
  [`09_briefs/<phase>/specs/`](09_briefs/) +
  [`09_briefs/<phase>/plans/`](09_briefs/)).
- **Phase-vocabulary folders at top-level.** A folder like
  `docs/phase-1/` is wrong; phase work goes to
  [`09_briefs/phase-N/`](09_briefs/). Phase folders are
  session-bounded artifacts, not document classes.
- **Document-class folders that don't match the canonical numbered
  taxonomy.** New top-level document-class folders require an ADR
  ratifying the addition.

### Decision rule for ambiguous cases

If your case doesn't clearly match a permitted pattern AND doesn't
clearly violate a forbidden pattern: file an ADR before creating
the folder. The ADR ratifies the new pattern; the folder follows
the ADR.

### Bypass procedure: Pattern 7 conditional permission for cross-phase meta-arcs under `07_governance/`

Cross-phase meta-arc folders under `07_governance/` are
conditionally permitted under Pattern 7 (per V2 Part 1):

**First-instance bypass (full):**
- Folder README answering the document-class questions.
- Friction-journal entry as N=1 evidence of the meta-arc shape.
- Operator acknowledgment in the commit body.

**Follows-precedent bypass (light):**
- Folder README answering the same questions plus a 4/4
  precedent-matching checklist citing precedent.
- One-line friction-journal entry citing the precedent.
- Commit body cites the precedent. No fresh operator
  acknowledgment per instance.

**4/4 precedent-matching test (light bypass):**
1. Precedent README answers document-class questions.
2. New README answers the same questions citing precedent.
3. Cross-phase scope / durable identity / closure criteria /
   governance-surface placement match.
4. Naming structurally consistent (e.g., `round-N/`).

**Canonical first-instance precedent:**
[`07_governance/round-2/`](07_governance/round-2/) (round-2 docs
reorganization meta-arc).

**Pattern 7's bypass procedure carries two operational rules:**

- **Canonical-source verification at execution time.** When
  implementing a bypass, verify against canonical sources (V2,
  [`02_specs/taxonomy.md`](02_specs/taxonomy.md),
  [`03_architecture/folder-structure.md`](03_architecture/folder-structure.md),
  etc.) at the moment of writing rather than from memory or
  plan-internal substrate. Plan-internal brainstorm-context is
  design substrate; canonical docs are the ratified source.
- **Chronological-reality verification at planning time.** When
  drafting forward-looking content (fire counts, sequence
  assumptions, "after X session executes" projections), don't
  project; reference the current ratified state and let
  execution-time verification establish the count when the
  artifact lands.

AI agents may not unilaterally bypass without operator
acknowledgment in the commit body.

### Cross-references

- [`07_governance/DOCS_RESTRUCTURE_V2.md`](07_governance/DOCS_RESTRUCTURE_V2.md)
  — Principles 1, 2, 3 ratification + Pattern 7.
- [`02_specs/taxonomy.md`](02_specs/taxonomy.md) — canonical
  taxonomy.
- [`07_governance/adr/0021-adr-frontmatter-and-tooling.md`](07_governance/adr/0021-adr-frontmatter-and-tooling.md)
  — frontmatter conventions and round-2 architectural
  contributions.
- [`07_governance/round-2/README.md`](07_governance/round-2/README.md)
  — meta-arc folder document-class README (Pattern 7 first-
  instance precedent).
