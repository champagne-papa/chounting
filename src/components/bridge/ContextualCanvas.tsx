// src/components/bridge/ContextualCanvas.tsx
// The right-pane canvas. Renders whatever directive it was last given.
// Maintains its OWN navigation history (back/forward arrows in the
// canvas header) — completely separate from chat history.

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { CanvasDirective, CanvasNavigateFn } from '@/shared/types/canvasDirective';
import { ChartOfAccountsView } from '@/components/canvas/ChartOfAccountsView';
import { JournalEntryListView } from '@/components/canvas/JournalEntryListView';
import { ComingSoonPlaceholder } from '@/components/canvas/ComingSoonPlaceholder';
import { ProposedEntryCard } from '@/components/ProposedEntryCard';
import { JournalEntryForm } from '@/components/canvas/JournalEntryForm';
import { JournalEntryDetailView } from '@/components/canvas/JournalEntryDetailView';
import { ReversalForm } from '@/components/canvas/ReversalForm';
import { BasicPLView } from '@/components/canvas/BasicPLView';
import { BasicTrialBalanceView } from '@/components/canvas/BasicTrialBalanceView';

interface Props {
  directive: CanvasDirective;
  onDirectiveChange: (d: CanvasDirective) => void;
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

export function ContextualCanvas({ directive, onDirectiveChange }: Props) {
  const [history, setHistory] = useState<CanvasDirective[]>([directive]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync external directive changes into local history
  useEffect(() => {
    if (directive !== history[historyIndex]) {
      const newHistory = [...history.slice(0, historyIndex + 1), directive];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [directive]); // eslint-disable-line react-hooks/exhaustive-deps

  function goBack() {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onDirectiveChange(history[newIndex]);
    }
  }

  function goForward() {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onDirectiveChange(history[newIndex]);
    }
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="h-10 border-b border-neutral-200 flex items-center px-3 gap-2">
        <button
          onClick={goBack}
          disabled={historyIndex === 0}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas back"
        >
          &larr;
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas forward"
        >
          &rarr;
        </button>
        <div className="text-xs text-neutral-500 ml-2">
          {historyIndex + 1} / {history.length}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {renderDirective(history[historyIndex], onDirectiveChange)}
      </div>
    </main>
  );
}

function renderDirective(d: CanvasDirective, onNavigate: CanvasNavigateFn) {
  switch (d.type) {
    case 'chart_of_accounts':
      return <ChartOfAccountsView orgId={d.orgId} />;
    case 'journal_entry_list':
      return <JournalEntryListView orgId={d.orgId} onNavigate={onNavigate} />;
    case 'journal_entry_form':
      return <JournalEntryForm orgId={d.orgId} onNavigate={onNavigate} />;
    case 'journal_entry':
      return <JournalEntryDetailView orgId={d.orgId} entryId={d.entryId} onNavigate={onNavigate} />;
    case 'reversal_form':
      return <ReversalForm orgId={d.orgId} sourceEntryId={d.sourceEntryId} onNavigate={onNavigate} />;
    case 'report_pl':
      return <BasicPLView orgId={d.orgId} onNavigate={onNavigate} />;
    case 'report_trial_balance':
      return <BasicTrialBalanceView orgId={d.orgId} onNavigate={onNavigate} />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      return (
        <div className="text-neutral-400 text-sm">
          Use the Mainframe rail on the left to choose a view.
        </div>
      );

    // Phase 1.2 Session 6 — form-escape surfaces. Components land
    // in Commit 2; Commit 1 stubs the dispatch to ComingSoonPlaceholder
    // so the switch is exhaustive in TypeScript from the first commit.
    case 'user_profile':
    case 'org_profile':
    case 'org_users':
    case 'invite_user':
      return <ComingSoonPlaceholder directiveType={d.type} />;
    case 'welcome':
      return <WelcomeNavigator />;

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
