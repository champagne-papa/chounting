import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import {
  createDocumentCase,
  readDocumentCase,
} from '@/services/document-platform/documentCaseService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('document_cases substrate + documentCaseService (chunk 1)', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
    // document_cases rows NOT deleted (delete-forbidden per
    // trg_document_cases_no_delete); accumulate within run. Matches Phase 1
    // source_documents test cleanup pattern.
  });

  it('createDocumentCase happy path: returns row in "received" with reserved columns null + audit_log row written', async () => {
    const result = await createDocumentCase(
      { org_id: SEED.ORG_HOLDING, document_type: 'vendor_invoice' },
      ctx,
    );

    expect(result.state).toBe('received');
    expect(result.document_type).toBe('vendor_invoice');
    expect(result.org_id).toBe(SEED.ORG_HOLDING);
    expect(result.trace_id).toBe(ctx.trace_id);
    expect(result.created_by).toBe(ctx.caller.user_id);

    // Implementation note #3: reserved columns must read back as null,
    // proving (a) the migration's NULL-able columns landed correctly,
    // (b) Zod .nullable() accepts the null without coercion. These
    // columns get populated at Phase 4 / Phase 7.
    expect(result.current_relationship_candidate_id).toBeNull();
    expect(result.classification_confidence).toBeNull();

    // Audit row was written atomically with the case row.
    const db = adminClient();
    const { data: auditRows, error: auditErr } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', result.id);
    expect(auditErr).toBeNull();
    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].action).toBe('document_case_created');
    expect(auditRows![0].entity_type).toBe('document_case');
    expect(auditRows![0].user_id).toBe(ctx.caller.user_id);

    // readDocumentCase returns the same shape.
    const reread = await readDocumentCase(result.id, ctx);
    expect(reread.id).toBe(result.id);
    expect(reread.document_type).toBe('vendor_invoice');
  });

  it('createDocumentCase rejects reserved document_type at the Zod boundary (Layer 2)', async () => {
    await expect(
      createDocumentCase(
        // @ts-expect-error -- testing Zod rejection of reserved document_type
        { org_id: SEED.ORG_HOLDING, document_type: 'credit_memo' },
        ctx,
      ),
    ).rejects.toThrow(ServiceError);
  });

  it('DB CHECK rejects reserved document_type when service is bypassed (Layer 1)', async () => {
    const db = adminClient();
    const { error } = await db.from('document_cases').insert({
      id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      document_type: 'credit_memo',
      state: 'received',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/document_cases_document_type_v1_active/);
  });

  it('DB CHECK rejects reserved state when service is bypassed (Layer 1)', async () => {
    const db = adminClient();
    const { error } = await db.from('document_cases').insert({
      id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      document_type: 'vendor_invoice',
      state: 'extracting',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/document_cases_state_chunk_1_active/);
  });

  it('immutability trigger rejects UPDATE on audit-anchor columns', async () => {
    const created = await createDocumentCase(
      { org_id: SEED.ORG_HOLDING, document_type: 'receipt' },
      ctx,
    );

    const db = adminClient();
    const { error } = await db
      .from('document_cases')
      .update({ trace_id: crypto.randomUUID() })
      .eq('id', created.id);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/column-immutability violation/);
  });
});

describe('RPC atomicity contract — create_document_case_with_audit', () => {
  // This block exists separately to mark the layer-distinction: tests above
  // exercise the service contract + DB substrate from the test layer; this
  // test calls the RPC directly to prove transaction-level atomicity.
  // The service always uses matched org_ids; this test deliberately
  // mismatches them to force the audit INSERT's FK to fail.

  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
    // No document_cases rows to clean — the atomicity rollback prevents
    // any from being written in this describe's tests.
  });

  it('rolls back document_cases INSERT when audit_log INSERT fails (FK violation on audit_log.org_id)', async () => {
    const db = adminClient();
    const caseId = crypto.randomUUID();
    const nonExistentOrgId = '00000000-0000-0000-0000-deadbeefcafe';

    const { error } = await db.rpc('create_document_case_with_audit', {
      p_case: {
        id: caseId,
        org_id: SEED.ORG_HOLDING,
        document_type: 'vendor_invoice',
        state: 'received',
        trace_id: ctx.trace_id,
        created_by: ctx.caller.user_id,
      },
      p_audit: {
        org_id: nonExistentOrgId, // not in organizations(org_id) → FK violation
        user_id: ctx.caller.user_id,
        trace_id: ctx.trace_id,
        action: 'document_case_created',
        entity_type: 'document_case',
      },
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/foreign key|violates/i);

    // The document_cases row must NOT exist — the transaction rolled back
    // both INSERTs. This is the INV-AUDIT-001 atomicity property the RPC
    // pattern is paying for.
    const { data: caseRow } = await db
      .from('document_cases')
      .select('id')
      .eq('id', caseId)
      .maybeSingle();
    expect(caseRow).toBeNull();
  });
});
