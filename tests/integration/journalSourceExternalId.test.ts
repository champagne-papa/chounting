// tests/integration/journalSourceExternalId.test.ts
// Category B test CB-05: partial unique index on
// (org_id, source_system, source_external_id) WHERE
// source_external_id IS NOT NULL.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CB-05: journal_entries source_system + source_external_id partial unique index', () => {
  const db = adminClient();
  let periodId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .limit(1)
      .single();
    periodId = period!.period_id;
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await db.from('journal_entries').delete().in('journal_entry_id', createdIds);
    }
  });

  async function nextEntryNumber(): Promise<number> {
    const { data } = await db
      .from('journal_entries')
      .select('entry_number')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('fiscal_period_id', periodId)
      .order('entry_number', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    return (data?.entry_number ?? 0) + 1;
  }

  it('rejects duplicate (org_id, source_system, source_external_id) when source_external_id IS NOT NULL', async () => {
    // First insert — should succeed.
    const { data: e1, error: err1 } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: '2026-01-15',
        description: 'CB-05 Stripe first',
        source: 'import',
        source_system: 'stripe',
        source_external_id: 'ch_UNIQUE123',
        entry_number: await nextEntryNumber(),
      })
      .select('journal_entry_id')
      .single();
    expect(err1).toBeNull();
    createdIds.push(e1!.journal_entry_id);

    // Duplicate triple — should reject.
    const { error: err2 } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: '2026-01-16',
        description: 'CB-05 Stripe dup',
        source: 'import',
        source_system: 'stripe',
        source_external_id: 'ch_UNIQUE123',
        entry_number: await nextEntryNumber(),
      });
    expect(err2).not.toBeNull();
    expect(err2!.message).toMatch(/unique|duplicate/i);
  });

  it('allows multiple entries with source_external_id = NULL', async () => {
    const { data: e2, error: err2 } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: '2026-01-17',
        description: 'CB-05 manual null 1',
        source: 'manual',
        source_system: 'manual',
        source_external_id: null,
        entry_number: await nextEntryNumber(),
      })
      .select('journal_entry_id')
      .single();
    expect(err2).toBeNull();
    createdIds.push(e2!.journal_entry_id);

    const { data: e3, error: err3 } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: '2026-01-18',
        description: 'CB-05 manual null 2',
        source: 'manual',
        source_system: 'manual',
        source_external_id: null,
        entry_number: await nextEntryNumber(),
      })
      .select('journal_entry_id')
      .single();
    expect(err3).toBeNull();
    createdIds.push(e3!.journal_entry_id);
  });

  it('allows same source_external_id across different source_system values', async () => {
    const { data: e4, error: err4 } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: '2026-01-19',
        description: 'CB-05 xero same ext-id',
        source: 'import',
        source_system: 'xero_migration',
        source_external_id: 'ch_UNIQUE123',
        entry_number: await nextEntryNumber(),
      })
      .select('journal_entry_id')
      .single();
    expect(err4).toBeNull();
    createdIds.push(e4!.journal_entry_id);
  });
});
