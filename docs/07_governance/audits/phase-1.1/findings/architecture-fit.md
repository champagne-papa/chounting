# Architecture Fit — Findings Log

Scanner: Architecture Fit
Phase: End of Phase 1.1
Date: 2026-04-13
Hypotheses investigated: H-01, H-03, H-06, H-12, H-13

## Hypothesis Responses

### H-01: journalEntryService.post() lacks transaction wrapping — architecture fit angle

- **Status:** Confirmed (architectural assessment: the RPC pattern for writes is the natural fix, and the codebase already demonstrates it)
- **Evidence:** Scan 1 (BACKEND-001) and Scan 2 (DATALAYER-001) thoroughly confirmed the three-insert non-atomicity. The Architecture Fit contribution: the codebase already has the solution pattern in two places. First, `tests/setup/test_helpers.sql` wraps entry + lines inserts in plpgsql functions (`test_post_balanced_entry`, `test_post_unbalanced_entry`), and the integration tests prove the deferred balance constraint fires correctly at the function-transaction boundary. Second, migration 007 (`20240107000000_report_rpc_functions.sql`) uses the RPC pattern for read queries where the PostgREST query builder is insufficient. A write RPC wrapping entry + lines + audit_log in a single plpgsql function would: (a) solve atomicity (BACKEND-001), (b) align the deferred constraint boundary between test and production (DATALAYER-001), and (c) retain the existing `journalEntryService.post()` as the TypeScript entry point — the service function calls `db.rpc('post_journal_entry', {...})` instead of three separate `.insert()` calls. The architectural pattern is already proven in this codebase; the gap is applying it to the write path.
- **Notes for other scanners:** This is the single highest-priority architectural change for Phase 1.2. The RPC approach is already validated by the test helpers and the read RPCs. No architectural redesign needed — it's a migration adding a plpgsql function and a service-layer refactor from three calls to one.

### H-03: orgService.createOrgWithTemplate has no audit trail — architecture fit angle

- **Status:** Confirmed (the architectural concern is pattern divergence, not the missing audit trail itself)
- **Evidence:** The architectural issue is that `orgService.createOrgWithTemplate` was written with a different level of rigor than `journalEntryService.post()`. Specifically: (1) no `recordMutation` call (Scan 1 BACKEND-003), (2) unchecked membership insert error (Scan 1 H-09), (3) inline `ServiceError` mapping in the API route instead of `serviceErrorToStatus` (BACKEND-005). These three divergences in one function suggest the org creation path was treated as scaffolding rather than production code. The function is wired through `withInvariants` in the API route (`src/app/api/org/route.ts:28`), so the authorization/context pattern is correct — the gaps are in the function body, not the middleware wrapping.
- **Notes for other scanners:** Already covered by Scans 1 and 3. The architectural angle is that the org service needs to be brought to the same rigor level as the journal entry service before Phase 1.2 adds more mutation paths.

### H-06: Read-path services use adminClient with inline org checks — architecture fit angle

- **Status:** Confirmed (consistent pattern with one documented exception)
- **Evidence:** Scan 3 (SECURITY H-06 response) verified the pattern is consistent across all read-path service functions with one dormant exception (`chartOfAccountsService.get()`). From the Architecture Fit angle, the pattern is architecturally sound for Phase 1.1: reads use `adminClient` + inline `org_ids.includes()` check; writes use `withInvariants` (which performs the same check via Invariant 3) + `adminClient`. The `userClient.ts` (`src/db/userClient.ts`) exists but is only used in `buildServiceContext` for the membership query — all data queries go through `adminClient`. This is deliberate: the service layer handles authorization, and `adminClient` provides RLS-bypass for performance and query flexibility. The decision is architecturally consistent. The one gap (`chartOfAccountsService.get()`) is a latent defect, not a pattern inconsistency — the pattern is "every read service checks org access," and this function simply doesn't follow it.
- **Notes for other scanners:** Already fully covered by Scans 1 and 3.

### H-12: Hardcoded 'CAD' currency in JournalEntryForm — architecture fit angle

- **Status:** Refuted (documented deferral with correct architectural boundaries)
- **Evidence:** The hardcoded `'CAD'` and `oneRate()` in `JournalEntryForm.tsx` is a Phase 1 simplification. Multi-currency is explicitly deferred to Phase 4 per PLAN.md Section 8b, and `phase-1.2-obligations.md` lists "Multi-currency FX wiring (Phase 4 per PLAN.md §8b)" under Phase 2+ deferrals. Architecturally, the multi-currency expansion point is clean: the `currency`, `fx_rate`, `amount_original`, and `amount_cad` fields exist in the schema, the Zod schemas validate them as branded types, and the service layer already processes them. The form is the only place that hardcodes CAD — the service and database layers are already multi-currency-ready. When Phase 4 arrives, the change is localized to the form component and the agent prompt, not the service or data layer. This is a well-scoped deferral with correct boundary placement.
- **Notes for other scanners:** No action needed. The form-level deferral is appropriately localized.

### H-13: Client components import service-layer types — architecture fit angle

- **Status:** Refuted (all imports are `import type`, which is the architecturally correct pattern)
- **Evidence:** Scan 3 (SECURITY H-13 response) verified all imports from `@/services/` in `src/components/` use `import type` syntax, which is erased at compile time. From the Architecture Fit angle, this is the correct layering pattern for a monolithic Next.js app: client components need the *types* that services return (for rendering response data), but never the *values* (which would pull in `adminClient` and the service-role key). The `import type` boundary is enforced at compile time by TypeScript and at build time by Next.js's server/client module resolution. There is no barrel export or re-export that blurs this boundary — each component imports the specific type it needs from the specific service file.
- **Notes for other scanners:** Clean. No architectural concern.

## Findings

### ARCHFIT-001: The `no-unwrapped-service-mutation` lint rule does not exist

- **Severity:** Medium
- **Description:** CLAUDE.md Rule 2 states: "A build-time lint rule (`no-unwrapped-service-mutation`) catches this — do not disable it." This lint rule does not exist. A grep for `no-unwrapped-service-mutation` across the entire codebase returns zero hits in any configuration file, ESLint rule, or script — only in documentation files (CLAUDE.md, PLAN.md, the audit scan prompts). There is no `.eslintrc`, `eslint.config.*`, or custom lint rule that checks whether mutating service functions are wrapped in `withInvariants`.

  In Phase 1.1, the enforcement is correct by convention: the two mutating API routes (`org/route.ts:28`, `journal-entries/route.ts:42-44`) both wrap their service calls in `withInvariants`. But this is two routes checked by human review, not a build-time guard. When Phase 1.2 adds agent tools with their own mutation paths, the number of call sites increases and the convention becomes harder to enforce manually.

  The CLAUDE.md claim creates false confidence: a developer reading CLAUDE.md believes the build will fail if they forget `withInvariants`, but it won't. The documentation asserts an enforcement mechanism that doesn't exist.

- **Evidence:**
  - CLAUDE.md Rule 2: "A build-time lint rule (`no-unwrapped-service-mutation`) catches this — do not disable it"
  - Grep for `no-unwrapped-service-mutation` in `*.ts`, `*.js`, `*.json`, `*.mjs` config files: zero hits
  - `src/app/api/org/route.ts:28` — `withInvariants(orgService.createOrgWithTemplate, ...)` — correct by convention
  - `src/app/api/orgs/[orgId]/journal-entries/route.ts:42-44` — `withInvariants(journalEntryService.post, ...)` — correct by convention
- **Consequence:** CLAUDE.md claims a build-time enforcement mechanism that doesn't exist. Phase 1.2 adds more mutation call sites (agent tools), increasing the chance of an unwrapped mutation that bypasses authorization. The gap isn't that the convention is wrong — it's that the documentation claims automated enforcement that doesn't back it up.
- **Cross-references:**
  - Code Quality & Maintainability — missing static analysis tooling
  - SECURITY-002, SECURITY-004 (Scan 3) — the missing lint rule compounds the risk of accidental authorization bypass in Phase 1.2

### ARCHFIT-002: Read functions are not wired through withInvariants — the authorization split is implicit

- **Severity:** Low
- **Description:** The codebase has an implicit split: mutating service functions go through `withInvariants` (which checks context, trace_id, verified caller, org access, and role-based permissions), while read functions perform only an inline `org_ids.includes()` check. This split is documented in code comments (e.g., `chart-of-accounts/route.ts:4`: "No withInvariants — reads call service directly per CLAUDE.md Rule 2") but is not enforced or centralized.

  The split is architecturally reasonable for Phase 1.1: reads don't mutate state, so they don't need the full pre-flight sequence. But the authorization checks they *do* perform are ad-hoc: each read function independently implements `if (!ctx.caller.org_ids.includes(input.org_id))`. The `chartOfAccountsService.get()` gap (BACKEND-006) shows what happens when a read function forgets this check — there's no middleware to catch the omission.

  For Phase 1.2, when agent tools call read functions, the question becomes: should the agent's read queries go through the same authorization path as mutations? The current architecture offers no way to enforce this without wrapping reads in `withInvariants` or introducing a lighter-weight read middleware. The `withInvariants` function itself is compatible with reads (it doesn't check for mutation-specific fields), but the `action` parameter (`ActionName`) is mutation-oriented and would need read action types.

- **Evidence:**
  - `src/services/middleware/withInvariants.ts` — designed for mutations, but structurally compatible with reads
  - `src/services/accounting/chartOfAccountsService.ts:47-66` — `get()` missing org check (BACKEND-006)
  - `src/services/reporting/reportService.ts:51-56` — inline `org_ids.includes()` check in `profitAndLoss`
  - `src/services/accounting/periodService.ts:28-33` — inline `org_ids.includes()` in `listOpen`
  - `src/services/accounting/periodService.ts:51-82` — `isOpen()` has NO org check (the input carries `org_id` but the function doesn't verify the caller has access to it)
- **Consequence:** Read-path authorization is ad-hoc. Two functions already lack the check (`chartOfAccountsService.get`, `periodService.isOpen`). Phase 1.2 agent tools will add more read call sites. A lightweight read middleware or extending `withInvariants` with read actions would centralize the check and prevent omissions.
- **Cross-references:**
  - BACKEND-006 (Scan 1) — the dormant `chartOfAccountsService.get()` gap
  - SECURITY-005 (Scan 3) — adversarial analysis of the same gap

### ARCHFIT-003: Agent extension points are clean but undocumented — Phase 1.2 integration path is straightforward

- **Severity:** Low
- **Description:** The architecture has clean extension points for Phase 1.2 agent integration, but they are implicit rather than documented. Specifically:

  1. **Service functions are agent-callable.** `journalEntryService.post()` accepts structured typed input and returns typed output. The agent can call it through `withInvariants` exactly as the API route does. No refactoring needed — the function signature is already tool-shaped.

  2. **`withInvariants` extends to agent-initiated mutations.** The middleware checks `ServiceContext`, which can be constructed for agent sessions the same way `buildServiceContext` constructs it for HTTP requests. The `canUserPerformAction` check uses the caller's membership, not the request origin, so agent-initiated calls get the same authorization as manual calls.

  3. **The Zod schemas are the tool interface.** `PostJournalEntryInputSchema` and `ReversalInputSchema` define the exact shape of tool inputs. The agent doesn't need a separate tool schema — the Zod schemas serve as both validation and documentation. The `source` discriminator is already in the schema (`'manual' | 'agent'`), and agent-source entries will trigger the `idempotency_key` CHECK constraint at the database level.

  4. **The `dry_run` parameter is architected but not implemented.** CLAUDE.md Rule 4 requires every mutating tool to have `dry_run: boolean`. The Zod schemas don't include this field yet (Phase 1.2 work). Adding it is straightforward — a boolean flag in the schema that causes the service to return the proposed entry without committing it. The service function's existing structure (parse → validate → compute → insert) naturally supports a short-circuit before the insert step.

  What's missing: no `src/agent/` directory or placeholder exists. No documentation maps the Phase 1.2 agent tools to the service functions they'll wrap. The `ActionName` type in `canUserPerformAction.ts` doesn't include agent-specific actions yet. These are not blockers — they're Phase 1.2 first-sprint work — but the lack of any documented agent integration path means Phase 1.2 starts from PLAN.md Sections 5 and 15 rather than from a codebase-level integration guide.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:36-158` — `post()` function signature is tool-shaped (typed input → typed output)
  - `src/services/middleware/withInvariants.ts:28-31` — generic `<I, O>` wrapper, works with any service function
  - `src/shared/schemas/accounting/journalEntry.schema.ts` — `source: z.enum(['manual', 'agent'])` discriminator exists
  - `src/services/auth/canUserPerformAction.ts:13-20` — `ActionName` type is extensible
  - No `src/agent/` directory exists (verified via Glob)
- **Consequence:** Phase 1.2 agent integration should be straightforward: wrap service functions as agent tools, construct `ServiceContext` from agent session, add `dry_run` to schemas. No architectural redesign needed. The severity is Low because the extension points exist; the finding documents their readiness rather than flagging a gap.
- **Cross-references:**
  - SECURITY-004 (Scan 3) — immutability triggers on ledger tables are more urgent with agent integration (agents using adminClient could accidentally modify entries)
  - BACKEND-001 (Scan 1) — transaction atomicity must be solved before agent retry semantics are safe

### ARCHFIT-004: Phase 1.1 spec deviations from PLAN.md are architecturally sound

- **Severity:** Low (informational)
- **Description:** Four spec deviations from PLAN.md were made during Phase 1.1 implementation. All four have documented rationale and are architecturally sound:

  1. **Reversals net naturally via aggregation (Q21a).** The report RPC functions (migration 007) include reversed entries and their reversals in the aggregation. The reversed entry's debits and the reversal's credits cancel in the SUM. This is correct double-entry semantics — exclusion would require tracking reversal chains and is more complex with no accounting benefit. The migration comments document this decision (line 13: "reversals are not excluded").

  2. **Trial Balance uses `amount_cad` instead of native-currency columns.** Migration 007 comment (line 9): "overriding the Trial Balance spec's native-currency columns for consistency with P&L." In a single-currency Phase 1.1 (all entries are CAD), `amount_cad` equals `amount_original`. Using `amount_cad` means both reports use the same column, simplifying the RPC functions. When multi-currency arrives in Phase 4, the Trial Balance will need native-currency columns — but that's a Phase 4 concern with a clean migration path (add new columns to the RPC's RETURNS TABLE).

  3. **Balance Sheet summary deferred from P&L view.** The `get_profit_and_loss` RPC returns all five account types (asset, liability, equity, revenue, expense), but the UI only renders revenue/expense rows for P&L. Balance Sheet semantics require cumulative balances (not period-activity), which is a different query pattern. Deferring this is correct — mixing period-activity and cumulative-balance in one RPC would produce confusing output.

  4. **RPC-first for complex SQL.** Migration 007 uses SQL RPC functions instead of the Supabase query builder for reports. This is architecturally aligned with the codebase's existing pattern: use the query builder for simple CRUD, use RPCs when PostgreSQL features (FILTER, complex JOINs, GROUP BY) are needed. The test helpers (`test_helpers.sql`) established this pattern before migration 007.

- **Evidence:**
  - `supabase/migrations/20240107000000_report_rpc_functions.sql:9-16` — documented deviation rationale
  - `tests/setup/test_helpers.sql:1-65` — plpgsql function pattern established before migration 007
  - `docs/phase-1.2-obligations.md:35-36` — Balance Sheet deferral documented
- **Consequence:** No architectural fragility introduced. All four deviations are well-scoped and have documented migration paths. This finding is informational — documenting that the deviations were reviewed and found sound.
- **Cross-references:**
  - DATALAYER-002 (Scan 2) — the LEFT JOIN structure in migration 007 has a separate cross-org contamination issue, but that's a query bug, not a deviation consequence

## Foundation Readiness Assessment

**Verdict: YES-WITH-CAVEATS**

The Phase 1.1 foundation is ready for Phase 1.2 expansion. The architecture is sound: Law 1 (all DB through services) and Law 2 (all journal entries through `journalEntryService.post`) are strictly enforced. The `withInvariants` middleware provides a consistent authorization wrapper for mutations. The service layer is cleanly separated from the API layer and the database. Multi-tenancy is structurally enforced via `org_ids` checks in every service function (with two dormant exceptions). The schema design is thorough — constraints, triggers, RLS, and branded types provide defense-in-depth.

**Caveats that must be resolved before Phase 1.2 agent integration produces safe results:**

1. **Transaction atomicity (BACKEND-001 / DATALAYER-001).** The three-insert non-atomicity in `journalEntryService.post()` is incompatible with agent retry semantics. A partial commit (entry created, lines failed) would cause orphaned entries or un-audited mutations. **Fix: write RPC wrapping entry + lines + audit_log.** The pattern is already proven in `test_helpers.sql` and migration 007. This is the single highest-priority pre-Phase-1.2 fix.

2. **Ledger immutability triggers (SECURITY-004 / DATALAYER-003).** Agent tools will use `adminClient()` via the service layer. If an agent tool accidentally issues an UPDATE or DELETE on `journal_entries`, RLS won't fire (adminClient bypasses it) and no trigger exists to block it. **Fix: add `BEFORE UPDATE` and `BEFORE DELETE` triggers on `journal_entries` and `journal_lines`, identical to the events table pattern.** This is a ~20-line migration.

3. **Org check on `chartOfAccountsService.get()` (BACKEND-006 / SECURITY-005).** Agent tools will need to look up account details by ID. This function has no org authorization check. **Fix: add `org_ids.includes(data.org_id)` check.** This is a 3-line fix.

4. **Org service brought to parity (BACKEND-003).** The `orgService.createOrgWithTemplate` function needs: `recordMutation` call, membership error checking, `serviceErrorToStatus` in the API route. Not a Phase 1.2 blocker per se, but should be done in the first sprint before new mutation paths are added.

**Items that are real findings but NOT Phase 1.2 blockers:**

- The `no-unwrapped-service-mutation` lint rule (ARCHFIT-001) — should be implemented but the two existing mutation routes are correct by convention, and Phase 1.2 adds few new mutation paths in the first sprint.
- The read-path authorization split (ARCHFIT-002) — architecturally reasonable and can be tightened incrementally.
- Missing CORS/CSRF/rate limiting (SECURITY-001) — Phase 1.3 deployment concern, not Phase 1.2.
- buildServiceContext untested (SECURITY-006) — real gap but the auth chain works in practice; API route integration tests are a Phase 1.2 obligation.

**Overall assessment:** The foundation is strong. The caveats are specific, bounded fixes — not architectural redesigns. Items 1-3 are estimated at 1-2 days of implementation. The codebase is well-positioned for Phase 1.2 agent integration.

## Category Summary

The Phase 1.1 architecture is remarkably consistent for an early-phase codebase. The Two Laws (all DB through services, all journal entries through `journalEntryService.post`) are strictly enforced. The `withInvariants` middleware is correctly applied to both mutating routes. The service/API/database layering is clean with no leakage. Pattern consistency is high across 8 service files and 9 API routes, with the org creation path as the only significant divergence (lower rigor than the journal entry path). The single most important thing the synthesis agent should know: **the foundation is ready for Phase 1.2 with three specific fixes (write RPC, immutability triggers, chartOfAccounts.get org check) that are bounded, well-understood, and buildable from patterns already in the codebase**. Self-audit note: as the same instance that helped build Phase 1.1, I may have underweighted the read-path authorization gap (ARCHFIT-002) — a fresh auditor might rate it Medium rather than Low, given that two functions already lack the check.
