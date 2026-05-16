// Unit tests for bill.schema.ts Layer-2 Zod boundary (chunk B5-2 substantive session #1).
//
// 3-layer enum discipline per ADR-0010 reserved-enum-states:
//   Layer 1: DB CHECK constraints in 20240139000000 migration (tested elsewhere)
//   Layer 2: Zod rejects reserved values pre-service (THIS FILE)
//   Layer 3: Service code never emits reserved values (tested in service tests)
//
// Pattern mirror: vendorPrepaymentSchema.test.ts (B5-1 schema unit test).
//
// Coverage:
// - Closed enums (BillLifecycleStateSchema, PaymentMethodSchema, AppliedToSchema):
//   accept v1-active values; reject reserved values; reject unknowns.
// - Mutation input schemas (PostBillInputSchema, ApproveBillForPaymentInputSchema,
//   RecordBillPaymentInputSchema, ReverseBillInputSchema):
//   happy parses + missing-required + malformed-shape rejections.

import { describe, it, expect } from 'vitest';
import {
  BillLifecycleStateSchema,
  PaymentMethodSchema,
  AppliedToSchema,
  PostBillInputSchema,
  ApproveBillForPaymentInputSchema,
  RecordBillPaymentInputSchema,
  ReverseBillInputSchema,
} from '@/shared/schemas/spend/bill.schema';

// =====================================================================
// Closed-enum schemas (3-layer ADR-0010 discipline)
// =====================================================================

describe('BillLifecycleStateSchema (Layer-2 boundary; ADR-0010)', () => {
  it('accepts all 7 v1-active values per D1 canonical (B5-1 migration)', () => {
    expect(() => BillLifecycleStateSchema.parse('draft')).not.toThrow();
    expect(() => BillLifecycleStateSchema.parse('pending_approval')).not.toThrow();
    expect(() => BillLifecycleStateSchema.parse('approved_for_payment')).not.toThrow();
    expect(() => BillLifecycleStateSchema.parse('partially_paid')).not.toThrow();
    expect(() => BillLifecycleStateSchema.parse('fully_paid')).not.toThrow();
    expect(() => BillLifecycleStateSchema.parse('voided')).not.toThrow();
    expect(() => BillLifecycleStateSchema.parse('cancelled')).not.toThrow();
  });

  it('rejects unknown values (e.g., Spend brief framing values that are NOT canonical per D1)', () => {
    expect(() => BillLifecycleStateSchema.parse('posted')).toThrow();
    expect(() => BillLifecycleStateSchema.parse('reversed')).toThrow();
    expect(() => BillLifecycleStateSchema.parse('duplicate')).toThrow();
    expect(() => BillLifecycleStateSchema.parse('bogus')).toThrow();
    expect(() => BillLifecycleStateSchema.parse('')).toThrow();
  });
});

describe('PaymentMethodSchema (Layer-2 boundary; ADR-0010 + Sub-K)', () => {
  it('accepts 5 v1-active values per Sub-K', () => {
    expect(() => PaymentMethodSchema.parse('check')).not.toThrow();
    expect(() => PaymentMethodSchema.parse('eft')).not.toThrow();
    expect(() => PaymentMethodSchema.parse('wire')).not.toThrow();
    expect(() => PaymentMethodSchema.parse('cash')).not.toThrow();
    expect(() => PaymentMethodSchema.parse('other')).not.toThrow();
  });

  it('rejects 4 reserved values per Sub-K (defined in DB enum but excluded at Layer 2)', () => {
    expect(() => PaymentMethodSchema.parse('credit_card')).toThrow();
    expect(() => PaymentMethodSchema.parse('ach')).toThrow();
    expect(() => PaymentMethodSchema.parse('bank_transfer')).toThrow();
    expect(() => PaymentMethodSchema.parse('money_order')).toThrow();
  });

  it('rejects unknown values', () => {
    expect(() => PaymentMethodSchema.parse('bogus')).toThrow();
    expect(() => PaymentMethodSchema.parse('')).toThrow();
  });
});

describe('AppliedToSchema (Layer-2 boundary; ADR-0010 + Sub-G)', () => {
  it('accepts v1-active value', () => {
    expect(() => AppliedToSchema.parse('bill')).not.toThrow();
  });

  it('rejects reserved value (invoice; reserved at DB CHECK; Zod rejects pre-service)', () => {
    expect(() => AppliedToSchema.parse('invoice')).toThrow();
  });

  it('rejects unknown values', () => {
    expect(() => AppliedToSchema.parse('bogus')).toThrow();
    expect(() => AppliedToSchema.parse('')).toThrow();
  });
});

// =====================================================================
// Mutation input schemas
// =====================================================================

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';
const VALID_UUID_3 = '33333333-3333-4333-8333-333333333333';
const VALID_UUID_4 = '44444444-4444-4444-8444-444444444444';
const VALID_UUID_5 = '55555555-5555-4555-8555-555555555555';

function validBillLine(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    account_id: VALID_UUID_3,
    description: 'Office supplies',
    amount: '100.0000',
    amount_original: '100.0000',
    amount_cad: '100.0000',
    tax_code_id: null,
    line_number: 1,
    ...overrides,
  };
}

function validPostBillInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    org_id: VALID_UUID,
    vendor_id: VALID_UUID_2,
    bill_number: 'BILL-001',
    issue_date: '2026-05-10',
    due_date: '2026-06-10',
    payment_terms_days: 30,
    purchase_order_id: null,
    currency: 'CAD',
    amount_original: '200.0000',
    amount_cad: '200.0000',
    fx_rate: '1.00000000',
    tax_amount_total: '0.0000',
    bill_lines: [
      validBillLine({ line_number: 1 }),
      validBillLine({ line_number: 2, description: 'Software' }),
    ],
    fiscal_period_id: VALID_UUID_4,
    entry_date: '2026-05-10',
    ap_control_account_id: VALID_UUID_5,
    ...overrides,
  };
}

describe('PostBillInputSchema (Layer-2 boundary)', () => {
  it('happy parse with multi-line bill', () => {
    expect(() => PostBillInputSchema.parse(validPostBillInput())).not.toThrow();
  });

  it('rejects missing required field: org_id', () => {
    const { org_id: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: vendor_id', () => {
    const { vendor_id: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: issue_date', () => {
    const { issue_date: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: currency', () => {
    const { currency: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: amount_original', () => {
    const { amount_original: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: amount_cad', () => {
    const { amount_cad: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: fx_rate', () => {
    const { fx_rate: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: tax_amount_total', () => {
    const { tax_amount_total: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: bill_lines', () => {
    const { bill_lines: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: fiscal_period_id', () => {
    const { fiscal_period_id: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: entry_date', () => {
    const { entry_date: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing required field: ap_control_account_id', () => {
    const { ap_control_account_id: _omit, ...rest } = validPostBillInput();
    expect(() => PostBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects malformed currency (non-CAD; v1 CAD-only per Sub-L)', () => {
    expect(() => PostBillInputSchema.parse(validPostBillInput({ currency: 'USD' }))).toThrow();
    expect(() => PostBillInputSchema.parse(validPostBillInput({ currency: 'EUR' }))).toThrow();
    expect(() => PostBillInputSchema.parse(validPostBillInput({ currency: 'cad' }))).toThrow();
  });

  it('rejects empty bill_lines array', () => {
    expect(() => PostBillInputSchema.parse(validPostBillInput({ bill_lines: [] }))).toThrow();
  });

  it('rejects malformed UUID for org_id', () => {
    expect(() => PostBillInputSchema.parse(validPostBillInput({ org_id: 'not-a-uuid' }))).toThrow();
  });

  it('rejects malformed UUID for vendor_id', () => {
    expect(() => PostBillInputSchema.parse(validPostBillInput({ vendor_id: 'not-a-uuid' }))).toThrow();
  });

  it('rejects malformed UUID for ap_control_account_id', () => {
    expect(() =>
      PostBillInputSchema.parse(validPostBillInput({ ap_control_account_id: 'not-a-uuid' })),
    ).toThrow();
  });

  it('rejects malformed UUID inside bill_lines.account_id', () => {
    expect(() =>
      PostBillInputSchema.parse(
        validPostBillInput({
          bill_lines: [validBillLine({ account_id: 'not-a-uuid' })],
        }),
      ),
    ).toThrow();
  });

  it('rejects malformed issue_date (not YYYY-MM-DD)', () => {
    expect(() => PostBillInputSchema.parse(validPostBillInput({ issue_date: '05/10/2026' }))).toThrow();
    expect(() => PostBillInputSchema.parse(validPostBillInput({ issue_date: '2026-5-10' }))).toThrow();
  });
});

describe('ApproveBillForPaymentInputSchema (Layer-2 boundary)', () => {
  const validApprove = {
    org_id: VALID_UUID,
    bill_id: VALID_UUID_2,
  };

  it('happy parse', () => {
    expect(() => ApproveBillForPaymentInputSchema.parse(validApprove)).not.toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => ApproveBillForPaymentInputSchema.parse({ bill_id: VALID_UUID_2 })).toThrow();
  });

  it('rejects missing bill_id', () => {
    expect(() => ApproveBillForPaymentInputSchema.parse({ org_id: VALID_UUID })).toThrow();
  });

  it('rejects malformed UUID for org_id', () => {
    expect(() =>
      ApproveBillForPaymentInputSchema.parse({ ...validApprove, org_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects malformed UUID for bill_id', () => {
    expect(() =>
      ApproveBillForPaymentInputSchema.parse({ ...validApprove, bill_id: 'not-a-uuid' }),
    ).toThrow();
  });
});

describe('RecordBillPaymentInputSchema (Layer-2 boundary)', () => {
  function validRecordPayment(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      org_id: VALID_UUID,
      bill_id: VALID_UUID_2,
      payment_method: 'check',
      payment_date: '2026-05-10',
      amount_cad: '100.0000',
      reference_number: 'CHK-001',
      fiscal_period_id: VALID_UUID_3,
      entry_date: '2026-05-10',
      ap_control_account_id: VALID_UUID_4,
      cash_account_id: VALID_UUID_5,
      ...overrides,
    };
  }

  it('happy parse with valid payment_method (eft)', () => {
    expect(() =>
      RecordBillPaymentInputSchema.parse(validRecordPayment({ payment_method: 'eft' })),
    ).not.toThrow();
  });

  it('happy parse with reference_number = null', () => {
    expect(() =>
      RecordBillPaymentInputSchema.parse(validRecordPayment({ reference_number: null })),
    ).not.toThrow();
  });

  it('rejects malformed payment_method (credit_card reserved per Sub-K)', () => {
    expect(() =>
      RecordBillPaymentInputSchema.parse(validRecordPayment({ payment_method: 'credit_card' })),
    ).toThrow();
  });

  it('rejects malformed payment_method (ach reserved)', () => {
    expect(() =>
      RecordBillPaymentInputSchema.parse(validRecordPayment({ payment_method: 'ach' })),
    ).toThrow();
  });

  it('rejects unknown payment_method', () => {
    expect(() =>
      RecordBillPaymentInputSchema.parse(validRecordPayment({ payment_method: 'paypal' })),
    ).toThrow();
  });

  it('rejects missing payment_date', () => {
    const { payment_date: _omit, ...rest } = validRecordPayment();
    expect(() => RecordBillPaymentInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing amount_cad', () => {
    const { amount_cad: _omit, ...rest } = validRecordPayment();
    expect(() => RecordBillPaymentInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing fiscal_period_id', () => {
    const { fiscal_period_id: _omit, ...rest } = validRecordPayment();
    expect(() => RecordBillPaymentInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing entry_date', () => {
    const { entry_date: _omit, ...rest } = validRecordPayment();
    expect(() => RecordBillPaymentInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing ap_control_account_id', () => {
    const { ap_control_account_id: _omit, ...rest } = validRecordPayment();
    expect(() => RecordBillPaymentInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing cash_account_id', () => {
    const { cash_account_id: _omit, ...rest } = validRecordPayment();
    expect(() => RecordBillPaymentInputSchema.parse(rest)).toThrow();
  });

  it('rejects malformed amount_cad (non-numeric MoneyString)', () => {
    expect(() =>
      RecordBillPaymentInputSchema.parse(validRecordPayment({ amount_cad: 'not-money' })),
    ).toThrow();
  });
});

describe('ReverseBillInputSchema (Layer-2 boundary)', () => {
  function validReverse(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      org_id: VALID_UUID,
      bill_id: VALID_UUID_2,
      reversal_reason: 'Vendor sent corrected invoice',
      fiscal_period_id: VALID_UUID_3,
      entry_date: '2026-05-10',
      ...overrides,
    };
  }

  it('happy parse', () => {
    expect(() => ReverseBillInputSchema.parse(validReverse())).not.toThrow();
  });

  it('rejects empty reversal_reason (INV-REVERSAL-002 boundary)', () => {
    expect(() => ReverseBillInputSchema.parse(validReverse({ reversal_reason: '' }))).toThrow();
  });

  it('rejects missing org_id', () => {
    const { org_id: _omit, ...rest } = validReverse();
    expect(() => ReverseBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing bill_id', () => {
    const { bill_id: _omit, ...rest } = validReverse();
    expect(() => ReverseBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing reversal_reason', () => {
    const { reversal_reason: _omit, ...rest } = validReverse();
    expect(() => ReverseBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing fiscal_period_id', () => {
    const { fiscal_period_id: _omit, ...rest } = validReverse();
    expect(() => ReverseBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects missing entry_date', () => {
    const { entry_date: _omit, ...rest } = validReverse();
    expect(() => ReverseBillInputSchema.parse(rest)).toThrow();
  });

  it('rejects malformed UUID for bill_id', () => {
    expect(() =>
      ReverseBillInputSchema.parse(validReverse({ bill_id: 'not-a-uuid' })),
    ).toThrow();
  });

  it('rejects malformed entry_date (not YYYY-MM-DD)', () => {
    expect(() =>
      ReverseBillInputSchema.parse(validReverse({ entry_date: '05-10-2026' })),
    ).toThrow();
  });
});
