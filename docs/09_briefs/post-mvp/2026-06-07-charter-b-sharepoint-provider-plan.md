# Charter B (a) — `sharepointDriveProvider` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `sharepoint_drive` provider behind the existing `StorageProvider` interface, with put-then-re-read SHA-256 integrity and app-only `Sites.Selected` auth, plus the enum-admission and routing dependencies that let a SharePoint-backed `source_document` be written and read end-to-end.

**Architecture:** A new `createSharepointDriveProvider()` mirrors `supabaseStorageProvider` shape (resolve-ref → bytes I/O → `integrity.ts` hash discipline → `withRetry`), swapping Supabase Storage calls for Microsoft Graph driveItem calls. Provider code is written and unit-tested against a **mocked Graph client** first, decoupled from the enum-admission migration; the go-live dependencies (CHECK/Zod admission, resolver activation, `provider_unavailable` routing) land around it. Real-auth and real-M365 integration are gated behind external infra (Azure app registration + certificate + per-site grant), like the Modal-e2e and Postmark activations before it.

**Tech Stack:** TypeScript / Next.js (committed stack); Microsoft Graph via `@microsoft/microsoft-graph-client` + `@azure/identity` (`ClientCertificateCredential`, app-only client-credentials); `vitest` (unit + integration); reuses `integrity.ts`, `retry.ts`, `failureClassification.ts`.

**Ratified design contract:** `docs/09_briefs/post-mvp/specs/2026-06-07-charter-b-sharepoint-drive-provider-design.md` (commit `38b63293`). This plan implements that spec; it does not re-decide it.

---

## Dependency ordering (the two questions, resolved against disk)

**Q1 — does CHECK+Zod admission have to precede the provider methods?** **No.** The provider implements the interface and returns `{ provider: 'sharepoint_drive' }`, which is already a valid `StorageProviderEnum` (the value is in the Postgres enum and `db/types.ts` today — only the *v1-active CHECK* pins inserts to `supabase_storage`). The CHECK is on `source_documents`/`source_document_versions`, written by the **document-platform caller**, not by the provider. And the provider can be unit-tested by instantiating `createSharepointDriveProvider()` directly (the resolver throw is irrelevant to a direct unit test). **So provider code is written and unit-tested first (Tasks 2–4), against a mocked Graph client; the CHECK/Zod admission + resolver activation (Tasks 5–6) are the go-live gating that lets a real `sharepoint_drive` row be written end-to-end.**

**Q2 — where does the `org_settings` slice land relative to provider methods that read site/drive?** The `org_settings` slice is a **separate deferred sub-arc** (spec §5 dep 3), not part of provider (a). The provider reads the per-org SharePoint site/drive reference from `org_settings` at **runtime** — so its *runtime* behavior depends on that column existing, but its *unit tests* mock the read. **Decision (this plan): the provider reads `org_settings` directly by `org_id`** (consistent with `supabaseStorageProvider`, which reads `source_documents` via `adminClient` directly — providers are data-access-layer with DB access). The `org_settings` site/drive column is a **named precondition for go-live** (Task 8, the sub-arc), not a blocker for building+unit-testing the provider. Until it lands, the provider's site/drive read is mocked in tests and would throw a typed `ServiceError` at runtime (no column) — acceptable because nothing routes to `sharepoint_drive` until the resolver is activated (Task 6), which is itself gated on the slice.

**Net build order:** SDK+auth scaffold → provider methods (unit-tested, mocked Graph) → failure-classification Graph extension → CHECK/Zod admission migration → resolver activation → caller `provider_unavailable` routing → [gated] `org_settings` slice + real-auth + real-M365 e2e.

---

## File structure

| Path | Responsibility | Task |
|---|---|---|
| `apps/web/package.json` | add `@microsoft/microsoft-graph-client` + `@azure/identity` | 1 |
| `apps/web/src/services/storage/providers/graph/graphClient.ts` (create) | app-only Graph client factory (`ClientCertificateCredential` → authenticated `Client`); in-memory token cache via the credential | 1 |
| `apps/web/src/services/storage/providers/graph/orgDriveResolver.ts` (create) | read `org_settings` site/drive ref by `org_id`; throw typed error if absent | 2 |
| `apps/web/src/services/storage/providers/sharepointDriveProvider.ts` (create) | the six `StorageProvider` methods for `sharepoint_drive` | 2–4 |
| `apps/web/tests/unit/storage/sharepointDriveProvider.test.ts` (create) | unit tests, mocked Graph client + mocked `orgDriveResolver` | 2–4 |
| `apps/web/src/services/storage/failureClassification.ts` (modify) | extend matrix for Graph error shapes | 4 |
| `supabase/migrations/<ts>_sharepoint_provider_admission.sql` (create) | broaden the two `storage_provider` v1-active CHECKs to admit `sharepoint_drive` | 5 |
| `apps/web/src/services/storage/types.ts` or boundary schema (modify/create) | add the Layer-2 Zod narrowing admitting both providers (absent today) | 5 |
| `apps/web/src/services/storage/resolver.ts` (modify) | split `sharepoint_drive` out of the throw-case into the factory call | 6 |
| document-platform caller (the `put`-then-INSERT path) | route `provider_unavailable` to the exception queue (`resolve_provider_unavailable`) | 7 |

---

## Task 1 — SDK + app-only Graph client scaffold

**Files:** modify `apps/web/package.json`; create `apps/web/src/services/storage/providers/graph/graphClient.ts`.

- [ ] **Step 1: Add dependencies.** Run: `pnpm --filter @chounting/web add @microsoft/microsoft-graph-client @azure/identity`. Expected: both land in `apps/web/package.json` dependencies; lockfile updated.
- [ ] **Step 2: Write `graphClient.ts`** — a factory returning an authenticated Graph `Client` using `ClientCertificateCredential` (tenant id, client id, certificate path/thumbprint from `env`) and `TokenCredentialAuthenticationProvider` scoped to `https://graph.microsoft.com/.default` (app-only). The credential caches tokens internally; no user refresh tokens. Read config from `@/shared/env` (new vars: `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_CERT_PATH` — add to `env.ts` allow-list + `.env.example` as placeholders; **certificate, not secret**, per spec D-B2). Grounded surface: [graph-client SDK](https://learn.microsoft.com/en-us/graph/sdks/sdks-overview), [@azure/identity ClientCertificateCredential](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/clientcertificatecredential). Exact constructor signatures confirmed against the SDK at implementation.
- [ ] **Step 3: Typecheck.** Run: `pnpm --filter @chounting/web typecheck`. Expected: green (the new file compiles; no consumer yet).
- [ ] **Step 4: Commit.** `feat(storage): app-only Graph client scaffold (@azure/identity cert credential)`. Note in the commit body: no provider wiring yet; real auth requires the Azure app registration (Task 8 ops).

---

## Task 2 — Provider scaffold + `put` (the integrity-critical method)

**Files:** create `sharepointDriveProvider.ts`, `graph/orgDriveResolver.ts`, `tests/unit/storage/sharepointDriveProvider.test.ts`.

`put` is the method carrying the §9 integrity discharge — build it first as the exemplar. It mirrors `supabaseStorageProvider.put`: `computeHash(bytes)` pre-write → size-gated upload under `withRetry` → re-read bytes under `withRetry` → `verifyHash(reRead, expected)` → return `{ storage_key: <driveItemId>, content_hash, byte_size, provider: 'sharepoint_drive' }`.

- [ ] **Step 1: Write the failing test (put → re-read SHA-256 equality on the attachment path).** A `vi.mock` of the Graph client whose upload returns a driveItem with a known `id`, and whose content-download returns the same bytes; assert `put` returns `provider: 'sharepoint_drive'`, `storage_key === <driveItemId>`, `content_hash === computeHash(bytes)`. A second test: download returns *corrupted* bytes → `put` throws `INTEGRITY_VERIFY_FAILED` (the §9 guarantee). Mock `orgDriveResolver` to return a fixed site/drive.
- [ ] **Step 2: Run → fails** (`createSharepointDriveProvider` undefined). Run: `pnpm --filter @chounting/web test -- --run sharepointDriveProvider`.
- [ ] **Step 3: Implement `orgDriveResolver.ts`** — `resolveOrgDrive(org_id): Promise<{ siteId, driveId }>` reading `org_settings` (the site/drive ref column) via `adminClient`; throw `ServiceError('STORAGE_OPERATION_FAILED', ...)` if the column/row is absent (go-live-gated on Task 8). Unit tests mock this module.
- [ ] **Step 4: Implement `put`** — size-gate on `bytes.byteLength` (≤ 4 MiB → simple `PUT /drives/{driveId}/items/{parent}:/{name}:/content`; > 4 MiB → `createUploadSession` + chunked upload), each Graph call wrapped in `withRetry`; re-read via `GET /drives/{driveId}/items/{itemId}/content`; `verifyHash`. `storage_key` = the upload-returned `driveItem.id`. Graph ops grounded: [put content](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content), [createUploadSession](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession), [get content](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content). The per-org folder path under `none` durability is write-once (never reorganized); exact folder convention finalized at impl.
- [ ] **Step 5: Run → passes.**
- [ ] **Step 6: Commit.** `feat(storage): sharepointDriveProvider.put — Graph upload + put-then-re-read SHA-256 (§9 discharge)`.

---

## Task 3 — `fetch`, `fetchVersion`, `previewUrl`, `delete`

**Files:** modify `sharepointDriveProvider.ts`, `sharepointDriveProvider.test.ts`.

Each mirrors the supabase provider's read-resolution (`resolveCurrentStorageRef` / `resolveVersionStorageRef` against `source_documents`/`source_document_versions` via `adminClient`, current-version-id → fall back to `original_storage_key`), then a Graph call. `content_hash` on `fetch`/`fetchVersion` is the **row's stored hash, not recomputed** (per types.ts).

- [ ] **Step 1: Tests (mocked Graph + mocked row resolution).** `fetch`/`fetchVersion` return `{ bytes, content_hash: <row hash>, provider }` from `GET .../items/{itemId}/content`. `previewUrl` returns `{ url, expires_at, provider }` from the driveItem's `@microsoft.graph.downloadUrl` (or a created link), TTL-clamped to §12 bounds (300 default / 1800 max — reuse the supabase `clampTtl` shape). `delete` issues `DELETE .../items/{itemId}` for original + version keys.
- [ ] **Step 2: Run → fails.**
- [ ] **Step 3: Implement the four methods** using the resolved `storage_key` (driveItemId) + the Graph ops above ([get content](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content), [delete](https://learn.microsoft.com/en-us/graph/api/driveitem-delete)), each under `withRetry`.
- [ ] **Step 4: Run → passes.**
- [ ] **Step 5: Commit.** `feat(storage): sharepointDriveProvider fetch/fetchVersion/previewUrl/delete`.

---

## Task 4 — `verifyIntegrity` + Graph failure-classification extension

**Files:** modify `sharepointDriveProvider.ts`, `failureClassification.ts`, both test files.

- [ ] **Step 1: `verifyIntegrity` test** — download bytes + `verifyHash(bytes, row.content_hash)`; match → `IntegrityResult`; mismatch → throws `INTEGRITY_VERIFY_FAILED`. Add a code comment that the drift runner (out of scope) needs a non-throwing surface (catch the code or a softer method) — per spec §3.
- [ ] **Step 2: Failure-classification tests** — extend `classifyStorageFailure` for Graph shapes: `429` (+ `Retry-After`), `423 Locked`, `507` → `transient`; Graph `{ error: { code, message } }` envelope mapped via its HTTP `status`. Assert each maps to the right `FailureClassification`.
- [ ] **Step 2a: Decide where the 404 distinction lives (the classifier is context-free).** `classifyStorageFailure(err)` sees only the error object — it **cannot** know whether the `storage_key` was known-good, so it structurally cannot split a deleted-out-of-band 404 (→ `provider_unavailable`) from a malformed/never-existed 404 (→ `permanent_malformed`, where the generic-4xx branch sends it today). Pick one, deliberately, in this task: **(a)** map all Graph `404` → `provider_unavailable` at the classifier (accepts that malformed-key 404s also route to the exception queue); or **(b)** have the provider catch `404` *with* its known-good-key context and throw a pre-classified `ServiceError` — which **also requires extending the classifier's `ServiceError` pass-through**, since it currently recognizes only `INTEGRITY_VERIFY_FAILED` / `STORAGE_KEY_MALFORMED` and returns `null` for any other code (so a provider-thrown `provider_unavailable`-coded error would fall through to the catchall). Lean: (a) for v1 simplicity (the exception-queue handler distinguishes at resolution); record the choice + rationale in the test names.
- [ ] **Step 3: Run → fails.**
- [ ] **Step 4: Implement** `verifyIntegrity` + the classifier extension (additive `status`/`code` patterns; the existing 401/403→`provider_unavailable`, 5xx/408/429→transient cases already cover most — add 423/507 transient and the 404-on-known-item `provider_unavailable` distinction).
- [ ] **Step 5: Run → passes.** Then `pnpm --filter @chounting/web typecheck` + full `sharepointDriveProvider` + `failureClassification` suites green.
- [ ] **Step 6: Commit.** `feat(storage): sharepointDriveProvider.verifyIntegrity + Graph failure classification`.

---

## Task 5 — Enum admission: CHECK broaden + Layer-2 Zod narrowing

**Files:** create `supabase/migrations/<ts>_sharepoint_provider_admission.sql`; modify the storage_provider Zod boundary.

- [ ] **Step 1: Migration** — drop + recreate the two v1-active CHECKs (`source_documents_storage_provider_v1_active` at `20240135:217-218`; `source_document_versions_storage_provider_v1_active` at `:288-289`) to `CHECK (storage_provider IN ('supabase_storage', 'sharepoint_drive'))`. **Resolve at this task (per the versioned-CHECK-naming convention + migrations review cadence):** these are named `_v1_active` (not `_chunk_N_active`), so confirm the rename convention — likely keep the `_active`-set name with an updated definition, or version it; pin dependent tests to the constraint behavior, not a frozen name. Run the substrate-mod test-staleness audit (migrations rule).
- [ ] **Step 2: Apply locally + regen types.** `pnpm db:reset:clean` (or the migration-apply path); `pnpm` types regen if `db/types.ts` shifts (additive; enum already present so likely no diff). Verify the migration applies clean.
- [ ] **Step 3: Add the Layer-2 Zod narrowing.** v1 has no `storage_provider` Zod enum — it relies on hard-coded constants (`PROVIDER` in `supabaseStorageProvider.ts`; `V1_STORAGE_PROVIDER` in `ingestionService.ts`) plus the Layer-1 CHECK; the deferral is recorded in the migration `20240135` anti-scope comment ("v1 storage service code uses hard-coded constants"). *(Not yet first-hand-confirmed that NO Zod schema exists at the document-platform write boundary — `types.ts`/`storageProviderService.ts` carry none, but the write boundary itself is unread; **locate it first** before deciding add-vs-broaden.)* Add (or broaden, if one is found) a `z.enum(['supabase_storage', 'sharepoint_drive'])` admit-set at the `storage_provider` write boundary; if none exists, add it at the document-platform `put`-then-INSERT path. Test: rejects an unknown provider; admits both active values.
- [ ] **Step 4: Run admission + storage suites → green; typecheck green.**
- [ ] **Step 5: Commit.** `feat(storage): admit sharepoint_drive — CHECK broaden (x2) + Layer-2 Zod narrowing`.

---

## Task 6 — Resolver activation

**Files:** modify `apps/web/src/services/storage/resolver.ts`, add resolver test.

- [ ] **Step 1: Test** — `getStorageProvider('sharepoint_drive')` returns a provider (not a throw). `getStorageProvider('supabase_storage')` still returns the supabase provider. The exhaustive-`never` default still rejects unknowns at compile time.
- [ ] **Step 2: Run → fails** (current branch throws for `sharepoint_drive`).
- [ ] **Step 3: Implement** — split `sharepoint_drive` out of the combined throw-case into `case 'sharepoint_drive': return createSharepointDriveProvider();`. Per spec §5 dep 2: the `never` guard prevents *silent omission*, it does not *force* this — this is the deliberate activation edit. Leave `s3_bucket`/`external_url` in the throw-case.
- [ ] **Step 4: Run → passes; typecheck green.**
- [ ] **Step 5: Commit.** `feat(storage): activate sharepoint_drive in the provider resolver`.

---

## Task 7 — Caller-side `provider_unavailable` routing

**Files:** modify the document-platform `put`-then-INSERT caller; add/extend its integration test.

SharePoint is the first provider to actually emit `provider_unavailable` (auth revoked / consent removed / site gone). Today `withRetry` surfaces it as `STORAGE_OPERATION_FAILED` and the spec assigns *routing* to the caller.

- [ ] **Step 0: Verify `resolve_provider_unavailable` is admitted by the resolution-action enum.** The action name appears in the `failureClassification.ts` header comment, but it is a **reserved** resolution-action value (the exception-queue resolution-action enum, owned by ADR-0011 §13), expected to activate when reserved providers do. **Read the exception-queue resolution-action migration:** if a v1-active CHECK (and/or a Zod admit-set) pins the action out, broaden it to admit `resolve_provider_unavailable` — the same reserved-enum-activation discipline Task 5 applies to `storage_provider`. If already admitted (or no v1-active CHECK exists), no migration needed. Flagged as verify-at-task, not asserted as a gap — the parallel is easy to miss precisely because the name is already present in code.
- [ ] **Step 1: Test** — when the storage `put`/`fetch` surfaces a `provider_unavailable`-class failure, the document-platform caller routes the case to the exception queue with `resolve_provider_unavailable` (ADR-0010 discipline; the action is named in `failureClassification.ts`'s header), rather than failing silently. Mock the provider to throw the classified error.
- [ ] **Step 2: Run → fails.**
- [ ] **Step 3: Implement** the routing at the caller (catch the typed error class → `enqueueException` with `resolve_provider_unavailable`). Keep the §7-classifier-disposition (don't-retry) and any §11 `missing_file` status setting as the deliberate two-layer handling the spec §4 layer-note flagged.
- [ ] **Step 4: Run → passes; typecheck + relevant integration suites green.**
- [ ] **Step 5: Commit.** `feat(document-platform): route provider_unavailable storage failures to the exception queue`.

---

## Task 8 — GATED: external infra + `org_settings` slice + real-M365 e2e (NOT in the local build)

These cannot be completed locally and are tracked as gated activation steps, like the Modal-e2e and Postmark activations. **Named, not built here**; each is its own follow-up:

- [ ] **`org_settings` slice (the deferred sub-arc).** Adds the SharePoint **site/drive reference** column (which `orgDriveResolver` reads) + `default_storage_provider` (amendment) + `sharepoint_durability_mode` (`none`) + `storage_retry_*` / `preview_url_*` — all currently text-grain-only (migration `20240158` shipped none of them). This sub-arc is the runtime precondition for Task 2's `orgDriveResolver` and for the amendment's universal-default resolution. May be sequenced as its own arc before live activation.
- [ ] **Azure app registration + certificate.** Register the app (single multi-tenant or per-tenant), grant **only `Sites.Selected`** application permission (additive-permission discipline — no `Files.*`/`Sites.ReadWrite.All` co-grant), provision the client certificate into the secrets store, set `GRAPH_*` env vars per environment.
- [ ] **Per-site grant onboarding-ops.** Script the per-site grant (`New-MgSitePermission`) into onboarding — sibling to the Postmark allowlist activation; do not let least-privilege degrade into manual admin-center clicks.
- [ ] **Real-M365 integration/e2e** (paid/external, opt-in gated like `RUN_MODAL_E2E`): upload → re-read → fetch → previewUrl → delete against a real granted site, asserting the SHA-256 round-trip. Behind an explicit opt-in env flag; not in the default suite.

---

## Self-review

- **Spec coverage:** six methods (Tasks 2–4) ✓; D-B1 integrity/§9 discharge (Task 2) ✓; D-B2 auth `Sites.Selected`/cert (Tasks 1, 8) ✓; D-B3 storage_key=driveItemId + org_settings read (Tasks 2, 8) ✓; D-B4 upload size-gate (Task 2) ✓; §4 `provider_unavailable` (Tasks 4, 7) ✓; §5 five deps (Tasks 5, 6, 7, 8) ✓; out-of-scope (channel b, drift runner, durability rungs, audit) untouched ✓.
- **Ordering:** provider-first / admission-after resolved against disk (Q1/Q2 section); `org_settings` as gated precondition, not blocker.
- **Honest boundaries:** Graph SDK call signatures finalized against the SDK at impl (grounded operations cited, not invented); real-auth + real-M365 gated (Task 8); CHECK-rename convention + Zod-boundary-location resolved at Task 5 (re-verified at that task, not pre-baked).

## Cross-references

Spec `2026-06-07-charter-b-sharepoint-drive-provider-design.md`; ADR-0013 §1/§7/§9/§12/§14 + the 2026-06-07 + 2026-05-15 amendments; `apps/web/src/services/storage/*` (interface, supabase reference, integrity, retry, failureClassification, resolver, types); Graph docs cited inline.
