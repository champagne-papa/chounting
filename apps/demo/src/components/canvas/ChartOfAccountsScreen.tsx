"use client";

import { useMemo, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { cn } from "@chounting/ui";
import {
  ACCOUNTS,
  ACCOUNT_TYPE_ORDER,
  type Account,
  type AccountType,
} from "@/lib/mock-data";
import { CanvasHeader } from "./CanvasHeader";

type SortKey = keyof Pick<Account, "code" | "name" | "type" | "balance">;

const TYPE_COLOR_CLASS: Record<AccountType, string> = {
  ASSET: "text-success",
  LIABILITY: "text-destructive",
  EQUITY: "text-primary",
  REVENUE: "text-success",
  EXPENSE: "text-warning",
};

export function ChartOfAccountsScreen() {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "code",
    dir: "asc",
  });
  const [filter, setFilter] = useState<AccountType | "ALL">("ALL");

  const rows = useMemo(() => {
    let r = ACCOUNTS.slice();
    if (filter !== "ALL") r = r.filter((a) => a.type === filter);
    r.sort((a, b) => {
      const A = a[sort.key];
      const B = b[sort.key];
      let cmp: number;
      if (typeof A === "number" && typeof B === "number") {
        cmp = A - B;
      } else if (sort.key === "balance") {
        cmp = parseFloat(String(A).replace(/,/g, "")) - parseFloat(String(B).replace(/,/g, ""));
      } else {
        cmp = String(A).localeCompare(String(B));
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [sort, filter]);

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
        title="Chart of Accounts"
        meta={`Holdings Inc. · ${rows.length} accounts · IFRS`}
        actions={
          <>
            <button
              type="button"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Upload size={14} /> Export
            </button>
            <button
              type="button"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-foreground bg-foreground px-3 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Plus size={14} /> New account
            </button>
          </>
        }
      />

      <div className="mb-2.5 flex flex-wrap items-center gap-1">
        {(["ALL", ...ACCOUNT_TYPE_ORDER] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={cn(
              "h-[22px] rounded-sm border px-2 text-[12px] font-medium transition-colors",
              filter === t
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-transparent text-foreground/70 hover:bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <TH k="code">Code</TH>
              <TH k="name">Name</TH>
              <TH k="type">Type</TH>
              <TH k="balance" align="right">
                Balance
              </TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr
                key={a.code}
                className="border-b border-border/40 last:border-b-0 hover:bg-secondary/40"
              >
                <td className="h-[var(--row-h)] w-20 px-3 align-middle font-mono text-foreground">
                  {a.code}
                </td>
                <td className="h-[var(--row-h)] px-3 align-middle text-foreground">
                  {a.name}
                  {a.ic && (
                    <span className="ml-2 rounded-full bg-secondary px-1.5 py-px font-mono text-[9px] uppercase tracking-wide text-foreground/80">
                      IC
                    </span>
                  )}
                </td>
                <td className="h-[var(--row-h)] px-3 align-middle">
                  <span
                    className={cn(
                      "font-mono text-[10.5px] tracking-[0.04em]",
                      TYPE_COLOR_CLASS[a.type],
                    )}
                  >
                    {a.type}
                  </span>
                </td>
                <td className="h-[var(--row-h)] px-3 text-right align-middle font-mono tabular-nums text-foreground">
                  {a.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
