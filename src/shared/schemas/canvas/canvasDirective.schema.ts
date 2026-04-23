// src/shared/schemas/canvas/canvasDirective.schema.ts
// Phase 1.2 Session 2 — runtime Zod schema mirroring the
// CanvasDirective TypeScript discriminated union at
// src/shared/types/canvasDirective.ts.
//
// Used by the respondToUser tool's input_schema so Claude can
// return a structured canvas_directive alongside the
// template-based response.

import { z } from 'zod';
// Finding O2-v2: the canvas_directive.proposed_entry_card variant
// consumes the INPUT schema (UUIDs omitted). The orchestrator post-
// fills org_id/idempotency_key/trace_id from session/ctx before the
// card ships, at which point it validates against the strict
// ProposedEntryCardSchema (kept as the canonical output type for
// client-side consumers).
import { ProposedEntryCardInputSchema } from '@/shared/schemas/accounting/proposedEntryCard.schema';

const uuid = z.string().uuid();

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
    card: ProposedEntryCardInputSchema,
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
    type: z.literal('report_balance_sheet'),
    orgId: uuid,
    asOfDate: z.string().date().optional(),
  }).strict(),
  z.object({
    type: z.literal('report_account_ledger'),
    orgId: uuid,
    accountId: uuid,
    periodId: uuid.optional(),
  }).strict(),
  z.object({
    type: z.literal('reversal_form'),
    orgId: uuid,
    sourceEntryId: uuid,
  }).strict(),
  z.object({ type: z.literal('none') }).strict(),

  // Phase 1.2 Session 6 — form-escape surfaces + onboarding navigation
  z.object({ type: z.literal('user_profile') }).strict(),
  z.object({ type: z.literal('org_profile'), orgId: uuid }).strict(),
  z.object({ type: z.literal('org_users'), orgId: uuid }).strict(),
  z.object({ type: z.literal('invite_user'), orgId: uuid }).strict(),
  z.object({ type: z.literal('welcome') }).strict(),

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
