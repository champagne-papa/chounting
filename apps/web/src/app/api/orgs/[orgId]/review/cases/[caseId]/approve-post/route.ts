// src/app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts
//
// POST /api/orgs/[orgId]/review/cases/[caseId]/approve-post
//
// Wave 6 D3 T6 — the human approve→post: the deliverable where ledger
// truth is finally written under the HUMAN reviewer's identity
// (ctx.caller.user_id → created_by; INV-5 realized). The sequence is a
// STATE-AWARE RESUME (decomposition T6, read-back catch: transition()
// THROWS, it never no-ops):
//
//   needs_review → transition(→proposed) → transition(→approved) → post → committed
//   proposed     →                          transition(→approved) → post → committed
//   approved     →                                                  post → committed
//   committed    → 200 already_complete (zero writes)
//   anything else → 409 NOT_IN_REVIEW_TRACK
//
// The post step is POST-FIRST with dup-catch (brief D-4.4: "the DB,
// not a read-side check, is the authority"): the JE write carries
// source_external_id = `${caseId}:bill` | `${caseId}:payment` (T6
// per-child uniform suffixing); a 23505 on idx_je_source_external
// surfaces as the typed DUPLICATE_SOURCE_EXTERNAL_ID (constraint-name-
// keyed, T2) → look up the existing JE by the exact key → proceed to
// the committed marking. Both crash classes recover without a second
// ledger write.
//
// Postable population (grounded at T6 onset): unmatched entry cards —
// post_bill (the demo-real path) and record_bill_payment (builder
// preserved; Tier-A-rebuild-reachable only with a cited bill).
// Attachment cards have nothing to post; born-paid BUNDLES are
// structurally unreachable under the Tier-A-only rebuild and route to
// manual entry (409) — deviation from the bundle ruling surfaced at
// the T6 read-back, not absorbed.
//
// IDOR posture: explicit org membership check; the case root is
// org-verified inside buildReviewPreview; mutations flow through
// transition() / resolveException-class in-service org checks (T3) and
// withInvariants Invariant 3+4 (org_id injected into the post input;
// actions 'bill.post' / 'payment.record').

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { withInvariants } from '@/services/middleware/withInvariants';
import { billService } from '@/services/spend/billService';
import { paymentService } from '@/services/spend/paymentService';
import {
  transition,
  advanceCaseAutomation,
} from '@/services/document-platform/documentCaseService';
// Agent-entry surface (the api/agent/message/route.ts:16 precedent):
// the approve→post route drives the orchestrator-layer rebuild +
// builders, the designated entry-point shape, exempted explicitly.
// eslint-disable-next-line architecture/agent-first-import-boundaries
import { buildReviewPreview } from '@/agent/orchestrator/extraction/reviewPreview';
// eslint-disable-next-line architecture/agent-first-import-boundaries
import {
  buildPostBillInput,
  buildRecordPaymentInput,
} from '@/agent/orchestrator/extraction/ingestDocument';

const ParamsSchema = z.object({
  orgId: z.string().uuid(),
  caseId: z.string().uuid(),
});

const REVIEW_TRACK = ['needs_review', 'proposed', 'approved'] as const;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; caseId: string }> },
) {
  try {
    const raw = await params;
    const { orgId, caseId } = ParamsSchema.parse(raw);
    const ctx = await buildServiceContext(req);

    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    // Org-verified root + rebuilt proposal + postability (advisory) +
    // the per-child posted-JE probe (response/recovery context only —
    // the post step itself is dup-catch-authoritative).
    const preview = await buildReviewPreview(
      { org_id: orgId, document_case_id: caseId, trace_id: ctx.trace_id },
      ctx,
    );
    const state = preview.document_case.state;

    if (state === 'committed') {
      return NextResponse.json(
        {
          status: 'already_complete',
          case_state: 'committed',
          journal_entries: preview.posted_journal_entries,
        },
        { status: 200 },
      );
    }
    if (!REVIEW_TRACK.includes(state as (typeof REVIEW_TRACK)[number])) {
      return NextResponse.json(
        {
          error: 'NOT_IN_REVIEW_TRACK',
          message: `case is at '${state}' — not approvable from the review track`,
        },
        { status: 409 },
      );
    }
    if (!preview.postable) {
      return NextResponse.json(
        {
          error: 'NOT_POSTABLE',
          reason: preview.not_postable_reason,
          message:
            'the rebuilt proposal cannot one-click post; use the resolve/reject routes',
        },
        { status: 409 },
      );
    }

    // ---- Forward transitions (state-aware resume; human boundary) ----
    if (state === 'needs_review') {
      await transition(caseId, { target_state: 'proposed' }, ctx);
    }
    if (state === 'needs_review' || state === 'proposed') {
      await transition(caseId, { target_state: 'approved' }, ctx);
    }

    // ---- THE LEDGER WRITE (post-first, dup-catch-authoritative) ----
    const card = (preview.proposal as { kind: string; card: unknown })
      .card as Record<string, unknown>;
    const proposedAction = card.proposed_action as string;
    const builderInput = {
      org_id: orgId,
      source_document_id: preview.source_document?.id ?? '',
      trace_id: ctx.trace_id,
    };

    let journalEntryId: string | null = null;
    let recovered = false;
    const db = adminClient();

    if (proposedAction === 'post_bill') {
      const childKey = `${caseId}:bill`;
      const billInput = await buildPostBillInput(card, builderInput);
      if (!billInput) {
        return NextResponse.json(
          {
            error: 'NOT_POSTABLE',
            reason: 'missing_required_fields',
            message: 'post input builder returned null at approve time',
          },
          { status: 409 },
        );
      }
      try {
        const result = await withInvariants(billService.post, {
          action: 'bill.post',
        })({ ...billInput, source_external_id: childKey }, ctx);
        journalEntryId = result.journal_entry_id;
      } catch (err) {
        if (
          err instanceof ServiceError &&
          err.code === 'DUPLICATE_SOURCE_EXTERNAL_ID'
        ) {
          // Already posted (the step-5/6 crash recovery): the DB said
          // so via the constraint-name-keyed 23505 — look up the
          // existing JE by the exact child key and complete the
          // marking. NO second ledger write.
          const { data: existing, error: lookupErr } = await db
            .from('journal_entries')
            .select('journal_entry_id')
            .eq('org_id', orgId)
            .eq('source_system', 'manual')
            .eq('source_external_id', childKey)
            .single();
          if (lookupErr || !existing) {
            throw new ServiceError(
              'POST_FAILED',
              `already-posted lookup failed for ${childKey}: ${lookupErr?.message ?? 'no row'}`,
            );
          }
          journalEntryId = existing.journal_entry_id as string;
          recovered = true;
        } else {
          throw err;
        }
      }
    } else if (proposedAction === 'record_bill_payment') {
      const childKey = `${caseId}:payment`;
      const paymentInput = await buildRecordPaymentInput(card, builderInput);
      if (!paymentInput) {
        return NextResponse.json(
          {
            error: 'NOT_POSTABLE',
            reason: 'missing_required_fields',
            message: 'payment input builder returned null at approve time',
          },
          { status: 409 },
        );
      }
      try {
        const result = await withInvariants(paymentService.record, {
          action: 'payment.record',
        })({ ...paymentInput, source_external_id: childKey }, ctx);
        journalEntryId = result.journal_entry_id;
      } catch (err) {
        if (
          err instanceof ServiceError &&
          err.code === 'DUPLICATE_SOURCE_EXTERNAL_ID'
        ) {
          const { data: existing, error: lookupErr } = await db
            .from('journal_entries')
            .select('journal_entry_id')
            .eq('org_id', orgId)
            .eq('source_system', 'manual')
            .eq('source_external_id', childKey)
            .single();
          if (lookupErr || !existing) {
            throw new ServiceError(
              'POST_FAILED',
              `already-posted lookup failed for ${childKey}: ${lookupErr?.message ?? 'no row'}`,
            );
          }
          journalEntryId = existing.journal_entry_id as string;
          recovered = true;
        } else {
          throw err;
        }
      }
    } else {
      // Bundles and any future kinds: postability() already gates them
      // to 409 above; this is the defensive backstop.
      return NextResponse.json(
        {
          error: 'NOT_POSTABLE',
          reason: 'unsupported_proposed_action',
          message: `proposed_action '${proposedAction}' is not postable at review`,
        },
        { status: 409 },
      );
    }

    // ---- The committed marking (T4 edge; human ctx — honest
    // attribution: the reviewer's approval caused the commit) ----
    await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'committed' },
      ctx,
    );

    return NextResponse.json(
      {
        status: recovered ? 'recovered' : 'posted',
        case_state: 'committed',
        journal_entry_id: journalEntryId,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'INVALID_PARAMS', issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }
}
