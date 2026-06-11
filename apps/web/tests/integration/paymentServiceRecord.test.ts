// tests/integration/paymentServiceRecord.test.ts
//
// Phase 5.1 chunk 5.1b — per-mutation integration test for
// paymentService.record() (payment-flow primitive per Sub-Q2 2.β LOCKED).
//
// 5 fixtures per brief §4 Task 5:
//   1. Positive path: inserts payment + allocation + JE + emits T2 dispatch.
//   2. Sub-L precondition failure: non-CAD bill throws POST_FAILED.
//   3. Zod validation failure: malformed input throws READ_FAILED.
//   4. NOT_FOUND bill: non-existent bill_id throws NOT_FOUND.
//   5. T2 dispatcher emission isolated: paymentService.record() returns
//      success even when dispatchTrigger throws (P3-i F-J-4 best-effort).
//
// Naming inheritance: paymentService[Action].test.ts grain per
// vendorPrepayment[Action].test.ts / billRecordPayment.test.ts
// precedents (flat path; no .integration. suffix).
//
// Sub-Q2 2.β LOCKED: paymentService.record() is greenfield-with-no-v1-
// callers. Tests exercise the service via direct call (no withInvariants
// wrap; route-handler-grade wiring deferred to future consumer chunk).
//
// JE/JL accumulation per integration-test-rules §3.2: journal_entries
// and journal_lines are append-only (Layer 1a trigger blocks DELETE
// including service_role). No cleanup attempted; per-run unique
// trace_id and T${traceId.slice(0,8)}_ account_codes prevent collisions.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { paymentService } from '@/services/spend/paymentService';
import { ServiceError } from '@/services/errors/ServiceError';

describe('paymentService.record → payment-flow primitive (Phase 5.1 chunk 5.1b)', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let billPositiveId: string;       // CAD bill — positive path
  let billUsdId: string;             // USD bill — Sub-L rejection
  let billDispatcherIsolationId: string;  // CAD bill — dispatcher-throw fixture
  let apControlAccountId: string;
  let cashAccountId: string;
  let fiscalPeriodId: string;
  const createdJeIds: string[] = [];
  const createdPaymentIds: string[] = [];
  const createdAllocBillIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billPositiveId = crypto.randomUUID();
    billUsdId = crypto.randomUUID();
    billDispatcherIsolationId = crypto.randomUUID();

    // Per-run unique account_codes per integration-test-rules §3.1.
    const apCode = `T${traceId.slice(0, 8)}_AP_5_1B`;
    const cashCode = `T${traceId.slice(0, 8)}_CASH_5_1B`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST paymentService AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: cashCode,
          account_name: 'TEST paymentService cash proxy',
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
      name: 'TEST paymentService vendor',
    });

    // paymentService.record() does NOT enforce INV-AP-002 state
    // precondition (Sub-Q2 2.β; no bill state transition). Seeded bills
    // use approved_for_payment for parity with billService precedent;
    // any non-terminal state would also accept.
    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billPositiveId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-19',
        amount_original: '750.0000',
        amount_cad: '750.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billUsdId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-19',
        amount_original: '400.0000',
        amount_cad: '550.0000',
        currency: 'USD',
        fx_rate: '1.37500000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billDispatcherIsolationId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-19',
        amount_original: '250.0000',
        amount_cad: '250.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
  });

  afterAll(async () => {
    // JE/JL append-only per integration-test-rules §3.2 — no DELETE.
    // Track for diagnostics only.
    void createdJeIds;
    void createdPaymentIds;
    void createdAllocBillIds;

    // bill_payment_allocations DELETE at bill_id grain (no FK CASCADE).
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
    // chart_of_accounts cleanup intentionally skipped (T-prefixed accounts
    // accumulate; reportTrialBalance filter handles visibility).
  });

  function buildPaymentInput(billId: string, amount: string) {
    return {
      org_id: SEED.ORG_HOLDING,
      bill_id: billId,
      payment_method: 'eft' as const,
      payment_date: '2026-05-19',
      amount_cad: amount,
      reference_number: 'REF-PAY-5-1B',
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-19',
      ap_control_account_id: apControlAccountId,
      cash_account_id: cashAccountId,
    };
  }

  it('positive path: inserts payment + allocation + JE Dr AP / Cr cash + emits payment_recorded + T2 dispatch', async () => {
    const result = await paymentService.record(
      buildPaymentInput(billPositiveId, '750.0000'),
      ctx,
    );

    expect(result.payment_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
    createdJeIds.push(result.journal_entry_id);
    createdPaymentIds.push(result.payment_id);
    createdAllocBillIds.push(billPositiveId);

    // Payment row.
    const { data: payment } = await db
      .from('payments')
      .select('*')
      .eq('payment_id', result.payment_id)
      .single();
    expect(payment).toBeTruthy();
    expect(Number(payment!.amount)).toBe(750);
    expect(payment!.currency).toBe('CAD');
    expect(payment!.payment_method).toBe('eft');
    expect(payment!.payment_purpose).toBe('bill_payment');
    expect(payment!.payment_state).toBe('paid');
    expect(payment!.vendor_id).toBe(vendorId);
    expect(payment!.applied_to).toBe('bill');
    expect(payment!.reference_number).toBe('REF-PAY-5-1B');

    // Allocation row.
    const { data: alloc } = await db
      .from('bill_payment_allocations')
      .select('*')
      .eq('bill_id', billPositiveId);
    expect(alloc).toHaveLength(1);
    expect(alloc![0].payment_id).toBe(result.payment_id);
    expect(Number(alloc![0].amount_cad)).toBe(750);
    expect(alloc![0].trace_id).toBe(traceId);
    expect(alloc![0].created_by).toBe(ctx.caller.user_id);

    // Sub-Q2 2.β disposition verification: NO bill state transition
    // (paymentService.record() is payment-flow primitive; bill stays
    // in approved_for_payment).
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billPositiveId)
      .single();
    expect(bill!.lifecycle_state).toBe('approved_for_payment');

    // JE balanced (Dr ap_control / Cr cash).
    const { data: jeLines } = await db
      .from('journal_lines')
      .select('*')
      .eq('journal_entry_id', result.journal_entry_id);
    expect(jeLines).toHaveLength(2);
    const drLine = jeLines!.find((l) => Number(l.debit_amount) > 0);
    const crLine = jeLines!.find((l) => Number(l.credit_amount) > 0);
    expect(drLine!.account_id).toBe(apControlAccountId);
    expect(crLine!.account_id).toBe(cashAccountId);
    expect(Number(drLine!.debit_amount)).toBe(750);
    expect(Number(crLine!.credit_amount)).toBe(750);

    // payment-grain audit (underscored convention per Phase 6.5).
    const { data: paymentAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'payment_recorded')
      .eq('entity_id', result.payment_id);
    expect(paymentAudit).toHaveLength(1);
    expect(paymentAudit![0].entity_type).toBe('payment');

    // T2 dispatch fired (router_re_evaluation_fired audit row carries
    // trigger_type='T2_new_payment' in before_state per dispatcher
    // contract — countDispatchAuditsForTrigger pattern from
    // dispatchTriggerCrossPhase test).
    const { data: dispatchAudits } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', traceId)
      .eq('action', 'router_re_evaluation_fired');
    const t2Count = (dispatchAudits ?? []).filter(
      (r) => (r.before_state as Record<string, unknown> | null)?.trigger_type === 'T2_new_payment',
    ).length;
    expect(t2Count).toBeGreaterThanOrEqual(1);
  });

  it('Sub-L precondition: non-CAD bill throws POST_FAILED + PAYMENT_MULTI_CURRENCY_NOT_SUPPORTED', async () => {
    let caught: unknown;
    try {
      await paymentService.record(buildPaymentInput(billUsdId, '400.0000'), ctx);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ServiceError);
    const err = caught as ServiceError;
    expect(err.code).toBe('POST_FAILED');
    expect(err.message).toContain('PAYMENT_MULTI_CURRENCY_NOT_SUPPORTED');

    // No payment / allocation rows for the USD bill.
    const { data: payments } = await db
      .from('payments')
      .select('payment_id')
      .eq('vendor_id', vendorId)
      .eq('reference_number', 'REF-PAY-5-1B');
    const { data: allocs } = await db
      .from('bill_payment_allocations')
      .select('payment_id')
      .eq('bill_id', billUsdId);
    expect(allocs ?? []).toHaveLength(0);
    // payments may include the positive-path row; verify none reference
    // the USD bill via allocation.
    void payments;
  });

  it('Zod validation: malformed bill_id (non-uuid) throws READ_FAILED', async () => {
    let caught: unknown;
    try {
      await paymentService.record(
        { ...buildPaymentInput(billPositiveId, '100.0000'), bill_id: 'not-a-uuid' },
        ctx,
      );
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ServiceError);
    expect((caught as ServiceError).code).toBe('READ_FAILED');
  });

  it('NOT_FOUND: non-existent bill_id throws NOT_FOUND; no rows committed', async () => {
    const randomBillId = crypto.randomUUID();
    let caught: unknown;
    try {
      await paymentService.record(buildPaymentInput(randomBillId, '100.0000'), ctx);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ServiceError);
    expect((caught as ServiceError).code).toBe('NOT_FOUND');

    const { data: allocs } = await db
      .from('bill_payment_allocations')
      .select('payment_id')
      .eq('bill_id', randomBillId);
    expect(allocs ?? []).toHaveLength(0);
  });

  it('T2 dispatcher isolation: paymentService.record() succeeds even if dispatchTrigger throws (P3-i F-J-4)', async () => {
    // Spy on dispatchTrigger to simulate dispatcher failure. paymentService
    // imports dispatchTrigger as a named binding; vi.spyOn on the module
    // object replaces the live binding (same pattern as
    // dispatchTriggerCrossPhase test §spyOnDispatchTrigger).
    const routerMod = await import('@/services/document-platform/documentRouterService');
    const spy = vi
      .spyOn(routerMod, 'dispatchTrigger')
      .mockImplementation(async () => {
        throw new ServiceError('POST_FAILED', 'synthetic dispatcher failure for test');
      });

    try {
      const result = await paymentService.record(
        buildPaymentInput(billDispatcherIsolationId, '250.0000'),
        ctx,
      );

      // Primary writes succeeded despite dispatcher failure.
      expect(result.payment_id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(result.journal_entry_id).toMatch(/^[0-9a-f-]{36}$/i);
      createdJeIds.push(result.journal_entry_id);
      createdPaymentIds.push(result.payment_id);
      createdAllocBillIds.push(billDispatcherIsolationId);

      // Payment + allocation rows committed.
      const { data: payment } = await db
        .from('payments')
        .select('payment_id')
        .eq('payment_id', result.payment_id)
        .single();
      expect(payment).toBeTruthy();

      const { data: alloc } = await db
        .from('bill_payment_allocations')
        .select('payment_id')
        .eq('bill_id', billDispatcherIsolationId);
      expect(alloc).toHaveLength(1);

      // Dispatcher was invoked (the spy fired).
      expect(spy).toHaveBeenCalledTimes(1);
      const callArg = spy.mock.calls[0][0] as { trigger_type: string };
      expect(callArg.trigger_type).toBe('T2_new_payment');
    } finally {
      spy.mockRestore();
    }
  });
});
