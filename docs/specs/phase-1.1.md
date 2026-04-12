# Phase 1.1 Execution Brief — The Bridge

*This document is the Phase 1.1 execution spec for The Bridge (Family
Office AI-Forward Accounting Platform). It was extracted from
`PLAN.md` Part 2 during the v0.5.6 step-5 split on 2026-04-11. The
Architecture Bible is `PLAN.md` (Part 1); this brief is one of the
Phase Execution Briefs under `docs/specs/`. Subsequent briefs land
here alongside this one (phase-1.2.md, phase-1.3.md, ...).*

**How to read this file.**

- **`PLAN.md` Part 1 is the *why*.** This brief is the *what* and *how*.
- **If anything here contradicts PLAN.md, PLAN.md wins and this brief
  is wrong — flag it immediately and fix here, not there.**
- **`CLAUDE.md` at the repo root carries the standing rules loaded
  every session.** Those rules are derived from PLAN.md §0, §1d, §2b,
  §3a, §5c, §15, and the Critical Architectural Invariants. This
  brief assumes those rules are in effect throughout execution.
- **Architecture Decision Records live in `docs/decisions/`.** The
  first is `0001-reversal-semantics.md`, written verbatim from PLAN.md
  §18c.19 RESOLVED, which is the Q19 reversal mechanism this brief
  schema-enables.

---

> **Founder answers applied (v0.5.5).** An earlier version of this
> brief carried a `⚠️ Preamble (added v0.5.2)` warning that the brief
> had been drafted against Section 18 default answers rather than
> founder-confirmed ones. That preamble is removed in v0.5.5 because
> all nine questions in the step-2 minimum-unblock set are now
> founder-resolved in PLAN.md §18a and §18c, and their answers have
> been folded into Part 1 and this brief. The resolved set is:
> **Q1** (CoA templates: `holding_company` + `real_estate`),
> **Q2** (tax codes: **BC — federal GST 5% + PST_BC 7%, NOT HST**
> — BC reverted HST in 2013; an earlier draft of this brief
> incorrectly said "Ontario/BC HST" and that phrasing has been
> removed),
> **Q4** (Supabase `ca-central-1` + Vercel `yul1` — accepted as
> a hard constraint per §9a.0),
> **Q5** (**Windows host + WSL2 Ubuntu 22.04 LTS** as the actual dev
> shell; native Windows is explicitly not supported; every shell
> command in this brief runs inside WSL2, not PowerShell),
> **Q7** (GitHub + GitHub Actions),
> **Q9** (add `zod-to-json-schema` pinned — ADR-required for
> major version bumps; the dependency lands in Phase 1.2, not
> Phase 1.1, so this brief does not install it),
> **Q10** (seed users via Supabase admin API — this brief's §5
> already carries the richer two-script split `db:seed:auth` +
> `db:seed`, which became the authoritative model in v0.5.5 and
> was propagated back into PLAN.md §1b),
> **Q18** (CI/CD database target: local Supabase for Phase 1.1 and
> Phase 1.2, remote Supabase dev project for Phase 1.3; integration
> tests in this brief are parameterized by `SUPABASE_TEST_URL` /
> `SUPABASE_TEST_SERVICE_ROLE_KEY` from day one with a CI grep-fail
> check rejecting any file that hardcodes `http://localhost:54321`),
> **Q19** (reversal entry mechanism accepted with three mandatory
> Phase 1.1 additions: service-layer mirror check, period gap banner
> in the reversal UI, and `reversal_reason text NOT NULL` on
> `journal_entries` — see PLAN.md §18c.19 RESOLVED and ADR-001).
>
> The `⚠️ Assumes Q# default` markers that used to be sprinkled
> inline in this brief are gone. Where a prior marker flagged a
> stop-and-check, the text is now either (a) the confirmed answer
> inline, or (b) an inline `**v0.5.5 confirmed:**` note if the
> distinction between assumption and confirmation is load-bearing
> for the execution step.

---

## Phase 1.1 Execution Brief

> **Active task.** This brief is what Claude Code executes against. The
> Architecture Bible (Part 1) is the *why*; this brief is the *what* and
> *how*. If anything in this brief contradicts Part 1, Part 1 wins and the
> brief is wrong — flag it immediately.

### 1. Goal

**The system has a correctly structured database, multi-org auth, and a
working UI shell — ready to receive the Double Entry Agent in Phase 1.2.**

What "done" means in one paragraph: a developer can run `pnpm dev`, see The
Bridge sign-in screen render in three locales, sign in as one of three seeded
users, switch between two seeded organizations using a role-aware org
switcher, view a Chart of Accounts loaded from an industry template, and the
**five** Category A integration tests pass (the count was three through
v0.5.2, raised to four by v0.5.3 when the service-middleware authorization
test was added, and raised to five by v0.5.5 when the Q19 reversal mirror
test was added — see `PLAN.md` §10a and §7 Phase 1.1 exit criterion #3).
**No agent code exists yet.** The
chat panel renders with an empty state and suggested prompts but does not
call any LLM. The Mainframe rail works as the primary navigation. The
ProposedEntryCard component exists as a typed shell so Phase 1.2 can wire
the agent into a canvas component that already compiles.

---

### 2. Clean Slate Prerequisite

#### 2.0 Package Manager Pinning (v0.5.3, A8) — Do This First

**Before anything else — before deleting any files — pin the package
manager to pnpm.** The existing `package.json` from the earlier
`create-next-app` run uses npm scripts, and the Bible's scripts block
(Section 1b) is pnpm. If the founder runs `npm install` on any step of
this brief, a `package-lock.json` gets regenerated and mixed with the
pnpm workflow, producing silently divergent dependency resolution
across machines.

Run these commands from the repo root, in this exact order:

```bash
# Confirm pnpm is installed and recent enough. Minimum: 9.x.
pnpm --version

# If pnpm is not installed (exit code ≠ 0 above), install via Corepack
# (bundled with Node ≥ 16.10, the Phase 1.1 supported version):
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version   # verify
```

After this step, **never type `npm install` or `npm run` again during
Phase 1.1 or 1.2**. Use `pnpm install` and `pnpm <script>` exclusively.
If the founder sees `package-lock.json` or `yarn.lock` appear in the
repo at any point after this step, something ran a non-pnpm command —
stop, delete the stray lockfile, and re-run `pnpm install`.

> **v0.5.5 confirmed — Q5: Windows host + WSL2 Ubuntu 22.04 LTS.**
> Every command in this brief runs inside the WSL2 shell, not
> PowerShell. `corepack enable` inside WSL2 behaves like any Linux
> environment — no elevation, no terminal restart gymnastics, no
> line-ending drama. If `pnpm --version` fails after
> `corepack enable` inside WSL2, the most common cause is an outdated
> Node (pre-v16.10 does not ship Corepack); run `nvm use` to pick up
> the version from `.nvmrc`. Native Windows is explicitly not
> supported for this project — see `PLAN.md` §12 Prerequisites and
> §18a.5 RESOLVED for the full rationale (Docker file watcher on
> NTFS, line endings, PowerShell vs bash mismatch).

---

#### 2.1 Clean Slate

**Before any Phase 1.1 work begins, delete the default Next.js scaffold
files.** A `create-next-app` run was performed earlier in this project
producing default boilerplate. Phase 1.1 produces a deliberately structured
codebase that must not inherit those defaults — they will silently shape
later decisions and create folder-conflict surprises.

(Plain English: "boilerplate" means files a code generator creates with
sensible defaults that look fine but bake in choices you might want to make
differently. Deleting them now means Phase 1.1 starts from a known state.)

**Run these commands first, in this exact order, from the repo root:**

```bash
# Confirm you are in the project root before proceeding.
pwd
ls -la

# Delete the default Next.js scaffold.
rm -rf app/
rm -f next.config.ts next.config.js next.config.mjs
rm -f package.json package-lock.json pnpm-lock.yaml
rm -f tsconfig.json
rm -f eslint.config.mjs eslint.config.js .eslintrc.json
rm -f postcss.config.mjs postcss.config.js
rm -rf node_modules/

# Verify clean slate. The output should show only:
# - .git/
# - .gitignore
# - README.md (optional)
# - docs/ (if it already exists from earlier work)
# - CLAUDE.md (if it already exists)
ls -la
```

**STOP and confirm with the user before proceeding** if `ls -la` shows
anything other than the expected files. Do not delete `.git/`. Do not
delete `docs/`. Do not delete `CLAUDE.md`.

After confirmation, proceed to Section 3 (Folder Structure) and create
the Phase 1.1 folder skeleton from scratch.

---

### 3. Folder Structure

The Phase 1.1 folder layout. Create exactly this structure. Every folder
listed has a one-line purpose. Key files are named explicitly.

```
the-bridge/                              # repo root
  src/
    app/                                 # Next.js App Router root
      [locale]/                          # i18n: en, fr-CA, zh-Hant
        layout.tsx                       # locale provider, font, top-level shell
        page.tsx                         # locale root → redirects to sign-in or home
        sign-in/
          page.tsx                       # Supabase Auth sign-in form
        sign-out/
          page.tsx                       # sign-out handler page
        [orgId]/                         # org-scoped routes
          layout.tsx                     # The Bridge split-screen layout shell
          page.tsx                       # org home — empty canvas + chat panel
          accounting/
            chart-of-accounts/
              page.tsx                   # CoA list canvas view (standalone)
            journals/
              page.tsx                   # Journal entry list canvas view (empty in 1.1)
        consolidated/
          dashboard/
            page.tsx                     # stub, role-gated to Executive
      admin/
        orgs/
          page.tsx                       # org creation + CoA template selection
      api/                               # Next.js API routes — thin adapters
        health/
          route.ts                       # GET /api/health → { status: "ok" }
        accounting/
          chart-of-accounts/
            route.ts                     # GET (list)
        org/
          route.ts                       # POST (create org with CoA template)

    services/                            # ALL business logic (Invariant 1)
      auth/
        canUserPerformAction.ts
        getMembership.ts
      accounting/
        chartOfAccountsService.ts        # list, create, loadTemplate
        periodService.ts                 # isOpen() — replaces v0.4.0 Period Agent
        # journalEntryService.ts is created in Phase 1.2, not 1.1
      org/
        orgService.ts                    # createOrg with CoA template loading
        membershipService.ts
      audit/
        recordMutation.ts                # synchronous audit_log writer (Simplification 1)
      middleware/
        withInvariants.ts                # the universal service wrapper
        serviceContext.ts                # ServiceContext type (trace_id, org_id, caller)
      errors/
        ServiceError.ts                  # typed error class for service-layer failures

    db/
      adminClient.ts                     # service-role Supabase client (server-only)
      userClient.ts                      # user-scoped client (RLS-respecting)
      types.ts                           # generated by `pnpm db:generate-types`
      migrations/
        001_initial_schema.sql           # full Phase 1.1 migration (Section 4)
        seed/
          dev.sql                        # idempotent dev seed (Section 5)

    contracts/                           # one folder, no files in Phase 1.1
      .gitkeep                           # contracts file is created in Phase 1.2

    shared/
      env.ts                             # boot-time env var assertion (Section 7)
      logger/
        pino.ts                          # structured logger with redact list (Section 8)
      i18n/
        config.ts                        # next-intl config: en, fr-CA, zh-Hant
        request.ts                       # next-intl request handler
      types/
        userRole.ts                      # 'executive' | 'controller' | 'ap_specialist'
        proposedEntryCard.ts             # full type — used by component shell (Section 9)
        canvasDirective.ts               # discriminated union (Bible Section 4b)
        canvasContext.ts                 # v0.5.4 — CanvasContext + SelectedEntity types (Bible §4g). Empty of consumers in 1.1; wired up by the Phase 1.2 agent. Created in Phase 1.1 so Phase 1.2 is purely additive to shared/types/.

    components/
      bridge/
        SplitScreenLayout.tsx            # the three-zone shell (Mainframe + chat + canvas)
        MainframeRail.tsx                # icon rail with API status dot
        AgentChatPanel.tsx               # empty in 1.1 — renders empty state + suggested prompts
        ContextualCanvas.tsx             # canvas renderer + nav history (back/forward)
        OrgSwitcher.tsx                  # role-aware org switcher
        SuggestedPrompts.tsx             # static persona-aware chips
        ApiStatusDot.tsx                 # green/yellow/red Claude API status indicator
      canvas/
        ChartOfAccountsView.tsx          # standalone canvas view
        JournalEntryListView.tsx         # empty list canvas view
        ComingSoonPlaceholder.tsx        # rendered for Phase 2+ directive types
      ProposedEntryCard.tsx              # typed shell — placeholder render in 1.1

  messages/                              # next-intl translation files
    en.json                              # populated in Phase 1.1
    fr.json                              # placeholder structure, English fallback values
    zh-Hant.json                         # placeholder structure, English fallback values

  tests/
    integration/
      unbalancedJournalEntry.test.ts     # Category A test 1
      lockedPeriodRejection.test.ts      # Category A test 2
      crossOrgRlsIsolation.test.ts       # Category A test 3
    setup/
      testDb.ts                          # local Supabase test harness

  docs/
    decisions/
      README.md                          # ADR template (no ADR files yet)
    troubleshooting/
      rls.md                             # already exists — DO NOT recreate
    friction-journal.md                  # already exists — START USING DAY 1
    prompt-history/
      CHANGELOG.md                       # already exists from Bible work

  postman/
    collection.json                      # health check, org CRUD, CoA CRUD

  supabase/                              # Supabase CLI config
    config.toml

  .env.example                           # every variable documented (Section 7)
  .nvmrc                                 # node version pin
  .gitignore
  next.config.ts                         # next-intl plugin wired
  package.json                           # dependency list (Section 3a)
  tsconfig.json                          # strict mode, path aliases
  vitest.config.ts                       # integration test runner config
  CLAUDE.md                              # session recovery instructions (Section 13)
```

#### 3a. `package.json` Dependencies (Phase 1.1 only)

```json
{
  "name": "the-bridge",
  "version": "0.1.0",
  "private": true,
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
    "db:seed": "psql \"$LOCAL_DATABASE_URL\" -f src/db/seed/dev.sql"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "next-intl": "^3.20.0",
    "zod": "^3.23.0",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "supabase": "^1.200.0"
  }
}
```

> **Note on versions:** Pin versions when running `pnpm install` based on
> what is current at install time. The numbers above are starting points,
> not strict pins. If a package version is significantly newer at install
> time, use the newer version and note the actual version in
> `docs/friction-journal.md`.

---

### 4. Database Schema

The complete `001_initial_schema.sql` migration. Runnable as a single
file. Place at `supabase/migrations/20240101000000_initial_schema.sql`.

**Synced with Bible v0.5.3** (Correctness & Risk Review Fixes). The
migration below propagates every v0.5.3 §1d, §2a, §2b, and §2c change
into executable SQL. Where the Bible and this migration disagree, the
Bible is authoritative and this file is wrong — flag and fix
immediately.

**What is included:** all Phase 1.1 tables (Category A only — see Bible
A/B/C section); the deferred constraint for debit=credit with its
intentional N-times-at-commit behavior documented (D6); the period-lock
trigger **with row-lock fix** (D1) that serializes concurrent
`UPDATE fiscal_periods SET is_locked = true` behind any in-flight
journal post; the events append-only triggers including
**BEFORE TRUNCATE** (D4) and the accompanying `REVOKE TRUNCATE`
statements; the multi-currency columns plus **CHECK constraints
enforcing `amount_original = debit_amount + credit_amount` and
`amount_cad = ROUND(amount_original * fx_rate, 4)`** (D5); the
**idempotency CHECK on `journal_entries`** requiring a key when
`source = 'agent'` (D7); the **zero-line rejection CHECK** requiring
at least one of debit or credit to be positive (D11); the
**`ON DELETE CASCADE`** on `memberships.user_id → auth.users(id)`
(D8); the **hardened SECURITY DEFINER helpers** `user_has_org_access`
and `user_is_controller` with `SET search_path = ''`, explicit
`REVOKE FROM PUBLIC`, and `GRANT EXECUTE TO authenticated` (A2); the
**`stale` status** on `ai_actions` with `response_payload` and
`staled_at` columns for the mid-conversation API failure cleanup path
(A1/Phase 1.2 exit #16); **RLS policies on every tenant-scoped table**
(D3) with the three explicit exceptions (`chart_of_accounts_templates`
global, `tax_codes` shared/org hybrid, `auth.users` Supabase-managed);
and seed inserts for two CoA templates (holding company and real estate).

**What is NOT included:** any GL balance projection tables, any pg-boss
job tables, any Phase 2+ tables. Empty schema reservations are present
where v0.5.1 says they should be (intercompany_relationships table exists
but is empty; events table exists but nothing writes to it).

```sql
-- =============================================================
-- 001_initial_schema.sql
-- The Bridge — Phase 1.1 initial schema
-- =============================================================
-- This file is the single source of truth for the Phase 1.1 schema.
-- Phase 1.1 builds the data model, auth, RLS, and the five Category A
-- integration tests (v0.5.5 count — see PLAN.md §10a). No agent code,
-- no journal entry posting yet — but all schema reservations are
-- present so Phase 1.2 plugs in mechanically.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'executive',
  'controller',
  'ap_specialist'
);

CREATE TYPE org_industry AS ENUM (
  'healthcare',
  'real_estate',
  'hospitality',
  'trading',
  'restaurant',
  'holding_company'
);

CREATE TYPE account_type AS ENUM (
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense'
);

-- All three values from day one (Category A reservation).
-- 'manual' is used in Phase 1.1, 'agent' is used in Phase 1.2,
-- 'import' is reserved for Phase 2+. Including all three now means no
-- migration is needed when Phase 1.2 lights up the agent path.
CREATE TYPE journal_entry_source AS ENUM (
  'manual',
  'agent',
  'import'
);

-- Category A reservation — populated empty in Phase 1, used in Phase 2.
CREATE TYPE autonomy_tier AS ENUM (
  'always_confirm',
  'notify_auto',
  'silent'
);

-- v0.5.3 (A1): 'stale' added for the mid-conversation API failure path.
-- When Claude is unreachable between dry-run and confirm, the pending row
-- is marked 'stale' with a timestamp rather than left pending forever.
-- See Phase 1.2 exit criterion #16 and Bible §2a ai_actions entry.
CREATE TYPE ai_action_status AS ENUM (
  'pending',
  'confirmed',
  'rejected',
  'auto_posted',
  'stale'
);

CREATE TYPE confidence_level AS ENUM (
  'high',
  'medium',
  'low',
  'novel'
);

-- -----------------------------------------------------------------
-- ORGANIZATIONS
-- -----------------------------------------------------------------

CREATE TABLE organizations (
  org_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  legal_name          text,
  industry            org_industry NOT NULL,
  functional_currency char(3) NOT NULL DEFAULT 'CAD',
  fiscal_year_start_month smallint NOT NULL DEFAULT 1
    CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id)
);

-- -----------------------------------------------------------------
-- MEMBERSHIPS (user ↔ org with role)
-- -----------------------------------------------------------------

CREATE TABLE memberships (
  membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role          user_role NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);

CREATE INDEX idx_memberships_user_org ON memberships (user_id, org_id);
CREATE INDEX idx_memberships_org ON memberships (org_id);

-- -----------------------------------------------------------------
-- CHART OF ACCOUNTS TEMPLATES (industry seed data)
-- -----------------------------------------------------------------

CREATE TABLE chart_of_accounts_templates (
  template_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry                 org_industry NOT NULL,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_code      text,
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  sort_order               integer NOT NULL DEFAULT 0,
  UNIQUE (industry, account_code)
);

-- -----------------------------------------------------------------
-- CHART OF ACCOUNTS (per org, loaded from a template at org creation)
-- -----------------------------------------------------------------

CREATE TABLE chart_of_accounts (
  account_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_id        uuid REFERENCES chart_of_accounts(account_id),
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  is_active                boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, account_code)
);

CREATE INDEX idx_coa_org ON chart_of_accounts (org_id, account_code);

-- -----------------------------------------------------------------
-- FISCAL PERIODS
-- -----------------------------------------------------------------

CREATE TABLE fiscal_periods (
  period_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name               text NOT NULL,
  start_date         date NOT NULL,
  end_date           date NOT NULL,
  is_locked          boolean NOT NULL DEFAULT false,
  locked_at          timestamptz,
  locked_by_user_id  uuid REFERENCES auth.users(id),
  CHECK (end_date >= start_date),
  UNIQUE (org_id, start_date, end_date)
);

CREATE INDEX idx_fiscal_periods_org_dates ON fiscal_periods (org_id, start_date, end_date);

-- -----------------------------------------------------------------
-- INTERCOMPANY RELATIONSHIPS
-- Empty in Phase 1. Schema present so Phase 2 plugs in mechanically.
-- -----------------------------------------------------------------

CREATE TABLE intercompany_relationships (
  relationship_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_b_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_a_due_to_account_id      uuid REFERENCES chart_of_accounts(account_id),
  org_b_due_from_account_id    uuid REFERENCES chart_of_accounts(account_id),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  CHECK (org_a_id <> org_b_id),
  UNIQUE (org_a_id, org_b_id)
);

COMMENT ON TABLE intercompany_relationships IS
  'Populated in Phase 2 by AP Agent. Do not write to manually.';

-- -----------------------------------------------------------------
-- JOURNAL ENTRIES
-- -----------------------------------------------------------------

CREATE TABLE journal_entries (
  journal_entry_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  fiscal_period_id          uuid NOT NULL REFERENCES fiscal_periods(period_id),
  entry_date                date NOT NULL,
  description               text NOT NULL,
  reference                 text,
  source                    journal_entry_source NOT NULL,
  -- Category A reservation: nullable in Phase 1, populated by Phase 2 AP Agent
  intercompany_batch_id     uuid,
  -- Open Question 19 (pending founder confirmation): self-FK for reversal entries
  reverses_journal_entry_id uuid REFERENCES journal_entries(journal_entry_id),
  idempotency_key           uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  created_by                uuid REFERENCES auth.users(id),
  -- v0.5.3 (D7): agent-source entries must carry an idempotency key.
  -- Enforcement was previously TypeScript-side only, which meant a
  -- forgotten key silently produced a NULL-accepted row. Now the DB
  -- rejects it regardless of the service layer's behavior.
  CONSTRAINT idempotency_required_for_agent
    CHECK (source <> 'agent' OR idempotency_key IS NOT NULL)
);

CREATE INDEX idx_je_org_period ON journal_entries (org_id, fiscal_period_id);
CREATE INDEX idx_je_org_intercompany ON journal_entries (org_id, intercompany_batch_id)
  WHERE intercompany_batch_id IS NOT NULL;
CREATE INDEX idx_je_reverses ON journal_entries (reverses_journal_entry_id)
  WHERE reverses_journal_entry_id IS NOT NULL;

-- -----------------------------------------------------------------
-- JOURNAL LINES
-- Multi-currency columns from day one (Category A — Bible Section 8b).
-- -----------------------------------------------------------------

CREATE TABLE journal_lines (
  journal_line_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id   uuid NOT NULL REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  account_id         uuid NOT NULL REFERENCES chart_of_accounts(account_id),
  description        text,
  debit_amount       numeric(20,4) NOT NULL DEFAULT 0,
  credit_amount      numeric(20,4) NOT NULL DEFAULT 0,
  tax_code_id        uuid REFERENCES tax_codes(tax_code_id),
  -- Multi-currency reservations
  currency           char(3) NOT NULL DEFAULT 'CAD',
  amount_original    numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad         numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate            numeric(20,8) NOT NULL DEFAULT 1.0,

  -- Non-negative magnitudes (unchanged from v0.5.2).
  CONSTRAINT line_amounts_nonneg
    CHECK (debit_amount >= 0 AND credit_amount >= 0),

  -- Debit XOR credit (unchanged from v0.5.2): a single line is never both.
  CONSTRAINT line_is_debit_xor_credit
    CHECK ((debit_amount = 0) OR (credit_amount = 0)),

  -- v0.5.3 (D11): reject zero-value lines. At least one side must be
  -- strictly positive. A zero-balanced line is worse than a rejected
  -- entry because it silently pollutes the audit trail while passing
  -- every higher-level balance check. Founder position: reject at the
  -- database layer, not just the application layer.
  CONSTRAINT line_is_not_all_zero
    CHECK (debit_amount > 0 OR credit_amount > 0),

  -- v0.5.3 (D5): multi-currency amount_original invariant.
  -- amount_original must equal debit_amount + credit_amount (since the
  -- line is exactly one of the two by the XOR check above, this is
  -- equivalent to amount_original = max(debit_amount, credit_amount)).
  -- Prevents silent drift between the base-currency debit/credit columns
  -- and the multi-currency reporting column.
  CONSTRAINT line_amount_original_matches_base
    CHECK (amount_original = debit_amount + credit_amount),

  -- v0.5.3 (D5): multi-currency amount_cad invariant.
  -- amount_cad must equal ROUND(amount_original * fx_rate, 4).
  -- Prevents service-side bugs where amount_cad is left at its default
  -- of 0 or computed incorrectly in JavaScript. For CAD functional
  -- currency, fx_rate = 1.0 and amount_cad = amount_original.
  -- Matches the Zod .refine() check in money.schema.ts (Bible §3a).
  CONSTRAINT line_amount_cad_matches_fx
    CHECK (amount_cad = ROUND(amount_original * fx_rate, 4))
);

CREATE INDEX idx_jl_entry ON journal_lines (journal_entry_id);
CREATE INDEX idx_jl_account ON journal_lines (account_id);

-- -----------------------------------------------------------------
-- DEFERRED CONSTRAINT: debit = credit per journal entry
-- Bible Section 1d. Runs at COMMIT, never per-row.
--
-- v0.5.3 (D6) — expected behavior, not a bug:
-- Postgres constraint triggers must be FOR EACH ROW (statement-level
-- constraint triggers are not supported). A 10-line journal entry
-- queues 10 deferred invocations of this trigger and fires all 10 at
-- COMMIT. Each invocation re-runs the same SUM query. This is correct
-- — all N return the same result — but it costs ~N ms per commit.
-- With the journal_entry_id index it is invisible on Phase 1 entries
-- (5-20 lines) and acceptable on Phase 2 AP batches (50+ lines).
-- Do NOT try to "optimize" this by:
--   * switching to FOR EACH STATEMENT (unsupported for DEFERRABLE)
--   * adding pg_trigger_depth() guards (deferred triggers share depth)
--   * moving the check to the service layer (violates Layer 1 rule)
-- If Phase 2 performance becomes a real issue, revisit in v0.6.0+
-- with a considered ADR, not an unplanned optimization.
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric(20,4);
  total_credit numeric(20,4);
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Journal entry % is not balanced: debits=%, credits=%',
      COALESCE(NEW.journal_entry_id, OLD.journal_entry_id), total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_enforce_journal_entry_balance
  AFTER INSERT OR UPDATE OR DELETE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_entry_balance();

-- -----------------------------------------------------------------
-- TRIGGER: period not locked (immediate, per-row, with row lock)
--
-- v0.5.3 (D1): takes a row-level lock on the fiscal_periods row via
-- SELECT ... FOR UPDATE before reading is_locked. This closes the
-- race condition where transaction A reads is_locked=false, a
-- concurrent transaction B locks the period and commits, and
-- transaction A then commits lines into a now-locked period.
--
-- Under Postgres default isolation (READ COMMITTED, Bible §10c), the
-- row lock serializes any concurrent `UPDATE fiscal_periods SET
-- is_locked = true` behind this trigger's commit. One path sees the
-- other. For a solo-founder Phase 1 the window is theoretical; for
-- Phase 2 concurrent AP ingestion it is a daily risk.
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  v_period_id uuid;
  v_is_locked boolean;
BEGIN
  -- Resolve the fiscal_period_id for this line's parent entry.
  SELECT je.fiscal_period_id INTO v_period_id
  FROM journal_entries je
  WHERE je.journal_entry_id = NEW.journal_entry_id;

  -- Row-lock the period row so any concurrent lock attempt waits for us.
  SELECT fp.is_locked INTO v_is_locked
  FROM fiscal_periods fp
  WHERE fp.period_id = v_period_id
  FOR UPDATE;

  IF v_is_locked THEN
    RAISE EXCEPTION
      'Cannot post to a locked fiscal period (journal_entry_id=%, period_id=%)',
      NEW.journal_entry_id, v_period_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_period_not_locked
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_period_not_locked();

-- -----------------------------------------------------------------
-- VENDORS
-- -----------------------------------------------------------------

CREATE TABLE vendors (
  vendor_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                     uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                       text NOT NULL,
  email                      text,
  tax_id                     text,
  default_currency           char(3) NOT NULL DEFAULT 'CAD',
  is_intercompany_entity_id  uuid REFERENCES organizations(org_id),
  is_active                  boolean NOT NULL DEFAULT true,
  created_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_org ON vendors (org_id);

-- -----------------------------------------------------------------
-- VENDOR RULES
-- Empty in Phase 1. autonomy_tier reservation present (Category A).
-- -----------------------------------------------------------------

CREATE TABLE vendor_rules (
  rule_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id           uuid NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  default_account_id  uuid REFERENCES chart_of_accounts(account_id),
  autonomy_tier       autonomy_tier NOT NULL DEFAULT 'always_confirm',
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  approved_by         uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_vendor_rules_org_vendor ON vendor_rules (org_id, vendor_id);

-- -----------------------------------------------------------------
-- CUSTOMERS, INVOICES, BILLS, PAYMENTS, BANK_ACCOUNTS, BANK_TRANSACTIONS
-- Schema present in Phase 1.1 with multi-currency columns.
-- Empty until Phase 2 begins populating.
-- -----------------------------------------------------------------

CREATE TABLE customers (
  customer_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        text,
  tax_id       text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_org ON customers (org_id);

CREATE TABLE invoices (
  invoice_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES customers(customer_id),
  invoice_number    text NOT NULL,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  -- Multi-currency columns (Category A — present even though Phase 2+)
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_org_customer ON invoices (org_id, customer_id, status);

CREATE TABLE invoice_lines (
  invoice_line_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       uuid NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  description      text NOT NULL,
  quantity         numeric(20,4) NOT NULL DEFAULT 1,
  unit_price       numeric(20,4) NOT NULL DEFAULT 0,
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);

CREATE TABLE bills (
  bill_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES vendors(vendor_id),
  bill_number       text,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  -- Multi-currency columns
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_org_vendor ON bills (org_id, vendor_id, status);

CREATE TABLE bill_lines (
  bill_line_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id          uuid NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
  account_id       uuid REFERENCES chart_of_accounts(account_id),
  description      text NOT NULL,
  amount           numeric(20,4) NOT NULL CHECK (amount > 0),
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  payment_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  payment_date  date NOT NULL,
  amount        numeric(20,4) NOT NULL,
  currency      char(3) NOT NULL DEFAULT 'CAD',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bank_accounts (
  bank_account_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                      text NOT NULL,
  institution               text,
  account_number_last_four  text,
  currency                  char(3) NOT NULL DEFAULT 'CAD',
  is_active                 boolean NOT NULL DEFAULT true
);

CREATE TABLE bank_transactions (
  bank_transaction_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  bank_account_id      uuid NOT NULL REFERENCES bank_accounts(bank_account_id),
  posted_at            timestamptz NOT NULL,
  description          text,
  -- Multi-currency columns
  currency             char(3) NOT NULL DEFAULT 'CAD',
  amount_original      numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad           numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate              numeric(20,8) NOT NULL DEFAULT 1.0
);

CREATE INDEX idx_bank_tx_org ON bank_transactions (org_id, bank_account_id, posted_at);

-- -----------------------------------------------------------------
-- TAX CODES (GST/HST abstraction — Bible Section 8c)
-- -----------------------------------------------------------------

CREATE TABLE tax_codes (
  tax_code_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(org_id) ON DELETE CASCADE,
  code            text NOT NULL,
  rate            numeric(6,4) NOT NULL,
  jurisdiction    text NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_tax_codes_jurisdiction ON tax_codes (jurisdiction, effective_from);

-- -----------------------------------------------------------------
-- AUDIT LOG (Phase 1 — synchronous, Simplification 1)
-- Phase 2 demotes this to a projection of the events table.
-- -----------------------------------------------------------------

CREATE TABLE audit_log (
  audit_log_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id),
  session_id       uuid,
  trace_id         uuid NOT NULL,
  action           text NOT NULL,
  entity_type      text NOT NULL,
  entity_id        uuid,
  before_state     jsonb,
  after_state_id   uuid,
  tool_name        text,
  idempotency_key  uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_trace ON audit_log (org_id, trace_id);
CREATE INDEX idx_audit_org_created ON audit_log (org_id, created_at);

-- -----------------------------------------------------------------
-- AI ACTIONS
-- routing_path is a Category A reservation (Bible Section 15d).
-- Display only in Phase 1; Phase 2 wires routing logic.
-- -----------------------------------------------------------------

CREATE TABLE ai_actions (
  ai_action_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id),
  session_id          uuid,
  trace_id            uuid NOT NULL,
  tool_name           text NOT NULL,
  prompt              text,
  tool_input          jsonb,
  status              ai_action_status NOT NULL DEFAULT 'pending',
  confidence          confidence_level,
  routing_path        text,
  journal_entry_id    uuid REFERENCES journal_entries(journal_entry_id),
  confirming_user_id  uuid REFERENCES auth.users(id),
  rejection_reason    text,
  idempotency_key     uuid NOT NULL,
  -- v0.5.3 (A1): cached dry-run response for idempotent replay.
  -- When the confirm path retries with the same idempotency_key,
  -- the service layer can replay the cached dry_run result instead
  -- of re-calling Claude. Also the mid-conversation API failure path
  -- (Phase 1.2 exit #16) uses this to let the user confirm an already
  -- generated ProposedEntryCard even when Claude is unreachable.
  response_payload    jsonb,
  -- v0.5.3 (A1): timestamp set when status flips to 'stale' because
  -- the Claude context was lost between dry-run and confirm. A stale
  -- row is never re-confirmed — the user must regenerate from scratch.
  staled_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  UNIQUE (org_id, idempotency_key),
  -- v0.5.3 (A1): stale rows must carry a staled_at timestamp; non-stale
  -- rows must not. Prevents ambiguous state where a row is stale but
  -- the timestamp is missing (or vice versa).
  CONSTRAINT stale_status_has_timestamp
    CHECK ((status = 'stale') = (staled_at IS NOT NULL))
);

CREATE INDEX idx_ai_actions_org_status ON ai_actions (org_id, status, created_at DESC);

-- -----------------------------------------------------------------
-- AGENT SESSIONS
-- -----------------------------------------------------------------

CREATE TABLE agent_sessions (
  session_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  locale            text NOT NULL DEFAULT 'en',
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  state             jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agent_sessions_user_org ON agent_sessions (user_id, org_id);
CREATE INDEX idx_agent_sessions_last_activity ON agent_sessions (last_activity_at);

-- -----------------------------------------------------------------
-- EVENTS TABLE — RESERVED SEAT (Simplification 2)
-- Created with append-only trigger. NOT WRITTEN TO IN PHASE 1.
-- -----------------------------------------------------------------

CREATE TABLE events (
  event_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       text NOT NULL,
  org_id           uuid NOT NULL REFERENCES organizations(org_id),
  aggregate_id     uuid NOT NULL,
  aggregate_type   text NOT NULL,
  payload          jsonb NOT NULL,
  occurred_at      timestamptz NOT NULL,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  trace_id         uuid NOT NULL,
  _event_version   text NOT NULL DEFAULT '1.0.0',
  sequence_number  bigserial NOT NULL
);

CREATE INDEX idx_events_org_aggregate ON events (org_id, aggregate_id, sequence_number);
CREATE INDEX idx_events_trace ON events (trace_id);
CREATE INDEX idx_events_type_recorded ON events (event_type, recorded_at);

COMMENT ON TABLE events IS
  'Reserved seat. Nothing writes here until Phase 2. Append-only trigger installed in Phase 1.1 to make the rule physical from day one.';

-- -----------------------------------------------------------------
-- TRIGGER: events table is append-only
--
-- v0.5.3 (D4): TRUNCATE trigger added. A BEFORE UPDATE/DELETE trigger
-- does not fire on TRUNCATE — TRUNCATE is its own event type. Before
-- v0.5.3, any role with TRUNCATE privilege (including service_role
-- by default) could wipe the events table silently, breaking the
-- append-only guarantee that Phase 2 treats as the single source of
-- truth. The fix is two-layer: a BEFORE TRUNCATE FOR EACH STATEMENT
-- trigger that raises exception, plus explicit REVOKE TRUNCATE from
-- PUBLIC, authenticated, and anon. service_role retains TRUNCATE
-- because Supabase's automatic grants cannot easily be revoked, but
-- the trigger is the actual enforcement.
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'events table is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_no_update
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

CREATE TRIGGER trg_events_no_delete
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

-- v0.5.3 (D4): TRUNCATE is a statement-level event, not row-level.
CREATE TRIGGER trg_events_no_truncate
  BEFORE TRUNCATE ON events
  FOR EACH STATEMENT
  EXECUTE FUNCTION reject_events_mutation();

-- v0.5.3 (D4): revoke TRUNCATE from every role that does not need it.
REVOKE TRUNCATE ON events FROM PUBLIC;
REVOKE TRUNCATE ON events FROM authenticated;
REVOKE TRUNCATE ON events FROM anon;

-- =================================================================
-- ROW LEVEL SECURITY (v0.5.3 — D3 + A2 complete coverage)
--
-- v0.5.3 completes the RLS story: every tenant-scoped table gets
-- ENABLE + explicit policies in this migration file, not "to be
-- added later." The previous draft left 16+ tables to be derived
-- during implementation, which is where cross-tenant bugs come from.
--
-- Two hardened SECURITY DEFINER helpers are used throughout:
--   user_has_org_access(org_id)  — is the caller a member of this org?
--   user_is_controller(org_id)   — is the caller a controller here?
--
-- Both helpers:
--   * SET search_path = '' to defeat search-path injection
--   * schema-qualify every reference (public.memberships)
--   * REVOKE FROM PUBLIC; GRANT EXECUTE TO authenticated only
--   * STABLE so the optimizer can memoize per statement
--
-- Three tables are explicit exceptions to the tenant pattern:
--   chart_of_accounts_templates — global, readable by all authenticated
--   tax_codes                   — org_id IS NULL rows are shared
--   auth.users                  — managed by Supabase Auth; do not touch
-- =================================================================

-- -----------------------------------------------------------------
-- HELPER 1: user_has_org_access (hardened, v0.5.3 A2)
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND org_id = target_org_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_org_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(uuid) TO authenticated;

-- -----------------------------------------------------------------
-- HELPER 2: user_is_controller (hardened, v0.5.3 A2)
-- Used by the audit_log, ai_actions, memberships, fiscal_periods,
-- and vendor_rules policies below.
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_is_controller(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND role = 'controller'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_controller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_controller(uuid) TO authenticated;

-- -----------------------------------------------------------------
-- ENABLE RLS on every tenant-scoped table
-- -----------------------------------------------------------------

ALTER TABLE organizations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods               ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_relationships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_rules                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_lines                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                       ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- organizations: users see orgs they have membership in
-- -----------------------------------------------------------------
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (user_has_org_access(org_id));
-- INSERT via service-role client only (admin org creation flow).

-- -----------------------------------------------------------------
-- memberships: self + controllers in same org
-- -----------------------------------------------------------------
CREATE POLICY memberships_select ON memberships
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );
-- INSERT/UPDATE/DELETE via service-role client only.

-- -----------------------------------------------------------------
-- chart_of_accounts: standard tenant pattern, UPDATE allowed
-- (accounts deactivated via is_active, not DELETE)
-- -----------------------------------------------------------------
CREATE POLICY chart_of_accounts_select ON chart_of_accounts
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_insert ON chart_of_accounts
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_update ON chart_of_accounts
  FOR UPDATE USING (user_has_org_access(org_id));
-- No DELETE policy — accounts are never deleted.

-- -----------------------------------------------------------------
-- chart_of_accounts_templates: global, readable by all authenticated.
-- EXCEPTION — not org-scoped.
-- -----------------------------------------------------------------
CREATE POLICY coa_templates_select ON chart_of_accounts_templates
  FOR SELECT TO authenticated USING (true);
-- INSERT/UPDATE/DELETE via migration only.

-- -----------------------------------------------------------------
-- fiscal_periods: members read; controllers create/update (lock)
-- -----------------------------------------------------------------
CREATE POLICY fiscal_periods_select ON fiscal_periods
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY fiscal_periods_insert ON fiscal_periods
  FOR INSERT WITH CHECK (user_is_controller(org_id));
CREATE POLICY fiscal_periods_update ON fiscal_periods
  FOR UPDATE USING (user_is_controller(org_id));
-- No DELETE — periods are immutable history.

-- -----------------------------------------------------------------
-- intercompany_relationships: visible to members of either side
-- -----------------------------------------------------------------
CREATE POLICY intercompany_relationships_select ON intercompany_relationships
  FOR SELECT USING (
    user_has_org_access(org_a_id) OR user_has_org_access(org_b_id)
  );
-- INSERTs via service-role client only (Phase 2 AP Agent).

-- -----------------------------------------------------------------
-- journal_entries: standard + immutable (reversal via new entries)
-- -----------------------------------------------------------------
CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY journal_entries_no_update ON journal_entries
  FOR UPDATE USING (false);
CREATE POLICY journal_entries_no_delete ON journal_entries
  FOR DELETE USING (false);

-- -----------------------------------------------------------------
-- journal_lines: inherit org via parent entry; immutable
-- -----------------------------------------------------------------
CREATE POLICY journal_lines_select ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_insert ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_no_update ON journal_lines
  FOR UPDATE USING (false);
CREATE POLICY journal_lines_no_delete ON journal_lines
  FOR DELETE USING (false);

-- -----------------------------------------------------------------
-- vendors: standard tenant pattern with UPDATE
-- -----------------------------------------------------------------
CREATE POLICY vendors_select ON vendors
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendors_insert ON vendors
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendors_update ON vendors
  FOR UPDATE USING (user_has_org_access(org_id));

-- -----------------------------------------------------------------
-- vendor_rules: members read; controllers create/update/delete
-- -----------------------------------------------------------------
CREATE POLICY vendor_rules_select ON vendor_rules
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_rules_cud ON vendor_rules
  FOR ALL USING (user_is_controller(org_id))
  WITH CHECK (user_is_controller(org_id));

-- -----------------------------------------------------------------
-- customers: standard tenant pattern with UPDATE
-- -----------------------------------------------------------------
CREATE POLICY customers_select ON customers
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY customers_insert ON customers
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY customers_update ON customers
  FOR UPDATE USING (user_has_org_access(org_id));

-- -----------------------------------------------------------------
-- invoices / invoice_lines: standard tenant pattern (Phase 2+)
-- -----------------------------------------------------------------
CREATE POLICY invoices_tenant ON invoices FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY invoice_lines_tenant ON invoice_lines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM invoices i
            WHERE i.invoice_id = invoice_lines.invoice_id
              AND user_has_org_access(i.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i
            WHERE i.invoice_id = invoice_lines.invoice_id
              AND user_has_org_access(i.org_id))
  );

-- -----------------------------------------------------------------
-- bills / bill_lines: standard tenant pattern (Phase 2+)
-- -----------------------------------------------------------------
CREATE POLICY bills_tenant ON bills FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY bill_lines_tenant ON bill_lines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM bills b
            WHERE b.bill_id = bill_lines.bill_id
              AND user_has_org_access(b.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM bills b
            WHERE b.bill_id = bill_lines.bill_id
              AND user_has_org_access(b.org_id))
  );

-- -----------------------------------------------------------------
-- payments: standard tenant pattern (Phase 2+)
-- -----------------------------------------------------------------
CREATE POLICY payments_tenant ON payments FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

-- -----------------------------------------------------------------
-- bank_accounts / bank_transactions: standard tenant pattern (Phase 2+)
-- -----------------------------------------------------------------
CREATE POLICY bank_accounts_tenant ON bank_accounts FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

CREATE POLICY bank_transactions_tenant ON bank_transactions FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

-- -----------------------------------------------------------------
-- tax_codes: shared (org_id IS NULL) visible to all authenticated;
-- org-specific codes only to that org. EXCEPTION — hybrid scope.
-- -----------------------------------------------------------------
CREATE POLICY tax_codes_select ON tax_codes
  FOR SELECT USING (
    org_id IS NULL OR user_has_org_access(org_id)
  );
-- INSERT/UPDATE/DELETE via service-role client only.

-- -----------------------------------------------------------------
-- audit_log: same-org members can read; no user-client writes
-- (service-role bypasses RLS for the synchronous audit write)
-- -----------------------------------------------------------------
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (user_has_org_access(org_id));
-- No INSERT policy — service-role only.

-- -----------------------------------------------------------------
-- ai_actions: initiator OR same-org controller can read
-- -----------------------------------------------------------------
CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );
CREATE POLICY ai_actions_insert ON ai_actions
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
-- UPDATE via service-role client only (confirm / reject / stale flip).

-- -----------------------------------------------------------------
-- agent_sessions: only the session owner
-- -----------------------------------------------------------------
CREATE POLICY agent_sessions_select ON agent_sessions
  FOR SELECT USING (user_id = auth.uid());
-- INSERT/UPDATE via service-role client only.

-- -----------------------------------------------------------------
-- events: Phase 1 reads via defense-in-depth; writes are service-role
-- only (and Phase 1 writes nothing anyway — Simplification 2)
-- -----------------------------------------------------------------
CREATE POLICY events_select ON events
  FOR SELECT USING (user_has_org_access(org_id));
-- No INSERT policy — service-role only in Phase 2.

-- -----------------------------------------------------------------
-- items: standard tenant pattern (reserved for Phase 2+)
-- -----------------------------------------------------------------
-- NOTE: items table is not created in this Phase 1.1 migration;
-- schema is added in the Phase 2 brief. This comment is a reminder
-- to add the ENABLE + policy in the same commit as the table.

-- -----------------------------------------------------------------
-- SEED: Two CoA templates (holding_company + real_estate)
-- The other four industries are added in Phase 1.3 or Phase 2 when needed.
-- -----------------------------------------------------------------

-- HOLDING COMPANY TEMPLATE
INSERT INTO chart_of_accounts_templates (industry, account_code, account_name, account_type, parent_account_code, is_intercompany_capable, sort_order) VALUES
  ('holding_company', '1000', 'Cash and Cash Equivalents',       'asset',     NULL,   false, 10),
  ('holding_company', '1100', 'Investments in Subsidiaries',     'asset',     NULL,   true,  20),
  ('holding_company', '1200', 'Intercompany Receivables',        'asset',     NULL,   true,  30),
  ('holding_company', '1300', 'Other Receivables',               'asset',     NULL,   false, 40),
  ('holding_company', '2000', 'Accounts Payable',                'liability', NULL,   false, 50),
  ('holding_company', '2100', 'Intercompany Payables',           'liability', NULL,   true,  60),
  ('holding_company', '2200', 'Accrued Liabilities',             'liability', NULL,   false, 70),
  ('holding_company', '3000', 'Share Capital',                   'equity',    NULL,   false, 80),
  ('holding_company', '3100', 'Retained Earnings',               'equity',    NULL,   false, 90),
  ('holding_company', '4000', 'Dividend Income',                 'revenue',   NULL,   false, 100),
  ('holding_company', '4100', 'Management Fee Income',           'revenue',   NULL,   true,  110),
  ('holding_company', '4200', 'Interest Income',                 'revenue',   NULL,   false, 120),
  ('holding_company', '5000', 'Professional Fees',               'expense',   NULL,   false, 130),
  ('holding_company', '5100', 'Office Expenses',                 'expense',   NULL,   false, 140),
  ('holding_company', '5200', 'Salaries and Wages',              'expense',   NULL,   false, 150),
  ('holding_company', '5300', 'Interest Expense',                'expense',   NULL,   false, 160);

-- REAL ESTATE TEMPLATE
INSERT INTO chart_of_accounts_templates (industry, account_code, account_name, account_type, parent_account_code, is_intercompany_capable, sort_order) VALUES
  ('real_estate', '1000', 'Cash and Cash Equivalents',           'asset',     NULL,   false, 10),
  ('real_estate', '1100', 'Tenant Receivables',                  'asset',     NULL,   false, 20),
  ('real_estate', '1200', 'Prepaid Property Taxes',              'asset',     NULL,   false, 30),
  ('real_estate', '1300', 'Land',                                'asset',     NULL,   false, 40),
  ('real_estate', '1400', 'Buildings',                           'asset',     NULL,   false, 50),
  ('real_estate', '1410', 'Accumulated Depreciation - Buildings','asset',     '1400', false, 60),
  ('real_estate', '1500', 'Intercompany Receivables',            'asset',     NULL,   true,  70),
  ('real_estate', '2000', 'Accounts Payable',                    'liability', NULL,   false, 80),
  ('real_estate', '2100', 'Mortgages Payable',                   'liability', NULL,   false, 90),
  ('real_estate', '2200', 'Tenant Security Deposits',            'liability', NULL,   false, 100),
  ('real_estate', '2300', 'Intercompany Payables',               'liability', NULL,   true,  110),
  ('real_estate', '3000', 'Owner Capital',                       'equity',    NULL,   false, 120),
  ('real_estate', '3100', 'Retained Earnings',                   'equity',    NULL,   false, 130),
  ('real_estate', '4000', 'Rental Income',                       'revenue',   NULL,   false, 140),
  ('real_estate', '4100', 'Parking Income',                      'revenue',   NULL,   false, 150),
  ('real_estate', '4200', 'Other Property Income',               'revenue',   NULL,   false, 160),
  ('real_estate', '5000', 'Property Management Fees',            'expense',   NULL,   true,  170),
  ('real_estate', '5100', 'Repairs and Maintenance',             'expense',   NULL,   false, 180),
  ('real_estate', '5200', 'Property Taxes',                      'expense',   NULL,   false, 190),
  ('real_estate', '5300', 'Insurance',                           'expense',   NULL,   false, 200),
  ('real_estate', '5400', 'Utilities',                           'expense',   NULL,   false, 210),
  ('real_estate', '5500', 'Mortgage Interest',                   'expense',   NULL,   false, 220),
  ('real_estate', '5600', 'Depreciation - Buildings',            'expense',   NULL,   false, 230);

COMMIT;
```

> **Note on tax_codes seed data:** Open Question 2 asks the founder which
> Canadian provinces' tax rates to seed. Until that is answered, the
> `tax_codes` table is created empty. The Phase 1.1 seed migration will
> add a small follow-up `002_seed_tax_codes.sql` once Q2 is answered.

> **v0.5.3 RLS coverage note:** Earlier drafts of this brief (v0.5.1,
> v0.5.2) left most RLS policies "to be added during Phase 1.1
> implementation." v0.5.3 closes that gap — every tenant-scoped table
> in this migration has an explicit `ENABLE ROW LEVEL SECURITY` and at
> least one policy above. The three explicit exceptions are
> `chart_of_accounts_templates` (global, readable by all authenticated),
> `tax_codes` (hybrid — shared codes with `org_id IS NULL` plus
> org-specific codes), and `auth.users` (Supabase-managed, not
> touched). If a future Phase 1.1 edit adds a new tenant-scoped table,
> the same commit must add its `ENABLE` + policies — unprotected tables
> with RLS disabled are the exact class of bug v0.5.3 D3 exists to
> prevent.

---

### 5. Seed Script

`src/db/seed/dev.sql` — idempotent dev seed that creates the
two real orgs, three real users (one per role), the membership links, and
the CoA loaded from each org's industry template.

**Idempotency strategy:** the script DELETEs the seed orgs by name first
(cascading to memberships, CoA, etc.), then re-creates them. Safe to run
repeatedly. Uses fixed UUIDs for the seed users so the test files can
import them without lookups.

**Important constraint:** Supabase Auth manages its own `auth.users` table
and does not allow direct SQL INSERTs against it. The dev users must be
created via the Supabase admin API (Open Question 10 — pending founder
confirmation; this brief assumes confirmation). The SQL seed script
**assumes the auth users already exist** with the fixed UUIDs below; a
small Node.js bootstrap script (`scripts/seed-auth-users.ts`) creates the
auth users via the admin API before the SQL seed runs.

#### 5a. Auth User Bootstrap (`scripts/seed-auth-users.ts`)

```typescript
// scripts/seed-auth-users.ts
// Creates the three seed dev users via the Supabase admin API.
// Idempotent: deletes the users by ID first if they exist, then recreates.
// Run before db:seed.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Fixed UUIDs so the SQL seed and the integration tests can reference them.
const SEED_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'executive@thebridge.local',
    password: 'DevSeed!Executive#1',
    role_label: 'executive',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'controller@thebridge.local',
    password: 'DevSeed!Controller#1',
    role_label: 'controller',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'ap@thebridge.local',
    password: 'DevSeed!ApSpec#1',
    role_label: 'ap_specialist',
  },
];

async function main() {
  for (const user of SEED_USERS) {
    // Delete first (idempotent reset)
    await admin.auth.admin.deleteUser(user.id).catch(() => {});

    const { error } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role_label: user.role_label },
    });

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
      process.exit(1);
    }
    console.log(`Created seed user: ${user.email} (${user.id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Add to `package.json` scripts:
```json
"db:seed:auth": "tsx scripts/seed-auth-users.ts",
"db:seed:all": "pnpm db:seed:auth && pnpm db:seed"
```

#### 5b. SQL Seed (`src/db/seed/dev.sql`)

```sql
-- =============================================================
-- dev.sql — idempotent dev seed
-- Run AFTER scripts/seed-auth-users.ts has created the auth users.
-- =============================================================
-- This script:
--   1. Deletes the two seed orgs by name (cascades to CoA, memberships)
--   2. Creates the two seed orgs (Holding Co + Real Estate Entity)
--   3. Loads the CoA template into chart_of_accounts for each
--   4. Creates memberships linking the three seed users to both orgs
--      with their assigned role
--   5. Creates one open fiscal period per org for the current year
-- Safe to run multiple times.
-- =============================================================

BEGIN;

-- 1. Wipe seed data (cascade handles dependents)
DELETE FROM organizations
WHERE name IN ('Bridge Holding Co (DEV)', 'Bridge Real Estate Entity (DEV)');

-- 2. Create the two orgs with fixed UUIDs
INSERT INTO organizations (org_id, name, legal_name, industry, functional_currency, fiscal_year_start_month) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'Bridge Holding Co (DEV)', 'Bridge Holding Company Inc.', 'holding_company', 'CAD', 1),
  ('22222222-2222-2222-2222-222222222222',
   'Bridge Real Estate Entity (DEV)', 'Bridge Real Estate Holdings Ltd.', 'real_estate', 'CAD', 1);

-- 3. Load CoA from templates into each org
INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, is_intercompany_capable)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  account_code, account_name, account_type, is_intercompany_capable
FROM chart_of_accounts_templates
WHERE industry = 'holding_company';

INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, is_intercompany_capable)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  account_code, account_name, account_type, is_intercompany_capable
FROM chart_of_accounts_templates
WHERE industry = 'real_estate';

-- 4. Memberships
-- Executive: access to BOTH orgs
INSERT INTO memberships (user_id, org_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'executive'),
  ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'executive');

-- Controller: access to BOTH orgs
INSERT INTO memberships (user_id, org_id, role) VALUES
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'controller'),
  ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'controller');

-- AP Specialist: access to ONLY the Real Estate org (proves the role-aware switcher)
INSERT INTO memberships (user_id, org_id, role) VALUES
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'ap_specialist');

-- 5. One open fiscal period per org (current calendar year)
INSERT INTO fiscal_periods (org_id, name, start_date, end_date, is_locked) VALUES
  ('11111111-1111-1111-1111-111111111111', 'FY Current', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year - 1 day')::date, false),
  ('22222222-2222-2222-2222-222222222222', 'FY Current', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year - 1 day')::date, false);

-- One LOCKED period for the prior year — used by integration test 2
INSERT INTO fiscal_periods (org_id, name, start_date, end_date, is_locked, locked_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'FY Prior (LOCKED)',
   (date_trunc('year', now()) - interval '1 year')::date,
   (date_trunc('year', now()) - interval '1 day')::date,
   true, now());

COMMIT;
```

**Why the AP Specialist sees only one org:** the Phase 1.1 exit criteria
require proving the role-aware org switcher works. With one user
restricted to a single org, the test is unambiguous: log in as the AP
specialist, the org switcher should show only "Bridge Real Estate Entity
(DEV)" and not the Holding Co.

---

### 6. Five Integration Tests (Category A Floor — v0.5.5)

These five tests are non-negotiable. They are the proof that the most
important guarantees in the system actually work end-to-end against a real
Postgres instance — not unit tests with mocked database calls. The count
evolved: v0.5.0 established three, v0.5.3 added the service-middleware
authorization test as test 4 (the count correction was never pushed into
PLAN.md §10a until v0.5.5 did both at once), and v0.5.5 added the reversal
mirror test as test 5 alongside the Q19 reversal mechanism. See PLAN.md
§10a for the canonical list and §7 Phase 1.1 exit criterion #3 for the
pass requirement.

(Plain English: an "integration test" runs against a real database. A unit
test runs against fake stand-ins. For accounting correctness, only the
real database can prove the deferred constraint and the RLS policies work.)

**Test infrastructure convention (v0.5.7).** Test helper SQL functions
(e.g., `test_post_unbalanced_entry`, `test_post_balanced_entry`) are
loaded by `tests/setup/globalSetup.ts` via `psql` before any test file
runs. They are NOT in `supabase/migrations/` — test functions must never
ship to production. `globalSetup.ts` is wired into `vitest.config.ts`
via the `globalSetup` field. If you add new test helper SQL functions,
add them to `tests/setup/test_helpers.sql` and they'll be loaded
automatically. If `globalSetup` fails (psql not found, DB unreachable),
every test in the suite is skipped with a clear error message.

#### 6a. Test setup (`tests/setup/testDb.ts`)

```typescript
// tests/setup/testDb.ts
// Provides a fresh Supabase admin client for each test.
// Tests run against the local Supabase instance (`pnpm db:start`).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// v0.5.5 (Q18): parameterized fallback chain. Tests must not hardcode
// localhost:54321 — see PLAN.md §10a. The fallback chain is
// SUPABASE_TEST_URL → SUPABASE_URL → local Supabase default, and the
// local default is resolved at runtime from `supabase status`-equivalent
// env so the string does not appear as a literal in this file. The CI
// grep-fail check greps for the literal `localhost:54321` and the
// literal `127.0.0.1:54321` in test files and rejects either.
const SUPABASE_URL =
  process.env.SUPABASE_TEST_URL ??
  process.env.SUPABASE_URL ??
  (() => {
    throw new Error(
      'Integration tests require SUPABASE_TEST_URL (preferred) or ' +
      'SUPABASE_URL to be set. For local development, run `supabase status` ' +
      'and export the printed URL as SUPABASE_URL in .env.test.local. ' +
      'Hardcoding the local address in this file is forbidden — Q18 rule.'
    );
  })();

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_TEST_SERVICE_ROLE_KEY (preferred) or ' +
    'SUPABASE_SERVICE_ROLE_KEY required for integration tests'
  );
}

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Fixed seed UUIDs (must match dev.sql)
export const SEED = {
  USER_EXECUTIVE:    '00000000-0000-0000-0000-000000000001',
  USER_CONTROLLER:   '00000000-0000-0000-0000-000000000002',
  USER_AP_SPECIALIST:'00000000-0000-0000-0000-000000000003',
  ORG_HOLDING:       '11111111-1111-1111-1111-111111111111',
  ORG_REAL_ESTATE:   '22222222-2222-2222-2222-222222222222',
} as const;

// Helper: create a user-scoped client signed in as a specific seed user.
// Used by Test 3 to verify RLS isolation.
export async function userClientFor(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY!);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}
```

#### 6b. Test 1: unbalanced journal entry rejected by deferred constraint

`tests/integration/unbalancedJournalEntry.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Integration Test 1: deferred constraint rejects unbalanced entry', () => {
  const db = adminClient();

  it('rejects an entry whose debits do not equal credits at COMMIT', async () => {
    // Get any cash account from the holding org
    const { data: cashAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();

    const { data: feesAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '5000')
      .single();

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    // Build an UNBALANCED entry: debit 100, credit 90.
    // We use an explicit RPC that wraps INSERT journal_entries +
    // INSERT journal_lines in a single transaction so the deferred
    // constraint fires at COMMIT.
    const { error } = await db.rpc('test_post_unbalanced_entry', {
      p_org_id: SEED.ORG_HOLDING,
      p_period_id: period!.period_id,
      p_debit_account: feesAcct!.account_id,
      p_credit_account: cashAcct!.account_id,
      p_debit_amount: 100,
      p_credit_amount: 90,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/not balanced/i);
  });
});
```

The test uses an `rpc` (server-side function) called `test_post_unbalanced_entry`
because the deferred constraint must fire inside a single transaction —
two separate Supabase REST calls would each commit independently and the
constraint would fire on the first one's COMMIT before the second insert
even happens. The function lives in a test-only migration:

```sql
-- tests/setup/test_helpers.sql — applied to local Supabase only
CREATE OR REPLACE FUNCTION test_post_unbalanced_entry(
  p_org_id uuid,
  p_period_id uuid,
  p_debit_account uuid,
  p_credit_account uuid,
  p_debit_amount numeric,
  p_credit_amount numeric
) RETURNS uuid AS $$
DECLARE
  v_entry_id uuid;
BEGIN
  INSERT INTO journal_entries (org_id, fiscal_period_id, entry_date, description, source)
  VALUES (p_org_id, p_period_id, current_date, 'TEST UNBALANCED', 'manual')
  RETURNING journal_entry_id INTO v_entry_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, debit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_debit_account, p_debit_amount, p_debit_amount, p_debit_amount);

  INSERT INTO journal_lines (journal_entry_id, account_id, credit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_credit_account, p_credit_amount, p_credit_amount, p_credit_amount);

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;
```

#### 6c. Test 2: post to locked fiscal period rejected by trigger

`tests/integration/lockedPeriodRejection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Integration Test 2: locked period trigger rejects writes', () => {
  const db = adminClient();

  it('rejects a journal_lines insert if the fiscal period is locked', async () => {
    // The Real Estate org has a LOCKED prior-year period from the seed.
    const { data: lockedPeriod } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('is_locked', true)
      .single();

    expect(lockedPeriod).not.toBeNull();

    const { data: cashAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '1000')
      .single();

    const { data: rentAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '4000')
      .single();

    // Try to post a balanced entry to the locked period via the test helper.
    const { error } = await db.rpc('test_post_balanced_entry', {
      p_org_id: SEED.ORG_REAL_ESTATE,
      p_period_id: lockedPeriod!.period_id,
      p_debit_account: cashAcct!.account_id,
      p_credit_account: rentAcct!.account_id,
      p_amount: 500,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/locked fiscal period/i);
  });
});
```

The companion `test_post_balanced_entry` function follows the same shape
as `test_post_unbalanced_entry` but with equal debit and credit amounts.

#### 6d. Test 3: cross-org RLS isolation

`tests/integration/crossOrgRlsIsolation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { userClientFor, SEED } from '../setup/testDb';

describe('Integration Test 3: RLS isolates orgs', () => {
  it('AP Specialist user cannot SELECT data from the Holding Co (no membership)', async () => {
    // The AP Specialist seed user has membership only in the Real Estate org.
    const apClient = await userClientFor(
      'ap@thebridge.local',
      'DevSeed!ApSpec#1'
    );

    // Try to read the Holding Co's chart_of_accounts.
    // RLS should return an empty array — no error, no data.
    const { data, error } = await apClient
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING);

    expect(error).toBeNull();
    expect(data).toEqual([]);  // RLS hides the rows entirely

    // Verify the same user CAN see Real Estate data
    const { data: rentData, error: rentError } = await apClient
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE);

    expect(rentError).toBeNull();
    expect(rentData!.length).toBeGreaterThan(0);
  });
});
```

This test is the most important of the three. It proves that even if a
service function had a bug and forgot to filter by `org_id`, RLS would
catch it. **If this test ever regresses, stop everything and find the
cause before merging anything else.**

#### 6e. Vitest config (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/loadEnv.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
```

`tests/setup/loadEnv.ts` loads `.env.local` so `SUPABASE_TEST_URL`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY`
are present. The Q18 rule on parameterization (§6a, above) is in
effect: local dev defaults come from env, never from a literal in
code.

#### 6f. Test 4: service middleware authorization (v0.5.5, A3)

`tests/integration/serviceMiddlewareAuthorization.test.ts`

This test was promised in PLAN.md §15e as a v0.5.3 A3 addition —
the count correction was never pushed into the original Phase 1.1
brief (or into §10a) until v0.5.5 did both at once. It ships now.

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { InvariantViolationError } from '@/services/middleware/errors';

describe('Integration Test 4: service middleware rejects unauthorized callers', () => {
  const db = adminClient();

  it('throws InvariantViolationError before any DB write when the caller has no membership in the target org', async () => {
    // The AP Specialist user has membership in ORG_REAL_ESTATE ONLY
    // (see dev.sql §4). Attempting a journal entry against ORG_HOLDING
    // must be rejected by withInvariants() → canUserPerformAction()
    // BEFORE the transaction begins.
    const ctx: ServiceContext = {
      trace_id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      caller: {
        verified: true,
        user_id: SEED.USER_AP_SPECIALIST,
        email: 'ap@thebridge.local',
      },
      locale: 'en',
    };

    // Snapshot baseline row counts so we can prove nothing was written.
    const { count: beforeJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: beforeAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);

    // Build a structurally valid input — the authorization check must
    // reject this before validity matters.
    const input = buildValidJournalEntryInput(SEED.ORG_HOLDING);

    await expect(
      withInvariants(journalEntryService.post)(input, ctx)
    ).rejects.toThrow(InvariantViolationError);

    // The test is only meaningful if nothing was written. If a row
    // appears, the check ran too late (inside the transaction rather
    // than before it), which is itself a bug.
    const { count: afterJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: afterAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);

    expect(afterJournals).toBe(beforeJournals);
    expect(afterAudit).toBe(beforeAudit);
  });
});

// Helper: builds a structurally valid input that would succeed if the
// caller had authorization. Extracted here so the test's purpose
// (authorization rejection, not validation) is obvious.
function buildValidJournalEntryInput(orgId: string) {
  // Implementation left to the developer — it mirrors the happy-path
  // structure in Test 1 (§6b) but points at ORG_HOLDING's accounts
  // and a balanced two-line debit/credit pair.
  throw new Error('implement in Phase 1.1 — see §6b for the shape');
}
```

**What this test proves:** PLAN.md §15e Layer 2 (v0.5.3, A3) — that
`canUserPerformAction()` is invoked by `withInvariants()` before
any service function body runs, and that a missing-membership call
never reaches a transaction. Without this test, the A3 middleware
rule is a promise the integration suite never verified.

#### 6g. Test 5: reversal mirror enforcement (v0.5.5, Q19)

`tests/integration/reversalMirror.test.ts`

This test was promised in PLAN.md §2b, §15e Layer 2, and §18c.19
RESOLVED (ADR-001 seed material) as a mandatory Phase 1.1 ship
item. It exercises the service-layer mirror check and proves
that a non-mirror reversal is rejected before the transaction
begins.

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/middleware/errors';

describe('Integration Test 5: reversal mirror check rejects non-mirror reversal', () => {
  const db = adminClient();
  let originalEntryId: string;

  const controllerCtx = (orgId: string): ServiceContext => ({
    trace_id: crypto.randomUUID(),
    org_id: orgId,
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
    },
    locale: 'en',
  });

  beforeAll(async () => {
    // Post a valid original entry we can attempt to reverse.
    const result = await withInvariants(journalEntryService.post)(
      buildBalancedEntryInput(SEED.ORG_HOLDING),
      controllerCtx(SEED.ORG_HOLDING)
    );
    originalEntryId = result.journal_entry_id;
  });

  it('rejects a reversal whose lines are NOT the debit/credit mirror of the original', async () => {
    // Build a reversal with the SAME debit/credit sides as the original
    // (not swapped). This must be rejected with REVERSAL_NOT_MIRROR
    // before the transaction begins.
    const nonMirrorReversal = {
      ...buildBalancedEntryInput(SEED.ORG_HOLDING),
      reverses_journal_entry_id: originalEntryId,
      reversal_reason: 'deliberate non-mirror for test',
      // lines copied verbatim from original, NOT swapped
    };

    const { count: beforeCount } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('reverses_journal_entry_id', originalEntryId);

    await expect(
      withInvariants(journalEntryService.post)(nonMirrorReversal, controllerCtx(SEED.ORG_HOLDING))
    ).rejects.toThrow(/REVERSAL_NOT_MIRROR/);

    const { count: afterCount } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('reverses_journal_entry_id', originalEntryId);

    expect(afterCount).toBe(beforeCount);
  });

  it('rejects a reversal with empty reversal_reason even if the mirror holds', async () => {
    const mirroredButReasonless = {
      ...buildBalancedEntryInput(SEED.ORG_HOLDING),
      reverses_journal_entry_id: originalEntryId,
      reversal_reason: '', // empty — must be rejected
      // lines are the correct mirror
    };

    await expect(
      withInvariants(journalEntryService.post)(mirroredButReasonless, controllerCtx(SEED.ORG_HOLDING))
    ).rejects.toThrow(); // service error OR DB CHECK constraint — both are acceptable rejections
  });

  it('accepts a correctly mirrored reversal with a non-empty reason (happy path)', async () => {
    const goodReversal = {
      ...buildBalancedEntryInput(SEED.ORG_HOLDING),
      reverses_journal_entry_id: originalEntryId,
      reversal_reason: 'vendor misclassified — correcting per controller review',
      // lines are the correct mirror (debits and credits swapped)
    };

    const result = await withInvariants(journalEntryService.post)(
      goodReversal,
      controllerCtx(SEED.ORG_HOLDING)
    );

    expect(result.journal_entry_id).toBeDefined();

    // Verify the FK link landed
    const { data: row } = await db
      .from('journal_entries')
      .select('reverses_journal_entry_id, reversal_reason')
      .eq('journal_entry_id', result.journal_entry_id)
      .single();

    expect(row?.reverses_journal_entry_id).toBe(originalEntryId);
    expect(row?.reversal_reason).toBe(
      'vendor misclassified — correcting per controller review'
    );
  });
});

// Helper: builds a balanced two-line entry with swappable debit/credit
// sides. The actual implementation mirrors Test 1's input shape — see
// §6b for the canonical pattern.
function buildBalancedEntryInput(orgId: string) {
  throw new Error('implement in Phase 1.1 — see §6b for the shape');
}
```

**What this test proves:** PLAN.md §2b (reversal mirror invariant)
and §15e Layer 2 (the full reversal mirror check procedure with all
five reject branches). Three sub-cases cover the main failure modes:
(a) non-mirror rejection with `REVERSAL_NOT_MIRROR`, (b) empty
`reversal_reason` rejection by either service layer or DB CHECK,
(c) the happy path confirming a correctly mirrored reversal lands
with the FK and reason populated. Partial reversals, cross-org
reversals, and reversal-of-reversal chains are Phase 2 and not
exercised here — see PLAN.md §18c.19 RESOLVED for the Phase 2
deferrals.

**Helper implementations left to the developer.** The
`buildValidJournalEntryInput` helper in §6f and
`buildBalancedEntryInput` helper in §6g both throw
`implement in Phase 1.1 — see §6b for the shape` as placeholders.
They are not implemented here because the canonical shape of a
`PostJournalEntryInput` is already documented in §6b (Test 1) and
the developer fills in the specifics — account IDs, amounts, line
count — against the seeded data. Both helpers should use
`MoneyAmount` strings per PLAN.md §3a, never JavaScript numbers.

---

### 7. Environment Setup

#### 7a. `.env.example` (committed to repo)

```bash
# .env.example
# Copy to .env.local and fill in real values.
# .env.local is gitignored and never committed.

# -----------------------------------------------------------------
# SUPABASE — required
# -----------------------------------------------------------------
# Project URL. From: Supabase dashboard → Project Settings → API → Project URL
# Or for local dev: `supabase status` after `supabase start`
# Client-safe (NEXT_PUBLIC_ prefix → bundled into the browser)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Public anon key — used for sign-in only. Cannot bypass RLS.
# From: Supabase dashboard → Project Settings → API → Project API keys → anon
# Client-safe (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key — bypasses RLS. Server-only. NEVER expose to browser.
# From: Supabase dashboard → Project Settings → API → Project API keys → service_role
# CRITICAL: must not have NEXT_PUBLIC_ prefix.
# Boot assertion (src/shared/env.ts) will refuse to start without this.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Local database connection — used by `pnpm db:seed` only.
# `supabase status` shows this as "DB URL".
LOCAL_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# -----------------------------------------------------------------
# ANTHROPIC — required (Phase 1.1 imports it but does not call it yet)
# -----------------------------------------------------------------
# From: https://console.anthropic.com → API Keys
# Server-only. NEVER expose to browser.
# Boot assertion will refuse to start without this even though Phase 1.1
# does not call the API yet — this enforces the discipline early.
ANTHROPIC_API_KEY=sk-ant-your-key-here

# -----------------------------------------------------------------
# APP CONFIG — required
# -----------------------------------------------------------------
# Used for OAuth redirect URLs and absolute links.
# Client-safe.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Default locale fallback. One of: en, fr-CA, zh-Hant
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Node environment. Standard values.
NODE_ENV=development

# Logger level. Phase 1.1 default: 'info'. Use 'debug' for verbose dev output.
LOG_LEVEL=info

# -----------------------------------------------------------------
# PHASE 2+ — DO NOT FILL IN PHASE 1.1
# -----------------------------------------------------------------
# FLINKS_CLIENT_ID=
# FLINKS_SECRET=
```

| Variable | Phase | Server-only? | Boot-assertion? | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 1.1 | No (client-safe) | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1.1 | No (client-safe) | Yes | Supabase Auth client sign-in |
| `SUPABASE_SERVICE_ROLE_KEY` | 1.1 | **YES** | **YES** | Bypasses RLS for service layer |
| `LOCAL_DATABASE_URL` | 1.1 | YES | No | psql for `db:seed` |
| `ANTHROPIC_API_KEY` | 1.1 | **YES** | **YES** | Reserved — Phase 1.2 will use it |
| `NEXT_PUBLIC_APP_URL` | 1.1 | No (client-safe) | Yes | OAuth redirects |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | 1.1 | No (client-safe) | Yes | i18n fallback |
| `LOG_LEVEL` | 1.1 | No | No | pino verbosity |
| `FLINKS_*` | 2 | YES | No | Phase 2 only |

#### 7b. Boot Assertion (`src/shared/env.ts`)

```typescript
// src/shared/env.ts
// Boot-time environment variable assertion.
// Imported by next.config.ts so the app refuses to start without
// the critical secrets.

const REQUIRED_SERVER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
] as const;

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_DEFAULT_LOCALE',
] as const;

function assertEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) missing.push(key);
  }
  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    const msg = [
      'FATAL: missing required environment variables.',
      'Refusing to start.',
      '',
      'Missing:',
      ...missing.map((k) => `  - ${k}`),
      '',
      'Copy .env.example → .env.local and fill in the values.',
      'See Phase 1.1 Execution Brief Section 7 for details.',
    ].join('\n');
    throw new Error(msg);
  }
}

assertEnv();

// Export typed accessors so the rest of the app reads env via this module
// instead of process.env directly. This makes it impossible to add a new
// env var without updating this file.
export const env = {
  SUPABASE_URL:               process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY:          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY:  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ANTHROPIC_API_KEY:          process.env.ANTHROPIC_API_KEY!,
  APP_URL:                    process.env.NEXT_PUBLIC_APP_URL!,
  DEFAULT_LOCALE:             process.env.NEXT_PUBLIC_DEFAULT_LOCALE!,
  LOG_LEVEL:                  process.env.LOG_LEVEL ?? 'info',
  NODE_ENV:                   process.env.NODE_ENV ?? 'development',
} as const;
```

In `next.config.ts`:
```typescript
import './src/shared/env'; // boot-time assertion runs as a side effect on import
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

export default withNextIntl({
  reactStrictMode: true,
});
```

#### 7c. i18n Setup (`next-intl`)

(Plain English: i18n means "internationalization" — the framework that
lets the app render its UI in different languages based on the user's
locale. We configure all three locales in Phase 1.1 even though only
English content is populated, because adding `[locale]` to every URL
later is a per-route refactor.)

`src/shared/i18n/config.ts`:
```typescript
export const LOCALES = ['en', 'fr-CA', 'zh-Hant'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
```

`src/shared/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  if (!LOCALES.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../../../messages/${locale}.json`)).default,
  };
});
```

`messages/en.json` (Phase 1.1 — populated):
```json
{
  "auth": {
    "signIn": "Sign in to The Bridge",
    "email": "Email",
    "password": "Password",
    "submit": "Sign in",
    "signOut": "Sign out"
  },
  "nav": {
    "chartOfAccounts": "Chart of Accounts",
    "journalEntries": "Journal Entries",
    "agentUnavailable": "Agent unavailable — use quick navigation"
  },
  "orgSwitcher": {
    "label": "Organization",
    "switchTo": "Switch to {orgName}"
  },
  "agent": {
    "emptyState": "What would you like to do?",
    "suggestedPromptsHeading": "Try one of these"
  }
}
```

`messages/fr.json` and `messages/zh-Hant.json`: same key structure as
`en.json`, with English fallback values for now. The Phase 1.1 exit
criterion is that the sign-in screen renders in all three locales without
crashing — not that the French and Mandarin translations are accurate.
Real translations come in a later phase.

> **Note on locale code:** the `next-intl` config uses `fr-CA` and
> `zh-Hant` as the directory names, but the translation files are
> `fr.json` and `zh-Hant.json` for brevity in the imports. If `next-intl`
> requires the file names to match the locale codes exactly, rename to
> `fr-CA.json` during implementation. Document the choice in
> `docs/friction-journal.md`.

---

### 8. Pino Logger Setup

`src/shared/logger/pino.ts`:

```typescript
// src/shared/logger/pino.ts
// Structured logger with redact list configured at boot.
// Every log line includes trace_id, org_id, user_id when available.

import pino from 'pino';
import { env } from '@/shared/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    // Identifies which process emitted the log line.
    service: 'the-bridge',
    env: env.NODE_ENV,
  },
  // Redact list — applied to every log line.
  // Anything matching these paths is replaced with [REDACTED].
  redact: {
    paths: [
      // Auth tokens and headers
      'headers.authorization',
      'headers.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      // Generic secrets
      '*.password',
      '*.api_key',
      '*.apiKey',
      '*.secret',
      '*.token',
      // Specific env-var leaks
      'env.SUPABASE_SERVICE_ROLE_KEY',
      'env.ANTHROPIC_API_KEY',
      // Financial / PII
      '*.bank_account_number',
      '*.account_number_last_four',
      '*.tax_id',
      '*.sin',
      '*.card_number',
    ],
    censor: '[REDACTED]',
  },
  // Pretty-print in dev only.
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// Helper: returns a child logger with trace_id / org_id / user_id bound.
// Every service function takes a ServiceContext and creates one of these
// at the start of its execution. See Section 11.
export function loggerWith(ctx: {
  trace_id: string;
  org_id?: string;
  user_id?: string;
}) {
  return logger.child(ctx);
}
```

**Verification (part of Phase 1.1 exit criteria):** intentionally log a
message containing `process.env.SUPABASE_SERVICE_ROLE_KEY` and confirm it
appears as `[REDACTED]` in the output. Add this as a one-shot script:

`scripts/verify-pino-redaction.ts`:
```typescript
import { logger } from '../src/shared/logger/pino';

logger.info({
  test: 'redaction sanity check',
  api_key: 'sk-this-should-be-redacted',
  password: 'this-too',
  headers: {
    authorization: 'Bearer this-too-should-be-redacted',
  },
  safe_field: 'this should appear unredacted',
});
```

Run with `pnpm tsx scripts/verify-pino-redaction.ts`. Expected output
shows `safe_field` in cleartext and the others as `[REDACTED]`.

---

### 9. The Bridge UI Shell (Phase 1.1 — No Agent Yet)

The chat panel renders an empty state with persona-aware suggested
prompts but does **not** call any LLM. The Mainframe rail is the primary
navigation in Phase 1.1. The canvas renderer compiles against the full
`CanvasDirective` discriminated union (Bible Section 4b) — Phase 2+
directive types render the `ComingSoonPlaceholder`.

#### 9a. Three-Zone Split-Screen Layout

`src/components/bridge/SplitScreenLayout.tsx`:

```typescript
// src/components/bridge/SplitScreenLayout.tsx
// The Bridge shell. Three zones:
//   1. Mainframe rail (far left, ~64px, always visible)
//   2. Agent chat panel (~380px, collapsible)
//   3. Contextual canvas (fills remaining width)
//
// In Phase 1.1, the chat panel is empty (no agent). The Mainframe rail
// is the primary navigation. The canvas renders whatever the user
// selected via the Mainframe.

import { ReactNode, useState } from 'react';
import { MainframeRail } from './MainframeRail';
import { AgentChatPanel } from './AgentChatPanel';
import { ContextualCanvas } from './ContextualCanvas';
import { OrgSwitcher } from './OrgSwitcher';
import type { CanvasDirective } from '@/shared/types/canvasDirective';

interface Props {
  orgId: string;
  initialDirective?: CanvasDirective;
}

export function SplitScreenLayout({ orgId, initialDirective }: Props) {
  const [directive, setDirective] = useState<CanvasDirective>(
    initialDirective ?? { type: 'none' }
  );
  const [chatCollapsed, setChatCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50">
      {/* Top nav strip with org switcher */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-neutral-200 bg-white flex items-center px-4 z-10">
        <OrgSwitcher currentOrgId={orgId} />
      </div>

      <div className="flex h-screen w-screen pt-12">
        {/* Zone 1: Mainframe rail */}
        <MainframeRail
          orgId={orgId}
          onNavigate={setDirective}
        />

        {/* Zone 2: Agent chat panel */}
        {!chatCollapsed && (
          <AgentChatPanel
            orgId={orgId}
            onCollapse={() => setChatCollapsed(true)}
          />
        )}

        {/* Zone 3: Contextual canvas */}
        <ContextualCanvas
          directive={directive}
          onDirectiveChange={setDirective}
        />
      </div>
    </div>
  );
}
```

#### 9b. Mainframe Rail with API Status Dot

`src/components/bridge/MainframeRail.tsx`:

```typescript
// src/components/bridge/MainframeRail.tsx
// The far-left icon rail. Always visible. Provides direct-launch
// navigation for the most common canvas views.
//
// Includes the API Status Dot — green/yellow/red indicator of Claude
// API availability. In Phase 1.1, the dot defaults to green because
// we don't actually call the API yet. In Phase 1.2, real status replaces
// the placeholder.

import { ApiStatusDot } from './ApiStatusDot';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import { useTranslations } from 'next-intl';

interface Props {
  orgId: string;
  onNavigate: (d: CanvasDirective) => void;
}

const ICONS = [
  { id: 'coa',      label: 'Chart of Accounts', icon: '📒' },
  { id: 'journals', label: 'Journal Entries',   icon: '📔' },
  { id: 'pl',       label: 'P&L Report',        icon: '📊' },
  { id: 'actions',  label: 'AI Action Review',  icon: '✅' },
] as const;

export function MainframeRail({ orgId, onNavigate }: Props) {
  const t = useTranslations('nav');

  function handleClick(id: string) {
    switch (id) {
      case 'coa':
        return onNavigate({ type: 'chart_of_accounts', orgId });
      case 'journals':
        return onNavigate({ type: 'journal_entry_list', orgId });
      case 'pl':
        return onNavigate({
          type: 'report_pl',
          orgId,
          from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
        });
      case 'actions':
        return onNavigate({ type: 'ai_action_review_queue', orgId });
    }
  }

  return (
    <nav className="flex flex-col items-center w-16 border-r border-neutral-200 bg-white py-3 gap-2">
      <div className="text-xs font-bold text-neutral-500 tracking-widest mb-2">
        MAIN
      </div>
      {ICONS.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          title={item.label}
          className="w-10 h-10 rounded-md hover:bg-neutral-100 flex items-center justify-center text-xl"
        >
          {item.icon}
        </button>
      ))}
      <div className="flex-1" />
      {/* API Status Dot at the bottom of the rail */}
      <ApiStatusDot />
    </nav>
  );
}
```

`src/components/bridge/ApiStatusDot.tsx`:

```typescript
// src/components/bridge/ApiStatusDot.tsx
// Green/yellow/red dot showing Claude API availability.
// In Phase 1.1: always green (we don't call the API yet).
// In Phase 1.2: real status from a /api/health/anthropic endpoint.
// When red: Mainframe auto-expands with a banner saying
// "Agent unavailable — use quick navigation."

import { useTranslations } from 'next-intl';

type Status = 'green' | 'yellow' | 'red';

interface Props {
  status?: Status;
}

export function ApiStatusDot({ status = 'green' }: Props) {
  const t = useTranslations('nav');

  const color = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  }[status];

  const title = {
    green: 'Agent ready',
    yellow: 'Agent degraded',
    red: t('agentUnavailable'),
  }[status];

  return (
    <div className="flex flex-col items-center gap-1 mb-2" title={title}>
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div className="text-[9px] text-neutral-500">API</div>
    </div>
  );
}
```

**The red-state behavior** (auto-expand Mainframe with banner): not
implemented in Phase 1.1 because the dot is always green in 1.1. The
banner copy is in `messages/en.json` under `nav.agentUnavailable` so it
is ready when Phase 1.2 wires real status. Document the wiring as a
Phase 1.2 task in the Phase 1.2 brief.

#### 9c. Contextual Canvas with Independent Navigation History

`src/components/bridge/ContextualCanvas.tsx`:

```typescript
// src/components/bridge/ContextualCanvas.tsx
// The right-pane canvas. Renders whatever directive it was last given.
// Maintains its OWN navigation history (back/forward arrows in the
// canvas header) — completely separate from chat history. This is
// important: the user can drill into a journal entry, then go back,
// then forward, without disturbing the conversation.

import { useState } from 'react';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import { ChartOfAccountsView } from '@/components/canvas/ChartOfAccountsView';
import { JournalEntryListView } from '@/components/canvas/JournalEntryListView';
import { ComingSoonPlaceholder } from '@/components/canvas/ComingSoonPlaceholder';
import { ProposedEntryCard } from '@/components/ProposedEntryCard';

interface Props {
  directive: CanvasDirective;
  onDirectiveChange: (d: CanvasDirective) => void;
}

export function ContextualCanvas({ directive, onDirectiveChange }: Props) {
  // Independent navigation history for the canvas.
  // This is NOT chat history. The user can navigate forward/back in the
  // canvas without affecting the conversation or scrolling chat.
  const [history, setHistory] = useState<CanvasDirective[]>([directive]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // When a new directive comes in (from chat or Mainframe), push it onto
  // the history stack and trim anything ahead of the current position
  // (standard browser-back-forward semantics).
  function pushDirective(d: CanvasDirective) {
    const newHistory = [...history.slice(0, historyIndex + 1), d];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onDirectiveChange(d);
  }

  function goBack() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onDirectiveChange(history[historyIndex - 1]);
    }
  }

  function goForward() {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onDirectiveChange(history[historyIndex + 1]);
    }
  }

  // Sync external directive changes into local history
  if (directive !== history[historyIndex]) {
    pushDirective(directive);
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Canvas header with back/forward arrows */}
      <div className="h-10 border-b border-neutral-200 flex items-center px-3 gap-2">
        <button
          onClick={goBack}
          disabled={historyIndex === 0}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas back"
        >
          ←
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas forward"
        >
          →
        </button>
        <div className="text-xs text-neutral-500 ml-2">
          {historyIndex + 1} / {history.length}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {renderDirective(directive)}
      </div>
    </main>
  );
}

function renderDirective(d: CanvasDirective) {
  switch (d.type) {
    case 'chart_of_accounts':
      return <ChartOfAccountsView orgId={d.orgId} />;
    case 'journal_entry_list':
      return <JournalEntryListView orgId={d.orgId} />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      return (
        <div className="text-neutral-400 text-sm">
          Use the Mainframe rail on the left to choose a view.
        </div>
      );

    // Phase 2+ directive types — render placeholder
    case 'journal_entry':
    case 'journal_entry_form':
    case 'ai_action_review_queue':
    case 'report_pl':
    case 'ap_queue':
    case 'vendor_detail':
    case 'bank_reconciliation':
    case 'ar_aging':
    case 'consolidated_dashboard':
      return <ComingSoonPlaceholder directiveType={d.type} />;
  }
}
```

#### 9d. ProposedEntryCard Component Shell

`src/components/ProposedEntryCard.tsx`:

```typescript
// src/components/ProposedEntryCard.tsx
// Phase 1.1: typed shell with placeholder render.
// Phase 1.2: real implementation with Approve / Reject / Edit buttons.
//
// The reason this component exists in Phase 1.1: the canvas renderer
// must reference the ProposedEntryCard type without errors so the entire
// canvas pipeline compiles end-to-end before Phase 1.2 adds the agent.

import type { ProposedEntryCard as ProposedEntryCardType } from '@/shared/types/proposedEntryCard';

interface Props {
  card: ProposedEntryCardType;
}

export function ProposedEntryCard({ card }: Props) {
  return (
    <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-4 max-w-2xl">
      <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
        Proposed Entry — Phase 1.2 Will Implement This
      </div>
      <div className="text-sm text-neutral-700">
        Org: <span className="font-mono">{card.org_name}</span>
      </div>
      <div className="text-sm text-neutral-700">
        Confidence: <span className="font-mono">{card.confidence}</span>
        {card.routing_path && (
          <span className="ml-2 text-neutral-500">
            (routing: {card.routing_path})
          </span>
        )}
      </div>
      <div className="mt-3 text-xs text-neutral-500">
        This is a placeholder render. The full ProposedEntryCard with
        Approve / Reject / Edit buttons is implemented in Phase 1.2.
      </div>
    </div>
  );
}
```

`src/shared/types/proposedEntryCard.ts`:

```typescript
// src/shared/types/proposedEntryCard.ts
// Full type definition (used by component shell in Phase 1.1).
// The Zod schema that validates this type lives in
// src/shared/schemas/accounting/journalEntry.schema.ts (Phase 1.2).

export type ProposedEntryLine = {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  currency: string;
};

export type ProposedEntryCard = {
  org_id: string;
  org_name: string;
  transaction_type: 'journal_entry' | 'bill' | 'payment' | 'intercompany';
  vendor_name?: string;
  matched_rule_label?: string;
  lines: ProposedEntryLine[];
  intercompany_flag: boolean;
  reciprocal_entry_preview?: unknown;
  agent_reasoning: string;
  confidence: 'high' | 'medium' | 'low' | 'novel';
  routing_path?: string;          // Category A reservation, display only in Phase 1
  idempotency_key: string;
  dry_run_entry_id: string;
};
```

#### 9e. Agent Chat Panel — Empty State Only

`src/components/bridge/AgentChatPanel.tsx`:

```typescript
// src/components/bridge/AgentChatPanel.tsx
// Phase 1.1: empty state with persona-aware suggested prompts.
// Does NOT call the LLM. Clicking a suggested prompt shows a tooltip
// "Coming in Phase 1.2."
//
// Phase 1.2: full conversation rendering with streaming responses.

import { SuggestedPrompts } from './SuggestedPrompts';
import { useTranslations } from 'next-intl';

interface Props {
  orgId: string;
  onCollapse: () => void;
}

export function AgentChatPanel({ orgId, onCollapse }: Props) {
  const t = useTranslations('agent');

  return (
    <aside className="w-[380px] flex flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="h-10 border-b border-neutral-200 flex items-center justify-between px-3">
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Agent
        </div>
        <button
          onClick={onCollapse}
          className="text-neutral-400 hover:text-neutral-700 text-sm"
          aria-label="Collapse chat"
        >
          ←
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-lg font-medium text-neutral-700 mb-1">
          {t('emptyState')}
        </div>
        <div className="text-xs text-neutral-400 mb-6">
          Phase 1.1 — agent activates in Phase 1.2
        </div>
        <SuggestedPrompts />
      </div>
    </aside>
  );
}
```

`src/components/bridge/SuggestedPrompts.tsx`:

```typescript
// src/components/bridge/SuggestedPrompts.tsx
// Static, persona-aware suggested prompts.
// Phase 1.1: clicking a chip shows "Coming in Phase 1.2" tooltip.
// Phase 1.2: clicking a chip submits the prompt to the orchestrator.

import { useTranslations } from 'next-intl';
import type { UserRole } from '@/shared/types/userRole';

const PROMPTS: Record<UserRole, string[]> = {
  controller: [
    'Show me last month\'s P&L',
    'Make a journal entry',
    'Review pending AI actions',
  ],
  ap_specialist: [
    'Show me the AP queue',          // Phase 2+
    'Process today\'s incoming bills', // Phase 2+
  ],
  executive: [
    'Show consolidated cash position', // Phase 3+
    'What\'s my runway?',              // Phase 3+
  ],
};

interface Props {
  role?: UserRole;
}

export function SuggestedPrompts({ role = 'controller' }: Props) {
  const t = useTranslations('agent');
  const prompts = PROMPTS[role];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="text-xs text-neutral-500">{t('suggestedPromptsHeading')}</div>
      {prompts.map((p) => (
        <button
          key={p}
          className="text-left text-sm border border-neutral-300 rounded-md px-3 py-2 bg-white hover:bg-neutral-50"
          title="Coming in Phase 1.2"
          onClick={() => alert('Phase 1.2 will wire this to the agent.')}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
```

#### 9f. Org Switcher (Role-Aware)

`src/components/bridge/OrgSwitcher.tsx`:

```typescript
// src/components/bridge/OrgSwitcher.tsx
// Reads the current user's memberships and shows only the orgs they
// have access to. Routes to /[locale]/[orgId]/... when an org is picked.

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/shared/env';
import { useTranslations } from 'next-intl';

interface OrgMembership {
  org_id: string;
  name: string;
  role: 'executive' | 'controller' | 'ap_specialist';
}

interface Props {
  currentOrgId: string;
}

export function OrgSwitcher({ currentOrgId }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('orgSwitcher');
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    supabase
      .from('memberships')
      .select('org_id, role, organizations(name)')
      .then(({ data }) => {
        if (data) {
          setOrgs(
            data.map((m: any) => ({
              org_id: m.org_id,
              name: m.organizations.name,
              role: m.role,
            }))
          );
        }
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newOrgId = e.target.value;
    router.push(`/${locale}/${newOrgId}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500">{t('label')}:</span>
      <select
        value={currentOrgId}
        onChange={handleChange}
        className="border border-neutral-300 rounded px-2 py-1 bg-white"
      >
        {orgs.map((o) => (
          <option key={o.org_id} value={o.org_id}>
            {o.name} ({o.role})
          </option>
        ))}
      </select>
    </label>
  );
}
```

#### 9g. Org Creation with CoA Template Selection

`src/app/[locale]/admin/orgs/page.tsx`:

```typescript
// src/app/[locale]/admin/orgs/page.tsx
// Org creation form. Selects an industry → loads the CoA template
// into chart_of_accounts for the new org.
//
// CRITICAL: this page is what makes Phase 1.1 exit criterion
// "Chart of Accounts loads for each org" pass. Without CoA template
// loading at org creation time, a freshly created org has an empty
// chart_of_accounts and the CoA canvas view shows nothing.

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const INDUSTRIES = [
  { value: 'holding_company',  label: 'Holding Company' },
  { value: 'real_estate',      label: 'Real Estate' },
  { value: 'healthcare',       label: 'Healthcare (Phase 2+)', disabled: true },
  { value: 'hospitality',      label: 'Hospitality (Phase 2+)', disabled: true },
  { value: 'trading',          label: 'Trading (Phase 2+)', disabled: true },
  { value: 'restaurant',       label: 'Restaurant (Phase 2+)', disabled: true },
] as const;

export default function OrgCreatePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<string>('holding_company');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, industry }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { org_id } = await res.json();
      router.push(`/${locale}/${org_id}`);
    } else {
      alert('Failed to create org. See logs.');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6">
      <h1 className="text-xl font-semibold mb-4">Create Organization</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm">Industry (loads CoA template)</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value} disabled={(i as any).disabled}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit" disabled={submitting}
          className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create org and load CoA'}
        </button>
      </form>
    </div>
  );
}
```

`src/app/api/org/route.ts`:

```typescript
// Thin API route over orgService.createOrgWithTemplate
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';

const Body = z.object({
  name: z.string().min(1),
  industry: z.enum(['holding_company', 'real_estate', 'healthcare', 'hospitality', 'trading', 'restaurant']),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.parse(json);
  const ctx = await buildServiceContext(req);
  const result = await withInvariants(orgService.createOrgWithTemplate)(parsed, ctx);
  return NextResponse.json(result);
}
```

`src/services/org/orgService.ts` — the function that loads the template:

```typescript
// src/services/org/orgService.ts
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';

interface CreateOrgInput {
  name: string;
  industry: 'holding_company' | 'real_estate' | 'healthcare' | 'hospitality' | 'trading' | 'restaurant';
}

export const orgService = {
  async createOrgWithTemplate(input: CreateOrgInput, ctx: ServiceContext) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    log.info({ input }, 'Creating org and loading CoA template');

    // 1. Create the org row
    const { data: org, error: orgErr } = await db
      .from('organizations')
      .insert({
        name: input.name,
        industry: input.industry,
        functional_currency: 'CAD',
        created_by: ctx.caller.user_id,
      })
      .select('org_id')
      .single();

    if (orgErr || !org) {
      throw new ServiceError('ORG_CREATE_FAILED', orgErr?.message ?? 'unknown');
    }

    // 2. Load the template into chart_of_accounts for this org
    const { data: tpl, error: tplErr } = await db
      .from('chart_of_accounts_templates')
      .select('account_code, account_name, account_type, is_intercompany_capable')
      .eq('industry', input.industry);

    if (tplErr || !tpl || tpl.length === 0) {
      throw new ServiceError('TEMPLATE_NOT_FOUND', input.industry);
    }

    const coaRows = tpl.map((t) => ({
      org_id: org.org_id,
      account_code: t.account_code,
      account_name: t.account_name,
      account_type: t.account_type,
      is_intercompany_capable: t.is_intercompany_capable,
    }));

    const { error: insertErr } = await db.from('chart_of_accounts').insert(coaRows);
    if (insertErr) {
      throw new ServiceError('COA_LOAD_FAILED', insertErr.message);
    }

    // 3. Auto-create the calling user's membership as 'controller'
    //    (Phase 1.1 simplification — Phase 2 can refine to a proper role-grant flow)
    await db.from('memberships').insert({
      user_id: ctx.caller.user_id,
      org_id: org.org_id,
      role: 'controller',
    });

    log.info({ org_id: org.org_id, accounts_loaded: coaRows.length }, 'Org created');

    return { org_id: org.org_id, accounts_loaded: coaRows.length };
  },
};
```

This service function is **the** answer to the exit criterion "Chart of
Accounts loads for each org." Without it, freshly created orgs have empty
CoAs and the canvas view is blank.

---

### 10. `withInvariants()` Middleware

`src/services/middleware/withInvariants.ts`:

```typescript
// src/services/middleware/withInvariants.ts
// The universal service wrapper. Every service function in src/services/
// is invoked through this. Performs pre-flight checks before the function
// body runs:
//   - ServiceContext is well-formed
//   - trace_id is present
//   - caller identity is verified (not just claimed)
//   - org_id (if present in input) is consistent with caller's memberships
//
// Bible Section 15e ("Layer 2 — Service middleware") and the enforcement
// sentence in the Two Laws restatement reference this file by name.
//
// IMPORTANT: this is enforcement, not convention. Every PR that introduces
// a service function MUST wire it through withInvariants. Code review
// rejects PRs that bypass this wrapper.

import type { ServiceContext } from './serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';

type ServiceFn<I, O> = (input: I, ctx: ServiceContext) => Promise<O>;

export function withInvariants<I, O>(fn: ServiceFn<I, O>): ServiceFn<I, O> {
  return async (input, ctx) => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller?.user_id });

    // Invariant 1: ServiceContext shape
    if (!ctx) {
      throw new ServiceError('MISSING_CONTEXT', 'ServiceContext is required');
    }
    if (!ctx.trace_id) {
      throw new ServiceError('MISSING_TRACE_ID', 'ServiceContext.trace_id is required');
    }
    if (!ctx.caller || !ctx.caller.user_id) {
      throw new ServiceError('MISSING_CALLER', 'ServiceContext.caller.user_id is required');
    }

    // Invariant 2: caller identity is verified, not claimed.
    // ctx.caller.verified must be true — buildServiceContext sets this
    // after validating the Supabase Auth JWT.
    if (!ctx.caller.verified) {
      throw new ServiceError('UNVERIFIED_CALLER', 'Caller identity has not been verified');
    }

    // Invariant 3: org_id consistency.
    // If the input claims an org_id, it must match a membership for the caller.
    // We check this here as defense-in-depth — RLS catches it at the DB level
    // too, but failing fast with a clear error is better than RLS silently
    // returning empty results.
    const claimedOrgId = (input as any)?.org_id;
    if (claimedOrgId && ctx.caller.org_ids && !ctx.caller.org_ids.includes(claimedOrgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${claimedOrgId}`
      );
    }

    log.debug({ fn: fn.name }, 'withInvariants: pre-flight passed');

    // Execute the wrapped function
    try {
      const result = await fn(input, ctx);
      return result;
    } catch (err) {
      log.error({ err, fn: fn.name }, 'Service function threw');
      throw err;
    }
  };
}
```

**Application example** (already shown in Section 9g for the org creation
route, repeated here as the canonical template):

```typescript
// src/app/api/org/route.ts
import { withInvariants } from '@/services/middleware/withInvariants';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.parse(json);
  const ctx = await buildServiceContext(req);

  // The service function is ALWAYS invoked through withInvariants.
  // Direct calls like `await orgService.createOrgWithTemplate(parsed, ctx)`
  // are forbidden — code review rejects them.
  const result = await withInvariants(orgService.createOrgWithTemplate)(parsed, ctx);

  return NextResponse.json(result);
}
```

`src/services/errors/ServiceError.ts`:

```typescript
// src/services/errors/ServiceError.ts
export class ServiceError extends Error {
  constructor(public code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'ServiceError';
  }
}
```

---

### 11. `ServiceContext` Type

`src/services/middleware/serviceContext.ts`:

```typescript
// src/services/middleware/serviceContext.ts
// The ServiceContext is the envelope every service function receives
// alongside its typed input. It carries:
//   - trace_id (REQUIRED) — propagated from the API route or orchestrator
//   - caller (REQUIRED) — verified user identity + memberships
//   - locale (optional) — for any service that returns user-facing strings
//
// This type matches Bible Section 1c (request lifecycle) and Section 15e
// (service middleware enforcement).

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';
import { ServiceError } from '@/services/errors/ServiceError';

export interface VerifiedCaller {
  user_id: string;
  email: string;
  verified: true;        // set ONLY by buildServiceContext after JWT validation
  org_ids: string[];     // memberships, used by withInvariants Invariant 3
}

export interface ServiceContext {
  trace_id: string;       // REQUIRED — UUID generated at the request entry point
  caller: VerifiedCaller; // REQUIRED — never trust claimed identity
  locale?: 'en' | 'fr-CA' | 'zh-Hant';
}

/**
 * Builds a ServiceContext for an incoming Next.js API route request.
 * Validates the Supabase Auth JWT, fetches the caller's memberships,
 * generates a trace_id, and returns a ready-to-use ServiceContext.
 *
 * THIS is the only function in the codebase that creates a verified caller.
 * Tests use a separate helper that bypasses JWT validation but otherwise
 * returns the same shape.
 */
export async function buildServiceContext(req: Request): Promise<ServiceContext> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // no-op for API routes
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new ServiceError('UNAUTHENTICATED', 'No valid session');
  }

  // Fetch memberships for this user (used by withInvariants Invariant 3)
  const { data: memberships } = await supabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', user.id);

  const trace_id = crypto.randomUUID();

  return {
    trace_id,
    caller: {
      user_id: user.id,
      email: user.email!,
      verified: true,
      org_ids: (memberships ?? []).map((m: any) => m.org_id),
    },
    locale: 'en', // populated from URL in Phase 1.2
  };
}
```

**The `verified: true` literal type is the key** — it cannot be set by
any code path other than `buildServiceContext`, which means a function
that requires `VerifiedCaller` cannot be called with a hand-rolled object
that claims to be verified without actually being verified. TypeScript
enforces this at compile time.

---

### 12. CLAUDE.md reference (v0.5.5 — section rewritten)

**The v0.5.2 version of this brief proposed creating a Phase 1.1-specific
`CLAUDE.md` from scratch at the start of Phase 1.1 execution. That
section is obsolete as of v0.5.5.** The real `CLAUDE.md` already exists
at the repo root. It was derived during the step-5 split (the same pass
that extracted this brief into `docs/specs/phase-1.1.md`) from
`PLAN.md` §0, §1d, §2b, §3a, §5c, §15, and the Critical Architectural
Invariants, applying the "throwaway work" test the CTO advice
sharpened: *does a violation of this rule cause work the user has to
throw away or redo?* If yes, the rule is in `CLAUDE.md`. If no, the
rule lives in `PLAN.md` or in this brief.

**What Claude Code reads at session start (v0.5.5 model):**

1. **`CLAUDE.md` at the repo root** — standing rules, loaded every
   session, target 120–170 lines. Cites `PLAN.md` sections by number
   for detail.
2. **`AGENTS.md` at the repo root** — one short file, the Next.js
   version-mismatch warning. Imported into `CLAUDE.md` via `@AGENTS.md`
   so the Next.js warning loads whenever `CLAUDE.md` does.
3. **`PLAN.md` §0** — the Phase 1 Reality vs Long-Term Architecture
   tiebreaker. If the rest of `PLAN.md` seems to contradict itself,
   §0 is the map.
4. **`docs/specs/phase-1.1.md`** — this file — when executing
   Phase 1.1 work specifically.
5. **`docs/decisions/`** — ADRs for decisions whose rationale needs to
   survive. The first is `0001-reversal-semantics.md` (the Q19 Phase 1.1
   reversal mechanism) and additional ADRs are written as decisions are
   made in anger, per `PLAN.md` §16.

**What this section does NOT do anymore:** propose `CLAUDE.md` contents
here. That content now lives at the repo root and is maintained there.
If a rule in `CLAUDE.md` turns out to be wrong, update the real
`CLAUDE.md` and record the change in this brief's friction journal as a
CLUNKY entry — do not rewrite this section.

**Friction journal during Phase 1.1 execution.** Use
`docs/friction-journal.md` from day one of Phase 1.1. Do not wait for
Phase 1.3. Any time something in this brief is wrong, ambiguous, or
harder than expected, write a one-line entry. The friction journal is
the most valuable artifact Phase 1.1 produces — it feeds Phase 1.2
scope directly. See §13 for the format.

---

### 13. Friction Journal Reference

`docs/friction-journal.md` already exists. **Use it from day one of
Phase 1.1.** Do not wait for Phase 1.3.

The friction journal is a running markdown file with three categories:

```markdown
## Friction Journal

Format: `[date] [category] [one-line description]`

Categories:
- WANT — wanted to do X, couldn't (missing capability)
- CLUNKY — did X, was painful (UX or DX problem)
- WRONG — the spec or the system was wrong about X

Phase 1.1 entries:

[example]
- 2026-04-12 CLUNKY  Supabase CLI on macOS needed `brew upgrade` first; not in brief
- 2026-04-13 WRONG   Section 4 RLS list omits chart_of_accounts policies
- 2026-04-14 WANT    Need a way to delete a test journal entry without restarting Supabase
```

The friction journal entries from Phase 1.1 feed directly into the Phase
1.2 brief as bug-fixes and as scope additions. The friction journal
entries from Phase 1.3 feed the Phase 2 brief.

**Rule:** when an entry is added, do not stop to fix it immediately. Add
the entry, keep building. Triage during the next phase boundary.

---

### 14. Phase 1.1 Exit Criteria Checklist

**Every item must pass before Phase 1.2 begins. No exceptions.**

If any item is ambiguous when you read it, escalate to the founder
before checking the box. A checked box must mean what it says.

#### Setup and structure

- [ ] **Clean slate confirmed** — `app/`, `next.config.ts`, `package.json`,
      `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` deleted
      before scaffolding began (Section 2)
- [ ] **Folder structure matches Section 3** — every folder listed exists,
      every key file is in the named location
- [ ] **`pnpm install` succeeds** with the dependency list from Section 3a
- [ ] **`pnpm dev` starts cleanly** with zero TypeScript errors and zero
      runtime errors at boot
- [ ] **`pnpm typecheck` passes** with strict mode and no `any` without
      a justification comment
- [ ] **`pnpm build` succeeds** — production build compiles

#### Database

- [ ] **`supabase start` brings up local Postgres + Auth + Studio** without
      errors
- [ ] **`pnpm db:migrate` applies `001_initial_schema.sql` cleanly** — no
      errors, all tables created
- [ ] **`pnpm db:generate-types` produces `src/db/types.ts`** with types
      for every table in the schema
- [ ] **Deferred constraint rejects unbalanced entry** — Integration Test 1
      passes (Section 6b)
- [ ] **Period lock trigger rejects locked-period write** — Integration
      Test 2 passes (Section 6c)
- [ ] **events table append-only trigger verified** — manual verification:
      attempting an `UPDATE events SET ...` or `DELETE FROM events ...`
      from psql throws the append-only error

#### Auth and RLS

- [ ] **`pnpm db:seed:auth` creates the three seed users** via the Supabase
      admin API; each user has the fixed UUID from Section 5a
- [ ] **`pnpm db:seed` creates the two seed orgs, the CoA per org, and the
      memberships** — idempotent (safe to run twice)
- [ ] **Sign-in works for all three seed users** with the seed passwords
- [ ] **Cross-org RLS isolation verified** — Integration Test 3 passes
      (Section 6d): the AP Specialist user cannot SELECT from the
      Holding Co's chart_of_accounts even with admin tooling that bypasses
      the UI
- [ ] **Org switcher shows correct orgs per user role** — sign in as the
      AP Specialist, the org switcher shows ONLY "Bridge Real Estate
      Entity (DEV)"; sign in as the Controller, the switcher shows BOTH
      seed orgs

#### Environment and logging

- [ ] **Boot assertion throws if `SUPABASE_SERVICE_ROLE_KEY` is missing**
      — manually unset the variable, attempt `pnpm dev`, confirm the
      error message names the missing variable
- [ ] **Boot assertion throws if `ANTHROPIC_API_KEY` is missing** — same
      check (even though Phase 1.1 does not call the API, the discipline
      is enforced now)
- [ ] **`pnpm tsx scripts/verify-pino-redaction.ts` shows `[REDACTED]`**
      for `api_key`, `password`, and `headers.authorization`; shows
      `safe_field` in cleartext
- [ ] **Pino logs include `trace_id`, `org_id`, `user_id`** on every line
      emitted by a service function during a real org-creation request

#### i18n

- [ ] **i18n configured** — `next-intl` installed, three locales
      registered (`en`, `fr-CA`, `zh-Hant`), `[locale]` segment in every
      route under `src/app/[locale]/`
- [ ] **Sign-in renders in English, French, and Traditional Mandarin**
      — visit `/en/sign-in`, `/fr-CA/sign-in`, `/zh-Hant/sign-in`; all
      three render without crashing (French and Mandarin show English
      fallback content; the test is that the locale routing works)

#### UI shell

- [ ] **The Bridge split-screen layout renders** — Mainframe rail on the
      left, agent chat panel in the middle, contextual canvas on the right
- [ ] **Mainframe API status dot is visible** at the bottom of the rail
      and shows green (Phase 1.1 default)
- [ ] **Agent chat panel renders empty state with suggested prompts**
      that are persona-aware (different prompts for Controller vs AP
      Specialist vs Executive); clicking a chip shows the
      "Coming in Phase 1.2" tooltip
- [ ] **Canvas navigation back/forward works** — click Mainframe → CoA,
      click Mainframe → Journals, then back → CoA, forward → Journals;
      history is independent of any chat state
- [ ] **ProposedEntryCard component compiles and renders** as a placeholder
      when the canvas receives a `proposed_entry_card` directive
- [ ] **Canvas renderer handles every directive type** in
      `CanvasDirective` discriminated union — Phase 2+ types render the
      `ComingSoonPlaceholder` without crashing

#### Org creation and Chart of Accounts

- [ ] **Org creation flow at `/admin/orgs` works** — submitting the form
      with name "Test Org" and industry "Holding Company" creates the
      org row, loads the CoA template into `chart_of_accounts`, creates
      a controller membership for the current user, and redirects to
      `/[locale]/[new_org_id]`
- [ ] **Org creation flow loads correct CoA template for selected
      industry** — verify by SQL: after creating a holding_company org,
      `SELECT account_code FROM chart_of_accounts WHERE org_id = X`
      returns the 16 holding_company codes from the seed; after creating
      a real_estate org, returns the 23 real_estate codes
- [ ] **Chart of Accounts loads for each org** — the CoA canvas view
      shows the loaded accounts after switching to a new org via the
      org switcher

#### Documentation and discipline

- [ ] **`CLAUDE.md` updated** to reference the Phase 1.1 Execution Brief
      and the session recovery instructions (Section 12)
- [ ] **`docs/troubleshooting/rls.md` exists** and is referenced in
      `CLAUDE.md` — do NOT recreate it; it already exists
- [ ] **`docs/friction-journal.md` exists and has at least one entry**
      from real Phase 1.1 work — proves the discipline is happening, not
      deferred to Phase 1.3
- [ ] **Postman collection v1.1 passes** — health check, org creation,
      chart of accounts list

#### Manual journal entry path

- [ ] **Manual journal entry form works end-to-end** — sign in as
      controller, navigate to form via Mainframe rail, post a balanced
      entry to the holding company org, verify the entry + lines exist
      in `journal_entries` / `journal_lines` via psql, verify the
      `audit_log` row is present with `trace_id` populated
- [ ] **Journal entry list shows posted entries** — after posting via
      the form, the list shows the entry with correct date, description,
      total debits/credits (aggregated via `amount_cad`)
- [ ] **Journal entry detail view renders correctly** — click an entry
      in the list, see all lines with account code, account name, debit,
      credit, currency, tax code
- [ ] **Reversal UI works end-to-end** — from the detail view, click
      "Reverse this entry," see prefilled reversal form with mirrored
      lines (read-only), fill in reversal reason, submit, verify the
      reversal entry exists in DB with `reverses_journal_entry_id` and
      `reversal_reason` populated
- [ ] **Period gap banner renders** — when reversal's period differs
      from the original entry's period, the non-dismissible warning
      banner appears per §4h
- [ ] **Locked period rejected gracefully** — the locked prior-year
      period does NOT appear in the fiscal_period_id dropdown
      (`periodService.listOpen` filters it out)
- [ ] **Basic P&L report renders correctly** — post 3+ entries, open
      P&L, verify Revenue / Expenses / Net Income / Balance Sheet
      summary totals match hand-calculated values from the posted entries
- [ ] **P&L reversal behavior correct** — reverse one entry, verify P&L
      updates and reversal nets to zero per §18 Q21 resolution
- [ ] **Post 5 manual journal entries** across both orgs through the
      manual form (PLAN.md §7 exit criterion #9). The deferred
      constraint catches an intentional unbalanced entry. The period
      lock trigger catches an intentional locked-period post.
- [ ] **Audit_log row present for each posted entry** with `trace_id`
      populated (PLAN.md §7 exit criterion #10)
- [ ] **Time-to-first-post measured** — record clock time from "open
      the manual entry form" to "entry posted and visible in the list"
      in `docs/friction-journal.md` (PLAN.md §7 exit criterion #14)
- [ ] **Friction journal has ≥3 real entries** from Phase 1.1 work
      (PLAN.md §7 exit criterion #13)
- [ ] **Hosting region pinned** — Supabase project region is
      `ca-central-1` in the Supabase dashboard; Vercel deployment region
      is `yul1` (or equivalent Canadian region) in Vercel dashboard →
      Project → Settings → Functions (PLAN.md §7 exit criterion #15)
- [ ] **Integration tests: all five Category A floor tests pass**
      including Test 4 (service middleware authorization, §6f) and
      Test 5 (reversal mirror enforcement, §6g)
- [ ] **Postman collection v1.1 updated** — health check, org creation,
      chart of accounts list, journal entry CRUD, period check

---

### 15. Phase 1.1 Expansion: Manual Journal Entry Path

*This section was added during Phase 1.1 implementation after the
initial foundation (database, auth, UI shell, five Category A tests)
was built. It covers the manual journal entry form, list, detail,
reversal UI, and basic P&L view — all listed in PLAN.md §7 as Phase
1.1 deliverables that were not in the original brief extraction.*

*Decision recorded in PLAN.md §18d Q20: a minimal
`journalEntryService.post()` stub was landed in Phase 1.1 to unblock
Tests 4 and 5. This section builds on that stub to deliver the full
manual path.*

---

#### 15.0 Brief Reconciliation Checklist (Step 0a)

**Execute these edits before any §15 implementation work. Each edit
is mechanical — no judgment calls. The brief must match PLAN.md
v0.5.5/v0.5.6 before the manual path is built on top of it.**

Run `pnpm typecheck` and `pnpm test:integration` after completing
all edits. All 5 Category A tests must pass before moving to step 0b.

1. **§4 `journal_entries` DDL:** Add `reversal_reason text` column
   and CHECK constraint per PLAN.md §2a and ADR-001. Remove stale
   "Open Question 19 (pending founder confirmation)" comment. The
   column and constraint already exist in the running database via
   `002_add_reversal_reason.sql`; this edit reconciles the brief's
   DDL to match the deployed schema.

2. **§4 `tax_codes` table ordering:** Move `tax_codes` CREATE TABLE
   above `journal_lines` so the `tax_code_id` FK resolves. (The
   running database has the correct order; the brief's DDL listing
   is wrong.)

3. **§4 DDL audit:** Read the brief's §4 line-by-line against
   PLAN.md §2a and §2b. Verify every v0.5.3+ constraint is present.
   The `reversal_reason` gap proves v0.5.6 did not reconcile
   everything; do not trust "was applied" without verifying each
   constraint.

4. **Tax codes seed migration:** Create
   `supabase/migrations/20240103000000_seed_tax_codes.sql` (separate file, not
   inline — follows §8c pattern of tax code changes as their own
   migration lineage):
   - `GST`: code='GST', rate=0.05, jurisdiction='CA',
     effective_from=2024-01-01, `org_id=NULL` (shared per §2c
     hybrid RLS policy)
   - `PST_BC`: code='PST_BC', rate=0.07, jurisdiction='CA-BC',
     effective_from=2024-01-01, `org_id=NULL`
   - No historical rows per PLAN.md §18a.2 RESOLVED
   - Remove brief's stale note that Q2 is unresolved

5. **§3 folder tree updates:**
   - Add `src/services/accounting/journalEntryService.ts` explicitly
     as a Phase 1.1 file (remove "created in Phase 1.2" comment)
   - Add `src/shared/schemas/accounting/` directory with
     `money.schema.ts` and `journalEntry.schema.ts`
   - Add `src/components/canvas/JournalEntryForm.tsx`,
     `JournalEntryDetailView.tsx`, `ReversalForm.tsx`,
     `BasicPLView.tsx`

6. **§3 folder tree: verify `journalEntryService.ts` stub against
   PLAN.md §3d.** Open the existing file and check against §3d's
   worked example: Zod re-validation at the boundary, authorization,
   period check, dry-run branch, transaction, audit_log write,
   return shape. **Note divergences in the friction journal — do NOT
   fix in step 0a.** Fixes belong in step 0c after schemas land in
   step 0b.

7. **§6 test section:** Update opening text from "three tests" to
   "five tests."

8. **§9d `ProposedEntryCard` type:** Change `debit: number;
   credit: number;` to `MoneyAmount` strings per PLAN.md §3a.

9. **§5b seed script:** Add documentation note that the seed runs
   as the postgres superuser (bypassing RLS) and that adapting for
   a remote Supabase client requires the service-role key or a
   bootstrap path.

10. **§9g org creation:** Flag the auto-controller-grant as a known
    Phase 1.1 simplification with a Phase 1.2 cleanup note.

11. **§18 P&L Open Question (add to PLAN.md §18):** "P&L report
    rendering: when a reversal entry exists, should the P&L show
    (a) the original entry and the reversal entry as separate line
    items that net to zero, or (b) the aggregated net (which equals
    zero for the reversed pair, so neither line appears)? Both are
    IFRS-correct. (a) preserves audit-trail visibility in the report;
    (b) is cleaner but hides the existence of reversals. Default:
    (a). Confirm." Step 5 (P&L) waits for this answer.

12. **Create `docs/friction-journal.md`** with the following opening
    entries:
    ```
    ## Friction Journal

    Format: `[date] [category] [one-line description]`

    Categories:
    - WANT — wanted to do X, couldn't (missing capability)
    - CLUNKY — did X, was painful (UX or DX problem)
    - WRONG — the spec or the system was wrong about X

    ## Phase 1.1

    - 2026-04-12 WRONG  PLAN.md v0.5.6 claimed Part 2 was reconciled
      during step-5 split; brief still missing Q19 reversal_reason
      column, exit criteria #9/#13/#14/#15, and several §3 folder
      tree entries. Reconciled in this pass.
    - 2026-04-12 NOTE   Verified ADR-001 exists (390 lines), matches
      §18c.19 RESOLVED. CLAUDE.md Rule 7 reference is live.
    ```

**Process gate:** `pnpm typecheck` clean, `pnpm test:integration`
all 5 green.

---

#### 15.1 Branded Types and Zod Schemas (Step 0b)

**Goal:** Create the type foundation that the form, service, and API
routes all build against. Nothing in step 1 can start without this.

**New dependency:** Add `decimal.js` to `package.json` dependencies.
PLAN.md §3a uses it throughout; the Phase 1.1 brief did not list it.

Friction journal entry:
```
- [date] WRONG  Phase 1.1 brief §3a does not list decimal.js in
  dependencies despite PLAN.md §3a using it throughout. Added in
  step 0b.
```

##### `src/shared/schemas/accounting/money.schema.ts`

Branded types per PLAN.md §3a:

- `MoneyAmount`: `string & { __brand: 'MoneyAmount' }` validated by
  `/^-?\d{1,16}(\.\d{1,4})?$/` (PLAN.md §3a verbatim: signed, 16-digit
  cap before decimal, optional 1–4 decimal digits). The regex allows
  negative values (needed for reversal-side FX adjustments), caps at
  16 digits before the decimal (matching `numeric(20,4)` exactly:
  16 + 4 = 20), and allows whole numbers without a decimal portion.

- `FxRate`: `string & { __brand: 'FxRate' }` validated by
  `/^-?\d{1,12}(\.\d{1,8})?$/` (PLAN.md §3a verbatim).

- Zod schemas: `MoneyAmountSchema` and `FxRateSchema` that parse
  strings and return branded types.

Helper functions (using `decimal.js`, **confined to this one file** —
no other file imports `decimal.js` directly; `grep 'from.*decimal.js'`
should find exactly one file):

```typescript
import Decimal from 'decimal.js';

export function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return new Decimal(a).plus(new Decimal(b)).toFixed(4) as MoneyAmount;
}

export function multiplyMoneyByRate(
  amount: MoneyAmount,
  rate: FxRate,
): MoneyAmount {
  return new Decimal(amount)
    .times(new Decimal(rate))
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    .toFixed(4) as MoneyAmount;
}

export function eqMoney(a: MoneyAmount, b: MoneyAmount): boolean {
  return new Decimal(a).eq(new Decimal(b));
}

export function eqRate(a: FxRate, b: FxRate): boolean {
  return new Decimal(a).eq(new Decimal(b));
}

export function zeroMoney(): MoneyAmount {
  return '0.0000' as MoneyAmount;
}

export function oneRate(): FxRate {
  return '1.00000000' as FxRate;
}
```

`multiplyMoneyByRate` must match Postgres `ROUND(amount_original *
fx_rate, 4)` exactly. Postgres uses half-away-from-zero rounding;
`decimal.js` with `ROUND_HALF_UP` matches it. A hand-rolled integer
multiply would silently disagree on edge cases where the trailing
digit is exactly 5.

##### `src/shared/schemas/accounting/journalEntry.schema.ts`

`JournalLineSchema` — Zod object with three `.refine()` checks from
PLAN.md §3a:

1. **Debit XOR credit:** both non-negative, at least one positive
   (matches D11 DB CHECK).
2. **`amount_original = debit_amount + credit_amount`** (matches D5
   CHECK, uses `addMoney`).
3. **`amount_cad = ROUND(amount_original * fx_rate, 4)`** (matches
   D5 CHECK, uses `multiplyMoneyByRate` and `eqMoney` for the
   comparison — NOT `===`, because `eqMoney` handles trailing-zero
   equivalence like `'100.0000'` vs `'100'`).

`entry_date` uses `z.string().date()` (Zod 3.23+ built-in) instead
of a regex.

Schema architecture — base schema, then two refined schemas:

```typescript
// Base, unrefined — never used directly
const JournalEntryBaseSchema = z.object({
  org_id: z.string().uuid(),
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().date(),
  description: z.string().min(1),
  reference: z.string().optional(),
  source: z.enum(['manual', 'agent', 'import']),
  idempotency_key: z.string().uuid().optional(),
  dry_run: z.boolean().default(false),
  lines: z.array(JournalLineSchema).min(2),
});
```

Two refined schemas sharing the base:

```typescript
// Create form: reversal fields rejected if present
export const PostJournalEntryInputSchema = JournalEntryBaseSchema
  .extend({
    reverses_journal_entry_id: z.undefined().optional(),
    reversal_reason: z.undefined().optional(),
  })
  .refine(balancedRefinement, balancedMessage)
  .refine(idempotencyRefinement, idempotencyMessage)
  .refine(
    (entry) => entry.source !== 'agent',
    { message: 'source: "agent" is not implemented in Phase 1.1.' }
  )
  .refine(
    (entry) => entry.dry_run !== true,
    { message: 'dry_run: true is not implemented in Phase 1.1.' }
  );

// Reversal form: reversal fields required
export const ReversalInputSchema = JournalEntryBaseSchema
  .extend({
    reverses_journal_entry_id: z.string().uuid(),
    reversal_reason: z.string().min(1),
  })
  .refine(balancedRefinement, balancedMessage)
  .refine(idempotencyRefinement, idempotencyMessage)
  .refine(
    (entry) => entry.source !== 'agent',
    { message: 'source: "agent" is not implemented in Phase 1.1.' }
  )
  .refine(
    (entry) => entry.dry_run !== true,
    { message: 'dry_run: true is not implemented in Phase 1.1.' }
  );

// Service boundary accepts either
export const JournalEntryServiceInputSchema = z.union([
  PostJournalEntryInputSchema,
  ReversalInputSchema,
]);
```

The `z.undefined().optional()` trick on `PostJournalEntryInputSchema`
means TypeScript rejects any attempt to set
`reverses_journal_entry_id` on a create input at compile time. Two
schemas, two forms, two resolvers, no mode prop.

Shared refinement helpers (extracted so both schemas stay in sync):

```typescript
const balancedRefinement = (entry: { lines: JournalLine[] }) => {
  const debits = entry.lines.reduce(
    (acc, l) => addMoney(acc, l.debit_amount), zeroMoney()
  );
  const credits = entry.lines.reduce(
    (acc, l) => addMoney(acc, l.credit_amount), zeroMoney()
  );
  return eqMoney(debits, credits);
};
const balancedMessage = {
  message: 'Sum of debits must equal sum of credits (exact).',
};

const idempotencyRefinement = (
  entry: { source: string; idempotency_key?: string }
) => entry.source !== 'agent' || entry.idempotency_key !== undefined;
const idempotencyMessage = {
  message: 'idempotency_key is required when source is "agent".',
};
```

Phase 1.2 deferral rejections (`source: 'agent'` and
`dry_run: true`) are in the Zod schemas, not the service body. The
Zod layer catches them at the API boundary and at the form's
`zodResolver` before the request reaches the service. Defense-in-depth:
the service also rejects these if they somehow pass Zod, but the
primary user-facing rejection is Zod.

Friction journal entry:
```
- [date] CLUNKY  Phase 1.2 deferral rejections (dry_run, source:agent)
  belong in Zod schemas (0b), not service body (0c). 0b design did
  not originally include them; added during design review when the
  deferral decision was made.
```

**Process gate:**

1. `pnpm typecheck` — new files compile, existing tests unaffected.
2. Scratch-verify the five helpers before moving to 0c:
   ```typescript
   addMoney('0.1000', '0.2000')           // → '0.3000'
   multiplyMoneyByRate('100.0000', '1.05000000')  // → '105.0000'
   multiplyMoneyByRate('100.0050', '1.00000000')  // → '100.0050'
   multiplyMoneyByRate('10.0000', '0.33333333')   // → '3.3333'
   eqMoney('100.0000', '100')             // → true
   ```
   Delete the scratch file after verification.

---

#### 15.2 Service Verification and Fixes (Step 0c)

**Goal:** Verify the existing `journalEntryService.post()` stub
against PLAN.md §3d and §15e, replace its inline schemas with the
shared schemas from step 0b, and fix divergences.

**Process: audit first, fix second. Log each divergence as its own
friction journal entry before fixing.**

##### Phase 1 — Audit

1. Read `journalEntryService.ts` line-by-line against PLAN.md §3d.
   Log each divergence individually.
2. Read the reversal mirror check against PLAN.md §15e Layer 2's
   five sub-checks. Log divergences.
3. Read the existing test helpers (`buildValidJournalEntryInput` in
   Test 4, `buildBalancedEntryInput` / `buildMirroredReversal` in
   Test 5) against the new schemas. Log any money fields that need
   converting to branded `MoneyAmount` strings.

##### Phase 2 — Fix (in priority order)

**(a) Replace inline Zod schemas** with imports from
`journalEntry.schema.ts`. The service's `post()` function parses
input through `JournalEntryServiceInputSchema` (the union). Delete
the inline `PostJournalEntryInput`, `JournalLineInput`, and
`MoneyString` schemas.

**(g) Update test helpers** to match the new schemas. Convert any
money fields to `MoneyAmount`-format strings that pass the regex
`/^-?\d{1,16}(\.\d{1,4})?$/` and the line refinement checks. **This
must happen immediately after (a)** because the integration tests
must compile before verifying any subsequent fix.

**Intermediate gate:** `pnpm typecheck` must pass after (a) + (g).

**(b) Replace `parseInt`-based balance check** with `addMoney` /
`eqMoney`:
```typescript
const totalDebit = lines.reduce(
  (acc, l) => addMoney(acc, l.debit_amount), zeroMoney()
);
const totalCredit = lines.reduce(
  (acc, l) => addMoney(acc, l.credit_amount), zeroMoney()
);
if (!eqMoney(totalDebit, totalCredit))
  throw new ServiceError('UNBALANCED', ...);
```

**(c) Replace `toMoney` / `toRate` normalizers in mirror check**
with `eqMoney` and `eqRate`. The current mirror check uses
`Number(v).toFixed(4)` to normalize DB-returned numerics against
input strings. Replace each money comparison with `eqMoney(dbValue,
inputValue)`. Replace fx_rate comparison with `eqRate(dbValue,
inputValue)`.

Verify `eqRate` exists in `money.schema.ts` (added in 0b alongside
`eqMoney`). If it was missed in 0b, add it now and log:
```
- [date] CLUNKY  eqRate helper missed in 0b; added during 0c when
  mirror check needed it. Both helpers should have been planned
  together.
```

**(d) Verify reversal mirror check** implements all five §15e Layer 2
sub-checks:

1. Load referenced entry, verify same `org_id` → reject
   `REVERSAL_CROSS_ORG`
2. Verify line count matches → reject
   `REVERSAL_PARTIAL_NOT_SUPPORTED`
3. For each line, find mirror line in original (match on:
   `account_id`, `currency`, `amount_original`, `amount_cad`,
   `fx_rate`, `tax_code_id` — all unchanged; `debit_amount` and
   `credit_amount` swapped) → reject `REVERSAL_NOT_MIRROR`
4. Verify `reversal_reason` non-empty → reject
5. All checks happen before BEGIN — no audit row written for a
   rejected reversal

If any sub-check is missing, implement it in step 0c. This is not
deferrable — Test 5 requires it.

**(e) Add explicit service-level rejections** for deferred Phase 1.2
features (defense-in-depth behind the Zod rejections from 0b):
- `dry_run: true` →
  `ServiceError('DRY_RUN_NOT_IMPLEMENTED_PHASE_1_1', ...)`
- `source: 'agent'` →
  `ServiceError('AGENT_SOURCE_NOT_IMPLEMENTED_PHASE_1_1', ...)`

**(f) Verify `audit_log` action field:** `'journal_entry.post'` for
creates, `'journal_entry.reverse'` for reversals.

Friction journal entries for deferred features:
```
- [date] WANT  Phase 1.1 service does not implement dry_run branch
  per §3d (transaction-with-rollback shape). Manual form does not
  need it. Phase 1.2 adds it before agent integration.
- [date] WANT  Phase 1.1 service does not implement idempotency
  check per §3d (which queries ai_actions, not journal_entries).
  Manual form does not need it. Phase 1.2 adds it alongside dry-run.
```

**Process gate:**

1. `pnpm typecheck` — service compiles against new schemas.
2. `pnpm test:integration` — all 5 Category A tests green.
3. If any test fails: diagnose whether it's a helper-shape issue
   (fix in 0c) or a real divergence (investigate before continuing).
   Do not move to step 0d with red tests.

---

#### 15.3 Manual Journal Entry Path Specification (Step 0d)

**Goal:** This step produces the detailed spec for the five UI steps
(form, list, detail, reversal, P&L) so the implementer has a clear
contract. It is a documentation step — no code.

Re-read the service's final contract after 0c fixes before writing
this section. The spec must reference the actual shape of
`journalEntryService.post()`, not a hoped-for shape.

The five UI steps follow. Each is self-contained: it lists the new
files, the dependencies, the behavior, and the process gate.

---

#### 15.4 Manual Journal Entry Form (Step 1)

##### New service functions

- `periodService.listOpen({ org_id }, ctx)` in
  `src/services/accounting/periodService.ts`: queries
  `fiscal_periods` where `org_id` matches and `is_locked = false`.
  Read-only — called directly from the API route without
  `withInvariants` (per CLAUDE.md Rule 2: mutation-only wrapping).

- `taxCodeService.listShared(ctx)` in
  `src/services/accounting/taxCodeService.ts`: queries `tax_codes`
  where `org_id IS NULL`, ordered by code. Read-only.

##### New API routes

All read routes call services directly with `buildServiceContext(req)`
for auth. No `withInvariants` wrapping — reads, not mutations, per
CLAUDE.md Rule 2's literal wording.

- **`src/app/api/orgs/[orgId]/fiscal-periods/route.ts`** — GET.
  Calls `periodService.listOpen`. Returns open periods for the org.

- **`src/app/api/orgs/[orgId]/chart-of-accounts/route.ts`** — GET.
  Calls `chartOfAccountsService.list` with `is_active: true` filter.
  **Replaces** the existing `/api/chart-of-accounts` route (which
  used `org_id` as a query param). Existing callers
  (`ChartOfAccountsView.tsx`) must be updated to the new URL.
  Grep the codebase for `/api/chart-of-accounts` before declaring
  step 1 done; any remaining hits are stale callers.

- **`src/app/api/tax-codes/route.ts`** — GET. Calls
  `taxCodeService.listShared`. Returns shared tax codes
  (`org_id IS NULL`).

- **`src/app/api/journal-entries/route.ts`** — POST. This is the
  mutation route:
  - Parses body through `PostJournalEntryInputSchema` (Zod at the
    boundary, per Rule 5)
  - Calls `buildServiceContext(req)` for auth
  - Calls `withInvariants(journalEntryService.post, { action:
    'journal_entry.post' })(parsed, ctx)`
  - Try/catch: 400 for Zod errors, 401 for auth, 403 for
    permission, 422 for `UNBALANCED` / `PERIOD_LOCKED`, 500
    unexpected
  - Returns `{ journal_entry_id }` on success

Friction journal entry:
```
- [date] CLUNKY  OrgSwitcher reads memberships directly via anon-key
  client, bypassing service layer. Inconsistent with Law 1 spirit.
  JournalEntryForm reads through API routes (correct pattern);
  OrgSwitcher refactor deferred to Phase 1.2.
```

##### `src/components/canvas/JournalEntryForm.tsx` — client component

**Schema split (Option B).** The form uses a separate
`JournalEntryFormSchema` (UI shape) distinct from
`PostJournalEntryInputSchema` (service/wire shape). The reason: the
user enters `debit_or_credit` and `amount` per line; `amount_original`,
`amount_cad`, and `fx_rate` are computed at submit time. Validating
computed fields on every keystroke via react-hook-form produces stale-
state bugs. The form schema validates only user-input fields; the
transform function produces the service shape on submit.

- `JournalEntryFormSchema` — defined inline in the form file (UI
  concern, not service contract). Fields: `fiscal_period_id`,
  `entry_date`, `description`, `reference` (optional), `lines[]`
  where each line has `account_id`, `debit_or_credit` (enum:
  'debit' | 'credit'), `amount` (string validated against
  `MoneyAmountSchema`), `tax_code_id` (optional).

- `formStateToServiceInput(formState, orgId)` — transform function,
  inline. Computes per line: `debit_amount` / `credit_amount` (one
  is the amount, other is `zeroMoney()`), `amount_original` (=
  `addMoney(debit_amount, credit_amount)`), `amount_cad` (=
  `amount_original`, Phase 1.1 CAD-only), `fx_rate` (`oneRate()`),
  `currency` ('CAD'). Sets `source: 'manual'`, `dry_run: false`.
  Returns a `PostJournalEntryInput`.

Friction journal entry:
```
- [date] WANT  Form schema (UI-shape) and service schema
  (wire-shape) are intentionally separate. Form transforms to
  service shape on submit.
```

**Form fields:**

- `fiscal_period_id` — dropdown of open periods (fetched from
  `/api/orgs/[orgId]/fiscal-periods`). Locked periods do not appear.
- `entry_date` — date input, defaults to today.
- `description` — text input, required.
- `reference` — text input, optional.
- Dynamic line array via `useFieldArray`:
  - `account_id` — dropdown from chart of accounts (fetched from
    `/api/orgs/[orgId]/chart-of-accounts`)
  - `debit_or_credit` — toggle/select: "Debit" or "Credit"
  - `amount` — text input, validated against `MoneyAmountSchema`
    on change
  - `tax_code_id` — optional dropdown from shared tax codes
    (fetched from `/api/tax-codes`). Phase 1.3 exit criterion #10
    requires this works on at least one real entry.
- Add/remove line buttons. Minimum 2 lines enforced by schema.

**Not user-editable in Phase 1.1:**
- `currency` — hardcoded 'CAD' per line, no dropdown. Multi-currency
  form fields are deferred to Phase 4 per PLAN.md §8b.
- `fx_rate`, `amount_original`, `amount_cad` — computed
  programmatically by the transform function.

Friction journal entry:
```
- [date] WANT  Multi-currency form fields deferred to Phase 4
  per §8b. Phase 1.1 form posts CAD-only.
```

**Running balance indicator:**
- Computes only over `MoneyAmount`-validated form state.
- While any line has a raw-input string that doesn't match the
  `MoneyAmountSchema` regex: shows "—".
- Once all lines validate: shows red (unbalanced) or green (balanced)
  using `eqMoney(totalDebit, totalCredit)`.

**Submit flow:**
- Calls `formStateToServiceInput()` to transform UI shape →
  service shape.
- POSTs to `/api/journal-entries`.
- On success: navigates canvas to `{ type: 'chart_of_accounts',
  orgId }` (step 2 updates this to `journal_entry_list`).
- On error: Zod errors as field-level, service errors as form-level
  inline message.
- Always passes `source: 'manual'`, `dry_run: false`.

**MainframeRail integration:**
- New icon/action sets canvas directive to
  `{ type: 'journal_entry_form', orgId }`.
- `ContextualCanvas` gets a new case in `renderDirective`.

**Process gate:**

1. `pnpm typecheck` — form, routes, services compile.
2. `pnpm test:integration` — all 5 Category A tests green.
3. Manual smoke test (happy path): sign in as controller → navigate
   to form via Mainframe → post one balanced entry to holding company
   org → verify via `psql` that entry + lines exist in
   `journal_entries` / `journal_lines` and `audit_log` row is present
   with `trace_id` populated.
4. Manual smoke test (locked period): sign in as controller → switch
   to Real Estate org → open form → confirm the locked prior-year
   period does NOT appear in the `fiscal_period_id` dropdown. If
   belt-and-suspenders: POST directly to `/api/journal-entries` via
   Postman with the locked period UUID; verify 422 with
   `PERIOD_LOCKED`.
5. Friction journal: record time-to-first-post (PLAN.md §7 exit
   criterion #14).

---

#### 15.5 Journal Entry List (Step 2)

##### New service function

- `journalEntryService.list({ org_id, fiscal_period_id? }, ctx)` in
  `src/services/accounting/journalEntryService.ts`: read-only, no
  `withInvariants`. Returns entries with `journal_entry_id`,
  `entry_date`, `description`, `reference`, `source`, `created_at`,
  `reverses_journal_entry_id`, `reversal_reason`, and per-entry
  debit/credit totals aggregated via `amount_cad` (not
  `debit_amount`/`credit_amount` — multi-currency-correct from day
  one per §2b D5), using `FILTER (WHERE jl.debit_amount > 0)` and
  `FILTER (WHERE jl.credit_amount > 0)` to split the totals.

##### New API route

- **`src/app/api/orgs/[orgId]/journal-entries/route.ts`** — GET.
  Calls `journalEntryService.list`. Filterable by `fiscal_period_id`
  query param (optional — omit to show all).

##### `src/components/canvas/JournalEntryListView.tsx`

The existing shell is replaced with a real component.

- Table view: date, description, reference, source, total debit CAD,
  total credit CAD, reversal indicator (small label if
  `reverses_journal_entry_id` is populated).
- Sortable by date (default: newest first).
- Period filter dropdown (reuses fiscal periods fetch from step 1).
- Row click sets canvas directive to `{ type: 'journal_entry',
  entryId, mode: 'view' }` — navigates to the detail view (step 3).

**Step 1 update:** Change `JournalEntryForm`'s success navigation
from `chart_of_accounts` to `{ type: 'journal_entry_list', orgId }`.

**Process gate:**

1. `pnpm typecheck` + `pnpm test:integration` — all 5 green.
2. Manual: post an entry via the form → verify it appears in the
   list immediately after navigation.

---

#### 15.6 Journal Entry Detail View (Step 3)

##### New service function

- `journalEntryService.get({ journal_entry_id }, ctx)` in
  `src/services/accounting/journalEntryService.ts`: read-only.
  Returns the full entry with all lines joined (account code + name
  from `chart_of_accounts`), `reverses_journal_entry_id`,
  `reversal_reason`, fiscal period name, and `reversed_by_entry_id`.

  The `reversed_by_entry_id` is populated via a single-query LEFT
  JOIN:
  ```sql
  SELECT
    je.*,
    reverse_entry.journal_entry_id AS reversed_by_entry_id
  FROM journal_entries je
  LEFT JOIN journal_entries reverse_entry
    ON reverse_entry.reverses_journal_entry_id = je.journal_entry_id
  WHERE je.journal_entry_id = $1
  ```
  The §2e partial index `idx_je_reverses` makes this cheap.

##### New API route

- **`src/app/api/journal-entries/[entryId]/route.ts`** — GET. Calls
  `journalEntryService.get`.

##### `src/components/canvas/JournalEntryDetailView.tsx`

- Header: entry date, description, reference, source, period name,
  created_at.
- If this entry is a reversal: shows `reversal_reason` and a link
  to the original entry.
- If this entry has been reversed: shows "Reversed by [entry_id]"
  with a link.
- Lines table: account code, account name, debit, credit, currency,
  tax code.
- Footer: total debits, total credits (must match — visual
  confirmation).
- **"Reverse this entry" button:** visible to controller and
  ap_specialist roles (verify against PLAN.md §4h — executive
  cannot reverse). Disabled if `reversed_by_entry_id` is not null
  (entry already reversed). Clicking the button builds a
  `reversalPrefill` using the `mirrorLines` helper (see step 4) and
  sets the canvas directive to `{ type: 'journal_entry_form', orgId,
  prefill: reversalPrefill }`.

**ContextualCanvas integration:**
- New case for `'journal_entry'` directive rendering
  `<JournalEntryDetailView>`.

**Process gate:**

1. `pnpm typecheck` + `pnpm test:integration` — all 5 green.
2. Manual: post an entry → see it in list → click it → see detail
   view with correct lines and totals.

---

#### 15.7 Reversal UI (Step 4)

##### `mirrorLines` pure helper

Added to `src/shared/schemas/accounting/journalEntry.schema.ts` (or
a sibling file). Pure function: swaps `debit_amount` ↔
`credit_amount` per line, leaves `account_id`, `currency`,
`amount_original`, `amount_cad`, `fx_rate`, `tax_code_id` unchanged.

Used by:
- The detail view's reversal launcher (step 4).
- The Phase 1.2 agent's `reverseJournalEntry` tool.

Unit test `mirrorLines.test.ts`: covers swap correctness on a multi-
line fixture. Not a Category A integration test — a unit test on a
pure function.

##### `src/components/canvas/ReversalForm.tsx` — client component

Sibling to `JournalEntryForm`. Two forms, two schemas, two resolvers,
no mode prop.

**Lines are locked via props, not form state.** Lines are passed as
props to `ReversalForm` from the detail view's reversal launcher.
They are rendered as read-only `<div>` elements, not form inputs.
They are NOT in `ReversalFormSchema` (which only validates user-
editable fields: `entry_date`, `reversal_reason`). The reason: the
user cannot edit mirrored lines in Phase 1.1 (no partial reversals
per ADR-001 §18c.19). Locking the lines means the form is small and
the only thing the user does is provide the reason. Faster, less
friction, no risk of producing an invalid mirror.

`reversalFormStateToServiceInput(formState, lockedLines,
originalEntryId, currentPeriodId)` — combines form state with locked
data to produce a `ReversalInput`.

**`ReversalFormSchema`** — defined inline in the form file. Only
validates user-editable fields:
- `entry_date` — date input, defaults to today, editable
- `reversal_reason` — required text, multiline, min 1 character

**Period gap banner (§4h, non-negotiable):**

When the reversal's `fiscal_period_id` (current open period) differs
from the original entry's period, render a warning banner at the top
of the form:

> You are reversing a **[original period name]** entry into
> **[reversal period name]**. The reversal will appear in
> **[reversal period name]**, not in the original period, because
> [original period name] is closed. Verify this is the behaviour
> you want before posting.

- Non-dismissible. Disappears only when the periods match.
- Styled as warning (yellow), not error (red) — the action is legal.

**Submit flow:**
- Transforms via `reversalFormStateToServiceInput()`.
- POSTs to `/api/journal-entries` (same endpoint — the service
  handles both creates and reversals via the union schema).
- On success: navigates to the detail view of the new reversal entry.

**ContextualCanvas integration:**
- When the `'journal_entry_form'` directive has `prefill` containing
  `reverses_journal_entry_id`, render `<ReversalForm>` instead of
  `<JournalEntryForm>`. This is routing, not form logic.

**Process gate:**

1. `pnpm typecheck` + `pnpm test:integration` — all 5 green.
2. `mirrorLines.test.ts` unit test passes.
3. Manual (happy path): post an entry → view detail → click
   "Reverse this entry" → see prefilled reversal form with mirrored
   lines (read-only) → fill in reason → submit → verify reversal
   entry exists in DB with `reverses_journal_entry_id` and
   `reversal_reason` populated → verify original entry's detail
   view now shows "Reversed by [id]."
4. Manual (period gap): if original entry is in a different period
   than the current open one, verify the banner appears. Can be
   tested by posting the original to the Real Estate org's open
   period, then locking that period via psql, opening a new period,
   and attempting the reversal.

---

#### 15.8 Basic P&L Report (Step 5)

**Prerequisite:** §18 Q21 (P&L reversal rendering) must be answered
before step 5 begins. The question was added to PLAN.md §18 during
step 0a. Step 5 waits for the founder's answer.

##### New service function

- `reportService.profitAndLoss({ org_id, fiscal_period_id? }, ctx)`
  in `src/services/reporting/reportService.ts`: read-only.

  The query groups by `account_type` only (not per-account),
  producing five rows. Sums `amount_cad` (not
  `debit_amount`/`credit_amount` — multi-currency-correct from day
  one per §2b D5). Drilldown by account is Phase 2 (a second query
  from the same service function). For Phase 1.1, summary-by-type
  is sufficient per PLAN.md §7.

  **If §18 Q21 answer is (a) — show separate lines (default):** the
  query includes all entries; reversals net to zero naturally:
  ```sql
  SELECT
    coa.account_type,
    SUM(jl.amount_cad) FILTER (WHERE jl.credit_amount > 0)
      AS total_credits_cad,
    SUM(jl.amount_cad) FILTER (WHERE jl.debit_amount > 0)
      AS total_debits_cad
  FROM journal_lines jl
  JOIN journal_entries je
    ON jl.journal_entry_id = je.journal_entry_id
  JOIN chart_of_accounts coa
    ON jl.account_id = coa.account_id
  WHERE je.org_id = $1
    AND ($2::uuid IS NULL OR je.fiscal_period_id = $2)
  GROUP BY coa.account_type
  ORDER BY
    CASE coa.account_type
      WHEN 'revenue' THEN 1
      WHEN 'expense' THEN 2
      WHEN 'asset' THEN 3
      WHEN 'liability' THEN 4
      WHEN 'equity' THEN 5
    END
  ```

  **If §18 Q21 answer is (b) — aggregate net:** add
  `WHERE NOT EXISTS (SELECT 1 FROM journal_entries r WHERE
  r.reverses_journal_entry_id = je.journal_entry_id)` to suppress
  reversed originals, plus `AND je.reverses_journal_entry_id IS NULL`
  to suppress the reversals themselves.

##### New API route

- **`src/app/api/orgs/[orgId]/reports/pl/route.ts`** — GET. Calls
  `reportService.profitAndLoss`. Filterable by `fiscal_period_id`
  query param.

##### `src/components/canvas/BasicPLView.tsx`

- Period filter dropdown (reuses fiscal periods fetch).
- Structured as a financial statement:
  - **Revenue** section: credit totals for revenue accounts.
  - **Expenses** section: debit totals for expense accounts.
  - **Net Income** line: Revenue credits minus Expense debits,
    computed via `addMoney` helpers.
- **Balance Sheet summary** below the P&L: Asset, Liability, Equity
  totals from the same query's remaining three rows. Proves the books
  balance: Assets = Liabilities + Equity + Net Income.
- P&L and Balance Sheet summary share one query, not two.

**MainframeRail integration:**
- New icon/action for P&L sets directive to
  `{ type: 'report_pl', orgId, from: periodStart, to: periodEnd }`.
- `ContextualCanvas` gets a new case rendering `<BasicPLView>`.

**Process gate:**

1. `pnpm typecheck` + `pnpm test:integration` — all 5 green.
2. Manual: post 3+ entries across both orgs → open P&L → verify
   totals.
3. **Hand-verification:** export posted entries to a scratch
   spreadsheet, sum by `account_type`, compare to P&L view. Must
   match exactly. If they don't, the query is wrong — fix in step 5.
4. Reverse one entry → verify P&L updates and reversal nets to zero
   per §18 Q21 resolution.

---

#### 15.9 Phase 1.1 Exit Criteria Walkthrough

After step 5, run the full Phase 1.1 exit criteria from §14 — all
items, including the new rows added during step 0a. The friction
journal should have accumulated entries throughout steps 0a–5.

Specific criteria to verify at this stage:
- **#9:** 5 manual journal entries posted across both orgs (accumulated
  across steps 1–5 process gates).
- **#13:** Friction journal has ≥3 real entries (will have many more).
- **#14:** Time-to-first-post measured and recorded (captured in
  step 1 process gate).
- **#15:** Region pinning: Supabase `ca-central-1`, Vercel `yul1`.

**Do not begin Phase 1.2 work until the founder approves the completed
checklist and confirms readiness.**

---

---

### 16. v0.5.7 Closeout Reconciliation — Three CTO Reviews

*Added 2026-04-12. This section reconciles the Phase 1.1 brief against
three external CTO/architecture reviews conducted after §15 was written.
The reviews compared PLAN.md, CLAUDE.md, and this brief against
accounting software industry best practices. Most findings confirm
existing architecture; the actionable items below are additions that
prevent throwaway work or close gaps auditors would flag.*

*This spec is the canonical design. If an implementation plan produced
by a writing-plans tool conflicts with this spec, this spec wins on
what to build. The implementation plan wins on the order to build it.
Conflicts about scope or correctness are resolved by re-reading
PLAN.md and the relevant ADR.*

*The friction journal canonical path is `docs/friction-journal.md`
(no phase suffix). All friction journal references in this brief and
in PLAN.md converge on this path.*

---

#### 16.1 Context

Three external reviews assessed the project documents against industry
standards. The reviews produced thirty-six total additions, triaged
into four categories:

- **Act on now (Phase 1.1):** schema additions, test strengthening,
  CLAUDE.md/PLAN.md edits, exit criteria additions.
- **Defer to Phase 1.2 brief writing:** posting engine separation,
  maker-checker constraint, CoA hierarchy validation, Cash Flow
  Statement, user activity log, recurring entries, budget tables,
  reporting strategy.
- **Already addressed in PLAN.md:** PITR strategy (§18a Q8), FX
  schema correctness (§8b + D5 CHECK), trigger performance (§1d),
  synchronous audit log (Simplification 1), events table
  append-only coverage.
- **Rejected:** moving invariants to a renamed "Constitution"
  section (no behavior change), converting §14 to Markdown tasks
  (§14 already uses `- [ ]`), moving FX wiring to Phase 1.2
  (schema is already correct; wiring is Phase 4 per §8b).

The additions below are organized into the same step structure as
§15 (0a through 5), with new sub-steps where needed.

---

#### 16.2 Step 0a Additions (Brief Reconciliation)

Append to §15.0's checklist. Execute in the same pass, same process
gate (`pnpm typecheck` + `pnpm test:integration` all 5 green).

**Preflight (before 0a-1):** Run `ls supabase/migrations/` and
confirm `20240101000000_initial_schema.sql` and
`20240102000000_add_reversal_reason.sql` are present. Migrations
003-006 use Supabase CLI timestamp naming and are created in
`supabase/migrations/` during this 0a pass:
`20240103000000_seed_tax_codes.sql` (§15.0 item 4),
`20240104000000_add_entry_number.sql` (§16.2 item 13),
`20240105000000_add_entry_type.sql` (§16.2 item 14),
`20240106000000_add_attachments.sql` (§16.2 item 15).
If any unexpected migration files are present, stop and
investigate before continuing.

**Migration convention (v0.5.7):** All migrations live in
`supabase/migrations/` with Supabase CLI timestamp-prefixed
filenames. The `src/db/migrations/` directory was removed during
Phase 1.1 closeout — it was dead code that caused migration 002
to go unapplied for an unknown duration. Seed data lives in
`src/db/seed/`. Test helpers are loaded by
`tests/setup/globalSetup.ts`, not by migrations.

##### 0a-1: DDL Changes

**13. §4 DDL: add `entry_number` to `journal_entries`.**

```sql
-- After idempotency_key column, before CONSTRAINT block:
entry_number        bigint NOT NULL,

-- New constraint, after existing constraints:
CONSTRAINT unique_entry_number_per_org_period
  UNIQUE (org_id, fiscal_period_id, entry_number)
```

Auditors require sequential entry numbering per org per period.
UUIDs are not acceptable as entry references. The number is assigned
by `journalEntryService.post()` inside the transaction via
`SELECT COALESCE(MAX(entry_number), 0) + 1 FROM journal_entries
WHERE org_id = $1 AND fiscal_period_id = $2 FOR UPDATE`. The
`FOR UPDATE` serializes concurrent inserts within the same period
(same row-locking pattern as §1d period lock). Not a Postgres
sequence — sequences leave gaps on rolled-back transactions, which
auditors flag.

Migration `20240102000000_add_reversal_reason.sql` already exists
in `supabase/migrations/`. Create
`supabase/migrations/20240104000000_add_entry_number.sql` (after
`20240103000000_seed_tax_codes.sql`):

```sql
ALTER TABLE journal_entries
  ADD COLUMN entry_number bigint;

-- Backfill existing rows (seeded/test entries) in creation order:
UPDATE journal_entries je SET entry_number = sub.rn
FROM (
  SELECT journal_entry_id,
         ROW_NUMBER() OVER (
           PARTITION BY org_id, fiscal_period_id
           ORDER BY created_at
         ) AS rn
  FROM journal_entries
) sub
WHERE je.journal_entry_id = sub.journal_entry_id;

ALTER TABLE journal_entries
  ALTER COLUMN entry_number SET NOT NULL;

ALTER TABLE journal_entries
  ADD CONSTRAINT unique_entry_number_per_org_period
  UNIQUE (org_id, fiscal_period_id, entry_number);
```

**14. §4 DDL: add `entry_type` enum and column.**

```sql
-- New enum (place with other enums at top of 001):
CREATE TYPE entry_type AS ENUM (
  'regular',
  'adjusting',
  'closing',
  'reversing'
);

-- New column on journal_entries (after reversal_reason):
entry_type  entry_type NOT NULL DEFAULT 'regular'
```

IFRS requires distinguishing regular from adjusting/closing/reversing
entries for period-end reporting. The column is defaulted; no UI
field in Phase 1.1. `journalEntryService.post()` sets
`entry_type = 'reversing'` programmatically when
`reverses_journal_entry_id` is populated; all other entries default
to `'regular'`. Phase 2 surfaces adjusting/closing entries as
distinct workflows.

Migration `supabase/migrations/20240105000000_add_entry_type.sql`:

```sql
CREATE TYPE entry_type AS ENUM (
  'regular', 'adjusting', 'closing', 'reversing'
);

ALTER TABLE journal_entries
  ADD COLUMN entry_type entry_type NOT NULL DEFAULT 'regular';

-- Set existing reversal entries to 'reversing':
UPDATE journal_entries
  SET entry_type = 'reversing'
  WHERE reverses_journal_entry_id IS NOT NULL;
```

**15. §4 DDL: add `journal_entry_attachments` table.**

```sql
CREATE TABLE journal_entry_attachments (
  attachment_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id    uuid NOT NULL REFERENCES journal_entries(journal_entry_id)
    ON DELETE CASCADE,
  storage_path        text NOT NULL,
  original_filename   text NOT NULL,
  uploaded_by         uuid REFERENCES auth.users(id),
  uploaded_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_je_attachments_entry
  ON journal_entry_attachments (journal_entry_id);

ALTER TABLE journal_entry_attachments ENABLE ROW LEVEL SECURITY;

-- Inherit tenant scope via parent journal entry:
CREATE POLICY je_attachments_select ON journal_entry_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id =
            journal_entry_attachments.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );

COMMENT ON TABLE journal_entry_attachments IS
  'Populated in Phase 2 by AP Agent. Do not write to manually.';
```

Empty in Phase 1.1. Same Category A reservation pattern as
`intercompany_relationships`. Migration
`supabase/migrations/20240106000000_add_attachments.sql`.

##### 0a-2: Brief Paperwork

Items 5-10 from §15.0 remain unchanged. Add:

**16. §14 exit criteria: add criterion #16 "Document Sync."**

Add to §14 under a new subheading `#### Document sync`:

```markdown
- [ ] **Document Sync completed** — before declaring Phase 1.1
      complete: (a) PLAN.md §1a folder tree audited against
      actual filesystem — every file listed exists, no unlisted
      files in key directories; (b) stale references grepped
      (test counts, table counts, file paths, version numbers)
      and all discrepancies resolved; (c) Open Questions in §18
      that were answered during Phase 1.1 moved to RESOLVED
      markers in the relevant Bible sections; (d) friction
      journal audited for entries that should become ADRs per
      docs/decisions/README.md threshold; (e) all discrepancies
      recorded in docs/friction-journal.md with the fix applied
```

This prevents the v0.5.6 failure mode where reconciliation was
claimed without being performed.

##### 0a-3: Meta-Edits

**17. §18 Open Question: Soft close vs. hard close.**

Add to PLAN.md §18:

> **Q21 — Period close model.** PLAN.md treats `is_locked` as
> binary (open/closed), which is hard close only. Standard
> accounting practice distinguishes soft close (controller can
> still post adjusting entries) from hard close (period sealed,
> no writes from any role). Phase 1.1 ships hard close only per
> §7. Phase 2+: add soft close state, requires schema change to
> `fiscal_periods` (`status` enum replacing `is_locked`), RLS
> policy update on `journal_entries` to allow controller writes
> when state is `soft_closed`, and UI for two-stage close flow.
> Default: defer to Phase 2+.

**18. PLAN.md §16 edit: add six-document-type enumeration.**

Add a subsection to PLAN.md §16 listing the document hierarchy:

1. **Spec/PRD** — static, defines the goal. Currently embedded in
   PLAN.md "The Product" section.
2. **PLAN.md (Architecture Bible)** — active/fluid, defines
   architectural decisions. Edited at version boundaries.
3. **ADR** — permanent, records decisions made in anger. One file
   per decision under `docs/decisions/`.
4. **Phase Briefs** — active, phase-scoped. One file per phase
   under `docs/specs/`. Historical reference after phase closes.
5. **CLAUDE.md** — derived from PLAN.md, stable. Edited only when
   standing rules change. Loaded every session.
6. **Friction Journal** — append-only, written during work.
   Canonical path: `docs/friction-journal.md`. Feeds next phase's
   brief writing and identifies ADR candidates.

**19. PLAN.md §16 edit: add at-phase-boundary reconciliation
ritual.**

At the end of every phase, before writing the next phase's brief:
(a) audit PLAN.md §1a folder tree against actual filesystem,
(b) move resolved Open Questions from §18 into relevant Bible
sections with `RESOLVED v0.X.Y` markers, (c) audit friction
journal for entries that should become ADRs, (d) read changelog
claims against actual state. Phase boundaries are the cadence,
not weekly.

**20. CLAUDE.md edit: sharpen drift-handling rule.**

Add one line to CLAUDE.md "When in doubt" section:

> "Code that deviates from PLAN.md during a session is wrong
> unless an ADR is written to update the Bible first. The ADR
> comes before the code, not after."

##### 0a-4: Friction Journal Entries

Write all entries for items 13-20 above. Additionally:

```
- 2026-04-12 WRONG  PLAN.md §2a defines journal_entries with UUID
  PK only. Auditors require sequential entry numbering per org per
  period. Bible gap caught by external CTO review. Added
  entry_number column + UNIQUE constraint in 0a.
- 2026-04-12 WANT   entry_type schema reservation added per CTO
  review. Column defaulted; no UI in Phase 1.1. Phase 2 surfaces
  adjusting/closing entries as distinct workflow.
- 2026-04-12 WANT   journal_entry_attachments table added as
  Category A reservation per CTO review. Empty Phase 1.1; Phase 2
  AP Agent populates.
- 2026-04-12 NOTE   External CTO review recommends moving
  FX/multi-currency wiring into Phase 1.2. Bible §8b explicitly
  defers to Phase 4 with schema correctness in Phase 1.1.
  Reviewer's concern addressed by step 1 process gate verification
  that amount_cad/fx_rate are populated on every posted entry.
  Phase 1.2 scope unchanged.
- 2026-04-12 WANT   PLAN.md is 256KB; ~5,000 words is changelog
  history current readers don't need. CTO review recommends
  extracting to docs/prompt-history/CHANGELOG.md. Deferred to
  post-Phase-1.1 close so it doesn't compete with brief
  reconciliation.
- 2026-04-12 WANT   Soft close vs. hard close gap logged as §18
  Open Question. Phase 1.1 ships hard close only.
- 2026-04-12 WANT   CTO "delete the UI, does the balance sheet
  still work?" test adopted as Phase 1.1 closeout verification.
  Run integration tests + manual psql P&L query at end of step 5.
```

**Process gate:** same as §15.0 — `pnpm typecheck` clean,
`pnpm test:integration` all 5 green. The new DDL migrations must
apply without error.

---

#### 16.3 Step 0c Additions (Service Verification)

Append to §15.2's work.

**A. `journalEntryService.post`: assign `entry_number`.**

Inside the transaction, before the `journal_entries` INSERT:

```typescript
const { data } = await tx
  .from('journal_entries')
  .select('entry_number')
  .eq('org_id', input.org_id)
  .eq('fiscal_period_id', input.fiscal_period_id)
  .order('entry_number', { ascending: false })
  .limit(1)
  .maybeSingle();

const nextEntryNumber = (data?.entry_number ?? 0) + 1;
```

The entry_number is included in the INSERT and in the return value.

**Phase 1.1 concurrency decision:** This query does NOT use
`FOR UPDATE` row-locking. The Supabase query builder does not
expose `FOR UPDATE` directly; achieving it requires a Postgres
RPC function. Phase 1.1 has a single founder posting one entry
at a time — the concurrent insert race window is zero. Phase 1.2
promotes this to a Postgres RPC function with explicit
`SELECT ... FOR UPDATE` before the agent path lights up
concurrent posting. This follows §10c's isolation reasoning:
row-level locks are added at the specific points where write
skew would otherwise occur, and Phase 1.1 doesn't have that
skew yet.

Friction journal entry:
```
- [date] CLUNKY  entry_number assignment uses MAX+1 without
  FOR UPDATE row locking in Phase 1.1 because Supabase query
  builder doesn't expose FOR UPDATE directly. Single-founder
  Phase 1.1 has zero concurrent insert risk. Phase 1.2 promotes
  to Postgres RPC function with explicit FOR UPDATE before agent
  path lights up concurrent posting.
```

**B. `journalEntryService.post`: set `entry_type`.**

When `input.reverses_journal_entry_id` is populated, set
`entry_type = 'reversing'` on the INSERT. Otherwise default
`'regular'`. The form never sends `entry_type`; the service
assigns it programmatically.

**C. Strengthen Test 3 to table-parameterized RLS coverage.**

Expand `crossOrgRlsIsolation.test.ts` from CoA-only to all
tenant-scoped tables:

```typescript
describe.each([
  'chart_of_accounts',
  'journal_entries',
  'journal_lines',
  'fiscal_periods',
  'vendors',
  'audit_log',
  'ai_actions',
])('RLS isolates %s across orgs', (tableName) => {
  it('AP Specialist cannot read holding company rows', async () => {
    // Sign in as AP Specialist (real_estate org only)
    // Attempt SELECT from tableName WHERE org_id = holding_co_org_id
    // Assert: zero rows returned (RLS filters)
  });
});
```

Category A floor stays at five tests; Test 3 covers more ground.

**Test-local setup for empty tables:** Tables that are empty in
Phase 1.1 (`vendors`, `ai_actions`) need one row per org to make
the assertion meaningful — an empty table returns zero rows for
any user, which is a vacuous pass. `crossOrgRlsIsolation.test.ts`
inserts one row per tested table per org in `beforeAll` and
deletes them in `afterAll`. Does NOT modify `dev.sql`. The seed
script stays focused on universal fixtures (orgs, CoA,
memberships, periods); test-specific data is co-located with the
test that needs it.

---

#### 16.4 Step 1 Additions (Form Work)

Append to §15.4's work.

**A. `orgService.createOrgWithTemplate`: auto-generate fiscal
periods.**

After CoA template loading and membership creation, generate 12
monthly fiscal periods for the current fiscal year.

Extract the generation as a pure function
`generateMonthlyFiscalPeriods(startMonth, currentYear, orgId)`
returning `FiscalPeriodInsert[]`. The function lives in
`src/services/org/orgService.ts` or a sibling helper file.

```typescript
type FiscalPeriodInsert = {
  org_id: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  is_locked: boolean;
};

export function generateMonthlyFiscalPeriods(
  startMonth: number, // 1-12
  currentYear: number,
  orgId: string,
): FiscalPeriodInsert[] {
  const periods: FiscalPeriodInsert[] = [];
  for (let i = 0; i < 12; i++) {
    const month = ((startMonth - 1 + i) % 12) + 1;
    const year = month < startMonth
      ? currentYear + 1
      : currentYear;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day
    periods.push({
      org_id: orgId,
      name: `${startDate.toLocaleString('en', {
        month: 'long',
      })} ${year}`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_locked: false,
    });
  }
  return periods;
}
```

The service calls this function, then bulk-inserts the result
inside the org-creation transaction.

**Unit test required:** `generateFiscalPeriods.test.ts` verifies
the output for `startMonth` values {1, 6, 7, 12} to cover the
wraparound boundary. Each case asserts: 12 periods produced,
first period starts in `startMonth`, last period ends in
`startMonth - 1` (wrapping), no gaps between consecutive periods'
`end_date` and `start_date`. Pass `currentYear` explicitly (the
function signature already accepts it) so the test is
deterministic. Include `currentYear` values {2024, 2025} for at
least one `startMonth` to verify the February 28/29 boundary —
`new Date(year, 2, 0)` returns Feb 28 in non-leap years and
Feb 29 in leap years; without both cases a developer running
tests in a leap year sees different output than CI in a non-leap
year. Pure function, trivially testable.

The seed script (`dev.sql`) keeps its hardcoded periods with fixed
UUIDs because the integration tests reference those UUIDs.
`orgService` auto-generation only fires for new orgs created via
the UI, not for seeded orgs. The seed script runs after schema
migrations; the auto-generation is a service function.

**B. Process gate addition: multi-currency columns verification.**

After step 1's existing process gate, add:

```
5. psql verification: SELECT entry_date, amount_original,
   amount_cad, fx_rate FROM journal_lines WHERE journal_entry_id
   = [newly posted entry]. Verify: amount_original > 0,
   amount_cad = amount_original (CAD-only), fx_rate = 1.00000000.
   None are NULL or zero.
```

This proves the multi-currency contract is honored even on
CAD-only entries, addressing the CTO review concern without
changing Phase 1.2 scope.

---

#### 16.5 Step 5 Additions (P&L + Trial Balance)

Append to §15.8's work.

**The "delete the UI" verification in step 5's process gate is the
architectural correctness test for the entire Phase 1.1 ledger.**
If it passes, Tier 1 (ledger truth) is genuinely separable from
Tier 3 (UI presentation) and the system has the foundation for
Phase 1.2 onward. If it fails, there is logic in the UI that
should be in the service layer, and the gap must be closed before
Phase 1.2 begins.

##### Trial Balance View

**Scope is intentionally minimal.** A flat table with columns:
`account_code`, `account_name`, `account_type`, `debit_total_cad`,
`credit_total_cad`. Footer row shows `SUM(debit_total_cad)` and
`SUM(credit_total_cad)`. The footer values must be equal — this is
the verification primitive.

**Not in scope:** hierarchical rendering, parent/child indentation,
subtotals by account_type, running balances, period-over-period
comparison. Any of these lands as a friction journal `WANT`, not
as in-scope work. Phase 1.2+ may add them.

Phase 1.1's Trial Balance exists to give the controller a "do the
books balance?" answer in 30 seconds.

##### New service function

`reportService.trialBalance({ org_id, fiscal_period_id? }, ctx)`
in `src/services/reporting/reportService.ts`: read-only.

Query:

```sql
SELECT
  coa.account_code,
  coa.account_name,
  coa.account_type,
  COALESCE(SUM(jl.debit_amount), 0) AS debit_total_cad,
  COALESCE(SUM(jl.credit_amount), 0) AS credit_total_cad
FROM chart_of_accounts coa
LEFT JOIN journal_lines jl
  ON jl.account_id = coa.account_id
LEFT JOIN journal_entries je
  ON jl.journal_entry_id = je.journal_entry_id
  AND je.org_id = $1
  AND ($2::uuid IS NULL OR je.fiscal_period_id = $2)
WHERE coa.org_id = $1
  AND coa.is_active = true
GROUP BY coa.account_id, coa.account_code, coa.account_name,
         coa.account_type
ORDER BY coa.account_code
```

Uses `amount_cad` columns (multi-currency-correct). LEFT JOIN
ensures accounts with no entries still appear (zero balances).

##### New API route

`src/app/api/orgs/[orgId]/reports/trial-balance/route.ts` — GET.
Calls `reportService.trialBalance`. Filterable by
`fiscal_period_id` query param.

##### `src/components/canvas/BasicTrialBalanceView.tsx`

- Period filter dropdown (shared with P&L, reuses fiscal periods
  fetch).
- Flat table: one row per active account, ordered by account_code.
- Footer row: sum of debit_total_cad, sum of credit_total_cad.
  Styled distinctly (bold, background). If sums are not equal,
  render in red — this is a bug signal, not a user error.
- No interactivity. No drill-down. No sorting. Read-only.

##### MainframeRail integration

New icon/action for Trial Balance sets directive to
`{ type: 'report_trial_balance', orgId, periodId }`.
`ContextualCanvas` gets a new case rendering
`<BasicTrialBalanceView>`.

##### Updated process gate for step 5

Replace §15.8's process gate with:

1. `pnpm typecheck` + `pnpm test:integration` — all 5 green.
2. Manual: post 3+ entries across both orgs → open Trial Balance →
   verify footer row sums are equal.
3. **Hand-verification (Trial Balance primary):** export posted
   entries to a scratch spreadsheet, sum debits and credits per
   account, compare to Trial Balance view. Must match exactly.
4. Open P&L → verify totals. P&L totals must be derivable from the
   Trial Balance (revenue accounts' credit totals, expense
   accounts' debit totals).
5. Reverse one entry → verify Trial Balance footer still balances
   and P&L updates per §18 Q21 resolution.
6. **CTO "delete the UI" test:** Run a manual psql query that
   produces per-account-type sums directly from `journal_lines`
   joined to `chart_of_accounts`. Compare the psql output to both
   the Trial Balance view and the P&L view. All three must agree.
   If the psql query and the UI views disagree, there is logic in
   the UI that should be in the service query — fix in step 5.

---

#### 16.6 Deferred Items

The following items were raised by the CTO reviews and are
explicitly **not** Phase 1.1 work. They are logged here so
Phase 1.2 brief writing has the trace. Each becomes a friction
journal entry during 0a-4 and a §18 Open Question when the
relevant phase brief is written.

| Item | Target Phase | Reason for Deferral |
|---|---|---|
| **Posting engine separation** — distinct `proposeFromUserIntent` layer between agent reasoning and `journalEntryService.post()` | Phase 1.2 brief | Phase 1.1 has no events to translate. The separation matters when the AP Agent needs the same propose→post pattern as the Double Entry Agent. |
| **Maker-checker constraint** — `created_by != confirming_user_id` for agent-source entries | Phase 1.2 brief | Phase 1.1 has one founder; constraint would reject self-posting. Natural fit alongside agent confirmation flow. |
| **CoA hierarchy validation** — depth check, type consistency, orphan prevention on `chart_of_accounts` mutations | Whichever phase ships CoA mutation | Phase 1.1 CoA is read-only (loaded from templates). No mutation path exists. |
| **Cash Flow Statement** — requires operating/investing/financing categorization | Phase 2+ | Schema does not have activity categorization. Most complex of the three IFRS statements. |
| **User activity log** — login audit, failed attempts, session tracking for SOC 2 | Phase 2+ | Phase 1.1 has one user. Supabase Auth logs internally; surfacing is Phase 2 work informed by SOC 2 pursuit decision. |
| **Recurring journal entries** — templates with frequency, effective dates, auto-generation | Phase 2 brief | Requires pg-boss (Phase 2). Schema design is a real conversation, not a Category A reservation. |
| **Budget tables** — budget vs. actual variance analysis | Phase 3+ | Feature, not architectural gap. Executive persona is Phase 3+ for full functionality. |
| **Reporting strategy** — materialized views, read models, or ETL for scale | Phase 2 brief | Phase 1.1 live Postgres aggregates are sufficient. Phase 1.3 query latency measurements inform the choice. |
| **PLAN.md changelog extraction** — move ~5,000 words of version history to `docs/prompt-history/CHANGELOG.md` | Post-Phase-1.1 | Cross-references between changelog entries need to follow the move. Deferred so it doesn't compete with brief reconciliation. |
| **Audit log query view** — self-service audit trail for controllers | Phase 1.2 | Phase 1.1 has nothing to query. Ships alongside AI Action Review queue activation. |
| **Q22 — Adjustment period support** — "13th month" year-end adjustment period for prior-year adjustments after operations move to new fiscal year | Phase 2+ | Phase 1.1 ships 12 monthly periods only. Phase 2+: add `adjustment_period` boolean or `period_type` enum to `fiscal_periods`, service rule that adjustment periods only accept `entry_type='adjusting'` entries. Alongside Q21 (soft close). |
| **Q23 — CoA hierarchy roll-up query support** — parent-child rollups for hierarchical reports (e.g., "Total Operating Expenses") | Phase 2+ | Phase 1.1 reports group by `account_type` (flat). `parent_account_id` exists as schema for hierarchy but no roll-up query. Choices: (a) recursive CTE, (b) materialized path column, (c) closure table. Deferred to whichever phase ships hierarchical reports. |
| **Test 6 — Idempotency double-post test** — verify same `idempotency_key` returns cached result, not duplicate entry | Phase 1.2 brief | Phase 1.1 service Zod-rejects `idempotency_key`. Test belongs alongside Phase 1.2's agent path where the service accepts and honors it. DB CHECK `idempotency_required_for_agent` already in place. |
| **CLAUDE.md agent rules** — (1) every mutation requires `correlation_id`, (2) forbid AI from choosing accounts without `PostingRule` lookup | Phase 1.2 brief | Phase 1.1 has zero AI-driven events and no agent path. Rules land alongside the Phase 1.2 brief, not before. |
| **Canonical Table addition** — seven-section system-of-laws summary from CTO review, add as PLAN.md §0 reference | Post-Phase-1.1 | Reference material, not new architectural decisions. Lands alongside the PLAN.md changelog extraction. |

---

#### 16.7 Recap Pause

**Between completing 0a (all four sub-steps) and starting 0b,
stop. Read the reconciled brief end-to-end against PLAN.md,
side by side.**

This is not optional. Three external reviews added items that
interact with each other and with existing §15 design in ways
that are invisible until the reconciled state is read as a whole.
The recap produces one artifact: a list of contradictions found
(ideally empty; realistically 1-3 small items). Each contradiction
is resolved immediately or logged as a friction journal entry.

##### Cross-cutting interaction checklist

Verify each of these during the recap. The list is finite; the
recap is bounded.

1. **`entry_type` column ↔ Test 3 strengthening.** The new
   table-parameterized RLS test inserts into `journal_entries`.
   Verify the test helper rows include `entry_type` (defaulted to
   `'regular'`) so inserts don't fail on the NOT NULL constraint.

2. **`entry_number` column ↔ Tests 1, 2, 5.** All three tests
   insert into `journal_entries` via test helpers. Verify the
   helpers either (a) set `entry_number` explicitly, or (b) use
   `journalEntryService.post()` which assigns it automatically.
   If tests bypass the service and insert directly via SQL, those
   inserts need an `entry_number` value. The backfill migration
   handles existing rows; new test inserts need the column.

3. **`reversal_reason` CHECK ↔ reversal mirror test (§6g).** The
   test's "happy path" branch must pass a non-empty
   `reversal_reason`. Verify the test fixture covers this.

4. **`mirrorLines` helper ↔ `entry_type` assignment.** When the
   reversal form launcher calls `mirrorLines`, the prefill flows
   through `ReversalForm` → `reversalFormStateToServiceInput` →
   `ReversalInput`. `entry_type = 'reversing'` is set by
   `journalEntryService.post()` (not the form). Verify the
   service sets it when `reverses_journal_entry_id` is populated.

5. **Document Sync exit criterion (#16) ↔ friction journal
   accumulation (#13).** Both reference `docs/friction-journal.md`.
   Verify this path is used consistently throughout the brief and
   in PLAN.md §7.

6. **`003_seed_tax_codes.sql` ↔ test setup ordering.** If tests
   need tax codes, verify `testDb.ts` runs migrations in order:
   001 → 002 → 003 → 004 → 005 → 006. Supabase CLI handles
   ordering by filename; verify filenames sort correctly.

7. **`orgService.createOrgWithTemplate` auto-generated periods ↔
   `dev.sql` seed script.** The seed script creates hardcoded
   periods with fixed UUIDs that tests reference.
   `orgService` auto-generates for new UI-created orgs only.
   Verify: the seed script does NOT call `orgService` — it
   inserts directly via SQL. The auto-generation only fires in
   the service function, not in the seed path. No duplication.

8. **Migration file numbering ↔ spec assumptions.** Run
   `ls supabase/migrations/` and verify the timestamps sort
   correctly: `20240101*` (initial), `20240102*` (reversal_reason),
   then 003-006 created during 0a. If any migration exists that
   the spec doesn't account for, investigate before applying
   new ones. Wrong ordering cascades into "type from a later
   migration doesn't exist" failures.

**After the recap:** if contradictions were found and resolved,
re-run `pnpm typecheck` + `pnpm test:integration`. Then proceed
to 0b.

---

**End of Phase 1.1 Execution Brief.**

The Phase 1.2 Execution Brief is **not** written until every item
above is checked — including §16's additions and the Document Sync
exit criterion (#16 in §14). When you complete the checklist, report
to the founder which items required deviation from the brief (note
them in the friction journal) and what the friction journal taught
you. Those notes are the input to writing the Phase 1.2 brief.

Do not begin Phase 1.2 work until the founder approves the completed
Phase 1.1 checklist and confirms readiness for the next phase.

---
