import { cn } from "@chounting/ui";
import type { StaticMessage } from "@/lib/mock-data";

function Bubble({ m }: { m: StaticMessage }) {
  if (m.role === "stamp") {
    return (
      <div className="self-center px-0 pb-0.5 pt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-foreground/40">
        — {m.text} —
      </div>
    );
  }
  if (m.role === "tool") {
    return (
      <div className="max-w-[88%] self-start rounded-lg border border-dashed border-border px-2.5 py-1.5 font-mono text-[11.5px] text-muted-foreground">
        {m.text}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
        m.role === "user"
          ? "self-end rounded-br-xs bg-warning/30 text-foreground"
          : "self-start rounded-bl-xs bg-primary/15 text-foreground",
      )}
    >
      {m.text}
    </div>
  );
}

interface StaticThreadProps {
  messages: StaticMessage[];
}

export function StaticThread({ messages }: StaticThreadProps) {
  return (
    <>
      <div className="flex flex-col gap-2.5 overflow-y-auto p-3.5">
        {messages.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}
        <div className="mt-1.5 text-center font-display text-[11.5px] italic text-muted-foreground">
          Read-only thread. Resume to continue.
        </div>
      </div>
      <div className="flex items-center justify-center border-t border-border bg-muted px-3">
        <button
          type="button"
          className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Resume thread
        </button>
      </div>
    </>
  );
}
