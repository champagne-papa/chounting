# CLAUDE.md — The Bridge

@AGENTS.md

This file carries the **standing rules** loaded every session.
**Root explains, docs justify, skills specialize, scripts execute.**
Long-form reasoning lives in `docs/02_specs/`; ADRs in
`docs/07_governance/adr/`. `docs/INDEX.md` maps the full tree.
When a rule is unclear or a situation is not covered, stop and
flag it in `docs/02_specs/open_questions.md` — do not guess.

## Navigation — tier-1 always-relevant

- **`docs/02_specs/ledger_truth_model.md`** — the 20 invariants.
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

## Project rules and vocabulary

Canonical sources for project-wide rules across concerns
(repo shape, worktrees, delivery, vocabulary):

- `docs/04_engineering/repo-rules.md` — repo shape, four-layer
  architecture, cross-reference table.
- `docs/04_engineering/worktree-rules.md` — when to use a
  worktree, where they live, per-worktree session-lock detail.
- `docs/04_engineering/delivery-model.md` — phase lifecycle,
  merge rules, branch sync, flag posture.
- `docs/03_architecture/folder-structure.md` — source-tree
  architecture (ADR-0020).
- `docs/03_architecture/authority-gradient.md` — the four-
  layer authority framing.
- `docs/02_specs/glossary.md` — product / workflow / delivery
  vocabulary.
- `docs/04_engineering/conventions.md` — top-level index;
  topical conventions live under `docs/04_engineering/conventions/`.

### Folder placement guardrails

Three surface guardrails ratify Principle 3 (folder placement
guardrails at high-decision-cost structural surfaces) per
`docs/07_governance/DOCS_RESTRUCTURE_V2.md` Part 1:

- **`apps/web/src/README.md`** — source-tree authority-layer
  guardrail per ADR-0020.
- **`docs/README.md`** — docs-tree document-class guardrail.
- **Repo-root `README.md`** — repo-root structural-folder
  guardrail.

Before creating any folder at one of these surfaces, read the
relevant guardrail. AI agents may not unilaterally bypass without
operator acknowledgment in the commit body (per the Pattern 7
bypass procedure in `docs/README.md`).

## Codification routing

When a friction-journal pattern has fired observation-grain N≥3
and is graduating to a codified convention, invoke the
`codify-convention` skill before authoring the codification block.
The skill walks the routing decision tree, picks the destination
file, and drafts the codification block with origin metadata.
Canonical routing rule:
`docs/04_engineering/conventions/README.md` "Routing rule" +
"Routing decision tree".

Four redundant pointers per v2.2 §10.5:

1. This section.
2. `docs/04_engineering/conventions/README.md` (canonical).
3. `.claude/skills/codify-convention/SKILL.md`.
4. `.claude/rules/docs-codification.md` (path-scoped at
   codification surfaces).

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
- `codify-convention/` — explicit invocation at codification time
  (see "Codification routing" above).

Path-scoped rules at `.claude/rules/` (3-file pilot:
`services.md`, `migrations.md`, `docs-codification.md`) fire when
matching files are read or opened during work. See
`docs/04_engineering/conventions/README.md` "Routing rule" for the
full mechanism.

## What "done" means

1. `pnpm agent:validate` passes — runs typecheck, the
   no-hardcoded-URLs grep check, and the Category A floor test
   suite. `pnpm test` is the full vitest suite; `pnpm test:e2e`
   runs the Playwright harness at `tests/e2e/` — see the
   `tests/e2e/README.md` for setup and founder review workflow.
   `pnpm lint` is a separate ESLint sweep with non-overlapping
   scope; see `docs/04_engineering/conventions/lint-and-validation.md`
   for the discipline.
2. Every doc you touched is still internally consistent: the leaf
   in `ledger_truth_model.md`, the rollup in `invariants.md`, the
   audit row in `control_matrix.md` if applicable, and
   cross-references between them.
3. Any non-obvious decision has a friction-journal entry or an
   ADR, per the rule in `docs/07_governance/adr/README.md`.

## Standing session principles

Rules here fire every session or every session that does X-shape
common work (code editing, push-readiness, doubt escalation).
Rules that fire on specific activities (scope-lock, plan-authoring,
session-close) live in `docs/04_engineering/conventions/session/`.
Rules that fire on file globs live in `.claude/rules/` (pilot).

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

**Push-terminal-close timing pattern.** The three-condition gate
above fires at phase retrospective close — the canonical timing
when intermediate phase-work commits stay local on the working
branch until the retrospective drafting cycle's three-commit
ceremony (Commit A T3 + Commit B T4 + Commit C T1) lands and
all three conditions are met. Intermediate chunk-impl commits
(Sessions M-N where M+1..N are chunk implementations) bank
locally; push fires at Session N+1 retrospective close after
Commit C. Codified as cross-phase N=3 pattern at Phase 7
retrospective close per Phase 5.1 + Phase 6.5 + Phase 7
precedent.

How to apply: when a phase implementation cycle closes (last
chunk-impl session), the next session is retrospective drafting
+ terminal-close push. Mid-phase pushes are anti-pattern unless
the three-condition gate genuinely fires (operationally rare;
the gate's Condition 3 governance closeout requires retrospective
written — by definition not satisfied mid-phase). The pattern's
cost is a stale `origin/staging` between phase closes; the
benefit is one push event per phase carrying a coherent
retrospective + codifications + chunk-impl bundle, easier to
review and easier to roll back atomically if a retrospective
discovers a substrate gap requiring follow-up.

Codification provenance: Phase 5.1 retrospective drafting cycle
+ Phase 6.5 retrospective drafting cycle + Phase 7 retrospective
drafting cycle (N=3 cross-phase). Phase 7 banked the codification
candidate as Candidate #13 per §6 carry-forward observation #4.

### UI-session screenshot gate

UI-session arc/phase closeout requires a screenshot capture sequence
before ratification. Full discipline (four-step procedure + Arc A
precedent): `.claude/skills/ui-session-screenshot-gate/SKILL.md`.

### Multi-line Edit anchor confirmation (Z1 #11.a)

When an Edit's `oldText` anchor spans multiple lines, grep-only
verification of the anchor underspecifies whitespace and line-
continuation handling. The Edit tool matches against exact bytes
including trailing whitespace, line-break characters, and any
soft-wrap artifacts that grep normalization elides. The discipline:
before dispatching a multi-line Edit, Read the target block to
confirm the exact bytes the Edit will match against, then construct
`oldText` from that read rather than from grep output or memory.

Mechanism: grep returns line-content matches; Edit operates on
byte-level matches that include line terminators and surrounding
context. The two views diverge whenever the file uses inconsistent
trailing whitespace, mixed line-endings, or wrap-discipline
variations across paragraphs.

Trigger: any Edit whose `oldText` spans more than one line.
Single-line `oldText` does not require the discipline; grep
verification of single-line uniqueness remains sufficient.

Precedent: Phase 0 governance arc Sessions 2A-2F. Codified at
Session 2F closeout (Observation 6 path α) as Z1 #11 sub-pattern.
Full Z1 catalog at
`docs/09_briefs/phase-2/2026-05-04-session-2f-closeout.md` §4.

### Substrate-receipt discipline (pointer to canonical home)

Verify substrate against disk at substrate-receipt grain — wherever
substrate-receipt lives (impl-onset, session-onset, retrospective-
scoping, downstream-consumption, plan-authoring). Full discipline
including the 7-sub-grain catalog:
`docs/04_engineering/conventions/session/scope-lock.md`
§Verify-from-disk-at-non-standard-grain pattern.

### Prediction grounding (pointer to canonical home)

When encoding a prediction about future behavior or a parameter
value that asserts a constraint on data shape — in specs, plans,
prompts, ADRs, briefs, or regex parameters — ground the prediction
against empirical evidence at write time. When grounding isn't
feasible, explicitly mark as ungrounded and document the
verification step that will check. Full discipline:
`docs/04_engineering/conventions/prediction-grounding.md`.

**Paired with** `regex-permissive-matching` (below) for the
design-time-vs-resolution-time split: design-time cost-class
enumeration lives there; resolution-time empirical grounding lives
here. The pairing is part of the discipline's shape — encountering
one convention, look for the other.

Codified at Phase 6.5, 2026-05-19, from N=3 observation-grain
banking across spec-caveat-writing, parameter-setting, and
prompt-authoring surfaces. The convention's "stop, surface,
explain" operational guidance for verification-fire-on-divergence
holds across all three surfaces.

### Regex permissive-matching cost classes (pointer to canonical home)

When designing a regex with permissive matching against non-trivial
input populations, anticipate cost classes beyond the classical
noise/signal split: over-match into similar-shaped strings,
character-class incompleteness collapsing distinguishable subgroups,
priority-ordered preemption hiding real signal. Full discipline:
`docs/04_engineering/conventions/regex-permissive-matching.md`.

**Paired with** `prediction-grounding` (above) for the design-time-
vs-resolution-time split: enumerate cost classes at design time
here; ground discriminators empirically at fix time via
prediction-grounding. The pairing is part of the discipline's
shape — encountering one convention, look for the other.

Codified at Phase 6.5, 2026-05-19, from N=3 distinct cost classes
observed in the friction-pattern-detector's bucket-extraction
logic. The cost classes have general analogs in regex permissive
matching beyond this project (URL/path regex over-match; hostname/
version regex character-class collapse; tokenizer/parser
priority-ordered shadowing).

## Phase 1 Simplifications

Phase 1 ships three temporary simplifications (synchronous audit
log, reserved-seat `events` table, agents-collapsed-to-services).
Each has a named Phase 2 correction. Do not re-architect around
them as if they were permanent. See
`docs/03_architecture/phase_simplifications.md`.

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
