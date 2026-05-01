import { cn } from "@chounting/ui";
import type { ConfidenceLevel } from "@/lib/mock-data";

const CHIP_CLASS: Record<ConfidenceLevel, string> = {
  high: "bg-success/15 text-success",
  medium: "bg-primary/15 text-primary",
  mixed: "bg-warning/20 text-warning-foreground",
};

interface ConfChipProps {
  confidence: ConfidenceLevel;
  label?: string;
}

export function ConfChip({ confidence, label }: ConfChipProps) {
  const pips = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wide",
        CHIP_CLASS[confidence],
      )}
    >
      <span className="inline-flex gap-[2px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-[5px] w-[5px] rounded-full",
              i < pips ? "bg-current" : "bg-current/30",
            )}
          />
        ))}
      </span>
      <span className="ml-1">{label ?? confidence} confidence</span>
    </span>
  );
}
