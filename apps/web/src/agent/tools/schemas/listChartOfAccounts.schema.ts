// src/agent/tools/schemas/listChartOfAccounts.schema.ts
// Phase 1.2 Session 2 — Zod schema for the listChartOfAccounts
// agent tool.

import { z } from 'zod';

// Finding O2 (Option 3a, Phase 1.2 Session 8 C6 prereq): org_id
// is supplied by the orchestrator from session.org_id at service-
// call time, not by the model. Keeping org_id out of the agent
// tool schema matches the "UUIDs flow through tool input, not the
// prompt body" convention already applied to updateUserProfile
// and updateOrgProfile. See plan:
// docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-org-id-injection-plan.md
export const listChartOfAccountsInputSchema = z.object({
  include_inactive: z.boolean().optional(),
}).strict();

export type ListChartOfAccountsInput = z.infer<typeof listChartOfAccountsInputSchema>;
