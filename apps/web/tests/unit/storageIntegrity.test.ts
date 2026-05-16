// tests/unit/storageIntegrity.test.ts
// Unit tests for computeHash + verifyHash per ADR-0013 §9.
//
// Implementation uses Node crypto.createHash (sync API) per chunk 3
// drafting-time Path α decision; tests use sync patterns
// (toThrow / direct return-value comparison) rather than async
// resolves/rejects.
//
// SHA-256 test vectors per NIST FIPS PUB 180-4 + canonical short
// test vectors used in industry-standard test suites.

import { describe, it, expect } from 'vitest';
import { computeHash, verifyHash } from '@/services/storage/integrity';
import { ServiceError } from '@/services/errors/ServiceError';

// Known SHA-256 hashes (lowercase hex, 64 chars).
const SHA256_EMPTY =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const SHA256_ABC =
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('computeHash', () => {
  it('returns SHA-256 of empty bytes (NIST test vector)', () => {
    const bytes = new Uint8Array(0);
    expect(computeHash(bytes)).toBe(SHA256_EMPTY);
  });

  it('returns SHA-256 of "abc" (NIST test vector)', () => {
    const bytes = new TextEncoder().encode('abc');
    expect(computeHash(bytes)).toBe(SHA256_ABC);
  });

  it('returns lowercase hex, 64 chars', () => {
    const bytes = new TextEncoder().encode('test');
    const hash = computeHash(bytes);
    expect(hash).toBe(hash.toLowerCase());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces stable hashes across calls (deterministic)', () => {
    const bytes = new TextEncoder().encode('the quick brown fox');
    expect(computeHash(bytes)).toBe(computeHash(bytes));
  });
});

describe('verifyHash', () => {
  it('returns clean (no throw) when hash matches', () => {
    const bytes = new TextEncoder().encode('abc');
    expect(() => verifyHash(bytes, SHA256_ABC)).not.toThrow();
  });

  it('throws INTEGRITY_VERIFY_FAILED ServiceError when hash does not match', () => {
    const bytes = new TextEncoder().encode('abc');
    const wrongHash =
      '0000000000000000000000000000000000000000000000000000000000000000';
    expect(() => verifyHash(bytes, wrongHash)).toThrow(ServiceError);
    try {
      verifyHash(bytes, wrongHash);
      throw new Error('expected verifyHash to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect((err as ServiceError).code).toBe('INTEGRITY_VERIFY_FAILED');
    }
  });

  it('compares case-insensitively (uppercase expected hash matches lowercase actual)', () => {
    const bytes = new TextEncoder().encode('abc');
    const uppercaseHash = SHA256_ABC.toUpperCase();
    expect(() => verifyHash(bytes, uppercaseHash)).not.toThrow();
  });

  it('preserves expected and actual hashes in ServiceError.details on mismatch', () => {
    const bytes = new TextEncoder().encode('abc');
    const wrongHash =
      '1111111111111111111111111111111111111111111111111111111111111111';
    try {
      verifyHash(bytes, wrongHash);
      throw new Error('expected verifyHash to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      const sErr = err as ServiceError;
      expect(sErr.details).toEqual({
        expected: wrongHash,
        actual: SHA256_ABC,
      });
    }
  });
});
