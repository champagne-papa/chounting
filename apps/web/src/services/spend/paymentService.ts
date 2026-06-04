// src/services/spend/paymentService.ts
//
// Phase 5.1 chunk 5.1b: payment-flow primitive per Sub-Q2 2.β LOCKED
// (partial extraction). paymentService.record() is the payment-flow
// primitive (insert payment row + bill_payment_allocations row +
// compose payment JE + delegate to journalEntryService.post() per
// Reading B); billService.recordPayment retains AP-domain
// orchestration (bill state transitions + lifecycle_state update +
// bill audit + T5 dispatch) unchanged per Sub-Q2 2.β.
//
// paymentService.record() is greenfield-with-no-v1-callers at chunk
// 5.1b ship (no consumer migration per Sub-Q2 2.β; T2 dispatcher
// activation is the chunk 5.1b deliverable). Future consumer chunks
// may refactor billService.recordPayment to delegate to
// paymentService.record() OR introduce direct paymentService.record()
// consumers (e.g., post-v1 vendorCreditService at vendor credit
// application paths).
//
// Mirror pattern: billService.ts (Phase 5 chunk B5-2) +
// vendorPrepaymentService.ts (Phase 5 chunk B5-1). Plain unwrapped
// function exported as service object; route handlers wrap via
// withInvariants(action: 'payment.record') per Pattern B
// INV-SERVICE-001 export contract.
//
// INV-SERVICE-001 export contract (structural): plain unwrapped
// function (Pattern B). Route handlers DO wrap via withInvariants() at
// consumer activation. paymentService.record() at v1 is greenfield-
// with-no-v1-callers per Sub-Q2 2.β; first activation in tests via
// direct call.
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
// INV-AUDIT-001: payment_recorded audit row emitted in same
// (non-atomic) transaction window as payment row INSERT (Phase 6.5
// audit-action-naming codification: underscored convention; single-
// action grain at v1). INSERT audit per recordMutation JSDoc convention
// omits before_state (no prior payment state to capture).
// INV-AUTH-001 inheritance via withInvariants wrap at route handler
// grain when consumer activates.
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): only the
// ledger writer (via journalEntryService.post) inserts into
// journal_entries / journal_lines. paymentService.record() composes
// JE input + delegates.
//
// T2 dispatcher emission: paymentService.record() post-commit fires
// T2_new_payment dispatch trigger per ADR-0018 §item 4 + Framing F
// (chunk 5.1b activates the T2 slot reserved at Phase 4 chunk 3).
// Pattern B external-wrap variant + P3-i F-J-4 best-effort isolation
// (try/catch + log; never propagate dispatcher failure to caller).
//
// Sub-L precondition: v1 single-currency CAD. paymentService.record()
// enforces bill.currency='CAD' at Layer 2 (mirrors billService
// .recordPayment Sub-L gate at billService.ts:582-588).
//
// ServiceErrorCode usage note (mirrors billService precedent):
// generic existing codes (POST_FAILED / READ_FAILED / NOT_FOUND) with
// rich discriminator-bearing message text. PAYMENT_MULTI_CURRENCY
// _NOT_SUPPORTED for Sub-L violations; bill load failures via
// NOT_FOUND catchall. No new ServiceErrorCode at chunk 5.1b per brief
// §3.1 lean.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { dispatchTrigger } from '@/services/document-platform/documentRouterService';
import {
  RecordPaymentInputSchema,
  type RecordPaymentInput,
  type RecordPaymentInputRaw,
} from '@/shared/schemas/spend/recordPayment.schema';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import {
  toMoneyAmount,
  toFxRate,
  zeroMoney,
} from '@/shared/schemas/accounting/money.schema';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Pre-load helpers (ServiceError on error / not-found, parity with
// billService's loadXOrThrow pattern; inlined per Sub-Q2 2.β partial
// extraction posture — billService's helpers are private; intentional
// duplication at v1 substrate-without-consumer grain).
// ---------------------------------------------------------------------

interface BillRow {
  bill_id: string;
  org_id: string;
  vendor_id: string;
  currency: string;
}

async function loadBillOrThrow(
  db: Db,
  org_id: string,
  bill_id: string,
): Promise<BillRow> {
  const { data, error } = await db
    .from('bills')
    .select('bill_id, org_id, vendor_id, currency')
    .eq('bill_id', bill_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('READ_FAILED', `bill lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError('NOT_FOUND', `bill_id=${bill_id} not found in org_id=${org_id}`);
  }
  return data as BillRow;
}

async function loadFiscalPeriodOrThrow(
  db: Db,
  org_id: string,
  fiscal_period_id: string,
): Promise<void> {
  // Defense-in-depth: journalEntryService.post() also validates
  // fiscal_period existence + lock status + entry_date range. This
  // pre-load gives clearer error attribution at the payment grain.
  const { data, error } = await db
    .from('fiscal_periods')
    .select('period_id, org_id')
    .eq('period_id', fiscal_period_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('READ_FAILED', `fiscal_period lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError(
      'NOT_FOUND',
      `fiscal_period_id=${fiscal_period_id} not found in org_id=${org_id}`,
    );
  }
}

async function loadAccountOrThrow(
  db: Db,
  org_id: string,
  account_id: string,
): Promise<void> {
  const { data, error } = await db
    .from('chart_of_accounts')
    .select('account_id')
    .eq('account_id', account_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('READ_FAILED', `chart_of_accounts lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError(
      'NOT_FOUND',
      `account_id=${account_id} not found in chart_of_accounts for org_id=${org_id}`,
    );
  }
}

// ---------------------------------------------------------------------
// paymentService
// ---------------------------------------------------------------------

/**
 * record — payment-flow primitive per Sub-Q2 2.β LOCKED. Inserts payment
 * row + bill_payment_allocations row + composes payment JE + delegates
 * to journalEntryService.post() (Reading B preservation) + emits
 * payment_recorded audit at payment grain + fires T2_new_payment
 * dispatch trigger post-commit (Pattern B external-wrap variant + P3-i
 * F-J-4 best-effort isolation).
 *
 * Diverges from billService.recordPayment by INTENT (Sub-Q2 2.β):
 *   - NO bill state transitions (lifecycle_state untouched).
 *   - NO bills row UPDATE.
 *   - NO INV-AP-002 state-transition precondition (paymentService
 *     accepts any bill state with valid currency).
 *   - NO INV-AP-001 cumulative allocation guard (greenfield primitive;
 *     caller responsible for over-allocation prevention at v1 — no
 *     v1 callers exist per Sub-Q2 2.β).
 *   - NO T5 dispatch (T5 is bill-state-transition trigger; T2 is the
 *     payment-creation trigger that paymentService activates).
 *   - NO bill_payment_recorded audit (paymentService emits
 *     payment_recorded at payment grain).
 *
 * Sub-L precondition (mirrored): bill.currency='CAD'.
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'payment.record'))
async function record(
  input: RecordPaymentInputRaw,
  ctx: ServiceContext,
): Promise<{ payment_id: string; journal_entry_id: string }> {
  let parsed: RecordPaymentInput;
  try {
    parsed = RecordPaymentInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `payment.record validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const bill = await loadBillOrThrow(db, parsed.org_id, parsed.bill_id);

  // Sub-L precondition: v1 single-currency CAD (mirrors
  // billService.recordPayment gate at billService.ts:582-588).
  if (bill.currency !== 'CAD') {
    throw new ServiceError(
      'POST_FAILED',
      `PAYMENT_MULTI_CURRENCY_NOT_SUPPORTED: bill_id=${parsed.bill_id} currency='${bill.currency}'; v1 supports CAD only (Sub-L)`,
    );
  }

  // Defense-in-depth validation of referenced entities.
  await loadFiscalPeriodOrThrow(db, parsed.org_id, parsed.fiscal_period_id);
  await loadAccountOrThrow(db, parsed.org_id, parsed.ap_control_account_id);
  await loadAccountOrThrow(db, parsed.org_id, parsed.cash_account_id);

  // Construct payment JE: Dr ap_control / Cr cash (single-currency CAD
  // per Sub-L). Money helpers canonicalize string shape per
  // INV-MONEY-001 boundary discipline.
  const drLine = {
    account_id: parsed.ap_control_account_id,
    description: `Payment for bill ${parsed.bill_id}`,
    debit_amount: toMoneyAmount(parsed.amount_cad),
    credit_amount: zeroMoney(),
    currency: 'CAD',
    amount_original: toMoneyAmount(parsed.amount_cad),
    amount_cad: toMoneyAmount(parsed.amount_cad),
    fx_rate: toFxRate(1),
    tax_code_id: null,
  };
  const crLine = {
    account_id: parsed.cash_account_id,
    description: `Payment for bill ${parsed.bill_id}`,
    debit_amount: zeroMoney(),
    credit_amount: toMoneyAmount(parsed.amount_cad),
    currency: 'CAD',
    amount_original: toMoneyAmount(parsed.amount_cad),
    amount_cad: toMoneyAmount(parsed.amount_cad),
    fx_rate: toFxRate(1),
    tax_code_id: null,
  };

  // Reading B preserved.
  const { journal_entry_id } = await journalEntryService.post(
    {
      org_id: parsed.org_id,
      fiscal_period_id: parsed.fiscal_period_id,
      entry_date: parsed.entry_date,
      description: `Payment for bill ${parsed.bill_id}`,
      source: 'manual',
      // Wave 6 D3 — optional dedup pass-through (idx_je_source_external);
      // set by the approve→post route (document_case_id), absent otherwise.
      source_external_id: parsed.source_external_id,
      lines: [drLine, crLine],
    },
    ctx,
  );

  // Insert payment row. payment_purpose='bill_payment' +
  // payment_state='paid' per the v1-active subsets in the
  // 20240138000000 migration CHECK constraints.
  const { data: payment, error: payErr } = await db
    .from('payments')
    .insert({
      org_id: parsed.org_id,
      payment_date: parsed.payment_date,
      amount: parsed.amount_cad, // CAD-implicit per Sub-L
      currency: 'CAD',
      payment_method: parsed.payment_method,
      payment_purpose: 'bill_payment',
      payment_state: 'paid',
      vendor_id: bill.vendor_id,
      applied_to: 'bill',
      reference_number: parsed.reference_number,
    })
    .select('payment_id')
    .single();
  if (payErr || !payment) {
    throw new ServiceError(
      'POST_FAILED',
      `payment insert failed: ${payErr?.message ?? 'no data returned'}`,
    );
  }

  // Insert allocation row.
  const { error: allocErr } = await db.from('bill_payment_allocations').insert({
    org_id: parsed.org_id,
    payment_id: payment.payment_id,
    bill_id: parsed.bill_id,
    amount_cad: parsed.amount_cad,
    created_by: ctx.caller.user_id,
    trace_id: ctx.trace_id,
  });
  if (allocErr) {
    throw new ServiceError(
      'POST_FAILED',
      `bill_payment_allocations insert failed: ${allocErr.message}`,
    );
  }

  // INV-AUDIT-001: payment_recorded at payment grain (underscored per
  // Phase 6.5 audit-action-naming codification; single-action grain at
  // v1). INSERT omits before_state per recordMutation JSDoc convention
  // (no prior payment state to capture).
  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'payment_recorded',
    entity_type: 'payment',
    entity_id: payment.payment_id,
  });

  log.info(
    {
      org_id: parsed.org_id,
      payment_id: payment.payment_id,
      bill_id: parsed.bill_id,
      journal_entry_id,
      amount_cad: parsed.amount_cad,
    },
    'Payment recorded',
  );

  // T2_new_payment dispatch per ADR-0018 §item 4 + Framing F.
  // Pattern B external-wrap variant (F-J-11): dispatch hook lands at
  // end of function body after primary writes commit, before return.
  // Best-effort isolation (P3-i F-J-4): try/catch + log on failure;
  // never propagate. Unconditional emission (parity with T1 from
  // billService.post and T3 from vendorPrepaymentService.record).
  try {
    await dispatchTrigger(
      {
        trigger_type: 'T2_new_payment',
        org_id: parsed.org_id,
        payment_id: payment.payment_id,
        vendor_id: bill.vendor_id,
        bill_id: parsed.bill_id,
        trace_id: ctx.trace_id,
      },
      ctx,
    );
  } catch (dispatchErr) {
    log.error(
      {
        err: dispatchErr,
        payment_id: payment.payment_id,
        trigger_type: 'T2_new_payment',
      },
      'T2 dispatch failed post-paymentService.record (best-effort; not propagating)',
    );
  }

  return {
    payment_id: payment.payment_id,
    journal_entry_id,
  };
}

export const paymentService = {
  record,
};
