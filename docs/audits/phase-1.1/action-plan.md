# Action Plan — Phase 1.1

Date: 2026-04-13
Source: Audit Report Phase 1.1
All items reference audit findings by ID.

---

## Quick Wins (< 1 day each, 1–2 week horizon)

### QW-01: Add ESLint import restriction for `adminClient`
- **Finding:** UF-002
- **What to do:** Add an ESLint `no-restricted-imports` rule that prevents importing `adminClient` from any file outside `src/services/`. This enforces Law 1 at build time rather than by convention.
- **Why now:** Zero-config ESLint rule, no code changes required beyond `eslint.config.mjs`. Addresses the sharpest instance of UF-002 (CLAUDE.md claims this rule exists; making it exist resolves the documentation-reality gap).
- **Done when:** `pnpm lint` fails on any file outside `src/services/` that imports `adminClient`.

### QW-02: Fix `chartOfAccountsService.get()` org authorization
- **Finding:** UF-008
- **What to do:** Add `org_ids.includes(orgId)` guard to `chartOfAccountsService.get()`, matching the pattern used in every other read function. Also replace the raw `throw` with `ServiceError`.
- **Why now:** 3-line change. Currently unreachable, but becomes a cross-org read exposure the moment a Phase 1.2 agent tool calls it.
- **Done when:** Function throws `ServiceError` with `FORBIDDEN` when called with an org the user doesn't belong to, and wraps Supabase errors in `ServiceError`.

### QW-03: Add ledger immutability triggers
- **Finding:** UF-006
- **What to do:** Create a migration adding `BEFORE UPDATE` and `BEFORE DELETE` triggers on `journal_entries` and `journal_lines` that reject all modifications, mirroring the existing `events` table pattern.
- **Why now:** ~20-line migration. The pattern already exists in the codebase. Phase 1.2 agent tools using `adminClient` bypass RLS — triggers are the only database-level defense against accidental ledger modification.
- **Done when:** `UPDATE` or `DELETE` on `journal_entries` or `journal_lines` raises an exception, regardless of whether the caller uses RLS or `adminClient`.

### QW-04: Fix ProposedEntryCard money type
- **Finding:** UF-009
- **What to do:** Change `debit_amount` and `credit_amount` from `number` to `string` (or `MoneyAmount` branded type) in `ProposedEntryCard`'s type definition.
- **Why now:** One-line change per field. Prevents Phase 1.2 agent implementation from following this type and producing money as JavaScript numbers.
- **Done when:** `ProposedEntryCard` money fields are typed as `string` or `MoneyAmount`, and `pnpm typecheck` passes.

### QW-05: Remove dead code files
- **Finding:** UF-017
- **What to do:** Delete `getMembership.ts` (misleading comment, functionality duplicated in `canUserPerformAction`), `membershipService.ts` (duplicates `buildServiceContext` functionality), and the duplicate `UserRole` export in `userRole.ts`. Leave `CanvasContext` type (correctly labeled Phase 1.2 placeholder).
- **Why now:** Four unused exports with misleading comments create confusion for new contributors and set bad patterns for Phase 1.2 code to follow.
- **Done when:** Dead files deleted, no import references broken, `pnpm typecheck` passes.

### QW-06: Add `db:reset:all` convenience script
- **Finding:** UF-018
- **What to do:** Add a `db:reset:all` script to `package.json` that runs `db:reset` followed by `db:seed:all` in sequence.
- **Why now:** Eliminates recurring developer friction on fresh setup. Two-line `package.json` change.
- **Done when:** `pnpm db:reset:all` produces a fully seeded, usable database in one command.

### QW-07: Regenerate stale `types.ts` from database schema
- **Finding:** UF-021 (informational — stale types noted during code quality scan)
- **What to do:** Run the Supabase type generation command to update `types.ts` from the current database schema.
- **Why now:** Ensures type definitions match the actual schema. Prevents type-level assumptions from diverging from database reality.
- **Done when:** `types.ts` reflects the current migration state and `pnpm typecheck` passes.

---

## Medium-Term Refactors (1–3 months)

### MT-01: Implement write RPC for transaction atomicity
- **Findings:** UF-001
- **What to do:** Create a plpgsql function that wraps journal entry creation (entry insert, lines insert, audit_log insert) in a single database transaction. Replace the three independent PostgREST calls in `journalEntryService.post()` with a single RPC call. The pattern is already proven in `test_helpers.sql` and migration 007.
- **Dependencies:** None. This is the highest-priority item and should be the first Phase 1.2 task.
- **Done when:** `journalEntryService.post()` executes all three inserts within a single database transaction. A failure at any point rolls back the entire operation. The deferred balance constraint fires at the transaction boundary, matching test semantics. Integration tests verify partial-failure rollback.

### MT-02: Build canvas refresh mechanism
- **Findings:** UF-004
- **What to do:** Implement a mechanism for mutations to trigger canvas data refresh. Options (in order of simplicity): (a) `refreshKey` counter in `SplitScreenLayout` state, incremented after any mutation, passed as a dependency to canvas data fetches; (b) lightweight event bus; (c) React Query with invalidation. Option (a) matches the existing architecture most closely.
- **Dependencies:** None, though coordinates naturally with MT-01 (the write RPC provides a clean mutation success signal).
- **Done when:** A mutation performed via the chat panel (or any other mutation source) causes the canvas to re-fetch and display updated data without manual page refresh.

### MT-03: Add `buildServiceContext` test coverage
- **Findings:** UF-005, UF-013
- **What to do:** Write integration tests for `buildServiceContext` covering: valid session → correct `ServiceContext`, expired session → rejection, missing/malformed auth cookie → rejection, user with multiple org memberships → correct `org_ids` list. These are Priority 1 tests per UF-013.
- **Dependencies:** None.
- **Done when:** `buildServiceContext` has tests covering the four scenarios above. All pass in `pnpm test:integration`.

### MT-04: Bring `orgService.createOrgWithTemplate` to parity
- **Findings:** UF-003
- **What to do:** Add `recordMutation` call for audit trail, check membership insert error (throw on failure instead of silently proceeding), add service-level Zod validation for inputs, replace inline error mapping with `serviceErrorToStatus`. This brings the org creation path to the same rigor level as the journal entry path.
- **Dependencies:** MT-01 should land first (establishes the transaction wrapping pattern that org service should follow).
- **Done when:** Org creation has audit trail in `audit_log`, membership insert failure raises a `ServiceError`, inputs are Zod-validated, and error responses use the standard pipeline.

### MT-05: Implement shared fetch wrapper and error contract
- **Findings:** UF-010, UF-015
- **What to do:** Create a shared fetch wrapper that: (a) checks `response.ok` on all fetches, (b) maps server errors to a consistent frontend-consumable format, (c) handles expired sessions with a redirect to login rather than silent empty data. Apply to all existing fetch calls. Ensure services throw `ServiceError` consistently (fixing the two services that throw raw `PostgrestError`).
- **Dependencies:** None.
- **Done when:** No fetch call in the frontend skips `response.ok`. Expired sessions redirect to login. All services throw `ServiceError` instead of raw Supabase errors.

### MT-06: Add read-path authorization middleware
- **Findings:** UF-012
- **What to do:** Extend `withInvariants` with read action types or create a lightweight `withReadAuth` wrapper that enforces `org_ids.includes(orgId)` for read operations. Fix the two current omissions: `chartOfAccountsService.get()` (if not already done by QW-02) and `periodService.isOpen()`. Apply to all read functions.
- **Dependencies:** QW-02 should land first (fixes the immediate gap).
- **Done when:** Every read function in `src/services/` passes through a centralized org authorization check. A new read function that omits the check is caught by the wrapper, not by code review.

### MT-07: Resolve OrgSwitcher Law 1 violation
- **Findings:** UF-014
- **What to do:** Move the OrgSwitcher's membership query from a direct browser-to-database Supabase call to a service function call (either a new `membershipService.listForCurrentUser()` or by using the membership data already available from `buildServiceContext`). This eliminates the sole exception to Law 1.
- **Dependencies:** None.
- **Done when:** OrgSwitcher does not create a Supabase browser client. All database access goes through `src/services/`.

### MT-08: Add cross-org FK guard on `journal_lines.account_id`
- **Findings:** UF-007
- **What to do:** Add a CHECK constraint or trigger on `journal_lines` that verifies the referenced `account_id` belongs to the same `org_id` as the parent `journal_entry`. This prevents silent cross-org report contamination. Also add a test that attempts to insert a journal line referencing an account from a different org and verifies rejection.
- **Dependencies:** MT-01 (write RPC) should land first, as the guard integrates naturally into the transaction.
- **Done when:** A journal line referencing a cross-org account is rejected at the database level. A test verifies the rejection.

---

## Long-Term Roadmap (3–12 months)

### LT-01: Convention-to-enforcement migration for all critical invariants
- **Findings:** UF-002
- **What to do:** Systematically convert all convention-only rules to automated enforcement. Beyond QW-01 (ESLint for `adminClient`), this includes: CI check for `withInvariants` wrapping on all mutating exports, CI grep-fail for hardcoded test URLs (CLAUDE.md Rule 8), and documentation-reality reconciliation (audit all CLAUDE.md claims against implementation). Update CLAUDE.md to remove claims about enforcement mechanisms that rely on future CI work.
- **Phase alignment:** Phase 1.3 (deployment readiness and CI/CD).
- **Done when:** Every non-negotiable rule in CLAUDE.md has a corresponding automated check (lint, CI, type system, or database constraint). No rule relies solely on convention.

### LT-02: Comprehensive test coverage for Phase 1.2 readiness gaps
- **Findings:** UF-013
- **What to do:** Address the full prioritized test gap list from UF-013: Priority 1 (API route integration tests, audit_log content assertions), Priority 2 (reversal mirror edge cases, period-lock enforcement variations), Priority 3 (remaining `QUALITY-005` gap items). Include the net-new gap: cross-org report contamination test for UF-007.
- **Phase alignment:** Phase 1.2 sprint 1 (Priority 1), Phase 1.2 ongoing (Priority 2–3).
- **Done when:** All 9 documented test gaps have corresponding tests. `pnpm test:integration` covers all five Category A floor tests plus the new additions.

### LT-03: Add CORS, CSRF, and rate limiting before deployment
- **Findings:** UF-011
- **What to do:** Implement CSRF protection (at minimum, double-submit cookie pattern compatible with `@supabase/ssr`), CORS headers restricting origins to the deployment domain, and basic rate limiting on mutation routes.
- **Phase alignment:** Phase 1.3 (deployment readiness).
- **Done when:** Mutation routes reject cross-origin requests without valid CSRF tokens. CORS headers restrict to known origins. Rate limiting prevents abuse of mutation endpoints.

### LT-04: Upgrade health endpoint with dependency checks
- **Findings:** UF-019
- **What to do:** Replace the static `{ status: "ok" }` health endpoint with one that verifies database connectivity (and eventually other dependencies). Return degraded status when a dependency is unreachable.
- **Phase alignment:** Phase 1.3 (deployment with health-check-based routing).
- **Done when:** Health endpoint returns `{ status: "ok" }` only when the database is reachable, and `{ status: "degraded", ... }` otherwise.

---

## Architecture Redesign Recommendations

No redesign recommendations at this phase. The layered architecture (services → API routes → frontend, with RLS as defense-in-depth) is sound. The findings describe implementation gaps and enforcement gaps, not structural problems. The Two Laws are correct in design — they need automated enforcement, not rethinking.

---

## Explicit "Do Not Do" List

### DND-01: Do not add CORS/CSRF/rate limiting now
- **Finding:** UF-011
- **Why accepted:** Local development only. No network exposure. Cookie-based session risk is real but only materializes at deployment (Phase 1.3). Adding these protections now would add complexity and testing burden to a codebase that is not yet deployed. The Phase 1.3 deployment brief should include this as a blocking requirement.

### DND-02: Do not upgrade health endpoint now
- **Finding:** UF-019
- **Why accepted:** No deployment means no health-check-based routing. The static endpoint is correct for local development. Upgrading it now would require maintaining a dependency check that has no consumer. Phase 1.3 concern.

### DND-03: Do not add pagination to list endpoints now
- **Finding:** UF-020
- **Why accepted:** Phase 1.1 data volumes are trivially small. The batch query pattern is efficient. Adding pagination now would add complexity to every list endpoint and its corresponding frontend consumer for a scaling concern that is months away. When entry counts approach hundreds per period, pagination becomes worthwhile.

### DND-04: Do not act on informational spec deviations
- **Finding:** UF-021
- **Why accepted:** Four spec deviations from PLAN.md were reviewed and found to be architecturally sound: `journal_entry_attachments` SELECT-only RLS is correct for admin-only-writes, RPC `SECURITY INVOKER` with service_role GRANT is correct, `journalEntryService.post()` complexity will self-resolve with the write RPC (MT-01), and the four ARCHFIT-004 deviations are intentional and documented. These findings validate the current implementation, not flag problems.
