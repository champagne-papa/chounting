// apps/web/src/services/rules/ruleBranchService.ts
//
// Ring 2B (ADR-0027 Decision 4 / 7). Single-writer-owner of rule_branches /
// rule_conditions (§5.10 disjoint-by-table). Two responsibilities:
//
//   buildBranchSource(org_id) — the production READ side. Pre-fetches every
//     active rule's branches + ordered conditions for the org into a
//     Map<rule_id, Branch[]>, then returns the SYNCHRONOUS BranchSource closure
//     the shipped ruleEvaluationService.evaluate consumes ((row) => Branch[]).
//     The sync contract (ADR-0025) cannot read the DB per-call, so the read is
//     hoisted to one batched pre-fetch and the closure is a pure Map lookup.
//
//   deriveVendorRuleBranches(...) — the WRITE side (branch DERIVATION). Computes
//     the v1 Branch payload for a vendor (pattern) rule from its parameters, for
//     create_vendor_rule_atomic's p_branches arg (the physical write is the
//     SECURITY-DEFINER RPC, not a direct INSERT here — §5.10 single-writer is
//     about ownership, ADR-0027 Decision 7 / A3).
//
// condition_value is JSONB (`unknown` in core/rules/types.ts), so the read side
// validates it per condition_type at THIS assembly boundary (the service-layer
// validation the pure core trusts). services → core is legal (ADR-0020); the
// pure evaluator is composed downstream by ruleEvaluationService.

import { z } from 'zod';
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { Branch, Condition } from '@/core/rules/types';
import type { BranchSource } from '@/services/rules/ruleEvaluationService';
import type { ConditionType, EvaluationTrigger, SourceTrigger } from '@/shared/rules/types';
import type { Database } from '@/db/types';

type RuleBranchRow = Database['public']['Tables']['rule_branches']['Row'];
type RuleConditionRow = Database['public']['Tables']['rule_conditions']['Row'];

// --- condition_value validation boundary (per condition_type) ---------------
//
// The six §5.5 PATTERN condition types get real shape validators (the v1
// evaluable set). The four temporal/inferential types are reserve-only
// (ADR-0010); the pure branchEvaluator throws on them by design, so they are
// not v1-evaluable — validated permissively here (z.unknown()) rather than
// rejected, so a forward-authored reserve-only condition doesn't break assembly;
// it would surface at evaluation, where branchEvaluator's throw is the guard.
const CONDITION_VALUE_VALIDATORS: Record<ConditionType, z.ZodTypeAny> = {
  field_equals: z.union([z.string(), z.number(), z.boolean()]),
  field_in_set: z.array(z.unknown()).min(1),
  field_in_range: z.object({ min: z.number().nullable(), max: z.number().nullable() }),
  field_outside_range: z.object({ min: z.number().nullable(), max: z.number().nullable() }),
  field_matches_pattern: z.string().min(1),
  // Forward-flags (not v1-exercised; the derivation only emits field_equals):
  //  - field_in_range/field_outside_range use z.number() bounds, but §5.5 ranges
  //    are "numeric OR temporal" — widen to admit date-string bounds when
  //    temporal ranges are authored.
  //  - source_trigger_equals is any string here, but §5.5 gives it a closed value
  //    set (the SourceTrigger enum) — could validate against it to catch
  //    authoring typos at the boundary.
  source_trigger_equals: z.string().min(1),
  // reserve-only (not v1-evaluable; branchEvaluator throws):
  schedule_matches: z.unknown(),
  cadence_matches: z.unknown(),
  semantic_match_above_threshold: z.unknown(),
  category_classification_matches: z.unknown(),
};

function rowToCondition(row: RuleConditionRow): Condition {
  const validator = CONDITION_VALUE_VALIDATORS[row.condition_type];
  const parsed = validator.safeParse(row.condition_value);
  if (!parsed.success) {
    throw new ServiceError(
      'RULE_BRANCH_ASSEMBLY_FAILED',
      `condition ${row.id} (${row.condition_type}) has a malformed condition_value: ${parsed.error.message}`,
    );
  }
  return {
    condition_type: row.condition_type,
    condition_order: row.condition_order,
    target_field: row.target_field,
    condition_value: parsed.data,
  };
}

function rowToBranch(branchRow: RuleBranchRow, conditionRows: RuleConditionRow[]): Branch {
  return {
    branch_order: branchRow.branch_order,
    branch_type: branchRow.branch_type,
    // The DB columns are trigger_type[] (8-value); the rule_branches_eval_triggers_subset
    // CHECK (20240169) guarantees applies_to_evaluation_triggers ⊆ the 2-value
    // EvaluationTrigger set, so the narrowing cast is sound.
    applies_to_evaluation_triggers: branchRow.applies_to_evaluation_triggers as EvaluationTrigger[],
    applies_to_source_triggers: branchRow.applies_to_source_triggers as SourceTrigger[] | null,
    max_outcome_action: branchRow.max_outcome_action,
    conditions: [...conditionRows]
      .sort((a, b) => a.condition_order - b.condition_order)
      .map(rowToCondition),
  };
}

// --- branch DERIVATION (write side; ADR-0027 Decision 6 / forward-flag F) ----
//
// v1 vendor-rule derivation (the underspecified-in-spec part, scoped at the
// implementation arc; see the impl scope-lock). The sole writer
// (create_vendor_rule_atomic) populates only vendor_id + outcome params, so
// vendor_id is the only match-usable datum → field_equals(vendor_id) is the
// maximal data-grounded condition. Richer derivation (amount bounds,
// field_matches_pattern, otherwise_if guardrails per §11.2) needs learned data
// absent on disk and defers to the workflow arc.
//
// Decisions (impl scope-lock):
//  - max_outcome_action = 'auto_post_at_rung_2' — the CEILING. Operator-selected
//    explicitly via the AskUserQuestion gate (2026-05-30, "Action ceiling"); the
//    advisor escalated it as a fiduciary-autonomy call and declined to cast it,
//    so the choice is the operator's on-record tap, not a lean. The rung gates
//    the effective action (new rules at always_confirm resolve to suggest-only)
//    and this arc is shadow, so it is recorded intent, reversible before any
//    live auto-post wiring.
//  - applies_to_evaluation_triggers = ['proposed_mutation_generated'] (card-only;
//    §6.5 bundle evaluation [envelope + per-child] + its Seam-1 context mapping
//    are a deliberate follow-on, not a one-token widening here).
//  - applies_to_source_triggers = null (any source): the eval-trigger already
//    scopes evaluation, and the ingest pipeline's source_trigger is not
//    user_drag_drop, so a ['user_drag_drop'] filter would wrongly exclude the
//    pipeline's own proposals.
export type DerivedBranchCondition = {
  condition_order: number;
  condition_type: ConditionType;
  target_field: string;
  condition_value: unknown;
};
export type DerivedBranch = {
  branch_order: number;
  branch_type: 'primary' | 'otherwise_if';
  max_outcome_action: Database['public']['Enums']['action_type'];
  applies_to_evaluation_triggers: EvaluationTrigger[];
  applies_to_source_triggers: SourceTrigger[] | null;
  conditions: DerivedBranchCondition[];
};

export function deriveVendorRuleBranches(input: { vendor_id: string }): DerivedBranch[] {
  return [
    {
      branch_order: 0,
      branch_type: 'primary',
      max_outcome_action: 'auto_post_at_rung_2',
      applies_to_evaluation_triggers: ['proposed_mutation_generated'],
      applies_to_source_triggers: null,
      conditions: [
        {
          condition_order: 0,
          condition_type: 'field_equals',
          target_field: 'vendor_id',
          condition_value: input.vendor_id,
        },
      ],
    },
  ];
}

export const ruleBranchService = {
  /**
   * Production BranchSource for ruleEvaluationService.evaluate. Pre-fetches every
   * active rule's branches + ordered conditions for the org, validates each
   * condition_value at the boundary, and returns the synchronous closure
   * (row) => Branch[] (empty for a rule with no branches — the inert default).
   *
   * Hoists the async read out of the sync BranchSource contract (ADR-0025): two
   * round-trips (active rule_ids, then branches+conditions) build a Map the
   * closure looks up in O(1). Decoupled from evaluate's own candidate fetch.
   */
  buildBranchSource: withInvariants(async (
    input: { org_id: string },
    ctx: ServiceContext,
  ): Promise<BranchSource> => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data: ruleRows, error: ruleErr } = await db
      .from('rule_registry')
      .select('id')
      .eq('org_id', input.org_id)
      .eq('lifecycle_state', 'active');
    if (ruleErr) throw new ServiceError('READ_FAILED', ruleErr.message);
    const ruleIds = (ruleRows ?? []).map((r) => r.id);
    if (ruleIds.length === 0) {
      return () => [];
    }

    const { data: branchRows, error: branchErr } = await db
      .from('rule_branches')
      .select('*, rule_conditions(*)')
      .in('rule_id', ruleIds);
    if (branchErr) throw new ServiceError('READ_FAILED', branchErr.message);

    const map = new Map<string, Branch[]>();
    for (const br of branchRows ?? []) {
      const conditions = (br.rule_conditions ?? []) as RuleConditionRow[];
      const branch = rowToBranch(br as RuleBranchRow, conditions);
      const arr = map.get(br.rule_id) ?? [];
      arr.push(branch);
      map.set(br.rule_id, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.branch_order - b.branch_order);
    }

    log.info({ org_id: input.org_id, rules_with_branches: map.size }, 'branchSource assembled');
    const branchSource: BranchSource = (row) => map.get(row.id) ?? [];
    return branchSource;
  }),
};
