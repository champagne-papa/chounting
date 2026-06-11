// tests/integration/ruleCreationOrchestrator.integration.test.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). ruleCreationOrchestrator
// composes vendor-rule creation: dedup probe (vendorRuleService.findExisting on
// the 20240163 §g uniqueness key) → create_vendor_rule_atomic RPC → rule.created
// audit at the orchestrator level (after the RPC). Defaults: rule_type='pattern',
// lifecycle_state='proposed'.
//
// Covers: happy path (created=true; parent + co-created track record + child all
// land; rule.created audit emitted) and dedup-skip (a second call on the same
// uniqueness key returns the existing rule with created=false and no new rows).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';

describe('ruleCreationOrchestrator.createVendorRule (ADR-0025 §6)', () => {
  const db = adminClient();
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  let vendorId: string;
  const createdRuleIds: string[] = [];

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    const { error } = await db.from('vendors').insert({
      vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST orchestrator vendor',
    });
    if (error) throw new Error(`vendor seed failed: ${error.message}`);
  });

  afterAll(async () => {
    if (createdRuleIds.length > 0) {
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    }
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  it('happy path: creates the parent + co-created track record + child, applies defaults, audits rule.created', async () => {
    const result = await ruleCreationOrchestrator.createVendorRule(
      { org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bundle_type: 'born_paid_bill' },
      ctx,
    );
    expect(result.created).toBe(true);
    expect(typeof result.rule_id).toBe('string');
    createdRuleIds.push(result.rule_id);

    const { data: reg } = await db
      .from('rule_registry')
      .select('rule_type, lifecycle_state, created_by')
      .eq('id', result.rule_id)
      .single();
    expect(reg).toMatchObject({ rule_type: 'pattern', lifecycle_state: 'proposed', created_by: SEED.USER_CONTROLLER });

    const { count: trCount } = await db
      .from('rule_track_records').select('*', { count: 'exact', head: true }).eq('rule_id', result.rule_id);
    expect(trCount).toBe(1);

    const { data: vr } = await db
      .from('vendor_rules').select('vendor_id, bundle_type').eq('rule_id', result.rule_id).single();
    expect(vr).toMatchObject({ vendor_id: vendorId, bundle_type: 'born_paid_bill' });

    const { data: audit } = await db
      .from('audit_log').select('action, entity_id').eq('entity_id', result.rule_id).eq('action', 'rule.created');
    expect(audit!.length).toBeGreaterThanOrEqual(1);
  });

  it('dedup-skip: a second create on the same uniqueness key returns the existing rule with created=false and adds no rows', async () => {
    const { count: before } = await db
      .from('rule_registry').select('*', { count: 'exact', head: true }).eq('org_id', SEED.ORG_HOLDING);

    const result = await ruleCreationOrchestrator.createVendorRule(
      { org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bundle_type: 'born_paid_bill' },
      ctx,
    );
    expect(result.created).toBe(false);
    expect(createdRuleIds).toContain(result.rule_id); // same rule as the happy-path creation

    const { count: after } = await db
      .from('rule_registry').select('*', { count: 'exact', head: true }).eq('org_id', SEED.ORG_HOLDING);
    expect(after).toBe(before);
  });
});
