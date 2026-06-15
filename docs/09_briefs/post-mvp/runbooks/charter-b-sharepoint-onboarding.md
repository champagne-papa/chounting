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
- Then the data write (operator, prod DB):

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
pointed at SharePoint (step 4):

```bash
cd apps/web && RUN_SHAREPOINT_E2E=1 SHAREPOINT_E2E_ORG_ID=<org> pnpm test:integration \
  tests/integration/e2e/sharepointDriveRealFlow.e2e.test.ts
```

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
- **Filename URL-encode gap — SEPARATE, suspected.** **Confirmed:**
  `sanitizeFilename` leaves `#`/`%`/`(`/`)` intact and the path helpers
  interpolate the filename **raw**; the SDK's own default path
  `encodeURIComponent`s each segment. **Inference (NOT yet read):** that the SDK
  bothers to encode is strong evidence `client.api(path)` does not auto-encode —
  so `Invoice #5.pdf` would reach Graph with a raw `#` (both upload paths) and
  break. **Open verification:** read the SDK `RequestBuilder` to confirm
  `client.api` doesn't encode; if confirmed, encode-or-strip once in
  `itemStemPath` (one place ⇒ keeps small/large parity). Its own item — NOT
  folded into the drive-addressing fix.
