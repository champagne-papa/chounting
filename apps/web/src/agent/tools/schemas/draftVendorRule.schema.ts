// apps/web/src/agent/tools/schemas/draftVendorRule.schema.ts
//
// Ring 2A-authoring (ADR-0026 §1). Input for the draftVendorRule agent tool. The
// controller's natural-language drafting intent: a vendor phrase + advisory
// bundle-type/account hints. Distinct from CreateVendorRuleInputSchema (the route's
// resolved-ID input) — this is the NL-hint surface the agent receives; the tool
// resolves the vendor (Decision 6) and the card/route resolve the rest.

import { z } from 'zod';

export const DraftVendorRuleInputSchema = z
  .object({
    // The controller's reference to the vendor (e.g. "Spotify"). Resolved via
    // vendorService.matchVendor.
    vendor_text: z.string().min(1),
    // Advisory; v1 resolves to 'born_paid_bill' (the only v1-active bundle_type).
    bundle_type_hint: z.string().optional(),
    // The target-account phrase (e.g. "subscriptions"); carried to the card.
    account_hint: z.string().optional(),
  })
  .strict();

export type DraftVendorRuleInput = z.infer<typeof DraftVendorRuleInputSchema>;
