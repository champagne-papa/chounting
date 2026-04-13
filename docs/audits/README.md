# Audits

Comprehensive technical audits of The Bridge (chounting). Run at
the end of every major phase. Complementary to exit criteria and
retrospectives, not a substitute.

## How to read an audit

1. **Start with `audit-report.md`** — nine category assessments,
   risk map, Foundation Readiness verdict.
2. **Then `action-plan.md`** — prioritized items referencing the
   report's findings. Includes an explicit "Do Not Do" list of
   consciously accepted risks.
3. **Then `comparison-to-prior-audits.md`** (Phase 1.2 onward) —
   what changed since the last audit. This is where the recurring-
   practice value compounds.

## How audits are generated

Four-phase execution model (see `DESIGN.md` for full details):

1. **Orientation** — one agent reads the codebase cold, produces
   cross-cutting hypotheses
2. **Category Scans** — one agent per category, running in
   parallel, each producing a structured findings log
3. **Synthesis** — one agent deduplicates and cross-references
   all findings, verifies hypotheses
4. **Write** — one agent composes the audit report and action plan

Prompt templates live in `prompts/`. Nine category scan prompts,
plus orientation, synthesis, and write.

## Completed audits

_(None yet. Phase 1.1 audit is the first execution of this
framework.)_

## Known limitations of the practice

- **Self-audit.** The same Claude instance that builds the codebase
  runs the audit. Bias is acknowledged in each audit's metadata
  and category summaries. The orientation phase's cold-read
  constraint and the synthesis phase's delayed-retrospective-read
  are structural mitigations, not eliminators.
- **Sparse categories.** Infrastructure & DevOps, Observability &
  Reliability, and Performance & Scalability produce sparse
  findings until the project has production traffic, CI/CD
  pipelines, and observability infrastructure. These categories
  run as a collapsed scanner at early phases (see DESIGN.md
  Category Collapse Rules).
- **No external validation.** Findings are not cross-checked
  against an external auditor or pen test. The practice produces
  internal assessments only.
