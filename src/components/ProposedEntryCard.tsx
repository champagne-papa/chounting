// src/components/ProposedEntryCard.tsx
// Phase 1.1: typed shell with placeholder render.
// Phase 1.2: real implementation with Approve / Reject / Edit buttons.
//
// The reason this component exists in Phase 1.1: the canvas renderer
// must reference the ProposedEntryCard type without errors so the entire
// canvas pipeline compiles end-to-end before Phase 1.2 adds the agent.

import type { ProposedEntryCard as ProposedEntryCardType } from '@/shared/types/proposedEntryCard';

interface Props {
  card: ProposedEntryCardType;
}

export function ProposedEntryCard({ card }: Props) {
  return (
    <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-4 max-w-2xl">
      <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
        Proposed Entry — Phase 1.2 Will Implement This
      </div>
      <div className="text-sm text-neutral-700">
        Org: <span className="font-mono">{card.org_name}</span>
      </div>
      <div className="text-sm text-neutral-700">
        Confidence: <span className="font-mono">{card.confidence}</span>
        {card.routing_path && (
          <span className="ml-2 text-neutral-500">
            (routing: {card.routing_path})
          </span>
        )}
      </div>
      <div className="mt-3 text-xs text-neutral-500">
        This is a placeholder render. The full ProposedEntryCard with
        Approve / Reject / Edit buttons is implemented in Phase 1.2.
      </div>
    </div>
  );
}
