# CLAUDE.md and conventions.md reorganization — CTO sign-off proposal

**Status:** Draft for CTO sign-off
**Author:** Claude (chat session, brainstorming role)
**Date:** 2026-05-16
**Target execution window:** Post-Phase-6.5-retrospective-close
**Scope:** Repo-root CLAUDE.md (1,044 lines), docs/04_engineering/conventions.md (2,223 lines), and the broader instruction-loading architecture (.claude/, docs/, AGENTS.md).
**Does not modify:** Canonical specs (docs/02_specs/), architecture docs (docs/03_architecture/), ADRs (docs/07_governance/adr/), DEV_WORKFLOW.md, friction-journal, or any source code.

## 1. Executive summary

**The problem.** CLAUDE.md has grown to 1,044 lines. The codification pipeline routes new rules to CLAUDE.md by default, which means trigger-scoped rules (firing at scope-lock, brief-write, specific surfaces) load on every session alongside the must-always rules. Claude Code's documented effective instruction budget is ~100-150 rules per session; CLAUDE.md alone is past that ceiling. The result is instruction-adherence degradation on the rules that genuinely fire every session, not just on the trigger-scoped ones.

conventions.md has grown to 2,223 lines, organized chronologically by codification phase (Phase 1.5A / Phase 1.2 / Round-2 / etc.). The organizing axis is wrong for retrieval: at session time, sessions search for rules by surface ("how do I handle Zod?"), not by codification date. Find-time has degraded; duplicate rules exist between CLAUDE.md and conventions.md and between sections within conventions.md.

**The proposal.** Restructure the instruction-loading architecture into seven distinct mechanisms, each with a clear destination criterion. Split conventions.md into eight topical files. Trim CLAUDE.md to ~200 lines of must-always rules plus pointers. Introduce `.claude/rules/` for path-scoped working rules. Add a `codify-convention` skill that enforces the routing decision at codification time, not after.

**Sequencing.** Six commits, executed after Phase 6.5 retrospective closes. Each commit is independently revertible. Content preservation precedes refactoring; refactoring precedes automation.

**Risk profile.** Low. No source code changes, no canonical-doc rewrites, no semantic content changes. The reorganization is purely re-shelving plus mechanism introduction. The one calculated bet is adopting `.claude/rules/` despite known Claude Code bugs; mitigations are specified in §10.

**Decision required.** CTO sign-off on (a) the target architecture in §3, (b) the topical split for conventions in §5, (c) the sequencing in §6, and (d) the four explicit operator decisions in §11.

## 2. Diagnosis

### 2.1 What's in CLAUDE.md today

1,044 lines across ~25 H3 sections. By inspection of section content:

- ~9 sections fire on every session (must-always rules, navigation, "what done means," push-readiness, "when in doubt"). Total: ~150 lines including framing.
- ~14 sections fire only in specific contexts (scope-lock, multi-line Edit, plan-authoring at transitive-dependency grain, session-close, specific code surfaces). Total: ~750 lines.
- ~2 sections duplicate content that exists more thoroughly in conventions.md. Total: ~50 lines.

Recent codification activity (chunk-6.3a/b, May 10-15) has been writing actively into the trigger-scoped sections, not into the must-always sections. This means the largest growth is in the wrong-shape content.

### 2.2 What's in conventions.md today

2,223 lines organized by phase of codification:
- Phase 1.5A Conventions (9 entries, established 2026-04-15)
- Phase 1.2 Conventions (13 entries, established 2026-04-19)
- Round-2 Conventions (6 entries, established 2026-05-09)
- Phase 1.2 Convention Ratifications (audit appendix)
- Worked Example appendix

Each entry is high-quality, codified per the existing N=3 graduation rule, with evidence basis and precedent citations. The problem is the organizing axis: phase-of-codification is origin metadata, not retrieval structure.

### 2.3 What's working that we keep

Several mechanisms are working correctly and we do not modify them:

- **Codification thresholds** (N=2 split-trigger, N=3 codification, N=5 meta-review). These are the right thresholds and the pipeline applies them.
- **Friction-journal mechanism.** The append-only journal with [ROUTE?] and NOTE tags works. Backing scripts (`check-friction-journal-line-length.sh`, `detect-journal-headings.sh`, `audit-friction-journal-citations.sh`) are active and enforcing.
- **ADR system.** 20 ADRs at `docs/07_governance/adr/` with proper supersession discipline, linter (`scripts/adr/lint.ts`), and generator. Not in scope for this reorg.
- **Existing skills.** Five skills at `.claude/skills/` (journal-entry-rules, agent-tool-authoring, audit-scans, integration-test-rules, service-architecture) are correctly framed. Not modified by this reorg.
- **Existing settings.** `.claude/settings.json` has appropriate allow/ask/deny permissions. Not modified.
- **AGENTS.md.** 5-line cross-tool baseline imported by CLAUDE.md. Not modified.

### 2.4 The root-cause finding

The codification pipeline has historically had two destinations: CLAUDE.md (always-loaded) or friction-journal (banked). conventions.md exists as a destination but the routing rule (currently §Documentation Routing at line 1695) is not visible at codification time — it's buried two-thirds of the way through a 2,223-line file. This is why graduated rules default to CLAUDE.md: there's no destination-selection forcing function visible at the moment of decision.

The reorg fixes the routing problem as a side effect of fixing the file shape, by:
1. Promoting the routing rule to `conventions/README.md` (discoverable on directory entry)
2. Adding a `codify-convention` skill that makes destination-selection a forcing function
3. Adding a `.claude/rules/docs-codification.md` rule that fires when WSL Claude touches friction-journal or retrospective surfaces
4. Inserting routing-pointer headers in every topical convention file

## 3. Target architecture

Seven instruction-loading mechanisms, each with one purpose:

| Mechanism | Load timing | Purpose | Lives in |
|---|---|---|---|
| Root CLAUDE.md | Always (session start) | Must-always rules + routing index | `CLAUDE.md` |
| AGENTS.md | Always (via @AGENTS.md import) | Cross-tool baseline | `AGENTS.md` |
| Per-workspace CLAUDE.md | When working in workspace subtree | Workspace-scoped must-always | `apps/web/CLAUDE.md`, `packages/*/CLAUDE.md` (only where needed) |
| Topical conventions | On @ reference or directed reading | Codified rules organized by surface | `docs/04_engineering/conventions/<topic>.md` |
| Path-scoped rules | When editing matching files | Operational projections of conventions | `.claude/rules/<area>.md` with `paths:` frontmatter |
| Skills | On glob trigger or explicit invocation | Repeatable workflows with multi-step procedures | `.claude/skills/<name>/SKILL.md` |
| Subagents | On dispatch from main session | Isolated review/research in separate context | `.claude/agents/<name>.md` |

### 3.1 Loading principles

**A. @-imports load at session start.** Per Claude Code docs, `@path` imports in CLAUDE.md are expanded and inlined at launch. This means:
- `@AGENTS.md` is fine — 5 lines.
- `@docs/04_engineering/conventions.md` would be catastrophic — 2,223 lines on every session.
- All references to large files in CLAUDE.md use plain markdown links, not `@`.

**B. Adherence, not tokens, is the real constraint.** Claude Code docs cite an effective instruction budget of ~100-150 distinct rules per session (after subtracting the ~50-instruction system prompt). Total session tokens are not the constraint — the model has 200K. The constraint is how many competing rules the model can attend to before adherence on any one rule degrades. The reorg is justified by adherence, not token cost.

**C. Trigger surface determines destination.** The destination for any rule is determined by what triggers it:
- Fires every session → CLAUDE.md
- Fires on a file glob → `.claude/rules/`
- Fires on activity (scope-lock, plan-authoring) → topical conventions
- Fires on explicit invocation → skill
- Fires on dispatch → subagent
- Domain invariant (not a rule) → `docs/02_specs/`

### 3.2 What does NOT change

- **Canonical truth stays in `docs/`.** No invariants, no ADRs, no architecture docs get re-shelved.
- **DEV_WORKFLOW.md stays as-is.** It's a different abstraction layer (operational tendencies, not codified rules).
- **Domain invariants in `docs/02_specs/`** (ledger_truth_model, invariants, etc.) stay where they are. They are product correctness rules, not engineering conventions.
- **Phase 1 simplifications documentation** stays at `docs/03_architecture/phase_simplifications.md`.

## 4. CLAUDE.md target shape

**Target: ~200 lines, organized as a routing index.**

```
@AGENTS.md

# CLAUDE.md — chounting standing rules

[~10-line framing: what this file is, what it's NOT]

## Navigation — tier-1 always-relevant
[~15 lines: pointer list to canonical docs, unchanged from current]

## Project rules and vocabulary
[~20 lines: pointer list to repo-rules, worktree-rules, conventions
 folder, glossary, taxonomy. Unchanged from current.]

## Codification routing
[~15 lines: the interim block already in current CLAUDE.md, refined.
 Points at docs/04_engineering/conventions/README.md as the routing
 source-of-truth.]

## On-demand rules — load when touching the relevant area
[~15 lines: route to skills, rules, conventions, agents by trigger
 type. Unchanged conceptually from current.]

## Folder placement guardrails
[~10 lines, trimmed from current ~30 lines. Pointer to docs/README.md
 for the full guardrail surface.]

## Standing session principles

### What "done" means
[Unchanged from current ~15 lines]

### Push readiness three-condition gate
[Unchanged from current ~40 lines]

### When in doubt
[Unchanged from current ~15 lines]

## Phase 1 simplifications
[~5 lines, compressed from current ~10. Pointer to
 docs/03_architecture/phase_simplifications.md.]
```

Total: ~200 lines. Down from 1,044.

### 4.1 What moves out of CLAUDE.md

Every trigger-scoped rule moves to its appropriate destination. Specifically:

| Current CLAUDE.md section (lines) | Moves to |
|---|---|
| UI-session screenshot gate (~30 lines) | `.claude/skills/ui-session-screenshot-gate/SKILL.md` |
| Multi-line Edit anchor confirmation (~25 lines) | `.claude/rules/editing.md` |
| Bidirectional iterative-catching termination (~20 lines) | `conventions/session-execution.md` |
| Substrate-now-enforcement-later (~35 lines) | `conventions/session-execution.md` |
| Substrate-mod test staleness review (~25 lines) | `conventions/migrations.md` |
| Plan-authoring transitive-dependency verification (~55 lines) | `conventions/session-execution.md` |
| Memory-writes-only Stage 6 firing-shape (~30 lines) | `conventions/session-execution.md` |
| RI-1 through RI-10 cluster (~410 lines) | `conventions/session-execution.md` (new section: "Scope-lock discipline") |
| File-top comment staleness review (~35 lines) | `conventions/code.md` |
| Webhook route handler conventions (~55 lines) | `conventions/service-layer.md` |
| Seed-data PII placeholder (~30 lines) | `conventions/migrations.md` |
| Audit-action naming split (~25 lines) | `conventions/audit-permissions.md` |
| Zod strict-vs-passthrough (~30 lines) | `conventions/schema.md` |

**Total moved: ~805 lines.** No content deleted; every section preserved with its evidence basis and precedent citations.

## 5. conventions.md target shape

The current single 2,223-line file becomes a folder of topical files:

```
docs/04_engineering/conventions/
├── README.md                       # Routing rule + index
├── code.md                         # Naming, formatting, file-top
├── service-layer.md                # Services, routes, middleware
├── schema.md                       # Zod, types, JSON schema
├── migrations.md                   # Supabase, RLS, backfills
├── audit-permissions.md            # Audit log, permissions
├── testing.md                      # Test patterns, mocks
├── ai-agents.md                    # Agent tools, LLM call discipline
└── session-execution.md            # Plan-authoring, scope-lock, close
```

The existing top-level `docs/04_engineering/conventions.md` becomes either:
- **Option A:** A symlink to `conventions/README.md`
- **Option B:** A short index file (~30 lines) that points at the folder

Option B is cleaner for cross-tool ergonomics (Cursor and other tools may not follow symlinks). **Recommendation: Option B.**

### 5.1 What goes in each topical file

**README.md (~80 lines).** The routing rule. Promoted from current §Documentation Routing. Decision tree for "where does a new rule go?" Read first on directory entry.

**code.md (~150 lines).** Naming, formatting, casing, file-top comment staleness review (moved from CLAUDE.md), audit before_state discipline, NOT NULL blast radius (currently scattered §204-275).

**service-layer.md (~200 lines).** Webhook handler conventions (moved from CLAUDE.md), service template structure, three-consumer pattern, error handling review rule (currently CLAUDE.md only + §245-258).

**schema.md (~120 lines).** Zod strict-vs-passthrough (dedupe of current CLAUDE.md + §230), JSON schema generation. The dedupe is the highest-priority cleanup in this file.

**migrations.md (~200 lines).** Migration review cadence (§238-275), seed-data PII placeholder (from CLAUDE.md), substrate-mod test staleness review (from CLAUDE.md), NOT NULL column blast radius.

**audit-permissions.md (~150 lines).** Permission keys vs audit action keys (§119-175), audit-action naming split (from CLAUDE.md), permission catalog count drift discipline.

**testing.md (~150 lines).** Currently scattered; consolidates Round-2 and Phase 1.2 test-related entries.

**ai-agents.md (~150 lines).** Currently scattered; consolidates agent-tool authoring rules from existing skill plus codified agent-related conventions.

**session-execution.md (~700 lines).** The big one. Contains:
- Plan-authoring conventions (currently §279, §407, §429, §472, §509, §543 + CLAUDE.md transitive-dependency)
- Scope-lock discipline (the RI-1 through RI-10 cluster from CLAUDE.md)
- Session-close conventions (memory-writes-only Stage 6, etc.)
- Bidirectional iterative-catching termination
- Substrate-now-enforcement-later

This is the topical file that absorbs the largest CLAUDE.md migration. It deserves its own ~10-line table-of-contents header.

### 5.2 What stays at the top-level conventions.md (Option B)

```markdown
# Engineering conventions

This is the index. Canonical conventions are organized topically
under `conventions/`. See `conventions/README.md` for the routing
rule.

## Topical files

[Bulleted list with one-line description of each]

## Codification thresholds

[Pulled forward from current §Codification thresholds — these are
 cross-cutting and should be visible at the top level.]

## Deprecation model

[Pulled forward from current §Deprecation model — same rationale.]

## Governance audit appendix

[Pointer to git history for the original chronological audit;
 not duplicated.]
```

~50 lines. Functions as the entry point.

### 5.3 Origin metadata preservation

Every codified rule in every topical file keeps a standardized footer:

```markdown
---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=3, commits `abc1234`, `def5678`, `9012abc`
- Promoted from: friction-journal entry F-J-7 (Phase 1 closeout)
- Cross-references: ADR-0014, ADR-0017
```

This preserves the chronological origin information that the current phase-grouped structure encodes implicitly. Future audits can still answer "when was this codified?" without the file structure being chronological.

## 6. .claude/rules/ adoption

This is the highest-risk part of the proposal because of open Claude Code bugs (§10). The benefits are real but adoption requires explicit verification at execution time.

### 6.1 Target files

```
.claude/rules/
├── services.md              # paths: apps/web/src/services/**/*.ts
├── migrations.md            # paths: supabase/migrations/**/*.sql
├── audit-permissions.md     # paths: files touching audit_log writes
├── ai-tools.md              # paths: apps/web/src/agent/**/*.ts
├── tests.md                 # paths: **/*.test.ts, **/*.spec.ts
├── editing.md               # paths: ** (broad; Edit-tool discipline)
└── docs-codification.md     # paths: friction-journal, CLAUDE.md, conventions/
```

Seven files, each with a `paths:` frontmatter. Each is a short (≤50 lines) operational projection of the corresponding topical conventions file — not a duplicate of it.

### 6.2 What rules vs conventions vs CLAUDE.md says

**A worked example.** The Zod strict-vs-passthrough discipline:

**`conventions/schema.md`** (canonical statement, ~50 lines):
> Full discipline: when authoring Zod schemas for chounting-defined shapes, use `.strict()`. When authoring schemas for third-party API responses, use `.passthrough()`. Rationale: <evidence>. Edge cases: <cases>. Precedent: <commits>.

**`.claude/rules/services.md`** (operational projection, 3 lines):
> When authoring Zod schemas in `apps/web/src/services/**/*.ts`:
> - Use `.strict()` for chounting-defined shapes.
> - Use `.passthrough()` only for third-party API responses.
> See `docs/04_engineering/conventions/schema.md` for full discipline.

**CLAUDE.md** (no entry). This is trigger-scoped, not session-default.

The rule fires when WSL Claude is editing files under `apps/web/src/services/`. The full discipline is one click away via the pointer. CLAUDE.md is not polluted.

### 6.3 Frontmatter format

Per verified Claude Code docs, the correct format is:

```yaml
---
paths:
  - "apps/web/src/services/**/*.ts"
  - "apps/web/src/server/**/*.ts"
---
```

**Always quote glob patterns.** YAML treats `*` and `{` as reserved indicators; unquoted patterns silently fail.

## 7. Skills additions

Three new skills, beyond the existing five:

### 7.1 codify-convention (high priority)

```yaml
---
name: codify-convention
description: Use when promoting a friction-journal pattern to a codified convention after N≥3 fires. Walks the routing decision tree, picks the destination file, drafts the codification block with origin metadata.
---
```

This is the forcing function for routing. When a future codification session invokes it, the skill (a) reads `conventions/README.md`, (b) walks the decision tree against the candidate rule, (c) names the destination, (d) drafts the codification with proper origin metadata. This is the mechanism that prevents the "default to CLAUDE.md" failure mode from recurring.

### 7.2 phase-retrospective (high priority)

```yaml
---
name: phase-retrospective
description: Use at phase close to draft a retrospective writeup. Surfaces codification candidates from friction-journal, routes them via codify-convention skill, drafts the retrospective doc.
---
```

Wraps `codify-convention` for the bulk-codification case (5-12 candidates per retrospective). Prevents the "land everything in CLAUDE.md" default that we just observed in Phase 6.5 planning.

### 7.3 ui-session-screenshot-gate (medium priority)

Extracted from current CLAUDE.md lines 105-134. Fires on UI-session sessions. Documented in §4.1.

### 7.4 Skills NOT added now

The critique proposed `review-ledger-impact` and `review-ai-tool-contract` as skills. Defer these. They overlap with the audit framework at `docs/07_governance/audits/`. Decide post-reorg whether they're skills, subagents, or both.

## 8. Subagents additions

**Two new subagents, not five.** Start small, add when patterns earn their place.

### 8.1 ledger-reviewer

Read-only review of changes affecting accounting state, transaction classification, journal entries, or AI-generated accounting suggestions. Checks against `docs/02_specs/ledger_truth_model.md`, `invariants.md`, and the relevant topical conventions.

```yaml
---
name: ledger-reviewer
description: Reviews changes touching accounting state for correctness and auditability. Invoke after edits to ledger-affecting code.
tools: Read, Grep, Glob
model: sonnet
---
```

### 8.2 migration-reviewer

Read-only review of Supabase migration files. Checks RLS preservation, backfill discipline, forward-safety, and schema-doc drift.

```yaml
---
name: migration-reviewer
description: Reviews Supabase migrations for forward-safety, RLS impact, and backfill correctness. Invoke after authoring any migration file.
tools: Read, Grep, Glob
model: sonnet
---
```

### 8.3 Subagents NOT added now

Deferred: audit-security-reviewer, test-gap-reviewer, docs-codifier. Reasons:
- Audit work is already covered by the audit framework at `docs/07_governance/audits/`.
- Test-gap analysis overlaps with existing testing-strategy work; unclear value-add before seeing it in practice.
- docs-codifier is what the `codify-convention` skill does in interactive form. Subagent form is premature.

Add these later if patterns surface that justify them. Five subagents up front is premature codification.

## 9. Settings additions

Minimal. Current `.claude/settings.json` is well-shaped (permissions only, no hooks). Two additions:

### 9.1 claudeMdExcludes for non-current-arc files

Per Claude Code docs, `claudeMdExcludes` in `.claude/settings.local.json` allows excluding specific CLAUDE.md files by glob from being loaded as ancestor instructions. Not used in this proposal, but documented as available if future per-workspace CLAUDE.md files create context bloat.

### 9.2 InstructionsLoaded hook (optional)

Per Claude Code docs, this hook logs which instruction files load at session start. Useful for debugging the `.claude/rules/` adoption (see §10). **Recommended to enable during the reorg execution window** so we can verify rules actually load when expected. Disable or leave on after the window per operator preference.

## 10. Risks and mitigations

### 10.1 .claude/rules/ has known bugs

Three documented Claude Code issues affect `.claude/rules/`:

**Bug A: Path-scoped rules may load globally regardless of `paths:`** (GH issue #16299). Some Claude Code versions load all `.claude/rules/*.md` files at session start regardless of frontmatter. If this fires on chounting, the supposed adherence benefit disappears — `.claude/rules/` becomes equivalent to adding to CLAUDE.md.

**Mitigation:** Enable InstructionsLoaded hook before adopting `.claude/rules/`. Verify with `/memory` that rules only appear when their `paths:` would match. If they load globally, defer `.claude/rules/` adoption and use nested per-workspace CLAUDE.md files instead (which work reliably).

**Bug B: Rules don't load on file Write, only on Read** (GH issue #23478). When Claude creates a new file matching a `paths:` glob, the rule is not in context at write time. The rule fires only after a subsequent Read.

**Mitigation:** Do not put file-creation conventions in `.claude/rules/`. Header rules for new ADRs, frontmatter rules for new specs, naming rules for new modules — these stay in CLAUDE.md or in template files. Use `.claude/rules/` only for editing-existing-files discipline.

**Bug C: YAML syntax gotchas** (GH issue #13905). Unquoted glob patterns (`paths: **/*.ts`) silently fail parsing. Always quote.

**Mitigation:** Use the verified-correct frontmatter format in §6.3. Add a pre-commit hook (Commit F) that lints `.claude/rules/*.md` frontmatter for quoted globs.

### 10.2 Codification mid-reorg

If a Phase 7 codification fires before the reorg is complete, the codification could land in the about-to-move section, creating merge friction.

**Mitigation:** The sequencing in §11 explicitly waits for Phase 6.5 retrospective to close before starting. Phase 7 chunks should not start before the reorg completes if at all avoidable. If a Phase 7 codification must fire mid-reorg, route it to the friction-journal with `[ROUTE?]` tag; codify properly after reorg lands.

### 10.3 Cross-reference breakage

Other docs (DEV_WORKFLOW.md, friction-journal, ADRs, briefs) link to specific sections in current `conventions.md`. Topical split breaks those anchors.

**Mitigation:** Pre-execution grep sweep: enumerate all `conventions.md#<anchor>` references across the repo. Update each in the same commit that moves the target section. Acceptance criterion in §12: zero broken anchors post-execution.

### 10.4 Subagent context cost

Subagents run in their own context window, which is good for isolation but adds dispatch latency and the operator can't easily inspect what they did mid-flight.

**Mitigation:** Two subagents only (ledger-reviewer, migration-reviewer). Both read-only. Both restricted to Read/Grep/Glob tools. No write capability means no surprises.

### 10.5 Codification routing default isn't sticky

We just observed (Phase 6.5 planning) that the current routing rule was not followed despite existing. The reorg surfaces the rule more prominently, but doesn't mechanically enforce it.

**Mitigation:** The `codify-convention` skill (§7.1) is the forcing function. Future codification sessions are explicitly instructed (in CLAUDE.md, in `conventions/README.md`, in `.claude/rules/docs-codification.md`, in the topical file headers) to invoke this skill before adding any new codified rule. Four redundant pointers reduce the failure mode to "session explicitly ignores all four," which is detectable post-hoc.

### 10.6 Operator unavailable mid-reorg

The reorg is 6 commits with verification steps between them. If operator is unavailable mid-reorg, the repo is in a partial-reorg state.

**Mitigation:** Each commit is independently revertible and leaves the repo in a working state. Commit A (topical split with full content preservation) leaves CLAUDE.md unchanged and adds a working `conventions/` folder. Commit B (rules) can be reverted. Commit C (CLAUDE.md trim) is the one that requires the topical files in place. Operator can stop after any commit and resume later.

## 11. Sequencing and execution plan

Six commits, executed sequentially, post-Phase-6.5-retrospective-close. Each commit is independently revertible.

### Commit A: Topical conventions split

**Scope:** Split current `docs/04_engineering/conventions.md` into the eight topical files in `docs/04_engineering/conventions/`. Update top-level `conventions.md` to be the ~50-line index per §5.2.

**Constraints:**
- Every current rule survives. Zero content deleted.
- Origin metadata footer added to each rule per §5.3.
- All current cross-references from other docs updated in the same commit.

**Acceptance criteria:**
- `git diff --stat` shows ~zero net change in total line count across all conventions files.
- `grep -r "conventions.md#" docs/ apps/ scripts/` returns matches that all resolve to live anchors post-rewrite.
- `pnpm adr:lint` passes (no ADR references broke).
- Existing scripts (`scripts/check-friction-journal-line-length.sh`, etc.) pass unchanged.

**Estimated effort:** 75-90 minutes.
**Reversibility:** `git revert <sha>` restores the single-file `conventions.md`.

### Commit B: .claude/rules/ introduction

**Scope:** Add seven files under `.claude/rules/` per §6.1. Each is a short operational projection (≤50 lines) pointing at the topical conventions file for full discipline.

**Pre-step:** Enable InstructionsLoaded hook (§9.2). Verify on a test session that `.claude/rules/*.md` files with `paths:` frontmatter only load when matching files are touched. If bug A (§10.1) fires, halt this commit; switch to per-workspace CLAUDE.md fallback.

**Acceptance criteria:**
- `/memory` on a session editing `apps/web/src/services/foo.ts` shows `services.md` rule loaded.
- `/memory` on a session editing `apps/web/src/components/foo.tsx` shows `services.md` rule NOT loaded.
- All frontmatter glob patterns quoted per §6.3.
- Pre-commit linter (added in Commit F) passes on `.claude/rules/` files.

**Estimated effort:** 45-60 minutes including verification.
**Reversibility:** Delete the `.claude/rules/` directory.

### Commit C: CLAUDE.md trim

**Scope:** Trim CLAUDE.md to ~200 lines per §4. Move trigger-scoped sections to their destinations (already in place from Commits A and B). Add the Codification routing section.

**Acceptance criteria:**
- CLAUDE.md line count under 300.
- Every removed section's content exists in its new destination (verified by cross-reference).
- `@AGENTS.md` import retained.
- Push readiness gate, "what done means," and "when in doubt" sections unchanged.

**Estimated effort:** 30-45 minutes.
**Reversibility:** `git revert` restores the long CLAUDE.md. Topical files remain populated, so reverting is purely cosmetic.

### Commit D: Subagents addition

**Scope:** Add `ledger-reviewer.md` and `migration-reviewer.md` to `.claude/agents/`. Read-only, restricted tools per §8.

**Acceptance criteria:**
- Each subagent file has correct frontmatter (name, description, tools, model).
- Test invocation on a sample diff (ledger-reviewer against a ledger-touching commit; migration-reviewer against a recent migration) produces sensible findings.

**Estimated effort:** 60-90 minutes including test invocations.
**Reversibility:** Delete the agent files.

### Commit E: Skills addition

**Scope:** Add `codify-convention`, `phase-retrospective`, and `ui-session-screenshot-gate` skills to `.claude/skills/`. Update `.claude/skills/README.md` trigger index.

**Acceptance criteria:**
- Each `SKILL.md` has correct frontmatter.
- `codify-convention` skill produces correct routing decision when tested on a hypothetical N=3 graduation candidate from friction-journal.
- `phase-retrospective` skill produces correct draft retrospective when tested on a recent (pre-reorg) phase close.

**Estimated effort:** 45-75 minutes.
**Reversibility:** Delete the skill directories.

### Commit F: Settings and hooks tightening

**Scope:**
- Optional: enable InstructionsLoaded hook permanently in `.claude/settings.json` (or leave in `.claude/settings.local.json` per operator preference).
- Add a pre-commit hook script `scripts/lint-rules-frontmatter.sh` that verifies `.claude/rules/*.md` files have quoted glob patterns.
- Add the hook to `scripts/install-hooks.sh`.

**Acceptance criteria:**
- `bash scripts/lint-rules-frontmatter.sh` passes on all current `.claude/rules/` files.
- Pre-commit hook fires when modifying `.claude/rules/*.md` files.

**Estimated effort:** 30-45 minutes.
**Reversibility:** Remove hook from `install-hooks.sh`; revert the lint script.

### Total estimated effort

**4-6 hours of focused work, split across six commits over 1-2 sessions.** If executed with WSL Claude verification passes between commits (per chounting's standard pre-execution verification pattern), add ~30 minutes per commit for verification reports.

## 12. Acceptance criteria for the reorg as a whole

The reorg is "done" when all of the following hold:

1. **CLAUDE.md under 300 lines.** Every remaining rule either fires every session or is a navigation/framing pointer.
2. **conventions.md topical structure.** Eight files under `docs/04_engineering/conventions/` matching §5. Top-level `conventions.md` is a ~50-line index.
3. **No content deleted.** Every codified rule from pre-reorg state exists in its new home with origin metadata footer.
4. **Cross-references resolve.** `grep -r "conventions.md#" docs/ apps/ scripts/` produces only matches against live anchors. Same for any references to current CLAUDE.md section anchors.
5. **.claude/rules/ adoption verified or rolled back.** Either: rules load only on matching paths (verified via `/memory`), OR rules adoption is rolled back and per-workspace CLAUDE.md used instead.
6. **Routing forcing function in place.** The `codify-convention` skill exists, is referenced from CLAUDE.md, `conventions/README.md`, `.claude/rules/docs-codification.md`, and every topical file header.
7. **Tooling unchanged.** All existing scripts pass without modification (`adr:lint`, friction-journal scripts, route-tag scanner). New script `lint-rules-frontmatter.sh` passes.
8. **Subagents tested.** Both ledger-reviewer and migration-reviewer produce sensible output on test invocations.
9. **Skills tested.** `codify-convention` produces correct routing decisions on test inputs.
10. **Friction-journal entry filed.** Reorg work itself logged in friction-journal per standard governance practice.

## 13. Open operator decisions for CTO sign-off

Four decisions are required before execution begins:

### Decision 1 — Top-level conventions.md handling (§5.2)

Two options:
- **(a) Symlink** top-level `conventions.md` to `conventions/README.md`. Single source of truth, but other tools may not follow symlinks.
- **(b) Short index file** at top-level `conventions.md` pointing at `conventions/` folder. ~50 lines. Some duplication of pointer info but tool-friendly.

**Recommendation: (b).** Cross-tool ergonomics matter for chounting's multi-tool environment.

### Decision 2 — .claude/rules/ adoption posture (§6, §10.1)

Three options:
- **(a) Adopt with verification.** Commit B includes pre-step to verify `paths:` works correctly on chounting's Claude Code version. Roll back if bug A fires.
- **(b) Defer adoption.** Skip Commit B entirely. Use per-workspace CLAUDE.md files for path-scoped rules.
- **(c) Limited adoption.** Adopt `.claude/rules/` for a subset (e.g., services.md, migrations.md) and per-workspace CLAUDE.md for the rest.

**Recommendation: (a).** The mechanism is documented and Anthropic-supported. Bugs are known but verifiable. If verification fails, fall back to (b) on the spot.

### Decision 3 — Subagent count at launch (§8)

Two options:
- **(a) Two subagents** (ledger-reviewer, migration-reviewer). Start small, add when earned.
- **(b) Five subagents** (per original critique). ledger-reviewer, migration-reviewer, audit-security-reviewer, test-gap-reviewer, docs-codifier.

**Recommendation: (a).** Five up front is premature codification; the audit and test-gap surfaces are already covered by existing mechanisms.

### Decision 4 — Per-workspace CLAUDE.md files

Four workspaces exist (`apps/web/`, `packages/tokens/`, `packages/ui/`, etc.). Three options:
- **(a) None.** All path-scoping handled by `.claude/rules/`.
- **(b) `apps/web/CLAUDE.md` only.** Web app is large enough to warrant its own scoped rules.
- **(c) Per-workspace.** Each workspace gets a CLAUDE.md.

**Recommendation: (b) initially.** Add others if patterns earn them. Per-workspace CLAUDE.md is the fallback for `.claude/rules/` if Decision 2 falls back.

## 14. What this proposal does NOT do

To be explicit about scope:

- **No content invented.** Every rule in the proposed topical structure exists today in either CLAUDE.md or conventions.md.
- **No canonical sources modified.** ledger_truth_model.md, ADRs, repo-rules.md, DEV_WORKFLOW.md, friction-journal — untouched.
- **No source code changes.** Pure documentation and instruction-loading work.
- **No tooling break.** The friction-journal scripts, ADR linter, ADR generator continue working unchanged.
- **No skills rewritten.** Existing five skills stay as-is; three new skills added.
- **No deprecations.** Every rule is kept, relocated.
- **No new conventions codified.** The codification pipeline is not modified by this proposal — it's redirected.
- **No phase-6 work touched.** Reorg runs strictly post-Phase-6.5-retrospective-close.

If the CTO wants to additionally deprecate stale rules, codify new ones, or restructure adjacent surfaces (e.g., friction-journal format, retrospective shape), those are separate proposals.

## 15. Closeout summary

**The case for execution.** CLAUDE.md is past the ~150-instruction adherence threshold and growing. conventions.md retrieval-axis is wrong. The codification pipeline defaults to CLAUDE.md because the routing rule isn't visible at decision time. The reorg fixes all three by topical organization plus mechanism introduction, without changing any content or canonical truth.

**The case against execution.** Six commits is real work. Mid-reorg state is partial. `.claude/rules/` has documented bugs that may bite. If the CTO has higher-priority work that can't tolerate the operator-time cost of the reorg, defer.

**The case for the timing.** Phase 6.5 retrospective close is the natural inflection point. Executing immediately after means the post-close codifications land in the new structure rather than getting re-shelved. Executing earlier collides with active codification.

**The single highest-value thing this proposal does.** It changes the codification routing default from "land in CLAUDE.md" to "route via decision tree." The `codify-convention` skill is the forcing function that makes this stick. Without that mechanism, CLAUDE.md will regrow to 1,044 lines within 3-4 phases regardless of how clean we make it today. With it, the reorg is durable.

**Decision points for CTO sign-off:**
1. Approve target architecture (§3)?
2. Approve topical conventions split (§5)?
3. Approve sequencing (§11)?
4. Resolve the four open operator decisions (§13)?

Pending CTO sign-off, this proposal stays draft. On sign-off, the next deliverable is a per-commit execution prompt (one per commit A–F), following chounting's standard pre-execution verification pattern.
