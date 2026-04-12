// src/shared/types/canvasDirective.ts
// Discriminated union — Bible Section 4b.

import type { ProposedEntryCard } from './proposedEntryCard';

export type CanvasDirective =
  // Phase 1.1 — built fully:
  | { type: 'chart_of_accounts'; orgId: string }
  | { type: 'journal_entry'; entryId: string; mode: 'view' | 'edit' }
  | { type: 'journal_entry_form'; orgId: string; prefill?: Record<string, unknown> }
  | { type: 'journal_entry_list'; orgId: string }
  | { type: 'proposed_entry_card'; card: ProposedEntryCard }
  | { type: 'ai_action_review_queue'; orgId: string }
  | { type: 'report_pl'; orgId: string; from: string; to: string }
  | { type: 'none' }

  // Phase 2+ stubs — directive type defined now, canvas component is a
  // "Coming Soon" placeholder until the phase that builds it:
  | { type: 'ap_queue'; orgId: string }
  | { type: 'vendor_detail'; vendorId: string; orgId: string }
  | { type: 'bank_reconciliation'; accountId: string }
  | { type: 'ar_aging'; orgId: string }
  | { type: 'consolidated_dashboard' };
