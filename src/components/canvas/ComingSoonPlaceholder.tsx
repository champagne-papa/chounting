// src/components/canvas/ComingSoonPlaceholder.tsx
// Placeholder for Phase 2+ directive types.

interface Props {
  directiveType: string;
}

export function ComingSoonPlaceholder({ directiveType }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
      <div className="text-4xl mb-4">🚧</div>
      <div className="text-sm font-medium">
        {directiveType} — Coming Soon
      </div>
      <div className="text-xs mt-1">
        This view will be available in a future phase.
      </div>
    </div>
  );
}
