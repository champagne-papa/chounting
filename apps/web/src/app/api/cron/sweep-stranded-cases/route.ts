// src/app/api/cron/sweep-stranded-cases/route.ts
//
// Scheduled invocation of the stranded-case sweep — D2.3 carry-forward #1
// ("a scheduler is a caller, not a refactor"; design §5/§10). Wired as an
// hourly Vercel Cron (apps/web/vercel.json). The sweep is the
// INV-WORKFLOW-002 eventual-consistency backstop: it recovers document
// cases stranded in the automation segment by routing them through the
// live D2.1 decision machinery (it never asserts a disposition itself).
//
// Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when the
// CRON_SECRET env var is set on the project; any other caller is rejected
// 401. CRON_SECRET is OPERATOR-SET in Vercel Production (not in code, not
// in env.ts REQUIRED_SERVER) — when UNSET this route rejects EVERY request
// (fails closed: never an open, unauthenticated cron). Read at request
// time (not via the frozen env manifest) so the gate is unit-testable and
// can't be captured at module load.
//
// Execute mode with a per-run B3 cap so a backlog can't spike OCR/Claude
// spend, and the §7 SweepReport per-bucket counts + the actual B3 re-run
// count (the spend) are logged — no silent auto-spender.

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
// App-entry -> agent exemption: a sanctioned composition-root import, NOT a
// suppressed violation. sweepStrandedCases is FORCED into the agent layer — it
// imports ingestDocument (agent/orchestrator), which services/ may not import
// (ADR-0020 App. A; the module's own placement header), so no services/
// relocation exists. This cron route is the composition root that invokes it,
// the same category as the postmark-inbound route — whose ingestDocument import
// carries the IDENTICAL disable EVEN WITH its IngestInvoker (Class D T4)
// inversion: the inversion keeps the SERVICE free of agent imports, but the
// composition-root route still imports the concrete agent fn. An injection seam
// here would re-add this exact disable plus a no-op service — it buys nothing.
// The disable was simply omitted when this route shipped, leaving
// architecture/agent-first-import-boundaries (error) failing the build (the
// freeze that stranded #2 #3 + the cron at 68ee658f); restored.
// eslint-disable-next-line architecture/agent-first-import-boundaries
import { sweepStrandedCases } from '@/agent/orchestrator/maintenance/sweepStrandedCases';
import { loggerWith } from '@/shared/logger/pino';

// Only cases idle longer than this are eligible (design default; the live
// pipeline's wall-clock bound makes "stale" a safe coarse primary filter).
const STALENESS_MINUTES = 30;

// Per-run ceiling on B3 full re-runs (OCR + Claude per doc — the spend).
// At ~10-15s each (post the cold-start model-bake fix), 10 keeps a run well
// inside the function budget; a larger backlog drains 10/run across
// successive hourly fires rather than spiking spend in one invocation.
const MAX_B3_RERUNS_PER_RUN = 10;

export async function GET(req: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const trace_id = crypto.randomUUID();
  const log = loggerWith({ trace_id });

  try {
    const report = await sweepStrandedCases({
      execute: true,
      staleness_minutes: STALENESS_MINUTES,
      max_b3_reruns: MAX_B3_RERUNS_PER_RUN,
    });

    // §7 SweepReport visibility — scheduled spend must be observable (B3
    // re-runs ARE the OCR/Claude spend); never a silent auto-spender.
    log.info(
      {
        run_trace_id: report.run_trace_id,
        eligible_count: report.eligible_count,
        b3_reruns_executed: report.b3_reruns_executed,
        b3_cap: MAX_B3_RERUNS_PER_RUN,
        ...report.counts,
      },
      'cron/sweep-stranded-cases complete',
    );

    return NextResponse.json({
      ok: true,
      run_trace_id: report.run_trace_id,
      eligible_count: report.eligible_count,
      b3_reruns_executed: report.b3_reruns_executed,
      counts: report.counts,
    });
  } catch (err) {
    log.error(
      { message: err instanceof Error ? err.message : String(err) },
      'cron/sweep-stranded-cases failed',
    );
    return NextResponse.json(
      {
        error: 'sweep_failed',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    );
  }
}
