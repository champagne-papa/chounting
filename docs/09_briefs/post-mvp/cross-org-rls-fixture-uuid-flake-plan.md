# Test-Hygiene Fix Arc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the Sessions-3/4/halftime Condition 1 deviation in `tests/integration/crossOrgRlsIsolation.test.ts` (fixed-fixture UUID PK collision under vitest parallel scheduling) and ship four bundled tooling-polish improvements (ADR linter path-citing, `adr:index --check` diff, install-hooks idempotency, install-hooks no-op messaging).

**Architecture:** Three commits sequenced primary-then-tooling, by script-bundle. Commit 1 (primary solo, deviation-closing) replaces fixed `TEST_IDS` UUIDs with per-run `crypto.randomUUID()` values stored in describe-scope `let` and reused by `afterAll` cleanup. Commit 2 (ADR scripts bundle, items #1+#2) replaces hardcoded path strings in `scripts/adr/lint.ts` with relative paths derived from existing `TAXONOMY_PATH`/`INVARIANTS_PATH` constants, and adds first-10-lines diff output to `scripts/adr/generate-index.ts`'s `--check` failure path. Commit 3 (install-hooks bundle, items #3+#4) introduces content-equivalence short-circuit in `scripts/install-hooks.sh` (using `cmp`) plus conditional "already installed" messaging.

**Tech Stack:** Vitest 2.x, TypeScript, bash, gray-matter (already imported in lint.ts), `crypto.randomUUID()` (Web Crypto API, available in Node 20+).

**Acceptance criteria:**
- (a) Grep verifies no fixed UUIDs remain: `grep -E '99990[0-9]{3}-' apps/web/tests/integration/crossOrgRlsIsolation.test.ts` → no matches.
- (b) `pnpm db:reset:clean && pnpm test` 5×→5/5 green. Pre-fix flake rate ~25%; post-fix expected 0%.
- (c) Full-suite count stays at 137 files / 665 tests (no test additions or deletions; `crossOrgRlsIsolation.test.ts` retains 20 tests).
- (d) ADR linter error messages cite canonical file paths via existing constants.
- (e) `pnpm adr:index --check` emits first ~10 lines of diff on failure before exit 1.
- (f) `bash scripts/install-hooks.sh` run twice in succession → second run prints "already installed, no action" and produces no backup.
- (g) All three commits independently revertable.

---

## Task 1: Convert `TEST_IDS` to per-run randomUUIDs (Commit 1, primary solo)

**Context:** The current `crossOrgRlsIsolation.test.ts` declares a module-scope `const TEST_IDS` block (lines 11-20) with eight fixed UUIDs in the `99990*` distinctive range. Under vitest parallel scheduling at full-suite (137 files, 665 tests), another test inserts a `journal_entry` whose `journal_entry_id` matches `TEST_IDS.je_holding` before this test's `beforeAll` runs, causing PK violation at line 104. Fix shape: per-run `crypto.randomUUID()` values stored in describe-scope `let` (matching the existing pattern at lines 24-26 for `TEST_TRACE_ID`/`auditHoldingId`/`auditRealEstateId`), assigned in `beforeAll` (matching lines 31-33), reused as-is by `afterAll` cleanup. Module-scope storage chosen over post-insert DB query for cleanup (option (a) in brief): in-memory storage is the cleaner answer; DB query reintroduces a state dependency.

**Files:**
- Modify: `apps/web/tests/integration/crossOrgRlsIsolation.test.ts:1` (file-top staleness comment), `:7-10` (internal comment block), `:11-20` (TEST_IDS const block — DELETE), `:24-26` (let-declarations — INSERT TEST_IDS let here), `:28-33` (beforeAll initialization — INSERT TEST_IDS assignment).

- [ ] **Step 1: Read the current file**

Run: `cat apps/web/tests/integration/crossOrgRlsIsolation.test.ts | head -50`

Expected: confirm lines match the byte-anchors in this plan. If line numbers have shifted, re-derive anchors from the actual content before editing.

- [ ] **Step 2: Update file-top staleness comment (line 1)**

The file-top comment was added at commit `c8f4f5f` to point CI casualties at the fix brief. Once this commit lands, the flake is closed; the comment shifts to reference the post-fix discipline.

Replace:
```typescript
// Known flake under full-suite: fixed fixture UUID collides. See docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md.
```

With:
```typescript
// Per-run randomUUIDs prevent fixture-UUID collision under vitest parallel scheduling. See docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md for the fix arc context.
```

- [ ] **Step 3: Update internal comment block (lines 7-10) and remove the `TEST_IDS` const block (lines 11-20)**

The current comment ("Test-local UUIDs in a distinctive range") describes a property the new code no longer has. Replace lines 7-20 with a single comment block reflecting the post-fix discipline.

Replace:
```typescript
// Test-local UUIDs in a distinctive range. Cleaned up in afterAll.
// audit_log IDs and TEST_TRACE_ID are per-run (crypto.randomUUID) because
// INV-AUDIT-002 (migration 20240122000000) makes audit_log append-only —
// fixed IDs would collide on PK across runs once orphan rows accumulate.
const TEST_IDS = {
  vendor_holding: '99990001-0000-0000-0000-000000000001',
  vendor_real_estate: '99990001-0000-0000-0000-000000000002',
  je_holding: '99990002-0000-0000-0000-000000000001',
  je_real_estate: '99990002-0000-0000-0000-000000000002',
  ai_holding: '99990004-0000-0000-0000-000000000001',
  ai_real_estate: '99990004-0000-0000-0000-000000000002',
  addr_holding: '99990005-0000-0000-0000-000000000001',
  addr_real_estate: '99990005-0000-0000-0000-000000000002',
} as const;
```

With:
```typescript
// All test-local IDs are per-run (crypto.randomUUID) and stored in
// describe-scope `let` bindings populated in beforeAll. Fixed fixture
// UUIDs were eliminated to prevent PK collision under vitest parallel
// scheduling (the journal_entries.je_holding collision specifically
// flaked at ~25% rate at full-suite). audit_log IDs are also per-run
// because INV-AUDIT-002 makes audit_log append-only.
```

- [ ] **Step 4: Add `TEST_IDS` `let` declaration inside the describe block (after line 26)**

The existing `let` block at lines 24-26 declares `apClient`, `TEST_TRACE_ID`, `auditHoldingId`, `auditRealEstateId`. Insert `TEST_IDS` immediately after.

After line 26 (`let auditRealEstateId: string;`), insert:
```typescript
  let TEST_IDS: {
    vendor_holding: string;
    vendor_real_estate: string;
    je_holding: string;
    je_real_estate: string;
    ai_holding: string;
    ai_real_estate: string;
    addr_holding: string;
    addr_real_estate: string;
  };
```

- [ ] **Step 5: Initialize `TEST_IDS` in beforeAll (after line 33)**

The existing initialization block at lines 31-33 assigns `TEST_TRACE_ID`/`auditHoldingId`/`auditRealEstateId`. Insert `TEST_IDS` initialization immediately after.

After line 33 (`auditRealEstateId = crypto.randomUUID();`), insert:
```typescript

    TEST_IDS = {
      vendor_holding: crypto.randomUUID(),
      vendor_real_estate: crypto.randomUUID(),
      je_holding: crypto.randomUUID(),
      je_real_estate: crypto.randomUUID(),
      ai_holding: crypto.randomUUID(),
      ai_real_estate: crypto.randomUUID(),
      addr_holding: crypto.randomUUID(),
      addr_real_estate: crypto.randomUUID(),
    };
```

(Note the leading blank line for separation from the line-33 audit IDs.)

- [ ] **Step 6: Verify all `TEST_IDS.*` usages still resolve correctly**

The `TEST_IDS.*` reference sites should not need changes — they read string fields, which work the same whether the parent is a `const ... as const` or a `let` with mutable shape. Run a grep to confirm exhaustive coverage:

Run: `grep -n 'TEST_IDS\.' apps/web/tests/integration/crossOrgRlsIsolation.test.ts`

Expected output (10 reference sites): lines 58, 59, 84, 94, 130, 135, 138, 143, 151, 158 (insertion sites) and 178, 181, 184, 187 (afterAll cleanup). All references are read-only access; none assign to TEST_IDS.

- [ ] **Step 7: Run typecheck to confirm no type regression**

Run: `pnpm typecheck`

Expected: clean exit (no errors). If errors surface around the `let TEST_IDS` declaration, double-check the struct shape matches all field names used in the test body.

- [ ] **Step 8: Reset DB and run the test in isolation to confirm green floor**

Run: `pnpm db:reset:clean && cd apps/web && pnpm vitest run tests/integration/crossOrgRlsIsolation.test.ts`

Expected: `Test Files 1 passed (1); Tests 20 passed (20)` (or equivalent). If failure, inspect the error — most likely a stale TEST_IDS reference or a type mismatch.

- [ ] **Step 9: Run full suite 5× to confirm flake elimination**

Run (sequential, with DB reset between each):
```bash
for i in 1 2 3 4 5; do
  echo "=== Run $i ==="
  pnpm db:reset:clean
  pnpm test 2>&1 | tail -5
done
```

Expected: each run reports `Test Files 137 passed (137); Tests 665 passed | 20 skipped (665)` (or equivalent green). Pre-fix flake rate was ~25%; post-fix expected 0/5 failures. If any run fails on `crossOrgRlsIsolation.test.ts`, the fix is incomplete — investigate before committing.

- [ ] **Step 10: Grep-verify no fixed UUIDs remain**

Run: `grep -E '99990[0-9]{3}-' apps/web/tests/integration/crossOrgRlsIsolation.test.ts`

Expected: no matches. If matches, missed-replacement candidates remain — find and convert them.

- [ ] **Step 11: Commit**

```bash
git add apps/web/tests/integration/crossOrgRlsIsolation.test.ts
git commit -m "$(cat <<'EOF'
test(integration): randomUUID fixtures in crossOrgRlsIsolation — close Condition 1 deviation

Replaces fixed-fixture UUIDs in TEST_IDS (lines 11-20) with per-run
crypto.randomUUID() values stored in describe-scope let, assigned
in beforeAll, reused in afterAll cleanup. Eliminates the PK
collision at journal_entries.je_holding under vitest parallel
scheduling that flaked at ~25% rate across Sessions 3, 4, and
the halftime push.

Acceptance verified:
- pnpm db:reset:clean && pnpm test 5x: 5/5 green
- grep -E '99990[0-9]{3}-' returns no matches
- crossOrgRlsIsolation.test.ts retains 20 tests; full suite at
  137 files / 665 tests

Closes the Sessions-3/4/halftime Condition 1 deviation per the
brief at docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: ADR scripts bundle — linter path-citing + `--check` diff (Commit 2)

**Context:** The ADR linter at `scripts/adr/lint.ts` defines `TAXONOMY_PATH` and `INVARIANTS_PATH` constants (lines 45-46) but emits error messages with hardcoded `"taxonomy.md"` (line 237) and `"invariants.md"` (line 284) strings instead of citing the canonical paths. Item #1 fixes this. Item #2 modifies `scripts/adr/generate-index.ts` `--check` failure path (lines 281-287) to emit first ~10 lines of diff before exiting, so the contributor sees what changed without having to re-run the non-check command. Both items live in `scripts/adr/`; same code-area + reviewer-attention surface justifies bundling.

**Files:**
- Modify: `scripts/adr/lint.ts:230-238` (Check 5 module error), `:278-286` (Check 11 INV-ID error). Add a relative-path helper near top of file.
- Modify: `scripts/adr/generate-index.ts:281-287` (--check failure path; insert diff computation).

- [ ] **Step 1: Read the lint.ts error-emitting blocks**

Run: `sed -n '40,50p;230,240p;276,290p' scripts/adr/lint.ts`

Expected: confirm `TAXONOMY_PATH` and `INVARIANTS_PATH` exist at lines 45-46, error message at line 237 hardcodes `"taxonomy.md"`, error message at line 284 hardcodes `"invariants.md"`.

- [ ] **Step 2: Add relative-path helper constants near top of lint.ts**

The `relative()` function is already imported at line 40. Resolve the canonical paths to repo-relative form once for reuse in error messages.

After line 46 (`const INVARIANTS_PATH = ...`), insert:
```typescript
const TAXONOMY_REL = relative(REPO_ROOT, TAXONOMY_PATH);
const INVARIANTS_REL = relative(REPO_ROOT, INVARIANTS_PATH);
```

- [ ] **Step 3: Update Check 5 error message (line 237)**

Replace:
```typescript
      error('modules', `unknown module "${value}"; not in taxonomy.md Modules section`);
```

With:
```typescript
      error('modules', `unknown module "${value}"; not in ${TAXONOMY_REL} Modules section`);
```

- [ ] **Step 4: Update Check 11 error message (line 284)**

Replace:
```typescript
      error('invariants', `unknown INV-ID "${inv}"; not in invariants.md`);
```

With:
```typescript
      error('invariants', `unknown INV-ID "${inv}"; not in ${INVARIANTS_REL}`);
```

- [ ] **Step 5: Verify lint.ts behavior with a deliberate error**

Run a probe to confirm error messages now path-cite. A hand-crafted broken ADR will produce the path in output.

Run:
```bash
mkdir -p /tmp/adr-probe && cat > /tmp/adr-probe/9999-probe.md <<'EOF'
---
id: ADR-9999
title: Probe
date: 2026-05-08
status: proposed
modules: [nonexistent_module]
features: []
invariants: [INV-PROBE-001]
related_adrs: []
---

# ADR-9999: Probe

## Status
Proposed

## Decision
Probe.
EOF
```

Then temporarily symlink it into the ADR directory and run lint. (Skipped in production; this step verifies behavior locally.)

Simpler verification: run `pnpm adr:lint` against the existing ADR set; lint should still pass (the path-cite change doesn't affect green-path behavior).

Run: `pnpm adr:lint`

Expected: clean pass (no errors emitted; the path-cite change is for error-emission only).

- [ ] **Step 6: Read generate-index.ts `--check` failure path**

Run: `sed -n '275,295p' scripts/adr/generate-index.ts`

Expected: confirm lines 281-287 contain the `if (isCheck)` block with `console.error` and `process.exit(1)`.

- [ ] **Step 7: Add diff computation + output to `--check` failure path**

The script has access to both `originalReadme` (current on-disk content) and `readme` (regenerated content) at this point in main(). A simple line-by-line first-N-differing-lines diff is sufficient — no library dependency.

Replace lines 281-287:
```typescript
  if (isCheck) {
    console.error(
      `adr:index --check — README.md regeneration would change content. ` +
        `Run \`pnpm adr:index\` and commit the result.`
    );
    process.exit(1);
  }
```

With:
```typescript
  if (isCheck) {
    console.error(
      `adr:index --check — README.md regeneration would change content. ` +
        `Run \`pnpm adr:index\` and commit the result.\n`
    );
    const oldLines = originalReadme.split('\n');
    const newLines = readme.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);
    const diffLines: string[] = [];
    for (let i = 0; i < maxLines && diffLines.length < 10; i++) {
      if (oldLines[i] !== newLines[i]) {
        if (oldLines[i] !== undefined) diffLines.push(`- ${oldLines[i]}`);
        if (newLines[i] !== undefined) diffLines.push(`+ ${newLines[i]}`);
      }
    }
    if (diffLines.length > 0) {
      console.error('First differing lines (- on disk, + after regeneration):');
      console.error(diffLines.slice(0, 10).join('\n'));
    }
    process.exit(1);
  }
```

- [ ] **Step 8: Verify `--check` behavior**

Run: `pnpm adr:index --check`

Expected: clean exit 0 with `adr:index — no changes (N ADRs scanned).` (assuming README is in sync). If `--check` exits 1, the diff output should now appear; investigate whether README needs regeneration before continuing.

To deliberately exercise the failure path, temporarily mutate README and re-run `--check`:
```bash
sed -i.bak '1s/^/# MUTATION TEST\n/' docs/07_governance/adr/README.md
pnpm adr:index --check
```

Expected: exit 1 with first-differing-lines output. Restore: `mv docs/07_governance/adr/README.md.bak docs/07_governance/adr/README.md`.

- [ ] **Step 9: Run typecheck**

Run: `pnpm typecheck`

Expected: clean exit. If errors surface around `originalReadme`/`readme` types, confirm they're both `string` at the relevant scope.

- [ ] **Step 10: Commit**

```bash
git add scripts/adr/lint.ts scripts/adr/generate-index.ts
git commit -m "$(cat <<'EOF'
chore(adr): linter path-citing + adr:index --check diff output

Bundle of two adjacent-scope tooling-polish items (per
docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md
items #1 and #2):

#1 lint.ts: Check 5 (modules) and Check 11 (invariants) error
   messages now cite TAXONOMY_REL / INVARIANTS_REL relative paths
   computed from existing TAXONOMY_PATH / INVARIANTS_PATH
   constants. Contributors hitting an error see the canonical
   file path in the message instead of bare "taxonomy.md" /
   "invariants.md" strings.

#2 generate-index.ts: --check failure path now emits first 10
   differing lines (- on disk, + after regeneration) before
   exit 1. Contributors see what changed without having to
   re-run the non-check command.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: install-hooks bundle — content-equivalence + no-op messaging (Commit 3)

**Context:** `scripts/install-hooks.sh` currently runs the backup mechanism (lines 16-20) unconditionally on every invocation, overwriting the prior `.pre-coordination` backup with the most recent installation's hook (so "the original hook before any install" is unrecoverable after the second run). And it prints the same install messaging on every run (lines 81-92), with no signal that nothing changed. Items #3+#4 fix both: the backup happens only when content differs, and identical-content reruns short-circuit with an "already installed, no action" message. The two items share the same condition (content equivalence via `cmp`), so they pair naturally in one commit.

**Files:**
- Modify: `scripts/install-hooks.sh:14-20` (backup block — restructure to write-temp-first), `:78-92` (install messaging — wrap in conditional).

- [ ] **Step 1: Read the current install-hooks.sh**

Run: `cat scripts/install-hooks.sh`

Expected: confirm structure — backup block at 16-20, hook content via heredoc at 22-77, chmod at 79, install messaging at 81-92.

- [ ] **Step 2: Restructure to write-temp-first + content-equivalence + no-op short-circuit**

Replace lines 14-92 (everything after `set -euo pipefail`) with the following:

```bash
HOOK_PATH=".git/hooks/pre-commit"

# Write the new hook content to a temp file first so we can compare
# with the existing hook before deciding whether to back up + install.
TMP_HOOK=$(mktemp)
trap 'rm -f "$TMP_HOOK"' EXIT

cat > "$TMP_HOOK" <<'HOOK_EOF'
#!/usr/bin/env bash
# Installed by scripts/install-hooks.sh. Enforces:
#   1. Session Lock File Convention (see conventions.md).
#   2. ADR linting + index-regeneration check (per ADR-0021) when
#      the staged commit touches ADR-related files.

set -euo pipefail

# ---- Session lock check ----
LOCK=".coordination/session-lock.json"

if [[ ! -f "$LOCK" ]]; then
  # No lock: permissive mode, but warn so the bypass is visible.
  echo "[coordination] warning: no session lock in use;" >&2
  echo "consider running scripts/session-init.sh <label> before" >&2
  echo "starting new work." >&2
else
  LOCK_LABEL=$(grep -oE '"session":[[:space:]]*"[^"]+"' "$LOCK" | sed -E 's/.*"([^"]+)"$/\1/')

  if [[ -z "${COORD_SESSION:-}" ]]; then
    echo "[coordination] error: session lock is held by '$LOCK_LABEL'" >&2
    echo "but COORD_SESSION is not set in your shell. If this commit" >&2
    echo "is from session '$LOCK_LABEL', run:" >&2
    echo "  export COORD_SESSION='$LOCK_LABEL'" >&2
    echo "and retry. If a different session holds the lock, stop and" >&2
    echo "resolve. Commit blocked." >&2
    exit 1
  fi

  if [[ "$COORD_SESSION" != "$LOCK_LABEL" ]]; then
    echo "[coordination] error: active lock is for session" >&2
    echo "'$LOCK_LABEL' but your shell's COORD_SESSION is" >&2
    echo "'$COORD_SESSION'. This looks like a foreign-session commit." >&2
    echo "Stop and resolve before retrying. Commit blocked." >&2
    exit 1
  fi
fi

# ---- ADR check (only when ADR-related files have changed) ----
ADR_CHANGED=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^(docs/07_governance/adr/|docs/02_specs/taxonomy\.md|docs/02_specs/invariants\.md|scripts/adr/)' || true)

if [[ -n "$ADR_CHANGED" ]]; then
  echo "[adr] ADR-related files staged; running adr:lint and adr:index --check..."
  if ! pnpm adr:lint; then
    echo "[adr] error: lint failed. Fix findings before committing." >&2
    exit 1
  fi
  if ! pnpm adr:index --check; then
    echo "[adr] error: index out of sync. Run 'pnpm adr:index' and re-stage README.md." >&2
    exit 1
  fi
fi

exit 0
HOOK_EOF

# Content-equivalence short-circuit: if existing hook matches the
# new content byte-for-byte, skip backup + install + messaging.
if [[ -f "$HOOK_PATH" ]] && cmp -s "$TMP_HOOK" "$HOOK_PATH"; then
  echo "Pre-commit hook already installed at $HOOK_PATH (no action)."
  exit 0
fi

# Otherwise, back up existing hook (only when content differs) and
# install the new hook.
if [[ -f "$HOOK_PATH" ]]; then
  BACKUP="${HOOK_PATH}.pre-coordination"
  echo "Existing pre-commit hook differs from new content; backing up to $BACKUP"
  cp "$HOOK_PATH" "$BACKUP"
fi

mv "$TMP_HOOK" "$HOOK_PATH"
chmod +x "$HOOK_PATH"
trap - EXIT  # Disarm the cleanup since TMP_HOOK no longer exists.

echo "Pre-commit hook installed at $HOOK_PATH."
echo ""
echo "The hook enforces:"
echo "  1. Session Lock File Convention (.coordination/session-lock.json"
echo "     vs COORD_SESSION env var)."
echo "  2. ADR linting and index regeneration when ADR-related files"
echo "     are staged (docs/07_governance/adr/, docs/02_specs/taxonomy.md,"
echo "     docs/02_specs/invariants.md, scripts/adr/)."
echo ""
echo "Re-run this script in every worktree / clone you commit from,"
echo "and after any change to the hook content (e.g., when ADR-0021's"
echo "tooling discipline evolves)."
```

Note: the new structure writes hook content to `$TMP_HOOK` first via heredoc, then uses `cmp -s` to compare with existing hook. The `trap` handles cleanup if anything fails between mktemp and final mv. After the mv, trap is disarmed because the temp path is now invalid.

- [ ] **Step 3: Verify idempotent reruns + no-op messaging**

Run twice in succession:
```bash
bash scripts/install-hooks.sh
bash scripts/install-hooks.sh
```

Expected:
- First run: prints either "Existing pre-commit hook differs from new content; backing up to ..." (if a hook was already installed with old script) or proceeds to install. Either way, ends with "Pre-commit hook installed at .git/hooks/pre-commit." and the multi-line "The hook enforces:" block.
- Second run: prints exactly `Pre-commit hook already installed at .git/hooks/pre-commit (no action).` and exits. No backup overwrite. No re-install messaging.

Verify backup-overwrite is gone:
```bash
ls -la .git/hooks/pre-commit*
```

Expected: at most one `.pre-coordination` backup, and it's the original pre-fix hook (or absent if no prior hook existed). Subsequent reruns don't touch backups.

- [ ] **Step 4: Verify hook still functions**

Stage a trivial change and try to commit (the hook should fire its session-lock warning and ADR check logic per the heredoc body):

```bash
echo "# probe" >> /tmp/probe-touch.txt
git add /tmp/probe-touch.txt 2>/dev/null || true
# Don't actually commit; just verify the hook content is intact.
head -5 .git/hooks/pre-commit
```

Expected: first 5 lines of the installed hook match the heredoc content (`#!/usr/bin/env bash`, comment, etc.). Confirms the install actually wrote the right content.

- [ ] **Step 5: Commit**

```bash
git add scripts/install-hooks.sh
git commit -m "$(cat <<'EOF'
chore(install-hooks): content-equivalence short-circuit + no-op messaging

Bundle of two adjacent-scope tooling-polish items (per
docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md
items #3 and #4):

#3 backup mechanism is now content-equivalence-gated: writes
   new hook content to a temp file first, compares with existing
   hook via cmp -s, and only backs up + replaces when content
   differs. The previous unconditional cp overwrote prior
   backups on each run; the new backup pins to genuinely-different
   content.

#4 second-run with identical content prints "Pre-commit hook
   already installed at .git/hooks/pre-commit (no action)." and
   exits. No backup, no re-install messaging. Pairs with #3's
   content-equivalence check.

Trap on EXIT cleans the temp file if anything fails between
mktemp and the final mv.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Push-readiness verification + push

**Context:** This arc closes the Sessions-3/4/halftime Condition 1 deviation. Post-arc full suite should be 137/137 + 665 green; Session 5A's subsequent push will go under green Condition 1, not deviation. Push-readiness gate per CLAUDE.md three-condition gate runs from working-branch HEAD.

**Files:** none (verification + push only).

- [ ] **Step 1: Pre-push sanity sequence**

Run from working-branch HEAD:
```bash
git log --oneline origin/staging..HEAD | wc -l
git status --short
pnpm agent:validate
pnpm typecheck
```

Expected:
- `git log` shows 3 commits ahead of origin/staging (the three commits from this arc).
- `git status --short` shows working tree clean (only the deliberate untracked `docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md` remains).
- `pnpm agent:validate`: 26/26 GREEN (floor scope).
- `pnpm typecheck`: clean exit.

- [ ] **Step 2: Full-suite Condition 1 evidence**

Run:
```bash
pnpm db:reset:clean && pnpm test 2>&1 | tail -10
```

Expected: `Test Files 137 passed (137); Tests 645 passed | 20 skipped (665)` (or equivalent fully-green output). If `crossOrgRlsIsolation.test.ts` flakes again, the fix is incomplete — investigate before pushing.

- [ ] **Step 3: Friction-journal entry**

Append a multi-paragraph bullet entry under `## Phase 2` in `docs/07_governance/friction-journal.md`, inserted at the top of the section (above the existing halftime + Session 4 bullets), matching the round-2 entry pattern.

Entry content:

```markdown
- 2026-05-XX NOTE — Test-hygiene fix arc shipped (sibling-of-round-2,
  not a round-2 session). Closes the Sessions-3/4/halftime Condition 1
  deviation by replacing fixed-fixture UUIDs in
  `tests/integration/crossOrgRlsIsolation.test.ts` with per-run
  `crypto.randomUUID()` values, plus four bundled tooling-polish OUT
  candidates per `docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md`.

  Three commits sequenced primary-then-tooling, by script-bundle:
  - Commit 1 (primary solo, deviation-closing): `crossOrgRlsIsolation.test.ts`
    — TEST_IDS const → describe-scope let, assigned in beforeAll,
    reused in afterAll cleanup. Acceptance: `pnpm db:reset:clean &&
    pnpm test` 5×→5/5 green.
  - Commit 2 (ADR scripts bundle, items #1+#2): `scripts/adr/lint.ts`
    error messages cite canonical paths via TAXONOMY_REL/INVARIANTS_REL
    constants; `scripts/adr/generate-index.ts` `--check` failure path
    emits first 10 differing lines.
  - Commit 3 (install-hooks bundle, items #3+#4): content-equivalence
    short-circuit via `cmp -s`; conditional "already installed, no
    action" message. Backup mechanism now pins to genuinely-different
    content (no more overwrite-prior-backup-on-rerun).

  Deviation-closure context: the fix arc was triggered specifically
  to close the deviation before Session 5's push, breaking the carry
  pattern at session 3 rather than letting it normalize. Generalizable
  observation (not codified): two sessions of carry is documented
  exception; three starts being a tolerated norm. N=1; not codified.

  Discipline codification per the brief: friction-journal NOTE
  sufficient (this entry); conventions.md addition deferred to
  ≥3-fire threshold per the brief's framing.

  Push-readiness gate (per CLAUDE.md three-condition gate):
  - Condition 1 (test-suite health): GREEN. `pnpm db:reset:clean &&
    pnpm test` reports 137/137 + 645 passed / 20 skipped (665). No
    deviation. Closes the Sessions-3/4/halftime carry.
  - Condition 2 (doc-sync): three commits internally consistent;
    no schema or ADR changes; types.ts regen not required; INDEX.md
    unaffected.
  - Condition 3 (governance closeout): this entry; no retrospective
    needed (sibling fix arc, not phase closeout); no convention
    codification (N=1 per discipline framing above).

  Forward pointers:
  - Session 5A triggers next under green Condition 1 baseline.
  - Plan for the fix arc lived at
    `docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-plan.md`
    paired with the brief.
```

Replace `2026-05-XX` with the actual execution date when this commit lands.

- [ ] **Step 4: Commit the friction-journal entry**

```bash
git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(governance): friction-journal — test-hygiene fix arc closeout

Records the test-hygiene fix arc as sibling-of-round-2 work
(per V1 amendment locked at 846c7a4). Closes the Sessions-3/4/
halftime Condition 1 deviation. Three implementation commits +
this closeout commit. Push-readiness gate evaluates green
across all three conditions; no deviation needed.

Includes the agency-framed generalizable observation (not
codified): "the fix arc was triggered specifically to close
the deviation before Session 5's push, breaking the carry
pattern at session 3 rather than letting it normalize. Two
sessions of carry is documented exception; three starts being
a tolerated norm. N=1; not codified."

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Push**

```bash
git push origin staging
```

Expected: `staging -> staging` with the four commits (3 fix + 1 friction-journal) shipped to origin.

- [ ] **Step 6: Post-push verification**

```bash
git log --oneline origin/staging..HEAD | wc -l
git log --oneline -5
```

Expected: `0` (local in sync with origin) and the recent commits list shows the four fix-arc commits at the top.

---

## Self-Review Checklist

Run before declaring this plan complete:

1. **Spec coverage:** Does each acceptance criterion (a)–(g) map to a verification step? (a) Step 10 of Task 1; (b) Steps 8-9 of Task 1 + Step 2 of Task 4; (c) Step 9 of Task 1; (d) Steps 3-4 of Task 2; (e) Step 8 of Task 2; (f) Step 3 of Task 3; (g) implicit (each commit isolated). ✓
2. **Placeholder scan:** No "TBD"/"TODO"/"implement later" patterns. The single date placeholder (`2026-05-XX` in Task 4 Step 3) is intentionally an execution-time fill-in. ✓
3. **Type/identifier consistency:** `TEST_IDS` used consistently across Task 1 steps; `TAXONOMY_REL`/`INVARIANTS_REL` introduced once and used twice. ✓
4. **Commit messages:** All three implementation commits + the friction-journal commit have HEREDOC-formatted messages with Co-Authored-By footer per chounting convention. ✓

---

## Notes for executor

- **DB reset before testing.** The `pnpm db:reset:clean` step is required before any test run that the push-readiness gate depends on. Without it, accumulated dev DB state can flake the floor tests on PK collisions even after the fixture fix lands.
- **Test count baseline.** The brief's acceptance criterion (b) requires 5/5 green across 5 runs. If the first or second run still flakes, do not commit — investigate. The fix is supposed to eliminate the flake, not reduce its rate.
- **Linter probe (Task 2 Step 5) is optional.** The hand-crafted broken-ADR probe is a deeper verification; the green-path lint check is sufficient for the commit. Skip the probe if it's not blocking.
- **Trap discipline (Task 3 Step 2).** The `trap 'rm -f "$TMP_HOOK"' EXIT` and the later `trap - EXIT` after the `mv` are load-bearing: without trap, a failure between mktemp and mv leaves the temp file behind; without disarm, the trap tries to remove a file that's been moved.
