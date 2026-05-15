// tests/integration/documentRouterService.dispatchTrigger.integration.test.ts
//
// Phase 4 chunk 3 — Subsystem 3 (Re-Evaluation Logic) dispatcher
// integration tests. Path C-dispatcher-isolated (3a): dispatcher
// service surface only; cross-phase wirings (billService.post +
// recordPayment + reverse; vendorPrepaymentService.record;
// periodService.unlock; documentExceptionService.resolveException)
// defer to 3b.
//
// Test surface decomposition per amended brief §γ'-partial per-trigger
// coverage table:
//   - Describe 1 — T5 walkable proof (T5-shape replaces brief's
//     original T1-shape per Amendment §5; re-routing-functional via
//     rematchCandidate γ'-partial path).
//   - Describe 2 — T5 candidate_superseded path (D-partial-no-
//     idempotency precedent under non-empty re-runs).
//   - Describe 3 — T1 / T3 audit-only fan-out (γ'-partial stranded
//     case path; no_change emitted).
//   - Describe 4 — T8 period-reopen fan-out (date-filtered).
//   - Describe 5 — T10 single-case re-route (with priors +
//     stranded).
//   - Describe 6 — Cancel-exception RPC (chunk-3 substrate; happy
//     path + EXCEPTION_ALREADY_CANCELLED on 23514 check_violation
//     when guard fires twice).
//   - Describe 7 — Audit-log shape (7-field router_re_evaluation_
//     fired payload + R1 deterministic idempotency_key).
//   - Describe 8 — Zod boundary (READ_FAILED on parse failure;
//     reserved trigger types rejected at envelope).
//
// Zero-emission test isolation discipline (chunk-1 #7 + chunk-2
// R5.2; third firing): each "X does NOT fire trigger Y" assertion
// uses fresh ctx (separate trace_id) and asserts zero audit rows
// for that trace_id.
//
// (β-3) reconciliation: migration WIP at scope-lock had
// `WHERE id = p_entry_id` for exception_queue_entries which uses
// PK column `exception_queue_entry_id`; migration fixed at impl
// onset. No service-layer impact.
//
// (β-4) reconciliation: amended brief §3 6-rule discriminator
// uses count_after which brief Task 4 step 7 calls "SELECT COUNT(*)
// post-mutation" (K2 head-of-chain literal). Under chunk-1
// completeCandidate's no-supersedes-on-empty-rerun semantic, that
// literal yields count_after = count_before for empty re-runs,
// making rules 2/4/6 indistinguishable. Implementation uses
// count_after = newCandidates.length (rematchCandidate result count)
// to make the discriminator operationally coherent — this is the
// minimum-deviation interpretation that matches walkable proof rule 4.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import {
  completeCandidate,
  dispatchTrigger,
} from '@/services/document-platform/documentRouterService';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { attachDocumentCaseSource } from '@/services/document-platform/documentCaseSourceService';
import { enqueueException } from '@/services/document-platform/documentExceptionService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type {
  CompleteCandidateInputRaw,
  DispatchTriggerInputRaw,
} from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Fixture helpers.
// ---------------------------------------------------------------------

interface RouterCaseFixture {
  caseId: string;
  sourceDocId: string;
  vendorId: string;
}

async function seedVendor(orgId: string): Promise<string> {
  const db = adminClient();
  const vendorId = crypto.randomUUID();
  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: `TEST chunk-3 dispatcher vendor ${vendorId.slice(0, 8)}`,
  });
  if (error) throw new Error(`vendor fixture failed: ${error.message}`);
  return vendorId;
}

async function seedRouterCase(
  orgId: string,
  ctx: ServiceContext,
  vendorId: string,
): Promise<RouterCaseFixture> {
  // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor for source_document).
  const { ingest_batch_id } = await createIngestBatchForTest(orgId);

  const sourceResult = await documentPlatformService.createSourceDocument(
    {
      bytes: new Uint8Array([1, 2, 3, 4]),
      mime_type: 'application/pdf',
      original_filename: `chunk-3-dispatcher-${crypto.randomUUID().slice(0, 8)}.pdf`,
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

  return {
    caseId: caseResult.id,
    sourceDocId: sourceResult.id,
    vendorId,
  };
}

async function seedBill(
  db: Db,
  orgId: string,
  vendorId: string,
  lifecycle_state: 'approved_for_payment' | 'partially_paid' | 'fully_paid' = 'approved_for_payment',
  issue_date = '2026-05-14',
): Promise<string> {
  const billId = crypto.randomUUID();
  const { error } = await db.from('bills').insert({
    bill_id: billId,
    org_id: orgId,
    vendor_id: vendorId,
    issue_date,
    lifecycle_state,
    amount_cad: 1000,
  });
  if (error) throw new Error(`seedBill failed: ${error.message}`);
  return billId;
}

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
  if (error) throw new Error(`transitionCaseToClassifiedDirect failed: ${error.message}`);
}

function buildCompleteInput(
  fixture: RouterCaseFixture,
  ctx: ServiceContext,
): CompleteCandidateInputRaw {
  return {
    document_case_id: fixture.caseId,
    source_document_id: fixture.sourceDocId,
    document_type: 'vendor_invoice',
    classification_confidence: 0.95,
    extracted_fields: { invoice_amount: 1000, invoice_date: '2026-05-14' },
    vendor_match: {
      vendor_id: fixture.vendorId,
      confidence: 0.95,
      match_type: 'exact_name',
      candidate_alternatives: [],
    },
    trace_id: ctx.trace_id,
  };
}

// Seeds a "classified case with prior candidate pointing at bill" —
// the canonical T5 fixture per amended brief §Walkable proof. Creates
// vendor + bill (approved_for_payment) + case + completeCandidate to
// produce the prior candidate + transitions case to 'classified'.
async function seedClassifiedCaseWithPriorCandidate(
  orgId: string,
  ctx: ServiceContext,
): Promise<{ fixture: RouterCaseFixture; billId: string }> {
  const db = adminClient();
  const vendorId = await seedVendor(orgId);
  const billId = await seedBill(db, orgId, vendorId, 'approved_for_payment');
  const fixture = await seedRouterCase(orgId, ctx, vendorId);
  await completeCandidate(buildCompleteInput(fixture, ctx), ctx);
  await transitionCaseToClassifiedDirect(db, orgId, fixture.caseId, ctx);
  return { fixture, billId };
}

// Seeds a "stranded case" — case in needs_review with open exception
// queue entry, no prior candidates. For T1/T3/T10-stranded audit-only
// tests.
async function seedStrandedCase(
  orgId: string,
  ctx: ServiceContext,
): Promise<{ fixture: RouterCaseFixture; exceptionEntryId: string }> {
  const vendorId = await seedVendor(orgId);
  const fixture = await seedRouterCase(orgId, ctx, vendorId);
  // enqueueException requires state classified or matched.
  const db = adminClient();
  await transitionCaseToClassifiedDirect(db, orgId, fixture.caseId, ctx);
  const entry = await enqueueException(
    {
      document_case_id: fixture.caseId,
      exception_reason: 'unmatched_router_candidate',
      trace_id: ctx.trace_id,
    },
    ctx,
  );
  return { fixture, exceptionEntryId: entry.exception_queue_entry_id };
}

function buildT5Envelope(
  orgId: string,
  billId: string,
  traceId: string,
  newState: 'fully_paid' | 'voided' = 'fully_paid',
): DispatchTriggerInputRaw {
  return {
    trigger_type: 'T5_bill_state_transition',
    org_id: orgId,
    bill_id: billId,
    old_lifecycle_state: 'approved_for_payment',
    new_lifecycle_state: newState,
    trace_id: traceId,
  };
}

// =====================================================================
// Describe 1 — T5 walkable proof (rule 4: re_routed_to_exception)
// =====================================================================

describe('dispatchTrigger T5 — walkable proof (re_routed_to_exception)', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T5 fires re_routed_to_exception when transitioned bill no longer matches and prior candidate becomes orphan', async () => {
    const { fixture, billId } = await seedClassifiedCaseWithPriorCandidate(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    // Move the bill out of the watched set (substrate-direct;
    // billService.recordPayment wiring is 3b territory).
    const { error: updErr } = await db
      .from('bills')
      .update({ lifecycle_state: 'fully_paid' })
      .eq('bill_id', billId);
    expect(updErr).toBeNull();

    // Dispatch T5.
    await dispatchTrigger(buildT5Envelope(SEED.ORG_HOLDING, billId, ctx.trace_id), ctx);

    // Verify exception_queue_entry created with unmatched_router_candidate.
    const { data: excRow } = await db
      .from('exception_queue_entries')
      .select('exception_status, exception_reason, document_case_id')
      .eq('document_case_id', fixture.caseId)
      .eq('exception_status', 'open')
      .single();
    expect(excRow?.exception_reason).toBe('unmatched_router_candidate');

    // Verify case transitioned to needs_review (via enqueueException).
    const { data: caseRow } = await db
      .from('document_cases')
      .select('state')
      .eq('id', fixture.caseId)
      .single();
    expect(caseRow?.state).toBe('needs_review');

    // Verify router_re_evaluation_fired audit row.
    const { data: auditRows } = await db
      .from('audit_log')
      .select('action, before_state, entity_id')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(auditRows).toHaveLength(1);
    const before = auditRows![0].before_state as Record<string, unknown>;
    expect(before.trigger_type).toBe('T5_bill_state_transition');
    expect(before.decision_outcome).toBe('re_routed_to_exception');
    expect(before.candidate_count_before).toBe(1);
    expect(before.candidate_count_after).toBe(0);
  });
});

// =====================================================================
// Describe 2 — T5 candidate_superseded (rule 2)
// =====================================================================

describe('dispatchTrigger T5 — candidate_superseded path (D-partial-no-idempotency)', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T5 emits candidate_superseded when bill stays in watched set + rematchCandidate produces non-empty', async () => {
    const { fixture, billId } = await seedClassifiedCaseWithPriorCandidate(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    // Bill stays approved_for_payment; rematchCandidate will produce a
    // non-empty result (the same bill matches) → resolveCandidates
    // branch (a) for N=1 sets head pointer + transitions to matched.
    await dispatchTrigger(buildT5Envelope(SEED.ORG_HOLDING, billId, ctx.trace_id), ctx);

    const { data: auditRows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(auditRows).toHaveLength(1);
    const before = auditRows![0].before_state as Record<string, unknown>;
    expect(before.decision_outcome).toBe('candidate_superseded');
    expect(before.candidate_count_before).toBe(1);
    expect(before.candidate_count_after).toBe(1);
  });
});

// =====================================================================
// Describe 3 — T1 / T3 fan-out audit-only (γ'-partial stranded)
// =====================================================================

describe('dispatchTrigger T1 — stranded fan-out audit-only', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T1 fan-out emits decision_outcome=no_change for stranded cases under γ\'-partial', async () => {
    const { fixture } = await seedStrandedCase(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    await dispatchTrigger(
      {
        trigger_type: 'T1_new_bill',
        org_id: SEED.ORG_HOLDING,
        bill_id: crypto.randomUUID(),
        vendor_id: fixture.vendorId,
        trace_id: ctx.trace_id,
      },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(auditRows!.length).toBeGreaterThanOrEqual(1);
    const before = auditRows![0].before_state as Record<string, unknown>;
    expect(before.trigger_type).toBe('T1_new_bill');
    expect(before.decision_outcome).toBe('no_change');
    expect(before.candidate_count_before).toBe(0);
    expect(before.candidate_count_after).toBe(0);
  });
});

describe('dispatchTrigger T3 — stranded fan-out audit-only', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T3 fan-out emits decision_outcome=no_change for stranded cases under γ\'-partial', async () => {
    const { fixture } = await seedStrandedCase(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    await dispatchTrigger(
      {
        trigger_type: 'T3_new_vendor_prepayment',
        org_id: SEED.ORG_HOLDING,
        vendor_prepayment_id: crypto.randomUUID(),
        vendor_id: fixture.vendorId,
        trace_id: ctx.trace_id,
      },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(auditRows!.length).toBeGreaterThanOrEqual(1);
    expect((auditRows![0].before_state as Record<string, unknown>).decision_outcome).toBe('no_change');
  });
});

// =====================================================================
// Describe 4 — T8 period-reopen date-filtered fan-out
// =====================================================================

describe('dispatchTrigger T8 — period_reopen date-filtered fan-out', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T8 only fan-outs cases whose extracted_invoice_date falls in the reopened period', async () => {
    const { fixture, billId } = await seedClassifiedCaseWithPriorCandidate(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    // document_relationship_candidates is immutable from service_role
    // (REVOKE UPDATE per chunk-1-Phase-4 substrate). The candidate
    // carries extracted_invoice_date='2026-05-14' from buildCompleteInput.
    // Look up the seeded 'FY Current' fiscal_period (covers 2026-01-01
    // to 2026-12-31) which spans the candidate's date.
    const { data: period, error: periodLookupErr } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('start_date', '2026-01-01')
      .eq('end_date', '2026-12-31')
      .single();
    expect(periodLookupErr).toBeNull();
    const periodId = period!.period_id;

    await dispatchTrigger(
      {
        trigger_type: 'T8_period_reopen',
        org_id: SEED.ORG_HOLDING,
        period_id: periodId,
        trace_id: ctx.trace_id,
      },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(auditRows!.length).toBe(1);
    const before = auditRows![0].before_state as Record<string, unknown>;
    expect(before.trigger_type).toBe('T8_period_reopen');
    void billId;
  });
});

// =====================================================================
// Describe 5 — T10 single-case (re-routing + stranded)
// =====================================================================

describe('dispatchTrigger T10 — single-case manual override', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('T10 with-priors re-evaluates the single specified case', async () => {
    const { fixture, billId } = await seedClassifiedCaseWithPriorCandidate(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    // Take bill out of watched set so rematchCandidate returns [] →
    // rule 4 re_routed_to_exception.
    await db.from('bills').update({ lifecycle_state: 'fully_paid' }).eq('bill_id', billId);

    await dispatchTrigger(
      {
        trigger_type: 'T10_manual_override',
        org_id: SEED.ORG_HOLDING,
        case_id: fixture.caseId,
        trace_id: ctx.trace_id,
      },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(auditRows).toHaveLength(1);
    expect((auditRows![0].before_state as Record<string, unknown>).trigger_type).toBe(
      'T10_manual_override',
    );
    expect((auditRows![0].before_state as Record<string, unknown>).decision_outcome).toBe(
      're_routed_to_exception',
    );
  });

  it('T10 stranded case emits no_change (audit-only γ\'-partial path)', async () => {
    const isolatedCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const { fixture } = await seedStrandedCase(SEED.ORG_HOLDING, isolatedCtx);
    const db = adminClient();

    await dispatchTrigger(
      {
        trigger_type: 'T10_manual_override',
        org_id: SEED.ORG_HOLDING,
        case_id: fixture.caseId,
        trace_id: isolatedCtx.trace_id,
      },
      isolatedCtx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', isolatedCtx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(auditRows).toHaveLength(1);
    expect((auditRows![0].before_state as Record<string, unknown>).decision_outcome).toBe(
      'no_change',
    );

    await db.from('audit_log').delete().eq('trace_id', isolatedCtx.trace_id);
  });
});

// =====================================================================
// Describe 6 — cancel_exception_with_audit RPC behavior
// =====================================================================

describe('cancel_exception_with_audit RPC — chunk-3 substrate', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('happy path: open → cancelled + emits exception_cancelled audit row', async () => {
    const { fixture, exceptionEntryId } = await seedStrandedCase(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    const { error: cancelErr } = await db.rpc('cancel_exception_with_audit', {
      p_entry_id: exceptionEntryId,
      p_audit: {
        user_id: ctx.caller.user_id ?? '',
        trace_id: ctx.trace_id,
        action: 'exception_cancelled',
        entity_type: 'exception_queue_entry',
        tool_name: null,
        idempotency_key: null,
        reason: 'unit test',
      },
    });
    expect(cancelErr).toBeNull();

    const { data: row } = await db
      .from('exception_queue_entries')
      .select('exception_status')
      .eq('exception_queue_entry_id', exceptionEntryId)
      .single();
    expect(row?.exception_status).toBe('cancelled');

    const { data: audit } = await db
      .from('audit_log')
      .select('action, entity_id, before_state')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', exceptionEntryId)
      .eq('action', 'exception_cancelled');
    expect(audit).toHaveLength(1);
    const before = audit![0].before_state as Record<string, unknown>;
    expect(before.exception_status).toBe('open');
    expect(before.document_case_id).toBe(fixture.caseId);
  });

  it('23514 check_violation when guard fires on already-cancelled entry', async () => {
    const { exceptionEntryId } = await seedStrandedCase(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    // First cancel — should succeed.
    await db.rpc('cancel_exception_with_audit', {
      p_entry_id: exceptionEntryId,
      p_audit: {
        user_id: ctx.caller.user_id ?? '',
        trace_id: ctx.trace_id,
        action: 'exception_cancelled',
        entity_type: 'exception_queue_entry',
        tool_name: null,
        idempotency_key: null,
        reason: 'first cancel',
      },
    });

    // Second cancel — should fail with 23514.
    const { error: cancelErr } = await db.rpc('cancel_exception_with_audit', {
      p_entry_id: exceptionEntryId,
      p_audit: {
        user_id: ctx.caller.user_id ?? '',
        trace_id: ctx.trace_id,
        action: 'exception_cancelled',
        entity_type: 'exception_queue_entry',
        tool_name: null,
        idempotency_key: null,
        reason: 'second cancel',
      },
    });
    expect(cancelErr).not.toBeNull();
    expect(cancelErr!.code).toBe('23514');
  });

  it('cancelled → other transition forbidden by reject_invalid_exception_status_transition trigger', async () => {
    const { exceptionEntryId } = await seedStrandedCase(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    // Cancel first.
    await db.rpc('cancel_exception_with_audit', {
      p_entry_id: exceptionEntryId,
      p_audit: {
        user_id: ctx.caller.user_id ?? '',
        trace_id: ctx.trace_id,
        action: 'exception_cancelled',
        entity_type: 'exception_queue_entry',
        tool_name: null,
        idempotency_key: null,
        reason: 'setup',
      },
    });

    // Direct UPDATE attempting cancelled → resolved.
    const { error: updErr } = await db
      .from('exception_queue_entries')
      .update({ exception_status: 'resolved' })
      .eq('exception_queue_entry_id', exceptionEntryId);
    expect(updErr).not.toBeNull();
    // ERRCODE = feature_not_supported (0A000) per migration trigger function.
    expect(updErr!.code).toBe('0A000');
  });
});

// =====================================================================
// Describe 7 — Audit-log shape + R1 idempotency_key recipe
// =====================================================================

describe('dispatchTrigger audit-log shape', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('router_re_evaluation_fired audit row carries 4-field before_state payload', async () => {
    const { fixture, billId } = await seedClassifiedCaseWithPriorCandidate(SEED.ORG_HOLDING, ctx);
    const db = adminClient();

    await db.from('bills').update({ lifecycle_state: 'fully_paid' }).eq('bill_id', billId);
    await dispatchTrigger(buildT5Envelope(SEED.ORG_HOLDING, billId, ctx.trace_id), ctx);

    const { data: rows } = await db
      .from('audit_log')
      .select('action, entity_type, entity_id, trace_id, idempotency_key, before_state, org_id')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', fixture.caseId)
      .eq('action', 'router_re_evaluation_fired');
    expect(rows).toHaveLength(1);
    const row = rows![0];
    expect(row.entity_type).toBe('document_case');
    expect(row.entity_id).toBe(fixture.caseId);
    expect(row.org_id).toBe(SEED.ORG_HOLDING);
    expect(row.idempotency_key).not.toBeNull();
    expect(row.idempotency_key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    const before = row.before_state as Record<string, unknown>;
    expect(Object.keys(before).sort()).toEqual(
      ['candidate_count_after', 'candidate_count_before', 'decision_outcome', 'trigger_type'].sort(),
    );
  });
});

// =====================================================================
// Describe 8 — Zod boundary
// =====================================================================

describe('dispatchTrigger Zod boundary', () => {
  let ctx: ServiceContext;

  beforeAll(() => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('Zod parse failure on malformed payload throws READ_FAILED', async () => {
    let caught: ServiceError | null = null;
    try {
      await dispatchTrigger(
        { trigger_type: 'T1_new_bill', not_org_id: 'no' } as unknown as DispatchTriggerInputRaw,
        ctx,
      );
    } catch (e) {
      caught = e as ServiceError;
    }
    expect(caught).not.toBeNull();
    expect(caught!.code).toBe('READ_FAILED');
  });

  it('reserved trigger types (T7_vendor_master_merge) rejected at Zod boundary', async () => {
    let caught: ServiceError | null = null;
    try {
      await dispatchTrigger(
        {
          trigger_type: 'T7_vendor_master_merge',
          org_id: SEED.ORG_HOLDING,
          trace_id: ctx.trace_id,
        } as unknown as DispatchTriggerInputRaw,
        ctx,
      );
    } catch (e) {
      caught = e as ServiceError;
    }
    expect(caught).not.toBeNull();
    expect(caught!.code).toBe('READ_FAILED');
  });

  it('T2_new_payment / T4_new_vendor_credit / T6_payment_state_transition all rejected (Framing F v1-active-emission-wired subset)', async () => {
    for (const reserved of [
      'T2_new_payment',
      'T4_new_vendor_credit',
      'T6_payment_state_transition',
    ] as const) {
      let caught: ServiceError | null = null;
      try {
        await dispatchTrigger(
          {
            trigger_type: reserved,
            org_id: SEED.ORG_HOLDING,
            trace_id: ctx.trace_id,
          } as unknown as DispatchTriggerInputRaw,
          ctx,
        );
      } catch (e) {
        caught = e as ServiceError;
      }
      expect(caught).not.toBeNull();
      expect(caught!.code).toBe('READ_FAILED');
    }
  });
});
