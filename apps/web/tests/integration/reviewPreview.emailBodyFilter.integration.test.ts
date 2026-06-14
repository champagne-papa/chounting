// .eml review-detail filter (forwarded-mailbox).
//
// A forwarded-mailbox case's review preview must resolve the ATTACHMENT (the
// document the pipeline classified/extracted), not the .eml email_body wrapper.
// Pre-fix, loadReviewPreviewRows picked "oldest document_jobs row wins" — and
// the email body's job is created first, so review-detail showed "Subject.eml".
// The fix routes the pick through resolvePrimaryIngestSource (excludes
// role='email_body'), the same picker handleForwardedMailbox + the sweep use.
//
// Fixture discipline (verified 2026-06-14): mailbox attachments are ROLE-LESS —
// attachDocumentCaseSource has zero orchestrator call-sites, so only the email
// body gets a document_case_sources row (role='email_body'). A role='primary'
// attachment fixture would test fiction and could green a "pick role='primary'"
// mis-implementation while prod still leaks the .eml.

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { attachDocumentCaseSource } from '@/services/document-platform/documentCaseSourceService';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { loadReviewPreviewRows } from '@/services/document-platform/reviewPreviewReadService';

const db = adminClient();

describe('reviewPreview — forwarded-mailbox .eml body excluded from review detail', () => {
  it('resolves the role-less attachment, not the email_body, as the review source document', async () => {
    const orgId = SEED.ORG_HOLDING;
    const ctx = makeTestContext({ org_ids: [orgId] });
    const { ingest_batch_id } = await createIngestBatchForTest(orgId);

    const mkDoc = (mime: string, name: string) =>
      documentPlatformService.createSourceDocument(
        {
          bytes: new Uint8Array([1, 2, 3, 4]),
          mime_type: mime,
          original_filename: name,
          ingest_channel: 'direct_upload',
          ingest_batch_id,
          received_at: new Date().toISOString(),
          org_id: orgId,
          created_by: ctx.caller.user_id,
        },
        ctx,
      );

    // Email body (text/plain) — its document_jobs row is created FIRST below,
    // so the pre-fix "oldest wins" would (wrongly) pick it.
    const body = await mkDoc('text/plain', `mailbox-body-${crypto.randomUUID().slice(0, 8)}.eml`);
    // Real attachment (application/pdf) — role-less.
    const attachment = await mkDoc('application/pdf', `invoice-${crypto.randomUUID().slice(0, 8)}.pdf`);

    const caseRes = await createDocumentCase({ org_id: orgId, document_type: 'vendor_invoice' }, ctx);

    // Only the body gets a role row; the attachment is role-less (real shape).
    await attachDocumentCaseSource(
      { document_case_id: caseRes.id, source_document_id: body.id, role: 'email_body' },
      ctx,
    );

    // document_jobs — body FIRST (oldest), attachment second.
    const job = (source_document_id: string) => ({
      id: crypto.randomUUID(),
      org_id: orgId,
      source_document_id,
      document_case_id: caseRes.id,
      ingest_batch_id,
      state: 'queued',
      trace_id: ctx.trace_id,
      created_by: SEED.USER_CONTROLLER,
    });
    const { error: e1 } = await db.from('document_jobs').insert(job(body.id));
    if (e1) throw new Error(`body job fixture failed: ${e1.message}`);
    const { error: e2 } = await db.from('document_jobs').insert(job(attachment.id));
    if (e2) throw new Error(`attachment job fixture failed: ${e2.message}`);

    const rows = await loadReviewPreviewRows({ org_id: orgId, document_case_id: caseRes.id });

    // The review source must be the ATTACHMENT, not the .eml body.
    expect(rows.sourceDocumentId).toBe(attachment.id);
    expect(rows.sourceDocumentId).not.toBe(body.id);
    expect((rows.sourceDocRow?.mime_type as string | undefined) ?? '').toBe('application/pdf');
    expect((rows.sourceDocRow?.original_filename as string | undefined) ?? '').toContain('.pdf');
  });
});
