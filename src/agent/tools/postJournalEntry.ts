// src/agent/tools/postJournalEntry.ts
// Master brief §6.1 + §6.5 (dry_run ledger-only). Uses existing
// PostJournalEntryInputSchema.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';

export const postJournalEntryTool = {
  name: 'postJournalEntry',
  description: `Create a journal entry. ALWAYS use dry_run=true on the first call. The orchestrator replays a second call with dry_run=false only after the user approves the ProposedEntryCard. Resolve relative entry_date expressions (e.g., "this month," "today," "yesterday") against the Current date above.`,
  input_schema: zodToJsonSchema(PostJournalEntryInputSchema),
  zodSchema: PostJournalEntryInputSchema,
} as const;
