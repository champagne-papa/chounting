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
