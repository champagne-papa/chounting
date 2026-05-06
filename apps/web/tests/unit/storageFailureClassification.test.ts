// tests/unit/storageFailureClassification.test.ts
// Unit tests for classifyStorageFailure per ADR-0013 §7 three-way
// matrix.

import { describe, it, expect } from 'vitest';
import { classifyStorageFailure } from '@/services/storage/failureClassification';
import { ServiceError } from '@/services/errors/ServiceError';

describe('classifyStorageFailure', () => {
  describe('transient category', () => {
    it('classifies HTTP 5xx as transient', () => {
      expect(classifyStorageFailure({ status: 500 })).toEqual({
        kind: 'transient',
      });
      expect(classifyStorageFailure({ status: 503 })).toEqual({
        kind: 'transient',
      });
      expect(classifyStorageFailure({ status: 599 })).toEqual({
        kind: 'transient',
      });
    });

    it('classifies HTTP 408 (request timeout) and 429 (rate-limited) as transient', () => {
      expect(classifyStorageFailure({ status: 408 })).toEqual({
        kind: 'transient',
      });
      expect(classifyStorageFailure({ status: 429 })).toEqual({
        kind: 'transient',
      });
    });

    it('classifies Node connection error codes as transient', () => {
      expect(classifyStorageFailure({ code: 'ETIMEDOUT' })).toEqual({
        kind: 'transient',
      });
      expect(classifyStorageFailure({ code: 'ECONNRESET' })).toEqual({
        kind: 'transient',
      });
      expect(classifyStorageFailure({ code: 'ECONNREFUSED' })).toEqual({
        kind: 'transient',
      });
      expect(classifyStorageFailure({ code: 'EAI_AGAIN' })).toEqual({
        kind: 'transient',
      });
    });

    it('classifies AbortError (likely network timeout) as transient', () => {
      expect(classifyStorageFailure({ name: 'AbortError' })).toEqual({
        kind: 'transient',
      });
    });
  });

  describe('permanent_malformed category', () => {
    it('classifies HTTP 4xx (other than auth/timeout/rate) as permanent_malformed STORAGE_KEY_MALFORMED', () => {
      expect(classifyStorageFailure({ status: 400 })).toEqual({
        kind: 'permanent_malformed',
        code: 'STORAGE_KEY_MALFORMED',
      });
      expect(classifyStorageFailure({ status: 404 })).toEqual({
        kind: 'permanent_malformed',
        code: 'STORAGE_KEY_MALFORMED',
      });
      expect(classifyStorageFailure({ status: 422 })).toEqual({
        kind: 'permanent_malformed',
        code: 'STORAGE_KEY_MALFORMED',
      });
    });

    it('passes through ServiceError(INTEGRITY_VERIFY_FAILED)', () => {
      const err = new ServiceError('INTEGRITY_VERIFY_FAILED', 'hash mismatch');
      expect(classifyStorageFailure(err)).toEqual({
        kind: 'permanent_malformed',
        code: 'INTEGRITY_VERIFY_FAILED',
      });
    });

    it('passes through ServiceError(STORAGE_KEY_MALFORMED)', () => {
      const err = new ServiceError('STORAGE_KEY_MALFORMED', 'bad path');
      expect(classifyStorageFailure(err)).toEqual({
        kind: 'permanent_malformed',
        code: 'STORAGE_KEY_MALFORMED',
      });
    });
  });

  describe('provider_unavailable category', () => {
    it('classifies HTTP 401/403 as provider_unavailable', () => {
      expect(classifyStorageFailure({ status: 401 })).toEqual({
        kind: 'provider_unavailable',
      });
      expect(classifyStorageFailure({ status: 403 })).toEqual({
        kind: 'provider_unavailable',
      });
    });
  });

  describe('unclassifiable (returns null)', () => {
    it('returns null for plain Error with no recognizable shape', () => {
      expect(classifyStorageFailure(new Error('some random error'))).toBeNull();
    });

    it('returns null for object with no recognized fields', () => {
      expect(classifyStorageFailure({ foo: 'bar' })).toBeNull();
    });

    it('returns null for primitive values', () => {
      expect(classifyStorageFailure('string error')).toBeNull();
      expect(classifyStorageFailure(null)).toBeNull();
      expect(classifyStorageFailure(undefined)).toBeNull();
      expect(classifyStorageFailure(42)).toBeNull();
    });

    it('returns null for ServiceError with non-storage codes', () => {
      const err = new ServiceError('PERMISSION_DENIED', 'no access');
      expect(classifyStorageFailure(err)).toBeNull();
    });

    it('returns null for already-exhausted ServiceError (do not re-retry)', () => {
      const err = new ServiceError(
        'STORAGE_PROVIDER_TRANSIENT_EXHAUSTED',
        'no more retries',
      );
      expect(classifyStorageFailure(err)).toBeNull();
    });

    it('returns null for unknown Node error code', () => {
      expect(classifyStorageFailure({ code: 'EUNKNOWN' })).toBeNull();
    });

    it('returns null for HTTP 3xx (redirect; not an error category)', () => {
      expect(classifyStorageFailure({ status: 301 })).toBeNull();
    });
  });
});
