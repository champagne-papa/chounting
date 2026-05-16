# Repo Rules

Operational rules for working within the chounting monorepo.
Complementary to `docs/03_architecture/monorepo.md` (which covers
monorepo structure and rationale). This doc covers operational
discipline: where things live, what stays out, the four-layer
architecture that organizes rules across the repo, and where to
find canonical sources for each concern.

This doc points; the canonical sources remain authoritative. If
this doc disagrees with a canonical source, the canonical source
wins — fix this doc, with a friction-journal entry recording the
fix.

## Canonical sources

- `docs/03_architecture/monorepo.md` — monorepo layout
- `docs/03_architecture/folder-structure.md` — `apps/web/src/`
  source tree (ADR-0020)
- `docs/04_engineering/conventions.md` — contribution conventions
- `docs/04_engineering/worktree-rules.md` — worktree discipline
- `docs/04_engineering/delivery-model.md` — phase-branch / merge
  / ratification rules
- `docs/02_specs/glossary.md` — Workflow Vocabulary, Product
  Vocabulary, and Delivery Vocabulary
- `docs/07_governance/adr/0020-agent-first-authority-gradient-source-architecture.md`
- `.claude/skills/README.md` — four-layer architecture statement

## Repo top-level rules

Where things live:

- **Source code:** `apps/web/`, `apps/demo/`, `packages/ui/`,
  `packages/tokens/`. Future packages emerge under `packages/`
  when extraction is justified by use across multiple consumers
  (per `docs/03_architecture/monorepo.md` migration path:
  `apps/demo/` → `packages/ui/` → `apps/web/`).
- **Documentation:** `docs/` with the numbered hierarchy
  (`00_product/`, `01_prd/`, `02_specs/`, `03_architecture/`,
  `04_engineering/`, `05_operations/`, `06_audit/`,
  `07_governance/`, `08_releases/`, `09_briefs/`, `99_archive/`).
  See `docs/INDEX.md` for the file-level map.
- **Worktrees:** `~/projects/chounting-worktrees/<phase-name>/`
  is the target per ADR-0020. The current Phase 0 worktree at
  `.claude/worktrees/phase-0-governance/` is grandfathered until
  opportunistic relocation. See `worktree-rules.md` for the full
  rulebook.
- **Session-coordination state:** `.coordination/session-lock.json`
  (gitignored when active; per-checkout — see `worktree-rules.md`
  for the per-worktree clarification).
- **Claude operational state:** `.claude/` (`settings.json`
  tracked; `skills/` tracked since the 2026-05-05 governance
  correction; `worktrees/` may contain grandfathered checkouts;
  `settings.local.json` remains gitignored as personal
  preference).
- **Build / DB / lint scaffolding:** `supabase/` (local project
  config + migrations), `scripts/` (cross-cutting bash; session
  lifecycle, install hooks, validate, floor), `eslint-rules/`
  (custom services-layer plugin), `tests/` (integration + e2e).

## What does NOT live in the repo root

- **Worktrees** — target is outside the repo at
  `~/projects/chounting-worktrees/<phase-name>/`. Do not create
  `./worktrees/` inside the repo without first adding it to
  `.gitignore` (otherwise the worktree's working tree gets read
  as part of the parent checkout's git status). The grandfathered
  Phase 0 worktree at `.claude/worktrees/phase-0-governance/` is
  the explicit exception per ADR-0020; do not extend the pattern.
- **Per-developer scratch files** — use `~/scratch/` or a
  gitignored personal directory; never commit personal scratch
  into the repo. If a session produces an artifact you want to
  keep, route it via the Documentation Routing convention
  (`docs/04_engineering/conventions.md` → "Documentation
  Routing"), not the repo root.
- **Generated build artifacts** — `.turbo/`, `.next/`,
  `node_modules/`, `test-results/`, `playwright-report/`,
  `logs/`, etc. Already gitignored; do not check them in even
  for "convenience."
- **Database state, Supabase branch state, e2e auth state** —
  `supabase/.branches/`, `supabase/.temp/`, `tests/e2e/.auth/`
  are gitignored or read-blocked per `.claude/settings.json`.
  Treat these as ephemeral; they're rebuildable from migrations
  + seed scripts.

## The four-layer architecture statement

> **Root explains, docs justify, skills specialize, scripts
> execute.**

(Source: `.claude/skills/README.md`.) This statement organizes
where rules live across the repo. Each layer plays a different
role; the layers compose to keep token budgets predictable and
authority traceable.

- **Root** (`CLAUDE.md`, `AGENTS.md`, `README.md`): orientation;
  always-loaded standing rules; navigation pointers. Lean by
  design — every line in `CLAUDE.md` costs token budget in every
  session.
- **Docs** (`docs/`): canonical knowledge; specs, ADRs, briefs,
  governance, conventions, glossary. The single source of truth
  for any rule. Everything else summarizes or points here.
- **Skills** (`.claude/skills/`): on-demand rule packs that
  summarize and point to canonical docs. Loaded by trigger when
  the session touches a specific code area. The rule a skill
  summarizes always has a canonical doc; the skill is the
  token-economy summary, the doc is authoritative.
- **Scripts** (`scripts/`): execution mechanisms; session
  lifecycle (`session-init.sh`, `session-end.sh`), install hooks
  (`install-hooks.sh`), validation (`agent:validate`), floor
  tests (`agent:floor`), branch tooling. Scripts run rules; they
  do not author them.

If a piece of project knowledge isn't clearly one of these four,
that's a routing question. Default home: a doc under `docs/`. Add
a skill summary if a specific code area triggers the rule
repeatedly. Add a script if execution mechanics need to be
reproducible.

## Cross-reference table

For each concern, the canonical source. When you start work,
identify the concern your task touches and read the canonical
source. Do not re-derive these rules from conversation context.

| Concern | Canonical source |
|---|---|
| Monorepo layout | `docs/03_architecture/monorepo.md` |
| Source-tree architecture | `docs/03_architecture/folder-structure.md` + ADR-0020 |
| Authority Gradient | `docs/03_architecture/authority-gradient.md` + ADR-0007 |
| Agent tool architecture | `docs/03_architecture/agent-tool-architecture.md` |
| Agent Ladder | `docs/03_architecture/agent-ladder.md` + `docs/02_specs/agent_autonomy_model.md` |
| Branch naming | `docs/04_engineering/conventions.md` Contribution Conventions |
| Worktree discipline | `docs/04_engineering/worktree-rules.md` |
| Delivery model | `docs/04_engineering/delivery-model.md` |
| Phase / Session vocabulary | `docs/02_specs/glossary.md` Workflow Vocabulary |
| Product vocabulary | `docs/02_specs/glossary.md` Product Vocabulary |
| Delivery vocabulary | `docs/02_specs/glossary.md` Delivery Vocabulary |
| Product modules (planning) | `docs/00_product/product-map.md` |
| Workflow ↔ Code mapping | `docs/03_architecture/product-workflow-delivery-mapping.md` |
| Skills index | `.claude/skills/README.md` |
| Phase 1 simplifications | `docs/03_architecture/phase_simplifications.md` |
| Documentation Routing | `docs/04_engineering/conventions.md` § Documentation Routing |
| Friction journal (active) | `docs/07_governance/friction-journal.md` |
| ADR index | `docs/INDEX.md` § 07_governance/adr |

## When you're not sure

- If a situation is not covered by this file, the canonical docs
  it points to, or the skills under `.claude/skills/`, flag it in
  `docs/02_specs/open_questions.md`. Do not guess.
- If two canonical sources contradict each other, surface the
  conflict to the founder before proceeding. The conflict is the
  bug; resolving it requires either an ADR (architectural
  decision) or an amendment to the older source (with friction-
  journal entry).
- If a rule in this file conflicts with the canonical source,
  the canonical source wins. Fix this file in place; record the
  fix as a friction-journal NOTE.

## Codification status

This rules doc codifies the **current state** of the repo as of
2026-05-06 — what's already on disk, what's already gitignored,
what's already in the four-layer architecture. New rules are not
introduced here; existing rules are gathered into one navigation
home. Amendments land here in place when the canonical sources
they point to evolve.
