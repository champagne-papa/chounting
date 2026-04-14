# Developer Setup

From a clean laptop to a running local environment. A new contributor
(or future-you returning to the codebase after a break) should be
able to follow this document alone.

Source: PLAN.md §12 (prerequisites, setup, troubleshooting) and §1b
(scripts) extracted verbatim. Environment Files, Seed Passwords, and
two troubleshooting entries (stale JWT keys, stale Next.js type cache)
added from CURRENT_STATE.md and friction journal entries
2026-04-12/14/15 during the restructure — these are Phase 1.1
implementation lessons that the pre-implementation §12 could not
contain.

---

## Prerequisites

- **Windows dev shell: WSL2, not native Windows.** On Windows, the
  dev environment targets **Ubuntu 22.04 LTS on WSL2**. VS Code runs
  on the Windows host and connects to WSL2 via the Remote-WSL
  extension; `git`, `pnpm`, `nvm`, the Supabase CLI, and `supabase
  start`'s Docker containers all run inside WSL2. Native Windows is
  not supported because (a) Docker Desktop file-watcher behavior on
  Windows NTFS produces phantom rebuilds and missed HMR events,
  (b) line-ending handling is a recurring low-value distraction, and
  (c) every shell command in the project is written for bash, not
  PowerShell. **macOS and Linux developers skip this bullet** and
  install natively.
- Node.js v20+ (use `nvm` — `.nvmrc` is committed). On WSL2, install
  `nvm` inside the WSL2 shell, not on Windows.
- pnpm v9+ (`npm install -g pnpm`) — used for all commands even
  though the repo is not a workspace in Phase 1; pnpm is faster than
  npm.
- Supabase CLI. macOS: `brew install supabase/tap/supabase`. Linux
  and WSL2: download the latest release from the Supabase CLI GitHub
  releases page or use `npx supabase` as a transitional install.
  Native Windows: not supported — use WSL2 per the first bullet.
- Postman (runs on the Windows host for WSL2 developers; talks to
  `http://localhost:3000` which WSL2 forwards automatically).
- Anthropic API key (request from team lead).
- VS Code with extensions: ESLint, Prettier, Tailwind CSS
  IntelliSense, Supabase, and (on Windows) the **Remote-WSL**
  extension.

---

## Step-by-Step Setup

1. `git clone [repo] && cd the-bridge`
2. `nvm use` (installs the Node version from `.nvmrc`)
3. `pnpm install`
4. `cp .env.example .env.local` and fill in all values
5. `pnpm db:start` (starts local Supabase: Postgres + Auth + Studio)
6. `pnpm db:migrate` (runs the schema migrations)
7. `pnpm db:generate-types` (generates TypeScript types from the
   schema)
8. `pnpm db:seed:all` (creates the 2 dev orgs + 3 dev users)
9. `pnpm dev` (starts Next.js)
10. Open `http://localhost:3000` — sign in with one of the seed users
11. Open Postman → import `postman/collection.json` → set `base_url`
    to `http://localhost:3000`
12. Run "Health Check" — expect `{ status: "ok" }`

### Environment Files

- `.env.example` — committed to repo with placeholder values and
  comments. Copy to `.env.local` and fill in real values.
- `.env.local` — gitignored. Real secrets for local development.
- `.env.test.local` — gitignored. Carries `SUPABASE_TEST_URL` and
  `SUPABASE_TEST_SERVICE_ROLE_KEY` for integration tests. Create
  from `.env.example` if running tests locally.

### Seed Passwords (all end in #1)

- executive@thebridge.local / DevSeed!Executive#1
- controller@thebridge.local / DevSeed!Controller#1
- ap@thebridge.local / DevSeed!ApSpec#1

---

## Scripts Reference

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run tests/integration",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:generate-types": "supabase gen types typescript --local > src/db/types.ts",
    "db:seed:auth": "tsx scripts/seed-auth-users.ts",
    "db:seed": "psql \"$LOCAL_DATABASE_URL\" -f src/db/seed/dev.sql",
    "db:seed:all": "pnpm db:seed:auth && pnpm db:seed"
  }
}
```

**The two-script seed split.** Seeding is split across two scripts
because Supabase Auth manages its own `auth.users` table and rejects
direct SQL INSERTs. Auth users must be created via the Supabase admin
API, which is a Node SDK call, not SQL.

- **`db:seed:auth`** — runs `scripts/seed-auth-users.ts` via `tsx`,
  creating the three seed users (executive, controller,
  ap_specialist) via `admin.auth.admin.createUser()` with fixed UUIDs
  that the SQL seed and integration tests both reference.
- **`db:seed`** — runs `psql` against `LOCAL_DATABASE_URL` loading
  `src/db/seed/dev.sql`, which creates the two orgs, loads industry
  CoA templates, inserts memberships, and creates fiscal periods.
- **`db:seed:all`** — runs both in sequence. This is the normal
  developer command; the split exists for CI granularity and for
  recovering from a half-failed seed run.

**`db:reset`** — resets the local Supabase database and reapplies all
migrations. After running `db:reset`, you must re-run `db:seed:all`
to restore seed data. Note: `db:reset` regenerates JWT keys, so
check `.env.local` against `supabase status -o env` afterward.

**`db:generate-types`** — regenerate after every migration. The
generated types file (`src/db/types.ts`) is committed to the repo so
reviewers can see schema changes in PRs.

---

## Troubleshooting

**Wrong Node version.** `nvm use` should fix it. If nvm is not
installed, install it first.

**Boot-time env var assertion fires.** Read the error message; it
names the missing variable. Check `.env.local`. The two most commonly
missing in fresh setups are `SUPABASE_SERVICE_ROLE_KEY` (run
`supabase status` to see your local key — it changes every time you
reset local Supabase) and `ANTHROPIC_API_KEY` (request from the team
lead).

**RLS blocking a query / empty result set.** Suspect RLS first. A
policy that silently returns empty result sets looks identical to "no
data exists" and the error message is unhelpful. Check that the
service is using the service-role client (`src/db/adminClient.ts`),
not the anon client. If you are in a server component, you are
correctly using the user-scoped client and RLS is intentional — make
sure the user has a `memberships` row for the org.

**Agent not responding.** Check that `ANTHROPIC_API_KEY` is set.
Check the pino logs for the trace ID and follow it through the
orchestrator. Click any Mainframe icon — if the manual paths still
work, the issue is isolated to the agent layer (the Mainframe
degradation path is working as designed).

**Deferred constraint not firing.** The most common cause is
forgetting the `DEFERRABLE INITIALLY DEFERRED` clause when recreating
the constraint. See `docs/02_specs/ledger_truth_model.md`
INV-LEDGER-001 for the full constraint definition.

**Stale JWT keys after `db:reset`.** If tests or sign-in fail after
a `supabase stop` + `supabase start` or `db:reset` cycle, the JWT
keys in `.env.local` may be stale. Run `supabase status -o env` and
compare the output against `.env.local`. Update any mismatched keys.
This is the most common cause of "RLS returns empty" bugs that appear
after a database reset.

**Next.js stale type cache.** After deleting or moving route files,
`pnpm typecheck` may fail on stale cached types in `.next/types/`.
Fix: `rm -rf .next` then re-run typecheck. Kill the dev server
before running `rm -rf .next` or restart immediately after — the dev
server references deleted vendor chunks in memory.
