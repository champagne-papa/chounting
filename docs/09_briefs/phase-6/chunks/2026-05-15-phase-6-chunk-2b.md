# Phase 6 Chunk 6.2b — Drag-Drop End-to-End (Path C second half)

- **Date**: 2026-05-15
- **Phase**: 6 (Ingestion)
- **Chunk**: 6.2b (drag-drop end-to-end half of Path C invocation;
  chunk 6.2a shipped substrate-consumer-conformance at `c6a7159`;
  chunk 6.3 ships forwarded_mailbox + Phase 6 retrospective)
- **Status**: brief-drafting (writing-plans session 2026-05-15;
  brainstorming session preceded at this same date)
- **Brainstorming session**: this session walked the 8 sub-questions
  deferred from chunk 6.2a brief §"Sub-Q deferrals" (Sub-Q1 / Sub-Q2 /
  Sub-Q3 / Sub-Q6 / Sub-Q7 / Sub-Q8 / Sub-Q9 + Sub-Q10 NEW route-
  convention). All 8 locked at brainstorming via verify-from-disk
  five-grain discipline. Three drift items from handoff surfaced and
  acknowledged (route count 39-of-50 vs 28-of-30 cited; brainstorming-
  round vocabulary leak; sentinel-batch dual-origin test coverage).

## Path C second-half context

Chunk 6.2a's brief (`docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-2a.md`)
codifies the Path C invocation rationale (RI-7 evidence-driven,
prospective at brief-draft, F-J-14 second-instance graduation per
observation-grain N=2). Chunk 6.2b inherits that invocation; does
NOT re-invoke. Per the brief-grain `Na`/`Nb` suffix convention
codified at chunk 6.2a, this brief is the second of two files
covering one Path C split.

**Single commit at chunk 6.2b per Path C precedent** — service +
routes + Zod schemas + UI components + new tests bundle at a
single commit boundary; full-suite validation gate green at that
commit. The chunk 6.2a precedent is direct (chunk 6.2a shipped 715
net LOC at single commit `c6a7159` against forecast 700-1100).

Chunk 6.2b volume forecast: ~785-1185 LOC (chunk 6.2a recalibrated
the original ~1000-1200 forecast downward per chunk 6.2a close
memory note; LOC inheritance from chunk 6.2a's lower-bound delivery
suggests chunk 6.2b's lower bound may also surprise downward).
Wiring-with-tests-pairing applies at this single commit boundary.

## Sub-Q resolutions

The 8 sub-questions deferred from chunk 6.2a lock here at verify-
from-disk five-grain discipline (RI-6 four grains + Grain 5
existing-consumer-contract-conformance from chunk 6.1 codification).
Each lock includes the rejected-options rationale.

### Sub-Q1 — Drag-drop UX surface = canvas-only

**Lock**: Canvas-only. New `DocumentIntakeRail` component lives on
the canvas surface as the vertical intake affordance per PRD Phase 2
vision (`docs/01_prd/triage_bucket_intake.md`:3 — "vertical intake
rail on the far right of the canvas"). Single UI component, single
screenshot-gate surface.

**Rejected — chat-only**: Would force a workflow primitive (file
intake) into a dialogue surface (`AgentChatPanel` 380px sidebar).
Conflicts with chat-surface-as-conversation framing. Smallest UX
change but wrong semantic placement.

**Rejected — both surfaces**: 2 components, doubled screenshot-gate
surface, doubled test surface. No v1 user-need driving the broader
footprint. Forward-pointer if chunk 6.3 forwarded_mailbox UX or
post-v1 usage patterns surface need for chat-surface intake.

**Forward-flag for Phase 6 retrospective**: If chunk 6.3
forwarded_mailbox UX surfaces different drag-drop affordances (e.g.,
operator wants to "drag email into bucket"), revisit canvas-only
lock. Currently single-finding-scale at chunk 6.2b grain.

**Five-grain evidence**: 31 existing canvas-view components form
pattern-consistency basis (Grain 1 + Grain 2). `ContextualCanvas`
dispatcher hosts canvas views (Grain 4 integration site). Zero
existing drag-drop UI in the codebase (Grain 5 scan returns zero;
zero-count IS evidence basis per chunk 6.1 / 6.2a codification).

### Sub-Q2.1 — Cards display columns = minimum + channel_metadata

**Lock**: Minimum-viable columns at chunk 6.2b: `case_id`, `state`,
`source_document_id` (1:1 at Phase 6), `original_filename` (from
`source_documents`), `ingest_batch_id`, `channel_metadata` (from
`ingest_batches`; carries `drop_session_id` at chunk 6.2b and
`sender_address` at chunk 6.3), `received_at` (from `ingest_batches`),
`created_at` (case creation).

**Rejected — extended columns** (`document_type`,
`classification_confidence`): Phase 7 writes these post-
classification. At chunk 6.2b ship, these columns are NULL for
every row the cards endpoint returns. Including them in the v1
shape would surface "always-NULL" columns until Phase 7 — substrate
leak into v1 read surface. Phase 7 brief extends cards endpoint to
include these when classification writes them.

**Five-grain evidence**: Card columns adjudicated against
`document_cases` schema (Grain 1) + `source_documents` schema +
`ingest_batches` schema. Existing card-shaped components
(`ProposedEntryCard`, `PaymentApprovalCard`, `RecordPaymentCard`,
`BillReverseCard`) use Tailwind classes + props pattern (Grain 2).

### Sub-Q2.2 — Sentinel-batch filter strategy = α (filter at endpoint)

**Lock**: SQL filter at cards endpoint excludes sentinel-batch-
referencing rows. Filter expression:
`WHERE NOT (ingest_batches.channel_metadata @> '{"sentinel": true}'::jsonb)`.
**Symmetric filter discipline** — the same JSONB containment
expression appears at both Layer 2 (Zod ingress rejection;
ingestionService refuses incoming `channel_metadata` matching
sentinel shape) and at the read boundary (cards endpoint SQL).
Single source-of-truth for "what shape is sentinel."

**Rejected — β (display with sentinel indicator)**: Substrate
vocabulary ("Pre-Phase-6 historical document") leaking into user-
facing UI badge. Sentinel batches are migration artifacts, not user
ingestion events; surfacing them in operator workflow views adds
semantic noise. Operators would need to learn that some documents
are substrate artifacts — UX teaching about substrate state.

**Rejected — γ (post-v1 problem)**: 75 m152 sentinel-backed rows +
~76 m153 sentinel-backed rows ≈ 151 rows would be immediately
visible at chunk 6.2b ship with no meaningful drop_session_id /
sender_address (sentinel `channel_metadata` has `migration` +
`purpose` keys, not channel-event keys). Cards endpoint immediately
wrong for any operator who opens it pre-first-real-ingestion.

**Forward-pointer**: Hypothetical post-v1 "show me historical
ingestion inventory including migration artifacts" view would be
a separate read endpoint with its own UX. Not v1 scope.

**Five-grain evidence**: Both m152 sentinel shape
(`{"sentinel": true, "migration": 152, "purpose": "..."}`) and m153
sentinel shape (`{"sentinel": true, "migration": 153, "purpose": "..."}`)
match the containment filter — shape-based, not migration-numbered
(Grain 1). Test plan requires fixtures from both origins (Drift 3
acknowledgment; narrow-filter regression to `{"sentinel": true,
"migration": 152}` would silently pass single-migration tests while
breaking m153 coverage). Grain 4 (symmetric filter discipline)
documented above.

### Sub-Q3 — Multipart shape = (a) multi-file POST, no explicit cap at v1

**Lock**: Single multipart POST carries N files; chunk 6.1 RPC's
`p_documents` JSONB array atomicity handles N rows transactionally.
Uses Next.js native `Request.formData()` (no external library —
first multipart parser in the codebase). **No explicit application-
layer cap at v1 (Next.js body limits apply as implicit fallback)**;
typical drag-drop is 1-20 files, well within platform body limits.

**Rejected — (b) multi-file with cap (N ≤ 10)**: Premature
optimization for an abuse case that may never surface. Adds UI-
layer rejection path. Body-size constraints already enforced at the
platform layer (Next.js / Vercel default body limits ~4-5MB
depending on config). If abuse surfaces post-v1, cap can be added
without breaking existing UX.

**Rejected — (c) single-file POST × N submissions**: Directly
violates submission-envelope semantic (one batch per submission
event, locked at plan-doc lines 139-156). 5 user drops → 5 separate
batches via 5 POSTs. Wastes chunk 6.1 RPC's N-row atomicity. User
retry friction increases (partial drop completion at the user
grain).

**Five-grain evidence**: Plan-doc per-channel write composition
(lines 139-156) explicitly assumes N-file events per drag-drop
event (Grain 1 + Grain 2). Chunk 6.1 RPC supports `p_documents`
JSONB array atomically (Grain 4). Zero existing multipart consumers
(Grain 5 scan returns zero; first instance).

### Sub-Q6 — Storage integration = sequential `put()` per file before RPC

**Lock**: ingestionService dispatches N sequential
`storageProviderService.put(input, ctx)` calls per drag-drop event,
collecting `{storage_key, content_hash, byte_size, provider}` from
each. After all N puts succeed, ingestionService composes the
chunk 6.1 RPC payload (`p_batch + p_documents + p_cases +
p_case_sources [empty] + p_jobs + p_audit`) and invokes the RPC in
a single call. `put()` already computes content_hash pre-write and
re-verifies post-write per ADR-0013 §9 integrity-check; chunk 6.2b
adds no integrity logic on top.

**Rejected — putBatch**: Method doesn't exist on the
`StorageProvider` interface (per
`apps/web/src/services/storage/storageProviderService.ts` verify-
from-disk). Adding it would extend the interface for chunk 6.2b's
benefit only — Phase 7 batch ingestion (if any) is the next
hypothetical consumer and Phase 7 may have different access
patterns. YAGNI at chunk 6.2b grain.

**Rejected — parallel Promise.all**: Optimizes for the wrong axis
at v1. Drag-drop with 5 files at typical PDF sizes (1-10MB) is ~5s
of storage put latency total; parallelism adds error-handling
complexity (partial Promise.all completion semantics) for a use
case that doesn't need throughput optimization. Phase 7 may revisit
if batch ingestion paths surface that need throughput.

**Five-grain evidence**: `storageProviderService` interface contract
(Grain 1) — put / fetch / fetchVersion / previewUrl / delete /
verifyIntegrity exposed; no putBatch. `storageProviderService` NOT
wrapped in `withInvariants()` per ADR-0013 §1 verbatim (data-access
layer; emits typed ServiceError per Service Communication Rule 5).
The orphan-blob risk is v1-accepted per ADR-0013 §1 (Grain 4
contract).

### Sub-Q7 — Dedup-by-hash = deferred to Phase 7 (no short-circuit at v1)

**Lock**: Chunk 6.2b drag-drop path computes `content_hash` at
storage put per ADR-0013 §9 (integrity-verify at write — the hash
already gets computed; nothing added) but **does NOT short-circuit
on duplicate hash at v1**. Duplicate-content drag-drops produce
duplicate `source_documents` rows; Phase 7 Stage 0 owns the dedup-
by-hash idempotency check per plan-doc explicit deferral ("Phase 6
defers: dedup (Phase 7 Stage 0)").

**ADR-0014 §6 wording ambiguity flagged**: §6 says "Before writing
a new source_document row, the ingestion path computes SHA-256 of
the bytes and checks for an existing
source_documents.original_content_hash match" — literal reading
puts dedup at Phase 6 ingestion. But §6 also says "The check fires
at the OCR-pipeline ingest stage" — which is Phase 7 territory.
Plan-doc precedent ("Phase 6 defers: dedup (Phase 7 Stage 0)")
overrides the literal ADR-0014 §6 reading. Codify as Flag 14 at
Phase 6 retrospective for ADR-0014 §6 wording clarification.

**Five-grain evidence**: ADR-0014 §6 verbatim (Grain 1). Plan-doc
explicit deferral (Grain 2). Storage put's integrity-verify already
computes content_hash (no marginal cost to compute it; no marginal
benefit at Phase 6 because no consumer reads it for dedup) (Grain
4).

### Sub-Q8 — trace_id propagation = single trace_id across batch

**Lock**: Route handler calls `buildServiceContext(req)` at request
entry (`apps/web/src/services/middleware/serviceContext.ts:64`
generates `trace_id = crypto.randomUUID()`). ServiceContext
propagates through `ingestionService.handleDragDropUpload` →
N sequential `storageProviderService.put` calls (each receives
`ctx`) → `create_ingest_batch_with_documents_with_audit` RPC
(`p_batch.trace_id = ctx.trace_id`) → `audit_log.trace_id` (single
audit row at batch grain per chunk 6.1 INV-AUDIT-001 lock).
**Single trace_id across the entire drag-drop event's 1 batch + N
source_documents + N cases + N jobs + 1 audit row.**

**Five-grain evidence**: `buildServiceContext()` is the centralized
trace_id construction site (Grain 1). Service Communication Rule 5
(`docs/02_specs/ledger_truth_model.md`:4011-4084) is the canonical
discipline. Chunk 6.1 RPC accepts `trace_id` in `p_batch` JSONB
(Grain 1 verified). Grain 5 prospective scan: zero existing
consumers of ingestionService (it doesn't exist yet); scan
returning zero IS evidence basis per chunk 6.2a precedent.

### Sub-Q9 — Partial-failure = (a) all-or-nothing + Zod pre-validate at ingress

**Lock**: Zod-validates all N files at ingestionService entry (MIME
type whitelist, size, channel_metadata not sentinel). If any file
fails validation, reject entire batch at Zod with typed
ServiceError. After Zod-validation passes, N sequential
`storageProviderService.put` calls (per Sub-Q6 lock); if any
storage put fails mid-batch, throw ServiceError; orphans from
successful prior puts cleaned by ADR-0014 §10 GC (daily cadence,
24-hour threshold). RPC call is atomic across all N rows; if RPC
fails (FK miss, constraint violation, deadlock), all N storage
puts orphan for GC. Route handler returns **single ServiceError →
mapped status code** (matches all 50 existing routes' uniform
error contract).

**Rejected — (b) partial-batch**: Breaks chunk 6.1 RPC atomicity
(would require splitting RPC call OR calling RPC with subset of N
rows); breaks Sub-Q3 submission-envelope semantic (failed retries
produce additional batches — one user submission event becomes
multiple ingest_batches rows); breaks uniform single-outcome error
contract across the 50-route precedent (chunks 6.3 / Phase 7 /
Phase 8 would inherit ambiguity about whether to use partial or
single-outcome error shape).

**Rejected — (c) pure all-or-nothing without Zod pre-validate**:
Equivalent end-state to (a) but worse failure shape — storage-
layer rejection for trivially-invalid input (bad MIME, oversized)
that Zod could catch at the cheap layer.

**R1 mitigation (task-plan requirement)**: When storage put fails
mid-batch, the thrown ServiceError MUST carry `details` specifying
which file (index + filename) failed and at which stage (Zod /
storage put / RPC). Route handler error response surfaces this
explicitly. Example: `{ error: 'STORAGE_OPERATION_FAILED',
message: 'Storage write failed for file 3 of 5 (invoice-q1.pdf)',
details: { file_index: 2, filename: 'invoice-q1.pdf', stage:
'storage_put' } }`. Without this, user can't disambiguate which
file caused the batch to abort. **This is a task-plan requirement,
not an implementation detail.**

**R3 awareness (execution-session flag — NOT something to "fix")**:
Per Sub-Q8 single-trace_id lock, a failed batch's trace_id appears
in ServiceError + pino logs + `orphan_blob_collected` audit events
(when GC eventually runs) but in NO business-grain rows
(ingest_batches / source_documents / document_cases / document_jobs
all rolled back). Forensic queries "what happened with trace_id X?"
return error + audit events with no business-row anchors. **This
is correct shape per Service Communication Rule 5 (trace_id
presence in error + audit is what matters). The implementing agent
must NOT "fix" this by adding business-grain anchors for failed
batches** — doing so would write rows for failed events,
contradicting the all-or-nothing lock.

**Future-extensibility note**: If post-v1 evidence surfaces user
friction concentrated on partial-batch retry, additive migration
path is available — future chunk adds optional `?partial=true`
query param routing to a partial-batch handler. No breaking change.
Reverse direction (ship (b), retract to (a)) would be breaking.

**Five-grain evidence**: ADR-0013 §1 (orphan-blob acceptance) +
ADR-0014 §10 (GC cleanup) + chunk 6.1 RPC atomicity (Grain 1).
50-route uniform-error-contract precedent (Grain 5). The Sub-Q3 ↔
Sub-Q9 cross-Sub-Q dependency (Grain 4 idempotency cross-check)
codified as Flag 15 for Phase 6 retrospective.

### Sub-Q10 — Route-path convention = org-scoped per 39-of-50 disk evidence

**Lock**: All three chunk 6.2b route handlers are org-scoped:
- `POST /api/orgs/[orgId]/documents/ingest/drag-drop`
- `GET /api/orgs/[orgId]/documents/cases?ingest_batch_id=X`
- `GET /api/orgs/[orgId]/documents/cases/[caseId]`

**Disk evidence**: 39 of 50 existing routes under
`apps/web/src/app/api/` are org-scoped (path starts with
`orgs/[orgId]/`). The 11 non-org-scoped exceptions are:
- `agent/{confirm,conversation,message,reject}` (agent surfaces —
  cross-org single agent context)
- `auth/{me,mfa-status}` (per-user, cross-org)
- `health` (platform health check)
- `industries`, `tax-codes` (authenticated cross-org read of
  reference data)
- `invitations/accept` (public invitation acceptance flow)
- `org` (org bootstrap creation — no orgId yet)

None of these exceptions describe a document-ingestion analog;
chunk 6.2b routes fit the org-scoped majority cleanly. **Drift 1
correction**: handoff cited "28-of-30" from chunk 6.2a evidence;
actual current state is 39-of-50. Convention shape unchanged; larger
evidence base strengthens the lock. Not an RI candidate.

**Five-grain evidence**: 39-of-50 distribution (Grain 1). RLS
verification at route handler — `orgId` param must match
authenticated user's accessible orgs (Grain 4); this is invariant-3
withInvariants enforcement per existing route convention.

## Architecture

**Single commit at chunk 6.2b** per Path C precedent — service +
routes + Zod schemas + UI components + new tests bundle at a single
commit boundary; full-suite validation gate green at that commit.

| File | Action | Responsibility |
|---|---|---|
| `apps/web/src/services/document-platform/ingestionService.ts` | Create | New service file. Exports `ingestionService` object with `handleDragDropUpload(input, ctx)` method (Pattern B external-wrap variant; method body has no `withInvariants` reference — route handler wraps via `withInvariants(action, () => ingestionService.handleDragDropUpload(...))`). File-top comment block cites ADR-0011 §1 entity ownership + chunk 6.1 RPC + chunk 6.2a Step C/D activation as inherited context + forward-points chunk 6.3 `handleForwardedMailbox` extension. |
| `apps/web/src/services/document-platform/types.ts` | Modify | Add `DragDropUploadInput` interface (org_id, files: `DragDropFileInput[]`, created_by) + `DragDropFileInput` interface (bytes, mime_type, original_filename, drop_session_id) + `DragDropUploadResult` interface (ingest_batch_id, document_count: number). |
| `apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts` | Create | New Zod schema file. Exports `IngestBatchChannelMetadataSchema` (discriminated union: `drag_drop_pdf` variant carries `drop_session_id` + reserved slot for chunk 6.3's `forwarded_mailbox` branch via forward-pointer comment) + `DragDropUploadInputSchema` (validates input shape; rejects sentinel `@> {"sentinel": true}` via Layer 2 invariant) + `CardListResultSchema` + `CardDetailResultSchema`. |
| `apps/web/src/app/api/orgs/[orgId]/documents/ingest/drag-drop/route.ts` | Create | POST handler. Parses multipart via Next.js native `Request.formData()`; constructs `DragDropUploadInput`; calls `withInvariants` wrapper; returns 201 with `{ ingest_batch_id, document_count }` on success; error per Sub-Q9 R1 mitigation (`ServiceError.details.file_index + filename + stage` when failure isolates to a file). |
| `apps/web/src/app/api/orgs/[orgId]/documents/cases/route.ts` | Create | GET handler. Query params: `ingest_batch_id` (required at v1 chunk-6.2b scope). Returns `CardListResult` (array of cards with Sub-Q2.1 columns). SQL applies symmetric sentinel filter per Sub-Q2.2. No `withInvariants` (read endpoint per ledger_truth_model.md Rule 2 + existing read-side convention). |
| `apps/web/src/app/api/orgs/[orgId]/documents/cases/[caseId]/route.ts` | Create | GET handler. Returns `CardDetailResult` — case row + source_documents (1:1 at Phase 6) + ingest_batches row for full context. No `withInvariants` (read). |
| `apps/web/src/components/canvas/DocumentIntakeRail.tsx` | Create | New canvas component. Vertical intake rail (per PRD Phase 2 vision); contains drag-drop zone (first drag-drop UI in the codebase — uses native HTML `onDragOver` / `onDrop` events, no external library); on drop, POSTs to drag-drop route handler; on success, refreshes cards list. Renders empty-state when no batch active. Tailwind classes per existing canvas-component convention. |
| `apps/web/src/components/canvas/DocumentCard.tsx` | Create | New per-document card component. Renders Sub-Q2.1 columns. Props: `card: DocumentCardData`. Tailwind classes (mirrors `ProposedEntryCard` styling — rounded border, padding, shadow). |
| `apps/web/src/components/bridge/ContextualCanvas.tsx` | Modify | Wire `DocumentIntakeRail` as a child component (likely rendered alongside the existing view-router or as a sidecar pane per the "vertical intake rail on the far right" PRD framing). Exact integration shape adjudicated at Task 8 verify-at-implementation. |
| `apps/web/tests/integration/ingestionService.dragDropUpload.integration.test.ts` | Create | Integration tests for service-layer drag-drop composition. |
| `apps/web/tests/integration/dragDropRoute.integration.test.ts` | Create | Route handler integration tests — multipart parsing, Zod validation, ServiceContext construction, RLS. |
| `apps/web/tests/integration/documentCasesRead.integration.test.ts` | Create | Cards endpoint integration tests — list-by-batch + case-detail + sentinel filter (both m152-shape and m153-shape fixtures) + cross-org RLS. |
| `apps/web/tests/unit/DocumentIntakeRail.test.tsx` | Create | Component render + drag-drop event handling unit test. |
| `apps/web/tests/unit/DocumentCard.test.tsx` | Create | Component render unit test. |
| `docs/07_governance/friction-journal.md` | Modify (at chunk close) | Pre-drafted (D)-filter entries — see Friction-journal placeholder section. Flag 13 (tier-1, chunk close); Flag 14 + Flag 15 (Phase 6 retrospective forward-pointers); first-instance precedents for multipart parser + drag-drop UI. |

### Service surface — `ingestionService.handleDragDropUpload`

Pattern B external-wrap per Phase 5 spend brief precedent. The
service body has no `withInvariants` reference; the route handler
wraps via `withInvariants(action, () => ingestionService.handleDragDropUpload(...))`.

`apps/web/src/services/document-platform/ingestionService.ts`:

```typescript
// src/services/document-platform/ingestionService.ts
//
// INV-SERVICE-001 wrap-site discipline: ingestionService methods
// are Pattern B external-wrap (Phase 5 spend brief precedent). The
// service body has no withInvariants reference; route handlers wrap
// at the call site via withInvariants(action, () =>
// ingestionService.handleDragDropUpload(...)).
//
// INV-SERVICE-002 adminClient discipline: every database access in
// this file goes through `adminClient()` from `@/db/adminClient`.
// No userClient import; no direct supabase-js client construction.
//
// Per ADR-0020 authority gradient: Layer 2 (services) domain
// service. Allowed import targets: core, db, contracts, shared,
// services (same-layer). NOT allowed: agent, app, React.
//
// =============================================================
// Entity ownership (ADR-0011 §1)
//
// ingestionService is the writer for ingest_batches +
// source_documents + document_cases + document_jobs at Phase 6.
// Composes storageProviderService.put() (per-file bytes I/O) and
// create_ingest_batch_with_documents_with_audit RPC (atomic
// substrate write) per chunk 6.1 + chunk 6.2a contract.
//
// Method surface at chunk 6.2b:
//   - handleDragDropUpload(input, ctx) — drag-drop entry point
//
// Method surface at chunk 6.3 (forward-pointer):
//   - handleForwardedMailbox(input, ctx) — mail webhook entry
//
// Composition shape per plan-doc lines 139-156:
//   1 ingest_batches row
//   N source_documents rows
//   N document_cases rows (state='received')
//   0 document_case_sources rows (Phase 7 writes primary post-
//     classification; drag-drop has no email_body analog)
//   N document_jobs rows (state='queued')
//   1 audit_log row at batch grain
//
// =============================================================
// Sub-Q9 all-or-nothing + Zod pre-validate at ingress
//
// Flow:
//   1. Zod-validate all N files at ingress (Layer 2 boundary).
//      Sentinel-shape rejection at this layer per Sub-Q2.2
//      symmetric-filter discipline. If any file fails Zod, reject
//      entire batch with typed ServiceError; ServiceError.details
//      carries file_index + filename + reason.
//   2. Sequential storageProviderService.put() per file. Each put
//      computes content_hash pre-write, writes bytes, re-verifies
//      post-write per ADR-0013 §9. Collect PutResult per file. If
//      any put fails mid-batch, throw ServiceError with details
//      (file_index + filename + stage='storage_put'); orphans from
//      successful prior puts remain for ADR-0014 §10 GC.
//   3. Compose RPC payload (p_batch + p_documents + p_cases +
//      p_case_sources [empty array] + p_jobs + p_audit).
//   4. Single create_ingest_batch_with_documents_with_audit RPC
//      call. RPC executes atomically across all 5 tables. If RPC
//      fails, all N storage puts orphan for GC; throw ServiceError
//      with stage='rpc'.
//   5. Return DragDropUploadResult {ingest_batch_id, document_count}.
//
// Sub-Q8 single-trace_id discipline: ctx.trace_id propagates
// unchanged through put() calls (passed as PutInput.trace_id or
// implicit via ctx) AND into p_batch.trace_id at RPC call. Single
// trace_id across batch + N source_documents + N cases + N jobs +
// 1 audit row.
// =============================================================

import { z } from 'zod';
import { adminClient } from '@/db/adminClient';
import { storageProviderService } from '@/services/storage/storageProviderService';
import { getStorageProvider } from '@/services/storage/storageProviderResolver';
import { loggerWith } from '@/services/log/logger';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import {
  DragDropUploadInputSchema,
  IngestBatchChannelMetadataSchema,
} from '@/shared/schemas/document-platform/ingestBatch.schema';
import type {
  DragDropUploadInput,
  DragDropUploadResult,
} from '@/services/document-platform/types';

const V1_STORAGE_PROVIDER = 'supabase_storage' as const;

async function handleDragDropUploadImpl(
  input: DragDropUploadInput,
  ctx: ServiceContext,
): Promise<DragDropUploadResult> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id,
    org_id: input.org_id,
  });

  // Step 1: Zod-validate at ingress (Layer 2 boundary). Sentinel-
  // shape rejection here is the symmetric write-side filter per
  // Sub-Q2.2.
  const parsed = DragDropUploadInputSchema.parse(input);

  log.info(
    { file_count: parsed.files.length, drop_session_id: parsed.drop_session_id },
    'ingestionService.handleDragDropUpload: validated',
  );

  // Step 2: Sequential storage put per file. Collect PutResult.
  const storageProvider = getStorageProvider(V1_STORAGE_PROVIDER);
  const putResults: Array<{
    source_document_id: string;
    filename: string;
    storage_key: string;
    content_hash: string;
    byte_size: number;
  }> = [];

  for (let i = 0; i < parsed.files.length; i++) {
    const file = parsed.files[i];
    const source_document_id = crypto.randomUUID();
    try {
      const putResult = await storageProvider.put(
        {
          bytes: file.bytes,
          mime_type: file.mime_type,
          original_filename: file.original_filename,
          source_document_id,
          org_id: parsed.org_id,
        },
        ctx,
      );
      putResults.push({
        source_document_id,
        filename: file.original_filename,
        storage_key: putResult.storage_key,
        content_hash: putResult.content_hash,
        byte_size: putResult.byte_size,
      });
    } catch (err) {
      // Sub-Q9 R1 mitigation: ServiceError.details specifies which
      // file failed and at which stage.
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        `Storage write failed for file ${i + 1} of ${parsed.files.length} (${file.original_filename})`,
        {
          file_index: i,
          filename: file.original_filename,
          stage: 'storage_put',
          underlying: err instanceof Error ? err.message : String(err),
        },
      );
    }
  }

  // Step 3: Compose RPC payload.
  const ingest_batch_id = crypto.randomUUID();
  const drop_session_id = parsed.drop_session_id;

  const p_batch = {
    id: ingest_batch_id,
    org_id: parsed.org_id,
    ingest_channel: 'drag_drop_pdf' as const,
    received_at: new Date().toISOString(),
    channel_metadata: { drop_session_id },  // discriminated union variant
    trace_id: ctx.trace_id,
    created_by: ctx.caller.user_id,
  };

  const p_documents = putResults.map((r) => ({
    id: r.source_document_id,
    org_id: parsed.org_id,
    legal_entity_id: parsed.org_id,
    storage_provider: V1_STORAGE_PROVIDER,
    original_storage_key: r.storage_key,
    original_content_hash: r.content_hash,
    original_byte_size: r.byte_size,
    original_filename: r.filename,
    mime_type: parsed.files.find((f) => f.original_filename === r.filename)!.mime_type,
    ingest_channel: 'drag_drop_pdf' as const,
    ingest_batch_id,
    storage_status: 'available' as const,
    received_at: new Date().toISOString(),
    created_by: ctx.caller.user_id,
  }));

  const p_cases = putResults.map((r) => ({
    id: crypto.randomUUID(),
    org_id: parsed.org_id,
    source_document_id: r.source_document_id,
    state: 'received' as const,
    created_by: ctx.caller.user_id,
  }));

  const p_case_sources: never[] = [];  // empty per Phase 6 lock; Phase 7 writes primary

  const p_jobs = putResults.map((r, i) => ({
    id: crypto.randomUUID(),
    org_id: parsed.org_id,
    source_document_id: r.source_document_id,
    document_case_id: p_cases[i].id,
    ingest_batch_id,
    state: 'queued' as const,
    created_by: ctx.caller.user_id,
  }));

  const p_audit = {
    org_id: parsed.org_id,
    user_id: ctx.caller.user_id,
    trace_id: ctx.trace_id,
    action: 'ingest_batch_created',
    entity_type: 'ingest_batch',
    after_state_id: ingest_batch_id,
    tool_name: 'ingestionService.handleDragDropUpload',
    reason: 'drag_drop_pdf channel ingestion',
  };

  // Step 4: Atomic RPC call.
  const db = adminClient();
  const { data, error } = await db.rpc(
    'create_ingest_batch_with_documents_with_audit',
    { p_batch, p_documents, p_cases, p_case_sources, p_jobs, p_audit },
  );
  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `Ingest batch RPC failed: ${error.message}`,
      { stage: 'rpc', underlying: error.message },
    );
  }

  log.info(
    { ingest_batch_id, document_count: parsed.files.length },
    'ingestionService.handleDragDropUpload: complete',
  );

  return {
    ingest_batch_id,
    document_count: parsed.files.length,
  };
}

export const ingestionService = {
  handleDragDropUpload: handleDragDropUploadImpl,  // Pattern B: no withInvariants wrap here
};
```

### Zod schemas — `ingestBatch.schema.ts`

`apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts`:

```typescript
// src/shared/schemas/document-platform/ingestBatch.schema.ts
//
// Layer 2 boundary validation per ADR-0010. Discriminated union on
// channel_metadata shape; v1-active branch = drag_drop_pdf at chunk
// 6.2b. Chunk 6.3 forwarded_mailbox variant adds the second branch.
//
// Sentinel-shape rejection: any channel_metadata matching @>
// {"sentinel": true} is rejected at Zod ingress per Sub-Q2.2
// symmetric-filter discipline (read-side cards endpoint filter uses
// the same JSONB containment expression).
//
// Layer 3 service-no-emit narrowing per ADR-0010: ingestionService
// at chunk 6.2b emits only drag_drop_pdf channel. direct_upload and
// api_ingest values are substrate-reserved per migration 135:152;
// no v1 service path writes those values.

import { z } from 'zod';

// Channel metadata discriminated union.
// drag_drop_pdf branch ships at chunk 6.2b.
// forwarded_mailbox branch ships at chunk 6.3.
export const DragDropChannelMetadataSchema = z.object({
  drop_session_id: z.string().uuid(),
  // explicit rejection of sentinel key — Zod's strict mode would
  // also catch unknown keys, but explicit refinement makes the
  // sentinel rejection greppable.
}).strict().refine(
  (v) => !('sentinel' in v),
  { message: 'sentinel-shape channel_metadata is not a valid ingestion event' },
);

export const IngestBatchChannelMetadataSchema = z.discriminatedUnion(
  'ingest_channel',
  [
    z.object({
      ingest_channel: z.literal('drag_drop_pdf'),
      channel_metadata: DragDropChannelMetadataSchema,
    }),
    // chunk 6.3 forward-pointer:
    // z.object({
    //   ingest_channel: z.literal('forwarded_mailbox'),
    //   channel_metadata: ForwardedMailboxChannelMetadataSchema,
    // }),
  ],
);

// Drag-drop file input
export const DragDropFileInputSchema = z.object({
  bytes: z.instanceof(Uint8Array),
  mime_type: z.enum([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/tiff',
    // tight v1 whitelist; Phase 7 may expand for additional formats
  ]),
  original_filename: z.string().min(1).max(255),
});

// Drag-drop upload input (route → service boundary)
export const DragDropUploadInputSchema = z.object({
  org_id: z.string().uuid(),
  drop_session_id: z.string().uuid(),
  files: z.array(DragDropFileInputSchema).min(1),
  // no explicit application-layer cap at v1 per Sub-Q3 lock
  // (Next.js body limits apply as implicit fallback).
});

// Cards endpoint response shapes
export const CardListResultSchema = z.object({
  ingest_batch_id: z.string().uuid(),
  cards: z.array(z.object({
    case_id: z.string().uuid(),
    state: z.string(),  // document_case state enum; Layer 1 CHECK narrows
    source_document_id: z.string().uuid(),
    original_filename: z.string(),
    ingest_batch_id: z.string().uuid(),
    channel_metadata: z.record(z.unknown()),  // JSONB pass-through
    received_at: z.string(),
    created_at: z.string(),
  })),
});

export const CardDetailResultSchema = CardListResultSchema.shape.cards.element.extend({
  ingest_batch: z.object({
    id: z.string().uuid(),
    ingest_channel: z.string(),
    received_at: z.string(),
    channel_metadata: z.record(z.unknown()),
  }),
});

export type DragDropUploadInput = z.infer<typeof DragDropUploadInputSchema>;
export type DragDropUploadResult = {
  ingest_batch_id: string;
  document_count: number;
};
export type CardListResult = z.infer<typeof CardListResultSchema>;
export type CardDetailResult = z.infer<typeof CardDetailResultSchema>;
```

### Route handler — drag-drop POST

`apps/web/src/app/api/orgs/[orgId]/documents/ingest/drag-drop/route.ts`:

```typescript
// POST /api/orgs/[orgId]/documents/ingest/drag-drop
// Drag-drop file ingestion endpoint. First multipart parser in the
// codebase per chunk 6.2b verify-from-disk; uses Next.js native
// Request.formData() (no external library).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ingestionService } from '@/services/document-platform/ingestionService';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/services/errors/httpMapping';

export async function POST(
  req: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  let traceId: string | undefined;

  try {
    const ctx = await buildServiceContext(req);
    traceId = ctx.trace_id;

    // Parse multipart form-data via Next.js native parser.
    const formData = await req.formData();
    const drop_session_id = formData.get('drop_session_id');
    if (typeof drop_session_id !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'drop_session_id required as form field' },
        { status: 400 },
      );
    }

    // Collect File entries from formData. Standard browser drag-drop
    // produces a 'files' field with multiple File entries.
    const fileEntries = formData.getAll('files').filter(
      (v): v is File => v instanceof File,
    );

    // Convert File → bytes for each entry.
    const files = await Promise.all(
      fileEntries.map(async (f) => ({
        bytes: new Uint8Array(await f.arrayBuffer()),
        mime_type: f.type,
        original_filename: f.name,
      })),
    );

    const result = await withInvariants(
      ingestionService.handleDragDropUpload,
      { action: 'ingest.drag_drop' },
    )(
      { org_id: orgId, drop_session_id, files },
      ctx,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Invalid request', details: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof ServiceError) {
      // Sub-Q9 R1 mitigation: surface err.details to the client.
      return NextResponse.json(
        { error: err.code, message: err.message, details: err.details },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', trace_id: traceId },
      { status: 500 },
    );
  }
}
```

### Route handler — cards list

`apps/web/src/app/api/orgs/[orgId]/documents/cases/route.ts`:

```typescript
// GET /api/orgs/[orgId]/documents/cases?ingest_batch_id=X
// List document cards by ingest_batch_id.
// Read endpoint per Rule 2 (validation at both ends); no withInvariants.
// Sentinel filter per Sub-Q2.2: WHERE NOT (channel_metadata @> '{"sentinel": true}'::jsonb)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';
import { CardListResultSchema } from '@/shared/schemas/document-platform/ingestBatch.schema';

const QuerySchema = z.object({
  ingest_batch_id: z.string().uuid(),
});

export async function GET(
  req: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    ingest_batch_id: url.searchParams.get('ingest_batch_id') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', message: 'ingest_batch_id required' },
      { status: 400 },
    );
  }

  const ctx = await buildServiceContext(req);
  // RLS verification implicit via adminClient + org_id scoping;
  // INV-AUTH-001 invariant-3 verifies caller has access to orgId.

  const db = adminClient();
  // Symmetric sentinel filter (Sub-Q2.2): exclude rows whose
  // ingest_batches.channel_metadata matches sentinel shape.
  const { data, error } = await db
    .from('document_cases')
    .select(`
      id,
      state,
      source_document_id,
      created_at,
      source_documents!inner (
        original_filename,
        ingest_batch_id,
        ingest_batches!inner (
          channel_metadata,
          received_at
        )
      )
    `)
    .eq('org_id', orgId)
    .eq('source_documents.ingest_batch_id', parsed.data.ingest_batch_id)
    .not(
      'source_documents.ingest_batches.channel_metadata',
      'cs',
      '{"sentinel": true}',
    );

  if (error) {
    return NextResponse.json(
      { error: 'READ_FAILED', message: error.message },
      { status: 500 },
    );
  }

  // Shape to CardListResult per Zod schema.
  const cards = (data ?? []).map((row: any) => ({
    case_id: row.id,
    state: row.state,
    source_document_id: row.source_document_id,
    original_filename: row.source_documents.original_filename,
    ingest_batch_id: row.source_documents.ingest_batch_id,
    channel_metadata: row.source_documents.ingest_batches.channel_metadata,
    received_at: row.source_documents.ingest_batches.received_at,
    created_at: row.created_at,
  }));

  return NextResponse.json({
    ingest_batch_id: parsed.data.ingest_batch_id,
    cards,
  });
}
```

### Route handler — card detail

`apps/web/src/app/api/orgs/[orgId]/documents/cases/[caseId]/route.ts`:

```typescript
// GET /api/orgs/[orgId]/documents/cases/[caseId]
// Single case detail with source_documents + ingest_batch context.
// Read endpoint; no withInvariants.
// Sentinel filter applies — if the case's batch is a sentinel batch,
// the endpoint returns 404 (consistent with cards list filter shape).

import { NextResponse } from 'next/server';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';

export async function GET(
  req: Request,
  context: { params: Promise<{ orgId: string; caseId: string }> },
) {
  const { orgId, caseId } = await context.params;
  const ctx = await buildServiceContext(req);

  const db = adminClient();
  const { data, error } = await db
    .from('document_cases')
    .select(`
      id,
      state,
      source_document_id,
      created_at,
      source_documents!inner (
        original_filename,
        mime_type,
        ingest_batch_id,
        ingest_batches!inner (
          id,
          ingest_channel,
          received_at,
          channel_metadata
        )
      )
    `)
    .eq('org_id', orgId)
    .eq('id', caseId)
    .not(
      'source_documents.ingest_batches.channel_metadata',
      'cs',
      '{"sentinel": true}',
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'READ_FAILED', message: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Case not found or sentinel-backed' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    case_id: data.id,
    state: data.state,
    source_document_id: data.source_document_id,
    original_filename: (data as any).source_documents.original_filename,
    ingest_batch_id: (data as any).source_documents.ingest_batch_id,
    channel_metadata: (data as any).source_documents.ingest_batches.channel_metadata,
    received_at: (data as any).source_documents.ingest_batches.received_at,
    created_at: data.created_at,
    ingest_batch: {
      id: (data as any).source_documents.ingest_batches.id,
      ingest_channel: (data as any).source_documents.ingest_batches.ingest_channel,
      received_at: (data as any).source_documents.ingest_batches.received_at,
      channel_metadata: (data as any).source_documents.ingest_batches.channel_metadata,
    },
  });
}
```

### UI components

**`apps/web/src/components/canvas/DocumentIntakeRail.tsx`**: Vertical
intake rail rendered as a sidecar pane within `ContextualCanvas`.
Drag-drop zone uses native HTML5 `onDragOver` / `onDrop` events
(first drag-drop UI in the codebase). On drop: collects File
objects from `event.dataTransfer.files`, generates a fresh
`drop_session_id` (UUID), constructs FormData, POSTs to
`/api/orgs/[orgId]/documents/ingest/drag-drop`. On 201 success:
refreshes the cards list via the cards endpoint. On error:
surfaces ServiceError.details (per Sub-Q9 R1) inline. Tailwind
classes mirror existing canvas-component convention.

**`apps/web/src/components/canvas/DocumentCard.tsx`**: Per-document
card. Renders Sub-Q2.1 columns. Props:
`card: { case_id, state, source_document_id, original_filename,
ingest_batch_id, channel_metadata, received_at, created_at }`. Card
header shows `original_filename` + `state`; body shows
`drop_session_id` from `channel_metadata`; footer shows
`received_at`. Tailwind classes mirror `ProposedEntryCard` styling.

**`apps/web/src/components/bridge/ContextualCanvas.tsx`** (modify):
Integrate `DocumentIntakeRail` as a child component. Exact
integration shape (sidecar pane vs view-router entry vs always-on
right column) adjudicated at Task 8 verify-at-implementation; PRD
framing ("vertical intake rail on the far right of the canvas")
implies always-on right column, but actual integration may depend
on existing ContextualCanvas internals.

## Status

ADR-0011 needs no amendment at chunk 6.2b (the §1 amendment shipped
at chunk 6.1 deferred `ingest_items` to Phase 7; ingestionService
operates within the substrate spine ADR-0011 §1 currently declares).

ADR-0013 needs no amendment at chunk 6.2b (storage layer untouched;
`storageProviderService.put` contract per §1 + §9 + §11 used as-is).

ADR-0014 needs no amendment at chunk 6.2b (Phase 7 orchestrator
deferral untouched; dedup-by-hash deferral per Sub-Q7 lock leaves
ADR-0014 §6 wording-ambiguity flagged for Phase 6 retrospective via
Flag 14 — not a chunk 6.2b ADR-amendment trigger).

ADR-0010 (closed-enum + three-layer defense) — Layer 2 Zod
discriminated union at `ingestBatch.schema.ts` is fresh first-
instance application at the channel_metadata boundary. No amendment
needed.

## Walkable proof

**End-to-end-walkable** at chunk 6.2b commit. User drops N PDFs in
the canvas DocumentIntakeRail; multipart POST lands at the drag-drop
route; ingestionService validates + storage-puts + RPC-composes; 1
ingest_batches row + N source_documents rows + N document_cases rows
(state='received') + N document_jobs rows (state='queued') + 1 audit
row land atomically; cards list endpoint returns N cards with full
context; per-card detail endpoint resolves with full ingest_batch
+ source_document context.

The walkable test exercises:

1. **POST multipart with N=1 file**: single-file path through
   multi-file shape. Returns 201 with ingest_batch_id +
   document_count=1. DB has 1 ingest_batches + 1 source_documents
   + 1 document_cases + 1 document_jobs + 1 audit row.
2. **POST multipart with N=3 files**: typical drag-drop. Returns
   201 with document_count=3. DB has 1 ingest_batches + 3
   source_documents + 3 document_cases + 3 document_jobs + 1 audit
   row (batch-grain, single audit per Sub-Q8 + INV-AUDIT-001).
3. **POST multipart with N=10 files**: stress shape for chunk 6.1
   RPC's atomic-N composition.
4. **GET cards by batch**: returns the N cards with case_id +
   state + filename + drop_session_id + received_at.
5. **GET case detail**: returns single case with full
   source_document + ingest_batch context.
6. **Sentinel-filter test**: cards endpoint returns empty for any
   `ingest_batch_id` matching a sentinel batch (both m152-shape and
   m153-shape sentinels rejected).
7. **Zod ingress sentinel rejection**: ingestionService called with
   sentinel-shape `channel_metadata` rejects with typed ServiceError;
   no rows land.
8. **Partial-failure simulation**: storage put mocked to fail on
   file 3 of 5; ingestionService throws ServiceError with
   `details.file_index=2, filename='...', stage='storage_put'`; DB
   has zero rows for the failed batch; orphan blobs from files 1+2
   remain for GC.
9. **trace_id correlation**: single trace_id appears in
   ingest_batches.trace_id + audit_log.trace_id; pino log lines for
   the request all carry the same trace_id.
10. **Cross-org RLS**: cards endpoint scoped to orgId param;
    cross-org access returns 404 or empty list.

UI walkable: user drops 3 PDFs in the rail; cards appear in the
cards list within ~1s; clicking a card opens detail view.

## Tech Stack

- **TypeScript + Next.js 16 (App Router)** — `Request.formData()`
  native multipart parsing per Sub-Q3 lock. No external multipart
  library.
- **React + Tailwind CSS** — UI components mirror existing canvas-
  component convention.
- **Zod** — Layer 2 boundary validation; discriminated union on
  `channel_metadata` shape per Sub-Q2.2 symmetric-filter discipline.
- **Postgres 17 + Supabase** — substrate per ADR-0010 / 0011 / 0013
  disciplines. No new migration at chunk 6.2b (substrate complete
  post-6.2a).
- **Vitest + React Testing Library** — integration + unit tests.
  Integration tests via `apps/web/tests/integration/`; unit tests
  in `apps/web/tests/unit/`.
- **`createIngestBatchForTest` helper** (chunk 6.2a) — used by
  fixture setup for cards-endpoint tests that need a parent batch
  but don't exercise the full ingestion path.
- **No new dependencies** at chunk 6.2b.

## In scope

- **New service file**:
  `apps/web/src/services/document-platform/ingestionService.ts`.
  Exports `ingestionService` object with `handleDragDropUpload`
  method (Pattern B external-wrap). Composes
  `storageProviderService.put` (per Sub-Q6 sequential) + chunk 6.1
  RPC `create_ingest_batch_with_documents_with_audit`.
- **types.ts updates**: `DragDropUploadInput`, `DragDropFileInput`,
  `DragDropUploadResult` interfaces.
- **New Zod schemas file**:
  `apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts`.
  Discriminated union on `ingest_channel`; v1-active branch =
  `drag_drop_pdf`. `forwarded_mailbox` branch reserved as
  comment-only forward-pointer (chunk 6.3 activates).
- **Three route handlers**:
  - `POST /api/orgs/[orgId]/documents/ingest/drag-drop`
  - `GET /api/orgs/[orgId]/documents/cases?ingest_batch_id=X`
  - `GET /api/orgs/[orgId]/documents/cases/[caseId]`
- **Two UI components**: `DocumentIntakeRail` (canvas-only per
  Sub-Q1) + `DocumentCard` (per-card display per Sub-Q2.1).
- **ContextualCanvas integration**: wire `DocumentIntakeRail` as a
  child component. Exact integration shape adjudicated at Task 8.
- **Symmetric sentinel filter**: Zod ingress rejection (write-side)
  + SQL filter at cards endpoint (read-side). Same JSONB containment
  expression at both ends.
- **New tests** (~10-15 new tests; ~1079-1084 ±2 expected at chunk
  close): see Test plan section.
- **Friction-journal entries (at chunk close)**: pre-drafted
  (D)-filter entries materialize per Friction-journal placeholder
  section.

## Out of scope

- **OCR pipeline / classification / extraction** — Phase 7 per
  ADR-0014. Chunk 6.2b writes `document_jobs` rows at
  `state='queued'`; the Phase 7 orchestrator reads + transitions.
- **`document_case_sources` row writes for drag-drop** — Phase 7
  writes primary role after classification (plan doc lines
  150-154). Chunk 6.2b ships zero `document_case_sources` rows for
  drag-drop attachments.
- **`forwarded_mailbox` path** — chunk 6.3 territory. Brief 6.3
  ships the `handleForwardedMailbox` method + mail provider +
  parsing library + allowlist enforcement.
- **Mail provider choice + parsing library + allowlist** — chunk
  6.3 scope-lock.
- **Sentinel batch retroactive cleanup** — sentinel batches are
  permanent production substrate per chunk 6.1 close meta-
  observation #4. Chunk 6.2b does NOT delete or modify sentinel
  batches; the read-side filter excludes them from operator views.
- **Dedup-by-hash short-circuit** — Phase 7 Stage 0 per Sub-Q7 lock
  + ADR-0014 §6 (with §6 wording-ambiguity flagged as Flag 14 for
  Phase 6 retrospective).
- **Phase 7 orchestrator runtime** — Phase 7 per ADR-0014:1249.
- **Drag-drop UX on chat surface** — Sub-Q1 locked canvas-only.
  Forward-flag for Phase 6 retrospective if chunk 6.3 forwarded_mailbox
  UX suggests different drag-drop affordances.
- **Application-layer file count cap** — Sub-Q3 locked no explicit
  cap at v1 (Next.js body limits apply as implicit fallback). Cap
  can be added post-v1 if abuse surfaces.
- **Partial-batch error handling** — Sub-Q9 locked all-or-nothing.
  Forward-pointer for post-v1 `?partial=true` opt-in handler if
  user friction surfaces.
- **`putBatch` storage provider extension** — not on the
  StorageProvider interface; not added at chunk 6.2b. Phase 7 may
  introduce if batch ingestion paths surface throughput needs.
- **`direct_upload` + `api_ingest` channel emission** — substrate-
  reserved, service-deferred per plan doc §"v1 operational channels."
- **Retroactive fixes for ADR-0011 Status-line gap (Flag 8) or
  legacy amendment placement (Flag 9)** — ADR-0022 §6 forward-only
  discipline. Legacy gaps stay as artifacts; carried into Phase 6
  retrospective inventory.

## Flagged ambiguities

| # | Flag | Resolution path | Notes |
|---|---|---|---|
| 1 | **`drop_session_id` source — client-generated vs server-generated.** Brief locks client-generated (the drag-drop UI generates the UUID before POST; the server trusts the client's value and stores it in `channel_metadata`). Alternative: server-generates, returns to client in 201 response. | Implementing agent at Task 6 (route handler) verifies the chosen approach; documents in evidence. If client-generated, no extra Zod validation needed beyond UUID shape; if server-generated, the route handler generates and overrides any client-supplied value. | Client-generated is the looser convention (matches the "drop session" semantic — the client is the authority on what constitutes a drop session). Server-generated is the tighter convention but adds a round-trip semantic the v1 UX doesn't need. |
| 2 | **MIME whitelist scope at chunk 6.2b.** Brief locks the v1 whitelist at `application/pdf`, `image/png`, `image/jpeg`, `image/tiff`. If verify-at-implementation surfaces a Phase 6 file type the whitelist excludes (e.g., heic, webp), surface as friction-journal entry + whitelist amendment. | Implementing agent at Task 3 (Zod schema) verifies the whitelist scope; if narrower than chunk 6.3 forwarded_mailbox needs (e.g., embedded images in emails), document in friction-journal. | Tight v1 whitelist intentional — Phase 7 may expand for OCR-supported formats. Conservative at v1 reduces edge-case test surface. |
| 3 | **`ContextualCanvas` integration shape — sidecar pane vs view-router entry vs always-on right column.** Brief locks "vertical intake rail on the far right" per PRD framing but doesn't pre-decide the integration mechanism in `ContextualCanvas`. | Implementing agent at Task 8 verify-at-implementation reads current `ContextualCanvas` body + decides integration shape; documents the decision in commit body / friction-journal if non-obvious. | The PRD framing implies always-on right column; verify if `ContextualCanvas`'s current shape supports this without restructure. |
| 4 | **Cards endpoint query parameter — `ingest_batch_id` required vs optional.** Brief locks required (cards endpoint exists for "show me cards for THIS batch" use case). If verify-at-implementation surfaces UX need for "show me all cards across batches," surface as friction-journal entry + amendment. | Implementing agent at Task 5 (cards list route) implements required; documents the constraint. | All-cards endpoint is forward-pointer territory (Phase 7's lifecycle-state-agnostic per-entity endpoints per Phase 5 retro §6:416-424). Not v1 chunk 6.2b. |
| 5 | **Multipart field naming — `files` vs `files[]` for multi-file input.** Brief locks `files` (browser standard for `<input multiple>` + drag-drop). If multipart parsing surfaces issue with multi-value field collation, surface as friction-journal entry. | Implementing agent at Task 6 verifies Next.js `Request.formData().getAll('files')` returns array of File entries; documents convention. | Browser standard; Next.js native handling expected to work. Edge case: very large requests may hit platform body limits before route handler sees them — that's intended per Sub-Q3 implicit-cap framing. |
| 6 | **Cards endpoint sentinel-filter implementation shape — supabase-js chained `.not()` vs Postgres view vs stored procedure vs app-layer filter.** The brief's example code chains `.not('source_documents.ingest_batches.channel_metadata', 'cs', '{"sentinel": true}')` against a nested JOIN-table reference; this syntax may not work cleanly in supabase-js's PostgREST query builder for nested-table filters. Four viable implementation shapes: (i) chained `.not()` if supabase-js supports the nested reference; (ii) Postgres view `document_cards_by_batch_view` with sentinel filter baked in, endpoint queries the view; (iii) stored procedure `get_document_cards_by_batch(p_org_id, p_ingest_batch_id) RETURNS TABLE(...)`; (iv) fetch all rows + app-layer filter. The **symmetric filter discipline** (same JSONB containment expression at both write-side Zod and read-side SQL) is principle-level; the implementation shape doesn't change the principle. | Implementing agent at Tasks 6 + 7 verifies which shape supabase-js supports ergonomically; chooses (i)-(iv) based on what compiles + passes tests; documents the choice in friction-journal if non-obvious. If (ii) or (iii) shape selected, the migration ships in chunk 6.2b commit (no separate substrate-only commit). | The brief's example code is illustrative; the implementing agent picks the actual shape. Strong lean toward (i) for simplicity if supabase-js supports it; (ii) is the cleanest if (i) fails. (iv) accepted only if the batch grain is bounded (cards endpoint queries per-batch, typically N≤20 rows). |

## Task plan

13 numbered tasks at a single commit per Path C precedent. Each
task self-contained; verify-from-disk gates apply at each task
boundary per RI-6 5-grain discipline (incl. Grain 5 existing-
consumer-contract-conformance prospectively applied at Task 1).

- [ ] **Task 1: Verify-from-disk gates (Grain 1 + Grain 5).**
  - Confirm `ingestionService.ts` does NOT already exist at
    `apps/web/src/services/document-platform/ingestionService.ts`.
  - Confirm `ingestBatch.schema.ts` does NOT already exist at
    `apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts`.
  - Confirm the three new route file paths don't collide:
    `apps/web/src/app/api/orgs/[orgId]/documents/ingest/drag-drop/route.ts`,
    `apps/web/src/app/api/orgs/[orgId]/documents/cases/route.ts`,
    `apps/web/src/app/api/orgs/[orgId]/documents/cases/[caseId]/route.ts`.
  - Re-verify route distribution: org-scoped count + non-org-scoped
    exceptions. Brief locks at 39-of-50; if diverges, document.
  - Re-verify `storageProviderService.put` signature + return shape
    against brief's expected `{ storage_key, content_hash, byte_size,
    provider }` (per Explore agent C section B; verify hasn't drifted).
  - Re-verify chunk 6.1 RPC signature
    `create_ingest_batch_with_documents_with_audit(p_batch, p_documents,
    p_cases, p_case_sources, p_jobs, p_audit) RETURNS UUID`.
  - Re-verify `buildServiceContext` returns `ServiceContext` with
    `trace_id: string` (mandatory per Service Communication Rule 5).
  - Re-verify sentinel-batch shape on disk:
    `channel_metadata @> '{"sentinel": true}'::jsonb` matches both
    m152 and m153 backfill INSERT shapes.
  - Re-verify `ContextualCanvas` integration site exists at
    `apps/web/src/components/bridge/ContextualCanvas.tsx`; read
    current body to inform Task 8 integration shape.
  - Grain 5 prospective scan: zero existing consumers of
    `ingestionService` (it doesn't exist yet); zero-count IS
    evidence basis per chunk 6.2a precedent.
  - Write evidence summary in commit message draft.

- [ ] **Task 2: Create `types.ts` updates.**
  - File: `apps/web/src/services/document-platform/types.ts`.
  - Add `DragDropFileInput`, `DragDropUploadInput`,
    `DragDropUploadResult` interfaces per brief's Service surface
    section.
  - Comment block citing chunk 6.2b Sub-Q1 + Sub-Q3 + Sub-Q9 locks.

- [ ] **Task 3: Create `ingestBatch.schema.ts`.**
  - File:
    `apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts`.
  - Discriminated union on `ingest_channel` with `drag_drop_pdf`
    branch; `forwarded_mailbox` branch reserved as comment-only
    forward-pointer.
  - `DragDropChannelMetadataSchema` with explicit sentinel refinement.
  - `DragDropFileInputSchema` with MIME whitelist
    (`application/pdf`, `image/png`, `image/jpeg`, `image/tiff`).
  - `DragDropUploadInputSchema` composing the above.
  - `CardListResultSchema` + `CardDetailResultSchema` for read
    endpoint contracts.
  - Heavy file-top comment block citing ADR-0010 layer discipline +
    Sub-Q2.2 symmetric-filter discipline.

- [ ] **Task 4: Create `ingestionService.ts`.**
  - File:
    `apps/web/src/services/document-platform/ingestionService.ts`.
  - Implementation per brief's Service surface section.
  - Pattern B external-wrap: method body has no `withInvariants`
    reference; route handler wraps at call site.
  - Sub-Q9 R1 mitigation: every thrown ServiceError carries
    `details.file_index + filename + stage`.
  - Heavy file-top comment block citing INV-SERVICE-001 wrap-site
    discipline + entity ownership + plan-doc per-channel composition
    + Sub-Q9 flow.

- [ ] **Task 5: Create drag-drop POST route handler.**
  - File:
    `apps/web/src/app/api/orgs/[orgId]/documents/ingest/drag-drop/route.ts`.
  - Implementation per brief's Route handler section.
  - `Request.formData()` parsing (first multipart parser in codebase).
  - `buildServiceContext(req)` at entry; trace_id propagates.
  - `withInvariants(ingestionService.handleDragDropUpload,
    { action: 'ingest.drag_drop' })`.
  - Error handling per uniform 50-route convention: ZodError → 400;
    ServiceError → mapped status with `details`; else 500.

- [ ] **Task 6: Create cards-list GET route handler.**
  - File:
    `apps/web/src/app/api/orgs/[orgId]/documents/cases/route.ts`.
  - Query param `ingest_batch_id` required.
  - Symmetric sentinel filter via `.not('source_documents.ingest_batches.channel_metadata', 'cs', '{"sentinel": true}')`.
  - Read-only; no `withInvariants` per Rule 2 + existing read
    convention.

- [ ] **Task 7: Create card-detail GET route handler.**
  - File:
    `apps/web/src/app/api/orgs/[orgId]/documents/cases/[caseId]/route.ts`.
  - Single case lookup with full source_document + ingest_batch
    context.
  - Sentinel filter applies — returns 404 if case's batch is
    sentinel-backed.

- [ ] **Task 8: Create `DocumentIntakeRail.tsx` + integrate with `ContextualCanvas`.**
  - File: `apps/web/src/components/canvas/DocumentIntakeRail.tsx`.
  - Native HTML5 `onDragOver` / `onDrop` events.
  - Generates `drop_session_id` (UUID) per drop event.
  - Constructs `FormData` with `drop_session_id` + `files` field.
  - POSTs to drag-drop route.
  - On 201: refreshes cards list (via cards endpoint).
  - On error: surfaces `ServiceError.details` inline.
  - Tailwind classes per canvas-component convention.
  - Modify `apps/web/src/components/bridge/ContextualCanvas.tsx` to
    render `DocumentIntakeRail`. Integration shape decided at this
    task per Flag 3.

- [ ] **Task 9: Create `DocumentCard.tsx`.**
  - File: `apps/web/src/components/canvas/DocumentCard.tsx`.
  - Props: `card: CardListResult['cards'][number]`.
  - Renders Sub-Q2.1 columns.
  - Tailwind classes mirror `ProposedEntryCard`.

- [ ] **Task 10: Create integration tests.**
  - File:
    `apps/web/tests/integration/ingestionService.dragDropUpload.integration.test.ts`.
    - Multi-file ingestion (N=1, N=3, N=10).
    - Sentinel-shape Zod rejection.
    - Partial-failure simulation (storage put mocked to fail on
      file 3 of 5; verify ServiceError.details + no DB rows).
    - trace_id correlation across batch + audit row.
  - File:
    `apps/web/tests/integration/dragDropRoute.integration.test.ts`.
    - Multipart parsing path.
    - Zod 400 path.
    - ServiceError → mapped status path (including `details` surface).
    - Cross-org RLS rejection.
  - File:
    `apps/web/tests/integration/documentCasesRead.integration.test.ts`.
    - List-by-batch happy path.
    - Case-detail happy path.
    - Sentinel filter (m152-shape fixture + m153-shape fixture
      both excluded — per Drift 3 acknowledgment).
    - Cross-org RLS rejection.

- [ ] **Task 11: Create unit tests for UI components.**
  - File: `apps/web/tests/unit/DocumentIntakeRail.test.tsx`.
    - Render test.
    - Drag-drop event handler test (mock `Request.formData()`).
    - Error rendering test.
  - File: `apps/web/tests/unit/DocumentCard.test.tsx`.
    - Render test with Sub-Q2.1 columns.

- [ ] **Task 12: Run full validation gates.**
  - `pnpm test` — full vitest suite green (1069 baseline +
    ~10-15 new = ~1079-1084 expected; ±2 for refactor-induced shifts).
  - `pnpm typecheck` — green.
  - `pnpm agent:validate` — 26/26 Category A floor stays green.
  - `pnpm adr:check` — green (no ADR amendments at chunk 6.2b).
  - URL grep check — green (no hardcoded localhost URLs).
  - If any failure: diagnose root cause per CLAUDE.md "don't
    bypass safety checks"; fix; re-run.

- [ ] **Task 13: Verify-at-close LOC count vs forecast + commit.**
  - Run: `git diff --stat HEAD~0` (after staging) to count actual
    LOC against the ~785-1185 LOC forecast.
  - If actual LOC exceeds forecast by > 30% (i.e., > ~1540 LOC),
    surface as friction-journal entry codifying volume-forecast
    drift.
  - If actual LOC is within forecast band: friction-journal entry
    optional.
  - Commit (single commit at chunk 6.2b per Path C precedent):

```bash
git add apps/web/src/services/document-platform/ingestionService.ts
git add apps/web/src/services/document-platform/types.ts
git add apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts
git add apps/web/src/app/api/orgs/[orgId]/documents/ingest/drag-drop/route.ts
git add apps/web/src/app/api/orgs/[orgId]/documents/cases/route.ts
git add apps/web/src/app/api/orgs/[orgId]/documents/cases/[caseId]/route.ts
git add apps/web/src/components/canvas/DocumentIntakeRail.tsx
git add apps/web/src/components/canvas/DocumentCard.tsx
git add apps/web/src/components/bridge/ContextualCanvas.tsx
git add apps/web/tests/integration/ingestionService.dragDropUpload.integration.test.ts
git add apps/web/tests/integration/dragDropRoute.integration.test.ts
git add apps/web/tests/integration/documentCasesRead.integration.test.ts
git add apps/web/tests/unit/DocumentIntakeRail.test.tsx
git add apps/web/tests/unit/DocumentCard.test.tsx
# Friction-journal entries materialize per (D)-filter at chunk close:
git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
feat(phase-6): chunk 6.2b — drag-drop end-to-end (ingestionService + routes + cards UI)

Phase 6 chunk 6.2b (drag-drop end-to-end half of Path C split per
chunk 6.2a brief). Ships ingestionService.handleDragDropUpload
(Pattern B external-wrap), three route handlers (POST drag-drop +
GET cards list + GET case detail), Zod discriminated-union schemas
on ingest_batch channel_metadata (sentinel-shape rejection at
write-side; symmetric SQL filter at read-side), and two canvas UI
components (DocumentIntakeRail + DocumentCard). User drops N PDFs
in the canvas intake rail; 1 ingest_batches + N source_documents +
N document_cases (state='received') + N document_jobs (state='queued')
+ 1 audit row land atomically via chunk 6.1 RPC.

Per chunk 6.2b scope-lock 2026-05-15 (8 sub-questions locked from
chunk 6.2a deferrals + Sub-Q10 NEW from chunk 6.2a verify-from-disk):
- Sub-Q1 = canvas-only (PRD Phase 2 vision; smallest UX surface).
- Sub-Q2.1 = minimum + channel_metadata cards columns.
- Sub-Q2.2 = α filter at endpoint (symmetric write-side / read-side
  sentinel-shape rejection).
- Sub-Q3 = multi-file POST, no explicit cap at v1.
- Sub-Q6 = sequential storageProviderService.put() per file.
- Sub-Q7 = dedup-by-hash deferred to Phase 7 (no short-circuit at v1).
- Sub-Q8 = single trace_id across batch + N documents + N cases +
  N jobs + 1 audit row.
- Sub-Q9 = all-or-nothing + Zod pre-validate at ingress
  (ServiceError.details specifies file_index + filename + stage on
  partial failure).
- Sub-Q10 = org-scoped routes per 39-of-50 disk evidence.

First-instance precedents codified:
- First multipart parser in /api/ (Next.js native Request.formData()).
- First drag-drop UI in /components/ (native HTML5 onDragOver/onDrop).

Three drift items from handoff acknowledged:
- Route count corrects to 39-of-50 (handoff cited 28-of-30).
- "Round 4 submission-envelope" → plan-doc lines 139-156 anchor.
- Sentinel-batch test fixtures cover both m152-shape and m153-shape.

Friction-journal entries shipping at chunk close:
- Flag 13 (tier-1): brainstorming-round-vocabulary-not-disk-anchored.
- First-instance precedents (multipart parser + drag-drop UI).
- Flag 14 + Flag 15 forward-pointers for Phase 6 retrospective.

15 RI candidates carry forward (12 chunk-6.1 + 3 new at chunk 6.2b).
Phase 6 retrospective at chunk 6.3 close consolidates 21-25 at full
accumulation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Test plan

### Test floor (must stay green)

- `pnpm agent:validate` — 26/26 Category A floor tests.
- `pnpm test` — full vitest suite (current baseline post chunk
  6.2a: 1069/1069). Post chunk 6.2b: 1079-1084 expected (±2 for
  refactor-induced shifts per chunk 6.2a precedent).
- `pnpm typecheck` — green.

### New tests added at chunk 6.2b

**`apps/web/tests/integration/ingestionService.dragDropUpload.integration.test.ts`** (~6 tests):

1. **Multi-file N=1**: single-file path through multi-file shape;
   1 batch + 1 source_document + 1 case + 1 job land.
2. **Multi-file N=3**: typical drag-drop; 1 batch + 3 source_documents
   + 3 cases + 3 jobs + 1 audit row.
3. **Multi-file N=10**: stress shape for chunk 6.1 RPC atomic-N.
4. **Sentinel-shape Zod rejection**: ingestionService input with
   `channel_metadata` matching `{"sentinel": true}` shape rejects
   with typed ServiceError; zero rows land.
5. **Partial-failure simulation**: storageProviderService.put mocked
   to throw on call 3 of 5; verify ServiceError.code =
   'STORAGE_OPERATION_FAILED'; verify ServiceError.details = {
   file_index: 2, filename: '...', stage: 'storage_put' }; verify
   zero rows in ingest_batches / source_documents / document_cases
   / document_jobs (no partial-batch landed).
6. **trace_id correlation**: single trace_id appears in
   ingest_batches.trace_id + audit_log.trace_id; pino captures
   verify same trace_id across log lines.

**`apps/web/tests/integration/dragDropRoute.integration.test.ts`** (~4 tests):

7. **Happy-path multipart POST**: drag-drop POST with valid
   FormData (drop_session_id + 3 files); 201 with
   `{ingest_batch_id, document_count: 3}`.
8. **Zod 400 path**: POST with missing `drop_session_id`; 400 with
   `error: 'INVALID_INPUT'`.
9. **ServiceError → mapped status with details**: POST that
   triggers ingestionService throwing ServiceError; verify response
   status + `details` carry through to client.
10. **Cross-org RLS rejection**: POST with orgId param the
    authenticated user doesn't belong to; verify withInvariants
    rejects per INV-AUTH-001 invariant-3.

**`apps/web/tests/integration/documentCasesRead.integration.test.ts`** (~5 tests):

11. **List-by-batch happy path**: create N=3 batch via
    ingestionService; cards endpoint returns 3 cards with Sub-Q2.1
    columns.
12. **Case-detail happy path**: GET case detail returns single case
    with full ingest_batch context.
13. **Sentinel filter — m152-shape fixture**: create test batch
    with `channel_metadata: { sentinel: true, migration: 152,
    purpose: 'test' }` via `createIngestBatchForTest` helper +
    direct insert; create document_cases pointing at it; cards
    endpoint returns empty list. Case detail returns 404.
14. **Sentinel filter — m153-shape fixture**: same as above but
    `migration: 153`. Both shapes must be filtered (Drift 3
    coverage requirement — narrow-filter regression to
    `{"sentinel": true, "migration": 152}` would silently pass
    test 13 while breaking m153 coverage).
15. **Cross-org RLS rejection**: cards endpoint scoped to orgId
    param; cross-org query returns empty list.

**`apps/web/tests/unit/DocumentIntakeRail.test.tsx`** (~2 tests):

16. **Render test**: empty-state render; verify drop zone present.
17. **Drag-drop event test**: mock `event.dataTransfer.files`;
    verify FormData construction + POST mock invocation.

**`apps/web/tests/unit/DocumentCard.test.tsx`** (~1 test):

18. **Render test**: card with all Sub-Q2.1 columns renders
    correctly.

**Total**: ~18 tests at the upper bound; ~13 at the lower bound
(some sub-tests may consolidate via parameterized describe-blocks).
Brief locks at ~10-15 new tests; expected vitest count 1079-1084.

## Friction-journal placeholder

Pre-drafted (D)-filter entries — materialize at chunk close per
chunk 6.2a Test (D)-filter precedent. Codification volume per chunk
itself remains a trackable inflection per chunk 6.2a What's-next
(chunk 6.2a shipped 4 tier-1 entries; chunk 6.2b forecasts 3 tier-1
entries + 2 forward-pointers + first-instance-precedent codifications).

- **Flag 13 (TIER 1)**: brainstorming-round-vocabulary-not-disk-anchored.
  The chunk 6.2b session's handoff cited "Round 4 submission-envelope
  semantic" as a plan-doc anchor; verify-from-disk surfaced that the
  semantic exists at plan-doc lines 139-156 but no "Round 4" label
  appears in the plan doc (Round labels are brainstorming-session
  artifacts). Codify the discipline: when a brief or handoff cites a
  round-numbered anchor (e.g., "Round 4 X", "Round 7 Y"), verify-
  from-disk MUST confirm the anchor's vocabulary actually exists in
  the cited canonical artifact. Round labels in brainstorming
  vocabulary do not propagate to disk; briefs must cite disk anchors
  (line ranges, section names, file paths). Sibling discipline to
  RI-6 verify-from-disk five-grain. First-instance codification at
  chunk 6.2b close.

- **First-instance precedent — Next.js native multipart parser**:
  chunk 6.2b introduces the first multipart parser in `apps/web/src/app/api/`.
  Convention locked: Next.js native `Request.formData()` (no external
  library; no streaming parser; relies on platform body limits as
  implicit cap). Future chunks needing multipart inherit this
  convention. Greppable convention: search for `await req.formData()`
  in route handlers. Codify at chunk close.

- **First-instance precedent — drag-drop UI**: chunk 6.2b introduces
  the first drag-drop UI in `apps/web/src/components/`. Convention
  locked: native HTML5 `onDragOver` / `onDrop` events (no external
  library; no react-dropzone; Tailwind-only styling per existing
  canvas-component convention). Future chunks needing drag-drop
  inherit this convention. Codify at chunk close.

- **Flag 14 (FORWARD-POINTER — Phase 6 retrospective)**:
  ADR-0014-§6-ingestion-stage-grain-ambiguity. §6 literal reading
  ("Before writing a new source_document row, the ingestion path
  computes SHA-256 ... checks for existing match") puts dedup at
  Phase 6 ingestion. But §6 also says "The check fires at the OCR-
  pipeline ingest stage" — which is Phase 7 territory. Plan-doc
  precedent ("Phase 6 defers: dedup (Phase 7 Stage 0)") overrides
  the literal §6 reading. Codify the grain-ambiguity at Phase 6
  retrospective for ADR-0014 §6 wording clarification + plan-doc-
  precedent-overrides-ADR-wording as a precedent worth tracking.

- **Flag 15 (FORWARD-POINTER — Phase 6 retrospective)**:
  Sub-Q3 ↔ Sub-Q9 submission-envelope cross-Sub-Q dependency.
  Sub-Q3 (multi-file POST shape) + Sub-Q9 (all-or-nothing failure
  shape) JOINTLY preserve "1 batch per submission event." If a
  future chunk introduces (b)-style partial-batch handling, it
  must reconcile with the Sub-Q3 lock or amend it. Tier-2
  codification candidate at Phase 6 retrospective.

- **If Task 12 LOC count diverges from forecast by > 30%**:
  friction-journal entry codifying volume-forecast drift + proposed
  calibration adjustment for chunk 6.3 forecast.

- **If Task 1 verify-from-disk surfaces drift from brief's locked
  substrate state** (e.g., route count, RPC signature, sentinel
  shape): friction-journal entry codifying the divergence +
  adjusting Task plan sub-tasks accordingly.

- **If Task 8 ContextualCanvas integration shape surfaces non-
  obvious decision** (per Flag 3): friction-journal entry codifying
  the chosen integration mechanism.

If implementation surfaces ZERO deviations beyond the pre-drafted
entries above, those entries ship at chunk 6.2b close.

## What's next

**Chunk 6.3 onset notes**:

Chunk 6.3 ships forwarded_mailbox path + Phase 6 retrospective.
Inherits chunk 6.2b's ingestionService Pattern B shape; adds
`handleForwardedMailbox(orgId, emailPayload, traceId)` method that
parses email body + attachments and composes the same 5-table write
via chunk 6.1 RPC. Adds the `forwarded_mailbox` branch to the Zod
discriminated union at `ingestBatch.schema.ts` (with `sender_address`
+ `subject` + `message_id` + `raw_headers` in channel_metadata).

Chunk 6.3 scope-lock sub-questions:

- Mail provider choice — SES / Mailgun / Postmark / Cloudflare Email
  Routing. Trade-offs adjudicated at chunk 6.3 scope-lock.
- Email parsing library — mailparser / custom / provider-built-in.
- Allowlist enforcement path — silent drop / audit-log + drop /
  quarantine (spend §8.6 implies silent drop + audit-log).
- Email body rendering — store rendered HTML, plain-text, or both
  (affects content_hash computation).
- email_body `document_case_sources` row writing — Phase 6 writes
  this single role at chunk 6.3 (only unambiguous role pre-
  classification).

**Phase 6 retrospective at chunk 6.3 close consolidates**:

- 15 RI candidates carry forward from chunks 6.1 + 6.2a + 6.2b
  (12 chunk-6.1 + 3 new at chunk 6.2b: Flag 13 + Flag 14 + Flag
  15). Chunk 6.3 may add 4-6 more (mail provider lock + email
  parsing + allowlist enforcement + email_body case_sources +
  potentially the `forwarded_mailbox` Zod variant shape).
- Total Phase 6 RI inventory at full accumulation: **21-25 candidates**
  (revised from chunk 6.1 close meta-observation #2 estimate of
  18-22; Flag 15 added at chunk 6.2b).
- Phase 6 retrospective workload may exceed single-session
  reliable delivery per chunk 6.1 close meta-observation #2.
  Chunk 6.3 scope-lock fit-check question examines whether
  retrospective fits in chunk 6.3 or splits to chunk 6.4.

**Codification candidates flagged for Phase 6 retrospective**:

- Path C invocation as RI-7-evidence-driven + prospective (chunk
  6.2a graduation; observation-grain N=2 below codification
  threshold; second-instance entry codifies prospective-vs-reactive
  sub-discipline).
- Brief-grain `Na`/`Nb` suffix convention (chunk 6.2a first-instance
  precedent at brief-grain).
- `_for_test` suffix convention (chunk 6.2a first-instance precedent;
  mirrors `_with_audit` for mutating RPC).
- Grain-5-test-floor enumeration as scope-lock substrate (chunk
  6.2a tier-1 entry).
- Brainstorming-round-vocabulary-not-disk-anchored (chunk 6.2b
  Flag 13 first-instance).
- ADR-0014-§6-ingestion-stage-grain-ambiguity (chunk 6.2b Flag 14
  forward-pointer).
- Sub-Q3 ↔ Sub-Q9 submission-envelope cross-Sub-Q dependency
  (chunk 6.2b Flag 15 forward-pointer).
- Next.js native multipart parser as first-instance precedent
  (chunk 6.2b).
- Drag-drop UI native HTML5 events as first-instance precedent
  (chunk 6.2b).

**Test baseline going into chunk 6.3**:

`pnpm test` baseline post chunk 6.2b: ~1079-1084 (1069 chunk 6.2a
baseline + 10-15 chunk 6.2b additions). `pnpm agent:validate`:
26/26 Category A floor.

Chunk 6.3 brief-drafting starts from this baseline.
