// tests/integration/autoCommitGate.integration.test.ts
//
// ADR-0007 Q78 auto-commit gate validation (Option II — paid-API-free).
//
// Proves the auth-model resolution EMPIRICALLY: a system actor
// (SystemActorServiceContext, caller.user_id=null) passed to withInvariants
// is ADMITTED (Option A — bypasses the identity-coupled invariants), ADAPTED
// to the seeded service account (Path X — SYSTEM_ACTOR_USER_ID), and produces
// a REAL ledger mutation attributed to that service-account identity — not
// denied as the retired synthCtxForCommit shim was (which had no membership,
// so Invariant 4 denied → proposal_id=null).
//
// Drives the orchestrator's exact commit-path calls
// (withInvariants(billService.post) / withInvariants(paymentService.record))
// with synthesized inputs + a seeded vendor/bill, bypassing the Modal OCR +
// classifier + extractor stages. Those upstream stages are covered by the
// RUN_MODAL_E2E seeded-scenarios follow-up (tracked separately); this test is
// the routine-CI, deterministic, paid-API-free gate the ADR requires.
//
// Commit-path attribution reality (verified against the live schema):
//   - bills has NO created_by column; journal_entries.created_by + audit_log
//     .user_id are nullable. The one NOT-NULL actor column in the commit path
//     is bill_payment_allocations.created_by — a null-user system actor would
//     violate it on a payment commit. The adaptation (service-account uuid)
//     satisfies it AND attributes the nullable columns. So a bill's
//     attribution is audit-level (the bill_created row), while a payment's is
//     both the allocation row's created_by and the payment_recorded audit row.
//   - pipeline JEs post with source:'manual' (not 'agent'), so the
//     INV-IDEMPOTENCY-001 CHECK (source<>'agent' OR idempotency_key NOT NULL)
//     is not tripped.
//
// Item 20 dedicated test-accounts pattern: per-run unique account_codes via
// traceId (chart_of_accounts UNIQUE(org_id, account_code)).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import {
  SYSTEM_ACTOR_USER_ID,
  type SystemActorServiceContext,
} from '@/services/middleware/serviceContext';
import { billService } from '@/services/spend/billService';
import { paymentService } from '@/services/spend/paymentService';

describe('ADR-0007 Q78 auto-commit gate (system-actor → withInvariants → attributed ledger commit)', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();

  // The orchestrator's commit-path context (ingestDocument.ts): a system
  // actor with user_id=null + the service-account uuid for attribution.
  const systemCtx: SystemActorServiceContext = {
    trace_id: traceId,
    caller: {
      user_id: null,
      system_actor: 'pipeline_orchestrator',
      system_user_id: SYSTEM_ACTOR_USER_ID,
    },
    org_id: SEED.ORG_HOLDING,
  };

  let vendorId: string;
  let apControlAccountId: string;
  let expenseAccountId: string;
  let cashAccountId: string;
  let fiscalPeriodId: string;
  let seededBillId: string; // approved_for_payment bill for the payment test

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    seededBillId = crypto.randomUUID();

    const apCode = `T${traceId.slice(0, 8)}_AP`;
    const expCode = `T${traceId.slice(0, 8)}_EXP`;
    const cashCode = `T${traceId.slice(0, 8)}_CASH`;
    const { data: created, error: coaErr } = await db
      .from('chart_of_accounts')
      .insert([
        { org_id: SEED.ORG_HOLDING, account_code: apCode, account_name: 'TEST autoCommit AP control', account_type: 'liability' },
        { org_id: SEED.ORG_HOLDING, account_code: expCode, account_name: 'TEST autoCommit expense', account_type: 'expense' },
        { org_id: SEED.ORG_HOLDING, account_code: cashCode, account_name: 'TEST autoCommit cash', account_type: 'asset' },
      ])
      .select('account_id, account_code');
    if (coaErr || !created || created.length !== 3) {
      throw new Error(`COA seed failed: ${coaErr?.message ?? 'no data'}`);
    }
    apControlAccountId = created.find((c) => c.account_code === apCode)!.account_id;
    expenseAccountId = created.find((c) => c.account_code === expCode)!.account_id;
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

    const { error: vendorErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST autoCommit vendor',
    });
    if (vendorErr) throw new Error(`vendor seed failed: ${vendorErr.message}`);

    // Seed an approved-for-payment bill for the payment-commit test. created_by
    // is a human controller — the bill's provenance is irrelevant to the
    // system-actor PAYMENT test, which asserts the payment's attribution.
    const { error: billErr } = await db.from('bills').insert({
      bill_id: seededBillId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      issue_date: '2026-05-10',
      amount_original: '500.0000',
      amount_cad: '500.0000',
      currency: 'CAD',
      fx_rate: '1.00000000',
      lifecycle_state: 'approved_for_payment',
    });
    if (billErr) throw new Error(`bill seed failed: ${billErr.message}`);
  });

  afterAll(async () => {
    // bills DELETE cascades bill_lines; explicit allocation + payment DELETE.
    // JE/JL rows are append-only (immutability triggers) and accumulate;
    // per-run T-prefixed account codes prevent collisions (Item 20 pattern).
    await db.from('bill_payment_allocations').delete().eq('org_id', SEED.ORG_HOLDING).eq('bill_id', seededBillId);
    await db.from('payments').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  function buildBillInput() {
    return {
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bill_number: 'AUTOCOMMIT-001',
      issue_date: '2026-05-10',
      due_date: '2026-06-10',
      payment_terms_days: 30,
      purchase_order_id: null,
      currency: 'CAD' as const,
      amount_original: '750.0000',
      amount_cad: '750.0000',
      fx_rate: '1.00000000',
      tax_amount_total: '0.0000',
      bill_lines: [
        {
          account_id: expenseAccountId,
          description: 'Auto-commit test expense line',
          amount: '750.0000',
          amount_original: '750.0000',
          amount_cad: '750.0000',
          tax_code_id: null,
          line_number: 1,
        },
      ],
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-10',
      ap_control_account_id: apControlAccountId,
      override_evidence_completeness: true,
    };
  }

  it('system actor auto-commits a bill via withInvariants — real bill row attributed to the service account', async () => {
    // The exact commit-path call ingestDocument makes (Option A bypass + Path X
    // adapt). Pre-arc this DENIED at Invariant 4 (synthCtxForCommit had no
    // membership) → proposal_id=null. Now it commits.
    const result = await withInvariants(billService.post, { action: 'bill.post' })(
      buildBillInput(),
      systemCtx,
    );

    expect(result.bill_id).toMatch(/^[0-9a-f-]{36}$/i);

    const { data: bill } = await db
      .from('bills')
      .select('bill_id, vendor_id, amount_cad, posted_journal_entry_id')
      .eq('bill_id', result.bill_id)
      .single();
    expect(bill).toBeTruthy();
    expect(bill!.vendor_id).toBe(vendorId);
    expect(Number(bill!.amount_cad)).toBe(750);
    expect(bill!.posted_journal_entry_id).toBe(result.journal_entry_id);

    // THE auth-model assertion (bills has no created_by column → attribution
    // is audit-level): the bill_created audit row is attributed to the seeded
    // service account, not null and not a human (ADR-0007 Q78 Path X).
    // recordMutation receives the adapted ctx → user_id = service-account uuid.
    const { data: billAudit } = await db
      .from('audit_log')
      .select('user_id, entity_id')
      .eq('trace_id', traceId)
      .eq('action', 'bill_created');
    expect(billAudit).toHaveLength(1);
    expect(billAudit![0].user_id).toBe(SYSTEM_ACTOR_USER_ID);
    expect(billAudit![0].entity_id).toBe(result.bill_id);
  });

  it('system actor auto-commits a bill payment via withInvariants — payment attributed to the service account', async () => {
    const result = await withInvariants(paymentService.record, { action: 'payment.record' })(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id: seededBillId,
        payment_method: 'eft' as const,
        payment_date: '2026-05-12',
        amount_cad: '500.0000',
        reference_number: 'AUTOCOMMIT-PAY-001',
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-12',
        ap_control_account_id: apControlAccountId,
        cash_account_id: cashAccountId,
      },
      systemCtx,
    );

    expect(result.payment_id).toMatch(/^[0-9a-f-]{36}$/i);

    // payments has no created_by column; the allocation row carries the
    // attribution (created_by) + the payment_recorded audit row carries it.
    const { data: alloc } = await db
      .from('bill_payment_allocations')
      .select('created_by, bill_id')
      .eq('payment_id', result.payment_id)
      .single();
    expect(alloc).toBeTruthy();
    expect(alloc!.created_by).toBe(SYSTEM_ACTOR_USER_ID);
    expect(alloc!.bill_id).toBe(seededBillId);

    const { data: payAudit } = await db
      .from('audit_log')
      .select('user_id')
      .eq('trace_id', traceId)
      .eq('action', 'payment_recorded');
    expect(payAudit!.length).toBeGreaterThanOrEqual(1);
    expect(payAudit![0].user_id).toBe(SYSTEM_ACTOR_USER_ID);
  });

  it('rejects a system actor that carries no system_user_id (cannot attribute a ledger write)', async () => {
    const noIdentityCtx: SystemActorServiceContext = {
      trace_id: crypto.randomUUID(),
      caller: { user_id: null, system_actor: 'pipeline_orchestrator' },
      org_id: SEED.ORG_HOLDING,
    };
    await expect(
      withInvariants(billService.post, { action: 'bill.post' })(buildBillInput(), noIdentityCtx),
    ).rejects.toThrow(/system_user_id/);
  });
});
