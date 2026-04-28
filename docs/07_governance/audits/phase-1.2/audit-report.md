# Audit Report — Phase 1.2

Date: 2026-04-28
Auditor: Claude family — multi-session four-phase execution; self-audit acknowledged.

## Executive Summary

The Phase 1.2 codebase has successfully integrated agent orchestration into the core ledger system while maintaining multi-tenancy enforcement and the Two Laws. The architecture remains structurally sound, with clean service-layer mediation and consistent authorization patterns. However, critical enforcement gaps inherited from Phase 1.1 remain unfixed, and agent integration has exposed new boundary-mismatch vulnerabilities at the SDK level. The audit produced 24 unified findings: 1 Critical, 6 High, 9 Medium, and 8 Low severity. **Foundation readiness for Phase 2 is YES-WITH-CAVEATS: three blocking prerequisites (transaction atomicity, ledger triggers, cross-org FK guards) must land before Phase 2 agent expansion proceeds.** Agent integration demonstrates the architecture can scale to multi-path mutation surfaces, but the scale-amplifies pre-existing gaps that must be mechanically enforced before expanding further.

---

## Category Assessments

### 1. Architecture Fit

#### Current State

The Phase 1.2 architecture extends Phase 1.1's layered model with agent orchestration: a 10-tool dispatcher routes agent requests through org-scoped context injection, mutation flow through the service layer, and audit trail logging. The Two Laws remain the structural anchors—all database access through services, all journal mutations through `journalEntryService.post()`. The agent integration points are cleanly separated: an `executeTool` path with org-scoped checks, a structured response validation pipeline, and session persistence via `agent_sessions` table with conversation JSONB.

#### Strengths

- The agent orchestrator maintains the Two Laws across 10 tools and 3 personas. No tool directly queries the database; all access is service-mediated.
- The `withInvariants` middleware applies uniformly to every mutating service function, providing defense-in-depth across manual and agent-driven mutation paths.
- Agent context injection (`buildServiceContext` per request) correctly threads the authenticated user and org membership into every tool execution.
- Canvas directive system provides a clean, structured mechanism for agent-to-frontend communication without bypassing service layers.
- The structured-response validation pipeline (agent message → Zod schema → error recovery) is thorough and handles SDK shape variations defensively.

#### Weaknesses

- **Read-path authorization gaps enable cross-org leakage** (UF-002): `chartOfAccountsService.get()` and `periodService.isOpen()` lack org checks, now exposed by agent tool dispatch.
- **Ledger immutability relies entirely on service convention** (UF-001): RLS policies are bypassed by `adminClient`; no database triggers enforce append-only semantics. Phase 2's agent expansion multiplies mutation paths, making this gap acute.
- **Service mutation enforcement is convention-only** (UF-006): `withInvariants` wrapping is not enforced by lint or CI; a future route could bypass authorization checks undetected.
- **Conversation versioning missing for SDK shape changes** (UF-007): Agent sessions load JSONB conversations with no schema validation or version strategy. SDK evolution (e.g., `system: string` → `system: TextBlockParam[]`) could cause shape mismatches.

#### Risks

- **Agent tool authorization gap leads to cross-org reads.** Probability: Possible. Impact: High. Two read-path methods lack org checks; agent tools can reach them. (UF-002, R-01)
- **Service-layer mutation bypasses expand with new routes.** Probability: Possible. Impact: High. No automated enforcement of `withInvariants` wrapping. (UF-006, R-02)
- **Ledger immutability failure cascades across agent retry paths.** Probability: Likely. Impact: Critical. Sequential auto-commits without transaction wrapping interact with agent retry semantics to create orphaned entries. (UF-001, R-03)

### 2. Backend Design & API

#### Current State

Phase 1.2 adds two new API routes (`/agent/confirm` and `/agent/reject`) for approving/rejecting proposed entries, replicating the journal entry post path's mutation discipline. The core `journalEntryService.post()` remains the primary mutation path, now also callable via agent tools. Error handling follows the established `ServiceError`-to-HTTP pipeline for the journal path; agent path errors are structured similarly. Org context injection via `buildServiceContext` is applied consistently.

#### Strengths

- Agent routes correctly apply `withInvariants` wrapping and thread service context through all mutations.
- `journalEntryService.post()` core logic (double-entry, reversal mirror, period-lock checks, audit logging) remains unchanged and correct.
- Structured error responses provide consistent error communication from service → API route → frontend.

#### Weaknesses

- **Transaction atomicity gap persists across three independent auto-commits** (UF-003): `journalEntryService.post()` issues entry, lines, and audit_log inserts sequentially without transaction wrapping. Phase 1.1 Phase 2 obligation deferred; Phase 1.2 agent paths now trigger the gap.
- **Period-lock enforcement is incomplete** (UF-004): Entry `is_locked` check passes, but entry `entry_date` is not validated against period's `[start_date, end_date]` range. Users can post entries dated in closed periods by assigning them to open periods.
- **Cross-org account injection possible via journal_lines FK** (UF-005): FK from `journal_lines.account_id` to `chart_of_accounts(account_id)` lacks org cross-check. Combined with UF-002 read-path gaps, enables cross-org ledger poisoning.

#### Risks

- **Agent retry on partial commit produces orphaned entries.** Probability: Likely. Impact: Critical. A failure after entry insert but before lines insert leaves an unbalanced orphan and un-audited mutation. (UF-003, R-03)
- **Period-lock enforcement is bypassed.** Probability: Possible. Impact: High. Date-range validation missing from both service and trigger layer. (UF-004, R-04)

### 3. Frontend Architecture

#### Current State

The split-screen canvas/chat layout provides isolation between agent interaction (chat panel) and journal entry views (canvas panel). Components use React Server Components for data fetching. Canvas directives provide structured navigation signals. The agent response parser validates structured output against a Zod schema before rendering.

#### Strengths

- Clean canvas/chat separation enables agent feature development without restructuring core journal entry UI.
- Canvas directives provide a type-safe mechanism for agent-to-canvas navigation.
- Server/Client component boundary is well-maintained.

#### Weaknesses

- **Canvas data refresh mechanism absent** (UF-014): When mutations occur (via agent approval or manual entry), canvas list views are not refreshed. Users see stale data after agent mutations until manual navigation.
- **Canvas string fields unbounded** (UF-015): `ProposedEntryCardSchema` defines `account_name`, `description` as bare `z.string()` with no `maxLength`. Oversized strings from agent generation could cause browser memory issues.
- **Type casts hide SDK message shape drift** (UF-012): Synthetic messages and loaded conversations are cast as `unknown` without validation, signaling awareness of shape mismatch risk but providing no explicit schema check.

#### Risks

- **Stale-after-mutation breaks user trust.** Probability: Likely. Impact: High. Agent mutations must leave canvas showing updated data. (UF-014)

### 4. Data Layer & Database Design

#### Current State

Phase 1.2 added `agent_sessions` table (conversation JSONB, state, metadata) to persist multi-turn conversations. The `journal_entries`, `journal_lines`, and `chart_of_accounts` tables remain unchanged. RLS policies remain the primary tenant-isolation layer. Database triggers exist for audit_log append-only enforcement but not for ledger tables.

#### Strengths

- RLS policies on all tables correctly enforce `user_has_org_access()` checks for SELECT/INSERT.
- The deferred balance constraint on `journal_entries` correctly enforces double-entry integrity within the PostgREST auto-commit boundary.
- The `agent_sessions.conversation` JSONB structure allows storing raw Anthropic SDK messages for replay and context window management.

#### Weaknesses

- **Ledger immutability not enforced at database layer** (UF-001): Journal tables have RLS deny-all for UPDATE/DELETE, but `adminClient` bypasses RLS. No triggers prevent service-layer modification. The pattern exists in `audit_log` triggers but was not applied to the ledger.
- **Conversation shape loaded without validation** (UF-007): `loadOrCreateSession.ts:194` loads `(raw.conversation as unknown[]) ?? []` with no schema validation. SDK shape evolution (Sept 2025 → Apr 2026 caching enablement) could cause mismatches on old sessions.
- **Cross-org account references lack FK guard** (UF-005): `journal_lines.account_id` FK is simple; no constraint verifies the account belongs to the entry's org. RLS policy checks entry org but not account org.

#### Risks

- **Service-layer ledger modification is undetected.** Probability: Possible. Impact: High. Phase 1.2 agent tools use `adminClient`; a software bug could modify posted entries. (UF-001, R-03)
- **SDK shape mismatch on old sessions causes validation failures.** Probability: Possible. Impact: Medium. No test exercises shape drift. Phase 2's session rotation will expose old sessions to new code. (UF-007, R-05)

### 5. Security & Compliance

#### Current State

Authentication flows through `buildServiceContext`, which validates Supabase Auth cookies and loads the user's org memberships. Authorization is enforced at three layers: `withInvariants` service wrapper, RLS policies, and API route org_id validation. Audit trail is synchronously logged for all mutations. MFA enforcement middleware exists but is not wired to the request path.

#### Strengths

- `withInvariants` middleware is applied without exception to every mutating service function, providing consistent authorization gates.
- RLS policies on all tables correctly enforce tenant isolation for authenticated user-context queries.
- Audit trail logs all mutations synchronously within the mutation transaction (Phase 1 simplification with Phase 2 correction documented).
- Triple-layer mutation defense (URL/body match → `withInvariants` → RLS) is genuine defense-in-depth.

#### Weaknesses

- **Read-path authorization gaps enable cross-org data leakage** (UF-002): Two read functions lack org membership checks; agent tools can reach them.
- **Transaction atomicity gap violates INV-AUDIT-001** (UF-003): If audit_log insert fails after ledger inserts succeed, mutations persist without audit breadcrumbs.
- **MFA enforcement middleware is dead code** (UF-009): `src/middleware/mfaEnforcement.ts` is fully implemented but not called from `middleware.ts`. MFA policy settings have no runtime effect.
- **PII leakage in audit logs and pino** (UF-010): `audit_log.before_state` JSONB captures invitation emails and user profile PII. Pino redaction config excludes email/phone. Append-only audit_log makes selective column scrubbing infeasible.
- **Audit-emit failures swallowed in agent paths** (UF-008): Agent paths wrap four audit-emit calls in try/catch, suppressing errors. If an emit fails, mutations proceed without session-level forensic breadcrumbs. No dedicated alerting mechanism.

#### Risks

- **Cross-org data leakage via agent tool read path.** Probability: Possible. Impact: High. `chartOfAccountsService.get()` has zero org check; agent tools can call it. (UF-002, R-01)
- **Ledger audit trail gaps if emit fails transiently.** Probability: Possible. Impact: Medium. Try/catch suppresses emit errors; no alert on swallowed failures. (UF-008, R-06)
- **PIPEDA right-to-erasure violated by append-only audit log.** Probability: Possible. Impact: Medium. Audit log captures and preserves PII; append-only constraint makes removal impossible. (UF-010, R-07)

### 6. Infrastructure & DevOps

#### Current State

Infrastructure is minimal and appropriate for Phase 1.2: local Supabase instance, Next.js dev server, no CI/CD pipeline, no deployment configuration. The `pnpm` package manager and npm scripts provide developer convenience.

#### Strengths

- Migration files are well-structured and sequentially ordered.
- The `db:reset:all` script (QW-06 from Phase 1.1) reduces developer friction.

#### Weaknesses

- No CI/CD pipeline to enforce invariants automatically. Convention-only enforcement relies on code review.

#### Risks

- Infrastructure gaps are expected at Phase 1.2 and do not represent architectural risk. All items are Phase 1.3+ concerns.

### 7. Observability & Reliability

#### Current State

Phase 1.2 split observability out from the collapsed Infrastructure category (Phase 1.1). Observability surfaces include: `audit_log` table (mutation logging), pino structured logger, agent-specific audit emission (`agent.session_created`, `agent.message_processed`, `agent.tool_executed`), and conversation length tracking (informal, no metrics).

#### Strengths

- The `audit_log` table provides a complete, synchronous mutation record for every ledger operation — a strong foundation for forensics and compliance audits.
- Pino structured logging provides structured log output across the codebase (Phase 1.1 baseline).
- Agent path audit emission is designed to separate agent-level operations from ledger mutations for forensic attribution.

#### Weaknesses

- **Audit-emit failures are swallowed without alerting** (UF-008): Agent path emits fail silently if they error. No metric counter or incident flag tracks these silences.
- **PII captured in logs without redaction strategy** (UF-010): Pino `REDACT_CONFIG` excludes email/phone; `audit_log.before_state` JSONB captures full row blobs including invited_email and phone fields.
- **Conversation saturation unobserved** (UF-011): No test exercises the saturation curve. EC-2 EC known the 32+ turn failure to context-window saturation, but no observability on which sessions are saturated or when rotation should occur.

#### Risks

- **Audit emit failures go undetected in production.** Probability: Possible. Impact: Medium. No counter or alert; operators must manually correlate missing audit rows. (UF-008, R-06)
- **Conversation context-window saturation crashes user experience.** Probability: Possible. Impact: Medium. Known failure point at 32+ turns; no saturation observability or rotation policy. (UF-011, R-08)

### 8. Performance & Scalability

#### Current State

Performance scanning is sparse at Phase 1.2, as expected for a pre-production system. The three-query batch pattern in `journalEntryService.list()` avoids N+1 queries. No pagination, caching, or query optimization beyond basic patterns. Agent conversation history is unbounded JSONB.

#### Strengths

- The batch query pattern demonstrates query-efficiency awareness.

#### Weaknesses

- **Unbounded conversation JSONB has no saturation limit or rotation.** (UF-011)
- **No pagination on list endpoints.** Appropriate at Phase 1.2 volumes.

#### Risks

- **List queries degrade at moderate data volumes.** Probability: Possible. Impact: Low. Future scaling concern, not Phase 1.2. (Performance-001 baseline)

### 9. Code Quality & Maintainability

#### Current State

The codebase follows consistent patterns for the journal entry path: Zod validation at boundaries, `ServiceError` structured error handling, `withInvariants` middleware wrapping. Phase 1.2 agent code replicates this discipline. Dead code from Phase 1.1 persists. Agent orchestrator is 1,343 LOC without intermediate decomposition.

#### Strengths

- Consistent Zod validation at service boundaries for mutations.
- The `ServiceError` type system provides structured, typed error handling.
- Phase 1.2 agent code follows established patterns, with no new violations of Law 1 or Law 2.

#### Weaknesses

- **Service mutation enforcement is convention-only** (UF-006): `withInvariants` wrapping is documented in CLAUDE.md Rule 1 but not enforced by lint or CI. Phase 1.1 QW-01 proposed ESLint rule; Phase 1.2 did not implement.
- **Type casts hide shape divergence** (UF-012): Synthetic messages and loaded conversations use `as unknown` casts without explicit schema validation.
- **Large orchestrator file lacks intermediate structure** (QUALITY-005): `src/agent/orchestrator/index.ts` is 1,343 LOC with 10 step comments but no intermediate function decomposition.
- **Hand-maintained tool set drifts from source** (QUALITY-006): `ORG_SCOPED_TOOLS` Set at `index.ts:1098–1104` is manually updated when new tools are added. No lint rule or test verifies drift.

#### Risks

- **Convention violations multiply as codebase grows.** Probability: Likely. Impact: High. No lint enforcement of `withInvariants`. (UF-006, R-02)

---

## Risk Map

| ID | Risk | Probability | Impact | Severity | Source Findings |
|----|------|-------------|--------|----------|----------------|
| R-01 | Cross-org data leakage via read-path authorization gaps | Possible | High | High | UF-002 |
| R-02 | Service mutation bypass via missing `withInvariants` enforcement | Possible | High | High | UF-006 |
| R-03 | Agent retry on partial commit produces orphaned entries | Likely | Critical | Critical | UF-001, UF-003 |
| R-04 | Period-lock enforcement bypassed via date-range validation gap | Possible | High | High | UF-004 |
| R-05 | Conversation shape mismatch on old sessions causes failures | Possible | Medium | Medium | UF-007 |
| R-06 | Audit-emit failures swallowed without alerting | Possible | Medium | Medium | UF-008 |
| R-07 | PIPEDA right-to-erasure violated by PII in append-only logs | Possible | Medium | Medium | UF-010 |
| R-08 | Conversation context-window saturation crashes user experience | Possible | Medium | Medium | UF-011 |
| R-09 | Type-cast absence of schema validation hides SDK drift | Possible | Medium | Medium | UF-012 |
| R-10 | Cross-org ledger poisoning via journal_lines FK | Possible | High | High | UF-005 |
| R-11 | Canvas shows stale data after agent mutations | Likely | High | High | UF-014 |

---

## Scalability Constraints

Known constraints at Phase 1.2:

1. **Unbounded conversation JSONB** (UF-011): The `agent_sessions.conversation` column stores all turns without limit. Known context-window saturation at 32+ turns (EC-2 incident). No rotation policy or saturation observability.

2. **Agent tool dispatch has no caching layer**: Each tool call hits the database directly. Acceptable at Phase 1.2 scale. The `executeTool` path maintains org context correctly but provides no query-result caching.

3. **Sequential auto-commits on ledger mutations**: Three independent PostgREST calls (entry, lines, audit_log) without transaction wrapping. Constraint semantics differ between test (single transaction) and production (three separate auto-commits).

These constraints are appropriate for current phase. Phase 2 must address (1) and (3) before agent expansion.

---

## Security Vulnerabilities

Specific to this codebase:

1. **Ledger immutability bypass via service-role client** (UF-001): Journal entries and lines are protected by RLS deny-all for UPDATE/DELETE, but the `adminClient` (used by all service functions) bypasses RLS. No trigger prevents modification. Phase 1.2 agent tools use `adminClient`, making this bypass exploitable by a software bug. **Single highest risk at Phase 1.2**: mutations via agent paths compound this gap.

2. **Read-path authorization gaps enable cross-org reads** (UF-002): `chartOfAccountsService.get()` and `periodService.isOpen()` lack org membership checks. Reachable from agent tool dispatch. Combined with cross-org FK gap (UF-005), enables data leakage across tenants.

3. **Cross-org account injection via journal_lines FK** (UF-005): FK from `journal_lines.account_id` lacks org cross-check. Agent or user could reference accounts from arbitrary orgs, poisoning ledgers with cross-org amounts.

4. **Transaction atomicity gap violates audit trail completeness** (UF-003): If audit_log insert fails after ledger inserts, mutations persist without forensic attribution. Compliance audits cannot prove causation.

5. **Period-lock enforcement incomplete** (UF-004): Entry `entry_date` is not validated against period range. Users can bypass period closures by mismatching period_id and entry_date.

6. **MFA enforcement is dead code** (UF-009): Middleware is fully implemented but never called from the request path. MFA policy settings have no runtime effect.

7. **PII in append-only audit logs** (UF-010): `audit_log.before_state` JSONB captures invitation emails and user profile PII. Append-only triggers make selective erasure architecturally infeasible. Violates PIPEDA right-to-erasure.

8. **Audit-emit failures swallowed** (UF-008): Agent paths suppress audit emit errors. If emit fails, mutations proceed without session-level attribution. No alerting mechanism.

---

## Foundation Readiness Assessment

**Verdict: YES-WITH-CAVEATS**

The Phase 1.2 foundation successfully integrated agent orchestration while maintaining the Two Laws and multi-tenancy enforcement. The agent 10-tool dispatcher routes through the service layer, org-scoped context injection is consistent, and mutation audit trail integration is functional. However, **three critical gaps inherited from Phase 1.1 remain unfixed, and agent integration has both activated dormant gaps and introduced new SDK-boundary risks.**

**Three blockers must be fixed before Phase 2 agent expansion:**

1. **Transaction atomicity** (UF-001, Critical): The write RPC wrapping entry + lines + audit_log in a single Postgres transaction. Pattern proven in `test_helpers.sql`. Phase 1.1 identified as blocker; Phase 1.2 amplified its severity by adding agent retry semantics. Must land before Phase 2 mobile approvals and reversals paths proceed.

2. **Ledger immutability triggers** (UF-001 prerequisite, Critical): Append-only triggers on `journal_entries` and `journal_lines`, mirroring the existing `audit_log` pattern. Phase 2 agent expansion multiplies mutation paths, making mechanical enforcement essential.

3. **Read-path org checks** (UF-002, High): Add `ctx.caller.org_ids.includes(input.org_id)` guard to `chartOfAccountsService.get()` and `periodService.isOpen()`, matching the pattern in every other read function. Closes the cross-org read exposure activated by agent tool dispatch.

**Four near-blockers should land in Phase 2 sprint 1:**

4. **Period-lock date-range validation** (UF-004, High): Extend period lock check from `is_locked` to `entry_date in [start_date, end_date]` range. Known concern from Phase 1.1.

5. **Cross-org FK guard on journal_lines.account_id** (UF-005, High): Add CHECK constraint or trigger verifying account org matches entry org. Phase 2 prerequisite for safe multi-org ledger operations.

6. **Conversation shape validation** (UF-007, Medium): Explicit schema validation on `agent_sessions.conversation` load with version strategy for SDK evolution. Phase 2 must handle session rotation across SDK versions.

7. **Canvas data refresh mechanism** (UF-014, Medium): Implement cache invalidation (e.g., `refreshKey` counter) so agent mutations trigger canvas re-fetch. Phase 2 blocker for trust in agent-driven mutations.

**Three items deferred are acceptable at Phase 2 start but should be addressed in Phase 2.2:**

- **Service mutation lint enforcement** (UF-006, Medium): ESLint rule for `adminClient` import restriction. Phase 2 will add more mutation paths; automated enforcement becomes important.
- **MFA wiring** (UF-009, Medium): Import and call `enforceMfa` from `middleware.ts`. Currently dead code; Phase 2 integration scope should include this.
- **Audit-emit alerting** (UF-008, Medium): Dedicated metric counter or incident flag for swallowed emit failures. Phase 2 observability obligation.

The caveats are specific, bounded fixes with existing solution patterns in the codebase — not architectural redesigns. Items 1–3 are estimated at 2–3 days of implementation. The foundation is ready for Phase 2 with these three commits landing first.

---

## Comparison to Prior Audits

Phase 1.1 predicted "Foundation is ready for Phase 1.2 agent integration **with four specific, bounded fixes**" (UF-001 transaction atomicity, UF-006 ledger triggers, UF-008 read-path org check, UF-002 convention enforcement). Phase 1.2 shipped without those fixes. All four remain open.

**What went right:**
- Zero new violations of the Two Laws or `withInvariants` convention despite adding agent paths. Code review discipline held.
- Phase 1.1's `audit_log` append-only trigger pattern was not replicated (blocking prerequisite), but agent paths do not directly UPDATE/DELETE ledger (relying on service-layer discipline).
- UF-004 period-lock gap was documented and carried forward, not accidentally re-created.

**What went wrong:**
- UF-001 (transaction atomicity) severity **amplified**: Phase 1.1 identified as "critical but low-probability." Phase 1.2 agent retry semantics made it "critical and likely" if a failure occurs mid-sequence.
- UF-002 (read-path org checks) severity **elevated** from Medium to High: Phase 1.1 identified as "dormant" (zero call sites). Phase 1.2 agent tool dispatch exposed both `chartOfAccountsService.get()` and `periodService.isOpen()` as reachable, activating the cross-org read leak.
- New categories emerged: UF-007 (conversation shape validation), BOUNDARY-BUG-002 (SDK message shape drift), QUALITY-006 (hand-maintained tool set drift) are Phase 1.2-specific surface expansion.

**Delta summary:**
- Phase 1.1: 21 findings (1 Critical, 5 High)
- Phase 1.2: 24 findings (1 Critical, 6 High)
- 3 new findings are agent-integration-specific
- 1 Phase 1.1 High finding (UF-008 read-path) elevated to High (re-flagged as UF-002)
- 0 prior findings closed

The debt is now **Phase 2 blocking**: OI-3 (Phase 2 M1 mobile approval and M8 cross-turn caching work) explicitly depends on fixing UF-001 (transaction atomicity) first. Phase 1.2 closure notes confirm this dependency.

---

## Audit Metadata

See `audit-metadata.md` for full execution details.

**Summary:** Two-session collapsed audit (Session S24 orientation + scans + synthesis + write). Nine category scanners (Architecture Fit, Backend Design, Frontend Architecture, Data Layer, Security & Compliance, Code Quality, Observability & Reliability, Infrastructure & DevOps, Performance & Scalability) produced 54 raw findings. Phase 3 synthesis merged to 24 unified findings after deduplication and cross-reference analysis. 18 hypotheses investigated: 10 confirmed, 4 inconclusive, 2 refuted, 2 confirmed-as-known.

**Key limitation:** Self-audit by same Claude family that built Phase 1.2. Bias risk is acknowledged; familiarity with design decisions may have softened assessment of gaps explicitly designed as Phase 1 simplifications (UF-001, UF-003). Phase 2 brief author should treat these as blocking prerequisites regardless of prior rationale.
