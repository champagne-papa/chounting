# Security & Compliance — Findings Log

**Scanner:** Security & Compliance (Phase 1.2 Category Scanner)
**Phase:** End of Phase 1.1 + Phase 1.2 (agent integration)
**Date:** 2026-04-27
**Scope:** Cumulative (Phase 0 + 1.1 + 1.2 + Arc A at HEAD = 32760e1)

**Hypotheses investigated:** H-04, H-05, H-06, H-07, H-08, H-09, H-10, H-11, H-12, H-13, H-15, H-16

**Self-audit bias note:** This audit involves independent verification of hypotheses originating from orientation conducted by a Claude instance that participated in Phase 1.2 builds (Sessions 4–8, S22–S24). The scanner has attempted to ground every finding in specific code evidence and apply heightened skepticism to areas where prior design familiarity might obscure gaps. Category scanner independence is the safeguard against built-in confirmation bias.

---

## Hypothesis Responses

### H-04: Read-path authorization gaps on org-scoped service methods
- **Status:** Confirmed (with important clarification)
- **Evidence:** 
  - `src/services/accounting/chartOfAccountsService.ts:47-66` — the `get()` method lacks the `ctx.caller.org_ids.includes(input.org_id)` check present in `list()` (lines 20-24). The method accepts only `account_id` (no `org_id` input), queries by account_id alone, and returns the full row including `org_id` without validating the returned org matches the caller's memberships. This creates a read-path leak if the method is called from agent or route context with attacker-controlled account_id.
  - `src/services/accounting/periodService.ts:52-83` — the `isOpen()` method lacks the org membership check. It queries `fiscal_periods` by `org_id` (from input) but does NOT validate `ctx.caller.org_ids.includes(input.org_id)` before executing the query. The caller can request any org_id and retrieve period data they have no membership in. Contrast with `listOpen()` (lines 28-34) and `lock()`/`unlock()` which all include the check.
  - Both methods are reachable from agent tool dispatch paths per the hypotheses and known-concerns mapping.
- **Notes for other scanners:** Backend Design scanner should verify reachability from agent tools; cross-check that no other read-service methods have the same gap. Spot-check: `accountBalanceService.get()` (line 57) **has** the check correctly; `recurringJournalService` list/get methods should be audited similarly. The inconsistency across the service layer suggests the pattern was understood in some contexts but incompletely applied.

---

### H-05: Ledger immutability enforcement missing trigger pattern
- **Status:** Confirmed
- **Evidence:**
  - `supabase/migrations/20240122000000_audit_log_append_only.sql` creates append-only triggers for `audit_log` (lines 44–57: three triggers + RLS policies + REVOKEs). The pattern is explicitly documented as "INV-AUDIT-002 (Layer 1a)."
  - `supabase/migrations/20240101000000_initial_schema.sql` and subsequent migration scans find NO equivalent trigger pattern for `journal_entries` or `journal_lines` tables. The RLS policies (`journal_entries_no_update`, `journal_lines_no_update`, etc.) rely on `is_authenticated` role enforcement, which the `adminClient()` service-role client bypasses entirely.
  - `src/services/accounting/journalEntryService.ts:1-20` comments acknowledge service-layer convention is the only guardrail: "Service-layer convention is the only thing standing between an agent-tool bug and a mutated posted ledger."
  - No migration adds triggers for `events` or `ai_actions` append-only enforcement either. Both tables undergo only-insert writes in the agent path but have no database-layer immutability triggers.
- **Consequence:** A service-layer bug in journalEntryService, recurringJournalService, or agent tools could UPDATE or DELETE posted ledger rows without triggering. The audit_log shows what changed, but the ledger itself becomes corrupted. Phase 2 agent hardening multiplies the mutation surface and amplifies this risk.

---

### H-06: Transaction atomicity gap across multi-call service writes
- **Status:** Confirmed
- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:154–228` executes four sequential PostgREST calls: `insert journal_entries` (line 155–185), `insert journal_lines` (line 206–213), `recordMutation` audit_log (line 220–228). Each is its own round-trip; each auto-commits independently in PostgREST's transaction boundary.
  - `src/services/audit/recordMutation.ts:45–51` JSDoc states "Accepts a SupabaseClient rather than creating its own so the caller can pass the same client (and therefore the same transaction)..." — but this is a convention-level claim. The recordMutation function itself does not wrap the call sites in a Postgres transaction; each PostgREST call is isolated.
  - If `journal_lines` insert succeeds (deferred balance constraint fires), then `recordMutation` fails, the ledger write persists without an audit row — violating INV-AUDIT-001.
  - The pattern repeats in `recurringJournalService.approveRun()` (session notes mention the multi-step atomicity gap), `orgService.createOrgWithTemplate()` (lines 161–223 issue sequential inserts: organizations → chart_of_accounts → memberships with potential mid-sequence failure).
  - No integration tests simulate audit-log write failure mid-sequence (grep finds zero matches for failure injection tests on recordMutation).
- **Consequence:** A race condition or transient database error during the audit write (or the membership write in org creation) leaves the database in a partially-consistent state with no mechanical recovery. The audit trail becomes forensically incomplete.

---

### H-07: Cross-org account_id injection on journal_lines foreign key
- **Status:** Confirmed
- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql` FK definition on `journal_lines.account_id` references `chart_of_accounts(account_id)` without a composite constraint on `(org_id, account_id)`. The FK does not enforce that the account belongs to the same org as the parent journal entry.
  - `src/shared/schemas/accounting/journalEntry.schema.ts:20` — `account_id: z.string().uuid()` only; no cross-org validation.
  - `src/services/accounting/journalEntryService.ts:193–213` — the service inserts journal_lines with no per-line org membership check. It validates `parsed.org_id` against the period but never asserts all line accounts belong to `parsed.org_id`.
  - `chartOfAccountsService.get()` (H-04 gap above) lacks org checking, meaning if an agent path calls it with attacker-controlled account_id, it returns cross-org account data and an attacker could construct a journal entry with lines that reference accounts from a different org.
  - Same gap potentially present in `recurring_template_lines.account_id` (concern 5 note).
- **Consequence:** An attacker with multi-org access or an agent-path bug can post a journal entry crediting an asset account from org A while debiting a liability in org B, or similar cross-org ledger poisoning.

---

### H-08: Audit-emit failures swallowed in agent paths with no observability
- **Status:** Confirmed
- **Evidence:**
  - `src/agent/orchestrator/index.ts:192–204` — `emitMessageProcessedAudit` is wrapped in `try/catch`; exceptions are logged at ERROR level and execution continues.
  - `src/agent/orchestrator/index.ts:375–385` (from grep output) — the `agent.tool_executed` emit in executeTool is similarly wrapped: "try/catch prevents a thrown audit error from poisoning the user-facing request."
  - `src/agent/orchestrator/loadOrCreateSession.ts` (from grep output) — `agent.session_created` and `agent.session_org_switched` emits are wrapped with the same pattern. Comment states: "Clarification F: try/catch prevents a thrown audit error from poisoning the user-facing request — the emit is outside a service transaction, so atomicity is not guaranteed until Phase 2's events-table migration."
  - All three audit emits log at ERROR level but take no other action (no alerting, no structured incident_type, no failure counter per code review).
  - The rationale (avoiding user-facing request failure) is documented but architecturally unsound: the agent can mutate data without producing audit breadcrumbs, breaking forensic traceability.
- **Consequence:** An agent session can execute tool calls, post journal entries, and create memberships without producing the session-level audit trail linking those mutations to the user/session. The inner mutations are logged (journalEntryService audit rows), but the agent.* session rows are missing. Forensic investigation cannot reconstruct which user submitted the agent message that led to a specific mutation.

---

### H-09: Period lock enforcement checks only is_locked, not entry_date consistency
- **Status:** Confirmed
- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:107–119` — pre-flight gate checks `fiscal_period_id.is_locked = false` but never validates that `entry_date` falls within the period's `[start_date, end_date]` range.
  - `src/services/accounting/periodService.ts:63–64` — the correct logic exists (`isOpen` method performs the date-range check correctly: `lte('start_date', input.entry_date)` and `gte('end_date', input.entry_date)`) but is never called from `journalEntryService.post()`.
  - The database trigger `enforce_period_not_locked` (from migrations) gates on `is_locked` only — no date-range validation at the trigger layer either.
  - An authorized user can call `journalEntryService.post()` with `entry_date = '2025-01-15'`, `fiscal_period_id = <open-period-feb-2026>` and the service accepts it. The lock check passes (feb open), but the entry date is in a closed January period. The ledger now contains an entry with an impossible date/period combination.
- **Consequence:** Period-lock enforcement (INV-LEDGER-002) is violated in spirit. Closed periods can receive entries if the supplied fiscal_period_id is open, even if the entry_date should logically fall in a closed period. Audit controls are bypassed.

---

### H-10: PII in audit_log JSONB and pino logs, with append-only table blocking right-to-erasure
- **Status:** Confirmed (two surfaces)
- **Evidence:**
  - **Pino redaction surface:** `src/shared/logger/pino.ts:REDACT_CONFIG.paths` (lines 19–40) covers `bank_account_number`, `tax_id`, `sin`, `card_number` but **does not** cover `email`, `phone`, `first_name`, `last_name`, or `display_name`.
    - `src/services/org/invitationService.ts:92` logs plaintext: `log.info({ org_id: input.org_id, email, invitation_id: invitationId }, 'User invited')` — the email PII is captured in log output.
  - **Audit log table surface:** `src/services/audit/recordMutation.ts:62–78` writes `before_state` JSONB verbatim to the append-only `audit_log` table. No PII scrubbing at write-time.
    - Invitation acceptances (invitationService:178–184) call `recordMutation(db, ctx, { ... before_state: invitation })` where `invitation` includes `invited_email` and other PII.
    - Period lock/unlock (periodService:158–165, 243–250) write `before_state: before` where `before` is a full `fiscal_periods` row.
    - The append-only triggers (`supabase/migrations/20240122000000_audit_log_append_only.sql`) prevent any UPDATE/DELETE of the audit_log, making selective scrubbing impossible post-write.
  - RLS policy on `audit_log` is readable by authenticated users (from migration docs); no gating to a privileged compliance role.
- **Consequence:** PIPEDA right-to-erasure (Canada's data protection obligation) becomes architecturally unsound. Once PII lands in the append-only audit_log, it cannot be removed without violating immutability or rebuilding the table. The design forces a tradeoff: either lose audit trail integrity or retain PII indefinitely.

---

### H-11: MFA enforcement middleware exists but is unwired to the request path
- **Status:** Confirmed
- **Evidence:**
  - `src/middleware.ts` (lines 1–10) — contains only `createMiddleware` for i18n routing. No import or call to `enforceMfa`.
  - `src/middleware/mfaEnforcement.ts:12–46` — exports `enforceMfa` function but no grep match for any import of `enforceMfa` outside this file (search confirms zero production call sites).
  - `tests/integration/mfaEnforcementMiddleware.test.ts` header states (per known-concerns.md §1): "the actual redirect behavior is verified manually in the browser" — the test asserts the database column flips and the function exports, not that the middleware invokes the redirect.
  - `src/middleware/mfaEnforcement.ts` function is syntactically correct (creates Supabase client, checks `organizations.mfa_required`, validates AAL level, returns redirect) but dead code.
- **Consequence:** Setting `organizations.mfa_required = true` has no runtime effect. The user is not redirected to enrollment. MFA can be configured via the data model but is not enforced at the application layer.

---

### H-12: Service-layer mutation-surface CI guard absent; withInvariants wrap is convention-only
- **Status:** Confirmed
- **Evidence:**
  - `eslint.config.mjs` (lines 13–25) — contains only Next.js recommended rules and TypeScript rules. No `no-restricted-imports` rule for `adminClient` or any rule enforcing `withInvariants` wrapping.
  - Phase 1.1 audit (per known-concerns.md §11) identified and did not fix the missing ESLint rule.
  - `src/app/api/agent/reject/route.ts:28–50` — imports `adminClient` directly and issues mutations (`db.from('ai_actions').update()` at line 121) without `withInvariants()` wrapping. The route manually validates org_id and idempotency_key but does not call `withInvariants()`. The route's own auth context (`buildServiceContext`) substitutes for the wrap, but there is no structural enforcement preventing a future developer from bypassing both.
  - Example of a pattern that could bypass: a new route that imports `journalEntryService.post()` directly without `withInvariants()` would fail at runtime only if the service-layer check fires (unlikely for a contrived input); no linter prevents the mistake.
- **Consequence:** Future routes can silently bypass the `withInvariants()` pre-flight checks (org membership validation, permission lookup). The pattern is documented in comments (INV-SERVICE-001) but not mechanically enforced.

---

### H-13: Conversation context-window saturation at high turn counts with no rotation policy
- **Status:** Confirmed (deferred from H-13 investigation scope per hypotheses)
- **Evidence:** Per known-concerns.md §12, EC-2 Entry 12 produced AGENT_STRUCTURED_RESPONSE_INVALID after 32+ turns. `src/agent/orchestrator/index.ts:245–248` loads full `session.conversation` with no truncation. No session-rotation logic exists in the orchestrator. This is documented as known-concern 12 and flagged as out-of-scope for H-13 (test-coverage investigation), but the underlying invariant gap (unbounded context growth) is a security/availability issue for Phase 1.2 → 2 transition.

---

### H-15: Agent tool selection hints insufficient for disambiguating cross-org access in Mode B
- **Status:** Confirmed (partially; service-layer gaps are the root cause)
- **Evidence:** Known-concerns.md §9 notes that H-04 and H-09 gaps (read-path org checks and period date validation) make the tool-selection prompt hints ineffective. An agent operating on org A, when given a tool that reaches `chartOfAccountsService.get(account_id_from_org_b)`, will leak data because the service does not validate org membership. Fixing H-04 is a prerequisite to resolving this finding.

---

### H-16: User-controlled strings interpolated into system prompts without length limits or escaping
- **Status:** Inconclusive (phase boundary issue — explicitly deferred per known-concerns.md §15)
- **Evidence:** The hypothesis is flagged as "Phase 2 hardening obligation, not Phase 1.2 blocker." `src/agent/prompts/suffixes/onboardingSuffix.ts` and `src/agent/memory/orgContextManager.ts` interpolate `displayName`, account names, and memo content into system prompts without escaping or length-limiting. Current blast radius is single-org (agent operates only on active org), so Phase 1.2 risk is low. Phase 2 intercompany flows would increase this surface. Deferred to Phase 2 action plan per design framework.

---

## Findings

### SECURITY-001: Read-path authorization gaps enable cross-org data leakage
- **Severity:** High
- **Description:** Two service-layer read methods lack the org membership validation check present in analogous read functions. `chartOfAccountsService.get()` and `periodService.isOpen()` do not verify the caller's membership in the requested organization before returning data. These methods are reachable from agent tool dispatch paths and can be called with attacker-controlled input from malicious agents or multi-org users. The agent orchestrator does not currently restrict tool input org_ids, so an agent instance in org A could request account/period data from org B.

  The missing check is a single-line guard (`if (!ctx.caller.org_ids.includes(input.org_id)) throw ...`) that is consistently applied in `list()` methods, `accountBalanceService.get()`, and mutation pre-flights. Its absence in read methods is anomalous.

  Additionally, `chartOfAccountsService.get()` receives only `account_id` (no org_id parameter) and queries by account_id alone, returning the full row including org_id. If an attacker provides a UUID from a different org, the service returns data the caller should not see.

- **Evidence:**
  - `src/services/accounting/chartOfAccountsService.ts:47–66` (lines 47–66 lack the check; compare to lines 13–25 in `list()`)
  - `src/services/accounting/periodService.ts:52–83` (no org check; contrast with `listOpen()` lines 28–34)
  - Both methods are called from agent tool dispatch (`periodService.isOpen` in checkPeriod tool; chartOfAccountsService.get potentially reachable via lookup tools)
  - Service context `ctx.caller.org_ids` is available in both methods

- **Consequence:** An agent session or API caller with cross-org access can read chart-of-accounts entries and fiscal-period details from orgs they are not members of. This violates multi-tenant isolation (the primary security requirement per the audit framework) and enables cross-org financial data leakage.

- **Cross-references:**
  - Relates to H-04 (security-surface-gap) and Concern 2 (read-path org checks missing)
  - Compounds with H-07 (cross-org account_id injection) if attacker uses leaked account_id to construct malicious journal entries
  - Backend Design & API scanner should verify full reachability from agent and API routes

---

### SECURITY-002: Ledger immutability relies on service-layer convention with no database-layer trigger enforcement
- **Severity:** High
- **Description:** The `journal_entries` and `journal_lines` tables are treated as append-only (no-update, no-delete) but lack database-layer trigger enforcement. The `audit_log` table has explicit append-only triggers (INV-AUDIT-002), but the primary ledger tables do not. Service-layer code in `journalEntryService` and agent tools is the only guardrail preventing mutations.

  The service-role client (`adminClient()`) used by all service functions bypasses RLS policies (`journal_entries_no_update`, `journal_lines_no_delete`). A service-layer bug, misconfigured API call, or compromised service-role credential could UPDATE or DELETE posted ledger rows. The `audit_log` trail would record what changed, but the ledger itself becomes corrupted with no mechanical safeguard.

  Phase 2 expands the agent tool surface and mutation paths, increasing the likelihood of bugs that would corrupt the ledger silently.

- **Evidence:**
  - `supabase/migrations/20240122000000_audit_log_append_only.sql` (36–58) creates three triggers + RLS policies for audit_log; no equivalent migration for journal_entries or journal_lines
  - `supabase/migrations/20240101000000_initial_schema.sql` (initial schema) defines RLS policies for journal tables but no CONSTRAINT TRIGGERs (grep confirms zero matches for `journal_entries_no_update` or `journal_entries_no_delete` triggers)
  - Migrations 20240102–20240135 (skim of migration files) do not add the pattern to journal tables
  - `src/services/accounting/journalEntryService.ts:1–20` comments acknowledge "Service-layer convention is the only thing standing between an agent-tool bug and a mutated posted ledger"

- **Consequence:** Posted journal entries can be silently corrupted (entries deleted, line amounts changed, reversals unmade). Financial reports based on the corrupted ledger are incorrect. The audit trail shows mutation activity but not forensic certainty of the ledger state at any point in time.

- **Cross-references:**
  - Relates to H-05 (invariant-gap: ledger immutability missing trigger pattern) and Concern 3 (Phase 1.1 carry UF-006, proposed QW-03 fix did not ship)
  - Data Layer & Schema scanner should verify trigger absence at HEAD and confirm no subsequent migration added the pattern
  - Phase 2 obligations likely include adding the trigger set as a blocking prerequisite for agent hardening

---

### SECURITY-003: Transaction atomicity gap on multi-step writes leaves ledger in partial-consistency window
- **Severity:** High
- **Description:** Multi-step service writes (journal entry posting, recurring run approval, org creation) issue sequential PostgREST calls, each of which auto-commits independently. If any call fails after a prior call succeeds, the database is left in a partial state.

  For example, `journalEntryService.post()` executes: (1) INSERT journal_entries, (2) INSERT journal_lines (deferred balance constraint fires here), (3) INSERT audit_log via recordMutation(). If (3) fails after (2) succeeds, the ledger write persists without an audit row, violating INV-AUDIT-001 (every mutation produces an audit record).

  The JSDoc on `recordMutation.ts:45–51` claims atomicity "if the caller uses the same client," but no plpgsql RPC wraps the three calls in a single Postgres transaction. The convention is documented but not enforced.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:154–228` — four sequential PostgREST calls: journal_entries insert (154–185), journal_lines insert (206–213), recordMutation audit (220–228). Each is isolated.
  - `src/services/audit/recordMutation.ts:45–51` JSDoc states atomicity requirement; `recordMutation` function at lines 57–79 is itself just a single .insert() call with no transaction wrapper
  - `src/services/org/orgService.ts:161–223` — createOrgWithTemplate issues three inserts (organizations, chart_of_accounts, memberships) sequentially without transaction wrapping
  - `recurringJournalService.approveRun()` (per design notes, lines D10-D) has similar sequential pattern: load → post entry → update run → recordMutation. Notes acknowledge "best-effort sequential" with potential orphaning if UPDATE fails after POST succeeds.
  - No integration tests inject failure on audit_log write (grep `recordMutation` in tests/ finds only assertion tests, no failure-injection scenarios)

- **Consequence:** A transient database error, network timeout, or rate-limit during the audit_log write leaves the ledger corrupted and the audit trail incomplete. Recovery requires manual intervention. Phase 2's increased mutation surface and asynchronous scheduling widen this window.

- **Cross-references:**
  - Relates to H-06 (invariant-gap: transaction atomicity gap) and Concern 4 (Phase 1.1 carry UF-001)
  - Data Layer & Schema scanner should recommend PL/pgSQL RPC wrapping or Postgres transaction guard as Phase 2 obligation
  - Backend Design scanner should spot-check other multi-step service methods for the same pattern

---

### SECURITY-004: Cross-org account_id injection on journal_lines foreign key
- **Severity:** High
- **Description:** The foreign key on `journal_lines.account_id` references `chart_of_accounts(account_id)` without enforcing that the account belongs to the same org as the parent entry. An attacker with cross-org access or access to agent paths can construct a journal entry that credits an asset account in org A while debiting a liability in org B, poisoning the ledger across tenants.

  Zod validation (`account_id: z.string().uuid()`) does not check cross-org membership. The service layer does not assert all line accounts belong to the parent entry's org. The RLS policy on journal_lines insertion checks the entry's org but not the account's org.

  The gap is compounded by H-04 (chartOfAccountsService.get lacks org checking), which means an attacker with agent access can first retrieve account_ids from other orgs, then inject them into journal entries.

- **Evidence:**
  - `supabase/migrations/20240101000000_initial_schema.sql` — FK on journal_lines.account_id does not include org_id in the constraint; grep for composite FK syntax finds none on this table
  - `src/shared/schemas/accounting/journalEntry.schema.ts:20` — `account_id: z.string().uuid()` only
  - `src/services/accounting/journalEntryService.ts:193–213` — no per-line org membership assertion; the service validates `parsed.org_id` against the period but not against each account
  - RLS policy `journal_lines_insert` (from migrations) checks entry org via `user_has_org_access(je.org_id)` but does not validate account org membership
  - Recurring template lines (recurring_template_lines.account_id) likely have the same gap per Concern 5

- **Consequence:** Multi-org ledger poisoning. Journal entries can reference accounts from arbitrary orgs, defeating the org-scoped integrity of financial records. Audit trails and balance sheets become unreliable across tenant boundaries.

- **Cross-references:**
  - Relates to H-07 (security-surface-gap: cross-org account_id injection) and Concern 5
  - Data Layer & Schema scanner should verify FK structure and RLS policy gap
  - Recommend composite FK or pre-insert validation as Phase 2 fix

---

### SECURITY-005: Audit-emit failures swallowed in agent paths break forensic traceability
- **Severity:** Medium
- **Description:** Agent paths emit four types of audit rows (agent.message_processed, agent.tool_executed, agent.session_created, agent.session_org_switched) to log session-level provenance. These emits are wrapped in try/catch; exceptions are logged at ERROR level and execution continues.

  The rationale (documented as "Clarification F") is to prevent audit emit failures from poisoning the user-facing response. However, this creates a blind spot: the agent can mutate organization data (post entries, create memberships) without producing the session-level audit breadcrumb linking those mutations to the user and session.

  Inner mutations (journalEntryService.post) still emit audit rows, so the financial data changes are recorded. But the session-level provenance (which user, which session, which turn) is missing if the emit fails. Forensic investigation cannot reconstruct which user submitted the agent message that triggered a specific mutation.

- **Evidence:**
  - `src/agent/orchestrator/index.ts:192–204` — `emitMessageProcessedAudit` wrapped in try/catch; exception logged at ERROR level, execution continues
  - `src/agent/orchestrator/index.ts:375–385` (from grep: "agent.tool_executed") — try/catch prevents error from poisoning response; comment: "emit is outside a service transaction, so atomicity is not guaranteed until Phase 2's events-table migration"
  - `src/agent/orchestrator/loadOrCreateSession.ts` — similar wrapping for agent.session_created and agent.session_org_switched
  - No alert/metric/structured-log incident_type on swallowed errors (grep finds only `log.error` calls)
  - Production alerting on missing audit rows is not visible in the code

- **Consequence:** Agent mutations lack session-level audit trail. Compliance investigations cannot prove which user triggered which action. The agent can become a ledger-mutation black box if audit emits fail silently.

- **Cross-references:**
  - Relates to H-08 (security-surface-gap: audit-emit failures swallowed) and Concern 6
  - Audit & Compliance scanner should assess operational alerting posture on swallowed audits
  - Phase 2 events-table migration (mentioned in code comments) is likely meant to address this by moving away from manual try/catch patterns

---

### SECURITY-006: Period lock enforcement bypassed by date/fiscal_period_id mismatch
- **Severity:** Medium
- **Description:** Journal entry posting gates on `fiscal_period_id.is_locked = false` but does not validate that `entry_date` falls within the period's `[start_date, end_date]` range. An attacker can post an entry dated in a locked January while supplying an open February's fiscal_period_id, defeating INV-LEDGER-002 (period-lock invariant) in spirit.

  The correct date-range logic exists in `periodService.isOpen()` (lines 63–64) but is never called from `journalEntryService.post()`. The database trigger `enforce_period_not_locked` also gates on is_locked only, providing no second line of defense.

  Recurring run approval (`recurringJournalService.approveRun()`) likely has the same gap per Concern 7.

- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:107–119` — pre-flight checks `is_locked` only; grep for `periodService.isOpen` call returns zero matches
  - `src/services/accounting/periodService.ts:52–83` — `isOpen()` method correctly checks `lte('start_date', entry_date)` and `gte('end_date', entry_date)` but is not invoked
  - Grep of migrations for trigger `enforce_period_not_locked` confirms it gates on `is_locked = false` with no date-range validation
  - User can call journalEntryService.post with entry_date = '2025-01-15', fiscal_period_id = <feb-2026-open-period>; service accepts it

- **Consequence:** Closed periods can silently receive entries if the supplied fiscal_period_id is open. Ledger entries have impossible date/period combinations. Period lock is a control on when entries can be posted; its bypass undermines financial closing procedures and audit controls.

- **Cross-references:**
  - Relates to H-09 (invariant-gap: period lock enforcement checks only is_locked) and Concern 7
  - Backend Design scanner should verify the same gap in recurringJournalService.approveRun and any other period-gated paths

---

### SECURITY-007: PII leakage in audit_log and pino logs violates PIPEDA right-to-erasure requirement
- **Severity:** Medium
- **Description:** Personally identifiable information (email, phone, full names) is captured in two places with no redaction: (1) pino structured logs via direct interpolation, and (2) audit_log JSONB before_state blobs.

  The pino logger's REDACT_CONFIG covers financial account numbers and secrets but not PII fields. `invitationService.ts:92` logs plaintext email: `log.info({ email, ... }, 'User invited')`. This appears in structured logs that are likely persisted and transmitted to a centralized logging system.

  The audit_log stores full row before_state JSONB (invitation rows include invited_email; user_profile rows include phone, name). Once written to the append-only audit_log, PII cannot be selectively scrubbed without violating immutability constraints. PIPEDA right-to-erasure (legal obligation in Canada) becomes architecturally unsound.

  The RLS policy on audit_log does not gate access to a privileged compliance role; it is readable by any authenticated user (verified in migration docs).

- **Evidence:**
  - `src/shared/logger/pino.ts:19–40` — REDACT_CONFIG covers bank_account_number, tax_id, sin, card_number; **missing** email, phone, first_name, last_name, display_name
  - `src/services/org/invitationService.ts:92` — `log.info({ org_id, email, invitation_id }, 'User invited')`
  - `src/services/audit/recordMutation.ts:62–78` — writes `before_state` JSONB verbatim; no scrubbing
  - `invitationService.ts:178–184` — `recordMutation(..., before_state: invitation as Record<string, unknown>)` where invitation includes invited_email
  - `periodService.ts:158–165` — `recordMutation(..., before_state: before)` where before is a full fiscal_periods row
  - `supabase/migrations/20240122000000_audit_log_append_only.sql:49–51` — TRUNCATE forbidden; no UPDATE/DELETE permitted; selective column scrubbing impossible

- **Consequence:** Audit log accumulates PII (email, phone, addresses) that cannot be removed without rebuilding the table and losing audit trail continuity. This violates PIPEDA right-to-erasure and creates regulatory risk. Logs containing PII require careful access controls and data retention policies.

- **Cross-references:**
  - Relates to H-10 (security-surface-gap: PII in audit_log and logs) and Concerns 8 (pino redaction), 10 (before_state design)
  - Audit & Compliance scanner should assess access controls on audit_log and log retention policies
  - Phase 2 obligation: either scrub PII from before_state at write-time or gate audit_log to a privileged role with documented access posture

---

### SECURITY-008: MFA enforcement middleware is dead code with no runtime effect
- **Severity:** Low
- **Description:** The MFA enforcement middleware (`src/middleware/mfaEnforcement.ts`) is syntactically correct and exports a callable function, but is never invoked from the request path. Setting `organizations.mfa_required = true` in the data model has no effect. Users are not redirected to MFA enrollment even if the org mandates it.

  The top-level `middleware.ts` performs i18n routing only and does not import or call `enforceMfa`. The integration test verifies that the database column flips and the function exports, not that the middleware actually runs during a request.

  This is a Phase 1.5B feature that was partially implemented but left unwired.

- **Evidence:**
  - `src/middleware.ts` (lines 1–10) — only i18n routing; no enforceMfa import or call
  - `src/middleware/mfaEnforcement.ts:12–46` — exports enforceMfa; grep for import outside this file returns zero matches
  - `tests/integration/mfaEnforcementMiddleware.test.ts` header (per known-concerns.md §1) — "actual redirect behavior is verified manually in the browser"
  - `src/middleware/mfaEnforcement.ts:40–45` — function constructs redirect correctly, but redirect is never triggered

- **Consequence:** MFA is not enforced even when configured. Users in orgs with mfa_required=true are not prompted to enroll. This does not affect Phase 1.2 readiness (MFA is not a Phase 1.2 blocker per obligations), but the dead code should be removed or wired before shipping to production.

- **Cross-references:**
  - Relates to H-11 (test-reality-divergence: MFA enforcement middleware unwired) and Concern 1
  - Frontend Architecture scanner should verify whether MFA enrollment page exists and whether there is an alternative wiring path
  - Recommend cleanup: either remove the dead middleware or wire it before Phase 2

---

### SECURITY-009: Service-layer mutation-surface enforcement is convention-only with no linter guard
- **Severity:** Medium
- **Description:** Every mutating service function must be invoked through `withInvariants()` to enforce pre-flight authorization checks. This rule is documented in code comments (INV-SERVICE-001) but not mechanically enforced via ESLint.

  There is no `no-restricted-imports` rule for the `adminClient`, and no rule enforcing that mutating service methods are called only via `withInvariants()`. Phase 1.1 audit identified this gap; the gap was not fixed.

  Example: `src/app/api/agent/reject/route.ts` imports `adminClient` directly and issues mutations without `withInvariants()`. The route manually validates org_id and calls `buildServiceContext`, substituting for the wrap. But there is no structural enforcement preventing a future route from importing a mutating service (e.g., `journalEntryService.post`) and calling it directly without `withInvariants()`.

- **Evidence:**
  - `eslint.config.mjs:13–25` — no no-restricted-imports rule; only Next.js and TypeScript rules
  - `src/app/api/agent/reject/route.ts:28–50` — imports `adminClient` directly; line 121 calls `.update()` without `withInvariants()` wrap
  - Phase 1.1 audit (known-concerns.md §11) explicitly noted the missing rule and no fix shipped
  - Code comments (journalEntryService.ts:1–20, withInvariants.ts:15–16) document the pattern, but lint cannot enforce it

- **Consequence:** Future routes can silently bypass `withInvariants()` pre-flight checks (org membership validation, role-based permission lookup). A developer error could allow a mutating service call without authorization checks, creating a privilege escalation path.

- **Cross-references:**
  - Relates to H-12 (invariant-gap: service-layer mutation CI guard absent) and Concern 11
  - Backend Design scanner should recommend ESLint rule addition as a Phase 2 hardening step
  - Recommend two rules: (1) restrict direct imports of `adminClient` to service modules, (2) restrict service method calls in routes to only withInvariants-wrapped versions

---

### SECURITY-010: No structured alerting on agent audit-emit failures limits operational visibility
- **Severity:** Low
- **Description:** Agent paths that swallow audit-emit exceptions (SECURITY-005) log failures at ERROR level but take no other action. There is no metric counter, structured incident_type, or dedicated alert on swallowed audit errors. If audit emits fail silently in production, the operations team may not notice until a forensic investigation reveals missing breadcrumbs.

  The design choice (try/catch to avoid poisoning the user-facing response) is defensible, but it must be paired with operational visibility. Currently, visibility is log-only and requires manual log review.

- **Evidence:**
  - `src/agent/orchestrator/index.ts:199–204` — `log.error({ err, action }, 'agent audit write failed; continuing ...')` only
  - No grep match for metric counter, structured incident_type, or OpsGenie/PagerDuty alert rule on recordMutation failures
  - No integration test asserts on audit-emit success/failure observability

- **Consequence:** Swallowed audit errors are detectable only in logs. Production incident response is slower. The audit trail gaps are discovered forensically, not proactively.

- **Cross-references:**
  - Relates to SECURITY-005 (audit-emit failures swallowed)
  - Audit & Compliance scanner should assess operational runbooks for audit failure handling
  - Recommend adding a metric counter or structured log incident_type (e.g., `incident_type: 'agent_audit_emit_failed'`) so alerting can be configured

---

## Category Summary

Security & Compliance at the end of Phase 1.1 + Phase 1.2 exhibits foundational controls that work within their design scope but have critical gaps where the scope expands (read-path authorization, transaction atomicity, cross-org isolation). 

**The two highest-stakes gaps are:**
1. **Read-path authorization is inconsistent** (`chartOfAccountsService.get`, `periodService.isOpen` lack org checks) — this is a direct multi-tenant isolation violation and is reachable from agent paths.
2. **Ledger immutability relies entirely on service-layer convention** — no database-layer triggers on `journal_entries` or `journal_lines` tables despite explicit triggers on `audit_log`. Phase 2's increased agent mutation surface makes this a Phase 2 blocker.

**The design has documented intentions** (comments in `withInvariants.ts`, `journalEntryService.ts`, recordMutation.ts) but **enforcement is convention-based rather than structural** (no ESLint rules, no database triggers, no wrapped transactions). This works for a small codebase with consistent authorship but will accumulate risk as Phase 2 adds more mutation surfaces and team members.

**PII leakage** (audit_log and pino logs) is a regulatory issue (PIPEDA right-to-erasure) that compounds during Phase 2 as approval workflows add more mutation call sites and more before_state captures. The audit_log's append-only design prevents selective scrubbing, forcing an architectural choice between immutability and data privacy.

**MFA enforcement and agent audit visibility** are lower severity (MFA is non-blocking per obligations; agent audit issues are cross-cutting with other findings) but represent incomplete Phase 1.5B and 1.2 work that should be cleaned up before shipping.

Overall: **4 High, 4 Medium, 2 Low severity findings**. The codebase is fit for Phase 1.2 agent integration *if* SECURITY-001 and SECURITY-002 are addressed as Phase 2 pre-requisites. SECURITY-003 (atomicity) and SECURITY-004 (cross-org FK) are also Phase 2 blockers if Phase 2 introduces new multi-step mutations or agent tool expansion.

**Self-audit bias note:** This scanner designed the `withInvariants` pattern and reviewed several of the routes being scanned. Heightened scrutiny was applied to areas where the scanner's prior familiarity might obscure gaps (e.g., service-layer authorization conventions). The reliance on convention (rather than enforcement) for critical security rules was flagged in code review and remains a finding despite documented intent. Cross-scanner verification of read-path authorization and transaction atomicity is recommended to mitigate confirmation bias.
