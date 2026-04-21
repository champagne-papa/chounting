// src/agent/tools/schemas/listJournalEntries.schema.ts
// Phase 1.2 Session 2 — Zod schema for the listJournalEntries
// agent tool.

import { z } from 'zod';

// Finding O2 (Option 3a): org_id supplied by the orchestrator
// from session.org_id at service-call time. See
// docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-org-id-injection-plan.md
export const listJournalEntriesInputSchema = z.object({
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
}).strict();

export type ListJournalEntriesInput = z.infer<typeof listJournalEntriesInputSchema>;
