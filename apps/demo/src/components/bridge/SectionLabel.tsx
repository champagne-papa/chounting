import type { CSSProperties, ReactNode } from "react";
import { cn } from "@chounting/ui";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SectionLabel({ children, className, style }: SectionLabelProps) {
  return (
    <div
      style={style}
      className={cn(
        "px-[10px] pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
