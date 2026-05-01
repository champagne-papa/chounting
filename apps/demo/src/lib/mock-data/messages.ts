import type { ProposedEntry } from "./proposed";
import { PROPOSED } from "./proposed";

export type MessageRole = "user" | "agent" | "tool" | "stamp" | "card";

export interface TextMessage {
  role: "user" | "agent" | "tool" | "stamp";
  text: string;
}

export interface CardMessage {
  role: "card";
  data: ProposedEntry;
}

export type Message = TextMessage | CardMessage;

export type StaticMessage = TextMessage;

export const SEED_MESSAGES: Message[] = [
  { role: "stamp", text: "Today · March 14" },
  { role: "agent", text: "Post Therapy X's March invoice — $8,240, same coding as usual." },
  { role: "user", text: "I pulled the invoice. Here's what I'd post — same coding as the last 14 entries." },
  { role: "card", data: { ...PROPOSED } },
];
