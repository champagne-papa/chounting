// Unit tests for paymentApprovalQueue.schema.ts Layer-2 Zod boundary
// (chunk B5-3-D1 substantive session #2).
//
// Tests the EC-A-6 payment approval queue input schema:
//   - org_id required + UUID format
//
// Pagination DEFERRED post-v1 per conditional disposition (a) at chunk
// B5-3-D1 onset; not part of schema in v1.
//
// Pattern mirror: openBillsSchema.test.ts (session #1) for unit-test
// discipline at the Layer-2 Zod boundary.

import { describe, it, expect } from 'vitest';
import { PaymentApprovalQueueInputSchema } from '@/shared/schemas/spend/reports/paymentApprovalQueue.schema';

const VALID_UUID = '11111111-2222-4333-8444-555555555555';

describe('PaymentApprovalQueueInputSchema (Layer-2 boundary)', () => {
  it('accepts valid UUID for org_id', () => {
    expect(() =>
      PaymentApprovalQueueInputSchema.parse({ org_id: VALID_UUID }),
    ).not.toThrow();
  });

  it('rejects non-UUID org_id', () => {
    expect(() =>
      PaymentApprovalQueueInputSchema.parse({ org_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => PaymentApprovalQueueInputSchema.parse({})).toThrow();
  });

  it('rejects null org_id', () => {
    expect(() =>
      PaymentApprovalQueueInputSchema.parse({ org_id: null }),
    ).toThrow();
  });
});
