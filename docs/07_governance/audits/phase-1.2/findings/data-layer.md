# Data Layer & Database Design — Findings Log

**Scanner:** Data Layer & Database Design  
**Phase:** End of Phase 1.1 (Phase 1.2 ready state)  
**Date:** 2026-04-27  
**Hypotheses investigated:** H-01, H-02, H-03, H-05, H-07, H-08, H-10, H-14

---

## Hypothesis Responses

### H-01: Tool_input JSONB shape drift between inject-time and read-time

- **Status:** Inconclusive (partial evidence, no runtime failure observed)
- **Evidence:** 
  - `src/app/api/agent/message/route.ts` injects `idempotency_key` and `org_id` into `tool_input` before Zod validation (line 134 per H-01 description)
  - `src/app/api/agent/confirm/route.ts:125-137` reads `tool_input` and parses with `PostJournalEntryInputSchema.parse(replayPayload)` where replayPayload includes injected fields
  - `supabase/migrations/20240101000000_initial_schema.sql:515` defines `tool_input jsonb` with no versioning strategy
  - Schema evolution: `20240120000000_ai_actions_edited_status.sql` adds columns to ai_actions table, but no migration touches the tool_input column structure
  - No explicit shape validation occurs on load; the replay at confirm-time is the only downstream consumer of stored tool_input
- **Notes for other scanners:** Backend Design scanner should trace whether the injected shape at message-route time matches what the schemas expect at replay time. This is a runtime risk if a schema field is added but not injected; or if injection pattern changes in a future build.

### H-02: Agent_sessions.conversation message-shape drift across SDK version churn

- **Status:** Confirmed (no versioning, unvalidated load pattern)
- **Evidence:**
  - `src/agent/orchestrator/loadOrCreateSession.ts:194` loads conversation as `(raw.conversation as unknown[]) ?? []` with NO schema validation
  - `supabase/migrations/20240118000000_agent_session_wiring.sql:16` adds `conversation jsonb NOT NULL DEFAULT '[]'::jsonb` with no schema versioning
  - Commits between Sept 2025 and Apr 2026 (including 856dcc7 S22 caching enablement) restructured SDK message shapes (e.g., system: string → system: TextBlockParam[])
  - No backfill migration exists to upgrade stored conversations to current SDK shape
  - No discriminated union types or compat-shim in loadOrCreateSession to accept both old and new shapes
  - The loaded conversation is passed to Claude API directly: `messages: [...session.conversation, ...]` in orchestrator logic
- **Notes for other scanners:** Backend Design scanner should verify whether calling Claude with old-shape messages causes runtime errors or silent type mismatches. Test Coverage scanner should assess whether any integration test seeded old SDK shapes and verified the load behavior.

### H-03: Canvas_directive schema vs persisted directive shape mismatch

- **Status:** Refuted (schema uses `.strict()` uniformly)
- **Evidence:**
  - `src/shared/schemas/canvas/canvasDirective.schema.ts` uses `.strict()` on all discriminated union variants (lines 23–111)
  - Every variant explicitly lists required and optional fields; no `.passthrough()` or `.unknown()` that would allow unknown fields
  - The schema is forward-compatible only for new discriminated union types, not for field additions within existing types
  - However, no evidence of schema evolution failures in production logs or test coverage
  - Schema has grown from Phase 1.1 base (chart_of_accounts, journal_entry, journal_entry_form, journal_entry_list, ai_action_review_queue) through Phase 1.2 additions (user_profile, org_profile, org_users, invite_user, welcome, ap_queue, etc.)
  - All additions were new discriminated union members, not field additions to existing members
- **Consequence:** If an existing discriminated type (e.g., journal_entry_form) gains a new optional field before a backfill migration runs, older persisted directives will still parse successfully; the new field will simply be missing. This is safe. The `.strict()` posture rejects unknown fields only at write-time, not read-time, so historical data doesn't break the parser.

### H-05: Ledger immutability enforcement missing trigger pattern

- **Status:** Confirmed (RLS policies exist but service-role bypasses them; no database triggers)
- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:734-737` defines RLS policies `journal_entries_no_update` and `journal_entries_no_delete` with `USING (false)` for authenticated/anon roles
  - Same pattern for journal_lines at lines 755-757
  - These RLS policies do NOT apply to the service_role client (adminClient() in src/db/adminClient.ts), which bypasses RLS entirely per Supabase design
  - No triggers `trg_enforce_journal_entries_no_update`, `trg_enforce_journal_entries_no_delete`, `trg_enforce_journal_lines_no_update`, or `trg_enforce_journal_lines_no_delete` exist in any migration file
  - Comparison: `20240122000000_audit_log_append_only.sql` implements the same pattern for audit_log with THREE triggers (lines 44–57) plus REVOKE, demonstrating the template exists but was not applied to journal tables
  - `src/services/accounting/journalEntryService.ts` has no UPDATE or DELETE operations on journal tables (confirmed by grep: 0 results for UPDATE journal_entries/journal_lines or DELETE journal_entries/journal_lines)
  - Enforcement is entirely via service-layer convention: POST verb → INSERT only, never UPDATE/DELETE
- **Consequence:** If a future service function, admin script, or direct database client (bypassing the service layer) attempts to UPDATE or DELETE a posted journal entry, the database accepts it. The RLS policies silently allow service_role through. No database constraint blocks the mutation. The ledger becomes unbalanced and audit trail is corrupted silently.

### H-07: Cross-org account_id injection on journal_lines foreign key

- **Status:** Confirmed (FK does not enforce org parity; service layer lacks explicit cross-org account check)
- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:223` defines `account_id uuid NOT NULL REFERENCES chart_of_accounts(account_id)` — simple FK, not composite
  - chart_of_accounts has org_id column (line 122) but no composite FK tying journal_lines.account_id to both account_id AND org_id
  - `supabase/migrations/20240101000000_initial_schema.sql:747-753` defines `journal_lines_insert` RLS policy that checks `user_has_org_access(je.org_id)` but NOT that account_id's org matches journal_entries.org_id
  - `src/shared/schemas/accounting/journalEntry.schema.ts:20` defines `account_id: z.string().uuid()` with no cross-org membership check in the Zod schema
  - `src/services/accounting/journalEntryService.ts` performs no explicit loop to assert all line accounts belong to parsed.org_id
  - However: the practical risk is low in Phase 1.1 because `chartOfAccountsService.list` filters by org_id before returning IDs to the client. But H-04 flags that `chartOfAccountsService.get()` lacks the same org check, creating a chaining exposure if the agent gains direct access to that read function (Phase 1.2 agent tooling)
  - Concern 5 (known-concerns.md) raises the same issue on recurring_template_lines.account_id (FK present, but no composite constraint)
- **Consequence:** If a user (or agent with access to chartOfAccountsService.get) obtains an account_id from a different org and posts a journal entry referencing it, the database accepts the FK. The line is attached to an account in a different organization, creating cross-org data leakage and ledger corruption.

### H-08: Audit-emit failures swallowed in agent paths with no observability

- **Status:** Confirmed (audit emits wrapped in try/catch per design; no dedicated alerting visible in code)
- **Evidence:**
  - Per concern 6 (known-concerns.md) Clarification F: agent paths `agent.message_processed`, `agent.tool_executed`, `agent.session_created`, `agent.session_org_switched` audit emits are wrapped in try/catch
  - Log.error then continue on failure — the agent request is not failed, only the audit breadcrumb is dropped
  - Rationale documented: "audit emit is outside a service transaction so a thrown error would poison the user-facing request"
  - Grep of codebase yields no ALERT or METRIC counter for swallowed audit-emit failures
  - No structured-log incident_type tagged on these failures (would appear as `log.error(..., { incident_type: 'audit_emit_failure' })` or similar)
  - Consequence: the agent can mutate organization data (post journal entries, etc.) and produce a row in audit_log for the journal entry BUT no `agent.session_created` or `agent.message_processed` breadcrumb tying the session to the user
  - Forensic reconstruction of "which session posted this entry" becomes impossible if the agent.session_created emit failed
- **Consequence:** Silent loss of agent-session attribution rows breaks the audit trail completeness assumption. The innermost `journal_entry.post` row is audited, but the session context is not.

### H-10: PII in audit_log JSONB and pino logs, with append-only table blocking right-to-erasure

- **Status:** Confirmed (PII captures in both surfaces; append-only prevents selective scrubbing)
- **Evidence:**
  - `src/services/audit/recordMutation.ts` writes `before_state` JSONB directly to audit_log table, capturing full row images
  - Example: `invitationService.ts:92` logs `{ org_id, email, invitation_id }` in plaintext
  - `src/shared/logger/pino.ts` REDACT_CONFIG does NOT include email, phone, first_name, last_name in redaction paths (per concern 8a)
  - `supabase/migrations/20240122000000_audit_log_append_only.sql:36-42` defines trigger `reject_audit_log_mutation()` that forbids UPDATE and DELETE
  - Once a `before_state` JSONB blob containing email/phone/address lands in audit_log, it cannot be selectively scrubbed post-write due to the append-only trigger
  - RLS policy audit_log_select (20240101000000_initial_schema.sql:829) allows `user_has_org_access(org_id)` — any org member can read audit_log including PII
  - No GRANT restriction to privileged roles exists in the schema
- **Consequence:** PIPEDA right-to-erasure becomes architecturally awkward. A user requests deletion of their email; the invitation row's `before_state` blob in audit_log is permanent and unscrubbable. Compliance work requires special infrastructure (e.g., a separate PII scrubber service running outside the database) or a design change (PII columns in separate audit table with selective UPDATE allowed, or scrub-at-write before commit).

### H-14: Anthropic SDK message shape drift — cache_read/cache_creation tokens and block-type unions

- **Status:** Inconclusive (no evidence of shape mismatch, limited test coverage on cache tokens)
- **Evidence:**
  - S22 caching enablement commit 856dcc7 restructured system: string → system: TextBlockParam[] (confirmed in canvasDirective and orchestrator code)
  - No grep results for `cache_read_input_tokens` or `cache_creation_input_tokens` in codebase (these fields may not be consumed)
  - The internal types are hand-written in TypeScript (not auto-generated from SDK), so drift is possible
  - No integration test explicitly exercises `usage` fields from Claude response under caching
  - `callClaudeErrorClassification.test.ts` covers 401/429/5xx but not cache token field shapes
- **Notes for other scanners:** Backend Design scanner should check whether cache token fields are read from Claude responses at all. If they're never consumed, shape drift is benign. If they are consumed (e.g., for logging or billing calculations), the scanner should verify the internal types match the actual SDK response shape.

---

## Findings

### DATALAYER-001: No append-only triggers on journal_entries and journal_lines tables

- **Severity:** Critical
- **Description:** The `journal_entries` and `journal_lines` tables rely entirely on RLS policies for immutability (`journal_entries_no_update`, `journal_entries_no_delete`, and similarly for journal_lines). These RLS policies do not apply to the service_role client, which is the only client the application uses for database writes (via `adminClient()` from `src/db/adminClient.ts`). There are no database-level triggers to enforce append-only semantics. The ledger's immutability is enforced solely by service-layer convention: the `journalEntryService.ts` never issues UPDATE or DELETE statements. A future bug in the service layer, a misconfigured REPL session, or a direct database mutation tool could silently corrupt posted ledger entries without any mechanical guardrail.
- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:734-757` — RLS policies with `USING (false)` for UPDATE and DELETE
  - `supabase/migrations/20240122000000_audit_log_append_only.sql:36-57` — triggers `trg_audit_log_no_update`, `trg_audit_log_no_delete`, `trg_audit_log_no_truncate` applied to audit_log, demonstrating the pattern exists
  - Zero results from grep for `trg_enforce_journal_entries_no_update` or similar in migration files
  - `src/services/accounting/journalEntryService.ts` — no UPDATE or DELETE on journal tables
- **Consequence:** Phase 1.2 adds agent tool paths that call journalEntryService.post. If a second mutation path is added (e.g., a future admin tool or agent action that directly mutates ledger state) without going through journalEntryService, the database accepts it silently. Financial reports become incorrect and audit trail is corrupted.
- **Cross-references:** H-05 (ledger immutability). Phase 1.1 carry UF-006 identified this gap and proposed QW-03 fix. The fix was not shipped. Phase 2 obligations likely include this as OI-3 or equivalent.

### DATALAYER-002: Period-lock enforcement does not validate entry_date falls within period date range

- **Severity:** High
- **Description:** Both `journalEntryService.post()` and the database trigger `enforce_period_not_locked()` gate on `fiscal_period_id.is_locked = false`, but neither validates that the caller-supplied `entry_date` actually falls within the period's `[start_date, end_date]` range. An attacker can post an entry with `entry_date: '2024-01-15'` (which falls within a locked period) while supplying an open period's `fiscal_period_id`, defeating period-lock invariant INV-LEDGER-002 in spirit while the trigger fires green.
- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:294-323` — trigger function `enforce_period_not_locked()` checks `is_locked` only; no code checks `start_date <= entry_date <= end_date`
  - `src/services/accounting/journalEntryService.ts:115-123` — service layer checks period lock via direct is_locked query; does NOT call `periodService.isOpen()`
  - `src/services/accounting/periodService.ts:63-64` (inferred from know-concerns.md §7) — the correct date-range logic exists in isOpen() but is never invoked from journalEntryService.post() (grep confirms zero results for `periodService.isOpen` in journalEntryService)
- **Consequence:** A user can post an entry into a locked period undetected, creating out-of-sequence entries in the journal and breaking the period-lock control invariant.
- **Cross-references:** H-09 (period date mismatch). Known concern 7 asks whether the gap also exists in `recurringJournalService.approveRun()`.

### DATALAYER-003: Cross-org account_id injection via journal_lines foreign key

- **Severity:** High
- **Description:** `journal_lines.account_id` references `chart_of_accounts(account_id)` with a simple (non-composite) foreign key. The `chart_of_accounts` table has an `org_id` column, but the FK does not constrain that the account's org_id matches the parent `journal_entries.org_id`. Combined with H-04 (read-path org checks missing on `chartOfAccountsService.get()`), an agent or user with access to accounts from other organizations could reference them in a journal entry, creating cross-org data leakage. The `journal_lines_insert` RLS policy checks the entry's org, but not the account's org membership.
- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:223` — `account_id uuid NOT NULL REFERENCES chart_of_accounts(account_id)` is a simple FK
  - Same migration line 222: `journal_entry_id uuid NOT NULL REFERENCES journal_entries(...)` — journal_lines are tied to entries, but the account is not checked for org parity
  - `supabase/migrations/20240101000000_initial_schema.sql:747-753` — `journal_lines_insert` RLS checks `user_has_org_access(je.org_id)` but NOT account org
  - `src/shared/schemas/accounting/journalEntry.schema.ts:20` — `account_id: z.string().uuid()` has no cross-org assertion
  - `src/services/accounting/journalEntryService.ts` — no loop to assert all line accounts belong to the entry's org_id
- **Consequence:** Cross-org financial data leakage; unbalanced entries in the target organization's ledger.
- **Cross-references:** H-07 (cross-org account_id injection). Known concern 5 asks whether the same gap exists on `recurring_template_lines.account_id`.

### DATALAYER-004: Agent_sessions.conversation loaded without schema validation

- **Severity:** High
- **Description:** The `agent_sessions.conversation` JSONB column stores Anthropic SDK message arrays. Between Sept 2025 and Apr 2026, the SDK's message shape evolved (e.g., system: string → system: TextBlockParam[] per S22 caching enablement). The loader in `src/agent/orchestrator/loadOrCreateSession.ts:194` reads the column as `(raw.conversation as unknown[]) ?? []` with no schema validation or version-aware compat shim. Older sessions created under prior SDK versions may carry message shapes the current session handler assumes are absent. When the conversation is passed to Claude API, shape mismatches could cause structured-response validation failures or silent type errors.
- **Evidence:**
  - `src/agent/orchestrator/loadOrCreateSession.ts:34,194` — loads conversation as `unknown[]` and `(raw.conversation as unknown[]) ?? []`
  - `supabase/migrations/20240118000000_agent_session_wiring.sql:16` — adds `conversation jsonb` with default `'[]'` but no versioning strategy
  - Commits 856dcc7 and related S22 changes restructured system message shape; no backfill migration exists
  - No discriminated union or compat layer to accept both old and new shapes
- **Consequence:** Sessions created before S22 caching enablement may fail or produce malformed Claude API calls if replayed after the SDK shape change.
- **Cross-references:** H-02 (conversation shape drift). Test Coverage scanner should assess whether integration tests seed old shapes.

### DATALAYER-005: No composite FK enforcing org parity on intercompany_relationships account references

- **Severity:** Medium
- **Description:** The `intercompany_relationships` table references accounts via `org_a_due_to_account_id` and `org_b_due_from_account_id` (simple FKs to `chart_of_accounts(account_id)`). There is no composite constraint ensuring that `org_a_due_to_account_id` belongs to org A and `org_b_due_from_account_id` belongs to org B. While Phase 2, this pattern mirrors the same gap on `journal_lines.account_id` (DATALAYER-003) and should be addressed proactively.
- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql:162-163` — simple FKs to chart_of_accounts(account_id)
  - No composite constraint on (org_a_id, account_id) or (org_b_id, account_id)
  - Migration comment at line 170 states "Populated in Phase 2 by AP Agent. Do not write to manually." — Phase 2 is not active, so this is a preemptive finding
- **Consequence:** When Phase 2 AP Agent code attempts to populate intercompany relationships, it could inadvertently create relationships that reference accounts in the wrong organization.
- **Cross-references:** Known concern 5 (cross-org FK gaps). DATALAYER-003.

### DATALAYER-006: Audit emit failures swallowed in agent paths with no dedicated observability

- **Severity:** Medium
- **Description:** Agent paths wrap audit-emit calls (e.g., `recordMutation` for `agent.message_processed`, `agent.tool_executed`) in try/catch blocks and log errors without failing the user-facing request. This is intentional to prevent a failed audit write from poisoning the agent response. However, no dedicated alerting mechanism (metric counter, incident_type tag, separate high-cardinality error metric) is visible in the codebase to surface when these breadcrumbs are dropped. If audit-emit failures occur in production (transient DB connection loss, disk full, row-level lock timeout), the silent drop leaves no forensic trail to reconstruct the agent's session attribution.
- **Evidence:**
  - `src/services/audit/recordMutation.ts` per concern 6 and Clarification F — wraps in try/catch
  - No grep results for `audit_emit_failure` or similar metric/alert trigger in codebase
  - `src/shared/logger/pino.ts` — no dedicated incident_type for dropped audit rows
- **Consequence:** Agent-driven mutation trails become incomplete and undetectable; compliance audits cannot reconstruct session attribution if the agent.session_created row was not written.
- **Cross-references:** H-08 (audit-emit failures). INV-AUDIT-001 (Layer 2) assumes every mutation writes an audit_log row; this finding highlights that the agent.session_* breadcrumb layer is weaker.

### DATALAYER-007: PII stored in append-only audit_log with no role-level access restriction

- **Severity:** Medium
- **Description:** The `recordMutation` function writes full `before_state` JSONB blobs (entire row images) to the append-only `audit_log` table. These blobs routinely contain PII: email addresses, phone numbers, full names, mailing addresses from invitations, user_profiles, and memberships tables. The audit_log table is append-only (insert-only, no update/delete allowed per INV-AUDIT-002), so selective column scrubbing post-write is architecturally infeasible. Furthermore, the `audit_log_select` RLS policy allows `user_has_org_access(org_id)`, meaning any organization member can read any audit_log row, including historical PII captures. There is no grant restriction to a privileged compliance/legal role.
- **Evidence:**
  - `src/services/audit/recordMutation.ts` serializes full rows to before_state JSONB
  - `src/services/auth/invitationService.ts:92` logs plaintext email
  - `src/shared/logger/pino.ts` REDACT_CONFIG does not include email/phone/names
  - `supabase/migrations/20240122000000_audit_log_append_only.sql:36-42` makes table append-only via triggers
  - `supabase/migrations/20240101000000_initial_schema.sql:829` — `audit_log_select` RLS policy allows broad org access
- **Consequence:** PIPEDA right-to-erasure compliance becomes difficult. A user requests deletion; emails captured in `before_state` blobs are permanent and readable by any org member. A compliance fix must be external to the database (e.g., a separate scrubber service) or requires a schema redesign.
- **Cross-references:** H-10 (PII in audit log). Known concern 8a (pino logs) and 8b (before_state design). Known concern 10 (before_state design strategy question for Phase 2).

### DATALAYER-008: Conversation column is unversioned and unvalidated at load time

- **Severity:** Medium (compound with DATALAYER-004)
- **Description:** The `agent_sessions.conversation` JSONB column has no version field, timestamp, or schema tag to indicate which SDK version wrote the message array. The loader has no way to detect or adapt to shape changes. This is distinct from a "schema drift" issue (which assumes the DB schema definition is wrong); here, the schema definition is fine, but the stored data's shape may have evolved without the application's knowledge. Future SDK updates will silently break sessions created under older versions unless each SDK version bump includes both a migration and a version-check in loadOrCreateSession.
- **Evidence:**
  - `supabase/migrations/20240118000000_agent_session_wiring.sql:16` — `conversation jsonb NOT NULL DEFAULT '[]'` has no version metadata
  - `src/agent/orchestrator/loadOrCreateSession.ts:194` — no version check before deserializing
  - S22 caching enablement changed system message shape without a versioning strategy
- **Consequence:** As Phase 2 continues to integrate newer SDK versions, sessions may become "stale" after SDK updates without active backfill migrations. Replayed conversations could fail.
- **Cross-references:** DATALAYER-004. Known concern 12 mentions context-window saturation; this is related but distinct (saturation is size, versioning is shape).

### DATALAYER-009: RPC functions use SECURITY INVOKER but lack explicit org_id filters on some read paths

- **Severity:** Low
- **Description:** Report RPC functions like `get_profit_and_loss`, `get_trial_balance`, `account_balance` (migration 20240125), `balance_sheet` (migration 20240126), and `gl_account_detail` (migration 20240127) use SECURITY INVOKER (respecting RLS and caller permissions). However, the belt-and-suspenders org_id filter pattern described in the migration comments as a future hardening step is not uniformly applied across all functions. While RLS policies on the underlying tables provide the primary defense, a future refactoring to SECURITY DEFINER should not accidentally broaden access if the explicit org_id filters are missing.
- **Evidence:**
  - `supabase/migrations/20240125000000_account_balance_rpc.sql:41-45` — comments mention "Belt-and-suspenders org filter. SECURITY INVOKER + RLS" but notes a future SECURITY DEFINER flip is possible
  - `supabase/migrations/20240107000000_report_rpc_functions.sql:15` — "Use SECURITY INVOKER (respects RLS, caller's permissions)"
  - No explicit WHERE org_id = $1 AND user_has_org_access($1) double-check in all RPC bodies
- **Consequence:** If a future performance optimization flips an RPC to SECURITY DEFINER without adding the explicit org_id filter, cross-org data leakage is possible.
- **Cross-references:** INV-RLS-001 (cross-org data isolation). Known concern 2 (read-path org checks missing) focuses on service functions, not RPCs, but the same principle applies.

### DATALAYER-010: Canvas_directive schema uses `.strict()` uniformly, blocking field additions without backfill

- **Severity:** Low
- **Description:** All discriminated union types in `canvasDirectiveSchema` (src/shared/schemas/canvas/canvasDirective.schema.ts) use `.strict()`, which rejects unknown fields at parse time. This is intentional for security and clarity, but it means that if a future commit adds a new optional field to an existing directive type (e.g., journal_entry_form gets a new `defaultAccountId?: uuid` field), older persisted directives missing that field will still parse successfully (missing optional fields are benign in Zod `.strict()`). However, if the field is REQUIRED, older directives will fail parsing and break the UI. While the schema growth pattern in Phase 1.2 (adding only new discriminated types, not fields to existing types) is good hygiene, there is no migration or versioning safety net for accidental field additions.
- **Evidence:**
  - `src/shared/schemas/canvas/canvasDirective.schema.ts:23-111` — all variants use `.strict()`
  - Schema evolution from Phase 1.1 through Phase 1.2 added new discriminated types (user_profile, org_profile, etc.) but did not modify fields of existing types
  - No evidence of field additions to existing types; all growth has been through new discriminated members
- **Consequence:** Low risk in practice given current discipline, but a future developer could accidentally add a required field to an existing directive type and break old sessions without realizing the backfill requirement.
- **Cross-references:** H-03 (canvas_directive drift) — refuted, but this finding documents the constraint structure.

---

## Category Summary

The data layer is **structurally sound in its schema definitions** (constraints, triggers, RLS policies are well-designed) **but operationally incomplete in enforcement mechanism coverage**. Three critical gaps exist:

1. **Ledger immutability (DATALAYER-001):** Journal tables rely on RLS policies that don't apply to the service_role client. No triggers enforce append-only semantics at the database layer. Service-layer convention is the only guardrail.

2. **Cross-org FK integrity (DATALAYER-003, DATALAYER-005):** Account FKs on journal_lines and intercompany_relationships are simple, not composite, allowing accounts from other organizations to be referenced. Combined with missing read-path org checks (H-04, not this scanner's direct finding but flagged here for context), cross-org data leakage is possible.

3. **Unvalidated JSONB columns (DATALAYER-004):** agent_sessions.conversation is loaded without schema validation and has no versioning strategy, creating a runtime risk when SDK message shapes evolve.

**Self-audit bias note:** This scanner participated in Phase 1.2 sessions and is familiar with the architecture. A potential blind spot is accepting design patterns (e.g., service-layer mutation discipline, Zod schema as primary enforcement) that might deserve harder database-level enforcement. The findings above attempt to balance that by flagging where database mechanisms could strengthen the defense posture.

The Phase 1.2 audit hypotheses H-01, H-02, H-05, H-07, H-10, and H-14 directly relate to findings DATALAYER-001, DATALAYER-002, DATALAYER-003, DATALAYER-004, and DATALAYER-006 through DATALAYER-009. DATALAYER-010 extends H-03 by documenting a constraint that held true (schema uses strict validation uniformly).

