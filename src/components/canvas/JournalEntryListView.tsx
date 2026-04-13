// src/components/canvas/JournalEntryListView.tsx
// Empty list canvas view for journal entries.
// Phase 14B replaces this shell with a real component.

'use client';

import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';

interface Props {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}

export function JournalEntryListView({ orgId: _orgId, onNavigate: _onNavigate }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Journal Entries</h2>
      <div className="text-sm text-neutral-400">
        No journal entries yet. Entries will appear here once the agent
        is active in Phase 1.2.
      </div>
    </div>
  );
}
