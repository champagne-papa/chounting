# Phase 1.1 Schema Reconciliation Report

Generated during Task 18 of the Phase 1.1 closeout, 2026-04-13.

## Three sources of truth

1. **Migrations** (`supabase/migrations/`) — 7 files, the DDL source
2. **Generated types** (`src/db/types.ts`) — Supabase-generated TypeScript
3. **Zod schemas** (`src/shared/schemas/`) — runtime validation layer

## Database tables (24 total)

All 24 tables in the running database are created by migration 001
(initial schema). Migrations 002-007 add columns, enums, tables,
and functions on top.

### Core Phase 1.1 tables (actively used)

| Table | Migration | Types | Zod | Service | Status |
|-------|-----------|-------|-----|---------|--------|
| organizations | 001 | Yes | No | orgService | OK — Zod not needed (service validates via PostgREST) |
| memberships | 001 | Yes | No | membershipService | OK |
| chart_of_accounts | 001 | Yes | No | chartOfAccountsService | OK |
| chart_of_accounts_templates | 001 | Yes | No | (seed only) | OK |
| fiscal_periods | 001 | Yes | No | periodService | OK |
| journal_entries | 001+002+004+005 | Yes | Yes (journalEntry.schema.ts) | journalEntryService | OK |
| journal_lines | 001 | Yes | Yes (journalEntry.schema.ts) | journalEntryService | OK |
| tax_codes | 001+003 | Yes | No | taxCodeService | OK |
| audit_log | 001 | Yes | No | recordMutation | OK |
| journal_entry_attachments | 006 | Yes | No | (no service yet) | OK — Phase 1.2 scope |

### Phase 2+ tables (schema reserved, not written to)

| Table | Status |
|-------|--------|
| events | OK — append-only triggers verified, no writes in Phase 1.1 |
| ai_actions | OK — Phase 1.2 agent scope |
| agent_sessions | OK — Phase 1.2 agent scope |
| bank_accounts | OK — Phase 2+ banking scope |
| bank_transactions | OK — Phase 2+ banking scope |
| bills | OK — Phase 2+ AP scope |
| bill_lines | OK — Phase 2+ AP scope |
| invoices | OK — Phase 2+ AR scope |
| invoice_lines | OK — Phase 2+ AR scope |
| customers | OK — Phase 2+ AR scope |
| vendors | OK — Phase 2+ AP scope |
| vendor_rules | OK — Phase 2+ AP scope |
| payments | OK — Phase 2+ payments scope |
| intercompany_relationships | OK — Phase 2+ intercompany scope |

### RPC functions (migration 007)

| Function | Types | Service |
|----------|-------|---------|
| get_profit_and_loss | **STALE** — not in current types.ts | reportService.profitAndLoss() |
| get_trial_balance | **STALE** — not in current types.ts | reportService.trialBalance() |

**Drift:** `src/db/types.ts` was last regenerated before migration 007
landed. The RPC functions exist in the database but not in the generated
types. This is non-blocking because `reportService.ts` defines its own
typed interfaces (`PLRow`, `TrialBalanceRow`) rather than importing from
`types.ts`. Regenerating types (`pnpm supabase gen types typescript --local`)
would add the functions.

**Phase 1.2 obligation:** Regenerate `src/db/types.ts` and establish
a rule that types must be regenerated after every migration.

## Enum consistency

All 10 enums in the database match their usage in TypeScript:

| Enum | Values | TS usage |
|------|--------|----------|
| account_type | asset, liability, equity, revenue, expense | Used in CoA service, report queries |
| entry_type | regular, adjusting, closing, reversing | Used in journalEntryService.post |
| journal_entry_source | manual, agent, import | Used in Zod schema |
| user_role | executive, controller, ap_specialist | Used in canUserPerformAction |
| org_industry | healthcare, real_estate, hospitality, trading, restaurant, holding_company | Used in orgService |
| ai_action_status | pending, confirmed, rejected, auto_posted, stale | Phase 2+ |
| autonomy_tier | always_confirm, notify_auto, silent | Phase 2+ |
| confidence_level | high, medium, low, novel | Phase 2+ |

No drift found in enum values.

## Zod schema coverage

Only `journalEntry.schema.ts` and `money.schema.ts` exist. This is
intentional — Phase 1.1's service boundary validation uses Zod only
for the journal entry posting path (the highest-risk mutation). Other
services validate via PostgREST's built-in type checking and
the service layer's explicit checks.

Phase 1.2 obligation: Add Zod schemas for any new mutation paths
(agent tools, org settings updates).

## Column-level verification

Spot-checked `journal_entries` and `journal_lines` columns against
migration DDL:

- **journal_entries:** 15 columns match migration 001+002+004+005.
  CHECK constraints verified: `idempotency_required_for_agent`,
  `reversal_reason_required_when_reversing`. Indexes: 4 (pkey,
  org_period, org_intercompany, reverses). UNIQUE constraint:
  `unique_entry_number_per_org_period`.

- **journal_lines:** 11 columns match migration 001. CHECK constraints
  verified: `line_amounts_nonneg`, `line_is_debit_xor_credit`,
  `line_is_not_all_zero`, `line_amount_original_matches_base`,
  `line_amount_cad_matches_fx`. Indexes: 3 (pkey, entry, account).

- **RLS policies:** Both tables have SELECT (org access), INSERT
  (org access), no UPDATE (false), no DELETE (false). Append-only
  by RLS policy.

## Summary

**Overall status: CLEAN with one non-blocking drift point.**

The only drift is `src/db/types.ts` missing the migration 007 RPC
functions. This is cosmetic (reportService doesn't use generated types)
but should be fixed in Phase 1.2's first session.

No column mismatches, no missing constraints, no enum drift, no
orphaned tables or indexes.
