// Unit tests for vendorBalance.schema.ts Layer-2 Zod boundary (chunk B5-3-D1
// substantive session #1).
//
// Tests the EC-A-5 vendor balance input schema:
//   - org_id required + UUID format
//   - vendor_id required + UUID format
//
// Pattern mirror: billSchema.test.ts (B5-2) for unit-test discipline at the
// Layer-2 Zod boundary.

import { describe, it, expect } from 'vitest';
import { VendorBalanceInputSchema } from '@/shared/schemas/spend/reports/vendorBalance.schema';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';

describe('VendorBalanceInputSchema (Layer-2 boundary)', () => {
  it('accepts valid org_id + vendor_id UUIDs', () => {
    expect(() =>
      VendorBalanceInputSchema.parse({ org_id: VALID_UUID, vendor_id: VALID_UUID_2 }),
    ).not.toThrow();
  });

  it('rejects malformed UUID for vendor_id', () => {
    expect(() =>
      VendorBalanceInputSchema.parse({ org_id: VALID_UUID, vendor_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects malformed UUID for org_id', () => {
    expect(() =>
      VendorBalanceInputSchema.parse({ org_id: 'not-a-uuid', vendor_id: VALID_UUID_2 }),
    ).toThrow();
  });

  it('rejects missing vendor_id', () => {
    expect(() => VendorBalanceInputSchema.parse({ org_id: VALID_UUID })).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => VendorBalanceInputSchema.parse({ vendor_id: VALID_UUID_2 })).toThrow();
  });

  it('rejects null vendor_id', () => {
    expect(() =>
      VendorBalanceInputSchema.parse({ org_id: VALID_UUID, vendor_id: null }),
    ).toThrow();
  });

  it('rejects empty object', () => {
    expect(() => VendorBalanceInputSchema.parse({})).toThrow();
  });
});
