"use client";

import { useState, type ReactNode } from "react";
import { X, Settings2 } from "lucide-react";
import { cn } from "@chounting/ui";

interface TweaksPanelProps {
  title?: string;
  children: ReactNode;
}

export function TweaksPanel({ title = "Tweaks", children }: TweaksPanelProps) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open tweaks"
        className={cn(
          "fixed bottom-4 right-4 z-50 grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-secondary",
        )}
      >
        <Settings2 size={16} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[280px] max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-xl border border-border bg-card/85 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <span className="text-[12px] font-semibold tracking-[0.01em] text-foreground">
          {title}
        </span>
        <button
          type="button"
          aria-label="Close tweaks"
          onClick={() => setOpen(false)}
          className="grid h-[22px] w-[22px] place-items-center rounded-md text-foreground/55 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <X size={13} />
        </button>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto px-3.5 pb-3.5 pt-0.5">
        {children}
      </div>
    </div>
  );
}
