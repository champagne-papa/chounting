// tests/integration/evidenceObjectPersistence.integration.test.ts
//
// Wave 6 D5 T2 — the evidence-object producer: evidenceObjectService
// .persist (subject-ownership guard → assemble → upsert) + the
// approve→post route seam (persist-before-marking; INV-EVIDENCE-001's
// runtime/structural half). Additive sibling to the D3/D4 suites
// (both stay byte-unchanged).
//
// Line-by-line read-back targets:
//   1. Persist-grain cross-org negative (B-axis centerpiece): direct
//      service call, foreign-org subject → LINKED_ENTITY_NOT_FOUND
//      (reused code, ask (d) reuse-check fired), ZERO rows, foreign ≡
//      missing (identical refusal for a nonexistent subject).
//   2. The teeth test (D-2): injected persist failure at approve →
//      500-class, case HOLDS at 'approved', zero evidence rows; then
//      re-approve → dup-catch JE recovery + idempotent persist → ONE
//      row, committed, exactly one JE across both attempts.
//   3. created_by INSERT-only: a resume re-persist under a different
//      user refreshes status + trace_id but never the creator.
//
// Harness: D3 T6 pattern (buildServiceContext vi.mock, seed RPC,
// Tier-A OCR artifact, exact-name vendor). evidence_objects has no
// append-only trigger — created rows cleaned in afterAll.

import { describe, it, expect, vi, afterAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { evidenceObjectService } from '@/services/evidence/evidenceObjectService';
import { ServiceError } from '@/services/errors/ServiceError';

const RUN_SUFFIX = crypto.randomUUID().slice(0, 8);

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

const db = adminClient();

const createdVendorIds: string[] = [];
const createdBillIds: string[] = [];
const evidenceSubjectIds: string[] = [];

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

/** Direct bills seed for the persist-grain tests (issue_date + org_id +
 *  vendor_id are the only required inserts). */
async function seedBill(orgId: string): Promise<string> {
  const vendorId = crypto.randomUUID();
  createdVendorIds.push(vendorId);
  const { error: vErr } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: `D5 T2 vendor ${RUN_SUFFIX}-${createdVendorIds.length}`,
  });
  if (vErr) throw new Error(`vendor seed failed: ${vErr.message}`);
  const billId = crypto.randomUUID();
  createdBillIds.push(billId);
  const { error } = await db.from('bills').insert({
    bill_id: billId,
    org_id: orgId,
    vendor_id: vendorId,
    issue_date: '2026-06-04',
  });
  if (error) throw new Error(`bill seed failed: ${error.message}`);
  return billId;
}

async function evidenceRowsFor(subjectId: string) {
  const { data, error } = await db
    .from('evidence_objects')
    .select('*')
    .eq('subject_type', 'bill')
    .eq('subject_id', subjectId);
  if (error) throw new Error(`evidence read failed: ${error.message}`);
  return data ?? [];
}

async function caseState(caseId: string): Promise<string> {
  const { data, error } = await db
    .from('document_cases')
    .select('state')
    .eq('id', caseId)
    .single();
  if (error || !data) throw new Error(`caseState failed: ${error?.message}`);
  return data.state as string;
}

async function jeCount(): Promise<number> {
  const { count, error } = await db
    .from('journal_entries')
    .select('journal_entry_id', { count: 'exact', head: true })
    .eq('org_id', SEED.ORG_HOLDING);
  if (error) throw new Error(`jeCount failed: ${error.message}`);
  return count ?? 0;
}

async function evidenceCount(): Promise<number> {
  const { count, error } = await db
    .from('evidence_objects')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', SEED.ORG_HOLDING);
  if (error) throw new Error(`evidenceCount failed: ${error.message}`);
  return count ?? 0;
}

// ---- route-path seeding (the D3 T6 harness) ----

async function seedCase(orgId: string, state: string): Promise<{ sourceDocId: string; caseId: string }> {
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
        original_filename: 'evidence-persist-d5.pdf',
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

  if (state !== 'received') {
    const { error: trErr } = await db.rpc('update_document_case_state_with_audit', {
      p_case_id: caseId,
      p_target_state: state,
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
    if (trErr) throw new Error(`seed state hop failed: ${trErr.message}`);
  }
  return { sourceDocId: docId, caseId };
}

async function seedPostableArtifact(sourceDocId: string, vendorName: string): Promise<void> {
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
      { text: `Vendor: ${vendorName}` },
      { text: `Invoice Number: INV-D5-${RUN_SUFFIX}` },
      { text: 'Date: 2026-06-04' },
      { text: 'Total Due: $120.00' },
      { text: 'CAD' },
    ],
    words: [],
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.9,
  });
  if (artErr) throw new Error(`artifact seed failed: ${artErr.message}`);
}

async function seedPostableCase(
  label: string,
  state = 'needs_review',
): Promise<{ caseId: string; vendorName: string }> {
  const vendorId = crypto.randomUUID();
  const vendorName = `D5 ${label} ${RUN_SUFFIX}`;
  createdVendorIds.push(vendorId);
  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: SEED.ORG_HOLDING,
    name: vendorName,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
  const seeded = await seedCase(SEED.ORG_HOLDING, state);
  await seedPostableArtifact(seeded.sourceDocId, vendorName);
  return { caseId: seeded.caseId, vendorName };
}

afterAll(async () => {
  if (evidenceSubjectIds.length > 0) {
    await db
      .from('evidence_objects')
      .delete()
      .in('subject_id', evidenceSubjectIds);
  }
  // bills carry posted JEs in the route tests — delete only the
  // direct-seeded (never-posted) ones; FK-blocked deletes are swallowed.
  for (const id of createdBillIds) {
    await db.from('bills').delete().eq('bill_id', id);
  }
  for (const id of createdVendorIds) {
    await db.from('vendors').delete().eq('vendor_id', id);
  }
});

describe('Wave 6 D5 T2: evidenceObjectService.persist (the persist grain)', () => {
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

  it('CROSS-ORG NEGATIVE (B-axis centerpiece): foreign-org subject → LINKED_ENTITY_NOT_FOUND, ZERO rows', async () => {
    const foreignBillId = await seedBill(SEED.ORG_REAL_ESTATE);
    evidenceSubjectIds.push(foreignBillId);

    await expect(
      evidenceObjectService.persist(
        { subject_type: 'bill', subject_id: foreignBillId, org_id: SEED.ORG_HOLDING },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'LINKED_ENTITY_NOT_FOUND' });

    expect(await evidenceRowsFor(foreignBillId)).toHaveLength(0);
  });

  it('foreign ≡ missing: nonexistent subject → the IDENTICAL refusal, zero rows', async () => {
    const ghostId = crypto.randomUUID();
    evidenceSubjectIds.push(ghostId);

    await expect(
      evidenceObjectService.persist(
        { subject_type: 'bill', subject_id: ghostId, org_id: SEED.ORG_HOLDING },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'LINKED_ENTITY_NOT_FOUND' });

    expect(await evidenceRowsFor(ghostId)).toHaveLength(0);
  });

  it('unknown subject_type → refusal before any read', async () => {
    await expect(
      evidenceObjectService.persist(
        { subject_type: 'not_a_thing', subject_id: crypto.randomUUID(), org_id: SEED.ORG_HOLDING },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'LINKED_ENTITY_NOT_FOUND' });
  });

  it('happy direct persist: in-org bill → one row (subject, org, ctx trace, partial, creator) + audit', async () => {
    const billId = await seedBill(SEED.ORG_HOLDING);
    evidenceSubjectIds.push(billId);

    const row = await evidenceObjectService.persist(
      { subject_type: 'bill', subject_id: billId, org_id: SEED.ORG_HOLDING },
      ctx,
    );

    const rows = await evidenceRowsFor(billId);
    expect(rows).toHaveLength(1);
    expect(rows[0].org_id).toBe(SEED.ORG_HOLDING);
    expect(rows[0].trace_id).toBe(ctx.trace_id);
    // A bare bill has no links → no facets → transient 'empty'
    // collapses to row-grain 'partial' (brief D-5).
    expect(rows[0].status).toBe('partial');
    expect(rows[0].created_by).toBe(SEED.USER_CONTROLLER);
    expect(row.id).toBe(rows[0].id);

    const { data: audit } = await db
      .from('audit_log')
      .select('action')
      .eq('entity_id', rows[0].id)
      .eq('action', 'evidence_object.persisted');
    expect(audit!.length).toBeGreaterThanOrEqual(1);
  });

  it('idempotent resume: re-persist under another user refreshes trace_id, NEVER created_by (INSERT-only)', async () => {
    const billId = await seedBill(SEED.ORG_HOLDING);
    evidenceSubjectIds.push(billId);

    await evidenceObjectService.persist(
      { subject_type: 'bill', subject_id: billId, org_id: SEED.ORG_HOLDING },
      ctx,
    );
    const resumeCtx = makeTestContext({
      user_id: SEED.USER_EXECUTIVE,
      org_ids: [SEED.ORG_HOLDING],
    });
    await evidenceObjectService.persist(
      { subject_type: 'bill', subject_id: billId, org_id: SEED.ORG_HOLDING },
      resumeCtx,
    );

    const rows = await evidenceRowsFor(billId);
    expect(rows).toHaveLength(1); // upsert, not a second row
    expect(rows[0].trace_id).toBe(resumeCtx.trace_id); // refreshed
    expect(rows[0].created_by).toBe(SEED.USER_CONTROLLER); // INSERT-only
  });
});

describe('Wave 6 D5 T2: the route seam (persist-before-marking)', () => {
  it('PRODUCER HAPPY PATH: approve→post → one evidence row for the posted bill; committed', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostableCase('happy');

    const res = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('posted');

    const { data: bill } = await db
      .from('bills')
      .select('bill_id')
      .eq('posted_journal_entry_id', body.journal_entry_id)
      .single();
    expect(bill).not.toBeNull();
    evidenceSubjectIds.push(bill!.bill_id);

    const rows = await evidenceRowsFor(bill!.bill_id);
    expect(rows).toHaveLength(1);
    expect(rows[0].org_id).toBe(SEED.ORG_HOLDING);
    expect(rows[0].trace_id).toBeTruthy();
    expect(['partial', 'complete']).toContain(rows[0].status);
    expect(await caseState(caseId)).toBe('committed');
  });

  it('THE TEETH TEST: injected persist failure → approved + ZERO rows; re-approve → recovered, ONE row, committed, one JE total', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostableCase('teeth');

    const before = await jeCount();
    const spy = vi
      .spyOn(evidenceObjectService, 'persist')
      .mockRejectedValueOnce(
        new ServiceError('POST_FAILED', 'D5 T2 injected persist failure'),
      );

    const res1 = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    expect(res1.status).toBe(500); // POST_FAILED maps 500
    // STRICT assertions (read-back): the case HOLDS at approved —
    // operator-visible, resumable; the marking never ran.
    expect(await caseState(caseId)).toBe('approved');
    // The JE posted (post-first) but NO evidence row exists.
    expect(await jeCount()).toBe(before + 1);
    const { data: bill } = await db
      .from('bills')
      .select('bill_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('posted_journal_entry_id', (
        await db
          .from('journal_entries')
          .select('journal_entry_id')
          .eq('org_id', SEED.ORG_HOLDING)
          .eq('source_external_id', `${caseId}:bill`)
          .single()
      ).data!.journal_entry_id)
      .single();
    evidenceSubjectIds.push(bill!.bill_id);
    expect(await evidenceRowsFor(bill!.bill_id)).toHaveLength(0);

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();

    // Resume: dup-catch recovers the JE, persist succeeds, marking lands.
    const res2 = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    expect(res2.status).toBe(200);
    expect((await res2.json()).status).toBe('recovered');
    expect(await jeCount()).toBe(before + 1); // NO second ledger write
    expect(await evidenceRowsFor(bill!.bill_id)).toHaveLength(1);
    expect(await caseState(caseId)).toBe('committed');
  });

  it('CRASH-CLASS-X (Option A condition 3): JE-only recovery → 409 POSTING_RECOVERY_UNREPAIRABLE, case HOLDS at approved, zero evidence rows, the JE survives', async () => {
    // The shape the D3 T6 fixture originally seeded (JE bound to the
    // child key, NO bill row) — real via billService.post's non-atomic
    // JE→bill window, and unrepairable by retry (the JE dedup fires
    // before the bill insert on every re-post). Pre-D5 this completed
    // to committed with no bill (the silent JE/subledger gap, now
    // closed); under INV-EVIDENCE-001 it is a LOUD, NON-RETRYABLE,
    // operator-visible hold.
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostableCase('crash-x', 'approved');

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .limit(1)
      .single();
    const { data: seededJe, error: jeErr } = await db.rpc(
      'write_journal_entry_atomic',
      {
        p_entry: {
          org_id: SEED.ORG_HOLDING,
          fiscal_period_id: period!.period_id,
          entry_date: '2026-06-04',
          description: 'd5-t2 crash-class-x fixture (JE only, no bill)',
          reference: null,
          source: 'manual',
          source_system: 'manual',
          source_external_id: `${caseId}:bill`,
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
      },
    );
    if (jeErr) throw new Error(`crash-class-x JE fixture failed: ${jeErr.message}`);
    const seededJeId = (
      seededJe as Array<{ journal_entry_id: string }>
    )[0]!.journal_entry_id;

    const before = await jeCount();
    const evBefore = await evidenceCount();
    const res = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));

    // Typed, non-retryable, operator-distinguishable (409, not 500).
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('POSTING_RECOVERY_UNREPAIRABLE');

    // The case HOLDS at approved — committed never happens for this shape.
    expect(await caseState(caseId)).toBe('approved');

    // Zero evidence rows written for ANY subject by this request: the
    // org-wide evidence_objects count is unchanged (the T2 read-back
    // replaced a vacuous trace-keyed probe with this delta assertion).
    expect(await evidenceCount()).toBe(evBefore);

    // The JE count is unchanged AND the seeded JE survives untouched
    // (ledger non-rollback, asserted not implied — condition 3).
    expect(await jeCount()).toBe(before);
    const { data: je } = await db
      .from('journal_entries')
      .select('journal_entry_id')
      .eq('journal_entry_id', seededJeId)
      .single();
    expect(je!.journal_entry_id).toBe(seededJeId);

    // And re-approving reproduces the SAME refusal (non-retryable proven).
    const res2 = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    expect(res2.status).toBe(409);
    expect((await res2.json()).error).toBe('POSTING_RECOVERY_UNREPAIRABLE');
    expect(await caseState(caseId)).toBe('approved');
  });
});
