"use client";

import type { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import type { Message } from "@/lib/mock-data";
import { STATIC_THREADS } from "@/lib/mock-data";
import type { CardVariant } from "../canvas/ProposedCard";
import { ChatPanel } from "./ChatPanel";
import { StaticThread } from "./StaticThread";

interface ThreadPanelProps {
  openThread: string;
  setOpenThread: (id: string | null) => void;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  cardVariant: CardVariant;
}

export function ThreadPanel({
  openThread,
  setOpenThread,
  messages,
  setMessages,
  cardVariant,
}: ThreadPanelProps) {
  const isLive = openThread === "live";

  return (
    <div className="grid h-full min-w-0 grid-rows-[44px_1fr_56px] overflow-hidden border-r border-border bg-muted shadow-[6px_0_16px_-10px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2.5 border-b border-border px-3">
        {isLive && (
          <span className="bridge-pulse-dot h-[7px] w-[7px] rounded-full bg-success" />
        )}
        <div className="font-display text-[14px] italic text-foreground">
          {isLive ? "the agent" : "Thread"}
        </div>
        <div className="font-mono text-[11.5px] text-muted-foreground">
          {isLive ? "live" : ""}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpenThread(null)}
          className="grid h-[22px] w-[22px] place-items-center rounded-sm text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      {isLive ? (
        <ChatPanel
          messages={messages}
          setMessages={setMessages}
          cardVariant={cardVariant}
        />
      ) : (
        <StaticThread messages={STATIC_THREADS[openThread] ?? []} />
      )}
    </div>
  );
}
