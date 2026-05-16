// tests/integration/createSourceDocumentRpcRollback.test.ts
//
// Phase 1.Storage chunk N+M — RPC atomicity round-trip tests for
// chunk N's create_source_document_with_audit RPC. Mirrors the
// postJournalEntryRpcRollback.test.ts precedent (S27 MT-01-rpc):
// direct db.rpc() invocation bypasses the service layer to exercise
// the RPC's BEGIN/COMMIT envelope and verify atomic rollback of
// both source_documents + audit_log INSERTs across DB-level
// rejection paths.
//
// Test 1 [LOAD-BEARING]: FK violation on org_id verifies the
// rollback *mechanism*. The other tests verify specific failure
// modes. If Test 1 passes — the FK constraint raises
// foreign_key_violation inside the RPC envelope, BEGIN/COMMIT
// rolls back cleanly with zero orphans across both tables — the
// same mechanism generalizes to every other DB-level rejection in
// the rollback chain. Founder-review scrutiny should weight Test
// 1 accordingly per S27 precedent §11.
//
// Direct RPC invocation rationale: some failure modes (CHECK
// violation on storage_status, NOT NULL on required field) cannot
// be exercised through the service layer because the service hard-
// codes 'available' as storage_status (line 152) and constructs
// fully-formed payloads. Direct RPC is the only way to validate
// the rollback semantic at the rejection boundary.
//
// Cleanup posture: rollback tests insert nothing on success-path
// (every test asserts zero-delta; if a test fails to roll back,
// it would leave orphan rows that subsequent test runs detect).
// `pnpm db:reset` between full runs handles any cross-run residue.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';

const TRACE_ID = '00000000-0000-0000-0000-000000000aaa';

interface CountSnapshot {
  source_documents: number;
  audit: number;
}

async function captureCounts(
  db: ReturnType<typeof adminClient>,
): Promise<CountSnapshot> {
  const [docs, audit] = await Promise.all([
    db
      .from('source_documents')
      .select('id', { count: 'exact', head: true }),
    db
      .from('audit_log')
      .select('audit_log_id', { count: 'exact', head: true }),
  ]);
  return {
    source_documents: docs.count ?? 0,
    audit: audit.count ?? 0,
  };
}

// sentinelBatchId is populated in beforeAll. Used as the default
// ingest_batch_id for all RPC payloads in this file (chunk 6.2a Sub-Q4
// Step C activation requires NOT NULL). For FK-violation Test 1 (org_id
// absent), the cross-org reference (batch in SEED.ORG_HOLDING but
// source_document for absentOrgId) is structurally allowed at the FK
// layer (no inter-row org_id matching constraint between
// ingest_batches and source_documents); the org_id FK fires first as
// the test intends. Per chunk 6.2a friction-journal pre-draft (D)-filter:
// Grain-5-completeness gap codification — the chunk 6.2a brief's
// Grain 5 enumeration scoped to service-layer callers and missed
// direct-RPC-invocation tests; this file is the second instance.
let sentinelBatchId: string;

function buildSourceDocumentPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    org_id: SEED.ORG_HOLDING,
    legal_entity_id: SEED.ORG_HOLDING,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${SEED.ORG_HOLDING}/sources/test/key.pdf`,
    original_content_hash:
      '0000000000000000000000000000000000000000000000000000000000000000',
    original_byte_size: 42,
    original_filename: 'rollback-test.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'direct_upload',
    ingest_batch_id: sentinelBatchId,
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
    ...overrides,
  };
}

function buildAuditPayload(overrides: Record<string, unknown> = {}) {
  return {
    org_id: SEED.ORG_HOLDING,
    user_id: SEED.USER_CONTROLLER,
    trace_id: TRACE_ID,
    action: 'source_document_created',
    entity_type: 'source_document',
    before_state: null,
    after_state_id: null,
    tool_name: null,
    idempotency_key: null,
    reason: null,
    ...overrides,
  };
}

describe('Phase 1.Storage chunk N+M: create_source_document_with_audit RPC rollback', () => {
  beforeAll(async () => {
    // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor
    // for all RPC payloads in this file via buildSourceDocumentPayload's
    // default ingest_batch_id).
    const result = await createIngestBatchForTest(SEED.ORG_HOLDING);
    sentinelBatchId = result.ingest_batch_id;

    // Defensive: clean up any residue from prior partial runs that
    // might have left audit_log rows under TRACE_ID. source_documents
    // delete-forbidden so accumulation is OK there; audit_log allows
    // delete via service-role.
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', TRACE_ID);
  });

  it('Test 1 [LOAD-BEARING]: FK violation on org_id rolls back both INSERTs atomically', async () => {
    // Pass an org_id that is a valid UUID shape but absent from
    // organizations. source_documents.org_id NOT NULL REFERENCES
    // organizations(org_id) raises foreign_key_violation (23503)
    // inside the RPC envelope; BEGIN/COMMIT rolls back the entire
    // transaction. audit_log INSERT never executes.
    const absentOrgId = crypto.randomUUID();
    const db = adminClient();
    const before = await captureCounts(db);

    const { error } = await db.rpc('create_source_document_with_audit', {
      p_source_document: buildSourceDocumentPayload({
        org_id: absentOrgId,
        legal_entity_id: absentOrgId,
      }),
      p_audit: buildAuditPayload({ org_id: absentOrgId }),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503');

    // Mechanism assertion: zero delta across BOTH tables.
    const after = await captureCounts(db);
    expect(after).toEqual(before);
  });

  it('Test 2: CHECK violation on storage_status_v1_active rolls back both INSERTs atomically', async () => {
    // 'permission_loss' is a valid enum value but fails the v1
    // CHECK constraint source_documents_storage_status_v1_active
    // (CHECK storage_status IN ('available', 'pending_initial_verify')).
    // Service layer hardcodes 'available' so this path is only
    // reachable via direct RPC.
    const db = adminClient();
    const before = await captureCounts(db);

    const { error } = await db.rpc('create_source_document_with_audit', {
      p_source_document: buildSourceDocumentPayload({
        storage_status: 'permission_loss',
      }),
      p_audit: buildAuditPayload(),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');

    const after = await captureCounts(db);
    expect(after).toEqual(before);
  });

  it('Test 3: NOT NULL violation on required field rolls back both INSERTs atomically', async () => {
    // Omit original_storage_key from payload. The RPC body's
    // p_source_document->>'original_storage_key' returns NULL when
    // the JSONB key is absent; INSERT triggers
    // not_null_violation (23502) on a NOT NULL column.
    const db = adminClient();
    const before = await captureCounts(db);

    const payload = buildSourceDocumentPayload();
    delete (payload as Record<string, unknown>).original_storage_key;

    const { error } = await db.rpc('create_source_document_with_audit', {
      p_source_document: payload,
      p_audit: buildAuditPayload(),
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23502');

    const after = await captureCounts(db);
    expect(after).toEqual(before);
  });

  it('Test 4: happy path through the RPC inserts exactly one source_document + one audit_log row', async () => {
    // Sanity baseline — the RPC actually works on a well-formed
    // payload. Confirms zero-delta tests above are not just always-
    // passing because the RPC is broken. The +1/+1 delta proves the
    // atomic INSERT contract works end-to-end at the RPC layer.
    const db = adminClient();
    const before = await captureCounts(db);

    const happyPathTraceId = crypto.randomUUID();
    const payload = buildSourceDocumentPayload();
    const auditPayload = buildAuditPayload({
      // Use a per-run randomUUID for happy-path test trace_id to
      // (a) keep its audit row separable from rollback tests'
      // (where no audit rows should ever exist), and (b) avoid
      // cross-vitest-run accumulation that would surface when this
      // test runs without an intervening pnpm db:reset (the
      // expect-length-1 assertion would see prior runs' audit rows
      // under a hardcoded trace_id).
      trace_id: happyPathTraceId,
    });

    const { data, error } = await db.rpc('create_source_document_with_audit', {
      p_source_document: payload,
      p_audit: auditPayload,
    });

    expect(error).toBeNull();
    expect(data).toBe(payload.id);

    const after = await captureCounts(db);
    expect(after.source_documents).toBe(before.source_documents + 1);
    expect(after.audit).toBe(before.audit + 1);

    // Verify the audit row carries the expected shape per chunk N
    // RPC body lines 115-140.
    const { data: auditRows } = await db
      .from('audit_log')
      .select('action, entity_type, entity_id, before_state, trace_id')
      .eq('trace_id', happyPathTraceId);

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].action).toBe('source_document_created');
    expect(auditRows![0].entity_type).toBe('source_document');
    expect(auditRows![0].entity_id).toBe(payload.id);
    expect(auditRows![0].before_state).toBeNull();
  });
});
