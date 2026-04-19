// src/agent/tools/schemas/listChartOfAccounts.schema.ts
// Phase 1.2 Session 2 — Zod schema for the listChartOfAccounts
// agent tool.

import { z } from 'zod';

export const listChartOfAccountsInputSchema = z.object({
  org_id: z.string().uuid(),
  include_inactive: z.boolean().optional(),
}).strict();

export type ListChartOfAccountsInput = z.infer<typeof listChartOfAccountsInputSchema>;
