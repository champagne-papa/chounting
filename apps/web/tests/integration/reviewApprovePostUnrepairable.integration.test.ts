// apps/web/tests/integration/reviewApprovePostUnrepairable.integration.test.ts
//
// Board #4 slice-2 T6b-1 — the route wiring of the G3 crash-class into the
// approve-post N-branch. A multi-invoice case where one α is the crash-class-X
// shape (its JE landed under the per-invoice child key but its bill never did)
// must:
//   ① mark that α 'unrepairable' (T6a substrate) and route it to `unposted`
//      (NOT throw / abort the loop) — the catch-fix at the recovery sub-call;
//   ② on re-approval, SKIP the already-'unrepairable' α (build-spec §1.6
//      watch-item #2 — not an unwinnable retry) — the top-of-loop skip;
//   siblings post independently (§1.5.3 per-invoice-independence); and — the
//   LOAD-BEARING assertion — the case can NEVER reach `committed` while an
//   'unrepairable' α exists (INV-WORKFLOW-003: committed ⇒ all-α-posted, and an
//   'unrepairable' α carries no posted_bill_id).
//
// Induction mirrors reviewApprovePost's 23505 crash-shape (write_journal_entry_atomic
// seeds the JE under the child key) but OMITS the bill row — that omission is
// exactly the crash-class-X (JE-only) shape getRecoveryBillIdByJournalEntry rejects
// with POSTING_RECOVERY_UNREPAIRABLE.

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
        original_filename: 't6b-unrepairable.pdf',
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

// The crash-class-X induction: seed a JE under `childKey` with NO bill row.
// getRecoveryBillIdByJournalEntry finds the JE (dedup fires) but no bill →
// POSTING_RECOVERY_UNREPAIRABLE. This is the faithful "bill never landed" shape.
async function seedCrashClassJe(childKey: string): Promise<void> {
  const { data: period } = await db
    .from('fiscal_periods')
    .select('period_id')
    .eq('org_id', SEED.ORG_HOLDING)
    .eq('is_locked', false)
    .limit(1)
    .single();
  const { error } = await db.rpc('write_journal_entry_atomic', {
    p_entry: {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: period!.period_id,
      entry_date: '2026-06-04',
      description: 't6b crash-class-X fixture (JE without bill)',
      reference: null,
      source: 'manual',
      source_system: 'manual',
      source_external_id: childKey,
      entry_type: 'regular',
      created_by: SEED.USER_CONTROLLER,
    },
    p_lines: [],
    p_audit: {
      org_id: SEED.ORG_HOLDING,
      user_id: SEED.USER_CONTROLLER,
      trace_id: crypto.randomUUID(),
      action: 'journal_entry_posted',
      entity_type: 'journal_entry',
      before_state: null,
    },
  });
  if (error) throw new Error(`crash-class JE fixture failed: ${error.message}`);
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

describe('Board #4 slice-2 T6b-1 — approve-post crash-class-X → unrepairable', () => {
  it('crash-class α → unrepairable + unposted; sibling posts; case held at approved; re-approval SKIPS the stuck α and NEVER reaches committed', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const vendorName = `T6b Vendor ${RUN}`;
    await seedVendor(vendorName);
    const { caseId, sourceDocId, trace_id } = await seedCaseNeedsReview();

    // α1 = the crash-class α; α2 = a normal postable sibling. Unique numbers →
    // each α's child key is `${caseId}:bill:${number}`.
    const crashNumber = `INVX-${RUN}`;
    await seedAlpha(caseId, sourceDocId, 1, vendorName, crashNumber, trace_id);
    await seedAlpha(caseId, sourceDocId, 2, vendorName, `INVOK-${RUN}`, trace_id);
    // Pre-seed α1's JE under its child key, NO bill → crash-class-X.
    await seedCrashClassJe(`${caseId}:bill:${crashNumber}`);

    // ---- POST 1 (initial approve-post) ----
    const res1 = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    const body1 = await res1.json();
    expect(res1.status).toBe(200);
    // The whole re-approval did NOT 409 — it degraded per-invoice.
    expect(body1.status).toBe('partially_posted');
    expect(body1.case_state).toBe('approved');
    // α1 flagged unrepairable in the response (the catch-fix routed it to unposted).
    expect(body1.unposted).toEqual(
      expect.arrayContaining([{ ordinal: 1, reason: 'unrepairable' }]),
    );

    const after1 = await alphaRows(caseId);
    // α1 crash-class → marked unrepairable, NO bill (UPDATE post_status only).
    expect(after1[0].post_status).toBe('unrepairable');
    expect(after1[0].posted_bill_id).toBeNull();
    // α2 sibling → posted independently (per-invoice-independence held).
    expect(after1[1].post_status).toBe('posted');
    expect(after1[1].posted_bill_id).not.toBeNull();
    const sibBill = after1[1].posted_bill_id;
    // The case is held at approved — NOT committed (the stuck α blocks it).
    expect(await caseState(caseId)).toBe('approved');

    // ---- POST 2 (re-approval) — the top-of-loop skip + the never-committed invariant ----
    const res2 = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    const body2 = await res2.json();
    expect(res2.status).toBe(200);
    // Still partial — the unrepairable α is skipped, never re-attempted, no
    // double-error (watch-item #2: not an unwinnable retry).
    expect(body2.status).toBe('partially_posted');
    expect(body2.case_state).toBe('approved');
    expect(body2.unposted).toEqual(
      expect.arrayContaining([{ ordinal: 1, reason: 'unrepairable' }]),
    );

    const after2 = await alphaRows(caseId);
    // α1 unchanged — still unrepairable, still no bill (the skip did not re-mark
    // or re-attempt).
    expect(after2[0].post_status).toBe('unrepairable');
    expect(after2[0].posted_bill_id).toBeNull();
    // α2 unchanged — no double-post, its bill is the same one.
    expect(after2[1].post_status).toBe('posted');
    expect(after2[1].posted_bill_id).toBe(sibBill);
    // THE LOAD-BEARING ASSERTION — the case can NEVER reach committed while an
    // 'unrepairable' α exists (INV-WORKFLOW-003 holds).
    expect(await caseState(caseId)).toBe('approved');
  });
});
