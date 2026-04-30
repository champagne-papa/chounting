// tests/unit/externalIdsSchema.test.ts
// Category B test CB-03: externalIds Zod schema validates known keys
// and passes unknown keys through.

import { describe, it, expect } from 'vitest';
import { orgExternalIdsSchema } from '@/shared/schemas/organization/externalIds.schema';

describe('CB-03: externalIds Zod schema', () => {
  it('accepts an empty object', () => {
    const result = orgExternalIdsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts known keys with string values', () => {
    const result = orgExternalIdsSchema.safeParse({
      stripe_customer_id: 'cus_abc123',
      xero_tenant_id: 'tenant_xyz',
    });
    expect(result.success).toBe(true);
  });

  it('accepts unknown keys (passthrough)', () => {
    const result = orgExternalIdsSchema.safeParse({
      stripe_customer_id: 'cus_x',
      my_unknown_key: 'ok',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.my_unknown_key).toBe('ok');
    }
  });

  it('accepts nested objects on unknown keys', () => {
    const result = orgExternalIdsSchema.safeParse({
      future_integration_id: { nested: 'ok' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects stripe_customer_id with number value', () => {
    const result = orgExternalIdsSchema.safeParse({
      stripe_customer_id: 123,
    });
    expect(result.success).toBe(false);
  });

  it('rejects xero_tenant_id with array value', () => {
    const result = orgExternalIdsSchema.safeParse({
      xero_tenant_id: ['a', 'b'],
    });
    expect(result.success).toBe(false);
  });
});
