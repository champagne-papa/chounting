# Where I am as of 2026-04-17 (Task 15 complete)

Phase 15A (inline, 7 commits): mirrorLines helper + tests,
reversed_by in list + detail types/services, list visual indicator,
detail button disabling, .maybeSingle crash fix, fiscal_period embed.

Phase 15B (subagent, 1 commit + 4 runtime fix commits):
- ReversalForm.tsx: fetches source entry, mirrors lines via helper,
  collects period/date/reason, posts through reversal discriminated
  union, navigates to new reversal's detail on success.
- ContextualCanvas: reversal_form case moved to dedicated render.
- Runtime verified: Entry #9 → Reverse → Entry #16 round-trip works.

Phase 15B.1-15B.4 (inline runtime fix): Supabase driver returns
NUMERIC columns as JS numbers, not strings. Added toMoneyAmount /
toFxRate coercion helpers, applied at journalEntryService.get
(for detail lines) and .list (for line aggregation). Runtime shape
of money values now matches branded type declaration.

Next task: Task 16 (Reports — P&L and Trial Balance).
Subagent-driven (with likely Phase 16A inline for report service
functions and Phase 16B subagent for UI views).

Task 16 scope sketch:
- Create reportService with P&L and Trial Balance query functions
- P&L: aggregate by account type (revenue, expense) within period
- Trial Balance: aggregate by account, show debit/credit balances
- API routes at /api/orgs/[orgId]/reports/pl and /trial-balance
- UI components: BasicPLView.tsx and BasicTrialBalanceView.tsx
- Per spec §15.8 and §16.5

Phase 1.2 type-narrowing deferred:
- JournalEntryDetail.journal_lines[] → use MoneyAmount/FxRate
- MoneyAmount regex UX fix already applied
- Dropdown placeholder fix deferred

Seed passwords (all end in #1):
- executive@thebridge.local / DevSeed!Executive#1
- controller@thebridge.local / DevSeed!Controller#1
- ap@thebridge.local / DevSeed!ApSpec#1

Dev server rule: kill before rm -rf .next, or restart after.

Tasks 17 remains subagent-driven after 16.
Task 18 returns to inline for final verification.
