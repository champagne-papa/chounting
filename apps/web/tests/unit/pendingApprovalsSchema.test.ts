// Unit tests for pendingApprovals.schema.ts Layer-2 Zod boundary
// (Phase 5 arc-closure).
//
// Tests the pending approvals report input schema:
//   - org_id required + UUID format
//
// Pattern mirror: activePaymentsSchema.test.ts.

import { describe, it, expect } from 'vitest';
import { PendingApprovalsInputSchema } from '@/shared/schemas/spend/reports/pendingApprovals.schema';

const VALID_UUID = '11111111-2222-4333-8444-555555555555';

describe('PendingApprovalsInputSchema (Layer-2 boundary)', () => {
  it('accepts valid UUID for org_id', () => {
    expect(() =>
      PendingApprovalsInputSchema.parse({ org_id: VALID_UUID }),
    ).not.toThrow();
  });

  it('rejects non-UUID org_id', () => {
    expect(() =>
      PendingApprovalsInputSchema.parse({ org_id: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => PendingApprovalsInputSchema.parse({})).toThrow();
  });

  it('rejects null org_id', () => {
    expect(() =>
      PendingApprovalsInputSchema.parse({ org_id: null }),
    ).toThrow();
  });
});
