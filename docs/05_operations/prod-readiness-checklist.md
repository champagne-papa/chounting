# Production Readiness Checklist

When promoting code to a deployed environment (production, or a new
environment stood up from scratch), walk this list. It catches the
class of failure that **passes the build green and only fails at
runtime** — because the code cannot enforce it.

## The core insight (read this first)

Most deploy failures are loud: a type error, a failing test, a broken
import. The build catches them. The failures *this* checklist exists
for are the silent ones — **things that are correct in the code but
must be separately wired into the prod project**, which the compiler,
the test suite, and `next build` cannot see:

- a **lazy / non-boot env var** — read at runtime, not at boot, so
  `assertEnv` never fires and the build is green; it throws only when
  the code path that reads it executes;
- an **unscheduled function** — present in the repo, fully tested, but
  nothing on the deployed project ever invokes it (no cron, no worker);
- an **undeployed external service** — the client code is correct and
  the env var may even be set, but the service it points at was never
  stood up (or the shared secret doesn't match);
- an **unprovisioned resource** — a storage bucket, a DB extension, a
  scheduler — the code assumes exists.

All of these are **green in code, unwired in the prod project.** The
diagnostic question for each item below is: *"the code is correct — but
is the thing it depends on actually wired up in this environment?"*

## Provenance

Codified 2026-06-11 from the forwarded-mailbox→production arc, which hit
this exact class **three times in one session**, each costing a
debugging cycle:

1. **Frozen build** — `main` had ERROR'd on every deploy for ~40 days
   (build-gate lint failures); prod silently served a 40-day-old commit.
2. **Unscheduled sweep** — `sweepStrandedCases` (the stranded-case
   backstop) exists in code but no cron/route invokes it on prod.
3. **Unconfigured Modal OCR sidecar** — `MODAL_OCR_SIDECAR_URL` /
   `MODAL_OCR_HMAC_SECRET` are lazy reads; unset on prod → the OCR stage
   threw `PIPELINE_UNAVAILABLE` at runtime, stranding every ingested
   document at `received` while the build stayed green.

The checklist converts "three outages discovered serially" into "one
stand-up pass."

## The checklist

### 1. The deploy actually succeeded — and prod advanced to it
- The latest production deployment is **READY** (not ERROR), and the
  production alias resolves to the **intended commit** (not a stale one).
- Verify: Vercel → Deployments (state + commit); confirm the apex
  domain's deployment SHA matches `origin/main` HEAD.
- *Why it hides:* a branch can ERROR on every push and prod keeps
  serving the last good deployment — indefinitely, silently.

### 2. Boot-required env vars are set (fail loud — usually fine)
- These are asserted at module load by `apps/web/src/shared/env.ts`
  (`assertEnv`): missing → the build/boot fails loudly. So if the app
  is up, they're set. Listed in `REQUIRED_SERVER` / `REQUIRED_PUBLIC`.
- Verify: app boots = these are present.

### 3. Lazy / non-boot env vars are set (the trap — verify explicitly)
- Read at runtime, **not** asserted at boot. The build is green even if
  they're missing; they throw only when their code path runs.
- Known lazy reads (audit with
  `grep -rn "process.env" apps/web/src` minus the `env.ts` REQUIRED set):
  - `MODAL_OCR_SIDECAR_URL`, `MODAL_OCR_HMAC_SECRET` — **OCR (Stage 2 of
    every ingest)**; missing → `PIPELINE_UNAVAILABLE`.
  - `GRAPH_TENANT_ID` / `GRAPH_CLIENT_ID` / `GRAPH_CLIENT_CERT_PEM` —
    SharePoint storage provider (only when an org uses `sharepoint_drive`).
  - `RING2B_SHADOW_EVAL` — safe default-off flag (no action needed).
- Verify: Vercel → Settings → Environment Variables (Production scope).

### 4. External services are deployed AND reachable AND secret-matched
- A set env var is **necessary but not sufficient** — the service it
  points at must actually be deployed, and any shared secret must match
  on both sides.
  - **Modal OCR sidecar** (`sidecar-ocr/`): deployed to Modal? URL set?
    `MODAL_OCR_HMAC_SECRET` identical on Vercel and the Modal side?
    (A mismatch surfaces as a 401 → same `PIPELINE_UNAVAILABLE` class.)
  - **Microsoft Graph** (SharePoint provider): app registration +
    `Sites.Selected` consent, only if an org is on `sharepoint_drive`.
- *Cold-start note:* Modal functions cold-start; the first call after
  idle may time out (`PIPELINE_TRANSIENT_EXHAUSTED`, ~60s) then succeed
  on retry — that's not a config error.

### 5. Schedulers / crons are wired
- Background functions that expect to be invoked on a schedule. **There
  is no `vercel.json`/`crons` and no `/api/cron/*` route today**, and
  `pg_cron`/`pg_net` are not installed — so nothing scheduled runs.
  - **`sweepStrandedCases`** (stranded-case backstop): needs an authed
    cron route (`CRON_SECRET`) + `vercel.json` cron. Build it **after**
    OCR works (else B3 re-runs loop on `PIPELINE_UNAVAILABLE`, paid).
  - **Recurring journals**: operator-driven via API routes at v1; the
    auto-scheduler is a deliberate **Phase-2** deferral — *not* a gap.
  - **GC** (`org_settings.gc_cadence` / `gc_threshold_hours`): config
    columns exist but no runner is wired — reserved substrate; orphan
    blobs require **manual** GC until a scheduled runner ships.

### 6. Storage buckets are provisioned
- The code writes to the **`documents`** bucket (the only one in use).
- Verify: Supabase → Storage; `select id from storage.buckets`.

### 7. DB extensions the code assumes are installed
- Installed: `pgcrypto`, `uuid-ossp`, `plpgsql`, `pg_stat_statements`,
  `supabase_vault`. **Not** installed: `pg_cron`, `pg_net` — so in-DB
  scheduling is unavailable (scheduling must be Vercel-cron-driven).
- Verify: `select extname from pg_extension`.

### 8. Env changes require a redeploy to take effect
- Setting/rotating an env var in Vercel does **not** reach the running
  deployment until a redeploy. Always: set value → redeploy → verify.
- *Seen this session:* the POSTMARK secret rotation did not take effect
  until redeploy; an env-only change is silently inert otherwise.

## Quick verification commands

| Check | How |
|---|---|
| Build READY + prod commit | Vercel Deployments; `git rev-parse origin/main` |
| Lazy env vars set | Vercel → Settings → Environment Variables (Production) |
| Modal sidecar live | Modal dashboard; `curl` the sidecar health endpoint |
| Crons wired | `cat vercel.json` (crons); `select extname from pg_extension where extname='pg_cron'` |
| Buckets | `select id from storage.buckets` |
| Extensions | `select extname from pg_extension order by 1` |

---

*Origin: forwarded-mailbox→production arc, 2026-06-11. The systemic fix
for the "merged in code, not wired in the prod project" failure class —
see the friction journal for the three originating instances.*
