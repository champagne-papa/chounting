// tests/integration/autonomyGateRecording.integration.test.ts
//
// ADR-0032 Wave-3 (Canonical Autonomy Gate Seam) — R1 recorder. The seam records
// ONE autonomy_gate_log row per autonomous commit attempt at the two
// ledger-committing ingestDocument branches, then the caller parks unconditionally.
//
// Covers the ADR's load-bearing properties:
//  - RECORDS one attempt row (entry_card winner → gate disposition; bundle + no-vendor
//    → null disposition, OQ-2 one-row-per-bundle-attempt).
//  - RECORDING-NOT-DECIDING: realized_outcome is always 'parked' (D-0032.2).
//  - NO DOUBLE-RECORD: writes autonomy_gate_log, NOT rule_evaluation_log (D-0032.4 —
//    R1 uses the read-only evaluateGateOnly, never evaluateAndDispatch).
//  - FAIL-SAFE: a recording failure is swallowed (never throws) so the caller's
//    unconditional park is always reached (D-0032.2 / D-0032.7).
//  - ORG-SCOPED: the row's org_id is the org-verified input org (§4 safety).

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';
import { vendorRuleService } from '@/services/rules/vendorRuleService';
import { recordAutonomyGateAttempt } from '@/agent/orchestrator/extraction/stages/recordAutonomyGate';

describe('ADR-0032 autonomy gate recording — R1 seam (Wave 3)', () => {
  const db = adminClient();
  const createdRuleIds: string[] = [];
  const createdVendorIds: string[] = [];
  const traceIds: string[] = [];

  afterAll(async () => {
    if (traceIds.length > 0) await db.from('autonomy_gate_log').delete().in('trace_id', traceIds);
    if (traceIds.length > 0) await db.from('rule_evaluation_log').delete().in('trace_id', traceIds);
    if (createdRuleIds.length > 0) await db.from('rule_registry').delete().in('id', createdRuleIds);
    if (createdVendorIds.length > 0) await db.from('vendors').delete().in('vendor_id', createdVendorIds);
  });

  async function seedActiveVendorRule(ctx: ReturnType<typeof makeTestContext>): Promise<string> {
    const vendorId = crypto.randomUUID();
    const { error } = await db.from('vendors').insert({
      vendor_id: vendorId, org_id: SEED.ORG_HOLDING, name: 'TEST autonomy-gate vendor',
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

  function args(
    ctx: ReturnType<typeof makeTestContext>,
    vendorId: string | null,
    proposalKind: 'proposed_entry_card' | 'proposed_mutation_bundle',
  ) {
    return {
      proposalKind,
      vendorId,
      org_id: SEED.ORG_HOLDING,
      source_document_id: crypto.randomUUID(),
      trace_id: ctx.trace_id,
    };
  }

  it('entry_card with a matching rule: records ONE row with the gate disposition + parked', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const vendorId = await seedActiveVendorRule(ctx);

    await recordAutonomyGateAttempt(args(ctx, vendorId, 'proposed_entry_card'), ctx);

    const { data: rows } = await db
      .from('autonomy_gate_log')
      .select('org_id, seam_branch, effective_action, gate_disposition, realized_outcome')
      .eq('trace_id', ctx.trace_id);
    expect(rows!.length).toBe(1);
    const row = rows![0];
    expect(row.org_id).toBe(SEED.ORG_HOLDING); // org-scoped from the verified input org
    expect(row.seam_branch).toBe('proposed_entry_card');
    expect(row.realized_outcome).toBe('parked'); // recording-not-deciding (D-0032.2)
    // Mirrors the shadow seam: auto_post_at_rung_2 capped to suggest at always_confirm.
    expect(row.effective_action).toBe('suggest_with_required_approval');
    expect(row.gate_disposition).toBe('pending');
  });

  it('bundle attempt: records ONE row, null disposition (card-only deferral, OQ-2)', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const vendorId = await seedActiveVendorRule(ctx);

    await recordAutonomyGateAttempt(args(ctx, vendorId, 'proposed_mutation_bundle'), ctx);

    const { data: rows } = await db
      .from('autonomy_gate_log')
      .select('seam_branch, effective_action, gate_disposition, realized_outcome')
      .eq('trace_id', ctx.trace_id);
    expect(rows!.length).toBe(1);
    expect(rows![0].seam_branch).toBe('proposed_mutation_bundle');
    expect(rows![0].effective_action).toBeNull();
    expect(rows![0].gate_disposition).toBeNull();
    expect(rows![0].realized_outcome).toBe('parked');
  });

  it('entry_card with no vendor: still records ONE attempt row, null disposition', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);

    await recordAutonomyGateAttempt(args(ctx, null, 'proposed_entry_card'), ctx);

    const { data: rows } = await db
      .from('autonomy_gate_log')
      .select('seam_branch, gate_disposition, realized_outcome')
      .eq('trace_id', ctx.trace_id);
    expect(rows!.length).toBe(1);
    expect(rows![0].gate_disposition).toBeNull();
    expect(rows![0].realized_outcome).toBe('parked');
  });

  it('NO DOUBLE-RECORD: an entry_card attempt writes autonomy_gate_log, NOT rule_evaluation_log', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    traceIds.push(ctx.trace_id);
    const vendorId = await seedActiveVendorRule(ctx);

    await recordAutonomyGateAttempt(args(ctx, vendorId, 'proposed_entry_card'), ctx);

    const { count: gateCount } = await db
      .from('autonomy_gate_log').select('*', { count: 'exact', head: true }).eq('trace_id', ctx.trace_id);
    const { count: ruleLogCount } = await db
      .from('rule_evaluation_log').select('*', { count: 'exact', head: true }).eq('trace_id', ctx.trace_id);
    expect(gateCount).toBe(1);
    // R1 obtains its disposition via the read-only evaluateGateOnly; it never calls
    // evaluateAndDispatch/recordEvaluation, so rule_evaluation_log is untouched.
    expect(ruleLogCount).toBe(0);
  });

  it('FAIL-SAFE: a recording failure is swallowed (no throw); the park is unaffected', async () => {
    // A non-existent org_id passes the caller-org check but violates the
    // autonomy_gate_log org_id FK → recordGateAttempt throws → the fail-safe wrapper
    // swallows it (returns void), so the caller's unconditional park is reached.
    const bogusOrg = crypto.randomUUID();
    const ctx = makeTestContext({ org_ids: [bogusOrg] });
    traceIds.push(ctx.trace_id);

    await expect(
      recordAutonomyGateAttempt(
        {
          proposalKind: 'proposed_mutation_bundle',
          vendorId: null,
          org_id: bogusOrg,
          source_document_id: crypto.randomUUID(),
          trace_id: ctx.trace_id,
        },
        ctx,
      ),
    ).resolves.toBeUndefined();

    const { count } = await db
      .from('autonomy_gate_log').select('*', { count: 'exact', head: true }).eq('trace_id', ctx.trace_id);
    expect(count).toBe(0); // the FK rejected the insert; the error was swallowed
  });
});
