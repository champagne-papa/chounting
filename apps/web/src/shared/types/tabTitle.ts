// src/shared/types/tabTitle.ts
//
// Phase 6.5 chunk 2b: UI-shorthand title mapping per CanvasDirective
// type for the CanvasTabStrip component. Distinct in purpose from
// `canvasContextSuffix.ts:describeDirective` — that module produces
// narrative phrasing for the orchestrator's system prompt ("the
// chart of accounts"); this module produces punchy UI labels for
// tab strip rendering ("Chart of Accounts"). Conflating them would
// force one shape to compromise the other.
//
// Exhaustive switch over the `CanvasDirective` discriminated union.
// TypeScript compiler enforces exhaustiveness at build time — if a
// new directive member is added to the union without a corresponding
// case here, the build fails. Chunk 3 will add a case for
// `'pending_documents'` alongside the directive enum addition.

import type { CanvasDirective } from './canvasDirective';

export function tabTitleForDirective(directive: CanvasDirective): string {
  switch (directive.type) {
    case 'chart_of_accounts':
      return 'Chart of Accounts';
    case 'journal_entry':
      return 'Journal Entry';
    case 'journal_entry_list':
      return 'Journal Entries';
    case 'journal_entry_form':
      return 'New Journal Entry';
    case 'proposed_entry_card':
      return 'Proposed Entry';
    case 'proposed_attachment_card':
      return 'Proposed Attachment';
    case 'proposed_rule_card':
      return 'Proposed Rule';
    case 'ai_action_review_queue':
      return 'AI Action Review';
    case 'report_pl':
      return 'P&L Report';
    case 'report_trial_balance':
      return 'Trial Balance';
    case 'report_balance_sheet':
      return 'Balance Sheet';
    case 'report_account_ledger':
      return 'Account Ledger';
    case 'report_accounts_by_type':
      return 'Accounts';
    case 'report_ap_aging':
      return 'AP Aging';
    case 'report_open_bills':
      return 'Open Bills';
    case 'report_vendor_balance':
      return 'Vendor Balance';
    case 'report_payment_approval_queue':
      return 'Payment Approvals';
    case 'report_active_payments':
      return 'Active Payments';
    case 'report_paid_bills_history':
      return 'Paid Bills';
    case 'report_pending_approvals':
      return 'Pending Approvals';
    case 'reversal_form':
      return 'Reverse Entry';
    case 'adjustment_form':
      return 'Adjustment';
    case 'recurring_template_list':
      return 'Recurring Journals';
    case 'recurring_template_form':
      return 'New Recurring Template';
    case 'recurring_run_list':
      return 'Recurring Runs';
    case 'bill_form':
      return 'New Bill';
    case 'payment_approval_card':
      return 'Approve Payment';
    case 'payment_record_card':
      return 'Record Payment';
    case 'bill_reverse_card':
      return 'Reverse Bill';
    case 'none':
      return 'New tab';
    case 'pending_documents':
      return 'Pending Documents';
    case 'review_inbox':
      return 'Review Inbox';
    case 'user_profile':
      return 'My Profile';
    case 'org_profile':
      return 'Org Profile';
    case 'org_users':
      return 'Team';
    case 'invite_user':
      return 'Invite User';
    case 'welcome':
      return 'Welcome';
    case 'ap_queue':
      return 'AP Queue';
    case 'vendor_detail':
      return 'Vendor';
    case 'bank_reconciliation':
      return 'Bank Reconciliation';
    case 'ar_aging':
      return 'AR Aging';
    case 'consolidated_dashboard':
      return 'Dashboard';
    case 'rule_registry':
      return 'Vendor Rules';
  }
}
