"use client";

import type { ScreenId } from "@/lib/mock-data";

interface HomeScreenProps {
  onNavigate: (id: ScreenId) => void;
}

interface KPIProps {
  label: string;
  value: string;
  foot: string;
  onClick: () => void;
}

function KPI({ label, value, foot, onClick }: KPIProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-card/80"
    >
      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-[30px] font-semibold leading-none tracking-[-0.01em] text-foreground">
        {value}
      </div>
      <div className="mt-1.5 text-[11.5px] text-muted-foreground">{foot}</div>
    </button>
  );
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="mx-auto mt-3 max-w-[880px]">
      <div className="mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        HOLDINGS INC.
      </div>
      <h1 className="m-0 mb-3 font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
        Good morning, Adrian.
      </h1>
      <p className="mb-7 max-w-[600px] text-[15px] leading-relaxed text-foreground/70">
        March is open. <em>One proposal</em> is waiting for your review, and the agent has three questions about new vendors.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <KPI
          label="Pending proposals"
          value="4"
          foot="3 high · 1 mixed"
          onClick={() => onNavigate("review")}
        />
        <KPI
          label="Entries this week"
          value="7"
          foot="1 draft"
          onClick={() => onNavigate("journal")}
        />
        <KPI
          label="Net income"
          value="+18.4%"
          foot="vs prior quarter"
          onClick={() => onNavigate("pl")}
        />
        <KPI
          label="Active accounts"
          value="11"
          foot="IFRS · Holdings template"
          onClick={() => onNavigate("coa")}
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs">
        <div className="mb-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          What I&apos;m watching
        </div>
        <ul className="m-0 list-none p-0 text-[13.5px] leading-[1.65] text-foreground/70">
          <li>· Bell Canada amount diverged from last month by 4.2% — flagged for review.</li>
          <li>· GST/HST payable balance crossed the $48k threshold you set.</li>
          <li>
            · Q1 close is on track for April 12.{" "}
            <a className="text-foreground underline">See checklist →</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
