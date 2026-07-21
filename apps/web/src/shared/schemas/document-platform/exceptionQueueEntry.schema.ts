import { z } from 'zod';
import { TimestamptzString } from '@/shared/schemas/common.schema';

// Layer 2 boundary: v1-active subsets only.
// Reserved enum values defined in DB ENUM type but rejected here.

// 9 v1-active resolution_action values per ADR-0011 §13 Decision-
// section + 2026-05-08 amendment (manual_born_paid_workflow added).
// Reserved 9 values stay in the DB ENUM type but Zod rejects them
// here (Layer 2 defense-in-depth on top of Layer 1 CHECK).
//
// Reserved set: 8 from §13 + 1 from ADR-0015 §6 cross-reference
// (backfill_vendor_prepayment_suggested). The latter is named by
// ADR-0015 §6 at lines 628/650/1137/1373 but ADR-0011 §13's enum
// doesn't currently list it; chunk 6 ships substrate-now-amendment-
// later per chunks-3-5 precedent. §13 amendment pending in
// retrospective inventory item #6 sub-finding 5.
export const ResolutionActionSchema = z.enum([
  'attach_to_existing_bill',
  'attach_to_existing_payment',
  'record_bill_payment',
  'mark_duplicate',
  'mark_non_accounting',
  'route_to_manual_entry',
  'manual_born_paid_workflow',
  'reprocess',
  'archive',
]);
export type ResolutionAction = z.infer<typeof ResolutionActionSchema>;

// 2 v1-active exception_status values. Reserved 1 value (cancelled)
// stays in the DB ENUM; activates when Phase 4 Router T1-T4 ships
// per ADR-0018 §3 Subsystem 3 firing-shape.
export const ExceptionStatusSchema = z.enum(['open', 'resolved']);
export type ExceptionStatus = z.infer<typeof ExceptionStatusSchema>;

// 12 v1-active exception_reason values. Each has a named v1 consumer
// in a ratified ADR. Reserved 2 values (wrong_entity_exception per
// ADR-0011 §10 multi-entity post-v1; drift_detected per ADR-0013
// §5-§6 supabase_storage-v1-exempt) stay in DB ENUM.
//
// 5 candidate values were considered at scope-lock and OMITTED
// entirely (NOT in enum, NOT reserved, NOT in any future migration
// plan): pipeline_transient_failure, pipeline_unavailable,
// pipeline_schema_mismatch, ai_validation_failed,
// case_requires_reserved_role. Pipeline-failure variants collapse
// under low_confidence_classification / unknown_document_type from
// queue UX standpoint; case_requires_reserved_role covered by
// manual_route per ADR-0011 §3 line 301-311. If a future caller
// needs them, ADR-0011 amendment names them; chunk N migration adds.
//
// Phase 7 chunk 7.2 addendum (per Sub-Q10 lock + ADR-0014 §12.3 +
// migration 20240157 + Session 38 directive Step 13 (γ)): the prior
// OMITTED candidate ai_validation_failed graduates to v1-active as
// ai_fallback_validation_failed (renamed for explicit naming match
// with ADR-0014 §12.3 audit event verbatim). The other four OMITTED
// candidates (pipeline_transient_failure, pipeline_unavailable,
// pipeline_schema_mismatch, case_requires_reserved_role) remain
// OMITTED per the chunk-6 framing.
//
// Phase 8 chunk 7 addendum: 'bundle_partial_commit_reconciliation_
// pending' graduates to v1-active (8th value). Named v1 consumer:
// postV1ReconciliationOrchestrator (Stage 7 Bundle partial-commit
// reconciliation path).
//
// Board #4 slice-2 addendum: 'multi_invoice' graduates to v1-active
// (9th value). Named v1 consumer: the T2c multi-invoice split branch
// (migrations 20240182 ADD VALUE + 20240183 chunk_9_active CHECK).
//
// Board #4 Fork C addendum: 'duplicate_invoice_suspected' graduates to
// v1-active (10th value). Named v1 consumer: the semantic-duplicate
// handler #1 (migrations 20240186 ADD VALUE + 20240187 chunk_10_active
// CHECK).
//
// Board #4 Fork C addendum: 'bank_detail_change_suspected' graduates to
// v1-active (11th value). Named v1 consumer: the bank-detail / remittance
// presence tripwire, handler #2 (migrations 20240188 ADD VALUE + 20240189
// chunk_11_active CHECK).
//
// Board #4 Fork C addendum: 'statement_not_invoice_suspected' graduates to
// v1-active (12th value). Named v1 consumer: the statement-vs-invoice presence
// tripwire, handler #3 (migrations 20240190 ADD VALUE + 20240191
// chunk_12_active CHECK).
export const ExceptionReasonSchema = z.enum([
  'manual_route',
  'low_confidence_classification',
  'unknown_document_type',
  'unmatched_router_candidate',
  'multi_candidate_ambiguity',
  'invariant_violation',
  'ai_fallback_validation_failed',
  'bundle_partial_commit_reconciliation_pending',
  // Board #4 (9th value): the accurate reason for a multi-invoice case
  // routed to needs_review — NOT the misleading 'unmatched_router_candidate'
  // (a multi-invoice case is N invoices, not unmatched). Layer-1 CHECK
  // exception_reason_chunk_9_active (migrations 20240182 ADD VALUE +
  // 20240183 CHECK broaden).
  'multi_invoice',
  // Board #4 Fork C handler #1 (10th value): a SEMANTIC duplicate — a
  // re-book of an already-booked invoice (same (vendor_id, bill_number)
  // as a live bill) that Stage-0 dedupByHash (byte-identity) misses. NOT
  // 'unmatched_router_candidate' (this IS matched, to an existing bill).
  // Layer-1 CHECK exception_reason_chunk_10_active (migrations 20240186
  // ADD VALUE + 20240187 CHECK broaden).
  'duplicate_invoice_suspected',
  // Board #4 Fork C handler #2 (11th value): a bank-detail / remittance
  // PRESENCE tripwire — a vendor invoice whose OCR carries payment-coordinate-
  // shaped content (account/routing/IBAN/SWIFT/wire/ACH/remit-to). Detect-and-
  // route ONLY (ADR-0007 §Tier 2 read boundary): grounds PRESENCE, not a proven
  // change (no vendor bank-detail baseline; does not read vendor-master control
  // fields; does not discharge the Tier-1 Q28 3(e) control). Layer-1 CHECK
  // exception_reason_chunk_11_active (migrations 20240188 + 20240189).
  'bank_detail_change_suspected',
  // Board #4 Fork C handler #3 (12th value): a statement-vs-invoice PRESENCE
  // tripwire — a document that classifies as vendor_invoice (Tier A matches
  // /\bstatement\b/ as an invoice header, vendorInvoiceRules.ts:38) but reads
  // as a STATEMENT (balance-forward summary of already-invoiced charges, not a
  // single bookable invoice). Presence-AND-weak-invoice-signal on the doc's OWN
  // OCR; Tier-2-clean (ADR-0007 §Tier 2 read boundary). Layer-1 CHECK
  // exception_reason_chunk_12_active (migrations 20240190 + 20240191).
  'statement_not_invoice_suspected',
]);
export type ExceptionReason = z.infer<typeof ExceptionReasonSchema>;

// enqueueException input: case + reason + trace context.
// org_id is parent-derived in the RPC; service does NOT pass org_id.
// source_document_id optional (some enqueue paths reference a
// specific source_document; manual_route from agent may not).
export const EnqueueExceptionInputSchema = z.object({
  document_case_id: z.string().uuid(),
  source_document_id: z.string().uuid().optional(),
  exception_reason: ExceptionReasonSchema,
  trace_id: z.string().uuid(),
  created_by: z.string().uuid().optional(),
});
export type EnqueueExceptionInputRaw =
  z.input<typeof EnqueueExceptionInputSchema>;
export type EnqueueExceptionInput =
  z.infer<typeof EnqueueExceptionInputSchema>;

// resolveException input: queue entry + resolution semantics.
// resolution_action drives the per-action terminal-state mapping
// in the resolve RPC (5 → proposed, 3 → rejected, 1 → classified).
export const ResolveExceptionInputSchema = z.object({
  exception_queue_entry_id: z.string().uuid(),
  resolution_action: ResolutionActionSchema,
  resolution_notes: z.string().optional(),
  resolved_by: z.string().uuid(),
});
export type ResolveExceptionInputRaw =
  z.input<typeof ResolveExceptionInputSchema>;
export type ResolveExceptionInput =
  z.infer<typeof ResolveExceptionInputSchema>;

// Row shape returned by readExceptionQueueEntry.
//
// TimestamptzString fifth consumer (chunks 2/3/4/5/6).
export const ExceptionQueueEntrySchema = z.object({
  exception_queue_entry_id: z.string().uuid(),
  org_id: z.string().uuid(),
  document_case_id: z.string().uuid(),
  source_document_id: z.string().uuid().nullable(),
  exception_reason: ExceptionReasonSchema,
  exception_status: ExceptionStatusSchema,
  resolution_action: ResolutionActionSchema.nullable(),
  resolution_notes: z.string().nullable(),
  resolved_at: TimestamptzString.nullable(),
  resolved_by: z.string().uuid().nullable(),
  trace_id: z.string().uuid(),
  created_at: TimestamptzString,
  created_by: z.string().uuid().nullable(),
});
export type ExceptionQueueEntry = z.infer<typeof ExceptionQueueEntrySchema>;
