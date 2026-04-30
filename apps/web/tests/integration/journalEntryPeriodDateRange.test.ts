// tests/integration/journalEntryPeriodDateRange.test.ts
// CA-27 (S26 QW-03 / UF-004): entry_date must fall within the
// supplied fiscal_period's [start_date, end_date]. Closes the
// period-lock-bypass-via-mismatched-fiscal_period_id surface.
//
// Two layers verified:
//   - Service layer: journalEntryService.post() raises
//     ServiceError('PERIOD_DATE_OUT_OF_RANGE', ...).
//   - DB layer: trg_journal_entry_period_range trigger raises
//     check_violation on direct INSERT bypassing the service.

import { describe, it, expect, beforeAll } from 'vitest';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { ServiceError } from '@/services/errors/ServiceError';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-27: journal entry period date-range enforcement', () => {
  const db = adminClient();
  let periodId: string;
  let periodStart: string;
  let periodEnd: string;
  let cashId: string;
  let rentId: string;

  beforeAll(async () => {
    const { data: openPeriod } = await db
      .from('fiscal_periods')
      .select('period_id, start_date, end_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();

    periodId = openPeriod!.period_id;
    periodStart = openPeriod!.start_date;
    periodEnd = openPeriod!.end_date;

    const { data: cash } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();
    cashId = cash!.account_id;

    const { data: rent } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '4000')
      .single();
    rentId = rent!.account_id;
  });

  function dayBefore(date: string): string {
    const d = new Date(date + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  function dayAfter(date: string): string {
    const d = new Date(date + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  it('service: entry_date before start_date → ServiceError(PERIOD_DATE_OUT_OF_RANGE)', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const beforeStart = dayBefore(periodStart);

    await expect(
      journalEntryService.post(
        {
          org_id: SEED.ORG_HOLDING,
          fiscal_period_id: periodId,
          entry_date: beforeStart,
          description: 'CA-27 before-start',
          idempotency_key: crypto.randomUUID(),
          source: 'manual',
          lines: [
            { account_id: cashId, debit_amount: '10.0000', credit_amount: '0.0000', currency: 'CAD', amount_original: '10.0000', amount_cad: '10.0000', fx_rate: '1.00000000' },
            { account_id: rentId, debit_amount: '0.0000', credit_amount: '10.0000', currency: 'CAD', amount_original: '10.0000', amount_cad: '10.0000', fx_rate: '1.00000000' },
          ],
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'PERIOD_DATE_OUT_OF_RANGE',
    });
  });

  it('service: entry_date after end_date → ServiceError(PERIOD_DATE_OUT_OF_RANGE)', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const afterEnd = dayAfter(periodEnd);

    await expect(
      journalEntryService.post(
        {
          org_id: SEED.ORG_HOLDING,
          fiscal_period_id: periodId,
          entry_date: afterEnd,
          description: 'CA-27 after-end',
          idempotency_key: crypto.randomUUID(),
          source: 'manual',
          lines: [
            { account_id: cashId, debit_amount: '10.0000', credit_amount: '0.0000', currency: 'CAD', amount_original: '10.0000', amount_cad: '10.0000', fx_rate: '1.00000000' },
            { account_id: rentId, debit_amount: '0.0000', credit_amount: '10.0000', currency: 'CAD', amount_original: '10.0000', amount_cad: '10.0000', fx_rate: '1.00000000' },
          ],
        },
        ctx,
      ),
    ).rejects.toThrow(ServiceError);
  });

  it('DB trigger: direct INSERT with out-of-range entry_date raises check_violation', async () => {
    const beforeStart = dayBefore(periodStart);

    const { error } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: beforeStart,
        description: 'CA-27 db-trigger test',
        source: 'manual',
        source_system: 'manual',
        entry_number: Date.now() % 1_000_000,
        created_by: SEED.USER_CONTROLLER,
        idempotency_key: crypto.randomUUID(),
      });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/outside fiscal period/i);
  });

  it('on-boundary dates pass (start_date and end_date inclusive)', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // start_date boundary
    await expect(
      journalEntryService.post(
        {
          org_id: SEED.ORG_HOLDING,
          fiscal_period_id: periodId,
          entry_date: periodStart,
          description: 'CA-27 boundary-start',
          idempotency_key: crypto.randomUUID(),
          source: 'manual',
          lines: [
            { account_id: cashId, debit_amount: '5.0000', credit_amount: '0.0000', currency: 'CAD', amount_original: '5.0000', amount_cad: '5.0000', fx_rate: '1.00000000' },
            { account_id: rentId, debit_amount: '0.0000', credit_amount: '5.0000', currency: 'CAD', amount_original: '5.0000', amount_cad: '5.0000', fx_rate: '1.00000000' },
          ],
        },
        ctx,
      ),
    ).resolves.toMatchObject({ journal_entry_id: expect.any(String) });

    // end_date boundary
    await expect(
      journalEntryService.post(
        {
          org_id: SEED.ORG_HOLDING,
          fiscal_period_id: periodId,
          entry_date: periodEnd,
          description: 'CA-27 boundary-end',
          idempotency_key: crypto.randomUUID(),
          source: 'manual',
          lines: [
            { account_id: cashId, debit_amount: '5.0000', credit_amount: '0.0000', currency: 'CAD', amount_original: '5.0000', amount_cad: '5.0000', fx_rate: '1.00000000' },
            { account_id: rentId, debit_amount: '0.0000', credit_amount: '5.0000', currency: 'CAD', amount_original: '5.0000', amount_cad: '5.0000', fx_rate: '1.00000000' },
          ],
        },
        ctx,
      ),
    ).resolves.toMatchObject({ journal_entry_id: expect.any(String) });
  });
});
