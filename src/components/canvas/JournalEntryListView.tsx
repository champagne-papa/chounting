// src/components/canvas/JournalEntryListView.tsx
// Empty list canvas view for journal entries.
// Phase 1.1: shows placeholder since no entries exist yet without the agent.

'use client';

interface Props {
  orgId: string;
}

export function JournalEntryListView({ orgId: _orgId }: Props) {
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
