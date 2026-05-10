# Architecture

**Document class: architecture.** System design documents — how
the pieces fit together. The canonical axis is system-design:
component relationships, decomposition surfaces, request
lifecycles, and the architectural framing the codebase
implements. Decomposition surfaces (system, codebase, agent,
phase) are content groupings within the axis.

What goes here: system overview, component relationships, request
lifecycle diagrams, phase simplifications (the most important doc
in this folder — explains why Phase 1 looks different from Phase
2). Canonical-source files (per `CLAUDE.md`'s authoritative-source
list): `folder-structure.md` (ADR-0020 ratified, source-tree
authority-layer architecture), `authority-gradient.md` (the
four-layer authority framing), `phase_simplifications.md` (Phase
1 vs Phase 2 deltas).

What does NOT go here: invariant definitions (→ `/02_specs/`),
implementation setup (→ `/04_engineering/`), or UI/agent
architecture details that are phase-specific (→ `/09_briefs/`).

Cross-references: `/02_specs/` (system truth, sibling document
class); `/04_engineering/` (implementation surface); `/09_briefs/`
(per-phase execution); `/07_governance/adr/` (ratifying decisions).
