// tests/integration/reviewEndpoints.integration.test.ts
//
// Wave 6 D3 T5 — review list/detail endpoints + the preview rebuild.
// IDOR-negative suite part 2 (brief D-1.2): foreign ORG → 403 at the
// route's explicit membership check; foreign caseId under the
// caller's OWN org → 404 identical to nonexistent (no existence
// leak — the org-scoped fetch misses, the response carries no row
// data). Plus: both review-track populations listed with
// exception/post-status facets, the Tier-A preview rebuild (postable
// entry card with the money-string normalization), and the degraded
// no-artifacts path.
//
// Harness: cardsEndpoint pattern — vi.mock buildServiceContext with a
// mutable org-membership list, dynamic-import the route handlers.

import { describe, it, expect, vi, beforeAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';

const RUN_SUFFIX = crypto.randomUUID().slice(0, 8);

// Mutable membership — switched per test to model the foreign caller.
let mockOrgIds: string[] = [SEED.ORG_HOLDING];

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/middleware/serviceContext')
  >('@/services/middleware/serviceContext');
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: crypto.randomUUID(),
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true as const,
        org_ids: mockOrgIds,
      },
      locale: 'en' as const,
    })),
  };
});

const { GET: listGET } = await import(
  '@/app/api/orgs/[orgId]/review/cases/route'
);
const { GET: detailGET } = await import(
  '@/app/api/orgs/[orgId]/review/cases/[caseId]/route'
);

const db = adminClient();

function listReq(orgId: string, qs = ''): [Request, { params: Promise<{ orgId: string }> }] {
  return [
    new Request(`http://localhost/api/orgs/${orgId}/review/cases${qs}`),
    { params: Promise.resolve({ orgId }) },
  ];
}
function detailReq(
  orgId: string,
  caseId: string,
): [Request, { params: Promise<{ orgId: string; caseId: string }> }] {
  return [
    new Request(`http://localhost/api/orgs/${orgId}/review/cases/${caseId}`),
    { params: Promise.resolve({ orgId, caseId }) },
  ];
}

interface SeededDoc {
  sourceDocId: string;
  caseId: string;
}

// Pattern-A full-RPC seed (sweep-test precedent) — explicit org control.
async function seedCase(
  orgId: string,
  state:
    | 'received'
    | 'classified'
    | 'needs_review'
    | 'proposed'
    | 'approved' = 'needs_review',
  documentType = 'vendor_invoice',
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
        original_filename: 'review-d3-t5.pdf',
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

// OCR artifact seed (documentArtifactsSubstrate precedent): ocr_run →
// extraction_run → document_artifacts with crafted Tier-A-extractable
// lines.
async function seedArtifact(
  sourceDocId: string,
  lines: Array<{ text: string }>,
): Promise<void> {
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
    lines,
    words: [],
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.9,
  });
  if (artErr) throw new Error(`artifact seed failed: ${artErr.message}`);
}

const VENDOR_NAME = `Acme ${RUN_SUFFIX} Supplies`;

beforeAll(async () => {
  // Vendor whose name the OCR fixture carries — exact_name match.
  const { error } = await db.from('vendors').insert({
    vendor_id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    name: VENDOR_NAME,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
});

describe('Wave 6 D3 T5: IDOR negatives part 2', () => {
  it('list with a non-member orgId → 403 ORG_ACCESS_DENIED before any SQL', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    const res = await listGET(...listReq(SEED.ORG_REAL_ESTATE));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  it('detail with a non-member orgId → 403 (route check precedes the fetch)', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    const foreign = await seedCase(SEED.ORG_REAL_ESTATE, 'needs_review');
    const res = await detailGET(
      ...detailReq(SEED.ORG_REAL_ESTATE, foreign.caseId),
    );
    expect(res.status).toBe(403);
  });

  it('foreign caseId under the caller\'s OWN org → 404 identical to nonexistent (no existence leak)', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    const foreign = await seedCase(SEED.ORG_REAL_ESTATE, 'needs_review');

    // A real case in another org…
    const resForeign = await detailGET(
      ...detailReq(SEED.ORG_HOLDING, foreign.caseId),
    );
    // …and a case that does not exist anywhere:
    const resMissing = await detailGET(
      ...detailReq(SEED.ORG_HOLDING, crypto.randomUUID()),
    );

    expect(resForeign.status).toBe(404);
    expect(resMissing.status).toBe(404);
    const bodyForeign = await resForeign.json();
    const bodyMissing = await resMissing.json();
    // Identical error shape — the foreign row's existence is not
    // distinguishable from a miss.
    expect(bodyForeign.error).toBe(bodyMissing.error);
    expect(JSON.stringify(bodyForeign)).not.toContain(foreign.sourceDocId);
  });
});

describe('Wave 6 D3 T5: review inbox list', () => {
  it('lists review-track states with exception + post-status facets; excludes non-track states', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];

    const needsReview = await seedCase(SEED.ORG_HOLDING, 'classified');
    // Open a REAL exception (atomic RPC: classified → needs_review + entry).
    const { enqueueException } = await import(
      '@/services/document-platform/documentExceptionService'
    );
    const { makeTestContext } = await import('../setup/makeTestContext');
    const ownCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    await enqueueException(
      {
        document_case_id: needsReview.caseId,
        exception_reason: 'unknown_document_type',
        trace_id: ownCtx.trace_id,
      },
      ownCtx,
    );

    const proposed = await seedCase(SEED.ORG_HOLDING, 'proposed');
    const approvedPosted = await seedCase(SEED.ORG_HOLDING, 'approved');
    const approvedUnposted = await seedCase(SEED.ORG_HOLDING, 'approved');
    const received = await seedCase(SEED.ORG_HOLDING, 'received');

    // Post a JE bound to approvedPosted's dedup triple (the step-5/6
    // crash window shape).
    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .limit(1)
      .single();
    const { error: jeErr } = await db.rpc('write_journal_entry_atomic', {
      p_entry: {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: period!.period_id,
        entry_date: '2026-06-04',
        description: 'd3-t5 posted-status fixture',
        reference: null,
        source: 'manual',
        source_system: 'manual',
        // T6 uniform per-child suffixing: the bill child key.
        source_external_id: `${approvedPosted.caseId}:bill`,
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
    if (jeErr) throw new Error(`JE fixture failed: ${jeErr.message}`);

    const res = await listGET(...listReq(SEED.ORG_HOLDING, '?limit=500'));
    expect(res.status).toBe(200);
    const { cases } = (await res.json()) as {
      cases: Array<{
        document_case_id: string;
        state: string;
        open_exception: { exception_reason: string } | null;
        posted: boolean;
      }>;
    };
    const byId = new Map(cases.map((c) => [c.document_case_id, c]));

    expect(byId.get(needsReview.caseId)).toMatchObject({
      state: 'needs_review',
      open_exception: { exception_reason: 'unknown_document_type' },
    });
    expect(byId.get(proposed.caseId)).toMatchObject({
      state: 'proposed',
      open_exception: null,
    });
    expect(byId.get(approvedPosted.caseId)).toMatchObject({
      state: 'approved',
      posted: true,
    });
    expect(byId.get(approvedUnposted.caseId)).toMatchObject({
      state: 'approved',
      posted: false,
    });
    expect(byId.has(received.caseId)).toBe(false);
  });
});

describe('Wave 6 D3 T5: preview rebuild (detail endpoint)', () => {
  it('Tier-A vendor invoice rebuilds to a postable entry card with money-string normalization', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    const seeded = await seedCase(SEED.ORG_HOLDING, 'needs_review');
    await seedArtifact(seeded.sourceDocId, [
      { text: `Vendor: ${VENDOR_NAME}` },
      { text: 'Invoice Number: INV-4711' },
      { text: 'Date: 2026-06-01' },
      { text: 'Total Due: $250.00' },
      { text: 'CAD' },
    ]);

    const res = await detailGET(...detailReq(SEED.ORG_HOLDING, seeded.caseId));
    expect(res.status).toBe(200);
    const preview = await res.json();

    expect(preview.document_case).toMatchObject({
      id: seeded.caseId,
      state: 'needs_review',
      document_type: 'vendor_invoice',
    });
    expect(preview.source_document).toMatchObject({
      original_filename: 'review-d3-t5.pdf',
    });
    // No matched bill candidate → entry card post_bill (G-1 mapping).
    expect(preview.proposal?.kind).toBe('proposed_entry_card');
    // Tier A emits amount as a NUMBER; the rebuild normalizes to the
    // money-string convention (the named T5 finding).
    expect(preview.extracted_fields.amount).toBe('250.00');
    expect(preview.extracted_fields.accounting_date).toBe('2026-06-01');
    expect(preview.vendor_match?.vendor_id).not.toBeNull();
    expect(preview.vendor_match?.match_type).toBe('exact_name');
    expect(preview.postable).toBe(true);
    expect(preview.not_postable_reason).toBeNull();
    expect(preview.posted_journal_entries).toEqual([]);
    expect(preview.candidates).toEqual([]);
  });

  it('matched-bill candidate → attachment card → NOT_POSTABLE (attachment_kind_no_ledger_post)', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    const seeded = await seedCase(SEED.ORG_HOLDING, 'needs_review');
    await seedArtifact(seeded.sourceDocId, [
      { text: `Vendor: ${VENDOR_NAME}` },
      { text: 'Invoice Number: INV-9000' },
      { text: 'Date: 2026-06-02' },
      { text: 'Total Due: $99.00' },
    ]);
    // Persisted matched-bill candidate (the branch-(a) shape) —
    // candidates stand VERBATIM in the rebuild (no re-route).
    const { error: candErr } = await db
      .from('document_relationship_candidates')
      .insert({
        org_id: SEED.ORG_HOLDING,
        document_case_id: seeded.caseId,
        source_document_id: seeded.sourceDocId,
        linked_entity_type: 'bill',
        linked_entity_id: crypto.randomUUID(),
        link_role: 'primary_invoice',
        confidence_score: 0.95,
        candidate_features: {},
        trace_id: crypto.randomUUID(),
        created_by: 'agent',
      });
    if (candErr) throw new Error(`candidate seed failed: ${candErr.message}`);

    const res = await detailGET(...detailReq(SEED.ORG_HOLDING, seeded.caseId));
    expect(res.status).toBe(200);
    const preview = await res.json();

    expect(preview.candidates).toHaveLength(1);
    expect(preview.candidates[0]).toMatchObject({
      linked_entity_type: 'bill',
      link_role: 'primary_invoice',
    });
    expect(preview.proposal?.kind).toBe('proposed_attachment_card');
    expect(preview.postable).toBe(false);
    expect(preview.not_postable_reason).toBe('attachment_kind_no_ledger_post');
  });

  it('no artifacts → degraded preview, NOT_POSTABLE (no_artifacts), zero writes', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    const seeded = await seedCase(SEED.ORG_HOLDING, 'needs_review');

    const res = await detailGET(...detailReq(SEED.ORG_HOLDING, seeded.caseId));
    expect(res.status).toBe(200);
    const preview = await res.json();

    expect(preview.proposal).toBeNull();
    expect(preview.extracted_fields).toEqual({});
    expect(preview.postable).toBe(false);
    expect(preview.not_postable_reason).toBe('no_artifacts');

    // Read-only: the case state is untouched by the preview build.
    const { data: row } = await db
      .from('document_cases')
      .select('state')
      .eq('id', seeded.caseId)
      .single();
    expect(row!.state).toBe('needs_review');
  });
});
