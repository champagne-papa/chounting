// RLS isolation for the Ring 1 rule-core substrate (ADR-0023 / migration
// 20240163000000 §b.RLS + §c.RLS):
//   • rule_registry      — org-scoped: SELECT user_has_org_access(org_id),
//                          CUD (FOR ALL) user_is_controller(org_id).
//   • rule_track_records — through-parent via rule_registry (no direct
//                          org_id): SELECT/INSERT through-parent;
//                          UPDATE/DELETE USING(false) (counters are
//                          service-derived state, no user-path mutation).
//
// Per-run crypto.randomUUID() IDs prevent fixture-UUID collision under
// vitest parallel scheduling (cf. crossOrgRlsIsolation.test.ts). Fixtures
// are inserted via adminClient (service_role, RLS-exempt); assertions use
// userClientFor (RLS-enforced) — AP Specialist (RE-org member, NOT a
// controller) and Controller (controller of the holding org).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';

describe('RLS isolates rule-core substrate (rule_registry + rule_track_records)', () => {
  let apClient: SupabaseClient;          // AP Specialist — RE-org member, non-controller
  let controllerClient: SupabaseClient;  // Controller — controller of the holding org
  let ruleHolding: string;
  let ruleRealEstate: string;

  beforeAll(async () => {
    const db = adminClient();
    ruleHolding = crypto.randomUUID();
    ruleRealEstate = crypto.randomUUID();

    // rule_registry — one row per org (service_role insert bypasses RLS).
    const { error: regErr } = await db.from('rule_registry').insert([
      { id: ruleHolding, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST RLS Rule Holding' },
      { id: ruleRealEstate, org_id: SEED.ORG_REAL_ESTATE, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST RLS Rule RE' },
    ]);
    if (regErr) throw new Error(`Failed to insert rule_registry: ${regErr.message}`);

    // rule_track_records — co-created counter row per rule (defaults all-zero).
    const { error: trErr } = await db.from('rule_track_records').insert([
      { rule_id: ruleHolding },
      { rule_id: ruleRealEstate },
    ]);
    if (trErr) throw new Error(`Failed to insert rule_track_records: ${trErr.message}`);

    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
    controllerClient = await userClientFor('controller@thebridge.local', 'DevSeed!Controller#1');
  });

  afterAll(async () => {
    const db = adminClient();
    // rule_track_records deleted first (explicit); FK ON DELETE CASCADE would
    // also clear them when the registry rows go, but explicit is clearer.
    await db.from('rule_track_records').delete().in('rule_id', [ruleHolding, ruleRealEstate]);
    await db.from('rule_registry').delete().in('id', [ruleHolding, ruleRealEstate]);
  });

  // --- rule_registry: org-scoped (SELECT org-access, CUD controller) ---
  describe('rule_registry — org-scoped', () => {
    it('AP Specialist cannot read holding-org rows (cross-org isolation)', async () => {
      const { data, error } = await apClient
        .from('rule_registry').select('*').eq('org_id', SEED.ORG_HOLDING);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('AP Specialist CAN read their own org (RE) rows', async () => {
      const { data, error } = await apClient
        .from('rule_registry').select('id').eq('id', ruleRealEstate);
      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('AP Specialist (non-controller) cannot UPDATE even in their own org (CUD = controller)', async () => {
      const { data, error } = await apClient
        .from('rule_registry').update({ name: 'AP SHOULD NOT WRITE' })
        .eq('id', ruleRealEstate).select();
      expect(error).toBeNull();
      expect(data).toEqual([]); // CUD policy is user_is_controller; AP filtered out → 0 rows
      const { data: after } = await adminClient()
        .from('rule_registry').select('name').eq('id', ruleRealEstate).single();
      expect(after!.name).toBe('TEST RLS Rule RE'); // unchanged
    });

    it('Controller CAN UPDATE rule_registry in the org they control (holding)', async () => {
      const { data, error } = await controllerClient
        .from('rule_registry').update({ name: 'Controller renamed' })
        .eq('id', ruleHolding).select();
      expect(error).toBeNull();
      expect(data!.length).toBe(1);
      expect(data![0].name).toBe('Controller renamed');
    });
  });

  // --- rule_track_records: through-parent SELECT/INSERT, UPDATE/DELETE USING(false) ---
  describe('rule_track_records — through-parent', () => {
    it('AP Specialist cannot read a track-record whose parent rule is in holding', async () => {
      const { data, error } = await apClient
        .from('rule_track_records').select('*').eq('rule_id', ruleHolding);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('AP Specialist CAN read a track-record whose parent rule is in their org', async () => {
      const { data, error } = await apClient
        .from('rule_track_records').select('rule_id').eq('rule_id', ruleRealEstate);
      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('UPDATE is blocked for all user paths (USING(false)) — even a user who can read the row', async () => {
      // AP CAN SELECT the RE track-record (through-parent), but UPDATE is USING(false).
      const { data, error } = await apClient
        .from('rule_track_records').update({ clean_approval_count: 99 })
        .eq('rule_id', ruleRealEstate).select();
      expect(error).toBeNull();
      expect(data).toEqual([]); // 0 rows affected
      const { data: after } = await adminClient()
        .from('rule_track_records').select('clean_approval_count').eq('rule_id', ruleRealEstate).single();
      expect(after!.clean_approval_count).toBe(0); // unchanged — counters are service-path only
    });

    it('DELETE is blocked for all user paths (USING(false))', async () => {
      const { data, error } = await apClient
        .from('rule_track_records').delete().eq('rule_id', ruleRealEstate).select();
      expect(error).toBeNull();
      expect(data).toEqual([]); // 0 rows affected
      const { count } = await adminClient()
        .from('rule_track_records').select('*', { count: 'exact', head: true }).eq('rule_id', ruleRealEstate);
      expect(count).toBe(1); // still present
    });
  });
});
