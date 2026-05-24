// tierCoordination.ts — Tier A → Tier C → Tier D fallback orchestration
// per Phase 7 chunk 7.2 brief Task 7.2.6 + Sub-Q7 (highest-confidence
// first) + Sub-Q8 (binary match-or-no-match short-circuit) locks +
// ADR-0014 §7 + §8.
//
// Per Step 14 Option (a) RATIFIED at founder review Iteration 2:
// ADR-0014 §1 canonical stage_name 'classify_document_type' is the
// parent for all three tier paths. Per-Tier child stage_names are
// NOT emitted at chunk 7.2:
//   - Tier A path: emits parent 'classify_document_type' only.
//   - Tier C path: emits parent 'classify_document_type' + child
//     sub-stage record 'ai_fallback_classify' per ADR-0014 §8
//     amendment-ratified canonical name.
//   - Tier D path: emits parent 'classify_document_type' only.
//
// Per Step 20 Option (c) default disposition: Tier A + Tier D paths
// wrap in withFailureClassification('classify_document_type', ...) per
// chunk 7.1a/7.1b Stages 0+1+2 precedent (audit-emission discipline
// uniformity); Tier C path's runAiFallback defers to callClaude.ts
// internal retry classification (NOT wrapped to avoid compounded
// retries).

import crypto from 'crypto';
import { evaluateVendorInvoice } from './vendorInvoiceRules';
import { evaluateReceipt } from './receiptRules';
import { evaluatePaymentConfirmation } from './paymentConfirmationRules';
import { runAiFallback } from './aiFallback';
import { withFailureClassification } from '../failureClassification';
import type {
  ClassificationInput,
  ClassificationResult,
  DocumentArtifactRow,
  PipelineStageRecord,
  TierAOutput,
} from '../types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

export interface TierCoordinationResult {
  result: ClassificationResult;
  trace_records: PipelineStageRecord[];
}

function hash(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function makeParentTraceRecord(
  input: ClassificationInput,
  output: ClassificationResult,
): PipelineStageRecord {
  return {
    stage_name: 'classify_document_type',
    input_hash: hash(JSON.stringify(input.ocrArtifact)),
    output_hash: hash(JSON.stringify(output)),
    model: null,
    timestamp: new Date().toISOString(),
  };
}

function pickHighestConfidenceMatch(matches: TierAOutput[]): TierAOutput {
  // Sub-Q7: highest-confidence-first across multi-matches. Each
  // matched output carries its intrinsic confidence; non-matches
  // are dropped.
  const matched = matches.filter(
    (m): m is Extract<TierAOutput, { matched: true }> => m.matched,
  );
  if (matched.length === 0) {
    return { matched: false };
  }

  // Phase 8 Task 4 — document-kind-defining-header precedence (Session 71).
  // When multiple Tier A rules match, a receipt or payment_confirmation
  // match outranks a vendor_invoice match: a kind-defining header ("Receipt"
  // title, "PAYMENTS MADE") beats an invoice cross-reference. Asymmetric
  // (vendor_invoice-only suppression) per Sub-option E's primary goal —
  // stop the vendor_invoice over-match; this is the robust place to
  // arbitrate because per-rule negatives mutually interfere on cross-refs.
  // Within the winning pool, keep highest-confidence-first (Sub-Q7).
  const nonInvoice = matched.filter((m) => m.documentType !== 'vendor_invoice');
  const pool = nonInvoice.length > 0 ? nonInvoice : matched;
  pool.sort((a, b) => b.confidence - a.confidence);
  return pool[0]!;
}

/**
 * Pure Tier A classification verdict: evaluate all three rule modules and
 * resolve multi-matches via document-kind-defining-header precedence.
 * Returns the matched type (or { matched: false } → caller falls to Tier C).
 * Extracted from coordinateTiers so the real-OCR corpus test (Phase 8
 * Task 5) can assert Tier A behavior without the DB/Claude coordination
 * surface.
 */
export function evaluateTierA(artifact: DocumentArtifactRow): TierAOutput {
  const matches: TierAOutput[] = [
    evaluateVendorInvoice(artifact),
    evaluateReceipt(artifact),
    evaluatePaymentConfirmation(artifact),
  ];
  return pickHighestConfidenceMatch(matches);
}

export async function coordinateTiers(
  input: ClassificationInput,
  ctx: SystemActorServiceContext,
): Promise<TierCoordinationResult> {
  // Tier A — pure local heuristic evaluation across all 3 modules.
  // Wrapped in withFailureClassification per Step 20 Option (c) +
  // chunk 7.1a/7.1b Stage 0+1+2 precedent (audit-emission uniformity).
  const tierAMatch = await withFailureClassification(
    'classify_document_type',
    input.source_document_id,
    ctx,
    async () => evaluateTierA(input.ocrArtifact),
  );

  if (tierAMatch.matched) {
    const result: ClassificationResult = {
      documentType: tierAMatch.documentType,
      confidence: tierAMatch.confidence,
      rationale: tierAMatch.rationale,
      tier: 'A',
    };
    return {
      result,
      trace_records: [makeParentTraceRecord(input, result)],
    };
  }

  // Tier C — runAiFallback handles its own retry via callClaude.ts.
  // NOT wrapped in withFailureClassification per Step 20 Option (c).
  const tierC = await runAiFallback(input, ctx);

  if (tierC.output.valid && tierC.output.confidenceAboveThreshold) {
    const result: ClassificationResult = {
      documentType: tierC.output.documentType,
      confidence: tierC.output.confidence,
      rationale: tierC.output.rationale,
      tier: 'C',
    };
    // Emit parent trace_record + child ai_fallback_classify sub-stage
    // record per ADR-0014 §1 canonical + §8 amendment.
    return {
      result,
      trace_records: [
        makeParentTraceRecord(input, result),
        tierC.trace_record,
      ],
    };
  }

  // Tier D — Tier C invalid OR below threshold OR budget exhausted.
  // Wrapped per Step 20 Option (c) + chunk 7.1a/7.1b precedent.
  const tierDRationale = !tierC.output.valid
    ? `Tier C invalid: ${tierC.output.reason}; routing to Tier D 'unknown'`
    : `Tier C confidence ${tierC.output.confidence} below threshold for ${tierC.output.documentType}; routing to Tier D 'unknown'`;

  const result = await withFailureClassification(
    'classify_document_type',
    input.source_document_id,
    ctx,
    async (): Promise<ClassificationResult> => ({
      documentType: 'unknown',
      confidence: 0,
      rationale: tierDRationale,
      tier: 'D',
    }),
  );

  // Tier C invocation produced a trace_record; preserve it alongside
  // the parent record for forensic reconstruction even though Tier C
  // didn't supply the winning classification.
  return {
    result,
    trace_records: [makeParentTraceRecord(input, result), tierC.trace_record],
  };
}
