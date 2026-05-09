# Governance

The project's institutional memory: decisions, friction, audits,
retrospectives, handoffs.

## Subdirectories

- `adr/` — Architecture Decision Records. Written in anger, not
  preemptively. See `adr/README.md` for format, frontmatter
  schema (ADR-0021+), pre-ratification design spec lifecycle,
  and the generated current-ADR / by-module / by-invariant /
  by-phase index.
- `audits/` — Technical code-audit framework (`DESIGN.md` +
  `prompts/` + per-audit-run subfolders, currently
  `phase-1.1/` and `phase-1.2/`). Distinct from `docs/06_audit/`
  — that folder holds financial-controls / SOX-style invariant
  enforcement evidence (`control_matrix.md`); this folder holds
  technical audits of the codebase (architecture / code quality /
  security / performance scans).
- `friction-journal/` — Closed-phase friction-journal archives
  (`phase-1.1.md`, `phase-1.2.md`, `phase-1.5.md`, `arc-A.md`).
  Active-phase entries live in `friction-journal.md`; closed
  phases archive here per the Documentation Routing convention's
  archival rule.
- `retrospectives/` — Per-phase and per-arc retrospectives
  (`phase-1.1-retrospective.md`, `phase-1.2-retrospective.md`,
  `arc-A-retrospective.md`).

## Files at top level

- `CTO_HANDOFF_V2.md` — agent-first authority-gradient source
  architecture handoff. Ratified into ADR-0020 (substrate-only
  v1; ESLint rule activates at Phase 1 chunk 1). Cited verbatim
  by ADR-0020 Appendix A.
- `friction-journal.md` — append-only war diary for the active
  phase. WANT / CLUNKY / WRONG / NOTE entries; 10-second-rule
  format per `docs/04_engineering/conventions.md` Documentation
  Routing. AI agents may append.

## What does NOT live here

- **Open questions** live at
  [`docs/02_specs/open_questions.md`](../02_specs/open_questions.md)
  — the canonical location. An earlier version of this README
  listed `open_questions.md` as a child file of this folder,
  which was wrong; corrected during round-2 docs reorganization
  Session 4 (2026-05-08).
- **Phase-specific operational artifacts** (e.g., paid-API
  verification prompt sets) live under their phase folder in
  `docs/09_briefs/phase-N/`, not here. Example: the EC-2
  Prompt Set (Phase 1.2 Session 8 Commit 6) lives at
  [`docs/09_briefs/phase-1.2/ec-2-prompt-set.md`](../09_briefs/phase-1.2/ec-2-prompt-set.md);
  it was moved out of this folder during round-2 Session 4.
- **Retrospectives** that pre-date this restructure are in
  `retrospectives/`; phase briefs themselves live under
  `docs/09_briefs/`.

## Modification rules

AI agents may append to `friction-journal.md`. All other files
in this folder — including ADRs, retrospectives, audit
artifacts, and `CTO_HANDOFF_V2.md` — require explicit human
approval to create or modify.

## Cross-references

- [`docs/04_engineering/conventions.md`](../04_engineering/conventions.md)
  § Documentation Routing — archival rule + write-time tripwires
  + codification thresholds.
- [`docs/INDEX.md`](../INDEX.md) — full doc-tree map; this folder
  appears under `## 07_governance` with subsection breakouts.
- [`docs/04_engineering/repo-rules.md`](../04_engineering/repo-rules.md)
  — four-layer architecture statement; this folder is the
  "docs" tier's governance home.
