// tests/integration/billApproveForPayment.test.ts
//
// Phase 5 chunk B5-2 substantive session #1 — per-mutation integration test
// for billService.approveForPayment (approve_bill_for_payment).
//
// Exercises: happy path (pending_approval → approved_for_payment; emits
// bill_approved_for_payment audit at bill grain; produces NO journal entry —
// state-only mutation per ADR-0011 §1 Reading B preservation); rejects
// state-transition from 'draft' (POST_FAILED + BILL_INVALID_STATE_TRANSITION
// message); rejects state-transition from 'voided' (POST_FAILED +
// BILL_INVALID_STATE_TRANSITION message); rejects unknown bill_id (NOT_FOUND).
//
// Item 20 dedicated test-accounts pattern does NOT apply here:
// approve_bill_for_payment is state-only (no JE produced; no
// chart_of_accounts dependency at the mutation grain). Bill seed rows are
// inserted directly with the desired lifecycle_state for each scenario;
// posted_journal_entry_id is left null (the mutation does not consume it).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { billService } from '@/services/spend/billService';

describe('billService.approveForPayment', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx = makeTestContext({ trace_id: traceId, org_ids: [SEED.ORG_HOLDING] });

  let vendorId: string;
  let billPendingId: string;
  let billDraftId: string;
  let billVoidedId: string;

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    billPendingId = crypto.randomUUID();
    billDraftId = crypto.randomUUID();
    billVoidedId = crypto.randomUUID();

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST approveForPayment vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    const { error: billsErr } = await db.from('bills').insert([
      {
        bill_id: billPendingId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'pending_approval',
      },
      {
        bill_id: billDraftId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'draft',
      },
      {
        bill_id: billVoidedId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-10',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'voided',
      },
    ]);
    if (billsErr) throw new Error(`bills seed failed: ${billsErr.message}`);
  });

  afterAll(async () => {
    await db
      .from('bills')
      .delete()
      .in('bill_id', [billPendingId, billDraftId, billVoidedId]);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  it('happy path: pending_approval → approved_for_payment, emits audit, produces NO JE', async () => {
    // Snapshot the count of journal_entries created under this trace_id
    // BEFORE the mutation, then re-count AFTER to verify zero new rows.
    const { data: jeBefore } = await db
      .from('audit_log')
      .select('audit_log_id')
      .eq('trace_id', traceId)
      .eq('action', 'journal_entry.post');
    const jePostCountBefore = (jeBefore ?? []).length;

    const result = await billService.approveForPayment(
      { org_id: SEED.ORG_HOLDING, bill_id: billPendingId },
      ctx,
    );

    expect(result.bill_id).toBe(billPendingId);

    // State changed.
    const { data: bill } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billPendingId)
      .single();
    expect(bill!.lifecycle_state).toBe('approved_for_payment');

    // Bill-grain audit emitted.
    const { data: audit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'bill_approved_for_payment')
      .eq('entity_id', billPendingId);
    expect(audit).toHaveLength(1);
    expect(audit![0].entity_type).toBe('bill');
    expect(audit![0].user_id).toBe(ctx.caller.user_id);
    expect(audit![0].before_state).toBeTruthy();
    expect((audit![0].before_state as Record<string, unknown>).lifecycle_state).toBe(
      'pending_approval',
    );

    // Reading B preservation: NO journal_entry.post audit row added.
    const { data: jeAfter } = await db
      .from('audit_log')
      .select('audit_log_id')
      .eq('trace_id', traceId)
      .eq('action', 'journal_entry.post');
    expect((jeAfter ?? []).length).toBe(jePostCountBefore);
  });

  it('rejects state-transition from draft (BILL_INVALID_STATE_TRANSITION)', async () => {
    await expect(
      billService.approveForPayment(
        { org_id: SEED.ORG_HOLDING, bill_id: billDraftId },
        ctx,
      ),
    ).rejects.toThrow(/BILL_INVALID_STATE_TRANSITION/);
  });

  it('rejects state-transition from voided (BILL_INVALID_STATE_TRANSITION)', async () => {
    await expect(
      billService.approveForPayment(
        { org_id: SEED.ORG_HOLDING, bill_id: billVoidedId },
        ctx,
      ),
    ).rejects.toThrow(/BILL_INVALID_STATE_TRANSITION/);
  });

  it('rejects unknown bill_id with NOT_FOUND', async () => {
    await expect(
      billService.approveForPayment(
        {
          org_id: SEED.ORG_HOLDING,
          bill_id: '00000000-0000-0000-0000-deadbeef0000',
        },
        ctx,
      ),
    ).rejects.toThrow(/bill_id=.* not found/);
  });
});
