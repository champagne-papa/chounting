// tests/integration/vendorRuleServiceApprove.integration.test.ts
//
// Ring 2A-authoring (ADR-0026 Decision 5, amended 2026-05-29). vendorRuleService
// .approve is a thin wrapper over the approve_vendor_rule_atomic RPC (20240168):
// a read-before idempotency fast-path (getByRuleId-style org-scoped read) →
// RPC (two-table atomic transition) → TS-side rule.approved audit (mirroring
// promote + the create-orchestrator's audit-after-write window). withInvariants
// without opts.action (auth via caller/RLS at the service layer; the route
// handler at commit (c) enforces controller-authority via rule.create).
//
// Covers: create-then-approve cycle (lifecycle → active, provenance stamped, one
// rule.approved audit); idempotency (approve-twice → no-op, no duplicate audit);
// not-found → RULE_NOT_FOUND; cross-org isolation (org-scoped read miss).

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';
import { vendorRuleService } from '@/services/rules/vendorRuleService';

describe('vendorRuleService.approve (ADR-0026 §5)', () => {
  const db = adminClient();
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] }); // user = CONTROLLER
  const createdRuleIds: string[] = [];
  const createdVendorIds: string[] = [];

  // Per-run vendor → createVendorRule always creates fresh (no
  // vendor_rules_org_legalentity_vendor_bundle_uq dedup collision across runs).
  async function createProposedRule(): Promise<string> {
    const vendorId = crypto.randomUUID();
    createdVendorIds.push(vendorId);
    const { error } = await db.from('vendors').insert({
      vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST approve-wrapper vendor',
    });
    if (error) throw new Error(`vendor seed failed: ${error.message}`);
    const res = await ruleCreationOrchestrator.createVendorRule(
      { org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bundle_type: 'born_paid_bill' }, ctx,
    );
    createdRuleIds.push(res.rule_id);
    return res.rule_id;
  }

  afterAll(async () => {
    if (createdRuleIds.length > 0) await db.from('rule_registry').delete().in('id', createdRuleIds);
    if (createdVendorIds.length > 0) await db.from('vendors').delete().in('vendor_id', createdVendorIds);
    // audit_log rows from recordMutation are append-only; left to accumulate.
  });

  it('create-then-approve: lifecycle → active, provenance stamped, one rule.approved audit', async () => {
    const ruleId = await createProposedRule();

    const result = await vendorRuleService.approve({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx);
    expect(result.approved_at).toBeTruthy();
    expect(result.approved_by).toBe(SEED.USER_CONTROLLER);

    const { data: reg } = await db
      .from('rule_registry').select('lifecycle_state').eq('id', ruleId).single();
    expect(reg!.lifecycle_state).toBe('active');

    const { data: audit } = await db
      .from('audit_log').select('action, entity_type, entity_id')
      .eq('entity_id', ruleId).eq('action', 'rule.approved');
    expect(audit!.length).toBe(1);
    expect(audit![0].entity_type).toBe('rule_registry');
  });

  it('is idempotent: a second approve no-ops (stable state, no duplicate audit)', async () => {
    const ruleId = await createProposedRule();

    await vendorRuleService.approve({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx);
    const result2 = await vendorRuleService.approve({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx);
    expect(result2.approved_at).toBeTruthy();
    expect(result2.approved_by).toBe(SEED.USER_CONTROLLER);

    const { data: audit } = await db
      .from('audit_log').select('action').eq('entity_id', ruleId).eq('action', 'rule.approved');
    expect(audit!.length).toBe(1); // no duplicate audit on the no-op re-approve
  });

  it('rejects a lookup miss with RULE_NOT_FOUND', async () => {
    await expect(
      vendorRuleService.approve({ org_id: SEED.ORG_HOLDING, rule_id: crypto.randomUUID() }, ctx),
    ).rejects.toThrow('RULE_NOT_FOUND');
  });

  it('cross-org isolation: a controller cannot approve a rule outside their org', async () => {
    const ruleId = await createProposedRule(); // in ORG_HOLDING
    const ctxRealEstate = makeTestContext({ org_ids: [SEED.ORG_REAL_ESTATE] });
    // org-scoped read (org_id = REAL_ESTATE) finds no row for a HOLDING rule.
    await expect(
      vendorRuleService.approve({ org_id: SEED.ORG_REAL_ESTATE, rule_id: ruleId }, ctxRealEstate),
    ).rejects.toThrow('RULE_NOT_FOUND');
  });
});
