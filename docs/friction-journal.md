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

- 2026-04-12 WANT   Canonical Table from external CTO review is
  the cleanest one-page system-of-laws summary for any double-entry
  accounting system seen in this project. Seven sections plus a
  "How These Pieces Fit Together" dataflow diagram. Add as PLAN.md
  §0 during post-closeout extraction work alongside the changelog
  move. Source attribution: external CTO review. Content is
  reference material, not new architectural decisions.

- 2026-04-12 NOTE   External CTO review recommended adding
  template_id column to journal_entries during Phase 1.1 to avoid
  "painful Phase 1.2 migration." REJECTED. Reasoning: (1)
  idempotency_key already exists per §2a hardening with the
  idempotency_required_for_agent CHECK constraint enforcing it at
  the DB level for agent-source entries — verified during
  five-table audit. Reviewer didn't notice. (2) template_id is
  the schema half of the posting engine separation item already
  deferred to Phase 1.2 brief writing. (3) Adding a nullable
  column in Phase 1.2 is a 3-line migration, not painful. (4)
  Premature schema addition forecloses design options for Phase
  1.2 brief writing where the posting engine shape will be
  designed properly.

- 2026-04-12 NOTE   External CTO review underlying concern about
  FX Gain/Loss being calculated journal entries (not UI display
  values) is correct and matches PLAN.md §8b's Phase 4 intent.
  FX revaluation in Phase 4 will produce real journal entries
  hitting an "Unrealized FX Gain/Loss" account. Already addressed
  in §8b deferral. No action.

- 2026-04-12 WANT   External CTO review flagged that PLAN.md
  doesn't have a one-line statement saying "CAD is the functional
  currency for all entities in Phase 1." The schema enforces this
  via the D5 CHECK constraint family but the invariant isn't
  stated as text. Add a one-line invariant to PLAN.md §8b during
  post-closeout extraction work. Documentation clarification, not
  a schema change.

- 2026-04-12 WANT   External CTO review recommended two CLAUDE.md
  rules: (1) every mutation in src/services/ must require
  correlation_id or external_id, (2) forbid AI from choosing
  accounts for automated events, must look up PostingRule for
  that event type. Both deferred to Phase 1.2 brief writing
  because Phase 1.1 has zero AI-driven events and no agent path.
  CLAUDE.md additions land alongside Phase 1.2 brief.

- 2026-04-12 WANT   External CTO review recommended Test 6
  (idempotency double-post test). Deferred to Phase 1.2 because
  Phase 1.1's service Zod-rejects idempotency_key. Adding a test
  for a feature that doesn't exist yet would test nothing. The
  DB CHECK constraint idempotency_required_for_agent (verified
  during five-table audit) is already in place; Phase 1.2 just
  needs to wire the service path.

- 2026-04-12 NOTE   External CTO review recommended explicit
  REVOKE UPDATE, DELETE on ledger tables (journal_entries,
  journal_lines) at the GRANT level for defense-in-depth beyond
  RLS. Currently relying on RLS only (FOR UPDATE USING (false),
  no DELETE policy). Added to Task 18 Step 1.5 as a verification
  item. Belt-and-suspenders only — RLS is the primary defense.

- 2026-04-12 NOTE   chart_of_accounts_templates uses FOR SELECT
  TO authenticated USING (true) — globally readable, not
  tenant-scoped. Correct for shared reference data. Phase 1.2
  CoA mutation work needs to enforce write restrictions
  separately. Discovered during five-table audit.

- 2026-04-12 NOTE   Five-table audit (chart_of_accounts,
  chart_of_accounts_templates, journal_entries, journal_lines,
  fiscal_periods) ran after Step F commit. Zero drift. Confirms
  schema baseline is clean before Tasks 3-17 add migrations
  004-006 on top. Task 18 Step 1.5 will run the broader audit
  against all 24 tables.

- 2026-04-12 NOTE   Migration block complete. Tasks 1-5 of Phase
  1.1 closeout landed: six migrations in supabase/migrations/
  (001 initial, 002 reversal_reason, 003 tax codes, 004
  entry_number nullable, 005 entry_type, 006 attachments).
  All 5 integration tests pass on fresh db:reset. pnpm typecheck
  clean. Generated types include all new columns and tables.
  Schema baseline established for Tasks 6-17 (TypeScript
  architecture work). Pausing here for fresh-context start of
  next inline block.

- 2026-04-12 WRONG  Plan Task 7 test cases asserted that
  MoneyAmountSchema.parse('100') should throw and
  FxRateSchema.parse('1.0') should throw. Both are wrong against
  the actual spec contract. PLAN.md §3a regex makes the decimal
  portion optional, so '100' is valid. FxRate regex allows 1-8
  decimal digits, so '1.0' is valid. Plan tests were too strict.
  Fixed in execution: tests now match the contract, added
  upper-bound rejection cases. Future plan-writing: derive test
  expectations from the spec regex itself, not from assumptions.

- 2026-04-12 NOTE   Service-level balance check (integer arithmetic
  via parseInt(debit_amount.replace('.', ''), 10)) removed during
  Task 9 Phase A. The Zod schema (Task 8) already enforces balanced
  debits/credits via .refine() using addMoney/eqMoney. Two sources
  of truth would drift. Schema is the boundary; service trusts
  parsed input. DB deferred constraint remains as third layer.
  Three layers: Zod (boundary) -> service (trust) -> DB (guard).

- 2026-04-12 NOTE   Zod z.input<> vs z.infer<> distinction surfaced
  during Task 9. Service accepts raw input (before parse), so the
  function parameter type must use z.input<> (optional fields
  allowed) not z.infer<> (defaults applied, all required). Tests
  that omit dry_run were failing typecheck because z.infer<> makes
  dry_run required (it has a .default(false)). Fixed by exporting
  Raw types alongside parsed types.

- 2026-04-12 WRONG  Plan Task 9 Phase B: hardcoded entry_number = 1
  in test helpers collided with Test 5's service-inserted entries.
  Tests run sequentially (reversalMirror before unbalanced) and
  share DB state. Test 5 inserts entry_number 1+2 via service;
  Test 1's helper then tries entry_number = 1 in the same period.
  UNIQUE violation. Fix: changed helpers to MAX + 1 dynamic
  computation matching the service pattern. The original assumption
  "tests don't share state" was wrong — vitest fileParallelism:false
  means sequential execution, not isolated state. Rolled-back
  entries don't persist, but committed entries from prior test
  files do. Future test helper additions: always compute dynamic
  values for UNIQUE columns, never hardcode.

- 2026-04-12 NOTE   Test 5's "empty reversal_reason" branch was
  previously testing a service-level rejection. After Task 9
  Phase A removed the inline schemas, the rejection now happens
  at the Zod boundary (ZodError, not ServiceError). The test
  still passes via .toThrow() but is implicitly testing the
  schema, not the DB CHECK constraint. Task 10 should add a
  sub-test verifying the DB CHECK independently.

- 2026-04-12 NOTE   In-place edit of migration 004 in Task 9 Phase B
  is acceptable only because Phase 1.1 has not shipped to any
  remote environment. After Phase 1.3 deploys to remote Supabase,
  migration files become append-only. Phase 1.3 brief should
  formalize this rule.

- 2026-04-12 WANT   z.input<> vs z.infer<> distinction (discovered
  Task 9 Phase A) deserves to land as a permanent rule in PLAN.md
  §3a or in ADR-002 when written during post-closeout extraction.
  Rule: service signatures use z.input<> for parameters, service
  bodies use z.infer<> after parse.

- 2026-04-12 NOTE   Grep check for deferred-feature rejection
  strings matched a comment, not code. Tightening the regex risks
  false negatives. Accept the false positive — manual inspection
  takes 5 seconds. Phase 1.2 may revisit.

- 2026-04-12 CLUNKY Supabase analytics container (logflare) became
  unhealthy during Task 10 after multiple db:reset cycles and
  blocked db:start. Fixed by setting [analytics] enabled = false in
  supabase/config.toml. The logflare container is non-essential for
  local development but its health check was preventing supabase
  start from completing. Phase 1.3 readiness: config-toml-review
  step needed before remote deployment. Supabase CLI v1.226.4
  (current v2.84.2) — meaningful version gap, upgrade before
  Phase 1.3.

- 2026-04-12 WRONG  Test 3 journal_entries "CAN read own org"
  failure was misdiagnosed as a UNIQUE collision, RLS issue, and
  test execution order problem. The actual cause was stale JWT
  keys in .env.local after a Supabase db:stop + db:start cycle
  regenerated the demo keys. The dynamic MAX + 1 entry_number
  computation and the ai_actions user_id fix were both correct
  improvements that weren't actually addressing the original
  failure. Lesson: when environment state is unknown, verify
  every layer (containers, health endpoints, JWT keys, schema
  state) before concluding a test failure is a code issue. Future
  debugging: always check .env.local against
  `supabase status -o env` after any db:stop/db:start cycle.

- 2026-04-12 NOTE   Inline tasks (1-10) complete. Six migrations
  applying cleanly, journalEntryService refactored with branded
  types and entry_number/entry_type assignment, parameterized RLS
  test covering 6 tenant-scoped tables. 5 test files / 18 test
  cases all green. Schema baseline + service layer + test layer
  established for Tasks 11-17 (UI work, subagent-driven). Task 18
  (final verification) returns to inline mode after UI block.

- 2026-04-13 NOTE   Task 11 orgService wiring is not test-verified.
  createOrgWithTemplate is called by src/app/api/org/route.ts but
  no integration test exercises that route. The seed bypasses the
  service entirely (raw SQL). First Phase 1.2 task that exercises
  org creation via the API should verify the fiscal period
  auto-generation fires correctly end-to-end.

- 2026-04-13 NOTE   Task 11 initially hardcoded fiscal_year_start_month = 1
  in the orgService wiring. Caught during review — the org row's
  actual fiscal_year_start_month should be read from the INSERT's
  RETURNING clause. Fixed: SELECT now returns org_id +
  fiscal_year_start_month, passed to generateMonthlyFiscalPeriods.

- 2026-04-13 NOTE   Task 11 complete. Inline block (Tasks 1-11)
  done. UI block (Tasks 12-17) starts next session, subagent-driven.
  Task 18 returns to inline for final verification.

- 2026-04-13 NOTE   Task 12 split into Phase 12A (inline service
  extension) and Phase 12B (subagent route creation). Phase 12A
  adds journalEntryService.list and .get, NOT_FOUND + READ_FAILED
  error codes, and shared serviceErrorToStatus helper. The split
  preserves the architectural-layer-locked constraint for the
  subagent: Phase 12B's brief forbids modifying src/services/.

- 2026-04-13 NOTE   Task 12 spec/plan inconsistencies resolved.
  (1) "journal-entries" not "journals" — matches table name and
  codebase vocabulary. (2) Always include [orgId] segment:
  /api/orgs/[orgId]/journal-entries[/[entryId]]. (3) Reads don't
  use withInvariants per CLAUDE.md Rule 2 ("every mutating").

- 2026-04-13 NOTE   Read functions (list, get) now have explicit
  authorization checks. list checks ctx.caller.org_ids.includes(
  input.org_id) at the top. get uses .in('org_id', ctx.caller.
  org_ids) as inline query filter — same effect as RLS, doesn't
  leak existence (unauthorized returns NOT_FOUND, not 403).
  Writes already had this via withInvariants Invariant 3; reads
  were a gap because they bypass withInvariants. Gap closed in
  Phase 12A rather than deferred. The pattern is the template
  for all future read functions.

- 2026-04-13 NOTE   Read functions (list, get) are typecheck-
  verified but not runtime-verified. No integration test
  exercises them. Phase 12B's API routes will be the first
  runtime exercise.

- 2026-04-14 NOTE   First subagent task (Phase 12B) produced zero
  drift. The literal-code approach in the brief — specifying exact
  imports, exact function signatures, exact error handling patterns
  — resulted in the subagent outputting byte-for-byte matches to
  the brief's code blocks. The 12-point review checklist found
  nothing to correct. Lesson: the more literal the brief, the less
  review work. Descriptions produce interpretation; code produces
  copies. Future briefs should maximize literal code blocks and
  minimize prose descriptions of code behavior.

- 2026-04-14 NOTE   Phase 12B smoke test deferred. The API routes
  require authenticated Supabase Auth cookies, which can't be
  easily tested via bare curl. Full end-to-end testing happens
  when Tasks 13-17's UI forms exercise the routes. The routes are
  typecheck-verified and integration-test-regression-free but not
  runtime-verified against a live server yet. Same pattern as
  Phase 12A's service functions (typecheck-verified, not
  runtime-verified until a consumer exercises them).

- 2026-04-14 NOTE   Plan Task 12 response shape descriptions were
  stale relative to Phase 12A service return types. The plan said
  GET detail returns { entry, lines } but the service returns the
  entry with journal_lines nested. Phase 12B brief used the
  service shapes directly. Plan should be updated post-closeout
  if it gets reused as a template.

- 2026-04-14 NOTE   Plan Task 13 was written against assumptions
  about service and API surface that were stale by execution time.
  Pre-check surfaced three missing data sources (fiscal_periods
  list, tax_codes list, periodService.listOpen), no installed form
  library, and stale URL conventions. Phase 13A inline scope
  expanded to address all gaps. Lesson: tasks that consume
  multiple architecture layers need pre-checks against all of them.

- 2026-04-14 NOTE   API URL convention established in Phase 13A:
  org-scoped data uses nested routes /api/orgs/[orgId]/{resource};
  globally-readable reference data uses flat routes /api/{resource}.
  Examples: /api/orgs/[orgId]/journal-entries (org-scoped),
  /api/tax-codes (shared). The distinction is whether RLS is
  org-scoped or globally readable.

- 2026-04-14 NOTE   Chart-of-accounts route migrated from flat
  /api/chart-of-accounts?org_id= to nested /api/orgs/[orgId]/
  chart-of-accounts during Phase 13A. Was the only route wrapping
  a read with withInvariants (violating CLAUDE.md Rule 2). Fixed:
  inline auth check added to service, withInvariants removed from
  route. All reads now consistently call services directly.

- 2026-04-14 NOTE   Next.js .next/types/ cache persists type info
  for deleted routes. After removing chart-of-accounts/route.ts,
  typecheck failed on stale cached types. Fix: rm -rf .next before
  typecheck. Worth remembering when deleting or moving route files.

- 2026-04-15 NOTE   Second subagent task (Phase 13B — form component)
  produced zero drift on a 32-point review checklist. The literal-for-
  interfaces, descriptive-for-behaviors brief structure worked for a
  component significantly more complex than Phase 12B's routes (~494
  lines vs ~100 lines). The brief's literal code blocks (schema,
  running balance, submit handler, formStateToServiceInput, balance
  indicator render) were copied exactly. Descriptive sections (layout,
  styling) were interpreted correctly within the constraints. Two
  subagent decisions (type-safe setError path, bare catch) were
  improvements over the brief. The brief structure is validated for
  complex UI components, not just mechanical route adapters.

- 2026-04-15 NOTE   Phase 13B smoke test deferred. Subagent couldn't
  run browser (CLI context). Form is typecheck-verified, 32 review
  checks pass, ContextualCanvas modification matches brief's literal
  before/after diff. Manual smoke test in next session before
  proceeding to Task 14. If form doesn't render, the bug is likely
  in the data-fetching layer (Phase 13A routes) not the form itself.

- 2026-04-15 NOTE   Plan Task 13 had four spec/decision conflicts at
  brief-writing time. All resolved during pre-check rather than
  during execution: POST URL stale, submit scope underspecified,
  MainframeRail changes removed, success navigation target updated.
  Lesson: plan documents are snapshots, not canonical sources, once
  execution surfaces drift.

- 2026-04-15 NOTE   Phase 13B smoke test: FIRST END-TO-END RUNTIME
  VERIFICATION of the entire posting pipeline. Five journal entries
  posted successfully from an authenticated browser through
  JournalEntryForm → fetch → API route → withInvariants →
  journalEntryService.post → Zod validation → DB insert → response
  → console.log. Sequential entry_numbers (1-5), correct
  multi-currency columns, balanced debits/credits. The full vertical
  slice works.

- 2026-04-15 WRONG  form.watch('lines') does not trigger re-renders
  correctly for the running balance useMemo. The balance indicator
  showed "—" throughout despite valid amounts being entered. Fix:
  replaced with useWatch({ control, name: 'lines' }) which is
  react-hook-form's recommended pattern for watching field arrays
  in render. The 32-point structural review couldn't catch this
  because both patterns typecheck identically — the difference is
  purely runtime re-render behavior. Lesson: form.watch() works
  in event handlers (imperative); useWatch() works in render
  (reactive). The brief should have specified useWatch for the
  balance computation.

- 2026-04-15 NOTE   Smoke test revealed no success feedback to user
  after form submission. The form submits successfully (console
  logs result, DB has entries) but the user sees nothing change.
  The brief explicitly deferred navigation: "TODO: navigate canvas
  to journal_entry_list after Task 14 exists." Task 14 should add
  both the navigation and a brief success message. Four duplicate
  entries were created because the user couldn't tell the first
  click worked.

- 2026-04-15 NOTE   Seed password documentation was stale.
  Bookmark and specs referenced DevSeed!Controller#2 but the
  actual seed uses DevSeed!Controller#1. All seed passwords end
  in #1. Corrected in CURRENT_STATE.md.

- 2026-04-15 NOTE   Phase 13B.1 useWatch fix verified in browser
  after dev server restart. Balance indicator updates reactively
  as amounts are typed — shows "Debits: 100.0000 / Credits:
  100.0000" in green for balanced, updates correctly across
  multiple orgs (Bridge Holding Co, PC & Friends), clears back
  to "—" when amounts are invalidated. Fix is genuinely complete,
  not just typecheck-complete.

- 2026-04-15 WRONG  rm -rf .next while dev server is running
  causes Internal Server Error on next request — server references
  deleted vendor chunks in memory. Second occurrence in closeout
  (first: Phase 13A delete-route-file). Rule: kill dev server
  before clearing .next, or restart immediately after. The error
  message ("ENOENT: vendor-chunks/@supabase+auth-js") looks like
  a code bug but is actually a cache-invalidation infrastructure
  issue. Don't misdiagnose.

- 2026-04-15 NOTE   Phase 1.2 form gap analysis captured in
  docs/phase-1.2/journal-entry-form-gaps.md. Compared against
  Zoho Books New Journal form during smoke test. Key gaps:
  per-line description, draft/posted status, vendor/customer
  link, attachments upload UX, save-as-draft. All are Phase 1.2
  or later scope — Phase 1.1's form is correctly minimal.

- 2026-04-12 WRONG  Plan Task 3 (migration 004 — entry_number)
  cannot land in isolation. Adding entry_number with NOT NULL +
  UNIQUE in migration 004 breaks the test suite because
  journalEntryService.post (Task 9) doesn't yet supply the value.
  Cross-task interaction not caught during plan writing. Fix:
  Task 3 lands the migration with entry_number nullable, no
  UNIQUE constraint. Task 9 updates the service to populate it,
  then adds NOT NULL + UNIQUE. Tasks 3 and 9 are coupled.
