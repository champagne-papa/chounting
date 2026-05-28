# Branching and Feature Flag Strategy

How CHOUnting branches, merges, and gates runtime behavior. The
chosen model — **phase-scoped trunk-compatible development** —
sits between pure trunk-based development and long-lived feature
branches.

This doc consolidates the branching and feature-flag posture per
CTO Handoff v2 §4 + §1 + §8, references the existing branch /
commit / merge conventions in `docs/04_engineering/conventions.md`,
and forward-points to package-level flag organization that lands
when Phase 2 needs it.

**Canonical sources:**

- `docs/04_engineering/conventions.md` — branch naming, commit
  message format, Session Labeling Convention, Session Lock File
  Convention.
- `docs/07_governance/CTO_HANDOFF_V2.md` §1 (worktree strategy),
  §4 (authority-layer meaning + branching), §8 (feature flags in
  the new model).
- `docs/03_architecture/folder-structure.md` — the source-tree
  layout that phase work touches.
- `docs/02_specs/agent_autonomy_model.md` — Agent Ladder; the
  cognitive permission model that does NOT substitute for runtime
  rollout flags.
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
  — the substrate ADR for the source architecture phase work
  lands inside.

## The model: phase-scoped trunk-compatible development

CHOUnting is not pure trunk-based development. It is also not
long-lived feature branches. The chosen middle path:

- **`main`** is the canonical released state. Production deploys
  from `main`.
- **`staging`** is the integration trunk. Ongoing work merges
  here.
- **Phase branches** (`phase/0-governance`,
  `phase/1-storage-evidence-core`, etc.) are temporary
  governance / integration lanes that merge to `staging` at
  ratification.
- **Feature branches** off `staging` (`feat/<topic>-<date>`) are
  short-lived; they merge back to `staging` via PR.
- **Worktrees** (one per phase) live on the operator's machine
  and isolate concurrent phase work from each other.

Rules:

- Phase branches are temporary; they merge to `staging` at phase
  ratification, preferably `--no-ff` to preserve arc topology.
- Work happens in a dedicated worktree.
- Commits are small and frequent.
- Active phase branches regularly merge **from** `staging` via
  `git merge staging` (per Branch sync rules below) to prevent
  late-stage divergence.
- Incomplete runtime behavior is feature-flagged.
- `staging` → `main` happens periodically at release tags.
- `main` remains the canonical ratified state.

## The trunk-language convention

Across CHOUnting documentation, code comments, and prompts:

- **`main`** = production trunk (canonical released state).
- **`staging`** = integration trunk (ongoing work merges here).
- **Phase branches** merge to `staging` at ratification.
- **`staging` → `main`** happens periodically at release tags.

When a doc or prompt says "trunk" without qualifier, it means
`staging` (the integration trunk). When the conversation needs
the production trunk specifically, it says `main`. This avoids
ambiguity in cross-doc references.

## Branch naming

Per `docs/04_engineering/conventions.md` branch-naming convention:

- **Feature branches:** `feat/<topic>-<YYYY-MM-DD>` —
  e.g., `feat/arch-substrate-2026-05-05`,
  `feat/arch-rules-2026-05-05`. Date-stamping disambiguates
  concurrent feature work on the same topic.
- **Phase branches:** `phase/<number>-<descriptor>` —
  e.g., `phase/1-storage-evidence-core`,
  `phase/2-interaction-model`.
- **Hot-fix branches:** `hotfix/<topic>-<YYYY-MM-DD>` — for
  production hot-fixes that bypass the staging integration
  cadence.

The Session Labeling Convention (also in conventions.md) attaches
a `Session: <label>` Git trailer to every commit; the label is
the audit-trail dimension that lets `git log --grep='Session:
arch-substrate'` recover all commits authored by a specific
session.

## Merge discipline

- **Phase branch → `staging`:** `--no-ff` merge to preserve arc
  topology. The merge commit's body summarizes the phase's
  scope, ratification artifacts, and exit criteria. (Phase 0
  closure precedent: commit `45ba684` 2026-05-04, "Merge Phase 0
  governance arc (Sessions 2A-2F) into staging.")
- **Feature branch → `staging`:** PR-driven; merge or squash per
  scope. Substrate / governance commits prefer merge (preserve
  individual commits for audit). Routine code changes prefer
  squash.
- **`staging` → `main`:** Merge commit at release tags.
  Precedent: PR #2 (`v0.1.0-mvp` → `main` via `9f0ebb3`).
  Future releases continue this pattern.
- **Hotfix flow.** Primary path: `hotfix/<topic>-<date>` → `main`
  (merge directly to `main`), then `main` → `staging` (merge
  back, so the integration trunk stays current). If a hotfix
  branch must also be applied directly to `staging` (e.g., to
  unblock concurrent work that can't wait for the `main → staging`
  merge), fast-forward to `staging` is acceptable **only when
  the result produces the same patch as `main` and does not
  diverge from `main`**. The intended end state is `staging` at
  or ahead of `main` on the same hotfix; `staging` ahead of
  `main` on a different patch is a divergence and must be
  reconciled before the next release.

## Branch sync rules

How a branch stays current with its base trunk:

- **Active phase branches** sync from `staging` via
  `git merge staging` (or equivalently `git pull --no-rebase
  staging`). The merge preserves the phase branch's history.
- **Do NOT rebase a phase branch once it is shared** across
  sessions, worktrees, agents, or humans. Rebasing rewrites
  history that other sessions / worktrees may already have
  references to (commits sitting in checked-out worktrees,
  active `git diff staging...HEAD` snapshots in another
  session's working memory, dependent feature branches). The
  rewrite would invalidate those references and force every
  consumer to recover.
- **Rebase is allowed only** before the branch is shared (the
  branch lives in one worktree, has not been pushed, no other
  agent or human has checked it out) **or** for short-lived
  solo feature branches (`feat/<topic>-<date>` worked in a
  single session and merged the same day).
- **Feature branches** off `staging` follow the same rule: if
  the branch has been pushed and any other party may pull it,
  `git merge staging` is the safe sync; rebase is allowed only
  before sharing.

The discipline composes with the Session Lock File Convention:
the lock prevents commit-interleave within a single checkout;
the no-rebase-shared-branches rule prevents history-rewrite
hazards across checkouts.

## Worktree strategy

Worktrees isolate concurrent phase work. The current convention
(2026-05-05 baseline) places worktrees at:

```
/home/philc/projects/chounting/                        # primary checkout (staging)
/home/philc/projects/chounting/.claude/worktrees/      # current worktree home
  phase-0-governance/
  phase-1-storage-evidence-core/
```

The CTO Handoff v2 §1 aspirational target relocates worktrees
out of `.claude/`:

```
~/projects/chounting/                                  # primary checkout
~/projects/chounting-worktrees/                        # aspirational worktree home
  phase-0-governance/
  phase-1-storage-evidence-core/
  phase-2-...
```

**Status of the relocation:** flagged as **aspirational**;
**not actioned in the 2026-05-05 substrate session** per ADR-0020
Out of Scope. Relocation is opportunistic — it can land in a
follow-on session when concurrent phase work creates the
operational pressure to move worktrees out of `.claude/`. The
current `.claude/worktrees/` location works.

A worktree's branch is the phase branch (`phase/1-storage-evidence-core`)
or a feature branch off staging (`feat/arch-substrate-2026-05-05`).
Worktrees are not committed to git; they're created with
`git worktree add <path> <branch>` per phase / feature.

## Commit cadence within a session

Per `docs/04_engineering/conventions.md` Session Lock File
Convention + Session Labeling Convention:

- Every session opens with `bash scripts/session-init.sh
  <label>` to acquire a session lock.
- Every commit carries a `Session: <label>` Git trailer placed
  just before `Co-Authored-By: Claude …`.
- The pre-commit hook refuses commits whose `COORD_SESSION`
  environment variable doesn't match the active lock's label —
  foreign-session commits are blocked at commit time.
- Session end runs `bash scripts/session-end.sh` to remove the
  lock.

Commit cadence within a session is small and frequent: one
commit per logical unit of work, not one commit per session.
Substrate sessions (like this 2026-05-05 architecture-substrate
session) may produce one commit at session close (a single
substrate ratification), or multiple commits for unrelated
substrate units (like the gitignore correction co-landing with
the ADR-0020 ratification).

## Feature flags in the new model

Per CTO Handoff v2 §8, feature flags **gate runtime behavior**
but they are **not the source of authority**. Flags can hide or
expose behavior; they do NOT prevent invalid behavior. The
authority hierarchy:

| Layer | Mechanism | Role |
|---|---|---|
| 1 (DB) | DB CHECK constraints, RLS, triggers | bedrock invariants |
| 2 (Service) | `withInvariants`, INV-* leaves, structured errors | deterministic authority |
| 3 (Agent) | tool contracts, dry-run discipline, six anti-hallucination rules | proposal-only |
| 4 (Governance) | Agent Ladder (3 rungs), limit model, System ceiling | cognitive permission |
| Runtime rollout | feature flags | rollout control |

A feature flag turns a feature on or off **for users**. A service
invariant decides whether a mutation is **legal at all**. A flag
that exposes an illegal mutation is still illegal; the database
still rejects it. A flag that gates a legal mutation off is fine
— users just don't see it.

**The non-substitution rule:** flags do NOT replace:

- **Agent Ladder policy.** Flag gating "show / hide an agent
  feature for a user cohort" is fine. Flag substituting "this
  user is Always Confirm but the flag turns it Silent Auto" is
  illegal — autonomy is governed by the Agent Ladder spec, not
  by flags.
- **Service invariants.** Flag substituting "this user can post
  to a locked period" is illegal — INV-LEDGER-002 fires at the
  trigger layer regardless of flag state.
- **DB constraints.** Flag bypassing a CHECK constraint is
  illegal — the constraint fires at commit time regardless of
  flag state.
- **Audit logging.** Flag suppressing an audit-log emission is
  illegal — INV-AUDIT-001 fires inside the same transaction as
  the data mutation.

**Flag ownership.** Per CTO Handoff v2 §8, flags live at:

```
packages/flags/                          # forward-looking; ships when Phase 2 needs it
└── src/
    ├── accounting.ts                    # ledger, reporting flags
    ├── evidence.ts                      # storage, document flags
    ├── agent.ts                         # agent tool gating, Ladder rung gating
    ├── onboarding.ts                    # first-run org setup flags
    ├── rollout.ts                       # cohort / ramp / retirement flags
    └── index.ts
```

The package does NOT exist at v1 ratification time per ADR-0020
Out of Scope. Phase 1's storage feature flags (if any) live
inline per current convention; the shared package materializes
when Phase 2's interaction model extraction needs cross-package
flag access.

**Flag naming.** Snake_case feature-flag identifiers organized by
domain prefix:

- `evidence_storage_v1`
- `document_upload_enabled`
- `agent_document_upload_tool_enabled`
- `agent_ledger_posting_tool_enabled`
- `agent_autonomy_controls_ui_enabled`
- `ledger_posting_enabled`
- `balanced_entry_required_for_posting`

Per the flag-naming rule in `delivery-model.md`, flag names
expose rollout / UI surfaces, never determine authority. A flag
like `agent_ladder_rung_2_enabled` would conflate rollout with
the Agent Ladder's promotion ceremony and is forbidden.

## How a phase touches the authority layers

A delivery phase is not a folder; it is a **slice through the
authority layers**. Phase 1 (Storage / Evidence Core) example:

| Authority layer | Phase 1 touches |
|---|---|
| `app/` | `app/[locale]/[orgId]/(workflows)/intake/` (when intake UI ships) |
| `agent/tools/` | `agent/tools/evidence/` (when evidence tools ship) |
| `contracts/agent-tools/` | `contracts/agent-tools/evidence/` (when evidence contracts ship) |
| `services/` | `services/storage/`, `services/evidence/` (Phase 1 chunk 1 lands here) |
| `core/` | `core/evidence/` (pure evidence rules extract here) |
| `db/` | `db/repositories/evidenceRepository.ts` (when first repo lands) |
| `supabase/migrations/` | new migrations for evidence-related tables |
| `packages/flags/` | `packages/flags/src/evidence.ts` (when packages/flags ships) |
| `docs/09_briefs/phase-1/` | phase brief, exit criteria, retrospective |

The branch (`phase/1-storage-evidence-core`) holds the cross-layer
work; the worktree isolates it from concurrent phase work; the
phase merges to `staging` at phase ratification with a `--no-ff`
merge that preserves the arc.

## Push-readiness gate (three conditions)

Per the Push readiness three-condition gate codified in CLAUDE.md:

1. **Test-suite health.** `pnpm test:full` green at HEAD,
   OR deviations documented with mechanism + fix shape +
   carry-forward framing.
2. **Doc-sync reconciled.** `invariants.md` ↔
   `control_matrix.md` ↔ `ledger_truth_model.md` ↔ shipped code
   all consistent; `types.ts` regenerated; ADRs and obligations
   reconciled.
3. **Governance closeout.** Retrospective written; friction-
   journal updated with arc-scope entries; conventions earned
   by fire count codified.

The gate applies to phase-branch → `staging` pushes. Substrate
sessions (like 2026-05-05) follow a lighter version: typecheck +
lint + agent:floor + build, plus the founder review gate before
commit.

## Cross-references

- `docs/04_engineering/conventions.md` — branch naming, commit
  format, Session Labeling Convention, Session Lock File
  Convention.
- `docs/07_governance/CTO_HANDOFF_V2.md` §1 (worktree strategy),
  §4 (branching language), §8 (feature flags), §10 (delivery
  phases).
- `docs/03_architecture/folder-structure.md` — the source layout
  phase work touches.
- `docs/03_architecture/product-workflow-delivery-mapping.md` —
  the four-maps matrix (product, workflow, delivery, runtime).
- `docs/03_architecture/agent-ladder.md` — the cognitive
  permission model that flags do NOT substitute for.
- ADR-0020 — Agent-First Authority-Gradient Source Architecture
  (the substrate within which phase work lands).
- `docs/02_specs/agent_autonomy_model.md` — Agent Ladder spec.

## Out of scope for the 2026-05-05 substrate session

- **Worktree relocation** to `~/projects/chounting-worktrees/` —
  flagged aspirational; not actioned. Operational pressure (e.g.,
  concurrent phase work that strains `.claude/worktrees/`) is
  the trigger for relocation.
- **`packages/flags/` introduction** — deferred until Phase 2
  needs the shared package.
- **B.5 rules-substrate docs** (`repo-rules.md`,
  `worktree-rules.md`, `delivery-model.md`) — deferred to
  follow-on session `feat/arch-rules-2026-05-05` after ADR-0020
  ratifies.
