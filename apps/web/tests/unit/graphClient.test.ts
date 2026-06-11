// tests/unit/graphClient.test.ts
//
// graphclient-cert-from-env Phase 1 — unit tests for readGraphConfig:
// the env read + base64-decode + PEM-shape validation + typed errors.
//
// Mocks @/shared/env so the config path is exercised without booting the
// real env (assertEnv) or constructing a real Graph credential. The live
// { certificate } credential construction + Graph auth are the operator
// discharge, NOT this test (UNIT-PROVEN != PROVEN): a green test means the
// var is a well-formed base64 PEM, not that the cert authenticates.

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/shared/env', () => ({
  env: {
    GRAPH_TENANT_ID: 'tenant-123',
    GRAPH_CLIENT_ID: 'client-456',
    GRAPH_CLIENT_CERT_PEM: undefined as string | undefined,
  },
}));

import { env } from '@/shared/env';
import { readGraphConfig } from '@/services/storage/providers/graph/graphClient';
import { ServiceError } from '@/services/errors/ServiceError';

const PEM =
  '-----BEGIN PRIVATE KEY-----\nMIIBfakekeymaterial\n-----END PRIVATE KEY-----\n';
const PEM_B64 = Buffer.from(PEM, 'utf8').toString('base64');

// The mocked env is a plain mutable object; mutate per test.
const mutableEnv = env as unknown as {
  GRAPH_TENANT_ID?: string;
  GRAPH_CLIENT_ID?: string;
  GRAPH_CLIENT_CERT_PEM?: string;
};

describe('readGraphConfig (graphclient cert-from-env)', () => {
  beforeEach(() => {
    mutableEnv.GRAPH_TENANT_ID = 'tenant-123';
    mutableEnv.GRAPH_CLIENT_ID = 'client-456';
    mutableEnv.GRAPH_CLIENT_CERT_PEM = undefined;
  });

  it('missing GRAPH_CLIENT_CERT_PEM → typed ServiceError naming it', () => {
    let err: unknown;
    try {
      readGraphConfig();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ServiceError);
    expect((err as ServiceError).message).toContain('GRAPH_CLIENT_CERT_PEM');
  });

  it('valid base64-encoded PEM → returns the decoded PEM + ids', () => {
    mutableEnv.GRAPH_CLIENT_CERT_PEM = PEM_B64;
    const cfg = readGraphConfig();
    expect(cfg.tenantId).toBe('tenant-123');
    expect(cfg.clientId).toBe('client-456');
    expect(cfg.certificatePem).toBe(PEM);
  });

  it('malformed (base64 of non-PEM text) → clear typed ServiceError', () => {
    mutableEnv.GRAPH_CLIENT_CERT_PEM = Buffer.from(
      'not a pem, just noise',
      'utf8',
    ).toString('base64');
    let err: unknown;
    try {
      readGraphConfig();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ServiceError);
    expect((err as ServiceError).message).toMatch(/PEM/);
  });
});
