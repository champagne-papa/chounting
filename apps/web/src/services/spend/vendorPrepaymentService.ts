// src/services/spend/vendorPrepaymentService.ts
//
// Phase 5 chunk B5-1 substantive session #2: vendor prepayment mutations.
// Consumes session #1 substrate (Zod schemas + status function +
// vendor_prepayments / vendor_prepayment_applications tables + closed enums).
//
// INV-SERVICE-001 export contract (structural): plain unwrapped functions
// (Pattern B per addressService); mutating functions wrapped at the call
// site via withInvariants() with vendor-prepayment-specific ActionName.
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
// INV-AUDIT-001: each mutation emits a recordMutation row alongside the
// entity write. Non-ledger writes carry the same atomicity gap as other
// non-RPC mutators (addressService, etc.); ledger writes route through
// journalEntryService.post which IS atomic via write_journal_entry_atomic.
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): only the ledger
// writer (via journalEntryService.post) inserts into journal_entries /
// journal_lines. The apply mutation composes a JE input and delegates to
// journalEntryService.post; record + refund do NOT post JEs (the
// corresponding cash-movement JEs were posted at payment-row-creation
// time by upstream payment-creation flows that are out of session #2 scope).
//
// Q-closure citations from ADR-0015 (open_questions.md):
//   Q59 — vendor_prepayment object shape (closed)
//   Q61 — approval-gate bifurcation (closed; service-layer-only discriminator
//          surfaced as policy_evaluation.required_action; the route handler
//          translates that into the appropriate ActionName for withInvariants)
//   Q62 — deposit/retainer tax timing 3-layer rule (closed; resolved at
//          higher orchestration)
//   Q63 — vendor balance view composition (closed; computeVendorPrepaymentStatus)
//   Q78 — payment failure lifecycle (closed; refund follows proposal-and-confirm)
//
// Path-discriminator audit events (vendor_prepayment_authorized_future_cash +
// vendor_prepayment_classified_after_the_fact per ADR-0015 §11) fire at the
// ORCHESTRATION grain that owns the proposal/reversal flow, not at this
// mutation's entity-creation grain. record_vendor_prepayment emits only the
// generic vendor_prepayment_created event; the orchestrator emits the
// path-specific event in the same trace_id.
//
// D4-α refund precondition: refund mutation rejects if any
// vendor_prepayment_applications rows exist for the parent prepayment.
// ADR-0015 §6 is silent on refund-with-applications interaction; the
// conservative posture (block; require user to reverse applications first)
// is logged as an open question at docs/02_specs/open_questions.md.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { dispatchTrigger } from '@/services/document-platform/documentRouterService';
import {
  RecordVendorPrepaymentInputSchema,
  ApplyVendorPrepaymentToBillInputSchema,
  RecordVendorPrepaymentRefundInputSchema,
  type RecordVendorPrepaymentInput,
  type RecordVendorPrepaymentInputRaw,
  type ApplyVendorPrepaymentToBillInput,
  type ApplyVendorPrepaymentToBillInputRaw,
  type RecordVendorPrepaymentRefundInput,
  type RecordVendorPrepaymentRefundInputRaw,
  type VendorPrepaymentStatus,
} from '@/shared/schemas/spend/vendorPrepayment.schema';
import { computeVendorPrepaymentStatus } from '@/services/spend/vendorPrepaymentStatus';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { toMoneyAmount, toFxRate, zeroMoney } from '@/shared/schemas/accounting/money.schema';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Pre-load helpers (ServiceError on error / not-found, parity with
// addressService's loadAddressOrThrow)
// ---------------------------------------------------------------------

async function loadPaymentOrThrow(
  db: Db,
  org_id: string,
  payment_id: string,
): Promise<{
  payment_id: string;
  org_id: string;
  payment_purpose: string;
  payment_state: string;
  amount: string;
  currency: string;
}> {
  const { data, error } = await db
    .from('payments')
    .select('payment_id, org_id, payment_purpose, payment_state, amount, currency')
    .eq('payment_id', payment_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('READ_FAILED', `payment lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError('NOT_FOUND', `payment_id=${payment_id} not found in org_id=${org_id}`);
  }
  return data as {
    payment_id: string;
    org_id: string;
    payment_purpose: string;
    payment_state: string;
    amount: string;
    currency: string;
  };
}

async function loadVendorOrThrow(db: Db, org_id: string, vendor_id: string): Promise<void> {
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

async function loadVendorPrepaymentOrThrow(
  db: Db,
  org_id: string,
  vp_id: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await db
    .from('vendor_prepayments')
    .select('*')
    .eq('id', vp_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('READ_FAILED', `vendor_prepayment lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError('NOT_FOUND', `vendor_prepayment id=${vp_id} not found in org_id=${org_id}`);
  }
  return data as Record<string, unknown>;
}

async function loadBillOrThrow(
  db: Db,
  org_id: string,
  bill_id: string,
): Promise<{ bill_id: string; org_id: string; lifecycle_state: string }> {
  const { data, error } = await db
    .from('bills')
    .select('bill_id, org_id, lifecycle_state')
    .eq('bill_id', bill_id)
    .eq('org_id', org_id)
    .maybeSingle();
  if (error) {
    throw new ServiceError('READ_FAILED', `bill lookup failed: ${error.message}`);
  }
  if (!data) {
    throw new ServiceError('NOT_FOUND', `bill_id=${bill_id} not found in org_id=${org_id}`);
  }
  return data as { bill_id: string; org_id: string; lifecycle_state: string };
}

async function loadApplications(
  db: Db,
  vp_id: string,
): Promise<Array<{ id: string; amount_original: string }>> {
  const { data, error } = await db
    .from('vendor_prepayment_applications')
    .select('id, amount_original')
    .eq('vendor_prepayment_id', vp_id);
  if (error) {
    throw new ServiceError('READ_FAILED', `applications lookup failed: ${error.message}`);
  }
  return (data ?? []) as Array<{ id: string; amount_original: string }>;
}

// ---------------------------------------------------------------------
// vendorPrepaymentService
// ---------------------------------------------------------------------

export const vendorPrepaymentService = {
  /**
   * record_vendor_prepayment — creates a vendor_prepayments row that
   * classifies an existing payments row as a vendor prepayment.
   *
   * Preconditions enforced at service layer:
   *   - The referenced payments row exists in the same org.
   *   - payments.payment_purpose === 'vendor_prepayment' (Q59 closure).
   *     payment_purpose is immutable post-insert (Layer 1 trigger);
   *     reclassification of a non-vendor_prepayment payment requires
   *     reversing that payment and recording a new one with the
   *     corrected purpose at higher orchestration.
   *   - The referenced vendor exists in the same org.
   *
   * Status is set to 'open' at insert; subsequent applications and
   * refunds drive transitions per computeVendorPrepaymentStatus.
   *
   * Audit event: vendor_prepayment_created. Path-discriminator events
   * (authorized_future_cash | classified_after_the_fact) fire at higher
   * orchestration — see file header.
   */
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'vendor_prepayment.record'))
  async record(
    input: RecordVendorPrepaymentInputRaw,
    ctx: ServiceContext,
  ): Promise<{ vendor_prepayment_id: string; status: VendorPrepaymentStatus }> {
    let parsed: RecordVendorPrepaymentInput;
    try {
      parsed = RecordVendorPrepaymentInputSchema.parse(input);
    } catch (err) {
      if (err instanceof Error) {
        throw new ServiceError('READ_FAILED', `record_vendor_prepayment validation failed: ${err.message}`);
      }
      throw err;
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const payment = await loadPaymentOrThrow(db, parsed.org_id, parsed.payment_id);
    if (payment.payment_purpose !== 'vendor_prepayment') {
      throw new ServiceError(
        'POST_FAILED',
        `payment_id=${parsed.payment_id} has payment_purpose=${payment.payment_purpose}; expected 'vendor_prepayment' (ADR-0015 §1 / Q59 closure)`,
      );
    }

    await loadVendorOrThrow(db, parsed.org_id, parsed.vendor_id);

    const insertRow = {
      org_id: parsed.org_id,
      legal_entity_id: parsed.legal_entity_id ?? null,
      vendor_id: parsed.vendor_id,
      prepayment_type: parsed.prepayment_type,
      status: 'open' as const,
      payment_id: parsed.payment_id,
      amount_original: parsed.amount_original,
      amount_cad: parsed.amount_cad,
      fx_rate: parsed.fx_rate ?? null,
      currency: parsed.currency,
      recognized_at: parsed.recognized_at,
      expected_application_date: parsed.expected_application_date ?? null,
      tax_timing_choice: parsed.tax_timing_choice,
      tax_amount_at_payment: parsed.tax_amount_at_payment ?? null,
      description: parsed.description ?? null,
      created_by: ctx.caller.user_id,
      trace_id: ctx.trace_id,
    };

    const { data: inserted, error } = await db
      .from('vendor_prepayments')
      .insert(insertRow)
      .select('id')
      .single();

    if (error || !inserted) {
      throw new ServiceError('POST_FAILED', error?.message ?? 'vendor_prepayment insert failed');
    }

    await recordMutation(db, ctx, {
      org_id: parsed.org_id,
      action: 'vendor_prepayment_created',
      entity_type: 'vendor_prepayment',
      entity_id: (inserted as { id: string }).id,
    });

    log.info(
      {
        org_id: parsed.org_id,
        vendor_prepayment_id: (inserted as { id: string }).id,
        payment_id: parsed.payment_id,
        amount_original: parsed.amount_original,
      },
      'Vendor prepayment recorded',
    );

    // T3_new_vendor_prepayment dispatch per ADR-0018 §item 4 +
    // Framing F. Pattern B external-wrap variant (F-J-11): dispatch
    // hook lands at end of function body after primary writes commit,
    // before return. Best-effort isolation (P3-i F-J-4): try/catch +
    // log on failure; never propagate. Unconditional emission.
    try {
      await dispatchTrigger(
        {
          trigger_type: 'T3_new_vendor_prepayment',
          org_id: parsed.org_id,
          vendor_prepayment_id: (inserted as { id: string }).id,
          vendor_id: parsed.vendor_id,
          trace_id: ctx.trace_id,
        },
        ctx,
      );
    } catch (dispatchErr) {
      log.error(
        {
          err: dispatchErr,
          vendor_prepayment_id: (inserted as { id: string }).id,
          trigger_type: 'T3_new_vendor_prepayment',
        },
        'T3 dispatch failed post-vendorPrepayment-record (best-effort; not propagating)',
      );
    }

    return {
      vendor_prepayment_id: (inserted as { id: string }).id,
      status: 'open',
    };
  },

  /**
   * apply_vendor_prepayment_to_bill — applies (part of) a vendor
   * prepayment's open balance against an outstanding bill, posting a
   * journal entry that debits the AP control account and credits the
   * vendor prepayment asset account.
   *
   * Preconditions:
   *   - vendor_prepayment exists in same org with status in
   *     {open, partially_applied} (refunded / fully_applied are terminal).
   *   - bill exists in same org with lifecycle_state in {draft,
   *     pending_approval, approved_for_payment, partially_paid}.
   *   - amount_original <= remaining open balance.
   *
   * Posts a JE via journalEntryService.post (Reading B preservation —
   * never write journal_entries / journal_lines directly). Inserts a
   * vendor_prepayment_applications row, recomputes status, and updates
   * vendor_prepayments.status if it has changed.
   *
   * Audit event: vendor_prepayment.apply (entity-grain, in addition to
   * the journal_entry.post audit emitted by journalEntryService.post).
   */
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'vendor_prepayment.apply'))
  async apply(
    input: ApplyVendorPrepaymentToBillInputRaw,
    ctx: ServiceContext,
  ): Promise<{
    application_id: string;
    journal_entry_id: string;
    new_status: VendorPrepaymentStatus;
  }> {
    let parsed: ApplyVendorPrepaymentToBillInput;
    try {
      parsed = ApplyVendorPrepaymentToBillInputSchema.parse(input);
    } catch (err) {
      if (err instanceof Error) {
        throw new ServiceError('READ_FAILED', `apply_vendor_prepayment_to_bill validation failed: ${err.message}`);
      }
      throw err;
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const vp = await loadVendorPrepaymentOrThrow(db, parsed.org_id, parsed.vendor_prepayment_id);
    const vpStatus = vp.status as VendorPrepaymentStatus;
    if (vpStatus !== 'open' && vpStatus !== 'partially_applied') {
      throw new ServiceError(
        'POST_FAILED',
        `vendor_prepayment id=${parsed.vendor_prepayment_id} has status=${vpStatus}; cannot apply (must be open or partially_applied)`,
      );
    }

    const bill = await loadBillOrThrow(db, parsed.org_id, parsed.bill_id);
    const allowedBillStates = new Set([
      'draft',
      'pending_approval',
      'approved_for_payment',
      'partially_paid',
    ]);
    if (!allowedBillStates.has(bill.lifecycle_state)) {
      throw new ServiceError(
        'POST_FAILED',
        `bill_id=${parsed.bill_id} has lifecycle_state=${bill.lifecycle_state}; cannot apply (must be one of ${Array.from(allowedBillStates).join(', ')})`,
      );
    }

    const existingApps = await loadApplications(db, parsed.vendor_prepayment_id);
    const newAppPreview = computeVendorPrepaymentStatus({
      amount_original: vp.amount_original as string,
      applications: [
        ...existingApps.map((a) => ({ amount_original: a.amount_original })),
        { amount_original: parsed.amount_original },
      ],
      is_refunded: false,
    });
    // computeVendorPrepaymentStatus throws if applications sum > original;
    // the throw provides the over-application defensive guard.

    // Post the JE: Dr AP control / Cr Vendor prepayment asset
    const description = `Apply vendor prepayment ${parsed.vendor_prepayment_id} to bill ${parsed.bill_id}`;
    const drLine = {
      account_id: parsed.ap_control_account_id,
      description,
      debit_amount: toMoneyAmount(parsed.amount_original),
      credit_amount: zeroMoney(),
      currency: parsed.currency,
      amount_original: toMoneyAmount(parsed.amount_original),
      amount_cad: toMoneyAmount(parsed.amount_cad),
      fx_rate: toFxRate(parsed.fx_rate),
      tax_code_id: null,
    };
    const crLine = {
      account_id: parsed.vendor_prepayment_account_id,
      description,
      debit_amount: zeroMoney(),
      credit_amount: toMoneyAmount(parsed.amount_original),
      currency: parsed.currency,
      amount_original: toMoneyAmount(parsed.amount_original),
      amount_cad: toMoneyAmount(parsed.amount_cad),
      fx_rate: toFxRate(parsed.fx_rate),
      tax_code_id: null,
    };

    const { journal_entry_id } = await journalEntryService.post(
      {
        org_id: parsed.org_id,
        fiscal_period_id: parsed.fiscal_period_id,
        entry_date: parsed.entry_date,
        description,
        source: 'manual',
        lines: [drLine, crLine],
      },
      ctx,
    );

    // Insert application row.
    const { data: inserted, error: appErr } = await db
      .from('vendor_prepayment_applications')
      .insert({
        org_id: parsed.org_id,
        vendor_prepayment_id: parsed.vendor_prepayment_id,
        bill_id: parsed.bill_id,
        amount_original: parsed.amount_original,
        amount_cad: parsed.amount_cad,
        applied_at: parsed.applied_at,
        created_by: ctx.caller.user_id,
        trace_id: ctx.trace_id,
      })
      .select('id')
      .single();

    if (appErr || !inserted) {
      throw new ServiceError(
        'POST_FAILED',
        appErr?.message ?? 'vendor_prepayment_applications insert failed',
      );
    }

    // Update parent status if it changed.
    if (newAppPreview !== vpStatus) {
      const { error: upErr } = await db
        .from('vendor_prepayments')
        .update({ status: newAppPreview })
        .eq('id', parsed.vendor_prepayment_id)
        .eq('org_id', parsed.org_id);
      if (upErr) {
        throw new ServiceError('POST_FAILED', `vendor_prepayment status update failed: ${upErr.message}`);
      }
    }

    await recordMutation(db, ctx, {
      org_id: parsed.org_id,
      action: 'vendor_prepayment_applied',
      entity_type: 'vendor_prepayment_application',
      entity_id: (inserted as { id: string }).id,
    });

    log.info(
      {
        org_id: parsed.org_id,
        vendor_prepayment_id: parsed.vendor_prepayment_id,
        bill_id: parsed.bill_id,
        application_id: (inserted as { id: string }).id,
        journal_entry_id,
        new_status: newAppPreview,
      },
      'Vendor prepayment applied to bill',
    );

    return {
      application_id: (inserted as { id: string }).id,
      journal_entry_id,
      new_status: newAppPreview,
    };
  },

  /**
   * record_vendor_prepayment_refund — flips a vendor prepayment to
   * status='refunded' against an existing refund payments row.
   *
   * Preconditions:
   *   - vendor_prepayment exists in same org with status='open' (D4-α
   *     conservative posture: applications must be reversed before
   *     refund — see open_questions.md).
   *   - refund payment exists in same org with payment_purpose='vendor_refund'.
   *
   * Does NOT post a JE. The refund payment's cash-movement JE was
   * posted upstream at refund-payment-creation time. This mutation
   * records the classification + audit only.
   *
   * Audit event: vendor_prepayment.refund.
   */
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'vendor_prepayment.refund'))
  async refund(
    input: RecordVendorPrepaymentRefundInputRaw,
    ctx: ServiceContext,
  ): Promise<{ vendor_prepayment_id: string; status: VendorPrepaymentStatus }> {
    let parsed: RecordVendorPrepaymentRefundInput;
    try {
      parsed = RecordVendorPrepaymentRefundInputSchema.parse(input);
    } catch (err) {
      if (err instanceof Error) {
        throw new ServiceError('READ_FAILED', `record_vendor_prepayment_refund validation failed: ${err.message}`);
      }
      throw err;
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const before = await loadVendorPrepaymentOrThrow(db, parsed.org_id, parsed.vendor_prepayment_id);
    const beforeStatus = before.status as VendorPrepaymentStatus;
    if (beforeStatus !== 'open') {
      throw new ServiceError(
        'POST_FAILED',
        `vendor_prepayment id=${parsed.vendor_prepayment_id} has status=${beforeStatus}; refund requires status=open (D4-α: no applications)`,
      );
    }

    // D4-α defensive: even if status reads 'open', explicitly verify no
    // applications exist (belt-and-suspenders against status drift).
    const existingApps = await loadApplications(db, parsed.vendor_prepayment_id);
    if (existingApps.length > 0) {
      throw new ServiceError(
        'POST_FAILED',
        `vendor_prepayment id=${parsed.vendor_prepayment_id} has ${existingApps.length} application(s); D4-α requires applications to be reversed before refund (see docs/02_specs/open_questions.md)`,
      );
    }

    const refundPayment = await loadPaymentOrThrow(db, parsed.org_id, parsed.refund_payment_id);
    if (refundPayment.payment_purpose !== 'vendor_refund') {
      throw new ServiceError(
        'POST_FAILED',
        `refund_payment_id=${parsed.refund_payment_id} has payment_purpose=${refundPayment.payment_purpose}; expected 'vendor_refund'`,
      );
    }

    const { error: upErr } = await db
      .from('vendor_prepayments')
      .update({ status: 'refunded' })
      .eq('id', parsed.vendor_prepayment_id)
      .eq('org_id', parsed.org_id);
    if (upErr) {
      throw new ServiceError('POST_FAILED', `vendor_prepayment refund update failed: ${upErr.message}`);
    }

    await recordMutation(db, ctx, {
      org_id: parsed.org_id,
      action: 'vendor_prepayment_refunded',
      entity_type: 'vendor_prepayment',
      entity_id: parsed.vendor_prepayment_id,
      before_state: before,
    });

    log.info(
      {
        org_id: parsed.org_id,
        vendor_prepayment_id: parsed.vendor_prepayment_id,
        refund_payment_id: parsed.refund_payment_id,
      },
      'Vendor prepayment refund recorded',
    );

    return {
      vendor_prepayment_id: parsed.vendor_prepayment_id,
      status: 'refunded',
    };
  },
};
