import { ChevronDown, Search, Bell } from "lucide-react";

export function Topbar() {
  return (
    <div className="flex h-12 items-center gap-4 border-b border-border bg-background pl-[18px] pr-4">
      <button
        type="button"
        className="-ml-1.5 flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[13px] text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
      >
        <span>Holdings Inc.</span>
        <ChevronDown size={14} />
      </button>
      <div className="mx-auto flex h-[30px] max-w-[520px] flex-1 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[13px] text-muted-foreground">
        <Search size={14} />
        <span className="flex-1">Search entries, vendors, reports</span>
        <kbd className="rounded-[3px] border border-border bg-muted px-1.5 py-px font-mono text-[10.5px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-[30px] w-[30px] place-items-center rounded-md text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell size={16} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-background bg-destructive" />
        </button>
      </div>
    </div>
  );
}
