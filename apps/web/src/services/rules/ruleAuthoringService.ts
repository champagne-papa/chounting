// apps/web/src/services/rules/ruleAuthoringService.ts
//
// Ring 2A-authoring (ADR-0026 Decision 5 + 7). The composition layer over Ring
// 2A-core's shipped primitives: the create→approve two-step that the POST
// /api/orgs/[orgId]/rules route orchestrates. createVendorRule lands the rule in
// 'proposed' (create_vendor_rule_atomic); vendorRuleService.approve transitions
// it to 'active' + stamps provenance (the approval ceremony, approve_vendor_rule_atomic).
//
// Self-healing on partial failure: a create-succeeds-approve-fails leaves a valid
// 'proposed' rule (a valid resting state, not an inconsistent half-write — it is
// simply not in evaluate's lifecycle='active' candidate set yet). A retry dedups
// (createVendorRule → { created: false, rule_id: existing }) then approves it
// (idempotent) → recovers. So the two-step needs no combined RPC.
//
// NOT withInvariants-wrapped at definition: the route applies the single
// withInvariants({ action: 'rule.create' }) wrap at the call site (mirroring the
// row-action routes wrapping the bare-imported, self-wrapped service methods); the
// inner createVendorRule + approve each carry their own withInvariants (action-less,
// re-verifying context/org). ruleCreationOrchestrator + createVendorRule are
// untouched (T4) — this new Ring 2A-authoring file composes them.

import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';
import { vendorRuleService } from '@/services/rules/vendorRuleService';
import type { CreateVendorRuleInput } from '@/shared/schemas/rules/ruleActions.schema';

/**
 * Create + approve a vendor rule in one controller action (the POST /rules
 * create flow). Lands 'proposed' then transitions to 'active'. Returns the rule
 * id and whether it was newly created (vs deduped to an existing rule).
 */
export async function createAndApproveVendorRule(
  input: CreateVendorRuleInput,
  ctx: ServiceContext,
): Promise<{ rule_id: string; created: boolean }> {
  const { rule_id, created } = await ruleCreationOrchestrator.createVendorRule(input, ctx);
  await vendorRuleService.approve({ org_id: input.org_id, rule_id }, ctx);
  return { rule_id, created };
}
