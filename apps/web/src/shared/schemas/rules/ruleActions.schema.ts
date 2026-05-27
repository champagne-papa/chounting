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

export type PromoteRuleInput = z.infer<typeof PromoteRuleInputSchema>;
export type DemoteRuleInput = z.infer<typeof DemoteRuleInputSchema>;
export type RenameRuleInput = z.infer<typeof RenameRuleInputSchema>;
export type RetireRuleInput = z.infer<typeof RetireRuleInputSchema>;
