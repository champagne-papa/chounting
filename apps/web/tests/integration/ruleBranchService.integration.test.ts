// tests/integration/ruleBranchService.integration.test.ts
//
// Ring 2B (ADR-0027 Decision 4 / 6 / 7). ruleBranchService is the production
// READ side (buildBranchSource) + the v1 branch DERIVATION (deriveVendorRuleBranches).
//
// Covers:
//  - derivation shape: vendor_id → one primary branch, field_equals(vendor_id),
//    auto_post_at_rung_2 ceiling, card-only eval trigger, null source filter.
//  - end-to-end PRODUCTION path: createVendorRule (co-creates the derived branch
//    via the RPC) → approve (→ active) → buildBranchSource assembles the real
//    Branch[] from storage → ruleEvaluationService.evaluate matches the proposal
//    (primary_match; auto_post_at_rung_2 capped to suggest at always_confirm).
//  - condition_value validation boundary: a malformed stored condition_value
//    (per condition_type) throws RULE_BRANCH_ASSEMBLY_FAILED at assembly.
//  - cleanup proof: rule_registry delete CASCADES through rule_branches/
//    rule_conditions (the DELETE-not-trigger-blocked decision; 20240169).

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';
import { vendorRuleService } from '@/services/rules/vendorRuleService';
import { ruleBranchService, deriveVendorRuleBranches } from '@/services/rules/ruleBranchService';
import { ruleEvaluationService } from '@/services/rules/ruleEvaluationService';
import type { ProposedMutation } from '@/shared/schemas/accounting/proposedMutation.schema';

function postBillProposal(vendorId: string): ProposedMutation {
  return {
    proposal_type: 'post_bill',
    source_document_id: crypto.randomUUID(),
    trace_id: crypto.randomUUID(),
    params: { vendor_id: vendorId, amount: '250', currency: 'CAD' },
  };
}

describe('ruleBranchService (Ring 2B / ADR-0027)', () => {
  const db = adminClient();
  const createdRuleIds: string[] = [];
  const createdVendorIds: string[] = [];
  const traceIds: string[] = [];

  afterAll(async () => {
    if (traceIds.length > 0) await db.from('rule_evaluation_log').delete().in('trace_id', traceIds);
    if (createdRuleIds.length > 0) {
      // rule_registry delete cascades through rule_branches → rule_conditions
      // (and rule_track_records / vendor_rules / rule_evaluation_log). The §5.1
      // immutability trigger blocks UPDATE/TRUNCATE, NOT DELETE, so this cascade
      // passes — the CA-65-safe cleanup path the 20240169 decision preserves.
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    }
    if (createdVendorIds.length > 0) {
      await db.from('vendors').delete().in('vendor_id', createdVendorIds);
    }
  });

  async function seedVendor(): Promise<string> {
    const vendorId = crypto.randomUUID();
    const { error } = await db.from('vendors').insert({
      vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST ruleBranchService vendor',
    });
    if (error) throw new Error(`vendor seed failed: ${error.message}`);
    createdVendorIds.push(vendorId);
    return vendorId;
  }

  it('deriveVendorRuleBranches: one primary branch, field_equals(vendor_id), auto_post_at_rung_2 ceiling, card-only', () => {
    const branches = deriveVendorRuleBranches({ vendor_id: 'vendor-xyz' });
    expect(branches).toHaveLength(1);
    expect(branches[0]).toMatchObject({
      branch_order: 0,
      branch_type: 'primary',
      max_outcome_action: 'auto_post_at_rung_2',
      applies_to_evaluation_triggers: ['proposed_mutation_generated'],
      applies_to_source_triggers: null,
    });
    expect(branches[0].conditions).toEqual([
      { condition_order: 0, condition_type: 'field_equals', target_field: 'vendor_id', condition_value: 'vendor-xyz' },
    ]);
  });

  it('end-to-end: create → approve → buildBranchSource assembles the stored branch → evaluate matches (primary_match)', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const vendorId = await seedVendor();

    // create (co-creates the derived branch via the RPC) + approve (→ active)
    const created = await ruleCreationOrchestrator.createVendorRule(
      { org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bundle_type: 'born_paid_bill' },
      ctx,
    );
    expect(created.created).toBe(true);
    createdRuleIds.push(created.rule_id);
    await vendorRuleService.approve({ org_id: SEED.ORG_HOLDING, rule_id: created.rule_id }, ctx);

    // the branch + condition physically landed
    const { data: branchRows } = await db
      .from('rule_branches').select('id, branch_type, max_outcome_action').eq('rule_id', created.rule_id);
    expect(branchRows).toHaveLength(1);
    expect(branchRows![0]).toMatchObject({ branch_type: 'primary', max_outcome_action: 'auto_post_at_rung_2' });

    // production branchSource assembles the real Branch[] from storage
    const branchSource = await ruleBranchService.buildBranchSource({ org_id: SEED.ORG_HOLDING }, ctx);
    const assembled = branchSource({ id: created.rule_id } as never);
    expect(assembled).toHaveLength(1);
    expect(assembled[0]).toMatchObject({
      branch_type: 'primary',
      max_outcome_action: 'auto_post_at_rung_2',
      applies_to_evaluation_triggers: ['proposed_mutation_generated'],
    });
    expect(assembled[0].conditions[0]).toMatchObject({
      condition_type: 'field_equals', target_field: 'vendor_id', condition_value: vendorId,
    });

    // evaluate against a matching proposal → primary_match, capped to suggest at always_confirm
    const result = await ruleEvaluationService.evaluate(
      { proposal: postBillProposal(vendorId), org_id: SEED.ORG_HOLDING, branchSource },
      ctx,
    );
    if ('skipped' in result) throw new Error('unexpected skip');
    expect(result.winning_rule_id).toBe(created.rule_id);
    expect(result.match_classification).toBe('primary_match');
    expect(result.winning_branch_type).toBe('primary');
  });

  it('validation boundary: a malformed stored condition_value throws RULE_BRANCH_ASSEMBLY_FAILED', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Hand-insert an active rule with a branch whose condition is field_in_range
    // but whose condition_value is a string (not {min,max}) — bypassing the RPC's
    // shape (which the production path never produces) to exercise the boundary.
    const ruleId = crypto.randomUUID();
    const { error: regErr } = await db.from('rule_registry').insert({
      id: ruleId, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST malformed-cond rule',
    });
    if (regErr) throw new Error(`registry seed failed: ${regErr.message}`);
    createdRuleIds.push(ruleId);

    const { data: br, error: brErr } = await db.from('rule_branches').insert({
      rule_id: ruleId, branch_order: 0, branch_type: 'primary', max_outcome_action: 'auto_post_at_rung_2',
      applies_to_evaluation_triggers: ['proposed_mutation_generated'],
    }).select('id').single();
    if (brErr) throw new Error(`branch seed failed: ${brErr.message}`);
    const { error: condErr } = await db.from('rule_conditions').insert({
      branch_id: br!.id, condition_order: 0, condition_type: 'field_in_range', target_field: 'amount',
      condition_value: 'not-a-range-object',
    });
    if (condErr) throw new Error(`condition seed failed: ${condErr.message}`);

    await expect(
      ruleBranchService.buildBranchSource({ org_id: SEED.ORG_HOLDING }, ctx),
    ).rejects.toThrow('RULE_BRANCH_ASSEMBLY_FAILED');
  });
});
