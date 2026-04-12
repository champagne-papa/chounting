// src/components/bridge/AgentChatPanel.tsx
// Phase 1.1: empty state with persona-aware suggested prompts.
// Does NOT call the LLM. Clicking a suggested prompt shows a tooltip
// "Coming in Phase 1.2."
//
// Phase 1.2: full conversation rendering with streaming responses.

'use client';

import { SuggestedPrompts } from './SuggestedPrompts';
import { useTranslations } from 'next-intl';

interface Props {
  orgId: string;
  onCollapse: () => void;
}

export function AgentChatPanel({ orgId: _orgId, onCollapse }: Props) {
  const t = useTranslations('agent');

  return (
    <aside className="w-[380px] flex flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="h-10 border-b border-neutral-200 flex items-center justify-between px-3">
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Agent
        </div>
        <button
          onClick={onCollapse}
          className="text-neutral-400 hover:text-neutral-700 text-sm"
          aria-label="Collapse chat"
        >
          &larr;
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-lg font-medium text-neutral-700 mb-1">
          {t('emptyState')}
        </div>
        <div className="text-xs text-neutral-400 mb-6">
          Phase 1.1 — agent activates in Phase 1.2
        </div>
        <SuggestedPrompts />
      </div>
    </aside>
  );
}
