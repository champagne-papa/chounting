// tests/integration/multiInvoicePipelineWiring.integration.test.ts
//
// Board #4 slice-2 T2c — integration tests for the multi-invoice branch wired
// into the live pipeline (ingestDocument.ts Stage 2.5, between OCR and
// classify). These assert OBSERVABLE STATE (α rows written / absent, case
// state, exception reason, pipeline_trace shape), not just returned reasons —
// the advisor reads these hardest.
//
// Four cases:
//   1. Multi-invoice split ({valid:true}, N=2): N α rows land with
//      region_ref.kind='ai_soft', case parks at needs_review with
//      exception_reason='multi_invoice', Stages 3-7 are SKIPPED (no ledger
//      write — proven by the 3-record pre-classify pipeline_trace).
//   2. Degrade ({valid:false} via the reconciliation gate): the branch falls
//      THROUGH to the single path — ZERO α rows written, NO multi_invoice
//      exception, Stage 3 classify ran. This is the false-negative safety, and
//      the load-bearing "degrade leaves clean state" assertion.
//   3. N=1-within-{valid:true} (trigger over-fire): the AI resolves the fired
//      tokens to ONE reconciling invoice → the `> 1` guard falls through to the
//      single path — ZERO α, no multi_invoice exception (audit-accuracy call:
//      a 1-invoice result is not a multi-invoice case).
//   4. Single-invoice (trigger false): no regression — full 9-stage single
//      path, zero α, no multi_invoice exception. Proves T2c is transparent to
//      single-invoice documents.
//
// SAFETY NOTE (case 1): the guarantee that a multi-invoice document never
// auto-posts rests PARTLY on the Wave -1 auto-commit being DISABLED. This test
// asserts PARKING (case at needs_review, no bill), NOT "auto-commit is off" —
// that guarantee must be RE-VERIFIED when governed auto-commit returns post-V1.
//
// Storage provider + OCR sidecar are mocked (same pattern as
// agentOrchestratorIngestDocument.integration.test.ts). The multi-extract
// Claude call is driven through the callClaude fixture queue
// (__setMockFixtureQueue), the same seam the T2b unit test uses.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';
import {
  __setMockFixtureQueue,
  __getLastClaudeCallParams,
} from '@/agent/orchestrator/callClaude';
import { __resetSegmentationBudgetForTests } from '@/agent/orchestrator/extraction/multiInvoiceExtractor';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

vi.mock('@/agent/orchestrator/extraction/sidecar/client', () => ({
  invokeSidecar: vi.fn(),
}));

const { ingestDocument } = await import(
  '@/agent/orchestrator/extraction/ingestDocument'
);
const { getStorageProvider } = await import('@/services/storage/resolver');
const { invokeSidecar } = await import(
  '@/agent/orchestrator/extraction/sidecar/client'
);

const db = adminClient();

function randomHash(): string {
  const chars = '0123456789abcdef';
  let h = '';
  for (let i = 0; i < 64; i++) {
    h += chars[Math.floor(Math.random() * 16)];
  }
  return h;
}

// A callClaude fixture carrying `text` as the single text block (mirrors the
// T2b unit test's buildFixture).
function buildFixture(text: string): Anthropic.Messages.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    stop_reason: 'end_turn',
    stop_sequence: null,
    content: [{ type: 'text', text, citations: null }],
    usage: {
      input_tokens: 10,
      output_tokens: 10,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: 'standard',
    },
  } as Anthropic.Messages.Message;
}

// Seeds batch + source_document + document_case (state='received') + job via
// the chunk 6.1 RPC. Returns both the source_document id and the case id so the
// tests can assert on case state + α rows keyed by case.
async function seedSourceDocument(opts: {
  trace_id: string;
  hash?: string;
}): Promise<{ sourceDocId: string; caseId: string }> {
  const orgId = SEED.ORG_HOLDING;
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const hash = opts.hash ?? randomHash();

  const batch = {
    id: batchId,
    org_id: orgId,
    ingest_channel: 'drag_drop_pdf',
    received_at: new Date().toISOString(),
    channel_metadata: {
      drop_session_id: crypto.randomUUID(),
      chat_session_id: crypto.randomUUID(),
      user_id: SEED.USER_CONTROLLER,
    },
    trace_id: opts.trace_id,
    created_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  };

  const doc = {
    id: docId,
    org_id: orgId,
    legal_entity_id: orgId,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${orgId}/sources/test/${docId}.pdf`,
    original_content_hash: hash,
    original_byte_size: 42,
    original_filename: 'multi-invoice-test.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf',
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
    ingest_batch_id: batchId,
  };

  const caseRow = {
    id: caseId,
    org_id: orgId,
    document_type: 'unknown',
    state: 'received',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  };

  const job = {
    id: crypto.randomUUID(),
    org_id: orgId,
    source_document_id: docId,
    document_case_id: caseId,
    state: 'queued',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  };

  const audit = {
    org_id: orgId,
    user_id: SEED.USER_CONTROLLER,
    trace_id: opts.trace_id,
    action: 'ingest_batch_created',
    entity_type: 'ingest_batch',
    before_state: null,
    after_state_id: null,
    tool_name: null,
    idempotency_key: null,
    reason: null,
  };

  const { error } = await db.rpc(
    'create_ingest_batch_with_documents_with_audit',
    {
      p_batch: batch,
      p_documents: [doc],
      p_cases: [caseRow],
      p_case_sources: [],
      p_jobs: [job],
      p_audit: audit,
    },
  );
  if (error) throw new Error(`seed RPC failed: ${error.message}`);
  return { sourceDocId: docId, caseId };
}

function makeFetchMock(): Mock {
  return vi.fn().mockResolvedValue({
    bytes: new TextEncoder().encode('stub bytes'),
    content_hash: 'stub-fetch-hash',
    provider: 'supabase_storage',
  });
}

// A vendor-invoice OCR artifact that Tier A classifies + extracts (the golden
// four lines from agentOrchestratorIngestDocument), used where the SINGLE path
// must run deterministically without a Tier C callClaude invocation.
const GOLDEN_VENDOR_INVOICE_LINES = [
  { text: 'Invoice #12345', bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: 'Acme Vendor Co.', bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Date: 2026-01-15', bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: 'Total: $123.45', bbox: [0, 60, 100, 80], confidence: 0.95 },
];

function setArtifact(lines: Array<{ text: string; bbox: number[]; confidence: number }>): void {
  vi.mocked(invokeSidecar).mockImplementation(
    createMockInvokeSidecar({
      failureMode: null,
      artifactOverride: { lines },
    }),
  );
}

describe('Board #4 slice-2 T2c — multi-invoice branch wired into ingestDocument', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
    __resetSegmentationBudgetForTests();
    __setMockFixtureQueue(null);
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: makeFetchMock(),
    });
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('multi-invoice split (valid, N=2): writes N α rows (region_ref ai_soft), parks case at needs_review with reason multi_invoice, skips Stages 3-7 (no ledger write)', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    // Two distinct invoice-number tokens in the OCR text → looksMultiInvoice
    // fires. The AI fixture returns two invoices whose amounts reconcile to
    // document_total (100 + 50 = 150) → {valid:true}.
    setArtifact([
      { text: 'Invoice INV0001', bbox: [0, 0, 100, 20], confidence: 0.95 },
      { text: 'Invoice INV0002', bbox: [0, 20, 100, 40], confidence: 0.95 },
      { text: 'Document total: $150.00', bbox: [0, 40, 100, 60], confidence: 0.95 },
    ]);
    __setMockFixtureQueue([
      buildFixture(
        JSON.stringify({
          invoices: [
            {
              amount: 100,
              currency: 'USD',
              vendor_name: 'Acme',
              vendor_invoice_number: 'INV0001',
              accounting_date: '2026-01-15',
              source_locator: 'INV0001',
            },
            {
              amount: 50,
              currency: 'USD',
              vendor_name: 'Acme',
              vendor_invoice_number: 'INV0002',
              accounting_date: '2026-01-16',
              source_locator: 'INV0002',
            },
          ],
          document_total: 150,
        }),
      ),
    ]);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Parked, no proposal, no failure.
    expect(result.status).toBe('parked_unposted');
    expect(result.proposal_id).toBeNull();
    expect(result.failure_class).toBeNull();

    // Stages 3-7 SKIPPED: only the three pre-classify stages emitted → the
    // pipeline never reached classify/extract/match/propose (no ledger path).
    expect(result.pipeline_trace.map((r) => r.stage_name)).toEqual([
      'dedup_no_match',
      'byte_fetch',
      'run_ocr',
    ]);

    // N α rows, ordinal 1..N, each PENDING with ai_soft provenance and no bill.
    const { data: alphas, error: alphaErr } = await db
      .from('extracted_invoices')
      .select('*')
      .eq('document_case_id', caseId)
      .order('ordinal');
    expect(alphaErr).toBeNull();
    expect(alphas).toHaveLength(2);
    expect(alphas!.map((a) => a.ordinal)).toEqual([1, 2]);
    for (const a of alphas!) {
      expect(a.document_type).toBe('vendor_invoice');
      expect(a.post_status).toBe('pending');
      expect(a.posted_bill_id).toBeNull();
      expect((a.region_ref as { kind?: string }).kind).toBe('ai_soft');
    }
    expect((alphas![0].region_ref as { source_locator?: string }).source_locator).toBe('INV0001');
    expect((alphas![1].region_ref as { source_locator?: string }).source_locator).toBe('INV0002');

    // Case parked at needs_review.
    const { data: caseRow } = await db
      .from('document_cases')
      .select('state')
      .eq('id', caseId)
      .single();
    expect(caseRow!.state).toBe('needs_review');

    // Exactly one OPEN exception, reason multi_invoice.
    const { data: exceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason, exception_status')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('multi_invoice');
    expect(exceptions![0].exception_status).toBe('open');
  });

  it('degrade (reconciliation gate fails): falls through to the single path — ZERO α rows written, NO multi_invoice exception, Stage 3 ran', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    // Golden vendor-invoice lines (so the single path stays in Tier A, no Tier
    // C callClaude) PLUS a benign line carrying two invoice-number tokens so
    // looksMultiInvoice fires and the multi-extract is attempted.
    setArtifact([
      ...GOLDEN_VENDOR_INVOICE_LINES,
      { text: 'Order refs: PO12345X PO67890Y', bbox: [0, 80, 100, 100], confidence: 0.95 },
    ]);
    // {valid:false} via the reconciliation gate: 100 + 100 = 200 ≠ 999.
    __setMockFixtureQueue([
      buildFixture(
        JSON.stringify({
          invoices: [
            { amount: 100, vendor_invoice_number: 'PO12345X', source_locator: 'PO12345X' },
            { amount: 100, vendor_invoice_number: 'PO67890Y', source_locator: 'PO67890Y' },
          ],
          document_total: 999,
        }),
      ),
    ]);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Not a pipeline failure; the degrade fell through, not errored.
    expect(result.failure_class).toBeNull();

    // Fall-through PROVEN: Stage 3 classify ran (the multi path returns before
    // Stage 3, so its presence means we degraded past the branch).
    expect(result.pipeline_trace.map((r) => r.stage_name)).toContain(
      'classify_document_type',
    );

    // LOAD-BEARING: the degrade left the α table clean — no partial write.
    const { data: alphas } = await db
      .from('extracted_invoices')
      .select('id')
      .eq('document_case_id', caseId);
    expect(alphas).toHaveLength(0);

    // And the branch did NOT enqueue a multi_invoice exception.
    const { data: multiExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'multi_invoice');
    expect(multiExceptions).toHaveLength(0);
  });

  it('N=1-within-{valid:true} (trigger over-fire): AI resolves to ONE invoice → falls through to single path, ZERO α, no multi_invoice exception', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    // Two invoice-number tokens fire looksMultiInvoice, but the AI resolves them
    // to a SINGLE reconciling invoice ({valid:true}, invoices.length===1). The
    // T2c `> 1` guard treats this as trigger over-fire → fall through to the
    // single path; the reconciled 1-invoice extraction is discarded, no α is
    // written, and the case is NOT parked as multi_invoice.
    setArtifact([
      ...GOLDEN_VENDOR_INVOICE_LINES,
      { text: 'Order refs: PO12345X PO67890Y', bbox: [0, 80, 100, 100], confidence: 0.95 },
    ]);
    __setMockFixtureQueue([
      buildFixture(
        JSON.stringify({
          invoices: [
            { amount: 123.45, vendor_invoice_number: 'INV0001', source_locator: 'INV0001' },
          ],
          document_total: 123.45,
        }),
      ),
    ]);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Not a pipeline failure; fell through, not errored.
    expect(result.failure_class).toBeNull();
    // The multi-extract AI call DID fire (proves the trigger fired and we
    // exercised the `> 1` guard, not a looksMultiInvoice miss): the last
    // callClaude params carry the multi-invoice system prompt. Stage 3/4 Tier A
    // make no callClaude call, so this reflects runAiMultiExtract.
    const lastParams = __getLastClaudeCallParams();
    expect(lastParams).not.toBeNull();
    expect(String(lastParams!.system)).toContain('MULTIPLE distinct invoices');
    // Fall-through PROVEN: Stage 3 classify ran (the multi path returns before
    // Stage 3, so its presence means the guard sent us down the single path).
    expect(result.pipeline_trace.map((r) => r.stage_name)).toContain(
      'classify_document_type',
    );

    // LOAD-BEARING: the reconciling 1-invoice result wrote NO α.
    const { data: alphas } = await db
      .from('extracted_invoices')
      .select('id')
      .eq('document_case_id', caseId);
    expect(alphas).toHaveLength(0);

    // And it was NOT parked under the multi_invoice reason.
    const { data: multiExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'multi_invoice');
    expect(multiExceptions).toHaveLength(0);
  });

  it('single-invoice (trigger false): no regression — full 9-stage single path, zero α, no multi_invoice exception', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    // Golden lines carry a lone digit-only "12345" and no mixed alphanumeric
    // token → looksMultiInvoice stays false → T2c is skipped entirely.
    setArtifact(GOLDEN_VENDOR_INVOICE_LINES);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Unchanged single-path behavior: matched vendor_invoice parks (Wave -1),
    // all nine stages ran.
    expect(result.status).toBe('parked_unposted');
    expect(result.pipeline_trace).toHaveLength(9);

    // No α written, no multi_invoice exception — T2c is transparent here.
    const { data: alphas } = await db
      .from('extracted_invoices')
      .select('id')
      .eq('document_case_id', caseId);
    expect(alphas).toHaveLength(0);

    const { data: multiExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'multi_invoice');
    expect(multiExceptions).toHaveLength(0);
  });
});
