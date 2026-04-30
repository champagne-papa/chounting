// tests/integration/chartOfAccountsServiceCrossOrg.test.ts
// CA-23 (S25 QW-02 / UF-002): cross-org access guard on
// chartOfAccountsService.get(). Caller's org_ids must include
// input.org_id; otherwise ServiceError('ORG_ACCESS_DENIED').
// Mirrors the existing list() pattern at chartOfAccountsService.ts:20-25.

import { describe, it, expect } from 'vitest';
import { chartOfAccountsService } from '@/services/accounting/chartOfAccountsService';
import { ServiceError } from '@/services/errors/ServiceError';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-23: chartOfAccountsService.get cross-org guard', () => {
  it('throws ORG_ACCESS_DENIED when caller lacks membership in input.org_id', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    await expect(
      chartOfAccountsService.get(
        { account_id: '00000000-0000-0000-0000-000000000000', org_id: SEED.ORG_REAL_ESTATE },
        ctx,
      ),
    ).rejects.toThrow(ServiceError);

    await expect(
      chartOfAccountsService.get(
        { account_id: '00000000-0000-0000-0000-000000000000', org_id: SEED.ORG_REAL_ESTATE },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'ORG_ACCESS_DENIED',
      message: expect.stringContaining(SEED.ORG_REAL_ESTATE),
    });
  });

  it('returns the account when caller has membership in input.org_id', async () => {
    const db = adminClient();
    const { data: anyAccount } = await db
      .from('chart_of_accounts')
      .select('account_id, org_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .limit(1)
      .single();

    expect(anyAccount).not.toBeNull();

    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const result = await chartOfAccountsService.get(
      { account_id: anyAccount!.account_id, org_id: SEED.ORG_HOLDING },
      ctx,
    );

    expect(result.account_id).toBe(anyAccount!.account_id);
    expect(result.org_id).toBe(SEED.ORG_HOLDING);
  });

  it('throws NOT_FOUND when account_id exists but in a different org than input.org_id', async () => {
    // Defense-in-depth: if a caller has membership in BOTH orgs and
    // passes a foreign-org account_id with their own org_id, the
    // post-fetch (account_id, org_id) constraint catches it.
    const db = adminClient();
    const { data: foreignAccount } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .limit(1)
      .single();

    expect(foreignAccount).not.toBeNull();

    const ctx = makeTestContext({
      org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
    });

    await expect(
      chartOfAccountsService.get(
        { account_id: foreignAccount!.account_id, org_id: SEED.ORG_HOLDING },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
