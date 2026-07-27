// tests/unit/pipelineFailureClassification.test.ts
//
// Unit tests for withFailureClassification's error-identity contract.
//
// Regression cover for the design finding at
// docs/superpowers/specs/2026-07-26-classify-failure-design.md §2.4:
// the exhausted path threw a FRESH ServiceError('PIPELINE_TRANSIENT_EXHAUSTED'),
// discarding the original .code, so classifyFailure never saw the error it
// was meant to classify for any of the seven wrapped stages. The
// unavailable / permanent_malformed branches rethrew the original — the
// collapse hit ONLY the default-fallthrough path, i.e. precisely the errors
// the classification arc exists to catch.
//
// §2.4.2: the same path's audit payload carried {retry_attempts} alone — no
// error_code, no error_message — so both consumers of the error destroyed it.
// A permanently-failed wrapped-stage document left no artifact anywhere
// naming what broke.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceError } from '@/services/errors/ServiceError';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const emitPipelineAuditEvent = vi.fn();

vi.mock('@/services/document-platform/pipelineAuditService', () => ({
  emitPipelineAuditEvent: (...args: unknown[]) =>
    emitPipelineAuditEvent(...args),
}));

const { withFailureClassification } = await import(
  '@/agent/orchestrator/extraction/failureClassification'
);

const ctx: SystemActorServiceContext = {
  trace_id: '00000000-0000-4000-8000-000000000001',
  org_id: '00000000-0000-4000-8000-000000000002',
  caller: {
    user_id: null,
    system_actor: 'pipeline_orchestrator',
    system_user_id: '00000000-0000-4000-8000-000000000003',
  },
};

const SOURCE_DOC_ID = '00000000-0000-4000-8000-000000000004';

/** Audit payloads for one action, as emitted (before_state carries them). */
function payloadsFor(action: string): Record<string, unknown>[] {
  return emitPipelineAuditEvent.mock.calls
    .map((call) => call[1] as { action: string; before_state: Record<string, unknown> })
    .filter((arg) => arg.action === action)
    .map((arg) => arg.before_state);
}

beforeEach(() => {
  emitPipelineAuditEvent.mockReset();
  emitPipelineAuditEvent.mockResolvedValue(undefined);
});

describe('withFailureClassification — error identity on the exhausted path', () => {
  it('rethrows the ORIGINAL error rather than collapsing it to PIPELINE_TRANSIENT_EXHAUSTED', async () => {
    // AGENT_UNAVAILABLE is not in classifyError's recognised set, so it takes
    // the default-fallthrough (transient) branch — the collapsing one.
    const original = new ServiceError(
      'AGENT_UNAVAILABLE',
      'Anthropic API 401: invalid x-api-key',
    );

    await expect(
      withFailureClassification('run_ocr', SOURCE_DOC_ID, ctx, async () => {
        throw original;
      }),
    ).rejects.toMatchObject({ code: 'AGENT_UNAVAILABLE' });
  });

  it('preserves the original error instance, not merely a matching code', async () => {
    const original = new ServiceError('READ_FAILED', 'db read blew up');

    await expect(
      withFailureClassification('byte_fetch', SOURCE_DOC_ID, ctx, async () => {
        throw original;
      }),
    ).rejects.toBe(original);
  });

  it('rethrows non-ServiceError throwables unchanged', async () => {
    const original = new TypeError('cannot read properties of undefined');

    await expect(
      withFailureClassification('extract_fields', SOURCE_DOC_ID, ctx, async () => {
        throw original;
      }),
    ).rejects.toBe(original);
  });
});

describe('withFailureClassification — exhausted audit event carries the cause', () => {
  it('records error_code and error_message, matching the unavailable branch', async () => {
    await expect(
      withFailureClassification('run_ocr', SOURCE_DOC_ID, ctx, async () => {
        throw new ServiceError('AGENT_UNAVAILABLE', 'Anthropic API 401');
      }),
    ).rejects.toThrow();

    const payloads = payloadsFor('pipeline_transient_exhausted');
    expect(payloads).toHaveLength(1);
    // ServiceError's constructor prefixes `[code] ` (ServiceError.ts:151),
    // so extractErrorMessage returns the prefixed form.
    expect(payloads[0]).toMatchObject({
      stage_name: 'run_ocr',
      error_code: 'AGENT_UNAVAILABLE',
      error_message: '[AGENT_UNAVAILABLE] Anthropic API 401',
    });
  });
});

describe('withFailureClassification — single attempt, no stage-level retry', () => {
  it('invokes the stage function exactly once on failure', async () => {
    const stage = vi.fn().mockRejectedValue(
      new ServiceError('READ_FAILED', 'boom'),
    );

    await expect(
      withFailureClassification('match_vendor', SOURCE_DOC_ID, ctx, stage),
    ).rejects.toThrow();

    expect(stage).toHaveBeenCalledTimes(1);
  });

  it('emits no pipeline_transient_retry event', async () => {
    await expect(
      withFailureClassification('match_vendor', SOURCE_DOC_ID, ctx, async () => {
        throw new ServiceError('READ_FAILED', 'boom');
      }),
    ).rejects.toThrow();

    expect(payloadsFor('pipeline_transient_retry')).toHaveLength(0);
  });

  it('still returns the stage result on success without emitting audit events', async () => {
    const result = await withFailureClassification(
      'dedup_by_hash',
      SOURCE_DOC_ID,
      ctx,
      async () => ({ ok: true }),
    );

    expect(result).toEqual({ ok: true });
    expect(emitPipelineAuditEvent).not.toHaveBeenCalled();
  });
});

describe('withFailureClassification — recognised branches unchanged', () => {
  it('rethrows the original on the unavailable branch', async () => {
    const original = new ServiceError('PIPELINE_UNAVAILABLE', 'sidecar down');

    await expect(
      withFailureClassification('run_ocr', SOURCE_DOC_ID, ctx, async () => {
        throw original;
      }),
    ).rejects.toBe(original);

    expect(payloadsFor('pipeline_unavailable')).toHaveLength(1);
  });

  it('rethrows the original on the permanent_malformed branch', async () => {
    const original = new ServiceError('NOT_FOUND', 'document missing');

    await expect(
      withFailureClassification('byte_fetch', SOURCE_DOC_ID, ctx, async () => {
        throw original;
      }),
    ).rejects.toBe(original);

    expect(payloadsFor('extraction_failed')).toHaveLength(1);
  });
});
