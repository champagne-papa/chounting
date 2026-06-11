// tests/integration/shadowRuleEvaluation.integration.test.ts
//
// Ring 2B Seam-1 (ADR-0027 Decision 5/6). The shadow rule evaluation the ingest
// pipeline attaches between buildProposal and the live auto-commit.
//
// Covers the three isolation properties + the card-only spine:
//  - GATE (default off): shadowEvaluateRules does nothing when RING2B_SHADOW_EVAL
//    is unset, even for a matching proposed_entry_card.
//  - CARD-ONLY: with the gate ON, a proposed_mutation_bundle is skipped whole (no
//    log row); a proposed_entry_card records.
//  - RECORDING: runShadowEvaluation (gate-bypassed) feeds the production
//    branchSource → evaluateAndDispatch → a Logic Receipt (rule_evaluation_log)
//    row lands for the matched rule. Shadow only — no ledger mutation asserted.

import { describe, it, expect, afterAll, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';
import { vendorRuleService } from '@/services/rules/vendorRuleService';
import {
  shadowEvaluateRules,
  runShadowEvaluation,
} from '@/agent/orchestrator/extraction/stages/shadowRuleEvaluation';

describe('shadowRuleEvaluation — Ring 2B Seam-1 (ADR-0027 Decision 5/6)', () => {
  const db = adminClient();
  const createdRuleIds: string[] = [];
  const createdVendorIds: string[] = [];
  const traceIds: string[] = [];

  afterEach(() => {
    delete process.env.RING2B_SHADOW_EVAL;
  });

  afterAll(async () => {
    if (traceIds.length > 0) await db.from('rule_evaluation_log').delete().in('trace_id', traceIds);
    if (createdRuleIds.length > 0) await db.from('rule_registry').delete().in('id', createdRuleIds);
    if (createdVendorIds.length > 0) await db.from('vendors').delete().in('vendor_id', createdVendorIds);
  });

  async function seedActiveVendorRule(ctx: ReturnType<typeof makeTestContext>): Promise<string> {
    const vendorId = crypto.randomUUID();
    const { error } = await db.from('vendors').insert({
      vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST shadow vendor',
    });
    if (error) throw new Error(`vendor seed failed: ${error.message}`);
    createdVendorIds.push(vendorId);
    const created = await ruleCreationOrchestrator.createVendorRule(
      { org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bundle_type: 'born_paid_bill' },
      ctx,
    );
    createdRuleIds.push(created.rule_id);
    await vendorRuleService.approve({ org_id: SEED.ORG_HOLDING, rule_id: created.rule_id }, ctx);
    return vendorId;
  }

  function args(ctx: ReturnType<typeof makeTestContext>, vendorId: string, proposalKind: string) {
    return {
      proposalKind,
      vendorId,
      org_id: SEED.ORG_HOLDING,
      source_document_id: crypto.randomUUID(),
      trace_id: ctx.trace_id,
    };
  }

  it('GATE off (default): shadowEvaluateRules records nothing even for a matching entry card', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const vendorId = await seedActiveVendorRule(ctx);

    // RING2B_SHADOW_EVAL unset → no-op
    await shadowEvaluateRules(args(ctx, vendorId, 'proposed_entry_card'), ctx);

    const { count } = await db
      .from('rule_evaluation_log').select('*', { count: 'exact', head: true }).eq('trace_id', ctx.trace_id);
    expect(count).toBe(0);
  });

  it('CARD-ONLY: with the gate on, a bundle is skipped whole; an entry card records', async () => {
    process.env.RING2B_SHADOW_EVAL = 'true';
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const vendorId = await seedActiveVendorRule(ctx);

    // bundle → skipped whole (no decomposition), no log row
    await shadowEvaluateRules(args(ctx, vendorId, 'proposed_mutation_bundle'), ctx);
    const { count: afterBundle } = await db
      .from('rule_evaluation_log').select('*', { count: 'exact', head: true }).eq('trace_id', ctx.trace_id);
    expect(afterBundle).toBe(0);

    // entry card → records a Logic Receipt row for the matched rule
    await shadowEvaluateRules(args(ctx, vendorId, 'proposed_entry_card'), ctx);
    const { data: rows } = await db
      .from('rule_evaluation_log')
      .select('rule_id, match_classification, effective_action')
      .eq('trace_id', ctx.trace_id);
    expect(rows!.length).toBeGreaterThanOrEqual(1);
    const winner = rows!.find((r) => createdRuleIds.includes(r.rule_id));
    expect(winner).toBeTruthy();
    expect(winner!.match_classification).toBe('primary_match');
    // auto_post_at_rung_2 capped to suggest at always_confirm (shadow, not posted)
    expect(winner!.effective_action).toBe('suggest_with_required_approval');
  });

  it('RECORDING: runShadowEvaluation (gate-bypassed) writes the Logic Receipt for the matched rule', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const vendorId = await seedActiveVendorRule(ctx);

    await runShadowEvaluation(args(ctx, vendorId, 'proposed_entry_card'), ctx);

    const { data: rows } = await db
      .from('rule_evaluation_log').select('rule_id, match_classification').eq('trace_id', ctx.trace_id);
    const winner = rows!.find((r) => createdRuleIds.includes(r.rule_id));
    expect(winner).toBeTruthy();
    expect(winner!.match_classification).toBe('primary_match');
  });
});
