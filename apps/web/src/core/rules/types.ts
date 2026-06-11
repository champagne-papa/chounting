// apps/web/src/core/rules/types.ts
//
// Pure-core Rule / Branch / Condition / EvaluationContext types (ADR-0025 §1 /
// Decision 1). In-memory only — no predicate-storage substrate this arc (ADR-0025
// Non-decision); the service layer assembles Rule[] from rule_registry rows.
//
// Imports only from shared/ (ADR-0020 Block 3: core may import shared only — never
// db / services / agent / app). db-origin enum aliases route through
// shared/rules/types.

import type {
  ActionType,
  ConditionType,
  EvaluationTrigger,
  RuleAutonomyRung,
  RuleLifecycleState,
  RuleType,
  SourceTrigger,
} from '@/shared/rules/types';

export type BranchType = 'primary' | 'otherwise_if';

export type Condition = {
  condition_type: ConditionType;
  condition_order: number;
  /** Field reference into EvaluationContext.fields (source_trigger_equals reads source_trigger). */
  target_field: string;
  /**
   * Typed per condition_type at the predicate boundary: range = { min, max },
   * set = unknown[], equals/pattern = scalar/string. Validated by the service layer
   * that assembles rules; the pure core trusts the assembled shape.
   */
  condition_value: unknown;
};

export type Branch = {
  branch_order: number;
  branch_type: BranchType;
  applies_to_evaluation_triggers: EvaluationTrigger[];
  /** null = applies to any source trigger; otherwise the §6.1 step-2 branch filter. */
  applies_to_source_triggers: SourceTrigger[] | null;
  max_outcome_action: ActionType;
  conditions: Condition[];
};

export type Rule = {
  id: string;
  org_id: string;
  rule_type: RuleType;
  current_rung: RuleAutonomyRung;
  lifecycle_state: RuleLifecycleState;
  name: string | null;
  promoted_at: string | null;
  demoted_at: string | null;
  retired_at: string | null;
  created_at: string;
  branches: Branch[];
};

export type EvaluationContext = {
  evaluation_trigger: EvaluationTrigger;
  source_trigger: SourceTrigger;
  /** The proposal's typed fields, addressable by Condition.target_field. */
  fields: Record<string, unknown>;
};
