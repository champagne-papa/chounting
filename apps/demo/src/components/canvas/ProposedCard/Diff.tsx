"use client";

import { Check, Pencil } from "lucide-react";
import { ConfChip } from "./ConfChip";
import type { ProposedCardProps } from "./types";

export function DiffCard({
  data,
  busy,
  resolved,
  onApprove,
  onReject,
  onEdit,
}: ProposedCardProps) {
  const slug = data.vendor.replace(/\s/g, "-").toLowerCase();
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card font-mono text-[12px] shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-foreground/80">
          @ledger/holdings · proposed
        </span>
        <ConfChip confidence={data.confidence} label={data.confidence} />
      </div>

      <div className="py-2.5">
        <div className="px-3 pb-1.5 text-muted-foreground">
          <span className="text-success">+++</span> JE/2026-03-14/{slug}
        </div>
        {data.lines.map((l, i) => (
          <div
            key={i}
            className="grid grid-cols-[16px_50px_1fr_80px_80px] px-3 py-0.5 text-foreground"
            style={{
              backgroundColor: l.debit
                ? "color-mix(in oklch, var(--success) 20%, transparent)"
                : "color-mix(in oklch, var(--success) 10%, transparent)",
            }}
          >
            <span className="text-success">+</span>
            <span className="text-muted-foreground">{l.code}</span>
            <span>{l.name}</span>
            <span className="text-right">{l.debit || "·"}</span>
            <span className="text-right">{l.credit || "·"}</span>
          </div>
        ))}
        <div className="mt-1.5 border-t border-border/60 px-3 pt-1.5 text-muted-foreground">
          <span className="text-muted-foreground">balance check:</span>{" "}
          <span className="text-success">✓ debits = credits = ${data.amount}</span>
        </div>
      </div>

      <div className="border-t border-border/60 px-3 py-2.5 font-sans text-[12.5px] leading-relaxed text-foreground/80">
        <div>
          <span className="mr-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            rule
          </span>
          {data.why}
        </div>
        <div className="mt-1">
          <span className="mr-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            history
          </span>
          {data.trackRecord}
        </div>
      </div>

      {!resolved && (
        <div className="flex gap-1.5 border-t border-border/60 bg-muted px-3 py-2 font-sans">
          <button
            type="button"
            disabled={busy !== null}
            onClick={onApprove}
            className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-success bg-success px-2.5 text-[12.5px] font-medium text-success-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={14} /> Approve
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onEdit}
            className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onReject}
            className="inline-flex h-[26px] items-center rounded-md border border-transparent bg-transparent px-2.5 text-[12.5px] font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      )}
      {resolved && (
        <div className="border-t border-border/60 bg-success/15 px-3 py-2 font-sans text-[12.5px] text-success">
          ✓ Merged
        </div>
      )}
    </div>
  );
}
