// Phase 8 chunk 7 — postV1ReconciliationOrchestrator (framing #2 post-v1
// reconciliation orchestrator: Stage 7 Bundle partial-commit reconciliation
// path activation).
//
// Born_paid_bill bundle commit composite. The proposed_mutation_bundle
// born-paid case route (proposalBuilder.ts) carries two child mutations:
// post_bill then record_bill_payment. The post_bill leg commits upstream
// (the bill is "born" — posted before this orchestrator runs); this
// orchestrator commits the record_bill_payment leg via
// paymentService.record() — consumer #2 per Sub-Q3.b multi-consumer
// expansion (Phase 7 chunk 7.3b is consumer #1).
//
// Partial-commit reconciliation: if the payment leg fails after the bill
// leg committed, the bundle is half-applied (bill posted, payment missing).
// The orchestrator routes the case to the manual reconciliation queue via
// documentExceptionService.enqueueException at
// exception_reason='bundle_partial_commit_reconciliation_pending'
// (Phase 2 chunk 6 substrate; enqueue_exception_with_audit RPC).
//
// withInvariants posture (Pattern B unwrapped): this orchestrator exports a
// plain function exercised via direct call — greenfield-with-no-v1-callers,
// mirroring paymentService.record. Route-handler / Stage-7-commit-surface
// wiring applies withInvariants(reconcileBornPaidBundle, { action })(input,
// ctx) at consumer-activation time; that wiring is deferred (ingestDocument /
// proposalBuilder NOT modified at chunk 7 per brief §3.3). Consumed services
// (paymentService.record, enqueueException) are invoked directly with the
// threaded ServiceContext — service-to-service composition, not re-wrapped
// (billService → journalEntryService precedent).
//
// Audit posture: orchestrator-specific audit metadata is NOT written at
// chunk 7 (four-axis scope; §3.3 forbids RPC / consumed-service-body /
// audit-action substrate modification). The reconciliation story is
// recoverable from the downstream payment_recorded (success) and
// exception_enqueued (partial-commit) audit events, both correlated by
// ctx.trace_id. Richer orchestrator-grade audit composition is deferred.

import {
  PostV1ReconciliationOrchestratorInputSchema,
  type PostV1ReconciliationOrchestratorInput,
  type PostV1ReconciliationOrchestratorInputRaw,
} from '@/shared/schemas/document-platform/postV1ReconciliationOrchestrator.schema';
import { paymentService } from '@/services/spend/paymentService';
import { enqueueException } from '@/services/document-platform/documentExceptionService';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';

export type PostV1ReconciliationResult =
  | {
      outcome: 'committed';
      document_case_id: string;
      payment_id: string;
      journal_entry_id: string;
    }
  | {
      outcome: 'reconciliation_pending';
      document_case_id: string;
      exception_queue_entry_id: string;
    };

async function reconcileBornPaidBundle(
  input: PostV1ReconciliationOrchestratorInputRaw,
  ctx: ServiceContext,
): Promise<PostV1ReconciliationResult> {
  const log = loggerWith({
    trace_id: ctx?.trace_id,
    user_id: ctx?.caller?.user_id,
  });

  let parsed: PostV1ReconciliationOrchestratorInput;
  try {
    parsed = PostV1ReconciliationOrchestratorInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `postV1ReconciliationOrchestrator validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  try {
    // Commit the record_bill_payment leg of the born_paid_bill bundle. The
    // post_bill leg is already committed upstream.
    const payment = await paymentService.record(parsed.payment, ctx); // consumer #2
    return {
      outcome: 'committed',
      document_case_id: parsed.document_case_id,
      payment_id: payment.payment_id,
      journal_entry_id: payment.journal_entry_id,
    };
  } catch (paymentErr) {
    // Partial commit: bill posted upstream, payment leg failed. Route to the
    // manual reconciliation queue. enqueueException failures (including
    // EXCEPTION_ALREADY_OPEN on a duplicate invocation for the same case per
    // the partial UNIQUE index exception_queue_entries_open_per_case_idx)
    // propagate by design — the orchestrator does not swallow them.
    log.error(
      {
        err: paymentErr,
        document_case_id: parsed.document_case_id,
        bill_id: parsed.payment.bill_id,
      },
      'born_paid_bill payment leg failed after bill commit; routing to reconciliation queue',
    );
    const entry = await enqueueException(
      {
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        exception_reason: 'bundle_partial_commit_reconciliation_pending',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    return {
      outcome: 'reconciliation_pending',
      document_case_id: parsed.document_case_id,
      exception_queue_entry_id: entry.exception_queue_entry_id,
    };
  }
}

export const postV1ReconciliationOrchestrator = {
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(reconcileBornPaidBundle, { action }) at consumer-activation time; deferred — no v1 caller yet (mirrors paymentService.record); see file header L20-28)
  reconcileBornPaidBundle,
};
