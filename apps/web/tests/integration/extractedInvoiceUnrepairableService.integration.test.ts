// apps/web/tests/integration/extractedInvoiceUnrepairableService.integration.test.ts
//
// Board #4 slice-2 T6a (substrate half of the G3 stuck-invoice affordance) —
// behavioral proof of the α-UNREPAIRABLE write path
// (markExtractedInvoiceUnrepairable + mark_extracted_invoice_unrepairable_with_audit
// RPC, migration 20240185000000) in ISOLATION, before the T6b route loop
// (the ~:431 recovery-sub-call catch) depends on it.
//
// The five designed assertions (T6a brief §5) + the D1 re-mark no-op:
//   1. pending → unrepairable sets post_status='unrepairable'.
//   2. posted_bill_id stays NULL on the marked row (UPDATE post_status only).
//   3. the persist is CHECK-legal (row survives; no 23514).
//   4. a paired audit_log row lands (parent-derived org, action
//      'extracted_invoice_unrepairable', before_state.post_status='pending').
//   5. marking a POSTED α is REJECTED 23514 -> INVALID_TRANSITION (the NEW
//      mapping 3a does not carry), and the posted α survives unchanged.
//   D1. re-marking an already-unrepairable α is a no-op success.
//
// Seeding mirrors extractedInvoicePostService (T3 substrate) exactly.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import {
  createExtractedInvoice,
  postExtractedInvoice,
  markExtractedInvoiceUnrepairable,
} from '@/services/document-platform/extractedInvoiceWriteService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('extractedInvoiceWriteService (T6a substrate) — α-UNREPAIRABLE + T1 CHECK', () => {
  let ctx: ServiceContext;
  let sourceDocId: string;
  let caseId: string;
  let billA: string;
  let alphaPending: string;
  let alphaPosted: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const db = adminClient();

    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([1, 2, 3, 4]),
        mime_type: 'application/pdf',
        original_filename: 't6a-alpha-unrepairable.pdf',
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

    // A vendor + one bill for the posted-α (assertion 5 needs a posted α).
    const vendorId = crypto.randomUUID();
    const { error: vErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: `T6a Vendor ${crypto.randomUUID().slice(0, 8)}`,
    });
    if (vErr) throw new Error(`vendor seed failed: ${vErr.message}`);

    billA = crypto.randomUUID();
    const { error: bErr } = await db.from('bills').insert([
      { bill_id: billA, org_id: SEED.ORG_HOLDING, vendor_id: vendorId, issue_date: '2026-01-15' },
    ]);
    if (bErr) throw new Error(`bill seed failed: ${bErr.message}`);

    // Two PENDING α rows: one stays pending (marked unrepairable), one gets
    // posted (to prove the posted-α reject).
    alphaPending = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 1,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: '100.00', vendor_invoice_number: 'INV0001' },
      trace_id: ctx.trace_id,
    });
    alphaPosted = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 2,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: '50.00', vendor_invoice_number: 'INV0002' },
      trace_id: ctx.trace_id,
    });
    // Post alphaPosted so it carries a bill (post_status='posted').
    await postExtractedInvoice({
      extracted_invoice_id: alphaPosted,
      posted_bill_id: billA,
      idempotency_key: `${caseId}:bill:INV0002`,
      trace_id: ctx.trace_id,
      posted_by: ctx.caller.user_id,
    });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('1-4. marks a pending α unrepairable (post_status only; bill+key stay NULL; CHECK-legal) with a parent-derived audit row whose before_state.post_status=pending', async () => {
    const returned = await markExtractedInvoiceUnrepairable({
      extracted_invoice_id: alphaPending,
      trace_id: ctx.trace_id,
      marked_by: ctx.caller.user_id,
    });
    expect(returned).toBe(alphaPending); // (3) CHECK-legal persist — resolves

    const db = adminClient();
    const { data: row, error } = await db
      .from('extracted_invoices')
      .select('post_status, posted_bill_id, idempotency_key')
      .eq('id', alphaPending)
      .single();
    expect(error).toBeNull();
    expect(row!.post_status).toBe('unrepairable'); // (1)
    expect(row!.posted_bill_id).toBeNull(); // (2) UPDATE post_status only
    expect(row!.idempotency_key).toBeNull(); // (2) key also untouched

    // (4) Paired audit: parent-derived org, unrepairable action, before_state
    // captures the prior status = 'pending' (the load-bearing assertion).
    const { data: audit } = await db
      .from('audit_log')
      .select('org_id, action, entity_type, before_state')
      .eq('entity_id', alphaPending)
      .eq('action', 'extracted_invoice_unrepairable');
    expect(audit).toHaveLength(1);
    expect(audit![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(audit![0].entity_type).toBe('extracted_invoice');
    expect(
      (audit![0].before_state as { post_status?: string }).post_status,
    ).toBe('pending');
    expect(
      (audit![0].before_state as { posted_bill_id?: string | null })
        .posted_bill_id,
    ).toBeNull();
  });

  it('D1. re-marking an already-unrepairable α is a no-op success; the α is unchanged', async () => {
    await expect(
      markExtractedInvoiceUnrepairable({
        extracted_invoice_id: alphaPending,
        trace_id: ctx.trace_id,
        marked_by: ctx.caller.user_id,
      }),
    ).resolves.toBe(alphaPending);

    const db = adminClient();
    const { data: row } = await db
      .from('extracted_invoices')
      .select('post_status, posted_bill_id')
      .eq('id', alphaPending)
      .single();
    expect(row!.post_status).toBe('unrepairable');
    expect(row!.posted_bill_id).toBeNull();
  });

  it('5. marking a POSTED α unrepairable is REJECTED 23514 -> INVALID_TRANSITION (ServiceError); the posted α survives unchanged', async () => {
    await expect(
      markExtractedInvoiceUnrepairable({
        extracted_invoice_id: alphaPosted,
        trace_id: ctx.trace_id,
        marked_by: ctx.caller.user_id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });

    // It is a typed ServiceError, not a raw throw.
    await expect(
      markExtractedInvoiceUnrepairable({
        extracted_invoice_id: alphaPosted,
        trace_id: ctx.trace_id,
        marked_by: ctx.caller.user_id,
      }),
    ).rejects.toBeInstanceOf(ServiceError);

    // The posted α is untouched — no silent reclassification of a real post
    // as a crash-failure.
    const db = adminClient();
    const { data: row } = await db
      .from('extracted_invoices')
      .select('post_status, posted_bill_id')
      .eq('id', alphaPosted)
      .single();
    expect(row!.post_status).toBe('posted');
    expect(row!.posted_bill_id).toBe(billA);
  });
});
