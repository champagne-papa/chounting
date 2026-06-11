# CTO Feedback on Reorg Proposal v1

## What I strongly agree with

The core diagnosis is right. A 1,044-line CLAUDE.md is not just "long"; it is the wrong loading shape. Claude Code's docs now explicitly say to target under 200 lines per CLAUDE.md, and that longer files reduce adherence. They also say imported files are expanded into context at launch, which supports the proposal's warning that `@docs/04_engineering/conventions.md` would recreate the same problem under a different name.

The seven-mechanism architecture is also right:

```
CLAUDE.md        = always-loaded standing rules + router
AGENTS.md        = cross-tool baseline
docs/            = canonical truth
conventions/     = codified rule library
.claude/rules/   = path-scoped operational projections
.claude/skills/  = repeatable workflows
.claude/agents/  = isolated reviewers/researchers
settings/hooks   = enforcement and observability
```

That maps cleanly to Claude Code's documented model. Claude Code reads CLAUDE.md, not AGENTS.md, so importing a tiny AGENTS.md is the right cross-tool pattern. Claude Code also supports `.claude/rules/` with path-specific frontmatter, project skills under `.claude/skills/`, and project subagents under `.claude/agents/`.

I also agree with **Decision 1: use a short top-level `docs/04_engineering/conventions.md` index, not a symlink.** In a multi-tool repo, symlinks are a footgun. The index file is slightly redundant, but much more robust.

I agree with **Decision 3: start with two subagents, not five.** `ledger-reviewer` and `migration-reviewer` are high-value because they map to CHOUnting's riskiest surfaces. Adding five reviewers up front would be premature codification. Claude Code's subagent docs specifically position subagents as isolated, task-specific workers with their own context and tool restrictions, so read-only reviewers are a good fit.

I agree with **Decision 4: start with one workspace-level CLAUDE.md, probably `apps/web/CLAUDE.md` or `apps/web/src/CLAUDE.md`, not one per package.** Claude Code loads ancestor CLAUDE.md files and lazily loads subdirectory ones when reading files there, so per-workspace files are powerful but easy to overuse.

## The biggest change I would make

I would change **Decision 2** from:

> adopt `.claude/rules/` with verification

to:

> **limited pilot first, then expand only after verified behavior on this repo and machine setup.**

The proposal is right to identify `.claude/rules/` as the highest-risk part. The docs support path-scoped rules, but the bug risk is not theoretical. Issue #16299 is still open and reports path-scoped `.claude/rules/` loading globally despite `paths:` frontmatter. Issue #23478 says path-based rules load on Read, not on Write, and it is closed as not planned, which means file-creation rules should not rely on `.claude/rules/`. Issue #13905 confirms the YAML quoting problem around glob patterns, so the proposal is right to require quoted globs.

So my sign-off version would be:

**Decision 2: choose option (c), limited adoption.**

Pilot:
- `.claude/rules/services.md`
- `.claude/rules/migrations.md`
- `.claude/rules/docs-codification.md`

Do not initially add:
- `editing.md` with broad paths
- `tests.md`
- `audit-permissions.md`
- `ai-tools.md`

Expand only after InstructionsLoaded verification proves rules are not globally loading.

Claude Code now has an `InstructionsLoaded` hook event that fires when CLAUDE.md or `.claude/rules/*.md` files are loaded, including at session start and on lazy loads, so the proposal's verification idea is sound. **But I would make that verification a hard gate, not just a mitigation.**

## The second change: move codify-convention earlier

The proposal says the single highest-value fix is the `codify-convention` skill. I agree. But then it puts skills in Commit E, after the topical split, `.claude/rules/`, CLAUDE.md trim, and subagents. **That is too late.**

I would change the sequence to:

```
Commit A: Topical conventions split.
Commit B: Add codify-convention skill only.
Commit C: Pilot .claude/rules/.
Commit D: Trim CLAUDE.md.
Commit E: Add two subagents.
Commit F: Add remaining skills + hooks/linting.
```

**Reason:** the routing failure is the thing you are trying to prevent from recurring. So the routing skill should exist as soon as the new convention structure exists. Claude Code's skill docs explicitly say skills are appropriate when you keep pasting the same checklist or multi-step procedure, and that a skill body loads only when used, which is exactly the shape of "promote this friction-journal pattern into the right destination."

I would still add `phase-retrospective`, but not in the same critical-path commit as `codify-convention`. Let `codify-convention` prove itself on one or two candidates first.

## The third change: tighten the claim "no content invented"

The proposal repeatedly says "no content invented" and "no semantic content changes." That is directionally true for the conventions split, but not fully true for the whole plan.

Adding `.claude/rules/`, new skills, new agents, hooks, and a lint script is **new operational content.** It may not create new canonical accounting or engineering rules, but it does create new instructions and execution surfaces.

I would rewrite that claim as:

> **No new canonical conventions, product invariants, ADRs, or source-code behavior are introduced. The reorg adds operational projections of existing rules through `.claude/rules/`, skills, subagents, and hooks.**

That is more accurate and safer for CTO sign-off.

## The fourth change: watch session-execution.md

The proposal moves the RI-1 through RI-10 cluster plus plan-authoring, scope-lock, session-close, and related rules into `session-execution.md`, estimating around 700 lines. That is acceptable as an intermediate landing zone, but **it risks creating the next "giant file with the wrong retrieval shape."**

I would approve it with this condition:

> **If `session-execution.md` exceeds 600 lines after Commit A, split it immediately into:**
>
> ```
> docs/04_engineering/conventions/session/
> ├── README.md
> ├── plan-authoring.md
> ├── scope-lock.md
> ├── session-close.md
> └── iterative-catching.md
> ```

The RI cluster is exactly the unstable surface the earlier note warned against moving mid-arc. Once you are post-retrospective and already moving it, keep it searchable by behavior, not by "session-execution" as a catch-all bucket.

## The fifth change: improve the content-preservation test

The proposal's acceptance criterion says the diff stat should show "roughly zero net line count." That is useful, but **insufficient.** You can preserve line count while losing anchors, footers, or whole rule blocks.

I would add three mechanical checks:

```bash
# 1. Count rule headings before and after.
rg '^### |^## ' docs/04_engineering/conventions.md > /tmp/conventions-before-headings.txt
rg '^### |^## ' docs/04_engineering/conventions docs/04_engineering/conventions.md > /tmp/conventions-after-headings.txt

# 2. Check origin metadata exists for migrated codified rules.
rg 'First codified:|Evidence basis:|Promoted from:|Cross-references:' docs/04_engineering/conventions/

# 3. Check old anchor references are gone or rewritten.
rg 'conventions\.md#|CLAUDE\.md#' docs apps scripts
```

The acceptance criteria are already good; I would just make them more content-aware.

## My operator decisions

I would answer the four sign-off decisions this way:

**Decision 1 — top-level `conventions.md`:**
Choose **(b), short index file.**

**Decision 2 — `.claude/rules/`:**
Choose **(c), limited adoption first.**
Pilot `services`, `migrations`, `docs-codification` only.
Expand after `InstructionsLoaded` verification.

**Decision 3 — subagent count:**
Choose **(a), two subagents only.**

**Decision 4 — per-workspace CLAUDE.md:**
Choose **(b), `apps/web` only initially.**
Use it as the fallback if `.claude/rules/` misbehaves.

## My final sign-off position

I would sign this as:

**Approved with conditions.**

The conditions:

1. Change `.claude/rules/` from broad adoption to limited verified pilot.
2. Move `codify-convention` immediately after the topical split.
3. Rewrite "no content invented" to "no new canonical rules or product invariants."
4. Add a hard split threshold for `session-execution.md`.
5. Add stronger content-preservation checks beyond line count.
6. Keep `InstructionsLoaded` verification local during the reorg unless there is a clear reason to commit it. Hooks are powerful and should be treated as code execution infrastructure, not just documentation.

The proposal's main thesis is right: **without a routing forcing function, CLAUDE.md will regrow.** The durable fix is not the one-time split; it is the combination of `conventions/README.md`, `codify-convention`, and a smaller root CLAUDE.md that refuses to become the default dumping ground again.
