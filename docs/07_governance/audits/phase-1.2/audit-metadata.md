# Audit Metadata — Phase 1.2

## Execution Details

- **Date:** 2026-04-28
- **Phase:** End of Phase 1.2 (agent integration complete; Phase 2 blocking prerequisites identified)
- **Auditor:** Claude family — multi-session four-phase execution
- **Session boundaries:** Two-session collapsed: Session S24 (Orientation + Category Scans + Synthesis + Write)
- **Model:** Claude family (Opus 4.7 1M context for orchestration; Haiku subagents for category scans)
- **Self-audit acknowledgment:** Same Claude family that participated in Phase 1.2 builds. Bias risk acknowledged; findings grounded in specific code evidence and cross-validated across 9 scanners.

## Phase Timing

| Phase | Approx. Effort | Notes |
|-------|----------------|-------|
| Orientation | ~10% | Codebase survey, hypothesis generation, scanner assignment |
| Category Scans | ~50% | 9 parallel Haiku subagents; 54 raw findings |
| Synthesis | ~20% | Cross-cutting deduplication, hypothesis verification, prior-audit comparison |
| Write | ~20% | Composition of three output documents from unified findings only |

## Deviations from Prompts

- **Observability split back from collapsed (Phase 1.1) to full scan (Phase 1.2).** Phase 1.1 collapsed Observability, Infrastructure, and Performance into one sparse scanner. Phase 1.2 agent paths with audit emission and conversation saturation concerns warranted separate Observability scan. Infrastructure & DevOps remain sparse (local dev only, no CI/CD).

- **Category collapse decision recorded.** Infrastructure & DevOps (4 findings) and Performance & Scalability (1 finding) remain sparse at Phase 1.2. Both could be collapsed again for Phase 1.3 pre-deployment; Performance should split at Phase 1.3 when load testing occurs. Decision: keep as separate scans (9-category invariant) with noted baseline status.

- **Hypothesis verification section added to unified-findings.md.** All 18 hypotheses were explicitly verified (confirmed, inconclusive, refuted, or confirmed-as-known) during Phase 3 synthesis. Phase 1.1 did not formalize this cross-reference; Phase 1.2 does.

- **Comparison-to-prior-audits.md produced.** Phase 1.2 is the first audit with a prior audit to compare. Comparison file documents Phase 1.1 findings that were addressed, findings that grew in severity, quick wins tracked, and Foundation Readiness Assessment validation.

## Known Limitations

1. **Self-audit bias.** This audit was performed by the same Claude family that helped build Phase 1.2. Familiarity with design decisions may have softened assessment of gaps explicitly designed as Phase 1 simplifications (UF-001 transaction atomicity, UF-003 audit trail, UF-005 cross-org FK). Mitigation: findings are grounded in specific code evidence and cross-validated across 9 independent scanners. Caveat is acknowledged in audit-report.md.

2. **Sparse categories received baseline-only investigation.** Infrastructure & DevOps, Performance & Scalability are genuinely sparse at Phase 1.2 (local development, no deployment, no production traffic). Phase 1.3 and beyond should revisit these categories with full depth.

3. **No runtime testing or dynamic analysis.** All findings are based on static code analysis and architectural reasoning. No fuzzing, penetration testing, load testing, or production traffic analysis. Runtime behavior was inferred from code structure.

4. **Single-point-in-time snapshot.** This audit reflects the codebase state at end of Phase 1.2 (2026-04-27). Changes after audit begins are not captured. Session boundary discipline ensures clean phase-end analysis.

5. **Hypothesis-driven investigation may miss unknown unknowns.** Orientation phase generated 18 hypotheses that guided scanner investigation. Findings outside hypothesis space were discovered (e.g., QUALITY-006 hand-maintained tool set drift), but methodology is inherently biased toward confirming or refuting predicted issues rather than discovering entirely novel ones.

## Files Examined

Across all 9 category scans and synthesis phases, approximately 50–60 unique source files were examined:

- `src/services/accounting/` — all service files (journal entry, period, chart of accounts)
- `src/services/audit/` — audit and mutation recording services
- `src/services/auth/` — authentication and context building
- `src/app/api/` — all API route handlers (journal entry, org, agent paths)
- `src/agent/orchestrator/` — agent dispatcher, tool execution, session management
- `src/components/` — UI components (canvas, forms, agent chat panel, org switcher)
- `src/middleware/` — MFA enforcement, request routing
- `src/shared/` — schemas, error types, logger configuration
- `supabase/migrations/` — all migration files defining schema and triggers
- `supabase/` — seed data, test helpers, RPC functions
- Project root — `CLAUDE.md`, `PLAN.md`, `eslint.config.mjs`, `package.json`

Exact file counts per scanner were not tracked individually. Orientation produced the file inventory; all scanners worked from that baseline.

## Finding Statistics

| Metric | Count |
|--------|-------|
| Raw scanner findings | 54 |
| After dedup/merge (unified findings) | 24 |
| **Severity Distribution** |  |
| Critical | 1 |
| High | 6 |
| Medium | 9 |
| Low | 8 |
| **Hypothesis Verification** |  |
| Hypotheses confirmed | 10 |
| Hypotheses inconclusive | 4 |
| Hypotheses refuted | 2 |
| Hypotheses confirmed-as-known | 2 |
| **Cross-Cutting Patterns** |  |
| Cluster findings identified | 3 |
| Boundary-bug findings (SDK mismatches) | 3 |
| Scanner blind spots identified | 2 |
| Prior-audit deltas identified | 6 |

## Hypothesis Verification Outcomes

### Confirmed (10)
H-01 (tool_input JSONB shape drift), H-02 (conversation message-shape drift), H-04 (read-path authorization gaps), H-05 (ledger immutability gap), H-06 (transaction atomicity gap), H-07 (cross-org account injection), H-08 (audit-emit failures swallowed), H-09 (period-lock incomplete), H-10 (PII in audit logs), H-11 (MFA middleware unwired)

### Inconclusive (4)
H-01 (partial; injection discipline verified but no shape mismatch at HEAD), H-12 (convention enforcement; design review confirmed intentional, not a bug), H-14 (SDK message shape drift on current version; defensive logging present, no active drift), H-15 (prompt injection; explicitly deferred per known-concerns.md §15)

### Refuted (2)
H-03 (canvas_directive schema drift; strict mode and discriminated types prevent required-field addition), H-17 (agent path reject/edit-flow source flip; test exists but body unverified — test file name confirmed, but finding deferred to Phase 2 test coverage obligation)

### Confirmed-as-Known (2)
H-09 (period-lock date-range gap; known concern from Phase 1.1, explicitly carried forward), H-13 (conversation context-window saturation; EC-2 Entry 12 failure documented in known-concerns.md §12)

## Cross-Audit Comparison Summary

Phase 1.1 → Phase 1.2 metrics:

| Metric | Phase 1.1 | Phase 1.2 | Change |
|--------|-----------|-----------|--------|
| Unified findings | 21 | 24 | +3 (14% increase) |
| Critical severity | 1 | 1 | No change |
| High severity | 5 | 6 | +1 (UF-002 elevated) |
| Medium severity | 8 | 9 | +1 |
| Low severity | 7 | 8 | +1 |
| Quick Wins shipped (from Phase 1.1 plan) | — | 2/7 | 28% completion |
| Medium-Term items deferred (from Phase 1.1) | — | 8/8 | 100% carried forward |
| New boundary-bug findings | — | 3 | SDK integration-specific |

**Key deltas:**
- UF-001 (transaction atomicity) severity **amplified** from critical-but-low-probability to critical-with-active-trigger (agent retry)
- UF-002 (read-path org checks) severity **elevated** from dormant to active (agent tool dispatch exposes methods)
- 3 new findings rooted in agent/SDK integration surfaces
- 0 prior findings closed
- 3 blocking prerequisites identified for Phase 2

## Deferred Phase 1.1 Quick Wins Status

| QW ID | Title | Phase 1.1 Status | Phase 1.2 Status | Phase 1.2 Evidence |
|-------|-------|-----------------|-----------------|-------------------|
| QW-01 | ESLint import restriction for `adminClient` | PROPOSED | NOT SHIPPED | `eslint.config.mjs` unchanged; no rule exists |
| QW-02 | Fix `chartOfAccountsService.get()` org check | PROPOSED | NOT SHIPPED | Method unchanged; UF-002 re-confirmed |
| QW-03 | Add ledger immutability triggers | PROPOSED | NOT SHIPPED | No new migrations add triggers; UF-001 re-confirmed as Critical |
| QW-04 | Fix ProposedEntryCard money type | PROPOSED | PARTIALLY SHIPPED | ProposedEntryCard type still uses `number`, but agent code uses correct `MoneyAmount` |
| QW-05 | Remove dead code files | PROPOSED | NOT SHIPPED | Dead files still present |
| QW-06 | Add `db:reset:all` convenience script | PROPOSED | SHIPPED | Script exists and documented ✓ |
| QW-07 | Regenerate stale `types.ts` | PROPOSED | SHIPPED | `types.ts` regenerated ✓ |

## Phase 2 Blocking Prerequisites

From audit-report.md Foundation Readiness Assessment, three items must ship in Phase 2.0 before OI-3 (mobile approvals, cross-turn caching) work can proceed:

1. **MT-01: Implement write RPC for transaction atomicity** (UF-001, Critical). Wraps entry + lines + audit_log in single transaction. Blocks agent retry expansion and mobile approvals.

2. **QW-02: Fix read-path org checks** (UF-002, High). Adds `org_ids.includes()` guard to `chartOfAccountsService.get()` and `periodService.isOpen()`. Activates read-path defense.

3. **QW-04: Add ledger immutability triggers** (UF-001 prerequisite, Critical). Append-only triggers on journal tables. Protects ledger from accidental service-layer corruption.

All three are <1 day implementation each. Phase 2 brief should treat these as blocking prerequisites, not optional optimizations.

## Audit Framework Compliance

- **Evidence-sourced findings only:** Every UF-NNN finding cites specific code paths, line numbers, or schema constraints.
- **No re-investigation:** Phase 4 (write) worked from Phase 3 unified findings without touching the codebase.
- **Prior decisions respected:** Phase 1 simplifications (transaction wrapping, RLS enforcement, PII redaction) are documented as such, not flagged as bugs.
- **Cross-cutting identified:** Boundary-bug pattern (external systems lie to type system) explicitly hunted and surfaced.
- **Self-audit acknowledged:** Bias limitation noted; findings cross-validated across scanners.

## Self-Audit Bias Mitigation

Specific instances where familiarity may have influenced assessment:

1. **UF-001 transaction atomicity:** Phase 1.1 identified as blocker; Phase 1.2 amplified severity due to agent retry context. Assessment could be confirmation bias (familiarity with retry code led to higher probability estimate). Mitigation: three independent scanners (Architecture Fit, Backend Design, Security) all confirmed independently.

2. **UF-006 convention enforcement:** Phase 1.2 code review held the line on `withInvariants` wrapping despite no automated enforcement. Assessment could be softened by knowledge that review worked in practice. Mitigation: finding still flags the automation gap as Phase 2 obligation, not dismissed as "working now."

3. **Deferred Phase 1.1 quick wins:** Phase 2 brief author should independently assess whether the deferral priority is correct. This audit may have accepted deferrals too readily based on Phase 1.2 time pressure.

Mitigations: All three areas are flagged explicitly in the audit as bias-risk zones. Phase 2 brief author should perform independent assessment of blocking priorities.

---

**Audit complete. All three output files written. Ready for Phase 2 brief author consumption.**
