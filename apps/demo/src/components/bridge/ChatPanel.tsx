"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Send } from "lucide-react";
import { cn } from "@chounting/ui";
import type { Message, ScreenId } from "@/lib/mock-data";
import { ProposedCard } from "../canvas/ProposedCard";
import type { CardVariant, CardOutcome } from "../canvas/ProposedCard";

interface ChatPanelProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  cardVariant: CardVariant;
  onNavigate?: (id: ScreenId) => void;
}

function TextBubble({ role, text }: { role: "user" | "agent" | "tool" | "stamp"; text: string }) {
  if (role === "stamp") {
    return (
      <div className="self-center px-0 pb-0.5 pt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-foreground/40">
        — {text} —
      </div>
    );
  }
  if (role === "tool") {
    return (
      <div className="max-w-[88%] self-start rounded-lg border border-dashed border-border px-2.5 py-1.5 font-mono text-[11.5px] text-muted-foreground">
        {text}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
        role === "user"
          ? "self-end rounded-br-xs bg-warning/30 text-foreground"
          : "self-start rounded-bl-xs bg-primary/15 text-foreground",
      )}
    >
      {text}
    </div>
  );
}

export function ChatPanel({ messages, setMessages, cardVariant, onNavigate }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<CardOutcome | null>(null);
  const [cardState, setCardState] = useState<Record<number, CardOutcome>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages.length, busy]);

  function send() {
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", text: t }]);
    setTimeout(() => {
      const lower = t.toLowerCase();
      let reply: Message;
      if (/p&l|profit|net income/.test(lower)) {
        reply = {
          role: "agent",
          text: "Q1 P&L is open in the canvas — net income lands at $2,909,416.11 (+18.4% vs prior quarter).",
        };
        onNavigate?.("pl");
      } else if (/journal|entries/.test(lower)) {
        reply = { role: "agent", text: "Showing March 2026 journal — 7 entries, 1 draft pending." };
        onNavigate?.("journal");
      } else if (/queue|review|approve all/.test(lower)) {
        reply = { role: "agent", text: "Four proposals waiting. Three are high confidence." };
        onNavigate?.("review");
      } else if (/chart|account/.test(lower)) {
        reply = { role: "agent", text: "Chart of Accounts — 11 leaves under IFRS template." };
        onNavigate?.("coa");
      } else {
        reply = { role: "agent", text: "I'll keep that in mind. Anything else?" };
      }
      setMessages((prev) => [...prev, reply]);
    }, 420);
  }

  function resolveCard(idx: number, outcome: CardOutcome) {
    setBusy(outcome);
    setTimeout(() => {
      setCardState((s) => ({ ...s, [idx]: outcome }));
      setBusy(null);
      if (outcome === "approved") {
        setMessages((prev) => [
          ...prev,
          { role: "tool", text: "→ post_journal_entry  ✓ JE-04218" },
          { role: "agent", text: "Done — JE-04218 posted to March 2026. Anything else from the queue?" },
        ]);
      } else if (outcome === "edited") {
        setMessages((prev) => [...prev, { role: "agent", text: "Opened in the editor. I'll wait." }]);
      } else if (outcome === "rejected") {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: "Got it. I won't post that. Want to change the coding rule?" },
        ]);
      }
    }, 600);
  }

  return (
    <div className="grid h-full grid-rows-[1fr_56px] overflow-hidden">
      <div ref={bodyRef} className="flex flex-col gap-2.5 overflow-y-auto p-3.5">
        {messages.map((m, i) => {
          if (m.role === "card") {
            return (
              <ProposedCard
                key={i}
                variant={cardVariant}
                data={m.data}
                busy={busy}
                resolved={cardState[i]}
                onApprove={() => resolveCard(i, "approved")}
                onReject={() => resolveCard(i, "rejected")}
                onEdit={() => resolveCard(i, "edited")}
              />
            );
          }
          return <TextBubble key={i} role={m.role} text={m.text} />;
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-muted px-3">
        <input
          type="text"
          placeholder="Message the agent…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          className="h-9 flex-1 rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          aria-label="Send"
          className="grid h-9 w-9 place-items-center rounded-md border border-foreground bg-foreground text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
