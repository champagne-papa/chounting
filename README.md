# chounting

Accounting platform for SMB controllers, executives, and AP
specialists. Deterministic financial engine with a probabilistic
agent interface. Next.js 15 + Supabase + Anthropic.

## Repo shape

This is a pnpm + Turborepo monorepo (Pattern 3):

- `apps/web/` — `@chounting/web`. The production app.
- `apps/demo/` — `@chounting/demo`. Design surface for UI artifacts.
- `packages/tokens/` — `@chounting/tokens`. Tailwind v4 design
  tokens.
- `packages/ui/` — `@chounting/ui`. Shared component primitives.

See [`docs/03_architecture/monorepo.md`](docs/03_architecture/monorepo.md)
for the full layout, the demo → ui → web component migration
path, and the decision tree for where new components live.

## Prerequisites

- Node version pinned in `.nvmrc`
- pnpm (declared in `package.json` `packageManager`)
- Docker (for local Supabase)
- Supabase CLI (installed as a workspace dev dep — `pnpm db:start` works after `pnpm install`)

## Quickstart

```bash
pnpm install

# Bring up local Supabase (Docker required)
pnpm db:start
pnpm db:reset:clean   # apply migrations + seed dev data + auth users

# Web app — production app at http://localhost:3000
pnpm --filter @chounting/web dev

# Demo app — design surface at http://localhost:3001
pnpm --filter @chounting/demo dev

# Both in parallel via Turborepo
pnpm dev
```

The web app expects `apps/web/.env.local` to exist; the project
ships `apps/web/.env.example` and `apps/web/.env.local.example`
as reference. The demo app runs without env config but accepts
demo-only vars in `apps/demo/.env.local` if needed.

## Common tasks

| Task | Command |
| --- | --- |
| Type-check everything | `pnpm -r typecheck` |
| Lint (`@chounting/demo` + packages — see Note) | `pnpm exec turbo run lint --filter=@chounting/demo` |
| Build (`@chounting/demo` — see Note) | `pnpm exec turbo run build --filter=@chounting/demo` |
| Web unit/integration tests | `pnpm --filter @chounting/web test` |
| Web Category A floor tests | `pnpm agent:floor` |
| Web validation gate | `pnpm agent:validate` |
| Web Playwright e2e | `pnpm --filter @chounting/web test:e2e` |
| Generate Supabase types | `pnpm db:generate-types` |
| Reseed clean DB | `pnpm db:reset:clean` |

**Note:** `@chounting/web`'s lint and build are currently held
out of CI pending cleanup of 7 pre-existing
`@/db/adminClient` lint violations. See the *Pre-existing
baseline* section in `docs/03_architecture/monorepo.md`.

## Working agreement

Project standing rules live in [`CLAUDE.md`](CLAUDE.md). Long-form
spec/architecture docs are routed via [`docs/INDEX.md`](docs/INDEX.md).
Tier-1 always-relevant references:

- [`docs/02_specs/ledger_truth_model.md`](docs/02_specs/ledger_truth_model.md) — ledger invariants
- [`docs/02_specs/agent_autonomy_model.md`](docs/02_specs/agent_autonomy_model.md) — agent governance
- [`docs/09_briefs/CURRENT_STATE.md`](docs/09_briefs/CURRENT_STATE.md) — current-state snapshot
- [`docs/07_governance/friction-journal.md`](docs/07_governance/friction-journal.md) — engineering war diary

## Folder placement

Folder placement decisions at the repo root are governed by
Principles 1, 2, and 3 ratified at
[`docs/07_governance/DOCS_RESTRUCTURE_V2.md`](docs/07_governance/DOCS_RESTRUCTURE_V2.md).
Before creating any new top-level folder, read this section.

### Permitted top-level structural folders

Verified against `ls .` at 2026-05-09:

- `apps/` — workspace applications (`@chounting/web`, `@chounting/demo`).
- `packages/` — workspace packages (`@chounting/tokens`, `@chounting/ui`).
- `supabase/` — DB migrations + supabase config.
- `scripts/` — cross-repo shell + TypeScript tooling.
- `docs/` — product / spec / architecture / engineering / governance / brief documentation.
- `eslint-rules/` — custom ESLint rules.
- `.coordination/` — cross-session coordination locks.

A new top-level structural folder requires an ADR ratifying the
addition.

### Out-of-scope folders (tooling / system-managed)

The following are gitignored or system-managed; not subject to
Principle 3:

- `.git/`, `.github/`, `.turbo/`, `node_modules/`
- `logs/`, `reports/`, `test-results/`
- `.claude/` (mostly gitignored; `.claude/skills/` and
  `.claude/settings.json` are tracked per ADR-0020 Decision
  item 9)

Plus repo-root config files: `.gitattributes`, `.gitignore`,
`.mcp.json`, `.nvmrc`, `package.json`, `pnpm-lock.yaml`,
`pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.base.mjs`,
`turbo.json`, plus the three top-level docs (`README.md`,
`AGENTS.md`, `CLAUDE.md`).

### Decision rule + bypass

For permitted top-level folders, see V2 Part 1 Principle 2 (top-
level folders are document classes, not workflow lineages). For
the `docs/` surface specifically, see [`docs/README.md`](docs/README.md).
For the `apps/web/src/` surface, see
[`apps/web/src/README.md`](apps/web/src/README.md).

The bypass procedure (Pattern 7 for cross-phase meta-arcs under
`docs/07_governance/`) is documented at V2 Part 1; the
operational rules (canonical-source verification at execution
time + chronological-reality verification at planning time)
apply to all bypasses regardless of surface.

## License

Proprietary. All rights reserved.
