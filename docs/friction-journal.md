## Friction Journal

Format: `[date] [category] [one-line description]`

Categories:
- WANT — wanted to do X, couldn't (missing capability)
- CLUNKY — did X, was painful (UX or DX problem)
- WRONG — the spec or the system was wrong about X
- NOTE — observation worth preserving for next phase

## Phase 1.1

- 2026-04-12 WRONG  PLAN.md v0.5.6 claimed Part 2 was reconciled
  during step-5 split; brief still missing Q19 reversal_reason
  column, exit criteria #9/#13/#14/#15, and several §3 folder
  tree entries. Reconciled in this pass.
- 2026-04-12 NOTE   Verified ADR-001 exists (390 lines), matches
  §18c.19 RESOLVED. CLAUDE.md Rule 7 reference is live.
- 2026-04-12 WRONG  PLAN.md §2a defines journal_entries with UUID
  PK only. Auditors require sequential entry numbering per org per
  period. Bible gap caught by external CTO review. Added
  entry_number column + UNIQUE constraint.
- 2026-04-12 WANT   entry_type schema reservation added per CTO
  review. Column defaulted; no UI in Phase 1.1. Phase 2 surfaces
  adjusting/closing entries as distinct workflow.
- 2026-04-12 WANT   journal_entry_attachments table added as
  Category A reservation per CTO review. Empty Phase 1.1; Phase 2
  AP Agent populates.
- 2026-04-12 NOTE   External CTO review recommends moving
  FX/multi-currency wiring into Phase 1.2. Bible §8b explicitly
  defers to Phase 4 with schema correctness in Phase 1.1.
  Phase 1.2 scope unchanged.
- 2026-04-12 WANT   PLAN.md is 256KB; ~5,000 words is changelog
  history current readers don't need. CTO review recommends
  extracting to docs/prompt-history/CHANGELOG.md. Deferred to
  post-Phase-1.1 close.
- 2026-04-12 WANT   Soft close vs. hard close gap logged as §18
  Open Question. Phase 1.1 ships hard close only.
- 2026-04-12 WRONG  Two related drift findings during closeout
  Task 2 execution:

  (1) Migration 002_add_reversal_reason.sql existed in
  src/db/migrations/ but was never applied to the database. The
  reversal_reason column did not exist in journal_entries despite
  PLAN.md v0.5.5, ADR-001, CLAUDE.md Rule 7, and the service-layer
  validation all asserting it must. The Supabase client silently
  drops unknown columns on insert, so writes appeared to succeed.
  Test 5 (reversalMirror) was effectively only testing the
  service-layer validation, not the DB CHECK.

  (2) tests/setup/test_helpers.sql defined Postgres functions
  (test_post_unbalanced_entry, test_post_balanced_entry) that
  Tests 1 and 2 depend on. The file existed but was never wired
  into the test pipeline — no migration, no globalSetup, no
  documentation. The functions were present in the running DB
  through accumulated state from manual operations. A clean
  db:reset removed them and exposed the dependency. Until this
  closeout, the integration test suite was not reproducible from
  a fresh clone. Anyone running pnpm test:integration on a fresh
  setup would have hit Tests 1 and 2 failing immediately.

  Root cause for both: no enforced reconciliation between files
  that look like they should be applied (src/db/migrations/,
  tests/setup/test_helpers.sql) and the actual application
  pipeline (supabase/migrations/, vitest globalSetup). The
  discipline of "the running system is the truth" was missing.
  PLAN.md and the brief were internally consistent but did not
  match reality.

  Fix applied: (a) moved seed files to src/db/seed/, updated
  package.json db:seed path. (b) created tests/setup/globalSetup
  .ts that loads test_helpers.sql via psql, wired into
  vitest.config.ts. (c) copied migration 002 to
  supabase/migrations/20240102000000_add_reversal_reason.sql,
  applied via db:reset, verified column + CHECK constraint
  present. (d) deleted src/db/migrations/ entirely. (e) updated
  PLAN.md, brief, and closeout plan to reference
  supabase/migrations/ with timestamp naming and globalSetup for
  test helpers. (f) verified all 5 integration tests pass on a
  fresh db:reset for the first time.

  Verification: all 5 integration tests pass after the fix.
  Test 5 now passes for the correct reason — the DB CHECK
  constraint exists alongside the service-layer validation.
  Tests 1 and 2 now pass because globalSetup loads the helpers.
  Reproducible from a fresh clone.

  Lessons:
  1. Schema reconciliation against the running database is
     load-bearing, not optional. Added Step 1.5 to Task 18.
  2. Test infrastructure (helpers, fixtures, setup SQL) belongs
     in test setup files (globalSetup, beforeAll), NOT in
     application migrations. Test helpers must never run in
     production.
  3. Any file in the project that looks like it should be applied
     by tooling but isn't wired into a pipeline is a latent drift
     source. Future Document Sync exit criterion checks should
     include "no orphaned SQL files" — every SQL file is either
     in supabase/migrations/, in src/db/seed/, or referenced by
     test setup code.
  4. The integration test suite was passing on accumulated state
     for an unknown duration. Every prior "all 5 tests green"
     claim was conditional on that state, not on a fresh build.
     This is the worst kind of test failure — silent and
     historical. The Phase 1.2 brief should treat "tests pass on
     a fresh clone" as a separate exit criterion from "tests
     pass."

- 2026-04-12 NOTE   Phase 1.3 obligation: globalSetup currently
  hardcodes postgresql://postgres:postgres@127.0.0.1:54322/postgres
  because local Supabase exposes Postgres on a fixed port.
  Phase 1.3 (remote Supabase) needs either (a) test helper
  application via admin API, or (b) a SUPABASE_TEST_DB_URL env
  var. Logged so Phase 1.3 brief writing addresses it.

- 2026-04-12 NOTE   globalSetup.ts uses execFileSync to run psql
  against test DB. Security hook flagged it; verified safe
  (hardcoded dbUrl, __dirname-resolved path, no user input).
  Switched from execSync to execFileSync as belt-and-suspenders.

- 2026-04-12 CLUNKY globalSetup runs before setupFiles in vitest
  lifecycle, so .env.local loading is duplicated between
  loadEnv.ts and globalSetup.ts. Two ~15-line implementations of
  the same parser. Acceptable for Phase 1.1; consider extracting
  to shared helper in Phase 1.2 if a third caller appears.

- 2026-04-12 NOTE   First pnpm test:integration run that is
  reproducible from a fresh clone. Two migrations apply cleanly,
  test helpers load via globalSetup, all 5 tests pass for the
  right reasons. Phase 1.1 baseline established. Every prior
  "5 green" claim was conditional on accumulated state; this
  one isn't.

- 2026-04-12 NOTE   Phase 1.1 closeout Task 2 turned into a
  half-day detour because two latent drifts were discovered in
  sequence. Lessons embedded for Phase 1.2 brief writing:

  1. PLAN.md, the brief, and CLAUDE.md can be perfectly
     self-consistent while the running system is a different
     system entirely. Document discipline must include verifying
     the running system, not just verifying the documents agree
     with each other.

  2. The src/db/migrations/ directory was dead code that LOOKED
     operative. The pattern: a directory in a plausible-looking
     location, with files named to look like migrations, that
     no tool actually reads. File location conventions matter
     more than file naming conventions because tools care about
     location, not name.

  3. v0.5.6's changelog claimed "Part 2 was extracted verbatim
     and reconciled" but the migration move never happened. This
     is the second time v0.5.6 claimed completion of work that
     wasn't actually done (the brief was also missing column
     references at design time). Phase 1.2 changelog discipline:
     do not claim completion until the change has been verified
     against the running system. Document Sync exit criterion #16
     enforces this going forward.

  4. The integration test suite had been passing on accumulated
     state for an unknown duration. Every prior "5 tests green"
     was conditional, not reproducible. Phase 1.2 should treat
     "tests pass on a fresh clone" as a separate exit criterion
     from "tests pass." A test suite that doesn't survive
     db:reset is not really a test suite.

  5. Step 1.5 (schema reconciliation) and Step 1.6 (orphaned SQL
     check) added to Task 18 of this closeout to prevent any
     other latent drift from passing through to Phase 1.2. These
     are now blockers, not deferrable.

- 2026-04-12 WANT   After applying migration 002, Test 5 should
  add a sub-case that bypasses the service and attempts a direct
  admin client insert with empty reversal_reason, asserting the
  DB CHECK constraint rejects it. This proves the three-layer
  defense (Zod, service, DB CHECK). Currently Test 5 only
  exercises the service layer; the DB layer is implicit. Defer
  to Task 10.
