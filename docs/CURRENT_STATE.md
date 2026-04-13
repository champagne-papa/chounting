# Where I am as of 2026-04-13 (Task 17 complete)

Phase 16A (inline, 8 commits):
- 3 cleanup commits: uncommitted floor tests, locale rename,
  multi-tenant routing infrastructure
- Migration 0007: get_profit_and_loss and get_trial_balance RPC
  functions (LANGUAGE sql, SECURITY INVOKER, amount_cad for both)
- reportService.ts with profitAndLoss() and trialBalance()
- 4 P&L + 4 Trial Balance integration tests (baseline-delta pattern)
- API routes: GET /api/orgs/[orgId]/reports/pl and /trial-balance
- Directive type: report_pl updated from { from, to } to { periodId? }

Phase 17B (subagent, 1 commit):
- BasicPLView.tsx: Revenue/Expense sections, net income via full
  formula (rev.credit - rev.debit) - (exp.debit - exp.credit),
  period dropdown with "All Periods" default. No Balance Sheet
  summary (deferred Phase 1.2).
- BasicTrialBalanceView.tsx: per-account table, footer via addMoney,
  red when !eqMoney, zero-balance accounts via LEFT JOIN.
- ContextualCanvas: report_pl and report_trial_balance wired.
- MainframeRail: Trial Balance rail icon added.
- 40-point review: zero drift. Runtime verified via Network tab.

Architectural decisions (Task 16):
- Q21 (a): reversals net naturally
- Trial Balance uses amount_cad (spec override)
- Decision 4.1: period-based filtering
- RPC conventions established

Next task: Task 18 (Final Verification).
Inline. Phase 1.1 is functionally complete. Task 18 verifies:
- Schema reconciliation against running database
- Full test suite (typecheck + 26 integration + 49 unit)
- Friction journal review and Phase 1.2 scope catalog
- "Delete the UI" psql verification test
- Phase 1.1 exit criteria walkthrough per spec §15.9

Phase 1.2 deferred items:
- Balance Sheet summary (semantic mismatch with period-activity)
- Fiscal period default (form defaults to arbitrary month)
- Form UX polish (regex messages, dropdown placeholders)
- JournalEntryDetail type narrowing (MoneyAmount/FxRate)
- Seeding: document smoke test setup sequence
- Agent integration (orchestrator, tools, canvas context)

Test counts: 26 integration (7 files), 49 unit (4 files).
Migration count: 7 (001-007).

Seed passwords (all end in #1):
- executive@thebridge.local / DevSeed!Executive#1
- controller@thebridge.local / DevSeed!Controller#1
- ap@thebridge.local / DevSeed!ApSpec#1

Dev server rule: kill before rm -rf .next, or restart after.
