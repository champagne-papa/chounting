# Action Plan — Phase 1.2

Date: 2026-04-28
Source: Audit Report Phase 1.2
All items reference audit findings by ID.

---

## Quick Wins (< 1 day each, 1–2 week horizon)

### QW-01: Wire MFA enforcement middleware to request path
- **Finding:** UF-009
- **What to do:** Import `enforceMfa` from `src/middleware/mfaEnforcement.ts` into the top-level `middleware.ts` and invoke it in the middleware chain. The implementation already exists; it just needs to be called.
- **Why now:** The middleware is fully implemented but dead code. Flipping the feature flag (setting `mfa_required = true` on an org) currently has no runtime effect. One-line import + one-line call.
- **Done when:** When an org has `mfa_required = true`, non-MFA users are redirected to MFA enrollment. Test or manual verification in browser.

### QW-02: Fix `chartOfAccountsService.get()` org authorization check
- **Finding:** UF-002
- **What to do:** Add `if (!ctx.caller.org_ids.includes(input.org_id)) throw ServiceError('FORBIDDEN', ...)` guard at the start of `chartOfAccountsService.get()`, matching the pattern in `chartOfAccountsService.list()` (line 20) and all other read functions. Also wrap the raw Supabase error throw in `ServiceError`.
- **Why now:** 3-line change. Currently unreachable (zero call sites in Phase 1.1), but agent tool dispatch now exposes it as callable. Closes the cross-org read leak.
- **Done when:** Function throws `ServiceError` with code `FORBIDDEN` when called with an org the user doesn't belong to. All Supabase errors wrapped in `ServiceError`.

### QW-03: Add period-lock date-range validation
- **Finding:** UF-004
- **What to do:** In `journalEntryService.post()` (lines 107–119), after the existing `is_locked` check, add a second validation: `if (period.start_date > entry.entry_date || entry.entry_date > period.end_date) throw ServiceError(...)`. The `periodService.isOpen()` function (lines 52–65) has the correct logic; call it or replicate its bounds check.
- **Why now:** Single guard clause. Known concern from Phase 1.1; Phase 1.2 agent paths expose it. Ensures period-lock enforcement covers both the boolean and the date range.
- **Done when:** Posting an entry with `entry_date` outside the period's range raises `ServiceError`. Test with dates before `start_date` and after `end_date`.

### QW-04: Add ledger immutability triggers
- **Finding:** UF-001
- **What to do:** Create a migration adding `BEFORE UPDATE` and `BEFORE DELETE` triggers on `journal_entries` and `journal_lines` tables, modeled on the existing `events` table triggers (`trg_audit_log_no_update`, `trg_audit_log_no_delete`). The pattern is: `RAISE EXCEPTION 'Ledger entries are immutable'`.
- **Why now:** ~20-line migration. Pattern already exists in the codebase. Phase 1.2 agent paths compound the risk; Phase 2 expansion makes this critical. No service-layer bypass, RLS bypass, or direct DB access should allow modification.
- **Done when:** `UPDATE journal_entries SET ...` raises database exception, regardless of who calls it. Same for DELETE and all columns.

### QW-05: Add cross-org FK guard on journal_lines.account_id
- **Finding:** UF-005
- **What to do:** Add a CHECK constraint or trigger on `journal_lines` verifying that the referenced `account_id` belongs to the same `org_id` as the parent `journal_entry`. Migration pattern: `ALTER TABLE journal_lines ADD CONSTRAINT check_account_org AS (account_org = journal_entry_org)` using a subquery or trigger.
- **Why now:** Complements QW-02. Together, they close the cross-org account reference window. Single-org ledger integrity is foundational.
- **Done when:** Attempting to insert a `journal_line` with an `account_id` from a different org raises a constraint violation. Test with multi-org setup.

### QW-06: Conversation shape validation on load
- **Finding:** UF-007
- **What to do:** Replace the `as unknown[]` cast in `src/agent/orchestrator/loadOrCreateSession.ts:194` with explicit Zod validation. Create a schema for `Anthropic.Messages.Message[]` (or a permissive union covering both old and new SDK shapes) and validate the loaded conversation against it. On validation failure, log a warning and initialize with empty history.
- **Why now:** Defensive against SDK shape drift. Phase 2 will rotate sessions across SDK versions; this validates on load and prevents type errors at call time.
- **Done when:** Loaded conversations validate against a Zod schema. Old SDK shapes either pass validation or are logged as mismatches and replaced with empty history.

### QW-07: Reduce PII in audit log via before_state redaction
- **Finding:** UF-010
- **What to do:** Extend `recordMutation.ts` to filter out PII fields before writing `before_state` to `audit_log`. Create a redaction function that strips `invited_email`, `phone`, `first_name`, `last_name`, `display_name` from the blob before persisting.
- **Why now:** Right-to-erasure obligation. Audit log is append-only, so PII cannot be selectively scrubbed later. Redacting at write time prevents accumulation.
- **Why now:** While the full PII strategy (access controls, retention policy) is Phase 2 work, preventing new PII capture in audit_log is a quick win that reduces future compliance liability.
- **Done when:** `audit_log.before_state` no longer contains `invited_email`, `phone`, or name fields. Existing rows (if any) should be noted as technical debt and planned for Phase 2 cleanup.

---

## Medium-Term Refactors (1–3 months)

### MT-01: Implement write RPC for transaction atomicity
- **Findings:** UF-001, UF-003
- **What to do:** Create a plpgsql function (e.g., `write_journal_entry_atomic()`) that wraps all three inserts (journal_entries, journal_lines, audit_log) in a single database transaction. Replace the three independent PostgREST calls in `journalEntryService.post()` with a single RPC call. The pattern is proven in `test_helpers.sql` (lines 50–80) and migration 007.
- **Dependencies:** None. This is the single highest-priority item and should be the first Phase 2 task. Blocks agent retry expansion and mobile approvals path.
- **Done when:** `journalEntryService.post()` executes all three operations within a single database transaction. A failure at any point (e.g., audit_log insert fails, balance constraint fires) rolls back the entire operation. Integration tests verify partial-failure rollback and orphan prevention.

### MT-02: Build canvas data refresh mechanism
- **Findings:** UF-014
- **What to do:** Implement a mechanism for mutations to trigger canvas data refresh. Simplest option: add a `refreshKey` counter in `SplitScreenLayout` state, increment it after any mutation (via a callback passed to mutation handlers), and pass it as a dependency to all canvas data fetch hooks. When `refreshKey` changes, hooks re-fetch.
- **Dependencies:** None, though coordinates naturally with MT-01 (the write RPC provides a clean mutation success signal for triggering refresh).
- **Done when:** A mutation performed via the chat panel (agent approval) causes the canvas to visibly re-fetch and display updated data without manual page refresh. Test with agent mutation → canvas list view showing new entry.

### MT-03: Extend `withInvariants` with read-path enforcement
- **Findings:** UF-002 (broader application)
- **What to do:** Create a lightweight `withReadAuth` wrapper or extend `withInvariants` to support read operations. This wrapper enforces `ctx.caller.org_ids.includes(input.org_id)` for every read function, making org authorization automatic rather than convention. Apply to all current read functions and establish as a required pattern for future reads.
- **Dependencies:** QW-02 should land first (fixes the immediate gaps).
- **Done when:** Every read function in `src/services/` either goes through the wrapper or explicitly documents why it doesn't require org scoping. A new read function that omits the check fails lint or CI.

### MT-04: Add conversation rotation and saturation observability
- **Findings:** UF-011
- **What to do:** Implement a turn-count threshold for session rotation (e.g., rotate after 20 turns to keep context budget <180k tokens). Add observability: log session turn counts at key points, emit a metric when saturation is approached, alert operators when a session is recycled due to saturation. Phase 2 obligations document cross-turn caching; this grounds observability in the rotation policy.
- **Dependencies:** None.
- **Done when:** Sessions with 20+ turns are detected and rotated before context-window saturation causes `AGENT_STRUCTURED_RESPONSE_INVALID` failures. Operators see metrics on session rotation frequency.

### MT-05: Add audit-emit failure alerting
- **Findings:** UF-008
- **What to do:** In the try/catch blocks that suppress audit emit failures (orchestrator index.ts lines 187–205, 1272–1295, loadOrCreateSession.ts lines 152–179), add a dedicated counter metric (`audit_emit_failure_count`) or structured log flag. Set up an alert if the failure rate exceeds a threshold (e.g., > 1 failure per 100 agent operations).
- **Dependencies:** None. Observability-only; does not block mutations.
- **Done when:** Operators are alerted if audit emit fails. Logs explicitly flag swallowed errors so forensics can identify operations without session attribution.

### MT-06: Pino redaction config expansion
- **Findings:** UF-010
- **What to do:** Extend `REDACT_CONFIG.paths` in `src/shared/logger/pino.ts` to include `email`, `phone`, `first_name`, `last_name`, `display_name` alongside existing financial PII paths. Verify redaction works on both direct log statements and nested object properties.
- **Dependencies:** None.
- **Done when:** Pino logs no longer output plaintext email, phone, or name fields. Test with a log statement that includes these fields.

---

## Long-Term Roadmap (3–12 months)

### LT-01: Convention-to-enforcement migration for all critical invariants
- **Findings:** UF-006
- **What to do:** Systematically convert all convention-only rules to automated enforcement. Beyond QW-01 (ESLint for `adminClient`), this includes: (a) ESLint `no-restricted-imports` rule preventing `adminClient` import outside `src/services/`, (b) CI check for `withInvariants` wrapping on all mutating exports, (c) CI grep-fail for hardcoded test URLs (CLAUDE.md Rule 8), (d) documentation-reality reconciliation (audit all CLAUDE.md claims against implementation).
- **Phase alignment:** Phase 1.3 (deployment readiness and CI/CD). Pre-Phase 2 if possible.
- **Done when:** Every non-negotiable rule in CLAUDE.md has a corresponding automated check (lint, CI, type system, or database constraint). No rule relies solely on convention.

### LT-02: Test coverage for Phase 2 readiness gaps
- **Findings:** UF-013, UF-014 (test coverage)
- **What to do:** Address the full test gap list: (a) API route integration tests for agent confirm/reject paths, (b) conversation saturation curve characterization (turn counts up to 32, verify context-window behavior), (c) cross-org report contamination test (attempt to reference account from org B in org A's entry, verify rejection), (d) audit-log PII presence assertions (verify redaction is working), (e) period-lock date-range enforcement test (post entries before/after period range, verify rejection).
- **Phase alignment:** Phase 1.2 sprint 2 or Phase 2 sprint 1.
- **Done when:** All five test gaps have corresponding test cases. `pnpm test:integration` covers all paths.

### LT-03: Service-layer mutation authorization lint enforcement
- **Findings:** UF-006
- **What to do:** Add an ESLint rule `no-restricted-imports` that prevents importing `adminClient` from any file outside `src/services/`. Any route or component that needs mutation must use the service-layer wrapper, not raw `adminClient`.
- **Phase alignment:** Phase 1.3 (deployment CI/CD). Pre-Phase 2 if possible.
- **Done when:** `pnpm lint` fails on any file outside `src/services/` that imports `adminClient`.

### LT-04: Hand-maintained tool set consistency check
- **Findings:** QUALITY-006
- **What to do:** Add a lint rule or test that verifies `ORG_SCOPED_TOOLS` Set (orchestrator index.ts:1098–1104) contains all tools that should require non-null org_id. Either codify as a brief requirement (via decorator or metadata on tool definitions) or add a test that compares the Set against the tool registry.
- **Phase alignment:** Phase 2 sprint 1 (when new tools are added).
- **Done when:** Adding a new org-scoped tool automatically propagates to the enforced Set, or drift is detected at CI time.

---

## Architecture Redesign Recommendations

No redesign recommendations at Phase 1.2. The layered architecture (services → API routes → frontend, with RLS as defense-in-depth) is sound. The agent integration demonstrates the architecture scales to multiple mutation paths. The findings describe implementation gaps (convention vs. mechanical enforcement, transaction wrapping, schema validation) and specific vulnerabilities (read-path org checks, ledger triggers, PII redaction), not structural problems. The Two Laws are correct in design — they need automated enforcement, not rethinking.

---

## Explicit "Do Not Do" List

### DND-01: Do not add CORS/CSRF/rate limiting now
- **Finding:** Phase 1.1 UF-011 (not re-flagged in Phase 1.2)
- **Why accepted:** Local development only. No network exposure. Cookie-based session risk is real but only materializes at deployment (Phase 1.3). Adding these protections now would add complexity and testing burden to a codebase not yet deployed. Phase 1.3 deployment brief should include this as a blocking requirement.

### DND-02: Do not rebuild conversation table for shape versioning
- **Finding:** UF-007 (partial; QW-06 addresses the more immediate gap)
- **Why accepted:** Phase 2 session rotation will introduce new conversations under the current SDK version. Backfilling old sessions is Phase 2 technical debt; new sessions will not have old SDK shapes. QW-06 validates on load and handles mismatches defensively. Full shape-migration work is Phase 2 obligation.

### DND-03: Do not implement full PII compliance suite now
- **Finding:** UF-010 (partial; QW-07 and MT-06 address capture prevention)
- **Why accepted:** Access controls (who can read audit_log), retention policies (when to purge), and selective erasure mechanisms are Phase 2 obligations explicitly documented in obligations.md. QW-07 prevents new PII capture at the source. Full right-to-erasure implementation requires table rebuild, data retention policy, and access control redesign — Phase 2 work. For Phase 1.2, preventing new accumulation is the priority.

### DND-04: Do not add pagination now
- **Finding:** Phase 1.1 baseline (Performance-001, low severity)
- **Why accepted:** Phase 1.2 data volumes are trivially small. List endpoints without pagination are correct at this scale. When entry counts approach hundreds per period (Phase 1.3+), pagination becomes worthwhile. Premature optimization would add complexity to every list endpoint and its consumer.

### DND-05: Do not refactor agent orchestrator decomposition now
- **Finding:** QUALITY-005 (large file, 1,343 LOC)
- **Why accepted:** The file's structure is functional and well-commented. Intermediate decomposition would not change behavior or fix any bug. Phase 2's agent expansion (more tools, more personas) will naturally require refactoring for maintainability. Refactoring now would risk introducing bugs in the orchestrator, which is stable at Phase 1.2 closure.
