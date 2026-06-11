// apps/web/src/shared/schemas/rules/ruleActions.schema.ts
//
// Ring 2A-core Commit 4 (ADR-0025 §9). Input schemas for the four rule row-action
// routes. Each `.strict()` (chounting-defined shape; schema-strictness convention).
// org_id + rule_id are injected from the route path; the rest from the request body.
// Output shapes match the ruleRegistryService method inputs (Commit 3).

import { z } from 'zod';

const uuid = z.string().uuid();

export const PromoteRuleInputSchema = z
  .object({
    org_id: uuid,
    rule_id: uuid,
    // Promotable rungs only — always_confirm is the v1 floor / demote target,
    // never a promotion target (mirrors ruleRegistryService PromotableRung).
    target_rung: z.enum(['notify_and_auto_post', 'silent_auto']),
  })
  .strict();

export const DemoteRuleInputSchema = z
  .object({ org_id: uuid, rule_id: uuid })
  .strict();

export const RenameRuleInputSchema = z
  .object({ org_id: uuid, rule_id: uuid, name: z.string().trim().min(1).max(200) })
  .strict();

export const RetireRuleInputSchema = z
  .object({ org_id: uuid, rule_id: uuid })
  .strict();

// Ring 2A-authoring (ADR-0026 §7). Input for the POST /api/orgs/[orgId]/rules
// create route. org_id injected from the path; the rest from the body. bundle_type
// is the closed v1+reserved enum (migration 20240163); default_account_id /
// legal_entity_id are optional (createVendorRule defaults them to null).
export const CreateVendorRuleInputSchema = z
  .object({
    org_id: uuid,
    vendor_id: uuid,
    bundle_type: z.enum(['born_paid_bill', 'final_invoice_with_applied_deposit', 'vendor_credit_applied_to_bill']),
    default_account_id: uuid.optional(),
    legal_entity_id: uuid.optional(),
  })
  .strict();

export type PromoteRuleInput = z.infer<typeof PromoteRuleInputSchema>;
export type DemoteRuleInput = z.infer<typeof DemoteRuleInputSchema>;
export type RenameRuleInput = z.infer<typeof RenameRuleInputSchema>;
export type RetireRuleInput = z.infer<typeof RetireRuleInputSchema>;
export type CreateVendorRuleInput = z.infer<typeof CreateVendorRuleInputSchema>;
