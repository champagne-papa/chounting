# Fork C Attachment-Seam (dup over-fire fix) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the semantic-duplicate handler from preempting the Phase-4 attachment path — fire it only when the matched bill is document-sourced (has a live `primary_invoice` link) — restoring INV-WORKFLOW-002's ATTACHMENT EXIT.

**Architecture:** Add a provenance discriminator to `findLiveBillByVendorAndNumber` (a second read into `source_document_links` for a `link_status='created'` `primary_invoice` row on the matched bill), then gate the Stage-5.5 dup handler on `matched_bill_id && is_document_sourced`. Bank-detail and statement handlers are unchanged (their route-to-human is the correct disposition even for a would-attach doc). No migration, no new substrate — the signal already exists (INV-DOC-001 writes the link via `billService.post`).

**Tech Stack:** TypeScript, vitest (integration tests under `apps/web/tests/integration/`), supabase-js `adminClient()` reads, `ServiceError` typed errors. Design doc: `docs/09_briefs/post-mvp/2026-07-22-board-4-fork-c-attachment-seam-design.md`.

## Global Constraints

- **Commits are the operator's per-act word.** Every "Commit" step below is a *request* — draft the message, show the proposed commit + staged set, and wait for the operator's explicit go. Commit from repo root with `COORD_SESSION='<current .coordination/session-lock.json session label>' git commit -F <msgfile>` (re-read the lock label at commit time; currently `board-4-slice-2-build`).
- **Branch:** `feat/board-4-fork-c`. The push to origin stays HELD until `test:full` is green-or-documented-deviation (Task 4).
- **The `link_status='created'` predicate is mandatory** wherever the provenance link is queried — a voided bill retains a `link_status='reversed'` `primary_invoice` row (links are reversed, never deleted); omitting the status filter re-introduces the over-fire on a re-book-after-void.
- **Tests are Tier-A-only — no paid Claude calls.** Reuse `CONFIDENT_LINES` (the golden `Invoice #…`+`Vendor:`+`Date:`+`Total:` fixture already in `semanticDuplicatePipelineWiring`) so Stage-3/4 stay on the deterministic Tier-A path. Verify `grep -c "callClaude: API call complete"` is `0` on any new pipeline test run.
- **TDD:** every code change is preceded by a failing test whose failure you observe (RED) before implementing (GREEN).
- **No new migration.** This fix is read-side only.

---

### Task 1: Provenance discriminator on `findLiveBillByVendorAndNumber`

**Files:**
- Modify: `apps/web/src/services/document-platform/extractionReadService.ts` (the `LiveBillByVendorAndNumberResult` interface at :119-126 and the `findLiveBillByVendorAndNumber` function at :140-171)
- Test: `apps/web/tests/integration/findLiveBillByVendorAndNumberProvenance.integration.test.ts` (new)

**Interfaces:**
- Produces: `findLiveBillByVendorAndNumber(input: { org_id: string; vendor_id: string; bill_number: string }): Promise<{ matched_bill_id: string | null; is_document_sourced: boolean }>` — `is_document_sourced` is true iff `matched_bill_id` is non-null AND that bill has a `link_status='created'` `primary_invoice` `source_document_links` row.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/integration/findLiveBillByVendorAndNumberProvenance.integration.test.ts`:

```typescript
// Board #4 Fork C — provenance discriminator on the semantic-duplicate read.
// A matched live bill counts as a re-book target ONLY if it is document-sourced:
// it carries a LIVE (link_status='created') primary_invoice source_document_links
// row. A raw/manual bill (no link) and a voided bill (link reversed) both read as
// NOT document-sourced → the incoming invoice is a legitimate first-arrival
// attachment. See 2026-07-22-board-4-fork-c-attachment-seam-design.md §3.
import { describe, it, expect, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { findLiveBillByVendorAndNumber } from '@/services/document-platform/extractionReadService';

const db = adminClient();
const BILL_NUMBER = 'PROV-INV-001';

async function seedVendor(): Promise<string> {
  const vendor_id = crypto.randomUUID();
  const { error } = await db
    .from('vendors')
    .insert({ vendor_id, org_id: SEED.ORG_HOLDING, name: `Prov Vendor ${vendor_id.slice(0, 8)}` });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
  return vendor_id;
}

async function seedBill(vendor_id: string): Promise<string> {
  const bill_id = crypto.randomUUID();
  const { error } = await db.from('bills').insert({
    bill_id,
    org_id: SEED.ORG_HOLDING,
    vendor_id,
    bill_number: BILL_NUMBER,
    issue_date: '2026-01-15',
    lifecycle_state: 'approved_for_payment',
    amount_cad: 100.0,
  });
  if (error) throw new Error(`bill seed failed: ${error.message}`);
  return bill_id;
}

// A source_document to hang the primary_invoice link on (FK target). Seeded via
// the same ingest-batch RPC the pipeline tests use, for write-path fidelity.
async function seedSourceDoc(trace_id: string): Promise<string> {
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: {
      id: batchId,
      org_id: SEED.ORG_HOLDING,
      ingest_channel: 'drag_drop_pdf',
      received_at: new Date().toISOString(),
      channel_metadata: { drop_session_id: crypto.randomUUID(), chat_session_id: crypto.randomUUID(), user_id: SEED.USER_CONTROLLER },
      trace_id,
      created_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
    },
    p_documents: [{
      id: docId,
      org_id: SEED.ORG_HOLDING,
      legal_entity_id: SEED.ORG_HOLDING,
      storage_provider: 'supabase_storage',
      original_storage_key: `org_${SEED.ORG_HOLDING}/sources/prov/${docId}.pdf`,
      original_content_hash: crypto.randomUUID().replace(/-/g, '').padEnd(64, '0'),
      original_byte_size: 42,
      original_filename: 'prov.pdf',
      mime_type: 'application/pdf',
      ingest_channel: 'drag_drop_pdf',
      storage_status: 'available',
      received_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
      ingest_batch_id: batchId,
    }],
    p_cases: [],
    p_case_sources: [],
    p_jobs: [],
    p_audit: {
      org_id: SEED.ORG_HOLDING, user_id: SEED.USER_CONTROLLER, trace_id,
      action: 'ingest_batch_created', entity_type: 'ingest_batch',
      before_state: null, after_state_id: null, tool_name: null, idempotency_key: null, reason: null,
    },
  });
  if (error) throw new Error(`source-doc seed failed: ${error.message}`);
  return docId;
}

// Seed a LIVE (created) primary_invoice link via the REAL RPC — same write path
// billService.post → documentLinkService.create uses (write-path fidelity; NOT a
// raw source_document_links insert). link_status defaults to 'created'.
async function seedPrimaryInvoiceLink(sourceDocId: string, billId: string, trace_id: string): Promise<void> {
  const { error } = await db.rpc('create_source_document_link_with_audit', {
    p_link: {
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      linked_entity_type: 'bill',
      linked_entity_id: billId,
      link_role: 'primary_invoice',
      trace_id,
      created_by: SEED.USER_CONTROLLER,
    },
    p_audit: {
      user_id: SEED.USER_CONTROLLER, trace_id,
      action: 'source_document_link_created', entity_type: 'source_document_link', tool_name: null,
    },
  });
  if (error) throw new Error(`link seed failed: ${error.message}`);
}

describe('findLiveBillByVendorAndNumber — provenance discriminator', () => {
  const traceIds: string[] = [];
  const vendorIds: string[] = [];

  afterEach(async () => {
    for (const v of vendorIds) {
      await db.from('bills').delete().eq('vendor_id', v);
      await db.from('vendors').delete().eq('vendor_id', v);
    }
    for (const t of traceIds) {
      await db.from('source_document_links').delete().eq('trace_id', t);
      await db.from('audit_log').delete().eq('trace_id', t);
    }
    vendorIds.length = 0;
    traceIds.length = 0;
  });

  it('a matched bill WITH a live primary_invoice link → is_document_sourced true', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const billId = await seedBill(vendorId);
    const sourceDocId = await seedSourceDoc(trace_id);
    await seedPrimaryInvoiceLink(sourceDocId, billId, trace_id);

    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: BILL_NUMBER,
    });
    expect(result.matched_bill_id).toBe(billId);
    expect(result.is_document_sourced).toBe(true);
  });

  it('a matched bill with NO link (manual/raw) → is_document_sourced false', async () => {
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const billId = await seedBill(vendorId);

    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: BILL_NUMBER,
    });
    expect(result.matched_bill_id).toBe(billId);
    expect(result.is_document_sourced).toBe(false);
  });

  it('a matched bill whose primary_invoice link is REVERSED (voided) → is_document_sourced false', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const billId = await seedBill(vendorId);
    const sourceDocId = await seedSourceDoc(trace_id);
    await seedPrimaryInvoiceLink(sourceDocId, billId, trace_id);
    // Reverse via the REAL bulk-reverse RPC (created → reversed).
    const { error: revErr } = await db.rpc('reverse_source_document_link_with_audit', {
      p_input: { linked_entity_type: 'bill', linked_entity_id: billId },
      p_audit: { controller_user_id: SEED.USER_CONTROLLER, reversal_trace_id: trace_id, reversal_reason: 'test void' },
    });
    if (revErr) throw new Error(`reverse failed: ${revErr.message}`);

    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: BILL_NUMBER,
    });
    expect(result.matched_bill_id).toBe(billId);
    expect(result.is_document_sourced).toBe(false);
  });

  it('no matching bill → matched_bill_id null, is_document_sourced false', async () => {
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: 'NO-SUCH-BILL',
    });
    expect(result.matched_bill_id).toBeNull();
    expect(result.is_document_sourced).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @chounting/web test tests/integration/findLiveBillByVendorAndNumberProvenance.integration.test.ts`
Expected: FAIL — `is_document_sourced` does not exist on the result (TS error or `undefined` !== `true/false`).

- [ ] **Step 3: Extend the interface**

In `extractionReadService.ts`, replace the `LiveBillByVendorAndNumberResult` interface (`:119-126`) with:

```typescript
export interface LiveBillByVendorAndNumberResult {
  /**
   * First LIVE bill (lifecycle_state NOT IN 'voided'/'cancelled') with the same
   * (org, vendor_id, bill_number), or null.
   */
  matched_bill_id: string | null;
  /**
   * True iff matched_bill_id is non-null AND that bill carries a LIVE
   * (link_status='created') primary_invoice source_document_links row — i.e. it
   * was document-sourced. The dup handler fires ONLY when both are true: a
   * matching document-sourced bill is a re-book; a matching bill with no live
   * primary_invoice link is manual/PO/override/voided origin, so the incoming
   * invoice is a legitimate first-arrival attachment (defer to Stage 6). See
   * 2026-07-22-board-4-fork-c-attachment-seam-design.md §3-§4.
   */
  is_document_sourced: boolean;
}
```

- [ ] **Step 4: Add the provenance second-read**

In `findLiveBillByVendorAndNumber`, replace the final `return { matched_bill_id: ... }` (`:168-170`) with:

```typescript
  const matched_bill_id = data && data.length > 0 ? data[0].bill_id : null;

  if (!matched_bill_id) {
    return { matched_bill_id: null, is_document_sourced: false };
  }

  // Provenance discriminator (design §3): the matched bill is document-sourced iff
  // it carries a LIVE (link_status='created') primary_invoice link. link_status=
  // 'created' is load-bearing — a voided bill retains a link_status='reversed'
  // primary_invoice row (links are reversed, never deleted; 20240147), which must
  // NOT count. Lands on source_document_links_entity_status_idx.
  const { data: linkRows, error: linkError } = await db
    .from('source_document_links')
    .select('id')
    .eq('linked_entity_type', 'bill')
    .eq('linked_entity_id', matched_bill_id)
    .eq('link_role', 'primary_invoice')
    .eq('link_status', 'created')
    .limit(1);

  if (linkError) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[semantic-duplicate] provenance-link query failed: ${linkError.message}`,
    );
  }

  return {
    matched_bill_id,
    is_document_sourced: !!(linkRows && linkRows.length > 0),
  };
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @chounting/web test tests/integration/findLiveBillByVendorAndNumberProvenance.integration.test.ts`
Expected: PASS (4/4).

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @chounting/web typecheck`
Expected: clean (no errors).

- [ ] **Step 7: Commit** (operator's per-act word)

Proposed message: `feat(board-4): Fork C — provenance discriminator on findLiveBillByVendorAndNumber (is_document_sourced) [fork-c]`
Stage: `apps/web/src/services/document-platform/extractionReadService.ts` + the new test file.

---

### Task 2: Gate the dup handler + reconcile the pipeline tests

**Files:**
- Modify: `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts:667` (the `if (dup.matched_bill_id)` gate) + the preceding handler comment
- Modify: `apps/web/tests/integration/semanticDuplicatePipelineWiring.integration.test.ts` (add a link-seed helper; upgrade the positive fixture; add must-not-fire cases)
- Verify (no change): `apps/web/tests/integration/routingTerminalDisposition.integration.test.ts`

**Interfaces:**
- Consumes: `findLiveBillByVendorAndNumber(...) → { matched_bill_id, is_document_sourced }` (Task 1).

- [ ] **Step 1: Add a live-link seed helper to `semanticDuplicatePipelineWiring`**

The test's `seedBill(vendor_id, lifecycle_state): Promise<string>` already returns `bill_id` (`:192-208`), and `seedSourceDocument({ trace_id })` returns `{ sourceDocId, caseId }`. Add, next to `seedBill`:

```typescript
// Seed a LIVE (created) primary_invoice link on a bill via the REAL RPC — the
// same write path billService.post uses (write-path fidelity). Makes the bill
// read as document-sourced → the dup handler's provenance gate fires. See design §8.1.
async function seedPrimaryInvoiceLink(
  sourceDocId: string,
  billId: string,
  trace_id: string,
): Promise<void> {
  const { error } = await db.rpc('create_source_document_link_with_audit', {
    p_link: {
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      linked_entity_type: 'bill',
      linked_entity_id: billId,
      link_role: 'primary_invoice',
      trace_id,
      created_by: SEED.USER_CONTROLLER,
    },
    p_audit: {
      user_id: SEED.USER_CONTROLLER, trace_id,
      action: 'source_document_link_created', entity_type: 'source_document_link', tool_name: null,
    },
  });
  if (error) throw new Error(`link seed failed: ${error.message}`);
}
```

Also extend the `afterEach` cleanup (currently deletes `bills`/`vendors`/`audit_log` by key) to also delete the links: add `await db.from('source_document_links').delete().eq('linked_entity_id', /* each seeded bill_id */ ...)` — simplest: capture seeded `bill_id`s in an array `billIds` and, in `afterEach`, `for (const b of billIds) await db.from('source_document_links').delete().eq('linked_entity_id', b);` before the `bills` delete.

- [ ] **Step 2: Upgrade the positive test + add the must-not-fire cases (RED)**

The existing positive test (`:233`) does `await seedBill(vendorId, 'fully_paid')` and expects dup to fire. Under the fix, that raw bill reads as NOT document-sourced → dup would defer → the test would break. Change it to seed a linked bill, and add the defer cases. Capture the `bill_id` and, in the positive/reprocess tests, link it:

```typescript
  it('confident extraction + a live DOCUMENT-SOURCED bill (primary_invoice link) with the same (vendor, number) → parks at needs_review with duplicate_invoice_suspected, short-circuiting before the matcher', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    const billId = await seedBill(vendorId, 'fully_paid');
    billIds.push(billId);
    await seedPrimaryInvoiceLink(sourceDocId, billId, trace_id); // document-sourced ⇒ dup fires
    // ... existing assertions unchanged (parks, duplicate_invoice_suspected, trace short-circuit)
  });

  it('MUST-NOT-FIRE — a matching bill with NO primary_invoice link (manual/PO origin) → dup DEFERS, full pipeline attaches', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    const billId = await seedBill(vendorId, 'approved_for_payment');
    billIds.push(billId);
    // NO seedPrimaryInvoiceLink → the bill reads as manual → dup must defer.
    void sourceDocId;

    const result = await ingestDocument({ org_id: SEED.ORG_HOLDING, source_document_id: sourceDocId, trace_id });
    expect(result.failure_class).toBeNull();

    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_against_existing_state'); // Stage 6 ran (attach path)
    expect(stages).toContain('build_proposal');

    const { data: dupExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'duplicate_invoice_suspected');
    expect(dupExceptions).toHaveLength(0);
  });

  it('MUST-NOT-FIRE — a matching bill whose primary_invoice link is REVERSED (voided) → dup DEFERS (link_status guard)', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    const billId = await seedBill(vendorId, 'approved_for_payment');
    billIds.push(billId);
    await seedPrimaryInvoiceLink(sourceDocId, billId, trace_id);
    const { error: revErr } = await db.rpc('reverse_source_document_link_with_audit', {
      p_input: { linked_entity_type: 'bill', linked_entity_id: billId },
      p_audit: { controller_user_id: SEED.USER_CONTROLLER, reversal_trace_id: trace_id, reversal_reason: 'test void' },
    });
    if (revErr) throw new Error(`reverse failed: ${revErr.message}`);

    const result = await ingestDocument({ org_id: SEED.ORG_HOLDING, source_document_id: sourceDocId, trace_id });
    expect(result.failure_class).toBeNull();
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_against_existing_state');

    const { data: dupExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'duplicate_invoice_suspected');
    expect(dupExceptions).toHaveLength(0);
  });
```

Declare `const billIds: string[] = [];` alongside `traceIds`. Also update the `reprocess` test (`:299`) the same way as the positive test (seed the link so it still fires). Leave the existing NEGATIVE CONTROL and guard-arm tests unchanged (they seed no colliding bill / an unmatched vendor).

- [ ] **Step 3: Run the pipeline test — verify the must-not-fire cases FAIL**

Run: `pnpm --filter @chounting/web test tests/integration/semanticDuplicatePipelineWiring.integration.test.ts`
Expected: the two new MUST-NOT-FIRE tests FAIL (the handler still fires on the unlinked/reversed bills — expected `match_against_existing_state` present but the dup exception is enqueued and Stage 6 skipped). Confirm `grep -c "callClaude: API call complete"` on the output is `0`.

- [ ] **Step 4: Implement the handler gate**

In `ingestDocument.ts`, change the dup gate at `:667` from `if (dup.matched_bill_id) {` to:

```typescript
    // Provenance gate (design §4.1): fire ONLY when the matched live bill is
    // itself document-sourced (a live primary_invoice link). A matching bill with
    // no live link is manual/PO/override/voided origin → the incoming invoice is a
    // legitimate first-arrival attachment → fall through to Stage 6 (INV-WORKFLOW-002
    // ATTACHMENT EXIT). Distinguishes re-book (fire) from attachment (defer).
    if (dup.matched_bill_id && dup.is_document_sourced) {
```

- [ ] **Step 5: Run the pipeline test — verify all pass**

Run: `pnpm --filter @chounting/web test tests/integration/semanticDuplicatePipelineWiring.integration.test.ts`
Expected: PASS (all cases incl. the two MUST-NOT-FIRE and the upgraded positive/reprocess). `callClaude` count `0`.

- [ ] **Step 6: Verify `routingTerminalDisposition` green FOR THE RIGHT REASON**

Run: `pnpm --filter @chounting/web test tests/integration/routingTerminalDisposition.integration.test.ts`
Expected: PASS (5/5). The "ATTACHMENT EXIT (bill seeded)" case passes **because** its raw `seedOpenBill` bill has no live link → dup defers → Stage 6 attaches → `current_relationship_candidate_id` set (line 381) and `befores` contains `'matched'` (line 384). No code change to this file — it is the governance-invariant guard; confirm the head-pointer + `'matched'` assertions are what pass, not a weaker path.

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @chounting/web typecheck`
Expected: clean.

- [ ] **Step 8: Commit** (operator's per-act word)

Proposed message: `fix(board-4): Fork C — dup provenance gate (fire only on document-sourced bills; restore INV-WORKFLOW-002 ATTACHMENT EXIT) [fork-c]`
Stage: `ingestDocument.ts` + `semanticDuplicatePipelineWiring.integration.test.ts`.

---

### Task 3: Bank-detail & statement — document the intentional route + coverage test

**Files:**
- Modify: `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` (bank-detail handler comment ~:500; statement handler comment ~:583)
- Modify: `apps/web/tests/integration/bankDetailChangePipelineWiring.integration.test.ts` + `apps/web/tests/integration/statementNotInvoicePipelineWiring.integration.test.ts`

- [ ] **Step 1: Write the coverage tests (bank-detail + statement) — matches-a-live-bill + OCR-trigger**

In each pipeline test, add a case where the document trips the OCR trigger AND matches a live (document-sourced) bill, asserting the handler still routes to human under its own reason (head pointer deferred, per design §4.2/§7). Bank-detail example (mirror the existing `BOTH_TRIP` structure; seed a linked bill via the same `create_source_document_link_with_audit` RPC pattern from Task 2 Step 1):

```typescript
  it('COVERAGE — a coordinate-bearing invoice that ALSO matches a live document-sourced bill still routes to bank_detail_change_suspected (route-to-human is correct even when it would attach; head pointer deferred per design §4.2)', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(COORD_LINES); // Invoice #<INVOICE_NUMBER> + Routing number: ...
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    const billId = await seedBill(vendorId, 'approved_for_payment'); // bill_number === INVOICE_NUMBER
    // (add the seedPrimaryInvoiceLink helper here as in Task 2 Step 1; link the bill)

    const result = await ingestDocument({ org_id: SEED.ORG_HOLDING, source_document_id: sourceDocId, trace_id });
    expect(result.status).toBe('parked_unposted');
    const { data: exceptions } = await db
      .from('exception_queue_entries').select('exception_reason').eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('bank_detail_change_suspected');
  });
```

Statement: analogous, asserting `statement_not_invoice_suspected`, using the statement fixture that already classifies vendor_invoice.

- [ ] **Step 2: Run both — verify they PASS** (bank-detail/statement fire on their OCR trigger regardless of the bill; no code change yet)

Run: `pnpm --filter @chounting/web test tests/integration/bankDetailChangePipelineWiring.integration.test.ts tests/integration/statementNotInvoicePipelineWiring.integration.test.ts`
Expected: PASS. `callClaude` count `0`. (These document the *current, correct* disposition — the tests are the durable record that it is intentional.)

- [ ] **Step 3: Add the intentional-route comment to each handler**

In `ingestDocument.ts`, append to the bank-detail handler comment (before its `if (`) and the statement handler comment:

```typescript
    // SEAM NOTE (design §4.2): this handler routes to a human even when the
    // document would ALSO legitimately attach to an existing bill — its trigger is
    // a claim about the document's own content (payment coordinates / statement
    // shape), true regardless of a matching bill. It intentionally does NOT get the
    // dup handler's provenance gate. Cost: the attachment head pointer is not set
    // (convenience loss, not a wrong disposition) — recovery is deferred (design §7).
```

- [ ] **Step 4: Run both again + typecheck**

Run the two test files (Expected: PASS) and `pnpm --filter @chounting/web typecheck` (Expected: clean).

- [ ] **Step 5: Commit** (operator's per-act word)

Proposed message: `docs(board-4): Fork C — bank-detail/statement intentional-route seam note + attachment-coverage tests [fork-c]`

---

### Task 4: Full-suite verification & push-readiness

**Files:** none (verification task).

- [ ] **Step 1: Run the full suite**

Run: `pnpm test:full > /tmp/testfull.log 2>&1; tail -6 /tmp/testfull.log`
Expected: **1 failed / (1917+) passed** — the only remaining failure is the **pre-existing** `ReviewCaseDetailView.test.tsx` stale-text divergence (`"Posted and committed (posted)."` vs `"Posted and committed."`), which is byte-unchanged on the branch and documented in the T6 friction-journal entry + design §8.7. `routingTerminalDisposition` now passes (was the 2nd failure).

- [ ] **Step 2: Confirm the deviation is the documented pre-existing one, not a regression**

Run: `grep -E "FAIL " /tmp/testfull.log | grep -oE "tests/[^ ]+\.(test|spec)\.(ts|tsx)" | sort -u`
Expected: exactly `tests/unit/components/ReviewCaseDetailView.test.tsx`. If anything else appears, STOP — a new regression; do not proceed to push.

- [ ] **Step 3: Report push-readiness to the operator**

Condition 1 (test-suite): met via the escape clause — the single failure is the documented pre-existing `ReviewCaseDetailView` deviation (mechanism: stale expected-text; fix shape: align the test's expected string or the component copy; carry-forward: separate item, tracked in the T6 entry). Condition 2 (doc-sync): verified clean this arc (no live governance twin enumerates `exception_reason`; no substrate change here). Report the state; **the push itself is the operator's separate word.**

---

## Notes for the executor

- **Out of scope (do NOT fix here):** the `ReviewCaseDetailView` stale-text failure (a separate pre-existing carry-forward, not the seam); the bank-detail/statement head-pointer preservation (design §7 deferred); any migration (this fix is read-side only).
- **The `link_status='created'` predicate is the correctness linchpin** — the Task 1 reversed-link test (Step 1) and the Task 2 reversed-link must-not-fire case (Step 2) are its guards; do not drop them.
- **Fixture fidelity:** always seed links via `create_source_document_link_with_audit` / reverse via `reverse_source_document_link_with_audit`, never a raw `source_document_links` insert/update (the reversal trigger would reject a raw status flip anyway).
