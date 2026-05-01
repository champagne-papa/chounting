import { Calendar, Upload } from "lucide-react";
import { PL } from "@/lib/mock-data";
import { CanvasHeader } from "./CanvasHeader";

export function PLScreen() {
  return (
    <div className="mx-auto max-w-[980px]">
      <CanvasHeader
        title="Profit & Loss"
        meta="Holdings Inc. · Jan 1 — Mar 31, 2026 · CAD"
        actions={
          <>
            <button
              type="button"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Calendar size={14} /> Change period
            </button>
            <button
              type="button"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-md border border-foreground bg-foreground px-3 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Upload size={14} /> Export PDF
            </button>
          </>
        }
      />

      <div className="mb-3.5 rounded-xl border border-border bg-card px-5 py-4 shadow-xs">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-muted-foreground">
          NET INCOME
        </div>
        <div className="mt-0.5 font-display text-[56px] font-semibold leading-none tracking-[-0.02em] text-foreground">
          {PL.netIncome}
        </div>
        <div className="mt-2 text-[12.5px] font-medium text-success">
          ▲ {PL.delta} vs prior quarter
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full border-collapse">
          <tbody>
            {PL.rows.map((r, i) => {
              if (r.kind === "header") {
                return (
                  <tr key={i}>
                    <td colSpan={2} className="h-9 pb-1 pl-3 pt-2">
                      <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-foreground/80">
                        {r.label}
                      </span>
                    </td>
                    <td className="pb-1 pr-3 pt-2 text-right font-mono tabular-nums text-foreground/70">
                      {r.amount ?? ""}
                    </td>
                  </tr>
                );
              }
              if (r.kind === "subtotal") {
                return (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={2} className="px-3 py-1.5 pl-7 text-foreground/80">
                      {r.label}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-foreground/80">
                      {r.amount}
                    </td>
                  </tr>
                );
              }
              if (r.kind === "total") {
                return (
                  <tr key={i} className="border-t-2 border-foreground">
                    <td colSpan={2} className="h-11 px-3">
                      <span className="font-display text-[16px] font-semibold text-foreground">
                        {r.label}
                      </span>
                    </td>
                    <td className="px-3 text-right font-display text-[16px] font-semibold tabular-nums text-foreground">
                      {r.amount}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i}>
                  <td className="h-[var(--row-h)] w-20 pl-7 align-middle font-mono text-muted-foreground">
                    {r.code}
                  </td>
                  <td className="h-[var(--row-h)] px-3 align-middle text-foreground">
                    {r.name}
                  </td>
                  <td className="h-[var(--row-h)] px-3 text-right align-middle font-mono tabular-nums text-foreground">
                    {r.amount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
