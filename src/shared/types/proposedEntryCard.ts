// src/shared/types/proposedEntryCard.ts
// Full type definition (used by component shell in Phase 1.1).
// The Zod schema that validates this type lives in
// src/shared/schemas/accounting/journalEntry.schema.ts (Phase 1.2).

export type ProposedEntryLine = {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  currency: string;
};

export type ProposedEntryCard = {
  org_id: string;
  org_name: string;
  transaction_type: 'journal_entry' | 'bill' | 'payment' | 'intercompany';
  vendor_name?: string;
  matched_rule_label?: string;
  lines: ProposedEntryLine[];
  intercompany_flag: boolean;
  reciprocal_entry_preview?: unknown;
  agent_reasoning: string;
  confidence: 'high' | 'medium' | 'low' | 'novel';
  routing_path?: string;          // Category A reservation, display only in Phase 1
  idempotency_key: string;
  dry_run_entry_id: string;
};
