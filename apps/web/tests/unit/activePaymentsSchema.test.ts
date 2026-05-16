// Unit tests for activePayments.schema.ts Layer-2 Zod boundary
// (chunk B5-3-D5 substantive session #1).
//
// Tests the active payments report input schema:
//   - org_id required + UUID format
//
// Pagination DEFERRED post-v1 per chunk B5-3-D1 conditional disposition (a);
// not part of schema in v1.
//
// Pattern mirror: paymentApprovalQueueSchema.test.ts for unit-test
// discipline at the Layer-2 Zod boundary.

import { describe, it, expect } from 'vitest';
import { ActivePaymentsInputSchema } from '@/shared/schemas/spend/reports/activePayments.schema';

const VALID_UUID = '11111111-2222-4333-8444-555555555555';

describe('ActivePaymentsInputSchema (Layer-2 boundary)', () => {
  it('accepts valid UUID for org_id', () => {
    expect(() =>
      ActivePaymentsInputSchema.parse({ org_id: VALID_UUID }),
    ).not.toThrow();
  });

  it('rejects non-UUID org_id', () => {
    expect(() =>
      ActivePaymentsInputSchema.parse({ org_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => ActivePaymentsInputSchema.parse({})).toThrow();
  });

  it('rejects null org_id', () => {
    expect(() =>
      ActivePaymentsInputSchema.parse({ org_id: null }),
    ).toThrow();
  });
});
