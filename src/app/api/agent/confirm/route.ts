// src/app/api/agent/confirm/route.ts
// Phase 1.2 Session 4 — POST /api/agent/confirm per master §13.3
// and sub-brief §6.7 / Pre-decision 3. Full five-branch state
// machine:
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
import { adminClient } from '@/db/adminClient';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
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
    const db = adminClient();

    // Look up the ai_actions row via the (org_id, idempotency_key)
    // UNIQUE constraint.
    const { data: row, error: readErr } = await db
      .from('ai_actions')
      .select('*')
      .eq('org_id', body.org_id)
      .eq('idempotency_key', body.idempotency_key)
      .maybeSingle();

    if (readErr) {
      throw new ServiceError(
        'READ_FAILED',
        `ai_actions lookup failed: ${readErr.message}`,
      );
    }

    // Branch 1: not found.
    if (!row) {
      throw new ServiceError(
        'NOT_FOUND',
        `No ai_action found for (org_id, idempotency_key)`,
      );
    }

    // Branch 2: already confirmed — return the existing
    // journal_entry_id (idempotent replay).
    if (row.status === 'confirmed') {
      return NextResponse.json(
        {
          journal_entry_id: row.journal_entry_id,
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
      const toolInput = row.tool_input as Record<string, unknown>;
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

      // Update the ai_actions row — marks this idempotency key as
      // consumed so subsequent calls return the Branch 2 result.
      const { error: updateErr } = await db
        .from('ai_actions')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirming_user_id: ctx.caller.user_id,
          journal_entry_id: posted.journal_entry_id,
        })
        .eq('ai_action_id', row.ai_action_id);

      if (updateErr) {
        // The journal entry has already been posted; failing the
        // ai_actions update leaves an inconsistency — the next
        // confirm call will hit Branch 1 (not found by
        // idempotency_key filter on pending status). Log loudly.
        throw new ServiceError(
          'POST_FAILED',
          `ai_actions update failed after post: ${updateErr.message}`,
        );
      }

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
