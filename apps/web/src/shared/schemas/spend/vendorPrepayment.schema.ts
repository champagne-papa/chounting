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
