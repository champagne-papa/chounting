// tests/integration/createVendorRuleAtomicRpc.integration.test.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6 + Migration outline). The
// create_vendor_rule_atomic RPC (migration 20240165000000) is the sole
// vendor_rules writer: a plpgsql function body in a single transaction that
// inserts THREE rows across THREE tables — rule_registry (parent) +
// rule_track_records (co-created, ADR-0023 Decision 5) + vendor_rules (child,
// composite FK). Atomicity is the load-bearing property: any failure rolls back
// all three (the orphaned-rule_registry-row integrity gap is why atomicity is
// required).
//
// Tests, per the ADR-0025 Decision 11 acceptance item ("all-or-nothing, incl.
// rollback-on-child-failure"):
//   1. happy path — three rows land in three tables, RETURNs the parent id.
//   2. rollback on uniqueness collision — a duplicate
//      (org_id, COALESCE(legal_entity_id, org_id), vendor_id, bundle_type)
//      raises unique_violation; the parent + co-created track record roll back.
//   3. rollback on FK violation — a bad vendor_id raises foreign_key_violation;
//      the parent + co-created track record roll back (no orphan).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('create_vendor_rule_atomic RPC (atomic three-row insert; ADR-0025 §6)', () => {
  const db = adminClient();
  let vendorId: string;
  const createdRuleIds: string[] = [];

  // Count rule_registry rows for the org — the orphan detector for the rollback
  // tests. Single-file run has no concurrent writers, so a stable count across a
  // failing RPC call proves the parent insert rolled back with the child failure.
  async function holdingRegistryCount(): Promise<number> {
    const { count, error } = await db
      .from('rule_registry')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    if (error) throw new Error(`count failed: ${error.message}`);
    return count ?? 0;
  }

  beforeAll(async () => {
    vendorId = crypto.randomUUID();
    const { error } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST create_vendor_rule_atomic vendor',
    });
    if (error) throw new Error(`vendor seed failed: ${error.message}`);
  });

  afterAll(async () => {
    // Deleting the rule_registry parents cascades vendor_rules (composite FK
    // ON DELETE CASCADE) and rule_track_records (ON DELETE CASCADE). service_role
    // is not blocked on these tables (no append-only trigger; RLS-exempt).
    if (createdRuleIds.length > 0) {
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    }
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  });

  it('inserts rule_registry + rule_track_records + vendor_rules atomically and returns the parent id', async () => {
    const { data, error } = await db.rpc('create_vendor_rule_atomic', {
      p_registry: {
        org_id: SEED.ORG_HOLDING,
        rule_type: 'pattern',
        lifecycle_state: 'proposed',
        created_by: SEED.USER_CONTROLLER,
      },
      p_track_record: { model_version: null },
      p_vendor_rule: {
        vendor_id: vendorId,
        default_account_id: null,
        legal_entity_id: null,
        bundle_type: 'born_paid_bill',
      },
    });
    expect(error).toBeNull();
    expect(typeof data).toBe('string');
    const ruleId = data as string;
    createdRuleIds.push(ruleId);

    // Parent — current_rung defaults to always_confirm; lifecycle from input.
    const { data: reg } = await db
      .from('rule_registry')
      .select('id, org_id, rule_type, lifecycle_state, current_rung, created_by')
      .eq('id', ruleId)
      .single();
    expect(reg).toMatchObject({
      id: ruleId,
      org_id: SEED.ORG_HOLDING,
      rule_type: 'pattern',
      lifecycle_state: 'proposed',
      current_rung: 'always_confirm',
      created_by: SEED.USER_CONTROLLER,
    });

    // Co-created track record — counters default to 0.
    const { data: tr } = await db
      .from('rule_track_records')
      .select('rule_id, clean_approval_count, guardrail_fire_count')
      .eq('rule_id', ruleId)
      .single();
    expect(tr).toMatchObject({ rule_id: ruleId, clean_approval_count: 0, guardrail_fire_count: 0 });

    // Child — composite FK 1:1; bundle_type carried through.
    const { data: vr } = await db
      .from('vendor_rules')
      .select('rule_id, org_id, vendor_id, bundle_type')
      .eq('rule_id', ruleId)
      .single();
    expect(vr).toMatchObject({
      rule_id: ruleId,
      org_id: SEED.ORG_HOLDING,
      vendor_id: vendorId,
      bundle_type: 'born_paid_bill',
    });
  });

  it('rolls back ALL THREE inserts on a uniqueness collision (no orphaned parent)', async () => {
    // First creation establishes the (org, legal_entity=org, vendor, bundle) key.
    const { data: firstId, error: firstErr } = await db.rpc('create_vendor_rule_atomic', {
      p_registry: { org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'proposed', created_by: SEED.USER_CONTROLLER },
      p_track_record: { model_version: null },
      p_vendor_rule: { vendor_id: vendorId, bundle_type: 'final_invoice_with_applied_deposit' },
    });
    expect(firstErr).toBeNull();
    createdRuleIds.push(firstId as string);

    const beforeCount = await holdingRegistryCount();

    // Second creation on the SAME uniqueness key → vendor_rules unique_violation.
    const { data: dupData, error: dupErr } = await db.rpc('create_vendor_rule_atomic', {
      p_registry: { org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'proposed', created_by: SEED.USER_CONTROLLER },
      p_track_record: { model_version: null },
      p_vendor_rule: { vendor_id: vendorId, bundle_type: 'final_invoice_with_applied_deposit' },
    });
    expect(dupErr).not.toBeNull();
    expect(dupData).toBeNull();

    // The failed call's parent + co-created track record rolled back with the
    // child: rule_registry count is unchanged, and exactly one vendor_rules row
    // exists for the key.
    expect(await holdingRegistryCount()).toBe(beforeCount);
    const { count: vrCount } = await db
      .from('vendor_rules')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('vendor_id', vendorId)
      .eq('bundle_type', 'final_invoice_with_applied_deposit');
    expect(vrCount).toBe(1);
  });

  it('rolls back ALL THREE inserts on a child FK violation (bad vendor_id → no orphaned parent)', async () => {
    const beforeCount = await holdingRegistryCount();
    const badVendorId = crypto.randomUUID(); // not in vendors → foreign_key_violation

    const { data, error } = await db.rpc('create_vendor_rule_atomic', {
      p_registry: { org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'proposed', created_by: SEED.USER_CONTROLLER },
      p_track_record: { model_version: null },
      p_vendor_rule: { vendor_id: badVendorId, bundle_type: 'vendor_credit_applied_to_bill' },
    });
    expect(error).not.toBeNull();
    expect(data).toBeNull();

    // No orphaned rule_registry / rule_track_records row from the failed call.
    expect(await holdingRegistryCount()).toBe(beforeCount);
  });
});
