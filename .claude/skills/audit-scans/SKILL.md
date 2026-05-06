---
name: audit-scans
description: Discovery and routing for the audit framework. Points at the 12 existing prompt files under docs/07_governance/audits/prompts/ rather than duplicating their content.
trigger: When running a codebase audit, producing audit findings, or working through the process in `docs/07_governance/audits/DESIGN.md`.
---

# Audit Scans

**Canonical sources:**
- `docs/07_governance/audits/DESIGN.md` — audit framework design (four-phase C' execution model, session boundaries, category-collapse rules, findings format).
- `docs/07_governance/audits/prompts/` — the 12 prompt files that drive each phase.
- `docs/07_governance/audits/README.md` — how to read a completed audit.

This skill is a **discovery / router layer** on top of those files. The prompts are the content. **Do not duplicate the prompt contents here. Read the prompt file directly when running a scan.**

## The 12 prompts

| Phase | Prompt file | What it scans for / produces |
|---|---|---|
| 1 | `prompts/orientation.md` | Reads the codebase cold and produces 10–15 cross-cutting hypotheses — structured search targets that guide the category scanners to patterns they'd miss inside their category silo. |
| 2 | `prompts/scan-architecture-fit.md` | Architecture Fit. Also the **template** for the other scan prompts — shared structure, constraints, and output format. |
| 2 | `prompts/scan-backend-design.md` | Backend Design & API. |
| 2 | `prompts/scan-frontend-architecture.md` | Frontend Architecture. |
| 2 | `prompts/scan-data-layer.md` | Data Layer & Database Design. |
| 2 | `prompts/scan-security-compliance.md` | Security & Compliance. |
| 2 | `prompts/scan-code-quality.md` | Code Quality & Maintainability. |
| 2 | `prompts/scan-infrastructure-devops.md` | Infrastructure & DevOps. Sparse at early phases (no custom CI/CD yet) — may run as a collapsed scanner per DESIGN.md Category Collapse Rules. |
| 2 | `prompts/scan-observability-reliability.md` | Observability & Reliability. Sparse at early phases (Pino only, no metrics/tracing/alerting) — eligible for collapse. |
| 2 | `prompts/scan-performance-scalability.md` | Performance & Scalability. Sparse at early phases (no prod traffic, no load tests) — eligible for collapse. |
| 3 | `prompts/synthesis.md` | Deduplicates / merges findings across the nine category logs, verifies Phase 1 hypotheses (confirmed / disproved / missed), reads the retrospective last as a blind-spot check. |
| 4 | `prompts/write.md` | Composes the final `audit-report.md` and `action-plan.md` from the unified findings. |

## Intended flow

```
Phase 1: Orientation        → hypotheses.md
Phase 2: Category Scans     → findings/{category}.md  (one per category, parallel)
Phase 3: Synthesis          → unified-findings.md
Phase 4: Write              → audit-report.md + action-plan.md + audit-metadata.md
```

Per-phase effort budget, session boundaries, retrospective-access timing, and the "evidence not opinion" / "specificity over comprehensiveness" constraints live in `DESIGN.md`. Do not restate them here.

## How to use this skill

1. **Open `DESIGN.md`** to re-ground on the framework (model, constraints, findings format).
2. **Check `audits/README.md`** for the completed-audits index and any accumulated known-limitations of the practice.
3. **Run the appropriate prompt file verbatim** from `prompts/` — they are the authoritative instructions. This skill tells you *which* file; the file itself tells you *what to do*.
4. **Write outputs into** `docs/07_governance/audits/phase-{N}/` per the file layout in `DESIGN.md`.

## What this skill does NOT do

- **Does not duplicate prompt contents.** If the prompt changes, this skill should not need to change. If a prompt and this skill disagree, the prompt wins.
- **Does not encode per-audit state.** The completed-audits index lives in `audits/README.md`; historical findings live in each phase directory.
- **Does not replace `DESIGN.md`.** The framework document is authoritative for session boundaries, category-collapse rules, and cross-audit comparison policy.
