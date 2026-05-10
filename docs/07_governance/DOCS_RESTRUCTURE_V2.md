# DOCS_RESTRUCTURE_V2.md — Round-2 Documentation Reorganization Ratification

**Status:** Ratified V2 (round-2, 2026-05-09 at Session 7 closure).
Companion document: [`DOCS_RESTRUCTURE_V1.md`](DOCS_RESTRUCTURE_V1.md)
(round-1 substrate, this folder). Round-2 extends V1 with three
Principles, frontmatter conventions, canonical taxonomy
consolidation, source-tree authority-layer organization per
ADR-0020, and three surface guardrails (apps/web/src/, docs/,
repo root) per Principle 3.

**Reading order:** V1 establishes the nine-folder substrate; V2
ratifies the round-2 deltas and the three Principles. Read V1 for
substrate reasoning; read V2 for the current canonical state.

---

## Part 1 — Philosophy: Three Principles

Round-2 ratifies three principles that govern documentation
organization, folder placement, and cross-cutting taxonomy.
Together they extend V1's nine-folder substrate with the
operational discipline that round-2's brainstorm conversations
surfaced.

### Principle 1: A folder should encode only one canonical axis. Other axes belong in metadata and indexes.

Folder hierarchy is a single-axis encoding. When a folder tries
to encode two axes simultaneously (e.g., grouping by both
content-class AND workflow-arc), the axis closer to the file
path becomes load-bearing and the other silently degrades into
unmaintained accident. The mitigation: pick one canonical axis
per folder; move every other axis into frontmatter, taxonomy,
or generated indexes.

**Worked examples:**

- **`docs/02_specs/`** encodes "spec content" as the canonical
  axis. Module / phase / concern / audience axes live in
  frontmatter per the canonical taxonomy at
  [`docs/02_specs/taxonomy.md`](../02_specs/taxonomy.md) (per
  ADR-0021). The linter at `scripts/adr/lint.ts` enforces
  taxonomy values against frontmatter; the bidirectional
  reachability checks in
  [`docs/02_specs/invariants.md`](../02_specs/invariants.md)
  validate INV-ID cross-references.
- **`docs/07_governance/adr/`** encodes "ratified architectural
  decision" as the canonical axis. Module / invariant / phase
  axes live in ADR frontmatter; the README's generated index
  sections (`generated-by-module`, `generated-by-invariant`,
  `generated-by-phase`) regenerate from frontmatter via
  `pnpm adr:index`. The forward-only frontmatter discipline (per
  ADR-0021 Decision item 7) preserves legacy ADRs without
  retroactive reformatting.

**The principle CLOSES:** folders that try to encode two axes
(e.g., `docs/<phase>/<concern>/`, `docs/<workflow-lineage>/`)
are forbidden. The failure mode is silent axis collapse — one
axis becomes load-bearing while the other becomes unmaintained
accident, and a future reader cannot tell which axis was meant
to be which.

The canonical-axis rule is the architectural foundation for the
round-2 deltas: frontmatter-not-folders, single-source-of-truth
taxonomy, generated indexes from structured data.

**Cross-references:** ADR-0021 names this as round-2
architectural contribution #1 (in its Cross-references section's
"Round-2 architectural contributions" subsection); V2 ratifies
the contribution at this principle.

### Principle 2: Top-level folders are document classes, not workflow lineages — with one exception for cross-phase meta-arcs.

A document class is "what kind of doc is this?" — a stable
category answering reader needs (product, spec, architecture,
engineering, audit, governance, brief). A workflow lineage is
"what arc produced this doc?" — a transient grouping that decays
as the arc closes, leaving folder structure that no longer maps
to any active classification axis.

V1's nine numbered folders (`00_product/` through `09_briefs/`,
plus `99_archive/`) encode document classes. V2 ratifies that
top-level folders MUST encode document classes; workflow lineages
decay into archives or per-phase brief folders.

**Caught-and-fixed example.** `docs/superpowers/` was a workflow-
lineage folder created during the superpowers methodology arc.
It encoded "what arc produced this doc?" rather than "what kind
of doc is this?". When the methodology arc closed, the folder
became unmaintained accident — its `specs/` and `plans/` contents
mapped naturally to per-phase document classes that already had
canonical homes. Round-2 Session 5A migrated the contents to
per-phase `09_briefs/<phase>/specs/` + `09_briefs/<phase>/plans/`
and eliminated `docs/superpowers/`. The document-class principle
replaces the workflow-lineage grouping; future readers find
phase work where phase work belongs.

**Worked-precedent exception.** `docs/07_governance/round-2/` is
a cross-phase meta-arc folder for the round-2 docs reorganization
arc. Round-2 operates on the structure used by all phases — it
is NOT phase-N work, has no natural per-phase brief folder, and
spans multiple phases by definition. The meta-arc folder is
permitted under the cross-phase exception clause; the conditional-
permission machinery is Pattern 7 (below).

**Cross-references:** ADR-0021 names this as round-2
architectural contribution #2; CTO_HANDOFF_V2 §12 (DDD-rejection,
"the load-bearing seam is authority gradient, not bounded
context") is the architectural framing the principle inherits at
the source-tree level (per ADR-0020); V2 ratifies the docs-tree
analog at this principle.

#### Pattern 7: Cross-phase meta-arc folder conditional permission

The meta-arc exception in Principle 2 isn't blanket — it's
conditional, with two sub-cases governing the bypass procedure.

**First-instance meta-arc shape (full bypass):**

- Folder README answering the document-class questions: what
  is this folder for; what goes here; what does NOT go here;
  when does the folder close.
- Friction-journal entry recording the new meta-arc shape as
  N=1 evidence (the meta-arc shape itself, not the specific
  arc's content).
- Operator acknowledgment in the commit body authoring the
  folder.

**Follows-precedent meta-arc (light bypass):**

- Folder README answering the same document-class questions
  plus an explicit `Follows precedent: <precedent path>`
  citation embedded as a 4/4 precedent-matching checklist.
- One-line friction-journal entry citing the precedent.
- Commit body cites the precedent. No fresh operator
  acknowledgment per instance — the operator's first-instance
  approval covers the shape, and the commit body's precedent
  citation is the audit trail surfaced at PR review.

**4/4 precedent-matching test (required for light bypass):**

1. Precedent README answers document-class questions.
2. New README answers the same questions citing precedent.
3. Cross-phase scope / durable identity / closure criteria /
   governance-surface placement match.
4. Naming structurally consistent (e.g., `round-N/`,
   `arc-X-governance/`).

**Canonical first-instance precedent:**
[`docs/07_governance/round-2/`](round-2/) (round-2 docs
reorganization meta-arc, established 2026-05-08 at Session 5A).
V2 ratifies Pattern 7 with this folder as the worked example;
its README at
[`docs/07_governance/round-2/README.md`](round-2/README.md)
answers the document-class questions and provides the structural
template future cross-phase meta-arcs cite as precedent.

**Pattern 7's bypass procedure carries two operational rules.**
These are operational rules within Pattern 7's bypass procedure,
NOT Principle 3 ratification expansions (see "Why drift meta-
pattern stays separate from Principle 3" in Part 2 for the
rationale):

- **Canonical-source verification at execution time.** When
  implementing a bypass, verify against canonical sources
  ([`folder-structure.md`](../03_architecture/folder-structure.md),
  [`taxonomy.md`](../02_specs/taxonomy.md), V2, etc.) at the
  moment of writing rather than from memory or from plan-
  internal substrate. Plan-internal brainstorm-context is design
  substrate; canonical docs are the ratified source. The
  Session 6.5 catch (lib/hooks forbidden-list mismatch with
  folder-structure.md) is the worked example.
- **Chronological-reality verification at planning time.** When
  drafting forward-looking content (fire counts, sequence
  assumptions, "after X session executes" projections), don't
  project; reference the current ratified state and let
  execution-time verification establish the count when the
  artifact lands. The Path A vs Path B sequencing question
  caught at Session 7 brainstorm time is the worked example.

### Principle 3: Folder placement guardrails at high-decision-cost structural surfaces.

Folder placement decisions happen at the surface where the
folder is created. When the canonical taxonomy lives elsewhere,
the rule isn't readable at the moment of decision, and wrong
placements ship with thoughtful rationale that violates
principles the rationale couldn't see. The mitigation is a
guardrail README at each high-decision-cost structural surface
that documents what's permitted, what's forbidden, the decision
rule for ambiguous cases, and the bypass procedure.

**Three surfaces ratified at V2** (each surface independently
meets N=1 evidence; V2 does NOT aggregate across surfaces):

1. **`apps/web/src/`** — N=1 evidence: Session 6.5's
   [`apps/web/src/README.md`](../../apps/web/src/README.md) +
   [`apps/web/src/AGENTS.md`](../../apps/web/src/AGENTS.md)
   (commit `b98208c`, landed 2026-05-09). The source-tree
   authority-layer guardrail per ADR-0020. Prior-art worked
   example for V2's Principle 3 ratification.
2. **`docs/`** — N=1 evidence: Session 7 C3 same-session
   ratification ([`docs/README.md`](../README.md) Folder
   placement guardrail, lands at this session).
3. **Repo root** — N=1 evidence: Session 7 C4 same-session
   ratification (root `README.md` Folder placement section,
   lands at this session).

**Per-surface N=1 framing.** Each surface independently meets
the N=1 codification threshold (per the architectural-principle
codification mechanic in
[`docs/04_engineering/conventions.md`](../04_engineering/conventions.md)
§ "Round-2 Conventions"). Aggregation across surfaces is NOT
required — apps/web/src/ doesn't need docs/ or repo root to
"complete" the N=2 count, and vice versa. Each surface's worked
example is its own N=1, and V2 cites them separately.

**Future surfaces** extend Principle 3 by precedent — they earn
a guardrail when accumulated sub-discipline at the surface
can't be cleanly stated in the parent. Surface additions are
amendments to V2, not new principles. The surface-discovery
heuristic: high-decision-cost structural surfaces are those
where wrong placement compounds (through code review, into
runtime architecture, across multiple consumers); low-decision-
cost surfaces (e.g., per-phase brief folders) don't need
guardrails because their canonical taxonomy is already at the
parent surface.

---

## Part 2 — Changes from V1

V2 enumerates round-2's deltas relative to V1's nine-folder
substrate. V1 ratified the folder layout; V2 ratifies the
operational discipline that operates within and across the
folders.

### Frontmatter-not-folders pattern (per ADR-0021)

V1's folder substrate encoded document-class taxonomy as the
canonical axis. V2 extends this with the frontmatter pattern:
module / phase / concern / audience axes live in document
frontmatter, not as folder hierarchy. The canonical taxonomy at
[`docs/02_specs/taxonomy.md`](../02_specs/taxonomy.md) is the
single source of truth for allowed values; the linter at
`scripts/adr/lint.ts` enforces taxonomy values against ADR
frontmatter; future linters for briefs and spec / architecture /
engineering frontmatter consume the same canonical taxonomy.

This delta closes the "drifting taxonomies" failure mode: when
multiple sub-folders or sub-systems each carry their own
near-taxonomy, the names diverge silently and cross-cutting
queries become impossible. V2's single-source-of-truth pattern
prevents drift by construction.

### Canonical taxonomy at `docs/02_specs/taxonomy.md` (per ADR-0021)

V1 had no canonical taxonomy file. V2 ratifies
[`taxonomy.md`](../02_specs/taxonomy.md) as the single canonical
home for module / feature / phase / concern / audience values.
Multiple consumers (ADR linter, brief frontmatter — Session 5
forthcoming, future spec / architecture / engineering frontmatter
— Session 6 forthcoming) read the same file. Adding, removing,
or renaming taxonomy values is governed by the file's own "How to
change this file" section.

The location decision is canonical: alongside
[`glossary.md`](../02_specs/glossary.md) (which defines terms)
and
[`invariants.md`](../02_specs/invariants.md) (which rolls up
INV-IDs) under `02_specs/`. The taxonomy enumerates *values*; the
glossary defines *terms*; the two are operationally connected.

### Source-tree authority-layer organization (per ADR-0020)

V1 did not specify the `apps/web/src/` source-tree organization;
that arrived with the round-1 → round-2 transition via
CTO_HANDOFF_V2 and ratified into ADR-0020. V2 ratifies the
authority-layer organization (agent / contracts / services /
core / db / app / components / hooks / lib / shared / middleware)
as the canonical axis at `apps/web/src/`. Source code is
organized by authority gradient, not by bounded context (DDD-
rejection per CTO_HANDOFF_V2 §12); product modules and workflow
arcs remain documentation-only artifacts under `00_product/` +
`09_briefs/`.

The source-tree authority-layer organization is now load-bearing
at the surface itself per Principle 3's apps/web/src/ guardrail
(N=1 evidence: Session 6.5 commit `b98208c`).

### ADR system upgrade (per ADR-0021 + ADR-0022)

V1 had a hand-maintained ADR system with no frontmatter, no
linter, no generated index. V2 ratifies the ADR upgrade
substrate: ADR-0021 ratifies frontmatter schema + canonical
taxonomy + linter + generator + pre-ratification design spec
location; ADR-0022 ratifies amendment workflows (amend-vs-
supersede decision rule, `## Amendment` block format, Status-line
accumulation, supersession workflow). Forward-only application:
ADRs 0001–0020 preserved per δ-i discipline; ADR-0021+ carry
frontmatter; amendments authored from ADR-0022's ratification
date forward use the codified shape.

### Pre-ratification design spec location (per ADR-0021)

V1 placed pre-ratification design specs at the now-deprecated
`docs/superpowers/specs/`. V2 ratifies the per-phase location
[`docs/09_briefs/<phase>/specs/`](../09_briefs/) (per ADR-0021
Decision item 4). Pre-ratification specs are exploratory
documents that inform an eventual ADR; once the ADR ratifies, the
design spec is preserved as historical reference, not as ongoing
canonical authority.

### TypeScript-for-docs-tooling location convention (per ADR-0021)

V1's `scripts/` directory was bash-only (`.sh` for shell-shaped
operations). V2 ratifies the new location convention: top-level
`scripts/<area>/*.ts` for cross-repo TypeScript docs / governance
tooling. Examples: `scripts/adr/generate-index.ts`,
`scripts/adr/lint.ts`. The two location conventions coexist:
`scripts/*.sh` for shell-shaped cross-repo operations;
`scripts/<area>/*.ts` for cross-repo TypeScript docs tooling;
`apps/web/scripts/*.ts` for web-app-scoped TypeScript tooling.
Language choice follows shape of work, not folder location.

### Four-maps vocabulary as filesystem-encoded (per ADR-0020 + product-workflow-delivery-mapping.md)

V1 did not formalize the relationship between Product / Workflow
/ Delivery / Runtime maps. V2 ratifies the four-maps framing per
[`docs/03_architecture/product-workflow-delivery-mapping.md`](../03_architecture/product-workflow-delivery-mapping.md):
the four maps stay separate; each axis has its own canonical
home; source code is organized by authority layer (Map 4
runtime); product modules + workflow arcs + delivery phases
remain documentation-only planning artifacts under
[`00_product/`](../00_product/),
[`01_workflows/`](../01_workflows/) (forward-looking), and
[`09_briefs/`](../09_briefs/).

### Drift meta-pattern N=2 evidence

The plan-substrate-vs-canonical-reality drift meta-pattern fired
twice during round-2. V2 records this as a substantive change
in Part 2 (NOT in Principle 3 ratification text — see "Why
drift meta-pattern stays separate from Principle 3" below for
the rationale). Codification trajectory is Tier 3 → Tier 2; do
NOT ratify at N=2 prematurely.

**N=1 — Session 6.5 closeout (execution-time surface).** Three
drift instances under one meta-pattern observation:

1. `lib/` and `hooks/` listed forbidden in plan brainstorm-
   context; canonical
   [`folder-structure.md`](../03_architecture/folder-structure.md)
   lists permitted forward-looking. Resolution: README aligned
   with canonical doc; only `utils/` and `modules/<feature>/`
   ship forbidden in
   [`apps/web/src/README.md`](../../apps/web/src/README.md).
2. Plan instructed friction-journal entry header use
   `### 2026-05-09 —` style; canonical pattern across all prior
   closeouts is bullet-list `- 2026-05-09 NOTE —` style.
   Resolution: bullet-list used.
3. Plan claimed N=6 floor-only invocation; operator handoff
   projected N=7. Reality at push time: N=5. Resolution: closeout
   recorded N=5; observation captured the drift.

**N=2 — Session 7 brainstorm (planning-decision-time surface).**
The Path A vs Path B sequencing question (5B/Session 6 execution
as Session 7 prerequisites vs Session 7 ratifies independent of
execution outputs) is the same meta-pattern firing at planning-
decision time. Plan-substrate (handoff sequence projection)
drifts from canonical-reality (5B/6 plan-but-not-executed
state). Resolution: Path A locked; V2 ratifies with chronological-
reality framing; 5B/6 execution lands as cleanup commits
afterward (Session 8 or piggyback).

**Codification trajectory: Tier 3 → Tier 2.** Codification gates:
N=3 with shape match across three distinct timing surfaces
(execution-time, planning-decision-time, cross-reference-time).
The cross-reference-time surface needs an N=1 instance before
the meta-pattern crosses to Tier 1 codification. Operational
rules within Pattern 7's bypass procedure (canonical-source
verification at execution time + chronological-reality
verification at planning time) carry the discipline at the
operational level; principle-level codification awaits the third
timing surface.

### Why drift meta-pattern stays separate from Principle 3

Principle 3's load-bearing surface is **"guardrails at structural
surfaces"** — folder placement at high-decision-cost structural
locations. The drift meta-pattern is **"projection-vs-reality
discipline at multiple timing surfaces"** — execution time,
planning-decision time, cross-reference time. These are related
axes but NOT the same axis.

Conflating them would dilute Principle 3 (a guardrail-at-surface
principle absorbing a projection-discipline principle) AND
ratify the drift meta-pattern at N=2 prematurely (the meta-
pattern is still on a Tier 3 → Tier 2 trajectory awaiting N=3
with shape match across distinct timing surfaces).

The drift meta-pattern lands as N=2 evidence in this Part 2 AND
as operational rules within Pattern 7's bypass procedure
(canonical-source verification at execution time +
chronological-reality verification at planning time). It does
NOT land as a Principle 3 ratification expansion. It does NOT
land as a principle ratified at N=2.

This separation matches the three-category codification taxonomy
in
[`conventions.md`](../04_engineering/conventions.md) §
"Round-2 Conventions": architectural principles ratify at N=1
per surface (Principles 1, 2, 3); process meta-patterns require
N=2 with shape match across distinct timing surfaces and N=3
confirms (the drift meta-pattern is in this category).

---

## Part 3 — Migration Map

Per-file table of round-2 migrations. Path-level cross-references
throughout (paths are stable; content targets evolve under them).

| What | From | To | Session | Rationale |
|---|---|---|---|---|
| Round-1 docs reorganization plan | `docs/restructure-plan.md` | [`docs/07_governance/DOCS_RESTRUCTURE_V1.md`](DOCS_RESTRUCTURE_V1.md) | Session 7 C1 | V1 elevation; canonical-tier governance per the round-N restructure plan workflow |
| `superpowers/` workflow-lineage elimination | `docs/superpowers/specs/`, `docs/superpowers/plans/` | [`docs/09_briefs/<phase>/specs/`](../09_briefs/), [`docs/09_briefs/<phase>/plans/`](../09_briefs/) | Session 5A | Principle 2 (top-level folders are document classes, not workflow lineages); contents redistributed per-phase |
| `ec-2-prompt-set.md` move | `docs/07_governance/ec-2-prompt-set.md` | [`docs/09_briefs/phase-1.2/ec-2-prompt-set.md`](../09_briefs/phase-1.2/ec-2-prompt-set.md) | Session 4 | Phase-specific artifact placed under its phase brief folder |
| Phase 0 governance file move | `docs/09_briefs/phase-2/2026-05-0*-*` (governance arc files) | [`docs/09_briefs/phase-0/`](../09_briefs/phase-0/) | Session 5 | Phase 0 governance arc gets its own phase folder |
| ADR system upgrade (frontmatter + tooling) | substrate-only — ADRs 0001–0020 | ADR-0021 ratifies + ADR-0022 lifecycle workflows | Session 3 + Session 4 | Forward-only; legacy ADRs preserved per δ-i discipline |
| Canonical taxonomy consolidation | distributed inline across draft locations | [`docs/02_specs/taxonomy.md`](../02_specs/taxonomy.md) | Session 3 | Single source of truth (per ADR-0021 Decision item 2) |
| Folder READMEs (01_prd, 02_specs, 03_architecture, 04_engineering) | various / under-specified | rewritten + doc-class opener pattern | Session 6 (pending execution) | Doc-class opener pattern propagates ADR-0021's "one canonical axis" principle |
| Source-tree folder-placement guardrail | (no prior surface) | [`apps/web/src/README.md`](../../apps/web/src/README.md) + [`apps/web/src/AGENTS.md`](../../apps/web/src/AGENTS.md) | Session 6.5 (commit `b98208c`) | Principle 3 N=1 implementation evidence at the source-tree surface |
| docs/ folder-placement guardrail | [`docs/README.md`](../README.md) (orientation only) | [`docs/README.md`](../README.md) extended with Folder placement guardrail | Session 7 C3 | Principle 3 N=1 evidence at the docs surface |
| Repo-root folder-placement section | repo-root `README.md` (overview only) | repo-root `README.md` extended with Folder placement section | Session 7 C4 | Principle 3 N=1 evidence at the repo-root surface |
| CLAUDE.md guardrail sub-section | (no prior cross-reference to surface guardrails) | CLAUDE.md `### Folder placement guardrails` sub-section under "Project rules and vocabulary" | Session 7 C5 | Standing-rules-level pointer to the three surface guardrails |
| Round-2 conventions codified | (round-2 codifications scattered across friction-journal) | [`docs/04_engineering/conventions.md`](../04_engineering/conventions.md) § "Round-2 Conventions" | Session 7 C6 | Round-N restructure plan workflow + three-category codification taxonomy + "verify before agreeing with alarm" + drift meta-pattern at Tier 3 → Tier 2 |

**Path-level cross-references throughout this Migration Map.**
Where the table cites a sub-folder README that Session 6 will
rewrite later, the citation is at path level
([`docs/02_specs/README.md`](../02_specs/README.md), etc.), not
at specific post-rewrite content. Path is stable; content target
evolves under it. This discipline applies to V2's cross-
references throughout — paths over content. Same discipline
applies to V2's references to V1 (V1 path stabilized at Session 7
C1's commit and stays canonical thereafter).

### Session-by-session summary (chronological reality)

The chronological landing order, recorded for the friction-journal
record's correspondence to V2's Migration Map:

- **Session 3** (2026-05-08): ADR system upgrade (ADR-0021
  ratifies frontmatter + tooling + canonical taxonomy
  consolidation).
- **Session 4** (2026-05-08): ADR-0022 ratifies amendment
  workflows + ec-2-prompt-set.md move.
- **Session 5A** (2026-05-08): docs/superpowers/ elimination +
  per-phase specs/plans redistribution + phase-0/ + phase-5/
  README creation.
- **Session 5B brainstorm** (2026-05-08): Layer 1 + Layer 2
  migration plan committed; execution pending post-V2.
- **Session 6 brainstorm** (2026-05-09): four-README rewrite
  plan + doc-class pattern propagation plan committed; execution
  pending post-V2.
- **Session 6.5 execution** (2026-05-09): apps/web/src/ source-
  tree folder-placement guardrail (commit `b98208c`).
- **Session 7 execution** (2026-05-09): V1 elevation + V2
  ratification + three guardrail surfaces + CLAUDE.md sub-section
  + conventions.md round-2 codifications + closeout. **This V2
  ratifies at Session 7's execution.**

5B execution and Session 6 execution are recorded as plan-but-
not-executed at V2 ratification time per the chronological-
reality precedent established at Session 6.5 closeout. V2
ratification operates on design substrate (Principles, Pattern 7,
Migration Map, V1 elevation), all of which are on disk regardless
of 5B/6 execution status. Path-level cross-references throughout
V2/C3/C4/C5 mean 5B/6 execution can land later without
invalidating V2's references.

---

## Cross-references

- [`docs/07_governance/DOCS_RESTRUCTURE_V1.md`](DOCS_RESTRUCTURE_V1.md)
  — round-1 substrate; this companion document.
- [`docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`](adr/0020-agent-first-authority-gradient-source-architecture.md)
  — source-tree authority-layer organization (substrate for
  Principle 3's apps/web/src/ surface).
- [`docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md`](adr/0021-adr-frontmatter-and-tooling.md)
  — frontmatter and tooling system; canonical taxonomy location;
  round-2 architectural contributions named in Cross-references.
- [`docs/07_governance/adr/0022-adr-lifecycle-workflows.md`](adr/0022-adr-lifecycle-workflows.md)
  — ADR amendment workflows; the lifecycle counterpart to
  ADR-0021's substrate ratification.
- [`docs/02_specs/taxonomy.md`](../02_specs/taxonomy.md) —
  canonical taxonomy (single source of truth for module / phase /
  concern / audience values).
- [`docs/02_specs/glossary.md`](../02_specs/glossary.md) —
  vocabulary reference; Workflow / Product / Delivery
  Vocabularies subsections.
- [`docs/03_architecture/folder-structure.md`](../03_architecture/folder-structure.md)
  — canonical apps/web/src/ source-tree layout.
- [`docs/03_architecture/authority-gradient.md`](../03_architecture/authority-gradient.md)
  — four-layer authority framing.
- [`docs/03_architecture/product-workflow-delivery-mapping.md`](../03_architecture/product-workflow-delivery-mapping.md)
  — four-maps doc; "Why the four maps stay separate."
- [`docs/07_governance/CTO_HANDOFF_V2.md`](CTO_HANDOFF_V2.md) §12
  — DDD-rejection; the architectural framing for Principle 2 at
  the source-tree level (per ADR-0020).
- [`apps/web/src/README.md`](../../apps/web/src/README.md) +
  [`apps/web/src/AGENTS.md`](../../apps/web/src/AGENTS.md) —
  Principle 3 source-tree surface guardrail (Session 6.5 N=1
  evidence).
- [`docs/README.md`](../README.md) — Principle 3 docs surface
  guardrail (Session 7 C3 N=1 evidence).
- Repo-root `README.md` — Principle 3 repo-root surface guardrail
  (Session 7 C4 N=1 evidence).
- CLAUDE.md "Project rules and vocabulary" → "Folder placement
  guardrails" sub-section (Session 7 C5).
- [`docs/04_engineering/conventions.md`](../04_engineering/conventions.md)
  § "Round-2 Conventions" (Session 7 C6).
- [`docs/07_governance/round-2/`](round-2/) — round-2 meta-arc
  folder (Pattern 7 canonical first-instance precedent).
- [`docs/07_governance/round-2/2026-05-09-session-7-plan.md`](round-2/2026-05-09-session-7-plan.md)
  — Session 7 execution plan; brainstorm-context section is the
  durable substrate for V2's content.
- [`docs/07_governance/friction-journal.md`](friction-journal.md)
  — Session 7 closeout entry (forthcoming at C7).
