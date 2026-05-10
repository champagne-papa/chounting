// tests/integration/vendorPrepaymentRefund.test.ts
//
// Phase 5 chunk B5-1 substantive session #2 — per-mutation integration test
// for vendorPrepaymentService.refund (record_vendor_prepayment_refund).
//
// Exercises: happy path (open vendor_prepayment with no applications →
// status=refunded + vendor_prepayment_refunded audit row with before_state);
// D4-α (vendor_prepayment with status=partially_applied + applications →
// reject); rejects when refund_payment has wrong payment_purpose.
//
// D4-α — see docs/02_specs/open_questions.md Q80. Refund mutation rejects
// applied prepayments to force user to reverse applications first;
// conservative posture pending ADR-0015 §6 amendment.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { vendorPrepaymentService } from '@/services/spend/vendorPrepaymentService';

describe('vendorPrepaymentService.refund', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let paymentVpAId: string;       // backs vpOpenId
  let paymentVpBId: string;       // backs vpAppliedId
  let paymentVpCId: string;       // backs vpForBogusRefundId
  let refundPaymentId: string;    // payment_purpose='vendor_refund'
  let bogusPaymentId: string;     // payment_purpose='bill_payment' (wrong)
  let vpOpenId: string;
  let vpAppliedId: string;
  let vpForBogusRefundId: string;
  let appId: string;
  let billId: string;

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    paymentVpAId = crypto.randomUUID();
    paymentVpBId = crypto.randomUUID();
    paymentVpCId = crypto.randomUUID();
    refundPaymentId = crypto.randomUUID();
    bogusPaymentId = crypto.randomUUID();
    vpOpenId = crypto.randomUUID();
    vpAppliedId = crypto.randomUUID();
    vpForBogusRefundId = crypto.randomUUID();
    appId = crypto.randomUUID();
    billId = crypto.randomUUID();

    await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST VP refund vendor',
    });

    await db.from('payments').insert([
      {
        payment_id: paymentVpAId,
        org_id: SEED.ORG_HOLDING,
        payment_date: '2026-05-10',
        amount: '5000.0000',
        currency: 'CAD',
        payment_purpose: 'vendor_prepayment',
        payment_state: 'paid',
      },
      {
        payment_id: paymentVpBId,
        org_id: SEED.ORG_HOLDING,
        payment_date: '2026-05-10',
        amount: '5000.0000',
        currency: 'CAD',
        payment_purpose: 'vendor_prepayment',
        payment_state: 'paid',
      },
      {
        payment_id: paymentVpCId,
        org_id: SEED.ORG_HOLDING,
        payment_date: '2026-05-10',
        amount: '500.0000',
        currency: 'CAD',
        payment_purpose: 'vendor_prepayment',
        payment_state: 'paid',
      },
      {
        payment_id: refundPaymentId,
        org_id: SEED.ORG_HOLDING,
        payment_date: '2026-05-11',
        amount: '5000.0000',
        currency: 'CAD',
        payment_purpose: 'vendor_refund',
        payment_state: 'paid',
      },
      {
        payment_id: bogusPaymentId,
        org_id: SEED.ORG_HOLDING,
        payment_date: '2026-05-10',
        amount: '500.0000',
        currency: 'CAD',
        payment_purpose: 'bill_payment',
        payment_state: 'paid',
      },
    ]);

    await db.from('vendor_prepayments').insert([
      {
        id: vpOpenId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        payment_id: paymentVpAId,
        prepayment_type: 'retainer',
        status: 'open',
        amount_original: '5000.0000',
        amount_cad: '5000.0000',
        currency: 'CAD',
        recognized_at: '2026-05-10',
        tax_timing_choice: 'at_payment',
        created_by: ctx.caller.user_id,
        trace_id: traceId,
      },
      {
        id: vpAppliedId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        payment_id: paymentVpBId,
        prepayment_type: 'retainer',
        status: 'partially_applied',
        amount_original: '5000.0000',
        amount_cad: '5000.0000',
        currency: 'CAD',
        recognized_at: '2026-05-10',
        tax_timing_choice: 'at_payment',
        created_by: ctx.caller.user_id,
        trace_id: traceId,
      },
      {
        id: vpForBogusRefundId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        payment_id: paymentVpCId,
        prepayment_type: 'deposit',
        status: 'open',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        recognized_at: '2026-05-10',
        tax_timing_choice: 'at_payment',
        created_by: ctx.caller.user_id,
        trace_id: traceId,
      },
    ]);

    await db.from('bills').insert({
      bill_id: billId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      issue_date: '2026-05-10',
      amount_original: '2000.0000',
      amount_cad: '2000.0000',
      currency: 'CAD',
      lifecycle_state: 'approved_for_payment',
    });

    await db.from('vendor_prepayment_applications').insert({
      id: appId,
      org_id: SEED.ORG_HOLDING,
      vendor_prepayment_id: vpAppliedId,
      bill_id: billId,
      amount_original: '1000.0000',
      amount_cad: '1000.0000',
      applied_at: '2026-05-10',
      created_by: ctx.caller.user_id,
      trace_id: traceId,
    });
  });

  afterAll(async () => {
    await db.from('vendor_prepayment_applications').delete().eq('id', appId);
    await db.from('bills').delete().eq('bill_id', billId);
    await db.from('vendor_prepayments').delete().in('id', [vpOpenId, vpAppliedId, vpForBogusRefundId]);
    await db
      .from('payments')
      .delete()
      .in('payment_id', [paymentVpAId, paymentVpBId, paymentVpCId, refundPaymentId, bogusPaymentId]);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  it('happy path: open vendor prepayment with no applications → refunded', async () => {
    const result = await vendorPrepaymentService.refund(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_prepayment_id: vpOpenId,
        refund_payment_id: refundPaymentId,
      },
      ctx,
    );

    expect(result.vendor_prepayment_id).toBe(vpOpenId);
    expect(result.status).toBe('refunded');

    const { data: vp } = await db
      .from('vendor_prepayments')
      .select('status')
      .eq('id', vpOpenId)
      .single();
    expect(vp!.status).toBe('refunded');

    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'vendor_prepayment_refunded')
      .eq('entity_id', vpOpenId);
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('vendor_prepayment');
    expect(audit![0].before_state).toBeTruthy();
    expect((audit![0].before_state as Record<string, unknown>).status).toBe('open');
  });

  it('D4-α: rejects when vendor_prepayment has applications (status=partially_applied)', async () => {
    await expect(
      vendorPrepaymentService.refund(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_prepayment_id: vpAppliedId,
          refund_payment_id: refundPaymentId,
        },
        ctx,
      ),
    ).rejects.toThrow(/status=partially_applied; refund requires status=open/);
  });

  it("rejects when refund_payment has wrong payment_purpose (not 'vendor_refund')", async () => {
    await expect(
      vendorPrepaymentService.refund(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_prepayment_id: vpForBogusRefundId,
          refund_payment_id: bogusPaymentId,
        },
        ctx,
      ),
    ).rejects.toThrow(/expected 'vendor_refund'/);
  });
});
