// src/agent/tools/listJournalEntries.ts
// Master brief §6.1. Read-only tool listing recent journal entries.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { listJournalEntriesInputSchema } from './schemas/listJournalEntries.schema';

export const listJournalEntriesTool = {
  name: 'listJournalEntries',
  description: 'List the organization\'s recent journal entries (paginated). Use to give the user context on recent activity or to reference historical entries.',
  input_schema: zodToJsonSchema(listJournalEntriesInputSchema),
  zodSchema: listJournalEntriesInputSchema,
} as const;
