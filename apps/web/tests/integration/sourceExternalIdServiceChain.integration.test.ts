// tests/integration/sourceExternalIdServiceChain.integration.test.ts
//
// Wave 6 D3 T2 — the source_external_id pass-through CHAIN through the
// service layer (billService.post / paymentService.record →
// journalEntryService.post → write_journal_entry_atomic), and the
// typed DUPLICATE_SOURCE_EXTERNAL_ID mapping keyed on the
// idx_je_source_external constraint NAME (so the other journal_entries
// 23505 source — unique_entry_number_per_org_period — stays
// POST_FAILED and can never be mis-recovered as already-posted).
//
// JE/JL are append-only (integration-test rules §3.2): no DELETE
// cleanup; per-run unique source_external_id values + per-run COA
// codes (§3.1 T-prefix discipline).

import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { billService } from '@/services/spend/billService';
import { paymentService } from '@/services/spend/paymentService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

const db = adminClient();
const RUN_SUFFIX = crypto.randomUUID().slice(0, 8);

describe('Wave 6 D3 T2: source_external_id service chain + typed duplicate code', () => {
  let ctx: ServiceContext;
  let periodId: string;
  let vendorId: string;
  let expenseAccountId: string;
  let apControlAccountId: string;
  let cashAccountId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id, start_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .limit(1)
      .single();
    periodId = period!.period_id;

    vendorId = crypto.randomUUID();
    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: `TEST d3-t2 chain vendor ${RUN_SUFFIX}`,
    });
    if (vendorErr) throw new Error(`vendor fixture failed: ${vendorErr.message}`);

    // Per-run COA isolation (§3.1): T-prefixed codes from the run suffix.
    const expCode = `T${RUN_SUFFIX}_EXP`;
    const apCode = `T${RUN_SUFFIX}_AP`;
    const cashCode = `T${RUN_SUFFIX}_CASH`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        {
          org_id: SEED.ORG_HOLDING,
          account_code: expCode,
          account_name: 'TEST d3-t2 expense proxy',
          account_type: 'expense',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: apCode,
          account_name: 'TEST d3-t2 AP control proxy',
          account_type: 'liability',
        },
        {
          org_id: SEED.ORG_HOLDING,
          account_code: cashCode,
          account_name: 'TEST d3-t2 cash proxy',
          account_type: 'asset',
        },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 3) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    expenseAccountId = created.find((c) => c.account_code === expCode)!.account_id;
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    cashAccountId = created.find((c) => c.account_code === cashCode)!.account_id;
  });

  function billInput(source_external_id?: string) {
    return {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: `D3T2-${crypto.randomUUID().slice(0, 8)}`,
      issue_date: '2026-06-04',
      due_date: null,
      payment_terms_days: null,
      purchase_order_id: null,
      currency: 'CAD' as const,
      amount_original: '100.00',
      amount_cad: '100.00',
      fx_rate: '1',
      tax_amount_total: '0',
      bill_lines: [
        {
          account_id: expenseAccountId,
          description: 'd3-t2 chain line',
          amount: '100.00',
          amount_original: '100.00',
          amount_cad: '100.00',
          tax_code_id: null,
          line_number: 1,
        },
      ],
      fiscal_period_id: periodId,
      entry_date: '2026-06-04',
      ap_control_account_id: apControlAccountId,
      override_evidence_completeness: true,
      ...(source_external_id !== undefined ? { source_external_id } : {}),
    };
  }

  it('billService.post threads source_external_id to the JE row', async () => {
    const extId = `dc_bill_${RUN_SUFFIX}`;
    const { journal_entry_id } = await billService.post(billInput(extId), ctx);

    const { data: je, error } = await db
      .from('journal_entries')
      .select('source_external_id, source_system')
      .eq('journal_entry_id', journal_entry_id)
      .single();
    expect(error).toBeNull();
    expect(je!.source_external_id).toBe(extId);
    expect(je!.source_system).toBe('manual');
  });

  it('duplicate triple via the SERVICE path → typed DUPLICATE_SOURCE_EXTERNAL_ID (not POST_FAILED)', async () => {
    const extId = `dc_dup_${RUN_SUFFIX}`;
    await billService.post(billInput(extId), ctx);

    await expect(
      billService.post(billInput(extId), ctx),
    ).rejects.toMatchObject({ code: 'DUPLICATE_SOURCE_EXTERNAL_ID' });
  });

  it('billService.post WITHOUT the field is unaffected (NULL skips the partial index — twice)', async () => {
    const a = await billService.post(billInput(), ctx);
    const b = await billService.post(billInput(), ctx);
    expect(a.journal_entry_id).not.toBe(b.journal_entry_id);

    const { data: je } = await db
      .from('journal_entries')
      .select('source_external_id')
      .eq('journal_entry_id', a.journal_entry_id)
      .single();
    expect(je!.source_external_id).toBeNull();
  });

  it('paymentService.record threads source_external_id to the payment JE row', async () => {
    // A bill to pay (no ext-id — the payment carries its own).
    const { bill_id } = await billService.post(billInput(), ctx);
    // record() requires approved_for_payment lifecycle.
    await billService.approveForPayment(
      { org_id: SEED.ORG_HOLDING, bill_id },
      ctx,
    );

    const extId = `dc_pay_${RUN_SUFFIX}`;
    const { journal_entry_id } = await paymentService.record(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id,
        payment_method: 'eft',
        payment_date: '2026-06-04',
        amount_cad: '100.00',
        reference_number: null,
        fiscal_period_id: periodId,
        entry_date: '2026-06-04',
        ap_control_account_id: apControlAccountId,
        cash_account_id: cashAccountId,
        source_external_id: extId,
      },
      ctx,
    );

    const { data: je, error } = await db
      .from('journal_entries')
      .select('source_external_id')
      .eq('journal_entry_id', journal_entry_id)
      .single();
    expect(error).toBeNull();
    expect(je!.source_external_id).toBe(extId);
  });
});
