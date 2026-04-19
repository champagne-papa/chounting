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
  extracting to docs/08_releases/CHANGELOG.md. Deferred to
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
  docs/09_briefs/phase-1.2/journal_entry_form_gaps.md. Compared against
  Zoho Books New Journal form during smoke test. Key gaps:
  per-line description, draft/posted status, vendor/customer
  link, attachments upload UX, save-as-draft. All are Phase 1.2
  or later scope — Phase 1.1's form is correctly minimal.

- 2026-04-16 NOTE   Task 14 diagnostic surfaced Phase 14A scope:
  (1) JournalEntryListItem missing per-entry debit/credit totals —
  service needed 2-query aggregation with branded addMoney. (2)
  ContextualCanvas renderDirective lacked onNavigate callback —
  child components couldn't trigger directive changes. (3) Form
  success navigation was console.log TODO — needed real onNavigate
  to list view. All three fixed inline before subagent brief.
  Same 13A-style pattern: pre-check surfaces missing infrastructure,
  inline phase builds it, subagent consumes it.

- 2026-04-16 WRONG  Phase 14A.2 typed chart_of_accounts as
  Array<{...}> to match Supabase's generated database types.
  PostgREST runtime returns many-to-one FK embeds as a single
  object, not an array. Typecheck passed (Array<{...}> accepts
  empty arrays), but runtime access via [0]?.account_code resolved
  to undefined. Caught during Phase 14B smoke test: accounts
  rendered as "— — Unknown." Fixed: type changed to single object
  | null, cast through unknown in service. Lesson: Supabase's
  generated types model FK relationships as arrays regardless of
  cardinality; PostgREST flattens many-to-one to single objects.
  When generated type and runtime shape differ, runtime wins.
  Second closeout bug in this category (Phase 13B's form.watch
  was the first): "passes typecheck but runtime contract doesn't
  match what the type claims."

- 2026-04-16 NOTE   Third consecutive subagent task (Phase 14B)
  produced zero drift on a 31-point review. Literal-for-interfaces,
  descriptive-for-behaviors brief structure validated across three
  complexity levels: mechanical routes (12B), complex forms (13B),
  navigation-coupled views (14B). The one runtime bug came from
  the brief author's Phase 14A.2 type error, not the subagent.

- 2026-04-16 NOTE   Task 14 smoke test surfaced UX gap: list view
  shows no indicator that an entry has been reversed by another
  entry. JournalEntryListItem has no reversed_by_entry_id field.
  Deferred to Task 15 — requires service query change (LEFT JOIN)
  and list view visual treatment. Task 15 scope should include
  this alongside the actual reversal form.

- 2026-04-16 NOTE   Task 14 list view UX: entries from multiple
  fiscal periods all show entry_number starting from 1. Looks like
  duplicate IDs without period context. Not a bug (unique per
  org+period by design) but needs a Period column or contextual
  numbering like "#1 (Apr 2026)". Phase 1.2 design doc scope.

- 2026-04-17 NOTE   Phase 15A: mirrorLines helper is 9 lines of code
  covering the entire debit↔credit swap. Pure function, immutable,
  6 unit tests including FX rate edge case. The simplicity validates
  the spec's §15.7 design: "swap debit/credit, keep everything else."
  No domain complexity — the complexity is in the service's mirror
  validation, not in the swap itself.

- 2026-04-17 NOTE   reversed_by field uses the separate-query pattern
  (Option Q) for both list and detail, consistent with line totals
  aggregation. List now makes 3 DB round trips (entries, lines, 
  reversing entries). Detail makes 2 (entry+lines, reversing entry).
  Could optimize to 1 with JOINs but PostgREST's query builder
  makes JOINs harder than separate queries. Phase 1.2 optimization
  candidate if query latency becomes noticeable.

- 2026-04-17 WRONG  Third closeout bug in "typecheck passes, runtime
  shape doesn't match" category. Phase 13B: form.watch vs useWatch
  (React re-render). Phase 14B: chart_of_accounts array-vs-object
  (PostgREST embed). Phase 15B: MoneyAmount number-vs-string
  (Supabase Postgres driver serializes NUMERIC as JS numbers).
  Each only caught during user-executed smoke test. Pattern: type
  casts provide compile-time safety but zero runtime enforcement.
  Every external-system boundary needs explicit runtime shaping.
  Fix: toMoneyAmount/toFxRate coercion at service boundaries.

- 2026-04-17 NOTE   JournalEntryDetail.journal_lines[] types use
  plain string instead of MoneyAmount/FxRate branded types. The
  as MoneyAmount casts in consumers can't be removed without
  narrowing the service return type. Post-15B.3, the casts are
  truthful (runtime values are canonical strings) instead of lies
  (coercing numbers). Phase 1.2 type-narrowing refactor scope.

- 2026-04-17 NOTE   Fourth consecutive subagent task (Phase 15B)
  zero structural drift on 28-point review. All four runtime bugs
  (13B useWatch, 14B.1 chart_of_accounts, 15B money type) came
  from brief-author runtime assumptions, not subagent execution.
  The brief-writing step is the quality bottleneck.

- 2026-04-17 NOTE   Adversarial test of JournalEntryForm submitting
  empty form surfaced UX bug: MoneyAmount regex leaks to user
  ("MoneyAmount must match /^-?\\d{1,16}..."). Fixed in Phase 15B
  commit: custom message "Must be a valid amount (up to 4 decimal
  places)". Also: fiscal period dropdown placeholder is selectable
  instead of disabled. Both latent since Phase 13B — only caught
  now during adversarial testing. Phase 1.2 form UX pass scope.

- 2026-04-17 NOTE   Phase 15A uses the current service contract where
  client sends mirrored lines and service validates. Alternative:
  service-computes-mirror on just the source entry ID. Simpler
  client, cleaner API, but requires changing ReversalInputSchema
  and the service. Defer to Phase 1.2 if the form-sends-lines
  pattern proves painful.

- 2026-04-16 NOTE   CanvasNavigateFn standardized callback type
  added to canvasDirective.ts. Prevents type drift across
  navigating components. Every component that needs to change the
  canvas directive declares onNavigate: CanvasNavigateFn in props.

- 2026-04-12 WRONG  Plan Task 3 (migration 004 — entry_number)
  cannot land in isolation. Adding entry_number with NOT NULL +
  UNIQUE in migration 004 breaks the test suite because
  journalEntryService.post (Task 9) doesn't yet supply the value.
  Cross-task interaction not caught during plan writing. Fix:
  Task 3 lands the migration with entry_number nullable, no
  UNIQUE constraint. Task 9 updates the service to populate it,
  then adds NOT NULL + UNIQUE. Tasks 3 and 9 are coupled.

- 2026-04-13 NOTE   Task 16 session start discovered 14 uncommitted
  files persisting across multiple sessions (Phase 13B through 15B).
  Root cause: git status was never run as a session-start gate; every
  session committed specific files by path (git add <file>) not
  git add ., so dirty files were never swept in or addressed.
  Included two Category A floor tests (reversalMirror, serviceMiddleware
  Authorization) that were passing in pnpm test:integration but
  untracked in git. Rule for Phase 1.2: every session-start entry
  sequence includes git status --short; expected output is empty.

- 2026-04-13 NOTE   Spec §15.8 references "§18 Q21 (P&L reversal
  rendering)" as a prerequisite for step 5, but Q21 was never created
  in PLAN.md §18 (which only has Q1-Q19). The question about how
  reversed entries appear in P&L was answered inline during Task 16:
  decision (a) — include all entries, reversals net naturally via
  aggregation. Simple query, no WHERE NOT EXISTS exclusion.

- 2026-04-13 NOTE   Trial Balance spec SQL (§16.5) uses native-currency
  columns (debit_amount/credit_amount) while P&L spec (§15.8)
  explicitly uses amount_cad for multi-currency correctness. Task 16
  overrides the Trial Balance spec to use amount_cad for consistency.
  In CAD-only Phase 1.1 the values are identical; in Phase 2+
  multi-currency they would diverge.

- 2026-04-13 NOTE   First use of RPC functions (migration 0007). Neither
  the P&L nor Trial Balance queries are expressible through the
  Supabase PostgREST query builder (FILTER clauses, conditional JOIN
  predicates). Established conventions: get_ prefix for reads, p_ prefix
  for params, LANGUAGE sql for single-SELECT functions, SECURITY INVOKER,
  GRANT EXECUTE to service_role only. adminClient().rpc() is the call
  pattern.

- 2026-04-13 NOTE   Integration tests for report aggregation required
  baseline-then-delta pattern because tests share database state across
  files. Each report test captures the current totals before posting its
  own known entries, then asserts that deltas match hand-calculated
  expectations. Same underlying cause as the entry_number collision
  in Phase 12A (WRONG entry from 2026-04-12) — vitest sequential
  execution shares committed state.

- 2026-04-13 NOTE   Seed creates 12 monthly fiscal periods per org
  (January 2026 through December 2026), not "FY Current" as assumed
  throughout Phase 15. JournalEntryForm period dropdown defaults to
  an arbitrary month rather than the period matching entry_date.
  Phase 1.2 form UX fix: compute default period by finding the
  period whose start_date <= entry_date <= end_date.

- 2026-04-13 WRONG  Task 17 smoke test revealed: seeded auth users
  don't have memberships in seeded orgs after pnpm db:seed:all.
  pnpm db:seed:auth creates users, pnpm db:seed creates orgs and
  memberships, but the membership INSERT uses hardcoded UUIDs that
  match the seed user UUIDs. The actual issue is that each smoke
  test session requires creating a new org via the form because
  prior session state doesn't persist across db:reset. This is
  working-as-designed but confusing. Phase 1.2: document the
  smoke test setup sequence explicitly in CURRENT_STATE.md.

- 2026-04-13 NOTE   Fifth consecutive zero-drift subagent task
  (Phase 17B). Pattern validated across every UI complexity tier:
  mechanical routes (12B), complex forms (13B), navigation views
  (14B), specialized forms (15B), dual report views (17B). The
  subagent's _onNavigate idiom for unused props was a defensible
  local improvement not specified in the brief. Brief-writing
  quality remains the bottleneck — all runtime bugs in the closeout
  came from brief-author assumptions, never from subagent execution.

- 2026-04-13 NOTE   P&L net income spec formula (revenue.credit -
  expense.debit) is wrong for the reversal case chosen in Q21(a).
  The correct formula is (rev.credit - rev.debit) - (exp.debit -
  exp.credit), accounting for reversal debits on revenue accounts
  and reversal credits on expense accounts. Task 17 implements the
  correct formula. The simplified formula would report wrong net
  income whenever a reversed entry exists in the filtered period.

- 2026-04-13 NOTE   Document Sync session (Phase 1.1 exit criterion
  #16). PLAN.md drift audit found: folder tree had 28 stale paths
  (wrong API routes, wrong migration location, missing files,
  Phase 1.2 stubs presented as populated), §10a test layout used
  kebab-case names vs actual camelCase, §16 referenced nonexistent
  docs/troubleshooting/rls.md and docs/prompt-history/v0.5.0-phase1-
  simplification.md, two future-tense ADR-001 references ("will be
  captured") when ADR-001 already exists, CHANGELOG.md missing v0.5.5
  and v0.5.6 entries. All fixed. Changelog block (~2,700 words)
  extracted from PLAN.md to docs/08_releases/CHANGELOG.md.

- 2026-04-13 NOTE   CTO review amendments (Posting Engine separation,
  functional currency handling, COA hierarchy validation) from §16
  of the Phase 1.1 brief didn't land in PLAN.md during Phase 1.1.
  Deferred to Phase 1.2 as architecture-authoring work. Not part of
  Document Sync scope.

- 2026-04-14 NOTE   Docs restructure completed (commits 3 through 5,
  Phase 1.1 closeout). What changed structurally: the flat
  PLAN.md-as-canonical layout was replaced with a 9-folder
  structure under docs/. PLAN.md v0.5.6 archived at
  docs/99_archive/PLAN_v0.5.6.md (commit 5.7); content migrated
  and expanded into the new structure across commits 3, 4a, 4b,
  and 5.

  New canonical files (post-restructure):

  - docs/02_specs/ledger_truth_model.md (3,813 lines) — the
    rules. 17 INV-IDs across Layer 1 (11) and Layer 2 (6) with
    full leaves, Phase 2 evolution notes, and interactions.
    Single source of truth for "what is legal in the ledger and
    who stops what is illegal."
  - docs/02_specs/data_model.md — the schema (table-by-table
    reference).
  - docs/02_specs/invariants.md (139 lines) — contributor-
    facing INV-ID rollup index with cross-layer pairings table.
  - docs/02_specs/glossary.md (387 lines) — vocabulary
    reference, alphabetical with letter index.
  - docs/02_specs/open_questions.md (331 lines) — unresolved
    questions plus formalization candidates.
  - docs/06_audit/control_matrix.md (269 lines) — auditor-
    facing evidence table mapping each INV-ID to its tests and
    code enforcement mechanism.

  Load-bearing decisions made along the way:

  - The 17-INV framing as the canonical structure for Phase 1.1
    rules (extracted from PLAN.md Invariants 1-6 plus several
    §15/§3a/§10c/§4h details that PLAN.md had not formalized
    as numbered invariants).
  - Bidirectional reachability check (Waypoint F): every
    documented INV has at least one annotation site in code,
    every annotated INV-ID in code has a corresponding leaf.
    17/17 with empty symmetric diff as of commit 65bcfe0.
    Reproducible verification command in invariants.md.
  - Paired-invariants vocabulary (E.1): "primary / defense in
    depth / collective / structural / call site / wrap site /
    permission source / export contract." Established the rule
    that only paired invariants may cross-reference across
    layers.
  - The spec-without-enforcement rule (02_specs/README.md):
    no INV-ID appears in 02_specs/ unless its enforcement
    exists in code today. Aspirational rules live in
    docs/09_briefs/phase-2/.
  - Discipline-vs-invariant distinction (E.3): two enforcement
    sites (unique_entry_number_per_org_period UNIQUE constraint
    and journal_entry_attachments RLS policy) annotated as
    discipline backstops without INV-IDs, with the
    non-promotion rationale documented at the migration site.

  Why this entry exists: returning contributors who knew the
  project pre-restructure need a discoverable note about what
  changed and when. CLAUDE.md "When in doubt" section points
  here as the canonical "what moved where" reference.

## Phase 1.5A

- 2026-04-15 NOTE   Session start: Phase 1.5A execution begins
  against approved brief at docs/09_briefs/phase-1.5/brief.md
  (approval commit ec6cc51). Four OQs resolved inline in brief
  §15: OQ-06 (two audit rows for primary-address demotion),
  OQ-07 (read-only service functions are not
  withInvariants()-wrapped), OQ-08 (region accepts two-letter
  codes only; "British Columbia" rejected), OQ-09 (family_office
  bridges to holding_company CoA provisionally). Execution order:
  four migrations (108, 109, 110, 111) with pnpm db:reset between
  each; Zod schemas under src/shared/schemas/organization/;
  service code (orgService extension + new addressService); eight
  API routes; types regeneration; ten Category A+B tests;
  exit-criteria matrix closeout.
- 2026-04-15 WRONG  Migration 111 added source_system NOT NULL
  without DEFAULT, breaking every existing test and the seed
  script that directly inserts journal_entries rows. Phase 1.1's
  test_helpers.sql and crossOrgRlsIsolation.test.ts needed
  source_system: 'manual' added to their INSERT calls.
  journalEntryService.post() also needed source_system: parsed.source.
  dev.sql needed industry_id + business_structure added to the
  organizations INSERT. Fix was mechanical but should have been
  caught before running the existing suite — future additive
  NOT NULL columns with no DEFAULT should include a "what breaks"
  grep checklist in the brief.
- 2026-04-15 NOTE   Phase 1.5B execution session start. Brief
  approved at docs/09_briefs/phase-1.5/1.5B-brief.md. Six OQs
  resolved: OQ-01 (ownership transfer deferred), OQ-02 (token
  format {invitation_id}:{random} — O(1) PK lookup), OQ-03
  (last_login_at on sign-in only), OQ-04 (audit_log.org_id
  nullable for auth events), OQ-05 (bcryptjs, no native build),
  OQ-06 (lazy expiration at query time).
- 2026-04-15 WRONG  CA-25 test initially asserted /unique|duplicate/
  but hit the membership_owner_must_be_controller CHECK first because
  test set is_org_owner=true on an executive (not a controller).
  Fix: set role=controller first, then test the partial unique.
  Lesson: when testing a partial unique index, ensure ALL other
  constraints (CHECKs, FKs) pass first so the index is the failure
  point, not a preceding constraint.
- 2026-04-15 WRONG  listOrgUsers PostgREST embed
  memberships→user_profiles failed because PostgREST couldn't
  infer the join when both tables share user_id with multiple FK
  relationships. Fix: manual two-query join in TypeScript. This is
  a known PostgREST limitation for cross-table embeds with
  ambiguous FK paths.
- 2026-04-15 WRONG  Three bugs found in invitationService during
  closeout review. (1) Dead INSERT created a bogus 'invited'
  membership for the inviter (silently failed due to UNIQUE).
  Deleted — membership created on accept, not invite. (2) Dead
  existing-member check: two queries assigned and never read, no
  USER_ALREADY_MEMBER thrown. Replaced with admin.listUsers()
  email lookup + active membership check. (3) acceptInvitation
  audit row missing before_state despite being an UPDATE (pending
  → accepted). Added invitation as before_state. Lesson: code
  with silent-failure error handling needs special review — two
  of three bugs were hidden because errors were caught and
  swallowed, so tests passed on the happy path.
- 2026-04-15 NOTE   Phase 1.5C execution session start. Brief
  approved at docs/09_briefs/phase-1.5/1.5C-brief.md. Three
  adjustments applied during execution: (1) ACTION_NAMES runtime
  constant array derives ActionName type — parity test imports it
  instead of duplicating, (2) canUserPerformAction short-circuits
  on ctx.caller.org_ids miss before DB query, (3) CA-36 is a
  regression gate not a new test file — 11 new tests + 1 gate.
  OQ-01 (role column drop) and OQ-02 (org_invitations.role
  migration) deferred to Phase 1.6/Phase 2.
- 2026-04-15 WRONG  Migration 116 initially included user_has_permission()
  SQL helper alongside the permission catalog tables. Function body
  references memberships.role_id which doesn't exist until migration
  117. Postgres SQL-language function validation rejects column
  references at CREATE FUNCTION time. Relocated to 117. Lesson: SQL
  helper functions with cross-migration column dependencies must land
  in (or after) the migration that adds the dependency. Migration 113
  got this right by bundling the RLS helper rewrites with the
  memberships.status column addition.

## Agent Autonomy Design Sprint

- 2026-04-16 NOTE   Agent autonomy model and UI/UX architecture
  design sprint completed. Multi-round review between the founder,
  External CTO A, and External CTO B. Format: iterated CTO
  feedback converging on a shared trust model and three-path
  entry architecture. Phase 1.2 implementation work was paused
  for the duration; Phase 1.5 had completed (2026-04-16) and
  Phase 1.2 was next on deck when the sprint began.

  Substantive decisions reached:

  - Product thesis extended: "The product is not the AI. The
    product is the control surface over the AI." This sharpens
    the interface half of the thesis without changing the engine
    half. The agent is a managed actor in a trust system.
  - Trust model: Agent Ladder with three rungs (probationary /
    auto-with-notification / silent auto). Dollar-based limits
    modeled on real accounting role delegation (AP-specialist
    limit analogy). Schema-enforced hard ceilings for
    transaction classes that can never auto-post regardless of
    rung: intercompany, period-end adjustments, equity,
    reversals, locked periods, first-time vendors above a floor.
  - Confidence scores are a policy input, not a UI hint. Raw
    confidence is never displayed to users — only the policy
    outcome with a legible reason.
  - One voice to the user, many tools under the hood. No
    user-facing sub-agent hierarchy; internal orchestration
    stays internal.
  - Three-path entry (Mainframe / chat / command palette)
    unified by a canonical Intent Schema. No path grows bespoke
    routing.
  - ProposedMutation is the canonical object for every
    ledger-touching change. Every confirmation surface renders
    from one; every audit record stores one.
  - Canvas ↔ chat relationship: canvas state flows into chat as
    context every turn, but canvas navigation history and chat
    transcript remain separate timelines. Phase 1.2
    canvas_context_injection work is the inbound side; this
    sprint confirmed the model.
  - Ghost Rows visual contract: four independent signals (italic
    + muted + left-stripe + "Draft" pill). Schema excludes from
    exports and reports.
  - Logic Receipts as the immutable audit artifact. No raw LLM
    reasoning stored or displayed, ever.

  What follows: this capture phase (Phase A) registers four new
  open questions (Q23–Q26) in open_questions.md and records this
  friction-journal entry. A follow-on documentation sprint
  (Phase B) will draft three new specs in docs/02_specs/
  (agent_autonomy_model.md, intent_model.md,
  mutation_lifecycle.md), extend docs/03_architecture/
  ui_architecture.md, create docs/03_architecture/
  agent_architecture.md, draft ADR-002 through ADR-006, and stub
  nine Phase 2 briefs under docs/09_briefs/phase-2/. Phase 1.2
  implementation is unblocked when the Phase B specs land.
- 2026-04-16 NOTE   Agent Autonomy Design Sprint documentation
  complete. Four-phase sprint delivered: Phase A (1 friction
  entry, 4 open questions Q23–Q26), Phase B (3 new specs, 1
  extension, 1 new architecture doc — ~1,739 lines), Phase C
  (5 new ADRs 0002–0006 — ~998 lines), Phase D (9 Phase 2
  brief stubs, 4 index updates, final cross-reference sweep).
  Spec-without-enforcement discipline held end-to-end:
  invariants.md still shows 17 Phase 1.1 invariants; no new
  INV-IDs registered. Phase 1.2 implementation is unblocked.
  The Phase 1.2 brief will be reconciled against ADR-0002
  (confidence display superseded) during execution.
- 2026-04-16 NOTE   Phase 1.2 execution brief writing session
  started. Starting model: Claude Sonnet (claude-sonnet-4-20250514).
  All Q11–Q17 and Q23–Q26 defaults accepted by founder. Scope
  decisions A–G locked. Design-sprint artifacts (Phases A–D)
  committed at 4ccc48d. Phase 1.5 complete; 162 tests green.
- 2026-04-16 WRONG  Product vision doc did not receive the thesis
  extension during the A–D sprint. The "control surface" reframe
  landed in agent_autonomy_model.md §2 and the friction journal
  but not in docs/00_product/product_vision.md where the quotable
  one-line thesis statement lives. Fix: product_vision.md Thesis
  section extended with a ### Thesis extension — the control
  surface subsection; Source line updated with sprint provenance.
  Lesson: when a thesis extension lands in specs, the vision doc
  is where the quotable one-liner belongs — specs extend the
  reasoning, the vision carries the quotable line.
- 2026-04-16 NOTE   Phase 1.2 brief patch session — closing 9
  review gaps identified during founder review. Gaps cover:
  orchestrator retry message structure, tool input schemas,
  structured-response enforcement mechanism, agent_sessions RLS,
  onboarding state machine, confirm payload source, ActionName
  verification, dry_run scope, Four Questions template mapping.
- 2026-04-16 NOTE   Phase 1.2 brief patch session complete. Nine
  gaps closed:
  Gap 1 (§5.2): orchestrator retry message shape (tool_result with
  is_error:true + Zod errors), session loading precedence (3-step),
  conversation truncation (full history, no window in 1.2).
  Gap 2 (§6.1): tool input schemas — each tool now has a cited Zod
  schema or inline definition + typed rejection branches.
  Gap 3 (§6.2): respondToUser tool as 10th tool — tool-based
  structured-response enforcement. Tool count 9→10.
  Gap 4 (§9.4): agent_sessions RLS verified — SELECT-only policy
  exists from migration 001. No changes needed in 118.
  Gap 5 (§11.5): onboarding state machine — OnboardingState shape
  in agent_sessions.state, resume behavior, invited-user detection,
  completion trigger.
  Gap 6 (§13.3): confirm payload source — reads ai_actions.tool_input
  (verified column name). No session_id in request body.
  Gap 7 (§16): user.profile.update ActionName missing — added as new
  required ActionName for all three roles.
  Gap 8 (§6.5): dry_run scope — ledger-mutating tools only. ADR-0007
  pending. updateUserProfile/createOrganization/updateOrgProfile
  exempt.
  Gap 9 (§10.3): Four Questions template_id mapping — 6 template IDs
  for ProposedEntryCard rendering, i18n-required in all 3 locales.
  Brief grew from 1037 to 1364 lines. No new gaps discovered.
- 2026-04-18 NOTE   Phase 1.2 Session 1 sub-brief drafting session
  started. Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]).
  Master brief frozen at SHA aae547a. Session 1 scope: schema +
  deps + types housekeeping only — migrations 118 (agent_session
  wiring + user.profile.update permission seed) and 119 (journal
  entry form fixes placeholder), two new dependencies
  (@anthropic-ai/sdk, zod-to-json-schema), one new ActionName,
  ProposedEntryCard type migration per ADR-0002, types.ts regen.
  No Anthropic API calls, no agent code, no new tests. Founder
  pre-resolved the permission-pattern question: 1.5C adds
  ActionNames via migration (not seed) with CA-27 parity test
  enforcement. Session 1 folds the permission seed into migration
  118 matching the 1.5C precedent (migration 116 combined schema
  + initial catalog).
- 2026-04-18 NOTE   Phase 1.2 Session 1 sub-brief drafting session
  complete. Artifacts: (1) session-1-brief.md (443 lines, within
  the 250–450 target), (2) CURRENT_STATE.md updated to note
  Session 1 ready to execute and Phase 1.2 decomposed into ~8
  sessions, (3) this entry. Two discoveries surfaced during
  drafting that extended the founder prompt's scope:
  (a) CA-28 (permissionCatalogSeed.test.ts) hardcodes the
  catalog to 16 permissions and specific 3-item role lists — it
  breaks when user.profile.update is added, even though CA-27
  (permissionParity.test.ts) is dynamic and passes automatically.
  Sub-brief Work Item 5.4(b) now covers updating four CA-28
  assertions (16→17 total, controller 16→17, ap_specialist list
  3→4, executive list 3→4). This is not "adding tests" — it is
  maintaining the parity invariant CA-28 encodes.
  (b) role_permissions uses (role_id, permission_key) as its
  composite PK, not a permission_id FK. The founder prompt's
  S1-6 verification SQL had permission_id; corrected to
  permission_key in the sub-brief. Ordering note: commits 2 and
  3 are coupled — intermediate state (DB has 17 permissions,
  ACTION_NAMES has 16, CA-28 expects 16) fails tests, so the
  two commits must land together in the same push. Flagged
  explicitly in §10 commit plan.
- 2026-04-18 NOTE   Phase 1.2 Session 1 execution session —
  starting. Starting SHA: 4a62faf. Starting model: Claude Opus
  4.7 (claude-opus-4-7[1m]). Completion target: all 12 S1 exit
  criteria (S1-1 through S1-12) pass after the four-commit
  cadence defined in sub-brief §10. Sub-brief at
  docs/09_briefs/phase-1.2/session-1-brief.md is the spec; this
  session produces code, migrations, and test edits. Master
  brief frozen at aae547a.
- 2026-04-18 WRONG  Session 1 sub-brief §5.4(b) named CA-28 as
  the only test needing count updates, but CA-37 in
  crossOrgRlsIsolation.test.ts also hardcodes permissions and
  role_permissions counts (16→17 permissions, 22→25 role grants
  — same invariant as CA-28, tested through the RLS surface
  rather than the admin surface). Caught correctly by the full
  pnpm test step at commit 4, not by the commit-2 verification
  (which only ran CA-27 and CA-28 explicitly). WSL Claude
  stopped and flagged per sub-brief §7 rather than powering
  through; founder chose Option 1 (amend commit 3 to cover both
  CA-28 and CA-37). Amended commit: 9894603 → 3b034b8.
  Lesson for Session 2+ sub-brief drafting: when a migration
  changes permissions or role_permissions row counts, the
  sub-brief must include a grep verification step:
  `grep -rn 'toHaveLength\|toBe' tests/ | grep -E 'permissions|role_permissions'`.
  This is a zero-cost check that catches the full set of
  catalog-count dependencies, not just the ones the sub-brief
  author happened to remember. Candidate for a conventions.md
  addition under "Phase 1.5A Conventions / Permission Keys" so
  every future drafter sees it.
- 2026-04-18 NOTE   Kong gateway / auth container ordering quirk
  surfaced during Session 1 execution. After pnpm db:reset
  (which restarts db, auth, storage, realtime containers) Kong
  was not refreshing its upstream resolution to the restarted
  auth container — the admin auth API calls for seed user
  creation returned "An invalid response was received from the
  upstream server" via the gateway even though the auth
  container logs showed it was healthy and serving requests on
  port 9999. Workaround: `docker restart supabase_kong_chounting`
  before running `pnpm db:seed:all`. The symptom appeared only
  after the second back-to-back db:reset in a single session
  (commit 4's db:reset; commit 2's earlier db:reset was followed
  only by targeted CA-27/CA-28 tests, which don't hit auth).
  The first baseline `pnpm test` (pre-commit-1) passed because
  the DB was pre-seeded from the prior session. Worth preserving
  as a workflow note: after every `pnpm db:reset`, run
  `docker restart supabase_kong_chounting && sleep 3 && pnpm db:seed:all`
  — or, preferably, a `pnpm db:reset:clean` script that folds
  the Kong refresh + seed into one command. The underlying
  cause is not investigated here; likely Kong DNS caching or
  upstream health-check interval. Phase 2 DevEx work.
- 2026-04-18 NOTE   Phase 1.2 Session 1 execution complete. All
  12 S1 exit criteria pass. 4 commits on top of 4a62faf:
  44ecb4f (deps), 21169ea (migration 118 + types regen),
  3b034b8 (ACTION_NAMES + CA-28 + CA-37 parity — amended from
  9894603 after the CA-37 gap was flagged), and commit 4 (this
  commit: migration 119 + ProposedEntryCard type + shim +
  friction journal entries). Pinned versions:
  @anthropic-ai/sdk 0.90.0, zod-to-json-schema 3.25.2. Starting
  model: Claude Opus 4.7 (claude-opus-4-7[1m]) — unchanged
  throughout. Full regression: 36 test files, 162 tests, 0
  failures. Master brief still frozen at aae547a. No new open
  questions beyond the CA-37 sub-brief-drafting-workflow note
  above. Session decomposition discipline held: no Session 2+
  scope leaked in.
- 2026-04-18 NOTE   Phase 1.2 Session 2 sub-brief drafting session
  started. Starting SHA: 82247cb. Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief still frozen at aae547a;
  Session 1 complete. Session 2 scope: orchestrator skeleton + 10
  tool schemas + respondToUser enforcement + mocked callClaude
  with deterministic Anthropic Messages fixtures, all against
  pure TypeScript (no Next.js route wiring yet, no real API
  calls). Two founder-confirmed observations to codify during
  drafting: (1) mock fixture shapes must be typed literals citing
  the SDK type so Session 4's real-API swap is mechanical;
  (2) trace_id propagation gets a dedicated work item + CA-47
  test covering log output + service-layer-via-tool-path +
  ai_actions.trace_id as the three assertable surfaces.
- 2026-04-18 NOTE   Phase 1.2 Session 2 sub-brief drafting session
  complete. Artifacts: (1) session-2-brief.md (642 lines, within
  the 400–650 target after two compression passes — the first
  draft came in at 733, trimmed by compressing §5.2 schema
  blocks into a table + single-line Zod citations for the six
  new schemas, compressing §5.3 type block to cite master §5.1,
  and compressing §5.4 callClaude body from a full code block to
  signature + queue-pattern description); (2) CURRENT_STATE.md
  updated noting Session 1 complete + Session 2 ready;
  (3) this entry. Four SDK-type observations worth preserving
  from the required-reading pass on
  node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts
  (v0.90.0): Message has a required container field (Container |
  null) that must be present in fixture literals; ToolUseBlock
  has a required caller field (DirectCaller | ServerToolCaller |
  ServerToolCaller20260120) that fixtures set to
  { type: 'direct' }; Usage has many required fields (cache_*,
  inference_geo, server_tool_use, service_tier) that fixtures
  either populate or null-fill via the shared makeMessage helper;
  the return type is Anthropic.Messages.Message (not a simplified
  wrapper), which is load-bearing for Session 4's mechanical
  swap. These are captured in sub-brief §5.4 fixture guidance.
  No new open questions surfaced during drafting. No master-brief
  inconsistencies found. Session 2 is unambiguous enough that
  execution should hit the same zero-drift discipline as Session
  1 with no stop-and-flag moments — though that will only be
  known post-execution.
- 2026-04-18 NOTE   Phase 1.2 Session 2 execution session —
  starting. Starting SHA: fc306c5 (the Session 2 readiness
  commit). Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]).
  Completion target: all 15 S2 exit criteria (S2-1 through S2-15)
  pass after the four-commit cadence defined in sub-brief §10.
  Two founder pre-decisions: canvasDirectiveSchema lands at
  src/shared/schemas/canvas/canvasDirective.schema.ts (new
  subfolder); toolsForPersona avoids raw count comments.
  Sub-brief at docs/09_briefs/phase-1.2/session-2-brief.md is
  the spec; this session writes real agent code against the
  mocked Anthropic client. Master brief frozen at aae547a.
- 2026-04-18 WRONG  Discovered during commit 3 pre-execution
  reading: the PostJournalEntryInputSchema and
  ReversalInputSchema carry four .refine() blocks (two per
  schema) that reject source='agent' and dry_run=true with
  messages "not implemented in Phase 1.1.". These are Phase 1.1
  placeholder guards with a self-documenting comment at
  lines 86–93 of journalEntry.schema.ts noting their intended
  removal in Phase 1.2. The sub-brief §5.2 cited both schemas
  as "verbatim, no new Zod" which was incomplete — it didn't
  flag that the existing schemas gate the exact inputs Session
  2 feeds through Fixture C and CA-47's postJournalEntry
  dry-run path. WSL Claude stopped and flagged per Session 1
  precedent rather than powering through; founder chose
  Option 3 (fold into commit 4 alongside the tests). Commit 4
  removes the four .refine() blocks and inverts the two unit
  tests in journalEntrySchema.test.ts (agent-source rejection
  → "accepts agent source with idempotency_key" +
  "rejects agent source without idempotency_key";
  dry_run rejection → "accepts dry_run: true"). The sibling
  idempotencyRefinement now becomes runtime-reachable as the
  file's own comment predicted, bidirectionally paired with
  the database CHECK constraint idempotency_required_for_agent
  from migration 001. Lesson for Session 3+ sub-brief drafting:
  when a sub-brief cites an existing Zod schema, the drafter
  must grep the schema file for .refine() clauses whose message
  text contains "Phase 1" or "not implemented" or similar
  self-referential placeholders. These are pending migrations
  the cited schema still carries. Candidate for a
  conventions.md addition alongside the Permission Catalog
  Count Drift convention from Session 1 (suggested section
  name: "Cited-Code Verification" or "Inherited-Assumption
  Checks") — holding off on the commit until Session 2
  close-out to batch with any further lessons.
- 2026-04-18 NOTE   Phase 1.2 Session 3 sub-brief drafting session
  started. Starting SHA: d20c767. Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a; Sessions 1
  and 2 complete with 178/178 regression baseline. Session 3 scope:
  system prompts (three persona prompts + locale/canvas/onboarding
  suffixes), buildSystemPrompt composition helper, and i18n template
  additions to messages/{en,fr-CA,zh-Hant}.json covering every
  template_id already referenced by Session 2's fixtures and the
  orchestrator's fallback paths, plus the Four Questions keys from
  master §10.3. Pure strings + a string-composition function + JSON
  additions — no new logic, no new tools, no real API calls. Four
  founder pre-decisions to codify: (1) buildSystemPrompt signature
  Option B (deferred-extensible OrgContext stub); (2) locale is a
  live parameter now; (3) canvas suffix covers only the current
  CanvasDirective union members (no Session 6 speculation);
  (4) onboarding suffix instructs Claude without encoding the
  Session 5 state machine. Cited-Code Verification is a live
  convention now — this is its first use outside the retrospective
  lesson where it was coined.
- 2026-04-18 WRONG  Drafting discovery 1: master §7 is a six-section
  structural skeleton, not fully verbatim prompt text. Verbatim
  content: §6.3 anti-hallucination rules, §7 section 4
  (structured-response contract line), §7 section 5 (voice rules),
  §7.1 onboarding suffix, §7 section 6 canvas suffix (via
  canvas_context_injection.md). Not verbatim (must be
  session-authored): the Identity block (parameterized by orgName,
  persona, user display_name at runtime) and the Available-tools
  enumeration (generated from toolsForPersona output). Stopped
  and flagged per drafting prompt's "STOP before making up
  content" rule. Founder chose Option 2 (§7 is sufficient as
  skeleton + citation chain; Session 3 authors the Identity block
  templates and assembly glue with a commit-2 review gate). Master
  brief stays frozen at aae547a. Sub-brief §6.1 documents each
  section of each persona prompt with an explicit source-citation
  table distinguishing verbatim-cited from session-authored. This
  distinction — "verbatim" vs "skeleton + upstream" — is a class
  of drafter oversight not yet codified in conventions.md.
  Candidate for a future convention addition after a third
  datapoint surfaces.
- 2026-04-18 WRONG  Drafting discovery 2: spec divergence between
  master §6.2 item 5 (line 483–487) and Session 2's shipped
  orchestrator. Master specifies that on structural-retry
  exhaustion the orchestrator "surfaces a generic error template:
  { template_id: 'agent.error.structured_response_missing',
  params: {} } and logs AGENT_STRUCTURED_RESPONSE_INVALID." Session
  2's orchestrator throws new ServiceError instead of returning
  the template response. CA-43 locked in the divergence by
  asserting the throw. The agent.error.structured_response_missing
  template_id is referenced by master but never actually produced
  by the running code. Flagged during the Cited-Code Verification
  grep for locale additions. Founder chose Option 1 (fix + add
  template_id to locales + invert CA-43). The fix is ~8 lines in
  src/agent/orchestrator/index.ts (throw block becomes a
  persistSession + return-template block); log line is preserved.
  Folded into Session 3's commit 2 (orchestrator wire-up commit).
  This is a subtler cousin of the Cited-Code Verification lesson:
  "sub-brief touched code that diverged from spec; existing tests
  locked in the divergence; grep of message text against spec
  catches it." Not yet codifying as a convention — batching
  pattern until a third datapoint surfaces ("Shipped-Code-to-Spec
  Verification" is the working name).
- 2026-04-18 NOTE   Drafting observation (not blocking Session 3):
  master §21's CA-* test catalog drifted from Session 2's actual
  shipped tests. §21 lists CA-39 as agentIdempotency.test.ts,
  CA-40 as agentToolRetry.test.ts, etc. — completely different
  scopes and names than Session 2 shipped (agentOrchestratorHappyPath
  through agentTracePropagation). This affects Session 8's exit-
  criteria verification because §21 maps CA-* to EC-*. Founder has
  noted this for Session 8 planning; explicitly out-of-scope for
  Session 3. Expected resolution: a master brief patch session
  before Session 8 kicks off, reconciling §21 with the actual
  shipped names.
- 2026-04-18 NOTE   Phase 1.2 Session 3 sub-brief drafting session
  complete. Artifacts: (1) session-3-brief.md (503 lines, within
  300–550 target); (2) CURRENT_STATE.md updated noting Session 2
  complete + Session 3 ready; (3) this entry + the two WRONG
  entries above. Five founder pre-decisions codified in sub-brief
  §4 (four original + Pre-decision 5 added after discovery 1
  resolution). Cited-Code Verification grep confirmed four
  fixture/orchestrator template_ids, not five — the founder's
  fifth (agent.error.structured_response_missing) was not grep-
  surfaced because Session 2's orchestrator throws rather than
  returning it; resolved via §6.7 fix. Twelve total template_ids
  enumerated in §6.5 for locale additions (five agent.* + seven
  proposed_entry.*). No other open questions surfaced.
- 2026-04-18 NOTE   Phase 1.2 Session 3 execution session —
  starting. Starting SHA: 1562d3c (Session 3 readiness anchor).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Completion
  target: all 10 S3 exit criteria (S3-1 through S3-10) pass after
  the four-commit cadence in sub-brief §11. Commit 2 has a
  founder review gate for Session-3-authored prose (three Identity
  block templates + three locale directive strings + any authored
  canvas suffix prose). Two founder pre-decisions resolved during
  review: (a) canvas_context_injection.md carries a verbatim
  framing block; Session 3 translates Handlebars to TS template-
  literal conditionals in commit 1; (b) CA-51 is a fresh test
  at tests/unit/i18nLocaleParity.test.ts. Sub-brief at
  docs/09_briefs/phase-1.2/session-3-brief.md is the spec.
  Master brief frozen at aae547a.
- 2026-04-18 NOTE   Session 3 commit 2 introduced two internal
  helper modules under src/agent/prompts/personas/:
  _sharedSections.ts (verbatim master-cited content: §6.3 rules,
  §7 structured-response contract, §7 voice rules — extracted to
  prevent drift across the three persona files) and
  _identityAndTools.ts (identity-block template + tools
  enumeration helper used by all three personas). Underscore
  prefix marks them internal-only. Not named in sub-brief §10
  stop-points file list but sound refactor — three persona
  files (controller.ts, ap_specialist.ts, executive.ts) still
  exist with the expected PersonaPrompt exports (S3-1 passes)
  and no duplicated prose. DRY factor prevents master §6.3
  drift across files. Pattern worth preserving for Session 4+:
  executor may introduce internal-only helper modules when the
  sub-brief's named public exports are preserved and the
  relevant S3-* criteria still pass.
- 2026-04-18 NOTE   Commit-2 founder review gate produced one
  polish request: drop UUIDs (org_id, user_id) from the identity
  block. UUIDs are token tax for Claude with zero reasoning
  benefit — trace_id handles human-readable correlation in logs.
  Applied: userLabel simplified to `input.user.display_name ??
  'the user'`; normal-branch parenthetical `(org id: ${orgId})`
  removed; onboarding branch's trailing "The user is ..."
  sentence dropped since it read awkwardly without a display
  name. Candidate lesson for the batched-conventions catalog:
  "prompt content is for Claude's reasoning, not audit trail —
  keep UUIDs out unless the model needs them to call a tool."
- 2026-04-18 NOTE   Phase 1.2 Session 4 sub-brief drafting session
  started. Starting SHA: 6cdba6e. Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a; Sessions
  1–3 complete, regression baseline 191/191. Session 4 scope: the
  first paid-API session — real Anthropic client swap,
  OrgContextManager full implementation per master §8, two new
  API routes (/api/agent/{message,confirm}), confirm-route state
  machine with idempotency protection (master §13.3), four new
  audit_log.action values, executeTool dispatch for all remaining
  tool stubs, real-API error classification. Mandatory Cited-Code
  Verification grep surfaced 8 Session 4 forward-pointers in
  src/agent/* (checklist for §5 work items) and one drift
  candidate: journalEntryService.ts:16-17 header comment says
  "Agent source (dry_run, idempotency) deferred to Phase 1.2 —
  rejected" but Session 2's refine removal made the agent path
  accepted. Header comment drifted from code. Small fix, worth
  capturing as a Session 4 housekeeping item (single-line comment
  update). Also noted: canvasDirectiveSchema's
  ProposedEntryCardSchema placeholder TODO tags Session 7, not
  Session 4 — drafting prompt's mention was slightly off.
- 2026-04-18 NOTE   Phase 1.2 Session 4 sub-brief drafting session
  complete. Artifacts: (1) session-4-brief.md (654 lines, within
  500–750 target); (2) CURRENT_STATE.md updated noting Session 3
  complete + Session 4 ready; (3) this entry. Five founder
  pre-decisions codified in sub-brief §4: (1) OrgContext
  injection prose uses names not UUIDs — carries Session 3's
  commit-2 lesson forward verbatim; (2) error classification is
  a dedicated work item with per-class ServiceError mapping and
  retry behavior (401/429/5xx/network/malformed); (3)
  /api/agent/confirm implements the full state machine from
  master §13.3 with an added defensive fifth branch for reserved
  future statuses; (4) paid API minimized to one smoke test
  (CA-66) that skips when ANTHROPIC_API_KEY unset;
  (5) ANTHROPIC_API_KEY provisioning is a founder prerequisite,
  not an executor action. Eleven work items enumerated
  (§6.1–§6.11) covering OrgContextManager + injection prose +
  real callClaude + error classification + executeTool dispatch
  + two routes + four audit writes + serviceErrorToStatus +
  journalEntryService header-comment drift fix (discovered
  during drafting grep) + mandatory pre-execution grep. 16 S4
  exit criteria + 14 new CA tests (CA-53–66). Six-commit plan
  with commit-2 founder review gate. Two observations worth
  preserving for the batched-conventions catalog: (a) the
  drift-candidate fix in §6.10 is a new sub-pattern — "stale-
  file-header drift caught by the Cited-Code Verification grep,"
  candidate extension to Cited-Code Verification saying the
  grep catches source-provenance drift not just refine guards;
  one datapoint only, not codifying. (b) the confirm-route's
  fifth branch (defensive catch-all for unexpected statuses) is
  session-authored glue, not a master-brief divergence — worth
  noting that master specifications sometimes enumerate only
  expected branches and session authorship adds defensive
  catch-alls without unfreezing master.
- 2026-04-18 NOTE   Phase 1.2 Session 3 execution complete. All
  10 S3 exit criteria pass. 4 commits on top of 1562d3c:
  98791f8 (persona prompts + suffixes + OrgContext stub),
  1f4d8cf (buildSystemPrompt + orchestrator wire-up +
  structural-retry surface fix + CA-43 inversion — commit-2
  founder review gate produced one polish before landing),
  5e05d91 (12 locale keys × 3 files), and commit 4 (this
  commit: CA-48 through CA-52 tests). Starting model: Claude
  Opus 4.7 — unchanged throughout. Full regression: 50 test
  files, 191 tests, 0 failures (178 baseline + 13 new its
  across 5 new CA files; CA-49, CA-50, CA-51, CA-52 each have
  multiple it-blocks covering main path + negative cases, which
  the execution prompt explicitly permitted). Master brief
  still frozen at aae547a. Three lessons worth preserving for
  the batched-conventions catalog (all candidates, none codified
  yet): (1) "verbatim vs skeleton+upstream" from drafting
  discovery 1; (2) "Shipped-Code-to-Spec Verification" from
  drafting discovery 2; (3) "UUIDs out of prompts" from
  commit-2 polish + (4) the "internal-helper refactor deserves
  friction-journal NOTE" pattern observed during commit-2
  review. Batching until a third datapoint surfaces per
  founder discipline. Session decomposition discipline held:
  no Session 4+ scope leaked in (no OrgContextManager logic,
  no API routes, no real Anthropic client).
- (earlier entry preserved below)
- 2026-04-18 NOTE   Phase 1.2 Session 2 execution complete. All
  15 S2 exit criteria pass. 4 commits on top of fc306c5:
  0bee609 (ServiceError codes + 10 tool schemas +
  canvasDirectiveSchema), ea2f09e (orchestrator skeleton +
  mocked callClaude + fixtures + test factory), 3539223
  (persona whitelist + session load/create + trace_id
  propagation), and commit 4 (this commit: Phase 1.1 agent-path
  guard removal + unit test inversions + CA-39 through CA-47
  integration tests + friction journal close-out). Starting
  model: Claude Opus 4.7 — unchanged throughout. Full
  regression: 45 test files, 178 tests, 0 failures (162
  baseline + 16 new: 9 CA-* files contributing 15 it-blocks +
  1 net from unit test inversion). Master brief still frozen
  at aae547a. Two discoveries worth preserving for future
  sessions: (1) the Phase 1.1 guard-removal sub-brief gap
  captured above — a new class of drafter oversight alongside
  CA-37-style count-drift gaps; (2) the Map key-type narrowing
  around tool-name lookups (orchestrator/index.ts line 141 in
  the first draft failed typecheck because `as const` on
  `.name` narrowed the Map key to literal tool names while
  Anthropic's ToolUseBlock.name is just string; fixed with
  `Map<string, (typeof tools)[number]>`). Session
  decomposition discipline held: no Session 3+ scope leaked
  in. No new open questions beyond the sub-brief-drafting
  lesson above.
- 2026-04-18 NOTE   Phase 1.2 Session 4 execution session —
  starting. Starting SHA: ec86a63 (Session 4 readiness anchor,
  matches sub-brief freeze). Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a.
  Completion target: all 16 S4 exit criteria (S4-1 through
  S4-16) pass after the six-commit cadence in sub-brief §11.
  Commit 2 has a founder review gate for the OrgContext
  injection prose authored against master §8 + Pre-decision 1
  (names not UUIDs). ANTHROPIC_API_KEY: present in .env.local
  (108 chars, sk-ant- prefix) — CA-66 will run the real-API
  smoke test, not skip. Sub-brief at
  docs/09_briefs/phase-1.2/session-4-brief.md is the spec.
  Six execution-prompt clarifications extend the sub-brief
  (A–F) based on a fresh-pass re-read that surfaced two
  concrete gaps and a pre-existing caveat:

  - Clarification A — explicit import-retarget list for §6.1
    (5 files importing OrgContext from the Session 3 stub
    location, verified by pre-drafting grep).
  - Clarification B — CA-54 uses BOTH positive (org_name,
    industry_display_name, functional_currency, controller
    display_name substrings) and negative (zero v4 UUID regex
    hits) assertions.
  - Clarification C — CA-66 failure interpretation: pass /
    skip-unset / fail-with-AGENT_UNAVAILABLE are three
    distinct outcomes, only the first two are Session 4
    pass-states and the third is key-side not code-side.
  - Clarification D — null-org audit emission uniform skip
    rule. §6.8 specifies four agent.* audit emits but three of
    them (session_created, message_processed, tool_executed)
    fire in contexts where session.org_id can be null during
    onboarding per master §9.1. audit_log.org_id is uuid NOT
    NULL (initial schema line 486, unchanged by migration 118).
    recordMutation's AuditEntry.org_id is a required string.
    Uniform rule: skip the emit when session.org_id is null,
    wrapped in try/catch that logs but does not rethrow (per
    Clarification F). Provenance recovered on first
    session_org_switched when user creates their first org.
  - Clarification E — org-switch detection logic + transition
    matrix + CA-65 expansion + test ripple. §6.8 row 4
    described the trigger parenthetically but not the code;
    branch-2 filter silently misses org-switch today. New
    detection query before branch 3 INSERT. loadOrCreateSession
    signature extends to (input, ctx, log). Ripple: 6 existing
    test call sites (CA-45 × 4, CA-46 × 2) need ctx threaded
    via makeTestContext at describe scope. Commit 4 ordering:
    signature + test ripple FIRST (typecheck), then executeTool
    dispatch, then audit emits, then §6.10 housekeeping.
    CA-65 grows to two it-blocks in one file (org_A→org_B and
    null→org_X).
  - Clarification F — tx-atomicity caveat (non-blocking).
    recordMutation's header asserts same-transaction-as-mutation
    per INV-AUDIT-001 but Session 4's three new emit sites
    (loadOrCreateSession, handleUserMessage, executeTool) are
    not inside a transaction. Pre-existing architectural gap
    inherited from master §16. Session 4 applies try/catch
    mitigation only; Phase 2 events-table migration restores
    tx-atomicity. Session close adds one paragraph to the
    closeout entry naming the gap.

  Brainstorming/pressure-test cycle before this prompt: fresh-
  pass caught the null-org NOT NULL conflict (Clarification D);
  WSL Claude's pressure test tightened per-tool matrix → uniform
  skip rule and surfaced the tx-atomicity caveat; founder added
  the try/catch mitigation and caught the 6-call-site test
  ripple before Commit 4. Four improvements from two reviewers
  over three cycles. Stopping point judged correct — diminishing
  returns beyond this.
- 2026-04-18 WRONG  Session 4 commit 1 pre-check surfaced a
  material correction to Clarification D's premise. The
  Clarification cited audit_log.org_id as uuid NOT NULL
  (20240101000000_initial_schema.sql:486) but migration 113
  (20240113000000_extend_memberships.sql:137, Phase 1.5B,
  2026-04-15) altered that column via ALTER TABLE audit_log
  ALTER COLUMN org_id DROP NOT NULL. The constraint has been
  gone for three days. Both the fresh-pass re-read and the
  pressure test missed the migration. Corroborating evidence:
  userProfileService.updateProfile:115 writes
  org_id: undefined as unknown as string for user.profile_updated
  audit rows — a type cast that only works at runtime because
  the DB column is nullable. CA-15 (userProfileAudit.test.ts)
  already passes in the 191/191 baseline, confirming nullable
  writes work end-to-end. Implications: Clarification D's skip
  rule is no-op-safe rather than load-bearing; AuditEntry.org_id
  type is stale (string, should be string | null); Session 4
  could emit agent.* events during onboarding with null org_id
  for richer audit coverage. Chose Option A (ship per
  Clarification D verbatim; defer type cleanup to a dedicated
  session). Rationale: Option C's drive-by type fix would ripple
  to every mutating service function in the codebase and deserves
  its own review cycle. Skip rule is behaviorally safe either way
  and has been reviewed + approved. Candidate for a future
  convention catalog entry (sixth staged): "When a DB column's
  NOT NULL constraint is altered by a later migration, the
  TypeScript type at the insert boundary must also be updated —
  verify migration lineage, not just the initial schema." Also
  noted during pre-check: CA-45 has 6 loadOrCreateSession calls
  (4 it-blocks) and CA-46 has 3 calls (2 it-blocks) — 9 total,
  not the "6" stated in Clarification E's test-ripple section.
  The approach (threading ctx via makeTestContext at describe
  scope) is unchanged; only the expected-count number for the
  pre-commit-4 grep shifts from 7 to 10.
- 2026-04-18 NOTE   Session 4 commit 2 required a mid-commit
  query rewrite. Sub-brief §6.1 specified loadOrgContext as joining
  memberships → user_profiles via PostgREST embedding to fetch
  controller display names. First test run surfaced a PostgREST
  error: "Could not find a relationship between 'memberships'
  and 'user_id' in the schema cache." Root cause: memberships
  and user_profiles both reference auth.users as parallel FKs,
  and PostgREST only embeds through direct FKs between the two
  tables. Rewrote as two sequential queries (find controller
  user_ids from memberships filtered to role=controller +
  status=active, then batch lookup user_profiles via .in()).
  Behaviorally identical, same master §8 return shape. Flagged
  during commit-2 review gate and approved. Candidate for a
  sixth future-convention datapoint: "When a sub-brief specifies
  a query shape that turns out to be infeasible due to schema/
  tool constraints (PostgREST FK embedding, Supabase join
  limits, etc.), execution rewrites and flags in the review
  gate." One datapoint; not codifying.
- 2026-04-18 NOTE   Phase 1.2 Session 4 execution complete. All
  16 S4 exit criteria pass. 6 commits on top of ec86a63:
  e774577 (OrgContextManager full shape + stub retirement),
  96b904b (OrgContext injection prose + buildSystemPrompt wiring
  — commit-2 founder review gate produced one polish: bold
  removed from org_name in prose), 34c8fe3 (real Anthropic
  client + error classification), b4585bb (executeTool dispatch
  + audit emits + journalEntryService header fix), f288da2
  (/api/agent/{message,confirm} routes + serviceErrorToStatus),
  da4641e (CA-53 through CA-66 tests). Starting model: Claude
  Opus 4.7 — unchanged throughout. Full regression: 60 test
  files, 209 tests, 0 failures (191 baseline + 18 new it-blocks
  across 10 new CA-* files: CA-53 × 2, CA-54 × 1, CA-55–59 × 6
  in one file, CA-60 × 2, CA-61–63 × 3, CA-64 × 1, CA-65 × 2,
  CA-66 × 1). Master brief still frozen at aae547a. Sub-brief
  still frozen at ec86a63. ANTHROPIC_API_KEY present — CA-66
  ran against real Claude and passed (one paid API call).

  Clarification F tx-atomicity paragraph (session-close
  obligation): recordMutation's header asserts same-transaction-
  as-mutation per INV-AUDIT-001, but Session 4's three new
  agent.* emit sites (loadOrCreateSession branch 3,
  handleUserMessage's three return points, executeTool's
  finally block) are not inside a service transaction —
  adminClient issues statement-by-statement REST calls, so
  the session INSERT / message persist / tool execution and
  their audit rows are not atomic. This is pre-existing at the
  architectural level (master §16 specifies the emits; the
  current orchestrator has no tx wrapper). Session 4 applied
  try/catch mitigation only — audit failures log but do not
  throw, preventing a DB audit error from poisoning user-facing
  requests. Phase 2's events-table migration (INV-LEDGER-003)
  restores tx-atomicity by making events the Layer 3 truth
  written inside the mutation transaction. No ADR needed for
  this gap; it's tied to the pending phase evolution that the
  recordMutation.ts header comment and the events table's
  "reserved seat" comment both reference.

  Execution-time finds worth preserving:

  (1) Migration 113 pre-check discovery — captured in the
  WRONG entry above. audit_log.org_id has been nullable since
  Phase 1.5B (2026-04-15), which means Clarification D's skip
  rule is no-op-safe rather than load-bearing. Option A shipped.

  (2) PostgREST FK embedding rewrite (commit 2) — captured in
  the NOTE entry above.

  (3) journalEntryService.post missing idempotency_key column
  write. The DB CHECK idempotency_required_for_agent (CLAUDE.md
  Rule 6) requires idempotency_key when source='agent', but the
  service's INSERT omitted the column. CA-61 (pending → confirmed)
  surfaced this as POST_FAILED: "violates check constraint
  idempotency_required_for_agent." One-line fix added mid-commit-6:
  `idempotency_key: parsed.idempotency_key ?? null` in the
  journal_entries INSERT. Pre-existing bug — Session 4 is the
  first session to exercise source='agent' end-to-end through
  the service layer. Candidate for a future-convention
  datapoint: "Every DB CHECK constraint that gates a field
  must be matched by an explicit INSERT column write in the
  owning service; absence surfaces only at runtime when a new
  source path is exercised." Not codifying — one datapoint.

  (4) PostgREST embedding error message pattern. The error
  "Could not find a relationship between X and Y" surfaces as
  a Supabase-client exception, not a typecheck failure — the
  query shape compiles fine because PostgREST embedding is
  runtime-resolved. Worth noting for future schema-join work.

  Six candidate-future-conventions staged now (up from five at
  session start): prompt-UUID discipline, Shipped-Code-to-Spec
  Verification, verbatim-vs-skeleton citation distinction,
  internal-helper refactor NOTE, migration-lineage verification
  (new from this session), query-shape infeasibility handling
  (new from this session). None codified per founder discipline
  — batching until a third datapoint surfaces for each.

  Session decomposition discipline held: no Session 5+ scope
  leaked in (no onboarding state machine, no form-escape
  surfaces, no AgentChatPanel UI rewrite, no canvas directive
  extensions, no ProposedEntryCard rewrite). The four finds
  above are all within Session 4's natural scope — the first
  three are gap-fills discovered during execution of a
  spec-defined work item, the fourth is a documentation note.
  Master §21 CA-* numbering drift still deferred to Session 8.

  Approximate session time: ~2h (including the pre-commit-1
  migration-113 halt, the commit-2 review gate, the PostgREST
  rewrite, the test-ripple count correction from 6 to 10, and
  the commit-6 idempotency_key fix).
- 2026-04-18 NOTE   Phase 1.2 Session 4.5 — AuditEntry nullable
  cleanup. Single-commit follow-up to Session 4's migration-113
  find. Scope: change AuditEntry.org_id from string to
  string | null in src/services/audit/recordMutation.ts; remove
  the `undefined as unknown as string` cast at
  userProfileService.updateProfile:115 in favor of
  `org_id: null`; audit every other recordMutation call site
  for null-correctness. Audit result: 18 recordMutation call
  sites across 8 files — 17 pass non-null org_ids (safe), 1 is
  the hack (cleanup target). authEvents.ts's login/logout
  writes bypass recordMutation and insert directly with
  `org_id: null` — that code is already correct; refactoring it
  to use recordMutation would have been scope creep, left
  alone. No test additions, no new service functions. 209/209
  still green. Type change is purely additive (widens the
  accepted input set), so existing non-null callers continue to
  typecheck. Starting model: Claude Opus 4.7 — continuous with
  Session 4. Starting SHA: 9c6552d. One commit lands this.

  Clarification D skip-rule reconsideration (surfaced for
  Session 5, not changed here): now that audit_log.org_id is
  known to accept null, Session 4's three agent.* emit sites
  (loadOrCreateSession branch 3, handleUserMessage's three
  return points, executeTool's finally block) could emit with
  null org_id during onboarding instead of skipping. This
  would give richer audit coverage for the onboarding flow
  Session 5 is building. The trade-off is modest — skipping
  loses nothing critical (provenance recovers on first
  session_org_switched), but the explicit emits make
  onboarding-time agent behavior visible in audit_log for
  debugging. Flag for Session 5 to decide as part of its
  onboarding-state-machine design; Session 4.5 does not
  change the skip rule.

  Approximate session time: ~25 minutes.
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief drafting session
  started. Starting SHA: cbbfafd (Session 4.5 closeout anchor).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Master
  brief frozen at aae547a; Sessions 1–4 + 4.5 complete,
  regression baseline 209/209. Target artifacts: (1)
  docs/09_briefs/phase-1.2/session-5-brief.md (new), (2)
  docs/09_briefs/CURRENT_STATE.md (stale — still says "Session 4
  ready to execute"), (3) this entry + session-close entry.
  Session 5 scope per founder drafting prompt: master §11
  onboarding flow implementation (state machine, welcome page
  minimal-functional, sign-in redirect, orchestrator state
  integration, invited-user detection). Seven founder
  pre-decisions locked in the drafting prompt: (1) minimal
  welcome, no Session 7 imports; (2) AgentChatPanel contract
  `{ orgId: string | null }`; (3) invited-user detection via
  server component; (4) step 4 completion is a state flag flip
  (not canvas_directive — defers first canvas_directive use to
  Session 6/7); (5) step 1 completes when display_name is set
  (not all four §11.3 fields); (6) resolvePersona onboarding
  stub confirmed as master decision A; (7) test delta is a
  floor, not a cap. Mandatory pre-drafting Cited-Code
  Verification grep clean: zero welcome-page hits in src/app/,
  zero OnboardingState/state.onboarding hits (Session 5
  introduces both), last_login_at used only for login-time
  tracking (not as onboarding signal per Pre-decision 5). One
  open drafting decision: step-4 completion signal — options
  (a) respondToUser template_id pattern, (b) new
  completeOnboarding tool, (c) orchestrator heuristic. Founder
  leans toward (a). To be pressure-tested during drafting.
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief drafting session
  complete. Artifacts: (1) session-5-brief.md (705 lines — ~50
  longer than Session 4's 654, proportional to Session 5's wider
  scope and the Pre-decision 8 three-option pressure-test);
  (2) CURRENT_STATE.md updated — Session 4 / 4.5 marked complete,
  Session 5 marked ready to execute; (3) this entry. Eight
  founder pre-decisions locked in sub-brief §4: seven from the
  drafting prompt verbatim + one drafting-authored (Pre-decision
  8 — step-4 completion signal is the respondToUser template_id
  pattern `agent.onboarding.first_task.navigate`, with Options B
  and C rejected during pressure-test). Rationale for Option A:
  preserves the "always respondToUser at turn end" discipline
  (master §6.2 item 2), adds no new tool (honors §6.4 whitelist
  invariance + Session 5's no-new-tools out-of-scope constraint),
  fully observable via existing agent.message_processed audit
  row, needs only one new orchestrator detection branch. Option
  B would add a persona-whitelist decision and master-brief
  divergence. Option C has no clean programmatic trigger.

  Nine work items enumerated (§6.1–§6.11; §6.11 is the mandatory
  pre-execution grep, §6.10 is a five-line comment add): (6.1)
  OnboardingState type + read/write helpers at
  src/agent/onboarding/state.ts; (6.2) extended onboardingSuffix
  — commit-1 founder review gate here for the step-aware prose;
  (6.3) buildSystemPrompt wiring; (6.4) orchestrator state
  read/write + three transition detectors + step-4 template_id
  detection; (6.5) AgentResponse.onboarding_complete optional
  field; (6.6) /api/agent/message initial_onboarding body field;
  (6.7) welcome page (server component with client chat panel
  embed); (6.8) sign-in redirect logic; (6.9) AgentChatPanel
  prop contract conformance; (6.10) resolvePersona inline
  comment citing master decision A.

  Eleven S5 exit criteria + 7 new CA tests (CA-67 through CA-73,
  with CA-67 and CA-73 permitted multi-it-block per Session 3/4
  pattern). 5-commit cadence: (1) types + suffix + wiring —
  founder review gate; (2) orchestrator transitions + response
  shape; (3) welcome page + AgentChatPanel contract; (4) sign-in
  redirect; (5) tests + locale keys.

  Three observations surfaced worth preserving:

  (1) Master §21 CA-46/CA-47 drift continues. Master's CA
  catalog references onboardingNewUser.test.ts as CA-46 and
  onboardingInvitedUser.test.ts as CA-47 — different numbers
  and different file names than the actual shipped CA-45
  (agentSessionPrecedence) and CA-46 (agentSessionOnboarding)
  from Session 2. Session 5 continues CA-67+ per Session 3's
  pattern; the reconciliation is Session 8 scope. Noted in
  §2 "NOT delivered" list.

  (2) AgentChatPanel stub conformance (Pre-decision 2) is a
  Session 5 work item (§6.9), but the drafter did not verify
  the current stub's actual prop signature during drafting —
  execution's first task in commit 3 will be reading the stub
  and confirming whether the contract `{ orgId: string | null,
  initialOnboardingState?: OnboardingState }` requires adding
  props or just leaves the existing shape intact. If the stub
  already accepts these props, commit 3 is simpler; if not,
  commit 3 adds them. Either way, Session 7's rewrite must
  honor the contract. Flag this as an execution-time discovery
  point, not a sub-brief ambiguity.

  (3) The Session 4.5 "Session 5 to decide" flag about
  Clarification D's skip rule was resolved in sub-brief §9
  (What is NOT in Session 5): skip rule stays intact. Richer
  onboarding audit coverage via null-org emits is not worth
  loosening a pressure-tested decision mid-flow. Flagged as a
  deferred candidate for whenever recordMutation's tx-atomicity
  gets revisited (Phase 2 events table per INV-LEDGER-003).

  Cited-Code Verification grep at session start: clean. Zero
  welcome-page hits in src/app/, zero OnboardingState /
  state.onboarding hits, last_login_at used only for login-time
  tracking (not as onboarding signal per Pre-decision 5). No
  surprises; the nine existing onboarding-related src/agent/
  hits are all Session 3 (onboardingSuffix) + Session 4
  (orchestrator references, persona identity block mentioning
  "onboarding path", createOrganization/listIndustries tool
  mentions) as expected.

  No master-brief inconsistencies surfaced requiring an
  unfreeze. The master §21 CA-* numbering drift is the closest
  thing to an inconsistency but it's a known deferred item for
  Session 8, not a Session 5 blocker.

  Seven candidate-future-conventions staged (unchanged from
  Session 4.5 close — no new candidates from this drafting
  session): prompt-UUID discipline, Shipped-Code-to-Spec
  Verification, verbatim-vs-skeleton citation distinction,
  internal-helper refactor NOTE pattern, migration-lineage
  verification, query-shape infeasibility handling, and the
  narrower one-datapoint DB-CHECK ↔ INSERT column-list matching.

  Approximate drafting time: ~40 minutes (including the three-
  option step-4 pressure-test, the CURRENT_STATE surgery, and
  this entry).
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief revision session
  started. Starting SHA: 1ea60dc (Session 5 drafting anchor).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Four
  founder-review tightening items to apply: (1) §6.4 item 3
  step-transition rule — advance to smallest uncompleted step
  > N, not hardcoded 1→2/2→4; (2) §6.4 item 5 state persists
  only on success path (failed turns don't advance the machine);
  (3) §6.1 also exports onboardingStateSchema Zod alongside the
  TS interface in src/agent/onboarding/state.ts; (4) §6.7
  explicit Option B decision — invited-user welcome page uses
  orgId={null} uniformly, richer-context question deferred.
  Plus one minor §10 artifact-list fix (one template_id key,
  not three). No §4 pre-decision changes, no §11 commit-plan
  changes.
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief revision session
  complete. Four founder-review tightenings applied + one
  drafting-bug fix surfaced during Revision 1 work. Sub-brief
  grew 705 → 799 lines; no architectural changes, all spec
  tightening.

  Revisions applied:

  (1) §6.4 item 3 — replaced hardcoded 1→2 / 2→4 transitions
  with the smallest-uncompleted-step-greater-than-N rule. Three
  worked examples added (fresh user step 1, fresh user step 2
  atomic 2+3 advance, invited user step 1 → skip to 4).
  Explicit edge-case handler: if `completed_steps` already
  contains all of {1,2,3,4} before step-N completion, log an
  error and don't re-advance (upstream bug; execution flags).

  (2) §6.4 item 5 — state persists ONLY on the success path.
  Failure paths (Q13 exhaustion, structural-retry exhaustion)
  persist conversation via existing persistSession call but
  MUST NOT persist state changes. Rationale: a failed turn
  should be replayable without skipping a step. Concrete
  implementation named: failure-path calls pass `state:
  undefined`; only the success-path call passes the new state.

  (3) §6.1 now exports `onboardingStateSchema` (Zod) alongside
  the TS interface in the same file. Placement rationale
  added: narrow agent-internal schemas live with their
  subsystem (matches Session 4 pattern); broader boundary
  schemas live under src/shared/schemas/. §6.6's implicit
  schema reference now has a sourced definition.

  (4) §6.7 explicit Option B decision — invited-user orgId is
  `null` uniformly. Full rationale paragraph added: Option A
  would load OrgContext for richer step-4 context but forces
  orchestrator asymmetry (org-switch detection, agent.* audit
  emits, onboarding suffix gating). Option B keeps onboarding
  uniformly orgless; richer-context deferred. The welcome
  page retains the invited user's firstOrgId client-side for
  the completion router.push target.

  Drafting bug surfaced (fix applied as extension of Revision
  1): §6.7's initial-state computation had two errors the
  drafter introduced that the founder's Revision 1 prompt used
  the correct values for. (a) `current_step` was conditionally
  1 or 4 based on invited-user status — wrong; master §11.1's
  trigger only sends users to /welcome when display_name IS
  NULL, so current_step is always 1 on arrival. Invited-user
  shortened flow is expressed via initial `completed_steps`,
  not initial `current_step`. (b) `completed_steps` for
  invited users was stated as `[1, 2, 3]` — wrong; master
  §11.5(c) specifies `[2, 3]` (profile is still needed, which
  is why the user is in onboarding). Fixed §6.7 initial-state
  list with explicit master citation. CA-71's initial-state
  assertion also corrected from `completed_steps:[]` to
  `completed_steps:[2,3]`, matching master §11.5(c). The
  drafter's recap had this correct for the invited-user flow
  *logic* but got the initial-state *numbers* wrong — an
  example of "descriptively correct, numerically wrong"
  drift. Worth noting but not a new convention-candidate —
  it's a narrow single-datapoint class caught by the
  founder's revision-round close reading.

  Minor §10 fix: "Three new template_id keys" → "One new
  template_id key", matching Pre-decision 8's specification
  and §6.2's note that the suffix is English-only prompt prose
  (not a locale-routed user-facing string).

  No master-brief inconsistencies surfaced. No §4 pre-decision
  changes. No §11 commit-plan changes. Seven candidate-future-
  conventions staging unchanged.

  Approximate revision time: ~25 minutes.
- 2026-04-18 NOTE   Phase 1.2 Session 5 execution session —
  starting. Starting SHA: 9c22e07 (Session 5 sub-brief
  revision anchor; sub-brief at
  docs/09_briefs/phase-1.2/session-5-brief.md is frozen and
  authoritative). Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a.
  Regression baseline: 209/209. Target test count at
  session close: ~218 (209 + 7 CA-67–73 floor, more if
  sub-assertions surface per Pre-decision 7). Five-commit
  cadence with commit-1 founder review gate for the
  extended onboardingSuffix prose. Eight founder
  pre-decisions in sub-brief §4 are authoritative. Mandatory
  §6.11 Cited-Code Verification grep: clean. Nine hits in
  src/agent/ for onboarding-related text (all Session 3/4
  expected: onboardingSuffix, orgContextSummary, persona
  files, orchestrator, toolsForPersona, listIndustries,
  createOrganization); zero hits in src/app/ (Session 5
  creates /welcome and the sign-in redirect). Zero hits for
  state.onboarding / OnboardingState (Session 5 introduces
  both). `last_login_at` used only for its natural
  login-time tracking in userProfileService + membership
  listing — NOT as an onboarding signal per Pre-decision 5
  (Session 5 uses display_name).
- 2026-04-19 NOTE   Phase 1.2 Session 5 execution complete. All
  11 S5 exit criteria pass. 5 commits on top of 9c22e07:
  be72229 (OnboardingState + extended suffix + buildSystemPrompt
  wiring — commit-1 founder review gate produced one polish:
  "isn't available yet" → "isn't wired in for you right now" on
  step 2's skip handler), 6297b57 (orchestrator state
  transitions + AgentResponse.onboarding_complete), 246ee25
  (welcome page + AgentChatPanel prop contract), f09b73f
  (sign-in redirect logic), 2b644f6 (CA-67 through CA-73 tests).
  Starting model: Claude Opus 4.7 — unchanged throughout. Full
  regression: 67 test files, 226 tests, 0 failures (209 baseline
  + 17 new it-blocks across 7 new CA files — CA-67 × 5, CA-68 ×
  1, CA-69 × 1, CA-70 × 2, CA-71 × 2, CA-72 × 2, CA-73 × 4).
  Target test count was ~218; actual 226 via sub-assertions per
  Pre-decision 7. Master brief frozen at aae547a. Sub-brief
  frozen at 9c22e07.

  Two execution-time finds worth preserving:

  (1) Sub-brief §6.3 internal contradiction — captured at
  Commit 1 review gate. "onboardingSuffix returns empty for null"
  (§6.3 first statement) and "the old behavior (generic
  onboarding suffix) still fires" under the guard (§6.3 second
  statement) are contradictory if both route through the same
  function. Resolved by splitting: onboardingSuffix(state)
  returns empty for null (step-aware path), new
  genericOnboardingSuffix() preserves Session 3's static block
  verbatim. buildSystemPrompt's defense-in-depth guard calls
  the generic variant as fallback. CA-49 stays green, Session 3
  behavior preserved. Datapoint #3 for the "narratively correct,
  contractually wrong" drift pattern — first was Session 4's
  test-ripple count correction, second was the invited-user
  initial state [1,2,3] vs master §11.5(c)'s [2,3] during
  Session 5 sub-brief revision. Founder flagged three datapoints
  as the convention-proposal bar; candidate will be staged after
  Session 5 close per founder discipline.

  (2) orgService.createOrgWithTemplate input-schema mismatch —
  surfaced by CA-69 on first end-to-end exercise of the
  createOrganization agent dispatch. Agent tool's
  createOrganizationInputSchema (8 fields) is narrower than
  orgService's createOrgProfileSchema which also requires
  accountingFramework + defaultReportBasis. Fix: executeTool's
  createOrganization dispatch merges 'aspe' / 'accrual' defaults
  (matching the DB column defaults from migration 109) before
  calling the service. Same class as Session 4's missing
  idempotency_key column write — a pre-existing gap exposed
  only when a new session first exercises an end-to-end path.
  Narrow single-datapoint class; not a new convention candidate.

  No master-brief inconsistencies surfaced requiring an
  unfreeze. Clarification D skip rule stayed intact per §9 of
  the sub-brief (Session 5 explicitly declined to loosen for
  richer onboarding audit coverage — Phase 2 events-table
  revisit remains the right venue). resolvePersona onboarding
  stub confirmed as master decision A with the durable inline
  comment per Pre-decision 6.

  No Anthropic API calls during execution — CA-67 through
  CA-73 are all fixture-driven (no CA-66-style real-API smoke).
  Cost: zero.

  Candidate-future-conventions: eight staged now (seven from
  Session 4.5 close + one proposed after Session 5: the
  "narratively correct, contractually wrong" drift pattern,
  with three datapoints accumulated). None codified per founder
  batching discipline.

  Session decomposition discipline held: no Session 6+ scope
  leaked in (no form-escape surfaces, no Skip link
  implementation, no canvas directive extensions, no
  AgentChatPanel rewrite beyond the minimal prop-contract
  conformance + onboarding-mode branch). The AgentChatPanel
  change does add a new OnboardingChat subcomponent that
  Session 7's rewrite will consolidate — scoped to render the
  minimal welcome flow without importing any Session 7
  components (SuggestedPrompts is skipped in onboarding mode
  per Pre-decision 1's spirit).

  Approximate session time: ~60 minutes (including the commit-1
  review gate pause, the CA-49 test-preservation fix, the
  CA-69 createOrganization input-schema fix, and this entry).
- 2026-04-19 NOTE   Phase 1.2 Session 5.1 — smoke-test-surfaced
  bug fixes. Starting SHA: 4487e19 (Session 5 closeout).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Scope:
  two bugs caught by the autonomous EC-20 smoke (Session 5 + 5,
  running Turn 2 of a User-A conversation against real Anthropic
  API): (1) orchestrator persists a trailing respondToUser
  tool_use block in session.conversation, causing every
  multi-turn conversation to fail on Turn 2 with Anthropic's
  400 "tool_use ids were found without tool_result blocks
  immediately after" — this is a Session-2-era defect fixture
  tests couldn't catch; (2) Claude invents template_ids not in
  locale files (smoke test saw `onboarding.profile.ask_display_name`
  which doesn't exist in messages/*.json) — the system prompt
  tells Claude the contract but doesn't enumerate valid keys,
  which is a Session-3-era gap. Both bugs block product behavior;
  bug (1) blocks every multi-turn conversation, bug (2) causes
  runtime i18n render failures. Baseline 226/226. Smoke-test
  scripts at scripts/_smoketest-*.ts deleted per Session 5.1
  prompt (served their purpose; not product code). Pre-execution
  grep for template_id references in src/agent/ came back clean
  — the three that the source code explicitly references
  (agent.error.tool_validation_failed,
  agent.error.structured_response_missing,
  agent.onboarding.first_task.navigate) are all present in all
  three locale files. Two keys in the agent.* namespace
  (agent.emptyState, agent.suggestedPromptsHeading) are UI
  strings rendered by AgentChatPanel / SuggestedPrompts — not
  response templates; will be excluded from the valid-response
  list.
- 2026-04-19 NOTE   Phase 1.2 Session 5.1 execution complete.
  Two commits on top of 4487e19: 9b1af3d (Bug 1:
  message-protocol invariant in persistSession success path),
  887d5ea (Bug 2: enumerate valid template_ids in system
  prompt). Starting model: Claude Opus 4.7 — unchanged. Full
  regression: 69 test files, 233 tests, 0 failures (226
  baseline + 2 protocol-invariant + 5 template-id set closure
  it-blocks). Typecheck clean. Master brief frozen at aae547a.
  Session 5 sub-brief frozen at 9c22e07. Session 5 feature
  commits unchanged.

  Bug 1 (message-protocol violation) details:
  - Surface: every multi-turn agent conversation against real
    Claude fails on Turn 2 with Anthropic 400
    "tool_use ids were found without tool_result blocks
    immediately after."
  - Root cause: persistSession wrote resp.content verbatim,
    including trailing respondToUser tool_use blocks.
    respondToUser is orchestrator-internal (consumed by
    handleUserMessage, not executed via executeTool) so has
    no matching tool_result. Anthropic's protocol rejects the
    sequence on Turn 2 when the conversation is replayed.
  - Secondary: if Claude bundled a non-respondToUser tool_use
    alongside respondToUser in one turn (e.g., listIndustries +
    respondToUser), the success path also failed to persist the
    tool_use+tool_result pair — the toolResults accumulated in
    memory weren't pushed to messages.
  - Fix: success path (around line 439) filters respondToUser
    from resp.content, pushes the {assistant filtered content,
    user toolResults} pair into messages when otherTools.length
    > 0, and terminates with a text placeholder
    "[responded with template_id=X]" so the sequence is protocol-
    valid.
  - Regression test: agentConversationProtocolInvariant.test.ts
    asserts (a) no respondToUser tool_use blocks in the persisted
    conversation; (b) every non-respondToUser tool_use has a
    matching tool_result in the immediately-following user
    message. Verified test FAILS against pre-fix code via git
    stash.
  - NOT fixed: Q13 exhaustion (line 347) and structural-retry
    exhaustion (line 468) persistSession calls have the same
    latent issue if the failing resp contained tool_uses. Left
    alone per the Session 5.1 prompt's recommendation — those
    paths return error templates telling the user to rephrase,
    so continuation is rare. Flag for future session if
    empirically hit.

  Bug 2 (template_id invention) details:
  - Surface: smoke test observed Claude emitting
    `onboarding.profile.ask_display_name`, which doesn't exist
    in any locale file. next-intl would throw "missing
    translation" at UI render.
  - Root cause: the STRUCTURED_RESPONSE_CONTRACT says "every
    template_id must exist in the locale files" but doesn't
    enumerate which keys are valid. Claude invents
    semantically reasonable keys.
  - Fix: new module src/agent/prompts/validTemplateIds.ts
    exports VALID_RESPONSE_TEMPLATE_IDS (13 allowlisted keys)
    + UI_ONLY_AGENT_KEYS (2 UI-only agent.* keys). A new
    VALID_TEMPLATE_IDS prompt section, wired into all three
    personas via _sharedSections.ts, enumerates the allowlist
    grouped by namespace with explicit "Do NOT invent new keys"
    instruction.
  - Regression test: agentTemplateIdSetClosure.test.ts enforces
    set equality between the two exported lists and the actual
    en.json agent.* + proposed_entry.* keys. Five it-blocks
    cover subset, exhaustiveness, disjointness, and section
    rendering.

  CA-67 assertion update: the step-1/2/3 "not to contain
  agent.onboarding.first_task.navigate" negative checks used
  to look at the full prompt output. After Session 5.1's
  VALID_TEMPLATE_IDS section, that template_id appears in
  every prompt as part of the enumerated allowlist. Retargeted
  the negative assertion to "Do NOT use this template_id for
  any other turn" — the step-4-specific reservation guardrail,
  which only exists in the step-4 onboarding suffix. Same
  semantic check; different anchor string.

  Pre-existing test-isolation flake observed: on the first full
  test run after Bug 2 landed, CA-54 and CA-15 reported
  failures. Re-running the suite cleared both. Root cause is
  userProfileAudit's afterAll modifies SEED.USER_CONTROLLER's
  display_name temporarily, and if another test querying that
  user runs in parallel (or reads mid-window), there's a
  transient state mismatch. Pre-existing issue, NOT caused by
  Session 5.1. Worth tracking but out of scope here. Test
  isolation via trace_id cleanup is Session 5.1 pattern
  already in place — this is a different leak vector.

  Execution-time observations (no new convention candidates
  needed for these two — the class of finding is already
  captured by staged candidates):

  (1) Params-shape gap (Session 5.1 deferred). The prompt now
  enumerates valid template_ids but doesn't specify which
  params each template expects (e.g., agent.greeting.welcome
  needs {user_name}, agent.accounts.listed needs {count}).
  Smoke test saw Claude emit params:{} where the template
  expected structured params. Symptom: the rendered string has
  literal "{user_name}" text where a name should be. Not a
  crash, but a visible UI defect. Flag for a future session —
  likely folded into Session 7's UI rewrite where rendered
  output becomes visible to the founder during testing.

  (2) Model deprecation warning still firing on every call:
  'claude-sonnet-4-20250514' deprecated June 15, 2026. Not
  urgent (~8 weeks), but a future session's migration task.

  Staging the Session 5.1 convention candidate:

  (9) Mock-vs-Protocol Invariant Gap — fixture-based agent
  tests (CA-39 through CA-73) exercise the orchestrator's
  Zod validation + state machine + response extraction, but
  cannot catch Anthropic API protocol violations because the
  mocked callClaude doesn't enforce the tool_use →
  tool_result pairing rule. The smoke test is the only
  venue that catches these. One datapoint (Bug 1). Not
  codifying yet per founder batching discipline. Future
  instances: e.g., conversation-length limits, model-specific
  shape requirements, streaming constraints — any
  protocol-level rule fixtures don't model.

  Nine candidate-future-conventions staged now (eight from
  pre-Session-5.1 + this new one). None codified per founder
  batching discipline. The "Spec-to-Implementation
  Verification" candidate (datapoint #3 as of Session 5 close)
  remains convention-ready; founder stated it would be
  codified during Session 6 drafting.

  Smoke test scripts at scripts/_smoketest-create-users.ts and
  _smoketest-userA-full.ts were deleted at session start per
  the Session 5.1 prompt. Findings file at
  /tmp/smoketest-findings.md still exists (not committed;
  served its purpose as input to Session 5.1).

  Approximate session time: ~50 minutes.
