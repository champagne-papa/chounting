// Layer-2 boundary for Phase 8 chunk 7 postV1ReconciliationOrchestrator
// (framing #2 post-v1 reconciliation orchestrator: Stage 7 Bundle
// partial-commit reconciliation path).
//
// The born_paid_bill bundle (proposalBuilder.ts buildBornPaidBundle) carries
// two child mutations: post_bill then record_bill_payment. The post_bill leg
// is committed upstream (the bill is "born"); this orchestrator commits the
// record_bill_payment leg via paymentService.record() (consumer #2 per
// Sub-Q3.b) and reconciles a partial-commit failure (bill posted, payment
// leg failed) by enqueueing a bundle_partial_commit_reconciliation_pending
// exception.
//
// Bundle-shape note: the full proposed_mutation_bundle is typed `unknown` at
// proposalBuilder grade; formal ProposalJustificationSchema / bundle Zod
// codification is deferred to chunk 9 (Layer 2 item #B; brief §2.2). Chunk 7
// carries the concrete record_bill_payment leg (RecordPaymentInputSchema)
// only — substrate-grade-first per Sub-Q9.

import { z } from 'zod';
import { RecordPaymentInputSchema } from '@/shared/schemas/spend/recordPayment.schema';

export const PostV1ReconciliationOrchestratorInputSchema = z.object({
  document_case_id: z.string().uuid(),
  source_document_id: z.string().uuid().optional(),
  trace_id: z.string().uuid(),
  // record_bill_payment leg of the born_paid_bill bundle.
  payment: RecordPaymentInputSchema,
});
export type PostV1ReconciliationOrchestratorInputRaw =
  z.input<typeof PostV1ReconciliationOrchestratorInputSchema>;
export type PostV1ReconciliationOrchestratorInput =
  z.infer<typeof PostV1ReconciliationOrchestratorInputSchema>;
