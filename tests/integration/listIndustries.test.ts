// tests/integration/listIndustries.test.ts
// Category B test CB-01: listIndustries callable by any authenticated
// user regardless of org membership.

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';
import { orgService } from '@/services/org/orgService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CB-01: listIndustries callable by any authenticated user', () => {
  it('returns the seed list filtered to is_active=true', async () => {
    // Construct a ServiceContext for a user with ZERO org memberships.
    const ctx: ServiceContext = {
      trace_id: crypto.randomUUID(),
      caller: {
        verified: true,
        user_id: '00000000-0000-0000-0000-000000000099',
        email: 'nobody@example.com',
        org_ids: [],
      },
      locale: 'en',
    };

    const result = await orgService.listIndustries({}, ctx);

    expect(result.industries.length).toBeGreaterThanOrEqual(25);
    expect(result.industries.every((i: { is_active: boolean }) => i.is_active)).toBe(true);

    // Verify sort order
    for (let i = 1; i < result.industries.length; i++) {
      const prev = result.industries[i - 1] as { sort_order: number; display_name: string };
      const curr = result.industries[i] as { sort_order: number; display_name: string };
      expect(prev.sort_order <= curr.sort_order).toBe(true);
    }
  });

  it('does not expose the default_coa_template_industry bridge column', async () => {
    const ctx: ServiceContext = {
      trace_id: crypto.randomUUID(),
      caller: {
        verified: true,
        user_id: '00000000-0000-0000-0000-000000000099',
        email: 'nobody@example.com',
        org_ids: [],
      },
      locale: 'en',
    };

    const result = await orgService.listIndustries({}, ctx);
    const first = result.industries[0] as Record<string, unknown>;
    expect('default_coa_template_industry' in first).toBe(false);
  });
});
