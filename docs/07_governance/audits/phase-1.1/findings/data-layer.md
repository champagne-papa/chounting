# Data Layer & Database Design — Findings Log

Scanner: Data Layer & Database Design
Phase: End of Phase 1.1
Date: 2026-04-13
Hypotheses investigated: H-01, H-04, H-08, H-09, H-11, H-14, H-15

## Hypothesis Responses

### H-01: journalEntryService.post() lacks transaction wrapping — data-layer angle

- **Status:** Confirmed (complementing Scan 1's BACKEND-001 from the constraint-semantics side)
- **Evidence:** The deferred balance constraint is defined at `supabase/migrations/20240101000000_initial_schema.sql:275-279` as `AFTER INSERT OR UPDATE OR DELETE ON journal_lines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW`. This means the constraint fires at COMMIT of the transaction containing the journal_lines insert. In the current architecture, each Supabase `.insert()` call is a separate HTTP POST to PostgREST, each auto-committed. The journal_lines batch insert IS a single HTTP POST (one transaction), so the deferred constraint fires at that transaction's COMMIT and correctly rejects unbalanced entries. However, the journal_entries insert (prior transaction, already committed) and the audit_log insert (later transaction) are each in their own auto-committed transactions. If the lines transaction fails (balance check rejects), the journal_entries row persists as an orphan. The deferred constraint is not theatre — it correctly enforces balance within the lines transaction. But it cannot provide atomicity across the three separate transactions.
- **Notes for other scanners:** Architecture Fit scanner should assess whether wrapping all three inserts in a Postgres RPC function (analogous to migration 007's read RPCs) would solve both the atomicity and the deferred-constraint-scope issues. The `test_post_balanced_entry` and `test_post_unbalanced_entry` helpers in `tests/setup/test_helpers.sql` already demonstrate this pattern — they wrap entry + lines inserts in a single `plpgsql` function, and the deferred constraint fires at the function's transaction COMMIT, correctly covering all lines.

### H-04: entry_number MAX+1 without locking — data-layer angle

- **Status:** Confirmed (UNIQUE constraint provides safety net)
- **Evidence:** The UNIQUE constraint `unique_entry_number_per_org_period` on `(org_id, fiscal_period_id, entry_number)` is defined in `supabase/migrations/20240104000000_add_entry_number.sql:34-35`. On concurrent collision, the second INSERT would fail with a unique constraint violation error (`23505`). The service at `journalEntryService.ts:116-118` catches insert errors and throws `ServiceError('POST_FAILED', ...)` — the user would see a 500 error, not silent data corruption. The UNIQUE constraint converts what could be silent corruption into a clear (if unfriendly) error. No retry-with-increment mechanism exists.
- **Notes for other scanners:** Backend Design scanner already confirmed the service-side issue (BACKEND-001 H-04 response). The data layer's UNIQUE constraint is the correct safety net — the fix belongs in the service (retry or `SELECT ... FOR UPDATE`), not in the schema.

### H-08: RLS policies on admin-only tables are SELECT-only by design

- **Status:** Refuted (the hypothesis framed this as a potential gap, but the evidence shows it is intentional defense-in-depth)
- **Evidence:** The following tables have SELECT-only RLS policies with no INSERT/UPDATE/DELETE policies:
  - `organizations` — `organizations_select` at migration 001:668-669
  - `memberships` — `memberships_select` at 001:671-674
  - `audit_log` — `audit_log_select` at 001:797-798
  - `events` — `events_select` at 001:810-811 (plus append-only triggers at 001:579-596)

  All writes to these tables go through `adminClient()` which uses the service-role key and bypasses RLS entirely. The absence of INSERT policies means user-context clients (anon key) are blocked from writing to these tables by RLS deny-by-default. This is defense-in-depth: even if a code path accidentally uses the user client instead of the admin client for a write, RLS blocks it. The pattern is consistent across all admin-only tables.
- **Notes for other scanners:** Security & Compliance scanner should verify this pattern is acceptable from a compliance perspective and consider whether it should be documented as an explicit architectural decision.

### H-09: memberships UNIQUE constraint enables silent failure on retry — data-layer angle

- **Status:** Confirmed (complementing Scan 1's BACKEND-003)
- **Evidence:** The memberships table has `UNIQUE (user_id, org_id)` at `migration 001:94`. If `orgService.createOrgWithTemplate` is retried after a partial success (org created, membership failed, then retry creates org again — blocked by unique org name — or org succeeds on first try but membership fails), a retry of the membership insert with the same `(user_id, org_id)` would hit this UNIQUE constraint. Since the service silently drops the membership insert error (Scan 1 BACKEND-003/H-09), the UNIQUE violation would be swallowed. The result: the user sees success but has no membership to their org. The UNIQUE constraint is correct (prevents duplicate memberships), but its interaction with the unchecked error path creates a silent failure mode.
- **Notes for other scanners:** Already covered by Scan 1 BACKEND-003. The data-layer contribution is confirming the UNIQUE constraint exists and understanding why the error is a constraint violation specifically.

### H-11: Cross-org INSERT RLS policies exist and use org-scoped checks

- **Status:** Confirmed (policies exist; untested status is a testing gap, not a policy gap)
- **Evidence:** INSERT policies with org-scoped `WITH CHECK` clauses exist on all four tables listed in the hypothesis:
  - `chart_of_accounts`: `chart_of_accounts_insert` at 001:678-679 — `WITH CHECK (user_has_org_access(org_id))`
  - `fiscal_periods`: `fiscal_periods_insert` at 001:688-689 — `WITH CHECK (user_is_controller(org_id))` (requires controller role, stricter than access check)
  - `journal_entries`: `journal_entries_insert` at 001:700-701 — `WITH CHECK (user_has_org_access(org_id))`
  - `journal_lines`: `journal_lines_insert` at 001:715-722 — `WITH CHECK (EXISTS (SELECT 1 FROM journal_entries je WHERE je.journal_entry_id = journal_lines.journal_entry_id AND user_has_org_access(je.org_id)))` (org check via parent entry)

  All four use `user_has_org_access()` or `user_is_controller()` which query the memberships table for `auth.uid()`. The policies are structurally sound. Additionally, journal entries and lines have explicit UPDATE/DELETE deny policies (`USING (false)`) at 001:702-705 and 001:723-726, enforcing append-only semantics via RLS.
  
  The hypothesis correctly notes these are untested — the cross-org RLS test (`crossOrgRlsIsolation.test.ts`) only tests SELECT operations. But since all writes go through `adminClient()` (bypassing RLS), these INSERT policies are defense-in-depth, not the primary enforcement mechanism. The primary enforcement is `withInvariants` Invariant 3 in the service layer.
- **Notes for other scanners:** Code Quality / Testing scanner should assess whether the untested INSERT policies are acceptable given that `adminClient` bypasses them. The policies are correct but have never been exercised.

### H-14: Seed memberships between auth users and orgs

- **Status:** Refuted
- **Evidence:** `src/db/seed/dev.sql:30-42` explicitly creates memberships between all three seed auth users and their respective orgs:
  - Executive (`00000000-...001`) → both orgs (lines 31-33)
  - Controller (`00000000-...002`) → both orgs (lines 36-38)
  - AP Specialist (`00000000-...003`) → real estate only (line 41-42)

  The seed script `package.json:20` defines `db:seed:all` as `pnpm db:seed:auth && pnpm db:seed` — auth users are created first (via `scripts/seed-auth-users.ts` which creates users with fixed UUIDs matching `testDb.ts:27-31`), then `dev.sql` runs and creates orgs + memberships with FKs satisfied by the already-existing auth users. The UUIDs in dev.sql match the SEED constants in `tests/setup/testDb.ts:26-32`.

  The friction journal's claim that "seeded auth users don't have memberships in seeded orgs" was likely about running `pnpm db:reset` (which only applies migrations, no seed) without following up with `pnpm db:seed:all`. The code itself correctly creates memberships when the full seed path is executed.
- **Notes for other scanners:** The `db:reset` command alone does not seed data — only `db:seed:all` does. This could cause confusion if a developer runs `db:reset` and expects a ready-to-use database.

### H-15: Date serialization across boundaries — data-layer angle

- **Status:** Inconclusive (no evidence of current breakage, but the boundary is fragile)
- **Evidence:** PostgreSQL `date` columns (e.g., `journal_entries.entry_date`, `fiscal_periods.start_date/end_date`) are serialized by PostgREST as `YYYY-MM-DD` strings. The Zod schema validates `entry_date` with `z.string().date()` at `journalEntry.schema.ts:94` which expects exactly `YYYY-MM-DD` format. These match. The integration test helper `test_helpers.sql:22` uses `current_date` which produces `YYYY-MM-DD`. The dev.sql seed at lines 46-53 uses `date_trunc()::date` which also produces `YYYY-MM-DD`. No evidence of any layer transforming dates to ISO 8601 timestamps.

  However, the Supabase JS client's behavior for `date` vs `timestamptz` columns is not contractually guaranteed. If a future Supabase client version changed its date serialization, the Zod validation would reject on the return path. This is a standard external-boundary risk with no current evidence of breakage.
- **Notes for other scanners:** Frontend Architecture scanner should verify the ReversalForm's `entry_date` round-trip (fetch detail → populate form → POST reversal) works correctly end-to-end with the current date format.

## Findings

### DATALAYER-001: Deferred balance constraint is effective within PostgREST auto-commit but cannot provide cross-insert atomicity

- **Severity:** High
- **Description:** The deferred balance constraint (`trg_enforce_journal_entry_balance`, migration 001:275-279) is `DEFERRABLE INITIALLY DEFERRED` and fires at transaction COMMIT. In the current architecture, the journal_lines `.insert()` call is a single HTTP POST to PostgREST, constituting one auto-committed transaction. The constraint fires at that transaction's COMMIT and correctly rejects unbalanced line sets — this is verified by integration test 1 (`unbalancedJournalEntry.test.ts`) which calls `test_post_unbalanced_entry`, a plpgsql function that wraps the entry + lines inserts in a single transaction.

  The constraint is not theatre: it does enforce balance. But the deferred-to-COMMIT semantics mean it fires at the PostgREST auto-commit boundary, not at an application-level transaction boundary. The three separate auto-committed transactions (entry, lines, audit_log) mean the constraint can only protect the lines batch in isolation. An orphaned journal_entries row (entry committed, lines rejected by the constraint) would exist with no lines and no constraint violation — the constraint checks `journal_lines WHERE journal_entry_id = NEW.journal_entry_id`, and an entry with zero lines produces `COALESCE(SUM(debit_amount), 0) = 0 = COALESCE(SUM(credit_amount), 0)`, which passes.

  The test helpers (`test_helpers.sql:1-65`) demonstrate the solution: wrap entry + lines inserts in a plpgsql function. Within a single function call, the deferred constraint fires at the function's transaction COMMIT, covering all lines. Migration 007 already uses this pattern for read RPCs. A write RPC would solve both the atomicity gap (BACKEND-001) and ensure the deferred constraint operates at the correct boundary.

- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:275-279` — `DEFERRABLE INITIALLY DEFERRED FOR EACH ROW`
  - `supabase/migrations/20240101000000_initial_schema.sql:251-273` — constraint function checks `SUM(debit_amount)` vs `SUM(credit_amount)` for all lines of the entry
  - `tests/setup/test_helpers.sql:1-34` — `test_post_unbalanced_entry` wraps entry+lines in one function = one transaction; deferred constraint fires at that boundary
  - `tests/integration/unbalancedJournalEntry.test.ts:29-39` — test calls RPC, proves constraint fires and rejects
- **Consequence:** The deferred constraint works correctly for the test path (plpgsql function = single transaction) but operates at a different boundary than the production path (three auto-committed PostgREST calls). Integration test 1 verifies constraint behavior under conditions that don't match production. A write RPC wrapping entry+lines+audit_log in one function would align production with test behavior.
- **Cross-references:**
  - BACKEND-001 (Scan 1) — same root cause, different angle. BACKEND-001 is about orphaned entries; this finding is about whether the constraint enforces balance at the right boundary.
  - Architecture Fit — the test_helpers.sql pattern is already the solution; migrate it to production.

### DATALAYER-002: No cross-org FK guard on journal_lines.account_id; report RPCs would aggregate cross-org line amounts

- **Severity:** Medium
- **Description:** `journal_lines.account_id` references `chart_of_accounts(account_id)` via a simple FK (migration 001:223). There is no database constraint ensuring that the referenced account belongs to the same org as the parent journal entry. The FK only checks existence, not org_id equality. In the current architecture, the service layer always creates lines referencing accounts from the same org as the entry, so cross-org references cannot happen through normal application paths.

  However, the report RPC functions (`get_profit_and_loss` at migration 007:25-56, `get_trial_balance` at 007:67-99) use a LEFT JOIN chain that would aggregate cross-org line amounts if such a reference existed:

  ```sql
  FROM chart_of_accounts coa
  LEFT JOIN journal_lines jl ON jl.account_id = coa.account_id
  LEFT JOIN journal_entries je ON je.journal_entry_id = jl.journal_entry_id
    AND je.org_id = p_org_id
  WHERE coa.org_id = p_org_id
  ```

  If a journal line in an entry from org B references an account in org A, the `jl` LEFT JOIN matches (account is in org A's set), but the `je` LEFT JOIN fails (`je.org_id = org_B != p_org_id = org_A`), so `je` columns are NULL. However, `jl.amount_cad` is still present and included in the `SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0)` aggregation. The FILTER clause checks `jl.debit_amount`, not `je.org_id`. Result: the line's amount from org B's entry appears in org A's P&L report.

  The fix is structural: either add a subquery/INNER JOIN that restricts lines to entries in the target org, or add a database CHECK constraint ensuring `account_id` belongs to the same org as the entry.

- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:223` — `account_id uuid NOT NULL REFERENCES chart_of_accounts(account_id)` — no org cross-check
  - `supabase/migrations/20240107000000_report_rpc_functions.sql:42-45` — LEFT JOIN chain: `jl ON jl.account_id = coa.account_id` then `je ON ... AND je.org_id = p_org_id`
  - `supabase/migrations/20240107000000_report_rpc_functions.sql:39-40` — `SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0)` aggregates over `jl`, not filtered by `je.org_id`
- **Consequence:** If a cross-org account reference is ever created (via bug, migration, or admin tool), financial reports would silently include amounts from another org. Not exploitable through the current service layer, but no database-level guard prevents it.
- **Cross-references:**
  - Backend Design — the service layer is currently the only defense against cross-org account references
  - Security & Compliance — cross-org data leak in aggregate reports

### DATALAYER-003: Journal entry immutability enforced by RLS deny-all, not by triggers — bypassable by service-role client

- **Severity:** Medium
- **Description:** Immutability of posted journal entries and their lines is enforced by RLS policies that deny all UPDATE and DELETE operations:
  - `journal_entries_no_update` (migration 001:702-703): `FOR UPDATE USING (false)`
  - `journal_entries_no_delete` (migration 001:704-705): `FOR DELETE USING (false)`
  - `journal_lines_no_update` (migration 001:723-724): `FOR UPDATE USING (false)`
  - `journal_lines_no_delete` (migration 001:725-726): `FOR DELETE USING (false)`

  These policies apply to user-context clients (anon key). The `adminClient()` (service-role key) bypasses RLS entirely, meaning the service-role client can UPDATE or DELETE journal entries and lines without restriction. Currently, no service function performs these operations — immutability is enforced by convention (the service simply doesn't have UPDATE/DELETE methods for entries). But a future service function, migration, or admin tool using `adminClient()` could modify or delete posted entries without any database-level rejection.

  PLAN.md Phase 2+ deferrals list "REVOKE UPDATE/DELETE on ledger tables (belt-and-suspenders)" as a future item. Trigger-based immutability (`BEFORE UPDATE` / `BEFORE DELETE` raising exceptions, like the events table's `reject_events_mutation`) would enforce immutability regardless of which client is used.

- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:702-705` — RLS deny UPDATE/DELETE on journal_entries
  - `supabase/migrations/20240101000000_initial_schema.sql:723-726` — RLS deny UPDATE/DELETE on journal_lines
  - `supabase/migrations/20240101000000_initial_schema.sql:579-596` — events table uses triggers (not RLS) for immutability, proving the pattern is available
  - `docs/phase-1.2-obligations.md:138` — "REVOKE UPDATE/DELETE on ledger tables" listed as Phase 2+ deferral
- **Consequence:** The service-role client can modify or delete posted entries. Not a current risk (no code path does this), but a latent gap if Phase 1.2 introduces admin tools or if a migration accidentally modifies ledger rows. The events table demonstrates the trigger-based pattern that would close this gap.
- **Cross-references:**
  - Architecture Fit — the events table immutability pattern (triggers) should be applied to journal_entries/journal_lines for consistency
  - Phase 2+ deferral — documented but not yet implemented

### DATALAYER-004: journal_entry_attachments has SELECT-only RLS — no INSERT policy for Phase 2 writes

- **Severity:** Low
- **Description:** Migration 006 (`20240106000000_add_attachments.sql:18-28`) enables RLS on `journal_entry_attachments` and creates a SELECT policy (`je_attachments_select`) but no INSERT, UPDATE, or DELETE policies. The table is a Phase 2 reservation (comment: "Populated in Phase 2 by AP Agent. Do not write to manually."). If the Phase 2 agent writes attachments via `adminClient()`, this is fine — admin bypasses RLS. But if any write path uses a user-context client, the INSERT would be silently blocked by RLS deny-by-default.

  This is consistent with the admin-only-writes pattern for other admin tables (organizations, memberships, audit_log). The finding is low severity because the table is explicitly reserved for Phase 2, but it's worth noting so the Phase 2 implementation adds an INSERT policy if user-context writes are intended.

- **Evidence:**
  - `supabase/migrations/20240106000000_add_attachments.sql:18-28` — RLS enabled, SELECT-only policy
  - `supabase/migrations/20240106000000_add_attachments.sql:31` — comment: "Populated in Phase 2 by AP Agent"
- **Consequence:** No current impact. Phase 2 must add an INSERT policy if attachments are uploaded via user-context client.
- **Cross-references:**
  - H-08 (RLS asymmetry pattern — intentional for admin tables)

### DATALAYER-005: db:reset does not seed data — requires separate db:seed:all command

- **Severity:** Low
- **Description:** `pnpm db:reset` (`supabase db reset --local`) applies all migrations but does not run the seed data script. There is no `supabase/seed.sql` file (Supabase's automatic seed mechanism). Development seed data requires a separate `pnpm db:seed:all` command, which first creates auth users (`pnpm db:seed:auth` via `scripts/seed-auth-users.ts`), then runs `src/db/seed/dev.sql` via `psql`.

  This two-step process is necessary because auth users live in the `auth.users` table (managed by Supabase Auth, not by SQL migrations) and must be created via the admin API before dev.sql can insert memberships with FK references to them. However, the separation means a developer running `pnpm db:reset` gets an empty database with no orgs, no users, and no memberships. The friction journal's claim that "seeded auth users don't have memberships in seeded orgs" was likely about running `db:reset` without `db:seed:all`.

- **Evidence:**
  - `package.json:16` — `db:reset` is just `supabase db reset --local`
  - `package.json:20` — `db:seed:all` is `pnpm db:seed:auth && pnpm db:seed`
  - No `supabase/seed.sql` file exists (verified via Glob)
  - `src/db/seed/dev.sql:30-42` — memberships ARE correctly created when dev.sql runs
- **Consequence:** Developer friction — `db:reset` alone produces an unusable database. Must be followed by `db:seed:all`. Could be automated with a `db:reset:all` script.
- **Cross-references:**
  - H-14 (refuted — the seed data is correct, the issue is operational sequence)
  - Known concern #2 (seeding gap)

### DATALAYER-006: RPC report functions use SECURITY INVOKER with service_role GRANT — correct but implicit org isolation

- **Severity:** Low
- **Description:** The report RPC functions (`get_profit_and_loss`, `get_trial_balance` in migration 007) use `SECURITY INVOKER` and `GRANT EXECUTE ... TO service_role`. The service-role client bypasses RLS, so the functions execute without row-level security filtering. Org isolation relies entirely on the function's `WHERE coa.org_id = p_org_id` clause and the `je.org_id = p_org_id` JOIN condition — not on RLS.

  This is correct: the service layer validates `org_id` access before calling the RPC (via `ctx.caller.org_ids.includes(input.org_id)` in `reportService.ts:51-56`). But it means the database provides no defense-in-depth for report queries — a caller who bypasses the service layer (direct RPC call with service_role key) can query any org's data by passing an arbitrary `p_org_id`. The function itself has no way to verify the caller's org membership.

  Compare with the RLS approach for direct table queries: even if the service check is bypassed, RLS policies would filter results. For RPC functions, no such guard exists.

- **Evidence:**
  - `supabase/migrations/20240107000000_report_rpc_functions.sql:34-35` — `SECURITY INVOKER`
  - `supabase/migrations/20240107000000_report_rpc_functions.sql:58` — `GRANT EXECUTE ... TO service_role`
  - `src/services/reporting/reportService.ts:51-56` — service-side org_id check before RPC call
- **Consequence:** No defense-in-depth for report queries at the database level. Acceptable in Phase 1.1 where all access goes through the service layer, but worth noting for Phase 1.2 where agent tools may introduce additional call paths.
- **Cross-references:**
  - Backend Design — BACKEND-006 flagged a similar gap (chartOfAccountsService.get lacks org check); the report RPC has the org check in the service but not in the DB function

## Category Summary

The database schema is well-designed for a Phase 1.1 codebase — constraint coverage is thorough (deferred balance, period lock trigger, entry_number UNIQUE, idempotency CHECK, line-amount CHECKs, append-only event triggers), RLS policies are comprehensive and consistent, and enum/type alignment shows no drift. The single most important finding for the synthesis agent is **DATALAYER-001: the deferred balance constraint is effective but operates at the PostgREST auto-commit boundary, not at an application-level transaction boundary**. The `test_helpers.sql` functions already demonstrate the solution (wrap inserts in a plpgsql function), and migration 007 proves the RPC pattern works for reads — the same pattern should be applied to the write path. The secondary finding (DATALAYER-002, cross-org LEFT JOIN in report RPCs) is a structural gap that doesn't affect Phase 1.1 but should be hardened before Phase 1.2 adds more write paths. Self-audit note: as the same instance that helped build Phase 1.1, I was tempted to soften the DATALAYER-002 finding because "the service prevents it." The finding stands because the database should not rely on the service for data integrity.
