// tests/integration/cardsEndpoint.recentN.integration.test.ts
//
// Phase 6 chunk 6.3a — Sub-Q10 Option B integration tests.
// Phase 6.5 chunk 3 — count_only mode extension tests.
//
// Tests the dual-mode cards endpoint:
//   GET /api/orgs/[orgId]/documents/cases
//     (recent-N mode; chunk 6.3a Sub-Q10 Option B)
//   GET /api/orgs/[orgId]/documents/cases?ingest_batch_id=X
//     (per-batch mode; chunk 6.2b backward-compat)
//   GET /api/orgs/[orgId]/documents/cases?limit=N
//     (recent-N with explicit limit)
//   GET /api/orgs/[orgId]/documents/cases?count_only=true
//     (head-only count mode; chunk 6.5 chunk 3 Zone 1 nav badge)
//
// Sentinel filtering preserved in all modes (document_cards_view
// bakes the sentinel WHERE clause; symmetric write/read discipline
// per Sub-Q2.2 chunk 6.2b lock).

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

const TRACE_ID_RECENT_A = '00000000-0000-0000-0000-0000c63a1001';
const TRACE_ID_RECENT_B = '00000000-0000-0000-0000-0000c63a1002';
const TRACE_ID_RECENT_C = '00000000-0000-0000-0000-0000c63a1003';
const TRACE_ID_SENTINEL_TEST = '00000000-0000-0000-0000-0000c63a1004';

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

const { GET } = await import(
  '@/app/api/orgs/[orgId]/documents/cases/route'
);

const db = adminClient();

interface CardRow {
  case_id: string;
  state: string;
  source_document_id: string;
  original_filename: string;
  ingest_batch_id: string;
  channel_metadata: Record<string, unknown>;
  received_at: string;
  created_at: string;
}

async function insertBatchWithCard(opts: {
  trace_id: string;
  filename: string;
  channel_metadata?: Record<string, unknown>;
}): Promise<{ batchId: string; caseId: string }> {
  const batchId = crypto.randomUUID();
  const { error: bErr } = await db.from('ingest_batches').insert({
    id: batchId,
    org_id: SEED.ORG_HOLDING,
    ingest_channel: 'drag_drop_pdf',
    received_at: new Date().toISOString(),
    channel_metadata: opts.channel_metadata ?? {
      drop_session_id: crypto.randomUUID(),
    },
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (bErr) throw new Error(`batch insert: ${bErr.message}`);

  const sourceDocId = crypto.randomUUID();
  const { error: sdErr } = await db.from('source_documents').insert({
    id: sourceDocId,
    org_id: SEED.ORG_HOLDING,
    legal_entity_id: SEED.ORG_HOLDING,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${SEED.ORG_HOLDING}/sources/${sourceDocId}/${opts.filename}`,
    original_content_hash:
      '0000000000000000000000000000000000000000000000000000000000000000',
    original_byte_size: 1,
    original_filename: opts.filename,
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf',
    ingest_batch_id: batchId,
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  });
  if (sdErr) throw new Error(`source_doc insert: ${sdErr.message}`);

  const caseId = crypto.randomUUID();
  const { error: dcErr } = await db.from('document_cases').insert({
    id: caseId,
    org_id: SEED.ORG_HOLDING,
    document_type: 'unknown',
    state: 'received',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (dcErr) throw new Error(`case insert: ${dcErr.message}`);

  const { error: djErr } = await db.from('document_jobs').insert({
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    source_document_id: sourceDocId,
    document_case_id: caseId,
    ingest_batch_id: batchId,
    state: 'queued',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (djErr) throw new Error(`job insert: ${djErr.message}`);

  return { batchId, caseId };
}

function makeReq(url: string): Request {
  return new Request(url, { method: 'GET' });
}

describe('Cards endpoint Sub-Q10 Option B (recent-N + per-batch dual mode)', () => {
  let batchA: { batchId: string; caseId: string };
  let batchB: { batchId: string; caseId: string };
  let batchC: { batchId: string; caseId: string };
  let sentinelBatch: { batchId: string; caseId: string };

  beforeAll(async () => {
    batchA = await insertBatchWithCard({
      trace_id: TRACE_ID_RECENT_A,
      filename: 'recent-a.pdf',
    });
    batchB = await insertBatchWithCard({
      trace_id: TRACE_ID_RECENT_B,
      filename: 'recent-b.pdf',
    });
    batchC = await insertBatchWithCard({
      trace_id: TRACE_ID_RECENT_C,
      filename: 'recent-c.pdf',
    });
    sentinelBatch = await insertBatchWithCard({
      trace_id: TRACE_ID_SENTINEL_TEST,
      filename: 'sentinel-card.pdf',
      // m153-shape sentinel — exercises the bake-in filter in the view
      channel_metadata: {
        sentinel: true,
        migration: 153,
        purpose: 'test',
      },
    });
  });

  afterAll(async () => {
    await db.from('audit_log').delete().in('trace_id', [
      TRACE_ID_RECENT_A,
      TRACE_ID_RECENT_B,
      TRACE_ID_RECENT_C,
      TRACE_ID_SENTINEL_TEST,
    ]);
  });

  it('Test #8 — recent-N without batch_id returns cards across all batches (default limit=50)', async () => {
    const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases`;
    const res = await GET(makeReq(url), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: CardRow[] };
    // At least our 3 non-sentinel cards present
    expect(body.cards.length).toBeGreaterThanOrEqual(3);
    // case_ids include batches A, B, C; do NOT include sentinel
    const caseIds = new Set(body.cards.map((c) => c.case_id));
    expect(caseIds.has(batchA.caseId)).toBe(true);
    expect(caseIds.has(batchB.caseId)).toBe(true);
    expect(caseIds.has(batchC.caseId)).toBe(true);
    expect(caseIds.has(sentinelBatch.caseId)).toBe(false);
    // Response shape: no `ingest_batch_id` envelope when in recent-N mode
    expect(body).not.toHaveProperty('ingest_batch_id');
  });

  it('Test #9 — with batch_id query param returns batch-scoped cards (chunk 6.2b backward-compat)', async () => {
    const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?ingest_batch_id=${batchA.batchId}`;
    const res = await GET(makeReq(url), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ingest_batch_id: string;
      cards: CardRow[];
    };
    expect(body.ingest_batch_id).toBe(batchA.batchId);
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].case_id).toBe(batchA.caseId);
    expect(body.cards[0].original_filename).toBe('recent-a.pdf');
  });

  it('Test #10 — limit param honored', async () => {
    const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?limit=2`;
    const res = await GET(makeReq(url), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: CardRow[] };
    expect(body.cards.length).toBeLessThanOrEqual(2);
  });

  it('Test #11 — sentinel filtering preserved in recent-N path (m153-shape sentinel excluded)', async () => {
    // Hit recent-N with a generous limit to ensure we'd see sentinel
    // if the filter were broken
    const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?limit=500`;
    const res = await GET(makeReq(url), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: CardRow[] };
    // Sentinel case must NOT appear
    const caseIds = new Set(body.cards.map((c) => c.case_id));
    expect(caseIds.has(sentinelBatch.caseId)).toBe(false);
    // Verify the view's symmetric-filter discipline catches m153-shape
    for (const c of body.cards) {
      const cm = c.channel_metadata;
      expect(cm.sentinel).toBeUndefined();
    }
  });

  // Phase 6.5 chunk 3 — count_only mode extension tests.
  describe('Phase 6.5 chunk 3 — count_only mode', () => {
    it('Test #12 — count_only=true returns { count: N } envelope', async () => {
      const url = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?count_only=true`;
      const res = await GET(makeReq(url), {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { count: number };
      // Envelope is `{ count: N }` — no `cards` array and no `ingest_batch_id`.
      expect(typeof body.count).toBe('number');
      expect(body).not.toHaveProperty('cards');
      expect(body).not.toHaveProperty('ingest_batch_id');
      // At least the 3 non-sentinel batches inserted in beforeAll are
      // counted; sentinel batch is excluded by the view filter.
      expect(body.count).toBeGreaterThanOrEqual(3);
    });

    it('Test #13 — count_only sentinel filter excludes m153-shape sentinels', async () => {
      // The count_only path queries document_cards_view with the
      // sentinel filter baked in. If the sentinel filter were missing,
      // sentinelBatch would inflate the count by 1.
      const urlWithSentinel = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?count_only=true`;
      const res1 = await GET(makeReq(urlWithSentinel), {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });
      const body1 = (await res1.json()) as { count: number };

      // Cross-check against the recent-N path with a generous limit.
      // The counts should agree (both query the same view; sentinel
      // filter applies symmetrically).
      const urlRecent = `http://test.local/api/orgs/${SEED.ORG_HOLDING}/documents/cases?limit=500`;
      const res2 = await GET(makeReq(urlRecent), {
        params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
      });
      const body2 = (await res2.json()) as { cards: CardRow[] };

      expect(body1.count).toBe(body2.cards.length);
    });
  });
});
