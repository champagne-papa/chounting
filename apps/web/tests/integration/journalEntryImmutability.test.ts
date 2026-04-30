// tests/integration/journalEntryImmutability.test.ts
// CA-26 (S26 QW-04 / UF-001): journal_entries and journal_lines are
// append-only at the database layer. UPDATE, DELETE, and TRUNCATE
// from the service-role client (which bypasses RLS) all raise
// PG exceptions via the immutability triggers shipped at
// 20240133000000_journal_immutability_triggers.sql.
//
// RLS policies *_no_update / *_no_delete (initial schema lines
// 734-758) cover authenticated/anon roles via USING (false);
// the triggers below cover service_role.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-26: journal_entries / journal_lines immutability triggers', () => {
  const db = adminClient();
  let entryId: string;

  beforeAll(async () => {
    // Seed one journal entry + lines we can attempt to mutate.
    const { data: cashAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();

    const { data: rentAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '4000')
      .single();

    const { data: openPeriod } = await db
      .from('fiscal_periods')
      .select('period_id, start_date, end_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();

    const entryDate = openPeriod!.start_date;

    const { data: entry, error: entryErr } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: openPeriod!.period_id,
        entry_date: entryDate,
        description: 'CA-26 immutability seed entry',
        source: 'manual',
        source_system: 'manual',
        entry_number: Date.now() % 1_000_000,
        created_by: SEED.USER_CONTROLLER,
        idempotency_key: crypto.randomUUID(),
      })
      .select('journal_entry_id')
      .single();

    if (entryErr) throw entryErr;
    entryId = entry!.journal_entry_id;

    const { error: linesErr } = await db.from('journal_lines').insert([
      {
        journal_entry_id: entryId,
        account_id: cashAcct!.account_id,
        debit_amount: '100.0000',
        credit_amount: '0.0000',
        currency: 'CAD',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        fx_rate: '1.00000000',
      },
      {
        journal_entry_id: entryId,
        account_id: rentAcct!.account_id,
        debit_amount: '0.0000',
        credit_amount: '100.0000',
        currency: 'CAD',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        fx_rate: '1.00000000',
      },
    ]);
    if (linesErr) throw linesErr;
  });

  it('UPDATE on journal_entries raises immutability exception (service_role)', async () => {
    const { error } = await db
      .from('journal_entries')
      .update({ description: 'should not stick' })
      .eq('journal_entry_id', entryId);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/append-only|forbidden/i);
  });

  it('DELETE on journal_entries raises immutability exception (service_role)', async () => {
    const { error } = await db
      .from('journal_entries')
      .delete()
      .eq('journal_entry_id', entryId);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/append-only|forbidden/i);
  });

  it('UPDATE on journal_lines raises immutability exception (service_role)', async () => {
    const { error } = await db
      .from('journal_lines')
      .update({ debit_amount: '999.0000' })
      .eq('journal_entry_id', entryId);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/append-only|forbidden/i);
  });

  it('DELETE on journal_lines raises immutability exception (service_role)', async () => {
    const { error } = await db
      .from('journal_lines')
      .delete()
      .eq('journal_entry_id', entryId);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/append-only|forbidden/i);
  });

  // Note: TRUNCATE is not exercisable from PostgREST/Supabase JS
  // client — there's no .truncate() method. The trigger
  // trg_journal_entries_no_truncate / trg_journal_lines_no_truncate
  // (BEFORE TRUNCATE, FOR EACH STATEMENT) is verified by inspection
  // of the migration file; the REVOKE TRUNCATE block additionally
  // removes the privilege from authenticated/anon/PUBLIC. Direct
  // TRUNCATE coverage would require psql access, which is out of
  // scope for vitest integration tests. Documented here for the
  // next maintainer.
});
