// src/tests/unit/listVendorsSchema.test.ts
//
// Vitest unit test for ListVendorsInputSchema Zod boundary
// (Phase 5 chunk B5-3-D2 session #1; vendorService.listVendors input).

import { describe, it, expect } from 'vitest';
import { ListVendorsInputSchema } from '@/shared/schemas/spend/listVendors.schema';

describe('ListVendorsInputSchema', () => {
  it('accepts valid org_id UUID', () => {
    const result = ListVendorsInputSchema.safeParse({
      org_id: '00000000-0000-4000-8000-000000000001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing org_id', () => {
    const result = ListVendorsInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID org_id', () => {
    const result = ListVendorsInputSchema.safeParse({
      org_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects null org_id', () => {
    const result = ListVendorsInputSchema.safeParse({ org_id: null });
    expect(result.success).toBe(false);
  });
});
