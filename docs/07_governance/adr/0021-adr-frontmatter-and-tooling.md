---
id: "0021"
title: "ADR Frontmatter and Tooling"
status: ratified
date: 2026-05-08
deciders: [phil]
modules: [infra]
features: []
phase: ""
supersedes: []
superseded_by: []
related: ["0010", "0019", "0020"]
invariants: []
---

# ADR-0021: ADR Frontmatter and Tooling

## Status

Ratified 2026-05-08 by phil during round-2 docs reorganization
Session 3 (ADR system upgrade execution). The substrate (template,
generator, linter, taxonomy) lands as Commits 2–5 of this session;
this ADR is the dogfood test for the substrate and the canonical
record of the four convention decisions Session 3 introduces.

## Date

2026-05-08

## Triggered by

Round-2 docs reorganization plan, ratified through the design
conversation summarized in
`reports/docs-reorg-verification-20260507.md` (the rev 3
verification report, NEEDS-PLAN-REVISION resolved via the
plan-revision summary). This ADR is one of seven Session-3
artifacts: docs/02_specs/taxonomy.md, _template.md,
scripts/adr/generate-index.ts, scripts/adr/lint.ts, the ADR
README updates, the package.json + install-hooks.sh + CI wiring,
and this dogfood ADR.

The verification report's four blockers all flow through this
ADR's Decision items: the 04_engineering off-by-one count is
resolved in Session 6 (a separate workstream); the "one canonical
axis" principle wording resolves through round-2 V2 ratification
(Session 7); the README staleness framing resolves in Session 6;
the scripts/ runtime convention mismatch resolves in this ADR's
Decision item 3 (TypeScript-script location convention introduced
with explicit attribution).

## Context

### Why an ADR-tooling ADR exists

The existing ADR system at `docs/07_governance/adr/` is
hand-maintained: 20 ADRs (0001–0020) plus a README index that
contributors edit by hand when ratifying new ADRs. The system
worked well through Phase 0 — eight ADRs ratified across D1–D6
gates 2026-05-03 to 2026-05-04. Three frictions surfaced during
that arc and accumulated through round-2 docs reorganization
brainstorming:

1. **Index drift.** The hand-maintained `## Current ADRs` table
   tracked ADRs 0001–0010 with stale dates and titles by the
   time round-2 verification ran. Hand-maintained indexes drift
   silently as authors forget to update them in lockstep with
   ADR commits.

2. **No structured cross-references.** ADRs cite related ADRs in
   prose ("see ADR-0010 §6.8"), but cross-cutting questions —
   "which ADRs touch the storage module?", "which ADRs cite
   INV-AUDIT-001?", "which ADRs ratified in Phase 0?" — require
   ad-hoc grep. A frontmatter schema with `modules`, `invariants`,
   `phase`, and `supersedes` fields turns those questions into
   generated index sections.

3. **No mechanical taxonomy enforcement.** ADRs reference module
   names ("services/accounting/", "Document Platform"), invariant
   IDs ("INV-AUDIT-001"), and phase identifiers ("phase-1.5C")
   in prose. A typo or stale name silently propagates. A linter
   that validates structured fields against a canonical taxonomy
   catches the typo at commit time.

The verification report flagged a fourth concern: the existing
scripts/ directory holds bash scripts only; introducing TypeScript
scripts at `scripts/adr/` is a NEW convention introduction (not
"matching existing convention" as an earlier draft framed). This
ADR resolves the framing.

### What this ADR does NOT do

- **Backfill frontmatter on legacy ADRs (0001–0020).**
  Forward-only per Decision item 7. The 20 legacy ADRs stay as-is.
- **Replace the existing `## Format` section in the ADR README.**
  Existing format prose is preserved verbatim per the round-2
  plan's hard constraint. Frontmatter is added as a new ## section
  alongside, not as a replacement.
- **Activate the linter on legacy ADRs.** Legacy ADRs are skipped
  cleanly by the linter (no frontmatter → no validation). When a
  legacy ADR is naturally edited for substantive reasons, the
  author may opportunistically add frontmatter; pre-emptive
  backfill is rejected.
- **Migrate `docs/superpowers/specs/` to per-phase
  `09_briefs/<phase>/specs/`.** That migration lands at Session 5
  (Briefs Layer 0 — superpowers/ elimination). This ADR's Decision
  item 4 forward-points to the migration record at
  `DOCS_RESTRUCTURE_V2.md` Part 3 (Session 7).
- **Codify the round-N restructure plan convention itself.** That
  codification lands at Session 7's `conventions.md` addition
  alongside the V1→V2 elevation.

### Inheritance from ADR-0010 substrate-now-enforcement-later

ADR-0021 follows the substrate-now-enforcement-later cross-pattern
codified in ADR-0010 (Phase 0 D6 §6.8 + ADR-0017 Variant A
precedent). The pattern: substrate (the schema, the empty target
homes, the linter scaffold) lands at v1 ratification time;
enforcement (the linter actually catching violations on populated
frontmatter) lands at first-consumer time. ADR-0021 IS the first
consumer — its own frontmatter is the dogfood that validates the
linter is at least minimally correct. ADRs 0022+ inherit the
discipline.

## Decision

The Decision is presented as seven items per the forward-only
Decision section structure convention codified in the ADR README
2026-05-08.

### 1. Frontmatter schema and forward-only application

ADRs from ADR-0021 onward carry YAML frontmatter. Schema is
documented in the comment block above the frontmatter in
`_template.md`; field semantics covered there. The fields:

- `id` (string, 4-digit zero-padded), `title`, `status`,
  `date`, `deciders` — identification metadata.
- `modules`, `features`, `phase` — cross-cutting taxonomy fields
  validated against `docs/02_specs/taxonomy.md`.
- `supersedes`, `superseded_by`, `related` — ADR-to-ADR
  cross-references.
- `invariants` — INV-DOMAIN-NNN cross-references validated
  against `docs/02_specs/invariants.md`. The
  load-bearing chounting-specific field that closes the
  ADR ↔ INV reachability loop.

Legacy ADRs (0001–0020) do NOT carry frontmatter and are NOT
backfilled. The forward-only rule mirrors the convention
discipline already codified for the Decision section structure
(ADR README 2026-05-08 codification): new ADRs use the new
shape; old ADRs are preserved per δ-i preservation discipline.

### 2. Canonical taxonomy location: `docs/02_specs/taxonomy.md`

The canonical taxonomy file lives at
[`docs/02_specs/taxonomy.md`](../../02_specs/taxonomy.md), not at
any of: `docs/07_governance/adr/TAXONOMY.md`,
`docs/00_product/taxonomy.md`, `docs/09_briefs/TAXONOMY.md`. Per
the round-2 architectural review: locating the taxonomy under
`02_specs/` (alongside `glossary.md` and `invariants.md`)
prevents three drifting taxonomies with subtly different names
for the same concepts. The taxonomy file enumerates *values*; the
glossary defines *terms*; the two are operationally connected.

The location decision is canonical because the taxonomy is
referenced by:

- ADRs 0021+ (this ADR's `modules`, `features`, `phase` fields).
- Briefs (Session 5 ships `_template.md` referencing
  `02_specs/taxonomy.md`).
- Spec / architecture / engineering frontmatter (Session 6 ships
  `scripts/docs/lint.ts` or equivalent reading the same file).

A single consumer reading from a single file is the discipline;
multiple consumers reading from drifting near-files is the failure
mode this ADR closes.

### 3. TypeScript-for-docs-tooling location convention

Existing scripts in `scripts/` are bash (`.sh`) for shell-shaped
operations: session lifecycle, install hooks, friction-journal
audits, route-tag scans. Existing TypeScript scripts live at
`apps/web/scripts/*.ts` for web-app-scoped operations. The `tsx`
runtime is already established (root devDependency; existing
`apps/web/scripts/*.ts` use it).

This ADR introduces a NEW location convention: top-level
`scripts/<area>/*.ts` for cross-repo TypeScript docs tooling.
Examples: `scripts/adr/generate-index.ts`, `scripts/adr/lint.ts`,
and (Session 6 forthcoming) `scripts/docs/lint.ts`. The two
location conventions coexist:

- `scripts/*.sh` — top-level bash for shell-shaped cross-repo
  operations.
- `scripts/<area>/*.ts` — top-level TypeScript for cross-repo
  docs / governance tooling.
- `apps/web/scripts/*.ts` — web-app-scoped TypeScript tooling.

The runtime is NOT new (tsx was already there); the LOCATION is
new (top-level scripts/<area>/ for cross-repo TypeScript). The
distinction is load-bearing: a future contributor seeing
`scripts/adr/lint.ts` should not infer "all top-level scripts can
now be TypeScript" — bash scripts retain their role for
shell-shaped operations. Language choice follows shape of work,
not folder location.

### 4. Pre-ratification design specs at `docs/09_briefs/<phase>/specs/`

ADRs ratify from external design specs authored during phase
brainstorming. The pre-ratification stage uses the path pattern
`docs/09_briefs/<phase>/specs/<YYYY-MM-DD>-adr-NNNN-<slug>-design.md`,
filed under the phase folder during which the spec was authored.
Filename pattern fixed: date-prefixed with the planned ADR number
and a slug.

This codifies a location chounting has used informally since
Phase 0; the prior location at `docs/superpowers/specs/` is
migrated during round-2 docs reorganization Session 5 (Briefs
Layer 0 — superpowers/ elimination). The
[ADR README's `## Pre-ratification design specs` section](./README.md)
documents the lifecycle and forward-points to
`docs/07_governance/DOCS_RESTRUCTURE_V2.md` Part 3 (Session 7)
for the canonical migration record once that document lands.

The lifecycle:

```
brainstorm → design spec at <phase>/specs/<file>
           → ratification package authored
           → ADR ratified
           → design spec preserved as historical reference
             (ADR is canonical authority post-ratification)
```

Pre-ratification design specs are NOT ADRs — they are exploratory
documents that inform the eventual ADR. Once the ADR ratifies,
the design spec stops being canonical; the ADR carries the
authoritative record. Design specs are preserved for traceability,
not for ongoing reference.

### 5. Generator + linter as enforcement (substrate-now-enforcement-later)

Substrate (the frontmatter schema documented in `_template.md`,
the empty target homes, the marker pairs in the ADR README) lands
at v1 ratification time. Enforcement (the linter actively catching
violations on populated frontmatter, the generator regenerating
README sections from frontmatter) lands at first-consumer time —
which is THIS ADR. ADR-0021's own frontmatter is the dogfood that
validates the linter is at least minimally correct.

The pattern matches ADR-0010's substrate-now-enforcement-later
cross-pattern. Generator + linter as the enforcement mechanism is
defense-in-depth:

- **Pre-commit hook** (per `scripts/install-hooks.sh`) runs
  `pnpm adr:lint` and `pnpm adr:index --check` when staged files
  include ADR-related paths. Catches index drift and
  frontmatter-validation failures before the commit lands.
- **CI workflow** (per `.github/workflows/ci.yml`) runs
  `pnpm adr:check` (lint + index drift) on every push and pull
  request. Catches violations that bypass pre-commit (e.g.,
  hooks not installed locally).
- **On-demand** (`pnpm adr:index`, `pnpm adr:lint`) for
  authors regenerating after frontmatter changes.

The linter's INV-ID cross-check (every value in `invariants:`
must match `^INV-[A-Z]+-\d{3}$` AND exist in
`docs/02_specs/invariants.md`) is the load-bearing
chounting-specific addition that distinguishes this ADR-tooling
implementation from generic ADR systems. It closes the
ADR ↔ INV reachability loop documented in
`docs/02_specs/invariants.md` ("Bidirectional reachability
statement"): every documented invariant has at least one
annotation site in code AND every ADR's claimed invariants are
real INV-IDs.

### 6. Generator markers and human-authored prose coexistence

README content between `<!-- BEGIN:generated-* -->` and
`<!-- END:generated-* -->` markers is generator-managed;
everything outside markers is human-authored and never touched by
the generator. Hand-edits inside marker blocks are overwritten on
the next generator run; the warning blockquote above each
generated section makes this explicit.

The marker pairs currently in use (per Commit 5 first run):

- `generated-current-adrs` — wraps the Current ADRs table.
- `generated-by-module` — populates the By module section.
- `generated-by-invariant` — populates the By invariant section.
- `generated-by-phase` — populates the By phase section.

Future generated sections add new marker pairs; the generator's
`replaceBetweenMarkers` helper handles arbitrary marker names.
Adding a marker pair without updating the generator script
results in a runtime error from `replaceBetweenMarkers` ("Marker
pair for ... not found"); the failure surfaces immediately, not
silently.

### 7. Forward-only application

Frontmatter applies to ADR-0021 and onward. ADRs 0001–0020 are
preserved as-is — no frontmatter, no header edits, no path
updates. The linter skips files without frontmatter cleanly
(`Object.keys(frontmatter).length === 0` → skip); the generator
extracts title / status / date from the H1 and `## Status` /
`## Date` sections via regex.

A future contributor proposing to backfill frontmatter on legacy
ADRs is reopening this decision; per the substrate-now-enforcement-
later precedent + δ-i preservation discipline, retroactive edits
are the failure mode this rule prevents.

## Consequences

### What this enables

- **Mechanical index regeneration.** Future ADR ratifications
  update only the ADR file (frontmatter + body); the README's
  Current ADRs / By module / By invariant / By phase sections
  regenerate from frontmatter via `pnpm adr:index`. No more
  hand-edits to the README's table; no more index drift.
- **Cross-cutting queries.** "Which ADRs touch the storage
  module?", "Which ADRs cite INV-AUDIT-001?", "Which ADRs
  ratified in Phase 0?" become first-class questions the
  generated sections answer. The frontmatter is the source of
  truth; the generated sections are the navigable view.
- **Mechanical typo detection.** A future ADR with
  `modules: [storgae]` (typo) fails `pnpm adr:lint` at commit
  time. Same for INV-ID typos, unknown phase values, dangling
  cross-references. The cost of catching these at commit time is
  trivial; the cost of catching them after the ADR ratifies and
  spreads through cross-references is high.
- **Substrate for Sessions 5 and 6.** Session 5 ships brief
  frontmatter (and its linter, deferred per Session 5 plan);
  Session 6 ships spec / architecture / engineering frontmatter.
  All three consume the same canonical taxonomy at
  `docs/02_specs/taxonomy.md`. The taxonomy is single-source-of-
  truth across all frontmatter consumers.

### What this constrains

- **No proposed status.** Chounting uses external design specs
  at `docs/09_briefs/<phase>/specs/` for the pre-ratification
  stage. A future contributor proposing to add `proposed` to the
  status enum is reopening Decision item 4 — pre-ratification
  state belongs in the design spec, not in the ADR's status field.
- **No frontmatter on legacy ADRs.** A future contributor
  proposing bulk backfill of frontmatter on ADRs 0001–0020 is
  reopening Decision item 7 — the cost of backfill (reviewing 20
  ADRs to extract frontmatter values consistent with current
  semantics) is concentrated; the cost of forward-only
  application is dispersed across natural editing cadence.
- **No DDD framing for tooling location.** `scripts/adr/` is
  named for the document class (ADRs), not for any subsystem.
  Future docs tooling adds `scripts/<area>/` subdirectories named
  for the document class they tool (e.g., `scripts/briefs/`,
  `scripts/docs/`). This matches the round-2 architectural
  contribution #2 ("top-level folders are document classes, not
  workflow lineages") that DOCS_RESTRUCTURE_V2.md Part 1 ratifies
  in Session 7.
- **No silent index regeneration in commits.** The pre-commit
  hook fires `pnpm adr:index --check` rather than `pnpm adr:index`
  (which would silently regenerate). Authors who edit
  ADR frontmatter must explicitly run `pnpm adr:index` and stage
  the README diff. The friction is intentional — the README diff
  is part of the change's surface area, and silent regeneration
  obscures what's changing.

### What this costs

- **Two new TypeScript scripts to maintain.** `generate-index.ts`
  and `lint.ts` add ~670 lines of code. The maintenance cost is
  modest (the scripts have no external dependencies beyond
  gray-matter and Node.js stdlib) but non-zero.
- **One new dependency.** `gray-matter@^4.0.3` added as root
  devDependency. Mature library, no peer-dependency cascade. Used
  by both scripts.
- **Pre-commit hook re-installation.** Contributors must run
  `bash scripts/install-hooks.sh` once after pulling Session 3's
  Commit 4 (or any future change to install-hooks.sh) to upgrade
  the local hook. The hook script is heredoc-generated and not
  tracked directly; install-hooks.sh is the authoritative source.
- **CI job latency.** A new `adr-check` job runs in parallel with
  `typecheck` / `lint` / `build`. It's fast (no compilation, no
  database, just markdown + YAML parsing) but adds one more job
  to the workflow.
- **Forward-only divergence between legacy and new ADRs.** Legacy
  ADRs render in the generated index with reduced metadata (no
  modules / invariants / phase grouping). The generated By module
  / By invariant / By phase sections start sparse — only ADRs
  with frontmatter populate them. The sparsity is by design (per
  Decision item 7) but is a real cost: the generated sections do
  not give a complete picture of all 20+ ADRs.

## Alternatives considered

### Alternative 1 — Backfill frontmatter on all 20 legacy ADRs

Rejected. Backfill cost is concentrated: reviewing 20 ADRs to
extract `modules`, `invariants`, `phase` values consistent with
current semantics is non-trivial. Some legacy ADRs (e.g.,
ADR-0008, ADR-0009) predate the frontmatter schema's design and
have ambiguous module assignments. Backfilling forces premature
consistency decisions that the forward-only rule defers. The cost
of forward-only divergence (sparse generated sections at v1) is
lower than the cost of bulk backfill churn.

### Alternative 2 — Hand-maintained index with discipline + better review

Rejected. The hand-maintained index drifted across Phase 0; the
verification report flagged this as a finding (the existing
Current ADRs table tracked 0001–0010 but reality was 0001–0020,
with stale dates). Discipline-based maintenance fails at scale
(20+ ADRs, multiple authors, multi-session ratification arcs).
The mechanical regeneration is the discipline that scales.

### Alternative 3 — Co-located scripts at `apps/web/scripts/adr/`

Rejected. The ADR scripts read from `docs/07_governance/adr/`,
`docs/02_specs/taxonomy.md`, and `docs/02_specs/invariants.md` —
all repo-root-relative paths. Co-locating under `apps/web/scripts/`
inherits the web-app's working directory and tsconfig context,
which adds no value for docs-tooling that doesn't touch web-app
code. Top-level `scripts/adr/` is the correct home for cross-repo
docs tooling. The alternative also conflates web-app-scoped
scripts (which have web-app-specific imports like
`@chounting/web` workspace references) with cross-repo scripts
(which have no workspace coupling).

### Alternative 4 — TAXONOMY.md under `docs/07_governance/adr/`

Rejected. Earlier Session 3 drafts located the taxonomy at
`docs/07_governance/adr/TAXONOMY.md`. Round-2 architectural review
identified the failure mode: when briefs and specs/architecture/
engineering frontmatter (Sessions 5 and 6) need module / phase
values, three drifting taxonomies appear (`adr/TAXONOMY.md`,
`briefs/TAXONOMY.md`, and a third for spec frontmatter), with
subtly different names for the same concepts. Locating the
taxonomy under `02_specs/` (alongside `glossary.md` and
`invariants.md`) gives a single canonical home; all three frontmatter
consumers read the same file. Greenfield consolidation per the
verification report's zero-prior-art finding.

### Alternative 5 — Dedicated `proposed` status with pre-ratification ADR file

Rejected. Pre-ratification state is exploratory; the questions
under consideration include "should this be an ADR at all?" An
ADR file with `status: proposed` commits to the ADR shape before
that question is answered. The chounting pattern — design spec
at `09_briefs/<phase>/specs/` → ratification package → ADR
ratified — keeps the pre-ratification stage in the design-spec
genre (exploratory, mutable, can be abandoned without leaving an
abandoned-ADR artifact). Adding `proposed` to the status enum
would introduce a third pre-ratification venue (alongside design
specs and ratification packages) without any of the design-spec
genre's flexibility.

## Cross-references

- [`docs/02_specs/taxonomy.md`](../../02_specs/taxonomy.md) — the
  canonical taxonomy this ADR ratifies the location of.
- [`docs/02_specs/invariants.md`](../../02_specs/invariants.md) —
  the canonical INV-ID rollup the linter cross-references.
- [`docs/02_specs/glossary.md`](../../02_specs/glossary.md) —
  vocabulary the taxonomy operationalizes.
- [`_template.md`](./_template.md) — the schema substrate this
  ADR ratifies.
- [`scripts/adr/generate-index.ts`](../../../scripts/adr/generate-index.ts)
  and
  [`scripts/adr/lint.ts`](../../../scripts/adr/lint.ts) — the
  enforcement substrate this ADR ratifies.
- [`README.md`](./README.md) — the ADR README with the new
  Frontmatter and Pre-ratification design specs sections plus the
  generator marker pairs.
- **ADR-0010** ([`./0010-reserved-enum-states.md`](./0010-reserved-enum-states.md)) —
  substrate-now-enforcement-later precedent; ADR-0021 inherits the
  pattern at the docs-tooling axis.
- **ADR-0019** ([`./0019-confidence-calibration-policy.md`](./0019-confidence-calibration-policy.md)) —
  the most recent fully-formed ADR; the model for ADR-0021's prose
  style and the first ADR this lints (alongside ADR-0021's own
  dogfood).
- **ADR-0020** ([`./0020-agent-first-authority-gradient-source-architecture.md`](./0020-agent-first-authority-gradient-source-architecture.md)) —
  the round-2 architectural foundation; ADR-0020's substrate-only-
  v1 framing is the same shape ADR-0021 follows for docs tooling.
- [`docs/09_briefs/CURRENT_STATE.md`](../../09_briefs/CURRENT_STATE.md)
  — current-state record updated at Session 3 closeout.
- `reports/docs-reorg-verification-20260507.md` — the rev 3
  verification report (gitignored working artifact); the four
  blockers identified there inform Decision items 2, 3, 4, and
  the framing of Decision item 7.
- [`docs/restructure-plan.md`](../../restructure-plan.md) — the
  round-1 docs reorganization plan; elevated to
  `docs/07_governance/DOCS_RESTRUCTURE_V1.md` at Session 7
  alongside `DOCS_RESTRUCTURE_V2.md` (the canonical record of
  round 2 including this ADR).
- **Round-2 architectural contributions:**
  - "A folder encodes one canonical axis. Other axes belong in
    metadata and indexes." — load-bearing principle for the
    Modules / Concerns / Audiences distinction in
    `02_specs/taxonomy.md`. Ratified in `DOCS_RESTRUCTURE_V2.md`
    Part 1 (Session 7).
  - "Top-level docs folders are document classes, not workflow
    lineages." — load-bearing principle for the script
    location convention (`scripts/adr/` named for the document
    class). Ratified in `DOCS_RESTRUCTURE_V2.md` Part 1 (Session
    7) alongside the migration of `docs/superpowers/` to per-phase
    `specs/` and `plans/` buckets.

## Notes for future ADR writers

- **Frontmatter is forward-only.** A future contributor reading
  ADRs 0001–0020 sees no frontmatter; that's correct. Backfill
  proposals are rejected per Decision item 7 and the
  substrate-now-enforcement-later pattern.
- **Generator markers are arbitrary-named.** Adding a new
  generated section requires both a new marker pair in the README
  and a new generation function in the script. The
  `replaceBetweenMarkers` helper raises if the marker is missing —
  fail-fast at first run, not silent.
- **Linter's INV-ID check is load-bearing.** A future
  contributor proposing to relax the check (e.g., warn-only
  instead of error) is reopening Decision item 5. The check is
  what closes the ADR ↔ INV reachability loop; weakening it
  re-opens silent drift.
- **Taxonomy location is settled.** A future contributor
  proposing to move the taxonomy to `adr/TAXONOMY.md` or to
  duplicate it under `briefs/TAXONOMY.md` is reopening Decision
  item 2 and the round-2 architectural review's resolution.
  Single canonical location per round-2 V2.
- **TypeScript-script LOCATION is the new convention; runtime is
  not new.** A future ADR proposing TypeScript scripts at
  `scripts/<area>/` should reference this ADR (Decision item 3)
  to inherit the discipline. A future ADR proposing to migrate
  `scripts/*.sh` to TypeScript wholesale is reopening the
  language-follows-shape-of-work principle codified here.
