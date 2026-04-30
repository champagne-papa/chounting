// tests/integration/industryForeignKey.test.ts
// Category A floor test CA-07: industry FK referential integrity.

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';

describe('CA-07: industry FK referential integrity', () => {
  const db = adminClient();
  const BOGUS_UUID = '00000000-0000-0000-0000-ffffffffffff';

  it('rejects an org insert with a non-existent industry_id', async () => {
    const { error } = await db.from('organizations').insert({
      name: 'Bogus Industry Org',
      industry: 'holding_company',
      industry_id: BOGUS_UUID,
      business_structure: 'corporation',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/foreign key|violates/i);
  });

  it('accepts an org insert with a valid industry_id', async () => {
    const { data: ind } = await db
      .from('industries')
      .select('industry_id')
      .eq('slug', 'holding_company')
      .single();

    const { data: org, error } = await db.from('organizations').insert({
      name: 'Valid Industry Org',
      industry: 'holding_company',
      industry_id: ind!.industry_id,
      business_structure: 'corporation',
    }).select('org_id').single();

    expect(error).toBeNull();
    expect(org).toBeTruthy();

    // Cleanup
    await db.from('organizations').delete().eq('org_id', org!.org_id);
  });
});
