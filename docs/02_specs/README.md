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

The spec-without-enforcement rule: an invariant only appears in
invariants.md if it has corresponding enforcement in code TODAY.
