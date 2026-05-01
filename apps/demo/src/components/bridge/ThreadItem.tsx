"use client";

import { cn } from "@chounting/ui";
import type { Thread } from "@/lib/mock-data";

interface ThreadItemProps {
  thread: Thread;
  active?: boolean;
  onClick?: () => void;
}

export function ThreadItem({ thread, active, onClick }: ThreadItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm border px-2 py-1 text-left text-[12.5px] transition-colors",
        active
          ? "border-border/70 bg-card text-foreground shadow-xs"
          : "border-transparent bg-transparent text-foreground/70 hover:bg-secondary hover:text-foreground",
      )}
    >
      {thread.live ? (
        <span
          aria-label="live"
          className="bridge-pulse-dot h-[7px] w-[7px] flex-shrink-0 rounded-full bg-success"
        />
      ) : (
        <span className="w-[7px] flex-shrink-0" />
      )}
      <span className="flex-1 truncate">{thread.title}</span>
      <span className="flex-shrink-0 font-mono text-[10px] text-foreground/40">
        {thread.when}
      </span>
    </button>
  );
}
