# Specs

**Document class: specs.** System truth documents — the
constitution of the codebase. The canonical axis is system-truth:
post-ratification, enforcement-bearing rules. Pre-ratification
design specs live at `/09_briefs/<phase>/specs/` per ADR-0021;
this folder is the post-ratification side of the seam.

What goes here: invariants, data model definitions, ledger rules,
and any rule that has enforcement in code today. Each invariant
carries a stable INV-DOMAIN-NNN ID and a bidirectional pointer to
its enforcement in code. Canonical-source files (per `CLAUDE.md`'s
authoritative-source list): `ledger_truth_model.md`,
`data_model.md`, `invariants.md` (ledger truth);
`agent_autonomy_model.md`, `intent_model.md`,
`mutation_lifecycle.md` (agent governance); `glossary.md`,
`taxonomy.md` (meta).

What does NOT go here: architectural decisions about *why* a rule
exists (→ `/07_governance/adr/`), system design and component
relationships (→ `/03_architecture/`), pre-ratification design
specs (→ `/09_briefs/<phase>/specs/` per ADR-0021), or rules that
lack enforcement in code today (→ `/09_briefs/phase-1.2/obligations.md`
as gaps).

The folder holds rules for both the deterministic engine
(`ledger_truth_model.md`, `data_model.md`, `invariants.md`)
and the governance layer around the agent
(`agent_autonomy_model.md`, `intent_model.md`,
`mutation_lifecycle.md`). The ledger-truth vs agent-governance
distinction is a content grouping within the canonical axis, not
a second axis. Both share the spec-without-enforcement rule: a
reserved INV-ID may appear in a spec file but does not appear in
`invariants.md` until enforcement lands in code.

The spec-without-enforcement rule: an invariant only appears in
`invariants.md` if it has corresponding enforcement in code TODAY.

Cross-references: `/07_governance/adr/` (ratifying decisions);
`/03_architecture/` (system design, sibling document class);
`/09_briefs/<phase>/specs/` (pre-ratification specs);
`/09_briefs/` (per-phase execution).
