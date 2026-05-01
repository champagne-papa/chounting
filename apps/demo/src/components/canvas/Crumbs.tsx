import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@chounting/ui";
import { CRUMBS, RIGHT_MARK, type ScreenId } from "@/lib/mock-data";

interface CrumbsProps {
  screen: ScreenId;
}

export function Crumbs({ screen }: CrumbsProps) {
  const parts = CRUMBS[screen] ?? [];
  return (
    <div className="flex items-center gap-2 border-b border-border px-6 text-[12.5px] text-muted-foreground">
      <ChevronLeft size={14} className="text-foreground/40" />
      <ChevronRight size={14} className="text-foreground/40" />
      <span className="w-1" />
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className={cn(
              "cursor-pointer transition-colors hover:text-foreground",
              i === parts.length - 1 && "text-foreground",
            )}
          >
            {p}
          </span>
          {i < parts.length - 1 && <span className="text-foreground/40">/</span>}
        </span>
      ))}
      <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.06em] text-foreground/40">
        {RIGHT_MARK[screen]}
      </span>
    </div>
  );
}
