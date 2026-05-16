# Delivery Model

How chounting moves work from idea to production. Codifies
"phase-scoped trunk-compatible development" per
`docs/03_architecture/branching-and-feature-flag-strategy.md`,
with operational rules for phase lifecycle, ratification, merge
strategy, and rollout.

This doc complements the architecture doc; it does not replace
it. The architecture doc covers WHY the model is shaped this way
(tradeoffs, alternatives, ratification rationale). This doc
covers HOW to operate within it.

## Canonical sources

- `docs/03_architecture/branching-and-feature-flag-strategy.md`
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
- `docs/04_engineering/conventions.md` — branch naming, commit
  conventions, Session Labeling Convention
- `docs/04_engineering/worktree-rules.md` — worktree integration
- `docs/02_specs/glossary.md` — Phase, Session, Phase Branch,
  Worktree, Ratification Gate definitions

## The model in one sentence

> Phases live on temporary integration branches with optional
> ratification gates; staging stays canonical; merges happen at
> phase close, with `--no-ff` to preserve arc topology in git
> history; staging promotes to main at release tags.

## What this is NOT

This is **not** "pure trunk-based development." TBD requires
continuous trunk integration which doesn't fit ratification-
gated governance work. Chounting is hybrid: short product work
goes TBD-shaped to staging directly; long ratification-gated
arcs use phase branches and merge at ratification.

## Trunk language

Per `branching-and-feature-flag-strategy.md`, used consistently
throughout chounting docs:

- **`main`** = production trunk (canonical released state).
- **`staging`** = integration trunk (ongoing work merges here).
- When a doc or prompt says "trunk" without qualifier, it means
  **`staging`** (the integration trunk).

Do not introduce competing terminology. If a doc uses "trunk"
ambiguously, fix the doc to use the explicit branch name or the
qualified phrase ("integration trunk" / "production trunk").

## Phase lifecycle

1. **Phase opens** with a brief at
   `docs/09_briefs/phase-N/brief.md`. The brief carries the
   phase objective, exit criteria matrix (EC matrix), and
   session scoping.
2. **Phase branch created**: `phase/N-short-description` from
   staging.
3. **Worktree created (if long-lived)** at
   `~/projects/chounting-worktrees/phase-N-short-name/` per
   `worktree-rules.md`. Skip for short feature work.
4. **Sessions execute against the brief.** Commits land on the
   phase branch with Session Labeling Convention trailers.
5. **Ratification gates (if applicable)** review work-in-progress
   before merge. Phase 0 used six gates (D1–D6); smaller phases
   may use fewer or none. Gates produce ratification packages at
   `docs/09_briefs/phase-N/<DATE>-d<N>-ratification-package.md`.
6. **Phase exit criteria validated** against the EC matrix. Each
   row in the matrix has an explicit MET / DEFERRED / N/A /
   MISSED disposition; MISSED rows block phase close.
7. **Phase closure**: branch merges to staging via `--no-ff`;
   phase retrospective written; obligations carry to next phase
   via `docs/09_briefs/phase-N+1/obligations.md`.
8. **Worktree (if any) cleaned up** per `worktree-rules.md`.

## What gets feature-flagged

Runtime behavior that needs staged rollout. Per ADR-0020 Out of
Scope, `packages/flags/` is deferred until Phase 2 needs it.
Until that package exists, "feature flag" is a planning concept;
phase-branch isolation is the mechanical substitute for runtime
rollout control.

When `packages/flags/` lands, flags will gate:

- **Workflow entry points.** UI surfaces gated to a subset of
  orgs or users.
- **Agent tool availability.** Specific tools enabled or hidden
  per cohort.
- **Risky enforcement behavior.** New validation that might
  reject existing data, gated behind a flag while operators
  watch for false positives.
- **Staged rollout capabilities.** Features visible to alpha
  cohort first, then expanded.

Flags do **not**:

- Replace **Agent Ladder authority.** The rung is determined by
  promotion ceremony per `agent_autonomy_model.md` §4.1, not
  flag value. Flags can show or hide rung-2 / rung-3 UI controls
  without changing rung authority itself.
- Replace **service invariants.** A flag-off mutation still goes
  through `withInvariants`; the invariants fire regardless of
  flag state.
- Replace **DB constraints.** CHECK / RLS / triggers fire
  regardless of flag state.
- Replace **audit logging.** Every mutation emits `audit_log`
  regardless of flag visibility.

### Flag naming rule

Per the 2026-05-05 founder-review NOTE on flag naming:

> Flags expose rollout / UI surfaces; they do not determine a
> rule's authority or bypass a promotion ceremony. Flag names
> like `agent_ladder_rung_2_enabled` conflate rollout with
> authority and should be avoided. Prefer rollout-shaped names
> like `notify_auto_post_rollout_enabled` or
> `agent_autonomy_controls_ui_enabled`.

The Agent Ladder's authority comes from
`vendor_rules.current_rung` (substrate per ADR-0017) plus the
promotion ceremony per `agent_autonomy_model.md` §4.1, not from
a feature flag's value. A flag named after a rung — even with
"enabled" appended — invites readers to believe the flag itself
authorizes the rung. It does not.

## What gets ratification-gated

- **Governance arcs.** Phase 0 is the canonical example.
- **ADR drafting.** Architectural decisions ratify before code
  consumes them.
- **Architectural decisions with downstream substrate effects.**
  Schema reservations, enum closures, interface contracts.
- **Convention codification at N=3+ fires.** A pattern that has
  fired three times is ready to graduate to a Convention; the
  graduation is ratification-gated.

What is **not** ratification-gated:

- **Feature work.** Ships via standard phase EC matrix; founder
  review at PR level is sufficient.
- **Bug fixes.** Fast-forward through staging.
- **Routine doc edits.** Commit and PR like any change.

If unsure whether something needs a ratification gate, default
to no. Adding gates is cheap; removing accumulated gates after
the fact is harder.

## Ratification gate format

A ratification package doc summarizes work being reviewed and
the founder's verdict. Template per
`docs/09_briefs/phase-0/ratification-packages/2026-05-04-d6-ratification-package.md`.

Founder verdict shapes:

- **`ratify-as-is`** — proceed, commit lands as drafted.
- **`ratify-with-revisions`** — apply edits, re-surface for
  re-confirmation, then commit.
- **`defer`** — surface concerns; no commit; resolve in another
  session or arc.

Gates produce written verdicts. Verbal "looks good" without a
written disposition does not satisfy the gate.

## Commit cadence rules

Per `docs/04_engineering/conventions.md`:

- **Small, single-purpose commits within a Session.** A commit
  scope should be expressible in one sentence.
- **Conventional Commits format.** `feat(scope): subject`,
  `fix(scope): subject`, `chore(scope): subject`,
  `docs(scope): subject`, `briefs(scope): subject`,
  `adr(scope): subject`, etc.
- **Session label trailer.** Every commit carries the Session
  label as a Git trailer per the Session Labeling Convention.
- **Multi-purpose commits land only when bundling is structurally
  required.** Rare; usually a sign that the work should be
  broken into separate commits before landing.

## Merge rules

- **Phase branch → staging:** `--no-ff`. Preserves arc topology
  in git history; the merge commit is the ratification anchor
  and carries a body summarizing phase scope, ratification
  artifacts, and exit criteria. Do not squash a phase branch
  into staging; the per-session commits are part of the audit
  trail.
- **Feature branch → staging:** PR-driven. Merge or squash per
  scope (substrate / governance prefer merge for audit trail;
  routine code prefer squash). Either is acceptable; the choice
  is reviewer judgment, not a rule.
- **Staging → main:** merge commit at release tags (existing
  convention; preserves audit trail).
- **Hotfix flow** (per Session 1 revision R7):
  - Primary path: `hotfix/<topic>-<date>` → `main` (merge
    directly), then `main` → `staging` (merge back).
  - If a hotfix branch must also be applied directly to staging
    (e.g., to unblock concurrent work), fast-forward is
    acceptable **only when** the result produces the same patch
    as main and does not diverge from main. The intended end
    state is staging at or ahead of main on the same hotfix.

## Branch sync rules

Per Session 1 revision R9:

- **Active phase branches sync from staging via `git merge
  staging`** (or `git pull --no-rebase staging`). Merge preserves
  history; rebase rewrites it.
- **Do NOT rebase a phase branch once it is shared** across
  sessions, worktrees, agents, or humans. Rebasing rewrites
  history that other sessions may depend on; references in
  commit messages, ratification packages, and friction-journal
  entries become stale.
- **Rebase is allowed only** before the branch is shared, or for
  short-lived solo feature branches (`feat/<topic>-<date>`
  expected to merge same day).

If a shared branch's history needs cleanup, the cleanup happens
via a follow-on commit (or a merge commit with a body explaining
the cleanup), not via rebase.

## Phase numbering

- **Phase numbers are assigned at phase open** and don't move
  retroactively. Existing phase folders (`phase-1.1`, `1.2`,
  `1.5A/B/C`, `2`) retain their names.
- **New phases use the new naming where natural** —
  `phase/N-short-description` for branches; `phase-N` for doc
  folders.
- **Sub-phases use letter suffixes** (1.5A, 1.5B, 1.5C) when a
  phase splits into named work-streams.
- **Decimal sub-phases** (1.1, 1.2, 1.3, 1.5) are historical;
  new phases prefer letter sub-phases or integer-only numbering.

Numbering is a planning artifact, not a constraint on the
source tree. Renaming an existing phase folder is **not**
allowed (per ADR-0020 Decision item 8 — no retroactive renames).

## Pre-push readiness

Per `CLAUDE.md` § "Push readiness three-condition gate", three
conditions must be met before pushing a phase branch to a shared
branch:

1. **Test-suite health** — `pnpm test` full-suite green at HEAD,
   or deviations documented (mechanism + fix shape +
   carry-forward framing).
2. **Doc-sync reconciled** — invariants / control matrix /
   ledger truth model / shipped code consistent; bidirectional
   reachability diff clean.
3. **Governance closeout** — retrospective written; friction-
   journal updated; conventions earned codified or filed.

Pre-push sanity sequence (run from working-branch HEAD):

```bash
git log --oneline origin/main..HEAD | wc -l    # or origin/staging..HEAD
git status --short                              # expect clean
pnpm agent:validate                             # 26/26 green
pnpm test                                       # Condition 1 evidence
pnpm typecheck                                  # green
```

For rules-only sessions (no source code touched), test-suite
health is implicit (no behavior regressions are possible).
Doc-sync reconciliation and governance closeout still apply.

## Codification status

This delivery model codifies practice **observed across multiple
phases**:

- Phase 0 ratification gates (D1–D6) — six fires established the
  ratification-gate format.
- Phase 1.2 phase branch — the phase-branch-merges-to-staging
  pattern.
- Phase 1.5 sub-phase pattern (1.5A / 1.5B / 1.5C) — the
  letter-suffix sub-phase numbering.
- Phase 1 chunk shape (e.g., `storageProviderService` chunk) —
  the build-chunk-within-phase pattern.

The codification gathers existing practice into one place. New
practice that diverges from this doc lands first as a friction-
journal entry, then graduates to an amendment here at N=3 fires
(per the standard codification threshold).
