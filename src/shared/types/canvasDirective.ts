// src/shared/types/canvasDirective.ts
// Discriminated union — Bible Section 4b.

import type { ProposedEntryCard } from './proposedEntryCard';

export type CanvasDirective =
  // Phase 1.1 — built fully:
  | { type: 'chart_of_accounts'; orgId: string }
  | { type: 'journal_entry'; orgId: string; entryId: string; mode: 'view' | 'edit' }
  | { type: 'journal_entry_form'; orgId: string; prefill?: Record<string, unknown> }
  | { type: 'journal_entry_list'; orgId: string }
  | { type: 'proposed_entry_card'; card: ProposedEntryCard }
  | { type: 'ai_action_review_queue'; orgId: string }
  | { type: 'report_pl'; orgId: string; periodId?: string }
  | { type: 'report_trial_balance'; orgId: string; periodId?: string }
  | { type: 'report_balance_sheet'; orgId: string; asOfDate?: string }
  | { type: 'reversal_form'; orgId: string; sourceEntryId: string }
  | { type: 'none' }

  // Phase 1.2 Session 6 — form-escape surfaces + onboarding navigation:
  | { type: 'user_profile' }
  | { type: 'org_profile'; orgId: string }
  | { type: 'org_users'; orgId: string }
  | { type: 'invite_user'; orgId: string }
  | { type: 'welcome' }

  // Phase 2+ stubs — directive type defined now, canvas component is a
  // "Coming Soon" placeholder until the phase that builds it:
  | { type: 'ap_queue'; orgId: string }
  | { type: 'vendor_detail'; vendorId: string; orgId: string }
  | { type: 'bank_reconciliation'; accountId: string }
  | { type: 'ar_aging'; orgId: string }
  | { type: 'consolidated_dashboard' };

/** Callback type for canvas directive navigation. Used by components
 *  that need to trigger directive changes (e.g., list → detail,
 *  form → list on success). Standardized to prevent type drift
 *  across navigating components. */
export type CanvasNavigateFn = (directive: CanvasDirective) => void;
