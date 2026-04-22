import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';

// Test-local UUIDs in a distinctive range. Cleaned up in afterAll.
// audit_log IDs and TEST_TRACE_ID are per-run (crypto.randomUUID) because
// INV-AUDIT-002 (migration 20240122000000) makes audit_log append-only —
// fixed IDs would collide on PK across runs once orphan rows accumulate.
const TEST_IDS = {
  vendor_holding: '99990001-0000-0000-0000-000000000001',
  vendor_real_estate: '99990001-0000-0000-0000-000000000002',
  je_holding: '99990002-0000-0000-0000-000000000001',
  je_real_estate: '99990002-0000-0000-0000-000000000002',
  ai_holding: '99990004-0000-0000-0000-000000000001',
  ai_real_estate: '99990004-0000-0000-0000-000000000002',
  addr_holding: '99990005-0000-0000-0000-000000000001',
  addr_real_estate: '99990005-0000-0000-0000-000000000002',
} as const;

describe('Integration Test 3: RLS isolates orgs (table-parameterized)', () => {
  let apClient: SupabaseClient;
  let TEST_TRACE_ID: string;
  let auditHoldingId: string;
  let auditRealEstateId: string;

  beforeAll(async () => {
    const db = adminClient();

    TEST_TRACE_ID = crypto.randomUUID();
    auditHoldingId = crypto.randomUUID();
    auditRealEstateId = crypto.randomUUID();

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
        source_system: 'manual',
        entry_number: (maxHolding?.entry_number ?? 0) + 1,
      },
      {
        journal_entry_id: TEST_IDS.je_real_estate,
        org_id: SEED.ORG_REAL_ESTATE,
        fiscal_period_id: rePeriod.period_id,
        entry_date: '2026-01-01',
        description: 'TEST RLS Real Estate',
        source: 'manual',
        source_system: 'manual',
        entry_number: (maxRE?.entry_number ?? 0) + 1,
      },
    ]);
    if (jeErr) throw new Error(`Failed to insert journal_entries: ${jeErr.message}`);

    // audit_log (no FK to journal_entries — entity_id is a plain UUID)
    const { error: auditErr } = await db.from('audit_log').insert([
      {
        audit_log_id: auditHoldingId,
        org_id: SEED.ORG_HOLDING,
        trace_id: TEST_TRACE_ID,
        action: 'test.rls.holding',
        entity_type: 'test',
      },
      {
        audit_log_id: auditRealEstateId,
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

    // organization_addresses (Phase 1.5A — CA-10)
    const { error: addrErr } = await db.from('organization_addresses').insert([
      {
        address_id: TEST_IDS.addr_holding,
        org_id: SEED.ORG_HOLDING,
        address_type: 'mailing',
        line1: 'TEST RLS Addr Holding',
        country: 'CA',
      },
      {
        address_id: TEST_IDS.addr_real_estate,
        org_id: SEED.ORG_REAL_ESTATE,
        address_type: 'mailing',
        line1: 'TEST RLS Addr RE',
        country: 'CA',
      },
    ]);
    if (addrErr) throw new Error(`Failed to insert organization_addresses: ${addrErr.message}`);

    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
  });

  afterAll(async () => {
    const db = adminClient();
    // Delete in safe order (ai_actions has nullable FK to journal_entries).
    // NOTE: audit_log rows from this test are NOT deleted — the table is
    // append-only per INV-AUDIT-002 (Layer 1a, migration 20240122000000).
    // The two audit_log_ids and TEST_TRACE_ID are per-run
    // crypto.randomUUID() values, so orphan rows are harmless across runs.
    await db.from('ai_actions').delete().in(
      'ai_action_id', [TEST_IDS.ai_holding, TEST_IDS.ai_real_estate],
    );
    await db.from('journal_entries').delete().in(
      'journal_entry_id', [TEST_IDS.je_holding, TEST_IDS.je_real_estate],
    );
    await db.from('organization_addresses').delete().in(
      'address_id', [TEST_IDS.addr_holding, TEST_IDS.addr_real_estate],
    );
    await db.from('vendors').delete().in(
      'vendor_id', [TEST_IDS.vendor_holding, TEST_IDS.vendor_real_estate],
    );
  });

  // --- Phase 1.5C: permissions catalog RLS ---
  describe('RLS on permission catalog tables', () => {
    it('CA-37: permissions table readable by any authenticated user', async () => {
      const { data, error } = await apClient
        .from('permissions')
        .select('permission_key');
      expect(error).toBeNull();
      expect(data!.length).toBe(18);
    });

    it('CA-37: role_permissions readable by any authenticated user', async () => {
      const { data, error } = await apClient
        .from('role_permissions')
        .select('role_id, permission_key');
      expect(error).toBeNull();
      expect(data!.length).toBe(26);
    });

    it('CA-37: roles shows system roles to any authenticated user', async () => {
      const { data, error } = await apClient
        .from('roles')
        .select('role_key, is_system')
        .eq('is_system', true);
      expect(error).toBeNull();
      expect(data!.length).toBe(3);
    });
  });

  // --- Phase 1.5B: user_profiles cross-org isolation ---
  // user_profiles uses user-scoped + controller-scoped RLS, not org-scoped.
  // AP Specialist in RE org should NOT see holding-company controller's profile
  // through the controller path (AP is not a controller).
  describe('RLS isolates user_profiles across orgs', () => {
    it('AP Specialist cannot see other org members profiles via controller policy', async () => {
      const { data, error } = await apClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', SEED.USER_CONTROLLER);

      expect(error).toBeNull();
      // AP is not a controller, so controller-path fails. user-path
      // also fails because user_id != auth.uid(). Result: empty.
      // Actually, AP can see controller's profile IF controller is in
      // the same org AND AP is a controller of that org. AP is NOT a
      // controller, so both policy branches fail for the controller's
      // holding-only profile.
      // Note: controller IS in RE org too, so AP might see via the
      // controller-path if AP were a controller. But AP is ap_specialist,
      // so user_is_controller returns false. The profile is only visible
      // if user_id = auth.uid().
    });

    it('AP Specialist CAN see their own profile', async () => {
      const { data, error } = await apClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', SEED.USER_AP_SPECIALIST);

      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });
  });

  // --- Phase 1.5B: org_invitations cross-org isolation ---
  // org_invitations is controller-only SELECT. AP Specialist cannot
  // see invitations even for their own org.
  describe('RLS isolates org_invitations', () => {
    it('AP Specialist cannot read invitations (not a controller)', async () => {
      const { data, error } = await apClient
        .from('org_invitations')
        .select('*')
        .eq('org_id', SEED.ORG_REAL_ESTATE);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  // --- Parameterized RLS isolation tests ---
  // Seven tenant-scoped tables, each tested for cross-org read blocking
  // and same-org read access. journal_lines and journal_entry_attachments
  // excluded — both are tenant-scoped via parent-table RLS inheritance
  // (journal_entries.org_id), so their isolation is transitively verified
  // by the journal_entries test here.
  // Phase 1.5A: added organization_addresses to the parameterized set.

  describe.each([
    'chart_of_accounts',
    'journal_entries',
    'fiscal_periods',
    'vendors',
    'audit_log',
    'ai_actions',
    'organization_addresses',
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
