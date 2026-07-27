# Runbook — SharePoint (`sharepoint_drive`) per-org onboarding + live activation

**Status:** Gated-tail operations for the Charter B real-flow arc (D-6). These
steps are **externally gated** — they require a real Azure tenant + Microsoft
365 SharePoint and are NOT performed at arc close. The arc ships
**UNIT-PROVEN**: selection + routing + classification are wired and
unit/integration-proven against mocked Graph; the **first live Graph transfer
is gated on completing this runbook**. "Wired" is not "proven live."

**Audience:** operator/admin onboarding an M365-equipped org onto SharePoint
storage post-v1.

---

## What is already built (no action needed)

- The `sharepointDriveProvider` (6 `StorageProvider` methods, put-then-re-read
  SHA-256 integrity) — Charter B (a).
- Provider reachability: ingest resolves the org default via
  `resolveStorageProvider`; `byteFetch` dispatches on the row's provider; the
  Layer-2 Zod admit-set and the `org_settings` storage columns are live —
  Charter B real-flow (this arc).
- `graphClient` reads `GRAPH_TENANT_ID` / `GRAPH_CLIENT_ID` /
  `GRAPH_CLIENT_CERT_PEM` from `@/shared/env` (optional at boot; the provider
  throws `"sharepoint_drive provider is not configured: missing …"` until
  they are set).

## Gated steps (perform per real activation)

### 1. Azure app registration — `Sites.Selected` ONLY

Register an application in the org's (or CHOUnting's multi-tenant) Azure AD:

- Grant the **application** permission `Sites.Selected` (Microsoft Graph) and
  admin-consent it. **Do NOT grant `Files.ReadWrite.All`, `Sites.ReadWrite.All`,
  or any tenant-wide `Files.*`/`Sites.*` scope** — additive-permission
  discipline (ADR-0013 D-B2). `Sites.Selected` holds no access until a
  per-site grant is made (step 3), so the blast radius is exactly the granted
  sites. A broader scope is least-privilege theater and a standing
  tenant-wide-write credential to customer accounting documents that cannot be
  un-exposed after the fact.
- App-only (client-credentials) flow — no signed-in user, no user refresh
  tokens. The pipeline writes as a system actor.

### 2. Client certificate

- Generate a client certificate; upload the public key to the app registration.
- Set the env vars (Vercel's filesystem is read-only, so the cert is passed
  **in-memory** — there is no disk path):
  - `GRAPH_TENANT_ID` — the Azure AD tenant id.
  - `GRAPH_CLIENT_ID` — the registered app's client id.
  - `GRAPH_CLIENT_CERT_PEM` — the **base64-encoded** PEM contents (public +
    private key), passed in-memory to `ClientCertificateCredential`'s
    `{ certificate }` overload. It is a PRIVATE KEY: set it **Sensitive** in
    Vercel, never log it. Generate with `base64 -w0 graph-client-cert.pem`.

### 3. Per-site grant

For each customer SharePoint site the org will file into, grant the app access
to that specific site (`Sites.Selected` is inert without this):

- SharePoint admin center, or `New-MgSitePermission` (Microsoft Graph
  PowerShell), granting `write` to the app for the site.

### 4. Operator-onboarding — point the org at SharePoint (decision #1)

Selection policy is **operator onboarding** (decision #1): an admin sets the
org's storage columns. There is no auto-detection in v1. Set, for the org's
`org_settings` row:

- `default_storage_provider = 'sharepoint_drive'` (the ingest selection
  `resolveStorageProvider` reads; v1-active CHECK admits it).
- `sharepoint_site_id` and `sharepoint_drive_id` (the site/drive
  `orgDriveResolver` reads — it returns "not provisioned" until both are set).

**Obtaining the IDs** (no auto-provisioning write-path in v1 — looked up once,
by hand, per site, with the app credential from steps 1-3; confirm the exact
endpoint shapes in Graph Explorer for your tenant):

- **Site ID** — `GET https://graph.microsoft.com/v1.0/sites/{hostname}:/{server-relative-path}`
  (e.g. `…/sites/contoso.sharepoint.com:/sites/Accounting`) → the `id` field
  (form `{hostname},{siteCollectionGuid},{webGuid}`).
- **Drive ID** — `GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives` →
  the target document library's `id`. This is the **document-library container**
  `orgDriveResolver` returns as `driveId` and the provider addresses for every op
  (`io.uploadSmall({ driveId, … })`, `downloadBytes(driveId, …)`). It is **not**
  the per-file `storage_key` — that's the **driveItem id**, recorded on each
  `source_documents` row by the provider at put-time.
- Then the data write. **Which database this row lands in is a safety
  decision, not a detail — read the Step-5 pre-run gate before running it.**

  - **For the Step-5 live e2e (the PROVEN-LIVE discharge): write it to the
    LOCAL test database, NOT prod** — with the REAL tenant site/drive ids
    from the lookups above. Local DB row + real SharePoint drive is what
    makes the run both safe and meaningful: the Graph transfer is genuinely
    live, the accounting rows stay out of production.
  - **Do NOT configure the prod org merely to satisfy Step 5.** It does not
    point the harness at prod — it *removes the only fail-fast guard*. The
    harness's step-1 config-sanity assert (`default_storage_provider ===
    'sharepoint_drive'`) is what stops a mis-pointed run early, and it fails
    safe only while prod is unconfigured. Configure prod and a run that has
    drifted onto prod pointers sails through the guard and writes real
    `ingest_batches` / `source_documents` rows plus real files in the
    customer's SharePoint library.
  - **A genuine production activation** (a real customer org going live on
    SharePoint) runs the same UPDATE against prod — a separate, later,
    deliberate act, after Step 5 is green.

  ```sql
  UPDATE org_settings
     SET default_storage_provider = 'sharepoint_drive',
         sharepoint_site_id = '<site id>',
         sharepoint_drive_id = '<drive id>'
   WHERE org_id = '<org>';
  ```

**Done is not "the resolver stops throwing"** (necessary, not sufficient). The
org is provisioned-and-proven only when **Step 5's live e2e is green**: bytes
actually land in the library AND the put-then-re-read SHA-256 round-trips
(`uploadSmall` → `downloadBytes` → content_hash match — the §9 integrity
discharge). "Resolver resolved the drive" ≠ "bytes written + integrity-verified."

Until this step, the org keeps the `supabase_storage` fallback default; this
set is the named gated-ops step (sibling to the Postmark allowlist).

### 5. Run the live e2e (the honesty gate's discharge)

With the GRAPH_* env set (steps 1-2) and a per-site grant (step 3) + an org
pointed at SharePoint **in the local test DB** (step 4).

**Pre-run gate — four checks, in order. Two are safety, not hygiene: a naive
run proves nothing (silent skip), and a mis-pointed run writes to production.**

**1. Both DB pointers must resolve LOCAL.** The run uses *two independent*
resolutions and neither asserts it is local:

- The **code under test** (`documentPlatformService.createSourceDocument`,
  `resolveStorageProvider`, `orgDriveResolver`) goes through
  `@/db/adminClient` → `env.SUPABASE_URL` → **`NEXT_PUBLIC_SUPABASE_URL`**
  (`apps/web/src/shared/env.ts:62`). This is where the real `ingest_batches` /
  `source_documents` writes land **and** where the provider-selection read
  happens — so it, not `SUPABASE_TEST_URL`, governs whether bytes and rows
  hit production.
- The **harness's own reads/fixtures** (`tests/setup/testDb.ts:3-7`) resolve
  `SUPABASE_TEST_URL ?? SUPABASE_URL ?? throw` — the step-1 config-sanity
  assert, `createIngestBatchForTest`, and the `audit_log` cleanup.

If those two diverge, the guard asserts against one database while the code
under test writes to another. Exported shell vars **win over `.env.local`**
(`tests/setup/loadEnv.ts:15` sets a key only when it is not already in
`process.env`), so a shell that has sourced prod values silently overrides the
local defaults. Confirm in the shell you will actually run from:

```bash
cd apps/web && env | grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_TEST_URL|SUPABASE_URL)='
```

Every value printed must be the local Supabase (`http://127.0.0.1:54321`). A
bare `SUPABASE_URL` should not be set at all — the app never reads it; it
exists only as `testDb.ts`'s silent fallback.

**2. Local Supabase is up** (`pnpm db:start`). `tests/setup/globalSetup.ts:57`
loads `test_helpers.sql` over a *hardcoded* `postgresql://postgres:postgres@
127.0.0.1:54322/postgres` connection that is INDEPENDENT of both pointers
above — it succeeding proves nothing about where the harness writes. Note the
test-only RPC `create_ingest_batch_for_test` ships in migration `20240153`, so
it exists in prod too: there is no accidental protection there.

**3. All three `GRAPH_*` must reach the process, not just the run flag.** The
gate is a four-way AND (`sharepointDriveRealFlow.e2e.test.ts:35-40`):
`GRAPH_TENANT_ID && GRAPH_CLIENT_ID && GRAPH_CLIENT_CERT_PEM &&
RUN_SHAREPOINT_E2E`. They are **not** in `.env.local`. Miss any one and the
whole `describe` silently skips. Prefer adding the three `GRAPH_*` to
`apps/web/.env.local` (gitignored via `.gitignore:37 .env*`) over passing them
inline — `GRAPH_CLIENT_CERT_PEM` is a private key and an inline assignment
lands in shell history. `RUN_SHAREPOINT_E2E` stays out of `.env.local`, so the
suite still skips by default.

**4. The org row is provisioned in the LOCAL DB** (step 4) for the org id
passed as `SHAREPOINT_E2E_ORG_ID`, carrying the real tenant site/drive ids.

```bash
cd apps/web && RUN_SHAREPOINT_E2E=1 SHAREPOINT_E2E_ORG_ID=<org> pnpm test:integration \
  tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts
```

**Then read the result line: it must say `2 passed`, not `2 skipped`.** The two
cases are the ≤4 MiB round-trip (`uploadSmall`) and the >4 MiB case
(`uploadLarge` — the drive-addressing fix, which the small case never
exercises). A skip on either is a false-green, not a discharge.

This is the gated harness (skips by default with `RUN_SHAREPOINT_E2E` unset).
A green run is the first **PROVEN-LIVE** evidence: a real `sharepoint_drive`
document ingested (bytes land in SharePoint, row stamped `sharepoint_drive`)
and fetched back through the provider (dispatch-on-row), with the content_hash
round-tripping (the §9 integrity discharge). Until then the arc's status is
**reachable in principle, live transfer gated**.

### Go-live correctness flags (grounding pass, 2026-06-14)

- **`uploadLarge` drive-addressing — FIXED (`graphIo.ts`).** The >4 MiB upload
  path passed no `uploadSessionURL` to `OneDriveLargeFileUploadTask.create`, so
  the SDK fell through to its `/me/drive` default (`constructCreateSessionUrl`)
  — invalid under app-only `Sites.Selected` (no `/me`). It now sets
  `uploadSessionURL = itemUploadSessionPath(driveId, …)`, sharing `itemStemPath`
  with `uploadSmall` so both address `/drives/{driveId}/root:/…` (small/large
  parity). **The small-doc e2e only exercises `uploadSmall`** — a **>4 MiB**
  case was added to `sharepointDriveRealFlow.e2e`, so the large path is **proven
  only at that >4 MiB live run**. Re-verify: `rg -n "uploadSessionURL|itemStemPath"
  apps/web/src/services/storage/providers/graph/graphIo.ts`.
- **Filename URL-encode gap — CONFIRMED, then FIXED (`graphIo.ts`).**
  `sanitizeFilename` leaves `#`/`%`/`(`/`)` intact, and the Graph client does
  **no** path encoding (verified first-hand: `GraphRequest.parsePath` stores the
  path raw — never splits on `#`; `buildFullUrl`/`urlJoin` only trim slashes; the
  raw URL goes to `fetch`, where `#` truncates at the fragment delimiter,
  dropping the rest of the filename + the `:/<verb>`). So a routine
  `Invoice #5.pdf` broke the upload on **both** paths. Fix (one place):
  `itemStemPath` now percent-encodes the user-controlled segments per-segment
  (`split('/').map(encodeURIComponent).join('/')`), keeping
  `/drives/{driveId}/root:/` and the `:/<verb>` delimiters literal (mirrors the
  SDK's own `constructCreateSessionUrl`; shared stem ⇒ small/large parity).
  Re-verify: `rg -n "encodeURIComponent"
  apps/web/src/services/storage/providers/graph/graphIo.ts`.
