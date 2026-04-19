// src/agent/tools/schemas/checkPeriod.schema.ts
// Phase 1.2 Session 2 — Zod schema for the checkPeriod agent tool.

import { z } from 'zod';

export const checkPeriodInputSchema = z.object({
  org_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export type CheckPeriodInput = z.infer<typeof checkPeriodInputSchema>;
