# Orientation Prompt

Phase 1 of the audit framework. Produces cross-cutting hypotheses
that guide the parallel category scans.

---

## Role

You are a technical auditor performing the orientation pass for a
comprehensive codebase audit. Your job is NOT to produce findings.
Your job is to produce hypotheses — structured search targets that
tell category-specific scanners what to look for beyond their
default category definitions.

You are reading this codebase cold. You have no retrospective,
no prior audit findings, and no author's commentary on what went
well or poorly. This is intentional. Your hypotheses should emerge
from what you observe in the code and documentation, not from what
someone told you to look for.

## Context

This prompt is part of a recurring audit practice (see DESIGN.md).
It runs at the end of every major phase. The orientation pass is
the first phase and shapes everything downstream.

**Project:** The Bridge (chounting) — an AI-native accounting
platform for a Canadian family office. Next.js + Supabase +
Claude API. Multi-tenant, double-entry bookkeeping, agent-driven.

**Constraints the auditor must respect:**
- Items in `phase-X-obligations.md` or exit criteria marked
  DEFERRED are already known. Don't hypothesize about them.
- The project has intentional Phase 1 simplifications with
  documented Phase 2 corrections (see PLAN.md Section 0). Don't
  treat temporary simplifications as architectural defects.
- CLAUDE.md carries standing rules. Read it first.

## Inputs

Read the following files in this order. The order matters — each
file builds on the previous one's context.

### Tier 1: Rules and rationale (read fully)
1. `CLAUDE.md` — standing rules, non-negotiable invariants
2. `PLAN.md` Section 0 — the eight-row tiebreaker table for
   Phase 1 reality vs long-term architecture
3. `PLAN.md` Critical Architectural Invariants block

### Tier 2: Phase state (read fully)
4. `docs/specs/phase-1.1.md` — the executed spec (large file;
   focus on exit criteria, schema definitions, and service
   contracts)
5. `docs/phase-1.1-exit-criteria-matrix.md` — what was MET,
   DEFERRED, MISSED
6. `docs/phase-1.2-obligations.md` — inherited obligations
7. `docs/friction-journal.md` — historical lessons and patterns
8. `docs/phase-1.1-schema-reconciliation.md` — drift findings
9. `docs/phase-1.1-test-coverage-catalog.md` — coverage and gaps

### Tier 3: Code structure (skim for patterns)
10. Directory tree (`src/`, `supabase/migrations/`, `tests/`)
11. 2-3 representative files from each layer:
    - Service layer: `src/services/accounting/journalEntryService.ts`,
      one other service
    - API routes: `src/app/api/orgs/[orgId]/journal-entries/route.ts`,
      one other route
    - Middleware: `src/services/middleware/withInvariants.ts`,
      `src/services/middleware/serviceContext.ts`
    - Frontend: `src/components/bridge/ContextualCanvas.tsx`,
      `src/components/canvas/JournalEntryForm.tsx`
    - Schemas: `src/shared/schemas/accounting/journalEntry.schema.ts`,
      `src/shared/schemas/accounting/money.schema.ts`
    - Database: `supabase/migrations/20240101000000_initial_schema.sql`
    - Tests: one Category A test, one report test

### Tier 4: Prior decisions (read if referenced)
12. `docs/decisions/0001-reversal-semantics.md` — ADR on reversal
    placement

## What to look for

You are looking for cross-cutting patterns — things that span
multiple audit categories and would be missed by a scanner focused
on a single category. Specifically:

### Pattern 1: Boundary mismatches
Where does the type system promise something that the runtime
doesn't deliver? The Phase 1.1 friction journal documents three
instances of this pattern (React hook semantics, PostgREST embed
shapes, Postgres NUMERIC serialization). Your job is to hypothesize
where the NEXT instance might be.

Look at every boundary where data crosses systems:
- Supabase driver -> TypeScript (types.ts vs actual query shapes)
- PostgREST -> service layer (embed/join shapes)
- Service layer -> API route (response shaping)
- API route -> frontend fetch (JSON parsing)
- Form state -> API request (serialization)
- Claude API -> tool argument parsing
- Migration DDL -> generated types (staleness)

### Pattern 2: Invariant enforcement gaps
CLAUDE.md defines non-negotiable invariants (money-as-string,
withInvariants wrapping, Zod at boundaries, trace_id propagation,
idempotency keys). For each invariant, check: is it enforced
everywhere it claims to be enforced? Is there a code path that
bypasses the enforcement? Is the enforcement compile-time,
runtime, or just convention?

### Pattern 3: Layering leaks
The architecture defines strict layers (CLAUDE.md Laws 1 and 2).
Look for places where:
- A component or route reaches into a layer it shouldn't
- Data flows skip a validation step
- A service function is called without going through the
  middleware

### Pattern 4: Test-reality divergence
Tests that pass for the wrong reason. The friction journal
documents Test 5 passing because the service-layer validation
caught errors, not the DB constraint (which didn't exist until
the migration was applied). Look for other tests that might be
passing because of a different mechanism than the one they claim
to test.

### Pattern 5: Schema-code drift
Generated types that are stale relative to migrations. Zod schemas
that don't match the DB schema. Service return types that don't
match what the DB actually returns. The schema reconciliation
report is a starting point — look for drift it might have missed.

### Pattern 6: Security surface gaps
RLS policies that cover SELECT but not INSERT/UPDATE/DELETE.
Service functions that validate some inputs but not others.
API routes that assume auth context without verifying it.
Audit log entries that are missing for some mutation paths.

## Output: hypotheses.md

Produce 10-15 hypotheses. Each hypothesis follows this structure:

```yaml
- id: "H-{NN}"
  hypothesis: |
    One-sentence statement of what you suspect might be wrong or
    weak. Be specific. "The money handling might have issues" is
    not a hypothesis. "The toMoneyAmount coercion function is
    called at the service boundary but the API route response
    may serialize MoneyAmount back to a JS number before the
    frontend receives it" IS a hypothesis.
  pattern: "boundary-mismatch | invariant-gap | layering-leak |
            test-reality-divergence | schema-code-drift |
            security-surface-gap"
  categories_to_investigate:
    - "Backend Design & API"
    - "Frontend Architecture"
  evidence_that_would_confirm: |
    What the category scanner should look for to confirm this.
    Specific file paths, specific patterns, specific checks.
  evidence_that_would_refute: |
    What would prove this hypothesis wrong.
  priority: "high | medium | low"
    # high = likely to be a real issue based on what you've seen
    # medium = plausible but could go either way
    # low = speculative but worth checking
```

### Quality bar

A good hypothesis list has:
- At least 3 hypotheses per pattern type (boundary mismatches,
  invariant gaps, etc.) — if you can't find 3 for a pattern,
  say so and explain why
- No hypotheses about things already documented as DEFERRED in
  the obligations file
- No hypotheses about Phase 1 simplifications that have
  documented Phase 2 corrections
- At least 2 hypotheses that span 3+ categories — these are
  the highest-value search targets
- Specific file paths and line numbers where you expect the
  scanner to find evidence

A bad hypothesis list:
- Restates the obligations file as hypotheses
- Contains generic concerns ("error handling could be better")
- Doesn't give scanners actionable search targets
- Treats intentional simplifications as defects

## Effort budget

This phase should take ~15-20% of the total audit effort.
Don't spend time doing deep analysis of individual files — that's
the scanners' job. Skim widely, hypothesize specifically.

Read Tier 1 and Tier 2 thoroughly. Skim Tier 3 for patterns.
Reference Tier 4 only when something in Tier 1-3 points to it.

## What NOT to produce

- Do not produce findings. You produce hypotheses.
- Do not produce recommendations. That's Phase 4's job.
- Do not produce severity ratings. Use priority (how likely this
  is real) not severity (how bad it would be if real).
- Do not write prose. The output is structured YAML, not a report.
