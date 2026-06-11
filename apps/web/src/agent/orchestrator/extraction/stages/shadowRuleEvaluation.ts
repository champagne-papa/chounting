// apps/web/src/agent/orchestrator/extraction/stages/shadowRuleEvaluation.ts
//
// Ring 2B Seam-1 (ADR-0027 Decision 5 / 6). The production caller that feeds the
// shipped-but-inert evaluator from the ingest pipeline, in SHADOW/diagnostic mode
// (A1a — §9.2): records MatchResult + Logic Receipt (rule_evaluation_log) +
// counters, and does NOT auto-post. Attached in ingestDocument between
// buildProposal and the live auto-commit composite.
//
// Three isolation properties (the load-bearing A1a guarantees — this MUST NOT
// affect the live auto-commit):
//   1. GATED — process.env.RING2B_SHADOW_EVAL === 'true', default OFF. A
//      diagnostic feature flag (not a secret, not an org_settings rule-pref);
//      read at call time so it is runtime-toggleable and test-settable. Default
//      off means production ingest pays nothing until explicitly enabled.
//   2. FAIL-SAFE — shadowEvaluateRules swallows every error (a branchSource
//      fetch or log-write failure must never fail the ingest or block the commit).
//   3. TRANSACTION-ISOLATED — evaluateAndDispatch's writes are its own statements,
//      run BEFORE the commit composite, never joined to billService.post's txn.
//
// CARD-ONLY (the spine). proposalToContext hardcodes
// evaluation_trigger='proposed_mutation_generated' for every ProposedMutation,
// so the v1 derived branch (applies_to_evaluation_triggers=['proposed_mutation_generated'])
// always matches whatever evaluate() is fed — card-only therefore CANNOT come
// from the trigger filter; it is enforced HERE by feeding ONLY the
// proposed_entry_card kind. Bundles (proposed_mutation_bundle) are SKIPPED
// whole — NOT decomposed into children fed individually, which would evaluate
// them as proposed_mutation_generated and silently violate the §6.5 card-only
// deferral. Attachment cards (non-ledger) are skipped too.

import type { ServiceContext, SystemActorServiceContext } from '@/services/middleware/serviceContext';
import { resolveRuleOutcomeParams } from '@/services/rules/ruleOutcomeReadService';

import { loggerWith } from '@/shared/logger/pino';
import { evaluateAndDispatch } from '@/agent/policies/agent-ladder/ruleEvaluationOrchestrator';
import { ruleBranchService } from '@/services/rules/ruleBranchService';
import type { ProposedMutation } from '@/shared/schemas/accounting/proposedMutation.schema';

type ShadowCtx = ServiceContext | SystemActorServiceContext;

export type ShadowEvaluateArgs = {
  proposalKind: string;
  vendorId: string | null | undefined;
  org_id: string;
  source_document_id: string;
  trace_id: string;
};

function shadowEnabled(): boolean {
  return process.env.RING2B_SHADOW_EVAL === 'true';
}

/**
 * Gate + card-only kind-branch + fail-safe wrapper. Returns silently (does
 * nothing) when disabled, when the proposal is not a single entry card, or when
 * there is no vendor to match on. Never throws.
 */
export async function shadowEvaluateRules(args: ShadowEvaluateArgs, ctx: ShadowCtx): Promise<void> {
  if (!shadowEnabled()) return;
  // CARD-ONLY: only single entry cards. Bundles + attachment cards are skipped
  // whole (no bundle decomposition — see header).
  if (args.proposalKind !== 'proposed_entry_card') return;
  if (!args.vendorId) return;

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id ?? undefined });
  try {
    await runShadowEvaluation(args, ctx);
  } catch (err) {
    // FAIL-SAFE: the shadow is a diagnostic; its failure must never fail the
    // ingest or block the live auto-commit that follows.
    log.warn({ trace_id: args.trace_id, err }, 'Ring 2B shadow evaluation failed (swallowed; ingest unaffected)');
  }
}

/**
 * The shadow evaluation itself (no gate, no swallow — exported for direct test).
 * Constructs a ProposedMutation from the vendor match, builds the production
 * branchSource, runs evaluateAndDispatch (records log + counters, no auto-post),
 * and resolves + records the winner's outcome domain-parameters (Decision 6:
 * default_account_id + vendor-name resolved-and-recorded, consumption deferred).
 *
 * proposal_type = 'post_bill' is a v1 simplification: the derived branch matches
 * on field_equals(vendor_id) and is proposal_type-agnostic, so the value does not
 * affect the shadow match. Faithful post_bill-vs-record_bill_payment derivation
 * is a follow-on (it matters only once non-vendor conditions or per-type branches
 * exist).
 */
export async function runShadowEvaluation(args: ShadowEvaluateArgs, ctx: ShadowCtx): Promise<void> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id ?? undefined });

  const shadowMutation: ProposedMutation = {
    proposal_type: 'post_bill',
    source_document_id: args.source_document_id,
    trace_id: args.trace_id,
    params: { vendor_id: args.vendorId ?? undefined },
  };

  const branchSource = await ruleBranchService.buildBranchSource({ org_id: args.org_id }, ctx);
  const result = await evaluateAndDispatch(
    { proposal: shadowMutation, org_id: args.org_id, branchSource },
    ctx,
  );

  if (result.skipped) {
    log.info({ trace_id: args.trace_id, reason: result.reason }, 'Ring 2B shadow: evaluation skipped');
    return;
  }

  if (!result.matchResult.winning_rule_id) {
    log.info(
      { trace_id: args.trace_id, classification: result.matchResult.match_classification },
      'Ring 2B shadow: no winner (recorded, not auto-posted)',
    );
    return;
  }

  // Decision 6: resolve the winner's outcome domain-parameters + vendor name,
  // recorded in the trace at shadow scope; posting consumption defers to the
  // workflow arc.
  // resolveOutcomeParams hoisted to ruleOutcomeReadService (Arc 2 T3,
  // ADR-0020 App. A); error-tolerant null-coalescing semantics
  // preserved verbatim (A1a fail-safe isolation).
  const resolved = await resolveRuleOutcomeParams(result.matchResult.winning_rule_id, args.vendorId!, args.org_id);
  log.info(
    {
      trace_id: args.trace_id,
      winning_rule_id: result.matchResult.winning_rule_id,
      match_classification: result.matchResult.match_classification,
      effective_action: result.effective_action,
      disposition: result.disposition,
      resolved_default_account_id: resolved.default_account_id,
      resolved_vendor_name: resolved.vendor_name,
    },
    'Ring 2B shadow: rule match (recorded, not auto-posted)',
  );
}
