---
name: integration-test-rules
description: Rules for integration tests — env-var cascade, no hardcoded localhost URLs, the five Category A floor tests. Load when working in tests/integration/.
trigger: Work in `tests/integration/` or when running Category A floor tests.
---

# Integration Test Rules

**Canonical source:** `docs/04_engineering/testing_strategy.md`.
This skill summarizes and points.

## 1. No hardcoded localhost URLs or keys

No test file may hardcode `http://localhost:54321`, `127.0.0.1:54321`,
or any local Supabase key. Tests read from:

- **URL:** `SUPABASE_TEST_URL` → `SUPABASE_URL` → error
- **Service role key:** `SUPABASE_TEST_SERVICE_ROLE_KEY` →
  `SUPABASE_SERVICE_ROLE_KEY` → error

A grep-fail CI check (`pnpm test:no-hardcoded-urls`) rejects any
file under `tests/` or `src/` containing the literal
`localhost:54321` or `127.0.0.1:54321`.

## 2. The five Category A floor tests

These five integration tests are the non-negotiable invariant-proof
set. Run `pnpm agent:floor` to execute all five:

| Test file | Proves |
|---|---|
| `tests/integration/unbalancedJournalEntry.test.ts` | INV-LEDGER-001 — debits must equal credits per entry |
| `tests/integration/lockedPeriodRejection.test.ts` | INV-LEDGER-002 — posting to a locked period is rejected |
| `tests/integration/crossOrgRlsIsolation.test.ts` | INV-RLS-001 — cross-org data is never visible outside the org |
| `tests/integration/serviceMiddlewareAuthorization.test.ts` | INV-AUTH-001 — every mutating service call is authorized |
| `tests/integration/reversalMirror.test.ts` | INV-REVERSAL-001 — reversals mirror the original with debit/credit swapped |

`pnpm agent:validate` runs `pnpm typecheck && pnpm
test:no-hardcoded-urls && pnpm agent:floor` as the shipping check.

Full contract (including Category A rationale, how it relates to
Category B / C tests, and the audit-side evidence table): see
`docs/04_engineering/testing_strategy.md` and
`docs/06_audit/control_matrix.md`.

## 3. Dedicated test-accounts pattern for chart_of_accounts pollution

Integration tests that post journal entries to seeded
`chart_of_accounts` entries collide with other test files asserting
specific zero-balances on those accounts (e.g.,
`reportTrialBalance.test.ts` asserts account_code `2200` has zero
debit/credit). Even with sequential file execution
(`fileParallelism: false`) and clean afterAll cleanup, mid-test
pollution surfaces if any assertion fails before the cleanup-array
push, leaving leaked rows on seeded codes that subsequent file
assertions check.

The pattern: any integration test that posts JEs (via
`journalEntryService.post` directly, or through any service that
delegates to the journal-entry path like
`vendorPrepaymentService.apply`) creates dedicated test
`chart_of_accounts` entries in `beforeAll` and deletes them in
`afterAll` after journal_lines + journal_entries cleanup.

Implementation (canonical pattern from
`apps/web/tests/integration/vendorPrepaymentApply.test.ts`):

```typescript
// In beforeAll, derive per-run unique account_codes from traceId
// to avoid UNIQUE(org_id, account_code) collision across runs:
const apCode = `T${traceId.slice(0, 8)}_AP`;
const vpaCode = `T${traceId.slice(0, 8)}_VPA`;

const { data: created, error: coaErr } = await db
  .from('chart_of_accounts')
  .insert([
    {
      org_id: SEED.ORG_HOLDING,
      account_code: apCode,
      account_name: 'TEST AP control proxy',
      account_type: 'liability',
    },
    {
      org_id: SEED.ORG_HOLDING,
      account_code: vpaCode,
      account_name: 'TEST vendor prepayment asset proxy',
      account_type: 'asset',
    },
  ])
  .select('account_id, account_code');

if (coaErr || !created || created.length !== 2) {
  throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
}

apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
vpAssetAccountId = created.find((c) => c.account_code === vpaCode)!.account_id;

// Use apControlAccountId / vpAssetAccountId for JE line account references.

// In afterAll, after deleting journal_lines + journal_entries:
if (apControlAccountId && vpAssetAccountId) {
  await db
    .from('chart_of_accounts')
    .delete()
    .in('account_id', [apControlAccountId, vpAssetAccountId]);
}
```

Trigger: any integration test that calls `journalEntryService.post`
directly OR through a mutating service that posts JEs (e.g.,
`vendorPrepaymentService.apply`). Tests that don't post JEs (Zod
boundary tests, status function tests, read-only service tests) don't
need the pattern.

Precedent: Phase 5 chunk B5-1 substantive session #2 (2026-05-10).
Pattern codified mid-session at session #2 after
`reportTrialBalance.test.ts` collision surfaced during full-suite
verification post-substrate-drafting; refactored across 4 test files
(`vendorPrepaymentApply.test.ts` + 3 EC-A-* per-criterion tests). See
`docs/07_governance/friction-journal.md` Phase 5 chunk B5-1 closeout
retrospective entry (2026-05-10) Adjudication 6 for the codification
adjudication.
