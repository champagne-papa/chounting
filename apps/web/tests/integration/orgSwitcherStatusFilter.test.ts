// tests/integration/orgSwitcherStatusFilter.test.ts
// Phase 1.2 Session 8 Commit 3 — OrgSwitcher status filter (P32).
//
// Verifies the query shape that OrgSwitcher.tsx:29-54 uses:
//   supabase.from('memberships')
//     .select('org_id, role, organizations(name)')
//     .eq('status', 'active')
//
// Root cause before C3: the query had no status filter, so users
// with historical non-active memberships (removed / suspended /
// invited-pre-acceptance) to the same org produced duplicate
// `org_id` values, which OrgSwitcher rendered with duplicate React
// keys (the :67 warning).
//
// Test shape per P32 + founder ruling 4: seed a `removed`-status
// membership for AP specialist on ORG_HOLDING (C2-verified seed
// reality: AP has no active membership on ORG_HOLDING, so this
// seed avoids the UNIQUE(user_id, org_id) constraint collision).
// Assert the status-filtered query returns zero rows for that
// user+org; assert the un-filtered query returns the one removed
// row (proves the filter is what's excluding it).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-S8-C3: OrgSwitcher memberships status filter', () => {
  const db = adminClient();

  beforeEach(async () => {
    // Clean up any stale seed rows from prior runs.
    await db
      .from('memberships')
      .delete()
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_HOLDING);
  });

  afterEach(async () => {
    // Remove the seeded removed-status row so AP's active
    // membership set returns to its canonical shape (AP on
    // ORG_REAL_ESTATE only).
    await db
      .from('memberships')
      .delete()
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_HOLDING);
  });

  it('status-filtered query excludes removed-status rows', async () => {
    // Step 1: look up role_id for ap_specialist (memberships.role_id
    // is NOT NULL per Phase 1.5C migration).
    const { data: role, error: roleErr } = await db
      .from('roles')
      .select('role_id')
      .eq('role_key', 'ap_specialist')
      .maybeSingle();
    if (roleErr || !role) throw new Error(`role lookup failed: ${roleErr?.message ?? 'no row'}`);

    // Step 2: seed a removed-status membership for AP on ORG_HOLDING.
    const { error: insertErr } = await db.from('memberships').insert({
      user_id: SEED.USER_AP_SPECIALIST,
      org_id: SEED.ORG_HOLDING,
      role: 'ap_specialist',
      role_id: role.role_id,
      status: 'removed',
    });
    if (insertErr) throw new Error(`seed insert failed: ${insertErr.message}`);

    // Step 3: un-filtered query returns the seeded row (proves
    // the row is really there).
    const { data: unfiltered } = await db
      .from('memberships')
      .select('org_id, role, status')
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_HOLDING);
    expect(unfiltered).toHaveLength(1);
    expect(unfiltered![0].status).toBe('removed');

    // Step 4: status-filtered query returns zero rows — the
    // status='active' filter correctly excludes the removed row.
    const { data: activeOnly } = await db
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', SEED.USER_AP_SPECIALIST)
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('status', 'active');
    expect(activeOnly).toEqual([]);
  });
});
