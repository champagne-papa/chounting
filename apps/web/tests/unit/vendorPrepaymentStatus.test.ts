import { describe, it, expect } from 'vitest';
import { computeVendorPrepaymentStatus } from '@/services/spend/vendorPrepaymentStatus';

describe('computeVendorPrepaymentStatus (Layer-2 service-layer; ADR-0015 §1)', () => {
  it('returns "open" when no applications and not refunded', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [],
      is_refunded: false,
    });
    expect(result).toBe('open');
  });

  it('returns "partially_applied" when sum of applications < amount_original', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [{ amount_original: '40.00' }],
      is_refunded: false,
    });
    expect(result).toBe('partially_applied');
  });

  it('returns "partially_applied" when multiple applications sum to less than amount_original', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [
        { amount_original: '30.00' },
        { amount_original: '40.00' },
      ],
      is_refunded: false,
    });
    expect(result).toBe('partially_applied');
  });

  it('returns "fully_applied" when sum of applications equals amount_original', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [
        { amount_original: '60.00' },
        { amount_original: '40.00' },
      ],
      is_refunded: false,
    });
    expect(result).toBe('fully_applied');
  });

  it('returns "refunded" when is_refunded is true (overrides applications)', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [{ amount_original: '40.00' }],
      is_refunded: true,
    });
    expect(result).toBe('refunded');
  });

  it('returns "refunded" when is_refunded is true with no applications', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [],
      is_refunded: true,
    });
    expect(result).toBe('refunded');
  });

  it('throws when sum of applications exceeds amount_original (defensive guard)', () => {
    expect(() => computeVendorPrepaymentStatus({
      amount_original: '100.00',
      applications: [{ amount_original: '150.00' }],
      is_refunded: false,
    })).toThrow(/exceeds/i);
  });

  it('handles zero-amount original gracefully', () => {
    const result = computeVendorPrepaymentStatus({
      amount_original: '0.00',
      applications: [],
      is_refunded: false,
    });
    expect(result).toBe('open');
  });
});
