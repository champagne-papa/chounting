// Layer-2 boundary for Phase 5.1 chunk 5.1b paymentService.record()
// payment-flow primitive per Sub-Q2 2.β LOCKED.
//
// Mirror shape: RecordBillPaymentInputSchema at bill.schema.ts:111-122
// (10 identical fields). paymentService.record() is the payment-flow
// primitive (insert payment + bill_payment_allocations + compose
// payment JE + delegate to journalEntryService.post() per Reading B);
// billService.recordPayment is the AP-domain orchestration wrapper
// (bill state transition + lifecycle_state update + T5 dispatch on
// fully_paid) unchanged at chunk 5.1b.
//
// Schema-duplication note: RecordPaymentInputSchema and
// RecordBillPaymentInputSchema are identical at v1. paymentService.record()
// at v1 ships as greenfield-with-no-v1-callers (Sub-Q2 2.β partial
// extraction posture; substrate-without-consumer pattern mirroring
// chunk 5.1a vendor_credits β). Future consumer chunks may consolidate
// the two schemas if billService.recordPayment refactors to delegate
// to paymentService.record(); Phase 5.1 retrospective Observation
// candidate per brief §8 Risk 7.

import { z } from 'zod';
import { MoneyAmountSchema } from '@/shared/schemas/accounting/money.schema';
import { PaymentMethodSchema } from '@/shared/schemas/spend/bill.schema';

export const RecordPaymentInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
  payment_method: PaymentMethodSchema,
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  amount_cad: MoneyAmountSchema, // payments.amount is CAD-implicit per Sub-L
  reference_number: z.string().nullable(),
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ap_control_account_id: z.string().uuid(), // Dr account in payment JE
  cash_account_id: z.string().uuid(), // Cr account in payment JE
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentInputSchema>;
export type RecordPaymentInputRaw = z.input<typeof RecordPaymentInputSchema>;
