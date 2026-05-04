# ADR-0013: Storage Provider — Abstraction, Drift Detection, Queue-and-Retry, Integrity-Check, Controller-Override

## Status

Ratified 2026-05-03 by CTO with named follow-ups per D3
ratification package §5. Carry-forwards accepted on the recommended
path: Item 2 (reframe spec §7 Q47/Q52 stale references) future-note
Session 2B hygiene; Item 3 (source_documents.original_storage_key
schema delta vs ADR-0011 §2) ratified as-is — derivative inference
required by implicit-version-1 read-resolution path; Item 4
(orphan-blob-on-rollback policy) ratified as-is — v1 accepts
orphan-blob risk; GC owned by ADR-0014; Item 5 (storageProviderService
/ withInvariants conceptual tightening) ratify-with-named-follow-up
— CTO-captured wording applies at next amendment cycle; Item 6
(operator-drift caveat for supabase_storage exemption) future-note.

## Date

2026-05-03

## Triggered by

Phase 0 governance plan Task C4 (Tier 3 — depends on ADR-0011
ratification 2026-05-03). The 2026-05-02 Document Platform reframe
spec (`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
named Storage Provider as the sixth ADR in the eight-ADR Phase 0
set per §7. ADR-0011 ratified 2026-05-03 and forward-pointed the
storage-provider configurability portion of Q73 to this ADR per
ADR-0011 §Closes Q73 + Cross-references entry. ADR-0013 carries
one mechanism — the storage-provider abstraction — and a small
suite of specifications attached to that mechanism: provider
selection at write time, provider resolution at read time, drift
detection, queue-and-retry for transient storage failures,
provider-unavailable failure routing, integrity-check policy at
write time, controller-override path, source-of-truth discipline,
read-side preview/download URL contract, the `storage_status`
closed enum, audit-log discipline, and per-provider implementation
skeletons.

## Context

### Why a Storage Provider abstraction exists

ADR-0011 §2 introduced `source_documents.storage_provider` as a
discriminator naming which storage backend holds the bytes of an
ingested document. The discriminator is a closed enum per ADR-0010
reserved-enum-states discipline; v1's only active value is
`supabase_storage`; reserved values are `sharepoint_drive`,
`s3_bucket`, and `external_url`. The discriminator alone is not a
contract — it names a slot, not a behavior. Downstream consumers
of `source_documents` (the Tier 2 pipeline, the exception queue
UI, the proposal-card surface, the audit-replay path) need a
typed service interface that maps `(storage_provider, storage_key)`
to put / get / delete operations, hides per-provider authentication
and path-resolution detail, classifies failures consistently, and
holds drift detection at a single code path. ADR-0013 specifies
that interface and the mechanisms it stands on.

The ADR is narrow on per-provider implementation specifics. v1
ships exactly one implementation (Supabase Storage); the reserved
implementations (SharePoint, S3, external URL) ship under their
own activation briefs post-v1. ADR-0013 specifies the contract
those implementations must satisfy and the failure-classification
matrix they share, so future implementations land without
reshaping the contract.

### Phase 0 dependency context and Reading B preservation

ADR-0013 sits in Tier 3 alongside ADR-0012 (ProposedMutationBundle)
and ADR-0014 (Tier 2 Document Pipeline). All three depend on
ADR-0011 (the spine — entity ownership, `source_documents` schema,
exception-queue routing, audit-log writer boundary, lifecycle
immutability) and on ADR-0007 (three-tier agent architecture) as
a carried prerequisite. ADR-0012, ADR-0013, and ADR-0014 do not
inherit from each other — they are siblings under ADR-0011.

Per ADR-0011 §8, the Document Platform proposes; domain services
produce ledger operations; the ledger service is the sole writer
of journal entries. Storage operations are a substrate-layer
concern — they read and write blob bytes, not journal entries.
`storageProviderService` runs at the data-access layer and never
participates in `withInvariants()`-wrapped transactions; storage
failures emit typed `ServiceError` per
`docs/02_specs/ledger_truth_model.md` Service Communication Rules
(specifically Rule 4 — no free-form data at the boundary; storage
errors carry typed codes, not free-form messages). The storage
layer is below Reading B; Reading B is preserved by construction.

### What ADR-0011 §2 already nailed down (do not redraft)

ADR-0011 §2 specified the `source_documents` schema with an
**original-anchor + current-pointer hybrid versioning model**:
`original_content_hash`, `original_byte_size`, and
`original_filename` are write-once at ingestion and immutable;
`current_version_id` (the only post-ingestion-mutable column on
`source_documents`) points to the latest captured
`source_document_versions` row; each version row carries its own
immutable `content_hash` and `byte_size` per ADR-0011 §9. ADR-0013
inherits this schema verbatim and does **not** redraft it. The C2
cleanup pass (`cc8c837`) resolved an earlier write-once-vs-latest
contradiction; ADR-0013's storage-side discipline must not
reintroduce it. Storage operations read and write bytes against
the `(storage_provider, storage_key)` pair on `source_documents`
or against the version row's `storage_key` for non-original
versions; storage operations never mutate the immutable anchor
columns.

## Decision

The Decision is presented as sixteen items, each of which is a
contract that downstream consumers cite. Items 1–3 establish the
service contract and provider selection. Items 4–6 cover schema
inheritance and drift behavior. Items 7–9 cover failure
classification, retry, and integrity. Items 10–12 cover
source-of-truth, status, and read-side URL semantics. Item 13
states the SharePoint framing verbatim. Items 14–16 cover
implementation skeletons, replayability, and audit-log discipline.

### 1. `storageProviderService` interface contract

The Document Platform's write paths and read paths call a typed
service interface — `storageProviderService` — for all blob bytes
I/O. The interface is per-`storage_provider` polymorphic: each
active value of the enum maps to one implementation. v1's only
active implementation is `supabase_storage`; reserved
implementations for `sharepoint_drive`, `s3_bucket`, and
`external_url` ship under their own activation briefs post-v1.

The contract surface (typed signatures the service exposes;
implementation-internal helpers are private):

- `put(input: PutInput, ctx: ServiceContext): Promise<PutResult>`
  — write bytes. Computes SHA-256 hash pre-write, writes bytes,
  re-reads to verify hash, returns `{ storage_key, content_hash,
  byte_size, provider }`. Failure modes per item 7 / item 8.
- `fetch(source_document_id, ctx): Promise<FetchResult>` — read
  bytes for the current version (resolves `current_version_id`
  per item 3). Returns `{ bytes, content_hash, provider }`.
- `fetchVersion(source_document_version_id, ctx):
  Promise<FetchResult>` — read bytes for a specific version row.
- `previewUrl(source_document_id, options, ctx):
  Promise<PreviewResult>` — return `{ url, expires_at, provider }`
  per item 12.
- `delete(source_document_id, ctx): Promise<void>` — rare path;
  per ADR-0011 §4, source-document deletion requires controller
  authority and produces an `audit_log` entry. Storage-layer
  delete is the bytes-removal step; the `source_documents` row
  cascade lives in the document-platform service layer.
- `verifyIntegrity(source_document_id, ctx):
  Promise<IntegrityResult>` — recompute hash from bytes at the
  resolved `(provider, storage_key)` and compare against the
  current version's `content_hash`. Drives drift detection (item 5).

Each implementation handles authentication, path resolution, and
bytes I/O. Per-implementation details (Supabase RLS-scoped paths,
SharePoint OAuth tokens, S3 bucket policies, external-URL
fetcher discipline) ship as the implementations land. The
contract surface itself is stable across providers; failure
classification is shared (item 7).

`storageProviderService` runs at the data-access layer. It is
**not** wrapped in `withInvariants()` — invariants apply to ledger
and domain mutations; storage operations emit typed
`ServiceError` per Service Communication Rule 5. Callers that
need transactional coupling to a `source_documents` INSERT (the
ingestion path) wrap the storage call inside the document-platform
service's `withInvariants()` block: storage `put` succeeds first,
then the `source_documents` INSERT runs in the transaction; if
the INSERT fails, the bytes already written remain (cleanup is a
post-v1 garbage-collection concern, owned by ADR-0014's pipeline).
v1 accepts the orphan-blob risk in exchange for not inventing a
two-phase commit between the storage backend and Postgres.

### 2. Provider selection at write time

When a `source_document` row is created (during ingestion) or a
new `source_document_versions` row is captured (during
re-upload or drift resolution), the platform selects
`storage_provider` based on two inputs:

- **Per-org default.** v1: system-fixed `supabase_storage` for all
  orgs. Post-v1 (per Q73 storage-portion narrow closure below):
  per-org configurable via a new `org_settings.default_storage_provider`
  column reserved at v1 schema time per ADR-0010 discipline (the
  column is added in v1 with `supabase_storage` as its NOT NULL
  DEFAULT; the configurability switch flips post-v1 when the
  org-settings UI ships).
- **Per-document override.** Rare. Reserved for cases where the
  ingestion channel itself implies a non-default provider — for
  example, a SharePoint folder-watcher channel that ingests
  documents already living in a SharePoint drive should select
  `sharepoint_drive` regardless of the org default. The override
  is set by the ingestion code path, not by the user. v1 has no
  channel that exercises this override (only `drag_drop_pdf`,
  `forwarded_mailbox`, `direct_upload`, `api_ingest` — all use the
  org default). Post-v1 channels that ship with a per-document
  override (the SharePoint folder-watcher per ADR-0014's channel
  table) document the override in their channel-specification
  brief.

ADR-0013 specifies the selection contract; the per-org-default
value resolution is post-v1 configurability per Q73 storage
portion. v1's selection is mechanical: every write picks
`supabase_storage`.

### 3. Provider resolution at read time

Downstream consumers (the Tier 2 pipeline reading bytes for OCR;
the exception queue UI rendering preview URLs; the audit replay
re-reading evidence for a forensic query) call
`storageProviderService.fetch(source_document_id, ctx)` or
`fetchVersion(source_document_version_id, ctx)`. The service
resolves through the row's `(storage_provider, storage_key)` pair:

- For `fetch(source_document_id)`: the service reads
  `source_documents.current_version_id`. If null (the document is
  at its original-ingestion version, no separate version row
  exists yet — implicit version 1), the service reads
  `source_documents.storage_provider` and a v1-specific
  `source_documents.original_storage_key` column (added in v1 to
  hold the storage-key for the original ingestion since the
  implicit-version-1 model has no separate version row). If
  non-null, the service reads the `source_document_versions` row
  and uses its `(storage_provider, storage_key)` pair (each
  version row carries its own `storage_provider`, allowing future
  version-level provider migration without retrofit).
- For `fetchVersion(source_document_version_id)`: direct read of
  the named version row's `(storage_provider, storage_key)`.

The read is read-only against the storage provider. Failures are
classified per item 7 and surfaced as typed `ServiceError`
matching the failure category. The `source_documents` row itself
is unchanged on a read failure — drift detection (item 5) is the
only path that mutates `storage_status`; a transient read failure
on a one-off fetch does not flip the status.

### 4. `source_documents` schema inheritance — original-anchor + current-pointer hybrid

ADR-0013 inherits ADR-0011 §2's schema verbatim. The relevant
columns for the storage layer:

- `original_content_hash` (text) — immutable. SHA-256 of bytes as
  originally ingested.
- `original_byte_size` (bigint) — immutable. Bytes at ingestion.
- `original_filename` (text) — immutable.
- `original_storage_key` (text) — immutable. The provider-scoped
  key for the original-ingestion bytes. Added at the schema level
  to support the implicit-version-1 read pattern (item 3) without
  requiring a separate version row at ingestion.
- `storage_provider` (enum) — write-once at ingestion in v1; per
  the post-v1 migration story (item 14 and §4 deferred above), v1
  documents do not migrate providers, so v1 treats this column as
  effectively immutable for `source_documents`. (Per-version
  provider may differ on `source_document_versions` rows captured
  post-v1; that flexibility is reserved at the version-row schema
  level even though v1 never exercises it.)
- `current_version_id` (uuid, nullable, FK) — the only
  post-ingestion-mutable column on `source_documents`. Updates
  when a new version row lands (drift-resolution-via-supersession,
  controller-override, vendor-corrected re-upload).

Each `source_document_versions` row carries an immutable
`content_hash` and `byte_size` per ADR-0011 §9. ADR-0013 owns the
storage-provider abstraction layer underneath this schema; ADR-0013
does **not** modify the schema. The C2 cleanup pass `cc8c837`
resolved the earlier write-once-vs-latest contradiction; ADR-0013
preserves the resolution — original anchor immutable, current
pointer mutable, version row contents immutable.

### 5. Drift detection cadence and trigger

The platform runs a drift-detection cycle for `source_documents`
rows whose `storage_provider` allows out-of-platform mutation.
Drift is the case where the bytes at `(provider, storage_key)`
have changed without the platform's write path running — a
SharePoint user replaces a file directly through the
SharePoint UI; an S3 bucket lifecycle policy transitions an
object; an external_URL document is updated at the source. Drift
detection compares a freshly-computed SHA-256 of the bytes at the
resolved `(provider, storage_key)` against the current version's
`content_hash`.

**Provider-by-provider applicability:**

- `supabase_storage` is **exempt** from drift detection in v1.
  The platform is the sole writer of Supabase Storage paths under
  its RLS-scope; no path outside the platform's service layer can
  modify bytes at a `org_{org_id}/sources/...` storage_key. Drift
  is impossible by construction. The notes for future ADR writers
  (below) flag this rationale so a future contributor does not
  add drift cycles for `supabase_storage` defensively.
- `sharepoint_drive`, `s3_bucket`, `external_url` (reserved) all
  allow out-of-platform mutation in their normal usage and are
  subject to drift detection when activated.

**v1 cadence and trigger:** v1 ships no scheduled-job stack
(per `mutation_lifecycle.md` — "no background cron in Phase 1").
Drift detection in v1 is **manual or controller-triggered** — the
exception queue UI exposes a "Verify integrity" action on
individual documents, and a controller-only batch action on
filtered sets. Since v1's only active provider is exempt, the
v1 drift-detection surface is implemented but inert: the action
produces a no-op result for `supabase_storage` rows, with the
typed result `{ status: 'exempt_provider', provider:
'supabase_storage' }`. The controller-trigger UI ships in v1 even
though it never fires in practice; this preserves the action
shape so reserved providers activating post-v1 do not require UI
retrofit.

**Post-v1 cadence:** when any of the reserved providers activate,
drift detection runs as a scheduled job (pg-boss, per the
post-v1 stack). v1 default for activated providers will be
**daily**; per-org configurability of cadence (hourly, daily,
weekly) is reserved for post-v1 per Q73 storage portion. The
per-org cadence value lives in
`org_settings.drift_detection_cadence` (reserved column at v1
schema time per ADR-0010 discipline, NOT NULL DEFAULT 'daily').

### 6. Drift-detection outcomes — three paths

When drift detection finds a hash mismatch (the bytes at
`(provider, storage_key)` no longer match the current version's
`content_hash`), the platform classifies the change and routes
to one of three outcomes. Routing depends on the `capture_reason`
discriminator on `source_document_versions` (closed enum per
ADR-0010 discipline; full enum membership defined here, v1 active
subset narrow because v1's only active provider is exempt from
drift):

- **`vendor_corrected_invoice`** — vendor reissued the document
  with a correction (new total, different line items). Active
  v1 (manual capture path; drift never produces this in v1).
- **`reformatted_pdf`** — same logical content, different bytes
  (rasterized vs vector, different compression). Active v1
  (manual capture path).
- **`accessibility_replacement`** — original was a scan, replaced
  with a text-extracted version. Active v1 (manual capture path).
- **`drift_auto_supersession`** — drift detection auto-superseded
  after content-shape verification. Reserved (drift not active in
  v1).
- **`drift_controller_override`** — drift detection produced an
  exception that controller approved as a legitimate
  supersession. Reserved.
- **`drift_rejected_kept_original`** — drift detection produced
  an exception that controller rejected; bytes stored as
  `superseded_source` link, current version unchanged. Reserved.
- **`unknown_drift`** — drift detected but classification failed
  (no rule matched). Reserved.

The full enum lands at v1 schema time per ADR-0010 discipline;
v1 active values are the first three (manual-capture cases);
remaining values are reserved per ADR-0010 and emitted by no v1
service write path. Service-layer Zod rejects client-provided
values for the column (Layer 2 defense); service-layer write
paths emit only active values (Layer 3 defense); the DB CHECK
restricts non-`drift_*` values on rows produced by drift
detection (Layer 1 defense — scoped per ADR-0010, but only fires
when drift activates post-v1).

The three routing paths:

- **Auto-supersession.** If new bytes parse to a same-shape
  document and `capture_reason` classifies as
  `vendor_corrected_invoice`, `reformatted_pdf`,
  `accessibility_replacement`, or `drift_auto_supersession`
  (post-v1), the platform captures a new
  `source_document_versions` row with the new
  `(content_hash, byte_size, captured_at, capture_reason,
  storage_provider, storage_key)` and updates
  `source_documents.current_version_id` to point to the new row.
  `source_documents.original_content_hash` is unchanged. Audit
  event: `version_captured` with the `capture_reason` value.
- **Exception-queue routing.** If suspicious — different
  `document_type` after re-classification, unexpected vendor
  identity change, total-amount change beyond a controller-
  configurable threshold (post-v1; v1 threshold is system-fixed
  but the surface never exercises in v1) — drift produces a
  typed integrity exception in the exception queue per ADR-0011
  §13. The exception's resolution-action is `route_to_manual_entry`
  (an active v1 value) or a reserved `resolve_drift_exception`
  action (reserved per ADR-0010, activates when drift activates).
  The controller reviews the exception with both versions of
  bytes available for preview (item 12). Approval triggers the
  auto-supersession path with `capture_reason =
  drift_controller_override`. Rejection triggers the third path.
- **Controller-override (deliberate human action).** Some
  legitimate cases require explicit controller authority — vendor
  sends a corrected invoice but the original was already
  committed to a bill. Controller-override is a deliberate human
  action: the controller approves the supersession through the
  exception queue UI, the platform records the override in
  `audit_log` via the canonical audit-log writer per ADR-0011
  §1, and the new bytes are stored as `superseded_source` per
  the `link_role` enum (owned by ADR-0016) when the prior
  version's byte content remains evidentially relevant (the
  original-as-attached-to-bill stays linked, the corrected
  version becomes the current version). `link_status` discipline
  per ADR-0011 §4 governs whether downstream
  `source_document_links` rows flip; default behavior is that
  the existing link points to the new current version and the
  audit trail preserves the original via the
  `superseded_source` link.

### 7. Provider-unavailable flow — distinct from queue-and-retry

Storage failures fall into three categories. Conflating them is a
common drift mode (treating an OAuth-token-expired error as a
retryable timeout produces useless retries that mask a real
configuration problem); the three-way split is the load-bearing
discipline:

- **Transient retryable.** Network timeout, provider 5xx, brief
  connection loss, throttling responses with `Retry-After`
  headers. Retry per item 8. The same operation, retried with
  exponential backoff, is expected to succeed within the retry
  budget.
- **Provider-unavailable / persistent.** Auth-invalid,
  bucket-missing, OAuth-token-expired (SharePoint, post-v1),
  permissions revoked, account suspended, Graph-API throttled
  beyond the retry budget. **No retry.** Route to the exception
  queue immediately with a typed `provider_unavailable` exception
  (resolution-action: a reserved `resolve_provider_unavailable`
  action per ADR-0010 — activates when reserved providers
  activate; v1 does not exercise this since `supabase_storage` is
  the platform's own RLS-scoped storage). Controller resolution
  paths include re-authenticating, switching the per-org default
  provider, or marking the affected sources as inaccessible
  (a reserved `storage_status` value per item 11).
- **Permanent malformed.** Malformed storage_key, hash mismatch
  on integrity-check post-write (item 9), illegal characters,
  path-too-long. **No retry.** The operation is broken in a way
  retry cannot fix; the service surfaces typed `ServiceError`
  with explicit code (`STORAGE_KEY_MALFORMED`,
  `INTEGRITY_VERIFY_FAILED`). For ingestion, the `source_documents`
  row is **not created** when put-then-verify fails — the ingest
  fails fast, the user sees a typed error, and retry happens at
  the user's discretion (re-upload).

The classification matrix is shared across all provider
implementations. Each implementation maps its native error
responses to one of the three categories. Future providers
(post-v1 SharePoint, S3, external_URL) extend the matrix in their
activation briefs; the categorization scheme itself is stable.

### 8. Queue-and-retry for transient storage failures

When `storageProviderService.put()` or `.fetch()` fails with a
transient retryable error (per item 7), the platform retries
with exponential backoff. v1 retry parameters are system-fixed:

- **Max attempts:** 3 (the original attempt plus 2 retries).
- **Base delay:** 500ms.
- **Exponential factor:** 2x. Delays: 500ms, 1000ms, 2000ms.
- **Backoff jitter:** ±20% per attempt to avoid thundering-herd
  on shared retry windows.
- **Total budget:** ~3.5 seconds wall-clock (the longest the user
  waits at an ingestion call before the service surfaces failure).

After max retries the operation surfaces typed `ServiceError`
with code `STORAGE_PROVIDER_TRANSIENT_EXHAUSTED`. For ingestion
that fails put after retries, the `source_documents` row is
**not created** (consistent with item 7's permanent-malformed
treatment) and the typed error surfaces to the user. The user
re-uploads at their discretion.

For drift detection's verifyIntegrity calls (post-v1), a
transient-exhausted result rolls the `storage_status` to a
`verification_pending_retry` value (reserved in the closed enum
per ADR-0010) and the next scheduled drift cycle re-attempts
verification. The current version's `storage_status` is not
flipped to `hash_mismatch` until a successful verifyIntegrity
returns a real mismatch.

Retry parameters (max attempts, base delay, factor, total
budget) are system-fixed in v1. Per-org configurability is
reserved for post-v1 per Q73 storage portion. The per-org values
live in `org_settings.storage_retry_*` columns reserved at v1
schema time per ADR-0010 discipline (NOT NULL DEFAULT to the
v1-fixed values; configurability flips post-v1).

### 9. Integrity-check policy at write time

When the platform writes bytes via `storageProviderService.put()`,
the service computes SHA-256 of the bytes pre-write (the buffer
or stream is hashed in-process), writes bytes to the provider,
then re-reads the bytes from the provider and computes SHA-256
of the re-read bytes. The two hashes must match. This catches
in-flight corruption — a network bit-flip, a provider-side
storage corruption, a partial-write that succeeded then truncated.

**v1 implementation mandatory for `supabase_storage`.** Every
ingestion writes-then-re-reads; the verify hash compared against
the pre-write hash before the `source_documents` INSERT runs.
Mismatch produces typed `ServiceError`
(`INTEGRITY_VERIFY_FAILED`); the row is not created; the orphan
bytes are left at the storage_key for post-v1 garbage collection
(per item 1's transactional discipline note).

**Reserved-provider treatment.** SharePoint and S3 carry native
integrity guarantees (Graph API for SharePoint returns `etag` /
`hash`; S3 returns `ETag` for non-multipart uploads). Post-v1
implementations may rely on the native guarantee and skip the
re-read step; the activation brief for each reserved provider
documents which native guarantee is trusted and the test that
proves it. v1 contract is hash-verify-on-put for every active
provider.

`external_url` poses a special case: bytes are fetched, not
written. The integrity check fires on the **fetcher**'s buffered
bytes — hash before storage at the platform's own storage layer
(if cached) or on every fetch (if uncached). The activation
brief for `external_url` documents the policy. Reserved.

### 10. Source-of-truth discipline — one provider per document

A `source_document` row has exactly one `storage_provider` and
one `storage_key`. When the same logical document arrives via
two channels (the same invoice forwarded to the mailbox AND
dragged into the canvas), the **dedup-by-hash logic** (per Q70,
owned by ADR-0014) fires before storage-provider selection
runs. Dedup runs at the OCR-pipeline ingest stage and short-
circuits the second-arriving channel's `source_document` creation
when an existing row with the same `original_content_hash` is
found.

The post-dedup outcome: only one `source_documents` row exists,
and its `storage_provider` is the first-arriving channel's
selected provider. The second-arriving channel does **not**
create a parallel storage backend write — its bytes are
discarded after the dedup match (or, post-v1 per ADR-0014,
captured as a `link_role = 'duplicate_arrival'` link if the
arrival metadata is itself evidentially valuable). ADR-0013
specifies the post-dedup storage-provider selection contract
(provider is whatever was selected at first arrival; the
second-arrival channel does not get its own provider slot).
Dedup itself is ADR-0014's domain.

### 11. `source_documents.storage_status` closed enum

A `storage_status` column on `source_documents` reflects the
current accessibility of the bytes at the resolved
`(storage_provider, storage_key)`. The full closed enum per
ADR-0010 discipline:

- **`available`** — bytes present at the storage_key; integrity
  verified at most recent check (or no check has run for an
  exempt provider). Default initial value at ingestion (after
  successful put-and-verify).
- **`permission_loss`** — provider returns 403 / permission
  revoked. Common SharePoint / S3 case post-v1; not reachable
  for `supabase_storage` since the platform owns the RLS-scope.
- **`missing_file`** — provider returns 404 / file deleted
  out-of-band. Common SharePoint / S3 case post-v1.
- **`hash_mismatch`** — drift detected; bytes at the storage_key
  no longer match the current version's `content_hash`. Set by
  drift detection's exception-queue routing path (item 6); reset
  to `available` after auto-supersession or controller-override
  resolves.
- **`provider_unavailable`** — auth-invalid, bucket-missing,
  OAuth-token-expired (item 7's middle category). Set by failed
  provider-unavailable classification at fetch or
  verifyIntegrity time.
- **`verification_pending_retry`** — transient verifyIntegrity
  failure; next drift cycle will re-attempt (item 8). Reserved
  for post-v1 (drift detection inert in v1).
- **`pending_initial_verify`** — set briefly during ingestion
  between put completion and verify completion. Should never
  appear in a query result outside the ingest transaction.
  Reserved as a state value for the in-flight ingestion path.

**v1 active subset:** `available` (set at ingestion) and
`pending_initial_verify` (in-flight only). All other values are
reserved per ADR-0010 — the enum members exist, the DB CHECK
restricts non-`available` and non-`pending_initial_verify` values
on v1 rows, and Layer 2 / Layer 3 defenses prevent service or
client paths from setting reserved values. The full active set
unlocks when reserved providers activate and drift detection
runs.

**State transitions.** Every transition writes an `audit_log`
entry through the canonical audit-log writer per ADR-0011 §1
(item 16). Drift detection is the primary state-transition
trigger post-v1; ingestion sets the initial value
(`available` after put-and-verify completes). The audit event
type is `storage_status_changed` with fields `(from_status,
to_status, trigger, source_document_id)`; `trigger` is one of
`{ingestion_initial_set, drift_detection,
controller_override_resolution, integrity_recheck,
provider_failure_classification}`.

### 12. Preview / download URL behavior — read-side contract

The exception queue UI and the proposal-card surface need a
URL the user's browser can fetch to render a preview of the
bytes (PDF render in iframe, image inline display) or to
download the original. Different providers expose this
differently — Supabase Storage signs URLs with TTL bounds;
SharePoint / Graph API returns a `webUrl` or a
short-lived `downloadUrl`; S3 signs URLs with bucket policies.
The platform abstracts these through a single read-side
contract:

- `previewUrl(source_document_id, options, ctx):
  Promise<PreviewResult>` returns
  `{ url: string, expires_at: string, provider: string }`.
- `options` is a typed object with optional fields:
  `{ ttl_seconds?: number, mode?: 'preview' | 'download' }`.
  TTL has a controller-configurable upper bound in v1; default
  is **5 minutes** (300 seconds), upper bound **30 minutes**
  (1800 seconds). Per-org configurability of default and bound
  is reserved post-v1 per Q73 storage portion (in
  `org_settings.preview_url_default_ttl` /
  `org_settings.preview_url_max_ttl`, NOT NULL DEFAULT to the
  v1-fixed values).
- `mode` controls Content-Disposition: `preview` returns a URL
  the browser will render inline; `download` returns a URL with
  `attachment` disposition. v1 supports both modes for
  `supabase_storage`.

**v1 implementation mandatory for `supabase_storage`.** Signed
URLs through the Supabase client. Reserved providers ship
preview URL implementation in their activation briefs.

**Audit treatment.** URL-minting events are **not audited
individually**. v1 page renders may mint many URLs per session
(every preview-card hover), and an `audit_log` entry per mint
would explode the audit table for limited forensic value. The
audit boundary is at `storage_status` transitions and
controller-override resolution (item 6 / item 11) — those are
the events that change platform state. URL mints are read-only
state-preserving operations and live in pino logs (with
`trace_id` correlation per Service Communication Rule 5) but
not in `audit_log`.

### 13. SharePoint framing — load-bearing

Verbatim — this paragraph appears in this ADR so that a future
ADR-0014 implementer or a future SharePoint-channel author cannot
read ADR-0013 in isolation and miss the framing:

**SharePoint is opt-in per org, not the only provider, and not
the accounting source of truth.** The storage provider holds the
original bytes. CHOUnting keeps `source_document_id`, the
provider reference (`storage_provider`, `storage_key`), the
hashes (`original_content_hash`, version `content_hash`s), the
versions (`source_document_versions` rows), the document cases
(`document_cases` rows), the document links
(`source_document_links` rows), and the audit trace
(`audit_log` rows referencing `source_document_id`). The Document
Platform owns `source_documents`, `source_document_versions`,
`source_document_links`, and the related substrate tables;
downstream domains own the accounting objects (`bills`,
`payments`, `vendor_prepayments`, `vendor_credits`).

Treating SharePoint-mode documents as "owned by SharePoint" is a
category error and a path to wrong accounting. SharePoint holds
bytes; CHOUnting holds meaning. The split is exact and
non-negotiable. Post-v1, when SharePoint activates, this framing
is what stands between the system and a class of failure where a
SharePoint-deleted file silently invalidates a bill commit — the
audit trail and the version row both survive even when the
underlying bytes are out-of-band-deleted; the
`storage_status = 'missing_file'` flag fires; the exception queue
routes the controller to the resolution path; the
accounting record persists.

### 14. Per-provider implementation skeletons (high-level only)

ADR-0013 names the implementation contract requirements. It does
not draft the implementations beyond `supabase_storage`. Reserved
providers ship under their own activation briefs post-v1.

- **`supabase_storage` (active v1).** Implementation uses the
  existing Supabase client. Org-scoped paths follow the pattern
  `org_{org_id}/sources/{source_document_id}/{filename}`. RLS
  policies enforce org isolation: the platform's service role is
  the only writer; the per-user session role can only read its
  own org's paths. Signed URLs through the Supabase client per
  item 12. Hash-verify-on-put per item 9. Drift detection
  exempt per item 5.
- **`sharepoint_drive` (reserved).** Implementation requirements:
  OAuth token storage with refresh-token discipline; folder-
  watcher integration that emits `source_documents` ingestion
  events on file-arrival webhooks; Graph API calls for fetch and
  preview URL minting; native `etag` integrity guarantee
  evaluation per item 9. Activation brief: the SharePoint
  channel ADR (post-v1, not in the Phase 0 set).
- **`s3_bucket` (reserved).** Implementation requirements:
  bucket policy + IAM role with platform-service-account scoping;
  optional KMS encryption; native `ETag` integrity guarantee
  evaluation per item 9; signed-URL minting for preview. The
  S3 channel ADR (post-v1).
- **`external_url` (reserved).** Implementation requirements:
  fetcher discipline (timeout, redirect bound, content-type
  validation); allow-deny list for permitted source domains;
  fetch caching (cache key = SHA-256 of the URL, with TTL); the
  drift-handling cycle for source-side mutation per item 5
  (every fetch may discover updated bytes); on cache miss, the
  fetch fires and the bytes are stored either at the platform's
  own `supabase_storage` cache or re-fetched on every read. The
  policy is documented in the `external_url` activation brief
  (post-v1).

**Per-document storage-provider migration is post-v1.** v1
supports per-document provider selection at write time only
(item 2); existing documents do not migrate. If an org changes
default provider post-v1, future documents flow to the new
provider; existing documents remain at their current provider.
Migration tooling (re-uploading existing documents to a new
provider while preserving hashes, version history, and links) is
post-v1 and out of scope for this ADR. The activation brief for
the migration tool will inherit the schema from this ADR
unchanged.

### 15. Replayability boundary at the storage layer

ADR-0011 §9 establishes immutability for the document lifecycle
substrate. ADR-0013 inherits the boundary at the storage layer:

- `original_content_hash` is the immutable evidence anchor.
  Storage operations never mutate it; drift detection produces a
  new version row, never an in-place anchor change.
- `source_document_versions.content_hash` is immutable per row.
  A version row is INSERTed once and never UPDATEd. Storage
  operations write bytes that match the row's hash by
  construction (the hash is computed from the bytes pre-INSERT).
- Replays of OCR or extraction (per Q69, owned by ADR-0014)
  read against the bytes referenced by `current_version_id`
  (resolution per item 3), **NOT** against the original anchor.
  Replay results may differ from original results when versions
  have been captured between the original extraction and the
  replay. ADR-0014 owns the replay-trigger semantics and the
  policy on whether replays auto-supersede prior extraction
  artifacts; ADR-0013 owns the storage-fetch contract under
  replay.

The replayability discipline composes with the immutability
discipline cleanly: replays produce new artifact rows
(immutable), reading against current bytes (which may differ
from original bytes if drift has captured a version), with audit
trace that reconstructs the original-bytes-at-original-time view
when needed.

### 16. Audit logging through the canonical writer

Storage operations that change platform state write `audit_log`
entries through the canonical audit-log writer
(`recordMutation.ts` per INV-AUDIT-001 today; future audit
service inherits the role) per ADR-0011 §1. No service inserts
into `audit_log` directly. The events that fire:

- **`source_document_created`** — at successful ingestion (after
  put-and-verify). Fields: `source_document_id`, `storage_provider`,
  `original_content_hash`, `original_byte_size`, `org_id`,
  `legal_entity_id`, `ingest_channel`, `created_by`, `trace_id`.
- **`source_document_version_captured`** — when a new
  `source_document_versions` row lands (drift auto-supersession,
  controller override, manual re-upload). Fields:
  `source_document_id`, `source_document_version_id`,
  `capture_reason`, `content_hash`, `byte_size`,
  `prior_current_version_id`, `trace_id`.
- **`storage_status_changed`** — every transition per item 11.
  Fields: `source_document_id`, `from_status`, `to_status`,
  `trigger`, `trace_id`.
- **`controller_override_resolution`** — when controller
  approves a drift-detection exception. Fields:
  `source_document_id`, `controller_user_id`, `original_version_id`,
  `new_version_id`, `resolution_action`, `trace_id`.
- **`drift_exception_created`** — when drift detection produces
  an exception (post-v1, when drift activates). Fields:
  `source_document_id`, `expected_content_hash`,
  `actual_content_hash`, `provider`, `trace_id`.

Drift detection runs as a scheduled job post-v1 (per item 5);
the job's per-document outcomes emit one of the above events
depending on the path (auto-supersession path emits
`source_document_version_captured`; exception path emits
`drift_exception_created`; controller resolution emits
`controller_override_resolution`).

URL-minting events are not audited (per item 12). Pure read
operations (`fetch`, `previewUrl`) are not audited individually.
The audit boundary is at platform-state-changing events.

## Consequences

### What this enables

- **Multiple storage backends behind a stable contract.** v1
  ships `supabase_storage`; post-v1 SharePoint, S3, and
  external_URL ship under their own activation briefs without
  reshaping `storageProviderService`'s contract surface or the
  failure-classification matrix.
- **Drift detection as a first-class capability.** Post-v1,
  reserved providers that allow out-of-platform mutation get
  hash-recompute drift detection with a three-path resolution
  flow (auto-supersession, exception queue, controller-override)
  that preserves the original-anchor + current-pointer hybrid
  versioning model.
- **Failure classification distinguishes retry-worthy from
  unretry-able cases.** Transient timeouts retry; auth-revoked
  errors route to the exception queue immediately;
  malformed-key errors fail fast. The matrix prevents wasted
  retry loops on persistent provider failures and prevents
  immediate failure on transient hiccups.
- **Read-side preview URL contract is uniform across providers.**
  The exception queue UI and proposal-card surface call one
  function regardless of provider. v1's signed-URL pattern for
  Supabase generalizes to SharePoint/S3 native equivalents
  post-v1.
- **Integrity checks at every write.** Hash-verify-on-put for
  every active provider catches in-flight corruption before the
  `source_documents` row is created. Provider-native integrity
  guarantees (S3 ETag, Graph API hash) compose with the
  service-layer verify into a defense-in-depth posture.
- **Audit trail on every state change.** `storage_status`
  transitions, version captures, and controller overrides all
  emit `audit_log` entries through the canonical writer. URL
  mints don't, which keeps the audit table from exploding while
  still capturing every event that changes platform state.

### What this constrains

- **No direct writes to storage from non-platform code paths.**
  Future contributors who add a new ingestion channel cannot
  bypass `storageProviderService`. The service is the only path
  that writes to a storage provider; per-provider discipline
  (auth, paths, integrity) is centralized.
- **No retry on persistent failures.** A future contributor who
  adds a fourth retry on auth-revoked errors is reintroducing
  the failure mode the three-way classification matrix is
  designed to prevent. Auth-revoked routes to the exception
  queue, not to a retry loop.
- **`supabase_storage` exemption from drift detection is
  load-bearing.** A future contributor who adds drift cycles for
  `supabase_storage` defensively is introducing wasted work; the
  exemption rationale is in the notes for future ADR writers
  below.
- **Per-document storage-provider migration is post-v1.** v1
  documents stay at their original provider. Future contributors
  who propose v1 migration tooling are pulling post-v1 scope into
  v1; the rationale (avoiding tooling complexity that v1 doesn't
  need) is in item 14.
- **Post-v1 reserved-provider activation requires its own brief
  per provider.** SharePoint, S3, and external_URL each ship
  their authentication, integrity-guarantee, and channel-
  integration details in dedicated activation briefs. Activating
  them under ADR-0013's contract alone — without the channel
  brief — would leave per-provider details (OAuth refresh,
  bucket policy templates, allow-deny lists) underspecified.

### What this costs

- **Schema scope.** `source_documents.original_storage_key`,
  `source_documents.storage_status`,
  `source_document_versions.storage_provider`,
  `source_document_versions.storage_key`,
  `source_document_versions.capture_reason`, plus the reserved
  `org_settings.*` columns for post-v1 configurability. Each
  carries reserved-enum discipline per ADR-0010 (NOT NULL
  DEFAULT for the value-bearing columns; scoped CHECK for
  reserved subsets).
- **Implementation surface.** `storageProviderService` ships in
  Phase 1 (Storage / Evidence Core) with the `supabase_storage`
  implementation; the contract surface (typed signatures,
  failure-classification helper, retry helper, integrity helper)
  ships at the same time even though only one implementation
  exists. Reserved-provider implementation skeletons (test
  doubles, type definitions) ship at v1 to prove the contract
  generalizes; full reserved-provider code lands per activation
  brief.
- **Audit-log volume.** Every `storage_status` transition fires
  an `audit_log` row. v1 transitions are limited (only initial
  set during ingestion); post-v1 drift detection adds activity
  but at a daily-or-slower cadence, so the volume is bounded.
- **Test surface.** Integration tests must cover the
  put-and-verify integrity check at ingestion, the
  fetch-resolution through `current_version_id`, the failure-
  classification matrix (one test per category), and the dedup-
  before-provider-selection ordering. Drift-detection tests
  ship as reserved (the test scaffolding exists, with skip-on-
  v1 markers; tests activate when reserved providers ship).

## Alternatives considered

### Alternative 1 — Inline storage logic in the document-platform service layer

Rejected. Inlining `supabase_storage`-specific calls in
`documentService.create()` and `documentService.fetch()` works
for the v1 single-provider case but produces a refactor cliff
when SharePoint or S3 activate post-v1: every call site has to
fork on `storage_provider`, the failure-classification matrix
fragments across call sites, and the integrity-check policy
drifts. The abstraction at v1 is cheap (one interface, one
implementation); the abstraction at post-v1 is impossible
without breaking changes if it isn't there from the start. v1
pays a small surface cost to preserve a stable contract for the
post-v1 expansion.

### Alternative 2 — Single global storage provider with per-document storage_key only

Rejected. A schema without a per-document `storage_provider`
discriminator forces every document to live on the same
backend, which contradicts the reframe spec's §3.1 positioning
of SharePoint as opt-in-per-org. The discriminator is cheap
(one enum column) and unlocks the per-org and per-document
selection paths in items 2 and 14 without retrofit. v1's
single-active-provider state is a phase property, not a
schema property; the schema is shaped for the multi-provider
future from initial shipping.

### Alternative 3 — Synchronous drift detection on every fetch

Rejected. Fetching a document for preview would trigger a
hash-recompute on every read, which (a) doubles the read cost
(compute hash on top of fetch bytes), (b) serializes preview
rendering behind the verification, and (c) has no incremental
value for `supabase_storage` (the platform is the sole
writer; drift impossible by construction). Drift detection on
a scheduled cadence (post-v1) catches drift across all rows at
known intervals; on-demand verification through the
`Verify integrity` action handles forensic cases. Synchronous
drift on every read trades a known cost for a redundant safety
margin.

### Alternative 4 — One uniform retry policy across all failure types

Rejected. Retrying auth-invalid errors with the same
exponential backoff used for network timeouts produces useless
retries that delay the exception-queue routing. A retry on a
revoked OAuth token does not refresh the token; the failure is
persistent until a controller resolves it. The three-way
classification matrix (item 7) is the load-bearing distinction:
retry the cases where retry helps, route immediately the cases
where it doesn't.

### Alternative 5 — Per-org storage configurability in v1

Rejected. v1 has one provider (`supabase_storage`) and one
controller-and-founder customer. Per-org configurability of the
default provider, drift cadence, retry parameters, and preview
TTL adds an org-settings UI surface and a settings-evaluation
code path that v1 does not need. The schema reserves the
configurability columns at v1 (per ADR-0010 discipline; NOT
NULL DEFAULT to v1-fixed values) so the post-v1 unlock is a
loosened CHECK + a UI ship, not a schema migration. Per Q73's
narrow closure on storage portion, the v1 platform is
system-fixed for these knobs.

## Closes

This ADR closes the following Storage-Provider-scope question
from `docs/02_specs/open_questions.md`:

- **Q73 — Per-org Document Platform configuration (storage
  portion only).** Closed per items 2, 5, 8, and 12 above.
  Closure scope:
  - **Storage provider default.** v1: system-fixed
    `supabase_storage`. Per-org default storage provider is
    reserved for post-v1, in
    `org_settings.default_storage_provider`.
  - **Drift-detection cadence.** v1: not running (only active
    provider is exempt). Reserved post-v1 default: daily; per-org
    cadence configurability reserved in
    `org_settings.drift_detection_cadence`.
  - **Queue-and-retry parameters.** v1: system-fixed (max 3
    attempts, base 500ms, factor 2x, ±20% jitter, ~3.5s budget).
    Per-org configurability reserved post-v1 in
    `org_settings.storage_retry_*` columns.
  - **Controller-override path enablement.** v1: ships as a
    UI surface on the exception queue (inert in v1 since drift
    isn't running for the only active provider). Per-org
    enablement is post-v1 (controller-override is always
    available; what changes post-v1 is whether automation
    can route to it without manual review).
  - **Integrity-check policy.** v1: hash-verify-on-put
    mandatory for `supabase_storage`. Reserved-provider policy
    documented in each activation brief; native-guarantee-
    reliance reserved for post-v1.
  - **Preview/download URL TTL bound.** v1: default 5 minutes,
    upper bound 30 minutes (system-fixed). Per-org
    configurability reserved post-v1 in
    `org_settings.preview_url_default_ttl` /
    `org_settings.preview_url_max_ttl`.

  *Closure-venue rationale (for future ADR writers):* Q73
  closes in four pieces by four ADRs. ADR-0011 closed the
  platform-surface portion (which document types active, which
  resolution actions active, ProposedAttachment approval
  policy, Domain Boundary Map cut). ADR-0013 closes the
  storage-provider portion narrowly per the items above.
  ADR-0014 closes the OCR engine and retention portions.
  ADR-0019 closes the confidence threshold portion. Each ADR
  closes its own piece; the four narrow closures collectively
  resolve Q73's full decision space. A future contributor who
  wants to amend per-org storage configurability files an
  amendment to ADR-0013, not to ADR-0011 or ADR-0014.

## Forward-pointed (do NOT close in this ADR)

The following questions are storage-adjacent or are owned by
downstream ADRs; this ADR cites them but does not close them:

- **Q57** (Confidence calibration governance) → ADR-0019
  (Confidence Calibration Policy). Drift-detection exception
  thresholds may consume calibration policy when drift activates
  post-v1, but the calibration governance itself is ADR-0019's.
- **Q65** (Per-document-type classifier confidence thresholds) →
  ADR-0014 (Tier 2 Document Pipeline) for engine selection;
  ADR-0019 for thresholds.
- **Q69** (Replayability operational policy — when replays
  auto-supersede vs require explicit promotion) → ADR-0014.
  ADR-0013's §15 owns the storage-fetch contract under replay;
  ADR-0014 owns the replay-trigger semantics and policy.
- **Q70** (Idempotency at the OCR layer — dedup-by-hash) →
  ADR-0014. ADR-0013's item 10 specifies the post-dedup
  storage-provider selection; dedup itself is ADR-0014.
- **Q71** (Document-type classification strategy) → ADR-0014.
- **Q72** (AI fallback contract) → ADR-0014.

## Already closed by ADR-0011 (cited as cross-reference)

- Q53 (Document-type enum active/reserved subsets).
- Q54 (Document case lifecycle states).
- Q67 (Domain ownership: bank_transactions / card_transactions).
- Q68 (Exception queue UX and resolution-action enum).
- Q73 (platform-surface portion — document types, resolution
  actions, ProposedAttachment approval policy, Domain Boundary
  Map cut).
- Q75 (Document case source cardinality).
- Q76 (Re-evaluation policy: immutability vs supersession
  boundary).

## Already closed by ADR-0007 (cited as cross-reference)

- Q27 (CLAUDE.md §4 anti-hallucination wording for Tier 2 / Tier
  2.5 stages).
- Q28 (initial scope — Tier 2 → Tier 1 re-verification matrix
  framework).
- Q29 (Tier 2 boundary enforcement mechanism — ESLint rule).
- Q30 (Logic Receipt reproducibility — `pipeline_trace` field).
- Q31 (LLM-planned orchestration prohibition — verbatim rule).
- Q66 (Relationship Router tier placement — Tier 2.5).

## Updates

This ADR does not update any prior ADR or canonical doc. It
introduces a new contract (`storageProviderService`), a new
column set on `source_documents` /
`source_document_versions` (within the schema ADR-0011 §2
authorized at the discriminator level), and reserved
`org_settings.*` columns for post-v1 configurability per Q73
storage portion narrow closure. None of these modify a prior
ADR. ADR-0011 §2's schema is inherited verbatim per item 4;
ADR-0013 adds storage-layer columns under the same schema
ownership.

## Cross-references

- **ADR-0007** (`0007-three-tier-agent-architecture.md`) —
  carried prerequisite for all Tier 3 ADRs. ADR-0013 has no
  direct inheritance from ADR-0007 since storage operations are
  below the agent-tier boundary, but the Tier 2 / Tier 2.5 /
  Tier 1 framing applies indirectly: storage operations are a
  read/write infrastructure layer that any tier may touch
  through service calls; the tier framing is preserved by
  routing all storage I/O through `storageProviderService`.
- **ADR-0010** (`0010-reserved-enum-states.md`) — discipline
  applied to every closed enum this ADR introduces:
  `storage_provider` (carried from ADR-0011 §2),
  `capture_reason` on `source_document_versions`, drift-
  resolution-action values on the exception-queue resolution
  enum (extends ADR-0011 §13's enum), `storage_status` on
  `source_documents`, post-v1-reserved
  `org_settings.default_storage_provider` /
  `org_settings.drift_detection_cadence` /
  `org_settings.storage_retry_*` /
  `org_settings.preview_url_*` columns.
- **ADR-0011** (`0011-document-platform.md`) — the spine.
  ADR-0013 inherits §1 (entity ownership boundary), §2
  (`source_documents` schema with the original-anchor +
  current-pointer hybrid versioning model — verbatim, no
  redraft), §8 (Reading B preservation), §9 (lifecycle
  immutability rules), §13 (exception queue first-class
  deliverable — drift exceptions route here), §1 (audit-log
  writer boundary — canonical audit-log writer per
  INV-AUDIT-001), §Closes Q73 + Cross-references (forward-
  pointer to this ADR for storage-provider configurability
  portion of Q73).
- **ADR-0012** (`0012-proposed-mutation-bundle.md`) — parallel
  Tier 3. No inheritance for storage layer specifically; cited
  for completeness as the bundle envelope is platform-level
  handoff vocabulary that may carry storage-related metadata
  (born-paid bundles reference `source_document_id`s in
  ProposedAttachment children).
- **ADR-0014** (forthcoming, Tier 3 — `tier-2-document-pipeline.md`)
  — OCR engine choice, Python sidecar topology, language
  boundary, model versioning, rollback strategy. Q65 (per-type
  confidence thresholds), Q69 (replayability operational
  policy), Q70 (OCR-layer idempotency / dedup-by-hash), Q71
  (classification strategy), Q72 (AI fallback contract). ADR-0013
  forward-points the dedup-by-hash policy and the replay-trigger
  semantics here; ADR-0014's pipeline implementer integrates
  against `storageProviderService` per items 1, 3, 5, 9, 12.
- **ADR-0015** (forthcoming, Tier 4 — `ap-spend-subdomain.md`) —
  AP/Spend domain rules; bill / payment / prepayment / credit
  lifecycles. No direct storage-layer interaction (the domain
  service consumes proposals; storage I/O is below the domain
  boundary). Cited for cross-domain protocol completeness.
- **ADR-0016** (forthcoming, Tier 4 —
  `document-relationship-graph.md`) — full `linked_entity_type`
  and `link_role` enum membership. ADR-0013's controller-override
  path produces `link_role = 'superseded_source'` rows when the
  prior version's bytes remain evidentially relevant; ADR-0016
  owns the link_role enum.
- **ADR-0017** (forthcoming, Tier 4 — vendor template substrate
  reservation) — no storage-layer interaction. Cited for
  Phase 0 completeness.
- **ADR-0018** (forthcoming, Tier 5 — `relationship-router.md`)
  — Drift exceptions in the exception queue may trigger Router
  re-evaluation post-resolution per Q56 / Q76, but ADR-0013
  does not specify those triggers; the trigger semantics are
  ADR-0018's.
- **ADR-0019** (forthcoming, Tier 6 —
  `confidence-calibration-policy.md`) — confidence thresholds
  for drift-classification severity (post-v1). v1's drift
  classification thresholds are system-fixed and inert per item
  6; post-v1 calibration governance lives in ADR-0019.
- **`docs/02_specs/intent_model.md`** — `ProposedMutation` shape
  (§3) and the Four Questions grammar (§5). Drift-resolution
  proposals (controller-override path) flow through the
  Four Questions when surfaced in the exception queue UI; the
  proposal payload identifies the document and the version
  delta but does not produce a ledger operation directly.
- **`docs/02_specs/ledger_truth_model.md`** — Service
  Communication Rules. Specifically Rule 1 (typed input
  schemas), Rule 4 (no free-form data at the boundary — storage
  errors emit typed codes, not free-form messages), and Rule 5
  (trace_id on every call — every storage operation propagates
  trace_id through ServiceContext into structured logs and
  audit rows).
- **`docs/02_specs/mutation_lifecycle.md`** — six canonical
  states (Pending, Needs Attention, Approved, Posted (auto),
  Posted (manual), Finalized) plus terminal Rejected and
  Rejected-with-reversal. Drift-resolution proposals that flow
  to the exception queue and are resolved by a controller flow
  through these canonical states (the controller's resolution
  produces a ProposedMutation or a ProposedAttachment as
  appropriate).
- **`docs/02_specs/agent_autonomy_model.md`** §6 — the System
  ceiling concept. Storage-provider operations do not directly
  touch the System ceiling list; the controller-override path
  is human-only authority by construction (an exception-queue
  resolution requires a controller user clicking Approve), so
  the System-ceiling rule for vendor bank-detail changes (per
  reframe spec §15; pending registration in
  `agent_autonomy_model.md` §6) does not interact with
  ADR-0013's contract.
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`**
  — the canonical 21-section design spec. ADR-0013 inherits
  decisions from §3.1 (Storage / Evidence Core scope and
  `storage_provider` discriminator), §6 (polymorphic
  source_document_links — drift-resolution emits
  `superseded_source` link_role rows), §10 (exception queue —
  drift exceptions and provider-unavailable exceptions route
  here), §15 (receipt v1 path — affects which document types v1
  ingests through `supabase_storage`; storage layer is provider-
  agnostic on document type), §16 (lifecycle immutability rules
  — inherited by storage-layer immutability per item 15).
- **`docs/02_specs/open_questions.md`** — Q73 (storage-portion
  narrow closure here); Q57, Q65, Q69, Q70, Q71, Q72
  (forward-pointed); Q53, Q54, Q67, Q68, Q73 (platform-surface),
  Q75, Q76 (already closed by ADR-0011); Q27, Q28, Q29, Q30,
  Q31, Q66 (already closed by ADR-0007). The reframe spec §7's
  reference to "Q47, Q52" closing in the Storage Provider ADR is
  a stale reference — those question numbers were retired with
  the Q35–Q52 supersession (per `open_questions.md` line 737)
  and never filed against Storage Provider scope. ADR-0013 does
  **not** close Q47 or Q52. (See Notes for future ADR writers.)

## Notes for future ADR writers

- **Reframe spec §7's "Q47, Q52" entry for the Storage Provider
  ADR is stale and must not be honored.** The Q35–Q52 range was
  reserved by the original AP Ingestion Initiative brief
  (2026-05-01) and superseded by the Document Platform reframe
  (2026-05-02). Per the supersession note in
  `docs/02_specs/open_questions.md` (line 737), Q35–Q52 are
  retired and will not be reused. The reframe spec's ADR table
  in §7 was authored before the supersession and was not
  updated when the supersession landed; the Q47 / Q52
  references in the Storage Provider row of that table point at
  question numbers that never existed in the post-reframe
  question index. ADR-0013 closes only the storage-provider /
  storage-configurability portion of **Q73**, following ADR-0011's
  Q73 forward-pointer (ADR-0011 §Closes Q73 narrow closure +
  Cross-references entry that delegates the storage-
  configurability portion of Q73 to ADR-0013). The reframe
  spec §7 stale reference is a known drift to be addressed in
  Session 2B closeout (alongside the bank-detail amendment
  brief and the Q66 hygiene gap). ADR-0013 does NOT amend the
  reframe spec from this ADR.

- **The four-piece Q73 closure pattern is intentional, not
  accidental.** Q73 spans storage provider, OCR provider,
  retention policy, language packs, and confidence thresholds.
  Each of these is a distinct surface owned by a distinct ADR:
  storage provider in ADR-0013, OCR engine and retention in
  ADR-0014, language packs in ADR-0014 (engine selection
  surface), confidence thresholds in ADR-0019, and the
  platform-surface portion (document types, resolution actions,
  approval policy, Domain Boundary Map) in ADR-0011. Each ADR
  closes its own piece narrowly. A future contributor who
  attempts a single-ADR full closure of Q73 is misframing the
  question — the question's full decision space is a union of
  surfaces, not a single decision. The Closes section's
  Closure-venue rationale documents the pattern; future
  amendments that affect any one piece should amend the
  ADR that owns that piece.

- **`supabase_storage` exempt-from-drift-detection rationale.**
  The exemption (item 5) is by-construction, not policy. The
  platform is the sole writer of Supabase Storage paths under
  its RLS-scope: the `org_{org_id}/sources/...` path is
  inaccessible to any code outside the platform's service role,
  no RLS-permitted code path mutates these bytes, and Supabase
  Storage itself does not have a lifecycle-policy mechanism
  that mutates bytes (unlike S3's bucket lifecycle). Drift is
  impossible by construction. A future contributor who adds
  drift cycles for `supabase_storage` defensively is
  introducing wasted work; the right action if Supabase
  introduces a lifecycle mechanism is to revisit the exemption,
  not to preemptively run drift on every row daily.

- **The `storage_provider` discriminator's role as the
  swap-target boundary.** Post-v1 multi-provider orgs swap
  storage providers without re-extracting (the per-document
  `storage_provider` value tags which backend holds the bytes;
  fetch resolution per item 3 reads the tag and dispatches).
  The OCR engine is a separate swap-target behind
  `document_artifacts` per ADR-0014 — it tags artifacts with
  the engine that produced them and lets a re-extraction
  produce new artifact rows under a different engine. The two
  swap-target boundaries are orthogonal: changing the storage
  provider does not invalidate prior OCR artifacts (they
  reference the bytes by content_hash, not by storage_key);
  changing the OCR engine does not invalidate the storage
  layout. A future contributor who collapses the two into a
  single "ingestion engine" abstraction is fusing concerns
  that move on different timescales (storage providers swap
  per-org or per-channel; OCR engines swap per-version-bump or
  per-language); the orthogonality is load-bearing.

- **Provider-unavailable as a distinct flow from
  queue-and-retry.** The failure-classification matrix (item 7)
  is the load-bearing distinction. A future contributor
  encountering "OAuth token expired" who retries with
  exponential backoff is reintroducing the failure mode the
  matrix prevents — retry helps for transient timeouts,
  retries waste time on persistent auth failures. The matrix
  has three explicit categories and the routing for each
  category is mechanical: transient-retryable retries per item
  8; provider-unavailable routes to exception queue
  immediately; permanent-malformed fails fast. Adding a fourth
  category, or merging two, requires re-evaluating the routing
  for every implementation; the three-way split is the minimum
  expressive matrix that distinguishes "retry helps" from
  "retry hurts."

- **v1's `supabase_storage` exemption produces a curious
  property: most of ADR-0013's machinery is implemented but
  inert.** Drift detection ships with controller-trigger UI
  but no scheduled job; the exception queue's
  drift-resolution actions ship as reserved enum values; the
  `storage_status` enum has eight values with only two active
  in v1; the per-org `org_settings.*` configurability columns
  ship with NOT NULL DEFAULT to v1-fixed values. A future
  contributor scoping the v1 implementation work may be
  tempted to defer the inert pieces — "we'll add drift cycles
  when we ship SharePoint" — but the schema-level pieces (the
  enum members, the columns, the Layer 1 / Layer 2 / Layer 3
  defenses) ship at v1 per ADR-0010 reserved-enum-states
  discipline. The runtime pieces (the scheduled job, the
  Supabase-RLS-aware activation logic for reserved providers)
  are the only deferrable surface. Confusing the two surfaces
  produces the schema-migration cliff that ADR-0010 is
  designed to avoid.
