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
