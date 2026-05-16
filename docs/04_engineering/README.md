# Engineering

**Document class: engineering.** Implementation surface
documents — git-clone-to-shipping. The canonical axis is
implementation-surface: setup, conventions, repo discipline, and
the operational layer between system design and per-phase
execution. Sub-domains (setup, rules, concerns) are content
groupings within the axis.

What goes here: developer setup guide, scripts reference, coding
conventions, branch naming, contribution rules. Canonical-source
files (per `CLAUDE.md`'s authoritative-source list):
`repo-rules.md` (repo shape, four-layer architecture statement),
`worktree-rules.md` (when/where worktrees, per-worktree
session-lock detail), `conventions.md` (branch naming,
contribution rules, codified-convention catalogs),
`delivery-model.md` (phase lifecycle, merge rules, branch sync,
flag posture).

What does NOT go here: system design (→ `/03_architecture/`),
invariant definitions (→ `/02_specs/`), per-phase execution
instructions (→ `/09_briefs/`).

Cross-references: `/03_architecture/` (system design, sibling
document class); `/02_specs/` (system truth); `/09_briefs/`
(per-phase execution); `/07_governance/adr/` (ratifying decisions).
