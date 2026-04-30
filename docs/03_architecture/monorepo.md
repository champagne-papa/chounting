# Monorepo Layout (Pattern 3)

The repo is a pnpm + Turborepo monorepo with two apps and two
shared packages. All four workspaces live under `apps/` and
`packages/`; shared infrastructure (Supabase, scripts, governance
docs, ESLint custom rules) stays at the repo root.

## Why Pattern 3

Production app and design surface live in separate workspaces.
Claude-generated UI artifacts can land in `apps/demo/` —
hand-tuned against fixtures, mock data, and an isolated Tailwind
v4 token surface — without ever touching the production code
path. Components migrate into `packages/ui/` after design
lockdown and only then become available to `apps/web/`. This
keeps the production app's blast radius small while the design
work is iterative, and keeps the design surface free of
production constraints (auth, RLS, locked services).

## Workspaces

| Workspace | Path | Role |
| --- | --- | --- |
| `@chounting/web` | `apps/web/` | The production app — Next.js 15, next-intl, Supabase, services layer, agent orchestrator. Owns all real data flow. |
| `@chounting/demo` | `apps/demo/` | Design surface for UI artifacts — Next.js 15 on port 3001, no auth, no Supabase, no middleware. Receives Claude-generated components, exercises them against mock data. |
| `@chounting/tokens` | `packages/tokens/` | CSS-only design tokens — Tailwind v4 `@theme inline` block plus `:root` / `.dark` CSS-variable layers. Single source of truth for colors, spacing, typography, radius, shadows. |
| `@chounting/ui` | `packages/ui/` | Shared component primitives. Ships only the `cn` (clsx + tailwind-merge) utility today. Components migrate in after design lockdown. |

## Repo root layout

```
chounting/
├─ apps/
│  ├─ web/             @chounting/web — production
│  └─ demo/            @chounting/demo — design surface
├─ packages/
│  ├─ tokens/          @chounting/tokens — Tailwind v4 design tokens
│  └─ ui/              @chounting/ui — shared component primitives
├─ supabase/           Local Supabase project (config, migrations, snippets) — root because the CLI runs from cwd
├─ scripts/            Cross-cutting bash scripts (session hooks, friction-journal lint, etc.)
├─ eslint-rules/       Custom services-layer plugin (LT-01b enforcement); shared infrastructure
├─ docs/               Governance, specs, briefs, retrospectives, ADRs
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json   Shared compiler options; per-workspace tsconfig extends this
├─ eslint.base.mjs      Shared lint base; per-workspace eslint.config.mjs extends this
└─ package.json         Workspace root — turbo, prettier, supabase CLI, tsx, typescript at root
```

## Component migration path

Components flow **`apps/demo/` → `packages/ui/` → `apps/web/`**:

1. **Design in `apps/demo/`.** A Claude session generates a
   component file at `apps/demo/src/components/<name>.tsx`. It
   uses tokens (`bg-primary`, `text-foreground`, etc.) and `cn`
   from `@chounting/ui`. Mock data fixtures live under
   `apps/demo/src/lib/mock-data/`.
2. **Iterate against the demo app.** The founder reviews visual
   fidelity, behavior, edge cases. The component evolves freely;
   nothing in production sees it.
3. **Lockdown.** Once the design is approved, the component
   moves into `packages/ui/src/components/<name>.tsx`. Its API
   gets named, props get typed, the component is exported from
   `packages/ui/src/index.ts`.
4. **Adoption in `apps/web/`.** Production code imports it from
   `@chounting/ui`. The old in-tree component (if there was one)
   is deleted in the same PR.

## Decision tree: where does this new component live?

- **Demo-only / experimental** — used in `apps/demo/` to validate
  a design idea, not yet locked. **Path:**
  `apps/demo/src/components/`. **Owner:** the demo workspace.
  **Visibility:** `apps/demo/` only.
- **Shared, locked** — design is approved, web needs it. **Path:**
  `packages/ui/src/components/`. **Owner:** `@chounting/ui`.
  **Visibility:** any consumer of `@chounting/ui`.
- **Production-only** — tightly coupled to web app state, services,
  routes, or i18n; not a candidate for design isolation (e.g.
  `JournalEntryListView`, `AgentChatPanel`). **Path:**
  `apps/web/src/components/`. **Owner:** `@chounting/web`.
  **Visibility:** web only.

If unsure, default to `apps/demo/` first. Promotion is cheap; demotion
isn't.

## Tailwind v4 token contract

`@chounting/tokens` is the **single source of truth** for visual
design. Every consumer (apps/web, apps/demo, future packages/ui
components) imports `@chounting/tokens/tokens.css` exactly once,
from its `globals.css`, immediately after `@import "tailwindcss"`.

The `@theme inline` block declares Tailwind-canonical token names
(`--color-*`, `--font-*`, `--radius-*`, `--shadow-*`) so the build
emits matching utility families. Each token indirects through a
shorter CSS variable (`--background`, `--primary`, `--radius`),
which `:root` and `.dark` set for the active mode.

**Hardcoded colors / spacing / fonts in app code are a bug.** Extend
the palette in `packages/tokens/src/tokens.css` and consume via
utilities (`bg-primary`, `text-muted-foreground`, etc.). If a token
genuinely doesn't exist for a use case, add it to `tokens.css` and
ship the addition with the consuming change.

## Adding a new component to packages/ui/

1. Create `packages/ui/src/components/<Name>.tsx`. Use only:
   - React (peer dep)
   - `cn` from `../lib/cn`
   - Tokens via Tailwind utilities (`bg-card`, `text-foreground`)
   - Other primitives already in `packages/ui/`
2. Re-export from `packages/ui/src/index.ts`.
3. Consumers import as `import { Name } from "@chounting/ui"`.
4. Both `apps/demo/` and `apps/web/` already have
   `transpilePackages: ["@chounting/ui"]` in `next.config.ts`,
   and `globals.css` `@source` directives that scan
   `packages/ui/src` so utility classes used inside the component
   get generated.

## Build and dev cadence

| Task | Command | Notes |
| --- | --- | --- |
| Web dev | `pnpm --filter @chounting/web dev` | Port 3000 |
| Demo dev | `pnpm --filter @chounting/demo dev` | Port 3001 |
| Both in parallel | `pnpm dev` | Turbo runs both `dev` tasks |
| Type-check all | `pnpm -r typecheck` or `pnpm exec turbo run type-check` | |
| Lint clean targets | `pnpm exec turbo run lint --filter=@chounting/demo` | See "Pre-existing baseline" below for why web is excluded |
| Build clean targets | `pnpm exec turbo run build --filter=@chounting/demo` | Same exclusion |
| Web tests | `pnpm --filter @chounting/web test` | Vitest; needs local Supabase |
| Web Category A floor | `pnpm agent:floor` (from root) | Five Category A integration tests |
| Web validation gate | `pnpm agent:validate` (from root) | typecheck + no-hardcoded-urls + agent:floor |

Root-level db/agent scripts (`pnpm db:start`, `pnpm db:reset`,
`pnpm db:seed:all`, `pnpm verify-audit-coverage`,
`pnpm agent:validate`) all delegate to `@chounting/web` via
`pnpm --filter`. They keep working from the root.

## CI

Two workflows:

- **`.github/workflows/ci.yml`** (new with the migration) — runs on
  push and PR to main/staging. Three jobs: typecheck (all
  workspaces), lint (`@chounting/demo`), build (`@chounting/demo`).
  Caches `.turbo/` between runs.
- **`.github/workflows/verify-audit-coverage.yml`** (pre-existing) —
  daily cron at 06:00 UTC. Spins up local Supabase, runs
  `pnpm verify-audit-coverage`. Unchanged by the migration.

## Pre-existing baseline (NOT introduced by the migration)

`@chounting/web` ships **7 lint errors** that block both
`pnpm --filter @chounting/web lint` and `next build` for the web
app. They are LT-03 / UF-006 violations of the
`no-restricted-imports` rule on `@/db/adminClient`:

```
src/agent/memory/orgContextManager.ts:17
src/agent/orchestrator/index.ts:39
src/agent/orchestrator/loadOrCreateSession.ts:10
src/app/api/agent/confirm/route.ts:21
src/app/api/agent/conversation/route.ts:35
src/app/api/agent/reject/route.ts:28
src/app/api/auth/mfa-status/route.ts:4
```

These predate the Pattern 3 migration. Verified by checking out
the pre-migration commit `b2bf9f3` and running `next lint` — the
same 7 errors surface there. The Pattern 3 work was bound by the
constraint "DO NOT modify any existing service, agent, schema, or
route code in `src/`," so they were not addressed in the
migration.

The CI lint and build jobs filter to `@chounting/demo` for now.
Once the 7 violations are resolved (the right shape is moving
each `adminClient` consumer behind a service-layer call, per the
LT-03 leaf), the CI filters can be removed and the web app
re-enters the gate.

## See also

- `phase_simplifications.md` — Phase 1 deliberate divergences from
  the long-term target.
- `system_overview.md` — major components and folder tree (will
  be updated in a future pass to reflect the apps/web layout).
- `agent_interface.md` — durable agent contract.
- `ui_architecture.md` — split-screen shell, canvas directive.
