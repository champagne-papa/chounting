// src/agent/tools/postJournalEntry.ts
// Master brief §6.1 + §6.5 (dry_run ledger-only). Uses existing
// PostJournalEntryInputSchema.
//
// OI-2 fix-stack foundation commit: tool description no longer asks
// the agent to perform date arithmetic. The orchestrator now resolves
// relative-date tokens server-side and surfaces the result via the
// "Resolved entry_date for this turn" line in the temporal context
// block. The agent's job is to use that resolved date when present
// or echo explicit dates verbatim from the user's prompt — never to
// compute its own date from a relative expression.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { defineTool } from './types';

export const postJournalEntryTool = defineTool({
  name: 'postJournalEntry',
  description: `Create a journal entry. ALWAYS use dry_run=true on the first call. The orchestrator replays a second call with dry_run=false only after the user approves the ProposedEntryCard. For entry_date: when the temporal context above provides a "Resolved entry_date for this turn" line, use that exact date. For explicit dates in the prompt, echo them as-is. Do not perform date arithmetic.`,
  input_schema: zodToJsonSchema(PostJournalEntryInputSchema),
  zodSchema: PostJournalEntryInputSchema,
  gatedByDispatcherSet: true,
} as const);
