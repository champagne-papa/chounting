# CLAUDE.md — The Bridge

@AGENTS.md

This file carries the **standing rules** loaded every session.
**Root explains, docs justify, skills specialize, scripts execute.**
Long-form reasoning lives in `docs/02_specs/`; ADRs in
`docs/07_governance/adr/`. `docs/INDEX.md` maps the full tree.
When a rule is unclear or a situation is not covered, stop and
flag it in `docs/02_specs/open_questions.md` — do not guess.

## Navigation — tier-1 always-relevant

- **`docs/02_specs/ledger_truth_model.md`** — the 17 invariants.
  Full leaves, Phase 2 evolution notes, interactions. Tiebreaker
  for ledger legality.
- **`docs/02_specs/agent_autonomy_model.md`** — the agent
  governance layer: Agent Ladder (three rungs), limit model (four
  dimensions), policy decision tree.
- **`docs/09_briefs/CURRENT_STATE.md`** — where the project is
  right now.
- **`docs/07_governance/friction-journal.md`** — the war diary.
- **`docs/INDEX.md`** — one-line-per-file map of everything else
  (ADRs, data model, glossary, phase simplifications,
  architecture, engineering, briefs).

## On-demand rules — load when touching the relevant area

Skills in `.claude/skills/` summarize and point; canonical leaves
remain authoritative. Load by trigger:

- `journal-entry-rules/` — journal entries, reversals, money
  arithmetic, or `journalEntryService`.
- `service-architecture/` — files under `src/services/`, API route
  handlers, or agent tools that mutate data.
- `agent-tool-authoring/` — files under `src/agent/tools/`,
  `src/agent/orchestrator/`, or `src/agent/prompts/`.
- `integration-test-rules/` — files under `tests/integration/` or
  running Category A floor tests.
- `audit-scans/` — running a codebase audit or working through
  `docs/07_governance/audits/DESIGN.md`.

## What "done" means

1. `pnpm agent:validate` passes — runs typecheck, the
   no-hardcoded-URLs grep check, and all five Category A floor
   tests.
2. Every doc you touched is still internally consistent: the leaf
   in `ledger_truth_model.md`, the rollup in `invariants.md`, the
   audit row in `control_matrix.md` if applicable, and
   cross-references between them.
3. Any non-obvious decision has a friction-journal entry or an
   ADR, per the rule in `docs/07_governance/adr/README.md`.

## Phase 1 Simplifications

Three Phase 1 simplifications (synchronous audit log,
reserved-seat `events` table, agents-collapsed-to-services) are
temporary. Each has a named, scheduled Phase 2 correction. **Do
not re-architect around them as if they were permanent.** See
`docs/03_architecture/phase_simplifications.md` for the full
simplification table.

## When in doubt

- If a situation is not covered by this file, the skills in
  `.claude/skills/`, or the canonical docs in `docs/02_specs/`,
  flag it in `docs/02_specs/open_questions.md`. **Do not guess.**
- If something in this file contradicts the canonical docs or an
  ADR, the canonical doc or ADR wins — this file is wrong and
  should be fixed here, with a friction-journal entry recording
  the fix.
- Code that deviates from the canonical docs during a session is
  wrong unless an ADR is written to update them first. The ADR
  comes before the code, not after.
- The leaves in `ledger_truth_model.md` and the ADRs are the
  tiebreakers for their respective domains: leaves win for
  invariant questions, ADRs win for architectural decisions.
