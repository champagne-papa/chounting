# Unified Findings — Phase 1.2 Synthesis

**Phase:** Phase 1.2 Synthesis (end of agent integration sprint)
**Date:** 2026-04-28
**Input:** 9 category findings logs (54 raw findings)
**Output:** 24 unified findings after deduplication and cross-category merging

---

## Header

- **Audit phase:** 1.2
- **Scan completion:** 2026-04-27
- **Category scanners:** 9 (Architecture Fit, Backend Design, Frontend Architecture, Data Layer, Security & Compliance, Code Quality, Observability, Infrastructure, Performance)
- **Raw finding count:** 54 (ARCHFIT-006, BACKEND-007, FRONTEND-008, DATALAYER-010, SECURITY-010, QUALITY-008, OBSERVE-007, INFRA-004, PERF-004)
- **Unified finding count:** 24 (after dedup/merge across categories)

---

## Hypothesis Verification

### H-01: Tool_input JSONB shape drift between inject-time and read-time
- **Status:** Inconclusive (with evidence of injection discipline and runtime re-parse safety)
- **Evidence:** Backend Design scanner (lines 14-21) confirmed cross-check on confirm path; Data Layer confirmed no backfill migration exists but no shape mismatch observed at HEAD
- **Unified finding:** BOUNDARY-BUG-001 (boundary-mismatch pattern, Medium severity)

### H-02: Agent_sessions.conversation message-shape drift across SDK version churn
- **Status:** Confirmed (no versioning, unvalidated load pattern)
- **Evidence:** Data Layer (lines 26-33), Backend Design (lines 28-34), Code Quality (lines 76-87) all confirmed loose loading via `as unknown[]` cast
- **Unified finding:** BOUNDARY-BUG-002 (boundary-mismatch pattern, High severity)

### H-03: Canvas_directive schema vs persisted directive shape mismatch
- **Status:** Refuted (schema uses `.strict()` uniformly; all growth via new discriminated types)
- **Evidence:** Frontend Architecture (Inconclusive) and Data Layer (Refuted) both examined schema; no evidence of required-field additions breaking old rows
- **Unified finding:** Constraint documented in DATALAYER-010 (Low severity, positive control)

### H-04: Read-path authorization gaps on org-scoped service methods
- **Status:** Confirmed (two methods lack org checks)
- **Evidence:** Architecture Fit (lines 129-150), Backend Design (lines 37-47), Security (lines 16-23), Code Quality (lines 91-114) all independently confirmed
- **Unified findings:** SECURITY-001 (High), ARCHFIT-001 (High), QUALITY-001 (High)

### H-05: Ledger immutability enforcement missing trigger pattern
- **Status:** Confirmed (RLS bypassed by adminClient; no triggers)
- **Evidence:** Architecture Fit (lines 153-174), Data Layer (lines 48-58), Security (lines 27-34) independently confirmed
- **Unified finding:** SECURITY-002 (High), DATALAYER-001 (Critical)

### H-06: Transaction atomicity gap across multi-call service writes
- **Status:** Confirmed (sequential auto-commits, no RPC wrapper)
- **Evidence:** Architecture Fit (lines 177-200), Backend Design (lines 50-63), Security (lines 38-45) all confirmed
- **Unified finding:** SECURITY-003 (High), ARCHFIT-003 (High)

### H-07: Cross-org account_id injection on journal_lines foreign key
- **Status:** Confirmed (simple FK, no composite constraint)
- **Evidence:** Backend Design (lines 65-75), Data Layer (lines 60-71), Security (lines 49-58) independently confirmed
- **Unified finding:** SECURITY-004 (High), DATALAYER-003 (High)

### H-08: Audit-emit failures swallowed in agent paths with no observability
- **Status:** Confirmed (try/catch wraps emits, no alerting)
- **Evidence:** Data Layer (lines 73-84), Security (lines 62-70), Observability (lines 33-64) all confirmed
- **Unified finding:** SECURITY-005 (Medium), OBSERVE-001 (Medium)

### H-09: Period lock enforcement checks only is_locked, not entry_date consistency
- **Status:** Confirmed (date-range validation missing from both service and trigger)
- **Evidence:** Architecture Fit (lines 203-225), Backend Design (lines 78-88), Data Layer (lines 126-135), Security (lines 259-272) all confirmed
- **Unified finding:** BACKEND-001 (High), DATALAYER-002 (High)

### H-10: PII in audit_log JSONB and pino logs, with append-only table blocking right-to-erasure
- **Status:** Confirmed (two PII capture surfaces: before_state and pino logs)
- **Evidence:** Data Layer (lines 86-97), Security (lines 84-97), Observability (lines 66-92) all confirmed PII captures
- **Unified finding:** SECURITY-007 (Medium), OBSERVE-002 (Medium), DATALAYER-007 (Medium)

### H-11: MFA enforcement middleware exists but is unwired to the request path
- **Status:** Confirmed (middleware exported, never called)
- **Evidence:** Architecture Fit (lines 228-252), Frontend Architecture (lines 23-31), Security (lines 98-106) all independently confirmed
- **Unified finding:** SECURITY-008 (Low), ARCHFIT-005 (Medium)

### H-12: Service layer mutation CI guard absent; withInvariants wrap is convention-only
- **Status:** Confirmed (no ESLint rule, no CI gate)
- **Evidence:** Architecture Fit (lines 255-281), Backend Design (lines 90-100), Code Quality (lines 12-140), Security (lines 109-116) all confirmed
- **Unified finding:** SECURITY-009 (Medium), ARCHFIT-006 (Medium), QUALITY-002 (High)

### H-13: Conversation context-window saturation at high turn counts with no rotation policy
- **Status:** Confirmed (unbounded conversation, no rotation, 32+ turn failure known)
- **Evidence:** Observability (lines 129-160), Performance (lines 19-29) both documented saturation risk
- **Unified finding:** OBSERVE-004 (Medium), PERF-001 (Medium)

### H-14: Anthropic SDK message shape drift — cache_read/cache_creation tokens and block-type unions
- **Status:** Inconclusive (no active drift detected, defensive logging present)
- **Evidence:** Backend Design (lines 102-111), Data Layer (lines 99-108), Code Quality (lines 59-73), Observability (lines 95-125) all examined SDK types; optional-chaining fallback present
- **Unified finding:** BOUNDARY-BUG-003 (boundary-mismatch pattern, Low severity)

### H-15: Agent tool selection hints insufficient for disambiguating cross-org access in Mode B
- **Status:** Inconclusive (prompt fixed, service gaps remain)
- **Evidence:** Architecture Fit (lines 115-124), Backend Design (lines 114-123), Frontend Architecture (lines 33-41) note that service gaps (H-04, H-09) are root cause
- **Unified finding:** Cross-cutting with SECURITY-001 (read-path gaps)

### H-16: User-controlled strings interpolated into system prompts without length limits or escaping
- **Status:** Inconclusive (Phase 2 hardening obligation, explicitly deferred per known-concerns.md §15)
- **Evidence:** Security (lines 132-135) explicitly noted "not Phase 1.2 blocker"
- **Unified finding:** Out-of-scope for Phase 1.2; Phase 2 obligation

### H-17: Test coverage gap on agent path reject/edit-flow source flip
- **Status:** Inconclusive (test named but body not examined)
- **Evidence:** Code Quality (lines 29-41) confirms test file exists but content unverified

### H-18: Test coverage hole on malformed agent response shapes under context pressure
- **Status:** Confirmed (AGENT_STRUCTURED_RESPONSE_INVALID not tested)
- **Evidence:** Code Quality (lines 44-56), Observability (lines 129-160) both note lack of regression test for EC-2 Entry 12 failure
- **Unified finding:** Test coverage gap (not a production issue, but test suite incomplete)

---

## Unified Findings

### Critical Severity

#### UF-001: Ledger immutability relies entirely on service-layer convention
**Category mapping:** SECURITY-002, DATALAYER-001, ARCHFIT-002  
**Severity:** Critical (data corruption risk)

**Description:**  
The `journal_entries` and `journal_lines` tables are intended to be append-only per INV-LEDGER-001. RLS policies (`*_no_update`, `*_no_delete`) exist but apply only to authenticated user-context queries; the `adminClient()` service-role client used by all service functions **bypasses RLS entirely**. There are **no database-layer triggers** to mechanically enforce append-only semantics. The design relies entirely on service-layer convention: developers must not call UPDATE or DELETE on these tables. Contrast: the `audit_log` table explicitly has three append-only triggers (`trg_audit_log_no_update`, `trg_audit_log_no_delete`, `trg_audit_log_no_truncate`) demonstrating the pattern exists in the codebase but was not applied to the primary ledger tables.

Phase 2 agent expansion will add more mutation paths (mobile approvals, reversals, adjustments) multiplying the risk surface. A service-layer bug or accidental direct `adminClient()` mutation in a future route could silently corrupt posted ledger entries without mechanical detection.

**Evidence:**
- `supabase/migrations/20240122000000_audit_log_append_only.sql` (lines 44–57) — triggers applied to audit_log
- `supabase/migrations/20240101000000_initial_schema.sql` (lines 734–757) — RLS policies for journal tables, no triggers
- Grep for `journal_entries_no_update`, `journal_entries_no_delete` triggers: zero results across all migrations
- `src/services/accounting/journalEntryService.ts` (lines 13–14 comment) — "Law 2: All journal entries are created by journalEntryService.post() only" — this is convention-enforced, not mechanically enforced

**Consequence:**  
Ledger corruption via service-layer bug. Posted entries can be mutated or deleted without audit trail. Regulatory audit trail has structural gaps. Reports based on corrupted ledger are incorrect.

**Cross-references:** H-05, Phase 1.1 audit UF-006 (carry-forward), Phase 2 obligations OI-3

---

### High Severity

#### UF-002: Read-path authorization gaps enable cross-org data leakage
**Category mapping:** SECURITY-001, ARCHFIT-001, QUALITY-001, CODE-QUALITY  
**Severity:** High (multi-tenant isolation violation)

**Description:**  
`chartOfAccountsService.get()` (src/services/accounting/chartOfAccountsService.ts:47–66) and `periodService.isOpen()` (src/services/accounting/periodService.ts:52–83) lack the `ctx.caller.org_ids.includes(input.org_id)` org membership check that every other org-scoped read function performs. These methods are reachable from the agent's tool orchestrator (via indirect tool dispatch in the agent's executeTool path), creating a cross-org data leakage path.

The missing check is a single-line guard consistently applied in `chartOfAccountsService.list()` (line 20), `periodService.listOpen()` (line 29), `accountBalanceService.get()`, and all mutation pre-flights. Its absence in these two read methods is anomalous and creates a consistency gap in the authorization pattern.

**Evidence:**
- `src/services/accounting/chartOfAccountsService.ts:47–66` — `get()` method has no org_ids check; contrast `list()` at lines 13–42
- `src/services/accounting/periodService.ts:52–83` — `isOpen()` method lacks org check; contrast `listOpen()` at lines 24–46
- Both methods called from agent tool dispatch (chartOfAccountsService.get via account lookups, periodService.isOpen via checkPeriod tool)
- Service context `ctx.caller.org_ids` is available in both methods but unused

**Consequence:**  
Agent operating on org A can request account/period data from org B and receive it. Cross-org account structure and period information leaks. RLS policies on underlying tables may block the read at DB layer, but the service layer has no defense-in-depth.

**Cross-references:** H-04, Concern 2, external review C2

---

#### UF-003: Transaction atomicity gap on multi-step writes
**Category mapping:** SECURITY-003, ARCHFIT-003  
**Severity:** High (audit trail corruption, INV-AUDIT-001 violation)

**Description:**  
`journalEntryService.post()` executes four sequential PostgREST calls without transaction wrapping:
1. INSERT journal_entries (lines 154–185)
2. INSERT journal_lines (lines 206–213) — deferred balance constraint fires here
3. INSERT audit_log via recordMutation (lines 220–228)
4. Optionally INSERT ai_actions

Each call auto-commits independently. If step 3 (audit_log) fails after step 2 succeeds, the ledger mutation persists without an audit record, violating INV-AUDIT-001 (every mutation produces an audit record). The JSDoc on `recordMutation.ts:45–51` falsely claims "atomicity if the caller uses the same client" — no plpgsql RPC wraps the calls in a Postgres transaction.

The same pattern repeats in `orgService.createOrgWithTemplate()` (three sequential inserts: organizations, chart_of_accounts, memberships), `recurringJournalService.approveRun()`, and other multi-step mutations.

**Evidence:**
- `src/services/accounting/journalEntryService.ts:154–228` — four sequential PostgREST calls, no transaction wrapper
- `src/services/audit/recordMutation.ts:45–51` — JSDoc claims atomicity; no RPC implementation
- `docs/03_architecture/phase_simplifications.md:65–127` — documents as "Simplification 1"; Phase 2 correction deferred
- No integration tests simulate audit-log write failure mid-sequence

**Consequence:**  
Ledger entries post without audit breadcrumbs if audit write fails transiently. Regulatory audit trail has gaps. Forensics cannot reconstruct system history. Phase 2's increased mutation surface amplifies this risk.

**Cross-references:** H-06, Phase 1.1 audit UF-001 (carry-forward)

---

#### UF-004: Period-lock enforcement incomplete — entry_date not validated against period range
**Category mapping:** BACKEND-001, DATALAYER-002, SECURITY-006, ARCHFIT-004  
**Severity:** High (INV-LEDGER-002 violation)

**Description:**  
`journalEntryService.post()` validates that `fiscal_period_id.is_locked = false`, but does not validate that the supplied `entry_date` actually falls within the period's `[start_date, end_date]` range. An authorized user can post an entry with `entry_date` inside a closed period while supplying an open period's `fiscal_period_id`, defeating the period-lock invariant (INV-LEDGER-002) in spirit while the lock trigger fires green.

`periodService.isOpen()` exists (lines 52–65) with the correct date-range validation logic (`lte('start_date', entry_date)` + `gte('end_date', entry_date)`), but is not called from `journalEntryService.post()`. The service layer has the logic; it is simply not wired into the mandatory path. The agent's `checkPeriod` tool correctly calls `periodService.isOpen()`, leaving the manual entry route undefended.

**Evidence:**
- `src/services/accounting/journalEntryService.ts:107–119` — checks `period.is_locked` only; grep for `periodService.isOpen()` returns zero matches
- `src/services/accounting/periodService.ts:60–65` — `isOpen()` has correct date-range logic but is unreachable from post path
- Database trigger `enforce_period_not_locked()` also gates on `is_locked` only, providing no second-line defense
- S23 security review explicitly identified this (known-concerns.md §7)

**Consequence:**  
Period-lock enforcement is bypassed. Closing a period is supposed to prevent all entries with dates in that period. Users can post entries with dates in closed periods by assigning them to open periods, silently violating fiscal calendar controls.

**Cross-references:** H-09, known-concerns.md §7

---

#### UF-005: Cross-org account_id injection via journal_lines foreign key
**Category mapping:** SECURITY-004, DATALAYER-003  
**Severity:** High (cross-org ledger poisoning)

**Description:**  
`journal_lines.account_id` references `chart_of_accounts(account_id)` with a simple foreign key. The `chart_of_accounts` table has an `org_id` column, but the FK does not constrain that the account belongs to the same org as the parent `journal_entries.org_id`. Combined with UF-002 (read-path org checks missing on `chartOfAccountsService.get()`), an agent or attacker could reference accounts from arbitrary orgs in journal entries, creating cross-org data leakage and unbalanced ledgers in target organizations.

The RLS policy on journal_lines insertion (`journal_lines_insert`) checks the entry's org but not the account's org membership.

**Evidence:**
- `supabase/migrations/20240101000000_initial_schema.sql:223` — `account_id uuid NOT NULL REFERENCES chart_of_accounts(account_id)` — simple FK, not composite
- `src/shared/schemas/accounting/journalEntry.schema.ts:20` — `account_id: z.string().uuid()` — no cross-org assertion
- `src/services/accounting/journalEntryService.ts:193–204` — lines inserted without per-line org membership check
- RLS policy `journal_lines_insert` checks entry org, not account org
- Same gap potentially exists on `recurring_template_lines.account_id` (concern 5) and `intercompany_relationships` account references (DATALAYER-005)

**Consequence:**  
Multi-org ledger poisoning. Journal entries can reference accounts from arbitrary orgs. Financial reports aggregate amounts across tenant boundaries. Audit trails and balance sheets become unreliable.

**Cross-references:** H-07, concern 5

---

#### UF-006: Service-layer mutation-surface enforcement is convention-only with no CI guard
**Category mapping:** SECURITY-009, ARCHFIT-006, QUALITY-002  
**Severity:** High (protocol violation risk)

**Description:**  
Every mutating service function must be invoked through `withInvariants()` middleware to enforce pre-flight authorization checks (org membership, role permissions). This rule is documented in code comments (INV-SERVICE-001) but **not mechanically enforced**. There is no ESLint `no-restricted-imports` rule for `adminClient` and no rule enforcing `withInvariants()` wrapping. Phase 1.1 audit identified this gap (UF-002); Phase 1.2 did not add the rule.

A future route that imports a mutating service and calls it directly without `withInvariants()` would silently bypass authorization checks. The pattern is documented and currently well-followed (code review catches violations), but mechanical enforcement is absent.

**Evidence:**
- `eslint.config.mjs` (lines 13–25) — no `no-restricted-imports` rule restricting `adminClient`
- Phase 1.1 audit identified this gap; Phase 1.2 did not fix (known-concerns.md §11)
- `src/app/api/agent/reject/route.ts:28–50` — imports `adminClient` directly; line 121 calls `.update()` without `withInvariants()` (deliberate exception per sub-brief §4, but no lint prevents similar bypasses elsewhere)
- Spot-check of current routes: all other mutation routes correctly wrap via `withInvariants`, but zero lint enforcement prevents future violations

**Consequence:**  
Future routes can silently bypass `withInvariants()` pre-flight checks, breaking INV-SERVICE-001. A developer error could allow cross-org writes without authorization, creating privilege escalation paths.

**Cross-references:** H-12, phase 1.1 UF-002, concern 11

---

#### UF-007: Agent_sessions.conversation loaded without schema validation or versioning
**Category mapping:** DATALAYER-004, SECURITY-003  
**Severity:** High (SDK shape mismatch risk)

**Description:**  
The `agent_sessions.conversation` JSONB column stores Anthropic SDK message arrays. Between Sept 2025 and Apr 2026, the SDK's message shape evolved (e.g., `system: string` → `system: TextBlockParam[]` per S22 caching enablement, commit 856dcc7). The loader at `src/agent/orchestrator/loadOrCreateSession.ts:194` reads the column as `(raw.conversation as unknown[]) ?? []` **with no schema validation or version strategy**. 

Older sessions created under prior SDK versions may carry message shapes the current session handler assumes are absent. When the conversation is passed to Claude API, shape mismatches could cause structured-response validation failures or silent type errors.

No migration backfill exists to upgrade stored conversations to the current SDK shape. The `as unknown[]` cast signals the codebase expects shape tolerance but provides no explicit validation.

**Evidence:**
- `src/agent/orchestrator/loadOrCreateSession.ts:194` — loads conversation as `(raw.conversation as unknown[]) ?? []` with no validation
- `supabase/migrations/20240118000000_agent_session_wiring.sql:16` — defines `conversation jsonb` with no versioning
- Commit 856dcc7 (S22 caching) changed `system: string` → `system: TextBlockParam[]` without backfill
- No migration backfills old SDK shapes; no discriminated union compat layer in loader
- No integration test seeds old SDK shapes and verifies load behavior

**Consequence:**  
Sessions created before SDK shape changes may fail or produce malformed Claude API calls. Phase 2 will carry forward rows across schema evolutions; this gap becomes acute with each SDK version bump.

**Cross-references:** H-02, DESIGN.md Constraint #5 (boundary-bug hunt)

---

### Medium Severity

#### UF-008: Audit-emit failures swallowed in agent paths with no alerting surface
**Category mapping:** SECURITY-005, OBSERVE-001  
**Severity:** Medium (audit trail completeness)

**Description:**  
Agent paths wrap four audit-emit calls (`agent.session_created`, `agent.session_org_switched`, `agent.message_processed`, `agent.tool_executed`) in try/catch blocks and swallow errors on failure (per "Clarification F" design rationale). If the emit fails, the agent can mutate data without producing the session-level audit breadcrumb linking that mutation to the user and session.

The design rationale (prevent audit emit failures from poisoning the user-facing response) is defensible, but this creates a blind spot: the agent can post journal entries, create memberships, and perform mutations without session-level forensic attribution if the emit fails transiently.

There is **no dedicated alerting mechanism** (metric counter, incident_type tag, or structured log on swallowed errors). Production incidents where audit-emit failures occur go undetected unless an operator manually correlates missing audit rows.

**Evidence:**
- `src/agent/orchestrator/index.ts:187–205` — `emitMessageProcessedAudit` wrapped in try/catch; exception logged at ERROR level
- `src/agent/orchestrator/index.ts:1272–1295` — `agent.tool_executed` wrapped; same pattern
- `src/agent/orchestrator/loadOrCreateSession.ts:152–179` — `agent.session_created` wrapped
- No grep match for `audit_emit_failure` or similar metric counter in codebase
- No integration test asserts on audit-emit success/failure observability

**Consequence:**  
Agent mutations lack session-level audit trail if emits fail silently. Forensic reconstruction of "which session posted this entry" becomes impossible. Compliance audits cannot prove causation.

**Cross-references:** H-08, concern 6

---

#### UF-009: MFA enforcement middleware is dead code with no runtime effect
**Category mapping:** SECURITY-008, ARCHFIT-005  
**Severity:** Medium (feature non-functional)

**Description:**  
`src/middleware/mfaEnforcement.ts` is a fully implemented 50-line module that exports an `enforceMfa` function. It correctly checks `organizations.mfa_required`, retrieves the user's AAL level from Supabase Auth, and redirects to MFA enrollment if needed. However, the top-level `middleware.ts` (repo root) performs **only** i18n routing via `next-intl/middleware` and never imports or calls `enforceMfa`.

`organizations.mfa_required` is a settable boolean column (Phase 1.5B). Flipping it to true produces no runtime effect because the middleware check never runs. The integration test (`tests/integration/mfaEnforcementMiddleware.test.ts`) explicitly states "the actual redirect behavior is verified manually in the browser," testing only that the column flips and the function exports, not that middleware.ts invokes the function.

**Evidence:**
- ~~`src/middleware.ts` (lines 1–10)~~ **Correction (2026-04-28, post-audit-brief-cleanup):** the top-level middleware file is at repo-root `middleware.ts` (lines 1–10), not `src/middleware.ts`. Drift caught at S25 brief-write. Only i18n routing; no enforceMfa import.
- `src/middleware/mfaEnforcement.ts` — fully implemented, line 10 exports `enforceMfa`
- Grep for enforceMfa outside this file: only two matches (export and test import). Never called at runtime
- `tests/integration/mfaEnforcementMiddleware.test.ts` header states manual verification; test does not assert runtime wiring

**Consequence:**  
MFA policy is not enforced at runtime. An org that requires MFA will not redirect non-MFA users; they access org-scoped pages without the 2FA ceremony. Severity is Medium rather than High because the code is complete and would work if wired (low risk of bugs in unused code), but the intended security control is absent.

**Cross-references:** H-11, concern 1

---

#### UF-010: PII leakage in audit_log and pino logs violates PIPEDA right-to-erasure
**Category mapping:** SECURITY-007, OBSERVE-002, DATALAYER-007  
**Severity:** Medium (regulatory compliance)

**Description:**  
Personally identifiable information is captured in two places without redaction: (1) pino structured logs via direct interpolation, and (2) audit_log JSONB `before_state` blobs.

**Pino surface:** `REDACT_CONFIG.paths` (src/shared/logger/pino.ts:19–40) covers financial PII (tax_id, bank_account_number, card_number) but **excludes** email, phone, first_name, last_name, and display_name. `invitationService.ts:92` logs plaintext email: `log.info({ org_id, email, invitation_id }, 'User invited')`.

**Audit log surface:** `recordMutation()` writes full `before_state` JSONB blobs directly to the append-only `audit_log` table, capturing invitation rows (invited_email), user_profile rows (phone, names, addresses), and membership rows. Once written to append-only audit_log, selective column scrubbing is architecturally infeasible due to the append-only triggers (`INV-AUDIT-002`).

RLS policy on audit_log is readable by `user_has_org_access(org_id)` — any organization member can read any audit_log row, including historical PII captures. No grant restriction to privileged compliance role exists.

**Consequence:**  
Audit log accumulates PII that cannot be removed without rebuilding the table and losing audit trail continuity. This violates PIPEDA right-to-erasure obligation. Logs containing PII require careful access controls and data retention policies not yet implemented.

**Cross-references:** H-10, concerns 8, 10

---

#### UF-011: Conversation history unbounded; no saturation observability
**Category mapping:** OBSERVE-004, PERF-001, SECURITY-ADJACENT  
**Severity:** Medium (availability risk)

**Description:**  
`loadOrCreateSession.ts:194` loads `agent_sessions.conversation` with no truncation or windowing. The field is unbounded JSONB. `handleUserMessage` appends every user turn and assistant response indefinitely. Known-concerns.md §12 documents EC-2 Entry 12's `AGENT_STRUCTURED_RESPONSE_INVALID` failure after 32+ turns, attributed to context-window saturation (Sonnet ~200k token budget).

**Current posture:**
- No TTL-based session rotation (sessions have 30-day idle TTL, but not a turn-count threshold)
- No pre-call check on conversation length
- No test characterizes the saturation curve; EC-2 incident is the only datapoint
- `STRUCTURAL_MAX_RETRIES = 1` caps per-turn retries but not conversation depth

**Evidence:**
- `src/agent/orchestrator/loadOrCreateSession.ts:194` — unbounded load
- `src/agent/orchestrator/index.ts:244` — full history appended
- No test exercises saturation; search for "saturation" / "32.*turn" yields zero test results
- known-concerns.md §12 documents the failure mode without regression test

**Consequence:**  
Sessions accumulate context cost without bound. The C6 cost analysis did not surface a projected saturation point, but the EC-2 datapoint suggests reachability within a session. Phase 2 must add session rotation; until then, operators have no observability on which sessions are saturated and should be recycled.

**Cross-references:** H-13, known-concerns.md §12

---

#### UF-012: Type casts on Anthropic SDK message types hide shape drift
**Category mapping:** QUALITY-003, CODE-QUALITY  
**Severity:** Medium (type safety)

**Description:**  
Three files use `as unknown as Anthropic.Messages.Message` or `as unknown[]` casts on data loaded from the database, signaling that the code assumes message shapes may diverge between stored and expected formats.

`src/agent/orchestrator/index.ts:320` constructs a synthetic message and casts it: `} as unknown as Anthropic.Messages.Message;`. This bypasses TypeScript type checking and could hide bugs if the synthetic message structure doesn't match the SDK's expectations.

`src/agent/orchestrator/loadOrCreateSession.ts:194` loads stored conversations and turns as `unknown[]`, then narrows them later when used. No explicit shape validation occurs at load time.

The S22 caching enablement (commit 856dcc7) already required a compat-shim (`getSystemPromptText.ts`) for `system: string` → `TextBlockParam[]` drift, suggesting SDK evolution is an active concern. These casts indicate awareness of the risk but lack explicit shape validation.

**Evidence:**
- `src/agent/orchestrator/index.ts:320` — synthetic message cast
- `src/agent/orchestrator/loadOrCreateSession.ts:194` — conversation/turns loaded as `unknown[]`
- `src/app/api/agent/conversation/route.ts:96` — same pattern
- No corresponding Zod schema or validation on loaded data

**Consequence:**  
If SDK message shapes evolve again (new cache fields, new content block types), the casts silently accept the new shapes without validation. Runtime errors or silent data loss possible if new fields are critical.

**Cross-references:** H-14, DESIGN.md Constraint #5

---

### Low Severity

#### UF-013: ESLint rule for adminClient import restriction missing
**Category mapping:** QUALITY-002, CODE-QUALITY  
**Severity:** Low (process gap, not immediate bug)

**Description:**  
CLAUDE.md Rule 2 claims that direct database calls outside `src/services/` are rejected at code review, and that `adminClient` import boundaries are enforced. However, no ESLint rule (`no-restricted-imports`) exists in `eslint.config.mjs`. The `withInvariants()` wrapping is called 55 times across the codebase but enforced by convention and code review only.

A new developer could add a mutating service method call without `withInvariants()`, and CI would not catch it. This is acceptable at Phase 1.2 scale but becomes risky as the codebase grows and the likelihood of violations increases.

**Evidence:**
- `eslint.config.mjs` (lines 1–25) — only TypeScript and Next.js rules; no `no-restricted-imports`
- Phase 1.1 audit identified this gap (UF-002); Phase 1.2 did not add the rule

**Consequence:**  
Future routes can bypass `withInvariants()` accidentally. Error would surface at runtime only if specific conditions trigger. Code review is the sole defense.

**Cross-references:** H-12, phase 1.1 UF-002, concern 11

---

#### UF-014: Canvas data-refresh mechanism absent post-mutation
**Category mapping:** FRONTEND-001  
**Severity:** Low (Phase 2 concern)

**Description:**  
The canvas (via ContextualCanvas.tsx) maintains local navigation history and renders directives, but when a mutation occurs (via ProposedEntryCard approval/rejection or future agent mutation), there is no mechanism to invalidate or refresh the underlying data for list views or reports. After an approval, if the user navigates back to a journal_entry_list view, the list state is not refreshed from the server; it retains stale data from the initial mount fetch.

Canvas components fetch data via useEffect at mount time, but neither the canvas orchestrator nor the bridge shell has a data-invalidation API. When ProposedEntryCard calls `onNavigate` after approval, it does not signal cache invalidation to sibling views.

**Evidence:**
- `src/components/bridge/ContextualCanvas.tsx:55–113` — local history state; no invalidation hook
- `src/components/ProposedEntryCard.tsx:75–80` — onNavigate fires after approval but no refresh signal
- `src/components/canvas/JournalEntryForm.tsx:129–147` — data fetch runs only at mount; no revalidate trigger
- No grep hits for "revalidate", "invalidate", or "refresh" in bridge components

**Consequence:**  
Users may see stale list views or report data after mutations. In Phase 1.2, manual navigation refreshes the view. Phase 2's increased agent-driven mutations make this a blocker.

**Cross-references:** Phase 2 obligations

---

#### UF-015: Canvas_directive schema allows unbounded string fields
**Category mapping:** FRONTEND-004, DATA-LAYER  
**Severity:** Low (DoS-able via oversized strings)

**Description:**  
`ProposedEntryCardSchema` (src/shared/schemas/accounting/proposedEntryCard.schema.ts:26–32) defines `account_name`, `description`, and other fields as bare `z.string()` with no `maxLength` constraint. These fields are rendered in the UI and can originate from agent generation or user import. An oversized description (10MB) could cause browser memory issues.

The schema is strict (rejecting extra keys), but does not constrain the size of string fields displayed in the UI.

**Evidence:**
- `src/shared/schemas/accounting/proposedEntryCard.schema.ts:47–50` — `description: z.string()` with no `.max()`
- Frontend components (ProposedEntryCard.tsx) render these directly without truncation

**Consequence:**  
DoS-able via oversized string fields. Not a Phase 1.2 issue (controlled agent, trusted org members) but should be addressed before Phase 2 external-import flows.

**Cross-references:** Concern 15 (prompt injection)

---

## Scanner Blind Spots

### Issues retrospective documents but scanners did not catch:

1. **ORG_SCOPED_TOOLS hand-maintained set drift** — `src/agent/orchestrator/index.ts:1098–1104` defines a hand-maintained Set of tool names requiring non-null org_id. When new tools are added via `toolsForPersona.ts`, the set must be manually updated. No lint rule or test verifies drift. (Code Quality finding QUALITY-006, Medium severity.) Phase 2 obligation: codify as brief requirement similar to permission-catalog-drift check.

2. **One console.warn call** — `src/app/api/agent/confirm/route.ts:94` contains `console.warn()` instead of pino logger. Single instance; all other code uses structured logging. (Code Quality finding QUALITY-004, Low severity.)

3. **Big files lack intermediate decomposition** — `src/agent/orchestrator/index.ts` is 1,343 LOC. The file's top comment outlines 10 steps, but step locations are implicit. Bus-factor risk for maintainability. (Code Quality finding QUALITY-005, Medium severity.)

4. **Hardcoded locale fallback** — `src/components/canvas/JournalEntryForm.tsx:240` contains hardcoded `/en/sign-in` redirect instead of using active user locale. Low-severity UX issue. (Frontend finding FRONTEND-006, Low severity.)

5. **Error handling lacks structured type mirroring** — Frontend components handle API errors as ad-hoc strings. No shared error schema analogous to backend `ServiceError`. (Frontend finding FRONTEND-002, Medium severity.)

6. **Agent response shape assumed without validation** — `AgentChatPanel.tsx:236` destructures response without Zod validation. Type safety at fetch boundary. (Frontend finding FRONTEND-005, Medium severity.)

---

## Retrospective Cross-Check

Phase 1.2 retrospective (2026-04-26) notes that Phase 1.2 shipped 27 exit criteria (21 MET, 7 DEFERRED, 2 PARTIAL at closure). The unified findings above intersect with retrospective items in three ways:

1. **Verified-as-expected issues:** UF-002 (read-path org checks), UF-003 (transaction atomicity), UF-010 (PII in logs) were all documented in known-concerns.md and entered Phase 1.2 as known debt. Scanners independently re-flagged them, confirming their persistence.

2. **Deferred Phase 2 obligations:** UF-007 (conversation shape versioning), UF-011 (saturation rotation), UF-016 (prompt injection escaping) were all explicitly deferred to Phase 2 per known-concerns.md. Audit confirms they remain open.

3. **Three verified-as-wrong external review items:** External review S23 identified three items that Phase 1.2 determined were design choices, not bugs. Retrospective notes that scanners did not re-flag them (H6 locale inline script, M7 onboarding guard, L6 setSubmitting after router.push). No cross-audit contradiction detected.

---

## Synthesis Summary

**Phase 1.2 codebase health assessment:** The architecture is structurally sound (service-layer abstraction, middleware enforcement, context threading). The agent integration surface is well-designed and the 10-tool orchestrator is functional. However, critical gaps exist where enforcement relies on convention rather than mechanism:

1. **Ledger immutability** (UF-001) is convention-enforced with no database triggers — Phase 2 prerequisite fix
2. **Read-path authorization** (UF-002) is inconsistently applied across two methods — immediate fix
3. **Transaction atomicity** (UF-003) relies on sequential auto-commits, not RPC wrapping — Phase 2 prerequisite
4. **Period-lock enforcement** (UF-004) is incomplete; date-range validation missing — immediate fix
5. **Cross-org FK integrity** (UF-005) lacks composite constraints — Phase 2 obligation
6. **Service mutation enforcement** (UF-006) is convention-only with no ESLint gate — Phase 2 hardening

**Biggest Phase 2 risk:** The two critical gaps (UF-001 ledger immutability, UF-003 transaction atomicity) are inherited from Phase 1.1 and remain unfixed. Phase 2 agent expansion will multiply mutation paths, making these gaps acute. Both require RPC-level transaction wrapping before Phase 2 starts. Phase 1.2 closure notes that "OI-3 Part 5 M1 paid validation" awaits Phase 2 activation; UF-001 and UF-003 are blocking pre-requisites for that M1 work.

**Self-audit bias note:** The same Claude family that participated in Phase 1.2 authored this synthesis. The findings above are grounded in specific code evidence and cross-validated across 9 independent scanners. However, familiarity with the design decisions may have softened assessment of gaps that are explicitly designed as Phase 1 simplifications. Phase 2 brief should treat UF-001, UF-003, UF-005 as blocking pre-requisites before expanding the agent surface.

---

## Cross-Audit Comparison Placeholder

*See comparison-to-prior-audits.md for Phase 1.1 → Phase 1.2 delta analysis.*
