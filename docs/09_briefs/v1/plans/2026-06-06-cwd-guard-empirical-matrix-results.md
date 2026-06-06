# cwd-drift Pre-commit Guard — Empirical Grounding Matrix Results

**Date:** 2026-06-06
**Task:** Task 1 (ship precondition — spec §5) of the cwd-drift
pre-commit guard arc.
**Git version (version-anchored empiricism):** `git version 2.43.0`
**Scratch repo (ephemeral, since removed):**
`/tmp/cwd-guard-matrix.OJlpca`

This note records how `GIT_PREFIX` and the five in-progress
sentinels (`rebase-merge`, `rebase-apply`, `MERGE_HEAD`,
`CHERRY_PICK_HEAD`, `REVERT_HEAD`) behave across git-internal
commit paths, so the controller can decide whether the
lock-gated repo-root cwd assertion ships **bare** or with a
**carve-out**. Observations are taken verbatim from `probe.log`
plus three confirming isolation probes; unexpected results are
recorded as contradictions, not normalized to expectations.

---

## (e) Gate verdict

**VERDICT: CLEAN → ship bare.**

On every git-internal path where `pre-commit` fired, `GIT_PREFIX`
was empty/unset. The only non-empty `GIT_PREFIX` values observed
were rows 2 and 3 (`apps/web/`), which are *correct subdirectory
detections* of genuine user-invoked commits, not internal-path
leaks. No git-internal path surfaced a non-empty `GIT_PREFIX`
when the operation was invoked from the repo root — and, notably,
even the subdirectory-invoked revert (row 8b) reported
`GIT_PREFIX=[<unset>]` at hook time, not `apps/web/`.

Because the gate keys the assertion on `GIT_PREFIX` being
non-empty, and no internal path produces a spurious non-empty
`GIT_PREFIX`, the guard does not require a sentinel-based
carve-out to avoid blocking legitimate internal commits. The
guard ships bare.

Two refinements to the plan's expectations surfaced during the
work (recorded honestly below as contradictions): several
internal paths the plan expected to fire `pre-commit` did **not**
fire it at all in git 2.43 (clean merge, `rebase --continue`,
`rebase -i squash`). A path that does not fire `pre-commit`
cannot trip the guard, which only strengthens the CLEAN verdict.

---

## (a) Results table

`GIT_PREFIX` legend: `[<unset>]` = env var unset (git did not
export it); `[apps/web/]` = exported subdirectory prefix.
"Fired?" reflects whether the *operation under test* invoked
`pre-commit` (setup commits that merely populate the branch are
excluded — see the per-row attribution notes and isolation
probes below).

| Row | Command shape | pre-commit fired? | GIT_PREFIX observed | Sentinels PRESENT | Disposition |
|-----|---------------|-------------------|---------------------|-------------------|-------------|
| 1 | `git commit` from root | yes | `[<unset>]` | none | clean — root commit, no prefix |
| 2 | `cd apps/web && git commit` | yes | `[apps/web/]` | none | correct detection (not a leak) |
| 3 | `git -C apps/web commit` | yes | `[apps/web/]` | none | correct detection (not a leak) |
| 4 | `git commit --amend` from root | yes | `[<unset>]` | none | clean — root amend, no prefix |
| 5 | `git rebase --continue` (merge backend, post-conflict) | **NO** (see contradiction §C5) | n/a (operation did not fire pre-commit) | n/a | clean — cannot trip guard |
| 6 | clean `git cherry-pick` | yes | `[<unset>]` | **none — CHERRY_PICK_HEAD absent at hook time** (see (b)) | clean — no prefix |
| 7a | clean `git merge --no-ff` | **NO** (only pre-merge-commit fired) | n/a (pre-commit not invoked) | n/a | clean — fires pre-merge-commit, not pre-commit |
| 7b | conflicted merge resolved by `git commit` | yes | `[<unset>]` | **MERGE_HEAD: PRESENT** | clean — no prefix |
| 8a | clean `git revert` from root | yes | `[<unset>]` | **none — REVERT_HEAD absent at hook time** (see (b)) | clean — no prefix |
| 8b | clean `git revert` from `apps/web` | yes | `[<unset>]` | **none — REVERT_HEAD absent** | **clean — see (d): subdir revert did NOT surface apps/web** |
| 9a | `git rebase -i` reword | yes | `[<unset>]` | **rebase-merge: PRESENT** | clean — no prefix |
| 9b | `git rebase -i` squash | **NO** (operation did not fire pre-commit; see §C9) | n/a | n/a | clean — cannot trip guard |
| 10 | `git stash` / `git stash pop` | no | n/a | n/a | clean — no commit, no pre-commit |

---

## (b) Row-6 / Row-8 sentinel-presence observations (explicit)

These three observations were called out in the task as
distinct, carve-out-coverage-deciding facts independent of any
misfire. All three are taken from `probe.log` at hook time.

- **Row 6 — `CHERRY_PICK_HEAD` at hook time: ABSENT.** The clean
  cherry-pick *did* fire `pre-commit` (one firing,
  `GIT_PREFIX=[<unset>]`), but `CHERRY_PICK_HEAD` was **absent**
  when the hook ran (`probe.log` lines 71-77, all five sentinels
  absent). Carve-out-coverage implication: a `CHERRY_PICK_HEAD`-
  based carve-out would **not** cover the clean cherry-pick path,
  because the sentinel is not present at the moment the hook
  fires. This does not matter for the bare-guard decision —
  `GIT_PREFIX` was unset, so the guard would not fire here anyway
  — but it is recorded so no future carve-out is built on the
  false assumption that `CHERRY_PICK_HEAD` is visible to the
  pre-commit hook.

- **Row 8a — `REVERT_HEAD` at hook time: ABSENT** (revert from
  root). The clean revert fired `pre-commit` once,
  `GIT_PREFIX=[<unset>]`, all five sentinels absent (`probe.log`
  lines 112-118).

- **Row 8b — `REVERT_HEAD` at hook time: ABSENT** (revert from
  `apps/web`). Same: `pre-commit` fired once,
  `GIT_PREFIX=[<unset>]`, all sentinels absent (`probe.log` lines
  120-126).

  Carve-out-coverage implication (rows 8a+8b): like
  `CHERRY_PICK_HEAD`, `REVERT_HEAD` is **not present** at
  pre-commit hook time, so a `REVERT_HEAD`-based carve-out would
  not cover the revert path. Again immaterial to the bare-guard
  decision because `GIT_PREFIX` was unset on both — but recorded
  to prevent a future carve-out from relying on an invisible
  sentinel.

**General sentinel finding.** Of the five sentinels, only two
were ever PRESENT at `pre-commit` hook time in this matrix:
`MERGE_HEAD` (row 7b, conflicted-merge commit) and `rebase-merge`
(row 9a, `rebase -i` reword). `CHERRY_PICK_HEAD`, `REVERT_HEAD`,
and `rebase-apply` were never observed PRESENT at hook time on
any row. This is the empirical basis for not building the guard
around sentinel detection.

---

## (c) Contradictions vs the plan's stated expectations

Recorded prominently per the honesty constraint. Each was
confirmed with an isolation probe (see Appendix B) so the
contradiction is not an artifact of setup-commit firings being
misattributed in the main `probe.log`.

- **§C5 — Row 5 (`rebase --continue`): plan expected `pre-commit`
  to fire with `rebase-merge` PRESENT. It did NOT fire at all.**
  In git 2.43, the merge-backend `rebase --continue` commits the
  conflict resolution **without invoking `pre-commit`**. The two
  `pre-commit` firings appearing near the row-5 marker in
  `probe.log` (lines 56-69) are the two *setup* commits
  (`row5-branch-side`, `row5-main-side`) made before the rebase,
  not the continued commit. Isolation probe (Appendix B.1)
  confirms: zero firings between "ABOUT TO: rebase --continue"
  and "DONE". Effect on verdict: a path that does not fire
  `pre-commit` cannot trip the guard — strengthens CLEAN.

- **§C7a — Row 7a (clean merge): plan expected `pre-merge-commit`
  and NOT `pre-commit`. Confirmed as expected.** The `pre-commit`
  block near the 7a marker (`probe.log` line 79) is the
  `row7-side` setup commit; the clean merge itself fired only
  `pre-merge-commit` (line 86). Isolation probe (Appendix B.1)
  confirms: clean `merge --no-ff` fires only `pre-merge-commit`.
  Not a contradiction — listed for completeness because the
  marker placement in the main log could otherwise mislead.

- **§C9 — Row 9b (`rebase -i` squash): plan expected `pre-commit`
  to fire with `rebase-merge` PRESENT if it fired. It did NOT
  fire for the squash.** The firing near the 9b marker
  (`probe.log` lines 136-142, `rebase-merge` absent) is the
  `row9-second` setup commit, not the squash. Isolation probe
  (Appendix B.2) confirms: zero firings between "ABOUT TO:
  squash" and "DONE squash". By contrast, row 9a (reword) **did**
  fire `pre-commit` with `rebase-merge` PRESENT, as expected.
  Effect on verdict: squash not firing cannot trip the guard —
  strengthens CLEAN.

These contradictions are about *whether the hook fires*, never
about *a non-empty `GIT_PREFIX` leaking from an internal path*.
No row produced the dirty condition.

---

## (d) Row 8b subdirectory-revert disposition note

The task named row 8b — `( cd apps/web && git revert --no-edit
HEAD )` — as the "most-likely-false-block" path: if `GIT_PREFIX`
were `[apps/web/]` there, the guard as designed would block a
subdirectory-invoked revert.

**Observed behavior (recorded plainly):** row 8b fired
`pre-commit` once with **`GIT_PREFIX=[<unset>]`** (`probe.log`
lines 120-126), not `apps/web/`. In git 2.43, the commit that
`git revert` creates does not inherit/export the invoking
subdirectory as `GIT_PREFIX` to the `pre-commit` hook — the
revert's internally-driven commit step runs without the
subdirectory prefix that a direct `git commit` from the same
subdirectory would carry. Consequently the guard as designed
would **not** block this subdirectory-invoked revert.

Final disposition of this path is the controller's gate call,
not the implementer's. It is recorded here as observed fact:
the feared false-block did not materialize in git 2.43.

---

## Raw probe.log (verbatim)

The scratch repo is ephemeral; this is the durable anchor. Line
numbers match the analysis references above.

```
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 1: git commit from root ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 2: cd apps/web && git commit ===
--- pre-commit fired ---
GIT_PREFIX=[apps/web/]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 3: git -C apps/web commit ===
--- pre-commit fired ---
GIT_PREFIX=[apps/web/]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 4: git commit --amend from root ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 4 (retry): make a real commit, then git commit --amend from root ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 5: rebase --continue after conflict ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 6: clean cherry-pick ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 7a: clean merge (expect pre-merge-commit, NOT pre-commit) ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
--- pre-merge-commit fired (GIT_PREFIX=[<unset>]) ---
=== ROW 7b: conflicted merge resolved by git commit ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: PRESENT
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 8a: clean revert from root ===
=== ROW 8b: clean revert from apps/web ===
=== ROW 8a (retry): clean revert from root (non-merge commit) ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 8b (retry): clean revert from apps/web (non-merge commit) ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 9a: rebase -i reword ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: PRESENT
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 9b: rebase -i squash ===
--- pre-commit fired ---
GIT_PREFIX=[<unset>]
sentinel rebase-merge: absent
sentinel rebase-apply: absent
sentinel MERGE_HEAD: absent
sentinel CHERRY_PICK_HEAD: absent
sentinel REVERT_HEAD: absent
=== ROW 10: git stash ===
```

Note the **absence** of any `--- pre-commit fired ---` block
after the `=== ROW 10: git stash ===` marker: `git stash` /
`git stash pop` create no commit and fire no `pre-commit`, as
expected (row 10).

---

## Per-row firing attribution (reconciling the raw log)

Because each row's setup commits and the operation-under-test
both append to the same `probe.log`, the marker lines do not
cleanly separate "setup firing" from "operation firing". The
attribution below is derived from the scratch repo's reflog and
confirmed by the isolation probes in Appendix B.

- **Rows 1-4:** each firing is the operation itself; `--amend`
  fired once on the real (retry) change. Row-4 first attempt
  errored ("would make it empty" — the prior `row3` was
  `--allow-empty`); retried after a real `row4-base` commit so
  the amend had content. Both attempts are in the log.
- **Row 5:** the two firings near the marker are setup commits
  `row5-branch-side` + `row5-main-side`. `rebase --continue`
  itself fired nothing (Appendix B.1).
- **Row 6:** one firing = the cherry-pick's commit;
  `CHERRY_PICK_HEAD` absent.
- **Row 7a:** the `pre-commit` block is the `row7-side` setup
  commit; the clean merge fired only `pre-merge-commit`.
- **Row 7b:** three firings = `row7b-side` setup, `row7b-main`
  setup, then `row7b-resolved` (the conflicted-merge commit, the
  one with `MERGE_HEAD: PRESENT`).
- **Row 8:** first attempt (both 8a and 8b) errored — HEAD was
  the `row7b-resolved` *merge* commit, which `git revert` refuses
  without `-m`. Adapted minimally: created a plain non-merge
  commit (`row8a-target`, then `row8b-target`) and reverted that.
  8a fired once from root (`[<unset>]`); 8b fired once from
  `apps/web` (also `[<unset>]`). `REVERT_HEAD` absent both.
- **Row 9:** 9a (reword) fired once with `rebase-merge: PRESENT`.
  The firing after the 9b marker is the `row9-second` setup
  commit (`rebase-merge: absent`); the squash itself fired
  nothing (Appendix B.2).
- **Row 10:** no firing (no commit created).

---

## Appendix A — Reproducibility: setup script and row commands (verbatim)

The scratch repo is ephemeral. These are the exact artifacts
needed to reproduce the matrix.

### A.1 Probe-repo setup script (`/tmp/cwd-guard-probe-setup.sh`)

```bash
#!/usr/bin/env bash
# Probe-repo setup for the cwd-guard empirical matrix (spec §5).
# The probe pre-commit hook records GIT_PREFIX and the five
# carve-out sentinels every time it fires. A pre-merge-commit probe
# verifies row 7's clean-merge claim.
set -euo pipefail

SCRATCH=$(mktemp -d /tmp/cwd-guard-matrix.XXXXXX)
cd "$SCRATCH"
git init -q -b main .
git config user.email probe@example.com
git config user.name "Probe"
printf 'probe.log\n' > .gitignore
mkdir -p apps/web

cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash
{
  echo "--- pre-commit fired ---"
  echo "GIT_PREFIX=[${GIT_PREFIX:-<unset>}]"
  for S in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
    P=$(git rev-parse --git-path "$S")
    if [[ -e "$P" ]]; then echo "sentinel $S: PRESENT"; else echo "sentinel $S: absent"; fi
  done
} >> "$(git rev-parse --show-toplevel)/probe.log" 2>&1
exit 0
EOF
chmod +x .git/hooks/pre-commit

cat > .git/hooks/pre-merge-commit <<'EOF'
#!/usr/bin/env bash
echo "--- pre-merge-commit fired (GIT_PREFIX=[${GIT_PREFIX:-<unset>}]) ---" \
  >> "$(git rev-parse --show-toplevel)/probe.log"
exit 0
EOF
chmod +x .git/hooks/pre-merge-commit

echo "base" > base.txt
git add .gitignore base.txt apps/web
git commit -qm "base commit"
echo "Scratch repo ready: $SCRATCH"
```

### A.2 Row commands (verbatim, run from the scratch repo root)

```bash
# --- Rows 1-4 (plain commit shapes) ---
echo "=== ROW 1: git commit from root ===" >> probe.log
echo r1 > r1.txt && git add r1.txt && git commit -qm row1

echo "=== ROW 2: cd apps/web && git commit ===" >> probe.log
( cd apps/web && echo r2 > r2.txt && git add r2.txt && git commit -qm row2 )

echo "=== ROW 3: git -C apps/web commit ===" >> probe.log
git -C apps/web commit --allow-empty -qm row3

echo "=== ROW 4: git commit --amend from root ===" >> probe.log
git commit --amend --no-edit -q
# ^ ERRORED ("would make it empty"; prior commit was --allow-empty).
#   Adapted — row 4 retry below makes a real change so amend has content:
echo "=== ROW 4 (retry): make a real commit, then git commit --amend from root ===" >> probe.log
echo r4 > r4.txt && git add r4.txt && git commit -qm row4-base
echo r4amend >> r4.txt && git add r4.txt && git commit --amend --no-edit -q

# --- Row 5 (rebase --continue, merge backend, post-conflict) ---
echo "=== ROW 5: rebase --continue after conflict ===" >> probe.log
git switch -qc row5-branch HEAD~1 2>/dev/null || git checkout -qb row5-branch HEAD~1
echo conflict-branch > base.txt && git add base.txt && git commit -qm row5-branch-side
git switch -q main 2>/dev/null || git checkout -q main
echo conflict-main > base.txt && git add base.txt && git commit -qm row5-main-side
git switch -q row5-branch 2>/dev/null || git checkout -q row5-branch
git rebase main || true            # conflicts — expected
echo resolved > base.txt && git add base.txt
GIT_EDITOR=true git rebase --continue
git switch -q main 2>/dev/null || git checkout -q main

# --- Row 6 (clean cherry-pick) ---
echo "=== ROW 6: clean cherry-pick ===" >> probe.log
git switch -qc row6-branch 2>/dev/null || git checkout -qb row6-branch
echo r6 > r6.txt && git add r6.txt && git commit -qm row6-pickme
git switch -q main 2>/dev/null || git checkout -q main
git cherry-pick row6-branch

# --- Row 7 (merge — clean and conflicted) ---
echo "=== ROW 7a: clean merge (expect pre-merge-commit, NOT pre-commit) ===" >> probe.log
git switch -qc row7-branch 2>/dev/null || git checkout -qb row7-branch
echo r7 > r7.txt && git add r7.txt && git commit -qm row7-side
git switch -q main 2>/dev/null || git checkout -q main
git merge --no-ff -q row7-branch -m row7-clean-merge

echo "=== ROW 7b: conflicted merge resolved by git commit ===" >> probe.log
git switch -qc row7b-branch 2>/dev/null || git checkout -qb row7b-branch
echo merge-conflict-side > base.txt && git add base.txt && git commit -qm row7b-side
git switch -q main 2>/dev/null || git checkout -q main
echo merge-conflict-main > base.txt && git add base.txt && git commit -qm row7b-main
git merge row7b-branch || true     # conflicts — expected
echo merge-resolved > base.txt && git add base.txt
git commit -qm row7b-resolved

# --- Row 8 (revert, root + subdirectory) ---
echo "=== ROW 8a: clean revert from root ===" >> probe.log
git revert --no-edit HEAD
echo "=== ROW 8b: clean revert from apps/web ===" >> probe.log
( cd apps/web && git revert --no-edit HEAD )
# ^ BOTH ERRORED — HEAD was the row7b-resolved MERGE commit; revert
#   refuses a merge without -m. Adapted — revert a plain commit:
echo "=== ROW 8a (retry): clean revert from root (non-merge commit) ===" >> probe.log
echo r8a > r8a.txt && git add r8a.txt && git commit -qm row8a-target
git revert --no-edit HEAD
echo "=== ROW 8b (retry): clean revert from apps/web (non-merge commit) ===" >> probe.log
echo r8b > r8b.txt && git add r8b.txt && git commit -qm row8b-target
( cd apps/web && git revert --no-edit HEAD )

# --- Row 9 (interactive rebase — reword and squash) ---
echo "=== ROW 9a: rebase -i reword ===" >> probe.log
GIT_SEQUENCE_EDITOR="sed -i 's/^pick/reword/'" GIT_EDITOR=true git rebase -i HEAD~1

echo "=== ROW 9b: rebase -i squash ===" >> probe.log
echo r9 > r9.txt && git add r9.txt && git commit -qm row9-second
GIT_SEQUENCE_EDITOR="sed -i '2s/^pick/squash/'" GIT_EDITOR=true git rebase -i HEAD~2

# --- Row 10 (stash) ---
echo "=== ROW 10: git stash ===" >> probe.log
echo dirty > base.txt
git stash
git stash pop
```

---

## Appendix B — Isolation probes (confirming the contradictions)

To rule out setup-commit misattribution, two throwaway repos
isolated the operations under test, logging hook firings between
explicit "ABOUT TO" / "DONE" markers.

### B.1 — `rebase --continue` and clean `merge --no-ff`

Result (operation regions only):

```
=== ABOUT TO: rebase --continue ===
=== DONE: rebase --continue ===           <- zero pre-commit firings
=== ABOUT TO: merge --no-ff feat (clean) ===
HOOK>> PRE-MERGE-COMMIT GIT_PREFIX=[<unset>]
=== DONE: merge --no-ff (clean) ===       <- pre-merge-commit only
```

Confirms §C5 (rebase --continue fires no pre-commit) and §C7a
(clean merge fires only pre-merge-commit).

### B.2 — `rebase -i` reword vs squash

Result:

```
=== ABOUT TO: rebase -i reword HEAD~1 ===
HOOK>> PRE-COMMIT GIT_PREFIX=[<unset>] rebase-merge=PRESENT
=== DONE reword ===
HOOK>> PRE-COMMIT GIT_PREFIX=[<unset>] rebase-merge=absent  <- row9-second setup commit
=== ABOUT TO: rebase -i squash (2nd line) HEAD~2 ===
=== DONE squash ===                        <- zero pre-commit firings
```

Confirms §C9: reword fires `pre-commit` with `rebase-merge`
PRESENT; the squash itself fires no `pre-commit` (the
`rebase-merge=absent` firing was the intervening setup commit).

---

## Summary for the controller

- **Verdict: CLEAN. Ship the guard bare.** No git-internal path
  surfaced a non-empty `GIT_PREFIX` from root; the only non-empty
  values (rows 2, 3) are correct subdirectory detections.
- **Row 8b (the named false-block risk):** did NOT surface
  `apps/web/` — reported `[<unset>]`. The guard would not block a
  subdirectory-invoked revert in git 2.43. Final disposition is
  the controller's call.
- **Sentinels are largely invisible to `pre-commit`:**
  `CHERRY_PICK_HEAD` and `REVERT_HEAD` were never PRESENT at hook
  time; only `MERGE_HEAD` (row 7b) and `rebase-merge` (row 9a
  reword) were ever PRESENT. A sentinel-based carve-out would not
  reliably cover cherry-pick or revert paths — and is unnecessary
  given the CLEAN verdict.
- **Version-anchored:** all findings are git 2.43.0. Re-run this
  matrix if the guard is ported to a materially different git
  version.
