import { ReceiptCard } from "./Receipt";
import { DiffCard } from "./Diff";
import { ConversationalCard } from "./Conversational";
import type { CardVariant, ProposedCardProps } from "./types";

export type { CardVariant, CardOutcome, ProposedCardProps } from "./types";

interface Props extends ProposedCardProps {
  variant?: CardVariant;
}

export function ProposedCard({ variant = "receipt", ...rest }: Props) {
  if (variant === "diff") return <DiffCard {...rest} />;
  if (variant === "conversational") return <ConversationalCard {...rest} />;
  return <ReceiptCard {...rest} />;
}
