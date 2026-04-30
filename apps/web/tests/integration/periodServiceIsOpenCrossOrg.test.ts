// tests/integration/periodServiceIsOpenCrossOrg.test.ts
// CA-24 (S25 QW-02 / UF-002): cross-org access guard on
// periodService.isOpen(). Caller's org_ids must include
// input.org_id; otherwise ServiceError('ORG_ACCESS_DENIED').
// Mirrors the existing listOpen() pattern at periodService.ts:29.

import { describe, it, expect } from 'vitest';
import { periodService } from '@/services/accounting/periodService';
import { ServiceError } from '@/services/errors/ServiceError';
import { makeTestContext } from '../setup/makeTestContext';
import { SEED } from '../setup/testDb';

describe('CA-24: periodService.isOpen cross-org guard', () => {
  it('throws ORG_ACCESS_DENIED when caller lacks membership in input.org_id', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    await expect(
      periodService.isOpen(
        { org_id: SEED.ORG_REAL_ESTATE, entry_date: '2026-04-15' },
        ctx,
      ),
    ).rejects.toThrow(ServiceError);

    await expect(
      periodService.isOpen(
        { org_id: SEED.ORG_REAL_ESTATE, entry_date: '2026-04-15' },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'ORG_ACCESS_DENIED',
      message: expect.stringContaining(SEED.ORG_REAL_ESTATE),
    });
  });

  it('returns the period (or null) when caller has membership in input.org_id', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Pick a date that is likely covered by a seeded period for
    // ORG_HOLDING; on no-period it returns null without error.
    const result = await periodService.isOpen(
      { org_id: SEED.ORG_HOLDING, entry_date: '2026-04-15' },
      ctx,
    );

    // Either a period object or null — both are non-error outcomes.
    expect(result === null || typeof result === 'object').toBe(true);
  });
});
