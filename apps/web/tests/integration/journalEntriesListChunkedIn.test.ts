// tests/integration/journalEntriesListChunkedIn.test.ts
// Phase 1.2 Session 8 Commit 5 Part 2 — regression test for the
// PostgREST URI-too-long bug in journalEntryService.list's .in()
// queries. Root cause: Step 2 (journal_lines) and Step 4
// (reverses_journal_entry_id) used .in('col', entryIds) without
// chunking, so orgs with 200+ entries produced URL query strings
// >7KB, triggering HTTP 414 and a service-layer READ_FAILED.
//
// Fix (C5 Part 2): chunk() helper + IN_QUERY_CHUNK_SIZE=100 loop
// around both .in() queries. This test seeds 150 balanced entries
// (150 > 100 = exercises the chunking path) and asserts:
//   (a) list() returns all 150 rows (would fail if chunking
//       dropped or double-counted any chunk).
//   (b) Every returned row has correctly aggregated totals
//       (would fail if line-aggregation ran on a partial
//       chunk — e.g., first 100 rows OK, last 50 show
//       total_debit='0.0000').

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { journalEntryService } from '@/services/accounting/journalEntryService';

const ENTRY_COUNT = 150; // > IN_QUERY_CHUNK_SIZE (100)
const TEST_DESC = 'C5-CHUNK-TEST';

describe('CA-S8-C5: journalEntryService.list chunks large .in() queries', () => {
  const db = adminClient();
  const seededEntryIds: string[] = [];

  beforeAll(async () => {
    // Resolve a fiscal period + two accounts on ORG_REAL_ESTATE.
    // Using ORG_REAL_ESTATE to avoid polluting ORG_HOLDING (which
    // has UX consequences for manual testing of the HoldingCo 500).
    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('is_locked', false)
      .limit(1)
      .single();
    if (!period) throw new Error('no open fiscal period on ORG_REAL_ESTATE');

    const { data: debitAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '1000')
      .single();
    const { data: creditAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '4000')
      .single();
    if (!debitAcct || !creditAcct) throw new Error('seed accounts missing on ORG_REAL_ESTATE');

    // Find next entry_number to avoid UNIQUE(org_id, entry_number) collision.
    const { data: maxRow } = await db
      .from('journal_entries')
      .select('entry_number')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .order('entry_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextNumStart = (maxRow?.entry_number ?? 0) + 1;

    // Bulk insert ENTRY_COUNT journal_entries (no lines yet — the
    // deferred balance trigger only fires on journal_lines
    // mutations, so insertions here don't trip it).
    const entryRows = Array.from({ length: ENTRY_COUNT }, (_, i) => ({
      org_id: SEED.ORG_REAL_ESTATE,
      fiscal_period_id: period.period_id,
      entry_number: nextNumStart + i,
      entry_date: new Date().toISOString().slice(0, 10),
      description: `${TEST_DESC} #${i}`,
      source: 'manual',
      source_system: 'manual',
    }));
    const { data: inserted, error: insertErr } = await db
      .from('journal_entries')
      .insert(entryRows)
      .select('journal_entry_id');
    if (insertErr) throw new Error(`entry insert: ${insertErr.message}`);
    for (const row of inserted ?? []) seededEntryIds.push(row.journal_entry_id as string);
    if (seededEntryIds.length !== ENTRY_COUNT) {
      throw new Error(`expected ${ENTRY_COUNT} entries inserted, got ${seededEntryIds.length}`);
    }

    // Bulk insert balanced lines (2 per entry). Single INSERT
    // statement → single transaction → deferred balance trigger
    // fires at commit and sees all lines balanced per entry.
    const lineRows = seededEntryIds.flatMap((entryId) => [
      {
        journal_entry_id: entryId,
        account_id: debitAcct.account_id,
        debit_amount: '100.0000',
        credit_amount: '0.0000',
        currency: 'CAD',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        fx_rate: '1.00000000',
      },
      {
        journal_entry_id: entryId,
        account_id: creditAcct.account_id,
        debit_amount: '0.0000',
        credit_amount: '100.0000',
        currency: 'CAD',
        amount_original: '100.0000',
        amount_cad: '100.0000',
        fx_rate: '1.00000000',
      },
    ]);
    const { error: lineErr } = await db.from('journal_lines').insert(lineRows);
    if (lineErr) throw new Error(`line insert: ${lineErr.message}`);
  });

  afterAll(async () => {
    // ON DELETE CASCADE on journal_lines.journal_entry_id handles
    // line cleanup automatically. Delete entries in chunks to
    // avoid the same URI-too-long we're fixing.
    const CHUNK = 100;
    for (let i = 0; i < seededEntryIds.length; i += CHUNK) {
      const slice = seededEntryIds.slice(i, i + CHUNK);
      if (slice.length === 0) continue;
      await db.from('journal_entries').delete().in('journal_entry_id', slice);
    }
  });

  it('returns all 150 seeded entries with correctly aggregated totals (exercises chunked .in() loops)', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_REAL_ESTATE],
    });
    const rows = await journalEntryService.list(
      { org_id: SEED.ORG_REAL_ESTATE, fiscal_period_id: undefined },
      ctx,
    );

    const seededSet = new Set(seededEntryIds);
    const ours = rows.filter((r) => seededSet.has(r.journal_entry_id));

    // Assertion (a): all 150 seeded entries come back.
    expect(ours).toHaveLength(ENTRY_COUNT);

    // Assertion (b): every seeded row has its totals aggregated
    // correctly. A zero total on any row would indicate the
    // corresponding journal_lines chunk was dropped — the exact
    // shape of the pre-fix bug.
    for (const row of ours) {
      expect(row.total_debit).toBe('100.0000');
      expect(row.total_credit).toBe('100.0000');
    }

    // Assertion (c): reversed_by is null for all seeded rows
    // (none were reversed). Exercises the Step 4 chunked path
    // without forcing a reverse-entry seed.
    for (const row of ours) {
      expect(row.reversed_by).toBeNull();
    }
  });
});
