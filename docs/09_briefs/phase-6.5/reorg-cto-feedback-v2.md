# CTO Sign-off on Reorg Proposal v2

## Verdict

**Approved with minor edits.**

The biggest improvement from v1 is that v2 no longer treats `.claude/rules/` as a broad structural dependency. V1 proposed seven rule files up front; v2 narrows that to a three-file verified pilot and explicitly falls back if path scoping misbehaves. That is the right risk posture.

The second major improvement is sequencing. Moving `codify-convention` to Commit B is exactly right. The core failure mode is not just that CLAUDE.md is too long; it is that the codification pipeline has no visible destination-selection step at the moment a rule graduates. V2 correctly makes the routing skill land immediately after the topical split, before the CLAUDE.md trim and before subagents.

The third major improvement is that v2 stays faithful to the earlier "do not reorganize mid-arc" call. The original recommendation was to defer execution until Phase 6 closes and only document the target shape in the meantime; v2 keeps that spirit by targeting post-Phase-6.5 retrospective close and adding a staleness gate.

## What I like most

The architecture is now crisp:

```
CLAUDE.md        = always-loaded standing rules + router
AGENTS.md        = cross-tool baseline
workspace CLAUDE = scoped must-always rules, only where earned
docs/            = canonical truth
conventions/     = topical codified rule library
.claude/rules/   = verified path-scoped operational projections
.claude/skills/  = repeatable workflows
.claude/agents/  = isolated reviewers
settings/hooks   = enforcement and observability
```

That is the right separation of concerns for CHOUnting. It keeps accounting/product truth in `docs`, keeps execution discipline out of canonical specs, and stops CLAUDE.md from becoming a dumping ground.

The proposal also correctly distinguishes canonical rules from operational projections. That language matters. A `.claude/rules/services.md` file should not be the source of truth; it should be a short reminder that points to the relevant convention. V2 says that explicitly, which prevents a second convention system from forming.

## Minor edits I would make before execution

### 1. Change "when editing matching files" to "when reading or working with matching files after a read"

This is the one wording issue I would definitely fix.

The proposal still says path-scoped rules load "when editing matching files" in the architecture table. That is directionally understandable, but technically sloppy. Claude Code's docs say path-scoped rules trigger when Claude reads files matching the pattern, and issue #23478 confirms the important edge case: rules may not load on Write; they load after a matching Read.

So I would revise the row to:

> Path-scoped rules | When matching files are read / opened during work | Operational projections of conventions | `.claude/rules/<area>.md`

And in Commit C acceptance criteria, I would phrase the test as:

> - In a test session, Read `apps/web/src/services/foo.ts` and confirm `services.md` loads.
> - In a test session, Read `apps/web/src/components/foo.tsx` and confirm `services.md` does not load.

That removes ambiguity and lines up with both the docs and the known Write limitation.

### 2. Make the Commit C fallback concrete

V2 says that if bug A fires, halt Commit C and use per-workspace CLAUDE.md fallback. That is correct, but I would specify the fallback destination.

Add this:

> **If `.claude/rules/` pilot fails:**
> - Do not create `.claude/rules/`.
> - Put `services` and `docs-codification` reminders in `apps/web/CLAUDE.md` only if they are web-scope.
> - Keep migration discipline in `supabase/migrations/CLAUDE.md` or root CLAUDE.md only if no safe subtree target exists.
> - Keep each fallback file under 80 lines.
> - Do not reintroduce broad trigger-scoped content into root CLAUDE.md.

The fallback should not accidentally recreate the same always-loaded bloat through nested CLAUDE.md sprawl. Claude Code docs support nested CLAUDE.md files, but they are concatenated when in scope, so they still need size discipline.

### 3. Add one acceptance check for duplicate rule bodies

V2 already has better preservation checks than v1, but I would add a duplicate-detection pass after Commit A and Commit D.

Something like:

```bash
rg 'Zod strict|audit-action naming|seed-data PII|webhook route handler|RI-[0-9]' \
  CLAUDE.md docs/04_engineering/conventions docs/04_engineering/conventions.md
```

Expected result: each moved rule has one canonical full body, plus short pointers only where intended.

The risk is not deletion; the risk is double authority. If the old text remains in CLAUDE.md and the new text exists in topical conventions, future sessions will not know which version wins.

### 4. Clarify hook posture as "observability only"

V2 already treats the `InstructionsLoaded` hook as local-first and not automatically committed. Good. I would add one sentence:

> The InstructionsLoaded hook must not block, mutate files, or add behavioral instructions; it is observability-only.

Claude's docs say `InstructionsLoaded` fires when CLAUDE.md or `.claude/rules/*.md` files are loaded and that it does not support blocking or decision control. Hooks are also executable infrastructure, so the proposal is right to keep them local during verification.

## One thing I would not change

I would **not** move the two subagents earlier.

Keeping subagents at Commit E is correct. The docs describe subagents as separate-context specialists with restricted tool access, which makes them great for read-only `ledger-reviewer` and `migration-reviewer`, but they are not necessary to make the reorg safe. The routing skill is more important than the reviewers.

I would also keep the "two subagents, not five" decision. For CHOUnting, ledger and migration are the highest-risk review surfaces. Audit-security, test-gap, and docs-codifier can be added later when there is enough repeated evidence to justify them.

## Final sign-off language I would use

I'd sign it like this:

> **Approved for post-Phase-6.5 execution, subject to the staleness gate. Execute as six independently revertible commits. Treat `.claude/rules/` as a verified pilot only; if path scoping fails, do not force it. The durable win is Commit A + Commit B + Commit D: topical conventions, codification routing skill, and trimmed root CLAUDE.md.**

The only required pre-execution edits are:

1. Replace "editing matching files" wording with "read/open matching files."
2. Spell out the `.claude/rules/` fallback destinations.
3. Add a duplicate-rule-body grep check.
4. Mark `InstructionsLoaded` as observability-only.

After those edits, I would stop iterating on the proposal and move to per-commit execution prompts A–F. The document is now doing its job: it is no longer just architecture brainstorming; it is an executable migration plan with gates, fallbacks, and rollback boundaries.
