export type ScreenId = "home" | "coa" | "journal" | "review" | "queue" | "pl";

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: "Bridge" | "Chart" | "Journal" | "Review" | "Inbox" | "PL";
}

export const NAV: NavItem[] = [
  { id: "home", label: "Bridge", icon: "Bridge" },
  { id: "coa", label: "Chart of Accounts", icon: "Chart" },
  { id: "journal", label: "Journal", icon: "Journal" },
  { id: "review", label: "AI Action Review", icon: "Review" },
  { id: "queue", label: "AP Queue", icon: "Inbox" },
  { id: "pl", label: "P&L", icon: "PL" },
];

export const CRUMBS: Record<ScreenId, string[]> = {
  home: ["Holdings Inc.", "Home"],
  coa: ["Holdings Inc.", "Chart of Accounts"],
  journal: ["Holdings Inc.", "Journal", "March 2026"],
  review: ["Holdings Inc.", "AI Action Review"],
  queue: ["Holdings Inc.", "AP Queue"],
  pl: ["Holdings Inc.", "Reports", "Profit & Loss · Q1 2026"],
};

export const RIGHT_MARK: Record<ScreenId, string> = {
  home: "HOME",
  coa: "COA",
  journal: "LEDGER",
  review: "REVIEW",
  queue: "AP",
  pl: "FL",
};
