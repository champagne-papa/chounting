# Test-Hygiene: Replace Fixed-Fixture UUIDs in `crossOrgRlsIsolation.test.ts`

**Status:** filed 2026-05-08 during round-2 docs reorganization Session 3 closeout.
**Scope:** post-MVP test-hygiene fix. Single contained change.
**Estimated commits:** 1–2 (1 commit if just the fixture swap; 2 if a regression test for fixture-isolation lands alongside).

## Problem

`tests/integration/crossOrgRlsIsolation.test.ts` flakes intermittently in
full-suite (`pnpm test`) mode with a `journal_entries_pkey` PK
collision at line 102. The same test passes reliably in 5-file floor
scope (`pnpm agent:floor` / `pnpm agent:validate`).

Failure rate observed during round-2 Session 3 investigation:
**1 of 4 full-suite HEAD runs** (~25% in this small sample). The
single pre-Session-3 baseline run (`ac1ff11`) was green, consistent
with the same flakiness rate firing infrequently rather than the
flake being absent there.

CI casualties reading "the test was green yesterday and red today"
should read this brief first before investigating: the flake is
known, the fix is small, the diagnosis is complete.

## Mechanism

Per the round-2 Session 3 friction-journal entry (commits `0a3374f`,
`3df727c` under `## Phase 2`):

`crossOrgRlsIsolation.test.ts`'s fixture inserts `journal_entries`
rows with **fixed UUIDs**. When vitest's parallel test-file
scheduling lands another full-suite test that inserts
`journal_entries` with a colliding UUID *before* this test runs,
the collision fires.

The collision is timing-dependent (vitest pool worker scheduling
has non-deterministic ordering across files), which is why the
flake is intermittent and indistinguishable in mechanism on
either side of the round-2 Session 3 lockfile change. Lockfile
diff at Session 3: `gray-matter@^4.0.3` + 9 transitive deps; 0
test-infrastructure changes.

Test count in the suite grew from 598 (baseline 2026-05-01 per
`CURRENT_STATE.md`) to 665 (2026-05-08); the 28 added tests almost
certainly include the colliding writer, but identifying the exact
peer is not required for this fix — eliminating the fixed-UUID
anti-pattern in `crossOrgRlsIsolation` removes the entire class
of bug regardless of which other test currently triggers it.

## Fix

**Candidate (a) per round-2 Session 3 closeout** — replace
fixed-fixture UUIDs in `crossOrgRlsIsolation.test.ts` with
`crypto.randomUUID()` calls per test run.

Three other candidates considered and rejected at the round-2
closeout:

- **(b) Have the conflicting test clean up its inserts.** Fixes
  one collision; leaves the next one latent. Wrong layer.
- **(c) Per-file DB reset between integration tests.** Correct
  but slow; changes test infrastructure for one symptom.
- **(d) Forced test ordering.** Hides coupling rather than
  removing it; breaks when a future test is added in the wrong
  place.

Candidate (a) is small, contained, and eliminates the *class* of
collision rather than this specific instance. A future test that
also uses fixed-fixture UUIDs would still be vulnerable, so the
fix should additionally name the discipline ("integration test
fixtures must use `crypto.randomUUID()` for any column with a
unique constraint, never fixed values") in
`docs/04_engineering/conventions.md` if the codification
threshold (≥3 fires) is reached. For this single fix, a journal
NOTE alongside the commit is sufficient.

## Acceptance criteria

- `tests/integration/crossOrgRlsIsolation.test.ts` no longer
  uses fixed UUIDs for `journal_entries` insert fixtures (or any
  other PK / unique-constraint column). Verify by grep against
  the file post-fix.
- Run `pnpm db:reset:clean && pnpm test` 5 times consecutively;
  expect 5/5 green. (The test of "is it actually fixed" is
  empirical — the fix should reduce observed flake rate from
  ~25% to 0% in a 5-run sample.)
- A friction-journal NOTE entry records the discipline statement
  if the codifier wants to lift "use `crypto.randomUUID()` for
  unique-constraint test-fixture columns" into a conventions.md
  candidate at next codification cycle.

## References

- `docs/07_governance/friction-journal.md` 2026-05-08 entry —
  the full diagnosis with empirical samples.
- `docs/02_specs/glossary.md` — `crypto.randomUUID()` is
  preferred over `uuid` package per existing repo convention
  (verify against current state).
- `apps/web/scripts/audit/verifyAuditCoverage.ts` and similar —
  precedent for `crypto.randomUUID()` usage in test-adjacent code.

## Adjacent scope: tooling polish (independent within this arc)

Pre-Session-4 cleanup Phase 3 surfaced four tooling-polish
findings in `scripts/adr/` and `scripts/install-hooks.sh` that
share a code area with this fix arc and benefit from the same
reviewer attention. They are **independent within this arc** —
each can ship alone or paired; the test-hygiene fix above
(candidate (a) for `crossOrgRlsIsolation`) does not depend on
any of these, and vice versa. Bundling here for code-area and
reviewer-attention coherence, not sequencing.

- **#1 — Linter error messages don't path-cite the canonical
  files.** `scripts/adr/lint.ts` errors say "not in
  taxonomy.md" / "not in invariants.md" without the path. If
  either file renames, error messages rot silently. Fix:
  define one constant (e.g., `TAXONOMY_PATH`,
  `INVARIANTS_PATH` already exist as path resolutions) and
  use them in error messages too. ~5-line change.

- **#2 — `pnpm adr:index --check` failure doesn't surface a
  sample diff.** CI casualty knows to run `pnpm adr:index`
  but not what the corruption was. Fix: compute the would-be
  diff in `--check` path and print first ~10 lines on failure.
  Small change in `scripts/adr/generate-index.ts` `main()`.

- **#3 — `scripts/install-hooks.sh` backup mechanism not
  idempotent.** Each run blindly backs up the existing hook to
  `.git/hooks/pre-commit.pre-coordination`, overwriting any
  prior backup. After 2+ runs, "what was here originally" is
  lost. Fix: either timestamp backups
  (`pre-commit.pre-coordination.YYYYMMDDHHMMSS`) or
  short-circuit when content is content-equivalent. Couples
  with #5 (operational silent-bypass fix in Session 4) if that
  fix takes the `prepare`-script route — see Session 4
  documentation-cluster brief if filed.

- **#4 — `scripts/install-hooks.sh` has no "already installed"
  no-op messaging.** Both runs print identical install output.
  Confusion-only, not breakage. Fix: pair with #3 — when
  content-equivalent, print "Hook already installed, no
  action." Single condition check.

Source: pre-Session-4 cleanup Phase 3 audit, 2026-05-08.
Filed as adjacent scope per Phase 4 triage (#1, #2, #3, #4
disposition: OUT, paired with this arc's code area). See
`docs/07_governance/friction-journal.md` 2026-05-08 entry
sub-block "Phase 3 audit results" for full probe details.
