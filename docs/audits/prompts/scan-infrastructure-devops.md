# Category Scan: Infrastructure & DevOps

Phase 2 scanner prompt. One of nine category scans that run in
parallel.

---

## Sparse Category Notice

This category is expected to produce sparse findings at Phase 1.1.
The project runs on Supabase (managed) with local development via
the Supabase CLI. There is no custom CI/CD, no Dockerfile, no
deployment pipeline, and no infrastructure-as-code.

**Per DESIGN.md Category Collapse Rules:** This scan runs as part
of a collapsed scanner alongside Observability & Reliability and
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

**Audit scope:** This audit is cumulative. The codebase includes
everything from Phase 0 (foundation) and Phase 1.1 (manual journal
entry path). Both are in scope. Assess the full codebase as it
exists today, not the phases separately.

**Your category:** Infrastructure & DevOps

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

## Category Definition: Infrastructure & DevOps

Does the project have sufficient infrastructure for its current
phase? Evaluate:

- **Development environment:** Is local development reproducible?
  Can a new developer set up the project from the README? Are
  there seed scripts, environment templates, setup instructions?

- **Build and deploy:** Is there a build pipeline? Is deployment
  manual or automated? Are there environment-specific
  configurations that could cause dev/prod divergence?

- **Database operations:** Are migrations versioned and
  sequential? Is there a rollback strategy? Can migrations be
  applied to a fresh database without manual steps?

- **Dependency management:** Is there a lockfile? Are Node.js and
  pnpm versions pinned (.nvmrc, packageManager field)?

## What To Examine

- `package.json` — scripts, engines, packageManager field
- `.nvmrc` — Node.js version pinning
- `supabase/config.toml` — local Supabase configuration
- `.env.example`, `.env.local.example` — environment templates
- `.gitignore` — what's excluded from version control
- `README.md` — setup instructions (if any)
- `.github/` — CI/CD configuration (expected absent at Phase 1.1)
- `supabase/migrations/` — migration file naming, sequentiality

## Output Format

Produce `findings/infrastructure-devops.md`:

```markdown
# Infrastructure & DevOps — Findings Log

Scanner: Infrastructure & DevOps
Phase: End of Phase 1.1
Date: {date}
Category status: Sparse — no custom CI/CD, deployment, or
  infrastructure at this phase.

## Baseline

{What infrastructure exists. 2-3 sentences.}

## Findings

### {INFRA-001}: {one-line title} (if any)
- **Severity:** {severity}
- **Description:** {brief}
- **Evidence:** {file paths}
- **Consequence:** {impact}

## Future Audit Triggers

{What would make this category produce meaningful findings in a
future audit. E.g., "When a CI pipeline is added," "When the
project deploys to a hosted environment."}

## Category Summary

{1-2 sentences.}
```

## Reminders

- **Specificity over comprehensiveness.**
- **Evidence, not opinion.**
- **Respect prior decisions.**
- **Do not manufacture findings for a sparse category.**
