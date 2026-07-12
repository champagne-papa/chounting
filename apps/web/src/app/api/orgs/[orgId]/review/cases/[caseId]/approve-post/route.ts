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
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { withInvariants } from '@/services/middleware/withInvariants';
import { billService } from '@/services/spend/billService';
import { paymentService } from '@/services/spend/paymentService';
import {
  transition,
  advanceCaseAutomation,
} from '@/services/document-platform/documentCaseService';
import { evidenceObjectService } from '@/services/evidence/evidenceObjectService';
import { postExtractedInvoice } from '@/services/document-platform/extractedInvoiceWriteService';
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

    // Board #4 T3 (3b) — multi-invoice case: post the N α through the loop
    // (per-invoice-independent; aggregate committed). The single-invoice path
    // below is untouched (preview.invoices is null for it).
    if (preview.invoices) {
      return await postMultiInvoiceCase(preview, orgId, caseId, ctx);
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
    // Evidence-subject captures (D5): the posted entity ids from the
    // happy-path post results; null on the recovery branches (resolved
    // by lookup at the persist seam below).
    let billIdFromPost: string | null = null;
    let paymentIdFromRecord: string | null = null;

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
        billIdFromPost = result.bill_id;
      } catch (err) {
        if (
          err instanceof ServiceError &&
          err.code === 'DUPLICATE_SOURCE_EXTERNAL_ID'
        ) {
          // Already posted (the step-5/6 crash recovery): the DB said
          // so via the constraint-name-keyed 23505 — look up the
          // existing JE by the exact child key and complete the
          // marking. NO second ledger write.
          journalEntryId = await journalEntryService.lookupBySourceExternalId(
            { org_id: orgId, source_external_id: childKey },
            ctx,
          );
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
        paymentIdFromRecord = result.payment_id;
      } catch (err) {
        if (
          err instanceof ServiceError &&
          err.code === 'DUPLICATE_SOURCE_EXTERNAL_ID'
        ) {
          journalEntryId = await journalEntryService.lookupBySourceExternalId(
            { org_id: orgId, source_external_id: childKey },
            ctx,
          );
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

    // ---- Evidence-object persistence (Wave 6 D5; ADR-0033 D-0033.7) ----
    // INV-EVIDENCE-001 (Layer 2): PERSIST-BEFORE-MARKING — every AP posting
    // committed through this path produces its canonical evidence_objects
    // row BEFORE the case reaches 'committed'. A persist failure fails the
    // request: the case holds at 'approved' (operator-visible, resumable —
    // the re-approve resumes via the dup-catch above and this idempotent
    // upsert). The ledger write above is NEVER rolled back. Runtime/
    // structural enforcement: nothing at the DB forces this sequencing;
    // this seam + the crash-resume test are the invariant's teeth (the
    // uniqueness half is Layer-1, evidence_objects_subject_unique).
    if (proposedAction === 'post_bill') {
      // Subject: the posted bill — from the post result on the happy path,
      // or the org-scoped posted_journal_entry_id lookup on recovery.
      let subjectBillId = billIdFromPost;
      if (!subjectBillId) {
        subjectBillId = await billService.getRecoveryBillIdByJournalEntry(
          { org_id: orgId, posted_journal_entry_id: journalEntryId! },
          ctx,
        );
      }
      await evidenceObjectService.persist(
        { subject_type: 'bill', subject_id: subjectBillId, org_id: orgId },
        ctx,
      );
    } else {
      // record_bill_payment — STRUCTURALLY UNREACHABLE at V1 (D5 T2
      // grounding, the D3 bundle precedent): Tier A never emits
      // cited_bill_id (only the Tier-C prompt names it), the Tier-A-only
      // rebuild therefore cannot satisfy buildRecordPaymentInput's bill_id
      // source, and matched bill-candidates route to attachment cards. The
      // happy-path persist below is wired for the post-V1 re-entry
      // (payment_id from the record result); the recovery sub-branch has NO
      // JE→payment column path (payments carries no posted_journal_entry_id
      // analog) and fails loudly rather than mark committed without
      // evidence — preserving INV-EVIDENCE-001 if this branch is ever
      // reached.
      if (paymentIdFromRecord) {
        await evidenceObjectService.persist(
          { subject_type: 'payment', subject_id: paymentIdFromRecord, org_id: orgId },
          ctx,
        );
      } else {
        // Same crash-class-X shape at the payment grain (doubly guarded:
        // the branch itself is structurally unreachable at V1).
        throw new ServiceError(
          'POSTING_RECOVERY_UNREPAIRABLE',
          'recovered payment JE has no resolvable payment row (no ' +
            'JE→payment column path exists). Manual repair required; ' +
            're-approving will not resolve this.',
        );
      }
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

// Board #4 T3 (3b) — the multi-invoice N-branch. Loops the case's α cards
// through the SAME buildPostBillInput → billService.post the single path uses,
// re-keyed per invoice (`${caseId}:bill:${suffix}`), per-invoice-independent,
// writing each α's posted_bill_id via the T3 substrate (3a). The case advances
// to committed ONLY IF every α now carries posted_bill_id (§1.5.3); a partial
// post holds at 'approved' — operator-visible and resumable, since re-approval
// skips already-posted α and dup-catch-recovers a crash between the post and
// the α write. Attribution is the HUMAN reviewer throughout (ctx). Errors
// propagate to POST's outer catch.
async function postMultiInvoiceCase(
  preview: Awaited<ReturnType<typeof buildReviewPreview>>,
  orgId: string,
  caseId: string,
  ctx: Awaited<ReturnType<typeof buildServiceContext>>,
): Promise<NextResponse> {
  const invoices = preview.invoices ?? [];
  const state = preview.document_case.state;

  // Forward transitions (state-aware resume; same edges as the single path).
  if (state === 'needs_review') {
    await transition(caseId, { target_state: 'proposed' }, ctx);
  }
  if (state === 'needs_review' || state === 'proposed') {
    await transition(caseId, { target_state: 'approved' }, ctx);
  }

  const builderInput = {
    org_id: orgId,
    source_document_id: preview.source_document?.id ?? '',
    trace_id: ctx.trace_id,
  };

  // Per-invoice dedup key (build-spec §1.5.2): vendor_invoice_number when
  // UNIQUE within the case's N α, else the α ordinal. Compute uniqueness once.
  const numberCounts = new Map<string, number>();
  for (const inv of invoices) {
    const n = inv.extracted_fields.vendor_invoice_number;
    if (typeof n === 'string' && n.length > 0) {
      numberCounts.set(n, (numberCounts.get(n) ?? 0) + 1);
    }
  }
  const childKeyFor = (inv: (typeof invoices)[number]): string => {
    const n = inv.extracted_fields.vendor_invoice_number;
    const suffix =
      typeof n === 'string' && n.length > 0 && numberCounts.get(n) === 1
        ? n
        : String(inv.ordinal);
    return `${caseId}:bill:${suffix}`;
  };

  const posted: Array<{ ordinal: number; bill_id: string; recovered: boolean }> =
    [];
  const unposted: Array<{ ordinal: number; reason: string }> = [];

  for (const inv of invoices) {
    // Already posted (recovery / re-approval): don't re-post; count as done.
    if (inv.post_status === 'posted') {
      posted.push({
        ordinal: inv.ordinal,
        bill_id: inv.posted_bill_id ?? '',
        recovered: true,
      });
      continue;
    }
    // Must be a post_bill card the builder can satisfy; else leave it pending
    // (per-invoice-independent — one unpostable α does not fail the others).
    const card = inv.proposal
      ? ((inv.proposal as { kind: string; card?: unknown }).card as
          | Record<string, unknown>
          | undefined)
      : undefined;
    if (!card || (card.proposed_action as string) !== 'post_bill') {
      unposted.push({ ordinal: inv.ordinal, reason: 'not_postable' });
      continue;
    }
    const billInput = await buildPostBillInput(card, builderInput);
    if (!billInput) {
      unposted.push({ ordinal: inv.ordinal, reason: 'missing_required_fields' });
      continue;
    }

    const childKey = childKeyFor(inv);
    let billId: string;
    let recovered = false;
    try {
      const result = await withInvariants(billService.post, {
        action: 'bill.post',
      })({ ...billInput, source_external_id: childKey }, ctx);
      billId = result.bill_id;
    } catch (err) {
      if (
        err instanceof ServiceError &&
        err.code === 'DUPLICATE_SOURCE_EXTERNAL_ID'
      ) {
        // Crash between billService.post and the α write: the bill exists under
        // childKey. Recover its JE → bill_id; NO second ledger write.
        const jeId = await journalEntryService.lookupBySourceExternalId(
          { org_id: orgId, source_external_id: childKey },
          ctx,
        );
        billId = await billService.getRecoveryBillIdByJournalEntry(
          { org_id: orgId, posted_journal_entry_id: jeId },
          ctx,
        );
        recovered = true;
      } else {
        throw err;
      }
    }

    // INV-EVIDENCE-001 — persist-before-marking at the multi-branch (the
    // SECOND committed-marking site; the single-invoice path holds the first).
    // Then write the α's posted_bill_id + status + resolved key (3a substrate;
    // write-once — a same-bill re-post no-ops on recovery).
    await evidenceObjectService.persist(
      { subject_type: 'bill', subject_id: billId, org_id: orgId },
      ctx,
    );
    await postExtractedInvoice({
      extracted_invoice_id: inv.id,
      posted_bill_id: billId,
      idempotency_key: childKey,
      trace_id: ctx.trace_id,
      posted_by: ctx.caller.user_id,
    });

    posted.push({ ordinal: inv.ordinal, bill_id: billId, recovered });
  }

  // INV-WORKFLOW-003 — aggregate committed marking (§1.5.3), safety direction:
  // advance `committed` ONLY when every α is posted (committed ⇒ all-α-posted);
  // a partial post holds at `approved`. The reverse is not guaranteed — a crash
  // here leaves all-posted-but-not-committed until re-approval (see the leaf).
  if (unposted.length === 0) {
    await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'committed' },
      ctx,
    );
    return NextResponse.json(
      { status: 'posted', case_state: 'committed', posted },
      { status: 200 },
    );
  }
  return NextResponse.json(
    { status: 'partially_posted', case_state: 'approved', posted, unposted },
    { status: 200 },
  );
}
