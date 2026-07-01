// apps/web/tests/integration/extractedInvoiceWriteService.integration.test.ts
//
// Board #4 slice-2 T2a — behavioral proof of the α-write service +
// the T1 (migration 20240181000000) triggers/constraints it relies on.
// First time T1's write-once trigger and UNIQUE(case, ordinal) are
// exercised against a live DB (they were statically verified at T1).
//
// Assertions map 1:1 to the load-bearing invariants:
//   1. createExtractedInvoice writes a PENDING α (post_status='pending',
//      posted_bill_id NULL) via the audit-pairing RPC.
//   2. write-once idempotency_key (AP-3): NULL→value allowed; value→same
//      allowed (no-op); value→DIFFERENT rejected.
//   3. UNIQUE(document_case_id, ordinal) rejects a duplicate ordinal.
//   4. the paired audit_log row lands with PARENT-DERIVED org_id.
//
// Seeding mirrors documentArtifactsSubstrate.integration.test.ts (the
// sibling substrate test with the same source_document FK spine).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { createExtractedInvoice } from '@/services/document-platform/extractedInvoiceWriteService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('extractedInvoiceWriteService (T2a) — α-write + T1 triggers', () => {
  let ctx: ServiceContext;
  let sourceDocId: string;
  let caseId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const db = adminClient();

    // FK parents for α: an ingest_batch → source_document, and a document_case.
    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([1, 2, 3, 4]),
        mime_type: 'application/pdf',
        original_filename: 't2a-alpha.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;

    caseId = crypto.randomUUID();
    const { error: caseErr } = await db.rpc('create_document_case_with_audit', {
      p_case: {
        id: caseId,
        org_id: SEED.ORG_HOLDING,
        document_type: 'vendor_invoice',
        state: 'received',
        trace_id: ctx.trace_id,
        created_by: ctx.caller.user_id,
      },
      p_audit: {
        org_id: SEED.ORG_HOLDING,
        user_id: ctx.caller.user_id,
        trace_id: ctx.trace_id,
        action: 'document_case_created',
        entity_type: 'document_case',
        before_state: null,
        after_state_id: '',
        tool_name: 'test',
        idempotency_key: '',
        reason: null,
      },
    });
    expect(caseErr).toBeNull();
  });

  afterAll(async () => {
    // α rows are delete-restricted (immutability); they accumulate within
    // the run under a fresh case per run (unique ids). Clean the audit_log
    // rows this test's trace_id produced (same pattern as the sibling test).
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('1. writes a PENDING α via the RPC (post_status=pending, posted_bill_id NULL)', async () => {
    const id = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 1,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: '41.39', vendor_invoice_number: 'CA56SWET7X6I' },
      trace_id: ctx.trace_id,
    });

    const db = adminClient();
    const { data: row, error } = await db
      .from('extracted_invoices')
      .select('id, document_case_id, ordinal, document_type, post_status, posted_bill_id, idempotency_key, extracted_fields')
      .eq('id', id)
      .single();
    expect(error).toBeNull();
    expect(row).not.toBeNull();
    expect(row!.post_status).toBe('pending');
    expect(row!.posted_bill_id).toBeNull();
    expect(row!.idempotency_key).toBeNull();
    expect(row!.ordinal).toBe(1);
    expect(row!.document_type).toBe('vendor_invoice');
    expect((row!.extracted_fields as { amount?: string }).amount).toBe('41.39');
  });

  it('2. write-once idempotency_key (AP-3): NULL→value ok, value→same ok, value→different REJECTED', async () => {
    const id = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 2,
      document_type: 'vendor_invoice',
      extracted_fields: {},
      trace_id: ctx.trace_id,
    });
    const db = adminClient();
    const key1 = `${caseId}:bill:2`;

    // NULL → value: allowed.
    const { error: e1 } = await db
      .from('extracted_invoices')
      .update({ idempotency_key: key1 })
      .eq('id', id);
    expect(e1).toBeNull();

    // value → SAME value: allowed (no-op; not a re-key).
    const { error: e2 } = await db
      .from('extracted_invoices')
      .update({ idempotency_key: key1 })
      .eq('id', id);
    expect(e2).toBeNull();

    // value → DIFFERENT value: REJECTED by the write-once trigger (AP-3).
    // (Drives a genuinely different value, not a trivial same-value rewrite.)
    const { error: e3 } = await db
      .from('extracted_invoices')
      .update({ idempotency_key: `${caseId}:bill:OTHER` })
      .eq('id', id);
    expect(e3).not.toBeNull();

    // The resolved key is unchanged after the rejected re-write.
    const { data: row } = await db
      .from('extracted_invoices')
      .select('idempotency_key')
      .eq('id', id)
      .single();
    expect(row!.idempotency_key).toBe(key1);
  });

  it('3. UNIQUE(document_case_id, ordinal) rejects a duplicate ordinal', async () => {
    await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 3,
      document_type: 'vendor_invoice',
      extracted_fields: {},
      trace_id: ctx.trace_id,
    });

    // Second α with the SAME (case, ordinal) → RPC INSERT hits the UNIQUE →
    // the service throws POST_FAILED.
    await expect(
      createExtractedInvoice({
        document_case_id: caseId,
        source_document_id: sourceDocId,
        ordinal: 3,
        document_type: 'vendor_invoice',
        extracted_fields: {},
        trace_id: ctx.trace_id,
      }),
    ).rejects.toBeInstanceOf(ServiceError);
  });

  it('4. paired audit_log row lands with PARENT-DERIVED org_id', async () => {
    const id = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 4,
      document_type: 'vendor_invoice',
      extracted_fields: {},
      trace_id: ctx.trace_id,
    });

    const db = adminClient();
    const { data: auditRows, error } = await db
      .from('audit_log')
      .select('org_id, action, entity_type, entity_id')
      .eq('entity_id', id);
    expect(error).toBeNull();
    expect(auditRows).toHaveLength(1);
    // org_id derived INSIDE the RPC from the parent document_case (not passed).
    expect(auditRows![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(auditRows![0].action).toBe('extracted_invoice_created');
    expect(auditRows![0].entity_type).toBe('extracted_invoice');
  });
});
