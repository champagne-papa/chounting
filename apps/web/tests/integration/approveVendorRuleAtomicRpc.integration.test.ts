// tests/integration/approveVendorRuleAtomicRpc.integration.test.ts
//
// Ring 2A-authoring (ADR-0026 Decision 5, amended 2026-05-29). The
// approve_vendor_rule_atomic RPC (migration 20240168000000) is the
// transition-sibling of create_vendor_rule_atomic: an atomic two-table write
// that transitions an already-created ('proposed') vendor rule to active +
// approved. vendor_rules.approved_at/approved_by (provenance) + rule_registry.
// lifecycle_state='active' (the functional gate ruleEvaluationService.evaluate
// filters on) move together in one transaction — an orphaned half-approve
// cannot persist.
//
// Covers: happy path (both tables transition, RETURNs the rule id); idempotency
// (a second approve is a no-op — approved_at + approver stable, no overwrite);
// not-found (a missing/cross-org rule returns NULL, writes nothing).

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('approve_vendor_rule_atomic RPC (atomic two-table transition; ADR-0026 §5)', () => {
  const db = adminClient();
  const createdRuleIds: string[] = [];
  const createdVendorIds: string[] = [];

  // Per-call fresh vendor → each create_vendor_rule_atomic uses a distinct
  // (org_id, vendor_id, bundle_type) key, avoiding the
  // vendor_rules_org_legalentity_vendor_bundle_uq dedup collision across the
  // suite's test cases (and across re-runs).
  async function createProposedRule(): Promise<string> {
    const vendorId = crypto.randomUUID();
    createdVendorIds.push(vendorId);
    const { error: vErr } = await db.from('vendors').insert({
      vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST approve_vendor_rule_atomic vendor',
    });
    if (vErr) throw new Error(`vendor seed failed: ${vErr.message}`);

    const { data, error } = await db.rpc('create_vendor_rule_atomic', {
      p_registry: { org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'proposed', created_by: SEED.USER_CONTROLLER },
      p_track_record: { model_version: null },
      p_vendor_rule: { vendor_id: vendorId, bundle_type: 'born_paid_bill' },
    });
    if (error || !data) throw new Error(`create failed: ${error?.message ?? 'no id'}`);
    const id = data as string;
    createdRuleIds.push(id);
    return id;
  }

  afterAll(async () => {
    // rule_registry delete CASCADEs vendor_rules + rule_track_records (composite
    // FK + co-created FK, both ON DELETE CASCADE); service_role is not blocked.
    if (createdRuleIds.length > 0) {
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    }
    if (createdVendorIds.length > 0) {
      await db.from('vendors').delete().in('vendor_id', createdVendorIds);
    }
  });

  it('transitions both tables atomically: vendor_rules.approved_at/by + rule_registry.lifecycle_state=active', async () => {
    const ruleId = await createProposedRule();

    const { data, error } = await db.rpc('approve_vendor_rule_atomic', {
      p_rule_id: ruleId, p_org_id: SEED.ORG_HOLDING, p_approved_by: SEED.USER_CONTROLLER,
    });
    expect(error).toBeNull();
    expect(data).toBe(ruleId);

    const { data: vr } = await db
      .from('vendor_rules').select('approved_at, approved_by').eq('rule_id', ruleId).single();
    expect(vr!.approved_at).toBeTruthy();
    expect(vr!.approved_by).toBe(SEED.USER_CONTROLLER);

    const { data: reg } = await db
      .from('rule_registry').select('lifecycle_state').eq('id', ruleId).single();
    expect(reg!.lifecycle_state).toBe('active');
  });

  it('is idempotent: a second approve no-ops (approved_at + approver stable; lifecycle still active)', async () => {
    const ruleId = await createProposedRule();

    const { data: first } = await db.rpc('approve_vendor_rule_atomic', {
      p_rule_id: ruleId, p_org_id: SEED.ORG_HOLDING, p_approved_by: SEED.USER_CONTROLLER,
    });
    expect(first).toBe(ruleId);
    const { data: vr1 } = await db.from('vendor_rules').select('approved_at').eq('rule_id', ruleId).single();
    const firstApprovedAt = vr1!.approved_at;

    // Second call with a DIFFERENT approver — must NOT overwrite the first.
    const { data: second } = await db.rpc('approve_vendor_rule_atomic', {
      p_rule_id: ruleId, p_org_id: SEED.ORG_HOLDING, p_approved_by: SEED.USER_EXECUTIVE,
    });
    expect(second).toBe(ruleId);

    const { data: vr2 } = await db.from('vendor_rules').select('approved_at, approved_by').eq('rule_id', ruleId).single();
    expect(vr2!.approved_at).toBe(firstApprovedAt);        // timestamp unchanged
    expect(vr2!.approved_by).toBe(SEED.USER_CONTROLLER);   // first approver preserved
    const { data: reg } = await db.from('rule_registry').select('lifecycle_state').eq('id', ruleId).single();
    expect(reg!.lifecycle_state).toBe('active');
  });

  it('returns NULL for a not-found rule (writes nothing)', async () => {
    const { data, error } = await db.rpc('approve_vendor_rule_atomic', {
      p_rule_id: crypto.randomUUID(), p_org_id: SEED.ORG_HOLDING, p_approved_by: SEED.USER_CONTROLLER,
    });
    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
