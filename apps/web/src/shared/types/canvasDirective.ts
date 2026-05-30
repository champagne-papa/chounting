// src/shared/types/canvasDirective.ts
// Discriminated union — Bible Section 4b.

import type { ProposedEntryCard } from './proposedEntryCard';
import type { ProposedAttachmentCard } from '@/shared/schemas/document-platform/proposedAttachmentCard.schema';
import type { ProposedRuleDraft } from '@/shared/schemas/rules/proposedRuleCard.schema';

export type CanvasDirective =
  // Phase 1.1 — built fully:
  | { type: 'chart_of_accounts'; orgId: string }
  | { type: 'journal_entry'; orgId: string; entryId: string; mode: 'view' | 'edit' }
  | { type: 'journal_entry_form'; orgId: string; prefill?: Record<string, unknown> }
  | { type: 'journal_entry_list'; orgId: string }
  | { type: 'proposed_entry_card'; card: ProposedEntryCard }
  // Phase 7 chunk 7.3b — proposed_attachment_card RI-1 strict atomic
  // 5-surface extension. Sibling to proposed_entry_card; rendered via
  // ContextualCanvas → ProposedAttachmentCard.
  | { type: 'proposed_attachment_card'; card: ProposedAttachmentCard }
  // Ring 2A-authoring (ADR-0026 §3) — rule-draft card; placeholder-rendered at
  // commit (d), real renderer at commit (e).
  | { type: 'proposed_rule_card'; card: ProposedRuleDraft }
  | { type: 'ai_action_review_queue'; orgId: string }
  | { type: 'report_pl'; orgId: string; periodId?: string }
  | { type: 'report_trial_balance'; orgId: string; periodId?: string }
  | { type: 'report_balance_sheet'; orgId: string; asOfDate?: string }
  | { type: 'report_account_ledger'; orgId: string; accountId: string; periodId?: string }
  | { type: 'report_accounts_by_type'; orgId: string; accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'; periodId?: string }
  | { type: 'report_ap_aging'; orgId: string }
  | { type: 'report_open_bills'; orgId: string }
  | { type: 'report_vendor_balance'; orgId: string }
  | { type: 'report_payment_approval_queue'; orgId: string }
  | { type: 'report_active_payments'; orgId: string }
  | { type: 'report_paid_bills_history'; orgId: string }
  | { type: 'report_pending_approvals'; orgId: string }
  | { type: 'reversal_form'; orgId: string; sourceEntryId: string }
  | { type: 'adjustment_form'; orgId: string }
  | { type: 'recurring_template_list'; orgId: string }
  | { type: 'recurring_template_form'; orgId: string }
  | { type: 'recurring_run_list'; orgId: string; recurringTemplateId?: string }
  | { type: 'bill_form'; orgId: string }
  | { type: 'payment_approval_card'; orgId: string; billId: string }
  | { type: 'payment_record_card'; orgId: string; billId: string }
  | {
      type: 'bill_reverse_card';
      orgId: string;
      billId: string;
      returnTo?:
        | 'report_active_payments'
        | 'report_paid_bills_history'
        | 'report_pending_approvals';
    }
  | { type: 'none' }

  // Phase 1.2 Session 6 — form-escape surfaces + onboarding navigation:
  | { type: 'user_profile' }
  | { type: 'org_profile'; orgId: string }
  | { type: 'org_users'; orgId: string }
  | { type: 'invite_user'; orgId: string }
  | { type: 'welcome' }

  // Phase 6.5 chunk 3 — pending documents queue surface in the
  // multi-tab canvas (Zone 3). Reached via:
  //   (a) Pattern γ Rule 1 drop event → new tab focused (chunk 3
  //       AgentChatPanel chat-input drop → SplitScreenLayout
  //       handleDropEvent → routeNewTab); ingestBatchId carries
  //       the just-created batch id so the view focuses on it.
  //   (b) Pattern γ Rule 3 Zone 1 Billing "Pending Documents" nav
  //       → routeReplaceActive; no ingestBatchId; view renders
  //       recent N cards across all batches.
  | { type: 'pending_documents'; orgId: string; ingestBatchId?: string }

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
