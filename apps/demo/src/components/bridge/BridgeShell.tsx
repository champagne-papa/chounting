"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@chounting/ui";
import {
  SEED_MESSAGES,
  type Message,
  type ScreenId,
} from "@/lib/mock-data";
import { CombinedSidebar } from "./CombinedSidebar";
import { Topbar } from "./Topbar";
import { ThreadPanel } from "./ThreadPanel";
import { CanvasView } from "../canvas/CanvasView";
import type { CardVariant } from "../canvas/ProposedCard";
import { TweaksPanel } from "../tweaks/TweaksPanel";
import { TweakSection, TweakRadio } from "../tweaks/controls";

type Density = "comfortable" | "compact";

interface ShellGridStyle extends CSSProperties {
  "--row-h": string;
}

export function BridgeShell() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [openThread, setOpenThread] = useState<string | null>("live");
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [cardVariant, setCardVariant] = useState<CardVariant>("receipt");
  const [density, setDensity] = useState<Density>("comfortable");

  function newChat() {
    setMessages([{ role: "agent", text: "What's on your mind?" }]);
    setOpenThread("live");
  }

  const gridStyle: ShellGridStyle = {
    "--row-h": density === "compact" ? "30px" : "36px",
  };

  return (
    <div
      className={cn(
        "grid h-screen w-screen",
        openThread
          ? "grid-cols-[260px_380px_1fr] grid-rows-[48px_1fr] [grid-template-areas:'side_thread_top'_'side_thread_canvas']"
          : "grid-cols-[260px_1fr] grid-rows-[48px_1fr] [grid-template-areas:'side_top'_'side_canvas']",
      )}
      style={gridStyle}
    >
      <div className="min-w-0 overflow-hidden [grid-area:side]">
        <CombinedSidebar
          screen={screen}
          onNavigate={setScreen}
          openThread={openThread}
          setOpenThread={setOpenThread}
          onNewChat={newChat}
        />
      </div>

      {openThread && (
        <div className="min-w-0 overflow-hidden [grid-area:thread]">
          <ThreadPanel
            openThread={openThread}
            setOpenThread={setOpenThread}
            messages={messages}
            setMessages={setMessages}
            cardVariant={cardVariant}
          />
        </div>
      )}

      <div className="[grid-area:top]">
        <Topbar />
      </div>

      <div className="relative overflow-hidden [grid-area:canvas]">
        <CanvasView screen={screen} onNavigate={setScreen} />
      </div>

      <TweaksPanel>
        <TweakSection title="Proposed-entry card">
          <TweakRadio
            label="Variant"
            options={[
              { value: "receipt", label: "Receipt" },
              { value: "diff", label: "Diff" },
              { value: "conversational", label: "Conversational" },
            ]}
            value={cardVariant}
            onChange={setCardVariant}
          />
        </TweakSection>
        <TweakSection title="Display">
          <TweakRadio
            label="Density"
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
            value={density}
            onChange={setDensity}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
