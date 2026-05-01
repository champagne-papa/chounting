import type { ReactNode } from "react";

interface CanvasHeaderProps {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function CanvasHeader({ title, meta, actions }: CanvasHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="m-0 font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.015em] text-foreground">
          {title}
        </h1>
        {meta && (
          <div className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
