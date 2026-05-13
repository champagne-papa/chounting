// Unit tests for billDetail.schema.ts Layer-2 Zod boundary
// (chunk B5-3-D5 substrate-correction).
//
// Tests the per-bill bill-detail input schema:
//   - org_id required + UUID format
//   - bill_id required + UUID format
//
// Pattern mirror: activePaymentsSchema.test.ts for unit-test discipline at
// the Layer-2 Zod boundary.

import { describe, it, expect } from 'vitest';
import { BillDetailInputSchema } from '@/shared/schemas/spend/reports/billDetail.schema';

const VALID_UUID = '11111111-2222-4333-8444-555555555555';
const VALID_UUID_2 = '22222222-3333-4444-8555-666666666666';

describe('BillDetailInputSchema (Layer-2 boundary)', () => {
  it('accepts valid UUIDs for org_id + bill_id', () => {
    expect(() =>
      BillDetailInputSchema.parse({ org_id: VALID_UUID, bill_id: VALID_UUID_2 }),
    ).not.toThrow();
  });

  it('rejects non-UUID org_id', () => {
    expect(() =>
      BillDetailInputSchema.parse({ org_id: 'not-a-uuid', bill_id: VALID_UUID_2 }),
    ).toThrow();
  });

  it('rejects non-UUID bill_id', () => {
    expect(() =>
      BillDetailInputSchema.parse({ org_id: VALID_UUID, bill_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects missing bill_id', () => {
    expect(() =>
      BillDetailInputSchema.parse({ org_id: VALID_UUID }),
    ).toThrow();
  });
});
