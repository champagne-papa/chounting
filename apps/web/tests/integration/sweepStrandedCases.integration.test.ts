// Wave 6 D2.3 — sweepStrandedCases integration tests.
//
// Spec: docs/09_briefs/v1/specs/2026-06-03-d2-3-stranded-case-sweep-design.md
// Seeding follows routingTerminalDisposition.integration.test.ts Pattern A
// (create_ingest_batch_with_documents_with_audit RPC — explicit state +
// content-hash control) and documentRouterService.resolveCandidates
// .integration.test.ts Pattern B (service-layer + bills + completeCandidate)
// for the candidate-bearing bucket.
//
// Isolation: every sweep call passes document_case_ids (own cases only) +
// staleness_minutes: 0 — document_cases rows accumulate across runs
// (BEFORE-DELETE-protected), so an unscoped execute would mutate other
// tests' stranded fixtures. audit_log / candidates / source_documents are
// append-only (integration-test rules §3.2/§3.3): no DELETE cleanup.

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { sweepStrandedCases } from '@/agent/orchestrator/maintenance/sweepStrandedCases';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { completeCandidate } from '@/services/document-platform/documentRouterService';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { attachDocumentCaseSource } from '@/services/document-platform/documentCaseSourceService';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { SYSTEM_ACTOR_USER_ID } from '@/services/middleware/serviceContext';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { IngestDocumentOutput } from '@/agent/orchestrator/extraction/types';

const db = adminClient();

function randomHash(): string {
  return crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex');
}

// --- Pattern A seeding: full-RPC seed with explicit state + hash control ---

interface SeededDoc {
  sourceDocId: string;
  caseId: string;
}

async function seedStrandedCase(
  trace_id: string,
  opts: {
    state?: 'received' | 'extracting' | 'classified' | 'matched' | 'needs_review';
    content_hash?: string;
  } = {},
): Promise<SeededDoc> {
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
        original_content_hash: opts.content_hash ?? randomHash(),
        original_byte_size: 42,
        original_filename: 'sweep-d2-3.pdf',
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

  // Direct-RPC state hop to the stranding shape under test (the seed RPC
  // inserts at 'received'; the audit-paired transition RPC validates
  // row-existence + Layer-1 CHECK only — matrix legality is app-side, so
  // tests may jump directly to the stranded state).
  if (opts.state && opts.state !== 'received') {
    const { error: trErr } = await db.rpc('update_document_case_state_with_audit', {
      p_case_id: caseId,
      p_target_state: opts.state,
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

async function caseState(caseId: string): Promise<string> {
  const { data, error } = await db
    .from('document_cases')
    .select('state')
    .eq('id', caseId)
    .single();
  if (error || !data) throw new Error(`caseState read failed: ${error?.message}`);
  return data.state as string;
}

// =====================================================================
// Describe 1 — eligibility + dry-run
// =====================================================================

describe('sweepStrandedCases — eligibility + dry-run', () => {
  it('skips a fresh case under the default 30-minute staleness threshold', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId } = await seedStrandedCase(trace_id);

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      // staleness_minutes omitted → default 30; the just-seeded case is fresh.
    });

    expect(report.dry_run).toBe(true);
    expect(report.cases.find((c) => c.document_case_id === caseId)).toBeUndefined();
    expect(await caseState(caseId)).toBe('received');
  });

  it('skips terminal/human-side states (needs_review is not eligible)', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId } = await seedStrandedCase(trace_id, { state: 'needs_review' });

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
    });

    expect(report.cases.find((c) => c.document_case_id === caseId)).toBeUndefined();
  });

  it('dry-run (default) buckets without writing: B1 for matched, B3 for candidate-less', async () => {
    const t1 = crypto.randomUUID();
    const t2 = crypto.randomUUID();
    const matched = await seedStrandedCase(t1, { state: 'matched' });
    const received = await seedStrandedCase(t2); // received, no candidates, unique hash

    const report = await sweepStrandedCases({
      document_case_ids: [matched.caseId, received.caseId],
      staleness_minutes: 0,
    });

    expect(report.dry_run).toBe(true);
    const m = report.cases.find((c) => c.document_case_id === matched.caseId);
    const r = report.cases.find((c) => c.document_case_id === received.caseId);
    expect(m).toMatchObject({ bucket: 'B1', outcome: 'bucketed_dry_run' });
    expect(r).toMatchObject({ bucket: 'B3', outcome: 'bucketed_dry_run' });

    // Zero writes — the load-bearing safety assertion.
    expect(await caseState(matched.caseId)).toBe('matched');
    expect(await caseState(received.caseId)).toBe('received');
  });

  it('dry-run buckets B3-D for a candidate-less content-dup (dedup pre-check is read-only)', async () => {
    const hash = randomHash();
    const original = await seedStrandedCase(crypto.randomUUID(), { content_hash: hash });
    const dup = await seedStrandedCase(crypto.randomUUID(), { content_hash: hash });
    void original;

    const report = await sweepStrandedCases({
      document_case_ids: [dup.caseId],
      staleness_minutes: 0,
    });

    const d = report.cases.find((c) => c.document_case_id === dup.caseId);
    expect(d).toMatchObject({ bucket: 'B3-D', outcome: 'bucketed_dry_run' });
    expect(await caseState(dup.caseId)).toBe('received');
  });
});

// =====================================================================
// Describe 2 — B1: matched-stranding hand-off (execute)
// =====================================================================

describe('sweepStrandedCases — B1 matched hand-off', () => {
  it('advances a stranded matched case to needs_review with sweep-actor attribution', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId } = await seedStrandedCase(trace_id, { state: 'matched' });

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({ bucket: 'B1', outcome: 'handed_off' });
    expect(await caseState(caseId)).toBe('needs_review');

    // Audit attribution: the sweep's per-case trace + Path-X service
    // account (ADR-0007 Q78 — system actors write the joinable id).
    const { data: audit, error: auditQueryErr } = await db
      .from('audit_log')
      .select('user_id, action')
      .eq('trace_id', c!.trace_id)
      .eq('entity_id', caseId)
      .eq('action', 'document_case_transitioned');
    expect(auditQueryErr).toBeNull();
    expect(audit).toHaveLength(1);
    expect(audit![0]!.user_id).toBe(SYSTEM_ACTOR_USER_ID);
  });

  it('is idempotent: a second sweep of the same case is a no-op (case past eligibility)', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId } = await seedStrandedCase(trace_id, { state: 'matched' });

    await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });
    const second = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    // needs_review is not an eligible state — the case simply no longer
    // appears. No double hand-off possible.
    expect(second.cases.find((x) => x.document_case_id === caseId)).toBeUndefined();
    expect(await caseState(caseId)).toBe('needs_review');
  });
});

// --- Pattern B seeding: candidate-bearing stranding (pre-D2.1 backlog shape) ---

interface CandidateBearingCase {
  caseId: string;
  sourceDocId: string;
  vendorId: string;
  billIds: string[];
}

async function seedCandidateBearingStranding(
  ctx: ServiceContext,
  nBills: number,
): Promise<CandidateBearingCase> {
  const orgId = SEED.ORG_HOLDING;

  // Vendor (direct INSERT — Phase 5 decoupling per chunk-1 precedent).
  const vendorId = crypto.randomUUID();
  const { error: vendorErr } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: `TEST d2-3 sweep vendor ${vendorId.slice(0, 8)}`,
  });
  if (vendorErr) throw new Error(`vendor fixture failed: ${vendorErr.message}`);

  // Bills with IDENTICAL amount_cad — N≥2 must produce identical
  // aggregate confidence scores → margin 0 → branch (b). (Chunk-3
  // multi-feature scoring discipline; see resolveCandidates test
  // seedNOpenBillsForVendor rationale.)
  const billIds: string[] = [];
  for (let i = 0; i < nBills; i++) {
    const billId = crypto.randomUUID();
    const { error } = await db.from('bills').insert({
      bill_id: billId,
      org_id: orgId,
      vendor_id: vendorId,
      issue_date: '2026-06-04',
      lifecycle_state: 'approved_for_payment',
      amount_cad: 1000,
    });
    if (error) throw new Error(`bill fixture failed: ${error.message}`);
    billIds.push(billId);
  }

  // Source document + case + attach (service-layer, chunk-5/chunk-1/chunk-3 precedents).
  const { ingest_batch_id } = await createIngestBatchForTest(orgId);
  const sourceResult = await documentPlatformService.createSourceDocument(
    {
      bytes: new Uint8Array([1, 2, 3, 4]),
      mime_type: 'application/pdf',
      original_filename: `d2-3-sweep-${crypto.randomUUID().slice(0, 8)}.pdf`,
      ingest_channel: 'direct_upload',
      ingest_batch_id,
      received_at: new Date().toISOString(),
      org_id: orgId,
      created_by: ctx.caller.user_id,
    },
    ctx,
  );
  const caseResult = await createDocumentCase(
    { org_id: orgId, document_type: 'vendor_invoice' },
    ctx,
  );
  await attachDocumentCaseSource(
    {
      document_case_id: caseResult.id,
      source_document_id: sourceResult.id,
      role: 'primary',
    },
    ctx,
  );

  // document_jobs row — the sweep's reverse join needs it.
  // ingest_batch_id is NOT NULL on document_jobs; pass the batch created above.
  const { error: djErr } = await db.from('document_jobs').insert({
    id: crypto.randomUUID(),
    org_id: orgId,
    source_document_id: sourceResult.id,
    document_case_id: caseResult.id,
    ingest_batch_id,
    state: 'queued',
    trace_id: ctx.trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (djErr) throw new Error(`document_jobs fixture failed: ${djErr.message}`);

  // Candidate emission via the REAL path (completeCandidate works at
  // 'received' — same as the resolveCandidates test helper, which calls
  // it before the classified transition). Then STOP: no resolveCandidates,
  // no state advance — the pre-D2.1 backlog stranding shape.
  await completeCandidate(
    {
      document_case_id: caseResult.id,
      source_document_id: sourceResult.id,
      document_type: 'vendor_invoice',
      classification_confidence: 0.95,
      extracted_fields: { amount: 1000 },
      vendor_match: {
        vendor_id: vendorId,
        confidence: 0.95,
        match_type: 'exact_name',
        candidate_alternatives: [],
      },
      trace_id: ctx.trace_id,
    },
    ctx,
  );

  return {
    caseId: caseResult.id,
    sourceDocId: sourceResult.id,
    vendorId,
    billIds,
  };
}

// =====================================================================
// Describe 3 — B2: candidate-bearing re-resolve (execute)
// =====================================================================

describe('sweepStrandedCases — B2 candidate-bearing recovery', () => {
  it('N=1: advances received→classified, resolves branch (a), hands off to needs_review', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const { caseId } = await seedCandidateBearingStranding(ctx, 1);
    expect(await caseState(caseId)).toBe('received'); // stranding shape

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({
      bucket: 'B2',
      outcome: 'resolved_matched_handed_off',
    });
    expect(await caseState(caseId)).toBe('needs_review');

    // The decision is REAL: head pointer set by branch (a).
    const { data: caseRow, error: caseQueryErr } = await db
      .from('document_cases')
      .select('current_relationship_candidate_id')
      .eq('id', caseId)
      .single();
    expect(caseQueryErr).toBeNull();
    expect(caseRow!.current_relationship_candidate_id).not.toBeNull();
  });

  it('N=2 identical: resolves branch (b) — real multi_candidate_ambiguity exception, needs_review', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const { caseId } = await seedCandidateBearingStranding(ctx, 2);

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({
      bucket: 'B2',
      outcome: 'resolved_exception',
      exception_reason: 'multi_candidate_ambiguity',
    });
    expect(await caseState(caseId)).toBe('needs_review');

    const { data: exRows, error: exQueryErr } = await db
      .from('exception_queue_entries')
      .select('exception_reason, exception_status')
      .eq('document_case_id', caseId);
    expect(exQueryErr).toBeNull();
    expect(exRows).toHaveLength(1);
    expect(exRows![0]).toMatchObject({
      exception_reason: 'multi_candidate_ambiguity',
      exception_status: 'open',
    });
  });

  it('EXCEPTION_ALREADY_OPEN + state still classified → anomaly bucket, no mutation, no loop', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    // N=2 → branch (b) → enqueueException — which will hit the
    // pre-inserted open exception's partial-UNIQUE and throw 23505 →
    // EXCEPTION_ALREADY_OPEN.
    const { caseId } = await seedCandidateBearingStranding(ctx, 2);

    // Construct the atomicity-violating shape directly (it cannot arise
    // through the RPC — that is the point of the test).
    const { error: exErr } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: caseId,
      exception_reason: 'multi_candidate_ambiguity',
      trace_id: crypto.randomUUID(),
      created_by: SEED.USER_CONTROLLER,
    });
    if (exErr) throw new Error(`exception fixture failed: ${exErr.message}`);

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({
      bucket: 'anomaly',
      outcome: 'anomaly_open_exception_non_terminal',
    });
    // NOT auto-repaired: state advanced to classified by the honest B2
    // advance (the work demonstrably happened), but NOT to needs_review.
    expect(await caseState(caseId)).toBe('classified');

    // Loop-safety: a second sweep re-buckets B2 → same anomaly outcome,
    // not an error cascade and not a re-run.
    const second = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });
    const c2 = second.cases.find((x) => x.document_case_id === caseId);
    expect(c2).toMatchObject({
      bucket: 'anomaly',
      outcome: 'anomaly_open_exception_non_terminal',
    });
  });
});

// =====================================================================
// Describe 4 — B3/B4 via DI seam + B3-D execute
// =====================================================================

describe('sweepStrandedCases — B3 re-run dispatch, B4 failure, B3-D carve-out', () => {
  it('B3: dispatches the injected runner with org/doc/fresh-trace and reports rerun_recovered', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId, sourceDocId } = await seedStrandedCase(trace_id); // received, candidate-less, unique hash

    const calls: Array<{ org_id: string; source_document_id: string; trace_id: string }> = [];
    const report = await sweepStrandedCases(
      { document_case_ids: [caseId], staleness_minutes: 0, execute: true },
      {
        runIngest: async (input): Promise<IngestDocumentOutput> => {
          calls.push(input);
          return {
            status: 'parked_unposted',
            pipeline_trace: [],
            proposal_id: null,
            failure_class: null,
          };
        },
      },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
    });
    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({ bucket: 'B3', outcome: 'rerun_recovered' });
    // The stub's trace must be the case's fresh per-case trace from the report.
    expect(calls[0]!.trace_id).toBe(c!.trace_id);
  });

  it('B4: pipeline_failed is reported with failure_class and the case stays re-eligible', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId } = await seedStrandedCase(trace_id);

    const failingRunner = async (): Promise<IngestDocumentOutput> => ({
      status: 'pipeline_failed' as const,
      pipeline_trace: [],
      proposal_id: null,
      failure_class: 'transient_exhausted' as const,
    });

    const first = await sweepStrandedCases(
      { document_case_ids: [caseId], staleness_minutes: 0, execute: true },
      { runIngest: failingRunner },
    );
    const c1 = first.cases.find((x) => x.document_case_id === caseId);
    expect(c1).toMatchObject({
      bucket: 'B4',
      outcome: 'pipeline_failed',
      failure_class: 'transient_exhausted',
    });
    expect(await caseState(caseId)).toBe('received');

    // Re-eligible: the next sweep buckets it B3 again.
    const second = await sweepStrandedCases(
      { document_case_ids: [caseId], staleness_minutes: 0 },
    );
    const c2 = second.cases.find((x) => x.document_case_id === caseId);
    expect(c2).toMatchObject({ bucket: 'B3', outcome: 'bucketed_dry_run' });
  });

  it('B3-D execute: content-dup reports dedup_carveout, zero writes, runner NEVER invoked (no loop)', async () => {
    const hash = randomHash();
    await seedStrandedCase(crypto.randomUUID(), { content_hash: hash }); // the original
    const dup = await seedStrandedCase(crypto.randomUUID(), { content_hash: hash });

    let runnerInvoked = false;
    const report = await sweepStrandedCases(
      { document_case_ids: [dup.caseId], staleness_minutes: 0, execute: true },
      {
        runIngest: async (): Promise<IngestDocumentOutput> => {
          runnerInvoked = true;
          return {
            status: 'dedup_short_circuit',
            pipeline_trace: [],
            proposal_id: null,
            failure_class: null,
          };
        },
      },
    );

    expect(runnerInvoked).toBe(false); // the pre-check catches it BEFORE the re-run
    const c = report.cases.find((x) => x.document_case_id === dup.caseId);
    expect(c).toMatchObject({ bucket: 'B3-D', outcome: 'dedup_carveout' });
    expect(await caseState(dup.caseId)).toBe('received');
  });

  it('B3 cap: max_b3_reruns bounds re-runs; the excess B3 case is b3_cap_skipped and stays re-eligible', async () => {
    const a = await seedStrandedCase(crypto.randomUUID()); // received, candidate-less, unique hash → B3
    const b = await seedStrandedCase(crypto.randomUUID()); // ditto → B3

    let runs = 0;
    const report = await sweepStrandedCases(
      {
        document_case_ids: [a.caseId, b.caseId],
        staleness_minutes: 0,
        execute: true,
        max_b3_reruns: 1,
      },
      {
        runIngest: async (): Promise<IngestDocumentOutput> => {
          runs += 1;
          return {
            status: 'parked_unposted',
            pipeline_trace: [],
            proposal_id: null,
            failure_class: null,
          };
        },
      },
    );

    // Exactly ONE actual re-run (the spend); the second B3 case is capped.
    expect(runs).toBe(1);
    expect(report.b3_reruns_executed).toBe(1);

    const outcomes = [a.caseId, b.caseId]
      .map((id) => report.cases.find((x) => x.document_case_id === id)!.outcome)
      .sort();
    expect(outcomes).toEqual(['b3_cap_skipped', 'rerun_recovered']);

    // The capped case stays re-eligible: a follow-up dry-run still buckets it B3.
    const capped = report.cases.find((x) => x.outcome === 'b3_cap_skipped')!;
    const followup = await sweepStrandedCases({
      document_case_ids: [capped.document_case_id],
      staleness_minutes: 0,
    });
    expect(followup.cases[0]).toMatchObject({
      bucket: 'B3',
      outcome: 'bucketed_dry_run',
    });
  });
});
