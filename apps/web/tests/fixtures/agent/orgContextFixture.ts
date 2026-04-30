// tests/fixtures/agent/orgContextFixture.ts
// Phase 1.2 Session 4 — shared OrgContext fixture for tests
// that exercise buildSystemPrompt or any other code path that
// accepts an OrgContext. Keeps the master §8 shape in one
// place so test files don't need to repeat every field.
//
// Callers may override any field via the `overrides` argument.

import { SEED } from '../../setup/testDb';
import type { OrgContext } from '@/agent/memory/orgContextManager';

export function makeOrgContextFixture(overrides: Partial<OrgContext> = {}): OrgContext {
  return {
    org_id: SEED.ORG_HOLDING,
    org_name: 'Acme Holdings',
    legal_name: 'Acme Holdings Ltd.',
    industry_display_name: 'Holding Company',
    functional_currency: 'CAD',
    fiscal_year_start_month: 1,
    fiscal_periods: [
      {
        fiscal_period_id: '00000000-0000-0000-0000-0000000000f1',
        period_name: 'FY2026 Q1',
        starts_on: '2026-01-01',
        ends_on: '2026-03-31',
        is_current: false,
        is_locked: false,
      },
      {
        fiscal_period_id: '00000000-0000-0000-0000-0000000000f2',
        period_name: 'FY2026 Q2',
        starts_on: '2026-04-01',
        ends_on: '2026-06-30',
        is_current: true,
        is_locked: false,
      },
    ],
    controllers: [{ user_id: SEED.USER_CONTROLLER, display_name: 'Jamie Reeves' }],
    vendor_rules: [],
    intercompany_relationships: [],
    approval_rules: [],
    ...overrides,
  };
}
