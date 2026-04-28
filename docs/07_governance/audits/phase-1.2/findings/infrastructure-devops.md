# Infrastructure & DevOps — Phase 1.2 Audit Findings

**Status:** Sparse baseline (Phase 1.2 local development only; no production deployment, no load testing).

**Audit scope:** HEAD = 32760e1, cumulative Phase 0 + 1.1 + 1.2 + Arc A (orientation phase only).

---

## Phase 1.2 Baseline Assessment

At Phase 1.2, infrastructure exists **locally only**. The deployment story is deferred to Phase 1.3+ (per `phase-2/obligations.md`). This assessment establishes a baseline of what local development infrastructure currently supports and flags what must change before meaningful production-readiness findings are possible.

### Local Development Workflow

**Database & API stack:** Supabase CLI (local) with PostgreSQL 15, PostgREST (port 54321), and auth/storage services. `supabase/config.toml` enables API (`max_rows = 1000` safety limit), database pooling (disabled), and Inbucket (email testing). Database migrations (32 files) use explicit IF NOT EXISTS guards on seed-critical operations (only 2 of 32 files; see Reproducibility concern below). Session lock convention (`scripts/session-init.sh`, `.coordination/session-lock.json`) enforces single-session development discipline with pre-commit hook gating.

**Build & test infrastructure:** Next.js 15, TypeScript 5 (strict, incremental), pnpm 9. Test suite: Vitest (unit/integration, 15s timeout, fileParallelism=false), Playwright e2e (Chromium-only, 1 worker, Phase 1.2 intro per Session 7.1.2). CI: Single workflow (`verify-audit-coverage.yml`) runs daily 06:00 UTC on schedule + manual dispatch. No push/PR triggers — Layer-2 audit verification only (INV-AUDIT-001 backstop). No linting gate in CI.

**Script ergonomics:** Six database commands (`db:start`, `db:reset`, `db:migrate`, `db:seed`, `db:seed:auth`, `db:seed:all`, `db:reset:clean`), one typecheck (`typecheck`), three test commands (unit, integration, e2e). Agent validation floor (`agent:floor`) runs 5 integration tests (unbalanced journal, locked period, cross-org RLS, service middleware auth, reversal mirror). Dependency audit missing (no renovate, dependabot, or version-drift detection in CI).

### Dependency Hygiene

**Caret versioning:** All production dependencies use `^` ranges (Anthropic SDK `^0.90.0`, Supabase `^0.5.0`, Supabase.js `^2.103.0`, Zod `^3.23.0`). No semver strictness. pnpm-lock.yaml is 5,851 lines. No `renovate.json` or dependabot config exists. Security patches are manual (discovery + deliberate action required). Phase 1.2 token-usage observation baseline: caching S22 enablement (`856dcc7`) reduced per-call cost ~32% within single flows; no cross-turn cost tracking (see Performance below).

### Secret Management

`.env.example` and `.env.local.example` exist. `.env.local` is tracked in git (plaintext, 1.2 KB, 2026-04-21). Supabase service-role key exposed in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`. No `.env` root config in repo; local `.env.local` is user-specific but version-controlled plaintext. Pre-Phase-1.3 concern: `.env.local` presence in git violates zero-secrets rule (Phase 1.1 carry UF-020, concern 1.5 reference). Placeholder value in example suggests staging intent; actual key in tracked file is a risk.

### Pre-Commit & CI Gating

- **Pre-commit:** Session-lock enforcement only (not session-content validation).
- **CI (daily audit only):** No push-time linting, typecheck, or test suite gating.
- **Missing:** ESLint rule for `adminClient` import boundary (Phase 1.1 carry UF-002, known-concerns.md §11); `withInvariants` wrap pattern is convention-only.

---

## What Must Change for Phase 1.3 Production-Readiness Findings

1. **Deployment target:** Stage/prod environment config (Vercel, Docker, or custom hosting).
2. **Migration reproducibility:** All 32 migrations need IF NOT EXISTS / ON CONFLICT guards (currently 2 of 32). Seed migrations without idempotence gates will fail on redeployment.
3. **Secret management:** Remove `.env.local` from git; move to CI secrets backend (GitHub Actions `secrets.*`, Vercel env dashboard, or similar).
4. **CI gating:** Add push-time typecheck, lint, and integration test suite. Agent floor tests must block merge.
5. **Dependency scanning:** Add renovate or dependabot with auto-merge for patch/minor updates.
6. **Build performance baseline:** Next.js build time and typecheck duration not measured; establish baseline before optimization work.

---

## Immediate Concerns Despite Low Exercise Level

**INFRA-001: Migration reproducibility gap** — 30 of 32 migrations lack IF NOT EXISTS or ON CONFLICT guards. Seed migrations (`20240103_seed_tax_codes.sql`, `20240108_seed_industries.sql`) insert without ON CONFLICT, blocking safe re-runs (idempotence required for Phase 1.3 deploy). Affects all `db:reset` / CI automation.

**INFRA-002: Secret hygiene violation (Phase 1.1 carry 1.5)** — `.env.local` tracked in git with live Supabase service-role key (plaintext, 2026-04-21 commit visible). Pre-Phase-2 deployment blocker. Requires immediate .gitignore addition + key rotation + CI secrets setup.

**INFRA-003: CI gating absent** — No pre-push type/lint/test barriers despite `eslint` in package.json and `pnpm typecheck` availability. The `verify-audit-coverage.yml` workflow is detection-only (daily audit), not prevention. Phase 1.2 hypothesis H-12 (service-layer mutation-surface guard absent) compounds the lack of CI enforcement.

**INFRA-004: Dependency drift silent** — Caret versioning + no automated scanning means semver-breaking patches land without notice. Anthropic SDK between Sept 2025 and Apr 2026 reshaped message types; Phase 1.2 required manual compat-shim (`getSystemPromptText.ts`). No mechanism prevents the next drift.

---

## Session Overhead & Coordination

The `.coordination/session-lock.json` pattern (scripts/session-init.sh, pre-commit enforcement) enforces single-developer discipline locally. Useful for preventing concurrent edits in a shared dev environment, but not a blocker for remote CI or production deployment. Friction-journal notes it as EC-N ergonomic improvement; no security risk, minor UX overhead.

---

## Self-Audit Bias Note

This baseline was constructed by the same Claude instance that participated in Phase 1.2 build sessions (S4, S5-S8, S22 caching review). Local dev ergonomics were designed in-session; the assessment may favor the status quo over alternative approaches.

