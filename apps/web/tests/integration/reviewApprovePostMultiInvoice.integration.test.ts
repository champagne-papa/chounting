// apps/web/tests/integration/reviewApprovePostMultiInvoice.integration.test.ts
//
// Board #4 slice-2 T3 (3b) — the approve-post N-branch: a multi-invoice case
// (buildReviewPreview.invoices != null) posts its N α through the loop, each
// re-keyed `${caseId}:bill:${vendor_invoice_number-if-unique else ordinal}`,
// per-invoice-independent, writing each α's posted_bill_id via the 3a substrate,
// and advances committed IFF all α are posted (§1.5.3).
//
// Two load-bearing cases, both observable-state:
//   1. Happy N-post: two matched-vendor α -> two bills, two JEs under the
//      per-invoice keys, both α posted with the resolved key, case committed.
//   2. Partial-post + re-approval recovery (the coupling-1 interlock): one α
//      postable, one not (no vendor yet) -> partially_posted / approved, α1
//      posted. Seed the missing vendor, re-approve -> α1 is SKIPPED (its
//      posted_bill_id UNCHANGED — no double-write, no write-once trip), α2
//      posts, case committed.

import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';

const RUN = crypto.randomUUID().slice(0, 8);
let mockOrgIds: string[] = [SEED.ORG_HOLDING];
let mockUserId: string = SEED.USER_CONTROLLER;

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/middleware/serviceContext')
  >('@/services/middleware/serviceContext');
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: crypto.randomUUID(),
      caller: {
        user_id: mockUserId,
        email: 'controller@thebridge.local',
        verified: true as const,
        org_ids: mockOrgIds,
      },
      locale: 'en' as const,
    })),
  };
});

const { POST: approvePost } = await import(
  '@/app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route'
);
const { createExtractedInvoice } = await import(
  '@/services/document-platform/extractedInvoiceWriteService'
);

const db = adminClient();

function caseReq(
  orgId: string,
  caseId: string,
): [Request, { params: Promise<{ orgId: string; caseId: string }> }] {
  return [
    new Request(
      `http://localhost/api/orgs/${orgId}/review/cases/${caseId}/approve-post`,
      { method: 'POST', headers: { 'content-type': 'application/json' } },
    ),
    { params: Promise.resolve({ orgId, caseId }) },
  ];
}

async function seedCaseNeedsReview(): Promise<{
  caseId: string;
  sourceDocId: string;
  trace_id: string;
}> {
  const orgId = SEED.ORG_HOLDING;
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
        original_filename: 't3-multi.pdf',
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
        document_type: 'vendor_invoice',
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

  // Hop received -> needs_review (where T2c parks a multi-invoice case).
  const { error: hopErr } = await db.rpc('update_document_case_state_with_audit', {
    p_case_id: caseId,
    p_target_state: 'needs_review',
    p_audit: {
      org_id: orgId,
      user_id: SEED.USER_CONTROLLER,
      trace_id,
      action: 'document_case_transitioned',
      entity_type: 'document_case',
      tool_name: null,
      reason: null,
    },
  });
  if (hopErr) throw new Error(`state hop failed: ${hopErr.message}`);
  return { caseId, sourceDocId: docId, trace_id };
}

async function seedVendor(name: string): Promise<void> {
  const { error } = await db.from('vendors').insert({
    vendor_id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    name,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
}

async function seedAlpha(
  caseId: string,
  sourceDocId: string,
  ordinal: number,
  vendorName: string,
  invoiceNumber: string,
  trace_id: string,
): Promise<void> {
  await createExtractedInvoice({
    document_case_id: caseId,
    source_document_id: sourceDocId,
    ordinal,
    document_type: 'vendor_invoice',
    extracted_fields: {
      amount: 100 + ordinal,
      currency: 'CAD',
      vendor_name: vendorName,
      vendor_invoice_number: invoiceNumber,
      accounting_date: '2026-06-04',
    },
    region_ref: { kind: 'ai_soft', source_locator: invoiceNumber },
    trace_id,
  });
}

async function alphaRows(caseId: string) {
  const { data } = await db
    .from('extracted_invoices')
    .select('ordinal, post_status, posted_bill_id, idempotency_key')
    .eq('document_case_id', caseId)
    .order('ordinal');
  return data ?? [];
}

async function caseState(caseId: string): Promise<string> {
  const { data } = await db
    .from('document_cases')
    .select('state')
    .eq('id', caseId)
    .single();
  return data!.state as string;
}

describe('Board #4 slice-2 T3 (3b) — approve-post N-branch (multi-invoice fan)', () => {
  it('1. happy N-post: two matched-vendor α → two bills under per-invoice keys, both α posted, case committed', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const vendorName = `T3 Multi Vendor ${RUN}`;
    await seedVendor(vendorName);
    const { caseId, sourceDocId, trace_id } = await seedCaseNeedsReview();
    await seedAlpha(caseId, sourceDocId, 1, vendorName, `INV-${RUN}-A`, trace_id);
    await seedAlpha(caseId, sourceDocId, 2, vendorName, `INV-${RUN}-B`, trace_id);

    const res = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('posted');
    expect(body.case_state).toBe('committed');

    // Both α posted, distinct bills, per-invoice keys (unique numbers → number).
    const rows = await alphaRows(caseId);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.post_status === 'posted')).toBe(true);
    expect(rows[0].posted_bill_id).not.toBeNull();
    expect(rows[1].posted_bill_id).not.toBeNull();
    expect(rows[0].posted_bill_id).not.toBe(rows[1].posted_bill_id);
    expect(rows[0].idempotency_key).toBe(`${caseId}:bill:INV-${RUN}-A`);
    expect(rows[1].idempotency_key).toBe(`${caseId}:bill:INV-${RUN}-B`);

    // Two JEs under the per-invoice child keys (the write half of the re-key).
    const { data: jes } = await db
      .from('journal_entries')
      .select('source_external_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .like('source_external_id', `${caseId}:%`);
    expect((jes ?? []).map((j) => j.source_external_id).sort()).toEqual([
      `${caseId}:bill:INV-${RUN}-A`,
      `${caseId}:bill:INV-${RUN}-B`,
    ]);

    expect(await caseState(caseId)).toBe('committed');
  });

  it('2. partial-post + re-approval recovery: unpostable α holds the case at approved; after fixing it, re-approval SKIPS the posted α (no double-write) and completes to committed', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const vendorA = `T3 Partial VendorA ${RUN}`;
    const vendorB = `T3 Partial VendorB ${RUN}`;
    await seedVendor(vendorA); // α1's vendor exists; α2's (vendorB) does NOT yet.
    const { caseId, sourceDocId, trace_id } = await seedCaseNeedsReview();
    await seedAlpha(caseId, sourceDocId, 1, vendorA, `INVP-${RUN}-A`, trace_id);
    await seedAlpha(caseId, sourceDocId, 2, vendorB, `INVP-${RUN}-B`, trace_id);

    // POST 1: α1 posts, α2 unpostable (no vendorB match) → partial → approved.
    const res1 = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    const body1 = await res1.json();
    expect(body1.status).toBe('partially_posted');
    expect(body1.case_state).toBe('approved');

    const after1 = await alphaRows(caseId);
    expect(after1[0].post_status).toBe('posted');
    expect(after1[0].posted_bill_id).not.toBeNull();
    expect(after1[1].post_status).toBe('pending');
    expect(after1[1].posted_bill_id).toBeNull();
    const alpha1Bill = after1[0].posted_bill_id;
    expect(await caseState(caseId)).toBe('approved');

    // Fix the gap: seed vendorB so α2 becomes postable.
    await seedVendor(vendorB);

    // POST 2 (re-approval): α1 SKIPPED (already posted — bill UNCHANGED, no
    // double-write, no write-once trip), α2 posts → all posted → committed.
    const res2 = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    const body2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(body2.status).toBe('posted');
    expect(body2.case_state).toBe('committed');

    const after2 = await alphaRows(caseId);
    // α1's bill is unchanged across the re-approval — no re-post, no re-key.
    expect(after2[0].posted_bill_id).toBe(alpha1Bill);
    expect(after2[0].post_status).toBe('posted');
    // α2 now posted to its own distinct bill.
    expect(after2[1].post_status).toBe('posted');
    expect(after2[1].posted_bill_id).not.toBeNull();
    expect(after2[1].posted_bill_id).not.toBe(alpha1Bill);

    expect(await caseState(caseId)).toBe('committed');
  });
});
