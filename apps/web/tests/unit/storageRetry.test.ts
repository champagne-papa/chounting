// tests/unit/storageRetry.test.ts
// Unit tests for withRetry per ADR-0013 §8 retry parameters.
//
// Real timers used; full-exhaustion test runs ~2.5s wall-clock
// (testTimeout 15000ms gives margin). Statistical jitter testing +
// deterministic time-mocked retry orchestration deferred to chunk 6
// integration tests per Sub-Q F lock.

import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '@/services/storage/retry';
import { ServiceError } from '@/services/errors/ServiceError';

describe('withRetry', () => {
  it('returns operation result on first-try success', async () => {
    const op = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(op);
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it(
    'retries once after transient failure, returns on second-try success',
    async () => {
      const op = vi
        .fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValueOnce('ok');
      const result = await withRetry(op);
      expect(result).toBe('ok');
      expect(op).toHaveBeenCalledTimes(2);
    },
    10000,
  );

  it(
    'retries twice after two transient failures, returns on third-try success',
    async () => {
      const op = vi
        .fn()
        .mockRejectedValueOnce({ status: 503 })
        .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
        .mockResolvedValueOnce('ok');
      const result = await withRetry(op);
      expect(result).toBe('ok');
      expect(op).toHaveBeenCalledTimes(3);
    },
    10000,
  );

  it(
    'throws STORAGE_PROVIDER_TRANSIENT_EXHAUSTED after 3 transient failures',
    async () => {
      const op = vi.fn().mockRejectedValue({ status: 500 });
      await expect(withRetry(op)).rejects.toMatchObject({
        code: 'STORAGE_PROVIDER_TRANSIENT_EXHAUSTED',
      });
      expect(op).toHaveBeenCalledTimes(3);
    },
    10000,
  );

  it('throws STORAGE_KEY_MALFORMED immediately on permanent_malformed (4xx) without retrying', async () => {
    const op = vi.fn().mockRejectedValue({ status: 400 });
    await expect(withRetry(op)).rejects.toMatchObject({
      code: 'STORAGE_KEY_MALFORMED',
    });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('throws INTEGRITY_VERIFY_FAILED immediately when classifier passes through ServiceError', async () => {
    const op = vi
      .fn()
      .mockRejectedValue(
        new ServiceError('INTEGRITY_VERIFY_FAILED', 'hash mismatch'),
      );
    await expect(withRetry(op)).rejects.toMatchObject({
      code: 'INTEGRITY_VERIFY_FAILED',
    });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('throws STORAGE_OPERATION_FAILED catchall on provider_unavailable (401/403) without retrying', async () => {
    const op = vi.fn().mockRejectedValue({ status: 401 });
    await expect(withRetry(op)).rejects.toMatchObject({
      code: 'STORAGE_OPERATION_FAILED',
    });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('throws STORAGE_OPERATION_FAILED catchall on unclassified errors without retrying', async () => {
    const op = vi.fn().mockRejectedValue(new Error('unknown failure'));
    await expect(withRetry(op)).rejects.toMatchObject({
      code: 'STORAGE_OPERATION_FAILED',
    });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it(
    'total wall-clock bounded under 5 seconds for full transient exhaustion',
    async () => {
      // §8 budget: ~3.5s. Allow 5s upper bound to absorb jitter +
      // test overhead. Structural upper-bound assertion (not
      // statistical distribution).
      const op = vi.fn().mockRejectedValue({ status: 500 });
      const start = Date.now();
      await expect(withRetry(op)).rejects.toThrow();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000);
    },
    10000,
  );

  it('preserves originating error as details on transient exhaustion', async () => {
    const originalErr = { status: 503, message: 'service unavailable' };
    const op = vi.fn().mockRejectedValue(originalErr);
    try {
      await withRetry(op);
      throw new Error('expected withRetry to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect((err as ServiceError).code).toBe(
        'STORAGE_PROVIDER_TRANSIENT_EXHAUSTED',
      );
      expect((err as ServiceError).details).toBe(originalErr);
    }
  }, 10000);

  it('preserves originating error as details on unclassified failure', async () => {
    const originalErr = new Error('some unknown error');
    const op = vi.fn().mockRejectedValue(originalErr);
    try {
      await withRetry(op);
      throw new Error('expected withRetry to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect((err as ServiceError).code).toBe('STORAGE_OPERATION_FAILED');
      expect((err as ServiceError).details).toBe(originalErr);
    }
  });
});
