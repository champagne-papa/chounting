# Backend Design & API — Findings Log

**Scanner:** Backend Design & API  
**Phase:** End of Phase 1.1 (audit cumulative; Phase 1.2 codebase scanned at HEAD = 32760e1)  
**Date:** 2026-04-27  
**Hypotheses investigated:** H-01, H-02, H-04, H-06, H-07, H-09, H-12, H-14, H-15  

---

## Hypothesis Responses

### H-01: Tool_input JSONB shape drift between inject-time and read-time

- **Status:** Inconclusive with evidence of injection discipline
- **Evidence:**
  - `src/agent/orchestrator/index.ts:1132` — the orchestrator injects `org_id` post-parse as defense-in-depth; the `input` object passed to ai_actions INSERT carries org_id, idempotency_key, and all request fields
  - `src/app/api/agent/confirm/route.ts:125-137` — replay path reads tool_input as `Record<string, unknown>` and re-parses through `PostJournalEntryInputSchema` or `ReversalInputSchema`
  - `src/app/api/agent/confirm/route.ts:142-146` — cross-check exists: if `parsed.org_id !== body.org_id` after replay, the confirm route throws `AGENT_TOOL_VALIDATION_FAILED`
  - No evidence of schema `.passthrough()` allowing unknown fields; Zod schemas are strict
  - No migration backfill discovered; the assumption is forward-only (Phase 1.2 is the first agent phase)
- **Notes for other scanners:** The tool_input re-parse on confirm is tight enough to catch shape drift at runtime. However, the schema version is not persisted; if the schema evolves after a row is written (e.g., a new required field added to ReversalInputSchema), old rows will fail re-parse. This is a future boundary-bug risk for Phase 2+, not an active issue at current HEAD because the agent path is new.

---

### H-02: Agent_sessions.conversation message-shape drift across SDK version churn

- **Status:** Inconclusive with loose loading pattern exposed
- **Evidence:**
  - `src/agent/orchestrator/loadOrCreateSession.ts:194-195` — conversation is loaded as `(raw.conversation as unknown[]) ?? []` with explicit type cast; no schema validation
  - `src/agent/orchestrator/loadOrCreateSession.ts:185-196` — the toRow() function preserves the raw conversation without parsing; returns `unknown[]` directly
  - S22 caching enablement commit 856dcc7 changed system prompt shape `string → TextBlockParam[]`; this affects `messages` construction but not the persisted `conversation` JSONB
  - No evidence of test suite seeding old SDK shapes
- **Notes for other scanners:** The loose `unknown[]` pattern is intentional — the orchestrator treats conversation as opaque context to re-transmit. The risk is if Claude SDK adds new required fields to `Message` or `MessageParam` shapes that the callClaude dispatcher assumes are present. The current SDK version is pinned but unversioned in the schema layer.

---

### H-04: Read-path authorization gaps on org-scoped service methods

- **Status:** Confirmed — `periodService.isOpen()` lacks org_id check
- **Evidence:**
  - `src/services/accounting/periodService.ts:52-83` — the `isOpen()` function accepts `{ org_id, entry_date }` but performs NO `ctx.caller.org_ids.includes(input.org_id)` check before querying fiscal_periods
  - `src/services/accounting/periodService.ts:24-46` — the sibling `listOpen()` function DOES have the check at line 29
  - `src/services/accounting/chartOfAccountsService.ts:47-66` — the `get()` function by account_id also lacks the check; only `list()` at lines 13-42 performs it
  - `src/agent/orchestrator/index.ts:1244-1327` — read-tools are dispatched without withInvariants; each service's own org-access check is the enforcement
  - Spot-check of other services: accountBalanceService, recurringJournalService, taxCodeService, addressService — all have the guard; the gap is localized to `chartOfAccountsService.get` and `periodService.isOpen`
- **Consequence:** An agent tool that calls `periodService.isOpen()` or `chartOfAccountsService.get()` can request any org_id and bypass the membership check. RLS policies on the underlying tables block the read at the DB layer (filtered by user's memberships), but the service is inconsistent with the read-path pattern established elsewhere. Phase 1.2 does not directly expose these functions from the agent (checkPeriod uses listOpen; getLedgerAccounts uses list), so the exposure is theoretical at HEAD but the gap represents debt.

---

### H-06: Transaction atomicity gap on journal entry write

- **Status:** Confirmed — sequential auto-commits, not wrapped in a Postgres transaction
- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:154-190` — INSERT journal_entries
  - `src/services/accounting/journalEntryService.ts:206-213` — INSERT journal_lines (separate call)
  - `src/services/accounting/journalEntryService.ts:220-228` — recordMutation (audit_log INSERT)
  - Each PostgREST call is independent; no wrapping transaction exists
  - `src/services/audit/recordMutation.ts:45-51` — JSDoc claims atomicity "if the caller uses the same client"; however, `adminClient()` is constructed fresh in journalEntryService.post() and passed to recordMutation(). PostgREST auto-commits each call independently
  - No RPC or `db.rpc('begin'/'commit')` wrapping exists in the codebase
  - The deferred balance constraint trigger fires at step 2 (journal_lines INSERT); if step 3 (audit_log INSERT) fails, the ledger mutation persists without an audit record
- **Consequence:** If the audit_log write fails (e.g., disk full, FK constraint violation, network flake), the journalEntryService.post() call throws, and the caller sees an error. However, the journal_entries + journal_lines writes have already committed. The ledger is corrupted (contains a posted entry with no audit trail). This violates INV-AUDIT-001 (every mutation has an audit record). Phase 2 will add more mutation paths; this gap compounds.

---

### H-07: Cross-org account_id injection on journal_lines foreign key

- **Status:** Confirmed — no composite FK, no service-layer org-membership check
- **Evidence:**
  - `src/shared/schemas/accounting/journalEntry.schema.ts:20` — JournalLineBaseSchema requires `account_id: z.string().uuid()` only; no org_id field in the line
  - `src/services/accounting/journalEntryService.ts:193-204` — lines are inserted with account_id provided by the caller; no cross-check against chart_of_accounts.org_id
  - The FK constraint enforces account_id exists but does not constrain that the account's org matches the parent entry's org
  - `src/services/accounting/journalEntryService.ts:382-398` — read-path list() includes a LEFT JOIN on chart_of_accounts to fetch account names; this enrichment assumes all accounts are accessible (would return null if org mismatch, but no explicit error)
  - RLS policy `journal_lines_insert` checks entry org via `user_has_org_access(je.org_id)` but does not validate account membership
- **Consequence:** A user in org A who knows an account_id from org B could include it in a journal entry line. The RLS policy would block the INSERT at the DB layer (adminClient bypasses RLS, but only authorized service calls invoke adminClient). The service itself has no guard. If a service or agent code path bypassed the authorization envelope, cross-org account_id references could be written to the ledger.

---

### H-09: Period lock enforcement checks only is_locked, not entry_date consistency

- **Status:** Confirmed — date-range validation missing from both service and trigger
- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:107-119` — checks `period.is_locked = false` only; no date validation
  - `src/services/accounting/periodService.ts:52-83` — the `isOpen()` function has correct date-range logic at lines 63-64 (lte start_date, gte end_date) but is never called from journalEntryService.post() (grep confirms zero matches)
  - The orchestrator's checkPeriod tool calls `periodService.listOpen()` which does not use isOpen(); the periodService.isOpen() sits unused
  - An authorized user can post an entry with entry_date inside a locked period by supplying an *open* period's fiscal_period_id; the lock check passes but the date is silently misaligned with the period
- **Consequence:** Audit trail and period analytics break. An entry posted 2026-03-15 with fiscal_period_id pointing to 2026-04-01..2026-04-30 is technically "locked" by the constraint, but the entry_date contradicts the assigned period. INV-LEDGER-002 (period-lock) is violated in spirit.

---

### H-12: Service layer mutation-surface CI guard absent; withInvariants wrap is convention-only

- **Status:** Confirmed — no ESLint rule, no pre-submit hook
- **Evidence:**
  - `eslint.config.mjs` — no `no-restricted-imports` rule restricting adminClient or enforcing withInvariants wrap
  - `src/app/api/agent/reject/route.ts` — calls `adminClient()` directly (lines 28, 49) without wrapping in withInvariants; however, this is explicitly documented as a "no service-layer abstraction" pattern per the file header (sub-brief §4)
  - The reject route does NOT invoke any service functions; it directly mutates ai_actions JSONB. It is NOT a withInvariants bypass because there is no service to wrap
  - Spot-check of other routes: journal-entries route (confirmed), organization-profile route — both use withInvariants correctly
- **Notes for other scanners:** The reject route is a special case: it's an adminClient caller without service-layer dispatch, and the code explicitly documents this. The gap is real (no ESLint guard), but the human enforcement is working at HEAD. Phase 2 will add more routes; formalization via ESLint should be scheduled.

---

### H-14: Anthropic SDK message shape drift — cache_read/cache_creation tokens and block-type unions

- **Status:** Inconclusive; no evidence of stale types at HEAD but post-caching drift possible
- **Evidence:**
  - `src/agent/orchestrator/callClaude.ts:99-228` — the response handling does not explicitly read `usage.cache_read_input_tokens` or `usage.cache_creation_input_tokens`
  - Commit 856dcc7 changed `system: string` → `system: TextBlockParam[]` and required a compat shim in tests
  - No explicit import of SDK types for `usage` or `content` blocks; the code treats response as `Anthropic.Messages.Message` with implicit shape assumptions
  - The test setup uses `tests/setup/getSystemPromptText.ts` to extract text from the new system shape; no similar shim for usage fields
- **Consequence:** If the SDK evolves to emit new usage fields (cache tokens) or if the content block union shifts, the code doesn't explicitly validate those shapes. The orchestrator doesn't currently read cache usage metrics, so the gap is benign for Phase 1.2 but represents a boundary-mismatch risk for Phase 2 cost tracking.

---

### H-15: Agent tool selection hints insufficient for disambiguating cross-org access in Mode B

- **Status:** Partially confirmed; read-service gaps exist but tool selection is tightened
- **Evidence:**
  - `src/agent/orchestrator/index.ts:1100-1110` — ORG_SCOPED_TOOLS guard rejects multi-org scenarios; the agent cannot call org-scoped tools without an active org_id
  - `src/agent/orchestrator/index.ts:1244-1327` — read-tools are passed `orgId = session.org_id as string`, which is guaranteed non-null by the guard
  - The underlying gap (H-04: chartOfAccountsService.get and periodService.isOpen lack checks) exists, but the tool dispatcher is fortress-tight: session.org_id is the only org the agent can see
  - However, if a future tool directly called `chartOfAccountsService.get()` without going through the read-tool dispatch pattern, the gap would be exposed
- **Consequence:** At HEAD, the agent cannot leak cross-org data because it doesn't have cross-org visibility. The read-service gaps are latent bugs waiting for a new tool or code path that bypasses the dispatcher's filter.

---

## Findings

### BACKEND-001: Period-lock enforcement allows date-range bypass via fiscal_period_id mismatch

- **Severity:** High
- **Description:**  
The period-locking invariant (INV-LEDGER-002) is enforced only by checking the supplied `fiscal_period_id.is_locked` flag, without validating that the `entry_date` actually falls within the period's `[start_date, end_date]` range. An authorized user can post a journal entry with `entry_date` inside a locked fiscal period by supplying an *open* period's fiscal_period_id. The lock check passes (because the supplied period is not locked), but the entry's date contradicts its assigned period.

The correct date-range validation exists in `periodService.isOpen()` (lines 63-64) but is never called during journal entry posting. The service layer has the logic; it is simply not invoked.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:107-119` — only checks `period.is_locked`; no date validation
  - `src/services/accounting/periodService.ts:52-83` — `isOpen()` has the correct date-range check (`lte(start_date)` + `gte(end_date)`) but is unreachable from the post path
  - Requirement from known-concerns.md §7: "neither validates that `entry_date` actually falls within the period's `[start_date, end_date]` range"
  
- **Consequence:** Ledger entries are posted with mismatched entry_date and fiscal_period_id. Period-based reports and audit trails become inaccurate. The lock invariant is bypassed.

- **Cross-references:** Known-concerns.md §7; H-09

---

### BACKEND-002: Transaction atomicity gap: journal entry + audit log writes auto-commit independently

- **Severity:** High
- **Description:**  
`journalEntryService.post()` executes four sequential PostgREST calls (INSERT journal_entries, INSERT journal_lines, recordMutation audit_log INSERT, and optionally INSERT ai_actions) in the function body. Each call is an independent auto-commit transaction. The deferred balance constraint fires at step 2, but if step 3 (audit_log) fails, the ledger mutations persist without an audit record, violating INV-AUDIT-001.

The JSDoc on `recordMutation.ts:45-51` claims "atomicity if the caller uses the same client," but the actual mechanism is not a Postgres transaction. The same PostgREST client is passed, but each call auto-commits independently.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:154-228` — four sequential INSERT calls with no transaction wrapper
  - `src/services/audit/recordMutation.ts:57-79` — the function throws if the INSERT fails, but this is after the ledger writes have already committed
  - No `db.rpc('begin')` or explicit transaction wrapping in the codebase
  - Line 6 of recordMutation.ts states "Simplification 1: synchronous write"; the simplification assumes a transaction but does not enforce it at the infrastructure layer

- **Consequence:** A failure during the audit_log INSERT leaves the ledger in a partially-mutated state with no forensic breadcrumb. The audit_log row is load-bearing per INV-AUDIT-001; this gap is a correctness bug. Phase 2 will add more mutation paths (mobile approvals, remote signatures); each path inherits this gap.

- **Cross-references:** Known-concerns.md §4; H-06; Phase 1.1 carry UF-001

---

### BACKEND-003: Read-service authorization check missing on periodService.isOpen()

- **Severity:** Medium
- **Description:**  
The `periodService.isOpen()` function lacks the `ctx.caller.org_ids.includes(input.org_id)` guard that every other org-scoped read function performs. A caller can invoke `isOpen()` with any org_id and receive the period query result for that org (though RLS policies on the underlying table would block the read at the DB layer for a user outside that org).

The sibling `listOpen()` function in the same file has the guard at line 29. The pattern is inconsistent.

- **Evidence:**
  - `src/services/accounting/periodService.ts:52-83` — `isOpen()` has NO org check; jumps directly to `eq('org_id', input.org_id)` at line 62
  - `src/services/accounting/periodService.ts:24-46` — `listOpen()` performs the check at line 29
  - `src/services/accounting/chartOfAccountsService.ts:47-66` — `get()` also lacks the check; only `list()` (lines 13-42) has it
  - The pattern across accounting services: `chartOfAccountsService.list()`, `periodService.listOpen()`, `periodService.lock()` all have the guard; `get()` and `isOpen()` do not

- **Consequence:** Service-layer authorization is inconsistent. While RLS policies protect the DB layer, the service exposes a gap in the authorization envelope. Phase 1.2 does not call these functions from the agent, so the exposure is latent. Phase 2 or future code that adds a tool calling `isOpen()` directly would inherit this gap.

- **Cross-references:** Known-concerns.md §2; H-04

---

### BACKEND-004: Cross-org account_id injection possible via missing composite foreign key

- **Severity:** Medium
- **Description:**  
`journal_lines.account_id` references `chart_of_accounts(account_id)` but the FK does not constrain that the account's `org_id` matches the parent `journal_entries.org_id`. The Zod schema validates only `account_id: z.string().uuid()` without org membership. `journalEntryService.post()` does not assert that all line accounts belong to the entry's org.

A user in org A could, if the authorization envelope were bypassed, include an account_id from org B in a journal entry line. The RLS policy on journal_lines insertion checks the entry's org but not the account's org.

- **Evidence:**
  - `src/shared/schemas/accounting/journalEntry.schema.ts:19-29` — JournalLineBaseSchema requires only `account_id: z.string().uuid()`; no org_id field exists in lines
  - `src/services/accounting/journalEntryService.ts:193-204` — lines are inserted with caller-provided account_id; no cross-check against chart_of_accounts membership
  - The FK enforces account_id exists but not org parity

- **Consequence:** Cross-org account references could be written to the ledger if the service-layer authorization (withInvariants, RLS) is bypassed. Today, this is mitigated by the fortress-tight agent dispatcher (H-15), but it represents a secondary defense gap.

- **Cross-references:** Known-concerns.md §5; H-07

---

### BACKEND-005: Tool_input JSONB re-parse on confirm route creates schema-version drift risk

- **Severity:** Medium
- **Description:**  
The confirm route reads `ai_actions.tool_input` JSONB and re-parses it through `PostJournalEntryInputSchema` or `ReversalInputSchema` with `dry_run: false`. The route includes a cross-check (`parsed.org_id !== body.org_id` throws error), which is good. However, the schema version is not persisted with the tool_input; if the schema evolves after a row is written (e.g., a new required field added), old rows will fail re-parse at confirmation time.

At HEAD, this is theoretical because Phase 1.2 is the first agent phase; all rows are fresh. Phase 2+ will carry forward rows across schema evolutions.

- **Evidence:**
  - `src/app/api/agent/confirm/route.ts:125-137` — re-parses tool_input through the Zod schema
  - `src/app/api/agent/confirm/route.ts:142-146` — cross-check for org_id mismatch
  - No schema versioning in the tool_input JSONB; no migration backfill strategy documented

- **Consequence:** A Phase 2 schema change that adds a required field to the journal entry schema could cause old tool_input rows to fail validation and become non-confirmable. The rows would be stuck as "pending" permanently. This is a future risk, not an active bug at HEAD.

- **Cross-references:** H-01; boundary-bug hunt (DESIGN.md Constraint #5)

---

### BACKEND-006: orchestrator's buildSystemPrompt injects 5+ suffixes with loose ordering and determinism

- **Severity:** Low
- **Description:**  
The system prompt is composed from 5+ sections in a specific order: temporal context, persona, org context, locale, onboarding, canvas context. The composition is string concatenation with blank-line separators. Each suffix is individually deterministic, but the overall construction relies on the correct section order being maintained by convention in future edits.

The code is correct at HEAD; this is a fragility note for Phase 2+.

- **Evidence:**
  - `src/agent/orchestrator/buildSystemPrompt.ts:74-102` — sections joined with `'\n\n'` in a specific order
  - Order: temporal, base persona, org summary, locale, onboarding, canvas
  - No schema or validation that all sections are present or in order

- **Consequence:** A future edit that reorders sections could change the agent's interpretation of the prompt without a syntax error. The order matters for prompt engineering (early sections take precedence in Claude's reasoning). This is a maintainability risk, not a correctness bug.

- **Cross-references:** None

---

### BACKEND-007: Reject route uses adminClient directly without service abstraction; audit emit missing

- **Severity:** Low
- **Description:**  
The `/api/agent/reject` route mutates `ai_actions` directly via `adminClient()` without routing through a service function or `withInvariants`. The code is explicit about this design (route header: "no service-layer abstraction per sub-brief §4"), and the mutation is authorized by the existing buildServiceContext JWT validation.

However, there is no audit emit for the rejection. The ai_actions status change is not logged to the audit_log table. A future requirement for "which user rejected which proposal" traceability would need to backfill or add logging.

- **Evidence:**
  - `src/app/api/agent/reject/route.ts:1-6` — explicit documentation of the pattern
  - Lines 120-126: direct ai_actions UPDATE without wrapping
  - No `recordMutation()` call on rejection

- **Consequence:** Rejection decisions are not forensically traceable. Phase 2 mobile approval flows will likely need audit trails for regulatory compliance. This should be scheduled as a Phase 2 fix, not a Phase 1.2 blocker.

- **Cross-references:** None

---

## Category Summary

Backend Design & API shows solid enforcement infrastructure (withInvariants middleware, Zod schemas at boundaries, error-to-HTTP mapping) but three critical gaps that compound:

1. **Period-lock bypass** (BACKEND-001): the date-range check exists but is not called, leaving a simple business-rule gap.
2. **Transaction atomicity** (BACKEND-002): sequential auto-commits without Postgres-layer transaction wrapping, inherited from Phase 1 simplifications.
3. **Read-service authorization inconsistency** (BACKEND-003): two functions lack the org-check guard, latent until Phase 2 exposes them via new tools.

The tool_input replay path (confirm route) is sound but carries future schema-evolution risk (BACKEND-005). The orchestrator's system prompt construction is string-based and fragile (BACKEND-006), but correct at HEAD.

**Self-audit bias note:** This scanner helped design the journalEntryService.post() architecture and the tool_input injection pattern. The findings reflect actual code inspection, but confirm-biased familiarity may have caused underestimation of complexity in the system prompt suffix composition (BACKEND-006) and overestimation of risk in the tool_input re-parse (BACKEND-005). Phase 3 synthesis should weight cross-category evidence (e.g., Data Layer & Schema scanner's findings on transaction isolation) more heavily than this category's solo observations on atomicity.

