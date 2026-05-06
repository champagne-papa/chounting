# Worktree Rules

When to use git worktrees in chounting, when not to, where they
live, and how to manage them. Codified at N=1 (the Phase 0
governance arc was the single observed fire); rule shape may
amend in place if Phase 1+ uses worktrees and the rules need
updating.

This doc complements `docs/03_architecture/branching-and-feature-flag-strategy.md`
(which carries the canonical worktree-strategy section). The
architecture doc covers WHAT worktrees are and WHY chounting
uses them; this rules doc covers HOW to operate them.

## Canonical sources

- `docs/03_architecture/branching-and-feature-flag-strategy.md`
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
- `docs/07_governance/friction-journal/phase-1.2.md` — concurrent
  session lessons that motivated the Session Lock File Convention
- `scripts/session-init.sh` — session lock acquisition mechanism
  (relative path; per-checkout)
- `docs/04_engineering/conventions.md` § Session Lock File
  Convention

## When to use a worktree

- **Long-lived ratification-gated arcs.** Governance phases like
  Phase 0; structural audits; multi-session arcs with founder
  review gates spanning more than one week of wall-clock time.
- **Coexistence with active staging-shape work.** When
  context-switching between the long-lived branch and staging
  would cost more than the worktree overhead — for example, the
  governance arc needs to ship while a separate session ships a
  hotfix to staging.
- **Multi-session work with toolchain isolation needs.**
  Pre-commit hook re-installation, `node_modules` state isolation,
  and env-file separation between branches all become friction
  when the same checkout swaps branches frequently.

## When NOT to use a worktree

- **Short feature work.** TBD-shaped work with a branch lifetime
  under one day. Use a regular branch and `git checkout` —
  worktree setup overhead exceeds the benefit.
- **Hot fixes.** Branch from main, fix, merge. The hotfix flow
  per `branching-and-feature-flag-strategy.md` does not need
  worktree isolation; the fix cost is lower than the setup cost.
- **Solo experimental branches that won't be shared.** The
  session lock plus a clean checkout is sufficient.
- **Phase 1 chunk work** of the shape "single-session chunk"
  (e.g., `storageProviderService` substrate). Single-session
  chunks don't earn worktree overhead.

If the answer to "should I use a worktree?" is unclear, default
to no. Worktrees are situational tooling; the cost of starting
without one and switching to one mid-arc is lower than the cost
of carrying one when you don't need it.

## Where worktrees live

- **Target** (per ADR-0020):
  `~/projects/chounting-worktrees/<phase-name>/`. New worktrees
  use this location.
- **Grandfathered:** the Phase 0 worktree at
  `.claude/worktrees/phase-0-governance/` remains until
  opportunistic relocation. ADR-0020 explicitly carves this
  exception; do not extend it to new worktrees.
- **Never:** inside the repo at `./worktrees/` without an
  accompanying `.gitignore` rule. If a future arc forces a
  repo-local worktree (don't), `/worktrees/` must be added to
  `.gitignore` first to prevent the worktree's working tree from
  being treated as part of the parent checkout's git status.

## How to create a worktree

```bash
mkdir -p ~/projects/chounting-worktrees
git -C ~/projects/chounting worktree add \
  ~/projects/chounting-worktrees/phase-N-short-name \
  <phase-branch-name>

cd ~/projects/chounting-worktrees/phase-N-short-name
pnpm install                       # populates worktree-local node_modules
bash scripts/install-hooks.sh      # re-installs pre-commit hook
                                   # (worktrees may not inherit
                                   #  hooks from main checkout)
cp ../../chounting/.env.local .env.local  # worktrees do NOT
                                          # share env files
```

If the phase branch does not yet exist, create it first from
staging on the main checkout, then add the worktree against the
named branch.

## How to clean up a worktree

After the phase merges to staging:

```bash
cd ~/projects/chounting              # back to main checkout
git worktree remove ~/projects/chounting-worktrees/phase-N-short-name
```

If the branch hasn't fully merged, `worktree remove` refuses.
Confirm intent (don't lose committed work), then:

```bash
git worktree remove --force ~/projects/chounting-worktrees/phase-N-short-name
```

**Never** `rm -rf` the worktree directory directly. That corrupts
git's worktree registry; recovery is `git worktree prune`
afterward, but missing this step leaves orphaned registry entries
that break subsequent `git worktree list` and `git worktree add`
operations.

## Worktree gotchas

Codified from friction-journal experience across the Phase 0
arc:

- **`node_modules` isolation.** Each worktree has its own
  `node_modules/`. Running `pnpm install` in one does not affect
  the other. After dependency updates on a shared branch, run
  `pnpm install` separately in each active worktree.
- **Pre-commit hooks per-worktree.** `bash scripts/install-hooks.sh`
  must be re-run from inside each worktree. Hooks stored in the
  main checkout's `.git/hooks/` may not fire in the worktree
  depending on git's per-worktree hook resolution.
- **Environment files.** `.env.local` and similar are NOT shared
  across worktrees. Copy or symlink as needed. If a worktree
  needs different env values from the main checkout (rare),
  copy rather than symlink so divergence is intentional.
- **Session lock is per-checkout.** This is the load-bearing
  worktree gotcha. See the next section.
- **Dev server port collisions.** If both worktrees run
  `pnpm dev` simultaneously, port 3000 collides. Use distinct
  ports (`PORT=3001 pnpm dev` in one).
- **TypeScript / IDE caches.** Some IDEs (VSCode TypeScript
  language server) cache per-directory. Each worktree may
  cold-start its language server on first open.

## Session Lock File — per-worktree clarification

This is the load-bearing detail. Per the 2026-05-05 founder
verification of `scripts/session-init.sh`:

> Each worktree has its own `.coordination/session-lock.json`.
> The lock prevents commit-interleave **within a single
> checkout**, not across worktrees. Two sessions in different
> worktrees can acquire separate locks simultaneously.

This is a **feature, not a bug.** It allows concurrent work on
different branches in different worktrees without one session's
lock blocking another's unrelated work.

Mechanism:

1. `scripts/session-init.sh` writes
   `.coordination/session-lock.json` relative to the current
   working directory (the worktree's working tree).
2. The pre-commit hook reads `$COORD_SESSION` from the calling
   shell and matches it against the worktree-local lock file.
3. Each worktree's commits are gated against its own lock;
   cross-worktree commit safety relies on (a) the worktrees
   being on different branches and (b) developers not running
   concurrent sessions against the same branch from different
   worktrees.

If concurrent sessions on the SAME branch from different
worktrees ever becomes a needed pattern, a cross-checkout
locking mechanism would need to be built. No current chounting
workflow requires this; do not pre-emptively build the
cross-checkout lock.

## Worktree vs Session Lock — comparison

| Failure mode | Lock catches it? | Worktree catches it? |
|---|---|---|
| Two sessions commit to same branch interleaved (same checkout) | Yes (pre-commit hook refuses) | N/A — not the worktree's job |
| Two sessions commit to same branch interleaved (different worktrees) | No (each worktree has own lock) | No (worktrees don't gate commits) |
| Two sessions edit same file in working tree concurrently (same checkout) | No (only catches at commit time) | N/A |
| Two sessions edit same file in working tree concurrently (different worktrees on same branch) | No | Partially — different on-disk paths but same `.git/` |
| One session forgets which branch it's on | No | Partially (path makes branch obvious) |
| `node_modules` out of sync after branch swap | No | Yes (each worktree has own) |
| Stale env / dev server / tool state across branches | No | Yes |

Both mechanisms are needed; neither replaces the other. The
session lock is a per-checkout commit-time guard; the worktree
is a per-branch on-disk isolation surface. Use both for
long-lived isolated arcs; use the lock alone for everything
else.

## Decision flowchart

"Should I use a worktree for this work?"

```
Will the branch live longer than 1 week? ── NO ─→ Regular branch
                                                  + session lock
        │
       YES
        ↓
Does the work need to coexist with    ── NO ─→ Regular branch
active staging-shape feature work?            + session lock
        │
       YES
        ↓
Are ratification gates planned? ──────── NO ─→ Long-lived branch
                                              + session lock
                                              (no worktree
                                              unless context-
                                              switching cost
                                              is severe)
        │
       YES
        ↓
Worktree (place under
~/projects/chounting-worktrees/)
```

Most chounting feature work answers "no" at the first or second
question. Worktrees are the exception, not the default.

## Codification status

This rules doc codifies operational discipline at **N=1** (the
Phase 0 governance arc was the single observed fire). The
substrate-now-enforcement-later cross-pattern (per CLAUDE.md
§ "Substrate-now-enforcement-later cross-pattern") justifies
pre-emptive codification at N=1 for patterns where:

- The shape is well-understood (worktrees are standard git).
- The cost of writing the rules doc is low (single doc; no
  source code).
- The rules forward-apply (Phase 1+ uses these rules from day
  one).
- The codification can amend in place if N=2+ usage reveals
  divergence.

If Phase 1 or a future phase uses a worktree and the rules need
amendment, amend this doc in place — do not write a new doc.
Record the amendment in the friction journal so the rule's
provenance stays traceable.
