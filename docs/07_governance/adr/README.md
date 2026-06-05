# Architecture Decision Records

This folder holds one ADR per significant architectural decision. ADRs
are the project's long-term memory — the place where future readers
find out *why* the code is the way it is, not just what it does.

ADRs are not written in advance as documentation ceremony. They are
written **in anger**, when a real decision has to be made with real
tradeoffs and real alternatives, and the reasoning is load-bearing
enough that forgetting it in six months would be costly.

## When to write an ADR

Write an ADR when:

- A decision took more than 30 minutes to make.
- A decision closes off other options in a way that is hard to
  reverse later.
- A future contributor will reasonably ask "why?" and the code alone
  cannot answer.
- A decision contradicts something in `PLAN.md` (in which case, also
  bump `PLAN.md` to match — or record why the ADR supersedes the
  Bible on this specific point).
- A decision moves during the same working session — record the
  history so the next reader does not undo it on first principles.

**Do not write an ADR for:**

- Style preferences (naming, import order, formatting).
- Routine dependency additions — unless the dependency is
  safety-critical enough to warrant explicit version-pinning
  discipline (e.g., `zod-to-json-schema` is tracked this way because
  the agent tool layer depends on its output — see PLAN.md §18a.9).
- Trivial bug fixes.
- Per-feature specs — those live under `docs/specs/`, not here.

## Format

One file per ADR, named `NNNN-short-slug.md` where `NNNN` is a
zero-padded four-digit number in commit order. Contents follow this
template:

```markdown
# ADR-NNNN: [Decision Title]

## Status

Accepted | Superseded by ADR-MMMM | Deprecated

## Date

YYYY-MM-DD

## Triggered by

Which conversation, PR, or incident prompted this.

## Context

What problem needed solving and what constraints apply.

## Decision

What was decided. A few sentences to a few paragraphs. If the
decision has multiple parts, list them clearly.

## Consequences

What this enables and what it constrains. Be honest about the
downside — consequences with no cost are rare and usually indicate
the cost was not examined.

## Alternatives considered

What was rejected and why. Name the architectural cost each
alternative would have imposed. Not "we thought about X" — *why X
was wrong for this situation*.

## Cross-references

Links to PLAN.md sections, other ADRs, specs, or external docs that
the reader should follow for more detail.
```

### Decision section structure (forward-only)

**ADR section structure convention (forward-only):** New ADRs use
Decision-item numbering under a single `## Decision` header (per
ADR-0012 / 0015 / 0016 / 0018 / 0019 precedent). Earlier ADRs
(0007 / 0011 / 0013 / 0014) use §-numbering as historical artifact
and are preserved in current form per δ-i preservation discipline.
Convention codified by Phase 2 brief-creation arc-closeout cycle
2026-05-08 (Stage 3b firing decision); see arc-closeout
retrospective entry at `docs/07_governance/friction-journal.md`
line 6668 for context.

## Frontmatter

ADRs from ADR-0021 onward carry YAML frontmatter. See
[`_template.md`](./_template.md) for the schema. Field semantics
are documented in the comment block above the template's
frontmatter. Allowed `modules`, `features`, and `phase` values:
[`docs/02_specs/taxonomy.md`](../../02_specs/taxonomy.md). The
linter at `scripts/adr/lint.ts` enforces the schema; it runs in
pre-commit and CI (and on demand via `pnpm adr:lint`).

Legacy ADRs (0001–0020) do not have frontmatter. They are not
backfilled — frontmatter is forward-only.

## Pre-ratification design specs

ADRs ratify from external design specs authored during phase
brainstorming. Pre-ratification specs live at
`docs/09_briefs/<phase>/specs/`, filed under the phase folder
during which the spec was authored. Filename pattern:
`YYYY-MM-DD-adr-NNNN-<slug>-design.md`.

Pre-ratification execution plans (multi-step plans authored
during the same brainstorming sessions) live at
`docs/09_briefs/<phase>/plans/`, sibling home to
`<phase>/specs/`. The two sub-buckets share the per-phase
location pattern.

The lifecycle is: brainstorm → design spec at
`<phase>/specs/<file>` (and execution plan at
`<phase>/plans/<file>` if applicable) → ratification package
authored → ADR ratified → design spec preserved as historical
reference (the ADR itself is the canonical authority post-
ratification).

ADR-0021 introduced the pre-ratification-design-spec discipline
at round-2 Session 3. ADRs 0001-0018 predate this convention
and were ratified without separate pre-ratification specs.
ADR-0019 is the single pre-existing instance under the
convention; its design spec was originally authored at the
now-deprecated location `docs/superpowers/specs/`, migrated to
`docs/09_briefs/phase-0/specs/` in round-2 Session 5A (see
`docs/07_governance/DOCS_RESTRUCTURE_V1.md` Amendments section
for migration provenance and
`docs/07_governance/DOCS_RESTRUCTURE_V2.md` ratified at
round-2 Session 7).

## Ratification packages

Distinct from pre-ratification artifacts (specs/ + plans/),
**ratification packages** are the formal substrate enacting ADR
ratification at the original ratification moment. They live at
`docs/09_briefs/<phase>/ratification-packages/` per the briefs
convention's per-phase organization. Filename pattern:
`YYYY-MM-DD-<package-id>-ratification-package.md`. Phase 0's
D1-D6 ratification cluster (6 packages, ratifying ADRs 0011-0018
respectively) is the canonical consumer; ratification-packages/
sub-bucket established in round-2 Session 5B per consumer
evidence. Migrated from the original Phase-2-brief-folder
location during Session 5B Layer 2.

The lifecycle distinction matters: pre-ratification specs/plans
are INPUTS to ADR drafting (design specs become ADRs; execution
plans guide ADR authorship); ratification packages are FORMAL
SUBSTRATE at ratification time (the package is what enacts the
ratification ceremony per the project's governance discipline).

## Writing a new ADR

The procedure for authoring an ADR from scratch:

1. **Find the next free ADR number.** List the folder
   (`ls docs/07_governance/adr/ | grep -oE '^[0-9]{4}' | sort -u
   | tail -1`) and increment by 1, OR inspect the generated
   `## Current ADRs` table below for the highest-numbered ADR.
   IDs are 4-digit zero-padded.

2. **Author at `docs/07_governance/adr/NNNN-kebab-slug.md`.** Copy
   `_template.md` as a starting point; the slug is lowercase
   kebab-case (letters / digits / hyphens) and must match the
   linter regex `^\d{4}-[a-z0-9-]+\.md$`.

3. **Fill in the frontmatter.** Field semantics are documented in
   the comment block above the template's frontmatter. The
   chounting-specific `invariants` field cross-references
   `docs/02_specs/invariants.md` — the linter verifies each
   value matches `^INV-[A-Z]+-\d{3}$` AND exists in invariants.md.
   Quote the `date` value as a string to prevent YAML
   auto-parsing to a Date object.

4. **Author the body.** Section order: `## Status` →
   `## Date` → `## Triggered by` → `## Context` → `## Decision`
   (Decision-item-numbered list per the forward-only convention)
   → `## Consequences` (enables / constrains / costs split is
   conventional) → `## Alternatives considered` →
   `## Cross-references` → optional `## Notes for future ADR
   writers`. Status-line format:
   `Ratified YYYY-MM-DD by [authority] per [ratification artifact reference].`

5. **Run the linter and the generator.**
   `pnpm adr:lint` validates the frontmatter; expected output is
   "0 error(s), 0 warning(s)" for a well-formed ADR.
   `pnpm adr:index` regenerates the README's Current ADRs / By
   module / By invariant / By phase sections (overwrites
   generator-managed marker blocks). Re-running with `--check`
   after the regen should exit 0 (idempotency).

6. **Stage the ADR + the regenerated README + INDEX.md update.**
   The pre-commit hook fires `pnpm adr:lint` and
   `pnpm adr:index --check` when ADR-related files are staged
   (per `scripts/install-hooks.sh`); both must pass.

7. **For supersession or amendment**, see
   [ADR-0022](./0022-adr-lifecycle-workflows.md) for the
   amend-vs-supersede decision rule and the workflow specifics.

## Supersedes and supersession

ADRs are never silently edited after they are accepted. If a
decision changes, the choice between **amending** the existing
ADR in place (extending the framework without contradicting it)
and **superseding** it with a new ADR (replacing the framework)
follows the decision rule codified in
[ADR-0022](./0022-adr-lifecycle-workflows.md): can a future
reader read parent + amendment as a coherent decision? Yes →
amend. No → supersede.

For supersession specifically: write a new ADR, set its
`Triggered by` field to the ADR being superseded, set
`supersedes: ["NNNN"]` in the new ADR's frontmatter, set
`superseded_by: ["MMMM"]` in the old ADR's frontmatter and flip
its `status` to `superseded`. The linter's checks 12 and 13
(per ADR-0021) enforce the frontmatter side at commit time;
Status-section updates in both ADRs are human discipline. Both
updates land in the same commit. The old ADR stays in place as
history — do not delete it.

For amendment, see
[ADR-0022](./0022-adr-lifecycle-workflows.md) Decision items 2
and 3 for the `## Amendment YYYY-MM-DD — <scope>` block format
and the Status-line clause-accumulation pattern.

## Current ADRs

> This table is generated by `scripts/adr/generate-index.ts`. Do
> not edit by hand — your edits will be overwritten on the next
> index regeneration. To change a row, edit the relevant ADR's
> frontmatter (or for legacy ADRs without frontmatter, edit the
> `## Status` / `## Date` headers in the ADR file itself).

<!-- BEGIN:generated-current-adrs -->
| # | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](./0001-reversal-semantics.md) | Reversal Entry Semantics | Accepted | 2026-04-11 |
| [ADR-0002](./0002-confidence-as-policy-input.md) | Confidence as Policy Input, Not UI Hint | Accepted | 2026-04-16 |
| [ADR-0003](./0003-one-voice-agent-architecture.md) | One-Voice Agent Architecture (No User-Facing Sub-Agents) | Accepted | 2026-04-16 |
| [ADR-0004](./0004-ghost-rows-visual-contract.md) | Ghost Rows Visual Contract (Four-Signal Defense in Depth) | Accepted | 2026-04-16 |
| [ADR-0005](./0005-three-path-intent-schema.md) | Three-Path Entry Model with Canonical Intent Schema | Accepted | 2026-04-16 |
| [ADR-0006](./0006-agent-persona-unnamed.md) | Agent Persona: Senior Bookkeeper, Unnamed | Accepted | 2026-04-16 |
| [ADR-0007](./0007-three-tier-agent-architecture.md) | Three-Tier Agent Architecture (with Document Platform Reframe Amendment) | Ratified | 2026-05-03 |
| [ADR-0008](./0008-layer-1-enforcement-modes.md) | Layer 1 Enforcement Modes — Commit-Time (1a) vs. Scheduled Audit (1b) | Accepted | 2026-04-21 |
| [ADR-0009](./0009-before-state-capture-convention.md) | `before_state` Capture Convention for `audit_log` | Accepted | 2026-04-23 |
| [ADR-0010](./0010-reserved-enum-states.md) | Reserved Enum States for Phase 2 Workflow Affordances | Accepted | 2026-04-24 |
| [ADR-0011](./0011-document-platform.md) | Document Platform — Substrate Spine, DOC Invariant Prefix, Domain Boundary Map | Ratified | 2026-05-03 |
| [ADR-0012](./0012-proposed-mutation-bundle.md) | ProposedMutationBundle — Atomicity, Lifecycle, Logic Receipt, Q28 Surface 4 | Ratified | 2026-05-03 |
| [ADR-0013](./0013-storage-provider.md) | Storage Provider — Abstraction, Drift Detection, Queue-and-Retry, Integrity-Check, Controller-Override | Ratified | 2026-05-03 |
| [ADR-0014](./0014-tier-2-document-pipeline.md) | Tier 2 Document Pipeline — OCR Engine, Sidecar Topology, Classification, AI Fallback, Replay Policy, Dedup, Vendor Matcher, Orphan-Blob GC | Ratified | 2026-05-03 |
| [ADR-0015](./0015-ap-spend-subdomain.md) | AP/Spend Subdomain — Vendor Prepayments, Born-Paid Bundle Approval, Tax Timing, Vendor Balance, Backfill, Receipt v1, Payment Failure Lifecycle | Ratified | 2026-05-03 |
| [ADR-0016](./0016-document-relationship-graph.md) | Document Relationship Graph | Ratified | 2026-05-04 |
| [ADR-0017](./0017-vendor-template-substrate.md) | Vendor Template Substrate (substrate-only v1) | Ratified | 2026-05-04 |
| [ADR-0018](./0018-relationship-router.md) | Relationship Router | Ratified | 2026-05-04 |
| [ADR-0019](./0019-confidence-calibration-policy.md) | Confidence Calibration Policy | Ratified | 2026-05-04 |
| [ADR-0020](./0020-agent-first-authority-gradient-source-architecture.md) | Agent-First Authority-Gradient Source Architecture (substrate-only v1) | Ratified | 2026-05-05 |
| [ADR-0021](./0021-adr-frontmatter-and-tooling.md) | ADR Frontmatter and Tooling | Ratified | 2026-05-08 |
| [ADR-0022](./0022-adr-lifecycle-workflows.md) | ADR Lifecycle Workflows — Amendment vs Supersession | Ratified | 2026-05-08 |
| [ADR-0023](./0023-rule-type-core-substrate.md) | Rule Type Core Substrate and ADR-0017 Reconciliation | Ratified | 2026-05-26 |
| [ADR-0024](./0024-ring2a-core.md) | Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate | Ratified | 2026-05-26 |
| [ADR-0025](./0025-ring2a-core-implementation-seams.md) | Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas | Ratified | 2026-05-26 |
| [ADR-0026](./0026-ring2a-authoring.md) | Ring 2A-authoring — Conversational rule-drafting, Four-Questions card, approval, create-path wiring | Ratified | 2026-05-29 |
| [ADR-0027](./0027-ring2b-substrate.md) | Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring | Ratified | 2026-05-30 |
| [ADR-0028](./0028-workflow-core-substrate.md) | Workflow Core Substrate — net-new general instance/event substrate, inert at Wave 1 | Ratified | 2026-06-01 |
| [ADR-0029](./0029-autonomy-ladder-generalization.md) | Autonomy Ladder Generalization — single canonical rung, five-ADR reconciliation, INV-AGENT precision pass | Ratified | 2026-05-31 |
| [ADR-0030](./0030-decision-module-composition.md) | Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy | Ratified | 2026-05-31 |
| [ADR-0031](./0031-no-ai-only-paths.md) | No-AI-Only-Paths — code-defined producer registry + warn-only CI; teeth + INV-WORKFLOW-001 at Wave 6 | Ratified | 2026-06-02 |
| [ADR-0032](./0032-canonical-autonomy-gate-seam.md) | Canonical Autonomy Gate Seam — single live-path recording seam; recording at V1, deciding post-V1 | Ratified | 2026-06-02 |
| [ADR-0033](./0033-canonical-evidence-object-model.md) | Canonical Evidence Object Model — net-new general by-reference evidence object, read/assemble at Wave 2 | Ratified | 2026-06-01 |
<!-- END:generated-current-adrs -->

**Phase 0 governance plan (2026-05-03) reservations.** ADR-0011 through ADR-0019 are reserved for the Document Platform reframe per
`docs/09_briefs/phase-0/plans/2026-05-03-phase-0-governance-plan.md` Decision 7: ADR-0011 Document Platform, ADR-0012 ProposedMutationBundle, ADR-0013 Storage Provider, ADR-0014 Tier 2 Document Pipeline, ADR-0015 AP/Spend Subdomain, ADR-0016 Document Relationship Graph, ADR-0017 Vendor Template Substrate, ADR-0018 Relationship Router, ADR-0019 Confidence Calibration Policy. These ADRs ratified across D1–D6 gates 2026-05-03 / 2026-05-04 per Phase 0 closure verification (Session 2F).

## By module

> Generated from frontmatter `modules` field. Legacy ADRs without
> frontmatter do not appear here.

<!-- BEGIN:generated-by-module -->
### agent

- [ADR-0023](./0023-rule-type-core-substrate.md) — Rule Type Core Substrate and ADR-0017 Reconciliation (Ratified; 2026-05-26)
- [ADR-0024](./0024-ring2a-core.md) — Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate (Ratified; 2026-05-26)
- [ADR-0025](./0025-ring2a-core-implementation-seams.md) — Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas (Ratified; 2026-05-26)
- [ADR-0026](./0026-ring2a-authoring.md) — Ring 2A-authoring — Conversational rule-drafting, Four-Questions card, approval, create-path wiring (Ratified; 2026-05-29)
- [ADR-0027](./0027-ring2b-substrate.md) — Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring (Ratified; 2026-05-30)
- [ADR-0029](./0029-autonomy-ladder-generalization.md) — Autonomy Ladder Generalization — single canonical rung, five-ADR reconciliation, INV-AGENT precision pass (Ratified; 2026-05-31)
- [ADR-0030](./0030-decision-module-composition.md) — Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy (Ratified; 2026-05-31)
- [ADR-0031](./0031-no-ai-only-paths.md) — No-AI-Only-Paths — code-defined producer registry + warn-only CI; teeth + INV-WORKFLOW-001 at Wave 6 (Ratified; 2026-06-02)
- [ADR-0032](./0032-canonical-autonomy-gate-seam.md) — Canonical Autonomy Gate Seam — single live-path recording seam; recording at V1, deciding post-V1 (Ratified; 2026-06-02)

### app-components

- [ADR-0026](./0026-ring2a-authoring.md) — Ring 2A-authoring — Conversational rule-drafting, Four-Questions card, approval, create-path wiring (Ratified; 2026-05-29)

### core

- [ADR-0024](./0024-ring2a-core.md) — Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate (Ratified; 2026-05-26)
- [ADR-0025](./0025-ring2a-core-implementation-seams.md) — Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas (Ratified; 2026-05-26)

### db

- [ADR-0023](./0023-rule-type-core-substrate.md) — Rule Type Core Substrate and ADR-0017 Reconciliation (Ratified; 2026-05-26)
- [ADR-0024](./0024-ring2a-core.md) — Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate (Ratified; 2026-05-26)
- [ADR-0025](./0025-ring2a-core-implementation-seams.md) — Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas (Ratified; 2026-05-26)
- [ADR-0026](./0026-ring2a-authoring.md) — Ring 2A-authoring — Conversational rule-drafting, Four-Questions card, approval, create-path wiring (Ratified; 2026-05-29)
- [ADR-0027](./0027-ring2b-substrate.md) — Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring (Ratified; 2026-05-30)
- [ADR-0028](./0028-workflow-core-substrate.md) — Workflow Core Substrate — net-new general instance/event substrate, inert at Wave 1 (Ratified; 2026-06-01)
- [ADR-0029](./0029-autonomy-ladder-generalization.md) — Autonomy Ladder Generalization — single canonical rung, five-ADR reconciliation, INV-AGENT precision pass (Ratified; 2026-05-31)
- [ADR-0030](./0030-decision-module-composition.md) — Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy (Ratified; 2026-05-31)
- [ADR-0032](./0032-canonical-autonomy-gate-seam.md) — Canonical Autonomy Gate Seam — single live-path recording seam; recording at V1, deciding post-V1 (Ratified; 2026-06-02)
- [ADR-0033](./0033-canonical-evidence-object-model.md) — Canonical Evidence Object Model — net-new general by-reference evidence object, read/assemble at Wave 2 (Ratified; 2026-06-01)

### evidence

- [ADR-0033](./0033-canonical-evidence-object-model.md) — Canonical Evidence Object Model — net-new general by-reference evidence object, read/assemble at Wave 2 (Ratified; 2026-06-01)

### infra

- [ADR-0021](./0021-adr-frontmatter-and-tooling.md) — ADR Frontmatter and Tooling (Ratified; 2026-05-08)
- [ADR-0022](./0022-adr-lifecycle-workflows.md) — ADR Lifecycle Workflows — Amendment vs Supersession (Ratified; 2026-05-08)
- [ADR-0031](./0031-no-ai-only-paths.md) — No-AI-Only-Paths — code-defined producer registry + warn-only CI; teeth + INV-WORKFLOW-001 at Wave 6 (Ratified; 2026-06-02)

### rules

- [ADR-0027](./0027-ring2b-substrate.md) — Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring (Ratified; 2026-05-30)
<!-- END:generated-by-module -->

## By invariant

> Generated from frontmatter `invariants` field. Legacy ADRs
> without frontmatter do not appear here.

<!-- BEGIN:generated-by-invariant -->
### INV-EVIDENCE-001

- [ADR-0033](./0033-canonical-evidence-object-model.md) — Canonical Evidence Object Model — net-new general by-reference evidence object, read/assemble at Wave 2 (Ratified; 2026-06-01)

### INV-RULE-001

- [ADR-0024](./0024-ring2a-core.md) — Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate (Ratified; 2026-05-26)

### INV-RULE-002

- [ADR-0025](./0025-ring2a-core-implementation-seams.md) — Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas (Ratified; 2026-05-26)

### INV-RULE-003

- [ADR-0025](./0025-ring2a-core-implementation-seams.md) — Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas (Ratified; 2026-05-26)

### INV-RULE-004

- [ADR-0027](./0027-ring2b-substrate.md) — Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring (Ratified; 2026-05-30)
<!-- END:generated-by-invariant -->

## By phase

> Generated from frontmatter `phase` field. Legacy ADRs without
> frontmatter do not appear here.

<!-- BEGIN:generated-by-phase -->
### post-mvp

- [ADR-0023](./0023-rule-type-core-substrate.md) — Rule Type Core Substrate and ADR-0017 Reconciliation (Ratified; 2026-05-26)
- [ADR-0024](./0024-ring2a-core.md) — Ring 2A-core — Evaluator, Agent Ladder Gate, Stage 1 Canvas, and Evaluation Log Substrate (Ratified; 2026-05-26)
- [ADR-0025](./0025-ring2a-core-implementation-seams.md) — Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Routes, Stage 1 Canvas (Ratified; 2026-05-26)
- [ADR-0026](./0026-ring2a-authoring.md) — Ring 2A-authoring — Conversational rule-drafting, Four-Questions card, approval, create-path wiring (Ratified; 2026-05-29)
- [ADR-0027](./0027-ring2b-substrate.md) — Ring 2B — Branch/condition substrate, production branchSource, and Seam-1 shadow wiring (Ratified; 2026-05-30)
- [ADR-0028](./0028-workflow-core-substrate.md) — Workflow Core Substrate — net-new general instance/event substrate, inert at Wave 1 (Ratified; 2026-06-01)
- [ADR-0029](./0029-autonomy-ladder-generalization.md) — Autonomy Ladder Generalization — single canonical rung, five-ADR reconciliation, INV-AGENT precision pass (Ratified; 2026-05-31)
- [ADR-0030](./0030-decision-module-composition.md) — Decision-Module Composition + Disposition Reconciliation (Decision 11) + (V2) Learning Trichotomy (Ratified; 2026-05-31)
- [ADR-0031](./0031-no-ai-only-paths.md) — No-AI-Only-Paths — code-defined producer registry + warn-only CI; teeth + INV-WORKFLOW-001 at Wave 6 (Ratified; 2026-06-02)
- [ADR-0032](./0032-canonical-autonomy-gate-seam.md) — Canonical Autonomy Gate Seam — single live-path recording seam; recording at V1, deciding post-V1 (Ratified; 2026-06-02)
- [ADR-0033](./0033-canonical-evidence-object-model.md) — Canonical Evidence Object Model — net-new general by-reference evidence object, read/assemble at Wave 2 (Ratified; 2026-06-01)
<!-- END:generated-by-phase -->

## Related files

- **`PLAN.md`** — the Architecture Bible. ADRs reference sections in
  PLAN.md by number (§2a, §15e, §18c.19, ...).
- **`CLAUDE.md`** at the repo root — standing rules loaded every
  session. Derived from PLAN.md, filtered by the throwaway-work test.
- **`docs/specs/`** — per-phase execution briefs. ADRs reference
  specific brief sections when the decision affects execution work.
