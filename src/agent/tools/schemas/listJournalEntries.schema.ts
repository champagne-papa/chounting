// src/agent/tools/schemas/listJournalEntries.schema.ts
// Phase 1.2 Session 2 — Zod schema for the listJournalEntries
// agent tool.

import { z } from 'zod';

export const listJournalEntriesInputSchema = z.object({
  org_id: z.string().uuid(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
}).strict();

export type ListJournalEntriesInput = z.infer<typeof listJournalEntriesInputSchema>;
