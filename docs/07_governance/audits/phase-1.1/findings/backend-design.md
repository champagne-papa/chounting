# Backend Design & API — Findings Log

Scanner: Backend Design & API
Phase: End of Phase 1.1
Date: 2026-04-13
Hypotheses investigated: H-01, H-02, H-03, H-04, H-05, H-07, H-09, H-10

## Hypothesis Responses

### H-01: journalEntryService.post() lacks transaction wrapping across three sequential inserts

- **Status:** Confirmed
- **Evidence:** `src/services/accounting/journalEntryService.ts:92-150` performs three sequential Supabase `.insert()` calls — journal entry (line 92), journal lines (line 135), audit log via `recordMutation` (line 145). Each is a separate HTTP request to PostgREST and auto-committed independently. There is no `db.rpc()` wrapper, no BEGIN/COMMIT block, and no Supabase transaction API usage. If the lines insert fails (e.g., deferred balance constraint fires on COMMIT of the lines batch), the journal entry row persists as an orphan. If `recordMutation` fails, the entry and lines are committed but no audit trail exists for the mutation.
- **Notes for other scanners:** Data Layer scanner should verify whether PostgREST has any implicit per-request transaction grouping that might mitigate this. Architecture Fit scanner should assess whether this pattern is sustainable for Phase 1.2 agent-driven mutations where retry/idempotency makes partial commits more dangerous.

### H-02: Reversal mirror check uses Number() coercion instead of decimal.js

- **Status:** Confirmed
- **Evidence:** `src/services/accounting/journalEntryService.ts:208-209` defines `toMoney` as `(v: unknown): string => Number(v).toFixed(4)` and `toRate` as `(v: unknown): string => Number(v).toFixed(8)`. These use JavaScript `Number()` which has ~15 significant digits of precision. The canonical helpers `toMoneyAmount` and `toFxRate` in `src/shared/schemas/accounting/money.schema.ts:67-77` use `new Decimal(value).toFixed(4)` which has arbitrary precision. The database schema allows `numeric(20,4)` values up to 10^16, exceeding JS Number's safe integer range of ~9 x 10^15 (with 4 decimal places). For amounts above ~900 billion, the `Number()` path silently loses precision, potentially causing a valid mirror to fail validation or an invalid mirror to pass.
- **Notes for other scanners:** Code Quality scanner should check whether this local `Number()` pattern appears elsewhere in the codebase.

### H-03: orgService.createOrgWithTemplate has no audit trail

- **Status:** Confirmed
- **Evidence:** `src/services/org/orgService.ts:14-87` performs four mutating operations (insert org row line 21, insert CoA rows line 54, insert membership line 61, insert fiscal periods line 75) but never calls `recordMutation()`. Grep confirms `recordMutation` is imported and called only in `src/services/accounting/journalEntryService.ts:27,145`. Org creation is the only mutating service path in the codebase without an audit_log entry. CLAUDE.md Rule 6 requires `trace_id` propagation through "every layer including audit_log" — this path generates a `trace_id` via `buildServiceContext` but never writes it to audit_log.
- **Notes for other scanners:** Security & Compliance scanner should assess whether the missing audit trail creates a compliance gap for org provisioning events.

### H-04: entry_number computation uses MAX+1 without row-level locking

- **Status:** Confirmed (known, partially documented)
- **Evidence:** `src/services/accounting/journalEntryService.ts:77-86` computes `nextEntryNumber = (maxRow?.entry_number ?? 0) + 1` via a SELECT query with no `FOR UPDATE` lock. The comment on line 76 acknowledges this: "MAX + 1, no FOR UPDATE in Phase 1.1." The test coverage catalog (gap #7) documents "Concurrent access — no tests for concurrent journal entry posting (entry_number serialization)." The `phase-1.2-obligations.md` recurring pattern #4 references the entry_number collision from Phase 12A. However, the obligations doc discusses test isolation (shared state between test files), not the production concurrency issue — these are related but distinct problems. The obligation doesn't explicitly call out adding a `FOR UPDATE` lock or retry mechanism.
- **Notes for other scanners:** Data Layer scanner should verify the UNIQUE constraint on `(org_id, fiscal_period_id, entry_number)` exists and check whether it causes a clear error or a silent corruption on collision.

### H-05: Inconsistent response.ok checks in frontend fetch chains

- **Status:** Partially confirmed
- **Evidence:** The hypothesis claimed fetch calls uniformly lack `response.ok` checks. Investigation shows a mixed pattern:
  - **Missing `response.ok`:** `JournalEntryForm.tsx:131-133` (3 fetches for periods/accounts/tax codes), `BasicPLView.tsx:40-41` (period fetch), `BasicTrialBalanceView.tsx:29-30` (period fetch). These use `.then((r) => r.json())` directly — a non-2xx response will attempt to parse the error JSON body and silently treat it as valid data, setting dropdown arrays to empty via the nullish coalescing fallback (e.g., `data.periods ?? []`).
  - **Has `response.ok`:** `BasicPLView.tsx:64-68` (P&L data fetch), `JournalEntryDetailView.tsx:27-29`, `ChartOfAccountsView.tsx:29-31`, `ReversalForm.tsx:110-116` (both fetches), `JournalEntryListView.tsx:21-23`, `JournalEntryForm.tsx:228` (POST submit), `ReversalForm.tsx:202` (POST submit).

  The inconsistency is that reference data fetches (periods, accounts, tax codes) skip the check while primary data fetches include it. This means expired sessions cause silent empty dropdowns in the journal entry form — the user sees an empty period list with no error message, which is confusing but not data-corrupting.
- **Notes for other scanners:** Frontend Architecture scanner should assess the user experience impact and whether a shared fetch wrapper should be introduced.

### H-07: JournalEntryDetail uses plain string types instead of branded MoneyAmount

- **Status:** Confirmed (type-system concern, no runtime bug)
- **Evidence:** `src/services/accounting/journalEntryService.ts:274-289` declares `journal_lines[].debit_amount`, `credit_amount`, `amount_original`, `amount_cad`, and `fx_rate` as plain `string`, not as `MoneyAmount`/`FxRate`. The `get()` function (lines 415-422) coerces values through `toMoneyAmount`/`toFxRate` at the service boundary, producing canonical strings at runtime. However, consumers receiving `JournalEntryDetail` via the API see plain strings and must trust that the values conform to the branded type's format. The `mirrorLines` helper in `journalEntry.schema.ts:155-172` expects `MoneyAmount`/`FxRate` branded types, so the `ReversalForm` must cast the detail response values before calling `mirrorLines`. This works at runtime because `toMoneyAmount` output always matches `MoneyAmountSchema`'s regex (Decimal.toFixed(4) produces exactly 4 decimal places, which satisfies `/^-?\d{1,16}(\.\d{1,4})?$/`). The gap is type-system-only: the compiler cannot enforce that the cast is safe.
- **Notes for other scanners:** Code Quality scanner should check whether the `JournalEntryDetail` type could use `MoneyAmount`/`FxRate` directly without breaking the `as unknown as JournalEntryDetail` double assertion on line 411.

### H-09: orgService membership insert silently drops errors

- **Status:** Confirmed
- **Evidence:** `src/services/org/orgService.ts:61-65` awaits the membership insert but does not destructure or check the returned `{ data, error }` object. Compare with all other inserts in the same function: org insert (lines 21-33) checks `orgErr`, template query (lines 37-43) checks `tplErr`, CoA insert (line 54-56) checks `insertErr`, period insert (lines 75-78) checks `periodErr`. The membership insert is the sole unchecked mutation. The Supabase client does not throw on insert failure — it returns `{ data: null, error: {...} }`. So if the membership insert fails (e.g., duplicate user_id+org_id from a retry), the error is silently swallowed. The user's org is created with CoA and periods but no membership — the creating user cannot access their own org through RLS-filtered paths.
- **Notes for other scanners:** Data Layer scanner should check whether there's a UNIQUE constraint on `(user_id, org_id)` in the memberships table that could trigger this on retry.

### H-10: buildServiceContext is never exercised by integration tests

- **Status:** Confirmed
- **Evidence:** Grep for `buildServiceContext` across the entire `tests/` directory returns zero hits. All integration tests construct `ServiceContext` manually using hardcoded seed UUIDs (e.g., `tests/setup/testDb.ts` exports a `buildTestContext()` helper that creates a `ServiceContext` with `verified: true` without any JWT validation). The test coverage catalog gap #3 confirms "Auth flow — sign-in/sign-out not tested (depends on Supabase Auth, tested manually)." Gap #1 confirms "API route integration tests — no tests exercise the full HTTP request → route → service → DB → response chain." A bug in `buildServiceContext` (incorrect JWT validation, missing membership fetch, empty `org_ids` array) would not be caught by the integration test suite.
- **Notes for other scanners:** Security & Compliance scanner should assess the risk of the untested JWT validation path. Code Quality scanner should consider whether the test infrastructure gap widens as more routes are added in Phase 1.2.

## Findings

### BACKEND-001: No transaction atomicity for journal entry creation

- **Severity:** Critical
- **Description:** `journalEntryService.post()` performs three sequential Supabase REST API calls (insert journal entry, insert journal lines, write audit log) without any transaction wrapper. Each `.insert()` call is a separate HTTP POST to PostgREST, each auto-committed on success. If the journal lines insert fails after the journal entry insert succeeds, an orphaned `journal_entries` row exists in the database with no lines. The deferred balance constraint (`enforce_journal_entry_balance`) fires on `journal_lines` INSERT, so an entry with no lines has no constraint violation — it simply has no lines. The `recordMutation` audit log write is also outside the transaction boundary, so a mutation can succeed without its audit record.

  This is the highest-priority finding because Phase 1.2 introduces agent-driven mutations with retry semantics. An agent retry after a partial commit (entry created, lines failed) would need to detect and clean up the orphan before retrying — but the service has no mechanism for this, and the lack of `idempotency_key` enforcement in Phase 1.1 means there's no way to detect the duplicate.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:92-114` — journal entry insert, committed independently
  - `src/services/accounting/journalEntryService.ts:135-142` — journal lines insert, separate HTTP call
  - `src/services/accounting/journalEntryService.ts:145-150` — audit log insert via `recordMutation`, third independent call
  - `src/services/audit/recordMutation.ts:6` — comment says "Called inside the same database transaction as the mutation it records" but this is aspirational, not actual: the `db` parameter is the same `adminClient()` instance, not a transaction handle
- **Consequence:** Partial commits produce orphaned journal entries or un-audited mutations. Phase 1.2 agent retries on partial failures would cause data corruption.
- **Cross-references:**
  - H-01 (this finding's hypothesis)
  - Data Layer & Database Design — should investigate whether a Postgres function (RPC) could wrap all three inserts in a real BEGIN/COMMIT
  - Architecture Fit — PLAN.md Section 0 row 3 ("Simplification 1: synchronous audit log") may need to account for the transaction boundary gap

### BACKEND-002: Reversal mirror check uses JS Number instead of decimal.js

- **Severity:** Medium
- **Description:** The reversal mirror validation in `validateReversalMirror` defines local `toMoney` and `toRate` helper functions that coerce values through `Number().toFixed()`. The rest of the codebase uses `toMoneyAmount` / `toFxRate` (which use `decimal.js`) for the same purpose. This creates two code paths for the same operation. The `Number()` path loses precision for values exceeding ~9 x 10^15 (with 4 decimal places). While no family office is likely to post a single journal line for 900 billion CAD, the inconsistency violates CLAUDE.md Rule 3 ("Arithmetic on money happens in Postgres or via decimal.js — never via JS +, *"). The `Number().toFixed()` call is JS arithmetic on money values.

  Severity is medium rather than critical because the realistic value range for this family office makes precision loss improbable, and both `toMoneyAmount` and the local `toMoney` produce the same output for values within JS Number safe range.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:208` — `const toMoney = (v: unknown): string => Number(v).toFixed(4);`
  - `src/services/accounting/journalEntryService.ts:209` — `const toRate = (v: unknown): string => Number(v).toFixed(8);`
  - `src/shared/schemas/accounting/money.schema.ts:67-69` — canonical `toMoneyAmount` uses `new Decimal(value).toFixed(4)`
  - CLAUDE.md Rule 3 — "Arithmetic on money happens in Postgres or via decimal.js"
- **Consequence:** CLAUDE.md Rule 3 violation. If any journal entry ever contains a line with an amount exceeding ~900 billion, the reversal mirror check could silently pass for a non-mirror or reject a valid mirror.
- **Cross-references:**
  - H-02 (this finding's hypothesis)
  - Code Quality & Maintainability — duplicate helper pattern

### BACKEND-003: Org creation missing audit trail and membership error handling

- **Severity:** High
- **Description:** `orgService.createOrgWithTemplate` is the only mutating service path in the codebase that does not call `recordMutation()`. It performs four sequential mutations (insert org, insert CoA rows, insert membership, insert fiscal periods) with no audit log entry for any of them. Additionally, the membership insert on line 61-65 does not check the returned error — it's the only unchecked mutation in the function. A failed membership insert means the creating user's org exists with CoA and periods but the user has no membership, making the org inaccessible through normal RLS-filtered paths.

  These are two distinct problems in the same function (missing audit + unchecked error), combined into one finding because the root cause is the same: `createOrgWithTemplate` was written with a different level of rigor than `journalEntryService.post`.

- **Evidence:**
  - `src/services/org/orgService.ts:14-87` — no import or call to `recordMutation` anywhere in the file
  - `src/services/org/orgService.ts:61-65` — membership insert: `await db.from('memberships').insert({...})` with no `const { error }` destructuring
  - `src/services/org/orgService.ts:21-33,37-43,54-56,75-78` — all other inserts in the same function check for errors
  - `src/services/accounting/journalEntryService.ts:145-150` — comparison: journal entry path calls `recordMutation`
- **Consequence:** (1) Org creation events have no audit trail — post-incident investigation cannot determine who created an org or when. (2) A failed membership insert silently orphans an org, requiring manual database intervention to recover.
- **Cross-references:**
  - H-03 and H-09 (both confirmed)
  - Security & Compliance — missing audit trail for provisioning events

### BACKEND-004: Inconsistent response.ok checking in frontend fetch chains

- **Severity:** Medium
- **Description:** Frontend components use two different patterns for fetch error handling. Primary data fetches (P&L data, journal entry detail, journal entry list, chart of accounts view, reversal form sources, POST submissions) check `response.ok` before parsing. Reference data fetches (fiscal periods dropdown, chart of accounts dropdown, tax codes dropdown in `JournalEntryForm.tsx:131-133`; fiscal period dropdowns in `BasicPLView.tsx:40-41` and `BasicTrialBalanceView.tsx:29-30`) call `.then((r) => r.json())` directly without checking status.

  When these unchecked fetches receive a non-2xx response (expired session returns 401, server error returns 500), `r.json()` parses the error body (`{ error: "UNAUTHENTICATED", message: "..." }`). The subsequent property access (`data.periods ?? []`) evaluates to `[]` because the error response has no `periods` field — the dropdown silently renders empty with no error feedback to the user.

- **Evidence:**
  - `src/components/canvas/JournalEntryForm.tsx:131-133` — three fetches without `response.ok`
  - `src/components/canvas/BasicPLView.tsx:40-41` — period fetch without `response.ok`
  - `src/components/canvas/BasicTrialBalanceView.tsx:29-30` — period fetch without `response.ok`
  - `src/components/canvas/BasicPLView.tsx:64-68` — comparison: P&L data fetch checks `r.ok`
- **Consequence:** Expired sessions or API errors cause silent empty dropdowns in the journal entry form. User sees empty period/account lists with no indication of the cause. Not data-corrupting, but confusing and harder to debug than a clear error message.
- **Cross-references:**
  - H-05 (partially confirmed — not all fetches lack the check)
  - Frontend Architecture — should assess whether a shared fetch wrapper is warranted

### BACKEND-005: Org creation API route does not use serviceErrorToStatus

- **Severity:** Low
- **Description:** The org creation API route (`src/app/api/org/route.ts:34-38`) handles `ServiceError` with an inline status code mapping (`err.code === 'UNAUTHENTICATED' ? 401 : ...`) instead of using the shared `serviceErrorToStatus()` helper that all other API routes use. This means new `ServiceErrorCode` values added to the switch in `serviceErrorToStatus.ts` will not be reflected in the org creation route's error responses. Currently, the inline mapping is incomplete: it maps `UNAUTHENTICATED` to 401, `PERMISSION_DENIED`/`ORG_ACCESS_DENIED` to 403, and everything else to 500 — missing `TEMPLATE_NOT_FOUND`, `COA_LOAD_FAILED`, `PERIOD_GENERATION_FAILED`, and `ORG_CREATE_FAILED` which `serviceErrorToStatus` maps to 500 anyway. The practical impact is zero today but grows as error codes evolve.

- **Evidence:**
  - `src/app/api/org/route.ts:34-38` — inline `const status = err.code === 'UNAUTHENTICATED' ? 401 : ...`
  - `src/app/api/orgs/[orgId]/journal-entries/route.ts:59-60` — comparison: uses `serviceErrorToStatus(err.code)`
  - `src/app/api/orgs/[orgId]/chart-of-accounts/route.ts:23` — uses `serviceErrorToStatus`
  - `src/app/api/orgs/[orgId]/reports/pl/route.ts:23` — uses `serviceErrorToStatus`
- **Consequence:** Divergent error-to-HTTP mapping in one route. No current bug (all mapped codes produce the same status), but a maintenance trap as new error codes are added.
- **Cross-references:**
  - Code Quality & Maintainability — inconsistent patterns across routes

### BACKEND-006: chartOfAccountsService.get() lacks org authorization check

- **Severity:** Medium
- **Description:** `chartOfAccountsService.list()` correctly checks `ctx.caller.org_ids.includes(input.org_id)` before querying (line 20). But `chartOfAccountsService.get()` (lines 47-66) accepts an `account_id` and queries the database with no org-scoping filter. It does not check whether the returned account's `org_id` is in `ctx.caller.org_ids`. Since it uses `adminClient()` (bypassing RLS), a user who knows an account UUID from another org can read that account's details.

  The practical risk is low in Phase 1.1 (single-user local development), but this is a real authorization gap that would allow cross-org data reads if the function is exposed through an API route. Currently, `chartOfAccountsService.get()` is not called from any API route — it appears to be unused. The gap becomes relevant if Phase 1.2 agent tools call it.

- **Evidence:**
  - `src/services/accounting/chartOfAccountsService.ts:47-66` — `get()` function: no `org_ids.includes()` check, no `.in('org_id', ctx.caller.org_ids)` filter
  - `src/services/accounting/chartOfAccountsService.ts:20` — comparison: `list()` checks `ctx.caller.org_ids.includes(input.org_id)`
  - `src/services/accounting/journalEntryService.ts:382` — comparison: `get()` uses `.in('org_id', ctx.caller.org_ids)`
- **Consequence:** Cross-org account detail read via `adminClient` without authorization check. Currently unexposed via API routes, but a latent gap for Phase 1.2 agent integration.
- **Cross-references:**
  - Security & Compliance — authorization gap
  - H-06 (related hypothesis about read-path authorization, assigned to Security scanner)

### BACKEND-007: recordMutation comment claims transactional semantics that don't exist

- **Severity:** Medium
- **Description:** `src/services/audit/recordMutation.ts` has two comments asserting transactional behavior that doesn't hold:
  - Line 2: "Called inside the same database transaction as the mutation it records"
  - Lines 28-31 (JSDoc): "Accepts a SupabaseClient rather than creating its own so the caller can pass the same client (and therefore the same transaction) that is performing the mutation. This guarantees the audit row is committed atomically with the data change"

  The Supabase JS client v2 does not provide transaction handles. Passing the same `adminClient()` instance ensures the same HTTP connection parameters but not the same database transaction. Each `.insert()` call is a separate HTTP POST to PostgREST, each auto-committed. The comments describe the *intended design* (which is correct per PLAN.md), but the *implementation* does not deliver transactional atomicity. This misleading documentation could cause future developers to trust the atomicity guarantee and skip defensive measures.

- **Evidence:**
  - `src/services/audit/recordMutation.ts:2` — "Called inside the same database transaction"
  - `src/services/audit/recordMutation.ts:28-31` — "This guarantees the audit row is committed atomically"
  - `src/services/accounting/journalEntryService.ts:50,145` — `adminClient()` created once, passed to `recordMutation`, but no transaction API used
- **Consequence:** Misleading comments create false confidence in atomicity. Future developers may not add defensive measures because they believe the audit write is already transactional.
- **Cross-references:**
  - BACKEND-001 (same root cause: no transaction wrapping)
  - Architecture Fit — PLAN.md Simplification 1 ("synchronous audit log") assumes transaction co-location that isn't implemented

### BACKEND-008: JournalEntryDetail money fields typed as plain string instead of MoneyAmount

- **Severity:** Low
- **Description:** The `JournalEntryDetail` type (`journalEntryService.ts:274-289`) declares `debit_amount`, `credit_amount`, `amount_original`, `amount_cad`, and `fx_rate` as plain `string` rather than branded `MoneyAmount`/`FxRate`. The `get()` function coerces these values through `toMoneyAmount`/`toFxRate` at lines 415-422, so runtime values are always canonical. But the TypeScript compiler cannot enforce this — consumers can pass uncoerced strings where `MoneyAmount` is expected. The `mirrorLines` helper in `journalEntry.schema.ts:155-172` expects branded types in `MirrorableLine`, requiring an unsafe cast in the `ReversalForm`. No runtime bug exists because `toMoneyAmount` output always matches the branded type's format, but the type gap means the compiler can't catch a future regression where the coercion is accidentally removed.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:274-289` — plain `string` types
  - `src/services/accounting/journalEntryService.ts:411` — `as unknown as JournalEntryDetail` double assertion
  - `src/shared/schemas/accounting/journalEntry.schema.ts:155-164` — `MirrorableLine` expects `MoneyAmount`/`FxRate`
- **Consequence:** Type-system gap only. No runtime bug today, but the compiler cannot prevent future regressions if the `toMoneyAmount` coercion in `get()` is accidentally removed.
- **Cross-references:**
  - H-07 (confirmed as type-system concern)
  - Code Quality & Maintainability — type safety gap

## Category Summary

The backend service layer is architecturally sound — Law 1 (all DB through services) and Law 2 (all journal entries through `journalEntryService.post`) are strictly enforced, `withInvariants` is correctly applied to both mutating routes, and the `ServiceError` → `serviceErrorToStatus` error chain is mostly consistent. The single most critical issue is **BACKEND-001: the absence of transaction atomicity across the journal entry creation path**. The three sequential Supabase REST calls (insert entry, insert lines, write audit log) are individually auto-committed, meaning a partial failure produces orphaned data or un-audited mutations. This is the issue most likely to cause real problems in Phase 1.2 when agent-driven mutations with retry semantics are introduced. The remaining findings (reversal Number() coercion, org service gaps, frontend fetch inconsistency, type-system gaps) are real but lower priority. Self-audit note: as the same instance that helped build Phase 1.1, I may have unconsciously softened the assessment of patterns I helped design — particularly the `recordMutation` transactional-comments finding (BACKEND-007) which describes documentation I wrote.
