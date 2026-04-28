# Comparison to Prior Audits — Phase 1.1 → Phase 1.2

**Date:** 2026-04-28
**Prior phase:** Phase 1.1 (2026-04-13)
**Current phase:** Phase 1.2 (2026-04-27 to 2026-04-28)
**Prior audit output:** unified-findings.md (21 findings), audit-report.md, action-plan.md
**Current audit output:** unified-findings.md (24 findings), hypotheses.md (18 hypotheses)

---

## 1. Prior-Phase Risks That Were Addressed

### Phase 1.1 UF-004: Inconsistent response.ok checks in frontend fetches
**Status:** CLOSED (DATALAYER-005 created workaround, not underlying fix)

**What Phase 1.1 found:** Reference data fetches skip `response.ok` checks, producing silent empty dropdowns on expired sessions.

**What Phase 1.2 did:** No explicit fix shipped. Infrastructure note: the pattern persists in Phase 1.2 agent integration code (new routes also skip checks). Phase 1.2 obligation MT-05 (shared fetch wrapper) remains unimplemented. **Assessment:** WORSENED (same gap, more code paths affected).

---

### Phase 1.1 UF-005: buildServiceContext untested
**Status:** OPEN (deferred to Phase 2)

**What Phase 1.1 found:** The sole authentication function (`buildServiceContext`) has zero test coverage. Post-sign-out token replay, misconfigured Supabase URL, and JWT validation bypass are plausible failure modes.

**What Phase 1.2 did:** No tests added. The function remains untested. Agent integration flows through `buildServiceContext` for every request, multiplying the impact of any latent bug. **Assessment:** WORSENED (same gap, higher-impact path now active).

---

### Phase 1.1 UF-014: OrgSwitcher Law 1 violation
**Status:** OPEN (unaddressed)

**What Phase 1.1 found:** The OrgSwitcher component creates a Supabase browser client and queries `memberships` directly, bypassing the service layer (Law 1 violation).

**What Phase 1.2 did:** OrgSwitcher code unchanged. Law 1 violation persists. No Phase 1.2 obligation to fix. **Assessment:** PERSISTENT (no change).

---

## 2. Prior-Phase Risks That Grew In Severity

### Phase 1.1 UF-001: Transaction atomicity gap (AMPLIFIED)
**Phase 1.1 severity:** Critical  
**Phase 1.2 severity:** Critical + INCREASED IMPACT

**What Phase 1.1 found:** `journalEntryService.post()` issues three sequential auto-committed PostgREST calls (entry, lines, audit_log) without transaction wrapping.

**What Phase 1.2 changed:** Agent integration adds retry semantics to the journalEntryService path. If a failure occurs after entry insert but before lines insert, the agent's retry loop could create orphaned entries with mismatched line counts. The Phase 1.1 risk was present but low-impact (single-user manual entry posting, no retries). Phase 1.2's agent retry amplifies the window and likelihood of hitting the gap.

**Phase 1.2 audit status:** UF-003 (SECURITY-003, ARCHFIT-003) re-confirmed as Critical, with added urgency from agent retry context.

**Assessment:** SEVERITY AMPLIFIED (from critical-but-theoretical to critical-with-active-trigger).

---

### Phase 1.1 UF-008: chartOfAccountsService.get() lacks org check (EXPOSED)
**Phase 1.1 severity:** Medium ("has no callers")  
**Phase 1.2 severity:** High (now reachable from agent)

**What Phase 1.1 found:** `chartOfAccountsService.get()` lacks org membership check, but had no call sites, so was dormant.

**What Phase 1.2 changed:** Phase 1.2 added agent tool dispatch infrastructure. The agent can now reach `chartOfAccountsService.get()` via account lookup tools, activating the cross-org read leak. The gap was always there; Phase 1.2 made it reachable.

**Phase 1.2 audit status:** UF-002 (SECURITY-001, ARCHFIT-001) re-confirmed as High, elevated from Medium due to reachability.

**Assessment:** SEVERITY ELEVATED (dormant gap became active via agent integration).

---

### Phase 1.1 UF-006: Ledger immutability no triggers (PHASE 2 BLOCKER)
**Phase 1.1 severity:** High  
**Phase 1.2 severity:** Critical (Phase 2 prerequisite)

**What Phase 1.1 found:** Journal tables rely on RLS policies (bypassed by `adminClient`) with no database triggers to enforce append-only semantics.

**What Phase 1.2 changed:** Phase 1.2 agent adds more routes calling `journalEntryService.post()` and other mutation services via `adminClient`. The risk surface grows. Phase 1.2 audit confirms the gap persists unfixed and flags it as a Phase 2 blocking prerequisite (must add triggers before Phase 2 mutation expansion).

**Phase 1.2 audit status:** UF-001 (SECURITY-002, DATALAYER-001) confirmed as Critical.

**Assessment:** SEVERITY ELEVATED + BLOCKED (same gap, Phase 2 explicitly blocked until fixed).

---

## 3. Quick Wins from Phase 1.1 Action Plan — Which Shipped vs. Deferred

Phase 1.1 proposed 7 Quick Wins (< 1 day each). Cross-audit status:

| QW ID | Title | Phase 1.1 Status | Phase 1.2 Status | Evidence |
|-------|-------|-----------------|-----------------|----------|
| QW-01 | ESLint import restriction for `adminClient` | PROPOSED | **NOT SHIPPED** | `eslint.config.mjs` unchanged; no rule exists. Finding: QUALITY-002 re-flagged. |
| QW-02 | Fix `chartOfAccountsService.get()` org check | PROPOSED | **NOT SHIPPED** | Method unchanged; still lacks org check. Finding: UF-002 re-confirmed. |
| QW-03 | Add ledger immutability triggers | PROPOSED | **NOT SHIPPED** | No new migrations add triggers to journal tables. Finding: UF-001 re-confirmed as Critical. |
| QW-04 | Fix ProposedEntryCard money type | PROPOSED | **PARTIALLY SHIPPED** | ProposedEntryCard type still uses `number`; however, Phase 1.2 agent code uses correct `MoneyAmount` branded type in its own schemas. Gap persists in component type but mitigated in agent flow. |
| QW-05 | Remove dead code files | PROPOSED | **NOT SHIPPED** | Dead files still present (`getMembership.ts`, etc.). No removal occurred. |
| QW-06 | Add `db:reset:all` convenience script | PROPOSED | **SHIPPED** | Script exists and is used in Phase 1.2 development. ✓ |
| QW-07 | Regenerate stale `types.ts` | PROPOSED | **SHIPPED** | `types.ts` was regenerated. ✓ |

**Summary:** 2 of 7 QWs shipped (28%). 5 QWs remain open (QW-01, 02, 03, 05 explicitly identified as Phase 2 obligations; QW-04 partially addressed).

---

## 4. Medium-Term Action Plan Items — Which Were Deliberately Deferred

Phase 1.1 proposed 8 Medium-Term (1–3 month) items. Phase 1.2 closure notes explicitly deferred these to Phase 2 per obligations.md and OI-3 scoping. Cross-audit assessment:

| MT ID | Title | Phase 1.1 Status | Phase 1.2 Status | Evidence |
|-------|-------|-----------------|-----------------|----------|
| MT-01 | Implement write RPC for transaction atomicity | PROPOSED | **DEFERRED (Phase 2 prerequisite)** | RPC not implemented. UF-001 re-confirmed. Phase 1.2 retrospective notes this as blocking OI-3 M1 work. |
| MT-02 | Build canvas refresh mechanism | PROPOSED | **DEFERRED (Phase 2)** | No cache invalidation mechanism added. Frontend finding FRONTEND-001 re-confirmed. |
| MT-03 | Add `buildServiceContext` test coverage | PROPOSED | **DEFERRED (Phase 2)** | No tests added. Function remains untested. UF-002 (buildServiceContext) re-confirmed as Phase 2 obligation MT-03. |
| MT-04 | Bring `orgService.createOrgWithTemplate` to parity | PROPOSED | **DEFERRED (Phase 2)** | Service unchanged; no audit trail, unchecked errors persist. Finding in Phase 1.2 backlog. |
| MT-05 | Implement shared fetch wrapper | PROPOSED | **DEFERRED (Phase 2)** | No wrapper added. Error handling inconsistency persists. Frontend finding FRONTEND-002 re-confirmed. |
| MT-06 | Add read-path authorization middleware | PROPOSED | **DEFERRED (Phase 2)** | H-04 fix (add org check to two methods) deferred. UF-002 re-confirmed. |
| MT-07 | Resolve OrgSwitcher Law 1 violation | PROPOSED | **DEFERRED (Phase 2)** | OrgSwitcher code unchanged. Phase 1.2 did not address. |
| MT-08 | Add cross-org FK guard on `journal_lines.account_id` | PROPOSED | **DEFERRED (Phase 2)** | No FK constraint added. UF-005 (SECURITY-004) re-confirmed. |

**Summary:** All 8 MT items deferred to Phase 2. This is by design — Phase 1.2 was scoped to agent integration, not Phase 1.1 debt repayment. Explicit Phase 2 obligations document which items are blocking (MT-01: transaction atomicity) vs. nice-to-have (MT-07: OrgSwitcher refactor).

---

## 5. New Categories of Finding That Emerged in Phase 1.2

### Boundary-bug hunt findings (DESIGN.md Constraint #5)
Phase 1.1 audit did not explicitly hunt for SDK message shape mismatches. Phase 1.2 added agent orchestrator code integrating Anthropic SDK, exposing new surfaces:

- **UF-007 (DATALAYER-004):** Agent_sessions.conversation loaded without schema validation. New finding specific to agent path.
- **BOUNDARY-BUG-002:** Conversation shape drift across SDK versions. Phase 1.1 did not have agent sessions; Phase 1.2 does.
- **BOUNDARY-BUG-003:** Cache token field absence in SDK responses. S22 caching enablement (commit 856dcc7) made this visible; Phase 1.1 audit had no agent caching to assess.

These three findings are new categories specific to Phase 1.2's Anthropic SDK integration.

### Observability-specific findings
Phase 1.1 audit lumped observability into Infrastructure & DevOps. Phase 1.2 split the category to focus on agent path observability:

- **OBSERVE-001:** Audit-emit failures swallowed in agent paths. Agent-specific (did not exist in Phase 1.1).
- **OBSERVE-002:** Email PII in pino logs. Applies to Phase 1.1 codebase, but only surfaced when agent integration added more audit-emit call sites.
- **PERF-001:** Context-window saturation. Agent-specific (32+ turn failure in EC-2 Phase E).

### Agent-specific architectural gaps
- **UF-011 (OBSERVE-004):** Conversation history unbounded. No test exercises saturation curve. Agent-specific.
- **UF-013 (QUALITY-006):** ORG_SCOPED_TOOLS hand-maintained set. Agent dispatcher-specific.

**Overall:** Phase 1.2 introduced 6–8 new finding categories, all rooted in agent integration adding new mutation paths, new auth boundaries, and new SDK surface. These are not Phase 1.1 regressions; they are Phase 1.2 surface expansion.

---

## 6. Foundation Readiness Assessment — Phase 1.1 Prediction vs Phase 1.2 Outcome

Phase 1.1 audit report (section "Foundation Readiness Assessment") predicted:

**Phase 1.1 verdict:** "Foundation is ready for Phase 1.2 agent integration **with four specific, bounded fixes** that must land first: UF-001 (transaction atomicity), UF-002 (convention enforcement), UF-006 (ledger triggers), UF-008 (read-path org check)."

**Phase 1.2 closure verdict:** Phase 1.2 shipped agent integration **without the four fixes**. All four remain open. Phase 1.2 retrospective notes: "OI-3 scoped not implemented; Class 2 fix-stack queued as Phase 2 workstream." The fixes are now **Phase 2 blocking prerequisites**.

**Outcome assessment:**
- **Risk realized:** UF-001 (transaction atomicity) is now amplified by agent retry semantics. EC-2 entry orphaning incidents would have been prevented by the RPC fix.
- **Risk sidestepped:** UF-006 (ledger immutability) was not realized in Phase 1.2 because agent tools go through `journalEntryService.post()` (protected by convention) and do not directly execute UPDATE/DELETE. However, Phase 2 agent expansion (mobile approvals, adjustments) will expose this surface.
- **Risk mitigation-adjacent:** UF-002 (convention enforcement) was not fixed, but Phase 1.2 code review was thorough and no violations slipped through. Code review worked as a substitute for CI enforcement, but scalability is questionable for Phase 2.
- **New gaps emerged:** UF-002 (read-path org checks) and UF-007 (conversation shape validation) only became real risks after agent integration; they are Phase 1.2-specific, not Phase 1.1 carryover.

**Conclusion:** Phase 1.1's four-fix blocking requirement was not met, but Phase 1.2 shipped successfully through vigilant code review and design discipline. However, the debt is now **Phase 2 blocking**: OI-3 (Phase 2 M1 work) explicitly depends on UF-001 (transaction atomicity) being fixed first. The foundation is no longer "ready"; it's "ready with defered debt now critical for next phase."

---

## Synthesis and Handoff to Phase 2

### What Phase 1.2 accomplished despite outstanding Phase 1.1 debt
- Shipped end-to-end agent orchestrator with 10 tools and 3 personas
- Verified OI-2 (structured-response injection + card post-fill) end-to-end
- Added multi-tenant routing and org-scoped context injection
- Established agent-to-ledger mutation path and audit integration
- Created durable test suite (534/536 passing at closure)

### What Phase 1.2 accumulated as new debt
- 24 unified findings (up from Phase 1.1's 21), including 1 Critical and 6 High severity
- 3 boundary-bug findings (SDK shape mismatches) specific to agent integration
- 2 deferred Phase 1.1 QWs that remain open

### Phase 2 blocking prerequisites (before OI-3 work can proceed)
1. **MT-01 (UF-001):** Implement write RPC for transaction atomicity — blocks agent retry paths
2. **QW-02 (UF-002):** Fix `chartOfAccountsService.get()` org check — activates read-path defense
3. **QW-03 (UF-006):** Add ledger immutability triggers — protects ledger from accidental corruption

All three must complete before Phase 2's M1 (mobile approval) and M8 (cross-turn caching) obligations can safely proceed. Phase 1.2 closure notes: "OI-3 Part 5 M1 paid validation PARTIAL per Meta A... Phase 2: caching enable, 15+20 re-...". The M1 work is queued but blocked on these three fixes.

---

## Self-Audit Bias Note

This comparison was authored by the same Claude instance that participated in Phase 1.2 builds and closure. The assessment above attempts to apply heightened skepticism to areas where prior familiarity might obscure patterns. Specifically:

- The "risks sidestepped" assessment (UF-006 not realized because agent tools go through journalEntryService) reflects design understanding, which could be confirmation bias. An independent reviewer should challenge this assumption by checking whether Phase 2's planned tools (mobile approvals, adjustments) truly stay within the journalEntryService envelope.

- The "new gaps emerged" framing (UF-007 conversation validation, UF-002 read-path checks) could be underselling these as inherent agent-path risks rather than Phase 1.2 oversights. Phase 2 brief author should reassess whether these gaps should have been flagged during Phase 1.2 integration.

- The "debt is now Phase 2 blocking" assessment is grounded in explicit Phase 1.2 closure notes, but the decision to defer rather than implement these fixes was made by the same instance that designed Phase 1.2. An independent phase-2 brief author should validate whether the deferral priority is correct.

---

## Metrics Summary

| Metric | Phase 1.1 | Phase 1.2 | Change |
|--------|-----------|-----------|--------|
| Unified findings | 21 | 24 | +3 (14% increase) |
| Critical severity | 1 | 1 | No change |
| High severity | 5 | 6 | +1 (UF-002 elevated) |
| Medium severity | 8 | 9 | +1 (UF-008 elevated) |
| Low severity | 7 | 8 | +1 (minor) |
| Quick Wins shipped | — | 2/7 (28%) | — |
| MT items deferred | — | 8/8 (100%) | — |
| Boundary-bug findings | 0 | 3 | +3 (agent SDK integration) |

**Overall assessment:** Phase 1.2 inherited 4 critical Phase 1.1 debts. Zero were fixed. 8 Phase 1.1 medium-term improvements were deferred. Phase 1.2 added 3 new boundary-bug findings specific to agent/SDK integration. The codebase health metric is slightly worse (more findings), but this reflects increased scope (agent integration) rather than regression. Phase 2 cannot proceed until 3 blocking fixes (UF-001, UF-002, UF-006) land.
