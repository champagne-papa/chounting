// tests/integration/services/exceptionReasonSchemaBroaden.integration.test.ts
//
// Phase 8 chunk 7 — Axes 2 + 3 + 4: exception_reason ENUM extension
// (ALTER TYPE ADD VALUE) + ExceptionReasonSchema Zod broaden (Layer 2) +
// Layer 1 CHECK broaden (exception_reason_chunk_7_active →
// exception_reason_chunk_8_active). Symmetric defense-in-depth per ADR-0010
// admit framework.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../../setup/testDb';
import { makeTestContext } from '../../setup/makeTestContext';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import {
  ExceptionReasonSchema,
  type ExceptionReason,
} from '@/shared/schemas/document-platform/exceptionQueueEntry.schema';
import type { ServiceContext } from '@/services/middleware/serviceContext';

async function buildClassifiedCase(orgId: string, ctx: ServiceContext): Promise<string> {
  const created = await createDocumentCase(
    { org_id: orgId, document_type: 'vendor_invoice' },
    ctx,
  );
  const db = adminClient();
  const { error } = await db
    .from('document_cases')
    .update({ state: 'classified' })
    .eq('id', created.id);
  if (error) throw new Error(`buildClassifiedCase failed: ${error.message}`);
  return created.id;
}

describe('exception_reason chunk 7 broaden — Zod Layer 2 (Axis 3)', () => {
  it('admits bundle_partial_commit_reconciliation_pending (8th v1-active value)', () => {
    expect(ExceptionReasonSchema.parse('bundle_partial_commit_reconciliation_pending')).toBe(
      'bundle_partial_commit_reconciliation_pending',
    );
  });

  it('still admits the 7 prior v1-active values (no regression)', () => {
    const prior: ExceptionReason[] = [
      'manual_route',
      'low_confidence_classification',
      'unknown_document_type',
      'unmatched_router_candidate',
      'multi_candidate_ambiguity',
      'invariant_violation',
      'ai_fallback_validation_failed',
    ];
    for (const v of prior) {
      expect(ExceptionReasonSchema.parse(v)).toBe(v);
    }
  });

  it('rejects a reserved value (wrong_entity_exception) at Layer 2', () => {
    expect(ExceptionReasonSchema.safeParse('wrong_entity_exception').success).toBe(false);
  });
});

describe('exception_reason chunk 7 broaden — Layer 1 DB CHECK (Axes 2 + 4)', () => {
  const db = adminClient();
  const ctx: ServiceContext = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('admits bundle_partial_commit_reconciliation_pending at chunk_9_active CHECK (direct INSERT)', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: caseId,
      exception_reason: 'bundle_partial_commit_reconciliation_pending',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).toBeNull();
  });

  it('rejects a reserved exception_reason (wrong_entity_exception) at Layer 1 chunk_N_active CHECK', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: caseId,
      exception_reason: 'wrong_entity_exception', // reserved per ADR-0011 §10
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/exception_reason_chunk_\d+_active/);
  });
});

// Board #4 — multi_invoice broaden (migrations 20240182 ADD VALUE +
// 20240183 CHECK chunk_8_active → chunk_9_active). Symmetric defense-in-depth
// mirroring the chunk-7 broaden: Layer 2 (Zod) + Layer 1 (DB CHECK) admit the
// new value; the reject path is covered by the chunk_N regex test above.
describe('exception_reason board #4 broaden — multi_invoice (chunk_9_active)', () => {
  const db = adminClient();
  const ctx: ServiceContext = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('admits multi_invoice at Layer 2 (Zod ExceptionReasonSchema)', () => {
    expect(ExceptionReasonSchema.parse('multi_invoice')).toBe('multi_invoice');
  });

  it('admits multi_invoice at Layer 1 chunk_9_active CHECK (direct INSERT)', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: caseId,
      exception_reason: 'multi_invoice',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).toBeNull();
  });
});

// Board #4 Fork C — duplicate_invoice_suspected broaden (migrations 20240186 ADD
// VALUE + 20240187 CHECK chunk_9_active → chunk_10_active). Symmetric
// defense-in-depth mirroring the multi_invoice broaden: Layer 2 (Zod) + Layer 1
// (DB CHECK) admit the 10th v1-active value; the reject path is covered by the
// chunk_N regex test above.
describe('exception_reason board #4 Fork C broaden — duplicate_invoice_suspected (chunk_10_active)', () => {
  const db = adminClient();
  const ctx: ServiceContext = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('admits duplicate_invoice_suspected at Layer 2 (Zod ExceptionReasonSchema)', () => {
    expect(ExceptionReasonSchema.parse('duplicate_invoice_suspected')).toBe(
      'duplicate_invoice_suspected',
    );
  });

  it('admits duplicate_invoice_suspected at Layer 1 chunk_10_active CHECK (direct INSERT)', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: caseId,
      exception_reason: 'duplicate_invoice_suspected',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).toBeNull();
  });
});

// Board #4 Fork C — bank_detail_change_suspected broaden (migrations 20240188 ADD
// VALUE + 20240189 CHECK chunk_10_active → chunk_11_active). Symmetric
// defense-in-depth: Layer 2 (Zod) + Layer 1 (DB CHECK) admit the 11th v1-active
// value; the reject path is covered by the chunk_N regex test above.
describe('exception_reason board #4 Fork C broaden — bank_detail_change_suspected (chunk_11_active)', () => {
  const db = adminClient();
  const ctx: ServiceContext = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('admits bank_detail_change_suspected at Layer 2 (Zod ExceptionReasonSchema)', () => {
    expect(ExceptionReasonSchema.parse('bank_detail_change_suspected')).toBe(
      'bank_detail_change_suspected',
    );
  });

  it('admits bank_detail_change_suspected at Layer 1 chunk_11_active CHECK (direct INSERT)', async () => {
    const caseId = await buildClassifiedCase(SEED.ORG_HOLDING, ctx);
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: caseId,
      exception_reason: 'bank_detail_change_suspected',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).toBeNull();
  });
});
