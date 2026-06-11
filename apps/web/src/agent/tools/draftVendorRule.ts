// apps/web/src/agent/tools/draftVendorRule.ts
//
// Ring 2A-authoring (ADR-0026 §1/§6). The conversational rule-drafting entry point:
// when the controller expresses a recurring-coding intent ("always code Spotify to
// subscriptions"), the model emits this tool. The orchestrator's executeTool branch
// resolves the vendor (vendorService.matchVendor, Decision 6) and returns a
// discriminated result — rule_draft (confident match) / vendor_ambiguous (candidates)
// / vendor_not_found. The persona scaffolding (controller.ts) conditions the model
// to emit a proposed_rule_card canvas_directive on rule_draft, or a clarification
// respondToUser on ambiguous/not-found. gatedByDispatcherSet: true — org-scoped
// (operates on the controller's org); auto-joins ORG_SCOPED_TOOLS.

import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { vendorService } from '@/services/spend/vendorService';
import { DraftVendorRuleInputSchema, type DraftVendorRuleInput } from './schemas/draftVendorRule.schema';
import { defineTool } from './types';

export const draftVendorRuleTool = defineTool({
  name: 'draftVendorRule',
  description: `Propose a vendor-coding rule when the controller expresses a recurring-coding intent (e.g. "always code Spotify to subscriptions", "set up Acme bills to go to office expenses"). Pass the vendor phrase as vendor_text and the target-account phrase as account_hint. The orchestrator resolves the vendor: on a confident match it returns a rule_draft (emit a proposed_rule_card for the controller to approve); on an ambiguous or unrecognized vendor it returns candidates / not-found (ask the controller to clarify, or to create the vendor first). Controller-only — rule creation is controller authority.`,
  input_schema: zodToJsonSchema(DraftVendorRuleInputSchema),
  zodSchema: DraftVendorRuleInputSchema,
  gatedByDispatcherSet: true,
} as const);

/**
 * The discriminated result of resolving a draft. The orchestrator's executeTool
 * branch returns this; the persona scaffolding (controller.ts) conditions the
 * model to emit a proposed_rule_card directive on `rule_draft`, or a clarification
 * respondToUser on `vendor_ambiguous` / `vendor_not_found`.
 */
export type DraftVendorRuleResult =
  | {
      kind: 'rule_draft';
      vendor_id: string;
      vendor_name: string;
      bundle_type: 'born_paid_bill';
      account_hint: string | null;
    }
  | { kind: 'vendor_ambiguous'; candidates: { vendor_id: string; vendor_name: string }[] }
  | { kind: 'vendor_not_found'; vendor_text: string };

/**
 * Resolve a draft against the vendor catalog (Decision 6). No mutation — the
 * create→approve two-step fires when the controller approves the resulting card
 * (POST /api/orgs/[orgId]/rules). bundle_type defaults to 'born_paid_bill' (the
 * only v1-active value); account_hint is carried as text for the card to resolve.
 * vendor_name is the controller's phrase at v1 (matchVendor returns no canonical
 * name on a confident match).
 */
export async function resolveDraftVendorRule(
  input: DraftVendorRuleInput,
  org_id: string,
  ctx: ServiceContext,
): Promise<DraftVendorRuleResult> {
  const match = await vendorService.matchVendor(
    { org_id, vendorField: { vendor_text: input.vendor_text }, trace_id: ctx.trace_id },
    ctx,
  );
  if (match.vendor_id !== null) {
    return {
      kind: 'rule_draft',
      vendor_id: match.vendor_id,
      vendor_name: input.vendor_text,
      bundle_type: 'born_paid_bill',
      account_hint: input.account_hint ?? null,
    };
  }
  if (match.candidate_alternatives.length > 0) {
    return {
      kind: 'vendor_ambiguous',
      candidates: match.candidate_alternatives.map((c) => ({
        vendor_id: c.vendor_id,
        vendor_name: c.vendor_name,
      })),
    };
  }
  return { kind: 'vendor_not_found', vendor_text: input.vendor_text };
}
