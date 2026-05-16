---
id: "0022"
title: "ADR Lifecycle Workflows — Amendment vs Supersession"
status: ratified
date: 2026-05-08
deciders: [phil]
modules: [infra]
features: []
phase: ""
supersedes: []
superseded_by: []
related: ["0007", "0010", "0011", "0021"]
invariants: []
---

# ADR-0022: ADR Lifecycle Workflows — Amendment vs Supersession

## Status

Ratified 2026-05-08 by phil during round-2 docs reorganization
Session 4 (07_governance/ housekeeping). Sibling to ADR-0021
(frontmatter and tooling system) — where ADR-0021 ratified the
substrate of the ADR system, ADR-0022 ratifies the *lifecycle
workflows* that govern how ADRs change over time.

## Date

2026-05-08

## Triggered by

Pre-Session-4 cleanup Phase 3 audit, Probe 4 comprehension test
(2026-05-08), which surfaced that the amendment workflow used
implicitly by ADRs 0007 / 0010 / 0011 was tribal knowledge —
visible by inspecting amended ADRs but not documented as a
procedure anywhere. Phase 3 candidate 4e ("amendment workflow
not documented in either reference doc"). Phase 4 disposition
(2026-05-08) ratified candidate 4e as ADR-0022 substrate rather
than as documentation-by-inspection in `_template.md` / ADR
README — decision rules belong in ADRs per the project's own
conventions, and documenting-by-inspection is the exact failure
mode the Probe 4 finding surfaced.

## Context

### What this ADR decides

Three ADRs (0007 Three-Tier Agent Architecture, 0010 Reserved
Enum States, 0011 Document Platform) have already been
*amended* in place rather than superseded by new ADRs. Each
amendment took a specific shape: a `## Amendment YYYY-MM-DD —
<scope>` section appended to the ADR body, plus a Status-line
update noting the amendment. The pattern worked, but it was
implicit — there was no canonical record of when to amend vs
when to supersede, or what the `## Amendment` block should
contain.

ADR-0022 codifies the decision rule and the format. New ADR
authors deciding between "amend ADR-N in place" and "write
ADR-(N+M) that supersedes ADR-N" now have a deterministic rule
to apply, and the resulting amendment artifacts have a
consistent shape.

### What this ADR does NOT do

- **Backfill amendment frontmatter on existing ADRs.** Forward-
  only per ADR-0021 Decision item 7. ADRs 0007 / 0010 / 0011
  use the existing informal `## Amendment` pattern and stay as-
  is. ADR-0022's format applies to amendments authored from
  ratification time forward.
- **Add an `amendments` array to the ADR-0021 frontmatter
  schema.** Considered (would let the linter cross-reference
  amendments machine-readably), rejected: amendments are
  body-content-shaped (scope prose + decision items + cross-
  references), not metadata-shaped (atom values). The linter's
  bidirectional consistency check (ADR-0021 Decision item 5
  check 13) addresses supersession, where two ADRs reference
  each other. Amendments don't have a sibling ADR to cross-
  reference; they live entirely within their own ADR's body.
- **Specify how to roll back an amendment.** Amendments are
  append-only per the same δ-i preservation discipline ADR-
  0021 inherited. If an amendment turns out to be wrong, the
  fix is a NEW amendment that explicitly retracts or refines
  the prior one (with its own `## Amendment` block citing the
  retraction). No retroactive editing.

### Inheritance from existing patterns

ADR-0022 follows the same dogfood-via-itself pattern as ADR-
0021: this ADR's own structure (Status section, Decision items,
Cross-references) is the canonical example a contributor reads
to understand the shape. The amendment pattern this ADR
codifies is the shape that appears in ADRs 0007 §"Document
Platform Reframe Amendment", 0010 §"Recognized variants of the
four-element pattern (2026-05-04 amendment)", and 0011 §
amendments — ADR-0022 lifts the implicit pattern into explicit
form.

## Decision

### 1. Amend-vs-supersede decision rule

**Amend** when the change extends or refines the existing
decision's framework WITHOUT contradicting the original decision.
The original decision remains correct as written; the amendment
adds recognized variants, scope clarifications, or new cases that
fit within the original framework.

**Supersede** when the change replaces the original decision's
framework. The original decision is now incorrect, obsolete, or
fundamentally re-framed. A new ADR is written that explains
why the prior framework no longer applies, and the prior ADR's
status flips to `superseded` with `superseded_by` pointing at
the new ADR.

The test: can a future reader read the original ADR + the
amendment as a coherent unit and understand the current
decision? If yes, amend. If the reader needs to read the
original ADR to understand history but the new ADR to
understand current behavior, supersede.

**Worked examples from existing ADRs:**

- **ADR-0010 amendment 2026-05-04** (Reserved Enum States
  Variants A/B/C) — *amend*. The four-element pattern
  (enum + NOT NULL DEFAULT + scoped CHECK + three-layer
  defense) stayed valid; the amendment added Variant A
  (NULL-default config columns), Variant B (enum-array
  reservation), Variant C (pair-validity matrix) as
  recognized applications. A future reader of ADR-0010 reads
  the canonical four-element pattern AND the variants as a
  coherent decision-rule family.

- **ADR-0007 Document Platform Reframe Amendment** — *amend*.
  The three-tier agent architecture (Tier 1 commit / Tier 2
  proposal / Tier 3 interface) stayed valid; the amendment
  added Tier 2.5 read-boundary clarification covering the
  Relationship Router. Future readers see the three-tier
  framework + the Tier 2.5 boundary as one coherent
  architecture.

- **No supersession examples yet** in chounting's ADR
  history. The pattern is structurally possible (frontmatter
  has `supersedes` / `superseded_by` fields per ADR-0021
  Decision item 1) but hasn't fired.

### 2. `## Amendment` block format

Amendments are body-content-only (no frontmatter changes
beyond Status-line update; no machine-readable amendment
metadata). The block format:

```markdown
## Amendment YYYY-MM-DD — <Brief scope description>

### Triggered by

[Conversation / commit / brief / incident that prompted the
amendment.]

### Scope

[What this amendment adds, refines, or clarifies. What stays
preserved from the original. Be explicit about boundaries —
"this amendment does NOT" callouts are useful.]

### Decision items (numbered, forward-only)

[Same Decision-item numbering convention as the parent ADR.
Numbering RESTARTS at 1 within the amendment block —
amendments are self-contained Decision blocks, not
continuations of the parent's numbered items.]

1. ...
2. ...

### Cross-references

[Links specific to amendment scope. The parent ADR's main
Cross-references section may also be updated in the same
commit if the amendment introduces new external references.]
```

Amendments are appended at the end of the ADR body, BEFORE
the parent ADR's main `## Cross-references` section. Multiple
amendments accumulate as multiple `## Amendment YYYY-MM-DD —
<scope>` sections, in chronological order (oldest first).

### 3. Status-line update pattern

When an amendment lands, the parent ADR's `## Status` section
updates from:

```markdown
## Status

Ratified YYYY-MM-DD by [authority] per [ratification artifact].
```

To:

```markdown
## Status

Ratified YYYY-MM-DD by [authority] per [ratification artifact];
amended YYYY-MM-DD-of-amendment per [amendment scope summary].
```

If multiple amendments accumulate, each adds a clause:

```markdown
## Status

Ratified 2026-04-24 by [authority] per [original artifact];
amended 2026-05-04 per [first amendment scope];
amended 2026-MM-DD per [second amendment scope].
```

The Status section thus carries a chronological audit trail
without requiring readers to scan the body for amendment
blocks.

### 4. Frontmatter is unchanged across amendments

ADR-0022 deliberately does NOT add an `amendments` array to
the ADR-0021 frontmatter schema. Amendments are body-content,
not metadata:

- The `## Amendment` block carries scope prose + decision
  items + cross-references — content that doesn't fit a
  closed-set value list.
- The linter's bidirectional consistency check (ADR-0021
  Decision item 5 check 13) addresses supersession, where two
  ADRs cross-reference each other via `supersedes` /
  `superseded_by`. Amendments live within a single ADR, so
  there's no second ADR to cross-reference.
- Adding an `amendments: [{date, ref}]` array would create
  two sources of truth (frontmatter array + body section
  headings) that must stay synchronized — exactly the kind of
  drift the substrate-now-enforcement-later pattern (ADR-
  0010, ADR-0021) is designed to prevent.

The Status-line clauses (Decision item 3 above) ARE the
machine-greppable amendment trail (`grep "amended" docs/07_governance/adr/`).

### 5. Supersession workflow (paired with amendment, for completeness)

Although ADR-0022's primary focus is amendment, supersession
mechanics are documented here for symmetry — the ADR README's
existing `## Supersedes and supersession` section names the
rule but doesn't detail the workflow.

When ADR-A supersedes ADR-B, the same commit MUST update both
ADRs:

- ADR-A's frontmatter: `supersedes: ["NNNN"]` where NNNN is
  ADR-B's id.
- ADR-A's Status section: `Ratified YYYY-MM-DD by [authority]
  per [ratification artifact]; supersedes ADR-NNNN per
  [reasoning].`
- ADR-B's frontmatter: `superseded_by: ["MMMM"]` where MMMM
  is ADR-A's id; `status: superseded`.
- ADR-B's Status section: `Originally accepted YYYY-MM-DD;
  superseded by ADR-MMMM YYYY-MM-DD per [reasoning summary].`

The ADR-0021 linter's check 12 (status=superseded ⇒ superseded_by
non-empty) and check 13 (bidirectional consistency) enforce the
frontmatter side at commit time. The Status-section updates are
human discipline.

ADR-B stays in the folder as historical record; it is NOT
deleted. Future readers encountering ADR-B see the
"superseded by ADR-MMMM" pointer and follow it.

### 6. Forward-only application

ADR-0022's format and decision rule apply to amendments and
supersessions authored from ADR-0022's ratification date forward.
The three already-amended ADRs (0007, 0010, 0011) keep their
existing informal `## Amendment` shapes per the δ-i preservation
discipline (ADR-0021 Decision item 7). They are NOT retroactively
reformatted.

A future contributor reading those legacy amendments sees a
slightly different shape than ADR-0022's spec — that's expected
and acceptable. The legacy amendments remain valid and readable;
ADR-0022 codifies the shape going forward without invalidating
the past.

## Consequences

### What this enables

- **Deterministic decision rule for new ADR authors.** The
  amend-vs-supersede question is now a single test ("can the
  parent + amendment be read as a coherent decision?"). New
  authors don't have to inspect existing amended ADRs to infer
  the rule.
- **Consistent amendment artifacts across the codebase.** The
  `## Amendment YYYY-MM-DD — <scope>` block format gives
  reviewers and future readers a predictable structure. Locating
  an amendment within an ADR becomes a single grep
  (`grep "^## Amendment" docs/07_governance/adr/`).
- **Machine-greppable amendment audit trail via Status lines.**
  Without adding frontmatter complexity, the Status section
  carries a chronological list of amendments. A future tooling
  arc could parse Status lines for amendment metadata if needed,
  but no such tooling is required by ADR-0022.
- **Symmetric supersession workflow documentation.** Decision
  item 5 surfaces the supersession workflow (which existed
  implicitly in the linter's checks 12/13 + ADR README prose)
  as explicit procedure. New authors superseding an ADR have a
  step-by-step rule.

### What this constrains

- **Amendments are append-only.** The δ-i preservation
  discipline applies. An amendment that turns out to be wrong
  is corrected by a NEW amendment that retracts or refines,
  not by editing the prior amendment.
- **No `amendments` frontmatter field in ADR-0021's schema.**
  Decision item 4 explicitly rejects this. A future
  contributor proposing to add the field is reopening the
  decision; the case for staying-out is made above.
- **Decision items in `## Amendment` blocks restart numbering
  at 1.** A future contributor numbering "Decision item 8"
  in an amendment to ADR-N (which has 7 Decision items in
  its parent block) is violating Decision item 2 here.
  Amendment Decision items are a separate numbered block
  scoped to the amendment.
- **Status-section clauses accumulate, not replace.** A
  contributor amending an already-amended ADR adds a new
  clause; they do NOT remove the prior amendment clause.

### What this costs

- **One new ADR (~330 lines) to maintain.** ADR-0022 itself
  is the cost. Amortizes over future amendments — every
  amendment authored against ADR-0022's spec saves the cost
  of re-deriving the shape.
- **Slight friction at amendment authoring time.** Authors
  must reach for ADR-0022's Decision items rather than
  inspecting an existing amended ADR. For one-off amendments,
  inspection might be faster; for recurring patterns, the
  codified spec wins.
- **Inconsistency with legacy amendments.** ADRs 0007 / 0010
  / 0011's existing `## Amendment` shapes don't perfectly
  match ADR-0022's spec. The mismatch is small (Status-line
  clauses are similar; the body section structure differs in
  details) but real. Forward-only application accepts the
  inconsistency rather than retroactively reformatting.

## Alternatives considered

### Alternative 1 — Document amendment workflow in `_template.md` comment block

Rejected. `_template.md`'s comment block is for *frontmatter*
field semantics, not body-content workflow. Adding amendment
prose there would expand the comment block significantly and
mix two concerns (data shape vs. authoring procedure). The ADR
README's `## Pre-ratification design specs` section established
the precedent of putting workflow content in dedicated sections
of the README; an analogous `## Amendment workflow` section
would fit there. But amendment-vs-supersession is a *decision
rule*, not just a procedure — and decision rules belong in ADRs
per the project's own conventions (the failure mode the Probe 4
finding surfaced was precisely "tribal knowledge that should
have been codified as ADR substrate").

### Alternative 2 — Document amendment workflow in ADR README section

Rejected for the same reason as Alternative 1. The ADR README
already has `## Format`, `## Frontmatter`, `## Pre-ratification
design specs`, `## Supersedes and supersession`, and `## Current
ADRs` sections. Adding `## Amendment workflow` is structurally
fine but doesn't match where the rule lives in the project's
governance hierarchy. Decision rules → ADRs; reference material
and procedure pointers → README. This ADR is the rule; the README
gets a brief pointer (added in Commit 6 of this session).

### Alternative 3 — Add `amendments` array to frontmatter schema

Rejected per Decision item 4 reasoning. Amendments are body-
content; metadata-fying them creates two sources of truth and
invites drift. The Status-line clauses provide machine-greppable
amendment metadata without the dual-source-of-truth cost.

### Alternative 4 — Bulk-reformat legacy amended ADRs (0007 / 0010 / 0011) to ADR-0022's spec

Rejected per Decision item 6 (forward-only). The δ-i preservation
discipline applies: legacy amendments reflect the implicit shape
that was true at their authoring time; reformatting rewrites the
past. Forward-only application accepts the inconsistency in
exchange for not destroying historical accuracy.

## Cross-references

- [`_template.md`](./_template.md) — ADR-0021's frontmatter
  template; ADR-0022's frontmatter follows the same schema.
- [`README.md`](./README.md) — ADR README; Commit 6 of round-2
  Session 4 adds a brief pointer ("for amendment workflow see
  ADR-0022") in the appropriate section.
- **ADR-0007** ([`./0007-three-tier-agent-architecture.md`](./0007-three-tier-agent-architecture.md))
  — Document Platform Reframe Amendment, the second informal
  amendment in chounting's ADR history. Used as a worked
  example in Decision item 1.
- **ADR-0010** ([`./0010-reserved-enum-states.md`](./0010-reserved-enum-states.md))
  — 2026-05-04 amendment adding Variants A/B/C, the third
  informal amendment. Used as a worked example in Decision
  item 1.
- **ADR-0011** ([`./0011-document-platform.md`](./0011-document-platform.md))
  — Phase 0 amendments. Inherits the same pattern.
- **ADR-0021** ([`./0021-adr-frontmatter-and-tooling.md`](./0021-adr-frontmatter-and-tooling.md))
  — frontmatter and tooling system; ADR-0022 inherits the
  schema and the forward-only discipline. Sibling ratification
  at Session 4 Commit 5.

## Notes for future ADR writers

- **The amend-vs-supersede test is the central rule.** A
  future contributor unsure which to do should ask: "can a
  reader read parent + amendment as a coherent decision?" Yes →
  amend. No → supersede. This single test resolves most cases.
- **Status-line clauses accumulate.** A four-times-amended ADR
  has a four-clause Status line, oldest first. Don't compress
  history into "amended several times"; preserve dates.
- **Decision-item numbering restarts within amendments.** This
  is non-obvious if you're used to documents where numbering is
  global. Amendment Decision items are scoped to the
  amendment block.
- **Frontmatter doesn't change across amendments.** Only the
  Status-line clause within the body's `## Status` section
  updates. Frontmatter `status` stays at `accepted` /
  `ratified` (whatever it was); it does NOT flip to anything
  amendment-specific.
- **For supersession, the linter's checks 12 and 13 enforce
  frontmatter consistency at commit time.** A contributor
  forgetting to update ADR-B's `superseded_by` field when
  writing ADR-A with `supersedes: ["NNNN"]` will see a lint
  error before the commit lands. Status-section updates are
  not lint-enforced and are human discipline.

## Glossary for outside readers

For round-2-specific governance vocabulary this ADR uses
without redefining inline (round-2, dogfood ADR, forward-only
convention, δ-i preservation discipline, session-internal
narration), see
[ADR-0021's Glossary for outside readers section](./0021-adr-frontmatter-and-tooling.md#glossary-for-outside-readers).
For broader project vocabulary (push-readiness gate,
filesystem-not-prompt rule, STRUCTURAL-OBJECTION, etc.), see
the [Governance Vocabulary](../../02_specs/glossary.md#governance-vocabulary)
section of `docs/02_specs/glossary.md`.
