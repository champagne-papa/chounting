# Where I am as of 2026-04-13 (Task 16 complete)

Phase 16A (inline, 8 commits):
- 3 cleanup commits: uncommitted floor tests, locale rename,
  multi-tenant routing infrastructure (discovered at session start)
- Migration 0007: get_profit_and_loss and get_trial_balance RPC
  functions (LANGUAGE sql, SECURITY INVOKER, amount_cad for both)
- reportService.ts with profitAndLoss() and trialBalance() functions
  calling RPC via adminClient().rpc()
- 4 P&L integration tests (baseline-delta pattern, hand-calculated)
- 4 Trial Balance integration tests (same pattern)
- API routes: GET /api/orgs/[orgId]/reports/pl and /trial-balance
- Directive type: report_pl updated from { from, to } to { periodId? }
- Friction journal: 5 entries (git hygiene, Q21 gap, TB spec override,
  RPC conventions, baseline-delta test pattern)

Architectural decisions made in Task 16:
- Q21 (a): reversals net naturally, no WHERE NOT EXISTS exclusion
- Trial Balance uses amount_cad (override of spec's native-currency SQL)
- Decision 4.1: period-based filtering, not date-range
- RPC conventions established (first callable RPC in codebase)

Next task: Task 17 (P&L and Trial Balance Views).
Subagent-driven. Creates BasicPLView.tsx and BasicTrialBalanceView.tsx,
wires into ContextualCanvas and MainframeRail.

Task 17 scope (from closeout plan):
- BasicPLView: period filter, Revenue/Expense/Net Income sections,
  Balance Sheet summary (Asset/Liability/Equity from same query)
- BasicTrialBalanceView: flat table, account_code ordering, footer
  row with debit/credit sums, red if unbalanced
- ContextualCanvas: report_pl and report_trial_balance cases
- MainframeRail: Trial Balance icon/action (P&L already has one)
- Hand-verification: psql "delete the UI" test
- Per spec §15.8 and §16.5

Task 18 returns to inline for final verification.

Phase 1.2 type-narrowing deferred:
- JournalEntryDetail.journal_lines[] → use MoneyAmount/FxRate
- Dropdown placeholder fix deferred

Seed passwords (all end in #1):
- executive@thebridge.local / DevSeed!Executive#1
- controller@thebridge.local / DevSeed!Controller#1
- ap@thebridge.local / DevSeed!ApSpec#1

Dev server rule: kill before rm -rf .next, or restart after.

Test counts: 26 integration (7 files), 49 unit (4 files).
Migration count: 7 (001-007).
