// src/components/bridge/ContextualCanvas.tsx
// The right-pane canvas. Renders the active tab's directive content.
//
// Phase 6.5 chunk 2a (Session 10a): navigation history lifted to
// parent SplitScreenLayout per Sub-Q11.b.α tab data model state lift.
// ContextualCanvas is now a pure render-from-Props component — the
// `directive`, `history` position (via `historyPositionLabel`), and
// back/forward navigation (`canGoBack`/`canGoForward` + `onGoBack`/
// `onGoForward` callbacks) all flow from parent. Pre-chunk-2 internal
// `useState<CanvasDirective[]>([directive])` + `useState(0)` for
// historyIndex + useEffect sync all removed; this component holds no
// navigation state of its own.
//
// At chunk-2a, the parent (SplitScreenLayout) holds a single tab by
// default and routes all per-source callbacks through an append-to-
// active-tab semantic (degenerate Pattern γ); user-visible behavior
// is identical to pre-chunk-2 single-history-stack. At chunk-2b,
// the parent diverges per-source semantics per Pattern γ Rules 1-4
// and mounts the CanvasTabStrip UI.

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { CanvasDirective, CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import { ChartOfAccountsView } from '@/components/canvas/ChartOfAccountsView';
import { JournalEntryListView } from '@/components/canvas/JournalEntryListView';
import { ComingSoonPlaceholder } from '@/components/canvas/ComingSoonPlaceholder';
import { ProposedEntryCard } from '@/components/ProposedEntryCard';
import { ProposedRuleCard } from '@/components/ProposedRuleCard';
import { RuleRegistryView } from '@/components/canvas/RuleRegistryView';
import { ProposedAttachmentCard } from '@/components/canvas/ProposedAttachmentCard';
import { JournalEntryForm } from '@/components/canvas/JournalEntryForm';
import { JournalEntryDetailView } from '@/components/canvas/JournalEntryDetailView';
import { ReversalForm } from '@/components/canvas/ReversalForm';
import { AdjustmentForm } from '@/components/canvas/AdjustmentForm';
import { RecurringTemplateListView } from '@/components/canvas/RecurringTemplateListView';
import { RecurringTemplateForm } from '@/components/canvas/RecurringTemplateForm';
import { RecurringRunListView } from '@/components/canvas/RecurringRunListView';
import { BasicBalanceSheetView } from '@/components/canvas/BasicBalanceSheetView';
import { BasicPLView } from '@/components/canvas/BasicPLView';
import { BasicTrialBalanceView } from '@/components/canvas/BasicTrialBalanceView';
import { AccountLedgerView } from '@/components/canvas/AccountLedgerView';
import { AccountsByTypeView } from '@/components/canvas/AccountsByTypeView';
import { ApAgingView } from '@/components/canvas/ApAgingView';
import { OpenBillsView } from '@/components/canvas/OpenBillsView';
import { VendorBalanceView } from '@/components/canvas/VendorBalanceView';
import { PaymentApprovalQueueView } from '@/components/canvas/PaymentApprovalQueueView';
import { ActivePaymentsView } from '@/components/canvas/ActivePaymentsView';
import { PaidBillsHistoryView } from '@/components/canvas/PaidBillsHistoryView';
import { PendingApprovalsView } from '@/components/canvas/PendingApprovalsView';
import { ManualBillForm } from '@/components/canvas/ManualBillForm';
import { PaymentApprovalCard } from '@/components/canvas/PaymentApprovalCard';
import { RecordPaymentCard } from '@/components/canvas/RecordPaymentCard';
import { BillReverseCard } from '@/components/canvas/BillReverseCard';
import { UserProfileEditor } from '@/components/canvas/UserProfileEditor';
import { OrgProfileEditor } from '@/components/canvas/OrgProfileEditor';
import { OrgUsersView } from '@/components/canvas/OrgUsersView';
import { PendingDocumentsView } from '@/components/canvas/PendingDocumentsView';

interface Props {
  directive: CanvasDirective;
  canGoBack: boolean;
  canGoForward: boolean;
  historyPositionLabel: string;
  onGoBack: () => void;
  onGoForward: () => void;
  onDirectiveChange: (d: CanvasDirective) => void;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

// WelcomeNavigator: the `welcome` directive is a route-level
// navigation hint (not a canvas-state). The welcome page handles
// its own render under a different layout; pushing to it from
// inside the canvas would leave stale canvas history behind. We
// fire router.push as a side effect the moment this component
// mounts and render a ComingSoonPlaceholder during the brief
// navigation window.
function WelcomeNavigator() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? 'en';
  useEffect(() => {
    router.push(`/${locale}/welcome`);
  }, [router, locale]);
  return <ComingSoonPlaceholder directiveType="welcome" />;
}

export function ContextualCanvas({
  directive,
  canGoBack,
  canGoForward,
  historyPositionLabel,
  onGoBack,
  onGoForward,
  onDirectiveChange,
  onSelectEntity,
}: Props) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="h-10 border-b border-neutral-200 flex items-center px-3 gap-2">
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas back"
        >
          &larr;
        </button>
        <button
          onClick={onGoForward}
          disabled={!canGoForward}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas forward"
        >
          &rarr;
        </button>
        <div className="text-xs text-neutral-500 ml-2">{historyPositionLabel}</div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {renderDirective(directive, onDirectiveChange, onSelectEntity)}
      </div>
    </main>
  );
}

function renderDirective(
  d: CanvasDirective,
  onNavigate: CanvasNavigateFn,
  onSelectEntity?: (entity: SelectedEntity) => void,
) {
  switch (d.type) {
    case 'chart_of_accounts':
      return <ChartOfAccountsView orgId={d.orgId} onSelectEntity={onSelectEntity} />;
    case 'journal_entry_list':
      return (
        <JournalEntryListView
          orgId={d.orgId}
          onNavigate={onNavigate}
          onSelectEntity={onSelectEntity}
        />
      );
    case 'journal_entry_form':
      return <JournalEntryForm orgId={d.orgId} onNavigate={onNavigate} />;
    case 'journal_entry':
      return <JournalEntryDetailView orgId={d.orgId} entryId={d.entryId} onNavigate={onNavigate} />;
    case 'reversal_form':
      return <ReversalForm orgId={d.orgId} sourceEntryId={d.sourceEntryId} onNavigate={onNavigate} />;
    case 'adjustment_form':
      return <AdjustmentForm orgId={d.orgId} onNavigate={onNavigate} />;
    case 'bill_form':
      return <ManualBillForm orgId={d.orgId} onNavigate={onNavigate} />;
    case 'payment_approval_card':
      return <PaymentApprovalCard orgId={d.orgId} billId={d.billId} onNavigate={onNavigate} />;
    case 'payment_record_card':
      return <RecordPaymentCard orgId={d.orgId} billId={d.billId} onNavigate={onNavigate} />;
    case 'bill_reverse_card':
      return (
        <BillReverseCard
          orgId={d.orgId}
          billId={d.billId}
          returnTo={d.returnTo}
          onNavigate={onNavigate}
        />
      );
    case 'recurring_template_list':
      return <RecurringTemplateListView orgId={d.orgId} onNavigate={onNavigate} />;
    case 'recurring_template_form':
      return <RecurringTemplateForm orgId={d.orgId} onNavigate={onNavigate} />;
    case 'recurring_run_list':
      return (
        <RecurringRunListView
          orgId={d.orgId}
          onNavigate={onNavigate}
          recurringTemplateId={d.recurringTemplateId}
        />
      );
    case 'report_pl':
      return <BasicPLView orgId={d.orgId} onNavigate={onNavigate} />;
    case 'report_trial_balance':
      return <BasicTrialBalanceView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'report_balance_sheet':
      return <BasicBalanceSheetView orgId={d.orgId} onNavigate={onNavigate} />;
    case 'report_account_ledger':
      return <AccountLedgerView orgId={d.orgId} accountId={d.accountId} periodId={d.periodId} onNavigate={onNavigate} />;
    case 'report_accounts_by_type':
      return (
        <AccountsByTypeView
          orgId={d.orgId}
          accountType={d.accountType}
          periodId={d.periodId}
          onNavigate={onNavigate}
          onSelectEntity={onSelectEntity}
        />
      );
    case 'report_ap_aging':
      return <ApAgingView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'report_open_bills':
      return <OpenBillsView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'report_vendor_balance':
      return <VendorBalanceView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'report_payment_approval_queue':
      return <PaymentApprovalQueueView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'report_active_payments':
      return <ActivePaymentsView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'report_paid_bills_history':
      return <PaidBillsHistoryView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'report_pending_approvals':
      return <PendingApprovalsView orgId={d.orgId} onNavigate={onNavigate} onSelectEntity={onSelectEntity} />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'proposed_attachment_card':
      return <ProposedAttachmentCard card={d.card} />;
    case 'none':
      return (
        <div className="text-neutral-400 text-sm">
          Pick a view from the left panel to get started.
        </div>
      );

    // Phase 6.5 chunk 3 — pending documents queue surface.
    case 'pending_documents':
      return <PendingDocumentsView orgId={d.orgId} ingestBatchId={d.ingestBatchId} />;

    // Phase 1.2 Session 6 — form-escape surfaces.
    case 'user_profile':
      return <UserProfileEditor />;
    case 'org_profile':
      return <OrgProfileEditor orgId={d.orgId} />;
    case 'org_users':
      return <OrgUsersView orgId={d.orgId} initialMode="list" />;
    case 'invite_user':
      return <OrgUsersView orgId={d.orgId} initialMode="invite" />;
    case 'welcome':
      return <WelcomeNavigator />;

    // Ring 2A-authoring (ADR-0026 §3/§8) — the rule-draft card + the registry
    // canvas (RuleRegistryView shipped at Ring 2A-core, wired to nav here).
    case 'proposed_rule_card':
      return <ProposedRuleCard card={d.card} onNavigate={onNavigate} />;
    case 'rule_registry':
      return <RuleRegistryView orgId={d.orgId} />;

    // Phase 2+ directive types — render placeholder
    case 'ai_action_review_queue':
    case 'ap_queue':
    case 'vendor_detail':
    case 'bank_reconciliation':
    case 'ar_aging':
    case 'consolidated_dashboard':
      return <ComingSoonPlaceholder directiveType={d.type} />;
  }
}
