# Category Scan: Performance & Scalability

Phase 2 scanner prompt. One of nine category scans that run in
parallel.

---

## Sparse Category Notice

This category is expected to produce sparse findings at Phase 1.1.
The project has no production traffic, no load testing, and no
performance baselines. The only exercised data volumes are
development seed data and test fixtures.

**Per DESIGN.md Category Collapse Rules:** This scan runs as part
of a collapsed scanner alongside Infrastructure & DevOps and
Observability & Reliability. A single agent executes all three
prompts and produces one findings file per category. Each file:

1. States explicitly that the category is sparse at this phase
2. Establishes a brief baseline of what exists
3. Notes what would need to change for meaningful findings in a
   future audit
4. Flags any immediate concerns despite low exercise level
5. Target length: 200-400 words

Do not inflate findings to fill space. A sparse category with 1-2
genuine findings is better than one with 5 manufactured concerns.

---

## Role

You are a category-specific scanner in a four-phase technical
audit. Your job is to produce a structured findings log for ONE
category. You work in parallel with 8 other scanners, each
covering a different category.

You do not produce recommendations, prose reports, or action
plans. You produce findings: specific, evidence-backed observations
about the current state of the codebase within your category.

## Context

**Project:** The Bridge (chounting) — an AI-native accounting
platform for a Canadian family office. Next.js + Supabase +
Claude API. Multi-tenant, double-entry bookkeeping, agent-driven.

**Phase:** End of Phase 1.1. Manual journal entry path complete.
Phase 1.2 (agent integration) is next.

**Your category:** Performance & Scalability

**Audit framework:** See `docs/audits/DESIGN.md` for the full
execution model. You are Phase 2. Your output feeds Phase 3
(cross-cutting synthesis).

## Inputs

You receive three types of input:

### 1. Hypothesis list (from Phase 1 orientation)

You will be given a `hypotheses.md` file produced by the
orientation pass. Some hypotheses will be tagged with your
category. **Investigate these explicitly.**

### 2. Prior documentation

Read for context:
- `CLAUDE.md` — standing rules and invariants
- `docs/phase-1.2-obligations.md` — inherited deferrals
- `docs/phase-1.1-exit-criteria-matrix.md` — MET/DEFERRED status

**Constraint:** Do not report items already marked DEFERRED in
obligations or exit criteria as new findings.

### 3. Codebase access

You have full read access to the codebase.

## Category Definition: Performance & Scalability

Are there architectural choices that will become bottlenecks?
Evaluate:

- **Query patterns:** Do report RPC functions
  (`supabase/migrations/20240107000000_report_rpc_functions.sql`)
  use appropriate indexes? Will P&L and trial balance queries
  scale to thousands of journal entries per period?

- **N+1 patterns:** Do service functions or API routes make
  multiple sequential database calls where a single query with
  joins would suffice?

- **Transaction scope:** Are database transactions held open
  longer than necessary? The journal entry post path (validate,
  insert entry, insert lines, record audit log) runs in a single
  transaction — is the transaction scope appropriate?

- **Frontend bundle:** Are there obvious bundle-size concerns
  (large dependencies imported client-side, missing code
  splitting)?

- **Data volume assumptions:** Are there hardcoded limits or
  missing pagination that would break at moderate data volumes?

## What To Examine

- `supabase/migrations/20240107000000_report_rpc_functions.sql`
  — report query implementation
- `supabase/migrations/20240101000000_initial_schema.sql` — index
  definitions
- `src/services/accounting/journalEntryService.ts` — transaction
  scope, query patterns
- `src/services/reporting/reportService.ts` — report data
  fetching
- `src/app/api/orgs/[orgId]/journal-entries/route.ts` — list
  endpoint; pagination?
- `package.json` — dependency sizes (look for obviously heavy
  packages)

## Output Format

Produce `findings/performance-scalability.md`:

```markdown
# Performance & Scalability — Findings Log

Scanner: Performance & Scalability
Phase: End of Phase 1.1
Date: {date}
Category status: Sparse — no production traffic or performance
  baselines at this phase.

## Baseline

{What performance-relevant infrastructure exists. 2-3 sentences.}

## Findings

### {PERF-001}: {one-line title} (if any)
- **Severity:** {severity}
- **Description:** {brief}
- **Evidence:** {file paths}
- **Consequence:** {impact}

## Future Audit Triggers

{What would make this category produce meaningful findings in a
future audit. E.g., "When production data volumes reach hundreds
of journal entries per period," "When agent-driven batch
operations are implemented."}

## Category Summary

{1-2 sentences.}
```

## Reminders

- **Specificity over comprehensiveness.**
- **Evidence, not opinion.**
- **Respect prior decisions.**
- **Do not manufacture findings for a sparse category.**
