// src/components/bridge/ContextualCanvas.tsx
// The right-pane canvas. Renders whatever directive it was last given.
// Maintains its OWN navigation history (back/forward arrows in the
// canvas header) — completely separate from chat history.

'use client';

import { useState, useEffect } from 'react';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import { ChartOfAccountsView } from '@/components/canvas/ChartOfAccountsView';
import { JournalEntryListView } from '@/components/canvas/JournalEntryListView';
import { ComingSoonPlaceholder } from '@/components/canvas/ComingSoonPlaceholder';
import { ProposedEntryCard } from '@/components/ProposedEntryCard';
import { JournalEntryForm } from '@/components/canvas/JournalEntryForm';

interface Props {
  directive: CanvasDirective;
  onDirectiveChange: (d: CanvasDirective) => void;
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
        {renderDirective(history[historyIndex])}
      </div>
    </main>
  );
}

function renderDirective(d: CanvasDirective) {
  switch (d.type) {
    case 'chart_of_accounts':
      return <ChartOfAccountsView orgId={d.orgId} />;
    case 'journal_entry_list':
      return <JournalEntryListView orgId={d.orgId} />;
    case 'journal_entry_form':
      return <JournalEntryForm orgId={d.orgId} />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      return (
        <div className="text-neutral-400 text-sm">
          Use the Mainframe rail on the left to choose a view.
        </div>
      );

    // Phase 2+ directive types — render placeholder
    case 'journal_entry':
    case 'ai_action_review_queue':
    case 'report_pl':
    case 'report_trial_balance':
    case 'ap_queue':
    case 'vendor_detail':
    case 'bank_reconciliation':
    case 'ar_aging':
    case 'consolidated_dashboard':
      return <ComingSoonPlaceholder directiveType={d.type} />;
  }
}
