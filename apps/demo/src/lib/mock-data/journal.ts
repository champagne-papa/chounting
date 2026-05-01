export type JournalStatus = "posted" | "draft";

export interface JournalEntry {
  id: string;
  date: string;
  vendor: string;
  status: JournalStatus;
  by: string;
  debit: string;
  credit: string;
}

export const JOURNAL: JournalEntry[] = [
  { id: "JE-04218", date: "2026-03-14", vendor: "Therapy X", status: "draft", by: "the agent", debit: "8,240.00", credit: "8,240.00" },
  { id: "JE-04217", date: "2026-03-13", vendor: "Ontario Hydro", status: "posted", by: "a.bowers", debit: "1,240.00", credit: "1,240.00" },
  { id: "JE-04216", date: "2026-03-12", vendor: "Bell Canada", status: "posted", by: "a.bowers", debit: "412.55", credit: "412.55" },
  { id: "JE-04215", date: "2026-03-11", vendor: "AWS", status: "posted", by: "the agent", debit: "2,304.80", credit: "2,304.80" },
  { id: "JE-04214", date: "2026-03-10", vendor: "Stripe", status: "posted", by: "a.bowers", debit: "88.22", credit: "88.22" },
  { id: "JE-04213", date: "2026-03-09", vendor: "RBC", status: "posted", by: "the agent", debit: "500.00", credit: "500.00" },
  { id: "JE-04212", date: "2026-03-08", vendor: "Landlord Co", status: "posted", by: "a.bowers", debit: "15,000.00", credit: "15,000.00" },
];
