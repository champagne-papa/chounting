// Layer-2 boundary for Slice A bill lifecycle (chunk B5-2 substantive session #1).
//
// 3-layer enum discipline per ADR-0010 reserved-enum-states:
//   Layer 1: DB CHECK constraints in 20240139000000 migration
//   Layer 2: Zod rejects reserved values pre-service (THIS FILE)
//   Layer 3: Service code never emits reserved values (billService.ts)
//
// Money fields use canonical MoneyAmountSchema + FxRateSchema from money.schema.ts (branded
// types; canonical pattern across the codebase per proposedEntryCard / recurringJournal /
// journalEntry schemas). Spend domain uniformly numeric(20,4) per Sub-H audit; service
// boundary casts via toMoneyAmount/toFxRate (imported by billService.ts directly from money.schema).
//
// Note: B5-1 vendorPrepayment.schema.ts uses local MoneyString/FxRateString regex (legacy
// outlier; pre-canonical-helper-adoption); not mirrored here. Backward-cleanup of vendorPrepayment
// to canonical pattern deferred (out of chunk B5-2 scope).

import { z } from 'zod';
import { MoneyAmountSchema, FxRateSchema } from '@/shared/schemas/accounting/money.schema';

// =====================================================================
// Closed-enum schemas (3-layer ADR-0010 discipline)
// =====================================================================

// bill_lifecycle_state per D1 canonical (B5-1 migration; reused). All 7 values v1-active.
export const BillLifecycleStateSchema = z.enum([
  'draft',
  'pending_approval',
  'approved_for_payment',
  'partially_paid',
  'fully_paid',
  'voided',
  'cancelled',
]);
export type BillLifecycleState = z.infer<typeof BillLifecycleStateSchema>;

// payment_method per Sub-K (v1-active subset only; Zod rejects reserved per Layer 2).
// Reserved values defined in DB enum type (credit_card, ach, bank_transfer, money_order)
// but excluded here so Zod boundary rejects them pre-service.
export const PaymentMethodSchema = z.enum(['check', 'eft', 'wire', 'cash', 'other']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// applied_to discriminator per Sub-G (v1-active: bill; reserved: invoice for Phase 3+).
// 'invoice' reserved at DB CHECK layer; Zod rejects pre-service.
export const AppliedToSchema = z.enum(['bill']);
export type AppliedTo = z.infer<typeof AppliedToSchema>;

// =====================================================================
// Bill line input schema
// =====================================================================

export const BillLineInputSchema = z.object({
  account_id: z.string().uuid(),
  description: z.string().min(1),
  amount: MoneyAmountSchema, // 4-decimal MoneyString
  amount_original: MoneyAmountSchema,
  amount_cad: MoneyAmountSchema,
  tax_code_id: z.string().uuid().nullable(),
  line_number: z.number().int().min(1),
});
export type BillLineInput = z.infer<typeof BillLineInputSchema>;

// =====================================================================
// Mutation input schemas (Phase 5 chunk B5-2 substantive session #1)
// =====================================================================
// Service-layer Zod boundary per ADR-0010 Layer 2 + service-architecture
// Two Laws. Input schemas for the four bill lifecycle mutations
// (post / approve_for_payment / record_payment / reverse).

// post_bill per Shape (i): posts JE + sets bills.lifecycle_state = 'pending_approval'.
// Approval gate per D3 = Always Confirm v1 (controller approves via approve_bill_for_payment).
// fiscal_period_id + entry_date + ap_control_account_id required for journalEntryService.post() call.
export const PostBillInputSchema = z.object({
  org_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  bill_number: z.string().nullable(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  payment_terms_days: z.number().int().nullable(),
  purchase_order_id: z.string().uuid().nullable(), // Phase F reserved
  currency: z.literal('CAD'), // v1-CAD-only per Sub-L
  amount_original: MoneyAmountSchema,
  amount_cad: MoneyAmountSchema,
  fx_rate: FxRateSchema,
  tax_amount_total: MoneyAmountSchema,
  bill_lines: z.array(BillLineInputSchema).min(1),
  fiscal_period_id: z.string().uuid(), // for journalEntryService.post period-lock check
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ap_control_account_id: z.string().uuid(), // Cr account in JE
  // INV-DOC-001 enforcement inputs (Phase 5.1 chunk 5.1a per Sub-Q4-shape-2).
  // Caller provides primary_document_id OR sets override_evidence_completeness=true;
  // otherwise billService.post() throws ServiceError('EVIDENCE_INCOMPLETE').
  // override_evidence_completeness Zod-level default mirrors Layer 1 NOT NULL
  // DEFAULT false at migration 20240138000000:172.
  primary_document_id: z.string().uuid().optional(),
  override_evidence_completeness: z.boolean().optional().default(false),
  // Wave 6 D3 — optional dedup key threaded to journalEntryService.post
  // (idx_je_source_external partial unique). The approve→post route sets
  // document_case_id here; absent for every other caller (NULL skips
  // the partial index).
  source_external_id: z.string().min(1).optional(),
});
export type PostBillInput = z.infer<typeof PostBillInputSchema>;
export type PostBillInputRaw = z.input<typeof PostBillInputSchema>;

// approve_bill_for_payment is state-only (no JE produced). Transitions pending_approval → approved_for_payment.
export const ApproveBillForPaymentInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
});
export type ApproveBillForPaymentInput = z.infer<typeof ApproveBillForPaymentInputSchema>;
export type ApproveBillForPaymentInputRaw = z.input<typeof ApproveBillForPaymentInputSchema>;

// record_bill_payment creates payment row + bill_payment_allocations + posts payment JE.
// INV-AP-001: allocation amount must be ≤ remaining bill balance (Layer 2 service enforcement).
// v1: bill.currency = 'CAD' precondition per Sub-L (service-layer, not Zod boundary).
export const RecordBillPaymentInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
  payment_method: PaymentMethodSchema,
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount_cad: MoneyAmountSchema, // payments.amount is CAD-implicit per Sub-L
  reference_number: z.string().nullable(),
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ap_control_account_id: z.string().uuid(), // Dr account in payment JE
  cash_account_id: z.string().uuid(), // Cr account in payment JE
});
export type RecordBillPaymentInput = z.infer<typeof RecordBillPaymentInputSchema>;
export type RecordBillPaymentInputRaw = z.input<typeof RecordBillPaymentInputSchema>;

// reverse_bill thin wrapper per D4 + Sub-E. Calls journalEntryService.post() with reverses_journal_entry_id.
// reversal_reason caller-provided per Integration 1 + INV-REVERSAL-002 (non-empty string).
// INV-AP-002: precondition lifecycle_state ∈ {pending_approval, approved_for_payment, partially_paid, fully_paid} (Layer 2 service).
// Sub-D: target state = voided (canonical 7-state enum).
// Sub-N (b): wrapper reads bill.posted_journal_entry_id from disk; input does NOT carry reverses_journal_entry_id.
export const ReverseBillInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
  reversal_reason: z.string().min(1), // INV-REVERSAL-002 non-empty
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // reversal entry date
});
export type ReverseBillInput = z.infer<typeof ReverseBillInputSchema>;
export type ReverseBillInputRaw = z.input<typeof ReverseBillInputSchema>;
