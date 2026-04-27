// src/shared/types/proposedEntryCard.ts
// Post-Phase-1.2 shape per master brief §10.1 and ADR-0002.
// The confidence_score field exists for internal logging and
// Logic Receipt storage but is never rendered in any UI
// component. policy_outcome is the user-facing surface.

export type ProposedEntryLine = {
  account_code: string;
  account_name: string;
  debit: string;          // MoneyAmount (was: number in Phase 1.1)
  credit: string;         // MoneyAmount (was: number in Phase 1.1)
  currency: string;
  description?: string;   // NEW
  tax_code?: string;      // NEW
};

export type ProposedEntryCard = {
  org_id: string;
  org_name: string;
  transaction_type: 'journal_entry' | 'bill' | 'payment' | 'intercompany';
  entry_date: string;     // NEW (ISO date)
  description: string;    // NEW
  vendor_name?: string;
  matched_rule_label?: string;
  lines: ProposedEntryLine[];
  intercompany_flag: boolean;
  reciprocal_entry_preview?: unknown;
  confidence_score: number;  // RENAMED from 'confidence' enum
  policy_outcome: {          // NEW
    required_action: 'approve';
    reason_template_id: string;
    reason_params: Record<string, unknown>;
  };
  routing_path?: string;
  idempotency_key: string;
  dry_run_entry_id: string;
  trace_id: string;       // NEW
  tentative?: boolean;    // OI-3 §3c (a) — S18: model sets true when the proposal is best-effort under ambiguity
};
