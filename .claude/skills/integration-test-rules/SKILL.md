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
