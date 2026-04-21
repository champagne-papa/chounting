// src/agent/tools/schemas/checkPeriod.schema.ts
// Phase 1.2 Session 2 — Zod schema for the checkPeriod agent tool.

import { z } from 'zod';

// Finding O2 (Option 3a): org_id supplied by the orchestrator
// from session.org_id at service-call time. See
// docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-org-id-injection-plan.md
export const checkPeriodInputSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export type CheckPeriodInput = z.infer<typeof checkPeriodInputSchema>;
