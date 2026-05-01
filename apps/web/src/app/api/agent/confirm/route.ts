// src/app/api/agent/confirm/route.ts
// Phase 1.2 Session 4 — POST /api/agent/confirm per master §13.3
// and sub-brief §6.7 / Pre-decision 3.
//
// Q33 partial-resolution arc 2026-04-30: rewritten to consume
// aiActionsService.{getByIdempotencyKey, markConfirmed} and
// journalEntryService.getEntryNumber instead of importing
// adminClient directly. Five-branch state machine is unchanged;
// only the data-access path moved into the service layer.
//
// Five-branch state machine:
//
//   1. ai_actions row not found for (org_id, idempotency_key)
//      → 404 NOT_FOUND
//   2. status = 'confirmed' → 200 with existing journal_entry_id
//      (idempotent return)
//   3. status = 'stale' → 422 AGENT_TOOL_VALIDATION_FAILED with
//      reason "This proposal is stale and cannot be confirmed."
//   4. status = 'pending' → read tool_input, parse through
//      PostJournalEntryInputSchema with dry_run: false, call
//      journalEntryService.post via withInvariants, update
//      ai_actions to 'confirmed', return posted entry
//   5. Any other status (reserved / future) → 422 with
//      "Unexpected ai_actions status: {value}"

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { aiActionsService } from '@/services/agent/aiActionsService';
import {
  PostJournalEntryInputSchema,
  ReversalInputSchema,
} from '@/shared/schemas/accounting/journalEntry.schema';

const confirmRequestSchema = z
  .object({
    org_id: z.string().uuid(),
    idempotency_key: z.string().uuid(),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = confirmRequestSchema.parse(json);
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

    // Branch 2: already confirmed — return the existing
    // journal_entry_id plus a secondary lookup on
    // journal_entries.entry_number so the client's
    // `agent.entry.posted` template renders with the number
    // even on retry-after-response-network-failure (the
    // duplicate-exchange window named in Session 7 sub-brief
    // Pre-decision 6). If the enrichment fails for any reason
    // (transient DB error, ultra-rare row-deleted-post-confirm
    // race), log and fall through with entry_number omitted —
    // the client's render degrades to "Entry posted" without
    // the number rather than hiding the success signal.
    if (row.status === 'confirmed') {
      let entryNumber: number | undefined;
      if (row.journal_entry_id) {
        try {
          const fetched = await journalEntryService.getEntryNumber(
            { org_id: body.org_id, journal_entry_id: row.journal_entry_id },
            ctx,
          );
          if (fetched !== null) entryNumber = fetched;
        } catch (jeErr) {
          // Intentional: don't throw — preserve the
          // user-visible success signal.
          console.warn(
            `[confirm.branch2] entry_number enrichment failed: ${
              jeErr instanceof Error ? jeErr.message : String(jeErr)
            }`,
          );
        }
      }
      return NextResponse.json(
        {
          journal_entry_id: row.journal_entry_id,
          ...(entryNumber !== undefined && { entry_number: entryNumber }),
          status: 'confirmed',
          idempotent: true,
        },
        { status: 200 },
      );
    }

    // Branch 3: stale — the dry-run row was invalidated (e.g.,
    // the agent proposed conflicting changes, or the underlying
    // data shifted). Rejecting rather than silently posting.
    if (row.status === 'stale') {
      throw new ServiceError(
        'AGENT_TOOL_VALIDATION_FAILED',
        'This proposal is stale and cannot be confirmed.',
      );
    }

    // Branch 4: pending — replay the stored tool_input with
    // dry_run: false.
    if (row.status === 'pending') {
      const toolInput = row.tool_input ?? {};
      const isReversal =
        'reverses_journal_entry_id' in toolInput &&
        toolInput.reverses_journal_entry_id !== undefined &&
        toolInput.reverses_journal_entry_id !== null;

      // Parse through the appropriate schema. Set dry_run: false
      // to drive the actual ledger write. source stays 'agent' so
      // the idempotency path through the service layer is honored.
      const replayPayload = { ...toolInput, dry_run: false, source: 'agent' };
      const parsed = isReversal
        ? ReversalInputSchema.parse(replayPayload)
        : PostJournalEntryInputSchema.parse(replayPayload);

      // Cross-check org_id in case the stored tool_input drifted
      // from the request's org_id (should never happen given the
      // UNIQUE constraint, but catches data corruption).
      if (parsed.org_id !== body.org_id) {
        throw new ServiceError(
          'AGENT_TOOL_VALIDATION_FAILED',
          'ai_actions.tool_input.org_id does not match request org_id',
        );
      }

      const posted = await withInvariants(journalEntryService.post, {
        action: 'journal_entry.post',
      })(parsed, ctx);

      // Mark the ai_actions row consumed — subsequent calls return
      // the Branch 2 result.
      await aiActionsService.markConfirmed(
        {
          org_id: body.org_id,
          ai_action_id: row.ai_action_id,
          journal_entry_id: posted.journal_entry_id,
          confirming_user_id: ctx.caller.user_id,
        },
        ctx,
      );

      return NextResponse.json(
        {
          journal_entry_id: posted.journal_entry_id,
          entry_number: posted.entry_number,
          status: 'confirmed',
          idempotent: false,
        },
        { status: 200 },
      );
    }

    // Branch 5: unexpected status — reserved values (future
    // phases may add 'rejected', 'cancelled', etc.). Fail loudly
    // rather than silently treating as any of the known branches.
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
