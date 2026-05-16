// tests/integration/ingestSubstrate.integration.test.ts
//
// Phase 6 chunk 1 — substrate-level constraint tests for
// ingest_batches + document_jobs + source_documents.ingest_batch_id.
// Mirrors documentArtifactsSubstrate.integration.test.ts pattern:
// admin-client direct INSERT/UPDATE/DELETE to exercise Layer 1
// CHECK + NOT NULL + RLS-bypass-trigger contracts at the substrate
// boundary.
//
// Cross-org RLS isolation for these tables is covered by
// crossOrgRlsIsolation.test.ts under the table-parameterized fixture;
// this file focuses on the per-table immutability + DELETE-restriction
// + Layer 1 CHECK + NOT NULL contracts unique to chunk 6.1 substrate.
//
// Cleanup posture: substrate tests INSERT real rows that accumulate.
// All inserts use crypto.randomUUID() so cross-run collision is
// avoided; `pnpm db:reset` clears between runs.

import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

const TRACE_ID = '00000000-0000-0000-0000-0000ce10b001';

function freshBatch() {
  return {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    ingest_channel: 'drag_drop_pdf',
    received_at: new Date().toISOString(),
    channel_metadata: { drop_session_id: crypto.randomUUID() },
    trace_id: TRACE_ID,
    created_by: SEED.USER_CONTROLLER,
  };
}

async function insertBatch(db: ReturnType<typeof adminClient>) {
  const batch = freshBatch();
  const { error } = await db.from('ingest_batches').insert(batch);
  expect(error).toBeNull();
  return batch;
}

async function insertSourceDocumentInBatch(
  db: ReturnType<typeof adminClient>,
  batchId: string,
) {
  const doc = {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    legal_entity_id: SEED.ORG_HOLDING,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${SEED.ORG_HOLDING}/sources/test/${crypto.randomUUID()}.pdf`,
    original_content_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    original_byte_size: 42,
    original_filename: 'substrate-test.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf',
    ingest_batch_id: batchId,
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  };
  const { error } = await db.from('source_documents').insert(doc);
  expect(error).toBeNull();
  return doc;
}

async function insertCase(db: ReturnType<typeof adminClient>) {
  const c = {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    document_type: 'unknown',
    state: 'received',
    trace_id: TRACE_ID,
    created_by: SEED.USER_CONTROLLER,
  };
  const { error } = await db.from('document_cases').insert(c);
  expect(error).toBeNull();
  return c;
}

async function insertJob(
  db: ReturnType<typeof adminClient>,
  sourceDocId: string,
  caseId: string,
  batchId: string,
) {
  const job = {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    source_document_id: sourceDocId,
    document_case_id: caseId,
    ingest_batch_id: batchId,
    state: 'queued',
    trace_id: TRACE_ID,
    created_by: SEED.USER_CONTROLLER,
  };
  const { error } = await db.from('document_jobs').insert(job);
  expect(error).toBeNull();
  return job;
}

describe('Phase 6 chunk 1: ingest_batches substrate constraints', () => {
  it('Test 1: ingest_batches column-immutability trigger rejects UPDATE on immutable columns', async () => {
    const db = adminClient();
    const batch = await insertBatch(db);

    // Attempt to mutate an immutable column (org_id). Trigger raises
    // feature_not_supported regardless of service_role RLS bypass.
    const { error } = await db
      .from('ingest_batches')
      .update({ org_id: SEED.ORG_REAL_ESTATE })
      .eq('id', batch.id);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('ingest_batches column-immutability violation');
  });

  it('Test 2: ingest_batches BEFORE DELETE trigger rejects DELETE under service_role', async () => {
    const db = adminClient();
    const batch = await insertBatch(db);

    // service_role bypasses _no_delete RLS policy; BEFORE DELETE
    // trigger catches the bypass. Defense-in-depth for audit_log
    // referent integrity.
    const { error } = await db.from('ingest_batches').delete().eq('id', batch.id);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('ingest_batches is delete-restricted');
  });

  it('Test 3: ingest_batches accepts all 4 ingest_channel ENUM values at substrate level (no Layer 1 CHECK narrowing)', async () => {
    // Sub-Q1 reasoning + migration 135:152 comment "all values active
    // in v1": substrate accepts all 4 channels; service-level narrowing
    // (Layer 3 no-emit) happens at chunks 6.2/6.3 ingestionService.
    // Verify by inserting one of each value via admin-client.
    const db = adminClient();
    const channels: Array<'drag_drop_pdf' | 'forwarded_mailbox' | 'direct_upload' | 'api_ingest'> = [
      'drag_drop_pdf',
      'forwarded_mailbox',
      'direct_upload',
      'api_ingest',
    ];

    for (const channel of channels) {
      const batch = { ...freshBatch(), ingest_channel: channel };
      const { error } = await db.from('ingest_batches').insert(batch);
      expect(error).toBeNull();
    }
  });
});

describe('Phase 6 chunk 1: document_jobs substrate constraints', () => {
  it('Test 4: document_jobs column-immutability trigger rejects UPDATE on immutable columns', async () => {
    const db = adminClient();
    const batch = await insertBatch(db);
    const doc = await insertSourceDocumentInBatch(db, batch.id);
    const c = await insertCase(db);
    const job = await insertJob(db, doc.id, c.id, batch.id);

    // Attempt to mutate an immutable column (source_document_id).
    const { error } = await db
      .from('document_jobs')
      .update({ source_document_id: crypto.randomUUID() })
      .eq('id', job.id);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('document_jobs column-immutability violation');
  });

  it('Test 5: document_jobs column-immutability allows UPDATE on Phase 7-mutable columns (attempt_count, state if v1-active)', async () => {
    // Sub-Q3 lock: attempt_count is mutable post-INSERT with no
    // v1-active CHECK constraint. UPDATE attempt_count from 0 to a
    // non-zero value succeeds at substrate (Layer-3 service-no-emit
    // is the v1 discipline that keeps the value at 0 in service code).
    // State is also mutable but bound by Layer 1 CHECK to 'queued' at v1.
    const db = adminClient();
    const batch = await insertBatch(db);
    const doc = await insertSourceDocumentInBatch(db, batch.id);
    const c = await insertCase(db);
    const job = await insertJob(db, doc.id, c.id, batch.id);

    const { error } = await db
      .from('document_jobs')
      .update({ attempt_count: 1 })
      .eq('id', job.id);

    expect(error).toBeNull(); // mutable; no Layer 1 CHECK on attempt_count

    // Verify the update landed
    const { data: row } = await db
      .from('document_jobs')
      .select('attempt_count')
      .eq('id', job.id)
      .single();
    expect(row?.attempt_count).toBe(1);
  });

  it('Test 6: document_jobs BEFORE DELETE trigger rejects DELETE under service_role', async () => {
    const db = adminClient();
    const batch = await insertBatch(db);
    const doc = await insertSourceDocumentInBatch(db, batch.id);
    const c = await insertCase(db);
    const job = await insertJob(db, doc.id, c.id, batch.id);

    const { error } = await db.from('document_jobs').delete().eq('id', job.id);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('document_jobs is delete-restricted');
  });

  it('Test 7: document_jobs Layer 1 CHECK rejects INSERT with reserved enum value (state=\'in_flight\')', async () => {
    // document_jobs_state_v1_active CHECK narrows state to 'queued'.
    // ENUM accepts all 5 values; CHECK rejects 4 reserved values at v1.
    const db = adminClient();
    const batch = await insertBatch(db);
    const doc = await insertSourceDocumentInBatch(db, batch.id);
    const c = await insertCase(db);

    const job = {
      id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      source_document_id: doc.id,
      document_case_id: c.id,
      ingest_batch_id: batch.id,
      state: 'in_flight', // reserved
      trace_id: TRACE_ID,
      created_by: SEED.USER_CONTROLLER,
    };

    const { error } = await db.from('document_jobs').insert(job);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });
});

describe('Phase 6 chunk 2a: source_documents.ingest_batch_id column shape (Sub-Q4 Step C activated per migration 153)', () => {
  it('Test 8: source_documents.ingest_batch_id is NOT NULL with FK to ingest_batches (Step C activated at chunk 6.2a per migration 153)', async () => {
    // Sub-Q4 Step C activation 2026-05-15 (chunk 6.2a, migration 153):
    // ALTER COLUMN ingest_batch_id SET NOT NULL ships in same commit
    // as documentPlatformService.createSourceDocument signature
    // amendment + 30-caller refactor across 10 invoking test files
    // per RI-6 fifth-grain (existing-consumer-contract-conformance)
    // discipline. INSERT without ingest_batch_id raises NOT NULL
    // violation (PostgreSQL error code 23502).
    const db = adminClient();
    const doc = {
      id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      legal_entity_id: SEED.ORG_HOLDING,
      storage_provider: 'supabase_storage',
      original_storage_key: `org_${SEED.ORG_HOLDING}/sources/test/${crypto.randomUUID()}.pdf`,
      original_content_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      original_byte_size: 42,
      original_filename: 'not-null-batch-test.pdf',
      mime_type: 'application/pdf',
      ingest_channel: 'drag_drop_pdf',
      // ingest_batch_id intentionally omitted — verifies NOT NULL contract
      storage_status: 'available',
      received_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
    };

    const { data, error } = await db.from('source_documents').insert(doc);
    expect(error).not.toBeNull(); // NOT NULL constraint fires
    expect(error?.code).toBe('23502'); // PostgreSQL not_null_violation
    expect(data).toBeNull();
  });

  it('Test 9: source_documents.ingest_batch_id FK enforced when provided (references ingest_batches.id)', async () => {
    // FK constraint is active even though column is nullable. Passing
    // a non-existent batch_id raises foreign_key_violation.
    const db = adminClient();
    const doc = {
      id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      legal_entity_id: SEED.ORG_HOLDING,
      storage_provider: 'supabase_storage',
      original_storage_key: `org_${SEED.ORG_HOLDING}/sources/test/${crypto.randomUUID()}.pdf`,
      original_content_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      original_byte_size: 42,
      original_filename: 'bad-fk-test.pdf',
      mime_type: 'application/pdf',
      ingest_channel: 'drag_drop_pdf',
      ingest_batch_id: crypto.randomUUID(), // non-existent batch
      storage_status: 'available',
      received_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
    };

    const { error } = await db.from('source_documents').insert(doc);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503'); // FK violation
  });
});
