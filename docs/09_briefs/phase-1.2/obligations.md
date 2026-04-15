# Phase 1.2 Obligations

Synthesized from the Phase 1.1 friction journal (40+ entries),
exit criteria matrix (6 DEFERRED items), test coverage catalog
(8 gaps), and schema reconciliation (1 drift point).

Generated during Task 18 of the Phase 1.1 closeout, 2026-04-13.

---

## Must-do (inherited from Phase 1.1 deferrals)

These are things Phase 1.1 explicitly deferred with "Phase 1.2"
labels. They are obligations, not suggestions.

### Agent integration
- Orchestrator, tool definitions, canvas context injection
- ProposedEntryCard rendering from real agent output
- `reverseJournalEntry` agent tool
- CLAUDE.md agent rules: (1) every mutation requires correlation_id,
  (2) forbid AI from choosing accounts without PostingRule lookup
- Idempotency test (Test 6): verify same idempotency_key returns
  cached result, not duplicate entry

### Form UX
- Fiscal period dropdown defaults to arbitrary month — fix: compute
  default from entry_date matching period's start_date/end_date range
- Dropdown placeholder is selectable instead of disabled — fix:
  `<option disabled value="">`
- MoneyAmount regex: custom message applied in Phase 15B; audit
  FxRate and other branded schemas for similar missing messages
- Per-line description field (column exists, not surfaced in form)

### Reports
- Balance Sheet summary deferred from P&L view (semantic mismatch
  between period-activity and cumulative-balances)
- Period filtering in report tests (only "all periods" tested)
- Time-to-first-post measurement (formal instrumentation)

### Documentation
- Pino redaction verification script (scripts/verify-pino-redaction.ts)
- RLS troubleshooting doc (docs/troubleshooting/rls.md)
- Document Sync (#16): PLAN.md folder tree audit, stale references,
  §18 Open Question resolution
- Regenerate src/db/types.ts (stale — missing migration 007 RPC
  functions). Establish rule: regenerate after every migration.

### Testing
- API route integration tests (exercise HTTP layer including auth)
- Org creation integration test (orgService.createOrgWithTemplate)
- Period-filtered report tests
- Audit_log content assertions in mutation tests
- Consider component tests for form validation behavior
- Multi-user smoke test for org switcher role verification
- "Tests pass on a fresh clone" as separate exit criterion from
  "tests pass"

---

## Recurring patterns elevated from friction journal

These patterns appeared 3+ times during the closeout and should
become Phase 1.2 standing rules.

### 1. "Typecheck passes, runtime shape doesn't match"

Appeared 3 times: Phase 13B (form.watch vs useWatch), Phase 14B
(chart_of_accounts array-vs-object PostgREST embed), Phase 15B
(MoneyAmount number-vs-string from Supabase driver).

**Rule:** Every external-system boundary (Supabase driver, PostgREST,
fetch response) needs explicit runtime shaping. Type casts provide
compile-time safety but zero runtime enforcement. Use coercion
functions (toMoneyAmount, toFxRate) at service boundaries.

**Already in CLAUDE.md:** Rule 3 (money never crosses service
boundaries as JS Number). Extend to: "no external data crosses
service boundaries without explicit runtime coercion."

### 2. Plan documents are snapshots, not canonical sources

Appeared in every subagent task (12B-17B). Pre-checks always
found stale details in the plan (URLs, type names, file paths).

**Rule:** Pre-delegation brief verification against the actual
codebase is mandatory, not optional. The plan says what to build;
the codebase says what exists. Conflicts are resolved by reading
the codebase.

### 3. Subagent brief quality is the bottleneck

Every runtime bug in the closeout originated from brief-author
assumptions, not subagent execution. Five consecutive zero-drift
structural reviews prove the subagent executes accurately against
whatever spec it receives.

**Rule:** Invest time in brief verification (checking import paths,
type names, existing patterns) rather than in post-delegation review.
The pre-delegation verification step catches more bugs than the
post-delegation review step.

### 4. Shared database state in integration tests

Appeared 2 times: Phase 12A (entry_number collision), Phase 16A
(report aggregation baseline). vitest sequential execution shares
committed state across test files.

**Rule:** Integration tests that depend on accumulated state must
use baseline-delta assertions, not absolute values. Test helpers
for UNIQUE columns must compute dynamic values (MAX+1), never
hardcode.

### 5. Session-start git hygiene

Appeared 1 time (Task 16 session start) but the impact was
significant: 14 uncommitted files persisting across multiple sessions.

**Rule:** Every session-start entry sequence includes
`git status --short`. Expected output is empty. Any modified or
untracked files must be surfaced and decided on before the task
begins.

---

## Deferred Decisions (resolve during Phase 1.2 brief writing)

These are implementation-detail decisions that PLAN.md deliberately
did not pre-resolve. They are not open questions — they are decisions
that depend on real implementation experience from Phase 1.1 and
Phase 1.2 early work. The Phase 1.2 Execution Brief should resolve
each one.

Source: extracted from PLAN.md §17 during Phase 1.1 closeout
restructure.

| Decision | Why it's deferred |
|---|---|
| **Exact Claude model selection** (Sonnet 4.5 vs Sonnet 4 vs Haiku for orchestrator) | Depends on prompt-caching cost data we cannot have until Phase 1.2 begins. The brief picks a starting model and sets a measurement plan. |
| **Prompt caching configuration details** (which prompt segments to cache, cache TTL) | Prompt caching is a Phase 1.2 day-1 default, but the exact segmentation depends on the final system prompt structure, which depends on persona prompts written during Phase 1.2. |
| **Persona prompt content for Controller and AP Specialist** | The prompts exist in the Phase 1.2 brief, not the architecture. They are tuned during Phase 1.2 development. |
| **Tool-call retry backoff** (immediate retry vs 1s delay vs exponential) | Depends on observed Claude API behavior. The brief picks an initial value and adjusts based on Phase 1.3 friction. |

---

## Phase 2 obligations carried forward by Phase 1.5A

These are Phase 2 items surfaced during Phase 1.5A that must be
discharged before the related 1.5A reserved-seat column becomes
write-active.

- **Cycle detection on `organizations.parent_org_id`** — before
  consolidation features write to the column. The
  `org_parent_is_not_self` CHECK only catches direct
  self-reference (`parent_org_id = org_id`); a multi-org cycle
  (A → B → A) is not prevented by the schema. Options: recursive
  trigger that walks the parent chain on INSERT/UPDATE and rejects
  on cycle, or app-layer validation in the service that will own
  parent-setting. Tracked in
  `docs/09_briefs/phase-1.5/brief.md` §13.3.

---

## Phase 2+ deferrals (NOT Phase 1.2 obligations)

These were explicitly deferred past Phase 1.2:

- Partial reversals (Phase 2 AP Agent)
- Soft close vs hard close (Phase 2+, Q21)
- Cash Flow Statement
- CoA hierarchy roll-up queries (recursive CTE or materialized path)
- Materialized views / read models for report performance
- Multi-currency FX wiring (Phase 4 per PLAN.md §8b)
- Event sourcing activation (events table writes, Phase 2)
- Recurring entries (Phase 2, requires pg-boss)
- Bank reconciliation, AP/AR modules
- REVOKE UPDATE/DELETE on ledger tables (belt-and-suspenders)
