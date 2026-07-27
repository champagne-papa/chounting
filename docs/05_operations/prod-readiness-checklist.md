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
  - `CRON_SECRET` — the hourly stranded-case sweep cron route
    (`/api/cron/sweep-stranded-cases`). Vercel injects
    `Authorization: Bearer ${CRON_SECRET}` into cron calls **only when this
    var is set**; the route fails **closed** (401) when it's unset or
    mismatched. **Set in Production 2026-06-14** — it was missing, so every
    fire 401'd and the sweep never ran. Verify it's present, not just that
    the route exists.
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
- Background functions invoked on a schedule.
  - **`sweepStrandedCases`** (stranded-case backstop) — **WIRED; auth
    proven at the 2026-06-14 02:00Z & 03:00Z fires** (200 + clean
    `SweepReport`), on the deployment serving `c0efb9c6` with `CRON_SECRET`
    set. Hourly Vercel Cron (`apps/web/vercel.json`, `0 * * * *`) → authed
    route `/api/cron/sweep-stranded-cases`
    (`Authorization: Bearer ${CRON_SECRET}`, fails closed). It was missing
    `CRON_SECRET` at first wiring, so the cron registered and fired but
    **401'd every run** until the secret was set + redeployed. *This claim
    is anchored to that commit/date — if rolled back, or `CRON_SECRET` is
    rotated-without-redeploy, re-verify (don't trust this line): pull
    `v13/deployments/{id}.crons` for registration + a recent fire's status
    for auth.*
    - **Operational monitoring caveat — READ before investigating "N stuck
      at received":** for an org carrying content-duplicate documents the
      `received` count does **not** drain to 0. The sweep buckets genuine
      content-dupes (Outlook signature images, `.eml` bodies) as **`B3-D`
      (dedup carve-out)** — recognized read-only, **0 spend**, deliberately
      **not** re-run. As of 2026-06-14 this org floors at **9** such dupes.
      The health signal is **new `received` cases accumulating *above* the
      floor**, not the absolute number. Confirm against the `SweepReport`
      `B3-D` bucket before investigating.
  - **Recurring journals**: operator-driven via API routes at v1; the
    auto-scheduler is a deliberate **Phase-2** deferral — *not* a gap.
  - **GC** (`org_settings.gc_cadence` / `gc_threshold_hours`): config
    columns exist but no runner is wired — reserved substrate; orphan
    blobs require **manual** GC until a scheduled runner ships.
- `pg_cron`/`pg_net` remain **not installed** — in-DB scheduling is
  unavailable; scheduling is Vercel-cron-driven.

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

### 9. Service-account identity rows are seeded (the FK-stall trap)
- The pipeline's automated (non-human) writes attribute to a
  **service-account user** — `pipeline@chou.ca`, id
  `00000000-0000-0000-0000-0000000000a1`, exported as the constant
  `SYSTEM_ACTOR_USER_ID` in
  `apps/web/src/services/middleware/serviceContext.ts`. That row must exist
  in **`auth.users`** or the first automated write hits a **foreign-key
  violation** and the case stalls — the 2026-06-13 deep-stall root cause
  (six layers down: a missing prod `auth.users` seed row).
- **This is prod state that lives OUTSIDE git.** It was seeded via the
  GoTrue admin API; `apps/web/scripts/seed-pipeline-service-account.ts` is
  the seeding script and is currently **untracked**. A fresh environment
  (or a DB reset) will **not** have the row and will hit the identical FK
  stall until it's seeded — same class as the cron-config and
  Modal-Volume-populate gaps.
- Verify (don't trust this doc — check the environment):
  `select id from auth.users where id =
  '00000000-0000-0000-0000-0000000000a1';` returns the row → seeded; empty
  → run the seed script against that environment. (Prod: present since
  2026-06-13, `pipeline@chou.ca`.)

### 10. Migrations are applied to prod AND the level is recorded
- Migrations do **not** deploy with the code. A merge to `main` auto-deploys
  the app (`next build`), but **nothing applies Supabase migrations to the
  prod DB** — that is a separate, manual operator step. Skipping it leaves
  **code ahead of schema**: the build is green and the app deploys, but a code
  path referencing a not-yet-created table / enum value fails at runtime — and
  under the Wave-1 bleed-stop, fails *quietly* into the exception/retry path.
  This is the exact drift that left prod five migrations behind `main` for ~6
  weeks (2026-06-14 → 2026-07-24), unnoticed because its level went unrecorded.
- **The procedure** (reusable — promoted here from the one-off
  `docs/09_briefs/post-mvp/staging-to-main-substrate-release-notes.md`, which
  remains the detailed provenance for the original 133→180 release):
  1. **Back up first.** Free tier = **no PITR**, so a full `pg_dump` (schema
     **and** data, e.g. `supabase db dump -f …` + `--data-only`) taken before
     the apply is the *only* restore point. Store it **outside the repo** (e.g.
     `~/chounting-prod-backups/`) so prod data can't be committed. Confirm it
     includes data, not just schema.
  2. **Dry-run.** `supabase db push --dry-run --linked` — confirm the plan is
     *exactly* the intended migrations and nothing more. Anything extra → stop.
  3. **Pre-flight any migration with an external dependency** (read-only): a
     `DROP CONSTRAINT <name>` needs that exact constraint present on prod first;
     a data backfill's predicate needs its referenced columns present. Verify
     against a fresh prod schema dump before applying.
  4. **Apply in strict version order** — `supabase db push --linked` (preferred:
     it applies in order AND writes the `schema_migrations` rows itself). If you
     apply via the dashboard SQL editor instead, you must manually `INSERT INTO
     supabase_migrations.schema_migrations (version, name)` after each, or the
     CLI's view of prod drifts. Stop at the first error — later migrations may
     depend on earlier ones.
  5. **Verify:** `select max(version) from supabase_migrations.schema_migrations;`
     equals the target, and each new object actually exists (re-dump the schema
     and grep for the new tables / enum values / constraints).
  6. **Record the new level in `docs/09_briefs/CURRENT_STATE.md` with the date.**
     ← the step whose absence caused the 6-week drift. A prod schema version
     nobody can state from the docs is what makes an incident hard to diagnose.
- *Why it hides:* migrations are the one prod-state change the deploy pipeline
  never performs and the build never checks — additive ones can sit unapplied
  for weeks with no loud failure.

## Open security deferrals (tracked, not done)

**Update 2026-06-14 — closed-CONDITIONALLY, NOT done.** The POSTMARK + MODAL
HMAC secrets exposed this session are **test / non-production credentials**
against an environment **handling no real sensitive data yet** — so no rotation
is owed *while that holds*. This is **not** "secrets are fine"; it's "there's
nothing real behind them yet." The moment real data or real credentials flow
(go-live), they must be provisioned **fresh and rotated**, and **these specific
exposed values must never become production credentials — they are burned**
(they've lived in session/CI history). **Re-verify before go-live: are the
POSTMARK/MODAL secrets still test-only?** The note below is retained as go-live
checklist context.

Live-traffic-exposed secrets parked by operator decision until testing
wraps — written here so "deferred" stays **deferred-and-tracked**:

- **`POSTMARK_INBOUND_BASIC_AUTH_PASSWORD` rotation** — inbound-mailbox
  Basic Auth password, used during live testing; rotate before go-live
  (env change → redeploy to take effect, §8).
- **`MODAL_OCR_HMAC_SECRET` rotation** — OCR sidecar shared HMAC, likewise
  exposed; rotate on **both** the Vercel side and the Modal side (they must
  match, §4) + redeploy + sidecar re-deploy.
- Owner: Phil. Status 2026-06-14: deferred by decision, exposure noted.

**Dev-seed passwords (2026-06-14, grounded).** `apps/web/scripts/seed-auth-users.ts`
is tracked in this **public** repo and hardcodes 4 dev-account passwords (`DevSeed!…`
for `@thebridge.local` accounts). **No live exposure today:** those accounts are
**absent from the prod-shared DB** (`ollyqiiwdvbpbngqgjqk`, verified 2026-06-14) — the
seed is local-dev only. **Guard for go-live:** never run `seed-auth-users.ts` against
the prod / real DB, and replace the hardcoded passwords with env-driven or random
values before any non-local use — otherwise the public values become working logins.
Re-verify: `select id from auth.users where email like '%@thebridge.local'` is empty on
prod.

## Quick verification commands

| Check | How |
|---|---|
| Build READY + prod commit | Vercel Deployments; `git rev-parse origin/main` |
| Lazy env vars set | Vercel → Settings → Environment Variables (Production) |
| Modal sidecar live | Modal dashboard; `curl` the sidecar health endpoint |
| Crons wired | `cat vercel.json` (crons); `select extname from pg_extension where extname='pg_cron'` |
| Buckets | `select id from storage.buckets` |
| Extensions | `select extname from pg_extension order by 1` |

### Tooling gotcha — `gh pr edit` fails silently on this repo (2026-07-27)

`gh pr edit <n> --body-file …` errors with a **Projects (classic)
deprecation** message from `repository.pullRequest.projectCards` and **does
not apply the edit**. The output reads like a warning on a completed command;
it is a hard failure. A caller who trusts the exit will believe the PR was
updated when it was not.

Use the REST API instead:

```bash
gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -F body=@body.md
```

Then **verify against the live body**, not the command's exit — the whole
point is that the exit is untrustworthy here:

```bash
gh api repos/<owner>/<repo>/pulls/<n> --jq .body > live.md
diff live.md body.md   # expect only GitHub's appended trailing newline
```

`--body-file` / this PATCH touch the body only; the PR title is unaffected.

*Found while reconciling PR #13 (classify-failure arc). The first edit
reported failure-as-noise and silently no-op'd; caught by diffing the live
body afterward.*

---

*Origin: forwarded-mailbox→production arc, 2026-06-11. The systemic fix
for the "merged in code, not wired in the prod project" failure class —
see the friction journal for the three originating instances.*
