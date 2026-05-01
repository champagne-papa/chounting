import type { StaticMessage } from "./messages";

export interface Thread {
  id: string;
  title: string;
  when: string;
  live?: boolean;
  pinned?: boolean;
}

export const RECENTS: { pinned: Thread[]; recent: Thread[] } = {
  pinned: [
    { id: "live", title: "Post Therapy X · March", live: true, when: "now" },
    { id: "close-q1", title: "Q1 close checklist", pinned: true, when: "Mar 12" },
  ],
  recent: [
    { id: "aws-march", title: "AWS reconciliation — March", when: "Mar 11" },
    { id: "stripe-fee", title: "Stripe fee re-coding", when: "Mar 10" },
    { id: "intercompany", title: "Intercompany — Holdings ↔ Ops", when: "Mar 09" },
    { id: "rent-prepaid", title: "Office rent prepaid setup", when: "Mar 06" },
    { id: "vendor-rules", title: "Vendor coding rules — review", when: "Mar 04" },
    { id: "gst-q4", title: "GST/HST Q4 filing", when: "Feb 28" },
    { id: "audit-trail", title: "Audit trail walkthrough", when: "Feb 24" },
    { id: "fiscal-2026", title: "Fiscal 2026 setup", when: "Feb 12" },
  ],
};

export const STATIC_THREADS: Record<string, StaticMessage[]> = {
  "close-q1": [
    { role: "stamp", text: "Mar 12" },
    { role: "user", text: "Walk me through Q1 close — what's left?" },
    { role: "agent", text: "Three things: GST/HST filing for Q1, intercompany reconciliation with Ops, and the prepaid rent amortization. I can draft the entries; you confirm." },
    { role: "user", text: "Start with the prepaid amortization." },
    { role: "agent", text: "Drafted JE-04209 — $5,000 monthly amortization for the new HQ lease. Posted to 6310." },
  ],
  "aws-march": [
    { role: "stamp", text: "Mar 11" },
    { role: "user", text: "AWS bill came in at $2,304.80." },
    { role: "agent", text: "Matched the rule — JE-04215 posted to 6400 Software & subscriptions. Same as the last 27 entries." },
  ],
  "stripe-fee": [
    { role: "stamp", text: "Mar 10" },
    { role: "agent", text: "Stripe fees this month look 30% higher than usual — looks like the connect fee changed. Want me to recategorize?" },
  ],
  intercompany: [
    { role: "stamp", text: "Mar 09" },
    { role: "user", text: "Holdings sent $312,400 to Ops. Both sides?" },
    { role: "agent", text: "Mirrored. JE-04211 (Holdings) and JE-04211-OPS (Ops). Both posted." },
  ],
  "rent-prepaid": [
    { role: "stamp", text: "Mar 06" },
    { role: "user", text: "How should I handle the new lease prepaid?" },
    { role: "agent", text: "12-month amortization to 6310 Office rent. I'll set up a recurring template." },
  ],
  "vendor-rules": [
    { role: "stamp", text: "Mar 04" },
    { role: "agent", text: "I have 8 vendor rules with <50% match confidence. Want to review them?" },
  ],
  "gst-q4": [
    { role: "stamp", text: "Feb 28" },
    { role: "user", text: "GST/HST Q4 filing." },
    { role: "agent", text: "Filed. Confirmation #BN9-4421-XX. Net $48,221 paid from 1010." },
  ],
  "audit-trail": [
    { role: "stamp", text: "Feb 24" },
    { role: "user", text: "Show me the audit trail for JE-04200 through 04210." },
    { role: "agent", text: "Pulled. Eleven entries, all with confirmations and matched controls." },
  ],
  "fiscal-2026": [
    { role: "stamp", text: "Feb 12" },
    { role: "agent", text: "Fiscal 2026 periods are open. First close is April 12 for Q1." },
  ],
};
