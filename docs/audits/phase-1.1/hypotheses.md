# Phase 1.1 Orientation Hypotheses

Phase 1 output of the audit framework (DESIGN.md).
Generated: 2026-04-13, end of Phase 1.1.

Auditor: Claude Opus 4.6 (same instance that helped build Phase 1.1 —
self-audit limitation acknowledged per DESIGN.md Constraint 6).

---

## Hypothesis List

```yaml
- id: "H-01"
  hypothesis: |
    journalEntryService.post() performs three sequential Supabase
    REST API calls (insert journal_entry, insert journal_lines,
    insert audit_log) without explicit transaction wrapping. Each
    .insert() is a separate HTTP request to PostgREST, each
    auto-committed. If the lines insert fails after the entry insert
    succeeds, an orphaned journal_entry row exists in the database
    with no lines — violating the deferred balance constraint only
    if the constraint fires (it fires on journal_lines INSERT, not
    on journal_entries INSERT). The audit_log write is also outside
    any shared transaction boundary.
  pattern: "boundary-mismatch"
  categories_to_investigate:
    - "Backend Design & API"
    - "Data Layer & Database Design"
    - "Architecture Fit"
  evidence_that_would_confirm: |
    1. Read src/services/accounting/journalEntryService.ts:92-151
       and verify that no Supabase transaction wrapper (e.g.,
       db.rpc() calling a server-side function, or a BEGIN/COMMIT
       block) surrounds the three inserts.
    2. Inspect whether the Supabase JS client v2 .insert() calls
       are individually auto-committed by PostgREST.
    3. Simulate a lines insert failure (e.g., constraint violation)
       and check whether the journal_entries row persists.
    4. Verify that recordMutation's audit_log insert (line 145) is
       NOT inside the same transaction as the journal_entry insert.
  evidence_that_would_refute: |
    PostgREST's auto-commit behavior groups all inserts within a
    single API route's request into one transaction, OR the Supabase
    client has an implicit transaction mode that wraps sequential
    calls. Alternatively, a test demonstrating that a failed lines
    insert rolls back the entry insert.
  priority: "high"

- id: "H-02"
  hypothesis: |
    The reversal mirror check in journalEntryService.ts (lines 208-209)
    defines local toMoney and toRate functions that coerce values
    through JavaScript Number (Number(v).toFixed(4)) instead of using
    the canonical toMoneyAmount/toFxRate helpers from money.schema.ts
    which use decimal.js. For amounts exceeding Number.MAX_SAFE_INTEGER
    / 10^4 (~900 billion), the Number() path silently loses precision,
    causing a valid mirror to fail or an invalid mirror to pass. The
    schema allows numeric(20,4) which can represent values up to
    10^16 — well above the JS Number safe integer limit.
  pattern: "invariant-gap"
  categories_to_investigate:
    - "Backend Design & API"
    - "Code Quality & Maintainability"
  evidence_that_would_confirm: |
    1. Read journalEntryService.ts:208-209 and confirm the local
       toMoney/toRate helpers use Number() not Decimal().
    2. Compare with money.schema.ts:67-77 (toMoneyAmount/toFxRate)
       which use decimal.js.
    3. Verify that the DB schema allows values large enough to
       trigger JS Number precision loss (numeric(20,4) in
       journal_lines).
  evidence_that_would_refute: |
    The Supabase driver serializes numeric(20,4) values to strings
    that the local Number() call can handle without precision loss
    for all realistic accounting amounts (e.g., < 1 trillion CAD).
    OR the local helpers have been updated to use Decimal since the
    last code read.
  priority: "medium"

- id: "H-03"
  hypothesis: |
    orgService.createOrgWithTemplate performs four mutating operations
    (insert org, insert CoA rows, insert membership, insert fiscal
    periods) but never calls recordMutation(). This means org creation
    has no audit_log entry — the only mutating service path in the
    codebase without an audit trail. PLAN.md Invariant 4 requires all
    invariant checks before commit, and CLAUDE.md Rule 6 requires
    trace_id propagation through every layer including audit_log.
    Org creation bypasses the audit_log layer entirely.
  pattern: "invariant-gap"
  categories_to_investigate:
    - "Backend Design & API"
    - "Security & Compliance"
    - "Architecture Fit"
  evidence_that_would_confirm: |
    1. Read src/services/org/orgService.ts and confirm no call to
       recordMutation() exists anywhere in createOrgWithTemplate.
    2. Verify that the audit_log table has no rows with action =
       'org.create' or entity_type = 'organization' after org
       creation via the API.
    3. Check whether the membership insert (line 61-64) silently
       drops errors — the result is awaited but the error is not
       checked.
  evidence_that_would_refute: |
    There is a separate audit mechanism for org creation, or org
    creation is considered a setup operation exempt from audit logging
    by documented decision.
  priority: "high"

- id: "H-04"
  hypothesis: |
    The entry_number computation in journalEntryService.post() uses
    a MAX+1 pattern (lines 77-86) without any row-level lock (no
    FOR UPDATE, no advisory lock, no serializable isolation). Two
    concurrent journal entry posts to the same org+period will both
    read the same MAX value and attempt to insert the same
    entry_number, violating the UNIQUE constraint
    unique_entry_number_per_org_period. The friction journal (line 289)
    documents this exact pattern causing test failures, and the test
    coverage catalog lists "Concurrent access — no tests for concurrent
    journal entry posting (entry_number serialization)" as gap #7.
  pattern: "invariant-gap"
  categories_to_investigate:
    - "Backend Design & API"
    - "Data Layer & Database Design"
  evidence_that_would_confirm: |
    1. Read journalEntryService.ts:77-86 and confirm no FOR UPDATE
       or locking mechanism on the MAX query.
    2. Verify that migration 004 adds the UNIQUE constraint on
       (org_id, fiscal_period_id, entry_number).
    3. Check whether the service catches the UNIQUE violation and
       retries — if not, concurrent posts will fail with a DB error.
  evidence_that_would_refute: |
    Phase 1.1 is single-user local development only, so concurrent
    access is impossible in practice AND this is documented as a
    known Phase 1.2 obligation. Check phase-1.2-obligations.md.
  priority: "medium"

- id: "H-05"
  hypothesis: |
    Frontend fetch calls in JournalEntryForm.tsx (line 131-133) and
    BasicPLView.tsx (line 40) do not check response.ok before calling
    response.json(). If the API returns a non-2xx response (e.g., 401
    for expired session, 500 for DB error), the fetch chain will
    attempt to parse the error JSON and silently treat it as valid
    data — setting periods/accounts/taxCodes to empty arrays or
    P&L rows to an empty array. There is no typed error contract
    between the API error responses (ServiceError codes) and the
    frontend fetch layer.
  pattern: "boundary-mismatch"
  categories_to_investigate:
    - "Frontend Architecture"
    - "Backend Design & API"
  evidence_that_would_confirm: |
    1. Read JournalEntryForm.tsx:128-137 and verify no response.ok
       check before .json() parsing.
    2. Read BasicPLView.tsx:38-50 and verify the same pattern.
    3. Check all fetch() calls in src/components/ for the same
       missing error check.
    4. Verify that serviceErrorToStatus.ts returns structured JSON
       errors that the frontend doesn't handle.
  evidence_that_would_refute: |
    The fetch calls have try/catch blocks that handle non-JSON
    responses, or the .then(r => r.json()) chain rejects on non-2xx
    responses (it doesn't — fetch only rejects on network errors,
    not HTTP errors).
  priority: "high"

- id: "H-06"
  hypothesis: |
    Read-path service functions (journalEntryService.list,
    journalEntryService.get, reportService.profitAndLoss,
    reportService.trialBalance, chartOfAccountsService,
    periodService, taxCodeService) use adminClient() which bypasses
    RLS. Authorization is enforced by inline checks
    (ctx.caller.org_ids.includes()) or inline query filters
    (.in('org_id', ctx.caller.org_ids)). These checks depend on
    org_ids being correctly populated in buildServiceContext, but
    buildServiceContext fetches memberships using the user-context
    Supabase client's anon key — which is itself subject to RLS on
    the memberships table. A mismatch between what the user-context
    client can see (RLS-filtered) and what the adminClient writes
    (RLS-bypassed) could create an authorization gap if the
    memberships RLS policy is more restrictive than expected.
  pattern: "security-surface-gap"
  categories_to_investigate:
    - "Security & Compliance"
    - "Backend Design & API"
    - "Architecture Fit"
  evidence_that_would_confirm: |
    1. Read serviceContext.ts:57-59 — the membership query uses the
       user-context supabase client (anon key + auth cookie), which
       is subject to the memberships_select RLS policy.
    2. Read the memberships_select RLS policy in migration 001
       (line 672-674): it allows user_id = auth.uid() OR
       user_is_controller(org_id). An ap_specialist can see their
       own memberships but cannot see controller memberships.
    3. Verify that this doesn't cause the org_ids array to be
       incomplete for any user role.
  evidence_that_would_refute: |
    The memberships_select policy returns rows where user_id =
    auth.uid(), which means every user can see ALL their own
    memberships regardless of role. The controller check is for
    seeing OTHER users' memberships, not your own. So org_ids is
    always complete for the authenticated user.
  priority: "medium"

- id: "H-07"
  hypothesis: |
    The JournalEntryDetail type (journalEntryService.ts:253-290)
    declares journal_lines[].debit_amount, credit_amount, etc. as
    plain string, not as branded MoneyAmount. The service's get()
    function (line 415-422) coerces values through toMoneyAmount/
    toFxRate, producing canonical strings. But consumers that
    receive JournalEntryDetail must cast to MoneyAmount for
    arithmetic operations — and the TypeScript type doesn't enforce
    this. The ReversalForm, which receives a JournalEntryDetail and
    constructs mirror lines, may pass coerced strings through the
    Zod schema which expects MoneyAmount. If the service returns a
    value that doesn't match MoneyAmountSchema's regex (e.g.,
    trailing zeros differ), the reversal form submission would fail
    with a Zod validation error.
  pattern: "schema-code-drift"
  categories_to_investigate:
    - "Backend Design & API"
    - "Frontend Architecture"
    - "Code Quality & Maintainability"
  evidence_that_would_confirm: |
    1. Read journalEntryService.ts:274-289 — journal_lines types
       use plain string, not MoneyAmount.
    2. Read ReversalForm.tsx and check how it constructs mirror
       lines from the detail response.
    3. Verify that toMoneyAmount output format (e.g., "100.0000")
       always matches MoneyAmountSchema regex
       (/^-?\d{1,16}(\.\d{1,4})?$/).
    4. Check the friction journal entry about this (2026-04-17 NOTE,
       line 611-616).
  evidence_that_would_refute: |
    toMoneyAmount always produces output matching the
    MoneyAmountSchema regex (it does — Decimal.toFixed(4) always
    produces exactly 4 decimal places). The concern is real for the
    type system but not for runtime behavior.
  priority: "medium"

- id: "H-08"
  hypothesis: |
    The RLS policies for audit_log only include a SELECT policy
    (audit_log_select, migration 001 line 797-798). There is no
    INSERT policy for the audit_log table via RLS. Writes go through
    adminClient (which bypasses RLS), so this works in Phase 1.1.
    However, the organizations table similarly has only a SELECT
    policy — no INSERT, UPDATE, or DELETE policies. If any code path
    ever uses a user-context client (non-admin) to insert into these
    tables, the operation will be silently blocked by RLS with zero
    error message. The pattern of "admin-only writes, user-only
    reads" is implicit convention, not enforced by any compile-time
    or documented-convention check.
  pattern: "security-surface-gap"
  categories_to_investigate:
    - "Security & Compliance"
    - "Data Layer & Database Design"
  evidence_that_would_confirm: |
    1. Read migration 001 lines 640-812 and catalog which tables
       have INSERT/UPDATE/DELETE RLS policies vs SELECT-only.
    2. Verify that audit_log has SELECT-only (line 797-798).
    3. Verify that organizations has SELECT-only (line 668-669).
    4. Check whether any code path uses userClient (not adminClient)
       to write to these tables.
    5. Note: events table also has SELECT-only RLS — intentional for
       the reserved-seat pattern.
  evidence_that_would_refute: |
    The pattern is intentional: tables that should never be written
    by user-context clients have no INSERT policy, so RLS acts as a
    deny-by-default guard. This is defense-in-depth, not a gap.
    Document it as an architectural pattern.
  priority: "low"

- id: "H-09"
  hypothesis: |
    The orgService.createOrgWithTemplate membership insert (line
    61-64) does not check the error result: it awaits the insert
    but discards the return value without inspecting the error
    field. If the membership insert fails (e.g., duplicate
    user_id+org_id from a retry, or a constraint violation), the
    org is created with CoA and periods but no membership — the
    creating user cannot access their own org through normal
    RLS-filtered paths. This is a silent failure in a multi-step
    creation flow that lacks transaction wrapping.
  pattern: "invariant-gap"
  categories_to_investigate:
    - "Backend Design & API"
    - "Data Layer & Database Design"
  evidence_that_would_confirm: |
    1. Read orgService.ts:61-64 — the membership insert result is
       awaited but not destructured or checked.
    2. Compare with other inserts in the same function (lines 21-34,
       37-43, 54-55, 75-77) which all check for errors.
    3. Verify that no other mechanism creates the membership if this
       insert fails silently.
  evidence_that_would_refute: |
    The error is implicitly caught by the outer try/catch in the API
    route. But the Supabase client does NOT throw on insert failure
    — it returns { data: null, error: {...} }. So the error is truly
    swallowed.
  priority: "high"

- id: "H-10"
  hypothesis: |
    Integration tests construct ServiceContext manually with
    hardcoded seed UUIDs (e.g., serviceMiddlewareAuthorization.test.ts
    lines 50-59). No integration test exercises buildServiceContext()
    — the function that validates JWTs, fetches memberships, and
    generates trace_ids. The test coverage catalog confirms "Auth
    flow — sign-in/sign-out not tested (depends on Supabase Auth,
    tested manually)" as gap #3. A bug in buildServiceContext (e.g.,
    incorrect JWT validation, missing membership fetch, trace_id
    format) would not be caught by the integration test suite.
  pattern: "test-reality-divergence"
  categories_to_investigate:
    - "Backend Design & API"
    - "Security & Compliance"
    - "Code Quality & Maintainability"
  evidence_that_would_confirm: |
    1. Grep all test files for 'buildServiceContext' — confirm zero
       hits.
    2. Read serviceMiddlewareAuthorization.test.ts:50-59 — manual
       ServiceContext construction bypasses JWT validation.
    3. Read testDb.ts — confirm the test setup helper creates
       ServiceContexts without JWT validation.
    4. Read the test coverage catalog gap #3.
  evidence_that_would_refute: |
    There are API route integration tests that send HTTP requests
    with real auth cookies, exercising buildServiceContext end-to-end.
    (The test coverage catalog says these don't exist — gap #1.)
  priority: "high"

- id: "H-11"
  hypothesis: |
    The cross-org RLS isolation test (crossOrgRlsIsolation.test.ts)
    tests only SELECT operations across 6 tables. It does not test
    INSERT, UPDATE, or DELETE cross-org isolation. The test coverage
    catalog explicitly notes: "Does not test INSERT/UPDATE/DELETE
    cross-org — only SELECT." For tables with INSERT policies
    (chart_of_accounts, fiscal_periods, journal_entries,
    journal_lines), a user in org A could potentially insert data
    tagged with org B's org_id — the INSERT WITH CHECK uses
    user_has_org_access(org_id) which should block this, but this
    path is untested. The write path is protected by withInvariants
    Invariant 3 as well, but the DB-level RLS INSERT check has never
    been exercised by a test.
  pattern: "test-reality-divergence"
  categories_to_investigate:
    - "Security & Compliance"
    - "Data Layer & Database Design"
  evidence_that_would_confirm: |
    1. Read crossOrgRlsIsolation.test.ts and confirm it only uses
       .select() queries, never .insert()/.update()/.delete().
    2. Verify that the INSERT WITH CHECK policies on journal_entries,
       chart_of_accounts, fiscal_periods use user_has_org_access()
       in migration 001.
    3. Confirm no other test exercises cross-org INSERT rejection.
  evidence_that_would_refute: |
    The withInvariants middleware catches cross-org writes before
    they reach the DB, AND all writes use adminClient (bypassing RLS
    entirely). So the RLS INSERT policies are defense-in-depth that
    only matter if adminClient is ever removed — which is a Phase 2
    concern, not Phase 1.1.
  priority: "medium"

- id: "H-12"
  hypothesis: |
    The JournalEntryForm hardcodes currency as 'CAD' and fx_rate as
    oneRate() in formStateToServiceInput (lines 89-93). When Phase 2
    introduces multi-currency support, this function must be updated
    — but there is no compile-time guard or TODO-with-type-error
    pattern to ensure this happens. The fx_rate and currency fields
    silently accept any string, so the hardcoded values will continue
    to compile even when the service layer adds multi-currency
    validation. This is a designed Phase 1 simplification, but the
    absence of a forcing function means it could be missed during
    Phase 2 implementation.
  pattern: "schema-code-drift"
  categories_to_investigate:
    - "Frontend Architecture"
    - "Architecture Fit"
  evidence_that_would_confirm: |
    1. Read JournalEntryForm.tsx:89-93 — hardcoded 'CAD' and
       oneRate().
    2. Grep for other hardcoded 'CAD' strings in src/components/
       and src/services/.
    3. Verify that no Phase 1.2 obligation or PLAN.md section
       explicitly calls out the form's hardcoded currency as a
       migration item.
  evidence_that_would_refute: |
    PLAN.md §8b explicitly defers multi-currency to Phase 4 (not
    Phase 2), and the phase-1.2-obligations.md lists "Multi-currency
    FX wiring (Phase 4 per PLAN.md §8b)" under Phase 2+ deferrals.
    This is a known, documented deferral — not an accidental gap.
  priority: "low"

- id: "H-13"
  hypothesis: |
    Frontend components import service-layer types directly (e.g.,
    BasicPLView.tsx imports PLRow from reportService.ts, line 6).
    These are server-side service files that import adminClient,
    which should never be imported by client components. While
    TypeScript's type-only imports (import type) don't cause runtime
    bundling, the import path creates a compile-time dependency from
    client components to server-side service modules. If any of these
    imports accidentally become value imports (not type imports), the
    adminClient and its service-role key would be bundled into the
    client-side JavaScript.
  pattern: "layering-leak"
  categories_to_investigate:
    - "Frontend Architecture"
    - "Security & Compliance"
    - "Architecture Fit"
  evidence_that_would_confirm: |
    1. Grep for imports from @/services/ in src/components/ files.
    2. Check whether the imports are type-only (import type) or
       value imports.
    3. Verify that BasicPLView.tsx:6 uses 'import type' — if it's
       a value import, adminClient is at risk of client bundling.
    4. Check whether Next.js 'use client' boundary prevents server
       module resolution.
  evidence_that_would_refute: |
    All imports are type-only (import type {...}), and Next.js's
    server/client boundary prevents server modules from being
    bundled into client code even if the import were a value import
    (it would cause a build error, not a leak). Verify with
    'pnpm build' — no server-module-in-client warnings.
  priority: "medium"

- id: "H-14"
  hypothesis: |
    The seed data flow has a gap: after pnpm db:seed:all, the three
    seeded auth users (executive, controller, ap_specialist) exist
    in auth.users, and two orgs exist in organizations with their
    CoA and periods, but the memberships table may not reliably
    connect users to orgs. The friction journal (2026-04-13 WRONG,
    line 700-708) documents that "seeded auth users don't have
    memberships in seeded orgs after pnpm db:seed:all" and requires
    manual org creation through the form. Integration tests bypass
    this by using adminClient with hardcoded UUIDs. This means the
    entire integration test suite runs against a database state that
    is impossible to reproduce through normal user flows.
  pattern: "test-reality-divergence"
  categories_to_investigate:
    - "Backend Design & API"
    - "Data Layer & Database Design"
    - "Code Quality & Maintainability"
  evidence_that_would_confirm: |
    1. Read src/db/seed/dev.sql — check whether membership INSERTs
       connect seed users to seed orgs with the correct UUIDs.
    2. Read scripts/seed-auth-users.ts — check whether user UUIDs
       match the SEED constants in tests/setup/testDb.ts.
    3. Read tests/setup/testDb.ts and confirm SEED constants are
       used to construct test ServiceContexts.
    4. Run pnpm db:seed:all on a fresh db:reset and check whether
       memberships exist for the seed users.
  evidence_that_would_refute: |
    dev.sql does create memberships connecting seed users to seed
    orgs, and the friction journal entry was about a stale state
    that has since been fixed.
  priority: "medium"

- id: "H-15"
  hypothesis: |
    The date fields in journal entries (entry_date, fiscal period
    start_date/end_date) cross multiple serialization boundaries:
    PostgreSQL date type → Supabase PostgREST JSON → fetch response →
    JavaScript string → form state → API request JSON → Zod
    validation → service → DB insert. The Zod schema validates
    entry_date as z.string().date() which expects YYYY-MM-DD format.
    PostgreSQL returns date columns as 'YYYY-MM-DD' strings via
    PostgREST. However, if any intermediate layer (e.g., JSON.parse
    date reviver, Supabase client, or a future middleware) converts
    dates to ISO 8601 timestamps ('2026-04-13T00:00:00.000Z'), the
    Zod validation on the return trip would reject the value. The
    ReversalForm populates entry_date from a fetched journal entry
    detail — if that detail's entry_date comes back as a timestamp
    instead of a date string, the reversal form submission fails.
  pattern: "boundary-mismatch"
  categories_to_investigate:
    - "Backend Design & API"
    - "Frontend Architecture"
    - "Data Layer & Database Design"
  evidence_that_would_confirm: |
    1. Check what format PostgREST returns for PostgreSQL date
       columns (expected: 'YYYY-MM-DD' without timezone).
    2. Read JournalEntryDetailView.tsx and ReversalForm.tsx — verify
       how entry_date is used from the API response.
    3. Check whether any Supabase client configuration or JSON
       middleware transforms date strings.
    4. Test: POST a journal entry, GET it back, check the entry_date
       format in the response.
  evidence_that_would_refute: |
    PostgreSQL date columns reliably return 'YYYY-MM-DD' through
    PostgREST, and no layer transforms them. The smoke tests (Tasks
    13B, 15B) posted entries and the reversals worked correctly,
    implying the date round-trip is clean.
  priority: "low"
```

## Coverage Assessment

### Pattern coverage

| Pattern | Count | Notes |
|---------|-------|-------|
| boundary-mismatch | 3 | H-01, H-05, H-15 |
| invariant-gap | 4 | H-02, H-03, H-04, H-09 |
| layering-leak | 1 | H-13 |
| test-reality-divergence | 3 | H-10, H-11, H-14 |
| schema-code-drift | 2 | H-07, H-12 |
| security-surface-gap | 2 | H-06, H-08 |

### Layering leak coverage note

Only one layering-leak hypothesis was generated. The codebase
strongly enforces Law 1 (all DB access through services) and Law 2
(all journal entries through journalEntryService.post). A grep for
`adminClient` imports shows zero hits outside `src/services/` and
`src/db/`. The layering discipline is unusually strong for a Phase 1
codebase. H-13 (client→server type import path) is the most
plausible leak vector found.

### Cross-category hypotheses (spanning 3+ categories)

- H-01 (transaction atomicity): Backend, Data Layer, Architecture
- H-03 (missing audit trail): Backend, Security, Architecture
- H-10 (untested auth path): Backend, Security, Code Quality
- H-13 (client-server import): Frontend, Security, Architecture
- H-15 (date serialization): Backend, Frontend, Data Layer

### Known concerns addressed

All four known concerns from `known-concerns.md` are targeted:
1. Uncommitted infrastructure → H-10, H-14 (test infrastructure gaps)
2. Seeding/membership state → H-14, H-09 (membership reliability)
3. Runtime-vs-compile-time gaps → H-02, H-05, H-07, H-15 (boundary mismatches)
4. Shared-state test isolation → H-11, H-14 (test-reality divergence)

### Items NOT hypothesized (documented deferrals)

The following are explicitly deferred in phase-1.2-obligations.md or
exit criteria and are NOT treated as hypotheses:
- Balance Sheet report (exit criteria #45 DEFERRED)
- Pino redaction script (exit criteria #20 DEFERRED)
- API route integration tests (obligations, test gap #1)
- Multi-currency wiring (Phase 4 per PLAN.md §8b)
- Event sourcing activation (Phase 2 per Section 0 row 6)
- types.ts regeneration (obligations, schema reconciliation)
