# CLAUDE.md and conventions.md reorganization — CTO sign-off proposal (v2)

**Status:** Revised draft for final CTO sign-off
**Author:** Claude (chat session, brainstorming role) + WSL Claude drafting session
**Date:** 2026-05-17
**Supersedes:** `reorg-proposal-v1.md` (2026-05-16)
**Target execution window:** Post-Phase-6.5-retrospective-close (subject to §11 staleness gate)
**Scope:** Repo-root CLAUDE.md (1,044 lines), docs/04_engineering/conventions.md (2,223 lines), and the broader instruction-loading architecture (.claude/, docs/, AGENTS.md).
**Does not modify:** Canonical specs (docs/02_specs/), architecture docs (docs/03_architecture/), ADRs (docs/07_governance/adr/), DEV_WORKFLOW.md, friction-journal, or any source code.

## 1. Executive summary

**The problem.** CLAUDE.md has grown to 1,044 lines. The codification pipeline routes new rules to CLAUDE.md by default, which means trigger-scoped rules (firing at scope-lock, brief-write, specific surfaces) load on every session alongside the must-always rules. Claude Code's documented effective instruction budget is ~100-150 rules per session; CLAUDE.md alone is past that ceiling. The result is instruction-adherence degradation on the rules that genuinely fire every session, not just on the trigger-scoped ones.

conventions.md has grown to 2,223 lines, organized chronologically by codification phase (Phase 1.5A / Phase 1.2 / Round-2 / etc.). The organizing axis is wrong for retrieval: at session time, sessions search for rules by surface ("how do I handle Zod?"), not by codification date. Find-time has degraded; duplicate rules exist between CLAUDE.md and conventions.md and between sections within conventions.md.

**The proposal.** Restructure the instruction-loading architecture into seven distinct mechanisms, each with a clear destination criterion. Split conventions.md into eight topical files. Trim CLAUDE.md to ~200 lines of must-always rules plus pointers. **Pilot** `.claude/rules/` on a narrow three-file set (services, migrations, docs-codification) with hard-gate verification before any expansion. Add a `codify-convention` skill that enforces the routing decision at codification time, not after.

**Sequencing.** Six commits, executed after Phase 6.5 retrospective closes. Each commit is independently revertible. Content preservation precedes refactoring; refactoring precedes automation. The `codify-convention` skill lands at Commit B — immediately after the topical split — so the routing forcing function is in place before any subsequent commit.

**Risk profile.** Low for the topical split, the CLAUDE.md trim, the skills, and the subagents. Calculated bet narrowed: `.claude/rules/` adoption is now a verified three-file pilot rather than full adoption, with InstructionsLoaded hook gate before any rule lands; mitigations in §10. The pilot framing means the highest-risk piece can fall back cleanly without re-architecting the rest.

**Decision required.** Final CTO sign-off on (a) the target architecture in §3, (b) the topical split for conventions in §5, (c) the revised sequencing in §11, and (d) the four operator decisions in §13 (all four now have CTO-selected positions).

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
2. Adding a `codify-convention` skill that makes destination-selection a forcing function (landing at Commit B, immediately after the topical split)
3. Adding a `.claude/rules/docs-codification.md` rule that fires when WSL Claude touches friction-journal or retrospective surfaces (part of the three-file pilot)
4. Inserting routing-pointer headers in every topical convention file

## 3. Target architecture

Seven instruction-loading mechanisms, each with one purpose:

| Mechanism | Load timing | Purpose | Lives in |
|---|---|---|---|
| Root CLAUDE.md | Always (session start) | Must-always rules + routing index | `CLAUDE.md` |
| AGENTS.md | Always (via @AGENTS.md import) | Cross-tool baseline | `AGENTS.md` |
| Per-workspace CLAUDE.md | When working in workspace subtree | Workspace-scoped must-always | `apps/web/CLAUDE.md` initially (only where needed) |
| Topical conventions | On @ reference or directed reading | Codified rules organized by surface | `docs/04_engineering/conventions/<topic>.md` |
| Path-scoped rules | When matching files are read or opened during work | Operational projections of conventions | `.claude/rules/<area>.md` with `paths:` frontmatter (3-file pilot at launch) |
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
- Fires on a file glob → `.claude/rules/` (pilot scope only at launch; see §6)
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
 source-of-truth, and at the codify-convention skill as the
 forcing function.]

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

### Multi-line Edit anchor confirmation
[~25 lines, retained from current CLAUDE.md. Standing rule for
 sessions that edit code (most sessions). `.claude/rules/editing.md`
 is the future projection target if pilot expands per Decision 2.]

### When in doubt
[Unchanged from current ~15 lines]

## Phase 1 simplifications
[~5 lines, compressed from current ~10. Pointer to
 docs/03_architecture/phase_simplifications.md.]
```

Total: ~225 lines. Down from 1,044. (v2.1: +25 lines for Edit anchor confirmation as a standing rule; still well under the 300-line acceptance criterion in §12.)

### 4.1 What moves out of CLAUDE.md

Every trigger-scoped rule moves to its appropriate destination. Specifically:

| Current CLAUDE.md section (lines) | Moves to |
|---|---|
| UI-session screenshot gate (~30 lines) | `.claude/skills/ui-session-screenshot-gate/SKILL.md` |
| Multi-line Edit anchor confirmation (~25 lines) | **stays in CLAUDE.md** as a standing rule for code-editing sessions (most sessions); `.claude/rules/editing.md` is the future projection target if pilot expands per Decision 2. |
| Bidirectional iterative-catching termination (~20 lines) | `conventions/session-execution.md` |
| Substrate-now-enforcement-later (~35 lines) | `conventions/session-execution.md` |
| Substrate-mod test staleness review (~25 lines) | `conventions/migrations.md` |
| Plan-authoring transitive-dependency verification (~55 lines) | `conventions/session-execution.md` |
| Memory-writes-only Stage 6 firing-shape (~30 lines) | `conventions/session-execution.md` |
| RI-1 through RI-10 cluster (~410 lines) | `conventions/session-execution.md` (new section: "Scope-lock discipline"; subject to sub-split per §5.1 if total >600 lines) |
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

Option B is cleaner for cross-tool ergonomics (Cursor and other tools may not follow symlinks). **Selected: Option B per Decision 1 (§13).**

### 5.1 What goes in each topical file

**README.md (~80 lines).** The routing rule. Promoted from current §Documentation Routing. Decision tree for "where does a new rule go?" Read first on directory entry.

**code.md (~150 lines).** Naming, formatting, casing, file-top comment staleness review (moved from CLAUDE.md), audit before_state discipline, NOT NULL blast radius (currently scattered §204-275). (Multi-line Edit anchor confirmation stays in CLAUDE.md per §4.1 — it fires every session that edits code, so it functions as a standing rule rather than a topical code convention.)

**service-layer.md (~200 lines).** Webhook handler conventions (moved from CLAUDE.md), service template structure, three-consumer pattern, error handling review rule (currently CLAUDE.md only + §245-258).

**schema.md (~120 lines).** Zod strict-vs-passthrough (dedupe of current CLAUDE.md + §230), JSON schema generation. The dedupe is the highest-priority cleanup in this file.

**migrations.md (~200 lines).** Migration review cadence (§238-275), seed-data PII placeholder (from CLAUDE.md), substrate-mod test staleness review (from CLAUDE.md), NOT NULL column blast radius.

**audit-permissions.md (~150 lines).** Permission keys vs audit action keys (§119-175), audit-action naming split (from CLAUDE.md), permission catalog count drift discipline.

**testing.md (~150 lines).** Currently scattered; consolidates Round-2 and Phase 1.2 test-related entries.

**ai-agents.md (~150 lines).** Currently scattered; consolidates agent-tool authoring rules from existing skill plus codified agent-related conventions.

**session-execution.md (~700 lines estimated; conditional sub-split per below).** The big one. Contains:
- Plan-authoring conventions (currently §279, §407, §429, §472, §509, §543 + CLAUDE.md transitive-dependency)
- Scope-lock discipline (the RI-1 through RI-10 cluster from CLAUDE.md)
- Session-close conventions (memory-writes-only Stage 6, etc.)
- Bidirectional iterative-catching termination
- Substrate-now-enforcement-later

**Conditional sub-split.** If `session-execution.md` exceeds 600 lines after Commit A's content migration, sub-split atomically within the same commit into:

```
docs/04_engineering/conventions/session/
├── README.md             # Routing inside session/, table-of-contents
├── plan-authoring.md     # Plan-authoring conventions
├── scope-lock.md         # RI-1 through RI-10 cluster
├── session-close.md      # Memory-writes-only Stage 6, etc.
└── iterative-catching.md # Bidirectional iterative-catching termination
```

The sub-split is a conditional acceptance criterion on Commit A — not a separate commit. If triggered, the move and the sub-split happen atomically so the repo never sits in a "giant `session-execution.md` exists" intermediate state. The 600-line threshold is the hard gate; below it, the single-file form is acceptable and ships as-is.

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

## 6. .claude/rules/ adoption (limited pilot)

This is the highest-risk part of the proposal because of open Claude Code bugs (§10). The benefits are real but adoption is now a **verified three-file pilot** with hard-gate InstructionsLoaded verification, not broad adoption. Expansion beyond the pilot is deferred until the pilot proves out.

### 6.1 Target files — pilot scope (3 files)

```
.claude/rules/
├── services.md              # paths: apps/web/src/services/**/*.ts
├── migrations.md            # paths: supabase/migrations/**/*.sql
└── docs-codification.md     # paths: friction-journal, CLAUDE.md, conventions/
```

Three files, each with a `paths:` frontmatter. Each is a short (≤50 lines) operational projection of the corresponding topical conventions file — not a duplicate of it.

**Pilot rationale (per Decision 2 selection in §13):**
- `services.md` and `migrations.md` are read-heavy surfaces (editing existing code), so bug B (no-load-on-Write per §10.1) does not bite.
- `docs-codification.md` is the load-bearing one: it makes the routing forcing function visible at the moment WSL Claude touches codification surfaces. Even if `.claude/rules/` adoption falls back for the others, this one needs to land somehow (and falls back to a per-workspace CLAUDE.md note if the mechanism itself is broken).

**Deferred from initial adoption** (each has an explicit reason):

| File | Reason deferred |
|---|---|
| `editing.md` | Broad `paths: **` is the worst case for bug A; if rules load globally regardless of `paths:`, this one always loads. Multi-line Edit anchor discipline stays in CLAUDE.md as a standing rule (§4, §4.1) — it fires every session that edits code. |
| `tests.md` | Overlaps with existing `integration-test-rules` skill. |
| `audit-permissions.md` | Wait until pilot proves out. |
| `ai-tools.md` | Wait until pilot proves out. |

Expand the pilot only after InstructionsLoaded verification (§10.1, §11 Commit C pre-step) confirms that `paths:` frontmatter actually scopes loading on this repo and machine setup.

### 6.2 What rules vs conventions vs CLAUDE.md says

**A worked example.** The Zod strict-vs-passthrough discipline:

**`conventions/schema.md`** (canonical statement, ~50 lines):
> Full discipline: when authoring Zod schemas for chounting-defined shapes, use `.strict()`. When authoring schemas for third-party API responses, use `.passthrough()`. Rationale: <evidence>. Edge cases: <cases>. Precedent: <commits>.

**`.claude/rules/services.md`** (operational projection, 3 lines; pilot file):
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

**Always quote glob patterns.** YAML treats `*` and `{` as reserved indicators; unquoted patterns silently fail (bug C per §10.1).

## 7. Skills additions

Three new skills, beyond the existing five.

### 7.1 codify-convention (Commit B — immediately after topical split)

```yaml
---
name: codify-convention
description: Use when promoting a friction-journal pattern to a codified convention after N≥3 fires. Walks the routing decision tree, picks the destination file, drafts the codification block with origin metadata.
---
```

This is the forcing function for routing. When a future codification session invokes it, the skill (a) reads `conventions/README.md`, (b) walks the decision tree against the candidate rule, (c) names the destination, (d) drafts the codification with proper origin metadata. This is the mechanism that prevents the "default to CLAUDE.md" failure mode from recurring.

**Why this lands at Commit B (not Commit E):** the routing failure is the thing the reorg is trying to prevent from recurring. The routing skill must exist as soon as the new convention structure exists — otherwise the window between the topical split and the skill landing is when any in-flight codification (e.g., a Phase 7 chunk close) could land in the wrong place.

### 7.2 phase-retrospective (Commit F — paired with remaining skills)

```yaml
---
name: phase-retrospective
description: Use at phase close to draft a retrospective writeup. Surfaces codification candidates from friction-journal, routes them via codify-convention skill, drafts the retrospective doc.
---
```

Wraps `codify-convention` for the bulk-codification case (5-12 candidates per retrospective). Lands at Commit F so `codify-convention` has had Commits C-E to prove itself on one or two candidates first.

### 7.3 ui-session-screenshot-gate (Commit F)

Extracted from current CLAUDE.md lines 105-134. Fires on UI-session sessions. Documented in §4.1.

### 7.4 Skills NOT added now

The critique proposed `review-ledger-impact` and `review-ai-tool-contract` as skills. Defer these. They overlap with the audit framework at `docs/07_governance/audits/`. Decide post-reorg whether they're skills, subagents, or both.

## 8. Subagents additions

**Two new subagents, not five.** Start small, add when patterns earn their place. Lands at Commit E (after CLAUDE.md trim).

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

Minimal. Current `.claude/settings.json` is well-shaped (permissions only, no hooks). Two additions, both deliberate.

### 9.1 claudeMdExcludes for non-current-arc files

Per Claude Code docs, `claudeMdExcludes` in `.claude/settings.local.json` allows excluding specific CLAUDE.md files by glob from being loaded as ancestor instructions. Not used in this proposal, but documented as available if future per-workspace CLAUDE.md files create context bloat.

### 9.2 InstructionsLoaded hook (local-during-reorg + operator decision post-Commit-D)

Per Claude Code docs, this hook logs which instruction files load at session start. It is the verification mechanism for the `.claude/rules/` pilot — without it, there is no way to confirm whether `paths:` frontmatter actually scopes loading on this repo and machine setup. The InstructionsLoaded hook must not block, mutate files, or add behavioral instructions; it is observability-only. This is a scope constraint on the hook — it logs what loads, nothing more.

Hooks are code-execution infrastructure and should be treated as such, not as documentation. Treatment:

1. **During the reorg execution window** (Commits B–D), enable the hook in `.claude/settings.local.json` (gitignored, machine-local). This gives the operator visibility into rule loading without committing the hook to the team-shared `.claude/settings.json`.
2. **At Commit C pre-step** (the `.claude/rules/` pilot landing), the operator runs verification sessions using the local-enabled hook. Confirms `/memory` shows pilot rules loading only on matching paths (acceptance criteria in §11 Commit C).
3. **After Commit D is verified clean**, the operator decides whether to commit the hook to team-shared `.claude/settings.json`. This is a deliberate post-execution decision, not an automatic step. Rationale: `InstructionsLoaded` is useful beyond the reorg window for ongoing visibility into "did the rule load when expected?" as the codification pipeline keeps adding `.claude/rules/` files over time — but the operator should see the hook's actual output during reorg execution before committing it for the team.
4. The operator-decision step lands in Commit F if the operator opts to commit the hook; otherwise it stays in `.claude/settings.local.json` indefinitely.

## 10. Risks and mitigations

### 10.1 .claude/rules/ has known bugs (pilot-scoped mitigation)

Three documented Claude Code issues affect `.claude/rules/`:

**Bug A: Path-scoped rules may load globally regardless of `paths:`** (GH issue #16299). Some Claude Code versions load all `.claude/rules/*.md` files at session start regardless of frontmatter. If this fires on chounting, the supposed adherence benefit disappears — `.claude/rules/` becomes equivalent to adding to CLAUDE.md.

**Mitigation (hard gate, not optional).** Enable InstructionsLoaded hook in `.claude/settings.local.json` before Commit C. Verify with `/memory` that pilot rules only appear when their `paths:` would match. **If they load globally, halt Commit C; defer `.claude/rules/` adoption entirely and use per-workspace CLAUDE.md files instead** (which work reliably). The pilot-scope framing means the fallback affects three files, not seven, so the fallback path is smaller and cheaper than v1's full-adoption design.

**Bug B: Rules don't load on file Write, only on Read** (GH issue #23478). When Claude creates a new file matching a `paths:` glob, the rule is not in context at write time. The rule fires only after a subsequent Read.

**Mitigation:** The pilot scope excludes file-creation-discipline rules from `.claude/rules/`. Multi-line Edit anchor confirmation stays in CLAUDE.md as a standing rule (§4, §4.1) — not in `.claude/rules/editing.md`, since the pilot defers `editing.md` and the rule fires every session that edits code. Header rules for new ADRs, frontmatter rules for new specs, naming rules for new modules — these stay in CLAUDE.md or in template files. `.claude/rules/` pilot files (`services.md`, `migrations.md`, `docs-codification.md`) are all editing-existing-files discipline.

**Bug C: YAML syntax gotchas** (GH issue #13905). Unquoted glob patterns (`paths: **/*.ts`) silently fail parsing. Always quote.

**Mitigation:** Use the verified-correct frontmatter format in §6.3. Add a pre-commit hook (Commit F) that lints `.claude/rules/*.md` frontmatter for quoted globs.

### 10.2 Codification mid-reorg

If a Phase 7 codification fires before the reorg is complete, the codification could land in the about-to-move section, creating merge friction.

**Mitigation.** The sequencing in §11 explicitly waits for Phase 6.5 retrospective to close before starting. Phase 7 chunks should not start before the reorg completes if at all avoidable. If a Phase 7 codification must fire mid-reorg, route it to the friction-journal with `[ROUTE?]` tag; codify properly after reorg lands. The §11 staleness gate (more than two phases between sign-off and execution → return for re-verification) also protects against this drift.

### 10.3 Cross-reference breakage

Other docs (DEV_WORKFLOW.md, friction-journal, ADRs, briefs) link to specific sections in current `conventions.md`. Topical split breaks those anchors.

**Mitigation:** Pre-execution grep sweep: enumerate all `conventions.md#<anchor>` references across the repo. Update each in the same commit that moves the target section. Acceptance criterion in §12: zero broken anchors post-execution, verified by the three CTO-provided grep commands.

### 10.4 Subagent context cost

Subagents run in their own context window, which is good for isolation but adds dispatch latency and the operator can't easily inspect what they did mid-flight.

**Mitigation:** Two subagents only (ledger-reviewer, migration-reviewer). Both read-only. Both restricted to Read/Grep/Glob tools. No write capability means no surprises.

### 10.5 Codification routing default isn't sticky

We just observed (Phase 6.5 planning) that the current routing rule was not followed despite existing. The reorg surfaces the rule more prominently, but doesn't mechanically enforce it.

**Mitigation:** The `codify-convention` skill (§7.1) is the forcing function, and it lands at Commit B — immediately after the topical split — to close the window where a mid-reorg codification could land in the wrong place. Future codification sessions are explicitly instructed (in CLAUDE.md, in `conventions/README.md`, in `.claude/rules/docs-codification.md` once the pilot lands at Commit C, and in the topical file headers) to invoke this skill before adding any new codified rule. Four redundant pointers reduce the failure mode to "session explicitly ignores all four," which is detectable post-hoc.

### 10.6 Operator unavailable mid-reorg

The reorg is 6 commits with verification steps between them. If operator is unavailable mid-reorg, the repo is in a partial-reorg state.

**Mitigation:** Each commit is independently revertible and leaves the repo in a working state. Commit A (topical split with full content preservation, plus conditional sub-split for `session-execution.md`) leaves CLAUDE.md unchanged and adds a working `conventions/` folder. Commit B (codify-convention skill) is purely additive. Commit C (`.claude/rules/` pilot) can be reverted. Commit D (CLAUDE.md trim) is the one that requires the topical files in place. Operator can stop after any commit and resume later.

## 11. Sequencing and execution plan

Six commits, executed sequentially, post-Phase-6.5-retrospective-close. Each commit is independently revertible.

**Staleness gate.** If more than two phases land between CTO sign-off and reorg execution, return for re-verification. The structural inventory in §2 may be out of date.

**Sequencing change vs v1.** The `codify-convention` skill moves from v1's Commit E to v2's Commit B, immediately after the topical split. This is the load-bearing change in the v2 sequence — the routing forcing function must exist as soon as the new structure exists. Subagents move to Commit E (from v1's Commit D); remaining skills move to Commit F (from v1's Commit E). `.claude/rules/` pilot moves to Commit C (from v1's Commit B), narrowed to three files.

### Commit A: Topical conventions split

**Scope:** Split current `docs/04_engineering/conventions.md` into the eight topical files in `docs/04_engineering/conventions/`. Update top-level `conventions.md` to be the ~50-line index per §5.2.

**Constraints:**
- Every current rule survives. Zero content deleted.
- Origin metadata footer added to each rule per §5.3.
- All current cross-references from other docs updated in the same commit.

**Acceptance criteria:**
- Three content-preservation checks pass (per §12 criterion (1)): heading-count diff, origin metadata grep, anchor-reference grep.
- `pnpm adr:lint` passes (no ADR references broke).
- Existing scripts (`scripts/check-friction-journal-line-length.sh`, etc.) pass unchanged.
- **Conditional sub-split.** If `session-execution.md` exceeds 600 lines after content migration, sub-split atomically within this same commit into `conventions/session/` with `README.md`, `plan-authoring.md`, `scope-lock.md`, `session-close.md`, `iterative-catching.md` per §5.1. The sub-split is part of Commit A, not a separate commit — the repo never sits in a "giant `session-execution.md` exists" intermediate state.

**Estimated effort:** 75-90 minutes (105-120 if conditional sub-split fires).
**Reversibility:** `git revert <sha>` restores the single-file `conventions.md`.

### Commit B: codify-convention skill only

**Scope:** Add `.claude/skills/codify-convention/SKILL.md` per §7.1. Update `.claude/skills/README.md` trigger index to reference it. No other skills land in this commit.

**Pre-step:** Enable InstructionsLoaded hook in `.claude/settings.local.json` per §9.2. This gives visibility into instruction loading for the subsequent Commit C pilot verification.

**Acceptance criteria:**
- `SKILL.md` frontmatter correct (name, description).
- Skill body walks the routing decision tree against a hypothetical N=3 graduation candidate from friction-journal and produces a correct destination call (verified in a test session).
- `conventions/README.md` (landed in Commit A) references the skill as the forcing function for routing.

**Estimated effort:** 30-45 minutes.
**Reversibility:** Delete the skill directory.

### Commit C: .claude/rules/ pilot (3 files)

**Scope:** Add three files under `.claude/rules/` per §6.1: `services.md`, `migrations.md`, `docs-codification.md`. Each is a short operational projection (≤50 lines) pointing at the topical conventions file for full discipline.

**Pre-step (hard gate, not mitigation).** With the InstructionsLoaded hook enabled in `.claude/settings.local.json` from Commit B, verify on a test session that `.claude/rules/*.md` files with `paths:` frontmatter only load when matching files are read or opened. **If bug A (§10.1) fires — rules load globally despite `paths:` — halt this commit. Defer `.claude/rules/` adoption entirely. Apply the fallback specification below.**

**Fallback specification (if Commit C bails):**
- Do not create `.claude/rules/`.
- Put `services.md` and `docs-codification.md` reminders in `apps/web/CLAUDE.md` only if the rules are web-scope (services pilot file is web-scope; docs-codification is repo-wide).
- For repo-wide rules with no safe subtree target (`docs-codification.md`), keep the reminder in root CLAUDE.md — under 40 lines, pointer-only, not a full canonical body.
- Keep migration discipline in `supabase/migrations/CLAUDE.md` or root CLAUDE.md only if no safe subtree target exists.
- Each fallback file: 40 lines hard, pointer-only, references `docs/04_engineering/conventions/<topic>.md` for the canonical body.
- Do not reintroduce broad trigger-scoped content into root CLAUDE.md.

**Bail → Commit D scope.** After bailing Commit C, the fallback files land as part of Commit D's scope. The reorg does not pause; it routes around the pilot failure. Commits D, E, F proceed unchanged. The "durable win" (per CTO sign-off framing: A + B + D) lands regardless of Commit C outcome.

**Acceptance criteria:**
- In a test session, Read `apps/web/src/services/foo.ts` and confirm via `/memory` that `services.md` rule is loaded.
- In a test session, Read `apps/web/src/components/foo.tsx` and confirm via `/memory` that `services.md` rule is NOT loaded.
- All frontmatter glob patterns quoted per §6.3.
- Pre-commit linter (added in Commit F) passes on `.claude/rules/` files once it lands.

**Estimated effort:** 45-60 minutes including verification.
**Reversibility:** Delete the `.claude/rules/` directory.

### Commit D: CLAUDE.md trim

**Scope:** Trim CLAUDE.md to ~200 lines per §4. Move trigger-scoped sections to their destinations (already in place from Commits A and C). Add the Codification routing section referencing `codify-convention` (landed in Commit B).

**Acceptance criteria:**
- CLAUDE.md line count under 300.
- Every removed section's content exists in its new destination (verified by cross-reference).
- `@AGENTS.md` import retained.
- Push readiness gate, "what done means," and "when in doubt" sections unchanged.
- Post-Commit-D operator-decision checkpoint per §9.2: operator decides whether to commit the InstructionsLoaded hook to team-shared `.claude/settings.json`. If yes, hook commitment lands in Commit F; if no, hook stays in `.claude/settings.local.json` indefinitely.

**Estimated effort:** 30-45 minutes.
**Reversibility:** `git revert` restores the long CLAUDE.md. Topical files remain populated, so reverting is purely cosmetic.

### Commit E: Two subagents

**Scope:** Add `ledger-reviewer.md` and `migration-reviewer.md` to `.claude/agents/`. Read-only, restricted tools per §8.

**Acceptance criteria:**
- Each subagent file has correct frontmatter (name, description, tools, model).
- Test invocation on a sample diff (ledger-reviewer against a ledger-touching commit; migration-reviewer against a recent migration) produces sensible findings.

**Estimated effort:** 60-90 minutes including test invocations.
**Reversibility:** Delete the agent files.

### Commit F: Remaining skills + hooks/linting

**Scope:**
- Add `phase-retrospective` and `ui-session-screenshot-gate` skills to `.claude/skills/` per §7.2 and §7.3. Update `.claude/skills/README.md` trigger index.
- Add a pre-commit hook script `scripts/lint-rules-frontmatter.sh` that verifies `.claude/rules/*.md` files have quoted glob patterns (bug C mitigation per §10.1).
- Add the hook to `scripts/install-hooks.sh`.
- If the operator decided post-Commit-D to commit the InstructionsLoaded hook to team-shared `.claude/settings.json` per §9.2, that commit lands here.

**Acceptance criteria:**
- Each new `SKILL.md` has correct frontmatter.
- `phase-retrospective` skill produces correct draft retrospective when tested on a recent (pre-reorg) phase close.
- `bash scripts/lint-rules-frontmatter.sh` passes on all current `.claude/rules/` files.
- Pre-commit hook fires when modifying `.claude/rules/*.md` files.
- If the operator opted to commit the InstructionsLoaded hook, `.claude/settings.json` diff is reviewed and the local-vs-shared semantics are clear.

**Estimated effort:** 45-75 minutes.
**Reversibility:** Delete the skill directories; remove hook from `install-hooks.sh`; revert the lint script; revert the `.claude/settings.json` hook addition if it landed here.

### Total estimated effort

**4-6 hours of focused work, split across six commits over 1-2 sessions.** If executed with WSL Claude verification passes between commits (per chounting's standard pre-execution verification pattern), add ~30 minutes per commit for verification reports.

## 12. Acceptance criteria for the reorg as a whole

The reorg is "done" when all of the following hold:

1. **Content preservation verified by three mechanical checks** (replacing v1's line-count-only check). The operator runs these three commands and confirms each result before declaring Commit A complete:

```bash
# 1. Count rule headings before and after.
rg '^### |^## ' docs/04_engineering/conventions.md > /tmp/conventions-before-headings.txt
rg '^### |^## ' docs/04_engineering/conventions docs/04_engineering/conventions.md > /tmp/conventions-after-headings.txt
# Expect: every heading from before file appears in after directory (after may have more due to README.md addition).

# 2. Check origin metadata exists for migrated codified rules.
rg 'First codified:|Evidence basis:|Promoted from:|Cross-references:' docs/04_engineering/conventions/
# Expect: matches across every topical file with previously-codified rules.

# 3. Check old anchor references are gone or rewritten.
rg 'conventions\.md#|CLAUDE\.md#' docs apps scripts
# Expect: matches only against live anchors in the new structure.

# 1d. Duplicate-rule-body check (post-Commit A and post-Commit D).
rg 'Zod strict|audit-action naming|seed-data PII|webhook route handler|RI-[0-9]+' \
  CLAUDE.md docs/04_engineering/conventions docs/04_engineering/conventions.md
# Expect: each moved rule has one canonical full body in conventions/, plus short
# pointers only in CLAUDE.md where intended. Any duplicate full body in CLAUDE.md
# is a duplicate-authority failure — the rule has two homes and routing pipeline
# will fragment.

# 1e. Section-header diff between CLAUDE.md and topical conventions.
rg '^### ' CLAUDE.md | sort > /tmp/claude-md-h3.txt
rg '^### ' docs/04_engineering/conventions/ | awk -F: '{print $NF}' | sort -u > /tmp/conventions-h3.txt
comm -12 /tmp/claude-md-h3.txt /tmp/conventions-h3.txt
# Expect: empty output. Any matching H3 header between CLAUDE.md and conventions/
# is a duplicate-authority candidate. Investigate and consolidate before declaring
# the reorg complete.
```

The grep + section-header diff combination catches duplicates by both content and structure.

2. **CLAUDE.md under 300 lines.** Every remaining rule either fires every session or is a navigation/framing pointer.
3. **conventions.md topical structure.** Eight files under `docs/04_engineering/conventions/` matching §5 (plus the conditional `session/` sub-folder if Commit A triggered the >600-line sub-split). Top-level `conventions.md` is a ~50-line index.
4. **No content deleted.** Every codified rule from pre-reorg state exists in its new home with origin metadata footer.
5. **Cross-references resolve.** `grep -r "conventions.md#" docs/ apps/ scripts/` produces only matches against live anchors. Same for any references to current CLAUDE.md section anchors.
6. **.claude/rules/ pilot verified or rolled back.** Either: pilot rules load only on matching paths (verified via `/memory` per §11 Commit C acceptance criteria), OR pilot adoption is rolled back and per-workspace CLAUDE.md used instead.
7. **Routing forcing function in place.** The `codify-convention` skill exists (landed in Commit B), is referenced from CLAUDE.md, `conventions/README.md`, `.claude/rules/docs-codification.md` (if pilot survived), and every topical file header.
8. **Tooling unchanged.** All existing scripts pass without modification (`adr:lint`, friction-journal scripts, route-tag scanner). New script `lint-rules-frontmatter.sh` passes.
9. **Subagents tested.** Both ledger-reviewer and migration-reviewer produce sensible output on test invocations.
10. **Skills tested.** `codify-convention` produces correct routing decisions on test inputs; `phase-retrospective` produces a sensible retrospective draft on a pre-reorg phase close.
11. **InstructionsLoaded hook posture explicit.** Either committed to `.claude/settings.json` per operator decision post-Commit-D, or documented as staying in `.claude/settings.local.json` indefinitely. Not left ambiguous.
12. **Friction-journal entry filed.** Reorg work itself logged in friction-journal per standard governance practice.

## 13. Operator decisions — CTO-selected positions

All four decisions have CTO-selected positions per the v1 feedback. v2 reflects these as the recommended positions; rationale carried forward from v1 plus any CTO-specific reasoning visible in the feedback document.

### Decision 1 — Top-level conventions.md handling (§5.2)

**Selected: (b) Short index file** at top-level `conventions.md` pointing at `conventions/` folder. ~50 lines.

**Rationale.** Cross-tool ergonomics matter for chounting's multi-tool environment. The CTO note: "In a multi-tool repo, symlinks are a footgun. The index file is slightly redundant, but much more robust." The redundancy of the pointer information at top-level vs `conventions/README.md` is acceptable in exchange for tool-friendly resolution.

### Decision 2 — .claude/rules/ adoption posture (§6, §10.1)

**Selected: (c) Limited adoption** — verified three-file pilot, expand only after InstructionsLoaded verification.

**Pilot scope (explicit):**
- `.claude/rules/services.md`
- `.claude/rules/migrations.md`
- `.claude/rules/docs-codification.md`

**Initially deferred:**
- `.claude/rules/editing.md` (broad `paths:`, worst case for bug A)
- `.claude/rules/tests.md` (overlaps with existing `integration-test-rules` skill)
- `.claude/rules/audit-permissions.md` (wait until pilot proves out)
- `.claude/rules/ai-tools.md` (wait until pilot proves out)

**Rationale.** The CTO note: "The proposal is right to identify `.claude/rules/` as the highest-risk part. The docs support path-scoped rules, but the bug risk is not theoretical. Issue #16299 is still open and reports path-scoped `.claude/rules/` loading globally despite `paths:` frontmatter." The pilot scope narrows the blast radius: `services.md` and `migrations.md` are read-heavy surfaces (bug B doesn't bite); `docs-codification.md` is the load-bearing one for the routing forcing function. Verification is now a **hard gate** (per Commit C pre-step, §11), not a mitigation: if bug A fires, halt the commit and fall back to per-workspace CLAUDE.md.

### Decision 3 — Subagent count at launch (§8)

**Selected: (a) Two subagents** (ledger-reviewer, migration-reviewer). Start small, add when earned.

**Rationale.** Five up front is premature codification; the audit and test-gap surfaces are already covered by existing mechanisms. The CTO note: "`ledger-reviewer` and `migration-reviewer` are high-value because they map to chounting's riskiest surfaces. Adding five reviewers up front would be premature codification."

### Decision 4 — Per-workspace CLAUDE.md files

**Selected: (b) `apps/web/CLAUDE.md` only** initially. Add others if patterns earn them.

**Rationale.** Web app is large enough to warrant its own scoped rules. Per-workspace CLAUDE.md is also the fallback for `.claude/rules/` if Decision 2's pilot fails verification at Commit C. The CTO note: "Claude Code loads ancestor CLAUDE.md files and lazily loads subdirectory ones when reading files there, so per-workspace files are powerful but easy to overuse."

## 14. What this proposal does NOT do

To be explicit about scope:

- **No new canonical conventions, product invariants, ADRs, or source-code behavior are introduced. The reorg adds operational projections of existing rules through `.claude/rules/`, skills, subagents, and hooks.**
- **No canonical sources modified.** ledger_truth_model.md, ADRs, repo-rules.md, DEV_WORKFLOW.md, friction-journal — untouched.
- **No source code changes.** Pure documentation and instruction-loading work.
- **No tooling break.** The friction-journal scripts, ADR linter, ADR generator continue working unchanged.
- **No existing skills rewritten.** Existing five skills stay as-is; three new skills added across Commits B and F.
- **No deprecations.** Every rule is kept, relocated.
- **No new conventions codified.** The codification pipeline is not modified by this proposal — it's redirected.
- **No phase-6 work touched.** Reorg runs strictly post-Phase-6.5-retrospective-close, subject to the §11 staleness gate.

If the CTO wants to additionally deprecate stale rules, codify new ones, or restructure adjacent surfaces (e.g., friction-journal format, retrospective shape), those are separate proposals.

## 15. Closeout summary

**The case for execution.** CLAUDE.md is past the ~150-instruction adherence threshold and growing. conventions.md retrieval-axis is wrong. The codification pipeline defaults to CLAUDE.md because the routing rule isn't visible at decision time. The reorg fixes all three by topical organization plus mechanism introduction, without changing any canonical truth or product invariants. The reorg adds operational projections of existing rules through `.claude/rules/`, skills, subagents, and hooks — new operational content, but no new canonical rules.

**The case against execution.** Six commits is real work. Mid-reorg state is partial. `.claude/rules/` has documented bugs; v2 narrows the pilot to three files with hard-gate verification, but the pilot can still fall back to per-workspace CLAUDE.md if bug A fires. If the CTO has higher-priority work that can't tolerate the operator-time cost of the reorg, defer.

**The case for the timing.** Phase 6.5 retrospective close is the natural inflection point. Executing immediately after means the post-close codifications land in the new structure rather than getting re-shelved. Executing earlier collides with active codification. The §11 staleness gate protects against drift between sign-off and execution: more than two phases between sign-off and execution → return for re-verification.

**The single highest-value thing this proposal does.** It changes the codification routing default from "land in CLAUDE.md" to "route via decision tree." The `codify-convention` skill (landing at Commit B, immediately after the topical split) is the forcing function that makes this stick. Without that mechanism, CLAUDE.md will regrow to 1,044 lines within 3-4 phases regardless of how clean we make it today. With it, the reorg is durable.

**Durable-win framing per CTO sign-off.** If the reorg must bail mid-flight (operator unavailable, bug A fires in Commit C, Phase 7 starts unexpectedly), the three commits that must land for the reorg to be net-positive are **Commit A** (topical conventions split), **Commit B** (`codify-convention` skill), and **Commit D** (CLAUDE.md trim). Commits C, E, F are additive on top of the durable win. If Commit C bails, the fallback rolls into Commit D scope per §11. If E or F bail or get deferred, the core architecture is intact and the routing forcing function is in place. This sharpens the rollback hierarchy: prioritize getting through D, then add C, E, F as conditions allow.

**What changes if conditions can't be met.** v2 is shaped around CTO conditions that are now incorporated into the body (re-sequencing, pilot-scope `.claude/rules/`, hard-gate verification, conditional sub-split for `session-execution.md`, content-preservation checks, hook-as-local-default). If any condition surfaces as infeasible at execution time — for example, if Commit C's verification finds bug A actually fires and the `.claude/rules/` pilot can't land — the proposal is structured so the affected commit falls back cleanly without re-architecting the rest. Specifically: a `.claude/rules/` rollback uses Decision 4's per-workspace CLAUDE.md fallback (`apps/web/CLAUDE.md`) and the remaining commits (D-F) ship unchanged. The conditions are not all-or-nothing; the proposal's commit-level revertibility handles condition-mismatch at the granularity it surfaces.

**Decision points for final CTO sign-off:**
1. Confirm the v2 conditions integration (§11 re-sequencing, §12 content-preservation checks, §13 Decision 2 → (c), §14 first bullet, §5.1 conditional sub-split, §9.2 hook-as-local-default, §11 staleness gate).
2. Confirm target architecture (§3) — unchanged from v1.
3. Confirm topical conventions split (§5) — unchanged from v1.
4. Confirm operator decisions (§13) — all four CTO positions reflected.

Pending final CTO sign-off, this v2 stays draft. On sign-off, the next deliverable is a per-commit execution prompt (one per commit A–F), following chounting's standard pre-execution verification pattern.
