// src/agent/tools/reverseJournalEntry.ts
// Master brief §6.1 + §6.5. Uses ReversalInputSchema (same file
// as postJournalEntry schemas). dry_run required.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { ReversalInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';

export const reverseJournalEntryTool = {
  name: 'reverseJournalEntry',
  description: 'Reverse an existing journal entry. Requires reverses_journal_entry_id and a non-empty reversal_reason. ALWAYS use dry_run=true on the first call — same confirm seam as postJournalEntry.',
  input_schema: zodToJsonSchema(ReversalInputSchema),
  zodSchema: ReversalInputSchema,
} as const;
