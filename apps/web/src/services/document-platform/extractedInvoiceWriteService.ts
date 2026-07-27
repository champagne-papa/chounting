// src/services/document-platform/extractedInvoiceWriteService.ts
//
// Board #4 slice-2 Task T2a — the α-write service. Layer-2 write surface
// for the extracted_invoices (α) entity, called by Stage 2.5 (the
// segmenter, T2) once per segmented invoice region.
//
// Per ADR-0020 authority gradient: agent stage → service → db. The
// agent-layer Stage 2.5 does NOT insert directly; it calls this service,
// which calls the audit-pairing RPC create_extracted_invoice_with_audit
// (migration 20240181000000) — so every α row lands with its paired
// audit_log row in one transaction (org_id derived from the parent
// document_case inside the RPC; INV-AUDIT-001).
//
// Writes a PENDING α row: post_status defaults to 'pending', and
// posted_bill_id / idempotency_key stay NULL (set later at T3/T5 through
// the write-once trigger). This service never sets those — it is the
// creation surface only.
//
// INV-SERVICE-002 adminClient discipline: DB access via adminClient().
// Pattern mirrors extractionArtifactWriteService (the sibling Stage-2
// artifact-write service) + ingestionService's RPC-call shape.

import crypto from 'crypto';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import type { Json } from '@/db/types';

const SYSTEM_CREATED_BY = 'pipeline_orchestrator';
const AUDIT_ACTION = 'extracted_invoice_created';
const AUDIT_ENTITY_TYPE = 'extracted_invoice';
// Board #4 T3 — the post-phase α write (posted_bill_id/post_status/idempotency_key).
const POST_AUDIT_ACTION = 'extracted_invoice_posted';
// Board #4 T6a — the G3 crash-class mark (post_status='unrepairable', no bill).
const UNREPAIRABLE_AUDIT_ACTION = 'extracted_invoice_unrepairable';

export interface CreateExtractedInvoiceInput {
  document_case_id: string;
  source_document_id: string;
  /** 1..N within the case, over a deterministic Stage-2.5 sort. */
  ordinal: number;
  document_type:
    | 'vendor_invoice'
    | 'receipt'
    | 'payment_confirmation'
    | 'unknown';
  /** Per-invoice extraction payload (a VendorInvoiceExtraction etc.). */
  extracted_fields: Record<string, unknown>;
  /** Coarse provenance to the OCR/extraction pass; NULL by design
   *  (α, not extraction_runs, is the per-region provenance home). */
  extraction_run_id?: string | null;
  /** Segment bbox / line-range (N-1 provenance). */
  region_ref?: Record<string, unknown> | null;
  trace_id: string;
  /** created_by attribution; defaults to the pipeline system actor. */
  created_by?: string;
}

/**
 * Inserts one PENDING extracted_invoices (α) row + its paired audit_log
 * row via create_extracted_invoice_with_audit (atomic; parent-derived
 * org_id). Returns the new α id.
 *
 * Throws ServiceError('POST_FAILED') on RPC failure (FK miss, the
 * (document_case_id, ordinal) UNIQUE, or a CHECK violation).
 */
export async function createExtractedInvoice(
  input: CreateExtractedInvoiceInput,
): Promise<string> {
  const db = adminClient();
  const id = crypto.randomUUID();
  const createdBy = input.created_by ?? SYSTEM_CREATED_BY;

  // p_invoice: the RPC reads extraction_run_id via NULLIF(...,'')::uuid,
  // so '' encodes NULL; region_ref is passed as JSONB (null allowed).
  const p_invoice = {
    id,
    document_case_id: input.document_case_id,
    source_document_id: input.source_document_id,
    ordinal: input.ordinal,
    document_type: input.document_type,
    extracted_fields: input.extracted_fields as Json,
    extraction_run_id: input.extraction_run_id ?? '',
    region_ref: (input.region_ref ?? null) as Json,
    trace_id: input.trace_id,
    created_by: createdBy,
  };

  // p_audit: system-actor write (user_id NULL). entity_id is set to the
  // new α id inside the RPC; after_state_id/idempotency_key NULLIF-encoded.
  const p_audit = {
    user_id: '',
    trace_id: input.trace_id,
    action: AUDIT_ACTION,
    entity_type: AUDIT_ENTITY_TYPE,
    before_state: null,
    after_state_id: '',
    tool_name: SYSTEM_CREATED_BY,
    idempotency_key: '',
    reason: null,
  };

  const { data, error } = await db.rpc('create_extracted_invoice_with_audit', {
    p_invoice,
    p_audit,
  });

  if (error || !data) {
    throw new ServiceError(
      'POST_FAILED',
      `createExtractedInvoice failed for case ${input.document_case_id} ordinal ${input.ordinal}: ${error?.message ?? 'no id returned'}`,
    );
  }

  // Sanity: the RPC returns the id it INSERTed.
  if (data !== id) {
    throw new ServiceError(
      'POST_FAILED',
      `createExtractedInvoice: RPC returned unexpected id (expected ${id}, got ${String(data)})`,
    );
  }

  return id;
}

// Board #4 slice-2 T3 — the post-phase α write (the first UPDATE path for
// extracted_invoices; T2a above was create-only). Sets posted_bill_id +
// post_status='posted' + the resolved per-invoice idempotency_key, write-once,
// via post_extracted_invoice_with_audit (migration 20240184000000) so the
// paired audit lands in one transaction (org derived from the parent case).
//
// Write-once + coherence live in the T1 substrate triggers/CHECK, not here: a
// SAME-value re-post no-ops (the recovery-safe re-approval of an already-posted
// α), a DIFFERENT-bill re-post is rejected by the immutability trigger
// (feature_not_supported → mapped to INVALID_TRANSITION below). Attribution is
// the HUMAN reviewer (posted_by) — honest causality, same as the JE created_by
// and the committed marking on the approve-post route.
export interface PostExtractedInvoiceInput {
  extracted_invoice_id: string;
  /** The bill this α became (billService.post result). WRITE-ONCE. */
  posted_bill_id: string;
  /** The resolved per-invoice dedup key
   *  (`${caseId}:bill:${vendor_invoice_number-if-unique else ordinal}`,
   *  build-spec §1.5.2). WRITE-ONCE — persisted, never recomputed. */
  idempotency_key: string;
  trace_id: string;
  /** The reviewer whose approval caused the post (audit attribution). */
  posted_by: string;
}

export async function postExtractedInvoice(
  input: PostExtractedInvoiceInput,
): Promise<string> {
  const db = adminClient();
  const { data, error } = await db.rpc('post_extracted_invoice_with_audit', {
    p_post: {
      id: input.extracted_invoice_id,
      posted_bill_id: input.posted_bill_id,
      idempotency_key: input.idempotency_key,
    },
    p_audit: {
      user_id: input.posted_by,
      trace_id: input.trace_id,
      action: POST_AUDIT_ACTION,
      entity_type: AUDIT_ENTITY_TYPE,
      tool_name: null,
      idempotency_key: '',
      reason: null,
    },
  });

  if (error) {
    // feature_not_supported (0A000) from the immutability trigger = a
    // write-once violation (re-post to a DIFFERENT bill, or re-key a resolved
    // key). Recovery-safe same-value re-posts do NOT reach here.
    if (error.code === '0A000') {
      throw new ServiceError(
        'INVALID_TRANSITION',
        `postExtractedInvoice write-once violation for extracted_invoice ${input.extracted_invoice_id}: ${error.message}`,
      );
    }
    throw new ServiceError(
      'POST_FAILED',
      `postExtractedInvoice failed for extracted_invoice ${input.extracted_invoice_id}: ${error.message}`,
    );
  }

  return data as string;
}

// Board #4 slice-2 T6a — the G3 crash-class mark (the second UPDATE path for
// extracted_invoices, after T3's post write). Sets post_status='unrepairable'
// ONLY — posted_bill_id and idempotency_key are left untouched — via
// mark_extracted_invoice_unrepairable_with_audit (migration 20240185000000), so
// the paired audit lands in one transaction (org derived from the parent case).
//
// The CHECK does the work, not this service (T6a brief §2): a pending α
// (bill NULL) succeeds; a POSTED α (bill non-NULL) is rejected by the CHECK
// (23514 — NOT the write-once trigger's 0A000, because the UPDATE doesn't touch
// the bill, so the trigger passes and the CHECK is what fails) → mapped to
// INVALID_TRANSITION below, a NEW mapping 3a does not carry; a same-value
// re-mark no-ops. Attribution is the HUMAN reviewer whose approval surfaced the
// crash-class (marked_by) — honest causality, same as postExtractedInvoice.
//
// Called by the T6b route loop (the ~:431 recovery-sub-call catch); NOT wired
// here — this is the substrate write path, proven in isolation.
export interface MarkExtractedInvoiceUnrepairableInput {
  extracted_invoice_id: string;
  trace_id: string;
  /** The reviewer whose approval surfaced the crash-class (audit attribution). */
  marked_by: string;
}

export async function markExtractedInvoiceUnrepairable(
  input: MarkExtractedInvoiceUnrepairableInput,
): Promise<string> {
  const db = adminClient();
  const { data, error } = await db.rpc(
    'mark_extracted_invoice_unrepairable_with_audit',
    {
      p_post: {
        id: input.extracted_invoice_id,
      },
      p_audit: {
        user_id: input.marked_by,
        trace_id: input.trace_id,
        action: UNREPAIRABLE_AUDIT_ACTION,
        entity_type: AUDIT_ENTITY_TYPE,
        tool_name: null,
        idempotency_key: '',
        reason: null,
      },
    },
  );

  if (error) {
    // check_violation (23514) from the T1 CHECK = marking a POSTED α
    // unrepairable (its bill is non-NULL, so post_status='unrepairable' trips
    // (post_status='posted') = (posted_bill_id IS NOT NULL)). This is the NEW
    // mapping 3a does not carry — a posted α can never be silently reclassified
    // as a crash-failure. 0A000 is a defensive guard for a write-once violation
    // (not expected here: T6a touches no write-once column).
    if (error.code === '23514' || error.code === '0A000') {
      throw new ServiceError(
        'INVALID_TRANSITION',
        `markExtractedInvoiceUnrepairable rejected for extracted_invoice ${input.extracted_invoice_id}: ${error.message}`,
      );
    }
    throw new ServiceError(
      'POST_FAILED',
      `markExtractedInvoiceUnrepairable failed for extracted_invoice ${input.extracted_invoice_id}: ${error.message}`,
    );
  }

  return data as string;
}
