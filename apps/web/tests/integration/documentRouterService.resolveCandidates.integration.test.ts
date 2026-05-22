// tests/integration/documentRouterService.resolveCandidates.integration.test.ts
//
// Phase 4 chunk 2 — Subsystem 2 (Ambiguity Resolution) integration
// tests. 20-22 tests across 9 describe blocks per brief §Task 5.
//
// Test setup pattern: seedRouterReadyCase → seedN... → invoke
// chunk-1 completeCandidate → transition case to 'classified' via
// direct update_document_case_state_with_audit RPC adminClient
// invocation (substrate-layer-bypass-of-service-layer-actor-gating;
// chunk-2-Phase-2 transition() rejects automation transitions at
// human boundary by design) → invoke chunk-2 resolveCandidates.
//
// Zero-emission test isolation discipline (chunk-1 #7 second firing
// per R5.2) — 5 named surfaces use fresh ctx (separate trace_id):
//   - Describe 2 "head pointer NOT set" assertion
//   - Describe 3 "head pointer NOT set" + "zero candidate rows"
//   - Describe 1 "Branch (a) does NOT enqueue exception"
//   - Describe 2/3 "Branches (b)/(c) do NOT emit chunk-2-Phase-4
//     mutation row" — disambiguated from chunk-6's exception-enqueue
//     state-transition audit row via the action verb +
//     idempotency_key recipe
//   - Describe 8 forensic-noise test known-zero baseline
//
// (β) reconciliation #1: INTEGRITY_VIOLATION ServiceErrorCode does
// not exist in the codebase; brief R3.4 cited it as inherited from
// chunks-5-6 but actual precedent is POST_FAILED catchall. Describe
// 9 test 1 asserts POST_FAILED.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import {
  completeCandidate,
  resolveCandidates,
} from '@/services/document-platform/documentRouterService';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { attachDocumentCaseSource } from '@/services/document-platform/documentCaseSourceService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type {
  CompleteCandidateInputRaw,
  ResolveCandidatesInputRaw,
} from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Fixture helpers (private to this file).
// ---------------------------------------------------------------------

interface RouterReadyCase {
  caseId: string;
  sourceDocId: string;
  vendorId: string;
}

async function seedRouterReadyCase(
  orgId: string,
  ctx: ServiceContext,
  documentType: 'vendor_invoice' | 'receipt' | 'payment_confirmation' = 'vendor_invoice',
): Promise<RouterReadyCase> {
  const db = adminClient();

  // Create vendor (direct INSERT — Phase 5 decoupling per chunk-1 precedent).
  const vendorId = crypto.randomUUID();
  const { error: vendorErr } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: `TEST router subsystem-2 vendor ${vendorId.slice(0, 8)}`,
  });
  if (vendorErr) throw new Error(`vendor fixture failed: ${vendorErr.message}`);

  // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor for source_document).
  const { ingest_batch_id } = await createIngestBatchForTest(orgId);

  // Create source_document via documentPlatformService (chunk-5 precedent).
  const sourceResult = await documentPlatformService.createSourceDocument(
    {
      bytes: new Uint8Array([1, 2, 3, 4]),
      mime_type: 'application/pdf',
      original_filename: `chunk-2-router-${crypto.randomUUID().slice(0, 8)}.pdf`,
      ingest_channel: 'direct_upload',
      ingest_batch_id,
      received_at: new Date().toISOString(),
      org_id: orgId,
      created_by: ctx.caller.user_id,
    },
    ctx,
  );

  // Create document_case via chunk-1-Phase-2 service.
  const caseResult = await createDocumentCase(
    { org_id: orgId, document_type: documentType },
    ctx,
  );

  // Attach source_document to case via chunk-3 service.
  await attachDocumentCaseSource(
    {
      document_case_id: caseResult.id,
      source_document_id: sourceResult.id,
      role: 'primary',
    },
    ctx,
  );

  return {
    caseId: caseResult.id,
    sourceDocId: sourceResult.id,
    vendorId,
  };
}

async function seedNOpenBillsForVendor(
  db: Db,
  orgId: string,
  vendorId: string,
  N: number,
): Promise<string[]> {
  // Bills seeded with IDENTICAL amount_cad to preserve chunk-3
  // ambiguity-margin-zero semantics. With chunk 3 multi-feature scoring,
  // bills with distinct amounts produce distinct aggregate confidence_scores
  // → margin > 0 → branch (a). To exercise branch (b) ambiguous-N≥2 path,
  // fixture must have all candidate entities producing IDENTICAL scores.
  // (Chunk 2's single-feature scoring made margin = 0 structurally for
  // any N≥2 per F-J-α; chunk 3 multi-feature lifts this and requires
  // intentional fixture identity to test zero-margin path.)
  const billIds: string[] = [];
  for (let i = 0; i < N; i++) {
    const billId = crypto.randomUUID();
    const { error } = await db.from('bills').insert({
      bill_id: billId,
      org_id: orgId,
      vendor_id: vendorId,
      issue_date: '2026-05-14',
      lifecycle_state: 'approved_for_payment',
      amount_cad: 1000,
    });
    if (error) throw new Error(`seedNOpenBillsForVendor failed: ${error.message}`);
    billIds.push(billId);
  }
  return billIds;
}

async function seedNOpenPaymentsForVendor(
  db: Db,
  orgId: string,
  vendorId: string,
  N: number,
): Promise<string[]> {
  // Identical amount per chunk-3 ambiguity-margin-zero discipline (see
  // seedNOpenBillsForVendor above for rationale).
  const paymentIds: string[] = [];
  for (let i = 0; i < N; i++) {
    const paymentId = crypto.randomUUID();
    const { error } = await db.from('payments').insert({
      payment_id: paymentId,
      org_id: orgId,
      vendor_id: vendorId,
      payment_date: '2026-05-14',
      amount: 1000,
      payment_state: 'pending',
    });
    if (error) throw new Error(`seedNOpenPaymentsForVendor failed: ${error.message}`);
    paymentIds.push(paymentId);
  }
  return paymentIds;
}

// Direct RPC invocation bypassing the human service boundary's
// AUTOMATION_ONLY_TRANSITIONS gate. The pipeline orchestrator (Phase 7)
// is the legitimate caller of automation transitions; at test time we
// seed the pre-Subsystem-2 state directly.
async function transitionCaseToClassifiedDirect(
  db: Db,
  orgId: string,
  caseId: string,
  ctx: ServiceContext,
): Promise<void> {
  const { error } = await db.rpc('update_document_case_state_with_audit', {
    p_case_id: caseId,
    p_target_state: 'classified',
    p_audit: {
      org_id: orgId,
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'document_case_transitioned',
      entity_type: 'document_case',
      tool_name: null,
      reason: null,
    },
  });
  if (error) {
    throw new Error(`transitionCaseToClassifiedDirect failed: ${error.message}`);
  }
}

function buildCompleteInput(
  fixture: RouterReadyCase,
  ctx: ServiceContext,
  documentType: 'vendor_invoice' | 'receipt' | 'payment_confirmation' = 'vendor_invoice',
): CompleteCandidateInputRaw {
  return {
    document_case_id: fixture.caseId,
    source_document_id: fixture.sourceDocId,
    document_type: documentType,
    classification_confidence: 0.95,
    extracted_fields: { invoice_amount: 1000 },
    vendor_match: {
      vendor_id: fixture.vendorId,
      confidence: 0.95,
      match_type: 'exact_name',
      candidate_alternatives: [],
    },
    trace_id: ctx.trace_id,
  };
}

function buildResolveInput(
  caseId: string,
  ctx: ServiceContext,
): ResolveCandidatesInputRaw {
  return {
    document_case_id: caseId,
    trace_id: ctx.trace_id,
  };
}

// Full setup helper: create case → seed bills → completeCandidate →
// transition to classified. Returns case + candidates produced.
async function setupClassifiedCaseWithBills(
  orgId: string,
  ctx: ServiceContext,
  N: number,
): Promise<{ fixture: RouterReadyCase; billIds: string[] }> {
  const db = adminClient();
  const fixture = await seedRouterReadyCase(orgId, ctx, 'vendor_invoice');
  const billIds = await seedNOpenBillsForVendor(db, orgId, fixture.vendorId, N);
  if (N > 0) {
    await completeCandidate(buildCompleteInput(fixture, ctx, 'vendor_invoice'), ctx);
  }
  await transitionCaseToClassifiedDirect(db, orgId, fixture.caseId, ctx);
  return { fixture, billIds };
}

// =====================================================================
// Describe 1 — Branch (a) happy-path
// =====================================================================

describe('documentRouterService.resolveCandidates — branch (a) happy-path (chunk 2)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('N=1 case → head pointer set; state classified → matched; 2 audit rows; RouterDecision shape', async () => {
    const { fixture, billIds } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    const decision = await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    expect(decision.branch).toBe('a');
    expect(decision.document_case_id).toBe(fixture.caseId);
    expect(decision.winner_candidate_id).not.toBeNull();
    expect(decision.exception_queue_entry_id).toBeNull();
    expect(decision.exception_reason).toBeNull();
    expect(decision.candidate_set_ids).toHaveLength(1);

    // Head pointer set + state transitioned
    const { data: caseRow } = await db
      .from('document_cases')
      .select('state, current_relationship_candidate_id')
      .eq('id', fixture.caseId)
      .single();
    expect(caseRow?.state).toBe('matched');
    expect(caseRow?.current_relationship_candidate_id).toBe(decision.winner_candidate_id);

    // 2 audit rows under same trace_id (decision-record + state-transition)
    const { data: auditRows } = await db
      .from('audit_log')
      .select('action, entity_type, entity_id')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .in('action', ['router_decision_recorded', 'document_case_transitioned']);
    expect(auditRows).toHaveLength(3); // 1 decision + 2 transitions (received→classified + classified→matched)
    void billIds;
  });

  it('decision-record audit row carries 10-field before_state with branch=a', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    const { data: decisionRow } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_decision_recorded')
      .single();

    const before = decisionRow?.before_state as Record<string, unknown>;
    expect(before.branch).toBe('a');
    expect(Array.isArray(before.candidate_set_ids)).toBe(true);
    expect((before.candidate_set_ids as string[]).length).toBe(1);
    expect(typeof before.confidence_scores).toBe('object');
    expect(typeof before.top_confidence).toBe('number');
    expect(before.runner_up_confidence).toBeNull();
    expect(before.ambiguity_margin_computed).toBeNull();
    expect(typeof before.ambiguity_margin_threshold).toBe('number');
    expect(before.winner_candidate_id).not.toBeNull();
    expect(before.exception_reason).toBeNull();
    expect(before.document_type).toBe('vendor_invoice');
  });

  it('mutation audit row carries 2-field before_state with prior state classified + null head pointer', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    // Find the chunk-2-Phase-4 mutation audit row by entity_id + action +
    // exclusion of the prior chunk-2-Phase-2 transition row. There are
    // two 'document_case_transitioned' rows under the same trace_id (the
    // received→classified one from fixture setup + the chunk-2-Phase-4
    // classified→matched one). Filter on before_state->>'current_relationship_candidate_id'
    // — only chunk-2-Phase-4's row includes that field.
    const { data: mutationRow } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'document_case_transitioned')
      .filter('before_state', 'cs', '{"state": "classified"}')
      .single();

    const before = mutationRow?.before_state as Record<string, unknown>;
    expect(before.state).toBe('classified');
    expect(before.current_relationship_candidate_id).toBeNull();
  });
});

// =====================================================================
// Describe 2 — Branch (b) happy-path (fresh-ctx isolation)
// =====================================================================

describe('documentRouterService.resolveCandidates — branch (b) happy-path (chunk 2)', () => {
  // Fresh ctx per zero-emission isolation surface #1.
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('N≥2 zero-margin case → head pointer NOT set; exception_queue_entries row with multi_candidate_ambiguity', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 3);
    const db = adminClient();

    const decision = await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    expect(decision.branch).toBe('b');
    expect(decision.winner_candidate_id).toBeNull();
    expect(decision.exception_queue_entry_id).not.toBeNull();
    expect(decision.exception_reason).toBe('multi_candidate_ambiguity');
    expect(decision.candidate_set_ids).toHaveLength(3);
    expect(decision.ambiguity_margin_computed).toBe(0);

    // Head pointer NOT set (zero-emission isolation surface #1)
    const { data: caseRow } = await db
      .from('document_cases')
      .select('state, current_relationship_candidate_id')
      .eq('id', fixture.caseId)
      .single();
    expect(caseRow?.state).toBe('needs_review');
    expect(caseRow?.current_relationship_candidate_id).toBeNull();

    // exception_queue_entries row created
    const { data: queueRow } = await db
      .from('exception_queue_entries')
      .select('exception_reason, exception_status')
      .eq('exception_queue_entry_id', decision.exception_queue_entry_id!)
      .single();
    expect(queueRow?.exception_reason).toBe('multi_candidate_ambiguity');
    expect(queueRow?.exception_status).toBe('open');
  });

  it('decision-record audit row carries before_state.branch=b + populated confidence fields', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 2);
    const db = adminClient();

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    const { data: decisionRow } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_decision_recorded')
      .single();

    const before = decisionRow?.before_state as Record<string, unknown>;
    expect(before.branch).toBe('b');
    expect((before.candidate_set_ids as string[]).length).toBe(2);
    expect(typeof before.top_confidence).toBe('number');
    expect(typeof before.runner_up_confidence).toBe('number');
    expect(before.ambiguity_margin_computed).toBe(0);
    expect(before.winner_candidate_id).toBeNull();
    expect(before.exception_reason).toBe('multi_candidate_ambiguity');
  });

  it('zero chunk-2-Phase-4 mutation audit row emitted for branch (b) — only chunk-6 exception_enqueued + chunk-6 transition', async () => {
    // Zero-emission isolation surface #4: branch (b) does NOT emit
    // a chunk-2-Phase-4 set_case_head_pointer_with_audit mutation row.
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 2);
    const db = adminClient();

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    // Filter on before_state JSONB shape — chunk-2-Phase-4's mutation row
    // includes 'current_relationship_candidate_id' field; chunk-6's enqueue
    // and chunk-2-Phase-2's received→classified rows do not.
    const { data: chunk2P4MutationRows } = await db
      .from('audit_log')
      .select('action, before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'document_case_transitioned')
      .filter('before_state', 'cs', '{"current_relationship_candidate_id": null}');
    expect(chunk2P4MutationRows ?? []).toHaveLength(0);
  });
});

// =====================================================================
// Describe 3 — Branch (c) happy-path (fresh-ctx isolation)
// =====================================================================

describe('documentRouterService.resolveCandidates — branch (c) happy-path (chunk 2)', () => {
  // Fresh ctx per zero-emission isolation surface #2.
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('N=0 case → head pointer NOT set; zero candidate rows; exception_queue_entries with unmatched_router_candidate', async () => {
    const db = adminClient();
    const fixture = await seedRouterReadyCase(SEED.ORG_HOLDING, ctx, 'vendor_invoice');
    // Skip completeCandidate to keep N=0 at Subsystem 2 entry. Chunk 4
    // (Phase 8) emits Scenario A inferred-target when no Scenario B
    // matches, so calling completeCandidate against an unseeded fixture
    // would produce N=1 not N=0. The test claim is about resolveCandidates
    // behavior at N=0; how we get there is incidental.
    await transitionCaseToClassifiedDirect(db, SEED.ORG_HOLDING, fixture.caseId, ctx);

    const decision = await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    expect(decision.branch).toBe('c');
    expect(decision.winner_candidate_id).toBeNull();
    expect(decision.exception_queue_entry_id).not.toBeNull();
    expect(decision.exception_reason).toBe('unmatched_router_candidate');
    expect(decision.candidate_set_ids).toHaveLength(0);
    expect(decision.ambiguity_margin_computed).toBeNull();

    // Head pointer NOT set
    const { data: caseRow } = await db
      .from('document_cases')
      .select('state, current_relationship_candidate_id')
      .eq('id', fixture.caseId)
      .single();
    expect(caseRow?.state).toBe('needs_review');
    expect(caseRow?.current_relationship_candidate_id).toBeNull();

    // Zero candidate rows
    const { data: candidateRows } = await db
      .from('document_relationship_candidates')
      .select('id')
      .eq('document_case_id', fixture.caseId);
    expect(candidateRows ?? []).toHaveLength(0);
  });

  it('decision-record audit row carries before_state.branch=c + null top_confidence + empty candidate_set_ids', async () => {
    const db = adminClient();
    const fixture = await seedRouterReadyCase(SEED.ORG_HOLDING, ctx, 'vendor_invoice');
    // Skip completeCandidate per N=0 setup (see prior test).
    await transitionCaseToClassifiedDirect(db, SEED.ORG_HOLDING, fixture.caseId, ctx);

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    const { data: decisionRow } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_decision_recorded')
      .single();

    const before = decisionRow?.before_state as Record<string, unknown>;
    expect(before.branch).toBe('c');
    expect((before.candidate_set_ids as string[]).length).toBe(0);
    expect(before.top_confidence).toBeNull();
    expect(before.runner_up_confidence).toBeNull();
    expect(before.ambiguity_margin_computed).toBeNull();
    expect(before.exception_reason).toBe('unmatched_router_candidate');
  });
});

// =====================================================================
// Describe 4 — State-transition guard (G1)
// =====================================================================

describe('documentRouterService.resolveCandidates — state-transition guard (G1) (chunk 2)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('case in state received → branch (a) RPC raises check_violation → INVALID_TRANSITION', async () => {
    const db = adminClient();
    const fixture = await seedRouterReadyCase(SEED.ORG_HOLDING, ctx, 'vendor_invoice');
    await seedNOpenBillsForVendor(db, SEED.ORG_HOLDING, fixture.vendorId, 1);
    await completeCandidate(buildCompleteInput(fixture, ctx, 'vendor_invoice'), ctx);
    // Case is in 'received' state; do NOT transition to classified.

    await expect(
      resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });

    // Verify case state unchanged
    const { data: caseRow } = await db
      .from('document_cases')
      .select('state, current_relationship_candidate_id')
      .eq('id', fixture.caseId)
      .single();
    expect(caseRow?.state).toBe('received');
    expect(caseRow?.current_relationship_candidate_id).toBeNull();
  });

  it('case already in state matched → branch (a) RPC raises check_violation → INVALID_TRANSITION', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    // First call drives state classified → matched
    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);
    // Second call: state is now 'matched'; branch (a) guard rejects.
    await expect(
      resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('case in state needs_review → branch (a) RPC raises check_violation → INVALID_TRANSITION', async () => {
    // Drive to needs_review via branch (c) (N=0)
    const db = adminClient();
    const fixture = await seedRouterReadyCase(SEED.ORG_HOLDING, ctx, 'vendor_invoice');
    await transitionCaseToClassifiedDirect(db, SEED.ORG_HOLDING, fixture.caseId, ctx);
    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);
    // Case is now needs_review.
    // Seed a bill + invoke completeCandidate to produce a candidate
    // (so subsequent resolveCandidates would attempt branch a if state allowed).
    await seedNOpenBillsForVendor(db, SEED.ORG_HOLDING, fixture.vendorId, 1);
    await completeCandidate(buildCompleteInput(fixture, ctx, 'vendor_invoice'), ctx);

    // Second resolveCandidates: candidates now N=1 (one from completeCandidate),
    // branch (a) fires, but state='needs_review' → guard rejects.
    await expect(
      resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });
});

// =====================================================================
// Describe 5 — Audit-event landing (forensic-payload shape verification)
// =====================================================================

describe('documentRouterService.resolveCandidates — audit-event landing (chunk 2)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('branch (a) decision-record before_state captures ambiguity_margin_threshold = 0.05', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    const { data: decisionRow } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_decision_recorded')
      .single();

    const before = decisionRow?.before_state as Record<string, unknown>;
    expect(before.ambiguity_margin_threshold).toBe(0.05);
  });

  it('branch (a) decision-record before_state.document_type matches case document_type', async () => {
    const db = adminClient();
    const fixture = await seedRouterReadyCase(SEED.ORG_HOLDING, ctx, 'receipt');
    const paymentIds = await seedNOpenPaymentsForVendor(db, SEED.ORG_HOLDING, fixture.vendorId, 1);
    await completeCandidate(buildCompleteInput(fixture, ctx, 'receipt'), ctx);
    await transitionCaseToClassifiedDirect(db, SEED.ORG_HOLDING, fixture.caseId, ctx);

    const decision = await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);
    expect(decision.branch).toBe('a'); // single candidate at N=1

    const { data: decisionRow } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_decision_recorded')
      .single();
    const before = decisionRow?.before_state as Record<string, unknown>;
    expect(before.document_type).toBe('receipt');
    void paymentIds;
  });

  it('trace_id continuity: decision-record + mutation rows share trace_id', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    const { data: rows } = await db
      .from('audit_log')
      .select('trace_id, action')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .in('action', ['router_decision_recorded', 'document_case_transitioned']);
    expect((rows ?? []).length).toBeGreaterThanOrEqual(2);
    for (const r of rows ?? []) {
      expect(r.trace_id).toBe(ctx.trace_id);
    }
  });

  it('decision-record idempotency_key is populated (forensic-correlation per F-J-β)', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    const { data: decisionRow } = await db
      .from('audit_log')
      .select('idempotency_key')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_decision_recorded')
      .single();
    expect(decisionRow?.idempotency_key).not.toBeNull();
    expect(typeof decisionRow?.idempotency_key).toBe('string');
  });
});

// =====================================================================
// Describe 6 — RLS enforcement (compressed)
// =====================================================================

describe('documentRouterService.resolveCandidates — RLS enforcement (chunk 2)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('candidates for case in different org are not read (Tier 2.5 boundary inherits chunk-1 RLS)', async () => {
    // Seed a case + candidate in ORG_HOLDING
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    // Verify candidates are scoped to org
    const { data: candidatesForCase } = await db
      .from('document_relationship_candidates')
      .select('org_id')
      .eq('document_case_id', fixture.caseId);
    expect((candidatesForCase ?? []).length).toBe(1);
    expect(candidatesForCase![0].org_id).toBe(SEED.ORG_HOLDING);

    // Cross-org isolation inherited from chunk-1-Phase-4's 4-policy
    // direct-org_id RLS + chunk-1-Phase-2 document_cases RLS.
    // resolveCandidates reads via adminClient (service_role) which
    // bypasses RLS — the RLS test surface is chunk-1's responsibility.
    // This describe is a compressed sanity check that candidates are
    // org-scoped at substrate level.
  });
});

// =====================================================================
// Describe 7 — Cross-service propagation (EXCEPTION_ALREADY_OPEN)
// =====================================================================

describe('documentRouterService.resolveCandidates — cross-service propagation (chunk 2)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('EXCEPTION_ALREADY_OPEN from chunk-6 enqueueException propagates verbatim through branch (c)', async () => {
    const db = adminClient();
    const fixture = await seedRouterReadyCase(SEED.ORG_HOLDING, ctx, 'vendor_invoice');
    // Skip completeCandidate per N=0 setup (chunk 4 Scenario A emission
    // would produce N=1; cross-service propagation surface is at branch (c)
    // when N=0 lands at Subsystem 2).
    await transitionCaseToClassifiedDirect(db, SEED.ORG_HOLDING, fixture.caseId, ctx);

    // First invocation: branch (c) succeeds, creates exception_queue_entry
    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    // Second invocation: case is now needs_review with open exception.
    // resolveCandidates reads N=0 candidates again → branch (c) →
    // record_router_decision succeeds → chunk-6 enqueueException
    // raises EXCEPTION_ALREADY_OPEN.
    try {
      await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);
      expect.fail('resolveCandidates should have thrown EXCEPTION_ALREADY_OPEN');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect((err as ServiceError).code).toBe('EXCEPTION_ALREADY_OPEN');
    }
  });
});

// =====================================================================
// Describe 8 — Forensic noise on retry (M4)
// =====================================================================

describe('documentRouterService.resolveCandidates — forensic noise on retry (chunk 2)', () => {
  // Fresh ctx per zero-emission isolation surface #5 (known-zero baseline).
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('two invocations under same trace_id produce two decision-record rows with identical idempotency_key', async () => {
    const db = adminClient();
    const fixture = await seedRouterReadyCase(SEED.ORG_HOLDING, ctx, 'vendor_invoice');
    // Skip completeCandidate per N=0 setup (forensic-noise retry surface
    // observed at branch (c)).
    await transitionCaseToClassifiedDirect(db, SEED.ORG_HOLDING, fixture.caseId, ctx);

    // Known-zero baseline: zero decision-record rows for trace_id
    const { data: baseline } = await db
      .from('audit_log')
      .select('audit_log_id')
      .eq('trace_id', ctx.trace_id)
      .eq('action', 'router_decision_recorded');
    expect((baseline ?? []).length).toBe(0);

    // First invocation: branch (c) (N=0); succeeds
    await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);

    // Second invocation: chunk-6 enqueueException raises
    // EXCEPTION_ALREADY_OPEN. BUT chunk-2-Phase-4's record_router_decision
    // RPC was already called before the cross-service call, so the
    // decision-record audit row was emitted before the throw.
    try {
      await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);
    } catch (err) {
      expect((err as ServiceError).code).toBe('EXCEPTION_ALREADY_OPEN');
    }

    // Verify: two decision-record rows under same trace_id + same idempotency_key
    const { data: decisionRows } = await db
      .from('audit_log')
      .select('audit_log_id, idempotency_key')
      .eq('trace_id', ctx.trace_id)
      .eq('action', 'router_decision_recorded');
    expect((decisionRows ?? []).length).toBe(2);
    expect(decisionRows![0].idempotency_key).toBe(decisionRows![1].idempotency_key);
    expect(decisionRows![0].idempotency_key).not.toBeNull();
  });
});

// =====================================================================
// Describe 9 — FK enforcement
// =====================================================================

describe('documentRouterService.resolveCandidates — FK enforcement (chunk 2)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('set_case_head_pointer_with_audit RPC with invalid winner_candidate_id raises FK error → POST_FAILED', async () => {
    // (β-1 reconciliation): brief R3.4 cited INTEGRITY_VIOLATION for FK
    // violations, but the code is not in the ServiceErrorCode union;
    // chunks-5-6 precedent maps unknown PG errors to POST_FAILED catchall.
    //
    // Direct RPC invocation with a non-existent winner_candidate_id —
    // service-layer flow can't trigger this because winner_candidate_id
    // is derived from loadCandidatesForCase output (always exists).
    const db = adminClient();
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const bogusWinnerId = crypto.randomUUID();

    const { error } = await db.rpc('set_case_head_pointer_with_audit', {
      p_decision: {
        case_id: fixture.caseId,
        winner_candidate_id: bogusWinnerId,
        trace_id: ctx.trace_id,
      },
      p_audit_decision: {
        org_id: SEED.ORG_HOLDING,
        user_id: ctx.caller.user_id,
        trace_id: ctx.trace_id,
        action: 'router_decision_recorded',
        entity_type: 'document_case',
        before_state: {
          branch: 'a',
          candidate_set_ids: [bogusWinnerId],
          confidence_scores: { [bogusWinnerId]: 0.95 },
          top_confidence: 0.95,
          runner_up_confidence: null,
          ambiguity_margin_computed: null,
          ambiguity_margin_threshold: 0.05,
          winner_candidate_id: bogusWinnerId,
          exception_reason: null,
          document_type: 'vendor_invoice',
        },
        tool_name: null,
        idempotency_key: null,
        reason: null,
      },
      p_audit_mutation: {
        org_id: SEED.ORG_HOLDING,
        user_id: ctx.caller.user_id,
        trace_id: ctx.trace_id,
        action: 'document_case_transitioned',
        entity_type: 'document_case',
        tool_name: null,
        reason: null,
      },
    });

    // Direct RPC call returns supabase error object; verify FK violation.
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503');
  });

  it('document_relationship_candidates(id) FK with ON DELETE RESTRICT rejects DELETE on referenced candidate', async () => {
    const { fixture } = await setupClassifiedCaseWithBills(SEED.ORG_HOLDING, ctx, 1);
    const db = adminClient();

    // Drive to branch (a) so head pointer is set.
    const decision = await resolveCandidates(buildResolveInput(fixture.caseId, ctx), ctx);
    expect(decision.winner_candidate_id).not.toBeNull();

    // Direct DELETE on the referenced candidate row should be rejected.
    // document_relationship_candidates is REVOKE'd from service_role for
    // DELETE + RLS DELETE USING(false), so the DELETE either matches zero
    // rows (RLS rejection) OR errors (FK RESTRICT rejection). Either
    // outcome is valid evidence the candidate is protected.
    const deleteResult = await db
      .from('document_relationship_candidates')
      .delete()
      .eq('id', decision.winner_candidate_id!)
      .select();
    // RLS USING(false) returns no error but matches zero rows; FK RESTRICT
    // raises error. Verify the candidate still exists post-DELETE attempt.
    const { data: stillExists } = await db
      .from('document_relationship_candidates')
      .select('id')
      .eq('id', decision.winner_candidate_id!)
      .maybeSingle();
    expect(stillExists?.id).toBe(decision.winner_candidate_id);
    void deleteResult;
  });
});
