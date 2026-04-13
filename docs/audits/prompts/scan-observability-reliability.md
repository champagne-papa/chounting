# Category Scan: Observability & Reliability

Phase 2 scanner prompt. One of nine category scans that run in
parallel.

---

## Sparse Category Notice

This category is expected to produce sparse findings at Phase 1.1.
The project has a Pino logger configured but no structured
observability stack (no metrics, no tracing, no alerting, no
health dashboards beyond a basic health endpoint).

**Per DESIGN.md Category Collapse Rules:** This scan runs as part
of a collapsed scanner alongside Infrastructure & DevOps and
Performance & Scalability. A single agent executes all three
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

**Your category:** Observability & Reliability

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

## Category Definition: Observability & Reliability

Can you see what the system is doing, and does it handle failures
gracefully? Evaluate:

- **Logging:** Is there structured logging? Does it include
  trace_id for request correlation? Are log levels used
  consistently? Is sensitive data (auth tokens, PII) excluded
  from logs?

- **Error handling resilience:** When a downstream service fails
  (Supabase, Claude API), does the system degrade gracefully or
  crash? Are there retry mechanisms where appropriate? Are
  transient vs permanent errors distinguished?

- **Audit trail as observability:** The `audit_log` and
  `recordMutation` mechanism serve as an observability proxy. Is
  the audit trail reliable enough to investigate incidents? Does
  it capture enough context (trace_id, user_id, before/after
  state)?

- **Health checking:** Does the health endpoint verify actual
  dependencies (database connectivity), or is it a static 200?

## What To Examine

- `src/shared/logger/pino.ts` — logger configuration
- `src/services/audit/recordMutation.ts` — audit trail mechanism
- `src/services/middleware/serviceContext.ts` — trace_id
  generation and propagation
- `src/app/api/health/route.ts` — health endpoint
- `src/services/errors/ServiceError.ts` — error classification
- `src/services/middleware/errors.ts` — error handling middleware
- Grep for `console.log`, `console.error` — are they used instead
  of the structured logger?

## Output Format

Produce `findings/observability-reliability.md`:

```markdown
# Observability & Reliability — Findings Log

Scanner: Observability & Reliability
Phase: End of Phase 1.1
Date: {date}
Category status: Sparse — no metrics, tracing, or alerting
  infrastructure at this phase.

## Baseline

{What observability exists. 2-3 sentences.}

## Findings

### {OBSERVE-001}: {one-line title} (if any)
- **Severity:** {severity}
- **Description:** {brief}
- **Evidence:** {file paths}
- **Consequence:** {impact}

## Future Audit Triggers

{What would make this category produce meaningful findings in a
future audit. E.g., "When production traffic begins," "When
agent-driven mutations add a second mutation source that needs
correlation."}

## Category Summary

{1-2 sentences.}
```

## Reminders

- **Specificity over comprehensiveness.**
- **Evidence, not opinion.**
- **Respect prior decisions.**
- **Do not manufacture findings for a sparse category.**
