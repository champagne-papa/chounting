// apps/web/src/shared/schemas/rules/proposedRuleCard.schema.ts
//
// Ring 2A-authoring (ADR-0026 §3). The rule-draft payload carried by the
// `proposed_rule_card` canvas_directive. draftVendorRule (commit d) resolves the
// vendor and emits this; the ProposedRuleCard renderer (commit e) renders the
// creation-time Four Questions from it. account_hint is display-only at v1
// (OQ-2 → Ring-2B-defer); default_account_id is not resolved/sent (createVendorRule
// defaults it null) until the account selector lands at Ring 2B.
//
// Unlike proposed_entry_card, this payload carries NO orchestrator-owned UUIDs:
// org_id comes from the POST /api/orgs/[orgId]/rules path at approval, and the
// card needs no idempotency_key/trace_id. So it rides the existing canvas_directive
// path with no orchestrator post-fill (the model echoes the draftVendorRule tool
// result verbatim).

import { z } from 'zod';

export const ProposedRuleDraftSchema = z
  .object({
    // Resolved by draftVendorRule (Decision 6 — vendorService.matchVendor).
    vendor_id: z.string().uuid(),
    vendor_name: z.string(),
    // v1 default 'born_paid_bill' (the only v1-active bundle_type); the other
    // values are reserved (ADR-0012 §12).
    bundle_type: z.enum([
      'born_paid_bill',
      'final_invoice_with_applied_deposit',
      'vendor_credit_applied_to_bill',
    ]),
    // The controller's target-account phrase, carried as text; the card renders it
    // display-only at v1 (OQ-2 → Ring-2B-defer — no account selector yet;
    // default_account_id stays null until Ring 2B). Optional: a rule may be
    // created vendor+bundle-scoped without a default account at v1.
    account_hint: z.string().optional(),
    // The controller's intent, summarized — renders Q2 "Why?" on the creation card.
    utterance_summary: z.string().optional(),
  })
  .strict();

export type ProposedRuleDraft = z.infer<typeof ProposedRuleDraftSchema>;
