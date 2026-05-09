# Session 6.5: Source-Tree Folder-Placement Guardrail Interim Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round-2 Session 6.5 — close the active risk window at `apps/web/src/` by landing a single source-tree folder-placement guardrail (`apps/web/src/README.md` substantive + `apps/web/src/AGENTS.md` terse pre-flight directive) ahead of Session 7's V2 ratification. The interim closes the Phase 1 (Storage/Evidence Core) onset risk: ADR-0020's authority-gradient discipline is recent and not yet load-bearing in any README at the surface itself, and a Phase 1 session creating folders under `src/` could ship a wrong placement before noticing. Session 7 then ratifies Principle 3 and absorbs the remaining surfaces (`docs/`, repo root, CLAUDE.md sub-section) into V2.

**Architecture:** 2 commits applied at session level. C1: drop the two new files (`apps/web/src/README.md` + `apps/web/src/AGENTS.md`). C2: closeout friction-journal entry. Total: 2 commits — count varies (1 implementation rather than 2-4) per the focused interim work-shape; structural pattern (implementation-then-closeout) holds.

**Tech Stack:** Write tool, `grep -rn` for cross-reference verification, bash for floor-only verification.

---

## Brainstorm context (forward to Session 7)

This section captures the design output from the brainstorm that produced this interim. Session 7's V2 ratification draws from this section without re-deriving from conversation transcript.

### Principle 3 (tightened wording, ratifies in V2 at Session 7)

**Folder placement guardrails at high-decision-cost structural surfaces.** Folder placement decisions happen at the surface where the folder is created. When the canonical taxonomy lives elsewhere, the rule isn't readable at the moment of decision, and wrong placements ship with thoughtful rationale that violates principles the rationale couldn't see. The mitigation is a guardrail README at each high-decision-cost structural surface that documents what's permitted, what's forbidden, the decision rule for ambiguous cases, and the bypass procedure.

Three surfaces ratified in V2:

1. **`apps/web/src/`** — `apps/web/src/README.md` authority-layer guardrail (per ADR-0020). Permitted: `agent`, `app`, `components`, `contracts`, `core`, `db`, `middleware`, `services`, `shared`. Forbidden: `utils/`, `lib/`, `modules/<feature>/`, anything that introduces a non-authority-layer top-level folder under `src/`. **Lands in Session 6.5 (this plan).**
2. **`docs/`** — `docs/README.md` Folder placement guardrail. Caught-and-fixed example: `docs/superpowers/` (workflow-lineage folder migrated in round-2 Session 5A). Worked-precedent example: `docs/07_governance/round-2/` (meta-arc folder). **Lands in Session 7.**
3. **Repo root** — `README.md` (root) Folder placement section, listing structural-folder-permitted patterns (`apps/`, `packages/`, `supabase/`, `scripts/`, `docs/`, `eslint-rules/`, `.coordination/`) with a note that tooling/system folders (`.git/`, `.turbo/`, `node_modules/`, `logs/`, `reports/`, `test-results/`) are outside the principle's scope. **Lands in Session 7.**

Future surfaces (per-layer READMEs, `packages/`, `supabase/`, etc.) extend Principle 3 by precedent — they earn a guardrail when accumulated sub-discipline can't be cleanly stated in the parent. Surface additions are amendments, not new principles.

### CLAUDE.md sub-section (lands in Session 7)

New `### Folder placement guardrails` sub-section under `## Project rules and vocabulary`, after the existing canonical-source list. Points at the three surface guardrails; states the bypass discipline; cites worked examples. Atomic landing with the docs README guardrail and repo-root extension to avoid orphan-link windows.

### Pattern 7 conditional permission for meta-arcs (lands in `docs/README.md` at Session 7)

Meta-arc folders under `07_governance/` are conditionally permitted with two sub-cases:

- **First-instance meta-arc shape (full bypass).** Folder README answering the document-class questions, friction-journal entry recording the new shape as N=1 evidence, operator acknowledgment in the commit body. Canonical first-instance precedent: `docs/07_governance/round-2/` (round-2 docs reorganization meta-arc, established 2026-05-08).
- **Follows-precedent meta-arc (light bypass).** Folder README answering the same questions plus an explicit `Follows precedent: <precedent path>` citation embedded as a 4/4 checklist; one-line friction-journal entry; commit body cites the precedent. No fresh operator acknowledgment per instance — the operator's first-instance approval covers the shape, and the commit body's precedent citation is the audit trail surfaced at PR review.

**Precedent-matching test (4/4 required for light bypass):** (1) precedent README answers document-class questions; (2) new README answers the same questions citing precedent; (3) cross-phase scope / durable identity / closure criteria / governance-surface placement match; (4) naming structurally consistent (e.g., `round-N/`).

### AGENTS.md vs README.md naming convention

Established by `scripts/AGENTS.md` precedent and the repo-root pairing: AGENTS.md is the AI-pre-flight-required cross-tool convention (recognized by Cursor, Aider, Codex, etc.); README.md is structural-onboarding audience-neutral. Repo root pairs both (`AGENTS.md` 327 bytes terse + `README.md` 3KB substantive). `apps/web/src/` follows the repo-root pattern: README.md substantive guardrail + AGENTS.md 3-5-sentence pre-flight directive. `docs/` uses README.md alone (existing convention; CLAUDE.md cross-reference makes it pre-flight without a separate AGENTS.md).

---

## Pre-flight reading

Before drafting `apps/web/src/README.md` and `apps/web/src/AGENTS.md`:

- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md` — authority-gradient organization, layer enumeration.
- `docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md` — pre-ratification design spec convention; canonical-taxonomy location. Load-bearing for the bypass procedure's codification language: any "future codification" pointer in the README must align with the round-N convention path through `04_engineering/conventions.md`, not invent a parallel codification machinery.
- `docs/02_specs/taxonomy.md` — canonical taxonomy that future codification additions reference.
- `docs/03_architecture/folder-structure.md` — current canonical source for source-tree placement.
- `docs/03_architecture/authority-gradient.md` — four-layer authority framing.
- `docs/04_engineering/conventions.md` — service / repository / test naming conventions.
- `scripts/AGENTS.md` — naming-convention precedent.
- `README.md` (root) and `AGENTS.md` (root) — repo-root precedent for AGENTS + README pairing.

---

## Acceptance criteria

- (a) `apps/web/src/README.md` exists with sections: title; brief framing; **authority-layer enumeration** (current siblings: `agent`, `app`, `components`, `contracts`, `core`, `db`, `middleware`, `services`, `shared`) with each layer's canonical sub-pattern stated by cross-reference (not re-derived); **permitted patterns**; **forbidden patterns** with worked examples (`utils/`, `lib/`, `modules/<feature>/`, plus per-feature/per-module top-level folders under `apps/web/src/` named for a product feature, module, or domain concept rather than an authority layer — worked example: `apps/web/src/billing/` would be wrong because billing-related code spans `services/billing/`, `core/billing/`, `db/repositories/billingRepository.ts`, etc., and a top-level `billing/` folder duplicates the cross-cutting axis at the wrong granularity per the DDD-rejection logic in `CTO_HANDOFF_V2` §12); **decision rule for ambiguous cases**; **bypass procedure** (new authority layer requires an ADR; new sub-pattern within a layer requires operator acknowledgment in the commit body and a friction-journal entry); cross-references to ADR-0020, `docs/03_architecture/folder-structure.md`, `docs/03_architecture/authority-gradient.md`, `docs/04_engineering/conventions.md`.
- (b) `apps/web/src/AGENTS.md` exists with 3-5 sentence pre-flight directive matching Task 1's draft (read README.md before creating folders; ADR-0020 authority-gradient is load-bearing; AI agents may not bypass without operator acknowledgment in the commit body; bypass procedure summary for new layers and new sub-patterns).
- (c) Cross-references in README.md resolve: ADR-0020 path correct, folder-structure.md path correct, conventions.md path correct. Verify with `grep -rn`.
- (d) Authority-layer enumeration matches `ls apps/web/src/` at execution time. If drift between brainstorm-time enumeration (above) and execution-time state, adjust enumeration; do not let the README ship a stale layer list.
- (e) `pnpm typecheck` clean before C1 commit.
- (f) `pnpm adr:lint` clean before C1 commit.
- (g) `pnpm adr:index --check` clean before C1 commit (no INDEX drift; this session does not touch ADRs).
- (h) Floor-only push-readiness gate met (zero migrations / zero services / zero integration tests / zero source files / zero test files).
- (i) Closeout friction-journal entry inserted at top of `## Phase 2`, recording: Session 6.5 as N=1 implementation evidence for Principle 3 at the source-tree surface; brainstorm-time design context carried forward to Session 7 (full Principle 3 wording, three-surface map, Pattern 7 conditional-permission framing, AGENTS.md/README.md pairing convention, CLAUDE.md sub-section content); floor-only carve-out N=6 invocation noted (first fire outside `docs/` territory; structural observation for Session 7's substrate-now-enforcement-later codification moment).
- (j) Both commits independently revertable; commit boundaries align with implementation-then-closeout pattern.

---

## Push-readiness gate (floor-only carve-out, N=6 invocation)

Floor-only carve-out criteria (per halftime plans push commit `ea22b76`): mechanically defensible for diffs containing zero migrations / zero services / zero integration tests / zero source files / zero test files.

Session 6.5's diff:

| Criterion | Session 6.5 status |
|---|---|
| Zero DB migrations | ✓ no `apps/web/sql/` changes |
| Zero services | ✓ no `apps/web/src/services/` changes (only `apps/web/src/README.md` + `apps/web/src/AGENTS.md`) |
| Zero integration tests | ✓ no `apps/web/tests/integration/` changes |
| Zero source files | ✓ no `.ts`/`.tsx` changes |
| Zero test files | ✓ no `.test.ts` changes |

All five criteria met. Diff is README + AGENTS markdown-only (~80-150 lines net diff); floor-only gate applies.

**N=6 invocation context.** First fire of the carve-out outside `docs/` territory (markdown placement under `apps/web/src/` rather than `docs/`). Structurally novel surface; mechanically equivalent diff. Codification of the carve-out itself still defers to Session 7's natural substrate moment per substrate-now-enforcement-later — Session 6.5 uses the carve-out, does not codify it. Session 7 closeout absorbs N=6 as additional evidence that the formal criteria operate on diff shape, not folder location.

**Verification protocol:**
- `pnpm db:reset:clean`
- `pnpm agent:validate` (floor-scope: typecheck + URL grep + 5 Category A floor tests; expect 26/26 GREEN)
- Full-suite `pnpm test` NOT invoked.

---

## Stop conditions (keyed to scope-completion milestones)

1. **Session start: verify Session 6 closeout state, before reading any 6.5 work.** Confirm:
   - HEAD references Session 6 closeout commit (or merged into staging per branch sync).
   - `pnpm typecheck`, `pnpm adr:lint`, `pnpm adr:index --check` all green.
   - Working tree clean.
   - `apps/web/src/README.md` and `apps/web/src/AGENTS.md` do NOT yet exist (this plan creates them).

   If any verification fails: halt. Resolve at session start; if Session 6 introduced unexpected scope, escalate for plan revision before proceeding.

2. **After C1 (README + AGENTS land), before floor-only verification.** Confirm: both files exist with required sections; cross-reference grep-sweep clean (`grep -rn "0020-agent-first-authority-gradient-source-architecture\|folder-structure\.md\|authority-gradient\.md\|conventions\.md" apps/web/src/`); working tree clean.

3. **After floor-only verification, before closeout commit.** Confirm: `pnpm db:reset:clean && pnpm agent:validate` reports 26/26 GREEN; `pnpm typecheck` clean.

4. **After closeout commit lands, before pushing.** Confirm push-readiness state per the floor-only gate criteria.

---

## Task 1: Draft and land `apps/web/src/README.md` + `apps/web/src/AGENTS.md` (C1)

- [ ] Read pre-flight artifacts (ADR-0020, folder-structure.md, authority-gradient.md, conventions.md, scripts/AGENTS.md, root README.md, root AGENTS.md).
- [ ] Verify execution-time authority-layer enumeration (`ls apps/web/src/`); adjust the brainstorm-time list if drift.
- [ ] Draft `apps/web/src/README.md`:
  - Title (`# apps/web/src/`).
  - Brief framing: "This folder organizes source code by authority layer per ADR-0020. Folder placement decisions here are load-bearing — wrong placements compound through code review and into the runtime architecture. Before creating any folder under `apps/web/src/`, read this guardrail."
  - Authority-layer enumeration: each current sibling with a one-line canonical sub-pattern (cross-reference, not re-derivation: see `04_engineering/conventions.md`).
  - **Permitted patterns** section: layers above, plus per-layer sub-patterns established by precedent.
  - **Forbidden patterns** section with worked examples: `utils/`, `lib/`, `modules/<feature>/`, anything that introduces a non-authority-layer top-level folder under `src/`. Plus: per-feature/per-module top-level folders named for a product feature, module, or domain concept rather than an authority layer (worked example: `apps/web/src/billing/` would be wrong because billing-related code spans the authority layers — `services/billing/`, `core/billing/`, `db/repositories/billingRepository.ts` — and a top-level `billing/` folder duplicates the cross-cutting axis at the wrong granularity per DDD-rejection logic in `CTO_HANDOFF_V2` §12). Each example carries one sentence on why it's wrong.
  - **Decision rule for ambiguous cases**: "If your case doesn't clearly match a permitted pattern and doesn't clearly violate a forbidden pattern: file an ADR before creating the folder. The ADR ratifies the new pattern; the folder follows the ADR."
  - **Bypass procedure**: new authority layer requires an ADR (operator-led); new sub-pattern within an existing layer requires operator acknowledgment in the commit body plus a friction-journal entry recording the case as evidence for future codification. AI agents may not unilaterally bypass.
  - **Cross-references** to ADR-0020 + folder-structure.md + authority-gradient.md + conventions.md.
- [ ] Draft `apps/web/src/AGENTS.md`:
  - HTML maintainer comment at top of file (invisible to readers, visible to maintainers): `<!-- Maintain at 3-5 sentences. Substantive content lives in README.md. Expansion belongs in README.md, not here. -->`. This applies the file-top comment staleness review convention (CLAUDE.md) prophylactically to keep AGENTS.md from drifting into README territory.
  - Title (`# apps/web/src/`).
  - 3-5 sentence pre-flight directive: "Before creating any folder under `apps/web/src/`, read `README.md`. Authority-gradient organization per ADR-0020 is load-bearing. AI agents may not bypass without operator acknowledgment in the commit body. The bypass procedure for new authority layers is an ADR; for new sub-patterns within an existing layer, operator acknowledgment in the commit body plus a friction-journal entry."
- [ ] Verify cross-references with `grep -rn` from repo root.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Commit C1: `docs(round-2): ship session 6.5 — apps/web/src/ folder-placement guardrail`.
- [ ] Stop condition 2: verify file presence + cross-references + working tree clean.

---

## Task 2: Floor-only verification + closeout commit (C2)

- [ ] `pnpm db:reset:clean`.
- [ ] `pnpm agent:validate` (expect 26/26 GREEN).
- [ ] Stop condition 3: verify floor-only output.
- [ ] Verify friction-journal heading structure before insertion. Open the file and confirm the active-section heading is `## Phase 2` (matches Session 5/6 closeout placement); if the structure has shifted (e.g., to a Phase 1.3 subsection or another active heading), place under the current active-section heading and note the shift in the closeout entry.
- [ ] Insert friction-journal closeout entry at top of the active-section heading. Structure:
  - Header: `### 2026-05-09 — Round-2 Session 6.5 closeout (apps/web/src/ folder-placement guardrail interim)`.
  - Locked decisions: Principle 3 tightened wording ratifies in Session 7 V2; three-surface enumeration (`apps/web/src/`, `docs/`, repo root); Pattern 7 conditional-permission framing for meta-arcs; AGENTS.md + README.md pairing convention at apps/web/src/ per repo-root precedent; CLAUDE.md sub-section under "Project rules and vocabulary" (not a fabricated "Rule 12").
  - Carry-forwards to Session 7: `docs/README.md` Folder placement guardrail draft; repo-root `README.md` Folder placement section extension; CLAUDE.md sub-section land; Principle 3 ratification in DOCS_RESTRUCTURE_V2.md; Pattern 7 wording with the 4/4 precedent-matching checklist.
  - Brainstorm-time observations:
    - Floor-only carve-out N=6 invocation is the first fire outside `docs/` territory — structural observation for Session 7's substrate-now-enforcement-later codification moment, evidence that the formal criteria operate on diff shape rather than folder location.
    - **Pattern 7 light-bypass implicitly fired for this plan's placement under `docs/07_governance/round-2/`.** This is N=1 evidence of the conditional-permission machinery operating in practice (currently described only in conversation/brainstorm). 4/4 precedent-matching: round-2 README answers document-class questions; this plan's location implicitly cites precedent; cross-phase scope and durable identity match the meta-arc shape; naming consistent with the round-N session-plan pattern. Material for Session 7's V2 ratification of Pattern 7.
    - **`pnpm adr:index --check` meaningfulness for non-ADR diffs.** Log whether the gate produced signal (i.e., would have caught actual drift) or was vacuously clean for the README + AGENTS markdown-only diff. If vacuously clean, the gate stays in the floor sequence as cheap insurance but is not load-bearing for this diff scope; if signal-producing, the gate's coverage extends beyond what's currently documented and warrants a Session 7 observation.
    - Friction-journal heading-structure verification result (whether `## Phase 2` was the active heading at execution time, or whether it had shifted).
- [ ] Commit C2: `docs(governance): friction-journal — round-2 Session 6.5 closeout`.
- [ ] Stop condition 4: verify push-readiness state.
- [ ] Push to staging.

---

## Self-Review Checklist (run before declaring plan complete)

- [ ] All four issue resolutions from the brainstorm captured in the Brainstorm context section (Principle 3 wording; three-surface map; Pattern 7 conditional permission; AGENTS.md/README.md pairing).
- [ ] AGENTS.md content is terse (3-5 sentences) per the disambiguation; substantive content lives in README.md.
- [ ] Forbidden patterns enumerated with concrete worked examples (`utils/`, `lib/`, `modules/<feature>/`).
- [ ] Bypass procedure matches the structural template (folder README + friction-journal + commit body) used elsewhere in the repo.
- [ ] Floor-only N=6 invocation acknowledged as structurally novel (first fire outside `docs/`) without codifying the substrate observation prematurely.
- [ ] Forward-pointer to Session 7 inventories all the remaining work (docs guardrail, repo-root extension, CLAUDE.md sub-section, Principle 3 ratification).
- [ ] Authority-layer enumeration verification step (Task 1, step 2) is explicit so execution-time drift doesn't ship a stale layer list.

---

## Notes for executor

- **Authority-layer enumeration is load-bearing.** Walk `ls apps/web/src/` at execution time and adjust enumeration if drift from brainstorm-time list (`agent`, `app`, `components`, `contracts`, `core`, `db`, `middleware`, `services`, `shared`). The README's authority claim collapses if the list is wrong.
- **Per-layer canonical sub-patterns: cross-reference, don't restate.** The patterns are documented in `04_engineering/conventions.md` (services pattern, db repositories pattern, etc.). The README points at conventions.md; it doesn't duplicate. Duplication creates drift risk when conventions.md amends.
- **AGENTS.md content stays terse.** 3-5 sentences max. Substantive content lives in README.md. AGENTS.md exists to signal "AI must read README.md before creating folders here" with cross-tool naming convention recognized by Cursor / Aider / Codex / etc.
- **Closeout friction-journal entry: structure matches Session 5A/5B/6 closeout shape** (locked decisions, observation-queue updates, carry-forwards, brainstorm-time observations). The carry-forwards section is load-bearing — Session 7's V2 ratification draws from this entry plus the Brainstorm context section above.
- **Floor-only verification protocol matches Session 6 exactly** — `pnpm db:reset:clean && pnpm agent:validate` only; full-suite `pnpm test` not invoked. This is the sixth invocation of the carve-out under formal criteria; the carve-out itself still does not codify until Session 7.
