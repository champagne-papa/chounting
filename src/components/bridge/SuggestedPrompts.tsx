// src/components/bridge/SuggestedPrompts.tsx
// Static, persona-aware suggested prompts.
// Phase 1.1: clicking a chip shows "Coming in Phase 1.2" tooltip.
// Phase 1.2: clicking a chip submits the prompt to the orchestrator.

'use client';

import { useTranslations } from 'next-intl';
import type { UserRole } from '@/shared/types/userRole';

const PROMPTS: Record<UserRole, string[]> = {
  controller: [
    'Show me last month\'s P&L',
    'Make a journal entry',
    'Review pending AI actions',
  ],
  ap_specialist: [
    'Show me the AP queue',
    'Process today\'s incoming bills',
  ],
  executive: [
    'Show consolidated cash position',
    'What\'s my runway?',
  ],
};

interface Props {
  role?: UserRole;
}

export function SuggestedPrompts({ role = 'controller' }: Props) {
  const t = useTranslations('agent');
  const prompts = PROMPTS[role];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="text-xs text-neutral-500">{t('suggestedPromptsHeading')}</div>
      {prompts.map((p) => (
        <button
          key={p}
          className="text-left text-sm border border-neutral-300 rounded-md px-3 py-2 bg-white hover:bg-neutral-50"
          title="Coming in Phase 1.2"
          onClick={() => alert('Phase 1.2 will wire this to the agent.')}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
