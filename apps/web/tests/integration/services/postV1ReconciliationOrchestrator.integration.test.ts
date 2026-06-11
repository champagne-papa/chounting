// tests/integration/services/postV1ReconciliationOrchestrator.integration.test.ts
//
// Phase 8 chunk 7 — integration tests for postV1ReconciliationOrchestrator
// (framing #2 post-v1 reconciliation orchestrator; Stage 7 Bundle
// partial-commit reconciliation path).
//
// Axis 1 (orchestrator behavior) + paymentService.record() consumer #2
// wiring (consolidated here per brief §3.2 "(Possibly) ... consolidate into
// postV1ReconciliationOrchestrator integration test file" — η resolution;
// avoids triplicating the heavy COA/bill/period seeding).
//
// JE/JL append-only per integration-test-rules §3.2 (no DELETE; per-run
// unique trace_id + T${traceId.slice(0,8)}_ account_codes avoid collisions).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { adminClient, SEED } from '../../setup/testDb';
import { makeTestContext } from '../../setup/makeTestContext';
import { paymentService } from '@/services/spend/paymentService';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { postV1ReconciliationOrchestrator } from '@/services/document-platform/postV1ReconciliationOrchestrator';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

async function buildClassifiedCase(orgId: string, ctx: ServiceContext): Promise<string> {
  const created = await createDocumentCase(
    { org_id: orgId, document_type: 'vendor_invoice' },
    ctx,
  );
  const db = adminClient();
  const { error } = await db
    .from('document_cases')
    .update({ state: 'classified' })
    .eq('id', created.id);
  if (error) throw new Error(`buildClassifiedCase failed: ${error.message}`);
  return created.id;
}

describe('postV1ReconciliationOrchestrator.reconcileBornPaidBundle (Phase 8 chunk 7)', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let billCommittedId: string; // CAD bill — "born" (posted upstream)
  let apControlAccountId: string;
  let cashAccountId: string;
  let fiscalPeriodId: string;

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billCommittedId = crypto.randomUUID();

    // Per-run unique account_codes per integration-test-rules §3.1.
    const apCode = `T${traceId.slice(0, 8)}_AP_C7`;
    const cashCode = `T${traceId.slice(0, 8)}_CASH_C7`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST chunk7 AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: cashCode,
          account_name: 'TEST chunk7 cash proxy',
          account_type: 'asset',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 2) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    cashAccountId = created.find((c) => c.account_code === cashCode)!.account_id;

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    if (!period) throw new Error('no open fiscal period for ORG_HOLDING');
    fiscalPeriodId = period.period_id;

    await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST chunk7 vendor',
    });

    const { error: billErr } = await db.from('bills').insert({
      bill_id: billCommittedId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      issue_date: '2026-05-21',
      amount_original: '500.0000',
      amount_cad: '500.0000',
      currency: 'CAD',
      fx_rate: '1.00000000',
      lifecycle_state: 'approved_for_payment',
    });
    if (billErr) throw new Error(`bill seed failed: ${billErr.message}`);
  });

  afterAll(async () => {
    const { data: ownedBills } = await db
      .from('bills')
      .select('bill_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('vendor_id', vendorId);
    if (ownedBills && ownedBills.length > 0) {
      await db
        .from('bill_payment_allocations')
        .delete()
        .in('bill_id', ownedBills.map((b) => b.bill_id as string));
    }
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('payments').delete().eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    await db.from('audit_log').delete().eq('trace_id', traceId);
    // chart_of_accounts T-prefixed accounts accumulate (reportTrialBalance
    // filter handles visibility); journal_entries/journal_lines append-only.
  });

  function buildPaymentLeg(billId: string, amount: string) {
    return {
      org_id: SEED.ORG_HOLDING,
      bill_id: billId,
      payment_method: 'eft' as const,
      payment_date: '2026-05-21',
      amount_cad: amount,
      reference_number: 'REF-C7-RECON',
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-21',
      ap_control_account_id: apControlAccountId,
      cash_account_id: cashAccountId,
    };
  }

  it('committed: payment leg succeeds via consumer #2; returns committed; enqueues no exception', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const result = await postV1ReconciliationOrchestrator.reconcileBornPaidBundle(
      {
        document_case_id: caseId,
        source_document_id: crypto.randomUUID(),
        trace_id: traceId,
        payment: buildPaymentLeg(billCommittedId, '500.0000'),
      },
      ctx,
    );

    expect(result.outcome).toBe('committed');
    if (result.outcome !== 'committed') throw new Error('unreachable');
    expect(result.payment_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);

    const { data: payment } = await db
      .from('payments')
      .select('*')
      .eq('payment_id', result.payment_id)
      .single();
    expect(payment).toBeTruthy();
    expect(Number(payment!.amount)).toBe(500);

    // Success path enqueues NO exception for the case.
    const { data: entries } = await db
      .from('exception_queue_entries')
      .select('exception_queue_entry_id')
      .eq('document_case_id', caseId);
    expect(entries ?? []).toHaveLength(0);
  });

  it('consumer #2 wiring: passes the payment leg through to paymentService.record', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const billId2 = crypto.randomUUID();
    await db.from('bills').insert({
      bill_id: billId2,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      issue_date: '2026-05-21',
      amount_original: '125.0000',
      amount_cad: '125.0000',
      currency: 'CAD',
      fx_rate: '1.00000000',
      lifecycle_state: 'approved_for_payment',
    });
    const paymentLeg = buildPaymentLeg(billId2, '125.0000');
    const spy = vi.spyOn(paymentService, 'record');
    try {
      const result = await postV1ReconciliationOrchestrator.reconcileBornPaidBundle(
        { document_case_id: caseId, trace_id: traceId, payment: paymentLeg },
        ctx,
      );
      expect(result.outcome).toBe('committed');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ bill_id: billId2, org_id: SEED.ORG_HOLDING }),
        ctx,
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('reconciliation_pending: payment leg fails post-bill-commit → enqueues bundle_partial_commit_reconciliation_pending', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const spy = vi
      .spyOn(paymentService, 'record')
      .mockImplementation(async () => {
        throw new ServiceError('POST_FAILED', 'synthetic payment-leg failure for test');
      });
    try {
      // source_document_id omitted: enqueue_exception_with_audit FK-checks
      // source_document_id against source_documents; seeding Phase 6 ingestion
      // substrate isn't warranted for this assertion. The orchestrator threads
      // parsed.source_document_id through verbatim (undefined → null here).
      const result = await postV1ReconciliationOrchestrator.reconcileBornPaidBundle(
        {
          document_case_id: caseId,
          trace_id: traceId,
          payment: buildPaymentLeg(billCommittedId, '500.0000'),
        },
        ctx,
      );

      expect(result.outcome).toBe('reconciliation_pending');
      if (result.outcome !== 'reconciliation_pending') throw new Error('unreachable');
      expect(result.exception_queue_entry_id).toMatch(/^[0-9a-f-]{36}$/i);

      const { data: entry } = await db
        .from('exception_queue_entries')
        .select('*')
        .eq('exception_queue_entry_id', result.exception_queue_entry_id)
        .single();
      expect(entry!.exception_reason).toBe('bundle_partial_commit_reconciliation_pending');
      expect(entry!.exception_status).toBe('open');
      expect(entry!.document_case_id).toBe(caseId);
      expect(entry!.source_document_id).toBeNull();
      expect(entry!.trace_id).toBe(traceId);
      expect(entry!.org_id).toBe(SEED.ORG_HOLDING);

      // exception_enqueued audit row correlated by trace_id.
      const { data: audit } = await db
        .from('audit_log')
        .select('*')
        .eq('trace_id', traceId)
        .eq('entity_id', result.exception_queue_entry_id)
        .eq('action', 'exception_enqueued');
      expect(audit).toHaveLength(1);
      expect(audit![0].entity_type).toBe('exception_queue_entry');
    } finally {
      spy.mockRestore();
    }
  });

  it('Zod validation: malformed document_case_id throws READ_FAILED before any commit', async () => {
    let caught: unknown;
    try {
      await postV1ReconciliationOrchestrator.reconcileBornPaidBundle(
        {
          document_case_id: 'not-a-uuid',
          trace_id: traceId,
          payment: buildPaymentLeg(billCommittedId, '500.0000'),
        },
        ctx,
      );
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ServiceError);
    expect((caught as ServiceError).code).toBe('READ_FAILED');
  });

  it('idempotency: duplicate reconciliation for an open case propagates EXCEPTION_ALREADY_OPEN', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const spy = vi
      .spyOn(paymentService, 'record')
      .mockImplementation(async () => {
        throw new ServiceError('POST_FAILED', 'synthetic payment-leg failure for test');
      });
    try {
      const first = await postV1ReconciliationOrchestrator.reconcileBornPaidBundle(
        { document_case_id: caseId, trace_id: traceId, payment: buildPaymentLeg(billCommittedId, '500.0000') },
        ctx,
      );
      expect(first.outcome).toBe('reconciliation_pending');

      // Second invocation for the same still-open case: the partial UNIQUE
      // index exception_queue_entries_open_per_case_idx rejects the
      // duplicate; enqueueException raises EXCEPTION_ALREADY_OPEN, which the
      // orchestrator propagates (does not swallow).
      await expect(
        postV1ReconciliationOrchestrator.reconcileBornPaidBundle(
          { document_case_id: caseId, trace_id: traceId, payment: buildPaymentLeg(billCommittedId, '500.0000') },
          ctx,
        ),
      ).rejects.toMatchObject({ code: 'EXCEPTION_ALREADY_OPEN' });
    } finally {
      spy.mockRestore();
    }
  });
});
