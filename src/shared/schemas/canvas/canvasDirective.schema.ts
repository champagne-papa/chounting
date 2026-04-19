// src/shared/schemas/canvas/canvasDirective.schema.ts
// Phase 1.2 Session 2 — runtime Zod schema mirroring the
// CanvasDirective TypeScript discriminated union at
// src/shared/types/canvasDirective.ts.
//
// Used by the respondToUser tool's input_schema so Claude can
// return a structured canvas_directive alongside the
// template-based response.

import { z } from 'zod';

const uuid = z.string().uuid();

// TODO: tighten to ProposedEntryCardSchema in Session 7 once
// circular-import risk between canvas/ and accounting/ schemas
// is mapped. Session 2 uses z.unknown() to avoid hard coupling.
const proposedEntryCardPlaceholder = z.unknown();

export const canvasDirectiveSchema = z.discriminatedUnion('type', [
  // Phase 1.1 directives
  z.object({ type: z.literal('chart_of_accounts'), orgId: uuid }).strict(),
  z.object({
    type: z.literal('journal_entry'),
    orgId: uuid,
    entryId: uuid,
    mode: z.enum(['view', 'edit']),
  }).strict(),
  z.object({
    type: z.literal('journal_entry_form'),
    orgId: uuid,
    prefill: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
  z.object({ type: z.literal('journal_entry_list'), orgId: uuid }).strict(),
  z.object({
    type: z.literal('proposed_entry_card'),
    card: proposedEntryCardPlaceholder,
  }).strict(),
  z.object({ type: z.literal('ai_action_review_queue'), orgId: uuid }).strict(),
  z.object({
    type: z.literal('report_pl'),
    orgId: uuid,
    periodId: uuid.optional(),
  }).strict(),
  z.object({
    type: z.literal('report_trial_balance'),
    orgId: uuid,
    periodId: uuid.optional(),
  }).strict(),
  z.object({
    type: z.literal('reversal_form'),
    orgId: uuid,
    sourceEntryId: uuid,
  }).strict(),
  z.object({ type: z.literal('none') }).strict(),

  // Phase 2+ stubs
  z.object({ type: z.literal('ap_queue'), orgId: uuid }).strict(),
  z.object({
    type: z.literal('vendor_detail'),
    vendorId: uuid,
    orgId: uuid,
  }).strict(),
  z.object({
    type: z.literal('bank_reconciliation'),
    accountId: uuid,
  }).strict(),
  z.object({ type: z.literal('ar_aging'), orgId: uuid }).strict(),
  z.object({ type: z.literal('consolidated_dashboard') }).strict(),
]);

export type CanvasDirectiveParsed = z.infer<typeof canvasDirectiveSchema>;
