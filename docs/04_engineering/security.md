# Security and Secrets Management

Environment variables, secrets handling, hosting region constraints,
and logging hygiene rules.

Source: extracted from PLAN.md §9a.0-§9e during Phase 1.1 closeout
restructure.

---

## Hosting Region (hard constraint)

**Vercel and Supabase must both deploy to a Canadian region.**

- Supabase: `ca-central-1` (Toronto) — the only Canadian Supabase
  region.
- Vercel: `yul1` (Montreal) or equivalent Canadian region for
  serverless function execution — set via `vercel.json` `regions`
  field and confirmed in the Vercel dashboard per-environment.

**Why this is a hard constraint:** If Vercel executes serverless
functions in `iad1` (US East, default) while Supabase is in
`ca-central-1`, every API route round-trip pays ~30 ms for the
transit to Toronto and back. For the P&L query, the manual entry
form, and the agent confirmation path, this manifests as a vague
"the system is slow" perception — the actual cause being geographic,
not architectural.

**Canadian data residency** is also a legitimate reason for a family
office handling financial data: HST/GST records, intercompany
relationships, and controller-signed audit entries are all regulated
data categories that benefit from not crossing a border.

**How to verify during setup:**
1. Supabase project creation: select `ca-central-1` in the region
   dropdown. If the project was already created in a different
   region, delete and recreate before writing any data.
2. `vercel.json` at the repo root contains:
   ```json
   { "regions": ["yul1"] }
   ```
3. Vercel dashboard → Project → Settings → Functions → verify `yul1`
   is listed. Preview and production deployments both pinned.

This is a Phase 1.1 exit criterion (see
`docs/03_architecture/phase_plan.md` criterion #15).

---

## Environment Variable Table

| Variable | Consumed By | Client-Safe? | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (sign-in) | Yes | Public key, browser-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/db/adminClient.ts`, `src/services/`, API routes | **NO** | Server-only. Boot-time assertion required. |
| `ANTHROPIC_API_KEY` | `src/agent/orchestrator/` | **NO** | Server-only. Boot-time assertion required. |
| `LOCAL_DATABASE_URL` | Local dev only | NO | For seed scripts |
| `NEXT_PUBLIC_APP_URL` | Client | Yes | Used for OAuth redirects |
| `NODE_ENV` | All | Yes | |
| `FLINKS_CLIENT_ID` | Phase 2 | NO | |
| `FLINKS_SECRET` | Phase 2 | NO | |

**Boot-time assertion (Phase 1.1):**

```typescript
// src/shared/env.ts
const required = ['SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY'] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`FATAL: missing required env var ${key}. Refusing to start.`);
  }
}
```

Imported once at the top of `next.config.ts` (or equivalent server
entry point) so the app refuses to start without critical secrets.

---

## .env File Strategy

- `.env.example` committed to repo with placeholder values and
  comments.
- Real `.env.local` files gitignored.
- `NEXT_PUBLIC_` prefix required for any variable used in Next.js
  client components. Everything else is server-only.
- **Rule:** `SUPABASE_SERVICE_ROLE_KEY` must never appear in any file
  that is bundled into the Next.js client. Only API routes, server
  components, and `src/services/` may import it.

---

## Production Secrets

- Vercel environment variables for all server-only secrets in
  Phase 1.
- After the Phase 2 monorepo split and the introduction of a worker
  host (Railway, Fly.io, or Render), use that host's secret manager
  for worker-only secrets.
- Recommend a dedicated secrets manager (Doppler or AWS Secrets
  Manager) if the team grows beyond 3 people.

### Vercel-dashboard env-var creation: `NEXT_PUBLIC_*` with Sensitive=off

When creating a `NEXT_PUBLIC_*` env var in the Vercel dashboard,
**turn the Sensitive toggle off** (the dashboard defaults it on
for new variables).

`NEXT_PUBLIC_*` variables are by definition non-secret — they
ship to the browser bundle at build time. Sensitive=on for them
is a category error: Vercel's encryption path for sensitive
values is incompatible with how `NEXT_PUBLIC_*` lookup happens
at build time. Concrete failure mode observed 2026-05-01: with
Sensitive=on, `NEXT_PUBLIC_APP_URL`'s value silently dropped to
empty across Save → re-open round-trips in the dashboard UI
(typed value, focus-blur, click Save, "Updated just now"
timestamp updated, but reopening the entry showed placeholder
text again with the value unset). Resolution was to delete the
entry and recreate with Sensitive=off.

If a `NEXT_PUBLIC_*` variable's value appears to be missing at
build time despite the dashboard showing it as set, check the
Sensitive toggle first. Source: friction-journal 2026-05-01
production-promotion entry, Finding F3.

---

## Key Rotation

- **Service-role key:** Supabase dashboard → regenerate → update
  Vercel env → redeploy. Zero-downtime if the old key remains valid
  during rollout.
- **Anthropic API key:** same pattern.
- **JWT signing:** managed entirely by Supabase.

---

## Logging Hygiene — `pino` Redaction

Configure `pino` with the following redact paths at boot:

```typescript
// src/shared/logger/pino.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'headers.authorization',
      'headers.cookie',
      '*.password',
      '*.api_key',
      '*.apiKey',
      '*.secret',
      'env.SUPABASE_SERVICE_ROLE_KEY',
      'env.ANTHROPIC_API_KEY',
      '*.bank_account_number',
      '*.tax_id',
      '*.sin',
      '*.card_number',
    ],
    censor: '[REDACTED]',
  },
});
```

Beyond redaction:
- Never log full JWT tokens.
- Never log raw bank account numbers, SINs, tax IDs, or card
  numbers.
- `audit_log` and `ai_actions` store entity IDs and references —
  never raw sensitive values.
- Every log line must include `trace_id`, `org_id`, `user_id` where
  available.
