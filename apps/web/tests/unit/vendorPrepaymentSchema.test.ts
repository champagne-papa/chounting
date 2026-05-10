import { describe, it, expect } from 'vitest';
import {
  VendorPrepaymentTypeSchema,
  VendorPrepaymentStatusSchema,
  TaxTimingChoiceSchema,
  PaymentPurposeSchema,
  PaymentStateSchema,
} from '@/shared/schemas/spend/vendorPrepayment.schema';

describe('VendorPrepaymentTypeSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => VendorPrepaymentTypeSchema.parse('retainer')).not.toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('deposit')).not.toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('advance')).not.toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('other')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => VendorPrepaymentTypeSchema.parse('security_deposit')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('prepaid_service')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('inventory_deposit')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('fixed_asset_deposit')).toThrow();
  });

  it('rejects unknown values', () => {
    expect(() => VendorPrepaymentTypeSchema.parse('bogus')).toThrow();
    expect(() => VendorPrepaymentTypeSchema.parse('')).toThrow();
  });
});

describe('VendorPrepaymentStatusSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => VendorPrepaymentStatusSchema.parse('open')).not.toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('partially_applied')).not.toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('fully_applied')).not.toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('refunded')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => VendorPrepaymentStatusSchema.parse('written_off')).toThrow();
    expect(() => VendorPrepaymentStatusSchema.parse('forfeited')).toThrow();
  });
});

describe('TaxTimingChoiceSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => TaxTimingChoiceSchema.parse('at_payment')).not.toThrow();
    expect(() => TaxTimingChoiceSchema.parse('at_final_invoice')).not.toThrow();
    expect(() => TaxTimingChoiceSchema.parse('review_required')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => TaxTimingChoiceSchema.parse('controller_chooses_per_invoice')).toThrow();
  });
});

describe('PaymentPurposeSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => PaymentPurposeSchema.parse('bill_payment')).not.toThrow();
    expect(() => PaymentPurposeSchema.parse('vendor_prepayment')).not.toThrow();
    expect(() => PaymentPurposeSchema.parse('vendor_refund')).not.toThrow();
    expect(() => PaymentPurposeSchema.parse('other')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => PaymentPurposeSchema.parse('customer_payment')).toThrow();
    expect(() => PaymentPurposeSchema.parse('employee_reimbursement')).toThrow();
    expect(() => PaymentPurposeSchema.parse('owner_reimbursement')).toThrow();
    expect(() => PaymentPurposeSchema.parse('tax_payment')).toThrow();
  });
});

describe('PaymentStateSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts v1-active values', () => {
    expect(() => PaymentStateSchema.parse('pending')).not.toThrow();
    expect(() => PaymentStateSchema.parse('paid')).not.toThrow();
    expect(() => PaymentStateSchema.parse('failed')).not.toThrow();
  });

  it('rejects reserved values', () => {
    expect(() => PaymentStateSchema.parse('partially_returned')).toThrow();
    expect(() => PaymentStateSchema.parse('refunded')).toThrow();
  });
});
