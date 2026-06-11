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
  // Per-run unique suffix so rows accumulating across test runs don't
  // collide on the partial unique index. S26 (UF-001) made
  // journal_entries append-only at the DB layer; afterAll cleanup via
  // DELETE no longer succeeds (trigger rejects), so each run must
  // generate fresh source_external_id values.
  const RUN_SUFFIX = crypto.randomUUID().slice(0, 8);
  const stripeId = `ch_UNIQUE-${RUN_SUFFIX}`;

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
    // S26 (UF-001) journal_entries is append-only — DELETE cleanup
    // is rejected by trg_journal_entries_no_delete. Rows accumulate
    // across test runs; per-run unique source_external_id values
    // (RUN_SUFFIX above) prevent unique-key collisions on subsequent
    // runs. The createdIds array is preserved for diagnostic purposes
    // only; no cleanup attempted.
    void createdIds;
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
        source_external_id: stripeId,
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
        source_external_id: stripeId,
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
        source_external_id: stripeId,
        entry_number: await nextEntryNumber(),
      })
      .select('journal_entry_id')
      .single();
    expect(err4).toBeNull();
    createdIds.push(e4!.journal_entry_id);
  });
});

// =====================================================================
// Wave 6 D3 T1 — write_journal_entry_atomic carries source_external_id
// (migration 20240175; brief D-4.5). The RPC path is what the human
// approve→post drives; these tests prove the column reaches the row
// through the RPC (it was absent from the 20240134 INSERT list) and
// that the partial unique index binds on the RPC path.
// =====================================================================

describe('Wave 6 D3 T1: write_journal_entry_atomic source_external_id', () => {
  const db = adminClient();
  let periodId: string;
  const RUN_SUFFIX = crypto.randomUUID().slice(0, 8);

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

  function rpcPayload(
    description: string,
    source_external_id?: string,
  ): Record<string, unknown> {
    return {
      p_entry: {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: '2026-06-04',
        description,
        reference: null,
        source: 'manual',
        source_system: 'manual',
        ...(source_external_id !== undefined ? { source_external_id } : {}),
        entry_type: 'regular',
        created_by: SEED.USER_CONTROLLER,
      },
      // Zero lines: enforce_journal_entry_balance sums to 0 = 0 at
      // COMMIT — keeps the fixture minimal; line mechanics are owned
      // by the existing RPC rollback suite.
      p_lines: [],
      p_audit: {
        org_id: SEED.ORG_HOLDING,
        user_id: SEED.USER_CONTROLLER,
        trace_id: crypto.randomUUID(),
        action: 'journal_entry_posted',
        entity_type: 'journal_entry',
        before_state: null,
      },
    };
  }

  it('writes source_external_id through the RPC and the partial index binds on re-post', async () => {
    const extId = `dc_${RUN_SUFFIX}`; // shape: D3 sets document_case_id here

    const { data: first, error: err1 } = await db.rpc(
      'write_journal_entry_atomic',
      rpcPayload('D3-T1 RPC ext-id first', extId),
    );
    expect(err1).toBeNull();
    const firstId = (first as Array<{ journal_entry_id: string }>)[0]!
      .journal_entry_id;

    const { data: row, error: readErr } = await db
      .from('journal_entries')
      .select('source_external_id')
      .eq('journal_entry_id', firstId)
      .single();
    expect(readErr).toBeNull();
    expect(row!.source_external_id).toBe(extId);

    // Re-post with the same (org, 'manual', extId) triple → the
    // partial unique index rejects — the D3 double-post guard's
    // Layer-1 mechanism, now reachable from the RPC path.
    const { error: err2 } = await db.rpc(
      'write_journal_entry_atomic',
      rpcPayload('D3-T1 RPC ext-id dup', extId),
    );
    expect(err2).not.toBeNull();
    expect(err2!.message).toMatch(/idx_je_source_external|duplicate key/i);
  });

  it('omitted source_external_id stays NULL — pre-D3 callers unaffected (partial index skips)', async () => {
    const { data: a, error: errA } = await db.rpc(
      'write_journal_entry_atomic',
      rpcPayload('D3-T1 RPC null 1'),
    );
    expect(errA).toBeNull();
    const { data: b, error: errB } = await db.rpc(
      'write_journal_entry_atomic',
      rpcPayload('D3-T1 RPC null 2'),
    );
    expect(errB).toBeNull();

    const idA = (a as Array<{ journal_entry_id: string }>)[0]!.journal_entry_id;
    const { data: rowA } = await db
      .from('journal_entries')
      .select('source_external_id')
      .eq('journal_entry_id', idA)
      .single();
    expect(rowA!.source_external_id).toBeNull();
    void b;
  });

  it("empty-string source_external_id is NULLIF'd to NULL (never binds the unique triple)", async () => {
    const { data: e, error } = await db.rpc(
      'write_journal_entry_atomic',
      rpcPayload('D3-T1 RPC empty string', ''),
    );
    expect(error).toBeNull();
    const id = (e as Array<{ journal_entry_id: string }>)[0]!.journal_entry_id;
    const { data: row } = await db
      .from('journal_entries')
      .select('source_external_id')
      .eq('journal_entry_id', id)
      .single();
    expect(row!.source_external_id).toBeNull();
  });
});
