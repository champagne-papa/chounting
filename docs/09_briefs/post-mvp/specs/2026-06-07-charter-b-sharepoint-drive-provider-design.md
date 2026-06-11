# Charter B (a) — `sharepointDriveProvider` design spec

**Status:** Design draft for CTO ratification. Not yet ratified; committed as an uncommitted-then-ratified design artifact under the post-MVP specs convention (Ring 2A/2B precedent).
**Anchored at:** `origin/staging = 7c7546f4` (all code/contract reads first-hand this session).
**Gated by:** the ADR-0013 **2026-06-07 Amendment** (universal-default SharePoint, Option A) — this spec is the provider half of Charter B, unblocked by that ratified amendment.
**Scope:** AP-ingest deepening, **Charter B provider (a)** — the `sharepointDriveProvider` implementation of the `StorageProvider` interface (ADR-0013 §1) for the `sharepoint_drive` enum value.

**Status legend:** `[disk]` grounded first-hand from code/migration; `[graph]` grounded from Microsoft Graph docs (cited); `[ADR]` specified in a ratified ADR/amendment; `[design]` a decision proposed here.

---

## 1. Scope and non-scope

**In scope (provider (a)):** the six `StorageProvider` methods (`put`, `fetch`, `fetchVersion`, `previewUrl`, `delete`, `verifyIntegrity`) for `sharepoint_drive`; the app-only auth/token model; the §9 integrity discharge; the `storage_key` model; the failure-classification extension for Graph error shapes.

**Out of scope (named, separately tracked):**
- **The folder-watcher ingest channel (b)** — its own channel-specification brief; (b) composes (a). `[ADR amendment]`
- **The scheduled drift runner** — SharePoint is *not* drift-exempt (§5), unlike `supabase_storage`; the periodic `verifyIntegrity` caller rides the GH-Actions cron the amendment named. Provider (a) delivers `verifyIntegrity`; the runner is its own piece. `[ADR amendment]`
- **Durability rungs beyond `none`** — `metadata_only` / `folder_organization` stay reserved (2026-05-15 amendment); `none` is the v1-active rung (write bytes once, never reorganize). `[ADR]`
- **Audit emission** — storage methods do not emit `audit_log`; the document-platform caller emits `source_document_created` / `_version_captured` / `storage_status_changed` via the canonical writer (§16). `[disk]`
- **The `org_settings` migration** — a named-not-done dependency (§6), not authored here.

---

## 2. Decisions

### D-B1 — Integrity: put-then-re-read (reuse `integrity.ts`). Grounded near-forced.

`content_hash` is **SHA-256 lowercase-hex system-wide** — `integrity.ts computeHash`/`verifyHash`, dedup-by-hash (§10), drift, and `source_document_versions.content_hash` all key on it. `[disk]` Microsoft Graph's `driveItem.file.hashes` facet documents **`sha256Hash` as "This property isn't supported. Don't use."**; `quickXorHash` (base64, proprietary) is the only guaranteed value. `[graph]` So §9's "rely on the native guarantee, skip re-read" is foreclosed: it would force either a local QuickXorHash implementation **plus a new dual-hash token** (schema change, divergence from the system SHA-256) or a re-read.

**Decision:** `put` mirrors `supabaseStorageProvider` exactly — `computeHash(bytes)` pre-write → upload → Graph `GET /content` re-read → `verifyHash(reRead, expectedHash)` → return `{ storage_key, content_hash, byte_size, provider: 'sharepoint_drive' }`. Reuses `integrity.ts` **unchanged**. `[design]`

**§9 discharge (the activation-brief documentation §9 requires).** *Which native guarantee is trusted, and the test that proves it:* the native guarantee (Graph `quickXorHash`) is **not** trusted in lieu of re-read, because Graph does not expose the system's hash algorithm — `sha256Hash` is documented unsupported and `quickXorHash` is a different, proprietary digest that cannot be compared against the SHA-256 `content_hash` the rest of the system stores and dedups on. The integrity test is the **put-then-re-read SHA-256 equality** (`integrity.ts verifyHash`) that the v1 contract mandates for every active provider. This is also the conservative choice — re-read holds whether or not the native hash is trustworthy.

### D-B2 — Auth: app-only client-credentials, `Sites.Selected` only.

**App-only (application permissions, client-credentials flow), not delegated** — the pipeline writes as a system actor with no signed-in user. `[graph]`

**Permission scope: `Sites.Selected` (least-privilege).** The app is granted access only to each org's explicitly-designated SharePoint site (admin grant via the SharePoint admin center / `New-MgSitePermission`); blast radius = exactly the granted sites. `[graph]` Rejected: `Files.ReadWrite.All` / `Sites.ReadWrite.All` (tenant-wide write). **Decision rationale — cost-of-being-wrong asymmetry:** if `Sites.Selected` onboarding friction proves worse than expected, the cost is operational drag that is *buyable* — broaden to `Sites.ReadWrite.All` with one consent change, or automate the per-site grant (scriptable) — and nothing was over-exposed in the meantime. If the broad scope proves unnecessary (the likely case — SharePoint-mode orgs file their own invoices into their own sites, so per-site is the natural shape of the workload), the cost is a standing tenant-wide-write credential to customer accounting documents that *cannot be un-exposed* after it has been live; tightening later does not retroactively shrink the window a leaked credential could have written across every site collection. Bounded-and-buyable beats unbounded-and-unbuyable — the same reversibility asymmetry that decided Option A over B in the amendment, applied to a credential with real teeth, and aligned with §13's "CHOUnting holds meaning, SharePoint holds bytes" (a tenant-wide-write credential sits badly next to that invariant). The one world where broad wins: per-site onboarding friction is a near-term closing-blocker — in which case that must be the **explicit named reason** in this spec, not a default drift.

**Additive-permission discipline (correctness invariant, not a recommendation).** Microsoft's permission model is **additive**: a broader co-granted scope (`Files.Read.All`, `Sites.ReadWrite.All`, etc.) silently widens the effective access and **defeats** `Sites.Selected`'s least-privilege guarantee. Therefore: the `sharepointDriveProvider` app registration **holds only `Sites.Selected`** — no `Files.*` / `Sites.ReadWrite.All` co-grant. If a broader scope is ever added to the registration, the least-privilege choice is theater. `[graph]`

**Per-site grant = a named onboarding-ops item (day one).** Admin consent on the permission alone grants no site access; each org's site must be explicitly granted to the app. This is a real onboarding step — **sibling to the Postmark allowlist activation** the mailbox arc banked. The grant is **scriptable** (`New-MgSitePermission`) and must be scripted into onboarding, so "least-privilege" does not quietly become "manual SharePoint-admin-center clicks per org" that pressures a later drift to broad scope for the wrong reason. `[graph]`

**Token model.** Client **certificate** (preferred over client secret for production) in the secrets store; access tokens acquired via client-credentials and cached in-memory with re-acquisition on expiry. No user refresh tokens (app-only). The certificate/secret location and rotation discipline is an ops item (§6).

### D-B3 — `storage_key` = Graph drive-item-ID; site/drive from `org_settings`.

The stable per-document reference is the Graph **drive-item-ID** returned at upload. `[design]` Persisted by the document-platform caller as `source_documents.original_storage_key` (and version rows' `storage_key`), exactly where the supabase provider puts its path-key — the `storage_key` column is provider-opaque. The per-org **SharePoint site/drive reference** is read from the **`org_settings` slice** (§6 dependency).

**Caveat-deferral note (important):** the 2026-05-15 amendment's "drive-item-ID **stability across moves** — verify at activation" caveat is scoped to `folder_organization` *moves*. Under `none` durability, files **never move**, so provider (a) does **not** inherit that caveat — it is deferred *with* the durability rung, not at provider (a). The drive-item-ID is stable for a file that is never relocated. `[ADR][design]`

### D-B4 — Upload: size-gated simple-or-session.

Graph simple `PUT /content` supports files **≤ 4 MiB**; files **> 4 MiB** require `createUploadSession` (chunked, resumable). `[graph]` `put` size-gates on `bytes.byteLength`: simple PUT for the common small-invoice case, upload session above the threshold. Both wrapped in `withRetry` (§8). Most AP invoices are < 4 MiB, but the gate makes the provider correct for both.

---

## 3. The six methods

All resolve through `source_documents` / `source_document_versions` rows per §3 read-resolution (current-version-id → fall back to `original_storage_key`), exactly as `supabaseStorageProvider` does. `[disk]` `ctx` is `StorageProviderContext` (`ServiceContext | SystemActorServiceContext`); the pipeline path supplies the system-actor ctx.

- **`put(input, ctx)`** — D-B1 + D-B4: `computeHash` pre-write; size-gated upload (simple/session) under `withRetry`; Graph `GET /content` re-read under `withRetry`; `verifyHash`; return `{ storage_key: <drive-item-id>, content_hash, byte_size, provider }`. The org's target site/drive resolves from `org_settings`; the file is created under a per-org folder convention (the SharePoint analog of `org_{org_id}/sources/{source_document_id}/{filename}` — exact path policy in the implementation, but `none`-mode means the path is write-once and never reorganized).
- **`fetch(source_document_id, ctx)` / `fetchVersion(version_id, ctx)`** — resolve the drive-item-id `storage_key`; Graph `GET /content` (or the item's pre-authenticated `@microsoft.graph.downloadUrl`) under `withRetry`; return `{ bytes, content_hash: <row's stored hash>, provider }`. Per §1/types, `content_hash` is the **row's stored hash, not recomputed on read** (`verifyIntegrity` is the recompute path). `[disk]`
- **`previewUrl(source_document_id, options, ctx)`** — short-lived pre-authenticated download URL (Graph `driveItem` `@microsoft.graph.downloadUrl`, ~1h) or a TTL-bounded sharing link; clamp to §12 bounds (default 300s / max 1800s, the same `clampTtl` the supabase provider uses). `mode: 'preview' | 'download'` honored. Not audited (§16).
- **`delete(source_document_id, ctx)`** — Graph `DELETE /driveItem` for the bytes-removal step only; the `source_documents` cascade + controller-authority + audit are the calling layer's (ADR-0011 §4). Enumerate original + version keys as the supabase provider does.
- **`verifyIntegrity(source_document_id, ctx)`** — resolve the `storage_key`; download bytes under `withRetry`; `verifyHash(bytes, row.content_hash)` (throw `INTEGRITY_VERIFY_FAILED` on mismatch); return `IntegrityResult`. This is the drift hook the scheduled runner calls (§5; runner out of scope). **Note for the drift runner:** `verifyIntegrity` is throw-on-mismatch (success-only `IntegrityResult` per the §9 contract); the drift runner needs a non-throwing surface — it either catches `INTEGRITY_VERIFY_FAILED` or a softer method is added at runner-authoring. Flagged, not solved here. `[disk]`

---

## 4. Failure classification — `provider_unavailable` becomes the first live case

`classifyStorageFailure` already defensively classifies `401/403 → provider_unavailable`, `5xx/408/429 → transient`, other `4xx → permanent_malformed`, and the comment notes "future providers extend the classification patterns in their activation briefs." `[disk]` SharePoint is the **first provider to actually trigger `provider_unavailable`** (auth revoked, consent removed, site deleted → 401/403/404). Today `withRetry` throws `STORAGE_OPERATION_FAILED` for `provider_unavailable` and leaves "post-v1 exception-queue routing to the calling layer." `[disk]`

**This spec's positions:**
- Extend `classifyStorageFailure` for Graph error shapes at provider-(a) implementation: Graph throttling (`429` with `Retry-After`), `423 Locked` and `507 Insufficient Storage` (→ transient), `404` on a known-good drive-item-id (→ `provider_unavailable`: file gone out-of-band, distinct from `missing_file` drift), and Graph's `{ error: { code, message } }` envelope. `[design]`
- **`provider_unavailable` routing to the exception queue is the document-platform caller's job, not the provider's** — the provider classifies and surfaces the typed error; the caller routes to the exception queue with the `resolve_provider_unavailable` action (ADR-0010 discipline, already named in `failureClassification.ts`). This caller-side routing is a **named-not-done dependency** (§5) — the first real consumer of the `provider_unavailable` category. `[design]`
- **Layer note (deliberate at routing-dep authoring):** the §7 classifier disposition (route to exception queue, do not retry) and the §11 `storage_status = 'missing_file'` flag sit at **different layers** and can both apply to an out-of-band-deleted file — the classifier governs how the failed op is handled; the caller may additionally set `missing_file`. Not a provider-(a) concern (the provider only classifies); flagged so the routing dep handles both deliberately rather than treating them as one. `[design]`

---

## 5. Named-not-done dependencies (gate provider go-live; from the amendment + this spec)

None of these are authored here; the provider cannot go live until they land (each its own task in the implementation plan):

1. **CHECK-broaden + Zod admit-set.** Widen the `source_documents` and `source_document_versions` v1-active `storage_provider` CHECK (currently `= 'supabase_storage'`) to admit `sharepoint_drive` (two Layer-1 broadens); broaden the Layer-2 Zod admit-set to match (Layer-1-CHECK-broaden ⇒ Zod-broaden). `[ADR amendment][disk]`
2. **`resolver.ts` activation.** Split `sharepoint_drive` out of the combined throw-case into its own factory-returning case (`createSharepointDriveProvider()`). Precision: the throw branch handles `sharepoint_drive` today and **satisfies** exhaustiveness, so the build does **not** break if activation is deferred. The exhaustive-`never` guard guarantees no provider can be *silently unhandled* (add a 5th enum value and forget it → compile error); it does **not** force activation at compile time. Activation is a deliberate edit. `[disk]`
3. **`org_settings` slice.** The deferred org-settings sub-arc must add the columns this provider + the amendment need: the SharePoint **site/drive reference** (new), `default_storage_provider` (amendment, default-resolves-to-`sharepoint_drive` for M365 orgs), `sharepoint_durability_mode` (2026-05-15, `none`), and `storage_retry_*` / `preview_url_*`. All are reserved at **ADR-text grain only — not on disk**: migration `20240158` shipped 11 `org_settings` columns (5 ADR-0014 + 6 ADR-0019) and none of the storage/SharePoint ones, so the slice **adds all of them** (the same disk-vs-text-grain distinction the 2026-06-07 amendment corrected for `default_storage_provider`). `[ADR][disk]`
4. **Exception-queue `provider_unavailable` routing** at the document-platform caller (§4). `[design]`
5. **Secrets + per-site-grant ops.** Certificate provisioning + the scripted per-site grant onboarding step (D-B2). `[design]`

---

## 6. Open questions / risks

- **`previewUrl` mechanism** — `@microsoft.graph.downloadUrl` (pre-authenticated, ~1h, no extra call) vs a created sharing link (revocable, TTL-controllable). Lean: `downloadUrl` clamped to §12 bounds for v1 simplicity; resolve at implementation. `[design]`
- **`quickXorHash` nullability** — Graph delta/children queries can return `null` `quickXorHash`; a direct item GET returns it. `[graph]` Not load-bearing here (we don't rely on `quickXorHash` at all — D-B1), but the channel (b) folder-watcher must not depend on hashes from delta payloads.
- **Token-store location** — secrets store vs env vs a managed identity; ops decision at implementation.
- **Per-org folder path policy under `none`** — the write-once path convention (exact shape) is an implementation detail; `none`-mode guarantees it's never reorganized, so it carries no drive-item-id-stability risk (D-B3).

---

## Cross-references

- ADR-0013 §1 (interface contract), §9 (integrity policy + reserved-provider treatment), §14 (`sharepoint_drive` reserved skeleton), §7 (failure matrix), §3 (read-resolution), §12 (preview TTL bounds), §16 (audit division of labor).
- ADR-0013 **2026-06-07 Amendment** (universal-default SharePoint, the gate this spec is unblocked by) + **2026-05-15 Amendment** (`sharepoint_durability_mode`, `none`-default, drive-item-id-stability caveat scoped to `folder_organization`).
- `apps/web/src/services/storage/` — `storageProviderService.ts` (interface), `providers/supabaseStorageProvider.ts` (reference impl mirrored by D-B1/§3), `integrity.ts` (reused unchanged), `retry.ts` (`withRetry`), `failureClassification.ts` (extended per §4), `resolver.ts` (activated per §5), `types.ts` (shapes).
- Microsoft Graph: [hashes facet](https://learn.microsoft.com/en-us/graph/api/resources/hashes) (`sha256Hash` unsupported), [permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference) (`Sites.Selected` app-only least-privilege), [upload small files](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content) (≤4 MiB), [createUploadSession](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession).
- `docs/09_briefs/post-v1-revisit-notes.md` (Charter B entry; provider-vs-channel a/b fork).
