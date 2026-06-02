// apps/web/src/agent/orchestrator/extraction/stages/recordAutonomyGate.ts
//
// ADR-0032 Wave-3 (Canonical Autonomy Gate Seam) — R1 recorder. Records ONE
// autonomy_gate_log row per autonomous commit attempt at the two ledger-committing
// ingestDocument branches (proposed_entry_card, proposed_mutation_bundle), then the
// caller parks unconditionally.
//
// Three load-bearing properties:
//   1. FAIL-SAFE (D-0032.2 / D-0032.7) — swallows every error so a recording
//      failure can NEVER alter the ingest control flow or block the unconditional
//      park that follows this call. The park survives by construction: this returns
//      void and the caller's `return { status: 'parked_unposted', ... }` is untouched.
//   2. NO DOUBLE-RECORD (D-0032.4) — obtains the gate disposition via the read-only
//      evaluateGateOnly (evaluate → gate, no write), NEVER evaluateAndDispatch /
//      recordEvaluation; it writes only autonomy_gate_log, never rule_evaluation_log.
//   3. ALWAYS-ON — unlike the default-OFF shadow seam, this is the V1 production
//      recorder (no feature flag): every autonomous attempt at the two branches
//      records one result (the charter R1 "one result per autonomous attempt").
//
// CARD-ONLY DEFERRAL. Only proposed_entry_card is gate-evaluated (the evaluator is
// card-grain; feeding a bundle as a card would violate the §6.5 card-only discipline
// — see shadowRuleEvaluation.ts). A proposed_mutation_bundle attempt still records
// ONE row (OQ-2), with a null disposition (no gate evaluation). An entry-card attempt
// with no vendor to match on also records with a null disposition (no winner). The
// seam_branch column disambiguates the two null cases.

import type { ServiceContext, SystemActorServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { evaluateGateOnly } from '@/agent/policies/agent-ladder/ruleEvaluationOrchestrator';
import { ruleBranchService } from '@/services/rules/ruleBranchService';
import {
  autonomyGateService,
  type AutonomyGateSeamBranch,
} from '@/services/autonomy/autonomyGateService';
import type { ProposedMutation } from '@/shared/schemas/accounting/proposedMutation.schema';
import type { ActionType } from '@/shared/rules/types';
import type { Disposition } from '@/shared/rules/disposition';

type Ctx = ServiceContext | SystemActorServiceContext;

export type RecordAutonomyGateArgs = {
  proposalKind: AutonomyGateSeamBranch; // the two ledger-committing branches only
  vendorId: string | null | undefined;
  org_id: string;
  source_document_id: string;
  trace_id: string;
};

/**
 * Record one autonomy_gate_log attempt row, then return (the caller parks).
 * Fail-safe: never throws. See the file header for the three load-bearing
 * properties (fail-safe, no-double-record, always-on) and the card-only deferral.
 */
export async function recordAutonomyGateAttempt(args: RecordAutonomyGateArgs, ctx: Ctx): Promise<void> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id ?? undefined });
  try {
    let effective_action: ActionType | null = null;
    let gate_disposition: Disposition | null = null;

    // Only entry cards are gate-evaluated (card-grain). Bundles + no-vendor cards
    // record with a null disposition (see header).
    if (args.proposalKind === 'proposed_entry_card' && args.vendorId) {
      const mutation: ProposedMutation = {
        proposal_type: 'post_bill',
        source_document_id: args.source_document_id,
        trace_id: args.trace_id,
        params: { vendor_id: args.vendorId },
      };
      const branchSource = await ruleBranchService.buildBranchSource({ org_id: args.org_id }, ctx);
      // READ-ONLY: evaluateGateOnly never writes rule_evaluation_log (D-0032.4).
      const evald = await evaluateGateOnly(
        { proposal: mutation, org_id: args.org_id, branchSource },
        ctx,
      );
      if (!evald.skipped) {
        effective_action = evald.effective_action;
        gate_disposition = evald.disposition;
      }
    }

    await autonomyGateService.recordGateAttempt(
      {
        org_id: args.org_id,
        trace_id: args.trace_id,
        source_document_id: args.source_document_id,
        seam_branch: args.proposalKind,
        effective_action,
        gate_disposition,
        realized_outcome: 'parked', // V1: recording-not-deciding (Invariant 5)
      },
      ctx,
    );
  } catch (err) {
    // FAIL-SAFE: the recorder is diagnostic at V1; its failure must never fail the
    // ingest or alter the unconditional park that follows this call (D-0032.2).
    log.warn(
      { trace_id: args.trace_id, err },
      'ADR-0032 autonomy gate recording failed (swallowed; park unaffected)',
    );
  }
}
