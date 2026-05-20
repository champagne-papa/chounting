// src/shared/schemas/accounting/proposedMutationBundle.schema.ts
//
// Phase 7 chunk 7.3b Task 7.3b.0 — ProposedMutationBundle greenfield Zod
// schema per ADR-0012 (bundle atomicity + lifecycle + Logic Receipt shape)
// + ADR-0014 §11 (v1-active born_paid_bill bundle) + chunk 7.3 brief §4
// value pick #4.
//
// v1-active bundle proposal_type per ADR-0014 §11:
//   - 'born_paid_bill' — post_bill + record_bill_payment children.
//
// Reserved bundle types per ADR-0012 §12 + ADR-0015 (defined-but-not-
// active per ADR-0010 reserved-enum-states discipline):
//   - 'final_invoice_with_applied_deposit' (reserved)
//   - 'vendor_credit_applied_to_bill' (reserved)
//
// Bundle execution semantics per ADR-0012 (referenced from ADR-0014 §11):
// child mutations execute atomically via sequential withInvariants() calls
// at Stage 7 commit composite. If any child fails Tier 1 re-verification,
// bundle rejected at proposal grade. If first child commits but second
// fails post-success, the first child's commit stands and second routes
// to exception queue with reconciliation marker (chunk 7.3b uses
// 'manual_route' + rich audit metadata per Iteration 2 Note 2 default
// disposition; reserved enum value 'bundle_partial_commit_reconciliation_
// pending' absent at ExceptionReasonSchema per Phase A verification — bank
// (μ) sub-grain at close report).
//
// justification field: permissive z.record(z.unknown()).optional() shape
// per Iteration 2 Option (c') Finding E absorption. Formal
// ProposalJustificationSchema codification deferred to Phase 8 / post-v1
// Logic Receipt consumer per ADR-0007 Q30.

import { z } from 'zod';
import { ProposedMutationSchema } from './proposedMutation.schema';

// Born-paid bundle children: post_bill MUST precede record_bill_payment
// per ADR-0012 sequential best-effort + ADR-0014 §13 commit-order spec.
const BornPaidBillChildrenTuple = z.tuple([
  ProposedMutationSchema.refine(
    (m) => m.proposal_type === 'post_bill',
    { message: 'born_paid_bill child 1 must be post_bill' },
  ),
  ProposedMutationSchema.refine(
    (m) => m.proposal_type === 'record_bill_payment',
    { message: 'born_paid_bill child 2 must be record_bill_payment' },
  ),
]);

export const ProposedMutationBundleSchema = z
  .object({
    proposal_type: z.literal('born_paid_bill'),
    source_document_id: z.string().uuid(),
    trace_id: z.string().uuid(),
    child_mutations: BornPaidBillChildrenTuple,
    // justification permissive per Iteration 2 Option (c') Finding E
    // absorption; formal ProposalJustificationSchema codification deferred
    // to Phase 8 / post-v1 Logic Receipt consumer per ADR-0007 Q30.
    justification: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type ProposedMutationBundle = z.infer<typeof ProposedMutationBundleSchema>;
