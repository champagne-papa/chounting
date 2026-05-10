# Session 7: Round-2 V2 Ratification + V1 Elevation + Remaining Guardrail Surfaces

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round-2 Session 7 — close round-2 by ratifying its design substrate into canonical documents. Elevate the round-1 plan (`docs/restructure-plan.md`) to `DOCS_RESTRUCTURE_V1.md` under `docs/07_governance/`; create `DOCS_RESTRUCTURE_V2.md` ratifying three Principles, the Migration Map, and the Changes-from-V1 deltas; land the two remaining Principle 3 guardrail surfaces (`docs/README.md` Folder placement guardrail; repo-root `README.md` Folder placement section); land the CLAUDE.md sub-section under "Project rules and vocabulary"; codify round-2 conventions at `04_engineering/conventions.md` (round-N restructure plan workflow, three-category codification taxonomy, "verify before agreeing with alarm" rule, plan-substrate-vs-canonical-reality drift meta-pattern at Tier 3 → Tier 2 trajectory).

**Architecture:** 7 commits (C1–C7) applied at session level, sequenced to honor cross-reference resolution: V1 elevation lands first (C1) so V2's references to V1 stabilize at C1's commit; V2 lands second (C2) so guardrail surfaces and the CLAUDE.md sub-section can reference V2 by path; the three guardrail surfaces follow (C3 docs/, C4 repo-root, C5 CLAUDE.md); conventions.md additions land at C6; closeout at C7. Diff is doc-only across all seven commits — eligible for floor-only carve-out at the next invocation; count is established at execution time, not projected here per the drift discipline below.

**Tech Stack:** Write tool, Edit tool, `grep -rn` for cross-reference verification, `git mv` for V1 elevation, `bash` for floor-only verification (`pnpm db:reset:clean && pnpm agent:validate`).

---

## Brainstorm context (forward to round-2 closure and Session 8+)

This section captures the design substrate produced by the brainstorm conversation that authored this plan. Session 7 execution does not re-derive content from the brainstorm transcript; this section is durable substrate.

### Principle 1 (V2 Part 1 ratification)

**A folder should encode only one canonical axis. Other axes belong in metadata and indexes.**

Folder hierarchy is a single-axis encoding. When a folder tries to encode two axes, the one closer to the file path becomes load-bearing and the other silently degrades. The mitigation: pick one canonical axis per folder; move every other axis into frontmatter, taxonomy, or generated indexes.

**Worked examples:**

- `docs/02_specs/` encodes "spec content" as the canonical axis. Module / phase / concern / audience axes live in frontmatter per the canonical taxonomy at `docs/02_specs/taxonomy.md` (per ADR-0021). The linter at `scripts/adr/lint.ts` enforces taxonomy values against frontmatter.
- `docs/07_governance/adr/` encodes "ratified architectural decision" as the canonical axis. Module / invariant / phase axes live in ADR frontmatter; the README's generated index sections (`generated-by-module`, `generated-by-invariant`, `generated-by-phase`) regenerate from frontmatter via `pnpm adr:index`.
- The principle CLOSES: folders that try to encode two axes (e.g., `docs/<phase>/<concern>/`, `docs/<workflow-lineage>/`) are forbidden; the failure-mode is silent axis collapse where one axis becomes load-bearing and the other becomes unmaintained accident.

The canonical-axis rule is the architectural foundation for the round-2 deltas: frontmatter-not-folders, single-source-of-truth taxonomy, generated indexes from structured data.

**Cross-references:** ADR-0021 names this as round-2 architectural contribution #1; the contribution ratifies into V2 Part 1 at this principle.

### Principle 2 (V2 Part 1 ratification)

**Top-level folders are document classes, not workflow lineages — with one exception for cross-phase meta-arcs.**

A document class is "what kind of doc is this?" — a stable category answering reader needs (product, spec, architecture, engineering, audit, governance, brief). A workflow lineage is "what arc produced this doc?" — a transient grouping that decays as the arc closes. Top-level docs/ folders are document classes; workflow lineages decay into archives or per-phase brief folders.

**Caught-and-fixed example:** `docs/superpowers/` (workflow-lineage folder for the superpowers methodology arc) was migrated in round-2 Session 5A — its specs/ and plans/ contents distributed to per-phase `09_briefs/<phase>/specs/` + `09_briefs/<phase>/plans/`. The `superpowers/` folder no longer exists at top-level; the document-class principle replaces it.

**Worked-precedent exception:** `docs/07_governance/round-2/` (cross-phase meta-arc folder for round-2 docs reorganization) is permitted under the meta-arc exception. Round-2 is a docs-reorganization arc that operates on the structure used by all phases — it is not phase-N work and has no natural per-phase brief folder. The meta-arc folder is conditional and governed by Pattern 7 (below).

**Cross-references:** ADR-0021 names this as round-2 architectural contribution #2; CTO_HANDOFF_V2 §12 (DDD-rejection) is the architectural framing the principle inherits at the source-tree level (per ADR-0020); V2 ratifies the docs-tree analog here.

### Principle 3 (V2 Part 1 ratification)

**Folder placement guardrails at high-decision-cost structural surfaces.**

Folder placement decisions happen at the surface where the folder is created. When the canonical taxonomy lives elsewhere, the rule isn't readable at the moment of decision, and wrong placements ship with thoughtful rationale that violates principles the rationale couldn't see. The mitigation is a guardrail README at each high-decision-cost structural surface that documents what's permitted, what's forbidden, the decision rule for ambiguous cases, and the bypass procedure.

**Three surfaces ratified at V2** (each surface independently meets N=1 evidence; V2 does NOT aggregate across surfaces):

1. **`apps/web/src/`** — N=1 evidence: Session 6.5's `apps/web/src/README.md` + `apps/web/src/AGENTS.md` (commit `b98208c`, landed 2026-05-09). The source-tree authority-layer guardrail per ADR-0020. Prior-art worked example for V2's Principle 3 ratification.
2. **`docs/`** — N=1 evidence: Session 7 C3 same-session ratification (`docs/README.md` Folder placement guardrail, lands at this session).
3. **Repo root** — N=1 evidence: Session 7 C4 same-session ratification (root `README.md` Folder placement section, lands at this session).

**Per-surface N=1 framing** matches the architectural-principle codification mechanic: a principle ratifies at N=1 per surface it applies to, not aggregated across surfaces. Each surface's worked example is its own N=1.

**Future surfaces** extend Principle 3 by precedent — they earn a guardrail when accumulated sub-discipline can't be cleanly stated in the parent. Surface additions are amendments to V2, not new principles.

### Pattern 7 (V2 Part 1 ratification within Principle 2's exception clause)

**Two-case conditional permission for cross-phase meta-arc folders under `07_governance/`.**

The meta-arc exception in Principle 2 isn't blanket — it's conditional, with two sub-cases governing the bypass procedure.

**First-instance meta-arc shape (full bypass):**
- Folder README answering the document-class questions (what is this folder for; what goes here; what does NOT go here; when does the folder close).
- Friction-journal entry recording the new shape as N=1 evidence (the meta-arc shape itself, not the specific arc's content).
- Operator acknowledgment in the commit body authoring the folder.

**Follows-precedent meta-arc (light bypass):**
- Folder README answering the same questions plus an explicit `Follows precedent: <precedent path>` citation embedded as a 4/4 precedent-matching checklist.
- One-line friction-journal entry citing the precedent.
- Commit body cites the precedent. No fresh operator acknowledgment per instance — the operator's first-instance approval covers the shape, and the commit body's precedent citation is the audit trail surfaced at PR review.

**4/4 precedent-matching test (required for light bypass):**
1. Precedent README answers document-class questions.
2. New README answers the same questions citing precedent.
3. Cross-phase scope / durable identity / closure criteria / governance-surface placement match.
4. Naming structurally consistent (e.g., `round-N/`, `arc-X-governance/`).

**Canonical first-instance precedent:** `docs/07_governance/round-2/` (round-2 docs reorganization meta-arc, established 2026-05-08 at Session 5A). V2 ratifies Pattern 7 with this folder as the worked example.

**Pattern 7's bypass procedure carries two operational rules** (these are operational rules within Pattern 7's bypass procedure, NOT Principle 3 ratification expansions — see Drift meta-pattern below for the rationale):

- **Canonical-source verification at execution time.** When implementing a bypass, verify against canonical sources (folder-structure.md, taxonomy.md, V2, etc.) at the moment of writing rather than from memory or from plan-internal substrate. The Session 6.5 catch (lib/hooks forbidden-list mismatch with folder-structure.md) is the worked example. Plan-internal brainstorm-context is design substrate; canonical docs are the ratified source.
- **Chronological-reality verification at planning time.** When drafting forward-looking content (fire counts, sequence assumptions, "after X session executes" projections), don't project; reference the current ratified state and let execution-time verification establish the count when the artifact lands. The Path A vs Path B sequencing question caught at Session 7 brainstorm time is the worked example.

### V2 Part 2 (Changes from V1) substance

V2 enumerates round-2's deltas relative to V1's nine-folder substrate:

- **Four-maps vocabulary as filesystem-encoded.** Per ADR-0020 + `docs/03_architecture/product-workflow-delivery-mapping.md`. Product / Workflow / Delivery / Runtime rollout maps stay separate; source tree is organized by authority layer (not by bounded context); product modules and workflow arcs remain documentation-only.
- **Frontmatter-not-folders pattern.** Per ADR-0021 Decision item 1. Module / phase / concern / audience axes live in frontmatter, not as folder hierarchy. The canonical taxonomy at `docs/02_specs/taxonomy.md` is the single source of truth.
- **Canonical taxonomy at `docs/02_specs/taxonomy.md`.** Per ADR-0021 Decision item 2. Single canonical home; multiple consumers (ADR linter, brief frontmatter, future spec/architecture/engineering frontmatter) read the same file.
- **Source-tree guardrail.** Per ADR-0020 + Session 6.5's `apps/web/src/README.md` + `apps/web/src/AGENTS.md`. The authority-layer organization is now load-bearing at the source-tree surface itself.
- **Pre-ratification design spec location.** Per ADR-0021 Decision item 4. Design specs live at `docs/09_briefs/<phase>/specs/` (per-phase, not centralized).
- **ADR amendment workflows.** Per ADR-0022. Amend-vs-supersede decision rule, `## Amendment` block format, Status-line accumulation, supersession workflow.
- **TypeScript-for-docs-tooling location convention.** Per ADR-0021 Decision item 3. `scripts/<area>/*.ts` for cross-repo TypeScript docs tooling; `scripts/*.sh` retained for shell-shaped operations.
- **Plan-substrate-vs-canonical-reality drift meta-pattern at N=2 evidence** — kept SEPARATE from Principle 3 ratification text per the rationale below. V2 records this as a substantive change in Part 2 with N=2 evidence; codification trajectory is Tier 3 → Tier 2 (do NOT ratify at N=2 prematurely).

#### Drift meta-pattern N=2 evidence

The plan-substrate-vs-canonical-reality drift meta-pattern fired twice during round-2:

**N=1 — Session 6.5 closeout (execution-time surface).** Three drift instances under one meta-pattern observation:
1. `lib/` and `hooks/` listed forbidden in plan brainstorm-context; canonical `folder-structure.md` lists permitted forward-looking. Resolution: README aligned with canonical; only `utils/` and `modules/<feature>/` ship forbidden.
2. Plan instructed friction-journal entry header use `### 2026-05-09 —` style; canonical pattern across all prior closeouts is bullet-list `- 2026-05-09 NOTE —` style. Resolution: bullet-list used.
3. Plan claimed N=6 floor-only invocation; operator handoff projected N=7. Reality at push time: N=5. Resolution: closeout records N=5; observation captures the drift.

**N=2 — Session 7 brainstorm (planning-decision-time surface).** The Path A vs Path B sequencing question (5B/Session 6 execution as Session 7 prerequisites vs Session 7 ratifies independent of execution outputs) is the same meta-pattern firing at planning-decision time. Plan-substrate (handoff sequence projection) drifts from canonical-reality (5B/6 plan-but-not-executed state). Resolution: Path A locked; V2 ratifies with chronological-reality framing; 5B/6 execution lands as cleanup commits afterward (Session 8 or piggyback).

**Why drift meta-pattern stays separate from Principle 3.** Principle 3's load-bearing surface is "guardrails at structural surfaces" — folder placement at high-decision-cost structural locations. The drift meta-pattern is "projection-vs-reality discipline at multiple timing surfaces" — execution time, planning-decision time, cross-reference time. Related axes, not the same axis. Conflating them dilutes Principle 3's tightness AND ratifies the drift meta-pattern at N=2 prematurely (it's still on a Tier 3 → Tier 2 trajectory awaiting N=3 with shape match across distinct timing surfaces). The drift meta-pattern lands as N=2 evidence in V2 Part 2 (Changes from V1) AND as operational rules within Pattern 7's bypass procedure (canonical-source verification at execution time + chronological-reality verification at planning time). It does NOT land as a Principle 3 ratification expansion.

### V2 Part 3 (Migration Map) substance

Per-file table of round-2 migrations:

| What | From | To | Session | Rationale |
|---|---|---|---|---|
| Round-1 docs reorganization plan | `docs/restructure-plan.md` | `docs/07_governance/DOCS_RESTRUCTURE_V1.md` | Session 7 C1 | V1 elevation; canonical-tier governance per the plan-elevation-on-arc-closure pattern |
| `superpowers/` workflow-lineage elimination | `docs/superpowers/specs/`, `docs/superpowers/plans/` | `docs/09_briefs/<phase>/specs/`, `docs/09_briefs/<phase>/plans/` | Session 5A | Principle 2 (top-level folders are document classes, not workflow lineages); contents redistributed per-phase |
| `ec-2-prompt-set.md` move | `docs/07_governance/ec-2-prompt-set.md` | `docs/09_briefs/phase-1.2/ec-2-prompt-set.md` | Session 4 | Phase-specific artifact placed under its phase brief folder |
| Phase 0 governance file move | `docs/09_briefs/phase-2/2026-05-0*-*` | `docs/09_briefs/phase-0/` | Session 5 | Phase 0 governance arc gets its own phase folder |
| ADR system upgrade (frontmatter + tooling) | substrate-only — ADRs 0001–0020 | ADR-0021 ratifies + ADR-0022 lifecycle workflows | Session 3 + Session 4 | Forward-only; legacy ADRs preserved per δ-i discipline |
| Canonical taxonomy consolidation | distributed inline | `docs/02_specs/taxonomy.md` | Session 3 | Single source of truth (per ADR-0021 Decision item 2) |
| Folder READMEs (01_prd, 02_specs, 03_architecture, 04_engineering) | various / under-specified | rewritten + doc-class opener pattern | Session 6 (pending execution) | Doc-class opener pattern propagates ADR-0021's "one canonical axis" principle |
| Source-tree folder-placement guardrail | (no prior surface) | `apps/web/src/README.md` + `apps/web/src/AGENTS.md` | Session 6.5 (commit `b98208c`) | Principle 3 N=1 implementation evidence at the source-tree surface |
| docs/ folder-placement guardrail | `docs/README.md` (orientation only) | `docs/README.md` extended with Folder placement guardrail | Session 7 C3 | Principle 3 N=1 evidence at the docs surface |
| Repo-root folder-placement section | repo-root `README.md` (overview only) | repo-root `README.md` extended with Folder placement section | Session 7 C4 | Principle 3 N=1 evidence at the repo-root surface |
| CLAUDE.md guardrail sub-section | (no prior cross-reference to surface guardrails) | CLAUDE.md sub-section under "Project rules and vocabulary" | Session 7 C5 | Standing-rules-level pointer to the three surface guardrails |
| Round-2 conventions codified | (round-2 codifications scattered across friction-journal) | `docs/04_engineering/conventions.md` § "Round-2 Conventions (established 2026-05-MM)" | Session 7 C6 | Round-N restructure plan workflow + three-category codification taxonomy + "verify before agreeing with alarm" + drift meta-pattern at Tier 3 → Tier 2 |

**Path-level cross-references throughout the migration map.** Where Migration Map cites a sub-folder README that Session 6 will rewrite later, cite the path (`docs/02_specs/README.md`), not specific post-rewrite sentences. Path is stable; content target evolves under it. Same discipline applies to V2's cross-references throughout — paths over content.

### docs/README.md guardrail content sketch

The current `docs/README.md` (23 lines, see C3 for the full read) is the contributor orientation file with reading order + reference list + current phase. C3 ADDS a `## Folder placement guardrail` section without removing existing content (additive, not replace).

**Section content (load-bearing structure):**

- Permitted patterns: top-level folders match the canonical numbered taxonomy (`00_product/` through `09_briefs/`, `99_archive/`); 07_governance/ sub-folders include `adr/`, `audits/`, `friction-journal/`, `retrospectives/`, plus the round-N meta-arc exception (Pattern 7).
- Forbidden patterns:
  - Workflow-lineage folders at any level (e.g., `docs/superpowers/`, `docs/<arc-name>/`); caught-and-fixed example: `docs/superpowers/` migrated in Session 5A.
  - Phase-vocabulary folders at top-level (e.g., `docs/phase-1/`); phase work goes to `09_briefs/phase-N/`.
  - Document-class folders that don't match the canonical numbered taxonomy.
- Decision rule for ambiguous cases: file an ADR before creating the folder; the ADR ratifies the new pattern.
- Bypass procedure: Pattern 7 conditional permission for cross-phase meta-arcs under `07_governance/`. First-instance bypass: full (folder README, friction-journal N=1, operator acknowledgment). Light bypass: 4/4 precedent-matching checklist + commit-body precedent citation. The bypass procedure carries the two operational rules (canonical-source verification at execution time + chronological-reality verification at planning time).
- Cross-references: V2 (path-level), ADR-0021 (canonical-axis principle), ADR-0020 (source-tree guardrail at apps/web/src/), `docs/02_specs/taxonomy.md` (canonical taxonomy), CLAUDE.md sub-section (standing-rules pointer).

### Repo-root README.md extension content sketch

The current root `README.md` (84 lines) is the project orientation with repo shape, prerequisites, quickstart, common tasks, working agreement. C4 ADDS a `## Folder placement` section before "## License" (additive, not replace).

**Section content (load-bearing structure):**

- Verify against `ls` at execution time, not from memory. Permitted top-level structural folders (verified at brainstorm time 2026-05-09 against `ls .`): `apps/`, `packages/`, `supabase/`, `scripts/`, `docs/`, `eslint-rules/`, `.coordination/`. Verify at execution time; if drift, adjust to actual state.
- Tooling/system folders out-of-scope (gitignored or system-managed): `.git/`, `.github/`, `.turbo/`, `node_modules/`, `logs/`, `reports/`, `test-results/`, `.claude/` (mostly gitignored). Plus config files at repo root (`.gitattributes`, `.gitignore`, `.mcp.json`, `.nvmrc`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.base.mjs`, `turbo.json`, plus the three top-level docs: `README.md`, `AGENTS.md`, `CLAUDE.md`).
- Decision rule + bypass procedure: cross-reference V2 (path-level) for the canonical guardrail; new top-level structural folder requires an ADR; new tooling/system folder is operator discretion.

### CLAUDE.md sub-section content sketch

The CLAUDE.md "Project rules and vocabulary" section currently lists canonical sources (repo-rules, worktree-rules, delivery-model, folder-structure, authority-gradient, glossary, conventions). C5 ADDS a new sub-section "### Folder placement guardrails" after the canonical-source list, before the closing paragraph that says "When starting work, identify which concern your task touches and read the canonical source. Do not re-derive these rules from conversation context."

**Sub-section content (load-bearing structure):**

```markdown
### Folder placement guardrails

Three surface guardrails ratify Principle 3 (folder placement
guardrails at high-decision-cost structural surfaces) per
`docs/07_governance/DOCS_RESTRUCTURE_V2.md` Part 1:

- **`apps/web/src/README.md`** — source-tree authority-layer
  guardrail per ADR-0020.
- **`docs/README.md`** — docs-tree document-class guardrail.
- **Repo-root `README.md`** — repo-root structural-folder
  guardrail.

Before creating any folder at one of these surfaces, read the
relevant guardrail. The bypass procedure (Pattern 7 conditional
permission for cross-phase meta-arcs under `07_governance/`)
carries two operational rules: canonical-source verification at
execution time AND chronological-reality verification at planning
time. AI agents may not unilaterally bypass without operator
acknowledgment in the commit body.

Worked examples: `docs/superpowers/` migration (Session 5A,
caught-and-fixed Principle 2 violation); `docs/07_governance/
round-2/` (canonical first-instance Pattern 7 precedent).
```

This is NOT a fabricated "Rule 12" — it integrates into CLAUDE.md's actual idiom (a sub-section under the existing "Project rules and vocabulary" section).

### Conventions.md additions content sketch

C6 adds a new section `## Round-2 Conventions (established 2026-05-MM)` at `docs/04_engineering/conventions.md`, following the Phase 1.5A / Phase 1.2 conventions section pattern. The section body has four sub-sections.

**Round-N restructure plan workflow:**

```
Round-N docs reorganization arcs follow a stable artifact pattern:
- Arc-level brief lives at the docs root during the arc
  (e.g., `docs/restructure-plan.md` for V1).
- Session-level plans live at the meta-arc folder
  (`docs/07_governance/round-N/`).
- At arc closure, the arc-level brief elevates to
  `docs/07_governance/DOCS_RESTRUCTURE_V<N>.md` alongside the new
  `DOCS_RESTRUCTURE_V<N+1>.md` (which becomes the V1 source for
  the NEXT round).

The meta-arc folder under `07_governance/round-N/` is a Pattern 7
conditional-permission case (cross-phase meta-arc exception to
Principle 2). First-instance precedent: `docs/07_governance/round-2/`.
```

**Three-category codification taxonomy:**

```
Codification thresholds vary by category. The artifact-codification
relationship is the load-bearing distinction:

- **Architectural principle.** Ratification IS codification. The
  principle's text in V<N>.md (or in an ADR) is the canonical record
  at the moment of ratification. Threshold: N=1 per surface the
  principle applies to. Aggregation across surfaces is NOT required —
  each surface independently meets N=1. Worked examples: Principles 1,
  2, 3 in DOCS_RESTRUCTURE_V2.md; ADR-0020's authority-gradient
  source organization.
- **Procedural pattern.** Artifact's existence documents the
  convention. The convention is in the artifact itself; reading the
  artifact teaches the pattern. Threshold: N=1 establishes; N=2
  confirms; codification often coincides with artifact creation.
  Worked examples: ADR `## Amendment` block format (per ADR-0022);
  friction-journal entry shape; round-N session-plan filename
  convention.
- **Process meta-pattern.** Artifact is decoupled from codification.
  The pattern operates on processes (how decisions get made, how
  drift gets caught, how sequences get verified) rather than on
  artifacts. Threshold: N=2 with shape match across distinct timing
  surfaces or distinct contexts; N=3 confirms. Codification gates
  must catch shape-match across instances, not just count. Worked
  examples: plan-substrate-vs-canonical-reality drift meta-pattern
  (N=2; not yet codified to a principle).
```

**"Verify the artifact before agreeing with an alarm" rule:**

```
When someone (operator, agent, doc) raises an alarm about an
artifact's state, verify against the artifact directly before
responding. Don't agree with the alarm based on memory of the prior
state; read the artifact at alarm-time.

Worked example: Session 6.5 plan claimed `lib/` was forbidden in the
authority-layer enumeration; canonical `folder-structure.md` actually
lists `lib/` as a permitted forward-looking layer. Executor verified
against folder-structure.md (canonical) before drafting; canonical
won.

Failure mode this prevents: "agent agrees with the alarm because the
operator raised it" — propagating a misreading because the alarm
felt authoritative. The discipline is: verify directly, then respond.
The alarm-raiser may be right; the artifact is the tiebreaker.
```

**Plan-substrate-vs-canonical-reality drift meta-pattern (Tier 3 → Tier 2 codification trajectory):**

```
Forward projections embedded in plans, handoffs, or brainstorm-
context sections drift from canonical reality at execution time. The
meta-pattern fires across multiple timing surfaces:

- Execution-time surface: plan-internal substrate (forbidden lists,
  header styles, fire counts) drifts from canonical docs (folder-
  structure.md, friction-journal pattern, chronological fire history).
- Planning-decision-time surface: handoff sequence projections
  (5B → 6 → 6.5 sequence) drift from chronological reality
  (sequence didn't materialize).
- Cross-reference-time surface: forward references in V<N>.md to
  post-rewrite content drift from current-state content (mitigated
  by path-level cross-references; see operational rule below).

Current evidence count: N=2.
- N=1 = Session 6.5 closeout (execution-time, three instances under
  one meta-pattern observation).
- N=2 = Session 7 brainstorm (planning-decision-time, the Path A vs
  Path B sequence question).

**Codification status: Tier 3 → Tier 2 trajectory; not ratified to a
principle at N=2.** Codification gates: N=3 with shape match across
three distinct timing surfaces. The cross-reference-time surface
needs an N=1 instance before the meta-pattern crosses to Tier 1
codification.

**Operational rules within Pattern 7's bypass procedure** (these land
at C3 in `docs/README.md` Folder placement guardrail's bypass
procedure section, NOT here):
- Canonical-source verification at execution time.
- Chronological-reality verification at planning time.
```

**Bucket-structural work decision (absorbed into C6 if natural; deferred to Session 8 with framework if not).** The methodology bucket count tripped the soft threshold of 10 at Session 6.5 closeout; round-2's session-7 brainstorm-time observation queue adds the drift meta-pattern observation as N=11. Sub-categorization adjudication: review the 11 inhabitants at C6 execution time. If natural categories surface (e.g., timing-surface-related observations cluster, drift-discipline observations cluster, fire-count observations cluster), apply sub-categorization within C6 alongside the conventions.md additions. Else defer with framework-naming to Session 8 closeout. The brainstorm doesn't lock the decision; the executor adjudicates at C6 execution time based on actual observation content.

### Path-stability discipline (applies throughout)

V2 → V1 cross-references stabilize at C1's commit. V2 references V1 at its post-elevation path (`docs/07_governance/DOCS_RESTRUCTURE_V1.md`); the path stabilizes at C1's commit and stays canonical thereafter. C2 (V2 creation) writes V2 with the post-elevation V1 path embedded; no separate update step needed.

V2 and the three guardrail surfaces (C3, C4, C5) cite docs that Session 6 will rewrite later by PATH (`docs/02_specs/README.md`, `docs/03_architecture/README.md`, etc.), not by post-rewrite content. Session 6 execution evolves the content under the path; V2 / C3 / C4 / C5 cross-references remain valid because the path is stable.

ADR-0021's Cross-references section currently has a link `docs/restructure-plan.md`; this link's TARGET moves at C1. The Markdown link gets updated to the new path in C1 (path target update, not substantive change to ADR-0021's decision per ADR-0022 forward-only). The prose in ADR-0021 already names the new path ("elevated to docs/07_governance/DOCS_RESTRUCTURE_V1.md at Session 7"); only the link target needs updating.

### Floor-only fire count discipline

Per the drift discipline above, this plan does NOT project the floor-only fire count. The next floor-only carve-out invocation count is established at execution time when the closeout commit's push lands. Session 7 closeout (C7) records the actual count by reading the friction-journal record and incrementing.

Current state at this plan's authoring time: friction-journal records N=5 LIVE post-Session-6.5-execution-push (commit `5195dff`). Session 7 will be the next floor-only push if it dispatches before 5B execution and Session 6 execution push. If 5B/Session 6 execution push first AND qualify (Session 6 execution qualifies; 5B execution has migrations + services so it does NOT qualify), the count adjusts. Executor reads the friction-journal at C7 to determine the actual N, does not project here.

---

## Pre-flight reading

Before starting C1:

- `CLAUDE.md` — standing rules, especially "Project rules and vocabulary" structure (where the new sub-section lands at C5).
- `AGENTS.md` (root) — pre-flight directive.
- `docs/INDEX.md` — full doc tree map; C1 and C2 add entries here.
- `docs/restructure-plan.md` — round-1 architectural brief; the V1 elevation source. Read for the existing structure (Migration Notes, Part 1, Part 2). C1 elevates this.
- `docs/07_governance/CTO_HANDOFF_V2.md` §12 (lines 895+) — DDD rejection. Substrate for V2 Principle 2's architectural framing.
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md` — authority-gradient ratification. Substrate for Principle 3 source-tree surface.
- `docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md` — pre-ratification design spec convention; canonical taxonomy location; round-2 architectural contributions named in Cross-references section.
- `docs/07_governance/adr/0022-adr-lifecycle-workflows.md` — ADR amendment workflows. Referenced in V2 Part 2.
- `docs/03_architecture/folder-structure.md` — canonical source-tree layout (verify lib/ and hooks/ status against this if any forbidden-list assertions surface during execution).
- `docs/03_architecture/authority-gradient.md` — four-layer framing.
- `docs/03_architecture/product-workflow-delivery-mapping.md` — four-maps doc, "Why the four maps stay separate." Referenced in V2 Part 2.
- `docs/02_specs/glossary.md` — Workflow Vocabulary, Product Vocabulary, Delivery Vocabulary subsections. Referenced in V2 Part 2.
- `docs/02_specs/taxonomy.md` — canonical taxonomy. Referenced in V2 Part 2.
- `docs/04_engineering/conventions.md` — current state; substrate for the C6 codification additions.
- `docs/07_governance/round-2/README.md` — meta-arc folder reasoning (substrate for Pattern 7 ratification).
- `docs/07_governance/round-2/2026-05-09-session-6-5-plan.md` — full plan including the brainstorm-context section that captures Issues 1-4 design output. This section is the prior-art substrate for V2's three Principles.
- `docs/07_governance/friction-journal.md` — recent entries, especially Sessions 5A, 5B, 6 brainstorm closeout, 6.5 closeout (substrate for the brainstorm-time observations Session 7 builds on).
- `apps/web/src/README.md` and `apps/web/src/AGENTS.md` — Session 6.5's source-tree guardrail; the apps/web/src/ surface artifact V2 references as N=1 prior-art worked example.

---

## Acceptance criteria

- (a) Plan structure matches Session 6/6.5 ten-section shape (this plan satisfies; execution doesn't change shape).
- (b) Brainstorm-context section is durable substrate (Session 7 execution doesn't need to re-derive from the brainstorm conversation; this plan's `## Brainstorm context` section above is load-bearing).
- (c) Pre-flight reading list is comprehensive (16 artifacts above).
- (d) `docs/07_governance/DOCS_RESTRUCTURE_V1.md` exists at C1 commit; `docs/restructure-plan.md` no longer exists at top-level.
- (e) `docs/07_governance/DOCS_RESTRUCTURE_V2.md` exists at C2 commit with three Parts (Philosophy / Changes from V1 / Migration Map), three Principles (1, 2, 3), Pattern 7 ratification, drift meta-pattern N=2 evidence in Part 2.
- (f) `docs/README.md` has a `## Folder placement guardrail` section at C3 commit; cross-references resolve to V2 via path-level link.
- (g) Repo-root `README.md` has a `## Folder placement` section at C4 commit; cross-references resolve to V2 via path-level link.
- (h) CLAUDE.md has a new `### Folder placement guardrails` sub-section under "Project rules and vocabulary" at C5 commit.
- (i) `docs/04_engineering/conventions.md` has a `## Round-2 Conventions (established 2026-05-MM)` section at C6 commit with four sub-sections (round-N restructure plan workflow, three-category codification taxonomy, "verify before agreeing with alarm" rule, drift meta-pattern at Tier 3 → Tier 2 trajectory).
- (j) `docs/INDEX.md` updated at C1 (entry move from top-level to 07_governance) and C2 (V2 entry added).
- (k) ADR-0021's Cross-references link to `docs/restructure-plan.md` updated at C1 to point at the new V1 path.
- (l) `pnpm typecheck` clean before each commit.
- (m) `pnpm adr:lint` clean before each commit; `pnpm adr:index --check` clean before each commit (ADR-0021 link target update at C1 is a body-text edit, not a frontmatter change, so it does not change the index — verify with `--check`).
- (n) Floor-only push-readiness gate met (zero migrations / zero services / zero integration tests / zero source files / zero test files across the diff) at C7.
- (o) Closeout friction-journal entry inserted at top of `## Phase 2`, recording: Session 7 as the round-2 closing session; V1 elevation + V2 ratification + three guardrail surfaces ratified; drift meta-pattern at N=2 evidence captured in V2 Part 2 (NOT in Principle 3); 5B/Session 6 execution recorded as plan-but-not-executed at V2 ratification time per chronological-reality precedent; bucket-structural work disposition (absorbed into C6 OR deferred to Session 8 with framework — record actual disposition).
- (p) All 7 commits independently revertable; commit boundaries align with the implementation-then-closeout pattern (C1–C6 implementation; C7 closeout).
- (q) Path-level cross-references throughout — V2 cites docs by path, not post-rewrite content (verify with `grep -rn` at execution time).

---

## Push-readiness gate (floor-only carve-out, next invocation)

Floor-only carve-out criteria (per halftime plans push commit `ea22b76`): mechanically defensible for diffs containing zero migrations / zero services / zero integration tests / zero source files / zero test files.

Session 7's diff:

| Criterion | Session 7 status |
|---|---|
| Zero DB migrations | ✓ no `apps/web/sql/` or `supabase/migrations/` changes |
| Zero services | ✓ no `apps/web/src/services/` changes |
| Zero integration tests | ✓ no `apps/web/tests/integration/` changes |
| Zero source files | ✓ no `.ts`/`.tsx` changes |
| Zero test files | ✓ no `.test.ts` changes |

All five criteria met. Diff is markdown-only (V1 move + V2 creation + 3 guardrail-section additions + 1 CLAUDE.md sub-section + 1 conventions.md section + 1 friction-journal entry); floor-only gate applies.

**Floor-only fire count discipline.** Per the drift discipline in the brainstorm context, this plan does NOT project the count. C7 reads the friction-journal at execution time and increments. Reference: friction-journal post-Session-6.5-execution-push records N=5 LIVE.

**Verification protocol:**
- `pnpm db:reset:clean`
- `pnpm agent:validate` (floor-scope: typecheck + URL grep + 5 Category A floor tests; expect 26/26 GREEN)
- Full-suite `pnpm test` NOT invoked.

---

## Stop conditions (keyed to scope-completion milestones)

1. **Session start: verify session-start preconditions, before reading any Session 7 work.** Confirm:
   - HEAD references Session 6.5 closeout commit (`5195dff`) or merged into staging per branch sync. (If 5B execution or Session 6 execution have landed in the meantime, that's fine — the plan is independent of their execution per the chronological-reality discipline.)
   - `pnpm typecheck`, `pnpm adr:lint`, `pnpm adr:index --check` all green.
   - Working tree clean.
   - `docs/restructure-plan.md` exists at top-level (C1 will move it).
   - `docs/07_governance/DOCS_RESTRUCTURE_V1.md` does NOT yet exist (C1 creates it via `git mv`).
   - `docs/07_governance/DOCS_RESTRUCTURE_V2.md` does NOT yet exist (C2 creates it).

   If any verification fails: halt. Resolve at session start; if Session 6.5 closeout introduced unexpected scope, escalate for plan revision before proceeding.

2. **After C1 (V1 elevation), before C2.** Confirm: `docs/07_governance/DOCS_RESTRUCTURE_V1.md` exists with reframed header; `docs/restructure-plan.md` removed from top-level; INDEX.md updated; ADR-0021 Cross-references link target updated; `pnpm adr:lint` and `pnpm adr:index --check` clean; working tree clean.

3. **After C2 (V2 creation), before C3.** Confirm: `docs/07_governance/DOCS_RESTRUCTURE_V2.md` exists with three Parts, three Principles, Pattern 7, drift meta-pattern N=2 in Part 2 (NOT in Principle 3); INDEX.md updated; cross-references in V2 resolve via path-level links (`grep -rn` verification); working tree clean.

4. **After C3 (docs/README.md guardrail), before C4.** Confirm: `docs/README.md` has the new `## Folder placement guardrail` section; existing content preserved (additive, not replace); cross-references to V2 resolve via path-level link; working tree clean.

5. **After C4 (repo-root README extension), before C5.** Confirm: root `README.md` has the new `## Folder placement` section before "## License"; existing content preserved; verify against `ls .` at C4 execution time that the listed structural folders match actual state; cross-references resolve; working tree clean.

6. **After C5 (CLAUDE.md sub-section), before C6.** Confirm: CLAUDE.md has the new `### Folder placement guardrails` sub-section under "Project rules and vocabulary"; sub-section integrates into actual structure (NOT a fabricated "Rule 12"); cross-references resolve; working tree clean.

7. **After C6 (conventions.md additions), before C7.** Confirm: `docs/04_engineering/conventions.md` has the new `## Round-2 Conventions (established 2026-05-MM)` section with four sub-sections; bucket-structural work disposition determined at this point (absorbed into C6 OR deferred to Session 8 with framework — record disposition for C7 closeout); working tree clean.

8. **Pre-C7 floor-only verification.** Confirm: `pnpm db:reset:clean && pnpm agent:validate` reports 26/26 GREEN; `pnpm typecheck` clean; `pnpm adr:lint` and `pnpm adr:index --check` clean.

9. **After C7 (closeout commit), before pushing.** Confirm push-readiness state per the floor-only gate criteria; friction-journal entry inserted with the actual fire count (read from friction-journal at C7 execution time, do NOT project).

---

## Task 1 (C1): V1 elevation

- [ ] Read pre-flight artifacts (full list above).
- [ ] Read `docs/restructure-plan.md` in full to confirm structure before move.
- [ ] `git mv docs/restructure-plan.md docs/07_governance/DOCS_RESTRUCTURE_V1.md`.
- [ ] Edit the moved file's header to reframe as canonical-tier governance:
  - Replace the existing `# Documentation Restructure Plan` H1 + the "Phase 1.1 closeout deliverable. Working artifact, not polished doc." prose with new framing:
  ```markdown
  # DOCS_RESTRUCTURE_V1.md — Round-1 Documentation Reorganization

  **Status:** Ratified V1 (round-1, 2026-04 to 2026-05-08). Elevated
  to canonical-tier governance at round-2 closure (Session 7,
  2026-05-09). Companion document: `DOCS_RESTRUCTURE_V2.md` (round-2
  ratification, this folder).

  **Scope:** V1 ratifies the nine-folder substrate (`00_product/`
  through `09_briefs/`, plus `99_archive/`) that round-2 then
  extended with three Principles, frontmatter conventions, the
  canonical taxonomy, the source-tree authority-layer organization
  per ADR-0020, and the three Principle 3 surface guardrails.

  **Reading order:** V1 establishes the substrate; V2 ratifies the
  round-2 deltas. Read V1 for the round-1 architectural reasoning;
  read V2 for the current canonical state.

  ---
  ```
  (The original "Migration Notes" + "## Part 1 — Philosophy" + "## Part 2 — Target Structure" + remaining content stays as-is per δ-i preservation discipline. The reframed header REPLACES the first 4 lines + 1 blank line; the rest is preserved verbatim.)
- [ ] Update `docs/INDEX.md`:
  - Remove the line: `- restructure-plan.md — Phase 1.1 closeout working plan for the docs reorganization itself; historical context for why the tree is numbered this way. Moves to 99_archive/ when fully retired.`
  - Add an entry under `## 07_governance`: `- DOCS_RESTRUCTURE_V1.md — Round-1 docs reorganization plan, elevated to canonical-tier governance at round-2 Session 7 closure (2026-05-09). Establishes the nine-folder substrate (00_product/ through 09_briefs/ + 99_archive/) that round-2 V2 extends.`
  - (V2 entry added at C2; this commit only touches V1.)
- [ ] Update ADR-0021 Cross-references link target:
  - In `docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md` line ~492, the link `[docs/restructure-plan.md](../../restructure-plan.md)` becomes `[docs/07_governance/DOCS_RESTRUCTURE_V1.md](./DOCS_RESTRUCTURE_V1.md)`. Prose unchanged (the prose already references the new path; only the link target updates).
- [ ] Run `grep -rn "docs/restructure-plan\.md\|\.\./\.\./restructure-plan\.md\|\.\./restructure-plan\.md" docs/` to find any other live cross-references. Friction-journal historical entries are preserved per δ-i; ADR-0021 is the only live cross-reference. If grep surfaces other live cross-references not listed here, halt and surface to operator before continuing.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add docs/07_governance/DOCS_RESTRUCTURE_V1.md docs/INDEX.md docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md` plus the deletion of `docs/restructure-plan.md` (handled automatically by `git mv`).
- [ ] Commit C1:
  ```
  docs(round-2): C1 — V1 elevation to canonical-tier governance

  Elevates docs/restructure-plan.md to docs/07_governance/
  DOCS_RESTRUCTURE_V1.md per Session 7's V1→V2 ratification per
  the round-N restructure plan workflow.

  - git mv docs/restructure-plan.md → docs/07_governance/
    DOCS_RESTRUCTURE_V1.md
  - reframed header: working-artifact framing → canonical-tier
    governance framing; original Part 1 / Part 2 content preserved
    verbatim per δ-i preservation discipline
  - updated docs/INDEX.md: removed top-level entry, added
    07_governance entry
  - updated ADR-0021 Cross-references link target to new V1 path
    (link target only; prose unchanged)

  Forward to C2: V2 creation references V1 at the post-elevation
  path (path stabilized at this commit).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 2: verify file presence + INDEX.md updated + ADR-0021 link updated + working tree clean.

---

## Task 2 (C2): V2 creation

- [ ] Read `docs/07_governance/round-2/2026-05-09-session-6-5-plan.md` brainstorm-context section (lines 13-46) for Principle 3 wording substrate.
- [ ] Read ADR-0021 Cross-references "Round-2 architectural contributions" subsection for Principles 1 and 2 substrate.
- [ ] Draft `docs/07_governance/DOCS_RESTRUCTURE_V2.md` with the following structure:

```markdown
# DOCS_RESTRUCTURE_V2.md — Round-2 Documentation Reorganization Ratification

**Status:** Ratified V2 (round-2, 2026-05-MM). Companion document:
`DOCS_RESTRUCTURE_V1.md` (round-1 substrate, this folder). Round-2
extends V1 with three Principles, frontmatter conventions, canonical
taxonomy consolidation, source-tree authority-layer organization
per ADR-0020, and three surface guardrails (apps/web/src/, docs/,
repo root) per Principle 3.

**Reading order:** V1 establishes the nine-folder substrate; V2
ratifies the round-2 deltas and the three Principles. Read V1 for
substrate reasoning; read V2 for the current canonical state.

---

## Part 1 — Philosophy: Three Principles

### Principle 1: A folder should encode only one canonical axis. Other axes belong in metadata and indexes.

[Full wording per the Brainstorm context section of the Session 7
plan, with worked examples.]

### Principle 2: Top-level folders are document classes, not workflow lineages — with one exception for cross-phase meta-arcs.

[Full wording per the Brainstorm context section, with caught-and-
fixed example (docs/superpowers/) and worked-precedent meta-arc
exception (docs/07_governance/round-2/). Pattern 7 lives at this
principle's exception clause.]

#### Pattern 7: Cross-phase meta-arc folder conditional permission

[Full Pattern 7 ratification text per the Brainstorm context section:
two-case (full bypass vs light bypass), 4/4 precedent-matching test,
canonical first-instance precedent (docs/07_governance/round-2/),
operational rules (canonical-source verification at execution time;
chronological-reality verification at planning time).]

### Principle 3: Folder placement guardrails at high-decision-cost structural surfaces.

[Full wording per the Brainstorm context section. Three surfaces
ratified at V2 with per-surface N=1 evidence:

- apps/web/src/ — N=1 from Session 6.5's source-tree guardrail
  (commit `b98208c`).
- docs/ — N=1 from Session 7 C3 same-session ratification
  (`docs/README.md` Folder placement guardrail).
- Repo root — N=1 from Session 7 C4 same-session ratification
  (root `README.md` Folder placement section).

Per-surface N=1 framing matches the architectural-principle
codification mechanic — principles ratify at N=1 per surface they
apply to, not aggregated across surfaces.

Future surfaces extend Principle 3 by precedent. Surface additions
are amendments to V2, not new principles.]

---

## Part 2 — Changes from V1

[Full enumeration per the Brainstorm context section:

- Four-maps vocabulary as filesystem-encoded (per ADR-0020 +
  product-workflow-delivery-mapping.md).
- Frontmatter-not-folders pattern (per ADR-0021).
- Canonical taxonomy at docs/02_specs/taxonomy.md (per ADR-0021).
- Source-tree guardrail (Session 6.5).
- Pre-ratification design spec location (per ADR-0021).
- ADR amendment workflows (per ADR-0022).
- TypeScript-for-docs-tooling location convention (per ADR-0021).
- Plan-substrate-vs-canonical-reality drift meta-pattern at N=2
  evidence — kept SEPARATE from Principle 3 ratification text per
  the rationale; codification trajectory Tier 3 → Tier 2 (do NOT
  ratify at N=2 prematurely).]

### Drift meta-pattern N=2 evidence

[Full drift meta-pattern content per the Brainstorm context section's
"Drift meta-pattern N=2 evidence" subsection. Two N=2 instances:
- N=1 = Session 6.5 closeout (execution-time, three instances).
- N=2 = Session 7 brainstorm (planning-decision-time, Path A vs
  Path B sequencing).

Codification status: Tier 3 → Tier 2 trajectory. Operational rules
within Pattern 7's bypass procedure carry the discipline at the
operational level; principle-level codification awaits N=3 with
shape match across distinct timing surfaces.]

---

## Part 3 — Migration Map

[Full per-file migration table per the Brainstorm context section's
"V2 Part 3 (Migration Map) substance" subsection. Path-level
cross-references throughout.]

---

## Cross-references

- `docs/07_governance/DOCS_RESTRUCTURE_V1.md` — round-1 substrate.
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md` — source-tree authority-layer organization.
- `docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md` — frontmatter and canonical taxonomy.
- `docs/07_governance/adr/0022-adr-lifecycle-workflows.md` — ADR amendment workflows.
- `docs/02_specs/taxonomy.md` — canonical taxonomy.
- `docs/02_specs/glossary.md` — vocabulary.
- `docs/03_architecture/folder-structure.md` — source-tree layout.
- `docs/03_architecture/authority-gradient.md` — four-layer framing.
- `docs/03_architecture/product-workflow-delivery-mapping.md` — four-maps doc.
- `apps/web/src/README.md` + `apps/web/src/AGENTS.md` — Principle 3
  source-tree surface guardrail (Session 6.5 N=1 evidence).
- `docs/README.md` — Principle 3 docs surface guardrail (C3 N=1).
- Repo-root `README.md` — Principle 3 repo-root surface guardrail
  (C4 N=1).
- CLAUDE.md "Project rules and vocabulary" → "Folder placement
  guardrails" sub-section (C5).
- `docs/04_engineering/conventions.md` § "Round-2 Conventions
  (established 2026-05-MM)" (C6).
```

(The above is structural; the executor expands each [bracketed] section to full prose drawing from the Brainstorm context section of this plan. Total expected length: ~400-600 lines.)

- [ ] Verify path-level cross-references throughout V2:
  - `grep -rn "0[12]_specs/.*\.md\|0[34]_engineering/.*\.md\|03_architecture/.*\.md" docs/07_governance/DOCS_RESTRUCTURE_V2.md` — all references should be path-level (no specific post-rewrite content quoted).
- [ ] Update `docs/INDEX.md` to add the V2 entry under `## 07_governance`:
  - `- DOCS_RESTRUCTURE_V2.md — Round-2 docs reorganization ratification (2026-05-MM). Three Principles, Pattern 7 conditional permission for cross-phase meta-arcs, Migration Map. Companion to DOCS_RESTRUCTURE_V1.md.`
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add docs/07_governance/DOCS_RESTRUCTURE_V2.md docs/INDEX.md`.
- [ ] Commit C2:
  ```
  docs(round-2): C2 — V2 ratification

  Creates docs/07_governance/DOCS_RESTRUCTURE_V2.md ratifying
  round-2's three Principles, Pattern 7 conditional permission for
  cross-phase meta-arcs, and the Migration Map.

  - Part 1: Three Principles (canonical-axis; document-class-not-
    workflow-lineage with meta-arc exception; folder-placement
    guardrails at high-decision-cost structural surfaces).
  - Part 1: Pattern 7 ratification text (two-case conditional
    permission, 4/4 precedent-matching test, operational rules in
    bypass procedure).
  - Part 2: Changes from V1 (frontmatter conventions, taxonomy
    consolidation, source-tree authority-layer per ADR-0020, ADR
    upgrade per ADR-0021/0022, drift meta-pattern at N=2 evidence
    kept separate from Principle 3 per Tier 3 → Tier 2 trajectory).
  - Part 3: Migration Map (per-file table; path-level cross-
    references).

  Per-surface N=1 evidence framing: apps/web/src/ cites Session 6.5
  prior-art; docs/ and repo root cite C3/C4 same-session outputs.
  Aggregation across surfaces NOT required.

  Forward to C3-C5: three guardrail surfaces ratify Principle 3.
  Forward to C6: round-2 conventions codify at conventions.md.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 3: verify V2 + INDEX update + path-level cross-references + working tree clean.

---

## Task 3 (C3): docs/README.md Folder placement guardrail

- [ ] Read `docs/README.md` (current 23-line orientation file) in full.
- [ ] Edit `docs/README.md` to ADD a new section after the existing `## Current phase` section:

```markdown

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
  methodology arc, sprint, or work-grouping is wrong. Caught-and-
  fixed example: `docs/superpowers/` (workflow-lineage folder
  migrated in round-2 Session 5A; specs/ and plans/ contents
  redistributed to per-phase `09_briefs/<phase>/specs/` +
  `09_briefs/<phase>/plans/`).
- **Phase-vocabulary folders at top-level.** A folder like
  `docs/phase-1/` is wrong; phase work goes to
  `09_briefs/phase-N/`. Phase folders are session-bounded artifacts,
  not document classes.
- **Document-class folders that don't match the canonical numbered
  taxonomy.** New top-level document-class folders require an ADR
  ratifying the addition.

### Decision rule for ambiguous cases

If your case doesn't clearly match a permitted pattern AND doesn't
clearly violate a forbidden pattern: file an ADR before creating
the folder. The ADR ratifies the new pattern; the folder follows
the ADR.

### Bypass procedure: Pattern 7 conditional permission for cross-phase meta-arcs under `07_governance/`

Cross-phase meta-arc folders under `07_governance/` are conditionally
permitted under Pattern 7 (per V2 Part 1):

**First-instance bypass (full):**
- Folder README answering the document-class questions.
- Friction-journal entry as N=1 evidence of the meta-arc shape.
- Operator acknowledgment in the commit body.

**Follows-precedent bypass (light):**
- Folder README answering the same questions plus a 4/4
  precedent-matching checklist citing precedent.
- One-line friction-journal entry citing the precedent.
- Commit body cites the precedent. No fresh operator acknowledgment.

**4/4 precedent-matching test (light bypass):**
1. Precedent README answers document-class questions.
2. New README answers the same questions citing precedent.
3. Cross-phase scope / durable identity / closure criteria /
   governance-surface placement match.
4. Naming structurally consistent (e.g., `round-N/`).

**Canonical first-instance precedent:** [`07_governance/round-2/`](07_governance/round-2/)
(round-2 docs reorganization meta-arc).

**Pattern 7's bypass procedure carries two operational rules:**

- **Canonical-source verification at execution time.** When
  implementing a bypass, verify against canonical sources (V2,
  taxonomy.md, folder-structure.md, etc.) at the moment of writing
  rather than from memory or plan-internal substrate. Plan-internal
  brainstorm-context is design substrate; canonical docs are the
  ratified source.
- **Chronological-reality verification at planning time.** When
  drafting forward-looking content (fire counts, sequence
  assumptions, "after X session executes" projections), don't
  project; reference the current ratified state and let
  execution-time verification establish the count when the artifact
  lands.

AI agents may not unilaterally bypass without operator
acknowledgment in the commit body.

### Cross-references

- [`07_governance/DOCS_RESTRUCTURE_V2.md`](07_governance/DOCS_RESTRUCTURE_V2.md) — Principles 1, 2, 3 ratification + Pattern 7.
- [`02_specs/taxonomy.md`](02_specs/taxonomy.md) — canonical taxonomy.
- [`07_governance/adr/0021-adr-frontmatter-and-tooling.md`](07_governance/adr/0021-adr-frontmatter-and-tooling.md) — frontmatter conventions and round-2 architectural contributions.
- [`07_governance/round-2/README.md`](07_governance/round-2/README.md) — meta-arc folder document-class README (Pattern 7 first-instance precedent).
```

- [ ] Verify cross-references resolve via path-level links: `grep -rn "07_governance/DOCS_RESTRUCTURE_V2\.md\|02_specs/taxonomy\.md\|07_governance/round-2" docs/README.md`.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add docs/README.md`.
- [ ] Commit C3:
  ```
  docs(round-2): C3 — docs/ Folder placement guardrail

  Adds the docs/ surface Principle 3 ratification per V2.

  - Permitted patterns: canonical numbered taxonomy + sub-folders
    under single-axis encoding.
  - Forbidden patterns: workflow-lineage folders (caught-and-fixed
    example: docs/superpowers/ Session 5A); phase-vocabulary folders
    at top-level; document-class folders outside the taxonomy.
  - Decision rule: file an ADR for ambiguous cases.
  - Bypass procedure: Pattern 7 conditional permission for
    cross-phase meta-arcs under 07_governance/. Two operational
    rules in the bypass procedure: canonical-source verification at
    execution time + chronological-reality verification at planning
    time (drift meta-pattern at operational rule level).
  - Cross-references: V2, taxonomy, ADR-0021, round-2 README
    (path-level throughout).

  Per Principle 3's per-surface N=1 mechanic, this commit is the
  docs/ surface's N=1 evidence (same-session ratification).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 4: verify section addition + cross-references resolve + working tree clean.

---

## Task 4 (C4): Repo-root README.md Folder placement section

- [ ] Verify execution-time top-level enumeration with `ls .`. Compare to brainstorm-time list (`apps/`, `packages/`, `supabase/`, `scripts/`, `docs/`, `eslint-rules/`, `.coordination/`); adjust if drift.
- [ ] Read root `README.md` to confirm current structure (84 lines; ends with "## License" section).
- [ ] Edit root `README.md` to ADD a new section before `## License`:

```markdown

## Folder placement

Folder placement decisions at the repo root are governed by
Principles 1, 2, and 3 ratified at
[`docs/07_governance/DOCS_RESTRUCTURE_V2.md`](docs/07_governance/DOCS_RESTRUCTURE_V2.md).
Before creating any new top-level folder, read this section.

### Permitted top-level structural folders

Verified against `ls .` at 2026-05-MM:

- `apps/` — workspace applications (`@chounting/web`, `@chounting/demo`).
- `packages/` — workspace packages (`@chounting/tokens`, `@chounting/ui`).
- `supabase/` — DB migrations + supabase config.
- `scripts/` — cross-repo shell + TypeScript tooling.
- `docs/` — product / spec / architecture / engineering / governance
  / brief documentation.
- `eslint-rules/` — custom ESLint rules.
- `.coordination/` — cross-session coordination locks.

A new top-level structural folder requires an ADR ratifying the
addition.

### Out-of-scope folders (tooling / system-managed)

The following are gitignored or system-managed; not subject to
Principle 3:

- `.git/`, `.github/`, `.turbo/`, `node_modules/`
- `logs/`, `reports/`, `test-results/`
- `.claude/` (mostly gitignored; `.claude/skills/` and
  `.claude/settings.json` are tracked per ADR-0020 Decision item 9)

Plus repo-root config files: `.gitattributes`, `.gitignore`,
`.mcp.json`, `.nvmrc`, `package.json`, `pnpm-lock.yaml`,
`pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.base.mjs`,
`turbo.json`, plus the three top-level docs (`README.md`,
`AGENTS.md`, `CLAUDE.md`).

### Decision rule + bypass

For permitted top-level folders, see V2 Part 1 Principle 2 (top-
level folders are document classes, not workflow lineages). For
the docs/ surface specifically, see [`docs/README.md`](docs/README.md).
For the apps/web/src/ surface, see
[`apps/web/src/README.md`](apps/web/src/README.md).

The bypass procedure (Pattern 7 for cross-phase meta-arcs under
`docs/07_governance/`) is documented at V2 Part 1; the operational
rules (canonical-source verification at execution time +
chronological-reality verification at planning time) apply to all
bypasses regardless of surface.
```

- [ ] Verify cross-references resolve: `grep -rn "DOCS_RESTRUCTURE_V2\|docs/README\.md\|apps/web/src/README\.md" README.md`.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add README.md`.
- [ ] Commit C4:
  ```
  docs(round-2): C4 — repo-root README Folder placement section

  Adds the repo-root surface Principle 3 ratification per V2.

  - Permitted top-level structural folders (verified against ls at
    execution time): apps/, packages/, supabase/, scripts/, docs/,
    eslint-rules/, .coordination/.
  - Out-of-scope tooling/system folders enumerated.
  - Cross-references: V2 (canonical guardrail), docs/README.md
    (docs surface), apps/web/src/README.md (source-tree surface).

  Per Principle 3's per-surface N=1 mechanic, this commit is the
  repo-root surface's N=1 evidence (same-session ratification).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 5: verify section addition + ls match + cross-references resolve + working tree clean.

---

## Task 5 (C5): CLAUDE.md sub-section under "Project rules and vocabulary"

- [ ] Read CLAUDE.md to confirm "Project rules and vocabulary" section structure (currently lists canonical sources; ends with the paragraph "When starting work, identify which concern your task touches and read the canonical source. Do not re-derive these rules from conversation context.").
- [ ] Edit CLAUDE.md to ADD a new sub-section between the canonical-source list and the closing paragraph:

```markdown

### Folder placement guardrails

Three surface guardrails ratify Principle 3 (folder placement
guardrails at high-decision-cost structural surfaces) per
`docs/07_governance/DOCS_RESTRUCTURE_V2.md` Part 1:

- **`apps/web/src/README.md`** — source-tree authority-layer
  guardrail per ADR-0020.
- **`docs/README.md`** — docs-tree document-class guardrail.
- **Repo-root `README.md`** — repo-root structural-folder
  guardrail.

Before creating any folder at one of these surfaces, read the
relevant guardrail. The bypass procedure (Pattern 7 conditional
permission for cross-phase meta-arcs under `07_governance/`)
carries two operational rules: canonical-source verification at
execution time AND chronological-reality verification at planning
time. AI agents may not unilaterally bypass without operator
acknowledgment in the commit body.

Worked examples: `docs/superpowers/` migration (Session 5A,
caught-and-fixed Principle 2 violation); `docs/07_governance/round-2/`
(canonical first-instance Pattern 7 precedent).
```

- [ ] Verify the sub-section integrates into actual CLAUDE.md structure (NOT a fabricated "Rule 12"; lands as `### Folder placement guardrails` under `## Project rules and vocabulary`).
- [ ] Verify cross-references resolve: `grep -n "DOCS_RESTRUCTURE_V2\|07_governance/round-2" CLAUDE.md`.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add CLAUDE.md`.
- [ ] Commit C5:
  ```
  docs(round-2): C5 — CLAUDE.md folder placement guardrails sub-section

  Adds a new ### Folder placement guardrails sub-section under
  ## Project rules and vocabulary, pointing at the three surface
  guardrails ratified by V2 Part 1 Principle 3.

  - Three surfaces: apps/web/src/README.md, docs/README.md, root
    README.md.
  - Bypass procedure: Pattern 7 with two operational rules
    (canonical-source verification at execution time + chronological-
    reality verification at planning time).
  - Worked examples: docs/superpowers/ migration; round-2/ precedent.

  Sub-section integrates into CLAUDE.md's actual idiom (NOT a
  fabricated Rule 12).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 6: verify sub-section addition + integration into existing structure + cross-references resolve + working tree clean.

---

## Task 6 (C6): conventions.md Round-2 Conventions section

- [ ] Read `docs/04_engineering/conventions.md` head sections to confirm structure and identify insertion point. The new section lands after `## Phase 1.2 Conventions (established 2026-04-19)` and before `## Documentation Routing`, matching the Phase-X Conventions section pattern.
- [ ] Draft the new section. Insertion point is between the last Phase 1.2 sub-section and the `## Documentation Routing` header. The new section structure:

```markdown

## Round-2 Conventions (established 2026-05-MM)

Codified during round-2 docs reorganization (2026-04 to 2026-05-MM)
per `docs/07_governance/DOCS_RESTRUCTURE_V2.md`. Round-2 ratified
three Principles plus four operational conventions captured here.

### Round-N restructure plan workflow

Round-N docs reorganization arcs follow a stable artifact pattern:

- Arc-level brief lives at the docs root during the arc (e.g.,
  `docs/restructure-plan.md` for round-1's V1, until elevated).
- Session-level plans live at the meta-arc folder
  (`docs/07_governance/round-N/`).
- At arc closure, the arc-level brief elevates to
  `docs/07_governance/DOCS_RESTRUCTURE_V<N>.md` alongside the new
  `DOCS_RESTRUCTURE_V<N+1>.md` (which becomes the V1 source for the
  NEXT round).

The meta-arc folder under `07_governance/round-N/` is a Pattern 7
conditional-permission case (cross-phase meta-arc exception to
Principle 2 of V<N>.md). First-instance precedent:
`docs/07_governance/round-2/`.

### Three-category codification taxonomy

Codification thresholds vary by category. The artifact-codification
relationship is the load-bearing distinction:

- **Architectural principle.** Ratification IS codification. The
  principle's text in V<N>.md (or in an ADR) is the canonical record
  at the moment of ratification. Threshold: N=1 per surface the
  principle applies to. Aggregation across surfaces is NOT required —
  each surface independently meets N=1. Worked examples: Principles 1,
  2, 3 in DOCS_RESTRUCTURE_V2.md; ADR-0020's authority-gradient
  source organization.
- **Procedural pattern.** Artifact's existence documents the
  convention. The convention is in the artifact itself; reading the
  artifact teaches the pattern. Threshold: N=1 establishes; N=2
  confirms; codification often coincides with artifact creation.
  Worked examples: ADR `## Amendment` block format (per ADR-0022);
  friction-journal entry shape; round-N session-plan filename
  convention.
- **Process meta-pattern.** Artifact is decoupled from codification.
  The pattern operates on processes (how decisions get made, how
  drift gets caught, how sequences get verified) rather than on
  artifacts. Threshold: N=2 with shape match across distinct timing
  surfaces or distinct contexts; N=3 confirms. Codification gates
  must catch shape-match across instances, not just count. Worked
  examples: plan-substrate-vs-canonical-reality drift meta-pattern
  (N=2; not yet codified to a principle).

### "Verify the artifact before agreeing with an alarm" rule

When someone (operator, agent, doc) raises an alarm about an
artifact's state, verify against the artifact directly before
responding. Don't agree with the alarm based on memory of the prior
state; read the artifact at alarm-time.

Worked example: Session 6.5 plan claimed `lib/` was forbidden in the
authority-layer enumeration; canonical `folder-structure.md` actually
lists `lib/` as a permitted forward-looking layer. Executor verified
against folder-structure.md (canonical) before drafting; canonical
won.

Failure mode this prevents: "agent agrees with the alarm because the
operator raised it" — propagating a misreading because the alarm
felt authoritative. The discipline is: verify directly, then respond.
The alarm-raiser may be right; the artifact is the tiebreaker.

### Plan-substrate-vs-canonical-reality drift meta-pattern (Tier 3 → Tier 2 codification trajectory)

Forward projections embedded in plans, handoffs, or brainstorm-
context sections drift from canonical reality at execution time. The
meta-pattern fires across multiple timing surfaces:

- **Execution-time surface:** plan-internal substrate (forbidden
  lists, header styles, fire counts) drifts from canonical docs
  (folder-structure.md, friction-journal pattern, chronological fire
  history).
- **Planning-decision-time surface:** handoff sequence projections
  drift from chronological reality (sequence didn't materialize).
- **Cross-reference-time surface:** forward references to post-
  rewrite content drift from current-state content (mitigated by
  path-level cross-references; see operational rule below).

Current evidence count: N=2 (per V2 Part 2 record).

- N=1 = Session 6.5 closeout (execution-time, three instances under
  one meta-pattern observation).
- N=2 = Session 7 brainstorm (planning-decision-time, the Path A vs
  Path B sequence question).

**Codification status: Tier 3 → Tier 2 trajectory; not ratified to a
principle at N=2.** Codification gates: N=3 with shape match across
three distinct timing surfaces. The cross-reference-time surface
needs an N=1 instance before the meta-pattern crosses to Tier 1
codification.

**Operational rules within Pattern 7's bypass procedure** (these
land at `docs/README.md` Folder placement guardrail's bypass
procedure section, not at the principle level):

- Canonical-source verification at execution time.
- Chronological-reality verification at planning time.

```

- [ ] Bucket-structural work review (per the Brainstorm context's "Bucket-structural work decision" subsection): review the methodology bucket's 11 inhabitants. If natural sub-categories surface, apply sub-categorization within this section as a fifth sub-section "### Methodology bucket sub-categorization". If no natural categories surface, defer to Session 8 with the framework named in C7's closeout entry. Record the disposition for C7.
- [ ] Verify cross-references in the new section resolve (path-level): `grep -n "DOCS_RESTRUCTURE_V2\|07_governance/round-2\|folder-structure" docs/04_engineering/conventions.md | tail -20`.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add docs/04_engineering/conventions.md`.
- [ ] Commit C6:
  ```
  docs(round-2): C6 — conventions.md round-2 codifications

  Adds ## Round-2 Conventions (established 2026-05-MM) section at
  conventions.md per V2 Part 2's procedural-pattern codifications.

  Four sub-sections:
  - Round-N restructure plan workflow.
  - Three-category codification taxonomy (architectural principle /
    procedural pattern / process meta-pattern; thresholds and
    artifact-codification relationship).
  - "Verify the artifact before agreeing with an alarm" rule.
  - Plan-substrate-vs-canonical-reality drift meta-pattern at Tier 3
    → Tier 2 trajectory; do NOT ratify at N=2 prematurely;
    operational rules live within Pattern 7's bypass procedure at
    docs/README.md.

  Bucket-structural work disposition: [absorbed into this section as
  fifth sub-section / deferred to Session 8 with framework — record
  actual disposition].

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 7: verify section addition + bucket-structural disposition recorded + cross-references resolve + working tree clean.

---

## Task 7 (C7): Floor-only verification + closeout commit

- [ ] `pnpm db:reset:clean`.
- [ ] `pnpm agent:validate` (expect 26/26 GREEN).
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stop condition 8: verify floor-only output.
- [ ] Verify friction-journal heading structure. Open `docs/07_governance/friction-journal.md` and confirm the active-section heading is `## Phase 2` (matches Sessions 5/6/6.5 closeout placement); if shifted, place under the current active-section heading and note the shift in the closeout entry.
- [ ] Read the friction-journal at the top of `## Phase 2` to determine the actual floor-only fire count post-this-push. Per the drift discipline, do NOT project — read the most recent entry's recorded count and increment by 1.
- [ ] Insert friction-journal closeout entry at top of the active-section heading. Structure (matching Sessions 5A/5B/6/6.5 closeout shape):

```
- 2026-05-MM NOTE — Round-2 docs reorganization Session 7 closeout
  (V2 ratification + V1 elevation + remaining guardrail surfaces);
  files landed across seven commits: V1 elevation (C1), V2 creation
  (C2), docs/README.md guardrail (C3), repo-root README extension
  (C4), CLAUDE.md sub-section (C5), conventions.md round-2 section
  (C6), this closeout (C7). Closes round-2 docs reorganization.

  **Locked decisions (round-2 closeout-grade):**
  - V2 Part 1 ratifies three Principles: canonical-axis (Principle
    1), document-class-not-workflow-lineage with meta-arc exception
    (Principle 2), folder-placement guardrails at high-decision-cost
    structural surfaces (Principle 3).
  - Pattern 7 conditional permission for cross-phase meta-arcs under
    07_governance/ ratifies at V2 Part 1 with two operational rules
    in the bypass procedure (canonical-source verification at
    execution time; chronological-reality verification at planning
    time). Operational rules live at the bypass-procedure level, NOT
    Principle 3 ratification.
  - V2 Part 2 captures plan-substrate-vs-canonical-reality drift
    meta-pattern as N=2 evidence (Session 6.5 execution-time + this
    brainstorm's planning-decision-time). Tier 3 → Tier 2
    trajectory; NOT ratified to a principle at N=2.
  - V2 Part 3 Migration Map enumerates round-2 migrations including
    Session 6.5's apps/web/src/ guardrail.
  - Per-surface N=1 framing: each Principle 3 surface (apps/web/src/,
    docs/, repo root) independently meets N=1; aggregation across
    surfaces NOT required. apps/web/src/ cites Session 6.5 prior-
    art; docs/ and repo root cite C3/C4 same-session outputs.
  - C5 lands a CLAUDE.md ### Folder placement guardrails sub-section
    under "Project rules and vocabulary"; integrates into actual
    idiom (NOT a fabricated Rule 12).
  - C6 codifies four round-2 conventions at conventions.md. Bucket-
    structural work disposition: [record actual: absorbed into C6 as
    fifth sub-section OR deferred to Session 8 with framework].

  **5B execution and Session 6 execution recorded as plan-but-not-
  executed at V2 ratification time** (per the chronological-reality
  precedent established at Session 6.5 closeout):
  - 5B execution (Layer 1 + Layer 2 migrations): pending; lands as
    cleanup post-V2 (likely Session 8). 5B execution does NOT
    qualify for floor-only carve-out (has migrations + services).
  - Session 6 execution (four-README rewrites + doc-class pattern
    propagation): pending; lands as cleanup post-V2 (likely Session
    8). Session 6 execution DOES qualify for floor-only.
  - V2 ratification operates on design substrate (Principles,
    Pattern 7, Migration Map, V1 elevation), all of which are on
    disk regardless of 5B/6 execution status. Path-level cross-
    references throughout V2/C3/C4 mean 5B/6 execution can land
    later without invalidating V2's references.

  **Brainstorm-time observations:**
  - **Path-level cross-references discipline applied throughout V2
    + C3/C4/C5.** Verified at execution time via grep-sweeps. No
    cross-reference cites post-rewrite content; all cross-references
    cite paths. The cross-reference-time surface of the drift meta-
    pattern is mitigated by this discipline; an N=1 instance of
    drift catching at the cross-reference-time surface would advance
    the meta-pattern to Tier 1 codification candidacy.
  - **Floor-only carve-out at N=[actual; read from journal at
    execution time and increment].** [If first fire after Session
    6.5 in chronological terms: invocation outside docs/ territory
    streak continues; structural-coverage data point.] [If 5B/6
    execution landed first: the count adjusts per chronological
    reality.]
  - **Round-2 closes at this push.** Round-2 spanned Sessions 1
    through 7 (with 5B and 6 brainstorm + 6.5 execution interim
    landing during the arc; 5B and 6 execution as post-closure
    cleanup). The meta-arc folder docs/07_governance/round-2/
    becomes a historical archive at this point per the meta-arc
    folder convention.
  - **N=2 of plan-substrate-vs-canonical-reality drift meta-pattern
    captured in V2 Part 2.** Tier 3 → Tier 2 codification
    trajectory; awaiting N=3 with shape match for principle-level
    ratification. Cross-reference-time surface needs an N=1 instance
    before crossing to Tier 1.
  - **Recurring meta-arc placement question N=1 — ratification gaps
    cause recurring questions.** The "should we move
    docs/07_governance/round-2/" question surfaced multiple times
    during round-2 (in brainstorm conversations, in plan-vs-canonical
    drift catches at 6.5, in Session 7's brainstorm). Each surfacing
    was resolved ad-hoc by reaffirming the canonical-first-instance
    precedent framing without codified ratification. V2 Part 1's
    Pattern 7 ratification + the "Don't move round-2/" hard
    constraint in this plan close the gap. The meta-observation:
    when a question recurs across sessions, the underlying
    ratification gap is the cause. N=1 evidence for the discipline
    that recurring questions are diagnostic of ratification gaps;
    Tier 3 entry; codification candidacy at second fire (a future
    round-N or arc-X recurring question would advance to N=2).
  - **Friction-journal heading-structure verification result.**
    [Record actual: ## Phase 2 was the active section, OR the
    structure had shifted to <heading>.]

  **Pre-codification observation queue post-Session-7 closeout:**
  - Tier 1 LIVE: Floor-only push gate carve-out at N=[actual]; round-
    2 conventions codified at conventions.md (so they advance from
    Tier 1 candidates to ratified). Methodology cluster bucket
    [absorbed into C6 / deferred to Session 8].
  - Tier 2: drift meta-pattern at N=2 advances Tier 3 → Tier 2.
  - Other tiers: status reaffirmed; no changes.

  **Push-readiness gate (per CLAUDE.md three-condition gate, floor-
  only carve-out path, [N=actual] invocation):**
  - Condition 1 (test-suite health): GREEN under floor-only path.
    pnpm db:reset:clean && pnpm agent:validate reports 26/26.
  - Condition 2 (doc-sync): GREEN. Diff is V1 move + V2 + 3
    guardrail-section additions + 1 CLAUDE.md sub-section + 1
    conventions.md section + this entry; no canonical doc edits
    beyond round-2 ratification scope; cross-references resolve via
    path-level links.
  - Condition 3 (governance closeout): this entry; carry-forwards
    captured below.

  **Forward pointers:**
  - Session 8 (post-round-2 cleanup): inherits 5B execution + Session
    6 execution + (if deferred) bucket-structural sub-categorization.
    Session 8 plan lands at docs/09_briefs/<phase>/plans/ if 5B/6
    execution is phase-N work, OR at docs/07_governance/post-round-2/
    (or similar) if the cleanup is governance-shape work. The
    placement decision adjudicates at Session 8 brainstorm time.
  - Round-2 closure does NOT close 5B/6 execution; those are
    independent execution sessions whose plan substrate is committed
    and whose execution is unblocked by V2 ratification at this
    closeout.
  - Future restructure rounds (round-3, etc.) follow the round-N
    workflow per conventions.md C6: arc-level brief at docs root;
    session plans at meta-arc folder; arc closure elevates V<N> to
    07_governance/ alongside V<N+1>.
```

- [ ] Commit C7:
  ```
  docs(round-2): C7 — Session 7 closeout / round-2 closure

  Closes round-2 docs reorganization. V2 ratified at C2;
  V1 elevated at C1; three Principle 3 guardrail surfaces ratified
  at C3/C4/C5; round-2 conventions codified at C6.

  Notable observations:

  - Path-level cross-references discipline applied throughout V2 +
    C3/C4/C5; verified via grep-sweeps. No cross-reference cites
    post-rewrite content. The cross-reference-time surface of the
    drift meta-pattern is mitigated by this discipline.
  - Per-surface N=1 framing for Principle 3: apps/web/src/ from
    Session 6.5 prior-art; docs/ and repo root from C3/C4 same-
    session ratification. Aggregation across surfaces NOT required.
  - 5B execution and Session 6 execution recorded as plan-but-not-
    executed at V2 ratification time per the chronological-reality
    precedent established at Session 6.5 closeout. V2 ratification
    operates on design substrate, not execution outputs.
  - Drift meta-pattern at N=2 evidence captured in V2 Part 2
    (separately from Principle 3); Tier 3 → Tier 2 codification
    trajectory; not ratified to a principle at N=2 prematurely.
  - Floor-only carve-out at N=[actual; read at execution time].
  - Round-2 closes at this push; meta-arc folder
    docs/07_governance/round-2/ becomes historical archive.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 9: verify push-readiness state.
- [ ] Push to staging: `git push origin staging`.

---

## Self-review checklist (run before declaring plan complete)

- [ ] All three Principles ratified in V2 Part 1 with full wording (canonical-axis, document-class-not-workflow-lineage with meta-arc exception, folder-placement guardrails at high-decision-cost structural surfaces).
- [ ] Pattern 7 ratification text covers two cases (full bypass + light bypass), 4/4 precedent-matching test, canonical first-instance precedent (round-2/), and two operational rules in bypass procedure.
- [ ] V2 Part 2 captures drift meta-pattern at N=2 evidence SEPARATELY from Principle 3 ratification text; codification trajectory Tier 3 → Tier 2; not ratified at N=2.
- [ ] V2 Part 3 Migration Map enumerates all round-2 migrations including Session 6.5's apps/web/src/ work; path-level cross-references throughout.
- [ ] Per-surface N=1 framing: apps/web/src/ cites Session 6.5 prior-art; docs/ and repo root cite C3/C4 same-session outputs; aggregation NOT required.
- [ ] CLAUDE.md sub-section integrates into "Project rules and vocabulary" (NOT a fabricated "Rule 12").
- [ ] Conventions.md round-2 section has four sub-sections (round-N workflow, three-category taxonomy, "verify before agreeing with alarm", drift meta-pattern at Tier 3 → Tier 2); bucket-structural disposition decision recorded.
- [ ] 5B/Session 6 execution treated as plan-but-not-executed at V2 ratification time; not as preconditions; cleanup work disposition framework captured for Session 8.
- [ ] Path-level cross-references throughout V2, C3, C4, C5 (no post-rewrite content cited).
- [ ] Floor-only fire count NOT projected; C7 reads journal at execution time and increments.

---

## Notes for executor

- **The Brainstorm context section is durable substrate.** Session 7 execution does not re-derive content from this plan's authoring conversation. Each Task draws from the corresponding Brainstorm context subsection (Principle wording, Pattern 7 framing, V2 Part substance, content sketches for C3/C4/C5/C6). Read Brainstorm context fully before starting.

- **Path-level cross-references are load-bearing.** Verify with `grep -rn` after each commit that cites docs that Session 6 will rewrite later. Cite the path (`docs/02_specs/README.md`), not specific post-rewrite sentences. The path is stable; the content target evolves under it. This applies throughout V2 Part 3 (Migration Map), the three guardrail surfaces' cross-reference sections, and C6's conventions.md additions.

- **Per-surface N=1 evidence framing is load-bearing.** Each Principle 3 surface meets N=1 independently; V2 does NOT aggregate across surfaces. This is the architectural-principle codification mechanic ratified at C6's three-category codification taxonomy. apps/web/src/ has N=1 from Session 6.5 prior-art; docs/ and repo root meet N=1 at C3 and C4 same-session ratification.

- **Drift meta-pattern stays separate from Principle 3.** Principle 3's load-bearing surface is "guardrails at structural surfaces" (folder placement at high-decision-cost structural locations). The drift meta-pattern is "projection-vs-reality discipline at multiple timing surfaces" (execution time, planning-decision time, cross-reference time). Conflating them dilutes Principle 3 AND ratifies the drift meta-pattern at N=2 prematurely. The drift meta-pattern lands as N=2 evidence in V2 Part 2 (Changes from V1) AND as operational rules within Pattern 7's bypass procedure at C3 (`docs/README.md` Folder placement guardrail). NOT as a Principle 3 expansion. NOT as a principle ratified at N=2.

- **Bucket-structural work absorbs into C6 if natural; deferred to Session 8 with framework if not.** Review the methodology bucket's 11 inhabitants at C6 execution time. If natural sub-categories surface (e.g., timing-surface-related observations cluster, drift-discipline observations cluster, fire-count observations cluster), apply sub-categorization within C6. Else defer with framework-naming to Session 8 closeout. The brainstorm doesn't lock the decision; the executor adjudicates at C6 execution time. Either disposition lands cleanly; the C7 closeout records the actual outcome.

- **Floor-only fire count is read at execution time, not projected.** Per the drift meta-pattern's chronological-reality verification operational rule, C7 reads the friction-journal at execution time and increments by 1. Reference: friction-journal post-Session-6.5-execution-push records N=5 LIVE. If 5B execution and Session 6 execution have NOT pushed by Session 7 execution time, this push is N=6 chronologically. If 5B has pushed (does NOT qualify for floor-only) and Session 6 execution has pushed (DOES qualify), Session 7 push is N=7. The executor reads the journal at execution time and uses the actual count.

- **Closeout friction-journal entry: structure matches Session 5A/5B/6/6.5 closeout shape** (locked decisions, brainstorm-time observations, observation-queue updates, push-readiness gate, forward pointers). Carry-forwards section is load-bearing — Session 8 (post-round-2 cleanup) draws from this entry.

- **Round-2 closes at this push.** The meta-arc folder `docs/07_governance/round-2/` becomes a historical archive at C7 push. Future round-N work creates `docs/07_governance/round-N/` per the round-N workflow convention codified at C6.

- **5B/Session 6 execution remain pending; do NOT block round-2 closure.** Both have plans committed; both can land independently of V2 ratification per the chronological-reality precedent. The Session 8 plan adjudicates whether they land together (single Session 8 plan) or separately (Session 8a / Session 8b plans).

- **Pre-commit hook session-lock warning is informational.** As at Session 6.5, the hook fires if no session lock is in use; this is an informational warning, not a blocker. Per the operator's prior pattern, proceed without invoking session-lock unless the warning becomes a blocker.

- **If any acceptance criterion fails verification at a Stop condition: halt and surface to operator.** Do NOT attempt to resolve mid-stream by adjusting V2 / C3-C5 / C6 content beyond the explicit content sketches in the Brainstorm context section. The Brainstorm context is design substrate; deviations require operator confirmation before landing.
