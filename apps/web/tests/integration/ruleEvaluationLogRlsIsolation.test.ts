// RLS isolation for the Ring 2A-core evaluation-log substrate (ADR-0024 /
// migration 20240164000000 §c.RLS). rule_evaluation_log is service-emitted,
// append-only against the user path (INV-RULE-001):
//   • SELECT          — org-scoped: user_has_org_access(org_id).
//   • INSERT          — NO user-path policy (service-emitted only; RLS-enabled
//                       default-deny rejects the user path; service_role bypasses).
//   • UPDATE / DELETE — USING(false): blocked for ALL user paths (including a
//                       controller — this is append-only, not controller-gated).
//
// Mirrors ruleCoreRlsIsolation.test.ts: per-run crypto.randomUUID() IDs guard
// against fixture collision under vitest parallelism; fixtures inserted via
// adminClient (service_role, RLS-exempt); assertions via userClientFor
// (RLS-enforced). AP Specialist is an RE-org member (non-controller);
// Controller controls the holding org.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';

describe('RLS isolates rule_evaluation_log (service-emitted, user-path append-only)', () => {
  let apClient: SupabaseClient;          // AP Specialist — RE-org member, non-controller
  let controllerClient: SupabaseClient;  // Controller — controller of the holding org
  let ruleHolding: string;
  let ruleRealEstate: string;
  let evalHolding: string;
  let evalRealEstate: string;

  beforeAll(async () => {
    const db = adminClient();
    ruleHolding = crypto.randomUUID();
    ruleRealEstate = crypto.randomUUID();
    evalHolding = crypto.randomUUID();
    evalRealEstate = crypto.randomUUID();

    // Parent rule_registry rows (composite FK target for rule_evaluation_log).
    const { error: regErr } = await db.from('rule_registry').insert([
      { id: ruleHolding, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST eval-log RLS Holding' },
      { id: ruleRealEstate, org_id: SEED.ORG_REAL_ESTATE, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST eval-log RLS RE' },
    ]);
    if (regErr) throw new Error(`Failed to insert rule_registry: ${regErr.message}`);

    // rule_evaluation_log rows (service-role insert bypasses RLS — the path the
    // service emits on). One per org.
    const { error: logErr } = await db.from('rule_evaluation_log').insert([
      { id: evalHolding, org_id: SEED.ORG_HOLDING, rule_id: ruleHolding, trace_id: crypto.randomUUID(), match_classification: 'primary_match', evaluation_trace: {} },
      { id: evalRealEstate, org_id: SEED.ORG_REAL_ESTATE, rule_id: ruleRealEstate, trace_id: crypto.randomUUID(), match_classification: 'primary_match', evaluation_trace: {} },
    ]);
    if (logErr) throw new Error(`Failed to insert rule_evaluation_log: ${logErr.message}`);

    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
    controllerClient = await userClientFor('controller@thebridge.local', 'DevSeed!Controller#1');
  });

  afterAll(async () => {
    const db = adminClient();
    // Explicit eval-log delete first (composite FK ON DELETE CASCADE would also
    // clear them when the registry rows go, but explicit is clearer).
    await db.from('rule_evaluation_log').delete().in('id', [evalHolding, evalRealEstate]);
    await db.from('rule_registry').delete().in('id', [ruleHolding, ruleRealEstate]);
  });

  // --- SELECT: org-scoped (user_has_org_access) ---
  it('AP Specialist cannot read holding-org eval-log rows (cross-org isolation)', async () => {
    const { data, error } = await apClient
      .from('rule_evaluation_log').select('*').eq('org_id', SEED.ORG_HOLDING);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('AP Specialist CAN read their own org (RE) eval-log rows', async () => {
    const { data, error } = await apClient
      .from('rule_evaluation_log').select('id').eq('id', evalRealEstate);
    expect(error).toBeNull();
    expect(data!.length).toBe(1);
  });

  // --- UPDATE: USING(false) for ALL user paths (append-only, not controller-gated) ---
  it('AP Specialist (non-controller) cannot UPDATE even their own org eval-log row', async () => {
    const { data, error } = await apClient
      .from('rule_evaluation_log').update({ disposition: 'auto_posted' })
      .eq('id', evalRealEstate).select();
    expect(error).toBeNull();
    expect(data).toEqual([]); // USING(false) → 0 rows match for update
    const { data: after } = await adminClient()
      .from('rule_evaluation_log').select('disposition').eq('id', evalRealEstate).single();
    expect(after!.disposition).toBeNull(); // unchanged — append-only
  });

  it('Controller ALSO cannot UPDATE an eval-log row (USING(false) is append-only, not controller-gated)', async () => {
    // Distinguishes rule_evaluation_log (append-only, all user paths blocked) from
    // rule_registry (controller-gated CUD). Even the controller of the holding org
    // cannot mutate a holding eval-log row through the user path.
    const { data, error } = await controllerClient
      .from('rule_evaluation_log').update({ disposition: 'auto_posted' })
      .eq('id', evalHolding).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
    const { data: after } = await adminClient()
      .from('rule_evaluation_log').select('disposition').eq('id', evalHolding).single();
    expect(after!.disposition).toBeNull();
  });

  // --- DELETE: USING(false) ---
  it('AP Specialist cannot DELETE their own org eval-log row (append-only)', async () => {
    const { data, error } = await apClient
      .from('rule_evaluation_log').delete().eq('id', evalRealEstate).select();
    expect(error).toBeNull();
    expect(data).toEqual([]); // USING(false) → 0 rows match for delete
    const { count } = await adminClient()
      .from('rule_evaluation_log').select('*', { count: 'exact', head: true }).eq('id', evalRealEstate);
    expect(count).toBe(1); // still present
  });

  // --- INSERT: no user-path policy → default-deny (distinct from UPDATE/DELETE,
  //     which silently affect 0 rows; INSERT is rejected with an RLS error) ---
  it('AP Specialist cannot INSERT an eval-log row even for their own org (no user INSERT policy)', async () => {
    const newId = crypto.randomUUID();
    const { error } = await apClient.from('rule_evaluation_log').insert({
      id: newId, org_id: SEED.ORG_REAL_ESTATE, rule_id: ruleRealEstate,
      trace_id: crypto.randomUUID(), match_classification: 'primary_match', evaluation_trace: {},
    });
    // No INSERT policy + RLS enabled → row-level-security rejection (not a silent
    // 0-row no-op). Valid column values, so the only reason for failure is RLS.
    expect(error).not.toBeNull();
    const { count } = await adminClient()
      .from('rule_evaluation_log').select('*', { count: 'exact', head: true }).eq('id', newId);
    expect(count).toBe(0); // nothing inserted
  });
});
