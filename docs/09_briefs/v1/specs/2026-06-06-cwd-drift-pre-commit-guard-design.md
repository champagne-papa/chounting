# cwd-drift pre-commit guard — design spec

**Date:** 2026-06-06
**Status:** DESIGN — approved in brainstorm; implementation pending
**Arc:** wave-born carry-forward (V1 Wave 6 retrospective §3.2 + §5);
sequenced ahead of cleanup Arc 2 per 2026-06-06 planning session
**Approach:** A (minimal in-hook GIT_PREFIX check) — approved over
B (additional Claude Code PreToolUse layer; recorded as named future
candidate, §9) and C (wrapper-script enforcement; set aside)

## 1. Charter and provenance

Seven recorded fires of commit-shell cwd drift: four attested
Wave-6 fires (operator testimony, ratified at retrospective
read-back F-1(i)), one evidenced at D8 T4 (exit-128 doubled
pathspec), one evidenced at cleanup Arc 1 T2 (drifted `git status`
caught at the verify-in-committing-shell step), one pre-wave
orchestrator-grain instance. One fire is post-codification —
discipline alone won't end the class.

Charter, verbatim (`v1-wave-6-retrospective.md` §3.2):

> a pre-commit guard asserting repo-root cwd + `COORD_SESSION`
> exported whenever `.coordination/session-lock.json` exists —
> named post-wave follow-up

The `COORD_SESSION` half already ships in the installed hook
(`scripts/install-hooks.sh` template: hard block on lock-held-but-
unset and on label mismatch, verified from disk 2026-06-06). This
design adds the missing repo-root assertion.

## 2. Scope grain

**The guard discharges the commit-time charter; it does not fence
the whole drift class.** Mid-session drift at non-commit verbs
(`git status`, `git add` from a drifted shell — the Arc 1 T2 shape)
remains covered by the discipline in `conventions/code.md`
§Commit-shell hygiene only. Conflating the two scopes would be its
own grain-slip; every artifact this arc touches states the
commit-time grain explicitly (§7).

Lock-gated only: no lock → no cwd check. The charter's "whenever
`.coordination/session-lock.json` exists" names the scope and
ratified-contract scope discipline binds it. The existing no-lock
advisory warning (about the lock convention itself) is untouched.

## 3. Mechanism

Git resets cwd to the worktree root before running `pre-commit`
and exports `GIT_PREFIX` — the subdirectory git was invoked from,
relative to toplevel (empty when invoked from root, with empirical
verification gated in §5). The guard is one block added to the
hook template in `scripts/install-hooks.sh`, inside the
lock-exists `else` branch, after the `COORD_SESSION` match check
(failure ordering reads identity-first, location-second;
`$LOCK_LABEL` is in scope there):

```bash
  # ---- cwd guard (commit-shell hygiene; Wave-6 retro §3.2) ----
  if [[ -n "${GIT_PREFIX:-}" ]]; then
    echo "[coordination] error: commit invoked from subdirectory" >&2
    echo "'${GIT_PREFIX}', not the repo root, while session lock" >&2
    echo "'$LOCK_LABEL' is active. Commit-shell hygiene" >&2
    echo "(conventions/code.md) requires repo-root commits under a" >&2
    echo "lock. Run:" >&2
    echo "  cd \"\$(git rev-parse --show-toplevel)\"" >&2
    echo "and retry. Commit blocked. (--no-verify is the deliberate" >&2
    echo "exception path; record why in the commit body if used.)" >&2
    exit 1
  fi
```

Notes:

- `${GIT_PREFIX:-}` is mandatory under the hook's `set -euo
  pipefail` (`set -u` would otherwise abort on the unset var with
  an unhelpful error).
- Catches both `cd apps/web && git commit` and
  `git -C apps/web commit`.
- Hard block at severity parity with the sibling `COORD_SESSION`
  checks (both are "you're not where the lock says you should be";
  two severities in one hook for one drift class would be a
  taxonomy smell). `--no-verify` is the deliberate, visible
  exception path by construction — the block stops accidental
  drift while leaving genuine exceptions a named escape.

## 4. Enforcement-listing sync

`install-hooks.sh` enumerates the hook's enforcement in three
places that must stay in sync: the script header comment, the
in-heredoc hook header, and the final `echo` summary. The listings
enumerate **trigger conditions** (session-lock convention,
ADR-files-staged, rules-files-staged) — and the cwd guard shares
item 1's trigger exactly (fires only when the lock exists). It is
therefore a **second facet of item 1**, not a new item 4: expand
item 1's wording in all three listings to name both facets —
identity (`COORD_SESSION` match) and location (repo-root cwd) —
and leave the count at three. Adding it as a peer of ADR-lint
would split one convention across two non-adjacent list items.

(The three-listing sync is the file-top-comment-staleness
pattern's known surface — name it in the implementation commit
body.)

## 5. Empirical grounding gate — precondition, not footnote

The hard-block decision **rests on** `GIT_PREFIX` being
empty/absent on git-internal commit paths. Per the
prediction-grounding convention this is ungrounded until tested;
a clean matrix is a **ship precondition**, not an assumption. The
implementer produces, before the guard ships, a scratch-repo
matrix with recorded results:

| # | Path | Expected | Gate |
|---|------|----------|------|
| 1 | `git commit` from repo root | prefix empty → pass | must pass |
| 2 | `cd apps/web && git commit` | prefix set → block | must block |
| 3 | `git -C apps/web commit` | prefix set → block | must block |
| 4 | `git commit --amend` from root | pass | must pass |
| 5 | `git rebase --continue` (merge backend, post-conflict, from root) | no misfire | **gate** |
| 6 | `git cherry-pick` (verify whether pre-commit even fires) | no misfire; record `CHERRY_PICK_HEAD` presence at hook time | **gate** |
| 7 | `git merge` — clean auto-commit fires `pre-merge-commit`, not `pre-commit`, so the guard never runs there (verify); the conflicted-merge-resolved-by-`git commit` case is what hits `pre-commit` | guard doesn't fire on clean merge; no misfire on conflicted-resolve from root | **gate** |
| 8 | `git revert <sha>` from root, and `cd apps/web && git revert <sha>` | no false block from root; subdirectory invocation is a *legitimate-revert-wrongly-blocked* risk — the most likely false-block path; record `REVERT_HEAD` presence at hook time | **gate** |
| 9 | `git rebase -i` reword / squash (commit machinery re-invoked mid-sequence) | no misfire | **gate** |
| 10 | `git stash` | no misfire | **gate** |

The matrix's path set is the definition of "clean" for the
ship-bare decision: a result that omits a path certifies a subset.
Rows 8 and 9 exist because the original draft omitted them and
"clean" would have excluded revert — the most likely false-block —
entirely.

**Contingency, pre-named:** if any internal path comes back dirty
(`GIT_PREFIX` non-empty when git itself drives the commit), the
guard gains an in-progress-operation carve-out — skip when
`git rev-parse --git-path` reports an in-flight sequence via any
of: `rebase-merge`, `rebase-apply`, `MERGE_HEAD`,
`CHERRY_PICK_HEAD`, **`REVERT_HEAD`** — and this spec is amended
to record which path forced it. A clean matrix ships the guard
bare. Carve-out coverage, if shipped, splits by **operation
shape**, not by ref: rows 5/7/9 are persistent multi-step
in-progress states whose sentinels (`rebase-merge`/`rebase-apply`,
`MERGE_HEAD`) are reliably live when `pre-commit` fires. Rows 6
and 8 are single-commit, near-instantaneous shapes: git documents
`CHERRY_PICK_HEAD` and `REVERT_HEAD` around *conflict* resolution,
and their presence at `pre-commit` time during a **clean** pick or
revert is unverified — so whether the carve-out would actually
cover a subdirectory-invoked clean cherry-pick or revert is itself
an empirical question. For rows 6 and 8 the matrix therefore
records **sentinel-presence at hook time as a distinct
observation** (not just misfire/no-misfire): that presence decides
whether the carve-out is even the right fix should `GIT_PREFIX`
leak on those paths.

## 6. Rollout

1. Edit the hook template in `scripts/install-hooks.sh`: guard
   block (§3) + item-1 facet expansion in all three enforcement
   listings (§4).
2. Re-run `bash scripts/install-hooks.sh` in the main checkout —
   the existing backup/`cmp` content-equivalence logic handles
   replacement.
3. Worktrees pick the guard up at their documented per-worktree
   `install-hooks.sh` re-run (`worktree-rules.md` setup block,
   verified from disk: "worktrees may not inherit hooks from main
   checkout"). No doc change needed there, but **Arc 2's
   session-open checklist must include the re-run** — it is the
   first arc to commit after the guard lands.

## 7. Doc reconciliation

`conventions/code.md` §Commit-shell hygiene, closing paragraph
(verbatim target, verified from disk 2026-06-06: "The intended
mechanical fix is a **pre-commit guard** … this convention is the
discipline until the guard ships, and the guard's documentation
once it does."): amend to past tense and **anchor the grain** —
the guard enforces *commit-time repo-root-under-lock only*;
mid-session non-commit drift remains discipline-covered; cite the
empirical matrix result. The Origin footer gains a shipped-guard
line with the implementation commit SHA. Friction-journal gets the
arc-close entry.

## 8. Testing

The §5 empirical matrix doubles as the behavioral test. Plus one
live-fire verification in the real repo: rows 1–3 reproduced
against the installed hook. **Lock hazard:** the real repo holds
the live `cwd-guard` session lock for this arc — a scratch lock
written-then-released there would clobber or drop the working
session's lock. The live-fire must either run under the *active*
lock (no scratch lock written) or fold into §5's scratch repo;
**the implementation plan names which.** No vitest surface — git
hooks aren't reachable from the suite, and faking that would test
the mock.

## 9. Out of scope / named future candidate

- **Candidate B — Claude Code PreToolUse layer** (inspect Bash git
  invocations, check cwd at any git verb, in the actual drifting
  actor). Recorded with an evidence-gated trigger: **any
  post-guard fire of the drift class at a non-commit verb.** Not
  absorbed now: exceeds the charter, two mechanisms to keep in
  sync, doesn't cover the operator's own shell, harness-version
  coupling.
- No-lock commits (charter-scoped out).
- Cross-worktree same-branch locking (worktree-rules.md names it
  unbuilt and not currently needed).
- IDE/GUI commit clients (operator flow is CLI).

## 10. Landing verification criteria

At implementation landing, the reviewer verifies from disk:

1. the implemented trigger (lock-gated, `GIT_PREFIX`-keyed, inside
   the lock-exists branch);
2. the block message (names the drifted prefix, the fix, and the
   `--no-verify` exception framing);
3. the `conventions/code.md` amendment wording (commit-time grain
   anchored, no whole-class implication);
4. the item-1 facet expansion across all three enforcement
   listings (count stays three).

The §5 empirical matrix result is the implementer-produced
backstop, read and gated by the operator side before ship.

## 11. Commit shape (indicative)

- **Commit 1** — `feat(coordination)`: guard + listing sync in
  `install-hooks.sh`; re-install; empirical matrix results in the
  commit body (or as a companion note if long).
- **Commit 2** — `docs(conventions)`: `code.md` amendment +
  friction-journal arc-close entry.

Final shape is the implementation plan's call.
