// tests/integration/parentOrgSelfFk.test.ts
// Category B test CB-04: parent_org_id self-FK behavior.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CB-04: parent_org_id self-FK', () => {
  const db = adminClient();
  const TEST_ORG_A = '99990604-aaaa-0000-0000-000000000001';
  const TEST_ORG_B = '99990604-bbbb-0000-0000-000000000001';

  afterAll(async () => {
    // Clear parent first to avoid FK cycle on delete order.
    await db.from('organizations').update({ parent_org_id: null }).in('org_id', [TEST_ORG_A, TEST_ORG_B]);
    await db.from('organizations').delete().in('org_id', [TEST_ORG_A, TEST_ORG_B]);
  });

  it('setup: create two test orgs', async () => {
    const { data: ind } = await db
      .from('industries')
      .select('industry_id')
      .eq('slug', 'holding_company')
      .single();

    const { error: e1 } = await db.from('organizations').insert({
      org_id: TEST_ORG_A, name: 'CB-04 Org A', industry: 'holding_company',
      industry_id: ind!.industry_id, business_structure: 'corporation',
    });
    expect(e1).toBeNull();

    const { error: e2 } = await db.from('organizations').insert({
      org_id: TEST_ORG_B, name: 'CB-04 Org B', industry: 'holding_company',
      industry_id: ind!.industry_id, business_structure: 'corporation',
    });
    expect(e2).toBeNull();
  });

  it('accepts parent_org_id = NULL', async () => {
    const { error } = await db
      .from('organizations')
      .update({ parent_org_id: null })
      .eq('org_id', TEST_ORG_A);
    expect(error).toBeNull();
  });

  it('accepts parent_org_id = a valid sibling org_id', async () => {
    const { error } = await db
      .from('organizations')
      .update({ parent_org_id: TEST_ORG_B })
      .eq('org_id', TEST_ORG_A);
    expect(error).toBeNull();
  });

  it('rejects parent_org_id = own org_id (CHECK org_parent_is_not_self)', async () => {
    const { error } = await db
      .from('organizations')
      .update({ parent_org_id: TEST_ORG_A })
      .eq('org_id', TEST_ORG_A);
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/org_parent_is_not_self|check/i);
  });

  it('rejects parent_org_id = non-existent UUID (FK violation)', async () => {
    const { error } = await db
      .from('organizations')
      .update({ parent_org_id: '00000000-0000-0000-0000-ffffffffffff' })
      .eq('org_id', TEST_ORG_A);
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/foreign key|violates/i);
  });
});
