// tests/integration/routingTerminalDisposition.integration.test.ts
//
// Wave 6 D2.1 T4 — INV-WORKFLOW-002 end-to-end routing integration. Drives
// the REAL ingestDocument orchestrator (storage resolver + Modal sidecar
// mocked at the agentOrchestratorIngestDocument boundary; deterministic
// Tier-A OCR fixtures; the unknown test additionally uses the callClaude
// __mockFixtureQueue per the classifier.integration precedent — no live AI
// fires anywhere). Asserts the terminal-disposition property by OUTCOME:
//
//   1. MATCHED via Scenario A (deterministic — no bill seeded → the
//      null-target inferred candidate → branch (a) → matched → entry-card
//      park → hand-off): case ENDS at needs_review with the PLAIN
//      before_state='matched' audit row and NO exception row.
//   2. UNMATCHED (branch c): no sender label → vendor_id null → :834 skip
//      → N=0 → needs_review WITH the unmatched_router_candidate exception.
//   3. ATTACHMENT EXIT (bill seeded, unique number): the formerly-stranding
//      third exit also ENDS at needs_review with the matched hand-off and
//      the reconciled 'parked_unposted' status. (Whether Stage 7 emits the
//      attachment or entry card can vary with candidate-target resolution;
//      the routing property and status are deliberately kind-independent —
//      that is the point of the T4 reconciliation.)
//   4. PRECONDITION (loud failure): suppressed routing → the hand-off
//      refuses 'classified' → pipeline_failed, case stranded at classified
//      — a routing regression cannot silently park.
//   5. UNKNOWN ROUTE: malformed Tier-C classification → unknown →
//      advance + enqueueException('unknown_document_type') → needs_review
//      (the ADR-0014 §7 contract, realized at T4).
//
// Substrate rows accumulate (delete-restricted posture); vendors are
// unique-named and bill numbers unique-suffixed per run (the fixture-
// isolation lesson from the entry-vs-attachment flip).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));
vi.mock('@/agent/orchestrator/extraction/sidecar/client', () => ({
  invokeSidecar: vi.fn(),
}));

// Partial module mock: resolveCandidates pass-through with a per-test
// suppression flag (Test 4's routing-regression simulation); everything
// else (completeCandidate, dispatchTrigger, …) stays real.
let suppressRouting = false;
vi.mock('@/services/document-platform/documentRouterService', async (importOriginal) => {
  const real = await importOriginal<
    typeof import('@/services/document-platform/documentRouterService')
  >();
  return {
    ...real,
    resolveCandidates: (
      ...args: Parameters<typeof real.resolveCandidates>
    ) =>
      suppressRouting
        ? Promise.resolve(undefined as never)
        : real.resolveCandidates(...args),
  };
});

const { ingestDocument } = await import(
  '@/agent/orchestrator/extraction/ingestDocument'
);
const { getStorageProvider } = await import('@/services/storage/resolver');
const { invokeSidecar } = await import(
  '@/agent/orchestrator/extraction/sidecar/client'
);
const { __setMockFixtureQueue } = await import('@/agent/orchestrator/callClaude');

const db = adminClient();

function randomHash(): string {
  const chars = '0123456789abcdef';
  let h = '';
  for (let i = 0; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

// Anthropic message fixture for the callClaude __mockFixtureQueue —
// replicated from classifier.integration.test.ts (local helper there).
function buildAnthropicFixture(jsonText: string): Anthropic.Messages.Message {
  return {
    id: `msg_${Math.random().toString(36).slice(2)}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    stop_reason: 'end_turn',
    stop_sequence: null,
    content: [{ type: 'text', text: jsonText, citations: null }],
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: 'standard',
    },
  } as Anthropic.Messages.Message;
}

interface SeededDoc {
  sourceDocId: string;
  caseId: string;
}

async function seedSourceDocument(trace_id: string): Promise<SeededDoc> {
  const orgId = SEED.ORG_HOLDING;
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
        original_content_hash: randomHash(),
        original_byte_size: 42,
        original_filename: 'routing-t4.pdf',
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
        document_type: 'unknown',
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
  return { sourceDocId: docId, caseId };
}

async function seedVendor(name: string): Promise<string> {
  const vendorId = crypto.randomUUID();
  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: SEED.ORG_HOLDING,
    name,
  });
  if (error) throw new Error(`seedVendor failed: ${error.message}`);
  return vendorId;
}

async function seedOpenBill(vendorId: string, billNumber: string): Promise<string> {
  const billId = crypto.randomUUID();
  const { error } = await db.from('bills').insert({
    bill_id: billId,
    org_id: SEED.ORG_HOLDING,
    vendor_id: vendorId,
    issue_date: '2026-01-15',
    lifecycle_state: 'approved_for_payment',
    amount_cad: 1000,
    bill_number: billNumber,
  });
  if (error) throw new Error(`seedOpenBill failed: ${error.message}`);
  return billId;
}

function mockOcr(lines: string[]) {
  vi.mocked(invokeSidecar as Mock).mockImplementation(
    createMockInvokeSidecar({
      failureMode: null,
      artifactOverride: {
        lines: lines.map((text, i) => ({
          text,
          bbox: [0, i * 20, 100, i * 20 + 20] as [number, number, number, number],
          confidence: 0.95,
        })),
      },
    }),
  );
}

async function caseRow(caseId: string) {
  const { data, error } = await db
    .from('document_cases')
    .select('state, current_relationship_candidate_id')
    .eq('id', caseId)
    .single();
  if (error) throw new Error(error.message);
  return data as { state: string; current_relationship_candidate_id: string | null };
}

async function transitionBefores(trace_id: string, caseId: string): Promise<string[]> {
  const { data, error } = await db
    .from('audit_log')
    .select('before_state')
    .eq('trace_id', trace_id)
    .eq('entity_id', caseId)
    .eq('action', 'document_case_transitioned');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => (r.before_state as { state: string }).state);
}

async function exceptionRows(caseId: string) {
  const { data, error } = await db
    .from('exception_queue_entries')
    .select('exception_reason')
    .eq('document_case_id', caseId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

describe('Wave 6 D2.1 T4 — INV-WORKFLOW-002 end-to-end routing (real ingestDocument)', () => {
  beforeEach(() => {
    suppressRouting = false;
    __setMockFixtureQueue(null);
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: vi.fn().mockResolvedValue({
        bytes: new TextEncoder().encode('stub bytes'),
        content_hash: 'stub-fetch-hash',
        provider: 'supabase_storage',
      }),
    });
  });

  afterEach(() => {
    __setMockFixtureQueue(null);
  });

  it('MATCHED via Scenario A: ends at needs_review with the plain matched→needs_review hand-off row, no exception', async () => {
    const trace_id = crypto.randomUUID();
    // Vendor only — NO bill. completeCandidate emits the Scenario-A
    // null-target inferred candidate deterministically; branch (a) sets the
    // head pointer; the null target falls through to the entry card.
    const vendorName = `Routing T4 Vendor ${crypto.randomUUID().slice(0, 8)}`;
    await seedVendor(vendorName);
    const { sourceDocId, caseId } = await seedSourceDocument(trace_id);

    mockOcr([
      `Invoice #T4-${crypto.randomUUID().slice(0, 8)}`,
      `Vendor: ${vendorName}`,
      'Date: 2026-01-15',
      'Total: $1,000.00',
    ]);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('parked_unposted');
    expect(result.failure_class).toBeNull();

    const row = await caseRow(caseId);
    expect(row.state).toBe('needs_review');
    // branch-(a) evidence: head pointer set by Subsystem 2.
    expect(row.current_relationship_candidate_id).not.toBeNull();

    const befores = await transitionBefores(trace_id, caseId);
    expect(befores).toContain('received');
    expect(befores).toContain('extracting');
    expect(befores).toContain('matched'); // the plain hand-off row

    expect(await exceptionRows(caseId)).toHaveLength(0);
  });

  it('UNMATCHED (branch c): ends at needs_review WITH the unmatched_router_candidate exception row', async () => {
    const trace_id = crypto.randomUUID();
    const { sourceDocId, caseId } = await seedSourceDocument(trace_id);

    // No sender label → D1's precision-biased heuristic emits nothing →
    // vendor_id null → Subsystem-1 :834 skip → N=0 → branch (c).
    mockOcr([
      `Invoice #T4-${crypto.randomUUID().slice(0, 8)}`,
      'Date: 2026-01-15',
      'Total: $123.45',
    ]);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Post-reconciliation, EVERY non-failure decision exit parks-for-review
    // — the status is deterministic regardless of which Stage-7 card the
    // unmatched path builds.
    expect(result.status).toBe('parked_unposted');
    expect(result.failure_class).toBeNull();

    expect((await caseRow(caseId)).state).toBe('needs_review');

    const befores = await transitionBefores(trace_id, caseId);
    expect(befores).toContain('received');
    expect(befores).toContain('extracting');
    expect(befores).not.toContain('matched'); // branch (c), not (a)

    const exceptions = await exceptionRows(caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]!.exception_reason).toBe('unmatched_router_candidate');
  });

  it('ATTACHMENT EXIT (bill seeded): the formerly-stranding third exit also ends at needs_review, status reconciled', async () => {
    const trace_id = crypto.randomUUID();
    const vendorName = `Routing T4 Vendor ${crypto.randomUUID().slice(0, 8)}`;
    const billNumber = `INV-T4-${crypto.randomUUID().slice(0, 8)}`; // unique per run
    const vendorId = await seedVendor(vendorName);
    await seedOpenBill(vendorId, billNumber);
    const { sourceDocId, caseId } = await seedSourceDocument(trace_id);

    mockOcr([
      `Invoice #${billNumber}`,
      `Vendor: ${vendorName}`,
      'Date: 2026-01-15',
      'Total: $1,000.00',
    ]);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // Kind-independent by design: whether Stage 7 resolves the candidate
    // to the real bill (attachment card — the pre-T4 stranding exit) or a
    // null target (entry card), the case routes and the status is the
    // reconciled park. 'committed' appearing here = bleed-stop regression.
    expect(result.status).toBe('parked_unposted');
    expect(result.failure_class).toBeNull();

    const row = await caseRow(caseId);
    expect(row.state).toBe('needs_review');
    expect(row.current_relationship_candidate_id).not.toBeNull(); // branch (a)

    const befores = await transitionBefores(trace_id, caseId);
    expect(befores).toContain('matched'); // the hand-off ran on this exit too

    expect(await exceptionRows(caseId)).toHaveLength(0);
  });

  it('PRECONDITION (loud failure): suppressed routing cannot silently park — pipeline_failed, case stranded at classified', async () => {
    const trace_id = crypto.randomUUID();
    const { sourceDocId, caseId } = await seedSourceDocument(trace_id);

    mockOcr([
      `Invoice #T4-${crypto.randomUUID().slice(0, 8)}`,
      'Date: 2026-01-15',
      'Total: $50.00',
    ]);

    suppressRouting = true; // simulate a routing regression
    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('pipeline_failed');
    expect(result.failure_class).not.toBeNull();
    expect((await caseRow(caseId)).state).toBe('classified');
  });

  it('UNKNOWN ROUTE: malformed Tier-C classification → unknown → needs_review with the unknown_document_type exception (ADR-0014 §7 realized)', async () => {
    const trace_id = crypto.randomUUID();
    const { sourceDocId, caseId } = await seedSourceDocument(trace_id);

    // No Tier-A classifier signal → Tier C fires → malformed fixture →
    // Zod rejects → Tier D fallthrough → documentType='unknown'.
    mockOcr(['Lorem ipsum dolor', 'generic text no signal']);
    __setMockFixtureQueue([
      buildAnthropicFixture(
        JSON.stringify({
          document_type: 'not_a_real_type',
          confidence: 0.9,
          rationale: 'malformed',
          fields: {},
        }),
      ),
    ]);

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('parked_unposted');
    expect(result.failure_class).toBeNull();

    expect((await caseRow(caseId)).state).toBe('needs_review');

    const befores = await transitionBefores(trace_id, caseId);
    expect(befores).toContain('received');
    expect(befores).toContain('extracting'); // advance-then-route (the RPC guard requires classified)

    const exceptions = await exceptionRows(caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]!.exception_reason).toBe('unknown_document_type');
  });
});
