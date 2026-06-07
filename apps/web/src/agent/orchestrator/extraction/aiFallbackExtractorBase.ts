// aiFallbackExtractorBase.ts — Shared Tier C AI fallback logic for
// Stage 4 per-document-type extractor modules per Phase 7 chunk 7.3a
// brief Task 7.3a.2 + ADR-0014 §8 AI fallback contract.
//
// Stage 4 extractors share the same Tier C invocation pattern (Claude
// Sonnet via callClaude.ts; shared per-document budget via
// aiFallbackBudget.ts; Zod-validate output; emit trace_record with
// 'ai_fallback_extract' child sub-stage per ADR-0014 §1 + §8 amendment
// canonical). Per-document-type variation is the system prompt + Zod
// schema. This module factors the common path.
//
// Per Session 38 Step 20 Option (c) precedent: Stage 4 Tier C path
// does NOT wrap in withFailureClassification('extract_fields', ...) at
// orchestrator Stage 4 site. Tier A path wraps; Tier C defers to
// callClaude.ts internal retry classification (avoids compounded
// retries). Bank as (ζ) Session 38 (δ) carry-forward continuation N=2
// banking surface (chunk 7.2 Stage 3 + chunk 7.3a Stage 4).

import crypto from 'crypto';
import type { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { callClaude } from '../callClaude';
import { tryConsumeCall, AI_FALLBACK_MAX_CALLS_PER_DOCUMENT } from './aiFallbackBudget';
import { emitPipelineAuditEvent } from '@/services/document-platform/pipelineAuditService';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import type { PipelineStageRecord } from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
const ANTHROPIC_MAX_TOKENS = 4096;

export interface AiExtractInput {
  ocrText: string;
  systemPrompt: { content: string; contentHash: string };
  source_document_id: string;
  trace_id: string;
  documentType: 'vendor_invoice' | 'receipt' | 'payment_confirmation';
}

export type AiExtractResult<T> =
  | {
      valid: true;
      fields: T;
      trace_record: PipelineStageRecord;
    }
  | {
      valid: false;
      reason:
        | 'zod_validation_failed'
        | 'budget_exhausted'
        | 'invocation_failed'
        | 'parse_failed';
      trace_record: PipelineStageRecord;
    };

async function emitAuditEvent(
  action: string,
  source_document_id: string,
  ctx: SystemActorServiceContext,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await emitPipelineAuditEvent(ctx, {
      org_id: ctx.org_id,
      action,
      entity_type: 'source_document',
      entity_id: source_document_id,
      before_state: {
        stage_name: 'extract_fields',
        ...details,
      },
    });
  } catch (auditErr) {
    // eslint-disable-next-line no-console
    console.error(
      `[aiFallbackExtractorBase] audit emit failed for action=${action}: ${
        auditErr instanceof Error ? auditErr.message : String(auditErr)
      }`,
    );
  }
}

/**
 * Invoke Claude Sonnet for Stage 4 per-document-type extraction. Pattern
 * mirrors chunk 7.2 aiFallback.ts (classifier Tier C) but emits the
 * 'ai_fallback_extract' child sub-stage trace_record per ADR-0014 §8
 * amendment + extracts fields against per-document-type Zod schema.
 */
export async function runAiExtractFallback<T>(
  input: AiExtractInput,
  schema: z.ZodSchema<T>,
  ctx: SystemActorServiceContext,
): Promise<AiExtractResult<T>> {
  const log = loggerWith({
    trace_id: input.trace_id,
    user_id: ctx.caller.user_id ?? undefined,
  });

  const inputHash = crypto
    .createHash('sha256')
    .update(input.ocrText)
    .update(input.systemPrompt.contentHash)
    .digest('hex');

  const baseTraceRecord = {
    stage_name: 'ai_fallback_extract',
    input_hash: inputHash,
    model: ANTHROPIC_MODEL,
    timestamp: new Date().toISOString(),
  };

  // Shared per-document budget check per ADR-0014 §8 verbatim (max 2
  // calls across Stages 3+4 aggregate). tryConsumeCall atomically
  // checks + increments.
  if (!tryConsumeCall(input.source_document_id)) {
    await emitAuditEvent(
      'extraction_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'ai_fallback_budget_exhausted',
        budget: AI_FALLBACK_MAX_CALLS_PER_DOCUMENT,
        document_type: input.documentType,
      },
    );
    return {
      valid: false,
      reason: 'budget_exhausted',
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto.createHash('sha256').update('budget_exhausted').digest('hex'),
      },
    };
  }

  const params: Anthropic.Messages.MessageCreateParams = {
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: input.systemPrompt.content,
    messages: [
      {
        role: 'user',
        content: `OCR text for ${input.documentType} document:\n\n${input.ocrText}\n\nReturn the JSON object per the extraction schema. JSON only — no markdown fences.`,
      },
    ],
  };

  let resp: Anthropic.Messages.Message;
  try {
    resp = await callClaude(params, log);
  } catch (err) {
    log.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'aiFallbackExtractor: callClaude failed',
    );
    await emitAuditEvent(
      'pipeline_unavailable',
      input.source_document_id,
      ctx,
      {
        error_code: err instanceof ServiceError ? err.code : 'UNKNOWN',
        error_message: err instanceof Error ? err.message : String(err),
        document_type: input.documentType,
      },
    );
    return {
      valid: false,
      reason: 'invocation_failed',
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto.createHash('sha256').update('invocation_failed').digest('hex'),
      },
    };
  }

  const textBlock = resp.content.find((block) => block.type === 'text');
  const rawText = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';

  let parsedJson: unknown;
  try {
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
      'aiFallbackExtractor: JSON parse failed',
    );
    await emitAuditEvent(
      'ai_fallback_validation_failed',
      input.source_document_id,
      ctx,
      { failure_reason: 'json_parse_failed', document_type: input.documentType },
    );
    await emitAuditEvent(
      'extraction_failed',
      input.source_document_id,
      ctx,
      { failure_reason: 'ai_fallback_validation_failed', document_type: input.documentType },
    );
    return {
      valid: false,
      reason: 'parse_failed',
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto.createHash('sha256').update('parse_failed').digest('hex'),
      },
    };
  }

  const zodResult = schema.safeParse(parsedJson);
  if (!zodResult.success) {
    log.warn(
      { zod_errors: zodResult.error.errors.slice(0, 5), document_type: input.documentType },
      'aiFallbackExtractor: Zod validation failed',
    );
    await emitAuditEvent(
      'ai_fallback_validation_failed',
      input.source_document_id,
      ctx,
      {
        failure_reason: 'zod_validation_failed',
        zod_error_count: zodResult.error.errors.length,
        document_type: input.documentType,
      },
    );
    await emitAuditEvent(
      'extraction_failed',
      input.source_document_id,
      ctx,
      { failure_reason: 'ai_fallback_validation_failed', document_type: input.documentType },
    );
    return {
      valid: false,
      reason: 'zod_validation_failed',
      trace_record: {
        ...baseTraceRecord,
        output_hash: crypto.createHash('sha256').update('zod_validation_failed').digest('hex'),
      },
    };
  }

  const validatedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(zodResult.data))
    .digest('hex');

  return {
    valid: true,
    fields: zodResult.data,
    trace_record: {
      ...baseTraceRecord,
      output_hash: validatedHash,
    },
  };
}
