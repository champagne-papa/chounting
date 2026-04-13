# Category Scan: Architecture Fit

Phase 2 scanner prompt. One of nine category scans that run in
parallel. This prompt also serves as the TEMPLATE for all other
category scan prompts — the structure, constraints, and output
format sections are shared; only the "Category Definition" and
"What To Examine" sections change per category.

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

**Your category:** Architecture Fit

**Audit framework:** See `docs/audits/DESIGN.md` for the full
execution model. You are Phase 2. Your output feeds Phase 3
(cross-cutting synthesis).

## Inputs

You receive three types of input:

### 1. Hypothesis list (from Phase 1 orientation)

You will be given a `hypotheses.md` file produced by the
orientation pass. Some hypotheses will be tagged with your
category. **Investigate these explicitly.** For each hypothesis
assigned to you:
- State whether the evidence confirms, refutes, or is
  inconclusive
- Cite specific files and line numbers
- If the hypothesis spans multiple categories, note what you
  found in your slice and flag what other scanners should check

### 2. Prior documentation

Read for context. These establish what is already known and what
has been explicitly deferred:
- `CLAUDE.md` — standing rules and invariants
- `docs/phase-1.2-obligations.md` — inherited deferrals
- `docs/phase-1.1-exit-criteria-matrix.md` — MET/DEFERRED status
- `docs/friction-journal.md` — historical lessons
- `docs/phase-1.1-schema-reconciliation.md` — drift findings
- `docs/phase-1.1-test-coverage-catalog.md` — coverage gaps

**Constraint:** Do not report items already marked DEFERRED in
obligations or exit criteria as new findings. You may reference
them ("this finding is related to the deferred X") but do not
count them as discoveries.

### 3. Codebase access

You have full read access to the codebase. The "What To Examine"
section below tells you where to focus for this category.

## Category Definition: Architecture Fit

Does the architecture match the problem? Evaluate:

- **Layering:** Are the architectural layers (database, service,
  API, frontend) cleanly separated? Do boundaries fall in the
  right places for the domain (accounting, multi-tenant,
  agent-driven)?

- **Separation of concerns:** Does each module/file/function do
  one thing? Are responsibilities clearly assigned? When a
  concern spans layers, is it handled consistently?

- **Boundary choices:** Where are the system boundaries drawn
  (service boundaries, API boundaries, trust boundaries)? Are
  they in the right place for this domain? Do they match the
  stated architecture (CLAUDE.md Laws 1 and 2)?

- **Pattern consistency:** When the codebase uses a pattern
  (e.g., withInvariants wrapping, Zod validation at boundaries,
  service-role client for writes), is it applied consistently
  everywhere it should be? Inconsistency is a stronger signal
  than a bad pattern choice.

- **Domain fit:** Is the chosen architecture appropriate for
  accounting specifically? Double-entry bookkeeping has hard
  correctness requirements (balanced entries, immutable posted
  entries, audit trails). Does the architecture enforce these
  structurally, or rely on convention?

- **Agent readiness:** Phase 1.2 adds agent integration. Does
  the current architecture have clean extension points for
  agent-driven mutations, or will the agent need to work around
  the architecture?

- **Multi-tenancy:** Is tenant isolation structural (RLS, org_id
  scoping) or conventional (every query remembers to filter)?
  Where are the weakest points?

## What To Examine

### Must-read files (read fully)
- `CLAUDE.md` — the architectural contract
- `src/services/middleware/withInvariants.ts` — the enforcement
  mechanism for Law 2 (all mutations through middleware)
- `src/services/middleware/serviceContext.ts` — how context
  (org_id, user_id, trace_id) flows through the system
- `src/services/accounting/journalEntryService.ts` — the most
  complex service; primary mutation path
- `src/app/api/orgs/[orgId]/journal-entries/route.ts` — the
  primary API route; shows the route-to-service boundary

### Must-read for patterns (read 2-3 for consistency check)
- Other services: `orgService.ts`, `reportService.ts`,
  `chartOfAccountsService.ts`
- Other API routes: any 2 routes under `src/app/api/orgs/`
- Schema files: `journalEntry.schema.ts`, `money.schema.ts`

### Skim for boundary assessment
- `src/db/adminClient.ts`, `src/db/userClient.ts` — database
  client separation (service-role vs user-scoped)
- `src/components/bridge/ContextualCanvas.tsx` — frontend entry
  point; how does it interact with the backend?
- `supabase/migrations/20240101000000_initial_schema.sql` — does
  the DB schema match the architectural claims?
- `src/services/audit/recordMutation.ts` — audit trail mechanism

### Check for absence (does X exist?)
- Is there a file or mechanism that enforces "all DB access goes
  through services"? Or is this purely convention?
- Is there a file or mechanism that enforces "all journal entries
  go through journalEntryService.post"? Or is this convention?
- Is there a lint rule for `no-unwrapped-service-mutation`
  (mentioned in CLAUDE.md Rule 2)?
- Are there barrel exports or re-exports that blur layer
  boundaries?

## Producing Findings

### What counts as a finding

A finding is a specific, evidence-backed observation about the
codebase within your category. It must include:
- What you observed (description)
- Where you observed it (file paths, line numbers)
- Why it matters (consequence if left unaddressed)

**Good finding:** "The `withInvariants` middleware is applied to
`journalEntryService.post` and `orgService.createOrgWithTemplate`,
but `reportService.profitAndLoss` — which reads tenant-scoped
data — calls the admin client directly without going through
`withInvariants`. This means report queries bypass the
`canUserPerformAction` check. The read is still RLS-protected
because the admin client's queries include org_id filtering, but
this is a layering inconsistency: some service functions use the
enforcement middleware and some don't, with no clear rule for
which require it."

**Bad finding:** "The codebase could benefit from better
separation of concerns in some areas."

### What does NOT count as a finding

- Items already in `phase-1.2-obligations.md` (reference, don't
  rediscover)
- Phase 1 simplifications with documented Phase 2 corrections
  (see PLAN.md Section 0)
- Style preferences ("I would have named this differently")
- Hypothetical future problems with no current evidence
  ("if you ever need X, this won't work")

### Severity ratings

Assign a draft severity to each finding. Phase 3 (synthesis) may
adjust these based on cross-cutting context.

- **Critical:** Blocks Phase 1.2 work or is a correctness/security
  issue that could produce wrong financial data or leak tenant data
- **High:** Likely to cause pain during Phase 1.2 if not addressed.
  The pain is specific and predictable, not hypothetical.
- **Medium:** Real technical debt. Should be scheduled. Won't block
  Phase 1.2 but will accumulate cost.
- **Low:** Minor, nice-to-have, or accepted risk. Documenting for
  completeness.

**Justify every severity.** Don't just assign a color. "Critical
because the agent will need to call journalEntryService.post, and
if the withInvariants enforcement isn't consistent, the agent path
might bypass authorization" is a justified severity. "Critical
because it's important" is not.

### Cross-references

When you notice something that affects another category, add a
`cross_references` entry. Be specific:

- **Good:** "This finding may also appear in the Security &
  Compliance scan — the missing withInvariants wrapping on read
  operations means the authorization check is inconsistent."
- **Bad:** "Related to security."

## Output Format

Produce `findings/architecture-fit.md` in this exact structure:

```markdown
# Architecture Fit — Findings Log

Scanner: Architecture Fit
Phase: {phase identifier, e.g., "End of Phase 1.1"}
Date: {date}
Hypotheses investigated: {list of H-NN IDs assigned to this
  scanner}

## Hypothesis Responses

For each hypothesis assigned to this scanner:

### H-{NN}: {hypothesis title}
- **Status:** Confirmed | Refuted | Inconclusive
- **Evidence:** {what you found, with file paths and line numbers}
- **Notes for other scanners:** {if the hypothesis spans
  categories, what should others check}

## Findings

### {ARCHFIT-001}: {one-line title}
- **Severity:** Critical | High | Medium | Low
- **Description:** {1-3 paragraphs. Specific, not generic.}
- **Evidence:**
  - {file_path}:{line} — {what you see there}
  - {file_path}:{line} — {what you see there}
- **Consequence:** {what happens if this isn't addressed}
- **Cross-references:**
  - {other categories or hypotheses this relates to}

### {ARCHFIT-002}: {one-line title}
...

## Category Summary

{2-3 sentences. Overall assessment of this category. What's the
single most important thing the synthesis agent should know about
Architecture Fit at this phase?}
```

## Effort Budget

Spend ~50-60% of your effort on the must-read files, ~20-30% on
the pattern-consistency checks, ~10-20% on the absence checks.

If you find more than 12 findings, you're probably being too
granular. Consolidate related observations into single findings.
If you find fewer than 3, you're probably being too lenient — look
harder.

A typical scan for a Phase 1.1 codebase should produce 5-10
findings across the severity spectrum.

## Reminders

- **Specificity over comprehensiveness.** Five well-researched
  findings beat fifteen generic ones.
- **Evidence, not opinion.** Every finding grounded in specific
  code.
- **Respect prior decisions.** If a non-standard pattern has
  documented rationale (in CLAUDE.md, friction journal, or an
  ADR), engage with the rationale. Don't just flag the pattern.
- **Hunt for the next boundary bug.** Three boundary mismatches
  were caught in Phase 1.1. The pattern is "external-system
  boundaries lie to the type system." Actively look for the
  next instance.
- **Flag self-audit bias.** If you helped build this codebase,
  say so in the summary and flag findings where your familiarity
  may have softened the assessment.

---

## Template Notes (for creating other scan prompts)

This file is the template for all nine category scan prompts. To
create a new category scan prompt:

1. Copy this file
2. Replace "Architecture Fit" with the new category name
3. Replace the "Category Definition" section with the new
   category's evaluation criteria
4. Replace the "What To Examine" section with category-specific
   file lists
5. Replace `ARCHFIT` in finding IDs with the new category's
   prefix:
   - Architecture Fit: `ARCHFIT`
   - Backend Design & API: `BACKEND`
   - Frontend Architecture: `FRONTEND`
   - Data Layer & Database Design: `DATALAYER`
   - Security & Compliance: `SECURITY`
   - Infrastructure & DevOps: `INFRA`
   - Observability & Reliability: `OBSERVE`
   - Performance & Scalability: `PERF`
   - Code Quality & Maintainability: `QUALITY`

Everything else — Role, Context, Inputs, Producing Findings,
Output Format, Effort Budget, Reminders — stays identical across
all category scan prompts. If you need to change these shared
sections, change them in ALL scan prompts (or extract a shared
preamble).
