// tests/integration/documentCasesRead.integration.test.ts
//
// Phase 6 chunk 6.2b — integration tests for the cards read endpoints:
//   GET /api/orgs/[orgId]/documents/cases?ingest_batch_id=X (list)
//   GET /api/orgs/[orgId]/documents/cases/[caseId]           (detail)
//
// Both endpoints query `document_cards_view` (migration 154) which has
// the sentinel filter baked in. Sentinel filter is verified for BOTH
// m152-shape AND m153-shape fixtures per Drift 3 + MF-4 requirement
// (narrow-filter regression to {"sentinel": true, "migration": 152}
// would silently pass m152 fixtures while breaking m153 coverage).
//
// Chunk 6.3a Sub-Q10 Option B: the list endpoint now accepts
// ingest_batch_id as OPTIONAL (was required at chunk 6.2b). When
// omitted, returns recent N cards across all batches. The pre-existing
// "400 when missing" test was retired here; the recent-N behavior is
// covered by cardsEndpoint.recentN.integration.test.ts.

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { Mock } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

const TRACE_ID_LIST = '00000000-0000-0000-0000-0000cd751001';
const TRACE_ID_DETAIL = '00000000-0000-0000-0000-0000cd751002';
const TRACE_ID_SENTINEL_152 = '00000000-0000-0000-0000-0000cd751152';
const TRACE_ID_SENTINEL_153 = '00000000-0000-0000-0000-0000cd751153';

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual =
    await vi.importActual<
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
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en' as const,
    })),
  };
});

const { GET: listGet } = await import(
  '@/app/api/orgs/[orgId]/documents/cases/route'
);
const { GET: detailGet } = await import(
  '@/app/api/orgs/[orgId]/documents/cases/[caseId]/route'
);
const serviceContextModule = await import(
  '@/services/middleware/serviceContext'
);

const db = adminClient();

// ---------------------------------------------------------------
// Direct fixture helpers. We bypass ingestionService and write the
// substrate directly (the cards endpoint reads via the view; doesn't
// care about which path wrote the data). Bypassing ingestionService
// keeps these tests focused on the read surface + avoids the storage
// provider mock setup.
// ---------------------------------------------------------------

async function insertBatch(opts: {
  trace_id: string;
  channel_metadata?: Record<string, unknown>;
}): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await db.from('ingest_batches').insert({
    id,
    org_id: SEED.ORG_HOLDING,
    ingest_channel: 'drag_drop_pdf',
    received_at: new Date().toISOString(),
    channel_metadata: opts.channel_metadata ?? {
      drop_session_id: crypto.randomUUID(),
    },
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (error) throw new Error(`insertBatch failed: ${error.message}`);
  return id;
}

async function insertCard(
  batchId: string,
  filename: string,
  trace_id: string,
): Promise<{ source_document_id: string; case_id: string; job_id: string }> {
  const source_document_id = crypto.randomUUID();
  const { error: sdErr } = await db.from('source_documents').insert({
    id: source_document_id,
    org_id: SEED.ORG_HOLDING,
    legal_entity_id: SEED.ORG_HOLDING,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${SEED.ORG_HOLDING}/sources/${source_document_id}/${filename}`,
    original_content_hash:
      '0000000000000000000000000000000000000000000000000000000000000000',
    original_byte_size: 1,
    original_filename: filename,
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf',
    ingest_batch_id: batchId,
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  });
  if (sdErr) throw new Error(`source_doc insert: ${sdErr.message}`);

  const case_id = crypto.randomUUID();
  const { error: dcErr } = await db.from('document_cases').insert({
    id: case_id,
    org_id: SEED.ORG_HOLDING,
    document_type: 'unknown',
    state: 'received',
    trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (dcErr) throw new Error(`case insert: ${dcErr.message}`);

  const job_id = crypto.randomUUID();
  const { error: djErr } = await db.from('document_jobs').insert({
    id: job_id,
    org_id: SEED.ORG_HOLDING,
    source_document_id,
    document_case_id: case_id,
    ingest_batch_id: batchId,
    state: 'queued',
    trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (djErr) throw new Error(`job insert: ${djErr.message}`);

  return { source_document_id, case_id, job_id };
}

function makeReq(url: string): Request {
  return new Request(url, { method: 'GET' });
}

describe('GET /api/orgs/[orgId]/documents/cases (list + detail)', () => {
  // -----------------------------------------------------------------
  // Test 1: List happy path with N=2 cards.
  // -----------------------------------------------------------------
  describe('list-by-batch happy path', () => {
    let batchId: string;
    let cardA: { case_id: string };
    let cardB: { case_id: string };

    beforeAll(async () => {
      batchId = await insertBatch({ trace_id: TRACE_ID_LIST });
      cardA = await insertCard(batchId, 'list-a.pdf', TRACE_ID_LIST);
      cardB = await insertCard(batchId, 'list-b.pdf', TRACE_ID_LIST);
    });

    afterAll(async () => {
      await db.from('audit_log').delete().eq('trace_id', TRACE_ID_LIST);
    });

    it('returns 2 cards with Sub-Q2.1 columns', async () => {
      const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?ingest_batch_id=${batchId}`;
      const res = await listGet(makeReq(url), {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        ingest_batch_id: string;
        cards: Array<{
          case_id: string;
          state: string;
          source_document_id: string;
          original_filename: string;
          ingest_batch_id: string;
          channel_metadata: Record<string, unknown>;
          received_at: string;
          created_at: string;
        }>;
      };
      expect(body.ingest_batch_id).toBe(batchId);
      expect(body.cards).toHaveLength(2);
      const caseIds = new Set(body.cards.map((c) => c.case_id));
      expect(caseIds.has(cardA.case_id)).toBe(true);
      expect(caseIds.has(cardB.case_id)).toBe(true);
      for (const c of body.cards) {
        expect(c.state).toBe('received');
        expect(c.ingest_batch_id).toBe(batchId);
        expect(c.channel_metadata).toHaveProperty('drop_session_id');
      }
    });

    it('403 cross-org: caller without orgId in org_ids', async () => {
      (
        serviceContextModule.buildServiceContext as Mock
      ).mockImplementationOnce(async () => ({
        trace_id: crypto.randomUUID(),
        caller: {
          user_id: SEED.USER_CONTROLLER,
          email: 'controller@thebridge.local',
          verified: true as const,
          // Caller is in ORG_REAL_ESTATE but targets ORG_HOLDING.
          org_ids: [SEED.ORG_REAL_ESTATE],
        },
        locale: 'en' as const,
      }));
      const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?ingest_batch_id=${batchId}`;
      const res = await listGet(makeReq(url), {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });
      expect(res.status).toBe(403);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('ORG_ACCESS_DENIED');
    });
  });

  // -----------------------------------------------------------------
  // Test 2: Detail happy path + not-found.
  // -----------------------------------------------------------------
  describe('case-detail', () => {
    let batchId: string;
    let detailCard: { case_id: string };

    beforeAll(async () => {
      batchId = await insertBatch({ trace_id: TRACE_ID_DETAIL });
      detailCard = await insertCard(
        batchId,
        'detail.pdf',
        TRACE_ID_DETAIL,
      );
    });

    afterAll(async () => {
      await db.from('audit_log').delete().eq('trace_id', TRACE_ID_DETAIL);
    });

    it('returns case detail with full ingest_batch context', async () => {
      const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases/${detailCard.case_id}`;
      const res = await detailGet(makeReq(url), {
        params: Promise.resolve({
          orgId: SEED.ORG_HOLDING,
          caseId: detailCard.case_id,
        }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        case_id: string;
        state: string;
        ingest_batch: { id: string; ingest_channel: string };
      };
      expect(body.case_id).toBe(detailCard.case_id);
      expect(body.state).toBe('received');
      expect(body.ingest_batch.id).toBe(batchId);
      expect(body.ingest_batch.ingest_channel).toBe('drag_drop_pdf');
    });

    it('404 for non-existent caseId', async () => {
      const fakeId = crypto.randomUUID();
      const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases/${fakeId}`;
      const res = await detailGet(makeReq(url), {
        params: Promise.resolve({
          orgId: SEED.ORG_HOLDING,
          caseId: fakeId,
        }),
      });
      expect(res.status).toBe(404);
    });
  });

  // -----------------------------------------------------------------
  // Test 3 + 4: Sentinel filter — BOTH m152-shape AND m153-shape
  // fixtures must be excluded by the cards endpoint. Drift 3 + MF-4
  // coverage requirement — narrow-filter regression would silently
  // pass one but break the other.
  // -----------------------------------------------------------------
  describe('sentinel filter (Sub-Q2.2 symmetric-filter discipline)', () => {
    let m152BatchId: string;
    let m153BatchId: string;

    beforeAll(async () => {
      // m152-shape sentinel: channel_metadata.migration = 152
      m152BatchId = await insertBatch({
        trace_id: TRACE_ID_SENTINEL_152,
        channel_metadata: {
          sentinel: true,
          migration: 152,
          purpose: 'test m152-shape sentinel filter',
        },
      });
      await insertCard(m152BatchId, 'm152.pdf', TRACE_ID_SENTINEL_152);

      // m153-shape sentinel: channel_metadata.migration = 153
      m153BatchId = await insertBatch({
        trace_id: TRACE_ID_SENTINEL_153,
        channel_metadata: {
          sentinel: true,
          migration: 153,
          purpose: 'test m153-shape sentinel filter',
        },
      });
      await insertCard(m153BatchId, 'm153.pdf', TRACE_ID_SENTINEL_153);
    });

    afterAll(async () => {
      await db
        .from('audit_log')
        .delete()
        .in('trace_id', [TRACE_ID_SENTINEL_152, TRACE_ID_SENTINEL_153]);
    });

    it('m152-shape sentinel batch returns empty cards list', async () => {
      const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?ingest_batch_id=${m152BatchId}`;
      const res = await listGet(makeReq(url), {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { cards: unknown[] };
      expect(body.cards).toHaveLength(0);
    });

    it('m153-shape sentinel batch returns empty cards list (narrow-filter regression check)', async () => {
      const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?ingest_batch_id=${m153BatchId}`;
      const res = await listGet(makeReq(url), {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { cards: unknown[] };
      expect(body.cards).toHaveLength(0);
    });
  });
});
