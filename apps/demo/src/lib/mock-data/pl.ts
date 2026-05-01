export type PLRowKind = "header" | "row" | "subtotal" | "total";

export interface PLRow {
  kind: PLRowKind;
  label?: string;
  code?: number;
  name?: string;
  amount?: string;
}

export interface PLData {
  netIncome: string;
  delta: string;
  rows: PLRow[];
}

export const PL: PLData = {
  netIncome: "2,909,416.11",
  delta: "+18.4%",
  rows: [
    { kind: "header", label: "REVENUE" },
    { kind: "row", code: 4080, name: "Consulting revenue", amount: "3,402,812.66" },
    { kind: "subtotal", label: "Total revenue", amount: "3,402,812.66" },
    { kind: "header", label: "OPERATING EXPENSES", amount: "(493,396.55)" },
    { kind: "row", code: 6240, name: "Professional fees", amount: "(241,082.00)" },
    { kind: "row", code: 6310, name: "Office rent", amount: "(180,000.00)" },
    { kind: "row", code: 6400, name: "Software & subscriptions", amount: "(72,314.55)" },
    { kind: "total", label: "Net income", amount: "2,909,416.11" },
  ],
};
