import { z } from 'zod';

/**
 * Closed-enum Zod schemas for vendor prepayment lifecycle (ADR-0015 §11).
 *
 * Layer-2 of the 3-layer ADR-0010 reserved-enum-states discipline:
 *   Layer 1: DB CHECK constraint (in supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql)
 *   Layer 2: this file — Zod schema rejects reserved enum values at service entry
 *   Layer 3: service code never emits reserved values (apps/web/src/services/spend/)
 *
 * Schemas list ONLY v1-active values. Reserved values defined in the DB enum
 * type but rejected at the Zod boundary before reaching service logic.
 */

export const VendorPrepaymentTypeSchema = z.enum([
  'retainer',
  'deposit',
  'advance',
  'other',
]);

export type VendorPrepaymentType = z.infer<typeof VendorPrepaymentTypeSchema>;

export const VendorPrepaymentStatusSchema = z.enum([
  'open',
  'partially_applied',
  'fully_applied',
  'refunded',
]);

export type VendorPrepaymentStatus = z.infer<typeof VendorPrepaymentStatusSchema>;

export const TaxTimingChoiceSchema = z.enum([
  'at_payment',
  'at_final_invoice',
  'review_required',
]);

export type TaxTimingChoice = z.infer<typeof TaxTimingChoiceSchema>;

export const PaymentPurposeSchema = z.enum([
  'bill_payment',
  'vendor_prepayment',
  'vendor_refund',
  'other',
]);

export type PaymentPurpose = z.infer<typeof PaymentPurposeSchema>;

export const PaymentStateSchema = z.enum([
  'pending',
  'paid',
  'failed',
]);

export type PaymentState = z.infer<typeof PaymentStateSchema>;

// =====================================================================
// Mutation input schemas (Phase 5 chunk B5-1 substantive session #2)
// =====================================================================
// Service-layer Zod boundary per ADR-0010 Layer 2 + service-architecture
// Two Laws. Input schemas for the three vendor prepayment mutations
// (record / apply_to_bill / refund).
//
// Money fields use 4-decimal numeric strings to match DB numeric(20,4)
// columns; fx_rate uses 8-decimal strings to match numeric(20,8).
// Tax-timing 3-layer resolution (ADR-0015 §4 / Q62 closure) lives at
// higher orchestration; this schema accepts the already-resolved
// `tax_timing_choice` value. Per-org branch (org_settings.
// deposit_tax_timing_default) is deferred per (orgset-β) lock.

const MoneyString = z.string().regex(/^-?\d+\.\d{4}$/, 'must be a 4-decimal numeric string');
const FxRateString = z.string().regex(/^\d+\.\d{8}$/, 'must be an 8-decimal numeric string');

export const RecordVendorPrepaymentInputSchema = z.object({
  org_id: z.string().uuid(),
  legal_entity_id: z.string().uuid().nullable().optional(),
  vendor_id: z.string().uuid(),
  payment_id: z.string().uuid(),
  prepayment_type: VendorPrepaymentTypeSchema,
  amount_original: MoneyString,
  amount_cad: MoneyString,
  fx_rate: FxRateString.nullable().optional(),
  currency: z.string().length(3).default('CAD'),
  recognized_at: z.string().date(),
  expected_application_date: z.string().date().nullable().optional(),
  tax_timing_choice: TaxTimingChoiceSchema,
  tax_amount_at_payment: MoneyString.nullable().optional(),
  description: z.string().nullable().optional(),
});

export type RecordVendorPrepaymentInput = z.infer<typeof RecordVendorPrepaymentInputSchema>;
export type RecordVendorPrepaymentInputRaw = z.input<typeof RecordVendorPrepaymentInputSchema>;

export const ApplyVendorPrepaymentToBillInputSchema = z.object({
  org_id: z.string().uuid(),
  vendor_prepayment_id: z.string().uuid(),
  bill_id: z.string().uuid(),
  amount_original: MoneyString,
  amount_cad: MoneyString,
  applied_at: z.string().date(),
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().date(),
  ap_control_account_id: z.string().uuid(),
  vendor_prepayment_account_id: z.string().uuid(),
  fx_rate: FxRateString.default('1.00000000'),
  currency: z.string().length(3).default('CAD'),
});

export type ApplyVendorPrepaymentToBillInput = z.infer<typeof ApplyVendorPrepaymentToBillInputSchema>;
export type ApplyVendorPrepaymentToBillInputRaw = z.input<typeof ApplyVendorPrepaymentToBillInputSchema>;

export const RecordVendorPrepaymentRefundInputSchema = z.object({
  org_id: z.string().uuid(),
  vendor_prepayment_id: z.string().uuid(),
  refund_payment_id: z.string().uuid(),
});

export type RecordVendorPrepaymentRefundInput = z.infer<typeof RecordVendorPrepaymentRefundInputSchema>;
export type RecordVendorPrepaymentRefundInputRaw = z.input<typeof RecordVendorPrepaymentRefundInputSchema>;
