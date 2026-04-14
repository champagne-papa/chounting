# Phase 1.1 Test Coverage Catalog

Generated during Task 18 of the Phase 1.1 closeout, 2026-04-13.

## Integration tests: 26 tests across 7 files

### Category A Floor Tests (correctness invariants)

**1. unbalancedJournalEntry.test.ts** (1 test)
- Verifies: deferred constraint rejects entries where total debits != total credits
- Invariant: every journal entry must balance (PLAN.md Invariant 5)
- Gap: only tests rejection; does not test that a balanced entry is accepted (covered implicitly by other tests that post entries)

**2. lockedPeriodRejection.test.ts** (1 test)
- Verifies: period lock trigger rejects writes to locked fiscal periods
- Invariant: locked periods are immutable (PLAN.md §7)
- Gap: only tests INSERT rejection; does not test that UPDATE/DELETE on entries in locked periods are also rejected (covered by RLS no-update/no-delete policies)

**3. crossOrgRlsIsolation.test.ts** (12 tests)
- Verifies: RLS policies prevent cross-org data access across 6 tenant-scoped tables
- Tests: AP Specialist (single-org user) cannot read Holding Co data; CAN read their own org's data
- Tables covered: chart_of_accounts, fiscal_periods, journal_entries, journal_lines, audit_log, tax_codes
- Invariant: tenant isolation (PLAN.md §2c)
- Gap: does not test organizations or memberships tables (different RLS patterns). Does not test INSERT/UPDATE/DELETE cross-org — only SELECT.

**4. serviceMiddlewareAuthorization.test.ts** (1 test)
- Verifies: withInvariants() middleware rejects callers without membership in the target org before any DB write
- Invariant: CLAUDE.md Rule 2, PLAN.md §15e Layer 2
- Gap: tests only the journal_entry.post action. Other actions (org.create) not tested here.

**5. reversalMirror.test.ts** (3 tests)
- Verifies: reversal mirror check rejects non-mirror reversals, rejects empty reversal_reason, accepts correct mirrors
- Invariant: CLAUDE.md Rule 7, ADR-001
- Gap: does not test partial reversals (deferred to Phase 2+ per spec)

### Report Aggregation Tests (correctness verification)

**6. reportProfitAndLoss.test.ts** (4 tests)
- Verifies: P&L aggregation produces correct totals for revenue/expense entries
- Tests: 5 rows returned, single revenue entry, revenue+expense scenario, reversal netting (Q21a)
- Uses baseline-delta pattern for shared-state independence
- Gap: does not test period filtering (all tests use a single period). Does not test multi-currency (Phase 1.1 is CAD-only).

**7. reportTrialBalance.test.ts** (4 tests)
- Verifies: Trial Balance shows all accounts (including zero-balance), footer balances, per-account totals correct
- Tests: 16 accounts returned, footer debits == credits, balanced entry reflected, zero-balance accounts appear
- Uses baseline-delta pattern
- Gap: same as P&L — no period filtering test, no multi-currency test.

## Unit tests: 49 tests across 4 files

**1. journalEntrySchema.test.ts** (13 tests)
- Covers: PostJournalEntryInput Zod schema validation (balanced entries, reversal inputs, line validation)

**2. moneySchema.test.ts** (21 tests)
- Covers: MoneyAmountSchema, FxRateSchema, addMoney, multiplyMoneyByRate, eqMoney, toMoneyAmount, toFxRate

**3. mirrorLines.test.ts** (6 tests)
- Covers: mirrorLines pure function (debit/credit swap, FX rate preservation)

**4. generateFiscalPeriods.test.ts** (9 tests)
- Covers: fiscal period generation for different start months, year boundaries

## What's NOT covered by automated tests

1. **API routes** — no integration tests exercise the HTTP layer (routes are tested indirectly via service calls)
2. **UI components** — no component tests (React Testing Library not configured)
3. **Auth flow** — sign-in/sign-out not tested (depends on Supabase Auth, tested manually)
4. **Period filtering in reports** — tests only verify "all periods" aggregation
5. **Multi-currency arithmetic** — Phase 1.1 is CAD-only; FX rate is always 1.0 in tests
6. **Org creation e2e** — orgService.createOrgWithTemplate not exercised by integration tests
7. **Concurrent access** — no tests for concurrent journal entry posting (entry_number serialization)
8. **Audit log content** — recordMutation is called but audit_log rows are not asserted in tests

## Phase 1.2 test obligations

1. Add API route integration tests (exercise the HTTP layer including auth)
2. Add org creation integration test
3. Add period-filtered report test
4. Add audit_log content assertion to existing mutation tests
5. Consider component tests for form validation behavior
