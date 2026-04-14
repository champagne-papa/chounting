# Audit Framework Design

Comprehensive technical audit practice for The Bridge (chounting).
Runs at the end of every major phase. Produces archival findings
and actionable recommendations that compound across audits.

Written: 2026-04-13, end of Phase 1.1.

---

## Execution Model: C' (Hybrid)

Four phases. Evidence-gathering is separated from composition.
Cross-cutting findings are caught by design, not by accident.

### Phase 1: Orientation (single agent, ~15-20% of effort)

One agent reads the codebase cold. No retrospective access, no
prior audit findings. Produces a hypothesis list: 10-15 cross-
cutting search targets that tell the category scanners what to
look for beyond their category definitions.

**Input:** Codebase, docs (spec, friction journal, exit criteria
matrix, schema reconciliation, test coverage catalog, CLAUDE.md,
PLAN.md). No retrospective.

**Output:** `hypotheses.md` — structured list of suspected cross-
cutting issues, each with a hypothesis statement, which categories
should investigate it, and what evidence would confirm or refute it.

**Why this phase exists:** Without orientation, parallel scanners
are structurally blind to bugs that live between categories. The
Phase 15B money-type bug (Postgres NUMERIC driver -> service
boundary coercion -> branded types -> frontend form) touched four
categories. A scanner told "look at service layer patterns" might
miss it. A scanner told "check whether external system boundaries
have runtime coercion gaps" will find it.

### Phase 2: Category Scans (parallel agents, ~50-60% of effort)

One agent per category, each running in parallel. Each receives:
- Its category scan prompt (from `prompts/scan-{category}.md`)
- The hypothesis list from Phase 1 (relevant hypotheses flagged)
- Access to prior docs (friction journal, exit criteria, etc.)

Each scan produces a structured findings log in standard format.

**Output:** `findings/{category}.md` per category, each containing
findings in the standard format:

```
{finding_id, category, severity_draft, description, evidence,
 file_paths, cross_references}
```

The `cross_references` field is load-bearing: when a scanner
notices something that affects another category, it flags it
explicitly. This is what Phase 3 uses to catch cross-cutting issues.

**Phase 1.1 execution:** Seven scans, not nine. Six full scans
(Architecture Fit, Backend Design, Frontend Architecture, Data
Layer, Security & Compliance, Code Quality) plus one collapsed scan
covering Infrastructure & DevOps, Performance & Scalability, and
Observability & Reliability. The collapsed scanner produces three
separate findings files (one per category, 200-400 words each,
baseline-only). See "Category Collapse Rules" below.

### Phase 3: Cross-Cutting Synthesis (single agent, ~10-15%)

Takes all nine findings logs plus the original hypothesis list.
Does not touch the codebase directly — works only from scanner
evidence.

**Job:**
1. Deduplicate findings surfaced by multiple scanners
2. Merge findings where multiple categories point at the same
   underlying issue
3. Verify hypotheses from Phase 1 — confirmed, disproved, or
   missed by scanners
4. Flag hypotheses the scans missed entirely (blind-spot signal)
5. Read the retrospective LAST, after completing own analysis,
   as a validation check

**Output:**
- `unified-findings.md` — deduplicated, cross-referenced findings
  with final severity assignments
- `comparison-to-prior-audits.md` (Phase 1.2 onward) — delta
  analysis against prior audit

**Retrospective access rule:** The synthesis agent reads the
retrospective after completing its own cross-cutting analysis. It
uses the retrospective to check for blind spots ("the retrospective
flagged X — did the scanners find it?"), not as an anchor for its
own reasoning.

### Phase 4: Write (single agent, ~15-20% of effort)

Takes the unified findings list from Phase 3. Does not touch the
codebase. Pure composition.

**Output:**
- `audit-report.md` (Document 1, 3000-6000 words)
- `action-plan.md` (Document 2, 1500-3000 words)
- `audit-metadata.md` (last thing written — execution details)

---

## Session Boundaries

### Phase 1.1 (first audit): Two-session collapsed

- **Session 1:** Orientation + Category Scans (Phases 1-2)
- **Session 2:** Synthesis + Write (Phases 3-4)

### Aspirational (future audits): Five sessions

One session each for: Orientation, each of 7-9 scanners (parallel),
Synthesis, Write. Adopted when the practice is proven and maximum
independence between phases matters.

---

## Document Structures

### Document 1: Audit Report

Nine category assessments, each with:
- Current state (what exists)
- Strengths (what's working well)
- Weaknesses (what's weak or underdeveloped)
- Risks (what could cause problems, with probability and impact)

Categories:
1. Architecture Fit
2. Backend Design & API
3. Frontend Architecture
4. Data Layer & Database Design
5. Security & Compliance
6. Infrastructure & DevOps
7. Observability & Reliability
8. Performance & Scalability
9. Code Quality & Maintainability

Followed by:
- **Risk Map** — every risk classified Critical/High/Medium/Low
  with probability, impact, and severity justification
- **Scalability Constraints** — specific limits, what breaks at
  10x/100x/1000x
- **Security Vulnerabilities** — specific attack vectors and gaps
- **Foundation Readiness Assessment** — YES / YES-WITH-CAVEATS / NO
  with evidence
- **Comparison to Prior Audits** (Phase 1.2 onward)
- **Audit Metadata** — date, phase, auditor, files examined,
  methodology, limitations

### Document 2: Action Plan

References Document 1 findings by ID. No repeated descriptions.
- **Quick Wins** (< 1 day each, 1-2 week horizon)
- **Medium-Term Refactors** (1-3 months)
- **Long-Term Roadmap** (3-12 months)
- **Architecture Redesign Recommendations** (if any)
- **Explicit "Do Not Do" List** — consciously accepted findings

---

## Category Collapse Rules

Some categories produce sparse findings at early phases. Running
a full parallel agent for a near-empty scan is ceremony without
insight.

**Rule:** When a category is not meaningfully exercised at the
current phase, it may be collapsed into a combined scan with other
sparse categories. The collapsed scanner:

1. Runs as a single agent
2. Produces one findings file per category (preserving the
   structural invariant that every phase has the same set of
   files in `findings/`)
3. Each file states explicitly that the category is sparse at
   this phase
4. Establishes a brief baseline of what exists
5. Notes what would need to change for meaningful findings in a
   future audit
6. Flags any immediate concerns despite low exercise level
7. Each file: 200-400 words

The collapse decision is recorded in `audit-metadata.md`. When a
category gains substance (e.g., Performance at Phase 1.3 when real
load arrives), it splits back into its own scan.

**Phase 1.1 collapsed categories:** Infrastructure & DevOps,
Performance & Scalability, Observability & Reliability.

---

## Prompt Templates

Twelve templates in `prompts/`, with decreasing volatility:

| Template | Volatility | Evolves when... |
|----------|-----------|-----------------|
| `orientation.md` | High | Prior audit missed something; new patterns emerge |
| `scan-*.md` (x9) | Medium | Category produces noise or misses known issues |
| `synthesis.md` | Low | Structurally stable |
| `write.md` | Lowest | Only when document structure changes |

---

## File Layout

```
docs/audits/
+-- DESIGN.md                          # This file
+-- README.md                          # Entry point, audit chronology
+-- prompts/
|   +-- orientation.md
|   +-- scan-architecture-fit.md
|   +-- scan-backend-design.md
|   +-- scan-frontend-architecture.md
|   +-- scan-data-layer.md
|   +-- scan-security-compliance.md
|   +-- scan-infrastructure-devops.md
|   +-- scan-observability-reliability.md
|   +-- scan-performance-scalability.md
|   +-- scan-code-quality.md
|   +-- synthesis.md
|   +-- write.md
+-- phase-1.1/
    +-- audit-metadata.md              # Execution details (last written)
    +-- hypotheses.md                  # Phase 1 output
    +-- findings/
    |   +-- architecture-fit.md
    |   +-- backend-design.md
    |   +-- frontend-architecture.md
    |   +-- data-layer.md
    |   +-- security-compliance.md
    |   +-- infrastructure-devops.md   # Sparse (collapsed scanner)
    |   +-- observability-reliability.md  # Sparse (collapsed scanner)
    |   +-- performance-scalability.md    # Sparse (collapsed scanner)
    |   +-- code-quality.md
    +-- unified-findings.md            # Phase 3 output
    +-- audit-report.md                # Document 1
    +-- action-plan.md                 # Document 2
```

Phase 1.2+ adds `comparison-to-prior-audits.md` alongside
`unified-findings.md`.

---

## Scope of a Single Audit

Audits are always cumulative — the scope is the codebase as it
exists at the audit checkpoint. Phase-named directories (phase-1.1/,
phase-1.2/) indicate when the audit ran, not what was audited.
Each audit includes everything in the codebase at its checkpoint,
regardless of which phase produced it. This prevents audits from
becoming archaeological exercises about obsoleted states.

### Pre-execution artifact: known-concerns.md

Before each audit runs, a `known-concerns.md` file is drafted in
the phase's audit directory (e.g., `docs/audits/phase-1.1/known-concerns.md`).
This file contains specific concerns identified during the build
phase that have prior evidence of risk — things discovered in the
friction journal, smoke tests, or session diagnostics that weren't
fully resolved.

The orientation agent reads this file and generates hypotheses
targeting these concerns specifically. Category scanners investigate
them deeply. The known-concerns file is prior-evidence injection,
not the only source of hypotheses — the orientation agent generates
additional hypotheses beyond what the file lists.

The file is a standard per-phase pre-execution artifact. Each phase
drafts its own version before its audit runs.

---

## Constraints

These apply to every audit execution regardless of phase:

1. **Specificity over comprehensiveness.** Few well-researched
   findings beat many generic ones. Don't invent findings to fill
   a quota.
2. **Evidence, not opinion.** Every finding grounded in specific
   code, patterns, or architectural choices.
3. **Respect prior decisions.** Engage with documented rationale
   before flagging a non-standard pattern.
4. **Don't re-audit documented deferrals.** Items in
   `phase-X-obligations.md` or exit criteria marked DEFERRED are
   already known. Reference, don't rediscover.
5. **Hunt for boundary bugs.** The pattern "external systems lie
   to the type system" surfaced 3 times in Phase 1.1. Actively
   look for the next instance.
6. **Acknowledge self-audit limitation.** If the auditor helped
   build the codebase, note it and flag findings where bias may
   soften the assessment.

---

## Findings Format (Standard)

Every category scan produces findings in this structure:

```yaml
- finding_id: "{CATEGORY}-{NNN}"       # e.g., BACKEND-001
  category: "Backend Design & API"
  severity_draft: "High"                # Phase 3 may adjust
  description: |
    One-paragraph description of the finding. Specific, not generic.
    "Services throw ServiceError with specific codes that the API
    route helpers translate to HTTP status, but the browser fetch
    layer doesn't have a corresponding error type, so frontend
    error display is ad-hoc string concatenation."
  evidence:
    - "src/services/errors/ServiceError.ts:14 — error codes defined"
    - "src/app/api/_helpers/serviceErrorToStatus.ts — maps to HTTP"
    - "src/components/canvas/JournalEntryForm.tsx:87 — catch block
      uses error.message string directly"
  file_paths:
    - "src/services/errors/ServiceError.ts"
    - "src/components/canvas/JournalEntryForm.tsx"
  cross_references:
    - "May also affect FRONTEND-003 (error boundary patterns)"
    - "Related to hypothesis H-07 (service-to-UI error contract)"
```

---

## Audit Metadata Fields

Written as the last step of each audit. Captures:

- Date the audit ran
- Phase at time of audit
- Session boundaries used (two-session collapsed, five-session, etc.)
- Claude model and mode for each phase
- Rough elapsed time per phase
- Deviations from prompt templates (e.g., "Performance scanner
  produced sparse findings as expected — 3 baseline items only")
- Known limitations of this specific audit (e.g., "run by same
  Claude instance that helped build Phase 1.1")
- Files examined (rough count or list)

---

## Cross-Audit Comparison (Phase 1.2+)

The `comparison-to-prior-audits.md` file is written by the Phase 3
synthesis agent. It answers:

1. Which prior-phase risks were addressed?
2. Which prior-phase risks grew in severity?
3. Which quick wins from the prior action plan were done?
4. Which action plan items were deliberately deferred?
5. What new categories of finding emerged?
6. What did the prior Foundation Readiness Assessment predict vs
   what actually happened?

This is where the recurring-practice value compounds. A single
audit produces findings. Two produce findings plus deltas. Three
produce findings, deltas, and trends.

---

## README.md Content Spec

The `docs/audits/README.md` covers:

1. **What this directory is.** Complementary to exit criteria and
   retrospectives, not a substitute.
2. **How to read an audit.** Start with `audit-report.md`, then
   `action-plan.md`, then `comparison-to-prior-audits.md`.
3. **How audits are generated.** Execution model summary, pointer
   to DESIGN.md, prompt templates in `prompts/`.
4. **Completed audits.** Reverse chronological, one-line summaries.
5. **Known limitations of the practice.** Accumulated across audits
   (e.g., "Performance scanner sparse until Phase 1.3").
