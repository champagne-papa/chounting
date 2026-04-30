// src/app/api/agent/message/route.ts
// Phase 1.2 Session 4 — POST /api/agent/message per master §13.2
// and sub-brief §6.6. Routes the user's chat message into the
// orchestrator and returns the AgentResponse.
//
// No withInvariants wrap at the route layer: the orchestrator
// authorizes via its persona whitelist + the service functions'
// own withInvariants wrapping (inside executeTool). The route's
// job is body validation, context construction, and error
// translation.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleUserMessage } from '@/agent/orchestrator';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { canvasContextSchema } from '@/shared/schemas/canvas/canvasContext.schema';
import type { CanvasContext } from '@/shared/types/canvasContext';
import { onboardingStateSchema } from '@/agent/onboarding/state';

const agentMessageRequestSchema = z
  .object({
    org_id: z.string().uuid().nullable(),
    message: z.string().min(1),
    locale: z.enum(['en', 'fr-CA', 'zh-Hant']).optional(),
    session_id: z.string().uuid().optional(),
    canvas_context: canvasContextSchema.optional(),
    // OI-2 fix-stack item 1: browser-supplied IANA timezone. The
    // browser captures via Intl.DateTimeFormat().resolvedOptions()
    // .timeZone and sends on every turn. Optional at the wire (any
    // non-browser caller may omit it); the route coerces to 'UTC'
    // before handing to the orchestrator. ServiceContext does not
    // (yet) carry a tz field — see Phase 2 follow-up item 6 for
    // the org-level timezone migration.
    tz: z.string().optional(),
    // Session 5 / sub-brief §6.6: the welcome page passes the
    // computed initial OnboardingState on the first turn of a
    // fresh onboarding session. The orchestrator merges it into
    // session.state only when session.state is empty. Subsequent
    // turns rely on the persisted state.
    initial_onboarding: onboardingStateSchema.optional(),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = agentMessageRequestSchema.parse(json);

    const ctx = await buildServiceContext(req);

    const response = await handleUserMessage(
      {
        user_id: ctx.caller.user_id,
        org_id: parsed.org_id,
        locale: parsed.locale ?? ctx.locale ?? 'en',
        message: parsed.message,
        session_id: parsed.session_id,
        // canvasDirectiveSchema.card is z.unknown() until Session
        // 7 tightens it to ProposedEntryCardSchema (circular-import
        // risk). Cast at the boundary; the TS type has card as
        // ProposedEntryCard. Orchestrator consumers treat it as
        // pass-through reference material only.
        canvas_context: parsed.canvas_context as CanvasContext | undefined,
        // OI-2 fix-stack item 1: 'UTC' fallback for non-browser
        // callers (server-to-server tests, future programmatic
        // clients). Browser callers always populate parsed.tz from
        // Intl.DateTimeFormat().resolvedOptions().timeZone.
        tz: parsed.tz ?? 'UTC',
        initial_onboarding: parsed.initial_onboarding,
      },
      ctx,
    );

    return NextResponse.json(response, { status: 200 });
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
