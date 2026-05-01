"use client";

import { Check } from "lucide-react";
import type { ProposedCardProps } from "./types";

export function ConversationalCard({
  data,
  busy,
  resolved,
  onApprove,
  onReject,
  onEdit,
}: ProposedCardProps) {
  return (
    <div className="my-0.5 border-l-2 border-foreground bg-transparent pl-3.5">
      <div className="font-display text-[15.5px] leading-relaxed text-foreground">
        I&apos;d like to post <em>{data.vendor}&apos;s</em> March invoice as{" "}
        <strong className="font-semibold">${data.amount}</strong> CAD —{" "}
        <span className="font-mono text-[12px]">6240 Professional fees</span> ↔{" "}
        <span className="font-mono text-[12px]">1010 Cash</span>, dated {data.date}.
      </div>
      <div className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/70">
        Same coding as the last <span className="font-mono">14</span> entries from this vendor — high confidence.
      </div>
      {!resolved && (
        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            disabled={busy !== null}
            onClick={onApprove}
            className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-success bg-success px-2.5 text-[12.5px] font-medium text-success-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={14} /> Approve &amp; post
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onEdit}
            className="inline-flex h-[26px] items-center rounded-md border border-border bg-card px-2.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit lines
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onReject}
            className="inline-flex h-[26px] items-center rounded-md border border-transparent bg-transparent px-2.5 text-[12.5px] font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Not now
          </button>
        </div>
      )}
      {resolved && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-success">
          <Check size={14} /> Posted — JE-04218 is now in the journal.
        </div>
      )}
    </div>
  );
}
