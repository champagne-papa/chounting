# Testing Strategy

What to test, how to test it, and what not to test. The service layer
is where all business logic lives (INV-SERVICE-001), so it is the
only layer whose correctness matters at the unit level.

Source: extracted from PLAN.md §10a during Phase 1.1 closeout
restructure.

---

## Category A Floor Tests

The five Category A integration tests are the floor, not the ceiling.
They prove the invariants cannot be bypassed. They do not prove that
the service functions compute the right answer — unit tests do that.

| # | Test file | Invariant |
|---|---|---|
| 1 | `unbalancedJournalEntry.test.ts` | INV-LEDGER-001 — deferred constraint |
| 2 | `lockedPeriodRejection.test.ts` | INV-LEDGER-002 — period lock trigger |
| 3 | `crossOrgRlsIsolation.test.ts` | INV-RLS-001 — cross-org RLS |
| 4 | `serviceMiddlewareAuthorization.test.ts` | INV-AUTH-001 — withInvariants() |
| 5 | `reversalMirror.test.ts` | INV-REVERSAL-001 — reversal mirror check |

---

## What to Unit-Test and How

- **Service functions are the target.** Not components, not API
  routes, not tools. The service layer is where all business logic
  lives (INV-SERVICE-001) so it is the only layer whose correctness
  matters at the unit level.
- **Do not mock the database with an in-memory fake.** Fakes drift
  from real Postgres behavior (deferred constraints, RLS, triggers).
  Run unit tests against a throwaway Supabase test schema that is
  reset between tests (`TRUNCATE ... CASCADE` in an `afterEach`).
  This is closer to a fast integration test than a classic unit test,
  and that is correct for this codebase.
- **Do mock the outside world.** Anthropic API calls, Flinks,
  Supabase Storage, email inbound — anything over the network is
  mocked at the module boundary, not inside the service function.

---

## Database Connection Parameterization

Integration and unit tests read the Supabase URL and service-role
key from environment variables with a documented fallback chain:

1. `SUPABASE_TEST_URL` / `SUPABASE_TEST_SERVICE_ROLE_KEY` (test-
   specific)
2. `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (normal env vars)
3. Local Supabase defaults (`http://localhost:54321` and the fixed
   local dev key printed by `supabase status`)

**No test file may hardcode `http://localhost:54321` or any local dev
key.** This rule exists so that the Phase 1.3 switch from local
Supabase to remote Supabase dev project is a config change (two env
vars in CI and in `.env.test.local`), not a code change that touches
every test file.

---

## Coverage Targets

Not enforced by CI in Phase 1 — written expectations:

- `journalEntryService.post` and its invariant helpers: **80%+**.
  This is the one function that writes money.
- Other mutating services (`chartOfAccountsService.create`,
  `periodService.lock`): **60%+**.
- Read-only services (list/get/search): smoke-test only — exercised
  indirectly by integration tests.

---

## Conventions

- **Test names are assertions, not descriptions.**
  `post_rejects_unbalanced_entry`, not `should reject unbalanced
  entries`. Grep-friendly and unambiguous when a test fails in CI
  logs.
- **Fixtures live with the test file,** not in a `__fixtures__`
  folder at the repo root. Locality beats DRY for test data.

---

## What NOT to Test

Next.js route handlers, React components (other than the
ProposedEntryCard snapshot in Phase 1.2), Supabase client
initialization, environment config loading. These are either
framework code or configuration — covered implicitly by the
integration tests passing.

---

## Test File Layout

```
tests/integration/                              # 7 files, 26 tests
  unbalancedJournalEntry.test.ts                # Category A floor #1
  lockedPeriodRejection.test.ts                 # Category A floor #2
  crossOrgRlsIsolation.test.ts                  # Category A floor #3
  serviceMiddlewareAuthorization.test.ts         # Category A floor #4
  reversalMirror.test.ts                         # Category A floor #5
  reportProfitAndLoss.test.ts                    # P&L correctness
  reportTrialBalance.test.ts                     # Trial Balance correctness
tests/unit/                                      # 4 files, 49 tests
  generateFiscalPeriods.test.ts
  journalEntrySchema.test.ts
  mirrorLines.test.ts
  moneySchema.test.ts
```
