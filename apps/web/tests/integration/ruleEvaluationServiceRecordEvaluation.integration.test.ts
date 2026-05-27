// tests/integration/ruleEvaluationServiceRecordEvaluation.integration.test.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). ruleEvaluationService.
// recordEvaluation is the SOLE append site for rule_evaluation_log
// (INV-RULE-003). It expands a MatchResult into a row-per-candidate-rule set:
//   • winner row — winner-attribute columns (winning_branch_type,
//     winning_branch_max_action, effective_action, disposition) populated;
//     evaluation_trace = result.evaluation_trace;
//   • also_matched rows — winner-attribute columns NULL; match_classification
//     carries the OVERALL result classification (denormalized; also_matched_rules
//     is a string[] with no per-rule type); evaluation_trace = {};
//   • almost_match rows — match_classification = 'almost_match'; winner-attribute
//     columns NULL; evaluation_trace = { closest_branch_id, failed_conditions };
//   • zero candidates (no winner, no also_matched, no almost_match) → no insert,
//     returns { ids: [] }.
//
// recordEvaluation is driven here with SYNTHETIC MatchResults so the row
// expansion + per-row column population is asserted deterministically,
// independent of the pure-core evaluator (which is unit-tested separately).
//
// NOTE: INV-RULE-001 append-only enforcement (user-path UPDATE/DELETE blocked,
// no user INSERT, cross-org SELECT isolation) is covered in
// ruleEvaluationLogRlsIsolation.test.ts and is not duplicated here.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleEvaluationService } from '@/services/rules/ruleEvaluationService';
import type { MatchResult } from '@/shared/rules/types';

describe('ruleEvaluationService.recordEvaluation (row-per-candidate expansion; ADR-0025 §6)', () => {
  const db = adminClient();
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

  let ruleWinner: string;
  let ruleAlsoMatched: string;
  let ruleAlmost: string;
  const traceIds: string[] = [];

  beforeAll(async () => {
    ruleWinner = crypto.randomUUID();
    ruleAlsoMatched = crypto.randomUUID();
    ruleAlmost = crypto.randomUUID();
    // Composite FK (rule_id, org_id) → rule_registry(id, org_id) requires parents.
    const { error } = await db.from('rule_registry').insert([
      { id: ruleWinner, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST expand winner' },
      { id: ruleAlsoMatched, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST expand also' },
      { id: ruleAlmost, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST expand almost' },
    ]);
    if (error) throw new Error(`registry seed failed: ${error.message}`);
  });

  afterAll(async () => {
    if (traceIds.length > 0) {
      await db.from('rule_evaluation_log').delete().in('trace_id', traceIds);
    }
    await db.from('rule_registry').delete().in('id', [ruleWinner, ruleAlsoMatched, ruleAlmost]);
  });

  it('expands winner + also_matched + almost_match into one row each with correct per-row columns', async () => {
    const traceId = crypto.randomUUID();
    traceIds.push(traceId);
    const winnerTrace = { winning_rule_id: ruleWinner, matched_rule_ids: [ruleWinner, ruleAlsoMatched] };
    const matchResult: MatchResult = {
      winning_rule_id: ruleWinner,
      winning_branch: '0',
      winning_branch_type: 'primary',
      winning_branch_max_action: 'auto_post_at_rung_2',
      match_classification: 'primary_match',
      also_matched_rules: [ruleAlsoMatched],
      almost_match_rules: [
        { rule_id: ruleAlmost, closest_branch_id: '0', failed_conditions: ['field_equals:vendor_id'] },
      ],
      track_record_snapshot: {},
      four_questions_population: {},
      evaluation_trace: winnerTrace,
    };

    const { ids } = await ruleEvaluationService.recordEvaluation(
      {
        org_id: SEED.ORG_HOLDING,
        matchResult,
        effectiveAction: 'suggest_with_required_approval',
        disposition: 'pending',
        traceId,
      },
      ctx,
    );
    expect(ids).toHaveLength(3);

    const { data: rows } = await db
      .from('rule_evaluation_log')
      .select('*')
      .eq('trace_id', traceId);
    expect(rows).toHaveLength(3);

    const winner = rows!.find((r) => r.rule_id === ruleWinner)!;
    const also = rows!.find((r) => r.rule_id === ruleAlsoMatched)!;
    const almost = rows!.find((r) => r.rule_id === ruleAlmost)!;

    // Winner: all winner-attribute columns populated.
    expect(winner).toMatchObject({
      org_id: SEED.ORG_HOLDING,
      match_classification: 'primary_match',
      winning_branch_type: 'primary',
      winning_branch_max_action: 'auto_post_at_rung_2',
      effective_action: 'suggest_with_required_approval',
      disposition: 'pending',
    });
    expect(winner.evaluation_trace).toEqual(winnerTrace);

    // also_matched: overall classification denormalized; winner attrs NULL; trace {}.
    expect(also).toMatchObject({
      match_classification: 'primary_match',
      winning_branch_type: null,
      winning_branch_max_action: null,
      effective_action: null,
      disposition: null,
    });
    expect(also.evaluation_trace).toEqual({});

    // almost_match: own classification; winner attrs NULL; rule-local trace.
    expect(almost).toMatchObject({
      match_classification: 'almost_match',
      winning_branch_type: null,
      winning_branch_max_action: null,
      effective_action: null,
      disposition: null,
    });
    expect(almost.evaluation_trace).toEqual({
      closest_branch_id: '0',
      failed_conditions: ['field_equals:vendor_id'],
    });
  });

  it('denormalizes the OVERALL classification onto also_matched rows for a guardrail winner', async () => {
    const traceId = crypto.randomUUID();
    traceIds.push(traceId);
    const matchResult: MatchResult = {
      winning_rule_id: ruleWinner,
      winning_branch: '1',
      winning_branch_type: 'guardrail',
      winning_branch_max_action: 'route_to_exception_queue_with_reason',
      match_classification: 'guardrail_match',
      also_matched_rules: [ruleAlsoMatched],
      almost_match_rules: [],
      track_record_snapshot: {},
      four_questions_population: {},
      evaluation_trace: { winning_rule_id: ruleWinner },
    };
    await ruleEvaluationService.recordEvaluation(
      { org_id: SEED.ORG_HOLDING, matchResult, effectiveAction: 'route_to_exception_queue_with_reason', disposition: 'routed', traceId },
      ctx,
    );
    const { data: rows } = await db.from('rule_evaluation_log').select('rule_id, match_classification, winning_branch_type').eq('trace_id', traceId);
    const also = rows!.find((r) => r.rule_id === ruleAlsoMatched)!;
    // Loser carries the winner's overall classification, not its own match type.
    expect(also.match_classification).toBe('guardrail_match');
    expect(also.winning_branch_type).toBeNull();
  });

  it('writes NO row and returns { ids: [] } when there are zero candidates', async () => {
    const traceId = crypto.randomUUID();
    traceIds.push(traceId);
    const matchResult: MatchResult = {
      winning_rule_id: null,
      winning_branch: null,
      winning_branch_type: null,
      winning_branch_max_action: null,
      match_classification: 'almost_match',
      also_matched_rules: [],
      almost_match_rules: [],
      track_record_snapshot: {},
      four_questions_population: {},
      evaluation_trace: {},
    };
    const { ids } = await ruleEvaluationService.recordEvaluation(
      { org_id: SEED.ORG_HOLDING, matchResult, effectiveAction: null, disposition: null, traceId },
      ctx,
    );
    expect(ids).toEqual([]);
    const { count } = await db
      .from('rule_evaluation_log')
      .select('*', { count: 'exact', head: true })
      .eq('trace_id', traceId);
    expect(count).toBe(0);
  });
});
