export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE";

export interface Account {
  code: number;
  name: string;
  type: AccountType;
  balance: string;
  ic?: boolean;
}

export const ACCOUNTS: Account[] = [
  { code: 1010, name: "Cash — RBC operating", type: "ASSET", balance: "12,408,221.44" },
  { code: 1020, name: "Cash — RBC reserve", type: "ASSET", balance: "4,120,008.00" },
  { code: 1200, name: "Accounts receivable", type: "ASSET", balance: "402,110.30" },
  { code: 1500, name: "Intercompany — Holdings", type: "ASSET", balance: "312,400.00", ic: true },
  { code: 2010, name: "Accounts payable", type: "LIABILITY", balance: "128,084.12" },
  { code: 2180, name: "GST/HST payable", type: "LIABILITY", balance: "48,221.18" },
  { code: 3080, name: "Share capital", type: "EQUITY", balance: "1,000,000.00" },
  { code: 4080, name: "Consulting revenue", type: "REVENUE", balance: "3,402,812.66" },
  { code: 6240, name: "Professional fees", type: "EXPENSE", balance: "241,082.00" },
  { code: 6310, name: "Office rent", type: "EXPENSE", balance: "180,000.00" },
  { code: 6400, name: "Software & subscriptions", type: "EXPENSE", balance: "72,314.55" },
  { code: 6420, name: "Travel", type: "EXPENSE", balance: "18,402.05" },
];

export const ACCOUNT_TYPE_ORDER: AccountType[] = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
];
