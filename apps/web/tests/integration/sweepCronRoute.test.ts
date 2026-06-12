// tests/integration/sweepCronRoute.test.ts
//
// Fix ② — auth + invocation tests for GET /api/cron/sweep-stranded-cases
// (the scheduled stranded-case sweep). sweepStrandedCases is mocked, so
// these run with NO DB and NO OCR: they assert the CRON_SECRET Bearer gate
// (absent / wrong / unset) and that a passing request invokes the sweep in
// execute mode with the staleness window + B3 spend cap.
//
// Pattern: vi.mock the sweep module BEFORE the dynamic route import (parity
// with recordBillPaymentRoute.test.ts); invoke the handler directly (not
// over HTTP). The route reads process.env.CRON_SECRET at request time, so
// each test sets/clears it without re-importing.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/agent/orchestrator/maintenance/sweepStrandedCases', () => ({
  sweepStrandedCases: vi.fn(async () => ({
    run_trace_id: 'test-run-trace',
    dry_run: false,
    eligible_count: 0,
    counts: { B1: 0, B2: 0, 'B3-D': 0, B3: 0, B4: 0, anomaly: 0 },
    b3_reruns_executed: 0,
    cases: [],
  })),
}));

// Imports AFTER the mock so the handler binds the mocked sweep.
const { GET } = await import('@/app/api/cron/sweep-stranded-cases/route');
const { sweepStrandedCases } = await import(
  '@/agent/orchestrator/maintenance/sweepStrandedCases'
);

const SECRET = 'test-cron-secret';

function req(headers: Record<string, string> = {}): Request {
  return new Request('http://test/api/cron/sweep-stranded-cases', {
    method: 'GET',
    headers,
  });
}

describe('GET /api/cron/sweep-stranded-cases — CRON_SECRET auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = SECRET;
  });

  it('401 + does NOT invoke the sweep when the Authorization header is absent', async () => {
    const resp = await GET(req());
    expect(resp.status).toBe(401);
    expect(sweepStrandedCases).not.toHaveBeenCalled();
  });

  it('401 + does NOT invoke the sweep when the Bearer token is wrong', async () => {
    const resp = await GET(req({ authorization: 'Bearer wrong-secret' }));
    expect(resp.status).toBe(401);
    expect(sweepStrandedCases).not.toHaveBeenCalled();
  });

  it('401 + does NOT invoke the sweep when CRON_SECRET is unset (fails closed)', async () => {
    delete process.env.CRON_SECRET;
    const resp = await GET(req({ authorization: `Bearer ${SECRET}` }));
    expect(resp.status).toBe(401);
    expect(sweepStrandedCases).not.toHaveBeenCalled();
  });

  it('200 + invokes the sweep in execute mode with staleness + B3 cap on a valid Bearer', async () => {
    const resp = await GET(req({ authorization: `Bearer ${SECRET}` }));
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(sweepStrandedCases).toHaveBeenCalledTimes(1);
    expect(sweepStrandedCases).toHaveBeenCalledWith(
      expect.objectContaining({
        execute: true,
        staleness_minutes: 30,
        max_b3_reruns: 10,
      }),
    );
  });
});
