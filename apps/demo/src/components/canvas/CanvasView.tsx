import type { ScreenId } from "@/lib/mock-data";
import { Crumbs } from "./Crumbs";
import { HomeScreen } from "./HomeScreen";
import { ChartOfAccountsScreen } from "./ChartOfAccountsScreen";
import { JournalScreen } from "./JournalScreen";
import { ReviewScreen } from "./ReviewScreen";
import { PLScreen } from "./PLScreen";
import { APQueueScreen } from "./APQueueScreen";

interface CanvasViewProps {
  screen: ScreenId;
  onNavigate: (id: ScreenId) => void;
}

export function CanvasView({ screen, onNavigate }: CanvasViewProps) {
  return (
    <div className="grid h-full grid-rows-[36px_1fr] overflow-hidden">
      <Crumbs screen={screen} />
      <div className="overflow-auto px-6 pb-20 pt-6">
        {screen === "home" && <HomeScreen onNavigate={onNavigate} />}
        {screen === "coa" && <ChartOfAccountsScreen />}
        {screen === "journal" && <JournalScreen />}
        {screen === "review" && <ReviewScreen />}
        {screen === "pl" && <PLScreen />}
        {screen === "queue" && <APQueueScreen />}
      </div>
    </div>
  );
}
