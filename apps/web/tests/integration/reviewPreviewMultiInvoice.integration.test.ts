// tests/integration/reviewPreviewMultiInvoice.integration.test.ts
//
// Board #4 slice-2 T2.5 — buildReviewPreview reads the case's α
// (extracted_invoices) rows and fans them to N cards for a multi-invoice case,
// with an α-absent Tier-A rebuild fallback for the single-invoice majority
// (which write no α — Reading A, the two-path reversal of middle-design §3).
//
// Observable-state assertions (not returned-reason proxies):
//   1. α present (N=2): buildReviewPreview returns `invoices` with N cards
//      (ordinal 1..N, per-α extracted_fields, document_type), the amount
//      money-normalized to a string, and the CASE-level single-card fields
//      gated off — postable=false, reason multi_invoice_post_deferred,
//      proposal=null (per-invoice posting is deferred to T3).
//   2. α absent (single-invoice + Tier-A artifact): `invoices` is null and the
//      existing Tier-A rebuild path is unchanged (proposal present, fields
//      extracted). Proves the fallback is byte-for-byte the prior behavior.
//
// Substrate rows accumulate (delete-restricted); each test uses fresh uuids.

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { buildReviewPreview } from '@/agent/orchestrator/extraction/reviewPreview';
import {
  createExtractedInvoice,
  postExtractedInvoice,
  markExtractedInvoiceUnrepairable,
} from '@/services/document-platform/extractedInvoiceWriteService';

const db = adminClient();

// Seeds batch + source_document + document_case + job via the chunk 6.1 RPC.
// The job makes resolvePrimaryIngestSource resolve the source doc so
// buildReviewPreview's per-α buildProposal has a source_document_id.
async function seedCase(
  orgId: string,
  documentType: string,
): Promise<{ sourceDocId: string; caseId: string; trace_id: string }> {
  const trace_id = crypto.randomUUID();
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: {
      id: batchId,
      org_id: orgId,
      ingest_channel: 'drag_drop_pdf',
      received_at: new Date().toISOString(),
      channel_metadata: {
        drop_session_id: crypto.randomUUID(),
        chat_session_id: crypto.randomUUID(),
        user_id: SEED.USER_CONTROLLER,
      },
      trace_id,
      created_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
    },
    p_documents: [
      {
        id: docId,
        org_id: orgId,
        legal_entity_id: orgId,
        storage_provider: 'supabase_storage',
        original_storage_key: `org_${orgId}/sources/test/${docId}.pdf`,
        original_content_hash: crypto
          .createHash('sha256')
          .update(crypto.randomUUID())
          .digest('hex'),
        original_byte_size: 42,
        original_filename: 't2.5-review.pdf',
        mime_type: 'application/pdf',
        ingest_channel: 'drag_drop_pdf',
        storage_status: 'available',
        received_at: new Date().toISOString(),
        created_by: SEED.USER_CONTROLLER,
        ingest_batch_id: batchId,
      },
    ],
    p_cases: [
      {
        id: caseId,
        org_id: orgId,
        document_type: documentType,
        state: 'received',
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_case_sources: [],
    p_jobs: [
      {
        id: crypto.randomUUID(),
        org_id: orgId,
        source_document_id: docId,
        document_case_id: caseId,
        state: 'queued',
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_audit: {
      org_id: orgId,
      user_id: SEED.USER_CONTROLLER,
      trace_id,
      action: 'ingest_batch_created',
      entity_type: 'ingest_batch',
      before_state: null,
      after_state_id: null,
      tool_name: null,
      idempotency_key: null,
      reason: null,
    },
  });
  if (error) throw new Error(`seed RPC failed: ${error.message}`);
  return { sourceDocId: docId, caseId, trace_id };
}

// A Tier-A-extractable OCR artifact (the single-invoice fallback path).
async function seedTierAArtifact(sourceDocId: string): Promise<void> {
  const ocrRunId = crypto.randomUUID();
  const { error: ocrErr } = await db.from('ocr_runs').insert({
    id: ocrRunId,
    source_document_id: sourceDocId,
    supersedes_ocr_run_id: null,
    created_by: 'agent',
  });
  if (ocrErr) throw new Error(`ocr_run seed failed: ${ocrErr.message}`);
  const extractionRunId = crypto.randomUUID();
  const { error: extErr } = await db.from('extraction_runs').insert({
    id: extractionRunId,
    source_document_id: sourceDocId,
    ocr_run_id: ocrRunId,
    extraction_version: 'v1',
    created_by: 'agent',
  });
  if (extErr) throw new Error(`extraction_run seed failed: ${extErr.message}`);
  const { error: artErr } = await db.from('document_artifacts').insert({
    id: crypto.randomUUID(),
    source_document_id: sourceDocId,
    ocr_run_id: ocrRunId,
    extraction_run_id: extractionRunId,
    engine: 'paddleocr',
    engine_version: '2.7.0',
    pages: [],
    lines: [
      { text: 'Vendor: Globex Ltd' },
      { text: 'Invoice Number: INV-SINGLE-001' },
      { text: 'Date: 2026-06-04' },
      { text: 'Total Due: $180.00' },
      { text: 'CAD' },
    ],
    words: [],
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.9,
  });
  if (artErr) throw new Error(`artifact seed failed: ${artErr.message}`);
}

describe('Board #4 slice-2 T2.5 — buildReviewPreview reads α → N cards (Reading A)', () => {
  const orgId = SEED.ORG_HOLDING;

  it('α present (N=2): returns N per-invoice cards (ordinal 1..N, per-α fields, money-normalized); no-vendor case is not postable (missing_required_fields)', async () => {
    const ctx = makeTestContext({ org_ids: [orgId] });
    const { sourceDocId, caseId } = await seedCase(orgId, 'vendor_invoice');

    // Two pending α rows — as the T2c pipeline writes them (amount is a NUMBER
    // in the α payload; buildReviewPreview normalizes it to a money string).
    // Seeded in REVERSE ordinal order (2 before 1) so the [1,2] assertion below
    // actually guards the read's `ORDER BY ordinal` — insertion order would
    // yield [2,1] and fail if the sort were dropped.
    await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 2,
      document_type: 'vendor_invoice',
      extracted_fields: {
        amount: 50,
        currency: 'USD',
        vendor_name: 'Acme',
        vendor_invoice_number: 'INV0002',
        accounting_date: '2026-01-16',
        source_locator: 'INV0002',
      },
      region_ref: { kind: 'ai_soft', source_locator: 'INV0002' },
      trace_id: ctx.trace_id,
    });
    await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 1,
      document_type: 'vendor_invoice',
      extracted_fields: {
        amount: 100,
        currency: 'USD',
        vendor_name: 'Acme',
        vendor_invoice_number: 'INV0001',
        accounting_date: '2026-01-15',
        source_locator: 'INV0001',
      },
      region_ref: { kind: 'ai_soft', source_locator: 'INV0001' },
      trace_id: ctx.trace_id,
    });

    const preview = await buildReviewPreview(
      { org_id: orgId, document_case_id: caseId, trace_id: ctx.trace_id },
      ctx,
    );

    // N cards, ordered by ordinal, from the α rows (no re-extraction).
    expect(preview.invoices).not.toBeNull();
    expect(preview.invoices).toHaveLength(2);
    expect(preview.invoices!.map((i) => i.ordinal)).toEqual([1, 2]);
    expect(preview.invoices!.map((i) => i.document_type)).toEqual([
      'vendor_invoice',
      'vendor_invoice',
    ]);
    expect(
      preview.invoices![0].extracted_fields.vendor_invoice_number,
    ).toBe('INV0001');
    expect(
      preview.invoices![1].extracted_fields.vendor_invoice_number,
    ).toBe('INV0002');
    // Money-normalized to a string (INV-MONEY-001), from the α number.
    expect(preview.invoices![0].extracted_fields.amount).toBe('100.00');
    expect(preview.invoices![1].extracted_fields.amount).toBe('50.00');

    // Case-level: no vendor seeded → no α is per-card postable → the case is
    // not postable, reason missing_required_fields. (T3 3b aggregates per-card
    // postability; the T2.5 multi_invoice_post_deferred gate is superseded now
    // that the N-bill loop exists — a matched-vendor multi case IS postable,
    // proven in reviewApprovePostMultiInvoice.) proposal stays null — the N
    // cards live in `invoices`.
    expect(preview.postable).toBe(false);
    expect(preview.not_postable_reason).toBe('missing_required_fields');
    expect(preview.proposal).toBeNull();
  });

  it('α absent (single-invoice): invoices is null and the Tier-A rebuild fallback is unchanged (proposal rebuilt, fields extracted)', async () => {
    const ctx = makeTestContext({ org_ids: [orgId] });
    const { sourceDocId, caseId } = await seedCase(orgId, 'vendor_invoice');
    await seedTierAArtifact(sourceDocId);
    // No α rows written — the single-invoice path.

    const preview = await buildReviewPreview(
      { org_id: orgId, document_case_id: caseId, trace_id: ctx.trace_id },
      ctx,
    );

    // The α-absent fallback: no N-card fan, the existing single-card rebuild.
    expect(preview.invoices).toBeNull();
    // Tier-A rebuild ran (fields extracted from the artifact) and produced a
    // proposal — byte-for-byte the prior single-invoice behavior.
    expect(Object.keys(preview.extracted_fields).length).toBeGreaterThan(0);
    expect(preview.proposal).not.toBeNull();
  });

  it('T6b-2 guarded anyPostable: [posted, unrepairable] → NOT postable, reason unrepairable_present', async () => {
    const ctx = makeTestContext({ org_ids: [orgId] });
    const { sourceDocId, caseId } = await seedCase(orgId, 'vendor_invoice');
    const vendorId = crypto.randomUUID();
    const { error: vErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: orgId,
      name: `T6b2 Vendor ${crypto.randomUUID().slice(0, 8)}`,
    });
    if (vErr) throw new Error(`vendor seed failed: ${vErr.message}`);
    // α1 → posted (with a bill); α2 → unrepairable.
    const a1 = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 1,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: 100, currency: 'CAD', vendor_invoice_number: 'INVP1' },
      trace_id: ctx.trace_id,
    });
    const a2 = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 2,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: 50, currency: 'CAD', vendor_invoice_number: 'INVU2' },
      trace_id: ctx.trace_id,
    });
    const billId = crypto.randomUUID();
    const { error: bErr } = await db.from('bills').insert({
      bill_id: billId,
      org_id: orgId,
      vendor_id: vendorId,
      issue_date: '2026-01-15',
    });
    if (bErr) throw new Error(`bill seed failed: ${bErr.message}`);
    await postExtractedInvoice({
      extracted_invoice_id: a1,
      posted_bill_id: billId,
      idempotency_key: `${caseId}:bill:INVP1`,
      trace_id: ctx.trace_id,
      posted_by: ctx.caller.user_id,
    });
    await markExtractedInvoiceUnrepairable({
      extracted_invoice_id: a2,
      trace_id: ctx.trace_id,
      marked_by: ctx.caller.user_id,
    });

    const preview = await buildReviewPreview(
      { org_id: orgId, document_case_id: caseId, trace_id: ctx.trace_id },
      ctx,
    );
    // The 'posted' disjunct is guarded by !hasUnrepairable, so a case that is
    // [posted, unrepairable] with nothing pending-postable is NOT postable — it
    // can never commit while the stuck α exists (watch-item #2, case-grain).
    expect(preview.postable).toBe(false);
    expect(preview.not_postable_reason).toBe('unrepairable_present');
    const status = Object.fromEntries(
      preview.invoices!.map((i) => [i.ordinal, i.post_status]),
    );
    expect(status[1]).toBe('posted');
    expect(status[2]).toBe('unrepairable');
  });

  it('T6b-2 guarded anyPostable: [pending-postable, unrepairable] → STILL postable (post the pending α)', async () => {
    const ctx = makeTestContext({ org_ids: [orgId] });
    const { sourceDocId, caseId } = await seedCase(orgId, 'vendor_invoice');
    const vendorName = `T6b2 Mixed Vendor ${crypto.randomUUID().slice(0, 8)}`;
    const { error: vErr } = await db.from('vendors').insert({
      vendor_id: crypto.randomUUID(),
      org_id: orgId,
      name: vendorName,
    });
    if (vErr) throw new Error(`vendor seed failed: ${vErr.message}`);
    // α1 → pending-postable (matched vendor + required fields); α2 → unrepairable.
    await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 1,
      document_type: 'vendor_invoice',
      extracted_fields: {
        amount: 100,
        currency: 'CAD',
        vendor_name: vendorName,
        vendor_invoice_number: 'INVM1',
        accounting_date: '2026-06-04',
      },
      region_ref: { kind: 'ai_soft', source_locator: 'INVM1' },
      trace_id: ctx.trace_id,
    });
    const a2 = await createExtractedInvoice({
      document_case_id: caseId,
      source_document_id: sourceDocId,
      ordinal: 2,
      document_type: 'vendor_invoice',
      extracted_fields: { amount: 50, currency: 'CAD', vendor_invoice_number: 'INVM2' },
      trace_id: ctx.trace_id,
    });
    await markExtractedInvoiceUnrepairable({
      extracted_invoice_id: a2,
      trace_id: ctx.trace_id,
      marked_by: ctx.caller.user_id,
    });

    const preview = await buildReviewPreview(
      { org_id: orgId, document_case_id: caseId, trace_id: ctx.trace_id },
      ctx,
    );
    // α1 is pending-postable (first disjunct, NOT guarded by hasUnrepairable) →
    // the case is still postable: real work the operator can do. The guard closes
    // the futile [posted, unrepairable] button WITHOUT collapsing the mixed case.
    expect(preview.postable).toBe(true);
  });
});
