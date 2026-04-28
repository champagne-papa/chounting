# Phase 1.2 Audit — Orientation Hypotheses

**Audit scope:** Cumulative (Phase 0 + 1.1 + 1.5A/B/C + 1.2 + Arc A, all at HEAD = 32760e1, staging branch).

**Orientation phase:** Phase 1 of the four-phase audit framework.

**Generated:** 2026-04-27 (orientation session).

---

## Self-Audit Bias Acknowledgment

This audit is conducted by a Claude-family LLM that participated in Phase 1.2 build sessions, specifically:
- Session 4 paid-API runs (journal entry posting with real Claude)
- Session 5-8 agent architecture refinements
- S22 caching enablement review
- S23-S24 external pre-Phase-2 review verification

This creates inherent confirmation bias: hypotheses may favor designs I helped author, and blind spots may exist where I accepted assumptions without questioning. The category scanners (Phase 2) should treat cross-checking of my design assumptions as an explicit priority and weight independent evidence more heavily than my priors.

---

## Hypothesis Framework

Each hypothesis below follows the structure specified in `docs/07_governance/audits/prompts/orientation.md`:

- **id:** H-NN (sequential within the document)
- **hypothesis:** One-sentence, specific claim about potential weakness
- **pattern:** Categorized by pattern type (6 types from orientation.md §3)
- **categories_to_investigate:** Audit categories that should investigate this
- **evidence_that_would_confirm:** Specific file paths, grep patterns, test names
- **evidence_that_would_refute:** Conditions that would prove the hypothesis wrong
- **priority:** high/medium/low based on likelihood given observed patterns

---

## Hypotheses

### H-01: Tool_input JSONB shape drift between inject-time and read-time

**hypothesis:** The orchestrator injects `idempotency_key` and `org_id` into `tool_input` at `src/app/api/agent/message/route.ts:134` before Zod validation, but reads of that JSONB at replay time (e.g., `/api/agent/confirm` at line 148) or display time may encounter shapes that `PostJournalEntryInputSchema` does not expect if the schema evolved after the row was written.

**pattern:** boundary-mismatch

**categories_to_investigate:**
- Backend Design & API
- Data Layer & Schema

**evidence_that_would_confirm:**
- `src/app/api/agent/confirm/route.ts` line 148+ reads `tool_input` and parses with `PostJournalEntryInputSchema` — trace whether schema version mismatch is possible
- `src/app/api/agent/message/route.ts` line 134 modifies `tool_input` before write — verify that write preserves any mutations the schema may later reject
- Check `ai_actions.tool_input` column type and migration history for any type widening or narrowing (grep `20240120000000_ai_actions_edited_status.sql`)
- Replay tests that exercise `/api/agent/confirm` after schema changes (e.g., `soft8EntryEightReplay.test.ts`)

**evidence_that_would_refute:**
- The `tool_input` JSONB is never modified after write — only read back as-is
- OR the schema has a `.passthrough()` that allows unknown fields, making shape drift benign
- OR migrations include a versioning strategy that prevents old rows from being parsed by new schemas

**priority:** high

---

### H-02: Agent_sessions.conversation message-shape drift across SDK version churn

**hypothesis:** `agent_sessions.conversation` stores message arrays as JSONB from the Anthropic SDK. Between Sept 2025 and Apr 2026, the SDK's message shape evolved (e.g., `system: string` → `system: TextBlockParam[]` per S22 caching enablement, commit 856dcc7). Sessions created under an older SDK version may carry shapes the current `loadOrCreateSession` parser assumes are absent.

**pattern:** boundary-mismatch

**categories_to_investigate:**
- Backend Design & API
- Data Layer & Schema
- Test Coverage & Gaps

**evidence_that_would_confirm:**
- `src/agent/orchestrator/loadOrCreateSession.ts:194` loads `conversation` as `unknown[]` with no schema validation — grep for validation
- `tests/integration/agentToolCallThenRespond.test.ts` or similar creates sessions and tests message parsing — check if the test seeds old SDK shapes
- Commit `856dcc7` (caching enablement) shows the `system: string` → `system: TextBlockParam[]` migration — search for other SDK shape changes in same commit
- `src/shared/schemas/` for any Anthropic SDK type imports — verify they're current

**evidence_that_would_refute:**
- `conversation` is never read from the DB — it's only written and re-transmitted to Claude
- OR a migration backfill was run to upgrade all stored conversations to the current SDK shape
- OR the loader accepts both old and new shapes via discriminated union types

**priority:** high

---

### H-03: Canvas_directive schema vs persisted directive shape mismatch

**hypothesis:** `canvas_directive` schema in `src/shared/schemas/` has evolved across Phase 1.2 (at least three commits added fields per known-concerns.md §14). Older directives persisted to `ai_actions.canvas_directive` before schema evolution may have shapes the current validation rejects.

**pattern:** schema-code-drift

**categories_to_investigate:**
- Data Layer & Schema
- Backend Design & API

**evidence_that_would_confirm:**
- `src/shared/schemas/canvas/canvasDirective.schema.ts` — check `.strict()` or `.passthrough()` and field optionality
- Grep `canvas_directive` in migrations (e.g., `20240120000000_ai_actions_edited_status.sql`) and trace schema evolution
- Integration tests that read/validate directives from DB (e.g., tests that fetch `ai_actions` and re-parse `canvas_directive`)
- Check Phase 1.2 commits that mention "canvas_directive" in commit messages and see if fields were added without backfill

**evidence_that_would_refute:**
- The schema uses `.passthrough()` and handles unknown fields gracefully
- OR all stored directives are transient (only in memory, never persisted across sessions)
- OR a migration script backfilled all stored directives before the new schema was deployed

**priority:** medium

---

### H-04: Read-path authorization gaps on org-scoped service methods

**hypothesis:** `chartOfAccountsService.get()` and `periodService.isOpen()` lack the `ctx.caller.org_ids.includes(input.org_id)` check that every other org-scoped read performs (external review C2). Phase 1.2 made these reachable from the agent via tool dispatchers; if the check is absent, the agent can leak cross-org account and period data.

**pattern:** security-surface-gap

**categories_to_investigate:**
- Authorization & Access Control
- Backend Design & API

**evidence_that_would_confirm:**
- `src/services/accounting/chartOfAccountsService.ts:47-65` — confirm the check is absent
- `src/services/accounting/periodService.ts:52-79` — confirm the check is absent
- `src/agent/tools/` dispatch patterns that call these functions — grep for reachability
- `src/services/accounting/accountBalanceService.ts`, `recurringJournalService.ts`, `taxCodeService.ts`, `addressService.ts`, `userProfileService.ts`, `aiActionsService.ts`, `reportService.ts`, `accountLedgerService.ts` — spot-check for the same pattern

**evidence_that_would_refute:**
- The check is present, just using a different pattern (e.g., middleware wrapping, or built into the query filter)
- OR the service methods are not called from agent paths, so the exposure is theoretical only
- OR RLS policies on the underlying tables provide the defense (but admin client bypasses RLS)

**priority:** high

---

### H-05: Ledger immutability enforcement missing trigger pattern

**hypothesis:** `journal_entries` and `journal_lines` rely on RLS policies for immutability, but the service-role `adminClient()` bypasses RLS. No triggers enforce append-only semantics at the database layer. Every mutation path depends on service-layer convention, with no mechanical guardrail (external review C3, Phase 1.1 carry UF-006).

**pattern:** invariant-gap

**categories_to_investigate:**
- Data Layer & Schema
- Backend Design & API

**evidence_that_would_confirm:**
- `supabase/migrations/` — grep for `journal_entries_no_update`, `journal_entries_no_delete`, `journal_lines_no_update`, `journal_lines_no_delete` BEFORE and reject_*_mutation trigger functions (should not exist)
- Compare pattern to `20240122000000_audit_log_append_only.sql` (which HAS the trigger) — verify journal tables lack it
- `src/services/accounting/journalEntryService.ts` — verify it relies on convention, not enforced via trigger
- Check if `events` and `ai_actions` tables have the same gap (concerns.md §3 asks this question)

**evidence_that_would_refute:**
- A migration file adds the append-only trigger for journal tables (e.g., a migration numbered 20240133+ with the pattern)
- OR the triggers exist but are not installed in the running schema (verify via `supabase db pull` or schema introspection)

**priority:** high

---

### H-06: Transaction atomicity gap across multi-call service writes

**hypothesis:** `journalEntryService.post()` issues four sequential PostgREST calls (INSERT journal_entries, INSERT journal_lines, INSERT audit_log, INSERT ai_actions) inside the function body. Each auto-commits independently. The deferred balance constraint fires at step 2, but if step 3 (audit_log) fails after step 2 succeeds, the ledger write persists without an audit record (external review H1, Phase 1.1 carry UF-001).

**pattern:** invariant-gap

**categories_to_investigate:**
- Backend Design & API
- Data Layer & Schema

**evidence_that_would_confirm:**
- `src/services/accounting/journalEntryService.ts:131-218` — verify each PostgREST call is sequential, not wrapped in a transaction
- `src/services/audit/recordMutation.ts:45-51` JSDoc claims atomicity *if* the caller uses the same client — verify no plpgsql RPC wraps the calls
- Check `orgService.createOrgWithTemplate`, `recurringJournalService.approveRun`, `addressService.addAddress`, `membershipService.changeUserRole` for the same pattern (concerns.md §4 enumerates these)
- Integration tests that simulate audit-log write failure mid-transaction (should not exist if the bug is real)

**evidence_that_would_refute:**
- All multi-step writes are wrapped in a Postgres transaction via RPC or explicit `db.rpc('begin')` → `db.rpc('commit')`
- OR the audit_log is not load-bearing for correctness (but it is per INV-AUDIT-001)

**priority:** high

---

### H-07: Cross-org account_id injection on journal_lines foreign key

**hypothesis:** `journal_lines.account_id` references `chart_of_accounts(account_id)` but the FK does not constrain that the account's `org_id` matches the parent `journal_entries.org_id`. Zod validates only `account_id: z.string().uuid()`, and `journalEntryService.post()` does not assert all line accounts belong to `parsed.org_id` (external review H2, Phase 1.1 carry UF-007).

**pattern:** security-surface-gap

**categories_to_investigate:**
- Data Layer & Schema
- Authorization & Access Control

**evidence_that_would_confirm:**
- `supabase/migrations/20240101000000_initial_schema.sql` — grep `journal_lines` FK definition; verify no composite FK enforcing (org_id, account_id)
- `src/shared/schemas/accounting/journalEntry.schema.ts:20` — verify `account_id: z.string().uuid()` only
- `src/services/accounting/journalEntryService.ts` — grep for cross-org account membership check (should not exist if hypothesis is true)
- Check `recurring_template_lines.account_id` for the same gap (concerns.md §5)
- Check `ai_actions.entry_id`, `audit_log` JSONB cross-references (concerns.md §5 mentions these)

**evidence_that_would_refute:**
- A composite FK exists in the schema enforcing org_id parity between lines and accounts
- OR the RLS policy on journal_lines insertion checks account org membership (but it only checks entry org per the code)
- OR a pre-service-call validation asserts all accounts belong to the right org

**priority:** high

---

### H-08: Audit-emit failures swallowed in agent paths with no observability

**hypothesis:** `agent.message_processed`, `agent.tool_executed`, `agent.session_created`, and `agent.session_org_switched` audit emits in agent paths are wrapped in try/catch and swallowed on error (per Clarification F comment). If the emit fails, the agent can mutate data without producing an audit breadcrumb, breaking forensic traceability (external review H3).

**pattern:** security-surface-gap

**categories_to_investigate:**
- Authorization & Access Control
- Audit & Compliance

**evidence_that_would_confirm:**
- `src/app/api/agent/message/route.ts` and `src/app/api/agent/confirm/route.ts` — grep for `recordMutation` or audit-emit call sites wrapped in try/catch
- `src/services/audit/recordMutation.ts` — trace what "Clarification F" comment says (search for the phrase)
- Check if there is a metric counter, structured-log incident_type, or alert on swallowed audit errors (should not exist or should be low-visibility)
- Production logs/metrics for `audit_log` row counts vs `ai_actions` row counts to detect missing breadcrumbs

**evidence_that_would_refute:**
- Audit emits are not wrapped in try/catch — they throw and fail the request
- OR they are wrapped but a separate alerting mechanism surfaces the failure (e.g., a high-cardinality error metric)
- OR they are wrapped deliberately because audit-emit failures are classified as non-critical (but then the design choice should be documented)

**priority:** medium

---

### H-09: Period lock enforcement checks only is_locked, not entry_date consistency

**hypothesis:** Both `journalEntryService.post()` and the DB trigger `enforce_period_not_locked` gate on `fiscal_period_id.is_locked = false`, but neither validates that `entry_date` actually falls within the period's `[start_date, end_date]` range. An attacker can post an entry with `entry_date` inside a locked period while supplying an open period's `fiscal_period_id`, defeating INV-LEDGER-002 in spirit (S23 security-review pass, known-concerns.md §7).

**pattern:** invariant-gap

**categories_to_investigate:**
- Backend Design & API
- Data Layer & Schema

**evidence_that_would_confirm:**
- `src/services/accounting/journalEntryService.ts` — grep for calls to `periodService.isOpen()` (should not exist, or should be called conditionally and not for date-range check)
- `supabase/migrations/20240101000000_initial_schema.sql` — examine the trigger function `enforce_period_not_locked` (grep for `start_date` and `end_date` checks — should not find them for entry_date validation)
- `periodService.isOpen()` lines 63-64 has the correct logic but is never invoked from `journalEntryService.post()` (grep-confirmable)
- Check `recurringJournalService.approveRun()` for the same gap (concerns.md §7 asks this)

**evidence_that_would_refute:**
- A trigger or service-layer function validates that `entry_date` falls within `[start_date, end_date]`
- OR the `fiscal_period_id` is inferred deterministically from `entry_date`, making the supplied value irrelevant

**priority:** high

---

### H-10: PII in audit_log JSONB and pino logs, with append-only table blocking right-to-erasure

**hypothesis:** `recordMutation()` writes `before_state` JSONB directly to the append-only `audit_log` table, capturing full rows including PII (email, phone, names, addresses). The append-only triggers (`INV-AUDIT-002`) prevent selective column scrubbing post-write, making PIPEDA right-to-erasure architecturally awkward (S23 security-review pass, known-concerns.md §8).

**pattern:** security-surface-gap

**categories_to_investigate:**
- Audit & Compliance
- Authorization & Access Control

**evidence_that_would_confirm:**
- `src/services/audit/recordMutation.ts` — verify `before_state` serializes whole rows without PII redaction
- `supabase/migrations/20240122000000_audit_log_append_only.sql` — verify the append-only trigger prevents UPDATE/DELETE
- `src/services/auth/invitationService.ts:92` logs `{ org_id, email, invitation_id }` in plaintext (as noted in concerns.md §8a)
- `src/shared/logger/pino.ts` REDACT_CONFIG — check that `email`, `phone`, `first_name`, `last_name` are NOT in the redaction paths (they're not per concerns.md §8a)
- Scan `audit_log` rows in a test database for PII evidence (user_profiles, memberships, invitations rows)

**evidence_that_would_refute:**
- PII is scrubbed from `before_state` blobs at write-time before commit
- OR the `audit_log` is gated to a privileged role with documentation of the PII-access posture
- OR a migration backfills existing `before_state` JSONB with redacted versions

**priority:** medium

---

### H-11: MFA enforcement middleware exists but is unwired to the request path

**hypothesis:** `src/middleware/mfaEnforcement.ts` exports `enforceMfa` but is never invoked from `src/middleware.ts` (which performs i18n routing only). The integration test `mfaEnforcementMiddleware.test.ts` explicitly states "the actual redirect behavior is verified manually in the browser" — it tests only that the column flips and the function exports, not that the middleware runs (external review C1, known-concerns.md §1).

**pattern:** test-reality-divergence

**categories_to_investigate:**
- Frontend Architecture
- Test Coverage & Gaps

**evidence_that_would_confirm:**
- `src/middleware.ts` — verify `enforceMfa` is not imported or called
- `src/middleware/mfaEnforcement.ts` — verify it exists and is exported
- `tests/integration/mfaEnforcementMiddleware.test.ts` — confirm the header statement about manual verification
- Search the codebase for any other wiring of `enforceMfa` (grep -r "enforceMfa" src/ — should find only the export and the test)

**evidence_that_would_refute:**
- The middleware.ts file imports and invokes `enforceMfa`
- OR there's a separate route middleware or API route that calls it
- OR the integration test actually verifies the redirect behavior programmatically (not just manually)

**priority:** medium

---

### H-12: Service layer mutation CI guard absent; withInvariants wrap is convention-only

**hypothesis:** No ESLint rule enforces the `withInvariants()` wrap pattern; the import boundary rule for `adminClient` also doesn't exist (Phase 1.1 audit identified and Phase 1.2 did not fix per known-concerns.md §11). A future route that imports a mutating service method without `withInvariants()` would silently allow writes with no pre-flight checks.

**pattern:** invariant-gap

**categories_to_investigate:**
- Backend Design & API
- Test Coverage & Gaps

**evidence_that_would_confirm:**
- `eslint.config.mjs` — grep for `no-restricted-imports` or similar rule; should not find one restricting `adminClient` or enforcing `withInvariants` wrapping
- Spot-check `/api/agent/reject/route.ts` — verify whether it calls mutating services directly without `withInvariants`, or whether it has another auth mechanism that substitutes for the wrap
- Scan `src/app/api/**/route.ts` for mutating service imports that bypass `withInvariants` (S23 pass found the reject route; verify the finding)

**evidence_that_would_refute:**
- An ESLint rule exists enforcing the wrap pattern
- OR a pre-submit hook validates the pattern
- OR every route that imports a mutating service is manually audited and listed in a control matrix

**priority:** medium

---

### H-13: Conversation context-window saturation at high turn counts with no rotation policy

**hypothesis:** `agent_sessions.conversation` is unbounded JSONB; `loadOrCreateSession.ts:194` loads it with no truncation or windowing. Entry 12 in EC-2 Phase E produced AGENT_STRUCTURED_RESPONSE_INVALID after 32+ turns in the same session. There is no TTL-based rotation or turn-count threshold that triggers session rotation (CURRENT_STATE Phase E, known-concerns.md §12).

**pattern:** invariant-gap

**categories_to_investigate:**
- Backend Design & API
- Test Coverage & Gaps

**evidence_that_would_confirm:**
- `src/agent/orchestrator/loadOrCreateSession.ts:194` — verify no truncation or windowing of `conversation`
- `src/app/api/agent/message/route.ts` — search for turn-count checks or session-rotation logic (should not exist)
- Integration tests for agent saturation behavior — should not exist if the bug is real (or should fail)
- Projection of turn count at saturation: does 32 turns match token-budget limits for Claude Sonnet? (check Phase 1.2 token usage baseline)

**evidence_that_would_refute:**
- A session-rotation mechanism exists that moves to a new `agent_session` after N turns
- OR the conversation is truncated when it exceeds a size threshold
- OR a test explicitly characterizes the saturation curve

**priority:** high

---

### H-14: Anthropic SDK message shape drift — cache_read/cache_creation tokens and block-type unions

**hypothesis:** The S22 caching enablement (commit 856dcc7) restructured `system: string` → `system: TextBlockParam[]`, requiring a compat-shim. Other SDK response fields may have drifted (e.g., `usage.cache_read_input_tokens`, `usage.cache_creation_input_tokens`, or the `content` array's discriminated union for text vs tool_use vs tool_result blocks) between SDK versions, and the internal types may not catch all shapes (DESIGN.md Constraint #5 fourth-boundary-bug hunt, known-concerns.md §14).

**pattern:** boundary-mismatch

**categories_to_investigate:**
- Backend Design & API
- Data Layer & Schema

**evidence_that_would_confirm:**
- `src/agent/orchestrator/` files that parse Claude responses — grep for `usage.cache_read_input_tokens` or `cache_creation_input_tokens` (should not find them if the types are stale)
- Compare internal Anthropic SDK type definitions (if imported) against the actual SDK package's `node_modules/@anthropic-ai/sdk/index.d.ts` or published docs
- Commit 856dcc7 diff — search for other `.system` → `TextBlockParam[]` patterns that might have been missed
- Integration tests that exercise real Claude API responses under caching (e.g., `callClaudeErrorClassification.test.ts`) — check if they assert on `usage` fields

**evidence_that_would_refute:**
- The types are auto-generated from the SDK via TypeScript project references or other tooling, so drift is impossible
- OR cache token fields are never read from the response, so their shape doesn't matter
- OR a compat layer handles multiple SDK versions

**priority:** medium

---

### H-15: Agent tool selection hints insufficient for disambiguating cross-org access in Mode B

**hypothesis:** Phase 1.2 added tool selection hints to distinguish the agent's visibility across multi-org contexts, but underlying read-service gaps (H-04: `chartOfAccountsService.get()` lacking org checks, H-09: `periodService.isOpen()` without org checks) mean the agent can still leak cross-org data. The prompt fix alone is insufficient if the service layer has the hole (known-concerns.md §9 Mode B org_id confusion, Session 8 C8).

**pattern:** layering-leak

**categories_to_investigate:**
- Backend Design & API
- Authorization & Access Control

**evidence_that_would_confirm:**
- `src/agent/prompts/` — grep for TOOL_SELECTION_HINTS or tool description clarifications (added in C8 per Session 8 summary)
- `src/agent/tools/` dispatch implementation — verify it calls `chartOfAccountsService.get()` and `periodService.isOpen()` without bypassing the org-check gap
- Integration test `agentToolSelectionWithMultiOrgContext.test.ts` (or similar) — does it actually verify the agent refuses to leak data, or just that the hint is present?

**evidence_that_would_refute:**
- The tool descriptions are so restrictive that the agent cannot reasonably invoke them across org boundaries
- OR the underlying service methods were fixed to include org checks (resolves H-04 and H-05 first)

**priority:** medium

---

### H-16: User-controlled strings interpolated into system prompts without length limits or escaping

**hypothesis:** `src/agent/prompts/suffixes/onboardingSuffix.ts` and `src/agent/memory/orgContextManager.ts` interpolate user-provided strings (displayName, account names, memo lines) into system prompts and `tool_result` content without escaping or length-limiting. Phase 2 intercompany flows cross org boundaries; an attacker controlling an account name in org A could attempt to manipulate the agent's reasoning on org B data (S23 gap, known-concerns.md §15).

**pattern:** security-surface-gap

**categories_to_investigate:**
- Authorization & Access Control
- Backend Design & API

**evidence_that_would_confirm:**
- `src/agent/prompts/suffixes/onboardingSuffix.ts` — grep for `displayName` or other user-controlled interpolation; check for template escaping or length limits
- `src/agent/memory/orgContextManager.ts` — same grep pattern for account names and memo content
- Grep `chart_of_accounts` or `organizations` for any string field that flows into the prompt without sanitization
- Search for any validation of prompt-injection length or character limits

**evidence_that_would_refute:**
- All user-controlled strings are length-limited before interpolation (e.g., max 50 chars)
- OR they're passed through a sanitization function that escapes injection chars
- OR the system prompt is structured so that user content cannot break out of its assigned role

**priority:** low (Phase 2 hardening obligation, not Phase 1.2 blocker per concerns.md §15)

---

### H-17: Test coverage gap on agent path reject/edit-flow source flip

**hypothesis:** When an `ai_action` is rejected and the user manually edits the proposed entry, the `source` field flips from `agent` to `manual`. This was an EC-2 carry-forward in the friction-journal but has no named regression test, meaning Phase 2 reuse of this code path could reintroduce the flip without detection (known-concerns.md §13).

**pattern:** test-reality-divergence

**categories_to_investigate:**
- Test Coverage & Gaps
- Backend Design & API

**evidence_that_would_confirm:**
- `tests/integration/` — grep for test files related to `reject` or `edit` flow; should not find a test explicitly checking `source` flip behavior
- `src/app/api/agent/reject/route.ts` — verify it sets `source = 'manual'` or similar source-flip logic
- Friction-journal entries from Phase 1.2 mentioning the source-flip (grep `source.*manual` in friction-journal.md)

**evidence_that_would_refute:**
- A regression test exists (e.g., `agentRejectPathSourceFlip.test.ts` or similar) that asserts the behavior
- OR the source-flip happens in the client-side code and is tested there
- OR the behavior was intentionally removed and is now prevented by the schema

**priority:** medium

---

### H-18: Test coverage hole on malformed agent response shapes under context pressure

**hypothesis:** EC-2 Entry 12 failure produced AGENT_STRUCTURED_RESPONSE_INVALID under context saturation (32+ turns), but no integration test exercises this explicit failure mode. The test suite covers 401/429/5xx via `callClaudeErrorClassification.test.ts` but not the structured-response shape failures (known-concerns.md §13).

**pattern:** test-reality-divergence

**categories_to_investigate:**
- Test Coverage & Gaps
- Backend Design & API

**evidence_that_would_confirm:**
- `tests/integration/callClaudeErrorClassification.test.ts` — verify it covers 401/429/5xx but not AGENT_STRUCTURED_RESPONSE_INVALID
- `src/app/api/agent/message/route.ts` — grep for AGENT_STRUCTURED_RESPONSE_INVALID error handling
- Grep `STRUCTURAL_MAX_RETRIES` in the codebase — verify the constant exists and is set (CURRENT_STATE mentions it = 1)

**evidence_that_would_refute:**
- A test exists that mocks a structurally invalid response and asserts the error path
- OR the error is not possible under current code (e.g., validation is tight enough to catch all invalid shapes)

**priority:** medium

---

## Summary Statistics

**Total hypotheses:** 18

**Pattern distribution:**
- boundary-mismatch: 4 (H-01, H-02, H-03, H-14)
- invariant-gap: 6 (H-05, H-06, H-07, H-09, H-12, H-13)
- security-surface-gap: 6 (H-04, H-08, H-10, H-16)
- layering-leak: 1 (H-15)
- test-reality-divergence: 3 (H-11, H-17, H-18)
- schema-code-drift: 1 (H-03, classified dual)

**Category distribution:**
- Backend Design & API: 13 hypotheses
- Data Layer & Schema: 9 hypotheses
- Authorization & Access Control: 8 hypotheses
- Test Coverage & Gaps: 7 hypotheses
- Audit & Compliance: 2 hypotheses
- Frontend Architecture: 1 hypothesis

**Priority distribution:**
- High: 10 hypotheses (H-01, H-02, H-04, H-05, H-06, H-07, H-09, H-13, H-14)
- Medium: 7 hypotheses (H-03, H-08, H-11, H-12, H-15, H-17, H-18)
- Low: 1 hypothesis (H-16)

**Cross-cutting hypotheses (spanning 3+ categories):**
- H-01: tool_input drift (Backend + Data + Test)
- H-02: conversation shape drift (Backend + Data + Test)
- H-06: transaction atomicity (Backend + Data)
- H-10: PII in audit log (Audit + Authorization)

---

## Known-Concerns Mapping

The 15 concerns in `docs/07_governance/audits/phase-1.2/known-concerns.md` map to hypotheses as follows:

| Concern # | Title | Hypothesis | Coverage |
|-----------|-------|-----------|----------|
| 1 | MFA dead code | H-11 | test-reality-divergence |
| 2 | Read-path org checks missing | H-04 | security-surface-gap |
| 3 | Ledger immutability no triggers | H-05 | invariant-gap |
| 4 | Transaction atomicity gap | H-06 | invariant-gap |
| 5 | Cross-org account_id injection | H-07 | security-surface-gap |
| 6 | Audit-emit failures swallowed | H-08 | security-surface-gap |
| 7 | Period date/fiscal_period mismatch | H-09 | invariant-gap |
| 8 | PII in audit_log and logs | H-10 | security-surface-gap |
| 9 | Multi-org user agent org creation | H-15 (partial) | layering-leak |
| 10 | before_state PII design | H-10 | security-surface-gap |
| 11 | CI guard for mutation surface absent | H-12 | invariant-gap |
| 12 | Context-window saturation | H-13 | invariant-gap |
| 13 | Agent path test coverage holes | H-17, H-18 | test-reality-divergence |
| 14 | Fourth boundary-bug hunt | H-01, H-02, H-03, H-14 | boundary-mismatch, schema-code-drift |
| 15 | Prompt injection PII | H-16 | security-surface-gap |

---

## Out-of-Scope Notes

The following are explicitly NOT hypothesized per DESIGN.md Constraint #4 (do not re-audit deferred items):

- **Phase 2 obligations** (OI-3 fix-stack, Class 2 fix-stack, schema export, etc.) — see `docs/09_briefs/phase-2/obligations.md`
- **Phase 1 simplifications** (Simplification 1–3 in `docs/03_architecture/phase_simplifications.md`) — these are temporary and have scheduled Phase 2 corrections
- **External pre-Phase-2 review verified items** (H6 locale inline script, M7 onboarding state guard, L6 setSubmitting after router.push) — see known-concerns.md synthesis-of-prior-corrections

---

## Audit Handoff Notes for Phase 2

**Priority order for category scanners:**
1. Start with high-priority security hypotheses (H-04, H-05, H-07, H-08) — these directly affect ledger safety
2. Proceed to boundary-mismatch hypotheses (H-01, H-02) — these are hard to detect at runtime and easy to miss in code review
3. Cross-check Phase 1.1 known-concerns items 3 (UF-006 ledger immutability trigger) and 4 (UF-001 transaction atomicity) — these carry forward and H-05/H-06 are the audit's way of verifying the fixes were applied

**For the Backend Design & API scanner:**
- Use the file paths and line numbers in each hypothesis to ground the search
- Cross-reference commits from Phase 1.2 sessions (especially Session 4 paid-API, Session 8 C6-C8) for context on when new code was added
- When investigating hypothesis H-15 (agent tool selection), trace the entire dispatch path from prompt to service call

**For the Data Layer & Schema scanner:**
- Prioritize H-01 (tool_input shape drift) and H-02 (conversation shape drift) before general schema drift — these are the known cross-version migration risks
- For H-05 and H-06, use the Phase 1.1 audit's findings (UF-006 and UF-001) as the baseline and verify whether the recommended fixes shipped

