// Unit tests for paidBillsHistory.schema.ts Layer-2 Zod boundary
// (chunk B5-3-D1 substantive session #2).
//
// Tests the EC-A-7 paid bills history input schema:
//   - org_id required + UUID format
//
// Pagination DEFERRED post-v1 per conditional disposition (a) at chunk
// B5-3-D1 onset; not part of schema in v1.
//
// Pattern mirror: openBillsSchema.test.ts (session #1) for unit-test
// discipline at the Layer-2 Zod boundary.

import { describe, it, expect } from 'vitest';
import { PaidBillsHistoryInputSchema } from '@/shared/schemas/spend/reports/paidBillsHistory.schema';

const VALID_UUID = '22222222-3333-4444-8555-666666666666';

describe('PaidBillsHistoryInputSchema (Layer-2 boundary)', () => {
  it('accepts valid UUID for org_id', () => {
    expect(() =>
      PaidBillsHistoryInputSchema.parse({ org_id: VALID_UUID }),
    ).not.toThrow();
  });

  it('rejects non-UUID org_id', () => {
    expect(() =>
      PaidBillsHistoryInputSchema.parse({ org_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => PaidBillsHistoryInputSchema.parse({})).toThrow();
  });

  it('rejects null org_id', () => {
    expect(() =>
      PaidBillsHistoryInputSchema.parse({ org_id: null }),
    ).toThrow();
  });
});
