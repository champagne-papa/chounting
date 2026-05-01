"use client";

import { Check, Pencil } from "lucide-react";
import { ConfChip } from "./ConfChip";
import type { ProposedCardProps } from "./types";

export function ReceiptCard({
  data,
  busy,
  resolved,
  onApprove,
  onReject,
  onEdit,
}: ProposedCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-foreground/80">
          Proposed Entry · {data.org}
        </span>
        <ConfChip confidence={data.confidence} label={data.confidence} />
      </div>
      <div className="p-3.5">
        <div className="mb-0.5 font-display text-[18px] font-semibold tracking-[-0.005em] text-foreground">
          {data.vendor} · ${data.amount}
        </div>
        <div className="text-[12px] text-muted-foreground">
          {data.date} · {data.description}
        </div>

        <table className="mt-3 w-full border-collapse text-[12.5px]">
          <tbody>
            {data.lines.map((l, i) => (
              <tr
                key={i}
                className={
                  i === data.lines.length - 1 ? "border-b border-border" : ""
                }
              >
                <td className="h-7 w-[50px] py-1 align-middle">
                  <span className="font-mono text-muted-foreground">{l.code}</span>
                </td>
                <td className="h-7 px-1.5 py-1 align-middle text-foreground">
                  {l.name}
                </td>
                <td className="h-7 w-[90px] px-1.5 py-1 text-right align-middle font-mono tabular-nums text-foreground">
                  {l.debit}
                </td>
                <td className="h-7 w-[90px] py-1 text-right align-middle font-mono tabular-nums text-foreground">
                  {l.credit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            why?
          </span>{" "}
          <em className="font-display italic">{data.why}</em> {data.trackRecord}
        </div>
      </div>

      {!resolved && (
        <div className="flex gap-1.5 border-t border-border/60 bg-muted px-3.5 py-2.5">
          <button
            type="button"
            disabled={busy !== null}
            onClick={onApprove}
            className="inline-flex h-[26px] items-center gap-1.5 rounded-md border border-success bg-success px-2.5 text-[12.5px] font-medium text-success-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={14} /> {busy === "approved" ? "Approving…" : "Approve"}
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
            className="ml-1 inline-flex h-[26px] items-center rounded-md border border-transparent bg-transparent px-2.5 text-[12.5px] font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      )}
      {resolved && (
        <div className="flex items-center gap-1.5 border-t border-border/60 bg-success/15 px-3.5 py-2.5 text-[12.5px] text-success">
          <Check size={14} />
          {resolved === "approved"
            ? "Approved · posted as JE-04218"
            : resolved === "edited"
              ? "Opened in editor"
              : "Rejected"}
        </div>
      )}
    </div>
  );
}
