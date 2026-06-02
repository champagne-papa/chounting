// apps/web/src/core/intent/producers.ts
//
// ADR-0031 Wave-4 — No-AI-Only-Paths producer registry.
//
// Code-defined (definitions-in-code, ADR-0028), PURE: no DB, no I/O, no agent, no
// runtime/org context (D-0031.5 — a build-time static fact; this is what keeps the
// no-IDOR property — the moment this module gains a read facet / adminClient path,
// that premise breaks and the per-facet cross-tenant audit re-enters). Importable by
// the Wave-4 CI check (`scripts/check-intent-producers.ts`) with no module-graph
// side effects.
//
// Every Intent declares its producers, each tagged 'ai' | 'non-ai'. The invariant
// (charter §2 Inv 3): every Intent has ≥1 non-AI producer. The warn-only check
// reports any intent lacking one; teeth + INV-WORKFLOW-001 registration are Wave 6
// (register-on-enforcement — `docs/02_specs/README.md:36-37`).
//
// Keyed on intent TYPE (R7 — a new producer registers as a data entry against an
// existing intent key, no rework):
//   - Navigation / Query  — intent-type keys.
//   - Mutation            — enumerated by the ledger-mutating ACTION_NAMES (the
//     complete ledger-mutation set; this subsumes the ingest ProposedMutation
//     proposal_types post_bill→bill.post and record_bill_payment→bill.record_payment/
//     payment.record, AND captures journal_entry.* which has an AI producer — the
//     postJournalEntry agent tool. Scoping to the two proposal_types alone would
//     exclude an AI-producible ledger mutation, the narrowing this invariant guards
//     against).

export type ProducerKind = 'ai' | 'non-ai';

export type IntentProducer = {
  /** Human-readable producer name. */
  readonly name: string;
  /** ai = conversational agent / ingest pipeline; non-ai = manual form / API / palette / Mainframe. */
  readonly kind: ProducerKind;
  /** Code site (provenance for audit; not load-bearing for the coverage check). */
  readonly site: string;
};

/**
 * Stable registry keys. Mutation keys are `mutation:<ledger ACTION_NAME>`; Navigation
 * and Query are intent-type keys.
 */
export type IntentKey =
  | 'navigation'
  | 'query'
  | 'mutation:journal_entry.post'
  | 'mutation:journal_entry.adjust'
  | 'mutation:bill.post'
  | 'mutation:bill.record_payment'
  | 'mutation:payment.record'
  | 'mutation:bill.reverse';

export const INTENT_PRODUCERS: Readonly<Record<IntentKey, readonly IntentProducer[]>> = {
  // --- Navigation (→ CanvasDirective). Covered by non-AI Mainframe/palette/drill-down. ---
  navigation: [
    { name: 'Mainframe nav (Zone 1)', kind: 'non-ai', site: 'components/bridge/Zone1ConsolidatedPanel.tsx:108 (navItemToDirective)' },
    { name: 'Canvas drill-down', kind: 'non-ai', site: 'components/bridge/SplitScreenLayout.tsx (routeStayInActive)' },
    { name: 'Command palette navigation', kind: 'non-ai', site: 'docs/02_specs/intent_model.md:54 (palette "go to")' },
    { name: 'Agent respondToUser (canvas_directive)', kind: 'ai', site: 'agent/tools/respondToUser.ts' },
    { name: 'Ingest drop event (pending_documents)', kind: 'ai', site: 'components/bridge/AgentChatPanel.tsx (handleDropEvent)' },
    // rule.create: draftVendorRule emits a proposed_rule_card, which rides the
    // canvas_directive path (proposedRuleCard.schema.ts) — i.e. a Navigation intent,
    // NOT a ledger Mutation. Recorded here (don't scope out a known AI producer);
    // Navigation stays covered by its non-AI producers above. (Rule persistence is
    // human-approved via POST /api/orgs/[orgId]/rules — outside ADR-0031's ledger
    // Mutation spine; if rule-authoring coverage is later wanted, that's a separate
    // OQ, not Wave 4.)
    { name: 'Agent draftVendorRule (proposed_rule_card)', kind: 'ai', site: 'agent/tools/draftVendorRule.ts' },
  ],

  // --- Query (→ transient view / in-chat structured response). KNOWN WAVE-4 WARN-GAP. ---
  query: [
    // No non-AI Query producer exists on disk. Query is not yet a distinct intent type
    // (intent_model.md §5 — Phase 2); transient views today arrive via Mainframe-as-
    // Navigation (non-AI, classified Navigation) or the agent (AI). The Wave-4 check
    // WARNS on this — visible, non-blocking, by design.
    //
    // WAVE-6 DISPOSITION (required before the teeth-flip, or exit 1 blocks on this
    // known gap): either a non-AI Query producer lands (e.g. a palette/search/report
    // surface that renders a transient view without the agent), OR Query is formally
    // scoped out of teeth with a documented Phase-2 rationale.
    { name: 'Agent (in-chat structured response / transient view)', kind: 'ai', site: 'agent/tools/respondToUser.ts; intent_model.md:74-78' },
  ],

  // --- Mutation: ledger-mutating ACTION_NAMES. All have a non-AI producer (no warn). ---
  'mutation:journal_entry.post': [
    { name: 'Manual journal-entry form / API', kind: 'non-ai', site: 'app/api/orgs/[orgId]/journal-entries/route.ts:82 (action journal_entry.post)' },
    { name: 'Recurring journal approve-run (human-approved)', kind: 'non-ai', site: 'services/accounting/recurringJournalService.ts (approveRun → journal_entry.post)' },
    { name: 'Agent postJournalEntry tool', kind: 'ai', site: 'agent/tools/postJournalEntry.ts' },
    { name: 'Agent reverseJournalEntry tool (posts via journal_entry.post)', kind: 'ai', site: 'agent/tools/reverseJournalEntry.ts' },
  ],
  'mutation:journal_entry.adjust': [
    { name: 'Manual adjustment form / API', kind: 'non-ai', site: 'app/api/orgs/[orgId]/journal-entries/route.ts:48 (action journal_entry.adjust)' },
  ],
  'mutation:bill.post': [
    { name: 'Manual bill form / API', kind: 'non-ai', site: 'app/api/orgs/[orgId]/bills/route.ts:47 (action bill.post)' },
    { name: 'Ingest pipeline (proposed_entry_card → post_bill; parked, Wave -1 bleed-stop)', kind: 'ai', site: 'agent/orchestrator/extraction/ingestDocument.ts' },
  ],
  'mutation:bill.record_payment': [
    { name: 'Manual record-payment form / API', kind: 'non-ai', site: 'app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts:45 (action bill.record_payment)' },
    { name: 'Ingest pipeline (proposed_entry_card → record_bill_payment; parked, Wave -1)', kind: 'ai', site: 'agent/orchestrator/extraction/ingestDocument.ts' },
  ],
  'mutation:payment.record': [
    { name: 'Manual record-payment form / API (via billService.recordPayment → paymentService.record)', kind: 'non-ai', site: 'app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts:45' },
    { name: 'Ingest pipeline (proposed_mutation_bundle child; parked, Wave -1)', kind: 'ai', site: 'agent/orchestrator/extraction/ingestDocument.ts' },
  ],
  'mutation:bill.reverse': [
    { name: 'Manual bill-reverse form / API', kind: 'non-ai', site: 'app/api/orgs/[orgId]/bills/[billId]/reverse/route.ts:38 (action bill.reverse)' },
  ],
};

/**
 * The No-AI-Only-Paths coverage check (pure): the registry keys whose producers
 * include no `non-ai` entry. An empty result means every Intent has ≥1 non-AI
 * producer (the invariant holds). At Wave 4 the CI wrapper reports these as warnings
 * (non-blocking); at Wave 6 they become build-failing.
 */
export function intentsLackingNonAiProducer(
  registry: Readonly<Record<string, readonly IntentProducer[]>> = INTENT_PRODUCERS,
): string[] {
  return Object.entries(registry)
    .filter(([, producers]) => !producers.some((p) => p.kind === 'non-ai'))
    .map(([intentKey]) => intentKey);
}
