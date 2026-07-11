// apps/web/tests/integration/extractedInvoicePostService.integration.test.ts
//
// Board #4 slice-2 T3 (substrate half) — behavioral proof of the α-POST write
// path (postExtractedInvoice + post_extracted_invoice_with_audit RPC, migration
// 20240184000000) in ISOLATION, before the approve-post route fan depends on it.
//
// Load-bearing invariants (each maps to a coupling the route relies on):
//   1. postExtractedInvoice sets posted_bill_id + post_status='posted' + the
//      resolved idempotency_key together (the posted<->bill CHECK holds), and
//      lands a paired audit_log row with PARENT-DERIVED org_id, action
//      'extracted_invoice_posted', and before_state capturing the prior status.
//   2. Recovery-safety: re-posting the SAME bill/key is a no-op success (the
//      re-approval-of-an-already-posted-α path); re-posting a DIFFERENT bill is
//      REJECTED by the T1 write-once trigger -> INVALID_TRANSITION (never a
//      double-write, never a silent re-point).
//
// Seeding mirrors the T2a α-write test + reviewApprovePost's vendor/bill seed.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import {
  createExtractedInvoice,
  postExtractedInvoice,
} from '@/services/document-platform/extractedInvoiceWriteService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('extractedInvoiceWriteService (T3 substrate) — α-POST + T1 write-once trigger', () => {
  let ctx: ServiceContext;
  let sourceDocId: string;
  let caseId: string;
  let billA: string;
  let billB: string;
  let alpha1: string;
  let alpha2: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const db = adminClient();

    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([1, 2, 3, 4]),
        mime_type: 'application/pdf',
        original_filename: 't3-alpha-post.pdf',
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
    if (caseErr) throw new Error(`case seed failed: ${caseErr.message}`);

    // A vendor + two bills for the posted_bill_id FK (write-once needs two).
    const vendorId = crypto.randomUUID();
    const { error: vErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: `T3 Vendor ${crypto.randomUUID().slice(0, 8)}`,
    });
    if (vErr) throw new Error(`vendor seed failed: ${vErr.message}`);

    billA = crypto.randomUUID();
    billB = crypto.randomUUID();
    const { error: bErr } = await db.from('bills').insert([
      { bill_id: billA, org_id: SEED.ORG_HOLDING, vendor_id: vendorId, issue_date: '2026-01-15' },
      { bill_id: billB, org_id: SEED.ORG_HOLDING, vendor_id: vendorId, issue_date: '2026-01-16' },
    ]);
    if (bErr) throw new Error(`bill seed failed: ${bErr.message}`);

    // Two PENDING α rows.
    alpha1 = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 1,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: '100.00', vendor_invoice_number: 'INV0001' },
      trace_id: ctx.trace_id,
    });
    alpha2 = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 2,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: '50.00', vendor_invoice_number: 'INV0002' },
      trace_id: ctx.trace_id,
    });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('1. posts an α (posted_bill_id + post_status=posted + idempotency_key together) with a parent-derived audit row', async () => {
    const key1 = `${caseId}:bill:INV0001`;
    const returned = await postExtractedInvoice({
      extracted_invoice_id: alpha1,
      posted_bill_id: billA,
      idempotency_key: key1,
      trace_id: ctx.trace_id,
      posted_by: ctx.caller.user_id,
    });
    expect(returned).toBe(alpha1);

    const db = adminClient();
    const { data: row, error } = await db
      .from('extracted_invoices')
      .select('post_status, posted_bill_id, idempotency_key')
      .eq('id', alpha1)
      .single();
    expect(error).toBeNull();
    // posted<->bill CHECK coherence: both set together.
    expect(row!.post_status).toBe('posted');
    expect(row!.posted_bill_id).toBe(billA);
    expect(row!.idempotency_key).toBe(key1);

    // Paired audit: parent-derived org, post action, before_state = prior status.
    const { data: audit } = await db
      .from('audit_log')
      .select('org_id, action, entity_type, before_state')
      .eq('entity_id', alpha1)
      .eq('action', 'extracted_invoice_posted');
    expect(audit).toHaveLength(1);
    expect(audit![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(audit![0].entity_type).toBe('extracted_invoice');
    expect((audit![0].before_state as { post_status?: string }).post_status).toBe(
      'pending',
    );
  });

  it('2. recovery-safety: same-bill/key re-post no-ops; DIFFERENT bill AND DIFFERENT key are each REJECTED (both write-once guards through the RPC), α unchanged', async () => {
    const key2 = `${caseId}:bill:INV0002`;
    // First post → billB.
    await postExtractedInvoice({
      extracted_invoice_id: alpha2,
      posted_bill_id: billB,
      idempotency_key: key2,
      trace_id: ctx.trace_id,
      posted_by: ctx.caller.user_id,
    });

    // SAME bill + SAME key again → no-op success (the re-approval-of-posted-α
    // recovery path; write-once sees a not-distinct value and allows it).
    await expect(
      postExtractedInvoice({
        extracted_invoice_id: alpha2,
        posted_bill_id: billB,
        idempotency_key: key2,
        trace_id: ctx.trace_id,
        posted_by: ctx.caller.user_id,
      }),
    ).resolves.toBe(alpha2);

    // DIFFERENT bill (same key, to isolate the posted_bill_id write-once) →
    // REJECTED by the T1 immutability trigger → INVALID_TRANSITION.
    await expect(
      postExtractedInvoice({
        extracted_invoice_id: alpha2,
        posted_bill_id: billA,
        idempotency_key: key2,
        trace_id: ctx.trace_id,
        posted_by: ctx.caller.user_id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });

    // SAME bill, DIFFERENT key (isolates the idempotency_key write-once —
    // coupling 3's guard, routed through the RPC path here, not just the
    // trigger in isolation): a re-derived/drifted key must NOT silently
    // rewrite the persisted one → INVALID_TRANSITION.
    await expect(
      postExtractedInvoice({
        extracted_invoice_id: alpha2,
        posted_bill_id: billB,
        idempotency_key: `${caseId}:bill:DRIFTED`,
        trace_id: ctx.trace_id,
        posted_by: ctx.caller.user_id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });

    // The α still points at its original bill AND key — no silent re-point,
    // no silent re-key, after either rejected write.
    const db = adminClient();
    const { data: row } = await db
      .from('extracted_invoices')
      .select('posted_bill_id, post_status, idempotency_key')
      .eq('id', alpha2)
      .single();
    expect(row!.posted_bill_id).toBe(billB);
    expect(row!.post_status).toBe('posted');
    expect(row!.idempotency_key).toBe(key2);
  });

  it('3. the INVALID_TRANSITION on a different-bill re-post is a ServiceError', async () => {
    const key = `${caseId}:bill:INV0001`;
    await expect(
      postExtractedInvoice({
        extracted_invoice_id: alpha1,
        posted_bill_id: billB,
        idempotency_key: key,
        trace_id: ctx.trace_id,
        posted_by: ctx.caller.user_id,
      }),
    ).rejects.toBeInstanceOf(ServiceError);
  });
});
