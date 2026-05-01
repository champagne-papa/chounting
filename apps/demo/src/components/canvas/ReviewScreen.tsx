"use client";

import { useState } from "react";
import { Check, Filter } from "lucide-react";
import { cn } from "@chounting/ui";
import {
  REVIEW_QUEUE,
  type ReviewItem,
  type ConfidenceLevel,
} from "@/lib/mock-data";
import { CanvasHeader } from "./CanvasHeader";

type ConfFilter = "ALL" | ConfidenceLevel;

const CONFIDENCE_CHIP: Record<ConfidenceLevel, string> = {
  high: "bg-success/15 text-success",
  medium: "bg-primary/15 text-primary",
  mixed: "bg-warning/20 text-warning-foreground",
};

export function ReviewScreen() {
  const [items, setItems] = useState<ReviewItem[]>(REVIEW_QUEUE);
  const [filter, setFilter] = useState<ConfFilter>("ALL");

  const rows = filter === "ALL" ? items : items.filter((i) => i.confidence === filter);

  function approve(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
  }
  function reject(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
  }
  function approveAllHigh() {
    setItems((s) => s.filter((i) => i.confidence !== "high"));
  }

  return (
    <div className="mx-auto max-w-[980px]">
      <CanvasHeader
        title="AI Action Review"
        meta={`Holdings Inc. · ${items.length} pending proposals`}
        actions={
          <>
            <button
              type="button"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Filter size={14} /> Filter
            </button>
            <button
              type="button"
              onClick={approveAllHigh}
              className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-success bg-success px-3 text-[13px] font-medium text-success-foreground transition-opacity hover:opacity-90"
            >
              <Check size={14} /> Approve all high-confidence
            </button>
          </>
        }
      />

      <div className="mb-2.5 flex items-center gap-1">
        {(
          [
            ["ALL", "All"],
            ["high", "High"],
            ["medium", "Medium"],
            ["mixed", "Mixed"],
          ] as Array<[ConfFilter, string]>
        ).map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={cn(
              "h-[22px] rounded-sm border px-2 text-[12px] font-medium transition-colors",
              filter === v
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-transparent text-foreground/70 hover:bg-secondary",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {item.id}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wide",
                      CONFIDENCE_CHIP[item.confidence],
                    )}
                  >
                    {item.confidenceLabel}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">{item.age}</span>
                </div>
                <div className="font-display text-[17px] font-semibold tracking-[-0.005em] text-foreground">
                  {item.vendor}
                </div>
                <div className="text-[12.5px] text-foreground/70">{item.rationale}</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  <span className="font-mono">{item.detail.account}</span> ↔{" "}
                  <span className="font-mono">{item.detail.offset}</span> · {item.detail.history}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="font-display text-[22px] font-semibold leading-none tracking-[-0.01em] tabular-nums text-foreground">
                  ${item.amount}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => approve(item.id)}
                    className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-success bg-success px-2.5 text-[12.5px] font-medium text-success-foreground transition-opacity hover:opacity-90"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(item.id)}
                    className="inline-flex h-[26px] items-center rounded-md border border-transparent bg-transparent px-2.5 text-[12.5px] font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-muted-foreground shadow-xs">
            <Check size={20} className="mx-auto" />
            <div className="mt-1.5 font-display text-[18px] font-semibold text-foreground/80">
              Inbox zero.
            </div>
            <div className="text-[12.5px]">
              Everything matching that filter is approved or rejected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
