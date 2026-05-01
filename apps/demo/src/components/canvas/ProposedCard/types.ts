import type { ProposedEntry } from "@/lib/mock-data";

export type CardVariant = "receipt" | "diff" | "conversational";
export type CardOutcome = "approved" | "rejected" | "edited";

export interface ProposedCardProps {
  data: ProposedEntry;
  busy: CardOutcome | null;
  resolved?: CardOutcome;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}
