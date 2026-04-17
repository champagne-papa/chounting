# Specs

System truth documents — the constitution of the codebase.

What goes here: invariants, data model definitions, ledger rules,
and any rule that has enforcement in code today. Each invariant
carries a stable INV-DOMAIN-NNN ID and a bidirectional pointer to
its enforcement in code.

What does NOT go here: architectural decisions about *why* a rule
exists (→ /07_governance/adr/), system design and component
relationships (→ /03_architecture/), or rules that lack enforcement
in code today (→ /09_briefs/phase-1.2/obligations.md as gaps).

The folder holds rules for both the deterministic engine
(`ledger_truth_model.md`, `data_model.md`, `invariants.md`)
and the governance layer around the agent
(`agent_autonomy_model.md`, `intent_model.md`,
`mutation_lifecycle.md`). Both share the spec-without-enforcement
rule: a reserved INV-ID appears in a spec file but does not
appear in `invariants.md` until enforcement lands in code.

The spec-without-enforcement rule: an invariant only appears in
invariants.md if it has corresponding enforcement in code TODAY.
