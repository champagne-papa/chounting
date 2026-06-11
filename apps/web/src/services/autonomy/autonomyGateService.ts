// apps/web/src/services/autonomy/autonomyGateService.ts
//
// ADR-0032 Wave-3 (Canonical Autonomy Gate Seam). The SOLE append site for
// autonomy_gate_log (migration 20240173000000) — one row per autonomous commit
// attempt at the live ingest commit-path seam. Mirrors the rule_evaluation_log
// single-writer pattern (ruleEvaluationService.recordEvaluation): service-emitted
// via the service_role adminClient (RLS-bypass), append-only by single-writer
// discipline.
//
// Org-scoping (ADR-0032 D-0032.7 + §4 safety): org_id is taken from the
// org-verified `input.org_id` (the ingest pipeline's own org context, validated
// by withInvariants — the system-actor org-consistency check), never a
// caller-supplied id. withInvariants re-checks org consistency on every call.
//
// services ↛ agent (ADR-0020): this service imports only shared/ + db/ +
// middleware; it never imports the gate or the orchestrator. The seam stage
// (agent layer) composes evaluateGateOnly's disposition with this writer.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ActionType } from '@/shared/rules/types';
import type { Disposition } from '@/shared/rules/disposition';
import type { Database } from '@/db/types';

/** The two ledger-committing seam branches (the only autonomy-gate recording sites). */
export type AutonomyGateSeamBranch = 'proposed_entry_card' | 'proposed_mutation_bundle';

/**
 * Realized outcome of an autonomous attempt. V1: 'parked' ONLY — the attempt
 * always parks (Invariant 5; recording-not-deciding). DB-enforced by the
 * autonomy_gate_log.realized_outcome CHECK. The post-V1 governed-auto-commit flip
 * (V2 Track 1.1) broadens this and the CHECK to add 'committed'.
 */
export type AutonomyRealizedOutcome = 'parked';

export const autonomyGateService = {
  /**
   * Append one autonomy_gate_log row for an autonomous commit attempt. effective_action
   * / gate_disposition are NULL when no rule was gate-evaluated (a bundle attempt —
   * card-only deferral — or an entry-card attempt with no winner). realized_outcome is
   * 'parked' at V1 (the caller parks unconditionally after this returns).
   */
  recordGateAttempt: withInvariants(async (
    input: {
      org_id: string;
      trace_id?: string;
      source_document_id: string;
      seam_branch: AutonomyGateSeamBranch;
      effective_action: ActionType | null;
      gate_disposition: Disposition | null;
      realized_outcome: AutonomyRealizedOutcome;
    },
    ctx: ServiceContext,
  ): Promise<{ id: string }> => {
    const db = adminClient();

    type GateLogInsert = Database['public']['Tables']['autonomy_gate_log']['Insert'];
    const row: GateLogInsert = {
      org_id: input.org_id,
      trace_id: input.trace_id ?? ctx.trace_id,
      source_document_id: input.source_document_id,
      seam_branch: input.seam_branch,
      effective_action: input.effective_action,
      gate_disposition: input.gate_disposition,
      realized_outcome: input.realized_outcome,
    };

    const { data, error } = await db
      .from('autonomy_gate_log')
      .insert(row)
      .select('id')
      .single();
    if (error) throw new ServiceError('POST_FAILED', error.message);
    return { id: (data as { id: string }).id };
  }),
};
