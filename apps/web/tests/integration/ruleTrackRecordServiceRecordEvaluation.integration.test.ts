// tests/integration/ruleTrackRecordServiceRecordEvaluation.integration.test.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). ruleTrackRecordService is
// the sole updater of rule_track_records. recordEvaluation records the
// EVALUATION-time effects for a winning rule:
//   • always stamps last_winning_match_at (Q-RC-AT-2 stored column);
//   • on guardrail_match, increments guardrail_fire_count + stamps
//     last_guardrail_fire_at;
//   • the APPROVAL-outcome counters (clean_approval_count / rejection_count /
//     guardrail_confirmed_count / guardrail_resolved_into_primary_bounds_count)
//     are NOT touched at this arc — they need the terminal controller
//     approve/reject signal (ADR-0024 Decision 2), a future approval-pipeline arc.
//
// The orchestrator calls this only for a winner (primary_match | guardrail_match),
// never a pure almost_match — but the service itself just acts on the
// classification, so we drive it directly here.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleTrackRecordService } from '@/services/rules/ruleTrackRecordService';

describe('ruleTrackRecordService.recordEvaluation (evaluation-time counters; ADR-0025 §6)', () => {
  const db = adminClient();
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  const createdRuleIds: string[] = [];

  // Seed rule_registry parent + co-created rule_track_records (all counters 0).
  async function seedRuleWithTrackRecord(): Promise<string> {
    const id = crypto.randomUUID();
    const { error: regErr } = await db.from('rule_registry').insert({
      id, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST track-record rule',
    });
    if (regErr) throw new Error(`registry seed failed: ${regErr.message}`);
    const { error: trErr } = await db.from('rule_track_records').insert({ rule_id: id });
    if (trErr) throw new Error(`track-record seed failed: ${trErr.message}`);
    createdRuleIds.push(id);
    return id;
  }

  afterAll(async () => {
    if (createdRuleIds.length > 0) {
      // rule_track_records cascades from rule_registry; explicit delete then parent.
      await db.from('rule_track_records').delete().in('rule_id', createdRuleIds);
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    }
  });

  it('primary_match stamps last_winning_match_at and leaves guardrail + approval counters untouched', async () => {
    const ruleId = await seedRuleWithTrackRecord();
    await ruleTrackRecordService.recordEvaluation(
      { rule_id: ruleId, classification: 'primary_match', disposition: 'pending' },
      ctx,
    );
    const { data: tr } = await db
      .from('rule_track_records')
      .select('*')
      .eq('rule_id', ruleId)
      .single();
    expect(tr!.last_winning_match_at).toBeTruthy();
    expect(tr!.guardrail_fire_count).toBe(0);
    expect(tr!.last_guardrail_fire_at).toBeNull();
    // Approval-outcome counters are NOT touched at this arc.
    expect(tr!.clean_approval_count).toBe(0);
    expect(tr!.rejection_count).toBe(0);
    expect(tr!.guardrail_confirmed_count).toBe(0);
    expect(tr!.guardrail_resolved_into_primary_bounds_count).toBe(0);
  });

  it('guardrail_match increments guardrail_fire_count + stamps last_guardrail_fire_at and last_winning_match_at', async () => {
    const ruleId = await seedRuleWithTrackRecord();
    await ruleTrackRecordService.recordEvaluation(
      { rule_id: ruleId, classification: 'guardrail_match', disposition: 'routed' },
      ctx,
    );
    const { data: tr } = await db
      .from('rule_track_records')
      .select('guardrail_fire_count, last_guardrail_fire_at, last_winning_match_at, clean_approval_count, rejection_count')
      .eq('rule_id', ruleId)
      .single();
    expect(tr!.guardrail_fire_count).toBe(1);
    expect(tr!.last_guardrail_fire_at).toBeTruthy();
    expect(tr!.last_winning_match_at).toBeTruthy();
    expect(tr!.clean_approval_count).toBe(0);
    expect(tr!.rejection_count).toBe(0);
  });

  it('guardrail_match increments are cumulative across evaluations', async () => {
    const ruleId = await seedRuleWithTrackRecord();
    await ruleTrackRecordService.recordEvaluation(
      { rule_id: ruleId, classification: 'guardrail_match', disposition: 'routed' }, ctx);
    await ruleTrackRecordService.recordEvaluation(
      { rule_id: ruleId, classification: 'guardrail_match', disposition: 'routed' }, ctx);
    const { data: tr } = await db
      .from('rule_track_records').select('guardrail_fire_count').eq('rule_id', ruleId).single();
    expect(tr!.guardrail_fire_count).toBe(2);
  });

  it('rejects an unknown rule_id with RULE_NOT_FOUND', async () => {
    await expect(
      ruleTrackRecordService.recordEvaluation(
        { rule_id: crypto.randomUUID(), classification: 'primary_match', disposition: 'pending' },
        ctx,
      ),
    ).rejects.toThrow('RULE_NOT_FOUND');
  });
});
