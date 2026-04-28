# Post-audit fix-stack arc — closing Phase 1.2 audit obligations before Phase 2 surface expansion

## Title and intent

This arc closes the Phase 1.2 audit's Day-1 and medium-term-priority obligations across three sessions before Phase 2 surface expansion begins. The Phase 1.2 audit (`docs/07_governance/audits/phase-1.2/audit-report.md`, S24 commit `0952fdd`) returned a **YES-WITH-CAVEATS** Foundation Readiness verdict; the caveats are the seven Quick Wins (six implemented, one deferred) and one Medium-Term refactor (MT-01) collected here. Closing them is the precondition for Phase 2's expanded mutation surface (mobile approvals, intercompany, recurring entries) — Phase 2 multiplies the mutation paths that compound on UF-001 (ledger immutability), UF-002 (read-path org checks), and UF-003 (transaction atomicity).

## Sessions named

### S25 — Non-ledger Day-1 fixes
**File:** `docs/09_briefs/phase-1.2/session-25-brief.md`
**Estimated duration:** ~4 hours.
**Summary:** Closes QW-01 (UF-009 MFA-middleware wiring), QW-02 (UF-002 read-path org checks on `chartOfAccountsService.get()` + `periodService.isOpen()` + `ServiceError` wrapping), QW-07 (UF-010 audit_log PII redaction at write time). Single bundled commit; three additive fixes that share zero files. Deferral of QW-06 (UF-007 conversation Zod validation) to Phase 2 obligations is captured in this session's pre-decisions.

### S26 — Ledger-integrity Day-1 fixes
**File:** `docs/09_briefs/phase-1.2/session-26-brief.md`
**Estimated duration:** ~4 hours.
**Summary:** Closes QW-04 (UF-001 immutability triggers on `journal_entries` + `journal_lines` mirroring the audit-log pattern), QW-03 (UF-004 period-lock date-range validation, service + DB layers), QW-05 (UF-005 cross-org account-id BEFORE INSERT trigger on `journal_lines`). Sequenced QW-04 → QW-03 → QW-05 within the session per operator pre-decision: DB-level immutability ships first as defense-in-depth in case the period-validation guard has a logic bug. Single migration file `20240133000000_journal_immutability_triggers.sql`. Y2 commit shape: single bundled commit unless any item exceeds ~50 lines of diff (operator's call at execution).

### S27 — Transaction atomicity RPC (MT-01)
**File:** `docs/09_briefs/phase-1.2/session-27-brief.md`
**Estimated duration:** full day (~6–8 hours including paid-API regression).
**Summary:** Implements `write_journal_entry_atomic()` plpgsql function wrapping the four PostgREST writes in `journalEntryService.post()` (entry header + lines + audit_log + optional ai_actions) into a single Postgres transaction. Closes UF-003 (transaction atomicity gap, Phase 1.1 UF-001 carry-forward) and contributes the atomicity facet to UF-001's full closure. Y2 two-commit shape: Commit 1 = RPC + service refactor + integration tests; Commit 2 = paid-API regression evidence + friction-journal entry. Paid-API regression at session closeout re-fires shape 12 caching-baseline dry-run (~$0.04–$0.06 expected cost; $0.20 cumulative / $0.10 per-call ceiling) to confirm orchestrator → service path unchanged from a model-cognitive standpoint and S22's caching invariant intact.

## Dependency graph

```
S25 (non-ledger Day-1) ── independent ── can run any time after S24 (audit closeout, anchor 0952fdd)
                                          │
S26 (ledger-integrity Day-1) ── independent of S25 (different surfaces; different files)
   ├── could run in parallel with S25 in principle (different test fixtures and migration vs.
   │    middleware + service-layer files)
   └── recommended sequential after S25 for context cleanliness and reduced blast radius
                                          │
S27 (MT-01 atomicity RPC) ── BLOCKS on S26 closure
   ├── Reason: S27's RPC must respect S26's immutability triggers; running S27 against
   │    pre-trigger schema would not validate the defense-in-depth interaction
   ├── Reason: S27's rollback test exercises S26 QW-05 cross-org trigger as one of its
   │    five failure modes; that trigger must be live for the test to be meaningful
   └── Cannot parallelize with S26 even if otherwise independent
```

## Ship order recommendation

**S25 → S26 → S27.** Linear sequence; ~2 days total elapsed (S25 ~4h, S26 ~4h, S27 ~full day). The recommendation is to run sequentially even though S25 and S26 could be parallel in principle:
- **Context cleanliness.** Each session's pre-flight verification, plan, and founder review benefit from a single unbroken trail of commits at HEAD; parallel branches require merge-coordination overhead that exceeds the time saved.
- **Reduced blast radius.** Sequential commits mean a regression in S25 is caught before S26 ships; a parallel-branch failure would surface only at merge.
- **Friction-journal lineage.** Each session's friction-journal entry references the prior session's outcome, building a coherent arc record. Parallel work fragments the lineage.

Parallelization within a single session is fine where designed (S26's three QW items can be implemented in any order within the session as long as the operator's pre-decision sequencing QW-04 → QW-03 → QW-05 is preserved at commit time per S26's hard constraints).

## Verification gate before Phase 2 surface expansion

The four conditions that must hold before Phase 2 begins. Each is a binary check; surfaced at S27 Task 11 Step 1 (the arc's final confirmation point).

1. **All six implementing QWs shipped (QW-01, QW-02, QW-03, QW-04, QW-05, QW-07).**
   - QW-01 / QW-02 / QW-07 close at S25 commit.
   - QW-04 / QW-03 / QW-05 close at S26 commit.
   - Verification: each QW's "Done when" criterion in `docs/07_governance/audits/phase-1.2/action-plan.md` lines 11–52 satisfied with test evidence per the brief's Exit-criteria matrix.

2. **MT-01 RPC shipped with paid-API regression evidence.**
   - RPC migration at `supabase/migrations/20240134000000_write_journal_entry_atomic_rpc.sql`.
   - Service refactor at `src/services/accounting/journalEntryService.ts`.
   - Rollback test at `tests/integration/journalEntryAtomicRollback.test.ts`.
   - Paid-API regression run-record at `$HOME/chounting-logs/oi3-m1-cached-mt01-${TS}.json`.
   - Friction-journal entry summarizing the regression at S27 Commit 2.
   - Verification: action-plan MT-01 "Done when" criterion (`action-plan.md:62`) satisfied.

3. **Action-plan QW-06 deferred to Phase 2 obligations.**
   - QW-06 (UF-007 conversation Zod validation) is not implemented in this arc.
   - The orchestrating session (the one drafting this arc) edits `docs/07_governance/audits/phase-1.2/action-plan.md` to capture the deferral note and adds a corresponding entry to `docs/09_briefs/phase-2/obligations.md`.
   - Rationale captured in S25's pre-decisions: shape-versioning work for the conversation table is more invasive than a write-time fix and is best paired with the events-table cutover (Phase 2 Simplification 1 correction).
   - Verification: deferral note present in both files; cross-reference checked.

4. **Phase 1.2 audit's Foundation Readiness Assessment blockers resolved.**
   - UF-001 ledger immutability — closed at S26 (DB triggers from QW-04) + S27 (atomicity facet from MT-01).
   - UF-002 read-path authorization gaps — closed at S25 (QW-02 read-path facet); the broader CI-guard surface (UF-006 / LT-01) remains Phase 2.
   - UF-003 transaction atomicity gap — closed at S27 (MT-01 RPC).
   - Verification: each of the three blockers has a closing commit and a friction-journal entry tying the closure to the audit finding.

When all four conditions are met, Phase 2 surface expansion is unblocked. The verification gate is the closeout of S27 Task 11 Step 1.

## What stays open

The following audit findings are NOT closed by this arc. They remain as Phase 2 sprint backlog:

| Audit ID | Surface | Phase 2 placement |
|---|---|---|
| **UF-006 / LT-01** | Service-mutation CI guard — ESLint `no-restricted-imports` rule preventing `adminClient` import outside `src/services/`; CI check for `withInvariants()` wrapping on all mutating exports. Phase alignment: Phase 1.3 (deployment readiness). | Pre-Phase-2 if scoped; otherwise Phase 2 sprint 1. |
| **UF-007 / QW-06** | Conversation shape Zod validation on load — replace `as unknown[]` cast in `loadOrCreateSession.ts:194` with explicit Zod validation. Deferred per S25 pre-decision; rationale: best paired with events-table cutover (Simplification 1 correction). | Phase 2 obligations (logged at orchestrating session). |
| **UF-008 / MT-05** | Audit-emit failure alerting — counter metric / alerting on swallowed try/catch errors at `orchestrator/index.ts:187–205, 1272–1295` and `loadOrCreateSession.ts:152–179`. Observability-only; does not block mutations. | Phase 2 sprint 1. |
| **UF-010 / MT-06** | Pino redaction config expansion — extend `REDACT_CONFIG.paths` in `src/shared/logger/pino.ts` to include `email`, `phone`, name fields alongside existing financial PII paths. Distinct from S25's QW-07 (audit_log write-time surface); MT-06 is the pino log-emit surface. | Phase 2 follow-on. |
| **UF-011 / MT-04** | Conversation rotation + saturation observability — turn-count threshold for session rotation; metrics on session rotation frequency. Address `AGENT_STRUCTURED_RESPONSE_INVALID` failure mode at 32+ turns documented in known-concerns.md §12. | Phase 2 sprint 1. |
| **UF-013, UF-014 / LT-02** | Test coverage gaps — API route integration tests for agent confirm/reject paths; conversation saturation curve characterization; cross-org report contamination test; audit-log PII presence assertions; period-lock date-range enforcement test. | Phase 1.2 sprint 2 or Phase 2 sprint 1. |
| **UF-014 / MT-02** | Canvas data refresh mechanism — `refreshKey` counter in `SplitScreenLayout` state, increment after mutations, dependency in canvas data fetch hooks. | Phase 2. |
| **UF-015** | Unbounded text fields (description, reference, notes) — column-level length caps. Severity unscoped at audit time. | Scope-tbd; Phase 2 evaluation. |
| **MT-03** | Read-path enforcement wrapper — `withReadAuth` or extended `withInvariants` for read operations. Depends on QW-02 (closed in S25). | Phase 2 sprint 1. |
| **QUALITY-006 / LT-04** | Hand-maintained tool set consistency check — lint or test verifying `ORG_SCOPED_TOOLS` Set in `orchestrator/index.ts:1098–1104` matches the tool registry. | Phase 2 sprint 1 (when new tools added). |

The "Do Not Do" list from `action-plan.md` lines 130–150 (DND-01..DND-05) remains in force: no CORS/CSRF/rate-limiting (Phase 1.3 deployment), no conversation-table rebuild for shape versioning, no full PII compliance suite, no pagination, no orchestrator decomposition.

## Cross-references

- `docs/07_governance/audits/phase-1.2/action-plan.md` — authoritative QW-NN / MT-NN / LT-NN entries; verbatim "Done when" criteria.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-001..UF-015 evidence and severity rationale.
- `docs/07_governance/audits/phase-1.2/audit-report.md` — Foundation Readiness Assessment and YES-WITH-CAVEATS verdict synthesis.
- `docs/09_briefs/phase-1.2/session-25-brief.md` — S25 brief (non-ledger Day-1).
- `docs/09_briefs/phase-1.2/session-26-brief.md` — S26 brief (ledger-integrity Day-1).
- `docs/09_briefs/phase-1.2/session-27-brief.md` — S27 brief (MT-01 atomicity RPC).
- `docs/09_briefs/phase-2/obligations.md` — destination for QW-06 deferral and the open-Phase-2-backlog table above.
- `docs/02_specs/ledger_truth_model.md` — INV-LEDGER-001 (Layer 3 → Layer 1a after S26) and INV-AUDIT-001 (mechanically enforced after S27).
- `docs/07_governance/adr/0008-layer-1-enforcement-modes.md` — Layer-1a classification rationale (S26 closes the convention-to-mechanical migration for INV-LEDGER-001).
- `docs/03_architecture/phase_simplifications.md` — Simplification 1 (synchronous audit log) corrected at S27.
- `supabase/migrations/20240122000000_audit_log_append_only.sql` — pattern reference for S26's immutability triggers.
- `docs/09_briefs/phase-2/session-22-brief.md` (commit `cceb725`) — caching-baseline reference for S27's paid-API regression.
- `docs/09_briefs/phase-1.2/session-20-brief.md` — paid-API harness reference (`scripts/oi3-m1-validation.ts`) reused in S27.

## Arc anchor and chain

- **Anchor:** `0952fdd` — S24 Phase 1.2 audit closeout (24 unified findings, YES-WITH-CAVEATS readiness).
- **S25 anchor:** `0952fdd` (S24 closeout); S25 itself produces commits at `<S25 SHA>`.
- **S26 anchor:** `<S25 SHA>`; S26 itself produces commits at `<S26 SHA>` (one or three commits per Y2 split).
- **S27 anchor:** `<S26 SHA>`; S27 produces Commit 1 at `<S27 C1 SHA>` and Commit 2 at `<S27 C2 SHA>`.
- **Arc closeout:** `<S27 C2 SHA>` is the SHA at which the four verification-gate conditions hold simultaneously. Phase 2 surface expansion sessions anchor against `<S27 C2 SHA>` or later.
