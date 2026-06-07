// src/services/rules/ruleOutcomeReadService.ts
//
// Arc 2 T3 (agent→adminClient cleanup) — the Ring 2B shadow-eval
// outcome-param read pair, hoisted VERBATIM from
// agent/orchestrator/extraction/stages/shadowRuleEvaluation.ts
// (resolveOutcomeParams) per ADR-0020 Appendix A (agent → services
// → db; Law 1). Read-only; no withInvariants per the read-function
// asymmetry (INV-SERVICE-001 leaf).
//
// Deliberately error-TOLERANT, matching the pre-hoist semantics
// exactly: query errors are ignored and coalesce to null (the
// shadow path is fail-safe by design — A1a isolation property 2; a
// read failure must never fail the ingest). The vendors read is
// org-filtered; the vendor_rules read is by rule_id alone, exactly
// as pre-hoist.
//
// Returns primitives only — services may not import agent-layer
// types (ADR-0020, both directions of the boundary).

import { adminClient } from '@/db/adminClient';

export interface RuleOutcomeParams {
  default_account_id: string | null;
  vendor_name: string | null;
}

export async function resolveRuleOutcomeParams(
  ruleId: string,
  vendorId: string,
  orgId: string,
): Promise<RuleOutcomeParams> {
  const db = adminClient();
  const { data: vr } = await db
    .from('vendor_rules')
    .select('default_account_id')
    .eq('rule_id', ruleId)
    .maybeSingle();
  const { data: vendor } = await db
    .from('vendors')
    .select('name')
    .eq('vendor_id', vendorId)
    .eq('org_id', orgId)
    .maybeSingle();
  return {
    default_account_id: vr?.default_account_id ?? null,
    vendor_name: vendor?.name ?? null,
  };
}
