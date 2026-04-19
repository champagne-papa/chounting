// src/components/bridge/SuggestedPrompts.tsx
// Phase 1.2 Session 7 Commit 3 — persona-aware, locale-driven
// suggested prompts wired to the parent's send handler per
// sub-brief §4 Commit 3.
//
// Prompt text is read from messages/<locale>.json keys under
// agent.suggestions.<persona>.<slug>. Keys were seeded by
// Commit 1 (UI_ONLY_AGENT_KEYS) across all three locales.
// Clicking a chip fires onSelect(text) — the parent wires this
// to the same send path as text-input Send so one-click-fires
// hit the orchestrator identically to a typed message.

'use client';

import { useTranslations } from 'next-intl';
import type { UserRole } from '@/shared/types/userRole';

// Exported for test coverage (suggestedPromptsOneClickFire).
export const PROMPT_SLUGS: Record<UserRole, readonly string[]> = {
  controller: ['pl', 'new_entry', 'ai_actions'],
  ap_specialist: ['queue', 'incoming'],
  executive: ['cash', 'runway'],
};

interface Props {
  role?: UserRole;
  onSelect?: (text: string) => void;
}

export function SuggestedPrompts({ role = 'controller', onSelect }: Props) {
  const tHeading = useTranslations('agent');
  const tPrompts = useTranslations(`agent.suggestions.${role}`);
  const slugs = PROMPT_SLUGS[role];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="text-xs text-neutral-500">
        {tHeading('suggestedPromptsHeading')}
      </div>
      {slugs.map((slug) => {
        const text = tPrompts(slug);
        return (
          <button
            key={slug}
            type="button"
            className="text-left text-sm border border-neutral-300 rounded-md px-3 py-2 bg-white hover:bg-neutral-50 disabled:opacity-50"
            disabled={!onSelect}
            onClick={() => onSelect?.(text)}
            data-testid={`suggested-prompt-${slug}`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
