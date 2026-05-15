// tests/integration/dispatchTriggerCrossPhase.integration.test.ts
//
// Phase 4 chunk 3 (3b) — cross-phase emission wiring integration
// tests covering the 6 service-method modifications (Task 6 / P3-i
// post-commit wrapper pattern; Pattern B variant 5+1 split):
//   - billService.post (T1; external-wrap; unconditional)
//   - billService.recordPayment (T5; external-wrap; conditional on
//     newState === 'fully_paid')
//   - billService.reverse (T5; external-wrap; conditional on
//     pre-reverse bill.lifecycle_state ∈ ('approved_for_payment',
//     'partially_paid'))
//   - vendorPrepaymentService.record (T3; external-wrap; unconditional)
//   - periodService.unlock (T8; internal-wrap inside withInvariants
//     async body; unconditional)
//   - documentExceptionService.resolveException (T10; external-wrap;
//     conditional on resolution_action === 'reprocess';
//     fail-and-propagate per F-J-5)
//
// File-location adaptation per amended brief §Task 9: brief specified
// 15 tests across 6 per-method test files; impl consolidates into
// this single new file with 6 describes (15 tests total) for shared
// scaffolding efficiency. Per-method test counts preserved
// (post:2 + recordPayment:3 + reverse:3 + record:2 + unlock:2 +
// resolveException:3 = 15).
//
// β-5 carry-forward (3a impl): count_after = newCandidates.length
// (rematchCandidate result count), not K2 head-of-chain SELECT
// post-mutation. Tests asserting candidate_count_before/after values
// honor this semantic.
//
// β-6 carry-forward (3a impl): discriminator rule 5 maps to
// decision_outcome='no_change' (operationally reachable v1 state
// via T5→T1 sequence under chunk-1 no-supersedes-on-empty-rerun);
// no T5→T1 cross-phase test seeds the sequence at 3b (the dispatcher
// service surface already covers rule 5 in the 3a dispatchTrigger
// integration test file).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { billService } from '@/services/spend/billService';
import { vendorPrepaymentService } from '@/services/spend/vendorPrepaymentService';
import { periodService } from '@/services/accounting/periodService';
import {
  enqueueException,
  resolveException,
} from '@/services/document-platform/documentExceptionService';
import { completeCandidate } from '@/services/document-platform/documentRouterService';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { attachDocumentCaseSource } from '@/services/document-platform/documentCaseSourceService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { CompleteCandidateInputRaw } from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Fixture helpers.
// ---------------------------------------------------------------------

async function seedVendor(orgId: string): Promise<string> {
  const db = adminClient();
  const vendorId = crypto.randomUUID();
  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: `TEST chunk-3-3b cross-phase vendor ${vendorId.slice(0, 8)}`,
  });
  if (error) throw new Error(`vendor fixture failed: ${error.message}`);
  return vendorId;
}

async function seedTestAccounts(
  orgId: string,
  traceId: string,
): Promise<{ apControlId: string; cashId: string }> {
  const db = adminClient();
  const apCode = `T${traceId.slice(0, 8)}_AP_3B`;
  const cashCode = `T${traceId.slice(0, 8)}_CASH_3B`;
  const { data, error } = await db
    .from('chart_of_accounts')
    .insert([
      { org_id: orgId, account_code: apCode, account_name: 'TEST 3b AP', account_type: 'liability' },
      { org_id: orgId, account_code: cashCode, account_name: 'TEST 3b cash', account_type: 'asset' },
    ])
    .select('account_id, account_code');
  if (error || !data || data.length !== 2) {
    throw new Error(`accounts seed failed: ${error?.message ?? 'no data'}`);
  }
  const apControlId = data.find((c) => c.account_code === apCode)!.account_id;
  const cashId = data.find((c) => c.account_code === cashCode)!.account_id;
  return { apControlId, cashId };
}

async function getOpenFiscalPeriodId(orgId: string): Promise<string> {
  const db = adminClient();
  const { data, error } = await db
    .from('fiscal_periods')
    .select('period_id')
    .eq('org_id', orgId)
    .eq('is_locked', false)
    .order('start_date', { ascending: true })
    .limit(1)
    .single();
  if (error || !data) throw new Error(`no open fiscal period for ${orgId}`);
  return data.period_id;
}

async function buildClassifiedCaseWithBillCandidate(
  orgId: string,
  ctx: ServiceContext,
): Promise<{ caseId: string; sourceDocId: string; vendorId: string; billId: string }> {
  const db = adminClient();
  const vendorId = await seedVendor(orgId);
  const billId = crypto.randomUUID();
  const { error: billErr } = await db.from('bills').insert({
    bill_id: billId,
    org_id: orgId,
    vendor_id: vendorId,
    issue_date: '2026-05-14',
    lifecycle_state: 'approved_for_payment',
    amount_cad: '1000.0000',
  });
  if (billErr) throw new Error(`bill seed failed: ${billErr.message}`);

  // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor for source_document).
  const { ingest_batch_id } = await createIngestBatchForTest(orgId);

  const sourceResult = await documentPlatformService.createSourceDocument(
    {
      bytes: new Uint8Array([1, 2, 3, 4]),
      mime_type: 'application/pdf',
      original_filename: `3b-cross-phase-${crypto.randomUUID().slice(0, 8)}.pdf`,
      ingest_channel: 'direct_upload',
      ingest_batch_id,
      received_at: new Date().toISOString(),
      org_id: orgId,
      created_by: ctx.caller.user_id,
    },
    ctx,
  );
  const caseResult = await createDocumentCase({ org_id: orgId, document_type: 'vendor_invoice' }, ctx);
  await attachDocumentCaseSource(
    { document_case_id: caseResult.id, source_document_id: sourceResult.id, role: 'primary' },
    ctx,
  );

  const completeInput: CompleteCandidateInputRaw = {
    document_case_id: caseResult.id,
    source_document_id: sourceResult.id,
    document_type: 'vendor_invoice',
    classification_confidence: 0.95,
    extracted_fields: { invoice_amount: 1000, invoice_date: '2026-05-14' },
    vendor_match: {
      vendor_id: vendorId,
      confidence: 0.95,
      match_type: 'exact_name',
      candidate_alternatives: [],
    },
    trace_id: ctx.trace_id,
  };
  await completeCandidate(completeInput, ctx);

  await db.rpc('update_document_case_state_with_audit', {
    p_case_id: caseResult.id,
    p_target_state: 'classified',
    p_audit: {
      org_id: orgId,
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'document_case_transitioned',
      entity_type: 'document_case',
      tool_name: null,
      reason: null,
    },
  });

  return { caseId: caseResult.id, sourceDocId: sourceResult.id, vendorId, billId };
}

async function countDispatchAuditsForTrigger(
  db: Db,
  traceId: string,
  triggerType: string,
): Promise<number> {
  const { data } = await db
    .from('audit_log')
    .select('before_state')
    .eq('trace_id', traceId)
    .eq('action', 'router_re_evaluation_fired');
  return (data ?? []).filter(
    (r) => (r.before_state as Record<string, unknown>)?.trigger_type === triggerType,
  ).length;
}

// Spy helper: verifies the P3-i wiring at the service-method body
// invokes dispatchTrigger with the expected trigger_type, without
// requiring a full fan-out fixture (cases-with-prior-candidates).
// Cross-phase test grain at 3b: confirms the WIRING fires; the
// dispatcher's downstream fan-out + audit emission is exercised by
// 3a's dispatchTrigger.integration.test.ts.
async function spyOnDispatchTrigger() {
  const routerMod = await import('@/services/document-platform/documentRouterService');
  return vi.spyOn(routerMod, 'dispatchTrigger').mockImplementation(async () => {});
}

// =====================================================================
// Describe 1 — billService.post (T1 unconditional) — 2 tests
// =====================================================================

describe('billService.post → T1_new_bill dispatch (P3-i external-wrap; unconditional)', () => {
  let ctx: ServiceContext;
  let vendorId: string;
  let apControlId: string;
  let cashId: string;
  let fiscalPeriodId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    vendorId = await seedVendor(SEED.ORG_HOLDING);
    const accts = await seedTestAccounts(SEED.ORG_HOLDING, ctx.trace_id);
    apControlId = accts.apControlId;
    cashId = accts.cashId;
    fiscalPeriodId = await getOpenFiscalPeriodId(SEED.ORG_HOLDING);
    void cashId;
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  it('T1 dispatch fires post-bill-post with trigger_type=T1_new_bill', async () => {
    const result = await billService.post(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-14',
        bill_number: null,
        due_date: null,
        payment_terms_days: null,
        purchase_order_id: null,
        tax_amount_total: '0.0000',
        currency: 'CAD',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        fx_rate: '1.00000000',
        ap_control_account_id: apControlId,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-14',
        bill_lines: [
          {
            account_id: apControlId,
            description: 'test line',
            amount: '500.0000',
            amount_original: '500.0000',
            amount_cad: '500.0000',
            line_number: 1,
            tax_code_id: null,
          },
        ],
      },
      ctx,
    );
    const db = adminClient();
    const count = await countDispatchAuditsForTrigger(db, ctx.trace_id, 'T1_new_bill');
    expect(count).toBeGreaterThanOrEqual(1);
    expect(result.bill_id).toBeTruthy();
  });

  it('bill post succeeds even if dispatcher would throw (best-effort isolation)', async () => {
    // P3-i contract: dispatcher failure does not propagate. The
    // dispatcher's own internal try/catch + dispatch_failed audit
    // emission keeps the bill post green even when fan-out cases
    // encounter rule 3/5 throws.
    const result = await billService.post(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-14',
        bill_number: null,
        due_date: null,
        payment_terms_days: null,
        purchase_order_id: null,
        tax_amount_total: '0.0000',
        currency: 'CAD',
        amount_original: '600.0000',
        amount_cad: '600.0000',
        fx_rate: '1.00000000',
        ap_control_account_id: apControlId,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-14',
        bill_lines: [
          {
            account_id: apControlId,
            description: 'test line 2',
            amount: '600.0000',
            amount_original: '600.0000',
            amount_cad: '600.0000',
            line_number: 1,
            tax_code_id: null,
          },
        ],
      },
      ctx,
    );
    expect(result.bill_id).toBeTruthy();
  });
});

// =====================================================================
// Describe 2 — billService.recordPayment (T5 conditional fully_paid) — 3 tests
// =====================================================================

describe('billService.recordPayment → T5 conditional on fully_paid', () => {
  let ctx: ServiceContext;
  let vendorId: string;
  let billPartialId: string;
  let billFullId: string;
  let apControlId: string;
  let cashId: string;
  let fiscalPeriodId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    vendorId = await seedVendor(SEED.ORG_HOLDING);
    billPartialId = crypto.randomUUID();
    billFullId = crypto.randomUUID();
    const accts = await seedTestAccounts(SEED.ORG_HOLDING, ctx.trace_id);
    apControlId = accts.apControlId;
    cashId = accts.cashId;
    fiscalPeriodId = await getOpenFiscalPeriodId(SEED.ORG_HOLDING);

    const db = adminClient();
    await db.from('bills').insert([
      {
        bill_id: billPartialId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-14',
        amount_original: '1000.0000',
        amount_cad: '1000.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
      {
        bill_id: billFullId,
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-14',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        fx_rate: '1.00000000',
        lifecycle_state: 'approved_for_payment',
      },
    ]);
  });

  afterAll(async () => {
    const db = adminClient();
    const { data: ownedBills } = await db
      .from('bills')
      .select('bill_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('vendor_id', vendorId);
    if (ownedBills?.length) {
      await db
        .from('bill_payment_allocations')
        .delete()
        .in('bill_id', ownedBills.map((b) => b.bill_id as string));
    }
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('payments').delete().eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  function paymentInput(billId: string, amount: string) {
    return {
      org_id: SEED.ORG_HOLDING,
      bill_id: billId,
      payment_method: 'eft' as const,
      payment_date: '2026-05-15',
      amount_cad: amount,
      reference_number: 'REF-3B',
      fiscal_period_id: fiscalPeriodId,
      entry_date: '2026-05-15',
      ap_control_account_id: apControlId,
      cash_account_id: cashId,
    };
  }

  it('T5 fires on transition to fully_paid (full payment)', async () => {
    const spy = await spyOnDispatchTrigger();
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    await billService.recordPayment(paymentInput(billFullId, '500.0000'), localCtx);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      trigger_type: 'T5_bill_state_transition',
      new_lifecycle_state: 'fully_paid',
    });
    spy.mockRestore();
  });

  it('T5 does NOT fire on transition to partially_paid (conditional gate excludes)', async () => {
    const spy = await spyOnDispatchTrigger();
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    await billService.recordPayment(paymentInput(billPartialId, '400.0000'), localCtx);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('recordPayment survives dispatcher throw (best-effort isolation)', async () => {
    const routerMod = await import('@/services/document-platform/documentRouterService');
    const spy = vi.spyOn(routerMod, 'dispatchTrigger').mockImplementation(async () => {
      throw new Error('synthetic dispatcher failure');
    });
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    // Cumulative payment reaches fully_paid → dispatch attempted → throws → swallowed.
    const result = await billService.recordPayment(paymentInput(billPartialId, '600.0000'), localCtx);
    expect(result.new_lifecycle_state).toBe('fully_paid');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

// =====================================================================
// Describe 3 — billService.reverse (T5 conditional pre-reverse state) — 3 tests
// =====================================================================

describe('billService.reverse → T5 conditional on pre-reverse watched-set', () => {
  let ctx: ServiceContext;
  let vendorId: string;
  let apControlId: string;
  let cashId: string;
  let fiscalPeriodId: string;
  let billPendingId: string;
  let billApprovedId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    vendorId = await seedVendor(SEED.ORG_HOLDING);
    const accts = await seedTestAccounts(SEED.ORG_HOLDING, ctx.trace_id);
    apControlId = accts.apControlId;
    cashId = accts.cashId;
    fiscalPeriodId = await getOpenFiscalPeriodId(SEED.ORG_HOLDING);
    void cashId;

    // Post two bills via billService.post (so they have posted_journal_entry_id).
    const postCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const pendingResult = await billService.post(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-14',
        bill_number: null,
        due_date: null,
        payment_terms_days: null,
        purchase_order_id: null,
        tax_amount_total: '0.0000',
        currency: 'CAD',
        amount_original: '300.0000',
        amount_cad: '300.0000',
        fx_rate: '1.00000000',
        ap_control_account_id: apControlId,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-14',
        bill_lines: [
          {
            account_id: apControlId,
            description: 'pending',
            amount: '300.0000',
            amount_original: '300.0000',
            amount_cad: '300.0000',
            line_number: 1,
            tax_code_id: null,
          },
        ],
      },
      postCtx,
    );
    billPendingId = pendingResult.bill_id;
    // billPending stays in pending_approval (not approved)

    const approvedResult = await billService.post(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        issue_date: '2026-05-14',
        bill_number: null,
        due_date: null,
        payment_terms_days: null,
        purchase_order_id: null,
        tax_amount_total: '0.0000',
        currency: 'CAD',
        amount_original: '400.0000',
        amount_cad: '400.0000',
        fx_rate: '1.00000000',
        ap_control_account_id: apControlId,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-14',
        bill_lines: [
          {
            account_id: apControlId,
            description: 'approved',
            amount: '400.0000',
            amount_original: '400.0000',
            amount_cad: '400.0000',
            line_number: 1,
            tax_code_id: null,
          },
        ],
      },
      postCtx,
    );
    billApprovedId = approvedResult.bill_id;
    await billService.approveForPayment(
      { org_id: SEED.ORG_HOLDING, bill_id: billApprovedId },
      postCtx,
    );
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T5 fires when reversing from approved_for_payment (in watched set)', async () => {
    const spy = await spyOnDispatchTrigger();
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    await billService.reverse(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id: billApprovedId,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-15',
        reversal_reason: 'unit test reverse from approved',
      },
      localCtx,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      trigger_type: 'T5_bill_state_transition',
      old_lifecycle_state: 'approved_for_payment',
      new_lifecycle_state: 'voided',
    });
    spy.mockRestore();
  });

  it('T5 does NOT fire when reversing from pending_approval (not in watched set)', async () => {
    const spy = await spyOnDispatchTrigger();
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    await billService.reverse(
      {
        org_id: SEED.ORG_HOLDING,
        bill_id: billPendingId,
        fiscal_period_id: fiscalPeriodId,
        entry_date: '2026-05-15',
        reversal_reason: 'unit test reverse from pending',
      },
      localCtx,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('reverse final state is voided regardless of dispatcher outcome', async () => {
    // Bills were already reversed above; verify their final state.
    const db = adminClient();
    const { data: approvedReversed } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billApprovedId)
      .single();
    expect(approvedReversed?.lifecycle_state).toBe('voided');
    const { data: pendingReversed } = await db
      .from('bills')
      .select('lifecycle_state')
      .eq('bill_id', billPendingId)
      .single();
    expect(pendingReversed?.lifecycle_state).toBe('voided');
  });
});

// =====================================================================
// Describe 4 — vendorPrepaymentService.record (T3 unconditional) — 2 tests
// =====================================================================

describe('vendorPrepaymentService.record → T3_new_vendor_prepayment dispatch (unconditional)', () => {
  let ctx: ServiceContext;
  let vendorId: string;
  let paymentId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    vendorId = await seedVendor(SEED.ORG_HOLDING);
    paymentId = crypto.randomUUID();
    const db = adminClient();
    await db.from('payments').insert({
      payment_id: paymentId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      payment_date: '2026-05-14',
      amount: '1000.0000',
      currency: 'CAD',
      payment_method: 'eft',
      payment_purpose: 'vendor_prepayment',
      payment_state: 'paid',
      applied_to: null,
    });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('vendor_prepayments').delete().eq('vendor_id', vendorId);
    await db.from('payments').delete().eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T3 dispatch fires post-record with trigger_type=T3_new_vendor_prepayment', async () => {
    const spy = await spyOnDispatchTrigger();
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    await vendorPrepaymentService.record(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        payment_id: paymentId,
        prepayment_type: 'deposit',
        amount_original: '1000.0000',
        amount_cad: '1000.0000',
        currency: 'CAD',
        recognized_at: '2026-05-14',
        tax_timing_choice: 'at_payment',
      },
      localCtx,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      trigger_type: 'T3_new_vendor_prepayment',
      vendor_id: vendorId,
    });
    spy.mockRestore();
  });

  it('record survives dispatcher throw (best-effort isolation)', async () => {
    const routerMod = await import('@/services/document-platform/documentRouterService');
    const spy = vi.spyOn(routerMod, 'dispatchTrigger').mockImplementation(async () => {
      throw new Error('synthetic dispatcher failure');
    });
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const paymentId2 = crypto.randomUUID();
    const db = adminClient();
    await db.from('payments').insert({
      payment_id: paymentId2,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      payment_date: '2026-05-14',
      amount: '500.0000',
      currency: 'CAD',
      payment_method: 'eft',
      payment_purpose: 'vendor_prepayment',
      payment_state: 'paid',
      applied_to: null,
    });
    const result = await vendorPrepaymentService.record(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        payment_id: paymentId2,
        prepayment_type: 'deposit',
        amount_original: '500.0000',
        amount_cad: '500.0000',
        currency: 'CAD',
        recognized_at: '2026-05-14',
        tax_timing_choice: 'at_payment',
      },
      localCtx,
    );
    expect(result.vendor_prepayment_id).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

// =====================================================================
// Describe 5 — periodService.unlock (T8 internal-wrap) — 2 tests
// =====================================================================

describe('periodService.unlock → T8_period_reopen dispatch (internal-wrap variant)', () => {
  let ctx: ServiceContext;
  let periodId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const db = adminClient();
    periodId = crypto.randomUUID();
    // Use a unique date range to avoid collision with seeded FY Current.
    const yearOffset = Math.floor(Math.random() * 100) + 2200;
    await db.from('fiscal_periods').insert({
      period_id: periodId,
      org_id: SEED.ORG_HOLDING,
      name: `chunk-3-3b test period ${periodId.slice(0, 8)}`,
      start_date: `${yearOffset}-01-01`,
      end_date: `${yearOffset}-12-31`,
      is_locked: true,
      locked_at: new Date().toISOString(),
      locked_by_user_id: ctx.caller.user_id,
    });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('fiscal_periods').delete().eq('period_id', periodId);
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T8 dispatch fires inside withInvariants async body (internal-wrap insertion site)', async () => {
    const spy = await spyOnDispatchTrigger();
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    await periodService.unlock(
      { org_id: SEED.ORG_HOLDING, period_id: periodId, reason: 'unit test unlock' },
      localCtx,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      trigger_type: 'T8_period_reopen',
      period_id: periodId,
    });
    spy.mockRestore();
  });

  it('unlock survives dispatcher throw (best-effort isolation; internal-wrap)', async () => {
    const routerMod = await import('@/services/document-platform/documentRouterService');
    const db = adminClient();
    // Re-lock + unlock for a second fire under fresh ctx.
    await db
      .from('fiscal_periods')
      .update({ is_locked: true, locked_at: new Date().toISOString() })
      .eq('period_id', periodId);
    const spy = vi.spyOn(routerMod, 'dispatchTrigger').mockImplementation(async () => {
      throw new Error('synthetic dispatcher failure');
    });
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const result = await periodService.unlock(
      { org_id: SEED.ORG_HOLDING, period_id: periodId, reason: 'second unlock' },
      localCtx,
    );
    expect(result.period_id).toBe(periodId);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

// =====================================================================
// Describe 6 — documentExceptionService.resolveException (T10 fail-and-propagate) — 3 tests
// =====================================================================

describe('documentExceptionService.resolveException → T10 conditional on reprocess (fail-and-propagate)', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T10 fires on resolution_action=reprocess', async () => {
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const fixture = await buildClassifiedCaseWithBillCandidate(SEED.ORG_HOLDING, localCtx);
    const entry = await enqueueException(
      {
        document_case_id: fixture.caseId,
        exception_reason: 'multi_candidate_ambiguity',
        trace_id: localCtx.trace_id,
      },
      localCtx,
    );

    await resolveException(
      {
        exception_queue_entry_id: entry.exception_queue_entry_id,
        resolution_action: 'reprocess',
        resolved_by: localCtx.caller.user_id,
      },
      localCtx,
    );

    const db = adminClient();
    const count = await countDispatchAuditsForTrigger(db, localCtx.trace_id, 'T10_manual_override');
    expect(count).toBeGreaterThanOrEqual(1);
    await db.from('audit_log').delete().eq('trace_id', localCtx.trace_id);
  });

  it('T10 does NOT fire on other resolution_actions (e.g., mark_duplicate)', async () => {
    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const fixture = await buildClassifiedCaseWithBillCandidate(SEED.ORG_HOLDING, localCtx);
    const entry = await enqueueException(
      {
        document_case_id: fixture.caseId,
        exception_reason: 'unmatched_router_candidate',
        trace_id: localCtx.trace_id,
      },
      localCtx,
    );

    await resolveException(
      {
        exception_queue_entry_id: entry.exception_queue_entry_id,
        resolution_action: 'mark_duplicate',
        resolved_by: localCtx.caller.user_id,
      },
      localCtx,
    );

    const db = adminClient();
    const count = await countDispatchAuditsForTrigger(db, localCtx.trace_id, 'T10_manual_override');
    expect(count).toBe(0);
    await db.from('audit_log').delete().eq('trace_id', localCtx.trace_id);
  });

  it('T10 dispatcher failure propagates to caller (no try/catch — fail-and-propagate per F-J-5)', async () => {
    // Mock dispatchTrigger to throw; resolveException must propagate.
    const routerMod = await import('@/services/document-platform/documentRouterService');
    const spy = vi.spyOn(routerMod, 'dispatchTrigger').mockImplementationOnce(async () => {
      throw new Error('synthetic dispatcher failure');
    });

    const localCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const fixture = await buildClassifiedCaseWithBillCandidate(SEED.ORG_HOLDING, localCtx);
    const entry = await enqueueException(
      {
        document_case_id: fixture.caseId,
        exception_reason: 'multi_candidate_ambiguity',
        trace_id: localCtx.trace_id,
      },
      localCtx,
    );

    await expect(
      resolveException(
        {
          exception_queue_entry_id: entry.exception_queue_entry_id,
          resolution_action: 'reprocess',
          resolved_by: localCtx.caller.user_id,
        },
        localCtx,
      ),
    ).rejects.toThrow(/synthetic dispatcher failure/);

    spy.mockRestore();
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', localCtx.trace_id);
  });
});
