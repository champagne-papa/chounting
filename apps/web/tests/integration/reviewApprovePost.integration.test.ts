// tests/integration/reviewApprovePost.integration.test.ts
//
// Wave 6 D3 T6 — the human approve→post (the ledger write), reject,
// and resolve-exception routes. The two line-by-line read-back targets
// live here:
//   1. Happy-path row-delta: exactly ONE new journal_entries row,
//      created_by = the HUMAN reviewer, source_external_id =
//      `${caseId}:bill`, case → committed.
//   2. 23505-recovery: the seeded step-5/6 crash shape (approved +
//      JE bound to the child key, not committed) → re-approve-post →
//      DUPLICATE_SOURCE_EXTERNAL_ID → look-up-existing-JE → completes
//      to committed with journal_entries count UNCHANGED.
//
// Harness: cardsEndpoint vi.mock pattern. Fixtures: Pattern-A seed +
// Tier-A-extractable OCR artifact + exact-name vendor (T5 precedent).
// JE/JL append-only — no cleanup; per-run unique keys via case uuids.

import { describe, it, expect, vi, beforeAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';

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
const { POST: rejectPost } = await import(
  '@/app/api/orgs/[orgId]/review/cases/[caseId]/reject/route'
);
const { POST: resolvePost } = await import(
  '@/app/api/orgs/[orgId]/review/cases/[caseId]/resolve-exception/route'
);

const db = adminClient();

function caseReq(
  orgId: string,
  caseId: string,
  segment: string,
  body?: unknown,
): [Request, { params: Promise<{ orgId: string; caseId: string }> }] {
  return [
    new Request(
      `http://localhost/api/orgs/${orgId}/review/cases/${caseId}/${segment}`,
      {
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      },
    ),
    { params: Promise.resolve({ orgId, caseId }) },
  ];
}

async function jeCount(): Promise<number> {
  const { count, error } = await db
    .from('journal_entries')
    .select('journal_entry_id', { count: 'exact', head: true })
    .eq('org_id', SEED.ORG_HOLDING);
  if (error) throw new Error(`jeCount failed: ${error.message}`);
  return count ?? 0;
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

interface SeededDoc {
  sourceDocId: string;
  caseId: string;
}

async function seedCase(
  orgId: string,
  state: string,
): Promise<SeededDoc> {
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
        original_filename: 'approve-post-t6.pdf',
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

const VENDOR_NAME = `Globex ${RUN_SUFFIX} Ltd`;

async function seedPostableArtifact(sourceDocId: string): Promise<void> {
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
      { text: `Vendor: ${VENDOR_NAME}` },
      { text: 'Invoice Number: INV-T6-001' },
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

async function seedPostableCase(state: string): Promise<SeededDoc> {
  const seeded = await seedCase(SEED.ORG_HOLDING, state);
  await seedPostableArtifact(seeded.sourceDocId);
  return seeded;
}

beforeAll(async () => {
  mockOrgIds = [SEED.ORG_HOLDING];
  mockUserId = SEED.USER_CONTROLLER;
  const { error } = await db.from('vendors').insert({
    vendor_id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    name: VENDOR_NAME,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
});

describe('Wave 6 D3 T6: approve→post — the ledger write', () => {
  it('HAPPY PATH (row-delta target): needs_review → exactly one new JE under the human identity → committed', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostableCase('needs_review');

    const before = await jeCount();
    const res = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'approve-post'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('posted');
    expect(body.case_state).toBe('committed');

    // Row delta: EXACTLY one new journal entry (the D7 seam).
    const after = await jeCount();
    expect(after - before).toBe(1);

    // The JE: human-attributed, child-key-bound.
    const { data: je, error } = await db
      .from('journal_entries')
      .select('journal_entry_id, created_by, source_system, source_external_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('source_external_id', `${caseId}:bill`)
      .single();
    expect(error).toBeNull();
    expect(je!.journal_entry_id).toBe(body.journal_entry_id);
    expect(je!.created_by).toBe(SEED.USER_CONTROLLER); // ctx.caller.user_id → created_by
    expect(je!.source_system).toBe('manual');

    // The bill row exists and points at the JE (billService.post ran).
    const { data: bill } = await db
      .from('bills')
      .select('bill_id, posted_journal_entry_id')
      .eq('posted_journal_entry_id', je!.journal_entry_id)
      .single();
    expect(bill).not.toBeNull();

    expect(await caseState(caseId)).toBe('committed');
  });

  it('23505-RECOVERY (line-by-line target): approved + JE already bound → recovered, count UNCHANGED, committed', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    // The step-5/6 crash shape: case at approved, the bill-child JE
    // already posted under the dedup key, the committed marking never
    // landed.
    const { caseId } = await seedPostableCase('approved');
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
          description: 'd3-t6 crash-shape fixture',
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
    if (jeErr) throw new Error(`crash-shape JE fixture failed: ${jeErr.message}`);
    const seededJeId = (
      seededJe as Array<{ journal_entry_id: string }>
    )[0]!.journal_entry_id;

    // Wave 6 D5 T2 fixture amendment (Option A condition 2, advisor-
    // authorized at the crash-class-X read-back): the faithful step-5/6
    // crash shape carries the BILL too — billService.post writes JE then
    // bill in sequence, so "posted but the committed marking never
    // landed" leaves both rows. The original JE-only shape is
    // crash-class-X (JE written, bill insert crashed), now a NON-
    // RECOVERABLE manual-repair class asserted in the D5 persistence
    // suite. Every original assertion below is unchanged: recovery of
    // the existing JE, no second ledger write, count unchanged,
    // status 'recovered', case committed.
    const crashVendorId = crypto.randomUUID();
    const { error: cvErr } = await db.from('vendors').insert({
      vendor_id: crashVendorId,
      org_id: SEED.ORG_HOLDING,
      name: `d3-t6 crash-shape vendor ${crypto.randomUUID().slice(0, 8)}`,
    });
    if (cvErr) throw new Error(`crash-shape vendor fixture failed: ${cvErr.message}`);
    const { error: cbErr } = await db.from('bills').insert({
      bill_id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      vendor_id: crashVendorId,
      issue_date: '2026-06-04',
      posted_journal_entry_id: seededJeId,
    });
    if (cbErr) throw new Error(`crash-shape bill fixture failed: ${cbErr.message}`);

    const before = await jeCount();
    const res = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'approve-post'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    // The recovery path: post attempt → 23505 (idx_je_source_external)
    // → DUPLICATE_SOURCE_EXTERNAL_ID → look up the existing JE →
    // complete the committed marking. NO second ledger write.
    expect(body.status).toBe('recovered');
    expect(body.journal_entry_id).toBe(seededJeId);
    expect(await jeCount()).toBe(before); // count UNCHANGED
    expect(await caseState(caseId)).toBe('committed');
  });

  it('resume from proposed: one JE, committed (the partial-crash resumability rung)', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostableCase('proposed');

    const before = await jeCount();
    const res = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'approve-post'),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('posted');
    expect(await jeCount()).toBe(before + 1);
    expect(await caseState(caseId)).toBe('committed');
  });

  it('already complete: committed case → 200 already_complete, ZERO writes', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostableCase('committed');

    const before = await jeCount();
    const res = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'approve-post'),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('already_complete');
    expect(await jeCount()).toBe(before);
    expect(await caseState(caseId)).toBe('committed');
  });

  it('not in review track: classified case → 409, state unchanged', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostableCase('classified');

    const res = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'approve-post'),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('NOT_IN_REVIEW_TRACK');
    expect(await caseState(caseId)).toBe('classified');
  });

  it('NOT_POSTABLE gates BEFORE any transition: artifact-less needs_review → 409, state unchanged', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedCase(SEED.ORG_HOLDING, 'needs_review');

    const res = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'approve-post'),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('NOT_POSTABLE');
    expect(body.reason).toBe('no_artifacts');
    // The gate precedes the forward transitions.
    expect(await caseState(caseId)).toBe('needs_review');
  });

  it('Invariant 4 negative: caller whose role lacks bill.post → PERMISSION_DENIED, no JE; case visible at approved', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    // A REAL seeded member (FK-safe for the transition audit rows)
    // whose role does not carry bill.post — the authentic Invariant 4
    // shape: authenticated, org-member, permission-lacking.
    mockUserId = SEED.USER_EXECUTIVE;
    const { caseId } = await seedPostableCase('needs_review');

    const before = await jeCount();
    const res = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'approve-post'),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('PERMISSION_DENIED');
    expect(await jeCount()).toBe(before); // no ledger write
    // The transitions preceded the denied post — the case sits at
    // approved, operator-visible in the inbox (the compensating-path
    // visibility the brief names; not silent).
    expect(await caseState(caseId)).toBe('approved');
    mockUserId = SEED.USER_CONTROLLER;
  });

  it('IDOR: foreign org → 403; foreign caseId under own org → 404', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const foreign = await seedCase(SEED.ORG_REAL_ESTATE, 'needs_review');

    const res403 = await approvePost(
      ...caseReq(SEED.ORG_REAL_ESTATE, foreign.caseId, 'approve-post'),
    );
    expect(res403.status).toBe(403);

    const res404 = await approvePost(
      ...caseReq(SEED.ORG_HOLDING, foreign.caseId, 'approve-post'),
    );
    expect(res404.status).toBe(404);
    expect(await caseState(foreign.caseId)).toBe('needs_review');
  });
});

describe('Wave 6 D3 T6: reject + resolve-exception routes', () => {
  it('reject: needs_review → rejected with required reason; missing reason → 400', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedCase(SEED.ORG_HOLDING, 'needs_review');

    const res400 = await rejectPost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'reject', {}),
    );
    expect(res400.status).toBe(400);
    expect(await caseState(caseId)).toBe('needs_review');

    const res = await rejectPost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'reject', {
        reason: 'not an accounting document',
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).case_state).toBe('rejected');
  });

  it('resolve-exception: open entry resolved via the existing 9-action machinery (mark_duplicate → rejected)', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedCase(SEED.ORG_HOLDING, 'classified');
    const { enqueueException } = await import(
      '@/services/document-platform/documentExceptionService'
    );
    const { makeTestContext } = await import('../setup/makeTestContext');
    const ownCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'unknown_document_type',
        trace_id: ownCtx.trace_id,
      },
      ownCtx,
    );

    const res = await resolvePost(
      ...caseReq(SEED.ORG_HOLDING, caseId, 'resolve-exception', {
        exception_queue_entry_id: entry.exception_queue_entry_id,
        resolution_action: 'mark_duplicate',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exception_status).toBe('resolved');
    expect(body.document_case_id).toBe(caseId);
    expect(await caseState(caseId)).toBe('rejected');
  });
});
