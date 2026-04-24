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
   tests. `pnpm test` is the full vitest suite; `pnpm test:e2e`
   runs the Playwright harness at `tests/e2e/` — see the
   `tests/e2e/README.md` for setup and founder review workflow.
2. Every doc you touched is still internally consistent: the leaf
   in `ledger_truth_model.md`, the rollup in `invariants.md`, the
   audit row in `control_matrix.md` if applicable, and
   cross-references between them.
3. Any non-obvious decision has a friction-journal entry or an
   ADR, per the rule in `docs/07_governance/adr/README.md`.

## Session execution conventions

Conventions for per-step execution that fire on specific scope
conditions. Rules here earn their place by multi-fire
codification threshold (typically 3+) — one-off patterns belong
in a retrospective or the friction-journal, not here.

### UI-session screenshot gate

Any step that ships UI changes requires a screenshot gate before
ratification.

1. Orchestrator drafts a prescribed capture sequence (typically
   2–5 shots) with per-shot verifications.
2. Founder captures against a fresh `pnpm db:reset:clean && pnpm
   db:seed:all` state to eliminate accumulated test pollution.
3. Orchestrator spot-checks each shot against the prescribed
   verifications.
4. Gate blocks arc / phase closeout until passed.

Typical triggers: new canvas views, table structure changes,
new clickability or navigation paths, visual discriminators on
entry types. Steps that touch only non-visible surfaces
(service logic, API routes, server-side guards) skip the gate.

Precedent: Arc A used this pattern 6 times (Steps 7, 8a, 8b,
9b, 10b, 12b). See
`docs/07_governance/retrospectives/arc-A-retrospective.md` §3
Pattern 2 for mechanism details.

### Push readiness three-condition gate

Push from the working branch to a shared branch requires three
conditions met. Any condition unmet holds the push.

1. **Test-suite health.** `pnpm test` full-suite green at HEAD,
   OR deviations documented with (a) mechanism, (b) fix shape,
   (c) explicit carry-forward framing (retrospective, friction-
   journal, or filed queue item). "Acceptable baseline" without
   these three artifacts is not a met condition.
2. **Doc-sync reconciled.** `invariants.md` ↔ `control_matrix.md`
   ↔ `ledger_truth_model.md` ↔ shipped code all consistent;
   bidirectional reachability diff clean (or flagged exceptions
   documented as Phase 2 stubs). `types.ts` regenerated against
   the post-arc schema. ADRs, obligations, and any other arc-
   affected governance docs reconciled.
3. **Governance closeout.** Retrospective written; friction-
   journal updated with arc-scope entries; any conventions
   earned by fire count codified in this file or filed for
   future codification with provenance.

Pre-push sanity sequence (run from working-branch HEAD):

```bash
git log --oneline origin/main..HEAD | wc -l    # or origin/staging..HEAD
git status --short                              # expect clean
pnpm agent:validate                             # 26/26 green
pnpm test                                       # Condition 1 evidence
pnpm typecheck                                  # green
```

Precedent: the framework had been operating tacitly across Arc
A and was codified at Arc A's push-readiness gate. Arc A's
closeout state (487/487 full suite green; doc-sync reconciled;
retrospective + friction-journal + convention codification
shipped) is the reference example of all three conditions met.
See `docs/07_governance/retrospectives/arc-A-retrospective.md`
for the arc provenance and §5 for the meta-observation on the
framework's implicit operation.

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
