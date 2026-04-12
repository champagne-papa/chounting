import { describe, it, expect } from 'vitest';
import { userClientFor, SEED } from '../setup/testDb';

describe('Integration Test 3: RLS isolates orgs', () => {
  it('AP Specialist cannot SELECT data from the Holding Co', async () => {
    const apClient = await userClientFor(
      'ap@thebridge.local',
      'DevSeed!ApSpec#1'
    );

    const { data, error } = await apClient
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING);

    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: rentData, error: rentError } = await apClient
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE);

    expect(rentError).toBeNull();
    expect(rentData!.length).toBeGreaterThan(0);
  });
});