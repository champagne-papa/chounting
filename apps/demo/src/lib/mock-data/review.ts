export type ConfidenceLevel = "high" | "medium" | "mixed";

export interface ReviewItem {
  id: string;
  vendor: string;
  confidence: ConfidenceLevel;
  confidenceLabel: string;
  age: string;
  amount: string;
  rationale: string;
  detail: {
    account: string;
    offset: string;
    history: string;
  };
}

export const REVIEW_QUEUE: ReviewItem[] = [
  {
    id: "JE-04218",
    vendor: "Therapy X",
    confidence: "high",
    confidenceLabel: "high",
    age: "2 min",
    amount: "8,240.00",
    rationale: "Matched rule therapy-x-default→6240",
    detail: {
      account: "6240 Professional fees",
      offset: "1010 Cash — RBC operating",
      history: "14 prior entries",
    },
  },
  {
    id: "JE-04221",
    vendor: "New Vendor LLC",
    confidence: "mixed",
    confidenceLabel: "mixed",
    age: "3 min",
    amount: "1,445.00",
    rationale: "Novel vendor — no prior entries",
    detail: {
      account: "6420 Travel",
      offset: "1010 Cash — RBC operating",
      history: "0 prior entries",
    },
  },
  {
    id: "JE-04219",
    vendor: "AWS",
    confidence: "high",
    confidenceLabel: "high",
    age: "8 min",
    amount: "2,304.80",
    rationale: "Matched rule aws-monthly→6400",
    detail: {
      account: "6400 Software & subscriptions",
      offset: "1010 Cash — RBC operating",
      history: "27 prior entries",
    },
  },
  {
    id: "JE-04220",
    vendor: "Contractor 12",
    confidence: "medium",
    confidenceLabel: "medium",
    age: "21 min",
    amount: "320.00",
    rationale: "Amount below vendor median by 72%",
    detail: {
      account: "6240 Professional fees",
      offset: "1010 Cash — RBC operating",
      history: "4 prior entries",
    },
  },
];
