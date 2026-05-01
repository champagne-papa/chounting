"use client";

import { useMemo, useState } from "react";
import { Plus, Filter } from "lucide-react";
import { cn } from "@chounting/ui";
import {
  JOURNAL,
  type JournalEntry,
  type JournalStatus,
} from "@/lib/mock-data";
import { CanvasHeader } from "./CanvasHeader";

type SortKey = keyof Pick<JournalEntry, "id" | "date" | "vendor" | "status" | "by" | "debit" | "credit">;
type StatusFilter = "ALL" | JournalStatus;

export function JournalScreen() {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "id",
    dir: "desc",
  });
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  const rows = useMemo(() => {
    let r = JOURNAL.slice();
    if (filter !== "ALL") r = r.filter((j) => j.status === filter);
    r.sort((a, b) => {
      const A = a[sort.key];
      const B = b[sort.key];
      const num = sort.key === "debit" || sort.key === "credit";
      const cmp = num
        ? parseFloat(String(A).replace(/,/g, "")) - parseFloat(String(B).replace(/,/g, ""))
        : String(A).localeCompare(String(B));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [sort, filter]);

  const draftCount = JOURNAL.filter((j) => j.status === "draft").length;

  function TH({
    k,
    children,
    align,
  }: {
    k: SortKey;
    children: React.ReactNode;
    align?: "left" | "right";
  }) {
    return (
      <th
        className={cn(
          "cursor-pointer select-none border-b border-border px-3 py-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground",
          align === "right" ? "text-right" : "text-left",
        )}
        onClick={() =>
          setSort((s) => ({
            key: k,
            dir: s.key === k && s.dir === "asc" ? "desc" : "asc",
          }))
        }
      >
        {children}{" "}
        {sort.key === k && (
          <span className="opacity-60">{sort.dir === "asc" ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }

  return (
    <div className="mx-auto max-w-[980px]">
      <CanvasHeader
        title="Journal Entries"
        meta={
          <>
            Holdings Inc. · March 2026{" "}
            <span className="ml-2 inline-flex items-center rounded-full bg-success/15 px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wide text-success">
              open
            </span>
          </>
        }
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
              className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-foreground bg-foreground px-3 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Plus size={14} /> New entry
            </button>
          </>
        }
      />

      <div className="mb-2.5 flex items-center gap-1">
        {(
          [
            ["ALL", "All"],
            ["posted", "Posted"],
            ["draft", "Draft"],
          ] as Array<[StatusFilter, string]>
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

      <div className="overflow-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TH k="id">#</TH>
              <TH k="date">Date</TH>
              <TH k="vendor">Vendor</TH>
              <TH k="status">Status</TH>
              <TH k="by">By</TH>
              <TH k="debit" align="right">
                Debit
              </TH>
              <TH k="credit" align="right">
                Credit
              </TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr
                key={j.id}
                className={cn(
                  "border-b border-border/40 last:border-b-0",
                  j.status === "draft"
                    ? "bg-warning/15 hover:bg-warning/25"
                    : "hover:bg-secondary/40",
                )}
              >
                <td className="h-[var(--row-h)] px-3 align-middle font-mono text-foreground">
                  {j.id}
                </td>
                <td className="h-[var(--row-h)] px-3 align-middle font-mono text-foreground/80">
                  {j.date}
                </td>
                <td
                  className={cn(
                    "h-[var(--row-h)] px-3 align-middle text-foreground",
                    j.status === "draft" && "font-display italic",
                  )}
                >
                  {j.vendor}
                </td>
                <td className="h-[var(--row-h)] px-3 align-middle">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wide",
                      j.status === "draft"
                        ? "bg-warning/20 text-warning-foreground"
                        : "bg-secondary text-foreground/80",
                    )}
                  >
                    {j.status}
                  </span>
                </td>
                <td
                  className={cn(
                    "h-[var(--row-h)] px-3 align-middle text-foreground/80",
                    j.by === "the agent" && "italic",
                  )}
                >
                  {j.by}
                </td>
                <td className="h-[var(--row-h)] px-3 text-right align-middle font-mono tabular-nums text-foreground">
                  {j.debit}
                </td>
                <td className="h-[var(--row-h)] px-3 text-right align-middle font-mono tabular-nums text-foreground">
                  {j.credit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex items-center justify-end text-[12px] text-muted-foreground">
        {rows.length} entries
        {draftCount > 0 && ` · ${draftCount} draft pending confirmation`}
      </div>
    </div>
  );
}
