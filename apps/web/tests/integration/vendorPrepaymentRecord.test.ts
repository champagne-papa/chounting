// tests/integration/vendorPrepaymentRecord.test.ts
//
// Phase 5 chunk B5-1 substantive session #2 — per-mutation integration test
// for vendorPrepaymentService.record (record_vendor_prepayment).
//
// Exercises: happy path (creates vendor_prepayments row with status='open'
// + emits vendor_prepayment_created audit row); rejects when payment_purpose
// is not 'vendor_prepayment' (Q59 closure: payment_purpose immutability +
// purpose-discriminator linkage); rejects when vendor not found in org;
// rejects malformed Zod input.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { vendorPrepaymentService } from '@/services/spend/vendorPrepaymentService';

describe('vendorPrepaymentService.record', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let paymentVpId: string;     // payment_purpose='vendor_prepayment'
  let paymentBillId: string;   // payment_purpose='bill_payment' (negative)
  const createdVpIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    paymentVpId = crypto.randomUUID();
    paymentBillId = crypto.randomUUID();

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST VP record vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    const { error: payErr } = await db.from('payments').insert([
      {
        payment_id: paymentVpId,
        org_id: SEED.ORG_HOLDING,
        payment_date: '2026-05-10',
        amount: '5000.0000',
        currency: 'CAD',
        payment_purpose: 'vendor_prepayment',
        payment_state: 'paid',
      },
      {
        payment_id: paymentBillId,
        org_id: SEED.ORG_HOLDING,
        payment_date: '2026-05-10',
        amount: '500.0000',
        currency: 'CAD',
        payment_purpose: 'bill_payment',
        payment_state: 'paid',
      },
    ]);
    if (payErr) throw new Error(`payment seed failed: ${payErr.message}`);
  });

  afterAll(async () => {
    if (createdVpIds.length > 0) {
      await db.from('vendor_prepayments').delete().in('id', createdVpIds);
    }
    await db.from('payments').delete().in('payment_id', [paymentVpId, paymentBillId]);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    // audit_log is append-only (INV-AUDIT-002); leave orphan rows.
  });

  it('happy path: creates vendor_prepayment row with status=open and emits audit_log', async () => {
    const result = await vendorPrepaymentService.record(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        payment_id: paymentVpId,
        prepayment_type: 'retainer',
        amount_original: '5000.0000',
        amount_cad: '5000.0000',
        currency: 'CAD',
        recognized_at: '2026-05-10',
        tax_timing_choice: 'at_payment',
      },
      ctx,
    );

    expect(result.vendor_prepayment_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.status).toBe('open');
    createdVpIds.push(result.vendor_prepayment_id);

    const { data: vp } = await db
      .from('vendor_prepayments')
      .select('*')
      .eq('id', result.vendor_prepayment_id)
      .single();
    expect(vp).toBeTruthy();
    expect(vp!.status).toBe('open');
    expect(Number(vp!.amount_original)).toBe(5000);
    expect(Number(vp!.amount_cad)).toBe(5000);
    expect(vp!.prepayment_type).toBe('retainer');
    expect(vp!.tax_timing_choice).toBe('at_payment');
    expect(vp!.payment_id).toBe(paymentVpId);
    expect(vp!.vendor_id).toBe(vendorId);
    expect(vp!.org_id).toBe(SEED.ORG_HOLDING);
    expect(vp!.created_by).toBe(ctx.caller.user_id);
    expect(vp!.trace_id).toBe(traceId);

    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'vendor_prepayment_created');
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('vendor_prepayment');
    expect(audit![0].entity_id).toBe(result.vendor_prepayment_id);
    expect(audit![0].user_id).toBe(ctx.caller.user_id);
  });

  it("rejects when referenced payment's payment_purpose is not 'vendor_prepayment'", async () => {
    await expect(
      vendorPrepaymentService.record(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_id: vendorId,
          payment_id: paymentBillId, // payment_purpose='bill_payment'
          prepayment_type: 'deposit',
          amount_original: '500.0000',
          amount_cad: '500.0000',
          currency: 'CAD',
          recognized_at: '2026-05-10',
          tax_timing_choice: 'at_payment',
        },
        ctx,
      ),
    ).rejects.toThrow(/expected 'vendor_prepayment'/);
  });

  it('rejects when vendor does not exist in the org', async () => {
    await expect(
      vendorPrepaymentService.record(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_id: '00000000-0000-0000-0000-deadbeef0000',
          payment_id: paymentVpId,
          prepayment_type: 'retainer',
          amount_original: '5000.0000',
          amount_cad: '5000.0000',
          currency: 'CAD',
          recognized_at: '2026-05-10',
          tax_timing_choice: 'at_payment',
        },
        ctx,
      ),
    ).rejects.toThrow(/vendor_id=.* not found/);
  });

  it('rejects malformed Zod input (bad amount format)', async () => {
    await expect(
      vendorPrepaymentService.record(
        {
          org_id: SEED.ORG_HOLDING,
          vendor_id: vendorId,
          payment_id: paymentVpId,
          prepayment_type: 'retainer',
          amount_original: 'not-a-number',
          amount_cad: '5000.0000',
          currency: 'CAD',
          recognized_at: '2026-05-10',
          tax_timing_choice: 'at_payment',
        } as never,
        ctx,
      ),
    ).rejects.toThrow();
  });
});
