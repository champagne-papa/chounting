// src/app/api/agent/reject/route.ts
// Phase 1.2 Session 7 Commit 2 — POST /api/agent/reject per
// sub-brief §4 Commit 2 interaction shapes.
//
// Q33 partial-resolution arc 2026-04-30: rewritten to consume
// aiActionsService.{getByIdempotencyKey, markResolved} instead of
// importing adminClient directly. State-machine logic is unchanged;
// only the data-access path moved into the service layer.
//
// Five-branch state machine (mirrors confirm.route.ts):
//
//   1. ai_actions row not found for (org_id, idempotency_key)
//      → 404 NOT_FOUND
//   2. stored status matches requested outcome
//      → 200 idempotent replay (strict-idempotent,
//        reason-insensitive — first reason is preserved,
//        replay-with-different-reason does not mutate the row)
//   3. stored status is terminal-but-different (confirmed,
//      auto_posted, or the other of rejected/edited)
//      → 409 CONFLICT with { error, currentStatus, message }
//        response body so the client can render an informative
//        state
//   4. stored status = 'pending'
//      → write status + resolution_reason, return new state
//   5. stored status = 'stale'
//      → 422 AGENT_TOOL_VALIDATION_FAILED with a stale-proposal
//        message (same shape as confirm)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { aiActionsService } from '@/services/agent/aiActionsService';

const rejectRequestSchema = z
  .object({
    org_id: z.string().uuid(),
    idempotency_key: z.string().uuid(),
    outcome: z.enum(['rejected', 'edited']),
    // Absent or min-length string — empty string is rejected
    // loudly (client contract: trim and omit when empty).
    reason: z.string().min(1).optional(),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = rejectRequestSchema.parse(json);
    const ctx = await buildServiceContext(req);

    const row = await aiActionsService.getByIdempotencyKey(
      { org_id: body.org_id, idempotency_key: body.idempotency_key },
      ctx,
    );

    // Branch 1: not found.
    if (!row) {
      throw new ServiceError(
        'NOT_FOUND',
        `No ai_action found for (org_id, idempotency_key)`,
      );
    }

    // Branch 2: strict idempotent — stored status matches
    // requested outcome. Return the existing row's state
    // regardless of incoming `reason` text; the first reason
    // wins (confirms the pattern in confirm.route.ts Branch 2).
    if (row.status === body.outcome) {
      return NextResponse.json(
        {
          status: row.status,
          resolution_reason: row.resolution_reason,
          idempotent: true,
        },
        { status: 200 },
      );
    }

    // Branch 3: terminal-but-different. The proposal is already
    // in a terminal state that doesn't match the requested
    // outcome. Return 409 with currentStatus so the client can
    // render an informative state.
    const terminalStates = ['confirmed', 'auto_posted', 'rejected', 'edited'];
    if (terminalStates.includes(row.status)) {
      const humanStatus = row.status === 'confirmed' || row.status === 'auto_posted'
        ? 'confirmed'
        : row.status; // 'rejected' or 'edited'
      const humanVerb = body.outcome === 'rejected' ? 'rejected' : 'edited';
      return NextResponse.json(
        {
          error: 'CONFLICT',
          currentStatus: row.status,
          message: `This proposal was already ${humanStatus} and cannot be ${humanVerb}.`,
        },
        { status: 409 },
      );
    }

    // Branch 5: stale — same policy as confirm.
    if (row.status === 'stale') {
      throw new ServiceError(
        'AGENT_TOOL_VALIDATION_FAILED',
        'This proposal is stale and cannot be resolved.',
      );
    }

    // Branch 4: pending — perform the state transition.
    if (row.status === 'pending') {
      await aiActionsService.markResolved(
        {
          org_id: body.org_id,
          ai_action_id: row.ai_action_id,
          outcome: body.outcome,
          reason: body.reason,
        },
        ctx,
      );

      return NextResponse.json(
        {
          status: body.outcome,
          resolution_reason: body.reason ?? null,
          idempotent: false,
        },
        { status: 200 },
      );
    }

    // Fallthrough: any other status (reserved for future enum
    // additions). Fail loudly rather than silently treating as
    // any of the known branches.
    throw new ServiceError(
      'AGENT_TOOL_VALIDATION_FAILED',
      `Unexpected ai_actions status: ${row.status}`,
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
