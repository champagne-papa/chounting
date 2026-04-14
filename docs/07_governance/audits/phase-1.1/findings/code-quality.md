# Code Quality & Maintainability — Findings Log

Scanner: Code Quality & Maintainability
Phase: End of Phase 1.1
Date: 2026-04-13
Hypotheses investigated: H-02, H-07, H-10, H-14

## Hypothesis Responses

### H-02: Reversal mirror check uses Number() coercion instead of decimal.js — code quality angle

- **Status:** Confirmed (duplicate helper pattern violates DRY and CLAUDE.md Rule 3)
- **Evidence:** `journalEntryService.ts:208-209` defines local `toMoney` and `toRate` helpers using `Number().toFixed()`. The canonical helpers `toMoneyAmount` and `toFxRate` in `money.schema.ts:67-77` use `decimal.js` for the same operation. Scan 1 (BACKEND-002) covers the precision risk. The code quality angle: there are now two code paths for the same operation, and the local helpers are a verbatim reimplementation with a different arithmetic library. A future developer might follow the local pattern (simpler, faster) rather than the canonical one (correct for large values). The canonical helpers are 4 import-lines away; the duplication was unnecessary.
- **Notes for other scanners:** Already covered by BACKEND-002. The fix is to replace lines 208-209 with imports of `toMoneyAmount` and `toFxRate`.

### H-07: JournalEntryDetail uses plain string instead of MoneyAmount — code quality angle

- **Status:** Confirmed (the `as unknown as JournalEntryDetail` double assertion bypasses the type system)
- **Evidence:** `journalEntryService.ts:411` uses `as unknown as JournalEntryDetail` — the only `as unknown as` pattern in the entire `src/` directory. This double assertion is necessary because the Supabase client's auto-generated types don't match the service's declared return type (`JournalEntryDetail`). The root cause is that `JournalEntryDetail.journal_lines[].debit_amount` is typed as `string` rather than `MoneyAmount`, so the coercion at lines 415-422 (which produces `MoneyAmount`) creates a type mismatch with the declared return type (which expects `string`). If the `JournalEntryDetail` type used `MoneyAmount`/`FxRate` for money fields, the coercion would be type-safe and the double assertion would be unnecessary.
- **Notes for other scanners:** Already covered by BACKEND-008 and FRONTEND H-07. The fix is to update `JournalEntryDetail` to use `MoneyAmount`/`FxRate` branded types.

### H-10: buildServiceContext never tested — code quality angle

- **Status:** Confirmed (test infrastructure gap is real and documented)
- **Evidence:** Integration tests construct `ServiceContext` manually in `testDb.ts` via `SEED` constants (lines 26-32). No test exercises `buildServiceContext`. The test coverage catalog gap #1 ("API routes — no integration tests exercise the HTTP layer") and gap #3 ("Auth flow — not tested") document this. The code quality angle: the test infrastructure is well-designed for what it tests (service-layer logic with known context), but it creates a structural blind spot for the auth chain. The `buildTestContext` pattern was a reasonable Phase 1.1 simplification — the alternative (standing up a real Next.js server with auth cookies) is significantly more complex. Phase 1.2 obligations already list "API route integration tests" as must-do.
- **Notes for other scanners:** Already covered by SECURITY-006. Not a new finding — reference only.

### H-14: Seed data flow — code quality angle

- **Status:** Refuted (seed data is correct when the full seed path is executed)
- **Evidence:** Scan 2 (DATALAYER H-14) refuted this: `dev.sql:30-42` correctly creates memberships. The friction journal's claim was about running `db:reset` without `db:seed:all`. The code quality concern: the two-step seed process (`db:reset` then `db:seed:all`) is necessary but not intuitive. DATALAYER-005 documented this as Low severity. No additional code quality finding beyond what Scan 2 already covered.
- **Notes for other scanners:** Already covered by DATALAYER-005.

## Findings

### QUALITY-001: Documentation claims enforcement mechanisms that don't exist — systemic pattern

- **Severity:** High
- **Description:** Two prior scans independently found cases where authoritative documentation describes enforcement mechanisms that aren't implemented. This is a named pattern: **aspirational-as-actual documentation**.

  **Instance 1 (ARCHFIT-001):** CLAUDE.md Rule 2 states "A build-time lint rule (`no-unwrapped-service-mutation`) catches this — do not disable it." No such lint rule exists. The ESLint config (`eslint.config.mjs`) contains only `next/core-web-vitals` — no custom rules, no architectural enforcement.

  **Instance 2 (BACKEND-007):** `recordMutation.ts:2` states "Called inside the same database transaction as the mutation it records." The JSDoc (lines 28-31) states "This guarantees the audit row is committed atomically with the data change." Neither is true — each `.insert()` is a separate auto-committed HTTP call to PostgREST.

  **Systematic check for additional instances:**
  - CLAUDE.md Rule 6 states "trace_id is generated at the entry point and propagates through every layer: caller → service → database → audit_log → every log line." Propagation to the database is correct (audit_log has a `trace_id` column). But "every log line" is aspirational — `loggerWith` is called with `trace_id` in service functions, but not all log calls in the codebase use `loggerWith`. The pattern is followed in `journalEntryService.ts:49` and `orgService.ts:15`, but `chartOfAccountsService.ts:27` and `periodService.ts:55` also follow it. This rule is actually enforced by convention and appears consistently followed.
  - CLAUDE.md Rule 5 states "the service function re-validates as defense-in-depth." `journalEntryService.post()` does re-parse input via Zod at line 45-47. `orgService.createOrgWithTemplate` does NOT — it receives a `CreateOrgInput` typed interface (line 8-11) with no Zod validation. The Zod parse happens only in the API route (line 26). This is a minor instance: the service trusts the typed input from the route.

  The pattern is dangerous because it creates false confidence. A developer reading CLAUDE.md or `recordMutation.ts` will make architectural assumptions based on guarantees that don't hold. The two confirmed instances (lint rule, transaction atomicity) have concrete consequences: the first means no build-time guard against authorization bypass, the second means the audit trail can diverge from the mutation it records.

- **Evidence:**
  - `eslint.config.mjs:12-14` — only `next/core-web-vitals`, no custom rules
  - CLAUDE.md Rule 2 — claims `no-unwrapped-service-mutation` lint rule
  - `src/services/audit/recordMutation.ts:2,28-31` — claims transactional atomicity
  - `src/services/org/orgService.ts:8-14` — no Zod validation at service boundary (minor instance)
- **Consequence:** Developers trusting the documentation make incorrect assumptions about enforcement guarantees. The lint rule gap means new mutation paths can bypass authorization without build-time detection. The transaction comment gap means defensive measures may be skipped because the audit trail is believed to be atomic.
- **Cross-references:**
  - ARCHFIT-001 (Scan 4) — lint rule instance
  - BACKEND-007 (Scan 1) — transaction comment instance
  - Security & Compliance — the false confidence in the lint rule is a security concern when Phase 1.2 adds more mutation paths

### QUALITY-002: Dead code — four unused exports across services and types

- **Severity:** Low
- **Description:** Four files export functions or types that are never imported elsewhere in the codebase:

  1. **`src/services/auth/getMembership.ts`** — exports `getMembership()` and `Membership` type. The file comment says "Used by canUserPerformAction and test helpers." Neither is true: `canUserPerformAction.ts` performs its own inline membership query (lines 67-72) using an identical pattern. No import of `getMembership` exists anywhere in the codebase.

  2. **`src/services/org/membershipService.ts`** — exports `membershipService.listForUser()`. No import of `membershipService` exists anywhere. The function duplicates what `buildServiceContext.ts:58-60` does (fetch memberships for a user), but with `adminClient` instead of the user-context client.

  3. **`src/shared/types/canvasContext.ts`** — exports `CanvasContext` and `SelectedEntity` types. These are Phase 1.2 preparations. No import of `CanvasContext` exists anywhere except the file itself. The file comment correctly labels it "created in Phase 1.1, used in Phase 1.2."

  4. **`src/shared/types/userRole.ts`** — exports `UserRole = 'executive' | 'controller' | 'ap_specialist'`. Meanwhile, `canUserPerformAction.ts:22` defines an identical `UserRole` type. `SuggestedPrompts.tsx:9` imports from `userRole.ts`; `canUserPerformAction.ts` uses its own copy. Two definitions of the same type.

  Items 1 and 2 are genuinely dead code. Item 3 is a documented Phase 1.2 placeholder. Item 4 is a type duplication.

- **Evidence:**
  - `src/services/auth/getMembership.ts` — grep for `getMembership` import: zero hits
  - `src/services/org/membershipService.ts` — grep for `membershipService` import: zero hits
  - `src/shared/types/canvasContext.ts` — grep for `CanvasContext` import: zero hits outside the file
  - `src/shared/types/userRole.ts:4` and `src/services/auth/canUserPerformAction.ts:22` — identical `UserRole` type defined twice
- **Consequence:** Minor confusion for new contributors discovering functions that appear to be load-bearing but aren't used. The `getMembership.ts` file is actively misleading — its comment claims it's used by `canUserPerformAction`, but `canUserPerformAction` does the same work inline.
- **Cross-references:**
  - BACKEND-006 (Scan 1) — `chartOfAccountsService.get()` is also unreferenced, but that's a dormant authorization gap, not dead code

### QUALITY-003: Inconsistent error throwing — two services throw raw Supabase errors instead of ServiceError

- **Severity:** Medium
- **Description:** The established pattern in this codebase is: service functions catch Supabase errors and wrap them in `ServiceError` with a typed code. This pattern is followed by `journalEntryService` (10+ instances), `reportService` (2 instances), `periodService` (2 instances), and `taxCodeService` (1 instance). Two service files break this pattern:

  1. **`chartOfAccountsService.ts:38`** — `list()` on error: `throw error` (raw Supabase PostgrestError)
  2. **`chartOfAccountsService.ts:62`** — `get()` on error: `throw error` (raw Supabase PostgrestError)
  3. **`membershipService.ts:27`** — `listForUser()` on error: `throw error` (raw Supabase PostgrestError)

  The consequence: when these functions throw, the API route's `catch (err)` block checks `err instanceof ServiceError` — which is false for a raw PostgrestError. The error falls through to the generic `{ error: 'Internal server error' }` response with status 500. The user gets no actionable information. Worse, the raw PostgrestError may leak to the API consumer if the route logs it or if the error serialization includes the message (SECURITY-007 pattern).

  The inconsistency also means the `serviceErrorToStatus` helper doesn't fire for these error paths — the error-to-HTTP mapping is bypassed entirely.

- **Evidence:**
  - `src/services/accounting/chartOfAccountsService.ts:38` — `throw error` (not `throw new ServiceError(...)`)
  - `src/services/accounting/chartOfAccountsService.ts:62` — `throw error`
  - `src/services/org/membershipService.ts:27` — `throw error`
  - `src/services/accounting/journalEntryService.ts:118` — comparison: `throw new ServiceError('POST_FAILED', ...)`
  - `src/services/reporting/reportService.ts:68` — comparison: `throw new ServiceError('READ_FAILED', ...)`
- **Consequence:** Raw Supabase errors bypass the ServiceError → serviceErrorToStatus pipeline. Users get generic 500 errors instead of typed error responses. The pattern is followed in 5 of 7 service files — the 2 exceptions are likely copy-paste oversights.
- **Cross-references:**
  - BACKEND-005 (Scan 1) — the org route's inline error mapping is a related pattern inconsistency
  - SECURITY-007 (Scan 3) — raw error messages in HTTP responses

### QUALITY-004: Convention-vs-enforcement gap — which CLAUDE.md rules have automated enforcement?

- **Severity:** Medium
- **Description:** CLAUDE.md has 10 non-negotiable rules. Some are enforced by the type system or Zod schemas; others rely entirely on author discipline. Here is the enforcement map:

  | Rule | Enforcement | Gap risk in Phase 1.2 |
  |------|-------------|----------------------|
  | 1. Two Laws (DB through services) | Convention only. `adminClient` can be imported anywhere. No lint rule restricts imports. | Medium — agent code could import `adminClient` directly |
  | 2. withInvariants wrapping | Convention only. Claimed lint rule doesn't exist (ARCHFIT-001). | High — more mutation call sites in Phase 1.2 |
  | 3. Money as string | Zod schemas enforce at boundaries. `MoneyAmount`/`FxRate` branded types provide compile-time safety. | Low — the type system catches most violations |
  | 4. Agent anti-hallucination | Not applicable in Phase 1.1. `dry_run` parameter not yet implemented. | N/A until Phase 1.2 |
  | 5. Zod at every boundary | Convention only. `orgService.createOrgWithTemplate` skips service-level Zod validation. | Low — the API route validates; this is defense-in-depth |
  | 6. trace_id + idempotency_key | trace_id: enforced by `withInvariants` Invariant 1. idempotency_key: DB CHECK constraint on `journal_entries`. | Low — structural enforcement works |
  | 7. Reversal mirror | Enforced by `validateReversalMirror` in the service + integration test 5. | Low — tested |
  | 8. No hardcoded test URLs | `pnpm test:no-hardcoded-urls` script exists (package.json:21). `testDb.ts` uses the fallback chain. | Low — grep-fail check works |
  | 9. Events table reserved | Append-only triggers enforce at DB level. | Low — structural enforcement |
  | 10. Phase 1 simplifications temporary | Documentation only. No enforcement. | N/A — this is a planning rule, not a code constraint |

  **Three rules with "Convention only" enforcement:** Laws 1 and 2 (the most important invariants in the system) and Rule 5 (Zod at every boundary). All three have plausible drift paths in Phase 1.2 when agent code, new service functions, and new API routes are added. Rules 3, 6, 7, 8, and 9 have structural enforcement (types, Zod, DB constraints, grep checks, triggers).

  **What could be automated cheaply:**
  - Law 1: ESLint rule restricting `adminClient` imports to `src/services/` and `src/db/` directories
  - Law 2: ESLint rule requiring `withInvariants` call in files under `src/app/api/` that import service functions
  - Rule 5: Custom Zod parsing enforced at service function entry points (already done for `journalEntryService.post`; missing in `orgService`)

- **Evidence:**
  - `package.json:21` — `test:no-hardcoded-urls` script exists for Rule 8
  - `eslint.config.mjs:12-14` — ESLint has only `next/core-web-vitals`, no custom rules
  - `src/services/middleware/withInvariants.ts:39-41` — trace_id enforcement for Rule 6
  - `supabase/migrations/20240101000000_initial_schema.sql:579-596` — events table triggers for Rule 9
- **Consequence:** The three most important invariants (Laws 1, 2, and Rule 5) have no automated enforcement. Phase 1.2 adds agent code and new service functions — the probability of a convention violation increases linearly with codebase size.
- **Cross-references:**
  - ARCHFIT-001 (Scan 4) — the specific lint rule gap
  - SECURITY-002 (Scan 3) — missing audit trail on org service is a Rule 5 consequence

### QUALITY-005: Test coverage gaps prioritized for Phase 1.2 readiness

- **Severity:** Medium (informational — prioritization of known gaps)
- **Description:** The test coverage catalog lists 8 gaps. All 8 are documented. This finding does not re-discover them; it prioritizes them for Phase 1.2 readiness based on evidence from Scans 1-5.

  **Priority 1 — Must-do before Phase 1.2 agent integration:**
  - Gap #1 (API route integration tests): Flagged by H-10, SECURITY-006. The auth chain (`buildServiceContext`) has never been exercised by automated tests. When agents construct `ServiceContext` from agent sessions, the same auth chain must work. Test it before building on it.
  - Gap #8 (audit_log content assertions): `recordMutation` is called but its output is never asserted. When the write RPC is introduced (to fix BACKEND-001), the audit_log write moves inside the RPC — the test must verify the audit row is produced.

  **Priority 2 — Should-do in Phase 1.2 sprint 1:**
  - Gap #6 (org creation e2e): BACKEND-003 found three bugs in `orgService.createOrgWithTemplate` (missing audit, unchecked error, inconsistent error mapping). An integration test would have caught two of them.
  - Gap #7 (concurrent entry_number): Phase 1.2 may have concurrent agent mutations. The UNIQUE constraint catches collisions with a 500 error — a retry mechanism or test is needed.

  **Priority 3 — Can defer past Phase 1.2 sprint 1:**
  - Gaps #2 (component tests), #4 (period filtering), #5 (multi-currency) — lower Phase 1.2 risk.

  **One additional gap not in the catalog:**
  - No test verifies that the report RPC functions (migration 007) correctly filter by `je.org_id`. DATALAYER-002 flagged that a cross-org account reference would silently contaminate report aggregation. A test that creates a cross-org account reference (via adminClient bypass) and verifies the report doesn't include it would catch regressions in the RPC's JOIN structure.

- **Evidence:**
  - `docs/phase-1.1-test-coverage-catalog.md` — 8 documented gaps
  - SECURITY-006 (Scan 3) — prioritizes gap #1
  - BACKEND-003 (Scan 1) — prioritizes gap #6
  - DATALAYER-002 (Scan 2) — motivates the undocumented gap (cross-org report contamination test)
- **Consequence:** Without Priority 1 tests, Phase 1.2 builds on an untested auth chain and an unverified audit trail. The cross-org report contamination test is the only net-new gap; all others are documented.
- **Cross-references:**
  - DATALAYER-002 (Scan 2) — cross-org report contamination, the undocumented test gap
  - BACKEND-001 (Scan 1) — the write RPC fix will change the test surface for gap #8

### QUALITY-006: journalEntryService.post() is an appropriate complexity concentration for Phase 1.1, but Phase 1.2's write RPC will naturally decompose it

- **Severity:** Low
- **Description:** `journalEntryService.post()` (lines 36-158, ~120 lines) performs five sequential operations: (1) Zod parse, (2) reversal mirror validation (delegated to `validateReversalMirror`), (3) period lock check, (4) entry_number computation, (5) three inserts (entry, lines, audit). This is the most complex function in the codebase.

  For Phase 1.1, the concentration is appropriate:
  - The function is readable — each step is clearly separated with comments.
  - The reversal validation is already extracted to a helper.
  - The steps are sequential and share the same `db` client — extracting them into separate functions would require passing the client through, adding ceremony without reducing complexity.
  - The function's linear structure makes the transaction atomicity gap (BACKEND-001) visible and easy to fix.

  When Phase 1.2 introduces the write RPC (to fix BACKEND-001), the function will naturally decompose:
  - Steps 3-5 (period check, entry_number, inserts) move into a plpgsql function (`post_journal_entry`).
  - Steps 1-2 (Zod parse, reversal mirror validation) remain in TypeScript.
  - The service function becomes: parse → validate mirror → `db.rpc('post_journal_entry', {...})`.

  This decomposition is driven by the atomicity fix, not by complexity concerns. The function doesn't need refactoring today.

  **Other complexity hotspots checked:** `ReversalForm.tsx` (~393 lines) is the largest component, but its complexity is form lifecycle (fetch → derive → validate → submit), which is inherently sequential. `JournalEntryForm.tsx` (~495 lines) is similar. Neither is a refactor target — they're large because forms are large.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:36-158` — 120 lines, 5 sequential operations
  - `src/services/accounting/journalEntryService.ts:162-235` — `validateReversalMirror` already extracted
  - `tests/setup/test_helpers.sql:1-65` — the plpgsql pattern that the write RPC will follow
- **Consequence:** No refactoring needed today. The Phase 1.2 write RPC will decompose the function as a side effect of fixing BACKEND-001.
- **Cross-references:**
  - BACKEND-001 (Scan 1) — the write RPC fix naturally decomposes this function

## Category Summary

The codebase is unusually well-organized for a Phase 1.1 project — strict TypeScript, zero `@ts-ignore` or `as any`, consistent naming, branded types for money, Zod validation at boundaries. The single most important thing for the synthesis agent to know: **the codebase has a systemic documentation-reality divergence pattern (QUALITY-001) where authoritative docs (CLAUDE.md, inline comments) describe enforcement mechanisms that don't exist**. This creates false confidence that compounds in Phase 1.2 when more contributors and more mutation paths are added. The three convention-only rules (Laws 1, 2, and Rule 5) are the highest-drift-risk items — adding ESLint import restrictions and a CI step that checks `withInvariants` wrapping would close the gap cheaply. The remaining findings are minor: dead code (4 files), inconsistent error throwing (2 services), known test gaps (prioritized), and a complexity hotspot that will self-resolve when the write RPC is introduced. Self-audit note: as the same instance that helped build Phase 1.1, I may have rated QUALITY-006 too generously — a fresh reviewer might see the 120-line function as a refactor target today rather than waiting for the Phase 1.2 RPC to decompose it naturally.
