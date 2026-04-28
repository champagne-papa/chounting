// tests/integration/journalLinesCrossOrgAccount.test.ts
// CA-28 (S26 QW-05 / UF-005): journal_lines.account_id's org_id
// must match the parent journal_entries.org_id. The simple FK at
// initial schema line 223 doesn't constrain this; the trigger
// trg_journal_line_account_org (BEFORE INSERT OR UPDATE) does.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-28: journal_lines cross-org account-id guard', () => {
  const db = adminClient();
  let entryIdHolding: string;
  let cashHolding: string;
  let rentHolding: string;
  let cashRealEstate: string;

  beforeAll(async () => {
    // Resolve account IDs from each org's seeded CoA.
    const { data: cH } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();
    cashHolding = cH!.account_id;

    const { data: rH } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '4000')
      .single();
    rentHolding = rH!.account_id;

    const { data: cRE } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '1000')
      .single();
    cashRealEstate = cRE!.account_id;

    // Seed a journal entry on ORG_HOLDING we'll attach lines to.
    const { data: openPeriod } = await db
      .from('fiscal_periods')
      .select('period_id, start_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();

    const { data: entry, error: entryErr } = await db
      .from('journal_entries')
      .insert({
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: openPeriod!.period_id,
        entry_date: openPeriod!.start_date,
        description: 'CA-28 cross-org-account seed',
        source: 'manual',
        source_system: 'manual',
        entry_number: Date.now() % 1_000_000,
        created_by: SEED.USER_CONTROLLER,
        idempotency_key: crypto.randomUUID(),
      })
      .select('journal_entry_id')
      .single();

    if (entryErr) throw entryErr;
    entryIdHolding = entry!.journal_entry_id;
  });

  it('INSERT with foreign-org account_id raises foreign_key_violation', async () => {
    // Parent entry is in ORG_HOLDING; account_id belongs to ORG_REAL_ESTATE.
    const { error } = await db
      .from('journal_lines')
      .insert({
        journal_entry_id: entryIdHolding,
        account_id: cashRealEstate,
        debit_amount: '50.0000',
        credit_amount: '0.0000',
        currency: 'CAD',
        amount_original: '50.0000',
        amount_cad: '50.0000',
        fx_rate: '1.00000000',
      });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/belongs to org/i);
  });

  it('INSERT with same-org account_id succeeds', async () => {
    const { error } = await db
      .from('journal_lines')
      .insert([
        {
          journal_entry_id: entryIdHolding,
          account_id: cashHolding,
          debit_amount: '25.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '25.0000',
          amount_cad: '25.0000',
          fx_rate: '1.00000000',
        },
        {
          journal_entry_id: entryIdHolding,
          account_id: rentHolding,
          debit_amount: '0.0000',
          credit_amount: '25.0000',
          currency: 'CAD',
          amount_original: '25.0000',
          amount_cad: '25.0000',
          fx_rate: '1.00000000',
        },
      ]);

    expect(error).toBeNull();
  });

  // UPDATE coverage: the immutability triggers (Section A) reject any
  // UPDATE on journal_lines before the cross-org trigger fires. Trigger
  // order: trg_journal_lines_no_update fires first (BEFORE UPDATE FOR
  // EACH ROW) and raises append-only exception. The cross-org trigger's
  // BEFORE INSERT OR UPDATE coverage is belt-and-suspenders for a future
  // schema change that loosens UPDATE on journal_lines (e.g., a soft-
  // delete column). We assert here that UPDATE today is rejected, which
  // satisfies either layer of defense — the test does not distinguish
  // which trigger fires; both layers protect the invariant.
  it('UPDATE attempt is rejected (either by immutability or by cross-org trigger)', async () => {
    const { error } = await db
      .from('journal_lines')
      .update({ account_id: cashRealEstate })
      .eq('journal_entry_id', entryIdHolding);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/append-only|forbidden|belongs to org/i);
  });
});
