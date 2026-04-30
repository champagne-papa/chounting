// tests/unit/addressRegionValidation.test.ts
// Category B test CB-02: region validation accepts two-letter codes,
// rejects full names. Per OQ-08 (RESOLVED 2026-04-15): two-letter
// codes only; UI handles display-time prettification.

import { describe, it, expect } from 'vitest';
import { addAddressSchema, CA_REGIONS } from '@/shared/schemas/organization/address.schema';

describe('CB-02: address region validation by country', () => {
  const validBase = {
    addressType: 'mailing' as const,
    line1: '100 Main St',
    country: 'CA',
  };

  it('rejects country="CA", region="British Columbia" with a listing-of-codes error', () => {
    const result = addAddressSchema.safeParse({
      ...validBase,
      region: 'British Columbia',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const regionIssue = result.error.issues.find((i) => i.path.includes('region'));
      expect(regionIssue).toBeDefined();
      expect(regionIssue!.message).toContain(CA_REGIONS.join(', '));
      expect(regionIssue!.message).toContain('"British Columbia"');
    }
  });

  it('accepts country="CA", region="BC"', () => {
    const result = addAddressSchema.safeParse({
      ...validBase,
      region: 'BC',
    });
    expect(result.success).toBe(true);
  });

  it('accepts country="DE", region="Bayern" (free text for non-CA/US)', () => {
    const result = addAddressSchema.safeParse({
      ...validBase,
      country: 'DE',
      region: 'Bayern',
    });
    expect(result.success).toBe(true);
  });

  it('rejects country="CA", region="XZ" (not in the 13 province codes)', () => {
    const result = addAddressSchema.safeParse({
      ...validBase,
      region: 'XZ',
    });
    expect(result.success).toBe(false);
  });

  it('accepts country="CA", region=null (region is optional)', () => {
    const result = addAddressSchema.safeParse({
      ...validBase,
      region: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects country="ca" (lowercase)', () => {
    const result = addAddressSchema.safeParse({
      ...validBase,
      country: 'ca',
    });
    expect(result.success).toBe(false);
  });
});
