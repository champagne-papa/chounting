import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Integration Test 1: deferred constraint rejects unbalanced entry', () => {
  it('rejects an entry whose debits do not equal credits at COMMIT', async () => {
    const db = adminClient();

    const { data: cashAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();

    const { data: feesAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '5000')
      .single();

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    const { error } = await db.rpc('test_post_unbalanced_entry', {
      p_org_id: SEED.ORG_HOLDING,
      p_period_id: period!.period_id,
      p_debit_account: feesAcct!.account_id,
      p_credit_account: cashAcct!.account_id,
      p_debit_amount: 100,
      p_credit_amount: 90,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/not balanced/i);
  });
});