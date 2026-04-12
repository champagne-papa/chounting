import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Integration Test 2: locked period trigger rejects writes', () => {
  it('rejects a journal_lines insert if the fiscal period is locked', async () => {
    const db = adminClient();

    const { data: lockedPeriod } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('is_locked', true)
      .single();

    expect(lockedPeriod).not.toBeNull();

    const { data: cashAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '1000')
      .single();

    const { data: rentAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '4000')
      .single();

    const { error } = await db.rpc('test_post_balanced_entry', {
      p_org_id: SEED.ORG_REAL_ESTATE,
      p_period_id: lockedPeriod!.period_id,
      p_debit_account: cashAcct!.account_id,
      p_credit_account: rentAcct!.account_id,
      p_amount: 500,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/locked fiscal period/i);
  });
});