// tests/integration/ruleEvaluateAndDispatch.integration.test.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §7 / Decision 7). The load-bearing end-to-end
// exercise of evaluateAndDispatch — the agent-layer coordinator of the full flow:
//
//   evaluate → (skip? return) → (winner? gate → effective_action) →
//   ruleEvaluationService.recordEvaluation (log append, AFTER the gate) →
//   ruleTrackRecordService.recordEvaluation (counter update, SEPARATE txn).
//
// Branch/Condition substrate does not exist this arc (Ring 2B), so production is
// branchless (no-op branchSource). Tests inject a fixture-backed branchSource
// (via input, threaded through the orchestrator) to exercise real matching. The
// branchSource returns branches ONLY for the scenario's target rule and []
// otherwise, so the winner is deterministic regardless of other active rules
// (they become branchless almost_match candidates; assertions filter by rule_id).
//
// proposalToContext flattens proposal.params as-is, so branch conditions key on
// the REAL param field names (vendor_id, proposal_type). amount is a STRING in the
// proposal schema and the core range predicates reject non-numbers, so matching
// here is via field_equals on string fields (the production-shaped path), not
// numeric ranges (which are unit-tested against typed numeric fixtures).

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { evaluateAndDispatch } from '@/agent/policies/agent-ladder/ruleEvaluationOrchestrator';
import type { BranchSource } from '@/services/rules/ruleEvaluationService';
import { makeBranch, cond } from '../fixtures/rules';
import type { ProposedMutation } from '@/shared/schemas/accounting/proposedMutation.schema';

const VENDOR = '10000000-0000-0000-0000-0000000000ff'; // string field value, not a FK

function postBillProposal(): ProposedMutation {
  return {
    proposal_type: 'post_bill',
    source_document_id: crypto.randomUUID(),
    trace_id: crypto.randomUUID(),
    params: { vendor_id: VENDOR, amount: '250', currency: 'CAD' },
  };
}

describe('evaluateAndDispatch end-to-end (evaluate → gate → log → counter; ADR-0025 §7)', () => {
  const db = adminClient();
  const createdRuleIds: string[] = [];
  const traceIds: string[] = [];

  async function seedRule(opts: { withTrackRecord: boolean }): Promise<string> {
    const id = crypto.randomUUID();
    const { error: regErr } = await db.from('rule_registry').insert({
      id, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST e2e rule',
    });
    if (regErr) throw new Error(`registry seed failed: ${regErr.message}`);
    if (opts.withTrackRecord) {
      const { error: trErr } = await db.from('rule_track_records').insert({ rule_id: id });
      if (trErr) throw new Error(`track-record seed failed: ${trErr.message}`);
    }
    createdRuleIds.push(id);
    return id;
  }

  // branchSource that yields `branches` only for `ruleId`; [] for every other rule.
  function only(ruleId: string, branches: ReturnType<typeof makeBranch>[]): BranchSource {
    return ((row: { id: string }) => (row.id === ruleId ? branches : [])) as BranchSource;
  }

  afterAll(async () => {
    if (traceIds.length > 0) await db.from('rule_evaluation_log').delete().in('trace_id', traceIds);
    if (createdRuleIds.length > 0) {
      await db.from('rule_track_records').delete().in('rule_id', createdRuleIds);
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    }
  });

  it('primary match → suggest/pending; winner log row + last_winning_match_at stamped', async () => {
    const ruleId = await seedRule({ withTrackRecord: true });
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const branchSource = only(ruleId, [
      makeBranch({ branch_order: 0, branch_type: 'primary', max_outcome_action: 'auto_post_at_rung_2', conditions: [cond('field_equals', 'vendor_id', VENDOR)] }),
    ]);

    const result = await evaluateAndDispatch({ proposal: postBillProposal(), org_id: SEED.ORG_HOLDING, branchSource }, ctx);
    if (result.skipped) throw new Error('unexpected skip');
    expect(result.matchResult.winning_rule_id).toBe(ruleId);
    expect(result.matchResult.match_classification).toBe('primary_match');
    expect(result.matchResult.winning_branch_type).toBe('primary');
    // always_confirm caps auto_post_at_rung_2 → suggest_with_required_approval → pending.
    expect(result.effective_action).toBe('suggest_with_required_approval');
    expect(result.disposition).toBe('pending');
    expect(result.logRowIds.length).toBeGreaterThanOrEqual(1);

    const { data: logRow } = await db
      .from('rule_evaluation_log')
      .select('match_classification, winning_branch_type, effective_action, disposition')
      .eq('trace_id', ctx.trace_id).eq('rule_id', ruleId).single();
    expect(logRow).toMatchObject({
      match_classification: 'primary_match',
      winning_branch_type: 'primary',
      effective_action: 'suggest_with_required_approval',
      disposition: 'pending',
    });

    const { data: tr } = await db
      .from('rule_track_records').select('last_winning_match_at, guardrail_fire_count').eq('rule_id', ruleId).single();
    expect(tr!.last_winning_match_at).toBeTruthy();
    expect(tr!.guardrail_fire_count).toBe(0);
  });

  it('guardrail (otherwise_if wins) → routed; guardrail_fire_count incremented', async () => {
    const ruleId = await seedRule({ withTrackRecord: true });
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const branchSource = only(ruleId, [
      // primary (order 0) requires a record_bill_payment proposal → fails on post_bill.
      makeBranch({ branch_order: 0, branch_type: 'primary', max_outcome_action: 'auto_post_at_rung_2', conditions: [cond('field_equals', 'proposal_type', 'record_bill_payment')] }),
      // otherwise_if (order 1) matches the vendor → guardrail winner, routes anomalies.
      makeBranch({ branch_order: 1, branch_type: 'otherwise_if', max_outcome_action: 'route_to_exception_queue_with_reason', conditions: [cond('field_equals', 'vendor_id', VENDOR)] }),
    ]);

    const result = await evaluateAndDispatch({ proposal: postBillProposal(), org_id: SEED.ORG_HOLDING, branchSource }, ctx);
    if (result.skipped) throw new Error('unexpected skip');
    expect(result.matchResult.winning_rule_id).toBe(ruleId);
    expect(result.matchResult.match_classification).toBe('guardrail_match');
    expect(result.matchResult.winning_branch_type).toBe('guardrail');
    // route_to_exception_queue_with_reason is conservative → passes the cap unchanged → routed.
    expect(result.effective_action).toBe('route_to_exception_queue_with_reason');
    expect(result.disposition).toBe('routed');

    const { data: tr } = await db
      .from('rule_track_records').select('guardrail_fire_count, last_guardrail_fire_at, last_winning_match_at').eq('rule_id', ruleId).single();
    expect(tr!.guardrail_fire_count).toBe(1);
    expect(tr!.last_guardrail_fire_at).toBeTruthy();
    expect(tr!.last_winning_match_at).toBeTruthy();
  });

  it('pure almost_match → no winner, no gate, no counter update; almost row logged', async () => {
    const ruleId = await seedRule({ withTrackRecord: true });
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    // Branch trigger matches but the condition can't (vendor_id mismatch) → almost.
    const branchSource = only(ruleId, [
      makeBranch({ branch_order: 0, conditions: [cond('field_equals', 'vendor_id', '99999999-9999-9999-9999-999999999999')] }),
    ]);

    const result = await evaluateAndDispatch({ proposal: postBillProposal(), org_id: SEED.ORG_HOLDING, branchSource }, ctx);
    if (result.skipped) throw new Error('unexpected skip');
    expect(result.matchResult.winning_rule_id).toBeNull();
    expect(result.matchResult.match_classification).toBe('almost_match');
    expect(result.effective_action).toBeNull();
    expect(result.disposition).toBeNull();

    const { data: logRow } = await db
      .from('rule_evaluation_log')
      .select('match_classification, winning_branch_type, effective_action, evaluation_trace')
      .eq('trace_id', ctx.trace_id).eq('rule_id', ruleId).single();
    expect(logRow!.match_classification).toBe('almost_match');
    expect(logRow!.winning_branch_type).toBeNull();
    expect(logRow!.effective_action).toBeNull();
    expect(logRow!.evaluation_trace).toMatchObject({
      closest_branch_id: '0',
      failed_conditions: ['field_equals:vendor_id'],
    });

    // No winner → step 4 (counter update) skipped → track record untouched.
    const { data: tr } = await db
      .from('rule_track_records').select('last_winning_match_at, guardrail_fire_count').eq('rule_id', ruleId).single();
    expect(tr!.last_winning_match_at).toBeNull();
    expect(tr!.guardrail_fire_count).toBe(0);
  });

  it('OQ-3a separate transactions: a step-5 counter failure leaves the step-4 log row committed', async () => {
    // Winner rule WITHOUT a co-created rule_track_records row → step 5
    // (ruleTrackRecordService.recordEvaluation) throws RULE_NOT_FOUND. If steps 4
    // and 5 shared a transaction the log append would roll back; they don't, so
    // the log row persists and is reconcilable.
    const ruleId = await seedRule({ withTrackRecord: false });
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const branchSource = only(ruleId, [
      makeBranch({ branch_order: 0, branch_type: 'primary', max_outcome_action: 'auto_post_at_rung_2', conditions: [cond('field_equals', 'vendor_id', VENDOR)] }),
    ]);

    await expect(
      evaluateAndDispatch({ proposal: postBillProposal(), org_id: SEED.ORG_HOLDING, branchSource }, ctx),
    ).rejects.toThrow('RULE_NOT_FOUND');

    // The log append (step 4) committed before the counter update (step 5) failed.
    const { data: logRow } = await db
      .from('rule_evaluation_log')
      .select('match_classification, effective_action')
      .eq('trace_id', ctx.trace_id).eq('rule_id', ruleId).single();
    expect(logRow).not.toBeNull();
    expect(logRow!.match_classification).toBe('primary_match');
    expect(logRow!.effective_action).toBe('suggest_with_required_approval');
  });
});
