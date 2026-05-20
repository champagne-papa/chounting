// aiFallback.ts — Tier C Claude Sonnet AI fallback per Phase 7 chunk
// 7.2 brief Task 7.2.7 + ADR-0014 §7 (Tier C strategy) + §8 (fallback
// contract) + Step 19 (input_hash content_hash inclusion) + Step 20
// Option (c) default disposition.
//
// Step 20 Option (c) — Stage 3 Tier C wall-clock budget disposition.
// Tier C defers to callClaude.ts internal retry classification
// (401/403 no-retry; 429 max-3 exponential 1+2+4s; 5xx max-2 exponential
// 1+2s; network max-2 linear 2+2s; malformed no-retry). NOT wrapped in
// withFailureClassification('classify_document_type', ...) at the
// orchestrator Stage 3 site nor at the tierCoordination internal site;
// ADR-0014 §12.1 3.5s budget interpretation per Phase A verification:
// the 3.5s emerges from withFailureClassification's retry chain
// (500ms+1s+2s); AI-SDK calls have their own retry/backoff per
// callClaude.ts contract and SHOULD NOT be nested inside an additional
// retry wrapper (compounded retries multiply wall-clock budget).
//
// Forward-pointer at Phase 7 retrospective grade: Option (b) AI-SDK-class
// exemption generalization candidate at N≥3 firings (chunk 7.2 Tier C +
// possibly chunk 7.3a Stage 5 match_vendor Tier C + chunk 7.3b Stage 7
// build_proposal if it invokes AI).
//
// AI output passes two gates before entering the proposal pipeline per
// ADR-0014 §8:
//   1. Zod validation (structural defense via
//      ClassificationOutputSchema discriminated union).
//   2. Confidence threshold (semantic defense via per-document-type
//      v1-provisional values from ADR-0014 §7).
//
// Failure paths emit audit events per ADR-0014 §8 + §12.3:
//   - ai_fallback_validation_failed (Zod-validation failure) emits via
//     recordMutation per ADR-0011 §1.
//   - extraction_failed with failure_reason='ai_fallback_validation_failed'
//     (same Zod-validation path; routes to exception queue).
//   - extraction_failed with failure_reason='confidence_below_threshold'
//     (confidence-below-threshold path).

import crypto from 'crypto';
import type Anthropic from '@anthropic-ai/sdk';
import { callClaude } from '../../callClaude';
import {
  ClassificationOutputSchema,
  type ClassificationOutput,
} from '@/shared/schemas/extraction';
import { vendorInvoicePrompt } from './prompts/vendor_invoice.prompt';
import { receiptPrompt } from './prompts/receipt.prompt';
import { paymentConfirmationPrompt } from './prompts/payment_confirmation.prompt';
import { extractOcrText } from './extractOcrText';
import {
  tryConsumeCall,
  AI_FALLBACK_MAX_CALLS_PER_DOCUMENT,
  __resetCountersForTests as __resetBudgetCountersForTests,
} from '../aiFallbackBudget';
import { recordMutation } from '@/services/audit/recordMutation';
import { adminClient } from '@/db/adminClient';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import type {
  ClassificationInput,
  DocumentType,
  PipelineStageRecord,
  TierCOutput,
} from '../types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

// Per-document-type confidence thresholds per ADR-0014 §7 Q65
// v1-provisional values. unknown is always exception so the threshold
// is effectively unbounded (1.0 sentinel).
const CONFIDENCE_THRESHOLDS: Record<DocumentType, number> = {
  vendor_invoice: 0.85,
  receipt: 0.8,
  payment_confirmation: 0.85,
  unknown: 1.0,
};

// Max fallback calls per source document per ADR-0014 §8 budget;
// per-document counter shared with Stage 4 extractor modules via
// aiFallbackBudget.ts (chunk 7.3a Iteration 2 Option α RATIFIED Phase B
// scope addition). MAX_FALLBACK_CALLS imported from shared module
// (was module-internal at chunk 7.2; refactored at chunk 7.3a).

// Anthropic model selection per Task 7.2.7 partial-information value
// pick: claude-sonnet-4-5 (current generation per project standard).
const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
const ANTHROPIC_MAX_TOKENS = 4096;

// Composite content hash: rotating discriminator that ADR-0019
// calibration governance controls. The hash combines all three
// per-document-type prompt contentHashes; any prompt edit propagates
// into pipeline_trace.input_hash, enabling reproducibility detection
// per ADR-0007 Q30.
const COMBINED_PROMPT_CONTENT_HASH = crypto
  .createHash('sha256')
  .update(vendorInvoicePrompt.contentHash)
  .update(receiptPrompt.contentHash)
  .update(paymentConfirmationPrompt.contentHash)
  .digest('hex');

export interface AiFallbackResult {
  output: TierCOutput;
  trace_record: PipelineStageRecord;
}

function assembleSystemPrompt(): string {
  return [
    'You are a deterministic document-classification assistant. You will be given OCR-extracted text from a document.',
    '',
    'Classify the document as one of three types: vendor_invoice, receipt, or payment_confirmation. If none of these fit confidently, do NOT return JSON — instead respond with a single token "UNKNOWN".',
    '',
    'For each type, the per-type extraction instructions follow:',
    '',
    '### vendor_invoice',
    vendorInvoicePrompt.content,
    '',
    '### receipt',
    receiptPrompt.content,
    '',
    '### payment_confirmation',
    paymentConfirmationPrompt.content,
    '',
    'Pick the schema that best matches the OCR text and return a single JSON object per that schema. Output JSON only — no preamble, no markdown fences.',
  ].join('\n');
}

async function emitAuditEvent(
  action: string,
  source_document_id: string,
  ctx: SystemActorServiceContext,
  details: Record<string, unknown>,
): Promise<void> {
  // Best-effort audit emission per Pattern B F-J-4 external-wrap
  // discipline: audit failure must not mask AI-fallback failure.
  try {
    await recordMutation(adminClient(), ctx, {
      org_id: ctx.org_id,
      action,
      entity_type: 'source_document',
      entity_id: source_document_id,
      before_state: {
        stage_name: 'classify_document_type',
        ...details,
      },
    });
  } catch (auditErr) {
    // eslint-disable-next-line no-console
    console.error(
      `[aiFallback] audit emit failed for action=${action}: ${
        auditErr instanceof Error ? auditErr.message : String(auditErr)
      }`,
    );
  }
}

export async function runAiFallback(
  input: ClassificationInput,
  ctx: SystemActorServiceContext,
): Promise<AiFallbackResult> {
  const log = loggerWith({
    trace_id: input.trace_id,
    user_id: ctx.caller.user_id ?? undefined,
  });

  const ocrText = extractOcrText(input.ocrArtifact);
  const inputHash = crypto
    .createHash('sha256')
    .update(ocrText)
    .update(COMBINED_PROMPT_CONTENT_HASH)
    .digest('hex');

  const baseTraceRecord = {
    stage_name: 'ai_fallback_classify',
    input_hash: inputHash,
    model: ANTHROPIC_MODEL,
    timestamp: new Date().toISOString(),
  };

  // Budget check per ADR-0014 §8: shared per-document counter (max 2
  // calls aggregate across Stages 3+4) via aiFallbackBudget.ts shared
  // module (chunk 7.3a Iteration 2 Option α RATIFIED). tryConsumeCall
  // atomically checks + increments; returns false if budget exhausted.
  if (!tryConsumeCall(input.source_document_id)) {
    await emitAuditEvent(
      'extraction_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'ai_fallback_budget_exhausted',
        budget: AI_FALLBACK_MAX_CALLS_PER_DOCUMENT,
      },
    );
    return {
      output: { valid: false, reason: 'budget_exhausted' },
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto
          .createHash('sha256')
          .update('budget_exhausted')
          .digest('hex'),
      },
    };
  }

  // Assemble Anthropic Messages API params per callClaude contract.
  const params: Anthropic.Messages.MessageCreateParams = {
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: assembleSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: `OCR text for the document:\n\n${ocrText}\n\nReturn the JSON object per the matching schema.`,
      },
    ],
  };

  // Invoke Claude via callClaude — internal retry classification
  // handles 401/403/429/5xx/network/malformed per callClaude.ts
  // contract. Tier C does NOT wrap this call in
  // withFailureClassification per Step 20 Option (c).
  let resp: Anthropic.Messages.Message;
  try {
    resp = await callClaude(params, log);
  } catch (err) {
    // callClaude already classified to typed ServiceError
    // (AGENT_UNAVAILABLE or AGENT_TOOL_VALIDATION_FAILED).
    log.warn(
      {
        err: err instanceof Error ? err.message : String(err),
      },
      'aiFallback: callClaude failed',
    );
    await emitAuditEvent(
      'pipeline_unavailable',
      input.source_document_id,
      ctx,
      {
        error_code: err instanceof ServiceError ? err.code : 'UNKNOWN',
        error_message: err instanceof Error ? err.message : String(err),
      },
    );
    return {
      output: { valid: false, reason: 'invocation_failed' },
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto
          .createHash('sha256')
          .update('invocation_failed')
          .digest('hex'),
      },
    };
  }

  // Extract text content from Anthropic Messages response.
  const textBlock = resp.content.find((block) => block.type === 'text');
  const rawText =
    textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';

  // "UNKNOWN" sentinel from the system prompt instructs Tier D fallthrough.
  if (rawText === 'UNKNOWN') {
    return {
      output: {
        valid: true,
        documentType: 'unknown',
        confidence: 0,
        rationale: 'AI fallback returned UNKNOWN sentinel — no matching schema',
        confidenceAboveThreshold: false,
      },
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto
          .createHash('sha256')
          .update('UNKNOWN')
          .digest('hex'),
      },
    };
  }

  // Parse JSON.
  let parsedJson: unknown;
  try {
    // Strip potential markdown fences (defensive; system prompt says no fences).
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    parsedJson = JSON.parse(cleaned);
  } catch (parseErr) {
    log.warn(
      {
        parse_err: parseErr instanceof Error ? parseErr.message : String(parseErr),
        raw_preview: rawText.slice(0, 200),
      },
      'aiFallback: JSON parse failed',
    );
    await emitAuditEvent(
      'ai_fallback_validation_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'json_parse_failed',
      },
    );
    await emitAuditEvent(
      'extraction_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'ai_fallback_validation_failed',
      },
    );
    return {
      output: { valid: false, reason: 'zod_validation_failed' },
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto
          .createHash('sha256')
          .update('zod_validation_failed')
          .digest('hex'),
      },
    };
  }

  // Zod-validate against discriminated union.
  const zodResult = ClassificationOutputSchema.safeParse(parsedJson);
  if (!zodResult.success) {
    log.warn(
      {
        zod_errors: zodResult.error.errors.slice(0, 5),
      },
      'aiFallback: Zod validation failed',
    );
    await emitAuditEvent(
      'ai_fallback_validation_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'zod_validation_failed',
        zod_error_count: zodResult.error.errors.length,
      },
    );
    await emitAuditEvent(
      'extraction_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'ai_fallback_validation_failed',
      },
    );
    return {
      output: { valid: false, reason: 'zod_validation_failed' },
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto
          .createHash('sha256')
          .update('zod_validation_failed')
          .digest('hex'),
      },
    };
  }

  const validated: ClassificationOutput = zodResult.data;
  const validatedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(validated))
    .digest('hex');

  const threshold = CONFIDENCE_THRESHOLDS[validated.document_type];
  const confidenceAboveThreshold = validated.confidence >= threshold;

  // Confidence-below-threshold gate per ADR-0014 §7 + §8.
  if (!confidenceAboveThreshold) {
    await emitAuditEvent(
      'extraction_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'confidence_below_threshold',
        document_type: validated.document_type,
        confidence: validated.confidence,
        threshold,
      },
    );
  }

  return {
    output: {
      valid: true,
      documentType: validated.document_type,
      confidence: validated.confidence,
      rationale: validated.rationale,
      confidenceAboveThreshold,
    },
    trace_record: {
      ...baseTraceRecord,
      output_hash: validatedHash,
    },
  };
}

// Test-only utility: reset the shared per-source-document call counter
// Map (chunk 7.3a Iteration 2 Option α: counter moved to shared module
// aiFallbackBudget.ts). Re-exported here for backwards-compatible test
// imports (chunk 7.2 aiFallback.test.ts + chunk 7.3a integration tests).
export function __resetCallCountersForTests(): void {
  __resetBudgetCountersForTests();
}
