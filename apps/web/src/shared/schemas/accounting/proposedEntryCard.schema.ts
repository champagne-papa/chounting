// src/shared/schemas/accounting/proposedEntryCard.schema.ts
// Phase 1.2 Session 7 Commit 2 — Zod mirror of the TS type at
// src/shared/types/proposedEntryCard.ts. Used by
// canvasDirective.schema.ts to tighten the proposed_entry_card
// directive variant from z.unknown() (Session 2 placeholder) to
// the full card shape.
//
// Strictness discipline:
//   - Card and line objects are .strict() — extra keys rejected.
//   - policy_outcome is .strict() — extras rejected at boundary.
//   - reason_params is deliberately loose (z.record(...)) because
//     its valid keys are driven by the reason_template_id and
//     strict per-template validation lives at the orchestrator
//     boundary via validateParamsAgainstTemplate (Commit 1).
//   - reciprocal_entry_preview is z.unknown().optional() — no
//     speculation about Phase 2's intercompany shape.
//   - required_action is z.literal('approve') — mirrors the TS
//     type exactly; rejects silent drift if a future value is
//     added without updating the schema.

import { z } from 'zod';
import { MoneyAmountSchema } from './money.schema';

export const ProposedEntryLineSchema = z
  .object({
    account_code: z.string(),
    account_name: z.string(),
    debit: MoneyAmountSchema,
    credit: MoneyAmountSchema,
    currency: z.string(),
    description: z.string().optional(),
    tax_code: z.string().optional(),
  })
  .strict();

export const PolicyOutcomeSchema = z
  .object({
    required_action: z.literal('approve'),
    reason_template_id: z.string(),
    reason_params: z.record(z.string(), z.unknown()),
  })
  .strict();

export const ProposedEntryCardSchema = z
  .object({
    org_id: z.string().uuid(),
    org_name: z.string(),
    transaction_type: z.enum(['journal_entry', 'bill', 'payment', 'intercompany']),
    entry_date: z.string().date(),
    description: z.string(),
    vendor_name: z.string().optional(),
    matched_rule_label: z.string().optional(),
    lines: z.array(ProposedEntryLineSchema).min(2),
    intercompany_flag: z.boolean(),
    reciprocal_entry_preview: z.unknown().optional(),
    confidence_score: z.number(),
    policy_outcome: PolicyOutcomeSchema,
    routing_path: z.string().optional(),
    idempotency_key: z.string().uuid(),
    dry_run_entry_id: z.string().uuid(),
    trace_id: z.string().uuid(),
    tentative: z.boolean().optional(),
  })
  .strict();

export type ProposedEntryCardParsed = z.infer<typeof ProposedEntryCardSchema>;

// Finding O2-v2: the model cannot emit a valid org_id (no UUIDs in
// prompt by design), idempotency_key (orchestrator-minted pre-Zod at
// Site 1), or trace_id (orchestrator-controlled). The input schema
// is the shape the orchestrator accepts from respondToUser's
// canvas_directive; Site 2 post-fills the three UUID fields from
// session/ctx before the card ships to the client (which still sees
// the strict ProposedEntryCardSchema shape).
// See docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-v2-pre-zod-injection-plan.md.
export const ProposedEntryCardInputSchema = ProposedEntryCardSchema.omit({
  org_id: true,
  idempotency_key: true,
  trace_id: true,
});

export type ProposedEntryCardInput = z.infer<typeof ProposedEntryCardInputSchema>;
