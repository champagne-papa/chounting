# Security & Compliance — Findings Log

Scanner: Security & Compliance
Phase: End of Phase 1.1
Date: 2026-04-13
Hypotheses investigated: H-03, H-06, H-08, H-10, H-11, H-13

## Hypothesis Responses

### H-03: orgService.createOrgWithTemplate has no audit trail — compliance angle

- **Status:** Confirmed (compliance gap for org provisioning events)
- **Evidence:** Scan 1 (BACKEND-003) confirmed the service never calls `recordMutation()`. From a compliance perspective: if a bad actor or a buggy Phase 1.2 agent tool creates a rogue org, the incident cannot be reconstructed from the audit_log. The `organizations` table has `created_at` and `created_by` columns (migration 001:80-81), so the raw data exists — but it lives in the organizations row itself, not in the audit_log. There is no centralized, tamper-resistant log of who created which org and when. A malicious actor with service-role access could `UPDATE organizations SET created_by = <someone_else>` (no immutability trigger on organizations) to shift blame.

  For SOC 2 CC6.1 (logical access controls) and CC8.1 (change management), all provisioning events must be logged. Phase 1.1 is local-dev-only, so this is not blocking today, but the Foundation Readiness Assessment should note this as YES-WITH-CAVEATS: the audit infrastructure exists for journal entry mutations but not for org provisioning.
- **Notes for other scanners:** Architecture Fit scanner should assess whether the missing audit trail downgrades the Phase 1.1 foundation readiness for Phase 1.2.

### H-06: Read-path services use adminClient with inline org checks — authorization gap analysis

- **Status:** Confirmed (consistent pattern, one dormant gap)
- **Evidence:** All read-path service functions use `adminClient()` (bypasses RLS) and enforce org access via inline `ctx.caller.org_ids.includes(input.org_id)` checks:
  - `journalEntryService.list` — line 301: checks `org_ids.includes`
  - `journalEntryService.get` — line 382: filters `.in('org_id', ctx.caller.org_ids)`
  - `reportService.profitAndLoss` — line 51: checks `org_ids.includes`
  - `reportService.trialBalance` — line 92: checks `org_ids.includes`
  - `chartOfAccountsService.list` — line 20: checks `org_ids.includes`
  - `periodService.listOpen` — line 29: checks `org_ids.includes`

  The one gap: `chartOfAccountsService.get()` (lines 47-66) has no org check and no `.in('org_id', ...)` filter (Scan 1 BACKEND-006). It accepts an `account_id` and queries with adminClient, returning the account regardless of the caller's org membership. Currently unexposed via API routes and not called anywhere in the codebase.

  The hypothesis also questioned whether `buildServiceContext`'s membership fetch (using the user-context Supabase client) could return incomplete `org_ids`. Analysis: `buildServiceContext` at `serviceContext.ts:58-60` queries `memberships` filtered by `eq('user_id', user.id)`. The `memberships_select` RLS policy (migration 001:671-674) allows `user_id = auth.uid() OR user_is_controller(org_id)`. Since the query filters on the user's own `user_id`, every user can see ALL their own memberships — the controller clause is for viewing other users' memberships. So `org_ids` is always complete for the authenticated user.
- **Notes for other scanners:** The `chartOfAccountsService.get()` gap should be listed as a Phase 1.2 obligation: add `org_ids.includes` check before exposing it to agent tools.

### H-08: RLS policies on admin tables are SELECT-only — adversarial assessment

- **Status:** Refuted (defense-in-depth, not a gap)
- **Evidence:** Tables with SELECT-only RLS (organizations, memberships, audit_log, events) are intentionally write-restricted via RLS deny-by-default. An attacker with a stolen user JWT and the anon key cannot INSERT into these tables because no INSERT policy exists — the RLS default is DENY. The attacker would need the service-role key to bypass RLS.

  Adversarial framing: can an attacker forge audit_log entries? No — audit_log has no INSERT RLS policy, so user-context clients are blocked. All writes go through `adminClient()` via `recordMutation()`, which takes `ctx.caller.user_id` from the JWT-validated ServiceContext. The `user_id` in audit_log cannot be spoofed because it originates from `buildServiceContext → supabase.auth.getUser()` (server-side JWT validation against Supabase Auth). No user input reaches audit_log fields — the `before_state` (jsonb) and `after_state_id` (uuid) fields are currently always `null` in `recordMutation.ts:47-48`.

  The `events` table adds a second layer: append-only triggers (migration 001:579-596) block UPDATE/DELETE/TRUNCATE regardless of client role. This pattern is not applied to audit_log — audit_log could be modified by the service-role client. This is acceptable in Phase 1.1 but should be hardened in Phase 1.2 (append-only triggers on audit_log).
- **Notes for other scanners:** audit_log is modifiable by service-role client (no append-only triggers). Not currently exploitable but should be hardened before Phase 1.2.

### H-10: buildServiceContext never tested — security implications

- **Status:** Confirmed (untested auth chain has specific security-relevant failure modes)
- **Evidence:** No test exercises the cookie → JWT → user_id → memberships → ServiceContext chain via an HTTP request. The security-relevant failure modes in `buildServiceContext` that would go undetected:

  1. **JWT validation bypass:** `supabase.auth.getUser()` (serviceContext.ts:52) makes a network call to the Supabase Auth server. If the Supabase URL is misconfigured (e.g., pointing to a different project), the JWT validation could accept tokens from a different Supabase instance. No test verifies this.

  2. **Membership fetch returning wrong orgs:** The membership query (serviceContext.ts:58-60) uses the user-context client with the anon key. If the RLS policy on memberships changes or the anon key's role changes, `org_ids` could return incorrect results. No test verifies the org_ids array matches expected memberships.

  3. **Post-sign-out token validity:** `supabase.auth.signOut()` (sign-out/page.tsx:21) revokes the refresh token but the access JWT remains valid until expiry. `getUser()` should reject revoked tokens (it calls the Auth server, which checks revocation), but this is untested. If `getUser()` only validates the JWT signature locally (without calling the server), a signed-out user's JWT would remain valid for up to 1 hour (default Supabase JWT expiry). The Supabase docs state `getUser()` calls the server, but the behavior is undocumented for edge cases (e.g., network timeout on the auth server check).

  4. **trace_id collision:** `crypto.randomUUID()` (serviceContext.ts:63) generates trace_ids. UUID v4 collision probability is negligible, but trace_id is used as a filter key in audit_log queries. This is not a security concern.

  Of these, #1 (misconfigured Supabase URL) and #3 (post-sign-out token validity) are the most security-relevant. Both would manifest as unauthorized access that no test or monitoring would catch.
- **Notes for other scanners:** Code Quality scanner should prioritize API route integration tests (Phase 1.2 obligation) that exercise the full HTTP → auth → service chain.

### H-11: Cross-org INSERT RLS policies — adversarial assessment

- **Status:** Confirmed (policies are structurally sound; write-path is defense-in-depth behind withInvariants)
- **Evidence:** Scan 2 (DATALAYER H-11 response) verified all four INSERT policies use `user_has_org_access()` or `user_is_controller()`. From an adversarial perspective:

  The RLS INSERT policies are defense-in-depth because all writes go through `adminClient()` (bypasses RLS). The primary write-path protection is `withInvariants` Invariant 3 (serviceContext.ts org_ids check). An attacker would need to bypass both `withInvariants` AND the Zod schema to inject a cross-org `org_id`. The Zod schema (`PostJournalEntryInputSchema`) validates `org_id` as `z.string().uuid()` but does not cross-check it against the caller's memberships — that's `withInvariants`'s job. The API route (journal-entries/route.ts:34-38) adds a third check: `parsed.org_id !== orgId` (URL/body match).

  Triple-layer defense: URL/body match (route) → org_ids membership check (withInvariants) → Zod type validation (schema). The RLS INSERT policies are a fourth layer that's never reached in the current architecture. The layers are structurally sound.

  One gap: the `chartOfAccountsService.get()` function (BACKEND-006) uses adminClient without org_ids filtering. If an agent tool in Phase 1.2 accepts a user-provided `account_id` and calls this function, it bypasses all four layers — adminClient bypasses RLS, and the function has no inline org check. Can a user enumerate account UUIDs? Not through current API responses (account UUIDs are included in journal entry detail responses, but only for the user's own orgs). However, if a user learns an account UUID from another org (e.g., from a browser devtools screenshot), they could potentially read that account's details through a Phase 1.2 agent tool.
- **Notes for other scanners:** Phase 1.2 obligations must include: add org authorization check to `chartOfAccountsService.get()` BEFORE any agent tool exposes it.

### H-13: Client components import service-layer types — secret exposure risk

- **Status:** Refuted (all imports are type-only; no runtime value imports from services into components)
- **Evidence:** All imports from `@/services/` in `src/components/` use `import type` syntax:
  - `BasicPLView.tsx:6` — `import type { PLRow } from '@/services/reporting/reportService'`
  - `JournalEntryDetailView.tsx:5` — `import type { JournalEntryDetail } from '@/services/accounting/journalEntryService'`
  - `ReversalForm.tsx:13-14` — `import type { JournalEntryDetail } ...`
  - `JournalEntryListView.tsx:5` — `import type { JournalEntryListItem } ...`
  - `BasicTrialBalanceView.tsx:5-6` — `import type { TrialBalanceRow } ...`

  TypeScript `import type` is erased at compile time and produces no JavaScript output. The `adminClient` and `SUPABASE_SERVICE_ROLE_KEY` are never bundled into client-side code. Additionally, Next.js server/client boundaries would produce a build error if a value import from a server module were used in a `'use client'` component — this is a compile-time guard.

  No value imports from `@/services/` exist in `src/components/`. The hypothesis is refuted.
- **Notes for other scanners:** This is clean. No action needed unless someone accidentally converts a `type` import to a value import (which would be caught by the Next.js build).

## Findings

### SECURITY-001: No CORS, rate limiting, or CSRF protection on API routes

- **Severity:** Medium
- **Description:** The API routes have no CORS configuration, no rate limiting, and no CSRF protection. `next.config.ts` is minimal — no `headers()`, no `rewrites()`, no CORS rules. No middleware file exists for request-level protections.

  In Phase 1.1 (local development), this is acceptable: the server runs on `localhost:3000` and is not network-reachable. But Phase 1.3 (deployment) will expose these routes to the internet. Without CORS headers, any origin can make requests. Without rate limiting, a credential-stuffing attack on the auth flow or a journal-entry-flooding attack could succeed. Without CSRF tokens, a malicious site could submit journal entries on behalf of a logged-in user via form POST (the cookie-based session is automatically included).

  Supabase Auth provides some protections (token-based auth, not cookie-based for API calls), but the `buildServiceContext` function uses cookie-based sessions via `@supabase/ssr` — the cookie is sent automatically with same-origin requests and could be sent cross-origin if CORS allows it.

- **Evidence:**
  - `next.config.ts:1-7` — no headers, CORS, or security configuration
  - No `src/middleware.ts` file exists (checked via Glob)
  - No rate limiting library in dependencies
  - `src/services/middleware/serviceContext.ts:39-50` — `buildServiceContext` uses cookie-based auth via `@supabase/ssr`
- **Consequence:** No current risk (local dev only). Phase 1.3 deployment without CORS/CSRF/rate-limit would expose mutation routes to cross-origin attacks and denial-of-service.
- **Cross-references:**
  - Architecture Fit — Phase 1.3 deployment readiness requires security middleware
  - Phase 1.2 obligations — should add "CORS + CSRF + rate limiting" as a pre-deployment requirement

### SECURITY-002: Org creation has no audit trail — compliance gap for SOC 2 provisioning controls

- **Severity:** High
- **Description:** `orgService.createOrgWithTemplate` never calls `recordMutation()` (Scan 1 BACKEND-003). From a compliance perspective, this means org provisioning events — which grant the creating user controller-level access to a new org — have no centralized audit trail. The `organizations` table stores `created_by` and `created_at`, but this is mutable (no immutability trigger on organizations) and lives in the data itself rather than in a tamper-resistant audit log.

  Adversarial scenario: A malicious insider with service-role access creates a rogue org, exfiltrates data, then `UPDATE organizations SET created_by = <colleague_uuid>` to shift blame. The audit_log has no record of the creation. The organizations table's `created_by` now points to an innocent user. No reconciliation script or monitoring would detect this because the org creation event was never logged.

  For SOC 2 CC6.1 (logical access controls) and CC8.1 (change management), all provisioning events must be auditable. The Foundation Readiness Assessment should downgrade from YES to YES-WITH-CAVEATS: the audit infrastructure works for journal entries but has a gap for org provisioning.

  This is not Phase 1.1-blocking (local dev, single user), but it should be fixed before Phase 1.2 adds agent tools that could create orgs.

- **Evidence:**
  - `src/services/org/orgService.ts:14-87` — no `recordMutation` import or call
  - `supabase/migrations/20240101000000_initial_schema.sql:72-82` — organizations table has `created_by` and `created_at` but no immutability trigger
  - `supabase/migrations/20240101000000_initial_schema.sql:668-669` — organizations has SELECT-only RLS, no UPDATE/DELETE deny policies
- **Consequence:** Org provisioning events are unauditable. Rogue org creation cannot be forensically attributed. SOC 2 CC6.1/CC8.1 gap.
- **Cross-references:**
  - BACKEND-003 (Scan 1) — same root cause, different angle (compliance vs correctness)
  - DATALAYER-003 (Scan 2) — immutability enforcement pattern gap extends to organizations table

### SECURITY-003: Cross-org report contamination via missing FK guard (DATALAYER-002 adversarial analysis)

- **Severity:** Medium
- **Description:** Scan 2 (DATALAYER-002) identified that `journal_lines.account_id` has no cross-org FK guard and the report RPCs' LEFT JOIN structure would include cross-org amounts. The adversarial analysis:

  **What would an attacker need?** Service-role access (the `SUPABASE_SERVICE_ROLE_KEY`). User-context clients cannot insert journal lines referencing cross-org accounts because: (1) all writes go through `adminClient` via `withInvariants` which checks org_ids, (2) the Zod schema validates `account_id` as a UUID but doesn't cross-check org ownership. However, an attacker with service-role access could INSERT a journal line with an `account_id` from another org. This is the same trust boundary as any service-role access — once the key is compromised, many attacks are possible.

  A more realistic scenario: a Phase 1.2 bug in agent tooling passes an account_id from an agent's "memory" (prior conversation context about a different org) into a journal entry for the current org. The Zod schema would accept it (valid UUID), `withInvariants` would pass (org_id matches the entry's org), and the cross-org account reference would be silently accepted.

  **Could it be detected?** No existing mechanism would catch it. The audit_log records the journal_entry_id and org_id but not individual line account_ids. No reconciliation script checks for cross-org account references. The Trial Balance report would show the correct debit/credit totals for the contaminated org (the amounts are summed via the LEFT JOIN), but the source account belongs to a different org — this would be invisible in the report output.

  **Compliance implication:** Incorrect financial reports in a family office context violate trust obligations. If reports include cross-org amounts, P&L and Trial Balance are materially misstated.

  **Should a CHECK constraint be added as Phase 1.1 hotfix?** A simple CHECK constraint cannot enforce cross-table relationships (Postgres CHECK constraints can only reference the current row). The correct fix is either: (a) a BEFORE INSERT trigger on journal_lines that verifies `account_id`'s `org_id` matches the parent entry's `org_id`, or (b) restructuring the report RPC JOINs to filter lines by the entry's org. Option (b) is simpler and should be a Phase 1.2 must-do.

- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:223` — simple FK, no org cross-check
  - `supabase/migrations/20240107000000_report_rpc_functions.sql:42-45` — LEFT JOIN leaks cross-org amounts
  - No audit_log field captures per-line account_ids
- **Consequence:** A Phase 1.2 agent bug could create cross-org account references that silently contaminate financial reports. No detection mechanism exists.
- **Cross-references:**
  - DATALAYER-002 (Scan 2) — same finding, structural angle
  - Backend Design — Phase 1.2 agent tools are the most likely introduction vector

### SECURITY-004: Journal entry/line immutability bypassable by service-role client — Phase 1.2 risk

- **Severity:** Medium
- **Description:** Scan 2 (DATALAYER-003) found that journal entry immutability is enforced by RLS deny-all policies, not triggers. `adminClient()` bypasses RLS. From the Phase 1.2 readiness angle:

  **Attack surface with Phase 1.2 agent tools:** Agent tools will use `adminClient()` via the service layer. If an agent tool has a bug that issues an UPDATE or DELETE on journal_entries (e.g., a "correct this entry" tool that modifies instead of reverses), the database has no defense. RLS won't fire (adminClient bypasses it). No trigger exists to block the operation. The immutability invariant is enforced only by the absence of UPDATE/DELETE methods in the service — a convention, not a constraint.

  **Why not elevate from Phase 2+ deferred to Phase 1.2 must-do?** The events table already demonstrates the trigger pattern (`reject_events_mutation` at migration 001:571-577). Applying the same pattern to journal_entries and journal_lines would be a ~20-line migration with zero risk to existing functionality. The only reason it's deferred is that Phase 2+ plans `REVOKE UPDATE/DELETE` as a belt-and-suspenders measure on top of triggers. But the trigger alone would close the gap. The cost of adding it now is trivial; the cost of a Phase 1.2 agent accidentally modifying a posted entry is an accounting integrity breach.

  Recommendation: elevate to Phase 1.2 must-do. Add `BEFORE UPDATE` and `BEFORE DELETE` triggers on `journal_entries` and `journal_lines` that raise exceptions, identical to the events table pattern.

- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:702-705,723-726` — RLS deny-all (bypassed by adminClient)
  - `supabase/migrations/20240101000000_initial_schema.sql:571-596` — events table trigger pattern (the solution exists)
  - `docs/phase-1.2-obligations.md:138` — "REVOKE UPDATE/DELETE on ledger tables" listed as Phase 2+
- **Consequence:** Phase 1.2 agent tools using adminClient could accidentally modify or delete posted journal entries with no database-level rejection.
- **Cross-references:**
  - DATALAYER-003 (Scan 2) — structural analysis
  - Architecture Fit — the events table pattern should be applied to ledger tables

### SECURITY-005: chartOfAccountsService.get() is a dormant cross-org read — Phase 1.2 exposure risk

- **Severity:** Medium
- **Description:** `chartOfAccountsService.get()` (lines 47-66) accepts an `account_id` and queries via `adminClient()` with no org authorization check. Scan 1 (BACKEND-006) flagged this as a dormant gap. The adversarial analysis:

  **Can any existing path reach it?** No. Grep confirms `chartOfAccountsService.get` is not called from any API route or other service. The function is defined but unreachable in Phase 1.1.

  **Is it a Phase 1.2 expansion target?** Yes. Phase 1.2 agent tools will need to look up account details by ID (e.g., the agent proposes a journal entry referencing account_id X, and the confirmation UI needs to display the account name). The natural tool would call `chartOfAccountsService.get(account_id)`. If exposed without adding the org check, any agent user could read account names from orgs they don't belong to.

  **Can account UUIDs be enumerated?** Through the current API, account UUIDs are visible in journal entry detail responses (`JournalEntryDetail.journal_lines[].account_id`). These are scoped to the user's org. But if a user knows an account UUID from another org (e.g., shared in a support conversation, visible in a screenshot), they could use a Phase 1.2 agent tool to read that account's details.

  **Mitigation:** Add `if (!ctx.caller.org_ids.includes(data.org_id)) throw new ServiceError('ORG_ACCESS_DENIED', ...)` after the query in `chartOfAccountsService.get()`. This is a 3-line fix. Must be done before Phase 1.2 exposes this function.

- **Evidence:**
  - `src/services/accounting/chartOfAccountsService.ts:47-66` — no org check
  - `src/services/accounting/chartOfAccountsService.ts:20` — comparison: `list()` has the check
  - Grep for `chartOfAccountsService.get` — zero hits outside the definition
- **Consequence:** Phase 1.2 agent tools that expose this function would allow cross-org account detail reads.
- **Cross-references:**
  - BACKEND-006 (Scan 1) — same gap, correctness angle
  - H-06 (this response) — part of the read-path authorization analysis

### SECURITY-006: buildServiceContext auth chain untested — JWT validation and post-sign-out token replay are unverified

- **Severity:** High
- **Description:** No integration test exercises the full HTTP request → cookie → JWT validation → user_id → membership fetch → ServiceContext chain (H-10, confirmed by all three scans). The security-specific risk is that the core authentication mechanism — the function that determines "who is making this request" — has never been exercised by automated tests.

  **Post-sign-out token replay:** `sign-out/page.tsx:21` calls `supabase.auth.signOut()` which revokes the refresh token. The access JWT (typically valid for 1 hour) is stateless. `buildServiceContext` calls `supabase.auth.getUser()` (serviceContext.ts:52) which makes a network call to the Supabase Auth server — this should check token revocation. But "should" is different from "does": this behavior is untested. If `getUser()` falls back to local JWT signature verification on Auth server timeout (a plausible resilience pattern), a signed-out user's JWT would remain valid until expiry. No test verifies that `getUser()` rejects a revoked token.

  **Practical risk assessment:** In Phase 1.1 (local dev, single user), token replay is not a risk. In Phase 1.2+ (potential multi-user, network-accessible), an attacker who steals a session cookie and then the user signs out could continue operating with the stolen JWT for up to 1 hour. All API routes use `buildServiceContext` for auth — there's no secondary verification.

  This is listed as Phase 1.2 obligation ("API route integration tests") but the security urgency should elevate it from "nice to have" to "must do before multi-user deployment."

- **Evidence:**
  - `src/services/middleware/serviceContext.ts:52` — `supabase.auth.getUser()` — single point of auth validation
  - `src/app/[locale]/sign-out/page.tsx:21` — client-side `signOut()` revokes refresh token only
  - `tests/` — zero hits for `buildServiceContext` (Scan 1 H-10)
  - `docs/phase-1.2-obligations.md:49` — "API route integration tests (exercise HTTP layer including auth)"
- **Consequence:** If `getUser()` has a bug (e.g., local-only JWT validation, incorrect revocation check), all API routes accept invalid or revoked tokens. No test or monitoring would catch this.
- **Cross-references:**
  - H-10 (all three scans confirmed the gap from different angles)
  - Phase 1.2 obligations — elevate "API route integration tests" priority

### SECURITY-007: Service error messages propagate raw Supabase/PostgREST error text to API responses

- **Severity:** Low
- **Description:** When service functions catch Supabase errors, they construct `ServiceError` with the raw error message: e.g., `journalEntryService.ts:118` — `throw new ServiceError('POST_FAILED', entryErr?.message ?? 'Insert failed')`. API routes then include this message in the HTTP response: `{ error: err.code, message: err.message }` (e.g., journal-entries/route.ts:59).

  Supabase/PostgREST error messages can include table names, column names, constraint names, and SQL fragments. For example, a constraint violation on `unique_entry_number_per_org_period` would expose the constraint name, revealing schema details to the caller. The generic 500 fallback (`{ error: 'Internal server error' }`) does not leak details, but the `ServiceError` path does.

  This is a minor information disclosure issue. In a multi-tenant accounting system, schema details are low-sensitivity — an attacker already knows it's Supabase/Postgres. But the principle of least information applies: error messages should describe what went wrong for the user, not expose internal schema.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:118` — `ServiceError('POST_FAILED', entryErr?.message ?? 'Insert failed')`
  - `src/app/api/orgs/[orgId]/journal-entries/route.ts:58-60` — `{ error: err.code, message: err.message }` in response
  - `src/services/org/orgService.ts:33` — `ServiceError('ORG_CREATE_FAILED', orgErr?.message ?? 'unknown')`
- **Consequence:** Supabase error text in HTTP responses could reveal table/column/constraint names. Minor information disclosure.
- **Cross-references:**
  - Code Quality & Maintainability — error message sanitization pattern

## Adversarial Question Answers

**Can a user in org A ever cause a write to org B's data?** No in Phase 1.1. Triple-layer defense: (1) API route checks URL orgId matches body org_id, (2) `withInvariants` Invariant 3 checks `ctx.caller.org_ids.includes(claimedOrgId)`, (3) `canUserPerformAction` verifies role-based permission via fresh DB membership lookup. Phase 1.2 risk: `chartOfAccountsService.get()` is an unexposed read gap (SECURITY-005).

**Can a user's JWT be replayed after sign-out?** Uncertain — untested (SECURITY-006). `signOut()` revokes the refresh token. `getUser()` should reject revoked access tokens via server-side check, but this is unverified.

**Is there any path where a user can elevate their role?** No. Role is read from the memberships table by `canUserPerformAction` (lines 67-72), not from the JWT or client input. Memberships have no INSERT/UPDATE RLS policies for user-context clients. No API route exposes membership mutations.

**Are there query parameters or request bodies that trust client input for authorization?** No. All authorization decisions use JWT-validated `user_id` → server-side membership lookup → `org_ids` array. The client-provided `org_id` is checked against this server-derived array, never trusted directly.

**Can sensitive data leak through error messages?** Yes, minor (SECURITY-007). Raw Supabase error text is included in HTTP responses via `ServiceError.message`. Pino redaction covers auth tokens and PII but not DB error messages.

**Is the audit_log forgeable?** No via user-context client (no INSERT RLS policy). Via service-role client: `recordMutation` takes `user_id` from JWT-validated `ServiceContext.caller.user_id`. No user input reaches audit_log fields (`before_state` and `after_state_id` are currently always null). However, audit_log is modifiable by service-role client (no append-only trigger like the events table) — a compromise of the service-role key would allow audit_log tampering.

**Does any code path allow SQL injection?** No. All database queries use the Supabase client query builder (`.from().select().eq()`), not raw SQL. RPC calls use parameterized arguments. No string interpolation into SQL.

## Category Summary

The multi-tenant isolation model is structurally sound for Phase 1.1 — the triple-layer defense (URL/body match, `withInvariants` org_ids check, `canUserPerformAction` role check) is consistently applied across all write paths, and all read paths have inline org_ids checks (with one dormant exception in `chartOfAccountsService.get()`). The most important thing for the synthesis agent to know is that **the security posture is adequate for local-dev single-user Phase 1.1 but has specific gaps that must be closed before Phase 1.2 introduces agent tools and before Phase 1.3 deploys to the network**: (1) immutability triggers on ledger tables (SECURITY-004), (2) org check on `chartOfAccountsService.get()` (SECURITY-005), (3) buildServiceContext auth chain test coverage (SECURITY-006), and (4) CORS/CSRF/rate-limit middleware (SECURITY-001). Self-audit note: as the same instance that helped build this codebase, I was initially inclined to rate the missing CORS/CSRF as Low because "it's local dev." The correct framing is Phase 1.3 readiness — the foundation should not create deployment blockers.
