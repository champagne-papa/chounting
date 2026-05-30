// tests/integration/ruleCreateRouteAuthz.integration.test.ts
//
// Ring 2A-authoring commit (c) (ADR-0026 §5/§7). The POST /api/orgs/[orgId]/rules
// create path: createAndApproveVendorRule (the create→approve two-step) gated by
// withInvariants({ action: 'rule.create' }). Tests the gate + the two-step at the
// withInvariants(fn, {action})(input, ctx) layer — mirroring ruleRoutesAuthz's
// direct-invocation pattern (no route-handler HTTP / session mocking; the gate
// topology is identical to the route's wrap).
//
// Covers: controller passes the rule.create gate → create→approve lands an active
// rule + provenance + both audits; ap_specialist / executive denied
// (PERMISSION_DENIED via the rule.create permission); cross-org denied
// (ORG_ACCESS_DENIED via Invariant 3). Denied cases use a throwaway vendor_id —
// the gate fires before the orchestration body runs.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { createAndApproveVendorRule } from '@/services/rules/ruleAuthoringService';

describe('rule.create gate + createAndApproveVendorRule two-step (ADR-0026 §5/§7)', () => {
  const db = adminClient();
  const createdRuleIds: string[] = [];
  const createdVendorIds: string[] = [];

  // The route applies this exact wrap; the test mirrors it.
  const wrapped = withInvariants(createAndApproveVendorRule, { action: 'rule.create' });

  async function seedVendor(): Promise<string> {
    const vendorId = crypto.randomUUID();
    createdVendorIds.push(vendorId);
    const { error } = await db.from('vendors').insert({
      vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST rule.create vendor',
    });
    if (error) throw new Error(`vendor seed failed: ${error.message}`);
    return vendorId;
  }

  afterAll(async () => {
    if (createdRuleIds.length > 0) await db.from('rule_registry').delete().in('id', createdRuleIds);
    if (createdVendorIds.length > 0) await db.from('vendors').delete().in('vendor_id', createdVendorIds);
    // audit_log rows are append-only; left to accumulate.
  });

  it('controller: passes the gate → create→approve lands an active rule + provenance + rule.created/rule.approved audits', async () => {
    const vendorId = await seedVendor();
    const ctx = makeTestContext({ user_id: SEED.USER_CONTROLLER, org_ids: [SEED.ORG_HOLDING] });

    const result = await wrapped(
      { org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bundle_type: 'born_paid_bill' },
      ctx,
    );
    expect(result.created).toBe(true);
    expect(typeof result.rule_id).toBe('string');
    createdRuleIds.push(result.rule_id);

    const { data: reg } = await db
      .from('rule_registry').select('lifecycle_state').eq('id', result.rule_id).single();
    expect(reg!.lifecycle_state).toBe('active'); // two-step transitioned proposed → active

    const { data: vr } = await db
      .from('vendor_rules').select('approved_at, approved_by').eq('rule_id', result.rule_id).single();
    expect(vr!.approved_at).toBeTruthy();
    expect(vr!.approved_by).toBe(SEED.USER_CONTROLLER);

    const { data: audits } = await db
      .from('audit_log').select('action').eq('entity_id', result.rule_id)
      .in('action', ['rule.created', 'rule.approved']);
    const actions = (audits ?? []).map((a: { action: string }) => a.action);
    expect(actions).toContain('rule.created');
    expect(actions).toContain('rule.approved');
  });

  it('ap_specialist: denied by the rule.create gate (PERMISSION_DENIED)', async () => {
    const ctx = makeTestContext({ user_id: SEED.USER_AP_SPECIALIST, org_ids: [SEED.ORG_HOLDING] });
    await expect(
      wrapped({ org_id: SEED.ORG_HOLDING, vendor_id: crypto.randomUUID(), bundle_type: 'born_paid_bill' }, ctx),
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('executive: denied by the rule.create gate (PERMISSION_DENIED)', async () => {
    const ctx = makeTestContext({ user_id: SEED.USER_EXECUTIVE, org_ids: [SEED.ORG_HOLDING] });
    await expect(
      wrapped({ org_id: SEED.ORG_HOLDING, vendor_id: crypto.randomUUID(), bundle_type: 'born_paid_bill' }, ctx),
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('cross-org: org_id outside the caller orgs is rejected (ORG_ACCESS_DENIED)', async () => {
    const ctx = makeTestContext({ user_id: SEED.USER_CONTROLLER, org_ids: [SEED.ORG_REAL_ESTATE] });
    await expect(
      wrapped({ org_id: SEED.ORG_HOLDING, vendor_id: crypto.randomUUID(), bundle_type: 'born_paid_bill' }, ctx),
    ).rejects.toThrow('ORG_ACCESS_DENIED');
  });
});
