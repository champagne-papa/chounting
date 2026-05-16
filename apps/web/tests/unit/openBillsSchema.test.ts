// Unit tests for openBills.schema.ts Layer-2 Zod boundary (chunk B5-3-D1
// substantive session #1).
//
// Tests the EC-A-4 open bills input schema:
//   - org_id required + UUID format (added at checkpoint #1 review per founder
//     verdict; pattern parity with .aging() + .balance() input shapes)
//
// Pagination DEFERRED post-v1 per conditional disposition (a) at chunk
// B5-3-D1 onset; not part of schema in v1.
//
// Pattern mirror: billSchema.test.ts (B5-2) for unit-test discipline at the
// Layer-2 Zod boundary.

import { describe, it, expect } from 'vitest';
import { OpenBillsInputSchema } from '@/shared/schemas/spend/reports/openBills.schema';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('OpenBillsInputSchema (Layer-2 boundary)', () => {
  it('accepts valid UUID for org_id', () => {
    expect(() => OpenBillsInputSchema.parse({ org_id: VALID_UUID })).not.toThrow();
  });

  it('rejects non-UUID org_id', () => {
    expect(() => OpenBillsInputSchema.parse({ org_id: 'not-a-uuid' })).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => OpenBillsInputSchema.parse({})).toThrow();
  });

  it('rejects null org_id', () => {
    expect(() => OpenBillsInputSchema.parse({ org_id: null })).toThrow();
  });
});
