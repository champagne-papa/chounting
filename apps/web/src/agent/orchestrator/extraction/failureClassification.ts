// src/agent/orchestrator/extraction/failureClassification.ts
//
// Failure classification + retry wrapper per ADR-0014 §12 for Tier 2
// pipeline stages. Three categories:
//
//   - transient_retryable: max 3 attempts; 500ms base; exponential
//     factor 2x; ±20% jitter; ~3.5s budget per-stage. After max
//     attempts → PIPELINE_TRANSIENT_EXHAUSTED.
//   - unavailable: no retry; immediate route to exception queue with
//     pipeline_unavailable audit event.
//   - permanent_malformed: no retry; immediate route to exception
//     queue with extraction_failed audit event.
//
// Audit event emission via pipelineAuditService.emitPipelineAuditEvent
// (canonical recordMutation transport, hoisted Arc 2 T2) per ADR-0011 §1.
// Naming per ADR-0014 §12.4: underscored (pipeline_transient_retry,
// pipeline_transient_exhausted, pipeline_unavailable, extraction_failed).

import { ServiceError } from '@/services/errors/ServiceError';
import { emitPipelineAuditEvent } from '@/services/document-platform/pipelineAuditService';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import type { PipelineFailureClass } from './types';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;
const BACKOFF_FACTOR = 2;
const JITTER_RANGE = 0.2;

/**
 * Wraps a stage function with retry-on-transient-error semantics.
 * Non-transient errors propagate immediately; transient errors are
 * retried up to MAX_ATTEMPTS with exponential backoff + jitter.
 */
export async function withFailureClassification<T>(
  stage_name: string,
  source_document_id: string,
  ctx: SystemActorServiceContext,
  fn: () => Promise<T>,
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const failureClass = classifyError(err);

      if (failureClass === 'unavailable') {
        await emitAuditEvent(
          'pipeline_unavailable',
          source_document_id,
          stage_name,
          ctx,
          {
            error_code: extractErrorCode(err),
            error_message: extractErrorMessage(err),
          },
        );
        throw err;
      }

      if (failureClass === 'permanent_malformed') {
        await emitAuditEvent(
          'extraction_failed',
          source_document_id,
          stage_name,
          ctx,
          {
            failure_reason: extractFailureReason(err),
          },
        );
        throw err;
      }

      // transient: retry if attempts remain
      if (attempt < MAX_ATTEMPTS) {
        await emitAuditEvent(
          'pipeline_transient_retry',
          source_document_id,
          stage_name,
          ctx,
          {
            retry_attempt: attempt,
          },
        );
        const delay = computeBackoff(attempt);
        await sleep(delay);
        continue;
      }

      // exhausted
      await emitAuditEvent(
        'pipeline_transient_exhausted',
        source_document_id,
        stage_name,
        ctx,
        {
          retry_attempts: MAX_ATTEMPTS,
        },
      );
      throw new ServiceError(
        'PIPELINE_TRANSIENT_EXHAUSTED',
        `[${stage_name}] transient retry budget exhausted: ${extractErrorMessage(err)}`,
      );
    }
  }

  // Unreachable; throw guard for TS exhaustiveness.
  throw lastError;
}

function classifyError(err: unknown): PipelineFailureClass {
  if (err instanceof ServiceError) {
    if (err.code === 'PIPELINE_UNAVAILABLE') return 'unavailable';
    if (err.code === 'PIPELINE_TRANSIENT_EXHAUSTED') return 'transient_exhausted';
    if (err.code === 'NOT_FOUND') return 'permanent_malformed';
  }
  // Default: assume transient (network / brief service unavailability).
  return 'transient_exhausted';
}

function extractErrorCode(err: unknown): string {
  if (err instanceof ServiceError) return err.code;
  return 'UNKNOWN';
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function extractFailureReason(err: unknown): string {
  if (err instanceof ServiceError) {
    if (err.code === 'NOT_FOUND') return 'document_corrupted';
  }
  return 'document_corrupted';
}

function computeBackoff(attempt: number): number {
  const base = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt - 1);
  const jitter = base * JITTER_RANGE * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function emitAuditEvent(
  action: string,
  source_document_id: string,
  stage_name: string,
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
        stage_name,
        ...details,
      },
    });
  } catch (auditErr) {
    // Audit failure must not mask pipeline failure; log and continue.
    // Per Pattern B external-wrap P3-i F-J-4 best-effort isolation:
    // the audit is best-effort; the pipeline-error throw still
    // propagates to the caller.
    // eslint-disable-next-line no-console
    console.error(
      `[failureClassification] audit emit failed for action=${action}: ${
        auditErr instanceof Error ? auditErr.message : String(auditErr)
      }`,
    );
  }
}
