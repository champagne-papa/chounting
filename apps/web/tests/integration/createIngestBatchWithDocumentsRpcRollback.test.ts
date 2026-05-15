// tests/integration/createIngestBatchWithDocumentsRpcRollback.test.ts
//
// Phase 6 chunk 1 — RPC atomicity round-trip tests for the
// create_ingest_batch_with_documents_with_audit RPC. Mirrors the
// createSourceDocumentRpcRollback.test.ts precedent: direct db.rpc()
// invocation bypasses the service layer (which doesn't ship at chunk 6.1
// per Reading B; service ingestionService lands at chunks 6.2/6.3) to
// exercise the RPC's BEGIN/COMMIT envelope and verify atomic rollback
// across DB-level rejection paths.
//
// The RPC composes 5 entity tables + 1 audit_log INSERT in a single
// transaction. Failures at any boundary roll back all 6 INSERTs.
//
// Test 1 (load-bearing) verifies drag-drop happy path: 1 batch + 2 docs +
// 2 cases + 0 case_sources + 2 jobs + 1 audit. Test 2 verifies
// forwarded_mailbox happy path with email_body role. Tests 3-6 verify
// rollback paths (FK violations, Layer 1 CHECK violations, reserved-enum
// rejections).
//
// Cleanup posture: rollback tests insert nothing on success-path (zero
// delta assertions). Happy-path tests INSERT real rows that accumulate
// across runs; `pnpm db:reset` clears between runs. Happy-path uses
// per-test random trace_id for audit-row isolation.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

const ABSENT_ORG_ID = '99999999-9999-9999-9999-999999999999';

interface CountSnapshot {
  batches: number;
  documents: number;
  cases: number;
  case_sources: number;
  jobs: number;
  audit: number;
}

async function captureCounts(
  db: ReturnType<typeof adminClient>,
): Promise<CountSnapshot> {
  const [batches, documents, cases, caseSources, jobs, audit] = await Promise.all([
    db.from('ingest_batches').select('id', { count: 'exact', head: true }),
    db.from('source_documents').select('id', { count: 'exact', head: true }),
    db.from('document_cases').select('id', { count: 'exact', head: true }),
    db.from('document_case_sources').select('id', { count: 'exact', head: true }),
    db.from('document_jobs').select('id', { count: 'exact', head: true }),
    db.from('audit_log').select('audit_log_id', { count: 'exact', head: true }),
  ]);
  return {
    batches: batches.count ?? 0,
    documents: documents.count ?? 0,
    cases: cases.count ?? 0,
    case_sources: caseSources.count ?? 0,
    jobs: jobs.count ?? 0,
    audit: audit.count ?? 0,
  };
}

function buildBatch(traceId: string, channel: 'drag_drop_pdf' | 'forwarded_mailbox' = 'drag_drop_pdf') {
  return {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    ingest_channel: channel,
    received_at: new Date().toISOString(),
    channel_metadata: channel === 'drag_drop_pdf'
      ? { drop_session_id: crypto.randomUUID(), chat_session_id: crypto.randomUUID(), user_id: SEED.USER_CONTROLLER }
      : { sender_address: 'allow@example.com', subject: 'invoice', message_id: '<msg@example.com>', raw_headers: {} },
    trace_id: traceId,
    created_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  };
}

function buildDocument(traceId: string, orgIdOverride?: string) {
  return {
    id: crypto.randomUUID(),
    org_id: orgIdOverride ?? SEED.ORG_HOLDING,
    legal_entity_id: SEED.ORG_HOLDING,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${SEED.ORG_HOLDING}/sources/test/${crypto.randomUUID()}.pdf`,
    original_content_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    original_byte_size: 42,
    original_filename: 'rpc-test.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf',
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  };
}

function buildCase(traceId: string) {
  return {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    document_type: 'unknown',
    state: 'received',
    trace_id: traceId,
    created_by: SEED.USER_CONTROLLER,
  };
}

function buildCaseSource(caseId: string, sourceDocId: string, traceId: string, role: string = 'email_body') {
  return {
    id: crypto.randomUUID(),
    document_case_id: caseId,
    source_document_id: sourceDocId,
    role,
    trace_id: traceId,
    created_by: SEED.USER_CONTROLLER,
  };
}

function buildJob(sourceDocId: string, caseId: string, traceId: string, stateOverride?: string) {
  return {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    source_document_id: sourceDocId,
    document_case_id: caseId,
    state: stateOverride ?? 'queued',
    trace_id: traceId,
    created_by: SEED.USER_CONTROLLER,
  };
}

function buildAudit(traceId: string) {
  return {
    org_id: SEED.ORG_HOLDING,
    user_id: SEED.USER_CONTROLLER,
    trace_id: traceId,
    action: 'ingest_batch_created',
    entity_type: 'ingest_batch',
    before_state: null,
    after_state_id: null,
    tool_name: null,
    idempotency_key: null,
    reason: null,
  };
}

describe('Phase 6 chunk 1: create_ingest_batch_with_documents_with_audit RPC rollback', () => {
  beforeAll(async () => {
    // No defensive cleanup — happy-path tests use per-test random trace_id;
    // rollback tests assert zero delta (no inserts). pnpm db:reset between
    // full runs handles any accumulated happy-path residue.
  });

  it('Test 1 [LOAD-BEARING]: drag-drop happy path — 1 batch + 2 docs + 2 cases + 0 case_sources + 2 jobs + 1 audit row', async () => {
    const db = adminClient();
    const traceId = crypto.randomUUID();
    const before = await captureCounts(db);

    const batch = buildBatch(traceId, 'drag_drop_pdf');
    const docs = [buildDocument(traceId), buildDocument(traceId)];
    const cases = docs.map(() => buildCase(traceId));
    const jobs = docs.map((doc, i) => buildJob(doc.id, cases[i].id, traceId));

    const { data, error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
      p_batch: batch,
      p_documents: docs,
      p_cases: cases,
      p_case_sources: [], // drag-drop writes zero case_sources at Phase 6
      p_jobs: jobs,
      p_audit: buildAudit(traceId),
    });

    expect(error).toBeNull();
    expect(data).toBe(batch.id);

    const after = await captureCounts(db);
    expect(after.batches).toBe(before.batches + 1);
    expect(after.documents).toBe(before.documents + 2);
    expect(after.cases).toBe(before.cases + 2);
    expect(after.case_sources).toBe(before.case_sources);
    expect(after.jobs).toBe(before.jobs + 2);
    expect(after.audit).toBe(before.audit + 1);

    // Audit row shape verification (batch grain; entity_type='ingest_batch')
    const { data: auditRows } = await db
      .from('audit_log')
      .select('action, entity_type, entity_id, before_state, trace_id')
      .eq('trace_id', traceId);

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].action).toBe('ingest_batch_created');
    expect(auditRows![0].entity_type).toBe('ingest_batch');
    expect(auditRows![0].entity_id).toBe(batch.id);
    expect(auditRows![0].before_state).toBeNull();
  });

  it('Test 2: forwarded_mailbox happy path — 1 batch + 3 docs (body + 2 attachments) + 1 case (per-email grain) + 1 case_source (email_body role) + 2 jobs + 1 audit row', async () => {
    const db = adminClient();
    const traceId = crypto.randomUUID();
    const before = await captureCounts(db);

    const batch = buildBatch(traceId, 'forwarded_mailbox');
    const emailBodyDoc = buildDocument(traceId);
    const attachmentDocs = [buildDocument(traceId), buildDocument(traceId)];
    const docs = [emailBodyDoc, ...attachmentDocs];
    const perEmailCase = buildCase(traceId);
    const cases = [perEmailCase]; // per-email grain
    const emailBodyCaseSource = buildCaseSource(perEmailCase.id, emailBodyDoc.id, traceId, 'email_body');
    const caseSources = [emailBodyCaseSource]; // only email_body role at Phase 6
    const jobs = attachmentDocs.map((doc) => buildJob(doc.id, perEmailCase.id, traceId));

    const { data, error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
      p_batch: batch,
      p_documents: docs,
      p_cases: cases,
      p_case_sources: caseSources,
      p_jobs: jobs,
      p_audit: buildAudit(traceId),
    });

    expect(error).toBeNull();
    expect(data).toBe(batch.id);

    const after = await captureCounts(db);
    expect(after.batches).toBe(before.batches + 1);
    expect(after.documents).toBe(before.documents + 3); // body + 2 attachments
    expect(after.cases).toBe(before.cases + 1); // per-email grain
    expect(after.case_sources).toBe(before.case_sources + 1); // email_body role only
    expect(after.jobs).toBe(before.jobs + 2); // per-attachment grain
    expect(after.audit).toBe(before.audit + 1);

    // Verify the email_body case_source links the body doc to the case
    const { data: linkRows } = await db
      .from('document_case_sources')
      .select('document_case_id, source_document_id, role')
      .eq('document_case_id', perEmailCase.id);

    expect(linkRows).toHaveLength(1);
    expect(linkRows![0].role).toBe('email_body');
    expect(linkRows![0].source_document_id).toBe(emailBodyDoc.id);
  });

  it('Test 3: FK violation on document.org_id rolls back all 6 INSERTs atomically', async () => {
    // Pass an org_id that is a valid UUID shape but absent from
    // organizations. source_documents.org_id NOT NULL REFERENCES
    // organizations(org_id) raises foreign_key_violation (23503)
    // inside the RPC envelope; the transaction rolls back, leaving
    // zero delta across all 6 tables (batch + docs + cases + case_sources
    // + jobs + audit).
    const db = adminClient();
    const traceId = crypto.randomUUID();
    const before = await captureCounts(db);

    const batch = buildBatch(traceId);
    const docs = [buildDocument(traceId, ABSENT_ORG_ID)]; // bad org_id
    const cases = [buildCase(traceId)];
    const jobs = [buildJob(docs[0].id, cases[0].id, traceId)];

    const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
      p_batch: batch,
      p_documents: docs,
      p_cases: cases,
      p_case_sources: [],
      p_jobs: jobs,
      p_audit: buildAudit(traceId),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503');

    const after = await captureCounts(db);
    expect(after).toEqual(before);
  });

  it('Test 4: Layer 1 CHECK violation on document_jobs.state (reserved enum value) rolls back all 6 INSERTs atomically', async () => {
    // document_jobs_state_v1_active CHECK narrows state to 'queued'.
    // 'in_flight' is a valid enum member but reserved at v1; INSERT
    // raises check_violation (23514). Sub-Q3 lock test.
    const db = adminClient();
    const traceId = crypto.randomUUID();
    const before = await captureCounts(db);

    const batch = buildBatch(traceId);
    const docs = [buildDocument(traceId)];
    const cases = [buildCase(traceId)];
    const jobs = [buildJob(docs[0].id, cases[0].id, traceId, 'in_flight')]; // reserved state

    const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
      p_batch: batch,
      p_documents: docs,
      p_cases: cases,
      p_case_sources: [],
      p_jobs: jobs,
      p_audit: buildAudit(traceId),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');

    const after = await captureCounts(db);
    expect(after).toEqual(before);
  });

  it('Test 5: FK violation on document_jobs.document_case_id rolls back all 6 INSERTs atomically', async () => {
    // Pass a document_case_id that doesn't exist in document_cases.
    // FK constraint raises foreign_key_violation (23503).
    const db = adminClient();
    const traceId = crypto.randomUUID();
    const before = await captureCounts(db);

    const batch = buildBatch(traceId);
    const docs = [buildDocument(traceId)];
    const cases = [buildCase(traceId)];
    // Job references a case_id that wasn't INSERTed
    const jobs = [{
      ...buildJob(docs[0].id, crypto.randomUUID(), traceId),
    }];

    const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
      p_batch: batch,
      p_documents: docs,
      p_cases: cases,
      p_case_sources: [],
      p_jobs: jobs,
      p_audit: buildAudit(traceId),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503');

    const after = await captureCounts(db);
    expect(after).toEqual(before);
  });

  it('Test 6: Layer 1 CHECK violation on document_case_sources.role (reserved value) rolls back all 6 INSERTs atomically', async () => {
    // document_case_sources_role_v1_active CHECK admits primary,
    // supporting, email_body, payment_evidence. 'superseded_source'
    // is a valid enum member (per migration 145:52) but reserved.
    // INSERT raises check_violation (23514). Verifies Layer 1
    // CHECK enforcement on a reserved-not-emitted role per RI
    // Flag 5 forward-pointer (Phase 6 writes only email_body).
    const db = adminClient();
    const traceId = crypto.randomUUID();
    const before = await captureCounts(db);

    const batch = buildBatch(traceId, 'forwarded_mailbox');
    const emailBodyDoc = buildDocument(traceId);
    const docs = [emailBodyDoc];
    const perEmailCase = buildCase(traceId);
    const cases = [perEmailCase];
    // Use reserved role 'superseded_source' to trigger CHECK
    const caseSources = [buildCaseSource(perEmailCase.id, emailBodyDoc.id, traceId, 'superseded_source')];

    const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
      p_batch: batch,
      p_documents: docs,
      p_cases: cases,
      p_case_sources: caseSources,
      p_jobs: [],
      p_audit: buildAudit(traceId),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');

    const after = await captureCounts(db);
    expect(after).toEqual(before);
  });
});
