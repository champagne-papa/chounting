"use client";

import { useState } from "react";
import { ChevronLeft, MoreHorizontal, Sparkles, Pencil, Link as LinkIcon, Plus, Inbox } from "lucide-react";
import { cn } from "@chounting/ui";
import { NAV, RECENTS, type ScreenId } from "@/lib/mock-data";
import { NAV_ICON_MAP } from "./icons";
import { SectionLabel } from "./SectionLabel";
import { SidebarItem } from "./SidebarItem";
import { ThreadItem } from "./ThreadItem";

type SidebarTab = "chat" | "compose" | "artifacts";

interface CombinedSidebarProps {
  screen: ScreenId;
  onNavigate: (id: ScreenId) => void;
  openThread: string | null;
  setOpenThread: (id: string | null) => void;
  onNewChat: () => void;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[26px] items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors",
        active
          ? "border-border bg-card text-foreground"
          : "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CombinedSidebar({
  screen,
  onNavigate,
  openThread,
  setOpenThread,
  onNewChat,
}: CombinedSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>("chat");

  return (
    <aside className="grid h-full grid-rows-[auto_auto_auto_1fr_auto] overflow-hidden border-r border-border bg-muted">
      <div className="flex items-center gap-2 border-b border-border px-3.5 pb-2.5 pt-3">
        <div className="grid h-[22px] w-[22px] place-items-center rounded-sm bg-foreground font-display text-[13px] font-semibold text-background">
          B
        </div>
        <div className="font-display text-[14px] font-semibold tracking-tight text-foreground">
          The Bridge
        </div>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Toggle sidebar"
          className="grid h-[22px] w-[22px] place-items-center rounded-sm text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2.5 pb-1.5 pt-2">
        <TabButton active={tab === "chat"} onClick={() => setTab("chat")}>
          <Sparkles size={13} /> Chat
        </TabButton>
        <TabButton active={tab === "compose"} onClick={() => setTab("compose")}>
          <Pencil size={13} />
        </TabButton>
        <TabButton active={tab === "artifacts"} onClick={() => setTab("artifacts")}>
          <LinkIcon size={13} />
        </TabButton>
      </div>

      <div className="px-2 pb-1.5">
        <SidebarItem icon={<Plus size={15} />} label="New chat" kbd="⌘N" onClick={onNewChat} />
        <SidebarItem
          icon={<Inbox size={15} />}
          label="Inbox"
          badge="4"
          onClick={() => onNavigate("review")}
        />
      </div>

      <div className="overflow-y-auto px-2 pb-2">
        <SectionLabel>Workspaces</SectionLabel>
        {NAV.map((n) => {
          const Icon = NAV_ICON_MAP[n.icon];
          return (
            <SidebarItem
              key={n.id}
              icon={<Icon size={15} />}
              label={n.label}
              active={screen === n.id}
              onClick={() => onNavigate(n.id)}
            />
          );
        })}

        <SectionLabel className="mt-3.5">Pinned</SectionLabel>
        {RECENTS.pinned.map((t) => (
          <ThreadItem
            key={t.id}
            thread={t}
            active={openThread === t.id}
            onClick={() => setOpenThread(t.id)}
          />
        ))}

        <SectionLabel className="mt-3.5">Recents</SectionLabel>
        {RECENTS.recent.map((t) => (
          <ThreadItem
            key={t.id}
            thread={t}
            active={openThread === t.id}
            onClick={() => setOpenThread(t.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2.5 border-t border-border px-3 py-2.5">
        <div className="grid h-[26px] w-[26px] place-items-center rounded-full bg-foreground font-display text-[12px] font-semibold text-background">
          AB
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] font-medium text-foreground">
            Adrian Bowers
          </span>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            controller
          </span>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="More"
          className="grid h-[22px] w-[22px] place-items-center rounded-sm text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </aside>
  );
}
