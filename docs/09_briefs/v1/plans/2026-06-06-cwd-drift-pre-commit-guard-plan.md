# cwd-drift pre-commit guard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lock-gated, hard-blocking repo-root cwd assertion to
the installed pre-commit hook, discharging the Wave-6 retrospective
§3.2 charter.

**Architecture:** One guard block added to the hook template inside
`scripts/install-hooks.sh` (the hook is generated, not tracked —
git doesn't version `.git/hooks/`), keyed on `GIT_PREFIX` (git
exports the invoking subdirectory to hooks; empty = invoked from
root), firing only when `.coordination/session-lock.json` exists.
An empirical grounding matrix in a scratch repo is a **ship
precondition** — it decides whether the guard ships bare or with an
in-progress-operation carve-out.

**Tech Stack:** bash, git hooks (raw `.git/hooks`, no husky),
existing `scripts/install-hooks.sh` install mechanism.

**Spec:** `docs/09_briefs/v1/specs/2026-06-06-cwd-drift-pre-commit-guard-design.md`
(committed `9017a736`, amended `c3c85c79`). Read it before starting.

**Session discipline:** the `cwd-guard` session lock is held. Every
commit in this plan: run from repo root, root-relative pathspecs,
inline `COORD_SESSION='cwd-guard'`. (Yes — the discipline this plan
mechanizes. Practice it.)

**Plan-level decision (spec §8 delegated):** the live-fire runs
**under the active `cwd-guard` lock**, no scratch lock in the real
repo. Rationale: the lock file is a single path
(`.coordination/session-lock.json`) — a scratch lock would clobber
the held one; the block-path probes are non-destructive because the
guard exits before any commit object is created; and row 1's
pass-evidence is organic (Task 3's Commit 1, made from root through
the new hook). The full 10-row matrix lives in the scratch repo
(Task 1), never in the real repo.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `/tmp/cwd-guard-matrix.*` (mktemp scratch repo) | create, ephemeral | runs the §5 empirical matrix with a probe hook; never committed |
| `docs/09_briefs/v1/plans/2026-06-06-cwd-guard-empirical-matrix-results.md` | create | durable record of matrix results + probe script appendix (the spec's "companion note") |
| `scripts/install-hooks.sh` | modify | guard block in the heredoc template + item-1 facet expansion in all three enforcement listings |
| `.git/hooks/pre-commit` | regenerated | by re-running `install-hooks.sh` (not edited directly) |
| `docs/04_engineering/conventions/code.md` | modify | §Commit-shell hygiene closing paragraph → past tense, grain-anchored; origin footer gains shipped line |
| `docs/07_governance/friction-journal.md` | modify | arc-close entry (append per the journal's current tail format) |

---

### Task 1: Empirical grounding matrix (ship precondition — spec §5)

**Files:**
- Create (ephemeral): scratch repo via `mktemp -d /tmp/cwd-guard-matrix.XXXXXX`
- Create: `docs/09_briefs/v1/plans/2026-06-06-cwd-guard-empirical-matrix-results.md`

- [ ] **Step 1.1: Create the scratch repo with probe hooks**

Save this as `/tmp/cwd-guard-probe-setup.sh` and run
`bash /tmp/cwd-guard-probe-setup.sh`. It prints the scratch path —
`cd` there for all subsequent steps.

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

Expected output: `Scratch repo ready: /tmp/cwd-guard-matrix.<suffix>`
(plus one `--- pre-commit fired ---` block in `probe.log` from the
base commit — that block is row-0 noise; the row markers below keep
it distinguishable).

- [ ] **Step 1.2: Run rows 1–4 (plain commit shapes)**

From the scratch repo root:

```bash
echo "=== ROW 1: git commit from root ===" >> probe.log
echo r1 > r1.txt && git add r1.txt && git commit -qm row1

echo "=== ROW 2: cd apps/web && git commit ===" >> probe.log
( cd apps/web && echo r2 > r2.txt && git add r2.txt && git commit -qm row2 )

echo "=== ROW 3: git -C apps/web commit ===" >> probe.log
git -C apps/web commit --allow-empty -qm row3

echo "=== ROW 4: git commit --amend from root ===" >> probe.log
git commit --amend --no-edit -q
```

Expected in `probe.log`: row 1 and row 4 show
`GIT_PREFIX=[]` or `[<unset>]`; rows 2–3 show
`GIT_PREFIX=[apps/web/]`. All sentinels absent on all four.

- [ ] **Step 1.3: Run row 5 (rebase --continue, merge backend, post-conflict)**

```bash
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
```

Record: whether `pre-commit` fired at `--continue` at all, the
`GIT_PREFIX` value if it did, and which sentinels were PRESENT
(expect `rebase-merge`).

- [ ] **Step 1.4: Run row 6 (clean cherry-pick — record sentinel presence, spec amendment c3c85c79)**

```bash
echo "=== ROW 6: clean cherry-pick ===" >> probe.log
git switch -qc row6-branch 2>/dev/null || git checkout -qb row6-branch
echo r6 > r6.txt && git add r6.txt && git commit -qm row6-pickme
git switch -q main 2>/dev/null || git checkout -q main
git cherry-pick row6-branch
```

Record THREE observations: (a) did `pre-commit` fire at all for a
clean pick; (b) `GIT_PREFIX` value; (c) **`CHERRY_PICK_HEAD`
PRESENT or absent at hook time** — this is the spec's
distinct-observation requirement; it decides carve-out coverage
for this shape, independently of whether a misfire occurred.

- [ ] **Step 1.5: Run row 7 (merge — clean and conflicted)**

```bash
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
```

Expected: 7a logs `pre-merge-commit fired` with NO `pre-commit`
block between the 7a and 7b markers (the guard never runs on clean
merges — spec row-7 wording). 7b logs `pre-commit fired` with
`MERGE_HEAD: PRESENT`.

- [ ] **Step 1.6: Run row 8 (revert, root + subdirectory — record sentinel presence)**

```bash
echo "=== ROW 8a: clean revert from root ===" >> probe.log
git revert --no-edit HEAD

echo "=== ROW 8b: clean revert from apps/web ===" >> probe.log
( cd apps/web && git revert --no-edit HEAD )
```

Record for both: `GIT_PREFIX` value and **`REVERT_HEAD` PRESENT or
absent at hook time** (distinct observation, same requirement as
row 6). 8b is the spec's named most-likely-false-block path: if
`GIT_PREFIX=[apps/web/]` there, the guard as designed WOULD block a
subdirectory-invoked revert — record that plainly; whether that
block is acceptable (the convention mandates root-invocation under
a lock anyway) or needs the carve-out is the Step 1.9 gate call.

- [ ] **Step 1.7: Run row 9 (interactive rebase — reword and squash)**

```bash
echo "=== ROW 9a: rebase -i reword ===" >> probe.log
GIT_SEQUENCE_EDITOR="sed -i 's/^pick/reword/'" GIT_EDITOR=true git rebase -i HEAD~1

echo "=== ROW 9b: rebase -i squash ===" >> probe.log
echo r9 > r9.txt && git add r9.txt && git commit -qm row9-second
GIT_SEQUENCE_EDITOR="sed -i '2s/^pick/squash/'" GIT_EDITOR=true git rebase -i HEAD~2
```

Record: whether `pre-commit` fired, `GIT_PREFIX`, sentinels
(expect `rebase-merge` PRESENT if it fired).

- [ ] **Step 1.8: Run row 10 (stash)**

```bash
echo "=== ROW 10: git stash ===" >> probe.log
echo dirty > base.txt
git stash
git stash pop
```

Expected: no `pre-commit fired` block after the row-10 marker
(stash creates commit objects without the commit hook — verify).

- [ ] **Step 1.9: Evaluate the gate and write the results note**

Read `probe.log` top to bottom. The gate (spec §5):

- **CLEAN** = on every row where `pre-commit` fired during a
  git-internal path (5, 6, 7b, 8a, 9 — anything not directly
  user-invoked from a subdirectory), `GIT_PREFIX` was empty/unset.
  Rows 2, 3, and 8b showing `apps/web/` are *correct detections*,
  not leaks — 8b's disposition is recorded, not counted as dirty.
- **DIRTY** = any git-internal path surfaced a non-empty
  `GIT_PREFIX` when invoked from root. That forces Task 2
  Variant B (carve-out) and a spec §5 amendment recording which
  path forced it.

Write `docs/09_briefs/v1/plans/2026-06-06-cwd-guard-empirical-matrix-results.md`
with: (a) a 10-row results table — columns: row, command shape,
pre-commit fired?, GIT_PREFIX observed, sentinels PRESENT,
disposition; (b) the row-6/row-8 sentinel-presence observations
called out explicitly with their carve-out-coverage implication;
(c) the gate verdict (CLEAN → ship bare / DIRTY → carve-out, naming
the forcing path); (d) the 8b subdirectory-revert disposition; (e)
git version (`git --version`) — the result is version-anchored
empiricism; (f) **appendix: the full probe-setup script and all row
commands verbatim** (reproducibility — the scratch repo is
ephemeral, the appendix is the durable anchor).

- [ ] **Step 1.10: Clean up the scratch repo**

```bash
rm -rf /tmp/cwd-guard-matrix.* /tmp/cwd-guard-probe-setup.sh
```

(The results note is committed in Task 3 alongside the guard — one
commit carries mechanism + its evidence.)

---

### Task 2: Guard block + listing sync in `scripts/install-hooks.sh`

**Files:**
- Modify: `scripts/install-hooks.sh` (4 edit sites: script header
  ~line 8, heredoc header ~line 27, guard block after the
  COORD_SESSION-mismatch check ~line 63, echo summary ~line 117)

Line numbers are anchors from the 2026-06-06 read; re-verify
against disk before editing (verify-from-disk; and per CLAUDE.md
Z1 #11.a, Read the exact target block before any multi-line Edit —
construct `oldText` from the Read, not from this plan).

- [ ] **Step 2.1: Expand item 1 in the script header comment**

Current (script header, lines 7–13):

```bash
# The installed hook enforces:
#   1. Session Lock File Convention (see
#      docs/04_engineering/conventions/session/iterative-catching.md).
```

Replace those item-1 lines with:

```bash
# The installed hook enforces:
#   1. Session Lock File Convention — identity (COORD_SESSION match)
#      + location (repo-root cwd via GIT_PREFIX) when the lock file
#      exists (see
#      docs/04_engineering/conventions/session/iterative-catching.md
#      and docs/04_engineering/conventions/code.md §Commit-shell
#      hygiene under a session lock).
```

Items 2 and 3 unchanged. **The count stays three** (spec §4: the
cwd guard shares item 1's trigger — it is a second facet of the
session-lock enforcement, not a peer of ADR-lint).

- [ ] **Step 2.2: Expand item 1 in the in-heredoc hook header**

Current (inside the `HOOK_EOF` heredoc, lines 26–32):

```bash
# Installed by scripts/install-hooks.sh. Enforces:
#   1. Session Lock File Convention (see
#      docs/04_engineering/conventions/session/iterative-catching.md).
```

Replace the item-1 lines with the same two-facet wording as
Step 2.1 (identical text, same indentation). Items 2 and 3
unchanged.

- [ ] **Step 2.3: Insert the guard block (Variant A — matrix CLEAN)**

Inside the heredoc, the lock-exists `else` branch currently ends:

```bash
  if [[ "$COORD_SESSION" != "$LOCK_LABEL" ]]; then
    echo "[coordination] error: active lock is for session" >&2
    echo "'$LOCK_LABEL' but your shell's COORD_SESSION is" >&2
    echo "'$COORD_SESSION'. This looks like a foreign-session commit." >&2
    echo "Stop and resolve before retrying. Commit blocked." >&2
    exit 1
  fi
fi
```

Insert between the mismatch-check `fi` and the outer `fi` (failure
ordering: identity first, location second — `$LOCK_LABEL` is in
scope here):

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

Heredoc safety notes: the heredoc delimiter is quoted
(`<<'HOOK_EOF'`), so nothing expands at install time — `${GIT_PREFIX:-}`,
`$LOCK_LABEL`, and `\$(git rev-parse …)` land in the hook verbatim.
At hook runtime, `${GIT_PREFIX:-}` is mandatory under the hook's
`set -u`; the `\$` inside the double-quoted echo prints a literal
`$(git rev-parse --show-toplevel)` for the user to run rather than
executing it.

**Variant B — only if Task 1's gate came back DIRTY.** Wrap the
guard so it skips during in-flight sequences. Replace the
`if [[ -n "${GIT_PREFIX:-}" ]]; then` line with:

```bash
  IN_PROGRESS=""
  for SENTINEL in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
    if [[ -e "$(git rev-parse --git-path "$SENTINEL")" ]]; then
      IN_PROGRESS=yes
      break
    fi
  done
  if [[ -z "$IN_PROGRESS" && -n "${GIT_PREFIX:-}" ]]; then
```

(rest of the block identical; `git rev-parse --git-path` rather
than a raw `.git/` path so worktree-local sentinel locations
resolve correctly). Variant B additionally requires: amend spec §5
contingency paragraph to record which matrix path forced the
carve-out, and check the row-6/row-8 sentinel-presence
observations — if a sentinel was ABSENT during the clean shape,
the carve-out does NOT cover that shape and the results note must
say so explicitly.

- [ ] **Step 2.4: Expand item 1 in the final echo summary**

Current (lines 116–123):

```bash
echo "The hook enforces:"
echo "  1. Session Lock File Convention (.coordination/session-lock.json"
echo "     vs COORD_SESSION env var)."
```

Replace the item-1 echo lines with:

```bash
echo "The hook enforces:"
echo "  1. Session Lock File Convention (.coordination/session-lock.json"
echo "     vs COORD_SESSION env var; repo-root cwd via GIT_PREFIX when"
echo "     the lock exists)."
```

Items 2 and 3 unchanged. All three listings now carry the same
two-facet item 1; count stays three everywhere.

- [ ] **Step 2.5: Syntax-check the edited installer**

```bash
bash -n scripts/install-hooks.sh
```

Expected: no output, exit 0.

- [ ] **Step 2.6: Re-install the hook**

```bash
bash scripts/install-hooks.sh
```

Expected: "Existing pre-commit hook differs from new content;
backing up to .git/hooks/pre-commit.pre-coordination" then
"Pre-commit hook installed at .git/hooks/pre-commit." with the
expanded item-1 summary. Then verify the installed hook carries the
guard:

```bash
grep -n "cwd guard" .git/hooks/pre-commit
```

Expected: one match inside the lock-exists branch.

---

### Task 3: Live-fire under the active lock + Commit 1

**Files:**
- None new (Commit 1 carries `scripts/install-hooks.sh` + the Task 1
  results note)

- [ ] **Step 3.1: Live-fire the block paths (spec §8 rows 2–3 analogues)**

The `cwd-guard` lock is held; these probes run against the real
installed hook. They are non-destructive: the guard exits before
any commit object is created.

```bash
cd "$(git rev-parse --show-toplevel)"
( cd apps/web && COORD_SESSION='cwd-guard' git commit --allow-empty -m probe-row2 ) ; echo "exit: $?"
COORD_SESSION='cwd-guard' git -C apps/web commit --allow-empty -m probe-row3 ; echo "exit: $?"
```

Expected, both: the `[coordination] error: commit invoked from
subdirectory 'apps/web/' …` message, exit 1, and `git log --oneline -1`
unchanged. (COORD_SESSION is set inline so the *identity* check
passes and the probe genuinely exercises the *location* check.)
If either probe creates a commit or shows the wrong message: STOP,
do not proceed to Commit 1 — debug the hook against Step 2.3.

- [ ] **Step 3.2: Commit 1 — guard + evidence (this commit IS the row-1 live-fire)**

From repo root:

```bash
git add scripts/install-hooks.sh docs/09_briefs/v1/plans/2026-06-06-cwd-guard-empirical-matrix-results.md
COORD_SESSION='cwd-guard' git commit -m "feat(coordination): cwd-drift pre-commit guard — lock-gated GIT_PREFIX hard block

Discharges the Wave-6 retro §3.2 charter's missing half: repo-root
cwd asserted at commit time whenever the session lock exists, at
severity parity with the sibling COORD_SESSION checks. Item-1 facet
expansion (identity + location) across the three enforcement
listings; count stays three (the three-listing sync is the
file-top-comment-staleness pattern's known surface). Empirical
grounding matrix (10 rows, scratch repo) in the companion results
note: gate verdict <CLEAN — ships bare | DIRTY — carve-out, forced
by row N>. Grain: commit-time guard only; non-commit drift remains
discipline-covered (conventions/code.md).

This commit, made from repo root through the new hook, is the
live-fire row-1 pass; rows 2-3 block-probes verified pre-commit
(exit 1, no commit object).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

Fill the `<CLEAN … | DIRTY …>` choice from Task 1's actual gate
verdict before committing. Expected: commit succeeds (the new
guard passes — cwd is root, COORD_SESSION matches), and the
success itself is recorded evidence.

- [ ] **Step 3.3: Verify the commit landed and the hook ran**

```bash
git log --oneline -1
git show --stat HEAD
```

Expected: the Commit 1 message at HEAD; exactly two files changed.

---

### Task 4: Doc reconciliation + Commit 2

**Files:**
- Modify: `docs/04_engineering/conventions/code.md` (§Commit-shell
  hygiene closing paragraph + origin footer)
- Modify: `docs/07_governance/friction-journal.md` (arc-close entry,
  appended per the journal's current tail format)

- [ ] **Step 4.1: Amend the convention's closing paragraph (grain-anchored)**

Read the §Commit-shell hygiene section from disk first (Z1 #11.a —
multi-line Edit anchors come from a Read, not from this plan).
Current closing paragraph (verified 2026-06-06):

```
The failure mode is benign-looking but repeats: git's own pathspec error
is the catch when it fires pre-commit, but the same drift can stage the
wrong tree state when paths happen to resolve. The intended mechanical
fix is a **pre-commit guard** asserting repo-root cwd + `COORD_SESSION`
set whenever the lock file exists — a named post-wave follow-up from the
Wave-6 retrospective; this convention is the discipline until the guard
ships, and the guard's documentation once it does.
```

Replace with (fill `<SHA>` with Commit 1's short SHA via
`git rev-parse --short HEAD~0` taken after Task 3):

```
The failure mode is benign-looking but repeats: git's own pathspec error
is the catch when it fires pre-commit, but the same drift can stage the
wrong tree state when paths happen to resolve. The mechanical guard
shipped 2026-06-06 (cwd-guard arc, commit <SHA>): the installed
pre-commit hook hard-blocks any commit invoked from a non-root cwd
(`GIT_PREFIX` non-empty) while the lock file exists, at severity parity
with the `COORD_SESSION` checks; `--no-verify` is the deliberate,
visible exception path. **Grain anchor:** the guard enforces
*commit-time repo-root-under-lock only* — mid-session drift at
non-commit verbs (`git status`, `git add` from a drifted shell) remains
covered by this convention's first two bullets, not by the guard. The
guard's empirical grounding (10 git-internal commit paths, including
sentinel-presence observations for clean revert and cherry-pick) is
recorded at `docs/09_briefs/v1/plans/2026-06-06-cwd-guard-empirical-matrix-results.md`.
This convention is now the guard's documentation.
```

- [ ] **Step 4.2: Add the shipped line to the Origin footer**

In the same section's `**Origin:**` block, append after the
"Cross-references:" item:

```
- Guard shipped: 2026-06-06, cwd-guard arc — `scripts/install-hooks.sh`
  template, commit <SHA>; design spec
  `docs/09_briefs/v1/specs/2026-06-06-cwd-drift-pre-commit-guard-design.md`.
```

(Same `<SHA>` as Step 4.1. Additive, provenance-preserving — do not
restructure the existing footer.)

- [ ] **Step 4.3: Append the friction-journal arc-close entry**

Read the journal's tail first and match the current arc-block
format (heading grain, date placement). Entry content:

```
### cwd-guard arc — guard shipped (2026-06-06)

The Wave-6 §3.2 carry-forward closed: lock-gated GIT_PREFIX hard
block in the pre-commit hook (commit <SHA>), sequenced ahead of
cleanup Arc 2 so Arc 2's commits run behind a written check. Gate
verdict from the 10-row empirical matrix: <CLEAN — shipped bare |
DIRTY — carve-out, forced by row N>; row-6/row-8 sentinel-presence
observations recorded in the companion note. Grain held: the guard
discharges the commit-time charter, not the whole drift class —
candidate B (PreToolUse layer) stays banked with its evidence-gated
trigger (any post-guard fire at a non-commit verb). Arc-2 session
open must re-run `bash scripts/install-hooks.sh` in its checkout
before first commit (worktrees don't inherit hooks).
```

Fill `<SHA>` and the gate-verdict choice from actuals.

- [ ] **Step 4.4: Commit 2 — docs**

From repo root:

```bash
git add docs/04_engineering/conventions/code.md docs/07_governance/friction-journal.md
COORD_SESSION='cwd-guard' git commit -m "docs(conventions): cwd-guard shipped — code.md grain-anchored amendment + friction-journal arc close

Commit-shell hygiene closing paragraph past-tensed with the grain
anchor (commit-time repo-root-under-lock only; non-commit drift
stays discipline-covered); Origin footer gains the shipped line.
Friction-journal arc-close entry banks candidate B with its
evidence-gated trigger and the Arc-2 install-hooks re-run reminder.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

Expected: commit succeeds through the new guard (second organic
row-1 pass).

---

### Task 5: Arc close (operator-gated)

- [ ] **Step 5.1: Landing verification handoff**

Present to the reviewer the four spec §10 criteria with disk
pointers: (1) implemented trigger in `.git/hooks/pre-commit` +
`scripts/install-hooks.sh`; (2) block message text; (3)
`conventions/code.md` amendment wording; (4) item-1 facet expansion
across all three listings, count three. The matrix results note is
the implementer-produced backstop.

- [ ] **Step 5.2: Lock release and push — operator's call, not the plan's**

Do NOT run `session-end.sh` or `git push` unprompted. Per the
push-terminal-close pattern, these commits bank locally; the
operator decides lock release and push timing. Surface the state
(`git log --oneline origin/staging..HEAD`) and stop.

---

## Self-review record

- **Spec coverage:** §1–§4 → Task 2; §5 → Task 1 (rows 6/8
  sentinel-presence as distinct observations per amendment
  `c3c85c79`; Variant B carries the carve-out + spec-amendment
  obligation); §6 → Steps 2.6, 4.3 (Arc-2 re-run reminder); §7 →
  Task 4; §8 → Task 1 (matrix) + Task 3 (live-fire, lock-hazard
  decision recorded in the header); §9 → banked in the 4.3 entry;
  §10 → Step 5.1; §11 → Commits 1–2 as specified.
- **Placeholders:** the `<SHA>` and `<gate verdict>` slots are
  fill-from-actuals at execution time (forward references to
  Task 1/3 outputs, with the exact command to obtain each) — not
  unresolved design.
- **Type consistency:** guard block text identical between spec §3
  and Step 2.3; sentinel list identical between Step 1.1's probe,
  Step 2.3's Variant B, and spec §5.
