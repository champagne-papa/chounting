"use client";

import type { ReactNode } from "react";
import { cn } from "@chounting/ui";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  kbd?: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, kbd, badge, active, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-[9px] rounded-sm border px-2 py-1.5 text-left text-[13px] transition-colors",
        active
          ? "border-border/70 bg-card font-medium text-foreground shadow-xs"
          : "border-transparent bg-transparent text-foreground/70 hover:bg-secondary hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "grid place-items-center",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full bg-secondary px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wide text-foreground/80">
          {badge}
        </span>
      )}
      {kbd && (
        <span className="font-mono text-[10px] text-foreground/40">{kbd}</span>
      )}
    </button>
  );
}
