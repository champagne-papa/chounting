import {
  BookOpenText,
  Inbox,
  CheckCheck,
  TrendingUp,
  type LucideProps,
} from "lucide-react";

export function BridgeIcon({ size = 18, ...props }: LucideProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 17 C 7 11, 17 11, 21 17" />
      <path d="M3 17 V 20" />
      <path d="M21 17 V 20" />
      <path d="M9 14 V 17" />
      <path d="M15 14 V 17" />
      <path d="M12 12 V 17" />
    </svg>
  );
}

export function ChartIcon(props: LucideProps) {
  return <BookOpenText {...props} />;
}

export function JournalIcon(props: LucideProps) {
  return (
    <svg
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 4 H 17 A 2 2 0 0 1 19 6 V 20 L 16 18.5 L 13 20 L 10 18.5 L 7 20 L 5 18 Z" />
      <path d="M9 9 H 15" />
      <path d="M9 13 H 15" />
    </svg>
  );
}

export function InboxIcon(props: LucideProps) {
  return <Inbox {...props} />;
}

export function ReviewIcon(props: LucideProps) {
  return <CheckCheck {...props} />;
}

export function PLIcon(props: LucideProps) {
  return <TrendingUp {...props} />;
}

export const NAV_ICON_MAP = {
  Bridge: BridgeIcon,
  Chart: ChartIcon,
  Journal: JournalIcon,
  Review: ReviewIcon,
  Inbox: InboxIcon,
  PL: PLIcon,
} as const;
