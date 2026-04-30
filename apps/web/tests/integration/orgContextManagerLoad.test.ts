// tests/integration/orgContextManagerLoad.test.ts
// CA-53: loadOrgContext(SEED.ORG_HOLDING) returns the full
// master §8 OrgContext shape with real data joined from
// organizations + industries + fiscal_periods + memberships +
// user_profiles.

import { describe, it, expect } from 'vitest';
import { loadOrgContext } from '@/agent/memory/orgContextManager';
import { SEED } from '../setup/testDb';

describe('CA-53: loadOrgContext returns full master §8 shape', () => {
  it('returns all 11 fields, with fiscal_periods non-empty and controllers including the seed controller', async () => {
    const ctx = await loadOrgContext(SEED.ORG_HOLDING);

    // Scalar fields
    expect(ctx.org_id).toBe(SEED.ORG_HOLDING);
    expect(typeof ctx.org_name).toBe('string');
    expect(ctx.org_name.length).toBeGreaterThan(0);
    // legal_name may be null for some orgs but seed sets it
    expect(ctx.legal_name).not.toBeNull();
    expect(typeof ctx.industry_display_name).toBe('string');
    expect(ctx.industry_display_name.length).toBeGreaterThan(0);
    expect(ctx.functional_currency).toBe('CAD');
    expect(ctx.fiscal_year_start_month).toBeGreaterThanOrEqual(1);
    expect(ctx.fiscal_year_start_month).toBeLessThanOrEqual(12);

    // Fiscal periods — seed inserts at least one
    expect(Array.isArray(ctx.fiscal_periods)).toBe(true);
    expect(ctx.fiscal_periods.length).toBeGreaterThan(0);
    for (const p of ctx.fiscal_periods) {
      expect(typeof p.fiscal_period_id).toBe('string');
      expect(typeof p.period_name).toBe('string');
      expect(p.starts_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.ends_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof p.is_current).toBe('boolean');
      expect(typeof p.is_locked).toBe('boolean');
    }

    // Controllers — seed has USER_CONTROLLER as an active controller
    // with display_name 'Controller User'.
    expect(Array.isArray(ctx.controllers)).toBe(true);
    const userIds = ctx.controllers.map((c) => c.user_id);
    expect(userIds).toContain(SEED.USER_CONTROLLER);
    const controllerRecord = ctx.controllers.find(
      (c) => c.user_id === SEED.USER_CONTROLLER,
    );
    expect(controllerRecord?.display_name).toBe('Controller User');

    // Phase 2 reservations — empty arrays
    expect(ctx.vendor_rules).toEqual([]);
    expect(ctx.intercompany_relationships).toEqual([]);
    expect(ctx.approval_rules).toEqual([]);
  });

  it('throws ORG_NOT_FOUND for an unknown org_id', async () => {
    const fake = '99999999-9999-9999-9999-999999999999';
    await expect(loadOrgContext(fake)).rejects.toThrow(/ORG_NOT_FOUND/);
  });
});
