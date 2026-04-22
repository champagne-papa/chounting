// src/agent/tools/listJournalEntries.ts
// Master brief §6.1. Read-only tool listing recent journal entries.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { listJournalEntriesInputSchema } from './schemas/listJournalEntries.schema';

export const listJournalEntriesTool = {
  name: 'listJournalEntries',
  description: `List the organization's recent journal entries (paginated). Use this tool to: (a) give the user context on recent activity; (b) resolve user references to specific entries by number ("entry 42", "yesterday's entry"); (c) answer questions about historical entries. The org_id parameter is injected automatically by the orchestrator (as with all tools in this system) — never ask the user for it, and do not attempt to provide a value yourself.`,
  input_schema: zodToJsonSchema(listJournalEntriesInputSchema),
  zodSchema: listJournalEntriesInputSchema,
} as const;
