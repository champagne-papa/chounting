import type { ConfidenceLevel } from "./review";

export interface ProposedLine {
  code: number;
  name: string;
  debit: string;
  credit: string;
}

export interface ProposedEntry {
  org: string;
  vendor: string;
  amount: string;
  currency: string;
  date: string;
  description: string;
  confidence: ConfidenceLevel;
  lines: ProposedLine[];
  why: string;
  trackRecord: string;
  ifRejected: string;
}

export const PROPOSED: ProposedEntry = {
  org: "HOLDINGS INC.",
  vendor: "Therapy X",
  amount: "8,240.00",
  currency: "CAD",
  date: "2026-03-14",
  description: "Therapy X · March invoice",
  confidence: "high",
  lines: [
    { code: 6240, name: "Professional fees", debit: "8,240.00", credit: "" },
    { code: 1010, name: "Cash — RBC operating", debit: "", credit: "8,240.00" },
  ],
  why: "Matched vendor rule therapy-x-default→6240.",
  trackRecord: "Vendor has 14 prior entries, all posted to 6240.",
  ifRejected: "No journal entry will be created. Routes back to chat with the original message.",
};
