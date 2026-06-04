// src/services/spend/billService.ts
//
// Phase 5 chunk B5-2 substantive session #1: bill lifecycle mutations.
// Consumes session #1 substrate (bill.schema.ts Zod boundary +
// 20240139000000 migration: bills/bill_lines/payments column extensions
// + bill_payment_allocations table + payment_method enum + Sub-N (b)
// bills.posted_journal_entry_id back-reference).
//
// Mirror pattern: vendorPrepaymentService.ts (chunk B5-1). Plain
// unwrapped functions exported as service object; route handlers wrap
// via withInvariants(action: 'bill.post' | 'bill.approve' |
// 'bill.record_payment' | 'bill.reverse') per Pattern B
// INV-SERVICE-001 export contract.
//
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
// INV-AUDIT-001: each mutation emits a recordMutation row at bill grain
// alongside the entity write. JE-grain audit (journal_entry.post /
// journal_entry.reverse) is emitted by journalEntryService.post via
// the write_journal_entry_atomic RPC. Bill-grain audit emits separately
// via recordMutation per Sub-J (sequential service-layer calls; same
// non-atomicity gap as other non-RPC mutators per addressService /
// vendorPrepaymentService B5-1 precedent).
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2; non-negotiable):
// only the ledger writer (via journalEntryService.post) inserts into
// journal_entries / journal_lines. Three of the four mutations
// (post / recordPayment / reverse) compose JE inputs and delegate;
// approveForPayment is state-only and produces NO JE.
//
// Sub-E ratified mechanism for reverse: journalEntryService has NO
// .reverse() method; reversal goes through .post() with input fields
// reverses_journal_entry_id + reversal_reason. The post() function's
// reversal branch (lines 86-87) detects the reversal-input shape and
// routes through validateReversalMirror (lines 241+) before the RPC.
// validateReversalMirror requires the caller to supply mirror lines
// (Dr ↔ Cr swapped from the original) — it does NOT auto-derive them.
// reverse() therefore loads the original journal_lines, swaps debit ↔
// credit per line, and passes the mirrored lines as input.lines.
//
// Sub-N (b) ratified canonical back-reference: bills.posted_journal_entry_id.
// post() captures the journal_entry_id from journalEntryService.post()
// return and inserts it into the bills row at insert time. reverse()
// reads bills.posted_journal_entry_id directly (no audit_log mining;
// no helper function needed).
//
// Sub-D ratified target state for reverse: 'voided' (canonical 7-state enum).
// Sub-F (i): legacy bills.status text column is LEFT UNTOUCHED — no
// new code reads or writes it. The DEFAULT 'draft' on insert auto-fills.
// Sub-L: payments.amount stays CAD-implicit; service layer enforces
// bill.currency = 'CAD' precondition for recordPayment v1.
//
// INV-AP-001 Layer 2: recordPayment validates that
// sum(existing bill_payment_allocations.amount_cad) + parsed.amount_cad
// <= bill.amount_cad; throws on violation.
// INV-AP-002 Layer 2: each mutation that transitions lifecycle_state
// validates the current state is in the allowed precondition set;
// throws on violation.
// INV-DOC-001 Layer 2 (Phase 5.1 chunk 5.1a): post() requires
// primary_document_id OR override_evidence_completeness=true; otherwise
// throws ServiceError('EVIDENCE_INCOMPLETE'). When primary_document_id
// provided, documentLinkService.create() inserts source_document_links
// row with link_role='primary_invoice' in the same transaction window.
// See ledger_truth_model.md leaf + ADR-0011 §15 reservation graduation.
//
// ServiceErrorCode usage note: this service uses generic existing
// codes (POST_FAILED / READ_FAILED / NOT_FOUND) rather than
// bill-specific codes (e.g. BILL_OVER_ALLOCATION,
// BILL_INVALID_STATE_TRANSITION, BILL_NO_POSTED_JE,
// BILL_MULTI_CURRENCY_NOT_SUPPORTED) — bill-specific codes are not
// members of the closed ServiceErrorCode union in
// src/services/errors/ServiceError.ts. Generic codes with rich
// discriminator-bearing message text mirror the B5-1 vendorPrepayment
// precedent. Adding bill-specific codes is a substrate-shape decision
// surfaced to orchestrator at session #1 close.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { dispatchTrigger } from '@/services/document-platform/documentRouterService';
import { create as createSourceDocumentLink } from '@/services/document-platform/documentLinkService';
import {
  PostBillInputSchema,
  ApproveBillForPaymentInputSchema,
  RecordBillPaymentInputSchema,
  ReverseBillInputSchema,
  type PostBillInput,
  type PostBillInputRaw,
  type ApproveBillForPaymentInput,
  type ApproveBillForPaymentInputRaw,
  type RecordBillPaymentInput,
  type RecordBillPaymentInputRaw,
  type ReverseBillInput,
  type ReverseBillInputRaw,
  type BillLifecycleState,
} from '@/shared/schemas/spend/bill.schema';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import {
  toMoneyAmount,
  toFxRate,
  zeroMoney,
} from '@/shared/schemas/accounting/money.schema';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Pre-load helpers (ServiceError on error / not-found, parity with
// vendorPrepaymentService's loadXOrThrow pattern; B5-1 precedent)
// ---------------------------------------------------------------------

interface BillRow {
  bill_id: string;
  org_id: string;
  vendor_id: string;
  bill_number: string | null;
  currency: string;
  amount_original: string;
  amount_cad: string;
  fx_rate: string;
  lifecycle_state: string;
  posted_journal_entry_id: string | null;
}

async function loadBillOrThrow(
  db: Db,
  org_id: string,
  bill_id: string,
): Promise<BillRow> {
  const { data, error } = await db
    .from('bills')
    .select(
      'bill_id, org_id, vendor_id, bill_number, currency, amount_original, amount_cad, fx_rate, lifecycle_state, posted_journal_entry_id',
    )
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

async function loadVendorOrThrow(
  db: Db,
  org_id: string,
  vendor_id: string,
): Promise<void> {
  const { data, error } = await db
    .from('vendors')
    .select('vendor_id')
    .eq('vendor_id', vendor_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('READ_FAILED', `vendor lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError('NOT_FOUND', `vendor_id=${vendor_id} not found in org_id=${org_id}`);
  }
}

async function loadFiscalPeriodOrThrow(
  db: Db,
  org_id: string,
  fiscal_period_id: string,
): Promise<void> {
  // Note: journalEntryService.post() also validates the fiscal_period
  // exists + is_locked + entry_date in range. This pre-load is
  // defense-in-depth for clearer error attribution at the bill grain
  // (post() would throw POST_FAILED with 'Fiscal period not found';
  // here we throw NOT_FOUND with the bill-grain context).
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

interface OriginalJournalLine {
  account_id: string;
  description: string | null;
  debit_amount: string | number;
  credit_amount: string | number;
  currency: string;
  amount_original: string | number;
  amount_cad: string | number;
  fx_rate: string | number;
  tax_code_id: string | null;
}

async function loadOriginalJournalLines(
  db: Db,
  journal_entry_id: string,
): Promise<OriginalJournalLine[]> {
  const { data, error } = await db
    .from('journal_lines')
    .select(
      'account_id, description, debit_amount, credit_amount, currency, amount_original, amount_cad, fx_rate, tax_code_id',
    )
    .eq('journal_entry_id', journal_entry_id);
  if (error) {
    throw new ServiceError('READ_FAILED', `original journal_lines lookup failed: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new ServiceError(
      'NOT_FOUND',
      `no journal_lines found for journal_entry_id=${journal_entry_id}`,
    );
  }
  return data as OriginalJournalLine[];
}

// ---------------------------------------------------------------------
// billService
// ---------------------------------------------------------------------

/**
 * post — post_bill mutation per Shape (i): inserts bills row +
 * bill_lines rows + posts JE via journalEntryService.post() (Reading B
 * preservation) + sets bills.lifecycle_state = 'pending_approval' +
 * captures posted_journal_entry_id (Sub-N (b)) + emits bill_created
 * audit at bill grain.
 *
 * JE shape: Dr expense (per bill_line.account_id, amount_cad) /
 * Cr ap_control_account_id (aggregate amount_cad). Reading B-preserved
 * via the journalEntryService.post() route — never writes
 * journal_entries / journal_lines directly.
 *
 * Approval gate per D3 = Always Confirm v1: post_bill posts the JE
 * and lands the bill in pending_approval; approveForPayment is the
 * subsequent operator action.
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'bill.post'))
async function post(
  input: PostBillInputRaw,
  ctx: ServiceContext,
): Promise<{ bill_id: string; journal_entry_id: string }> {
  let parsed: PostBillInput;
  try {
    parsed = PostBillInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError('READ_FAILED', `post_bill validation failed: ${err.message}`);
    }
    throw err;
  }

  // INV-DOC-001 Layer 2: bill commit requires primary_document_id OR
  // override_evidence_completeness=true (see ledger_truth_model.md leaf
  // + ADR-0011 §15 reservation graduation). Layer 1 substrate ships at
  // migration 20240138000000:172 (bills.override_evidence_completeness
  // boolean NOT NULL DEFAULT false); Layer 2 enforcement lands here.
  if (!parsed.override_evidence_completeness && !parsed.primary_document_id) {
    throw new ServiceError(
      'EVIDENCE_INCOMPLETE',
      `bill commit requires primary_document_id or override_evidence_completeness=true (INV-DOC-001)`,
    );
  }

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // Pre-load + validate referenced entities exist in org
  await loadVendorOrThrow(db, parsed.org_id, parsed.vendor_id);
  await loadFiscalPeriodOrThrow(db, parsed.org_id, parsed.fiscal_period_id);
  await loadAccountOrThrow(db, parsed.org_id, parsed.ap_control_account_id);
  for (const line of parsed.bill_lines) {
    await loadAccountOrThrow(db, parsed.org_id, line.account_id);
  }

  // Construct JE lines (Dr expense per bill_line; Cr ap_control aggregated).
  // money helpers (toMoneyAmount / toFxRate / zeroMoney) canonicalize
  // string shape per INV-MONEY-001 boundary discipline.
  const drLines = parsed.bill_lines.map((line) => ({
    account_id: line.account_id,
    description: line.description,
    debit_amount: toMoneyAmount(line.amount_cad),
    credit_amount: zeroMoney(),
    currency: parsed.currency,
    amount_original: toMoneyAmount(line.amount_original),
    amount_cad: toMoneyAmount(line.amount_cad),
    fx_rate: toFxRate(parsed.fx_rate),
    tax_code_id: line.tax_code_id,
  }));
  const crLine = {
    account_id: parsed.ap_control_account_id,
    description: `Bill ${parsed.bill_number ?? '(no number)'} from vendor ${parsed.vendor_id}`,
    debit_amount: zeroMoney(),
    credit_amount: toMoneyAmount(parsed.amount_cad),
    currency: parsed.currency,
    amount_original: toMoneyAmount(parsed.amount_original),
    amount_cad: toMoneyAmount(parsed.amount_cad),
    fx_rate: toFxRate(parsed.fx_rate),
    tax_code_id: null,
  };

  // Reading B preserved: journalEntryService.post() is the sole writer
  // of journal_entries / journal_lines.
  const { journal_entry_id } = await journalEntryService.post(
    {
      org_id: parsed.org_id,
      fiscal_period_id: parsed.fiscal_period_id,
      entry_date: parsed.entry_date,
      description: `Bill posting: ${parsed.bill_number ?? parsed.vendor_id}`,
      source: 'manual',
      // Wave 6 D3 — optional dedup pass-through (idx_je_source_external);
      // set by the approve→post route (document_case_id), absent otherwise.
      source_external_id: parsed.source_external_id,
      lines: [...drLines, crLine],
    },
    ctx,
  );

  // Insert bill row. Sub-N (b): posted_journal_entry_id captures the
  // JE id from the post() return for later reverse_bill lookup.
  // Sub-F (i): legacy `status` column auto-defaults to 'draft' via
  // column DEFAULT — not set explicitly here.
  const { data: insertedBill, error: billErr } = await db
    .from('bills')
    .insert({
      org_id: parsed.org_id,
      vendor_id: parsed.vendor_id,
      bill_number: parsed.bill_number,
      issue_date: parsed.issue_date,
      due_date: parsed.due_date,
      payment_terms_days: parsed.payment_terms_days,
      purchase_order_id: parsed.purchase_order_id,
      currency: parsed.currency,
      amount_original: parsed.amount_original,
      amount_cad: parsed.amount_cad,
      fx_rate: parsed.fx_rate,
      tax_amount_total: parsed.tax_amount_total,
      lifecycle_state: 'pending_approval', // Shape (i)
      posted_journal_entry_id: journal_entry_id, // Sub-N (b)
      // INV-DOC-001 Phase 5.1 chunk 5.1a: override flag persisted at Layer 1
      // substrate (migration 20240138000000:172). Defaults to false at Zod
      // boundary mirroring Layer 1 NOT NULL DEFAULT.
      override_evidence_completeness: parsed.override_evidence_completeness,
    })
    .select('bill_id')
    .single();
  if (billErr || !insertedBill) {
    throw new ServiceError(
      'POST_FAILED',
      `bill insert failed: ${billErr?.message ?? 'no data returned'}`,
    );
  }

  const billLinesRows = parsed.bill_lines.map((line) => ({
    bill_id: insertedBill.bill_id,
    account_id: line.account_id,
    description: line.description,
    amount: line.amount,
    amount_original: line.amount_original,
    amount_cad: line.amount_cad,
    tax_code_id: line.tax_code_id,
    line_number: line.line_number,
  }));
  const { error: linesErr } = await db.from('bill_lines').insert(billLinesRows);
  if (linesErr) {
    throw new ServiceError('POST_FAILED', `bill_lines insert failed: ${linesErr.message}`);
  }

  // INV-DOC-001 Layer 2 atomic primary attachment: if primary_document_id
  // provided, insert source_document_links row in same transaction window
  // per ADR-0016 §6 (documentLinkService.create() is the canonical
  // attachment-creation surface) + ADR-0011 §15 (canonical primary_invoice
  // link_role for AP-domain bills per ADR-0016 §2:379).
  if (parsed.primary_document_id) {
    await createSourceDocumentLink(
      {
        source_document_id: parsed.primary_document_id,
        linked_entity_type: 'bill',
        linked_entity_id: insertedBill.bill_id,
        link_role: 'primary_invoice',
      },
      ctx,
    );
  }

  // Bill-grain audit emission (Sub-J: sequential per B5-1 precedent;
  // JE-grain audit was emitted atomically by journalEntryService.post).
  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_created',
    entity_type: 'bill',
    entity_id: insertedBill.bill_id,
  });

  log.info(
    {
      org_id: parsed.org_id,
      bill_id: insertedBill.bill_id,
      journal_entry_id,
      vendor_id: parsed.vendor_id,
    },
    'Bill posted',
  );

  // T1_new_bill dispatch per ADR-0018 §item 4 + Framing F.
  // Pattern B external-wrap variant (F-J-11): dispatch hook lands at
  // end of function body after primary writes commit, before return.
  // Best-effort isolation (P3-i F-J-4): try/catch + log on failure;
  // never propagate to caller — bill post succeeds regardless of
  // dispatcher outcome. Unconditional emission.
  try {
    await dispatchTrigger(
      {
        trigger_type: 'T1_new_bill',
        org_id: parsed.org_id,
        bill_id: insertedBill.bill_id,
        vendor_id: parsed.vendor_id,
        trace_id: ctx.trace_id,
      },
      ctx,
    );
  } catch (dispatchErr) {
    log.error(
      { err: dispatchErr, bill_id: insertedBill.bill_id, trigger_type: 'T1_new_bill' },
      'T1 dispatch failed post-bill-post (best-effort; not propagating)',
    );
  }

  return { bill_id: insertedBill.bill_id, journal_entry_id };
}

/**
 * approveForPayment — approve_bill_for_payment mutation. State-only
 * transition: pending_approval → approved_for_payment. INV-AP-002
 * Layer 2: precondition lifecycle_state === 'pending_approval'.
 * Produces NO journal entry (Reading B preservation: state-only
 * mutations do not call journalEntryService).
 *
 * Audit event: bill_approved_for_payment (bill grain).
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'bill.approve'))
async function approveForPayment(
  input: ApproveBillForPaymentInputRaw,
  ctx: ServiceContext,
): Promise<{ bill_id: string }> {
  let parsed: ApproveBillForPaymentInput;
  try {
    parsed = ApproveBillForPaymentInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `approve_bill_for_payment validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const bill = await loadBillOrThrow(db, parsed.org_id, parsed.bill_id);

  // INV-AP-002 Layer 2: state-transition path enforcement.
  if (bill.lifecycle_state !== 'pending_approval') {
    throw new ServiceError(
      'POST_FAILED',
      `BILL_INVALID_STATE_TRANSITION: cannot approve_for_payment: bill_id=${parsed.bill_id} lifecycle_state='${bill.lifecycle_state}'; expected 'pending_approval'`,
    );
  }

  const before = { lifecycle_state: bill.lifecycle_state };

  const { error } = await db
    .from('bills')
    .update({ lifecycle_state: 'approved_for_payment' })
    .eq('bill_id', parsed.bill_id)
    .eq('org_id', parsed.org_id);
  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `bill lifecycle_state update failed: ${error.message}`,
    );
  }

  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_approved_for_payment',
    entity_type: 'bill',
    entity_id: parsed.bill_id,
    before_state: before,
  });

  log.info(
    {
      org_id: parsed.org_id,
      bill_id: parsed.bill_id,
      from_state: before.lifecycle_state,
      to_state: 'approved_for_payment',
    },
    'Bill approved for payment',
  );

  return { bill_id: parsed.bill_id };
}

/**
 * recordPayment — record_bill_payment mutation. Creates payment row
 * + bill_payment_allocations row + posts payment JE via
 * journalEntryService.post() (Dr ap_control / Cr cash) + updates
 * bills.lifecycle_state to 'partially_paid' or 'fully_paid' based on
 * cumulative allocation sum vs bill.amount_cad.
 *
 * INV-AP-001 Layer 2: sum(existing allocations) + new amount_cad must
 * be <= bill.amount_cad.
 * INV-AP-002 Layer 2: precondition bill.lifecycle_state in
 * {'approved_for_payment', 'partially_paid'}.
 * Sub-L: precondition bill.currency === 'CAD' (v1 single-currency).
 *
 * Audit event: bill_payment_recorded (bill grain). JE-grain audit
 * emitted atomically by journalEntryService.post.
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'bill.record_payment'))
async function recordPayment(
  input: RecordBillPaymentInputRaw,
  ctx: ServiceContext,
): Promise<{
  payment_id: string;
  bill_id: string;
  journal_entry_id: string;
  new_lifecycle_state: BillLifecycleState;
}> {
  let parsed: RecordBillPaymentInput;
  try {
    parsed = RecordBillPaymentInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `record_bill_payment validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const bill = await loadBillOrThrow(db, parsed.org_id, parsed.bill_id);

  // Sub-L precondition: v1 single-currency.
  if (bill.currency !== 'CAD') {
    throw new ServiceError(
      'POST_FAILED',
      `BILL_MULTI_CURRENCY_NOT_SUPPORTED: bill_id=${parsed.bill_id} currency='${bill.currency}'; v1 supports CAD only (Sub-L)`,
    );
  }

  // INV-AP-002 Layer 2: state-transition path enforcement.
  const allowedStates = new Set<string>(['approved_for_payment', 'partially_paid']);
  if (!allowedStates.has(bill.lifecycle_state)) {
    throw new ServiceError(
      'POST_FAILED',
      `BILL_INVALID_STATE_TRANSITION: cannot record_bill_payment: bill_id=${parsed.bill_id} lifecycle_state='${bill.lifecycle_state}'; expected one of ${Array.from(allowedStates).join(', ')}`,
    );
  }

  // Validate referenced fiscal_period + accounts exist in org (defense-in-depth).
  await loadFiscalPeriodOrThrow(db, parsed.org_id, parsed.fiscal_period_id);
  await loadAccountOrThrow(db, parsed.org_id, parsed.ap_control_account_id);
  await loadAccountOrThrow(db, parsed.org_id, parsed.cash_account_id);

  // INV-AP-001 Layer 2: existing allocations + new amount must not
  // exceed bill.amount_cad. Decimal-safe via toMoneyAmount + Number()
  // is acceptable here for sum comparison (range bounded by
  // numeric(20,4); IEEE 754 precision sufficient up to 2^53);
  // production-grade arithmetic uses addMoney for exact equality.
  const { data: existingAllocs, error: allocReadErr } = await db
    .from('bill_payment_allocations')
    .select('amount_cad')
    .eq('bill_id', parsed.bill_id)
    .eq('org_id', parsed.org_id);
  if (allocReadErr) {
    throw new ServiceError(
      'READ_FAILED',
      `bill_payment_allocations lookup failed: ${allocReadErr.message}`,
    );
  }
  const existingSum = (existingAllocs ?? []).reduce(
    (s: number, a: { amount_cad: string | number }) => s + Number(a.amount_cad),
    0,
  );
  const newAmount = Number(parsed.amount_cad);
  const newSum = existingSum + newAmount;
  const billAmount = Number(bill.amount_cad);
  if (newSum > billAmount) {
    throw new ServiceError(
      'POST_FAILED',
      `BILL_OVER_ALLOCATION: bill_id=${parsed.bill_id} cumulative allocation (${newSum.toFixed(4)}) exceeds bill.amount_cad (${billAmount.toFixed(4)}); existing=${existingSum.toFixed(4)}, new=${newAmount.toFixed(4)}`,
    );
  }

  // Construct payment JE: Dr ap_control / Cr cash (single-currency CAD per Sub-L).
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
      description: `Bill payment for ${parsed.bill_id}`,
      source: 'manual',
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

  // Compute new lifecycle_state per cumulative allocation sum.
  const newState: BillLifecycleState =
    newSum >= billAmount ? 'fully_paid' : 'partially_paid';
  const before = { lifecycle_state: bill.lifecycle_state };

  const { error: stateErr } = await db
    .from('bills')
    .update({ lifecycle_state: newState })
    .eq('bill_id', parsed.bill_id)
    .eq('org_id', parsed.org_id);
  if (stateErr) {
    throw new ServiceError(
      'POST_FAILED',
      `bill lifecycle_state update failed: ${stateErr.message}`,
    );
  }

  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_payment_recorded',
    entity_type: 'bill',
    entity_id: parsed.bill_id,
    before_state: before,
  });

  log.info(
    {
      org_id: parsed.org_id,
      bill_id: parsed.bill_id,
      payment_id: payment.payment_id,
      journal_entry_id,
      from_state: before.lifecycle_state,
      to_state: newState,
      amount_cad: parsed.amount_cad,
    },
    'Bill payment recorded',
  );

  // T5_bill_state_transition dispatch per ADR-0018 §item 4 + Round 6
  // Finding B per-method conditional gating (F-J-12): fires ONLY when
  // transition produces 'fully_paid' (leaves watched set
  // ('approved_for_payment', 'partially_paid')). Transitions to
  // 'partially_paid' stay in watched set and do not fire T5.
  // Pattern B external-wrap variant + P3-i best-effort isolation.
  if (newState === 'fully_paid') {
    try {
      await dispatchTrigger(
        {
          trigger_type: 'T5_bill_state_transition',
          org_id: parsed.org_id,
          bill_id: parsed.bill_id,
          old_lifecycle_state: before.lifecycle_state as 'approved_for_payment' | 'partially_paid',
          new_lifecycle_state: 'fully_paid',
          trace_id: ctx.trace_id,
        },
        ctx,
      );
    } catch (dispatchErr) {
      log.error(
        { err: dispatchErr, bill_id: parsed.bill_id, trigger_type: 'T5_bill_state_transition' },
        'T5 dispatch failed post-recordPayment (best-effort; not propagating)',
      );
    }
  }

  return {
    payment_id: payment.payment_id,
    bill_id: parsed.bill_id,
    journal_entry_id,
    new_lifecycle_state: newState,
  };
}

/**
 * reverse — reverse_bill mutation per D4 + Sub-E + Sub-D +
 * Integrations 1+2. Thin wrapper that calls journalEntryService.post()
 * with the reversal-input shape: reverses_journal_entry_id (= the
 * bill's posted_journal_entry_id per Sub-N (b) canonical
 * back-reference) + reversal_reason (caller-provided per
 * INV-REVERSAL-002).
 *
 * journalEntryService has NO .reverse() method per Sub-E ratified
 * mechanism; reversal is dispatched through .post() whose reversal
 * branch detects the reverses_journal_entry_id input field and
 * routes through validateReversalMirror before the RPC. The mirror
 * validator REQUIRES the caller to supply mirror lines (Dr ↔ Cr
 * swapped from the original) — this function loads the original
 * journal_lines via loadOriginalJournalLines and constructs the
 * mirrored lines explicitly.
 *
 * Operation-order atomicity per Integration 2: the bills.lifecycle_state
 * update fires AFTER post() succeeds; if post() throws, the bill
 * remains in its original state and the reversal can be retried.
 *
 * INV-AP-002 Layer 2 precondition (Integration 3 refined): bill
 * lifecycle_state must be in {'pending_approval', 'approved_for_payment',
 * 'partially_paid', 'fully_paid'}. 'draft' bills have no JE to reverse;
 * 'voided' / 'cancelled' bills are already terminal.
 *
 * Sub-D: target state on success = 'voided' (canonical 7-state enum).
 *
 * Audit event: bill_reversed at bill grain (carries reversal_reason).
 * journal_entry.reverse audit at JE grain emitted by
 * journalEntryService.post via the RPC.
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'bill.reverse'))
async function reverse(
  input: ReverseBillInputRaw,
  ctx: ServiceContext,
): Promise<{ bill_id: string; reversal_journal_entry_id: string }> {
  let parsed: ReverseBillInput;
  try {
    parsed = ReverseBillInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError('READ_FAILED', `reverse_bill validation failed: ${err.message}`);
    }
    throw err;
  }

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const bill = await loadBillOrThrow(db, parsed.org_id, parsed.bill_id);

  // INV-AP-002 Layer 2 precondition (Integration 3 refined):
  // 4-state reversal precondition.
  const allowedStates = new Set<string>([
    'pending_approval',
    'approved_for_payment',
    'partially_paid',
    'fully_paid',
  ]);
  if (!allowedStates.has(bill.lifecycle_state)) {
    throw new ServiceError(
      'POST_FAILED',
      `BILL_INVALID_STATE_TRANSITION: cannot reverse_bill: bill_id=${parsed.bill_id} lifecycle_state='${bill.lifecycle_state}'; reversal requires one of ${Array.from(allowedStates).join(', ')}`,
    );
  }

  // Sub-N (b) canonical back-reference lookup.
  if (!bill.posted_journal_entry_id) {
    throw new ServiceError(
      'POST_FAILED',
      `BILL_NO_POSTED_JE: cannot reverse bill_id=${parsed.bill_id}: posted_journal_entry_id is null (bill never posted, or substrate gap)`,
    );
  }
  const originalJournalEntryId = bill.posted_journal_entry_id;

  // Load original JE lines + construct mirror (Dr ↔ Cr swapped, all
  // other fields preserved) per INV-REVERSAL-001 mirror semantics
  // enforced by validateReversalMirror.
  await loadFiscalPeriodOrThrow(db, parsed.org_id, parsed.fiscal_period_id);
  const originalLines = await loadOriginalJournalLines(db, originalJournalEntryId);
  const mirrorLines = originalLines.map((line) => ({
    account_id: line.account_id,
    description: line.description ?? undefined,
    // Swap Dr ↔ Cr; canonicalize via toMoneyAmount.
    debit_amount: toMoneyAmount(line.credit_amount),
    credit_amount: toMoneyAmount(line.debit_amount),
    currency: line.currency,
    amount_original: toMoneyAmount(line.amount_original),
    amount_cad: toMoneyAmount(line.amount_cad),
    fx_rate: toFxRate(line.fx_rate),
    tax_code_id: line.tax_code_id,
  }));

  // Reading B preserved: reversal goes through journalEntryService.post()
  // with the reversal-input shape per Sub-E (no .reverse() method).
  const { journal_entry_id: reversalJournalEntryId } = await journalEntryService.post(
    {
      org_id: parsed.org_id,
      fiscal_period_id: parsed.fiscal_period_id,
      entry_date: parsed.entry_date,
      description: `Bill reversal: ${parsed.bill_id} (${parsed.reversal_reason})`,
      source: 'manual',
      reverses_journal_entry_id: originalJournalEntryId,
      reversal_reason: parsed.reversal_reason,
      lines: mirrorLines,
    },
    ctx,
  );

  // Per Integration 2: state update fires AFTER post() succeeds.
  // Sub-D: target state = 'voided'.
  const before = { lifecycle_state: bill.lifecycle_state };
  const { error: stateErr } = await db
    .from('bills')
    .update({ lifecycle_state: 'voided' })
    .eq('bill_id', parsed.bill_id)
    .eq('org_id', parsed.org_id);
  if (stateErr) {
    throw new ServiceError(
      'POST_FAILED',
      `bill lifecycle_state update to 'voided' failed: ${stateErr.message}`,
    );
  }

  // Bill-grain audit per D4. JE-grain audit (journal_entry.reverse)
  // is emitted atomically by journalEntryService.post via the RPC.
  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'bill_reversed',
    entity_type: 'bill',
    entity_id: parsed.bill_id,
    before_state: before,
    reason: parsed.reversal_reason,
  });

  log.info(
    {
      org_id: parsed.org_id,
      bill_id: parsed.bill_id,
      original_journal_entry_id: originalJournalEntryId,
      reversal_journal_entry_id: reversalJournalEntryId,
      from_state: before.lifecycle_state,
      to_state: 'voided',
    },
    'Bill reversed',
  );

  // T5_bill_state_transition dispatch per ADR-0018 §item 4 + Round 6
  // Finding B per-method conditional gating (F-J-12): fires ONLY when
  // pre-reverse bill.lifecycle_state IS in watched set
  // ('approved_for_payment', 'partially_paid'). Reversals from
  // 'pending_approval' or 'fully_paid' don't fire (those bills weren't
  // in the watched set; their reversal doesn't invalidate router
  // candidates pointing at them). Pattern B external-wrap variant +
  // P3-i best-effort isolation.
  if (
    before.lifecycle_state === 'approved_for_payment' ||
    before.lifecycle_state === 'partially_paid'
  ) {
    try {
      await dispatchTrigger(
        {
          trigger_type: 'T5_bill_state_transition',
          org_id: parsed.org_id,
          bill_id: parsed.bill_id,
          old_lifecycle_state: before.lifecycle_state,
          new_lifecycle_state: 'voided',
          trace_id: ctx.trace_id,
        },
        ctx,
      );
    } catch (dispatchErr) {
      log.error(
        { err: dispatchErr, bill_id: parsed.bill_id, trigger_type: 'T5_bill_state_transition' },
        'T5 dispatch failed post-reverse (best-effort; not propagating)',
      );
    }
  }

  return {
    bill_id: parsed.bill_id,
    reversal_journal_entry_id: reversalJournalEntryId,
  };
}

// ---------------------------------------------------------------------
// Service object export (Pattern B: route handlers wrap each method
// via withInvariants(action: 'bill.<verb>') at call site)
// ---------------------------------------------------------------------

export const billService = {
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
  // withInvariants(action: 'bill.post' | 'bill.approve' |
  // 'bill.record_payment' | 'bill.reverse'))
  post,
  approveForPayment,
  recordPayment,
  reverse,
};
