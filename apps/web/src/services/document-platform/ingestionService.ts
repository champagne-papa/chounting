// src/services/document-platform/ingestionService.ts
//
// INV-SERVICE-001 wrap-site discipline:
//   - handleDragDropUpload: Pattern B external-wrap per Phase 5 spend
//     brief precedent. The service body has NO `withInvariants`
//     reference; the drag-drop route wraps at the call site via an
//     adapter closure that also binds the required IngestInvoker
//     (Class D T4 inversion; the route is actionless per the
//     chunk-6.2b action-seeding deferral — the prior example here
//     showed an { action } option the route never shipped):
//       withInvariants((input, c) =>
//         ingestionService.handleDragDropUpload(input, c, ingestDocument),
//       )(input, ctx)
//   - handleForwardedMailbox (chunk 6.3a): system-actor invocation
//     pattern. Webhook route handler bypasses withInvariants entirely
//     and constructs SystemActorServiceContext directly per Sub-Q6
//     Artifact 3. The withInvariants pre-flight (verified caller +
//     org_id-vs-memberships check) is replaced by HMAC verification
//     + MailboxHash org-resolve at the route handler boundary.
//
// INV-SERVICE-002 adminClient discipline: every database access in
// this file goes through `adminClient()` from `@/db/adminClient`. No
// userClient import; no direct supabase-js client construction.
//
// Per ADR-0020 authority gradient: Layer 2 (services) domain service.
// Allowed import targets: core, db, contracts, shared, services
// (same-layer). NOT allowed: agent, app, React.
//
// =============================================================
// Entity ownership (ADR-0011 §1)
//
// ingestionService is the writer for ingest_batches + source_documents
// + document_cases + document_jobs at Phase 6. Composes
// storageProviderService.put() (per-file bytes I/O, ADR-0013 §1) and
// create_ingest_batch_with_documents_with_audit RPC (atomic 5-table
// substrate write, chunk 6.1 migration 152).
//
// Method surface:
//   - handleDragDropUpload(input, ctx: ServiceContext) — drag-drop
//     entry point (chunk 6.2b).
//   - handleForwardedMailbox(input, ctx: SystemActorServiceContext) —
//     Postmark webhook entry point (chunk 6.3a); adds the
//     `forwarded_mailbox` branch to the channel_metadata Zod
//     discriminated union; composes a 1+N-document write (1 email_body
//     + N attachments) via the same chunk 6.1 RPC with 1-element
//     p_case_sources (role='email_body').
//
// Per-channel write composition (drag-drop, N files; plan-doc lines
// 139-156):
//   1 ingest_batches row (channel=drag_drop_pdf,
//                         channel_metadata={drop_session_id})
//   N source_documents rows (each with ingest_batch_id populated;
//                            Step C enforces NOT NULL post-chunk-6.2a)
//   N document_cases rows (1:1 with source_documents; state='received';
//                          document_type='unknown' pre-classification)
//   0 document_case_sources rows (Phase 7 writes primary post-
//                                 classification per ADR-0011 §11;
//                                 drag-drop has no email_body analog)
//   N document_jobs rows (state='queued'; reader = Phase 7 orchestrator)
//   1 audit_log row at batch grain (single trace_id per Sub-Q8 lock +
//                                   INV-AUDIT-001 leaf)
//
// =============================================================
// Sub-Q9 lock: all-or-nothing + Zod pre-validate at ingress
//
// Flow:
//   1. Zod-validate all N files at ingress (Layer 2 boundary). The
//      DragDropUploadInputSchema enforces MIME whitelist + size
//      bounds + sentinel-shape rejection (the symmetric-filter
//      write-side per Sub-Q2.2). If any file fails validation, the
//      entire batch is rejected with ZodError BEFORE any storage put;
//      the route handler catches and returns 400 per the 50-route
//      uniform error contract.
//   2. Sequential storageProviderService.put() per file (Sub-Q6 lock).
//      Each put computes content_hash pre-write, writes bytes, and
//      re-verifies post-write per ADR-0013 §9. PutResult is
//      `{ storage_key, content_hash, byte_size, provider }`. If any
//      put fails mid-batch, throw ServiceError with code
//      STORAGE_OPERATION_FAILED + details.{file_index, filename,
//      stage='storage_put'} (Sub-Q9 R1 mitigation — the caller must
//      be able to identify which file failed). Orphan blobs from
//      successful prior puts are cleaned by ADR-0014 §10 GC
//      (daily cadence, 24-hour threshold).
//   3. Compose RPC payload (p_batch + p_documents + p_cases +
//      p_case_sources [empty] + p_jobs + p_audit).
//   4. Single create_ingest_batch_with_documents_with_audit RPC call.
//      RPC executes atomically across all 5 tables + audit_log. If
//      RPC fails (FK miss, constraint violation, deadlock), all N
//      storage puts orphan for GC; throw ServiceError with code
//      POST_FAILED + details.{stage='rpc'}.
//   5. Return DragDropUploadResult { ingest_batch_id, document_count }.
//
// Sub-Q9 R3 awareness: when a batch fails mid-flow, the trace_id
// appears in ServiceError + pino log lines + (eventually)
// orphan_blob_collected audit events when GC runs. NO business-grain
// rows exist for failed batches (RPC didn't run; no rows landed).
// Forensic queries "what happened with trace_id X?" return error +
// GC audit events with no business-row anchors — this is correct
// per Service Communication Rule 5 (trace_id presence in error +
// audit is what matters). Do NOT "fix" by adding business-grain
// anchors for failed batches; that would contradict the all-or-
// nothing lock.
//
// =============================================================
// Sub-Q8 lock: single trace_id propagation
//
// ctx.trace_id is generated once at buildServiceContext(req)
// (route handler request entry). It propagates unchanged through:
//   - loggerWith() → all pino log lines from this service
//   - storageProviderService.put(ctx) → provider implementation
//     logs / audit events
//   - p_batch.trace_id → ingest_batches.trace_id INSERT
//   - p_audit.trace_id → audit_log.trace_id INSERT
//   - per-case + per-job trace_id in p_cases / p_jobs payloads
// Single trace_id across the entire drag-drop event's 1 batch + N
// source_documents + N cases + N jobs + 1 audit row.
//
// =============================================================
// Sub-Q7 lock: dedup-by-hash deferred to Phase 7 Stage 0
//
// content_hash is computed at storage put time (ADR-0013 §9 integrity-
// verify) — the cost is already paid. But chunk 6.2b does NOT
// short-circuit on duplicate hash; duplicate-content drag-drops
// produce duplicate source_documents rows at v1. Phase 7 Stage 0
// owns the dedup check per plan-doc explicit deferral. ADR-0014 §6
// wording ambiguity (Flag 14) carries forward to Phase 6 retrospective.

import { adminClient } from '@/db/adminClient';
import { recordMutation } from '@/services/audit/recordMutation';
import { resolvePrimaryIngestSource } from './strandedCaseReadService';
import { getStorageProvider } from '@/services/storage/resolver';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import type {
  ServiceContext,
  SystemActorServiceContext,
} from '@/services/middleware/serviceContext';
import {
  DragDropUploadInputSchema,
  ForwardedMailboxChannelMetadataSchema,
} from '@/shared/schemas/document-platform/ingestBatch.schema';
import type {
  DragDropUploadInput,
  DragDropUploadResult,
  ForwardedMailboxUploadInput,
  ForwardedMailboxUploadResult,
  IngestInvoker,
} from './types';

// v1 system-fixed per ADR-0013 §2 mechanical selection. Per-org
// configurability lands when org_settings sub-arc ships post-v1.
//
// SAFETY INVARIANT (Charter B (a) Task 5, migration 20240178 deferred-Zod
// carry): the storage_provider Layer-1 CHECK now admits 'sharepoint_drive'
// (migration 20240178), but the Layer-2 Zod admit-set was intentionally
// deferred — there is no admit-set to add to today and no untrusted input
// to guard, because this value is a server-stamped CONSTANT, not an input
// crossing a validation boundary. The moment selection makes
// storage_provider dynamic (the org_settings.default_storage_provider +
// resolver-selection arc), the Layer-2
// z.enum(['supabase_storage','sharepoint_drive']) admit-set MUST land in
// that SAME arc — they are a pair that cannot separate once the value is
// selectable. This constant going dynamic IS the trigger.
//
// MARGIN NARROWED at Task 6 (resolver activation): the gap originally
// held on TWO independent conditions — (a) this constant stays hardcoded
// supabase_storage, and (b) the resolver throws for 'sharepoint_drive'.
// As of Task 6 the resolver now RETURNS a provider for 'sharepoint_drive'
// (no longer throws), so (b) no longer holds; the gap rests SOLELY on (a).
// Still safe — every write stamps this constant, so nothing passes
// 'sharepoint_drive' to getStorageProvider in production — but the
// hardcoded-value condition is now doing all the work until the
// selection arc lands the Zod.
const V1_STORAGE_PROVIDER = 'supabase_storage' as const;

async function handleDragDropUploadImpl(
  input: DragDropUploadInput,
  ctx: ServiceContext,
  // REQUIRED (Class D T4): the entry surface supplies the pipeline
  // invoker; no default — an optional no-op would silently skip the
  // pipeline, and a service-side agent default would re-create the
  // services→agent edge this parameter removes.
  invokeIngest: IngestInvoker,
): Promise<DragDropUploadResult> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id,
    org_id: input.org_id,
  });

  // Step 1: Zod-validate at ingress (Layer 2 boundary).
  //
  // .parse() throws ZodError on failure; the route handler's
  // `if (err instanceof z.ZodError)` catch maps to a 400 response per
  // the 50-route uniform error contract. Sentinel-shape ingress
  // rejection lives at this layer (symmetric write-side per Sub-Q2.2).
  const parsed = DragDropUploadInputSchema.parse(input);

  log.info(
    {
      file_count: parsed.files.length,
      drop_session_id: parsed.drop_session_id,
    },
    'ingestionService.handleDragDropUpload: validated',
  );

  // Step 2: Sequential storageProviderService.put() per file.
  //
  // Sub-Q6 lock: sequential, not parallel. Drag-drop with typical
  // file sizes (1-10MB) at N≤20 files is well within the v1
  // throughput budget; sequential is the simplest error-handling
  // shape.
  //
  // Per-file storage put is NOT transactional with the subsequent
  // chunk 6.1 RPC. Successful prior puts before a mid-batch failure
  // orphan their bytes; ADR-0014 §10 GC cleans them up at the daily
  // 24-hour-threshold cadence.
  const storageProvider = getStorageProvider(V1_STORAGE_PROVIDER);

  // Per-file collected metadata: pre-generated UUID + storage put
  // result + the mime_type from the input (tracked here to avoid a
  // .find() lookup at p_documents construction time).
  const putRecords: Array<{
    source_document_id: string;
    original_filename: string;
    mime_type: string;
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
          org_id: parsed.org_id,
          source_document_id,
          original_filename: file.original_filename,
        },
        ctx,
      );
      putRecords.push({
        source_document_id,
        original_filename: file.original_filename,
        mime_type: file.mime_type,
        storage_key: putResult.storage_key,
        content_hash: putResult.content_hash,
        byte_size: putResult.byte_size,
      });
    } catch (err) {
      // Sub-Q9 R1 mitigation: the caller must be able to identify
      // which file failed. ServiceError.details carries the file index
      // (zero-based) + filename + stage.
      log.warn(
        {
          file_index: i,
          filename: file.original_filename,
          underlying:
            err instanceof Error ? err.message : String(err),
        },
        'ingestionService.handleDragDropUpload: storage put failed; aborting batch',
      );
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
  //
  // Per chunk 6.1 RPC body (migration 152 lines 470-611). All 6
  // JSONB params required; p_case_sources is an empty array at Phase
  // 6 drag-drop (Sub-Q for chunk 6.2b: 0 rows; Phase 7 writes primary
  // post-classification).
  const ingest_batch_id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const p_batch = {
    id: ingest_batch_id,
    org_id: parsed.org_id,
    ingest_channel: 'drag_drop_pdf' as const,
    received_at: nowIso,
    channel_metadata: { drop_session_id: parsed.drop_session_id },
    trace_id: ctx.trace_id,
    created_by: ctx.caller.user_id,
  };

  const p_documents = putRecords.map((r) => ({
    id: r.source_document_id,
    org_id: parsed.org_id,
    // legal_entity_id defaults to org_id per ADR-0011 §10 v1 1-1
    // mapping (Phase 1 documentPlatformService precedent).
    legal_entity_id: parsed.org_id,
    storage_provider: V1_STORAGE_PROVIDER,
    original_storage_key: r.storage_key,
    original_content_hash: r.content_hash,
    original_byte_size: r.byte_size,
    original_filename: r.original_filename,
    mime_type: r.mime_type,
    ingest_channel: 'drag_drop_pdf' as const,
    // ingest_batch_id is overridden by v_batch_id in the RPC body
    // (the RPC ignores per-doc batch_id and uses the batch row's
    // id); passing it explicitly is documentary.
    ingest_batch_id,
    // storage_status = 'available' because put() above completed
    // put-and-verify per ADR-0013 §9 (matches Phase 1
    // documentPlatformService precedent).
    storage_status: 'available' as const,
    received_at: nowIso,
    created_by: ctx.caller.user_id,
  }));

  // document_cases: one case per source_document (1:1 at Phase 6).
  // document_type='unknown' because classification has not yet run
  // (Phase 7 transitions to vendor_invoice / receipt / etc.).
  // state='received' is the canonical pre-classification state.
  const caseIds = putRecords.map(() => crypto.randomUUID());
  const p_cases = putRecords.map((_r, i) => ({
    id: caseIds[i],
    org_id: parsed.org_id,
    document_type: 'unknown' as const,
    state: 'received' as const,
    trace_id: ctx.trace_id,
    created_by: ctx.caller.user_id,
  }));

  // document_case_sources: empty at Phase 6 drag-drop per Sub-Q +
  // plan-doc lines 150-154. Phase 7 writes primary role post-
  // classification.
  const p_case_sources: never[] = [];

  // document_jobs: one job per source_document; reader = Phase 7
  // orchestrator. state='queued' is the canonical pre-Phase-7 state.
  const p_jobs = putRecords.map((r, i) => ({
    id: crypto.randomUUID(),
    org_id: parsed.org_id,
    source_document_id: r.source_document_id,
    document_case_id: caseIds[i],
    // ingest_batch_id is overridden by v_batch_id in the RPC body;
    // documentary on the per-job payload.
    ingest_batch_id,
    state: 'queued' as const,
    trace_id: ctx.trace_id,
    created_by: ctx.caller.user_id,
  }));

  // Single audit_log row at batch grain per INV-AUDIT-001 leaf +
  // chunk 6.1 INV-AUDIT-001 lock. entity_id is set inside the RPC
  // body to v_batch_id (the just-INSERTed ingest_batches.id).
  const p_audit = {
    org_id: parsed.org_id,
    user_id: ctx.caller.user_id,
    trace_id: ctx.trace_id,
    action: 'ingest_batch_created',
    entity_type: 'ingest_batch',
    before_state: null,
    after_state_id: ingest_batch_id,
    tool_name: null,
    idempotency_key: null,
    reason: null,
  };

  // Step 4: Atomic RPC call.
  const db = adminClient();
  const { data, error } = await db.rpc(
    'create_ingest_batch_with_documents_with_audit',
    {
      p_batch,
      p_documents,
      p_cases,
      p_case_sources,
      p_jobs,
      p_audit,
    },
  );

  if (error) {
    log.warn(
      { ingest_batch_id, underlying: error.message },
      'ingestionService.handleDragDropUpload: RPC failed; storage puts orphaned for GC',
    );
    throw new ServiceError(
      'POST_FAILED',
      `Ingest batch RPC failed: ${error.message}`,
      { stage: 'rpc', underlying: error.message },
    );
  }

  // Sanity check: RPC returns the batch id we passed in.
  if (!data || data !== ingest_batch_id) {
    throw new ServiceError(
      'POST_FAILED',
      `RPC returned unexpected batch id: expected ${ingest_batch_id}, got ${String(data)}`,
      { stage: 'rpc' },
    );
  }

  log.info(
    { ingest_batch_id, document_count: parsed.files.length },
    'ingestionService.handleDragDropUpload: complete',
  );

  // Phase 7 chunk 7.1a Task 7.1a.8 — orchestrator invocation hook.
  // Per Sub-Q2 sync v1 invocation lock: invoke the pipeline per
  // source_document post-ingestion-commit, via the injected
  // invokeIngest (Class D T4 inversion — the concrete ingestDocument
  // is wired at the drag-drop route; this service holds no @/agent
  // import). Pattern B external-wrap best-effort isolation per Phase
  // 5.1 chunk 5.1b T2 dispatcher precedent — pipeline failures emit
  // failure-class audit events internally; HTTP response always
  // returns the successful DragDropUploadResult.
  for (const record of putRecords) {
    try {
      await invokeIngest({
        org_id: parsed.org_id,
        source_document_id: record.source_document_id,
        trace_id: ctx.trace_id,
      });
    } catch (orchErr) {
      log.error(
        {
          err: orchErr,
          source_document_id: record.source_document_id,
          trace_id: ctx.trace_id,
        },
        'ingestionService.handleDragDropUpload: orchestrator invocation failed (best-effort; not propagating)',
      );
    }
  }

  return {
    ingest_batch_id,
    document_count: parsed.files.length,
  };
}

// =============================================================
// handleForwardedMailbox (Phase 6 chunk 6.3a)
//
// Takes SystemActorServiceContext (sister type per β-3 Approach B).
// Bypasses withInvariants per Sub-Q6 Artifact 3: webhook route handler
// constructs system-actor ctx and calls this method directly.
//
// Composition (1+N attachments):
//   1 ingest_batches row
//     channel='forwarded_mailbox'; channel_metadata = {from, to, subject,
//     message_id, attachment_count}
//   N+1 source_documents rows
//     [0] = email_body (text/plain or text/html; subject-derived filename)
//     [1..N] = attachments (preserved filenames + mime_types)
//   1 document_cases row
//     state='received'; document_type='unknown'
//   1 document_case_sources row
//     role='email_body'; references p_documents[0]
//   N+1 document_jobs rows
//     state='queued'; one per source_document
//   1 audit_log row at batch grain (inside chunk-6.1 RPC)
//
// Allowlist (Sub-Q4): SELECT internal_sender_allowlist WHERE
// sender_address = input.from.toLowerCase(). If miss: emit
// `forwarded_mailbox.rejected_not_allowlisted` audit via recordMutation
// (org-scoped trace_id + before_state with non-PII fields); return
// `{ status: 'rejected', reason: 'not_allowlisted' }`. No storage puts.
//
// Idempotency (Sub-Q2 sub-decision iii): pre-RPC SELECT against the
// migration-155 partial UNIQUE index. On hit, return existing batch_id;
// no storage puts. Race-condition retry path: RPC unique_violation
// (23505 from idx_ingest_batches_forwarded_mailbox_message_id) caught
// and resolved via SELECT.
// =============================================================

// Sub-Q7 lock: synthetic filename composition for email_body
// source_document. Exact 100-char truncation (no ellipsis); strip
// invalid filename chars; .eml extension. Empty subject falls back to
// `email-body-<msg_id_short>.eml`. Extension at storage path derives
// from mime_type; original_filename carries `.eml` regardless.
const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;
const SUBJECT_TRUNCATION_LIMIT = 100;

export function composeEmailBodyFilename(args: {
  subject: string;
  message_id: string;
}): string {
  const trimmed = args.subject.trim();
  if (trimmed === '') {
    // Use first 8 chars of message_id as a stable short identifier.
    // message_id is provider-assigned (Postmark); not user-input PII.
    const short = args.message_id.replace(INVALID_FILENAME_CHARS, '-').slice(0, 8);
    return `email-body-${short}.eml`;
  }
  const sanitized = trimmed.replace(INVALID_FILENAME_CHARS, '-');
  const truncated = sanitized.slice(0, SUBJECT_TRUNCATION_LIMIT);
  return `${truncated}.eml`;
}

const ALLOWLIST_AUDIT_TOOL_NAME = 'ingestionService.handleForwardedMailbox';
const SYSTEM_CREATED_BY = 'ingestionService.handleForwardedMailbox';

async function handleForwardedMailboxImpl(
  input: ForwardedMailboxUploadInput,
  ctx: SystemActorServiceContext,
  // REQUIRED (mailbox-finish 2026-06-07): the webhook entry surface supplies
  // the pipeline invoker, mirroring handleDragDropUpload's Class D T4
  // inversion. No default — an optional no-op would silently skip the
  // pipeline (the pre-mailbox-finish behavior this arc removes: mailbox docs
  // sat 'received' until a manual sweep), and a service-side @/agent default
  // would re-create the services→agent edge the inversion removed.
  invokeIngest: IngestInvoker,
): Promise<ForwardedMailboxUploadResult> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    org_id: input.org_id,
  });

  const db = adminClient();
  const fromLower = input.from.toLowerCase();

  // Step 1: Allowlist check (Sub-Q4 lock).
  const { data: allowMatch, error: allowErr } = await db
    .from('internal_sender_allowlist')
    .select('sender_address')
    .eq('sender_address', fromLower)
    .maybeSingle();

  if (allowErr) {
    log.warn(
      { underlying: allowErr.message },
      'ingestionService.handleForwardedMailbox: allowlist SELECT failed',
    );
    throw new ServiceError(
      'POST_FAILED',
      `Allowlist lookup failed: ${allowErr.message}`,
      { stage: 'allowlist_select', underlying: allowErr.message },
    );
  }

  if (!allowMatch) {
    // Allowlist rejection: emit audit; return rejection result.
    // before_state per Sub-Q4 lock (org-scoped audit; trace_id is the
    // route-handler-generated system trace_id).
    log.info(
      { from: fromLower, message_id: input.message_id },
      'ingestionService.handleForwardedMailbox: sender not allowlisted',
    );
    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'forwarded_mailbox.rejected_not_allowlisted',
      entity_type: 'forwarded_mailbox',
      before_state: {
        from: fromLower,
        to: input.to,
        subject: input.subject,
        message_id: input.message_id,
        attachment_count: input.attachments.length,
        reason: 'sender_not_in_allowlist',
      },
      tool_name: ALLOWLIST_AUDIT_TOOL_NAME,
    });
    return { status: 'rejected', reason: 'not_allowlisted' };
  }

  // Step 2: Pre-RPC idempotency check (Sub-Q2 sub-decision iii).
  // Cheap SELECT against the migration-155 partial UNIQUE index;
  // most Postmark retries short-circuit here without storage puts.
  const { data: existing, error: existingErr } = await db
    .from('ingest_batches')
    .select('id')
    .eq('org_id', input.org_id)
    .eq('ingest_channel', 'forwarded_mailbox')
    .filter('channel_metadata->>message_id', 'eq', input.message_id)
    .maybeSingle();

  if (existingErr) {
    log.warn(
      { underlying: existingErr.message },
      'ingestionService.handleForwardedMailbox: idempotency SELECT failed',
    );
    throw new ServiceError(
      'POST_FAILED',
      `Idempotency lookup failed: ${existingErr.message}`,
      { stage: 'idempotency_select', underlying: existingErr.message },
    );
  }

  if (existing) {
    log.info(
      { ingest_batch_id: existing.id, message_id: input.message_id },
      'ingestionService.handleForwardedMailbox: idempotent ack',
    );
    return { status: 'idempotent', ingest_batch_id: existing.id };
  }

  // Step 3: Compose the email_body file via Sub-Q7 lock.
  // p_documents[0] = email_body; p_documents[1..N] = attachments.
  // The positional convention is preserved through:
  //   p_documents[0].id == p_case_sources[0].source_document_id
  // Phase 7 post-classification will write p_case_sources for indices
  // 1..N (attachment roles primary/supporting/payment_evidence per
  // ADR-0011 §11 division of labor).
  const emailBodyWithFilename: ForwardedMailboxFileInputWithSyntheticName = {
    ...input.email_body,
    original_filename: composeEmailBodyFilename({
      subject: input.subject,
      message_id: input.message_id,
    }),
  };
  const orderedFiles = [emailBodyWithFilename, ...input.attachments];

  // Step 4: Sequential storage puts (mirrors handleDragDropUpload).
  // No parallelism at v1 per Sub-Q6 (drag-drop) carry-forward.
  const storageProvider = getStorageProvider(V1_STORAGE_PROVIDER);
  const putRecords: Array<{
    source_document_id: string;
    original_filename: string;
    mime_type: string;
    storage_key: string;
    content_hash: string;
    byte_size: number;
  }> = [];

  for (let i = 0; i < orderedFiles.length; i++) {
    const file = orderedFiles[i];
    const source_document_id = crypto.randomUUID();
    try {
      const putResult = await storageProvider.put(
        {
          bytes: file.bytes,
          mime_type: file.mime_type,
          org_id: input.org_id,
          source_document_id,
          original_filename: file.original_filename,
        },
        ctx,
      );
      putRecords.push({
        source_document_id,
        original_filename: file.original_filename,
        mime_type: file.mime_type,
        storage_key: putResult.storage_key,
        content_hash: putResult.content_hash,
        byte_size: putResult.byte_size,
      });
    } catch (err) {
      log.warn(
        {
          file_index: i,
          filename: file.original_filename,
          underlying: err instanceof Error ? err.message : String(err),
        },
        'ingestionService.handleForwardedMailbox: storage put failed; aborting batch',
      );
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        `Storage write failed for file ${i + 1} of ${orderedFiles.length} (${file.original_filename})`,
        {
          file_index: i,
          filename: file.original_filename,
          stage: 'storage_put',
          underlying: err instanceof Error ? err.message : String(err),
        },
      );
    }
  }

  // Step 5: Compose RPC payload.
  const ingest_batch_id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  // channel_metadata snake_case post-Postmark-transform per Sub-Q6
  // Artifact 1. Validate at construction to enforce the symmetric
  // Layer-2-write-side discipline (mirrors drag-drop Sub-Q2.2 lock).
  const channel_metadata = ForwardedMailboxChannelMetadataSchema.parse({
    from: input.from,
    to: input.to,
    subject: input.subject,
    message_id: input.message_id,
    attachment_count: input.attachments.length,
  });

  const p_batch = {
    id: ingest_batch_id,
    org_id: input.org_id,
    ingest_channel: 'forwarded_mailbox' as const,
    received_at: nowIso,
    channel_metadata,
    trace_id: ctx.trace_id,
    created_by: SYSTEM_CREATED_BY,
  };

  const p_documents = putRecords.map((r) => ({
    id: r.source_document_id,
    org_id: input.org_id,
    legal_entity_id: input.org_id,
    storage_provider: V1_STORAGE_PROVIDER,
    original_storage_key: r.storage_key,
    original_content_hash: r.content_hash,
    original_byte_size: r.byte_size,
    original_filename: r.original_filename,
    mime_type: r.mime_type,
    ingest_channel: 'forwarded_mailbox' as const,
    ingest_batch_id,
    storage_status: 'available' as const,
    received_at: nowIso,
    created_by: SYSTEM_CREATED_BY,
  }));

  // Forwarded_mailbox: single document_case per email (NOT 1:1 with
  // source_documents like drag-drop). All N+1 source_documents share
  // this case_id.
  const case_id = crypto.randomUUID();
  const p_cases = [
    {
      id: case_id,
      org_id: input.org_id,
      document_type: 'unknown' as const,
      state: 'received' as const,
      trace_id: ctx.trace_id,
      created_by: SYSTEM_CREATED_BY,
    },
  ];

  // p_documents[0] is the email_body source_document; subsequent indices
  // are attachments. p_case_sources[0].source_document_id references
  // p_documents[0].id. Phase 7 will write p_case_sources for indices
  // 1..N as attachment-role rows post-classification.
  const p_case_sources = [
    {
      id: crypto.randomUUID(),
      document_case_id: case_id,
      source_document_id: p_documents[0].id,
      role: 'email_body' as const,
      trace_id: ctx.trace_id,
      created_by: SYSTEM_CREATED_BY,
    },
  ];

  const p_jobs = putRecords.map((r) => ({
    id: crypto.randomUUID(),
    org_id: input.org_id,
    source_document_id: r.source_document_id,
    document_case_id: case_id,
    ingest_batch_id,
    state: 'queued' as const,
    trace_id: ctx.trace_id,
    created_by: SYSTEM_CREATED_BY,
  }));

  // System-actor user_id is null at runtime per Sub-Q6 Artifact 3.
  // Chunk-6.1 RPC INSERTs audit_log.user_id from p_audit.user_id via
  // `NULLIF(p_audit->>'user_id', '')::uuid` — empty string becomes
  // NULL (migration 113 allows audit_log.user_id NULL).
  const p_audit = {
    org_id: input.org_id,
    user_id: '',
    trace_id: ctx.trace_id,
    action: 'ingest_batch_created',
    entity_type: 'ingest_batch',
    before_state: null,
    after_state_id: ingest_batch_id,
    tool_name: SYSTEM_CREATED_BY,
    idempotency_key: null,
    reason: null,
  };

  // Step 6: Atomic RPC call.
  const { data, error } = await db.rpc(
    'create_ingest_batch_with_documents_with_audit',
    { p_batch, p_documents, p_cases, p_case_sources, p_jobs, p_audit },
  );

  if (error) {
    // Idempotency race-condition: another retry won between our
    // pre-RPC SELECT and our INSERT. Catch unique_violation on the
    // partial UNIQUE index (migration 155 Statement 1; SQLSTATE
    // 23505) and resolve via SELECT.
    if (
      error.code === '23505' ||
      error.message.includes('idx_ingest_batches_forwarded_mailbox_message_id')
    ) {
      log.info(
        { message_id: input.message_id },
        'ingestionService.handleForwardedMailbox: RPC idempotency-race; resolving via SELECT',
      );
      const { data: raceExisting } = await db
        .from('ingest_batches')
        .select('id')
        .eq('org_id', input.org_id)
        .eq('ingest_channel', 'forwarded_mailbox')
        .filter('channel_metadata->>message_id', 'eq', input.message_id)
        .maybeSingle();
      if (raceExisting) {
        return { status: 'idempotent', ingest_batch_id: raceExisting.id };
      }
    }

    log.warn(
      { ingest_batch_id, underlying: error.message },
      'ingestionService.handleForwardedMailbox: RPC failed; storage puts orphaned for GC',
    );
    throw new ServiceError(
      'POST_FAILED',
      `Ingest batch RPC failed: ${error.message}`,
      { stage: 'rpc', underlying: error.message },
    );
  }

  if (!data || data !== ingest_batch_id) {
    throw new ServiceError(
      'POST_FAILED',
      `RPC returned unexpected batch id: expected ${ingest_batch_id}, got ${String(data)}`,
      { stage: 'rpc' },
    );
  }

  log.info(
    {
      ingest_batch_id,
      document_count: orderedFiles.length,
      message_id: input.message_id,
    },
    'ingestionService.handleForwardedMailbox: complete',
  );

  // mailbox-finish (2026-06-07): synchronous pipeline invocation, ONCE per
  // case, on the primary ingest source (an attachment, not the .eml body —
  // resolvePrimaryIngestSource). NOT a per-source_document loop like
  // drag-drop: drag-drop is 1:1 case:document, but a mailbox batch is N+1
  // documents under ONE case, and the pipeline is single-source +
  // advances the case out of sweep eligibility on success — so invoking
  // per-document would race N+1 runs against one case and (worse) classify
  // the .eml body. Best-effort isolation (Pattern B, drag-drop precedent):
  // pipeline failure is logged, never propagated — the HTTP response stays
  // the successful result and the sweep remains the backstop (case stays
  // 'received', sweep-eligible, recovered via the shared resolver).
  try {
    const primarySourceId = await resolvePrimaryIngestSource(case_id);
    if (primarySourceId) {
      await invokeIngest({
        org_id: input.org_id,
        source_document_id: primarySourceId,
        trace_id: ctx.trace_id,
      });
    } else {
      // Should be unreachable — the RPC just wrote N+1 jobs for this case.
      // Logged (not thrown) so the successful ingest still returns; the
      // sweep backstop will retry.
      log.error(
        { ingest_batch_id, document_case_id: case_id, trace_id: ctx.trace_id },
        'ingestionService.handleForwardedMailbox: no primary ingest source resolved post-RPC; pipeline not invoked (sweep backstop will retry)',
      );
    }
  } catch (orchErr) {
    log.error(
      { err: orchErr, document_case_id: case_id, trace_id: ctx.trace_id },
      'ingestionService.handleForwardedMailbox: orchestrator invocation failed (best-effort; not propagating; sweep backstop will retry)',
    );
  }

  return {
    status: 'accepted',
    ingest_batch_id,
    document_count: orderedFiles.length,
  };
}

// Internal alias: makes the "synthetic-name-stamped email_body" carrying
// type explicit at the array-construction site.
type ForwardedMailboxFileInputWithSyntheticName = ForwardedMailboxUploadInput['email_body'];

export const ingestionService = {
  // Pattern B: methods exported as plain async functions; route handler
  // wraps via withInvariants at the call site. NO withInvariants here.
  handleDragDropUpload: handleDragDropUploadImpl,
  // chunk 6.3a: webhook-invoked system-actor method; route handler
  // constructs SystemActorServiceContext and calls directly (bypasses
  // withInvariants per Sub-Q6 Artifact 3).
  handleForwardedMailbox: handleForwardedMailboxImpl,
};
