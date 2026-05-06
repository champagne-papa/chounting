# Skills — On-demand rule packs

Root explains, docs justify, skills specialize, scripts execute.

Skills live here so standing rules that only apply to specific code
areas load on demand instead of occupying token budget in every
session. Each skill opens with a pointer to its canonical source in
`docs/`; the skill summarizes, the canonical doc is authoritative.

Project-wide rules (repo shape, worktree discipline, delivery
model, product / workflow / delivery vocabulary) live in `docs/`,
not in skills. Skills specialize on technical areas (services,
agent tools, audit scans, journal entries, integration tests).
The rules a skill summarizes always have a canonical source in
`docs/`; the skill is a token-economy summary, the doc is
authoritative. See `docs/04_engineering/repo-rules.md` for the
canonical-source cross-reference table.

## Index

| Skill | Trigger |
|---|---|
| [`journal-entry-rules/`](./journal-entry-rules/SKILL.md) | Work touching journal entries, reversals, money arithmetic, or `journalEntryService`. |
| [`service-architecture/`](./service-architecture/SKILL.md) | Work adding or modifying files under `src/services/`, API route handlers, or agent tools that mutate data. |
| [`agent-tool-authoring/`](./agent-tool-authoring/SKILL.md) | Work adding or modifying files under `src/agent/tools/`, `src/agent/orchestrator/`, or `src/agent/prompts/`. |
| [`integration-test-rules/`](./integration-test-rules/SKILL.md) | Work in `tests/integration/` or when running Category A floor tests. |
| [`audit-scans/`](./audit-scans/SKILL.md) | When running a codebase audit, producing audit findings, or working through the process in `docs/07_governance/audits/DESIGN.md`. |

## Authoring rule

If a rule's canonical source changes, does the skill need to change
too? If yes, the skill is duplicating — rewrite it as a summary plus
a pointer. Skills should go stale only when the *framing* they offer
stops being useful, not when the underlying rule evolves.

## Source-tree organization

Per ADR-0020 (2026-05-05), the source tree under `apps/web/src/`
is organized by authority layer (`agent/`, `contracts/`,
`services/`, `core/`, `db/`, `app/`, `components/`). Skills here
may summarize and cross-reference; they do not duplicate ADR-0020
or the architecture docs under `docs/03_architecture/`. When a
skill's guidance interacts with the source-tree boundary (e.g.,
the `service-architecture` skill's `withInvariants` rule scoped to
`services/`, the `agent-tool-authoring` skill's contract home),
the authoritative source is ADR-0020 plus the relevant doc under
`docs/03_architecture/`.
