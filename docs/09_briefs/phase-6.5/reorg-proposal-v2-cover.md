# Cover note: Reorg proposal v2

**Status:** v2 ready for final CTO sign-off
**Author:** WSL Claude drafting session
**Date:** 2026-05-17
**Length:** ~95 lines for the cover note (concise by design). v2.2 proposal itself is a separate artifact (~725 lines after v2.2 CTO sign-off edits).

## What changed from v1

v2 incorporates the five CTO conditions from `reorg-cto-feedback-v1.md` and applies three brainstorm-session refinements on top (sub-split as conditional acceptance criterion on Commit A; InstructionsLoaded hook as local-during-reorg with operator decision post-Commit-D; Phase 6.5 staleness gate added to §11). All four CTO-selected operator decisions are reflected in §13 as selected positions rather than open questions. The §11 commit sequence is re-ordered (codify-convention moves from Commit E to Commit B; `.claude/rules/` narrows from seven files to a verified three-file pilot at Commit C). The "no content invented" framing is rephrased to "no new canonical rules or product invariants" per the CTO's exact phrasing. One brainstorm-suggested addition (docs-codifier as 3-month-out note in §15 closeout) is NOT incorporated and is flagged below for operator decision before final CTO submission.

## CTO conditions — all accepted

1. **Change `.claude/rules/` from broad adoption to limited verified pilot.** v2 §6.1 lists the three pilot files (`services.md`, `migrations.md`, `docs-codification.md`) with explicit deferred-files table. v2 §11 Commit C pre-step elevates InstructionsLoaded verification to a **hard gate** (halt commit + fall back to per-workspace CLAUDE.md if bug A fires). v2 §13 Decision 2 selects (c) with the pilot scope explicit.

2. **Move codify-convention immediately after the topical split.** v2 §11 re-sequenced: Commit A = topical split → Commit B = `codify-convention` skill only → Commit C = `.claude/rules/` pilot → Commit D = CLAUDE.md trim → Commit E = two subagents → Commit F = remaining skills (`phase-retrospective`, `ui-session-screenshot-gate`) + hooks/linting. v2 §7.1 includes the "Why this lands at Commit B (not Commit E)" rationale. Every cross-reference to "Commit B/C/D/E/F" throughout v2 reflects the new sequence.

3. **Rewrite "no content invented" to "no new canonical rules or product invariants."** v2 §14 first bullet uses the CTO's exact phrasing verbatim: "No new canonical conventions, product invariants, ADRs, or source-code behavior are introduced. The reorg adds operational projections of existing rules through `.claude/rules/`, skills, subagents, and hooks." v2 §15 closeout paragraph 1 audited for consistency and rephrased to mirror the same framing ("without changing any canonical truth or product invariants").

4. **Add a hard split threshold for `session-execution.md`.** v2 §5.1 documents the conditional sub-split: if `session-execution.md` exceeds 600 lines after Commit A's content migration, sub-split atomically within the same commit into `conventions/session/` with `README.md`, `plan-authoring.md`, `scope-lock.md`, `session-close.md`, `iterative-catching.md`. v2 §11 Commit A acceptance criteria includes the conditional sub-split as part of Commit A, not a separate commit.

5. **Stronger content-preservation checks beyond line count.** v2 §12 criterion (1) replaces v1's "diff stat shows ~zero net change" with the three bash commands the CTO provided (heading-count diff, origin metadata grep, anchor-reference grep). The commands are runnable as-is so the operator can execute and confirm at Commit A acceptance.

## Refinements applied on top of CTO conditions

- **Sub-split as conditional acceptance criterion on Commit A** (not a separate commit). The brainstorm reply refined this on top of CTO condition 4: keeping the sub-split atomic with the move prevents an intermediate state where a 700+ line `session-execution.md` exists in the repo. Reflected in v2 §5.1 and §11 Commit A acceptance criteria.

- **InstructionsLoaded hook as local-during-reorg with operator decision post-Commit-D.** The brainstorm reply refined this on top of CTO condition 6 ("keep verification local during the reorg"): enable in `.claude/settings.local.json` (gitignored, machine-local) during Commits B-D verification; after Commit D is verified clean, the operator decides whether to commit it to team-shared `.claude/settings.json`. The refinement preserves operator choice rather than auto-committing or auto-leaving-local. Reflected in v2 §9.2 (full four-step treatment), v2 §11 Commit B pre-step (enable in local settings), v2 §11 Commit D acceptance criteria (post-commit operator-decision checkpoint), and v2 §11 Commit F scope (if operator opted to commit, hook lands here).

- **Phase 6.5 staleness gate added to §11 preamble.** Neither in v1 nor in the CTO feedback; the brainstorm reply surfaced it as "the CTO didn't address" but the operator confirmed (per task instructions) it should land in v2 body. Reflected in v2 §11 preamble as a one-line gate: "If more than two phases land between CTO sign-off and reorg execution, return for re-verification. The structural inventory in §2 may be out of date." Also referenced from v2 §10.2 (codification mid-reorg mitigation) and v2 §15 closeout (the case for the timing).

- **Multi-line Edit anchor confirmation stays in CLAUDE.md (v2.1 refinement, 2026-05-17).** The initial v2 draft (per WSL subagent) relocated this rule to `conventions/code.md` as a downstream consequence of CTO Decision 2 deferring `.claude/rules/editing.md` from the pilot. Operator-side review identified the relocation as a category error: Edit anchor confirmation fires every session that edits code (most sessions), so it functions as a standing rule, not trigger-scoped. It belongs in CLAUDE.md as the canonical home, with `.claude/rules/editing.md` as the future projection target if the pilot expands. Reflected in v2 §4 standing-rules block (+~25 lines; CLAUDE.md target grows from ~200 to ~225, still well under 300), §4.1 table (Edit anchor row), §5.1 `code.md` description, §6.1 deferred table, §10.1 Bug B mitigation. The refinement also surfaces a small clarification to the routing model worth noting at a future codification: "fires every session that does X-shape work, where X-shape work is common" is a legitimate CLAUDE.md placement, not a forced relocation to topical conventions.

## v2 candidate additions — operator decisions

The brainstorm reply suggested adding a 3-month-out note in §15 closeout: the two-subagent decision is the right starting point, with `docs-codifier` as a likely future addition once `codify-convention` skill has data. The reasoning was that `docs-codifier` could earn its place later as the "batch retrospective codification" variant — different work from the interactive `codify-convention` skill, running in isolated subagent context against 5-12 candidates from a phase close.

**Operator decision (2026-05-17): omit from v2.** Reasoning: it's a 3-month-out observation, not a sign-off issue. Adding it to v2 §15 closeout makes the closeout slightly noisier without changing any sign-off decision. Save it for the post-execution friction-journal entry where it can sit alongside actual data from the first few `codify-convention` skill invocations. No change to v2 body; this cover note records the decision for provenance.

## v2.2 CTO sign-off edits (2026-05-17)

The CTO approved v2 conditionally on four required edits plus an implicit framing addition. All five land in v2.2:

1. **"editing matching files" → "read/open matching files"** (CTO Minor Edit #1). Technical correction per Claude Code docs + bug B (#23478). Reflected in v2.2 §3 architecture table (Path-scoped rules row), §11 Commit C acceptance criteria (both test bullets reworded as Read tests).

2. **Concrete `.claude/rules/` fallback destinations** (CTO Minor Edit #2). v2 said "fall back to per-workspace CLAUDE.md" without specifying which file or what shape. v2.2 §11 Commit C pre-step now includes a six-line fallback specification with file destinations, 40-line per-file ceiling, pointer-only constraint, and explicit "bail → Commit D scope" routing.

3. **Duplicate-rule-body grep check** (CTO Minor Edit #3, enhanced with brainstorm reply's section-header diff). v2.2 §12 acceptance criterion (1) now has two additional bash commands: (1d) keyword grep for known rule names, (1e) H3 section-header diff between CLAUDE.md and `conventions/`. Together they catch duplicate-authority failures by content and structure.

4. **InstructionsLoaded hook as observability-only** (CTO Minor Edit #4). Scope-fencing addition to v2.2 §9.2: "The InstructionsLoaded hook must not block, mutate files, or add behavioral instructions; it is observability-only." Prevents scope creep into PreToolUse/PostToolUse hooks under the same umbrella.

5. **Durable-win framing per CTO sign-off** (operator-approved per brainstorm reply). v2.2 §15 closeout adds a paragraph making explicit that A + B + D are the durable commits; C, E, F are additive. Sharpens the rollback hierarchy if the reorg must bail mid-flight.

After v2.2 lands, the proposal is execution-ready. Next deliverable: per-commit execution prompts A–F.

## What did NOT change

The following stayed identical (or near-identical, with only cross-reference updates) to v1:

- **§3 target architecture.** Same seven-mechanism model (root CLAUDE.md, AGENTS.md, per-workspace CLAUDE.md, topical conventions, path-scoped rules, skills, subagents). Cosmetic updates to call out the pilot scope for `.claude/rules/`.
- **§4 CLAUDE.md target shape.** Same target shape; ~225-line target (up from v1's ~200 per the v2.1 Edit anchor refinement — see refinements section above). Still well under the 300-line acceptance criterion.
- **§5 topical split for conventions.** Same eight topical files. §5.1 augmented with the conditional sub-split for `session-execution.md` per CTO condition 4.
- **§5.3 origin metadata preservation.** Same standardized footer format.
- **The codification routing principle.** Same forcing-function logic; the only change is when in the sequence `codify-convention` lands (Commit B instead of Commit E).
- **§7.4 and §8.3 deferral rationale.** Same deferred-skills and deferred-subagents lists.
- **§14 remaining bullets** (no canonical sources modified, no source code changes, etc.) — unchanged in shape, only the first bullet is rephrased per CTO condition 3.

## Files produced

- v2.2 proposal: `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` (~725 lines after v2.2 CTO sign-off edits, vs v1's 630; +15%, within ±20% target)
- This cover note: `docs/09_briefs/phase-6.5/reorg-proposal-v2-cover.md`

## Operator action required

1. Review v2 against this cover note's "CTO conditions — all accepted" section. Confirm each of the five conditions landed at the cited section(s).
2. Run the three content-preservation grep checks from v2 §12 criterion (1) against the *current* state of the repo. These are pre-execution baseline measurements; they'll be re-run post-execution to confirm preservation. Specifically:
   - `rg '^### |^## ' docs/04_engineering/conventions.md > /tmp/conventions-before-headings.txt`
   - `rg 'First codified:|Evidence basis:|Promoted from:|Cross-references:' docs/04_engineering/conventions.md` (current single-file form has no per-rule origin footers; this is the expected post-split addition)
   - `rg 'conventions\.md#|CLAUDE\.md#' docs apps scripts` (capture the pre-split anchor reference baseline)
3. Submit v2 to CTO for final sign-off, or push back to brainstorm session if anything in this cover note needs revision before submission.

## Open questions surfaced during drafting

None. The reconciliation table covered all CTO + brainstorm refinements unambiguously. Item 8 (the `docs-codifier` note) was flagged as a pending-operator-decision in v2.1 and has been resolved (omit) per the operator decision in the v2 candidate additions section above. All v2.2 edits per CTO sign-off feedback are mechanical and have no further open questions.
