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
// Task 3 consumes:
// import { makeTestContext } from '../setup/makeTestContext';
import { sweepStrandedCases } from '@/agent/orchestrator/maintenance/sweepStrandedCases';
// Task 3 consumes:
// import { createDocumentCase } from '@/services/document-platform/documentCaseService';
// import { completeCandidate } from '@/services/document-platform/documentRouterService';
// import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
// import { attachDocumentCaseSource } from '@/services/document-platform/documentCaseSourceService';
// import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { SYSTEM_ACTOR_USER_ID } from '@/services/middleware/serviceContext';
// Task 3 consumes:
// import type { ServiceContext } from '@/services/middleware/serviceContext';

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
    const { data: audit } = await db
      .from('audit_log')
      .select('user_id, action')
      .eq('trace_id', c!.trace_id)
      .eq('entity_id', caseId)
      .eq('action', 'document_case_transitioned');
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
