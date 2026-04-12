import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';

// Test-local UUIDs in a distinctive range. Cleaned up in afterAll.
const TEST_TRACE_ID = '99999999-9999-9999-9999-999999999999';
const TEST_IDS = {
  vendor_holding: '99990001-0000-0000-0000-000000000001',
  vendor_real_estate: '99990001-0000-0000-0000-000000000002',
  je_holding: '99990002-0000-0000-0000-000000000001',
  je_real_estate: '99990002-0000-0000-0000-000000000002',
  audit_holding: '99990003-0000-0000-0000-000000000001',
  audit_real_estate: '99990003-0000-0000-0000-000000000002',
  ai_holding: '99990004-0000-0000-0000-000000000001',
  ai_real_estate: '99990004-0000-0000-0000-000000000002',
} as const;

describe('Integration Test 3: RLS isolates orgs (table-parameterized)', () => {
  let apClient: SupabaseClient;

  beforeAll(async () => {
    const db = adminClient();

    // Get open fiscal period IDs from seed (auto-generated UUIDs)
    const { data: holdingPeriod } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .limit(1)
      .single();
    if (!holdingPeriod) throw new Error('No open fiscal period for holding company');

    const { data: rePeriod } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('is_locked', false)
      .limit(1)
      .single();
    if (!rePeriod) throw new Error('No open fiscal period for real estate');

    // --- Insert one row per (table, org) for empty tables ---

    // vendors
    const { error: vendorErr } = await db.from('vendors').insert([
      { vendor_id: TEST_IDS.vendor_holding, org_id: SEED.ORG_HOLDING, name: 'TEST RLS Vendor Holding' },
      { vendor_id: TEST_IDS.vendor_real_estate, org_id: SEED.ORG_REAL_ESTATE, name: 'TEST RLS Vendor RE' },
    ]);
    if (vendorErr) throw new Error(`Failed to insert vendors: ${vendorErr.message}`);

    // journal_entries — use dynamic entry_number to avoid collisions
    // with any prior test file's committed entries (Test 5 may run before us)
    const { data: maxHolding } = await db
      .from('journal_entries')
      .select('entry_number')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('fiscal_period_id', holdingPeriod.period_id)
      .order('entry_number', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const { data: maxRE } = await db
      .from('journal_entries')
      .select('entry_number')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('fiscal_period_id', rePeriod.period_id)
      .order('entry_number', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const { error: jeErr } = await db.from('journal_entries').insert([
      {
        journal_entry_id: TEST_IDS.je_holding,
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: holdingPeriod.period_id,
        entry_date: '2026-01-01',
        description: 'TEST RLS Holding',
        source: 'manual',
        entry_number: (maxHolding?.entry_number ?? 0) + 1,
      },
      {
        journal_entry_id: TEST_IDS.je_real_estate,
        org_id: SEED.ORG_REAL_ESTATE,
        fiscal_period_id: rePeriod.period_id,
        entry_date: '2026-01-01',
        description: 'TEST RLS Real Estate',
        source: 'manual',
        entry_number: (maxRE?.entry_number ?? 0) + 1,
      },
    ]);
    if (jeErr) throw new Error(`Failed to insert journal_entries: ${jeErr.message}`);

    // audit_log (no FK to journal_entries — entity_id is a plain UUID)
    const { error: auditErr } = await db.from('audit_log').insert([
      {
        audit_log_id: TEST_IDS.audit_holding,
        org_id: SEED.ORG_HOLDING,
        trace_id: TEST_TRACE_ID,
        action: 'test.rls.holding',
        entity_type: 'test',
      },
      {
        audit_log_id: TEST_IDS.audit_real_estate,
        org_id: SEED.ORG_REAL_ESTATE,
        trace_id: TEST_TRACE_ID,
        action: 'test.rls.real_estate',
        entity_type: 'test',
      },
    ]);
    if (auditErr) throw new Error(`Failed to insert audit_log: ${auditErr.message}`);

    // ai_actions — RLS is (user_id = auth.uid() OR user_is_controller(org_id)).
    // AP Specialist is not a controller, so user_id must match for "can read own org".
    // Holding company row uses controller's user_id so AP Specialist can't see it.
    const { error: aiErr } = await db.from('ai_actions').insert([
      {
        ai_action_id: TEST_IDS.ai_holding,
        org_id: SEED.ORG_HOLDING,
        user_id: SEED.USER_CONTROLLER,
        trace_id: TEST_TRACE_ID,
        tool_name: 'test_rls',
        idempotency_key: TEST_IDS.ai_holding,
      },
      {
        ai_action_id: TEST_IDS.ai_real_estate,
        org_id: SEED.ORG_REAL_ESTATE,
        user_id: SEED.USER_AP_SPECIALIST,
        trace_id: TEST_TRACE_ID,
        tool_name: 'test_rls',
        idempotency_key: TEST_IDS.ai_real_estate,
      },
    ]);
    if (aiErr) throw new Error(`Failed to insert ai_actions: ${aiErr.message}`);

    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
  });

  afterAll(async () => {
    const db = adminClient();
    // Delete in safe order (ai_actions has nullable FK to journal_entries)
    await db.from('ai_actions').delete().in(
      'ai_action_id', [TEST_IDS.ai_holding, TEST_IDS.ai_real_estate],
    );
    await db.from('audit_log').delete().in(
      'audit_log_id', [TEST_IDS.audit_holding, TEST_IDS.audit_real_estate],
    );
    await db.from('journal_entries').delete().in(
      'journal_entry_id', [TEST_IDS.je_holding, TEST_IDS.je_real_estate],
    );
    await db.from('vendors').delete().in(
      'vendor_id', [TEST_IDS.vendor_holding, TEST_IDS.vendor_real_estate],
    );
  });

  // --- Parameterized RLS isolation tests ---
  // Six tenant-scoped tables, each tested for cross-org read blocking
  // and same-org read access. journal_lines and journal_entry_attachments
  // excluded — both are tenant-scoped via parent-table RLS inheritance
  // (journal_entries.org_id), so their isolation is transitively verified
  // by the journal_entries test here.

  describe.each([
    'chart_of_accounts',
    'journal_entries',
    'fiscal_periods',
    'vendors',
    'audit_log',
    'ai_actions',
  ] as const)('RLS isolates %s across orgs', (tableName) => {
    it('AP Specialist cannot read holding company rows', async () => {
      const { data, error } = await apClient
        .from(tableName)
        .select('*')
        .eq('org_id', SEED.ORG_HOLDING);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('AP Specialist CAN read their own org rows', async () => {
      const { data, error } = await apClient
        .from(tableName)
        .select('*')
        .eq('org_id', SEED.ORG_REAL_ESTATE);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });
  });
});
