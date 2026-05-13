import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import {
  attachDocumentCaseSource,
  readDocumentCaseSource,
} from '@/services/document-platform/documentCaseSourceService';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('document_case_sources substrate + documentCaseSourceService (chunk 3)', () => {
  let ctx: ServiceContext;
  let caseId: string;
  let sourceDocId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Set up: one document_case + one source_document. Both substrates
    // already ship; chunk 3 is the link between them.
    const caseResult = await createDocumentCase(
      { org_id: SEED.ORG_HOLDING, document_type: 'vendor_invoice' },
      ctx,
    );
    caseId = caseResult.id;

    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([1, 2, 3, 4]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-3-test.pdf',
        ingest_channel: 'direct_upload',
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
    // document_case_sources / document_cases / source_documents rows
    // NOT deleted (full immutability per the chunk-3 trigger + chunks
    // 1-2 + Phase 1 patterns). Accumulate within run.
  });

  it('attach happy path: returns row with correct shape + audit_log row written atomically', async () => {
    const result = await attachDocumentCaseSource(
      {
        document_case_id: caseId,
        source_document_id: sourceDocId,
        role: 'primary',
      },
      ctx,
    );

    expect(result.document_case_id).toBe(caseId);
    expect(result.source_document_id).toBe(sourceDocId);
    expect(result.role).toBe('primary');
    expect(result.trace_id).toBe(ctx.trace_id);
    expect(result.created_by).toBe(ctx.caller.user_id);

    // Audit row was written atomically.
    const db = adminClient();
    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', result.id)
      .eq('action', 'document_case_source_attached');
    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_type).toBe('document_case_source');

    // readDocumentCaseSource round-trips.
    const reread = await readDocumentCaseSource(result.id, ctx);
    expect(reread.id).toBe(result.id);
  });

  it('Zod rejection: role outside v1-active subset throws READ_FAILED', async () => {
    await expect(
      attachDocumentCaseSource(
        {
          document_case_id: caseId,
          source_document_id: sourceDocId,
          // @ts-expect-error -- testing Zod rejection of reserved role
          role: 'superseded_source',
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'READ_FAILED',
      message: expect.stringContaining('role'),
    });
  });

  it('DB CHECK rejects reserved role when service is bypassed (Layer 1)', async () => {
    const db = adminClient();
    const { error } = await db.from('document_case_sources').insert({
      id: crypto.randomUUID(),
      document_case_id: caseId,
      source_document_id: sourceDocId,
      role: 'superseded_source',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });

    expect(error).not.toBeNull();
    // Stable regex: match the version-suffixed-active constraint pattern,
    // not the literal v1_active name (carry-forward from chunk-2
    // implementation-notes constraint-name fragility lesson).
    expect(error!.message).toMatch(/document_case_sources_role_v\d+_active/);
  });

  it('FK rejection on non-existent parent (case_id or source_document_id)', async () => {
    const db = adminClient();
    const nonExistentUuid = '00000000-0000-0000-0000-deadbeefcafe';

    // Case A: non-existent document_case_id.
    const { error: caseErr } = await db.from('document_case_sources').insert({
      id: crypto.randomUUID(),
      document_case_id: nonExistentUuid,
      source_document_id: sourceDocId,
      role: 'supporting',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(caseErr).not.toBeNull();
    expect(caseErr!.message).toMatch(/foreign key|violates/i);

    // Case B: non-existent source_document_id.
    const { error: srcErr } = await db.from('document_case_sources').insert({
      id: crypto.randomUUID(),
      document_case_id: caseId,
      source_document_id: nonExistentUuid,
      role: 'supporting',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(srcErr).not.toBeNull();
    expect(srcErr!.message).toMatch(/foreign key|violates/i);
  });

  it('UNIQUE rejects duplicate triple (same case + source + role)', async () => {
    // Test 1's happy path attached (caseId, sourceDocId, 'primary'). A
    // second attach with the same triple should fail the UNIQUE constraint.
    await expect(
      attachDocumentCaseSource(
        {
          document_case_id: caseId,
          source_document_id: sourceDocId,
          role: 'primary',
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'POST_FAILED',
      message: expect.stringMatching(/unique|duplicate/i),
    });
  });

  it('immutability trigger rejects UPDATE on any column', async () => {
    // Attach a fresh row (different role to avoid UNIQUE conflict with test 1).
    const link = await attachDocumentCaseSource(
      {
        document_case_id: caseId,
        source_document_id: sourceDocId,
        role: 'supporting',
      },
      ctx,
    );

    const db = adminClient();
    // Try to mutate role — should fail.
    const { error } = await db
      .from('document_case_sources')
      .update({ role: 'email_body' })
      .eq('id', link.id);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);
  });

  it('DELETE protection trigger rejects DELETE', async () => {
    // Reuse test 1's link (attached at caseId × sourceDocId × 'primary').
    // Query to get its id, then try to delete.
    const db = adminClient();
    const { data: existing } = await db
      .from('document_case_sources')
      .select('id')
      .eq('document_case_id', caseId)
      .eq('source_document_id', sourceDocId)
      .eq('role', 'primary')
      .single();

    expect(existing).not.toBeNull();
    const { error } = await db
      .from('document_case_sources')
      .delete()
      .eq('id', existing!.id);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);
  });
});

describe('RPC atomicity contract — attach_document_case_source_with_audit', () => {
  // Parallel to chunks 1-2's atomicity tests. Calls the RPC directly
  // with mismatched org_ids to force the audit INSERT's FK constraint
  // to fail, proving the link row never persists when the audit write
  // fails (INV-AUDIT-001 atomicity).

  let ctx: ServiceContext;
  let caseId: string;
  let sourceDocId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    const caseResult = await createDocumentCase(
      { org_id: SEED.ORG_HOLDING, document_type: 'receipt' },
      ctx,
    );
    caseId = caseResult.id;

    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([5, 6, 7, 8]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-3-atomicity-test.pdf',
        ingest_channel: 'direct_upload',
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('rolls back link INSERT when audit_log INSERT fails (FK violation on audit_log.user_id)', async () => {
    // Mechanism note: both caseId AND nonExistentUserId are load-bearing.
    // The valid caseId ensures (a) the document_case_sources FK on
    // document_case_id succeeds, so the first INSERT lands; (b) the
    // RPC's audit_log.org_id subquery against document_cases returns
    // a real (non-null) org_id. The invalid user_id is what triggers
    // the audit_log INSERT's FK violation on user_id → auth.users(id),
    // which is the actual rollback driver. Bogus caseId would fail the
    // first INSERT differently (FK on document_case_id) without proving
    // the audit-rollback property.
    const db = adminClient();
    const linkId = crypto.randomUUID();
    const nonExistentUserId = '00000000-0000-0000-0000-deadbeefcafe';

    const { error } = await db.rpc('attach_document_case_source_with_audit', {
      p_link: {
        id: linkId,
        document_case_id: caseId,
        source_document_id: sourceDocId,
        role: 'primary',
        trace_id: ctx.trace_id,
        created_by: ctx.caller.user_id,
      },
      p_audit: {
        user_id: nonExistentUserId, // not in auth.users -> FK violation
        trace_id: ctx.trace_id,
        action: 'document_case_source_attached',
        entity_type: 'document_case_source',
      },
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/foreign key|violates/i);

    // The link row must NOT exist — transaction rolled back both INSERTs.
    const { data: linkRow } = await db
      .from('document_case_sources')
      .select('id')
      .eq('id', linkId)
      .maybeSingle();
    expect(linkRow).toBeNull();
  });
});

describe('RLS through-case-org-access (chunk-3 first usage of EXISTS-subquery pattern)', () => {
  // Chunk 3 introduces a new RLS pattern (EXISTS subquery against
  // parent document_cases) not used in chunks 1-2. This test exercises
  // the cross-org rejection path explicitly — if the EXISTS subquery
  // filtered on something looser than parent.org_id, cross-org data
  // would leak silently.
  //
  // Mechanism: userClientFor (from ../setup/testDb) returns a
  // non-service-role Supabase client authenticated as a seeded user.
  // AP user ('ap@thebridge.local') has limited org access per the seed
  // config — verified at impl onset: seed inserts a single membership
  // row for AP into ORG_REAL_ESTATE only (NOT ORG_HOLDING). The test
  // creates substrate in ORG_HOLDING via adminClient, then queries +
  // attempts to INSERT via apClient, expecting RLS to filter/reject.

  let ctx: ServiceContext;
  let apClient: SupabaseClient;
  let caseId: string;
  let sourceDocId: string;
  let linkId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Set up case + source_doc + link in ORG_HOLDING via service-role.
    const caseResult = await createDocumentCase(
      { org_id: SEED.ORG_HOLDING, document_type: 'vendor_invoice' },
      ctx,
    );
    caseId = caseResult.id;

    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([9, 10, 11, 12]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-3-rls-test.pdf',
        ingest_channel: 'direct_upload',
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;

    const link = await attachDocumentCaseSource(
      { document_case_id: caseId, source_document_id: sourceDocId, role: 'primary' },
      ctx,
    );
    linkId = link.id;

    // Non-service-role client as AP user (ORG_REAL_ESTATE-only access
    // per seed; verified at impl onset).
    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('cross-org user cannot SELECT document_case_sources rows for a case they do not have access to', async () => {
    // Via service_role (admin) the row exists and is queryable.
    const db = adminClient();
    const { data: adminRows } = await db
      .from('document_case_sources')
      .select('id')
      .eq('id', linkId);
    expect(adminRows).toHaveLength(1);

    // Via the cross-org user, RLS filters the row out entirely.
    const { data: apRows, error } = await apClient
      .from('document_case_sources')
      .select('id')
      .eq('id', linkId);
    expect(error).toBeNull();
    expect(apRows).toHaveLength(0);
  });

  it('cross-org user cannot INSERT document_case_sources for a case they do not have access to', async () => {
    const { error } = await apClient.from('document_case_sources').insert({
      id: crypto.randomUUID(),
      document_case_id: caseId,            // case in ORG_HOLDING
      source_document_id: sourceDocId,     // source in ORG_HOLDING
      role: 'supporting',
      trace_id: crypto.randomUUID(),
      created_by: 'ap-test-user',
    });

    // RLS WITH CHECK predicate fails the EXISTS subquery (the AP user
    // doesn't have access to the parent case's org); INSERT rejected.
    expect(error).not.toBeNull();
    // PostgREST surfaces RLS rejections as 42501 / "new row violates
    // row-level security policy" or similar. Match leniently.
    expect(error!.message).toMatch(/row-level security|policy|violates/i);
  });
});
