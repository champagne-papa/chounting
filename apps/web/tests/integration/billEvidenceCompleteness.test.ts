// tests/integration/billEvidenceCompleteness.test.ts
//
// Phase 5.1 chunk 5.1a — INV-DOC-001 enforcement integration test.
//
// Exercises three fixtures per chunk 5.1a brief Sub-Q4-shape-3 + Round 4 §5.1
// acceptance criteria:
//   - Positive path: bill post with primary_document_id succeeds + creates
//     source_document_links row with link_role='primary_invoice' atomically.
//   - Override path: bill post with override_evidence_completeness=true
//     succeeds without primary_document_id; no source_document_links row
//     created; bills.override_evidence_completeness=true persisted.
//   - Failure path: bill post with neither primary_document_id nor override
//     throws ServiceError('EVIDENCE_INCOMPLETE'); no rows committed.
//
// Sub-Q4 sub-decision locks operationalized:
//   - Sub-Q4-a (per-bill granularity): enforcement at billService.post() only.
//   - Sub-Q4-b (primary_invoice + receipt accepted set): positive path uses
//     primary_invoice; receipt-path coverage deferred to consumer chunk.
//   - Sub-Q4-c (post-time-only): no lifetime re-firing tested.
//   - Sub-Q4-shape-1 (EVIDENCE_INCOMPLETE typed error code).
//   - Sub-Q4-shape-2 (two optional fields with Zod-level default).
//
// Per Item 20 dedicated test-accounts pattern + per-run unique account_codes
// derived from traceId (mirrors billPostBill.test.ts convention).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { billService } from '@/services/spend/billService';
import { ServiceError } from '@/services/errors/ServiceError';

describe('billService.post → INV-DOC-001 enforcement (Phase 5.1 chunk 5.1a)', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let apControlAccountId: string;
  let expenseAccountId: string;
  let fiscalPeriodId: string;
  let sourceDocumentId: string;
  const createdBillIds: string[] = [];
  const createdJeIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();

    // Per-run unique chart_of_accounts codes per Item 20 dedicated
    // test-accounts pattern.
    const apCode = `T${traceId.slice(0, 8)}_INVDOC_AP`;
    const expCode = `T${traceId.slice(0, 8)}_INVDOC_EXP`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST INV-DOC-001 AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: expCode,
          account_name: 'TEST INV-DOC-001 expense proxy',
          account_type: 'expense',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 2) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    expenseAccountId = created.find((c) => c.account_code === expCode)!.account_id;

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id, start_date, end_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    if (!period) throw new Error('no open fiscal period for ORG_HOLDING');
    fiscalPeriodId = period.period_id;

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST INV-DOC-001 vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    // Seed ingest_batch + source_document for positive-path fixture.
    // ingest_batch_id is NOT NULL on source_documents per Phase 6 substrate.
    const ingestBatchId = crypto.randomUUID();
    const { error: batchErr } = await db.from('ingest_batches').insert({
      id: ingestBatchId,
      org_id: SEED.ORG_HOLDING,
      ingest_channel: 'direct_upload',
      received_at: new Date().toISOString(),
      channel_metadata: {},
      trace_id: traceId,
      created_by: ctx.caller.user_id,
    });
    if (batchErr) throw new Error(`ingest_batch seed failed: ${batchErr.message}`);

    sourceDocumentId = crypto.randomUUID();
    const { error: docErr } = await db.from('source_documents').insert({
      id: sourceDocumentId,
      org_id: SEED.ORG_HOLDING,
      ingest_batch_id: ingestBatchId,
      storage_provider: 'supabase_storage',
      original_storage_key: `phase-5-1-test/${sourceDocumentId}.pdf`,
      original_content_hash: `sha256-test-${traceId}`,
      original_byte_size: 1024,
      original_filename: 'test-invoice.pdf',
      mime_type: 'application/pdf',
      ingest_channel: 'direct_upload',
      received_at: new Date().toISOString(),
      created_by: ctx.caller.user_id,
    });
    if (docErr) throw new Error(`source_document seed failed: ${docErr.message}`);
  });

  afterAll(async () => {
    // JE rows are append-only per INV-LEDGER-001 + journal immutability triggers.
    // bill_payment_allocations, bill_lines, bills, source_document_links all cascade
    // or get cleaned up by the per-traceId scope.
    if (createdBillIds.length > 0) {
      await db.from('source_document_links').delete().in('linked_entity_id', createdBillIds);
      await db.from('bill_lines').delete().in('bill_id', createdBillIds);
      await db.from('bills').delete().in('bill_id', createdBillIds);
    }
    await db.from('source_documents').delete().eq('id', sourceDocumentId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  function buildPostInput(overrides: Record<string, unknown> = {}) {
    return {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: 'INV-DOC-001-TEST',
      issue_date: '2026-05-19',
      due_date: '2026-06-19',
      payment_terms_days: 30,
      purchase_order_id: null,
      currency: 'CAD' as const,
      amount_original: '500.0000',
      amount_cad: '500.0000',
      fx_rate: '1.00000000',
      tax_amount_total: '0.0000',
      bill_lines: [
        {
          account_id: expenseAccountId,
          description: 'INV-DOC-001 test expense line',
          amount: '500.0000',
          amount_original: '500.0000',
          amount_cad: '500.0000',
          tax_code_id: null,
          line_number: 1,
        },
      ],
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-19',
      ap_control_account_id: apControlAccountId,
      ...overrides,
    };
  }

  it('positive path: bill post with primary_document_id succeeds + creates source_document_links row with link_role=primary_invoice atomically', async () => {
    const result = await billService.post(
      buildPostInput({
        primary_document_id: sourceDocumentId,
        bill_number: 'INV-DOC-001-POSITIVE',
      }),
      ctx,
    );
    createdBillIds.push(result.bill_id);
    createdJeIds.push(result.journal_entry_id);

    // Assert bill row exists with override_evidence_completeness=false (default)
    const { data: bill } = await db
      .from('bills')
      .select('bill_id, override_evidence_completeness, lifecycle_state')
      .eq('bill_id', result.bill_id)
      .single();
    expect(bill).toBeTruthy();
    expect(bill!.override_evidence_completeness).toBe(false);
    expect(bill!.lifecycle_state).toBe('pending_approval');

    // Assert source_document_links row created atomically.
    const { data: links } = await db
      .from('source_document_links')
      .select('source_document_id, linked_entity_type, linked_entity_id, link_role, link_status')
      .eq('linked_entity_id', result.bill_id)
      .eq('linked_entity_type', 'bill');
    expect(links).toHaveLength(1);
    expect(links![0].source_document_id).toBe(sourceDocumentId);
    expect(links![0].link_role).toBe('primary_invoice');
    expect(links![0].link_status).toBe('created');
  });

  it('override path: bill post with override_evidence_completeness=true succeeds without primary_document_id; no source_document_links row', async () => {
    const result = await billService.post(
      buildPostInput({
        override_evidence_completeness: true,
        bill_number: 'INV-DOC-001-OVERRIDE',
      }),
      ctx,
    );
    createdBillIds.push(result.bill_id);
    createdJeIds.push(result.journal_entry_id);

    // Assert bill row exists with override_evidence_completeness=true.
    const { data: bill } = await db
      .from('bills')
      .select('bill_id, override_evidence_completeness, lifecycle_state')
      .eq('bill_id', result.bill_id)
      .single();
    expect(bill).toBeTruthy();
    expect(bill!.override_evidence_completeness).toBe(true);
    expect(bill!.lifecycle_state).toBe('pending_approval');

    // Assert NO source_document_links row created (override path skips
    // documentLinkService.create() call).
    const { data: links } = await db
      .from('source_document_links')
      .select('source_document_id')
      .eq('linked_entity_id', result.bill_id)
      .eq('linked_entity_type', 'bill');
    expect(links).toHaveLength(0);
  });

  it('failure path: bill post without primary_document_id and without override throws ServiceError(EVIDENCE_INCOMPLETE); no rows committed', async () => {
    // Capture pre-fail row counts.
    const { count: billsBefore } = await db
      .from('bills')
      .select('bill_id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    await expect(
      billService.post(
        buildPostInput({ bill_number: 'INV-DOC-001-FAILURE' }),
        ctx,
      ),
    ).rejects.toThrow(ServiceError);

    // Verify the error code is EVIDENCE_INCOMPLETE by catching and inspecting.
    try {
      await billService.post(
        buildPostInput({ bill_number: 'INV-DOC-001-FAILURE-2' }),
        ctx,
      );
      throw new Error('expected EVIDENCE_INCOMPLETE throw but did not');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect((err as ServiceError).code).toBe('EVIDENCE_INCOMPLETE');
    }

    // Assert no rows committed (count unchanged).
    const { count: billsAfter } = await db
      .from('bills')
      .select('bill_id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);
    expect(billsAfter).toBe(billsBefore);
  });
});
