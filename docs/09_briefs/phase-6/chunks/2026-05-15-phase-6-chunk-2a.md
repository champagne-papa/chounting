# Phase 6 Chunk 6.2a — Substrate-Consumer-Conformance (Path C first half)

- **Date**: 2026-05-15
- **Phase**: 6 (Ingestion)
- **Chunk**: 6.2a (substrate-consumer-conformance half of Path C
  invocation; chunk 6.2b ships drag-drop service + routes + UI in a
  future session; chunk 6.3 ships forwarded_mailbox)
- **Status**: brief-drafting (writing-plans session 2026-05-15;
  brainstorming session preceded at this same date)
- **Brainstorming session**: this session walked Sub-Q4 + Sub-Q5 from
  the chunk 6.1 carry-forward (`docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-1.md`
  §"Post-implementation carry-forward (2026-05-15)" + §"Post-close
  meta-observations (2026-05-15)"). Sub-Q1 / Sub-Q2 / Sub-Q3 / Sub-Q6 /
  Sub-Q7 / Sub-Q8 / Sub-Q9 + new Sub-Q10 (route-path convention) defer
  to chunk 6.2b brief-draft session.

## Path C invocation callout

Phase 4 chunk 3 codified Path C as RI-7 invocation discipline (F-J-14
tier-1; per `CLAUDE.md` §"Verify-forward-at-scope-lock for
computational-shape chunks" RI-7). Chunk 6.2a is the **second
observation-grain instance** of Path C invocation, and the first to
invoke Path C **prospectively at brief-draft** (Phase 4 chunk 3 was
reactive — the split surfaced mid-implementation as the framing-
discovery arc absorbed five framings into an amended brief
`c76d264`).

Four evidence points anchor Path C invocation at chunk 6.2a:

1. **Volume forecast.** Combined chunk 6.2 forecast is ~1700-2300 LOC
   (substrate + consumer + 30-caller refactor + new service + routes +
   UI + new tests). Chunk-3-Phase-4 empirical upper bound is ~1400 LOC
   (per `CLAUDE.md` RI-7 calibration). 6.2a alone forecasts ~700-1100
   LOC (substrate + consumer + helper + 30-caller refactor + 4 new
   tests). 6.2b forecast is ~1000-1200 LOC residual.

2. **Five framings from verify-from-disk** at brainstorming-session
   pre-reading:
   - Sub-Q5 caller surface — Subagent 4's "36 across 13 test files"
     resolved to **30 call sites across 10 invoking test files** at
     verify-from-disk; the additional 3 file-refs are
     comments/imports. Notational drift in pre-reading; lock at the
     verified count.
   - Route-path convention drift — chunk 6.1 carry-forward + handoff
     cite `/api/documents/...`; disk evidence shows existing API
     surface is org-scoped under `/api/orgs/[orgId]/...` (28 of 30
     listed routes). Sub-Q10 NEW lock at chunk 6.2b.
   - Triage Bucket PRD insufficiency — `docs/01_prd/triage_bucket_intake.md`
     is a 21-line 2026-04-16 design-sprint stub explicitly "Not yet
     scoped, not yet specified beyond this stub." Sub-Q1 (drag-drop
     UX surface) is genuinely an open lock at v1, not a deferred-
     from-PRD lookup. Lock at chunk 6.2b.
   - Sentinel filter shape — sentinel batches identified by
     `channel_metadata @> '{"sentinel": true, "migration": 152}'::jsonb`
     (gen_random_uuid at migration time; no hardcoded constant). Cards
     endpoint sentinel filter must use the JSONB containment shape.
     Lock at chunk 6.2b.
   - Migration 137 column-list extension shape — RPC currently INSERTs
     13 columns excluding `ingest_batch_id`; chunk 6.2a extends to 14.
     Lock at Sub-Q5.

3. **Chunk-arc-shape carry-forward** from chunk 6.1 post-close
   meta-observation #1: 5-commit arc shape as Path-C-adjacent precedent
   (`e16eb8c` brief + `010fe97` Commit 1 + `2d6d0ca` brief amendment +
   `2c85ee6` Commit 2 + `3ba9b1d` post-implementation carry-forward).
   Repeating the chunk-1-Phase-2 single-commit shape for chunk 6.2 is
   structurally infeasible at the verified caller surface (~700-1100
   LOC for 6.2a alone; ~1000-1200 for 6.2b residual).

4. **Wiring-with-tests-pairing at each commit boundary.** 6.2a commit
   ships substrate + consumer + helper + 30-caller refactor + new
   tests; full-suite green at the commit. Chunk 6.3 inherits the NOT
   NULL contract from day 1. 6.2b commit ships ingestionService +
   routes + cards + UI + new tests; full-suite green at that commit.
   Each commit is independently revertable.

**Path C codification graduates** at chunk 6.2a close per
observation-grain N=2 instances (Phase 4 chunk 3 + chunk 6.2). F-J-14
second-instance tier-1 entry consolidates: "Path C invocation
criteria are RI-7-evidence-driven, not gut-feel-driven; both volume-
threshold AND N≥3-framings triggers fire independently AND at
brief-draft (prospective), not at implementation (reactive)." Per
`CLAUDE.md` codification convention §"Codification convention:
observation-grain vs application-grain N count": observation-grain
N=2 is below codification threshold (N=3) but the second-instance
entry codifies the prospective-vs-reactive sub-discipline.

## Notes on chunk-naming convention

Chunk 6.2a is the **first instance** of the `Na`/`Nb` chunk-suffix
naming convention applied at **brief-grain** (separate brief per
half) rather than at commit-grain (single brief, multiple commits).

Phase 4 chunk 3 used `3a`/`3b` at commit-message + scope-lock-memory
level only; the brief was a single file `2026-05-14-phase-4-chunk-3.md`
covering both halves (because Path C surfaced mid-implementation, not
at brief-draft).

Chunk 6.2 invokes Path C **prospectively at brief-draft**, which makes
two separate briefs the cleaner shape — each session produces one
brief; each brief ships one commit; the implementing agent reads one
brief end-to-end without bifurcation.

The convention worth flagging for Phase 6 retrospective codification:

- **Brief-grain `Na`/`Nb` suffix** (e.g., `2026-05-15-phase-6-chunk-2a.md`,
  `2026-05-XX-phase-6-chunk-2b.md`) for prospective Path C invocation
  at brief-draft.
- **Commit-grain `Na`/`Nb` suffix** (e.g., `feat(phase-4): chunk 3a — ...`)
  for reactive Path C invocation surfaced mid-implementation;
  single brief covers both halves with amendment cycle.

Codification candidate at Phase 6 retrospective consolidation. Below
codification threshold (N=1 observation-grain at brief-grain); flagged
as forward-pointer.

## Architecture

**Single commit at chunk 6.2a** per Path C precedent — substrate +
consumer + helper + 30-caller refactor + new tests bundle at a single
commit boundary; full-suite validation gate green at that commit.

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20240153000000_phase_6_chunk_2a_consumer_conformance.sql` | Create | Migration 153: 4-statement body — (1) AMEND `create_source_document_with_audit` RPC body (extend INSERT column list 13→14 cols; add `ingest_batch_id` extraction from `p_source_document.ingest_batch_id`); (2) CREATE `create_ingest_batch_for_test` test-only RPC + GRANT EXECUTE TO service_role + heavy comment block declaring v1 callers limited to test fixtures; (3) ALTER source_documents.ingest_batch_id SET NOT NULL (Step C); (4) CREATE OR REPLACE `enforce_source_documents_column_immutability` trigger function with 13-column comparison (Step D; current 12 columns + `ingest_batch_id`). |
| `apps/web/src/services/document-platform/types.ts` | Modify | Extend `CreateSourceDocumentInput` interface (lines 29-63) — add `ingest_batch_id: string` (UUID-shaped; required) between `org_id` and `ingest_channel`. |
| `apps/web/src/services/document-platform/documentPlatformService.ts` | Modify | (a) Update `createSourceDocumentImpl` body — `sourceDocumentPayload` JSONB (lines 141-155) gains `ingest_batch_id: input.ingest_batch_id` between `ingest_channel` and `storage_status`; (b) Update file-top comment block — add chunk 6.2a addendum after the 6-step flow enumeration (line 59) noting `ingest_batch_id` is now required per Sub-Q4 Step C activation. |
| `apps/web/tests/helpers/createIngestBatchForTest.ts` | Create | New shared test helper exporting `createIngestBatchForTest(orgId: string, options?) → Promise<{ingest_batch_id: string, trace_id: string}>`. snake_case return shape mirrors existing `CreateSourceDocumentResult` convention; enables ES2015 shorthand at call sites. Composes `create_ingest_batch_for_test` test-only RPC (NOT chunk 6.1's `create_ingest_batch_with_documents_with_audit` — fixture isolation per Sub-Q5 (i.B) lock; β over α). |
| 10 integration/unit test files (30 call sites) | Modify | Caller refactor — see Grain-5-test-floor enumeration in Test plan. Each call site: (a) `import { createIngestBatchForTest } from '@/tests/helpers/createIngestBatchForTest'` (or relative path); (b) precede `createSourceDocument` call with `const { ingest_batch_id } = await createIngestBatchForTest(org_id)` (hoist to `beforeEach`/`beforeAll` for shared-batch tests where multiple call sites use the same batch); (c) extend args object with `ingest_batch_id` (ES2015 shorthand — destructured name matches field name). |
| `apps/web/tests/integration/ingestSubstrate.integration.test.ts` | Modify | Reshape Test 8 from "asserts nullable contract" to "asserts NOT NULL contract" (line 238 — currently `expect(row?.ingest_batch_id).toBeNull()` against an INSERT that omits `ingest_batch_id`; reshape to assert the INSERT raises NOT NULL violation). Update file-top comment (line 4) and Test 8 describe-block string (line 237) to reflect post-Step-C state. Test 9 (FK enforcement when value provided) stays valid. |
| `apps/web/tests/integration/migration153ConstraintActivation.integration.test.ts` | Create | New tests (4): (a) Step D verification — UPDATE on `ingest_batch_id` raises `feature_not_supported`; (b) `create_ingest_batch_for_test` walkable proof — produces a valid ingest_batches row queryable by org_id; (c) `create_ingest_batch_for_test` GRANT scoping — only service_role can EXECUTE (discipline-verification test, not behavioral test; substrate-discipline is the load-bearing concern for a test-only RPC at v1 boundary; implementing agent does NOT wire production caller code into this test); (d) RPC amendment regression — `create_source_document_with_audit` rejects payloads omitting `ingest_batch_id` (NOT NULL violation propagates through the RPC). |
| `docs/07_governance/friction-journal.md` | Modify (at chunk close) | Pre-drafted (D)-filter entries materialize at chunk close — see Friction-journal placeholder section. F-J-14 second-instance tier-1 codification candidate (Path C invocation as RI-7-evidence-driven + prospective). |

### Locked sub-questions (carry-forward from chunk 6.2a brainstorming 2026-05-15)

The 9 chunk 6.2 sub-questions enumerated in chunk 6.1 carry-forward
partition by Path C half. **Chunk 6.2a** locks Sub-Q4 + Sub-Q5;
chunk 6.2b session locks the remaining 7 + Sub-Q10 NEW.

**Sub-Q4 — Step C activation timing: chunk 6.2 + Path C split (option (a)).**
Per chunk 6.1 carry-forward Sub-Q4 4-step activation sequence,
chunk 6.2a co-locates Step C (`ALTER COLUMN ingest_batch_id SET NOT NULL`)
+ Step D (immutability trigger 12→13 cols) with the consumer
amendments (RPC + service signature + 30-caller refactor) per Grain 5
(existing-consumer-contract-conformance) discipline. Three options
rejected at scope-lock:

- (a-single-session) — single-commit at chunk 6.2 with both halves;
  rejected because volume forecast ~1700-2300 LOC exceeds
  chunk-3-Phase-4 ~1400 LOC empirical anchor; RI-7 Path C invocation
  fires.
- (b-defer-to-6.3) — chunk 6.2 ships drag-drop against nullable
  column; chunk 6.3 lands consumer amendment + Step C/D as part of
  forwarded_mailbox arc; rejected because it accumulates a
  second-chunk amendment-cycle risk on top of forwarded_mailbox's
  already-complex scope (mail provider + parsing + allowlist +
  retrospective).
- (c-split-across-chunks) — chunk 6.2 amends RPC to accept
  `ingest_batch_id` (non-breaking option (ii) from carry-forward);
  chunk 6.3 lands SET NOT NULL after forwarded_mailbox also passes
  it; rejected per chunk 6.1 meta-observation #3 ("Sub-Q4 split-
  across-chunks shape is itself a precedent" — repeating the shape
  twice within Phase 6 turns single-instance observation into
  emerging anti-pattern).

**Sub-Q5 — signature amendment shape: required field on input contract
+ `tests/helpers/createIngestBatchForTest.ts` shared helper backed by
`create_ingest_batch_for_test` test-only RPC (option (i.B) with β
helper internal shape).**

The breakage surface from chunk 6.1 close — 57 cross-phase test
failures rooted in `documentPlatformService.createSourceDocument`
omitting `ingest_batch_id` from the migration 137 RPC payload — maps
to **30 call sites across 10 invoking test files** (verify-from-disk
adjusted from Subagent 4's preliminary "36 across 13 files"). All 30
update in the same commit per Grain 5; the helper amortizes the
fixture-creation work to ~80 LOC of helper + ~10 LOC per call site
≈ ~380 LOC total vs ~30-50 LOC × 10 files ≈ 300-500 LOC of
duplicated inline fixtures.

The β helper internal shape (test-only RPC) over α (chunk 6.1's
6-JSONB-param atomic RPC) is locked because:

- **Test isolation at fixture grain**: invoking chunk 6.1's 5-table
  atomic RPC during 30 unrelated test fixtures couples those fixtures
  to the chunk 6.1 RPC's full per-channel write composition discipline.
  Any future chunk-6.1-RPC amendment (Phase 6 retrospective + chunk 6.3
  forwarded_mailbox extension are likely amendment sites) cascades
  through 30 fixtures. Same drift Grain 5 was codified to catch
  applied to test infrastructure.
- **Chunk 6.1 RPC has dedicated correctness coverage** (15 new tests
  at chunk 6.1 close per `createIngestBatchWithDocumentsRpcRollback.test.ts`
  + `ingestSubstrate.integration.test.ts`). Re-exercising the RPC during
  unrelated fixture setup adds coupling, not coverage.
- **`_for_test` suffix codifies test-only substrate** as a
  greppable convention. First-instance precedent in the codebase
  (mirrors `_with_audit` = mutating RPC per F-J-ε convention from
  Phase 4 chunk 2). Layer 3 service-no-emit applies: production
  ingestionService (chunks 6.2b + 6.3) MUST NOT call
  `create_ingest_batch_for_test`; production code uses
  `create_ingest_batch_with_documents_with_audit` exclusively.

**Sub-Q1 / Sub-Q2 / Sub-Q3 / Sub-Q6 / Sub-Q7 / Sub-Q8 / Sub-Q9 + new
Sub-Q10**: defer to chunk 6.2b brief-draft session. Enumerated in
What's-next section.

### Substrate shape — migration 153 (4 statements)

Migration body composed of four discrete statements + heavy comment
block per migration 137 + 152 precedent (cite ADRs, INV-AUDIT-001,
Layer-3 service-no-emit discipline, _for_test convention).

```sql
-- =============================================================
-- 20240153000000_phase_6_chunk_2a_consumer_conformance.sql
-- Phase 6 chunk 6.2a — Sub-Q4 Step C/D activation + Sub-Q5 RPC
-- amendment + create_ingest_batch_for_test test-only RPC.
--
-- Per chunk 6.1 carry-forward (commit 3ba9b1d) Sub-Q4 4-step
-- activation sequence:
--   (1) Update consumer (createSourceDocument signature change ships
--       in same commit as this migration);
--   (2) Backfill interim-period rows — none expected (chunk 6.1
--       sentinel-batch backfill covered pre-migration-152 rows;
--       inter-chunk window is single-session-grain);
--   (3) ALTER source_documents.ingest_batch_id SET NOT NULL (Step C);
--   (4) Extend enforce_source_documents_column_immutability trigger
--       (Step D; 12 → 13 columns).
--
-- ADR-0010 layer discipline:
--   - Layer 1: ALTER NOT NULL + trigger extension catches service_role
--     bypass of NOT NULL contract;
--   - Layer 2: TypeScript boundary at CreateSourceDocumentInput.ingest_batch_id
--     (typed-required);
--   - Layer 3: service emission at createSourceDocumentImpl always
--     passes ingest_batch_id from input.
--
-- INV-AUDIT-001: RPC amendment preserves the existing audit_log
-- emission shape (entity_type='source_document'); the new column is
-- additive on the entity row, not a new audit-grain.
--
-- _for_test suffix convention: first instance in the codebase. Codifies
-- "test-only substrate; production code never calls this." Mirrors
-- _with_audit suffix convention (mutating RPC) per F-J-ε precedent
-- (Phase 4 chunk 2).
--
-- Layer 3 service-no-emit on test-only RPC: production ingestionService
-- (chunks 6.2b + 6.3) MUST NOT call create_ingest_batch_for_test;
-- production code uses create_ingest_batch_with_documents_with_audit
-- (chunk 6.1) exclusively.
--
-- Path C invocation per chunk 6.2a brief §"Path C invocation callout":
-- combined 6.2a+6.2b LOC forecast ~1700-2300 vs chunk-3-Phase-4 ~1400
-- empirical anchor; five framings from verify-from-disk; chunk-arc-
-- shape carry-forward from chunk 6.1 meta-observation #1; wiring-with-
-- tests-pairing at each commit boundary.
--
-- See docs/07_governance/adr/0011-document-platform.md §1 (entity
-- ownership) + §2 (source_documents schema).
-- See docs/02_specs/ledger_truth_model.md INV-AUDIT-001 leaf.
-- See supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql
-- (the RPC this migration amends).
-- See supabase/migrations/20240152000000_ingestion_substrate.sql
-- §"source_documents.ingest_batch_id 3-step ALTER" (Step A + Step B
-- shipped at chunk 6.1; Step C + Step D ship here).
-- =============================================================

-- =============================================================
-- Statement 1: AMEND create_source_document_with_audit RPC body.
-- Function signature unchanged (still (p_source_document JSONB,
-- p_audit JSONB)); INSERT column list extends from 13 → 14 cols.
-- p_source_document JSONB shape now requires ingest_batch_id key.
-- =============================================================

CREATE OR REPLACE FUNCTION create_source_document_with_audit(
  p_source_document JSONB,
  p_audit           JSONB
)
RETURNS UUID AS $$
DECLARE
  v_source_document_id UUID;
BEGIN
  v_source_document_id := (p_source_document->>'id')::uuid;

  INSERT INTO source_documents (
    id,
    org_id,
    legal_entity_id,
    storage_provider,
    original_storage_key,
    original_content_hash,
    original_byte_size,
    original_filename,
    mime_type,
    ingest_channel,
    ingest_batch_id,            -- NEW at chunk 6.2a per Sub-Q5 lock
    storage_status,
    received_at,
    created_by
  )
  VALUES (
    v_source_document_id,
    (p_source_document->>'org_id')::uuid,
    NULLIF(p_source_document->>'legal_entity_id', '')::uuid,
    (p_source_document->>'storage_provider')::storage_provider,
    p_source_document->>'original_storage_key',
    p_source_document->>'original_content_hash',
    (p_source_document->>'original_byte_size')::bigint,
    p_source_document->>'original_filename',
    p_source_document->>'mime_type',
    (p_source_document->>'ingest_channel')::ingest_channel,
    (p_source_document->>'ingest_batch_id')::uuid,   -- NEW; required post Step C
    (p_source_document->>'storage_status')::storage_status,
    (p_source_document->>'received_at')::timestamptz,
    p_source_document->>'created_by'
  );

  -- audit_log INSERT block unchanged from migration 137.
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    NULLIF(p_audit->>'org_id', '')::uuid,
    NULLIF(p_audit->>'user_id', '')::uuid,
    (p_audit->>'trace_id')::uuid,
    p_audit->>'action',
    p_audit->>'entity_type',
    v_source_document_id,
    p_audit->'before_state',
    NULLIF(p_audit->>'after_state_id', '')::uuid,
    p_audit->>'tool_name',
    NULLIF(p_audit->>'idempotency_key', '')::uuid,
    p_audit->>'reason'
  );

  RETURN v_source_document_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- GRANT preserved from migration 137 (idempotent on CREATE OR REPLACE).
GRANT EXECUTE ON FUNCTION create_source_document_with_audit(JSONB, JSONB) TO service_role;

-- =============================================================
-- Statement 2: CREATE create_ingest_batch_for_test test-only RPC.
-- Test-only substrate per _for_test suffix convention. v1 callers
-- limited to tests/helpers/createIngestBatchForTest.ts +
-- chunks 6.2b/6.3 test fixtures. Production ingestionService uses
-- create_ingest_batch_with_documents_with_audit (chunk 6.1)
-- exclusively per Layer 3 service-no-emit discipline.
--
-- Narrower scope than chunk 6.1's RPC: writes a SINGLE ingest_batches
-- row only. Does NOT compose source_documents + document_cases +
-- document_jobs + audit_log. Tests that need a parent batch_id for
-- a downstream source_documents INSERT (the 30-caller refactor at
-- chunk 6.2a + future chunk-6.3 forwarded_mailbox tests) get the
-- batch_id without exercising chunk 6.1's 5-table atomic discipline
-- as a side effect.
-- =============================================================

CREATE OR REPLACE FUNCTION create_ingest_batch_for_test(
  p_org_id            UUID,
  p_ingest_channel    ingest_channel  DEFAULT 'drag_drop_pdf',
  p_received_at       TIMESTAMPTZ     DEFAULT NOW(),
  p_channel_metadata  JSONB           DEFAULT '{}'::jsonb,
  p_trace_id          UUID            DEFAULT gen_random_uuid()
)
RETURNS TABLE (ingest_batch_id UUID, trace_id UUID) AS $$
DECLARE
  v_batch_id UUID;
BEGIN
  v_batch_id := gen_random_uuid();
  INSERT INTO ingest_batches (
    id, org_id, ingest_channel, received_at, channel_metadata, trace_id, created_by
  )
  VALUES (
    v_batch_id, p_org_id, p_ingest_channel, p_received_at,
    p_channel_metadata, p_trace_id, 'test_helper_create_ingest_batch_for_test'
  );
  RETURN QUERY SELECT v_batch_id, p_trace_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION create_ingest_batch_for_test(
  UUID, ingest_channel, TIMESTAMPTZ, JSONB, UUID
) TO service_role;

-- =============================================================
-- Statement 3: ALTER source_documents.ingest_batch_id SET NOT NULL
-- (Sub-Q4 Step C). All consumer paths updated in same commit per
-- Grain 5; no interim-period rows expected.
-- =============================================================

ALTER TABLE source_documents
  ALTER COLUMN ingest_batch_id SET NOT NULL;

-- =============================================================
-- Statement 4: CREATE OR REPLACE enforce_source_documents_column_immutability
-- with 13-column comparison (Sub-Q4 Step D; current 12 cols + ingest_batch_id).
-- Original 12-column body at supabase/migrations/20240135000000_storage_substrate.sql:384-404.
-- =============================================================

CREATE OR REPLACE FUNCTION enforce_source_documents_column_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id                    IS DISTINCT FROM NEW.id                    OR
     OLD.org_id                IS DISTINCT FROM NEW.org_id                OR
     OLD.legal_entity_id       IS DISTINCT FROM NEW.legal_entity_id       OR
     OLD.storage_provider      IS DISTINCT FROM NEW.storage_provider      OR
     OLD.original_storage_key  IS DISTINCT FROM NEW.original_storage_key  OR
     OLD.original_content_hash IS DISTINCT FROM NEW.original_content_hash OR
     OLD.original_byte_size    IS DISTINCT FROM NEW.original_byte_size    OR
     OLD.original_filename     IS DISTINCT FROM NEW.original_filename     OR
     OLD.ingest_channel        IS DISTINCT FROM NEW.ingest_channel        OR
     OLD.ingest_batch_id       IS DISTINCT FROM NEW.ingest_batch_id       OR
     OLD.received_at           IS DISTINCT FROM NEW.received_at           OR
     OLD.created_at            IS DISTINCT FROM NEW.created_at            OR
     OLD.created_by            IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'source_documents column-immutability violation: only current_version_id, storage_status, and mime_type may change post-ingestion (per ADR-0011 §2 + ADR-0013 §11)'
      USING ERRCODE = 'feature_not_supported';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger binding unchanged from migration 135:406-409; idempotent
-- on CREATE OR REPLACE FUNCTION (no need to DROP TRIGGER + CREATE
-- TRIGGER).
```

### Service surface — `createSourceDocument` signature change

`apps/web/src/services/document-platform/types.ts` (modify lines 29-63):

```typescript
export interface CreateSourceDocumentInput {
  bytes: Uint8Array;
  mime_type: string;
  original_filename: string;
  org_id: string;

  // NEW at chunk 6.2a per Sub-Q4 Step C activation. UUID-shaped.
  // Caller (drag-drop ingestionService at chunk 6.2b; forwarded_mailbox
  // ingestionService at chunk 6.3) creates the parent ingest_batches
  // row first via chunk 6.1's create_ingest_batch_with_documents_with_audit
  // RPC, then passes the returned batch_id here. Test fixtures use
  // tests/helpers/createIngestBatchForTest.ts to obtain a batch_id.
  // Production code MUST NOT call create_ingest_batch_for_test (Layer 3
  // service-no-emit per migration 153 _for_test suffix convention).
  ingest_batch_id: string;

  ingest_channel: IngestChannelEnum;
  received_at: string;
  created_by: string;
}
```

`apps/web/src/services/document-platform/documentPlatformService.ts` (modify lines 141-155 + lines 1-71 file-top comment):

```typescript
const sourceDocumentPayload = {
  id: source_document_id,
  org_id: input.org_id,
  legal_entity_id: input.org_id,
  storage_provider: V1_STORAGE_PROVIDER,
  original_storage_key: putResult.storage_key,
  original_content_hash: putResult.content_hash,
  original_byte_size: putResult.byte_size,
  original_filename: input.original_filename,
  mime_type: input.mime_type,
  ingest_channel: input.ingest_channel,
  ingest_batch_id: input.ingest_batch_id,    // NEW per Sub-Q4 Step C
  storage_status: 'available' as const,
  received_at: input.received_at,
  created_by: input.created_by,
};
```

File-top comment addendum (insert after line 59 closing the 6-step
flow block):

```typescript
//
//   Chunk 6.2a addendum: input.ingest_batch_id is required per
//   Sub-Q4 Step C activation (see migration 153 +
//   docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-2a.md).
//   sourceDocumentPayload at step 4 includes ingest_batch_id;
//   create_source_document_with_audit RPC's INSERT column list
//   extends from 13 → 14 columns. Caller (chunk 6.2b drag-drop
//   ingestionService; chunk 6.3 forwarded_mailbox ingestionService)
//   creates the parent ingest_batches row first via chunk 6.1's
//   create_ingest_batch_with_documents_with_audit RPC and passes
//   the returned batch_id.
```

Wrapping pattern unchanged: `documentPlatformService.createSourceDocument`
remains Pattern A (export-site wrapping per line 211-217). Chunk 6.2a
does NOT change the wrapping pattern; the new `ingestionService`
shipping at chunk 6.2b uses Pattern B (external-wrap variant per spend
brief precedent), but that is chunk 6.2b scope.

### Test helper — `tests/helpers/createIngestBatchForTest.ts`

```typescript
// apps/web/tests/helpers/createIngestBatchForTest.ts
//
// Shared test fixture helper for the 30 call sites of
// documentPlatformService.createSourceDocument across 10 invoking
// integration/unit test files (chunk 6.2a Grain-5-test-floor
// enumeration). Composes the create_ingest_batch_for_test test-only
// RPC (migration 153 Statement 2). Returns a single ingest_batches
// row's id + trace_id for downstream use.
//
// Production code MUST NOT import or call this helper; the helper's
// underlying RPC is _for_test-suffix substrate per Layer 3 service-
// no-emit discipline. Production ingestionService (chunks 6.2b + 6.3)
// uses create_ingest_batch_with_documents_with_audit (chunk 6.1)
// exclusively.
//
// Helper options? shape locked at chunk 6.2a brief-draft against the
// 30-caller enumeration's actual needs:
//   - ingest_channel: defaults to 'drag_drop_pdf' (most caller
//     fixtures don't care about channel discriminator at this layer);
//     overrideable for chunk 6.3 forwarded_mailbox tests + sentinel-
//     shape rejection tests.
//   - received_at: defaults to NOW() (most fixtures don't assert on
//     timestamp); overrideable for deterministic-timestamp tests.
//   - channel_metadata: defaults to {} (no caller currently asserts
//     on channel_metadata at fixture grain); overrideable for sentinel-
//     shape rejection tests at chunk 6.2b.
//   - trace_id: defaults to gen_random_uuid() at the RPC layer
//     (passed through from RPC default); overrideable for tests that
//     assert audit_log.trace_id correlation.

import { adminClient } from '@/db/adminClient';
import type { IngestChannelEnum } from '@/services/document-platform/types';

export interface CreateIngestBatchForTestOptions {
  ingest_channel?: IngestChannelEnum;
  received_at?: string;
  channel_metadata?: Record<string, unknown>;
  trace_id?: string;
}

export interface CreateIngestBatchForTestResult {
  // snake_case to match existing CreateSourceDocumentResult convention
  // (storage_key, content_hash, byte_size). Enables shorthand
  // destructuring at call sites: `const { ingest_batch_id } = await
  // createIngestBatchForTest(orgId); await createSourceDocument({
  // ingest_batch_id, ... })`.
  ingest_batch_id: string;
  trace_id: string;
}

export async function createIngestBatchForTest(
  orgId: string,
  options: CreateIngestBatchForTestOptions = {},
): Promise<CreateIngestBatchForTestResult> {
  const db = adminClient();
  const { data, error } = await db.rpc('create_ingest_batch_for_test', {
    p_org_id: orgId,
    p_ingest_channel: options.ingest_channel ?? 'drag_drop_pdf',
    p_received_at: options.received_at ?? new Date().toISOString(),
    p_channel_metadata: options.channel_metadata ?? {},
    p_trace_id: options.trace_id ?? crypto.randomUUID(),
  });
  if (error) {
    throw new Error(`createIngestBatchForTest RPC failed: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error('createIngestBatchForTest RPC returned no rows');
  }
  const row = data[0] as { ingest_batch_id: string; trace_id: string };
  return {
    ingest_batch_id: row.ingest_batch_id,
    trace_id: row.trace_id,
  };
}
```

## Status

ADR-0011 needs no amendment at chunk 6.2a (the §1 amendment shipped
at chunk 6.1 commit `010fe97` deferred `ingest_items` to Phase 7 and
remains valid). Chunk 6.2a operates entirely within the substrate
spine ADR-0011 §1 currently declares; no entity-ownership boundary
shifts.

ADR-0013 needs no amendment at chunk 6.2a (storage layer untouched).

ADR-0014 needs no amendment at chunk 6.2a (Phase 7 orchestrator
deferral untouched; dedup-by-hash remains Phase 7 territory and
locks at chunk 6.2b Sub-Q7).

ADR-0010 (closed-enum + three-layer defense discipline) — Layer 3
service-no-emit on `create_ingest_batch_for_test` (production code
never calls it) is a fresh first-instance application of the
discipline at the test-substrate boundary. No amendment needed; the
discipline's existing statement covers it.

## Walkable proof

**Substrate-walkable + service-walkable-via-RPC** at chunk 6.2a
commit. Migration 153 applies cleanly; the amended
`create_source_document_with_audit` RPC executes transactionally
with `ingest_batch_id` populated; the new `create_ingest_batch_for_test`
RPC executes from psql against seed data returning a single row;
the 30 refactored test callers pass under the NOT NULL constraint;
full integration suite green.

The walkable test exercises:

1. **Migration 153 applies cleanly** — Statement 1 + 2 + 3 + 4 land
   in order; no rollback; trigger function redefinition is
   transparent to existing rows.
2. **Amended `create_source_document_with_audit`** — INSERT with
   `p_source_document.ingest_batch_id = '<existing-batch-id>'`
   succeeds; INSERT with omitted `ingest_batch_id` raises NOT NULL
   violation at the `source_documents.ingest_batch_id` column;
   audit_log row lands at `entity_type='source_document'` grain.
3. **`create_ingest_batch_for_test`** — INSERT with default
   `p_ingest_channel + p_channel_metadata + p_trace_id` succeeds;
   returns `(ingest_batch_id, trace_id)` row; the inserted row is
   queryable by `org_id`. Override path tested with
   `p_channel_metadata = '{"sentinel": true}'::jsonb` (no rejection;
   the test-only RPC accepts any channel_metadata; sentinel-shape
   rejection lives at the chunk 6.2b ingestionService Zod-discriminated-
   union ingress).
4. **Step D immutability** — UPDATE on `source_documents.ingest_batch_id`
   raises `feature_not_supported`; UPDATE on mutable cols
   (`current_version_id`, `storage_status`, `mime_type`) succeeds.
5. **30-caller refactor** — full integration + unit suite green
   under NOT NULL contract; per-test `createIngestBatchForTest` call
   produces a valid batch_id; downstream `createSourceDocument` call
   succeeds.

No `ingestionService` ships at chunk 6.2a; chunk 6.2b ships drag-drop
end-to-end against the constraint-activated substrate.

## Tech Stack

- **Postgres 17 + Supabase** — substrate per ADR-0010 / 0011 / 0013
  disciplines. Migration applies via `supabase db reset` + standard
  CI pipeline.
- **TypeScript test layer** — integration tests via Vitest in
  `apps/web/tests/integration/`; unit tests in `apps/web/tests/unit/`.
- **No new dependencies.** Migration uses existing patterns from
  migrations 134 / 135 / 137 / 152. Helper uses existing `adminClient`
  + project crypto.
- **No frontend / Next.js work at chunk 6.2a.** Routes + UI ship at
  chunk 6.2b.

## In scope

- **Migration `20240153000000_phase_6_chunk_2a_consumer_conformance.sql`**:
  - Statement 1: AMEND `create_source_document_with_audit` RPC body
    (extend INSERT column list + VALUES list to include
    `ingest_batch_id`).
  - Statement 2: CREATE `create_ingest_batch_for_test` test-only RPC
    (5 parameters with defaults; returns `TABLE (ingest_batch_id UUID,
    trace_id UUID)`; `SECURITY INVOKER`; `GRANT EXECUTE TO service_role`;
    heavy comment block declaring v1 callers limited to test fixtures).
  - Statement 3: `ALTER TABLE source_documents ALTER COLUMN
    ingest_batch_id SET NOT NULL` (Sub-Q4 Step C).
  - Statement 4: `CREATE OR REPLACE FUNCTION
    enforce_source_documents_column_immutability` with 13-column
    comparison (Sub-Q4 Step D; trigger binding unchanged at migration
    135:406-409 by virtue of CREATE OR REPLACE FUNCTION semantic).
- **`apps/web/src/services/document-platform/types.ts`**:
  - Extend `CreateSourceDocumentInput` interface with
    `ingest_batch_id: string` (required, between `org_id` and
    `ingest_channel`).
- **`apps/web/src/services/document-platform/documentPlatformService.ts`**:
  - `sourceDocumentPayload` (lines 141-155) gains
    `ingest_batch_id: input.ingest_batch_id`.
  - File-top comment block (lines 1-71) gains chunk 6.2a addendum
    after the 6-step flow enumeration.
- **`apps/web/tests/helpers/createIngestBatchForTest.ts`** (new):
  - Shared helper backed by `create_ingest_batch_for_test` RPC.
  - Options shape: `ingest_channel`, `received_at`, `channel_metadata`,
    `trace_id` (all optional with sensible defaults).
- **30-caller refactor** across 10 invoking test files (per Grain-5-
  test-floor enumeration in Test plan):
  - Each call site precedes `createSourceDocument` with
    `createIngestBatchForTest` invocation (hoist to `beforeEach` /
    `beforeAll` for shared-batch tests where multiple call sites
    share a batch).
  - Each call site extends args object with
    `ingest_batch_id` (ES2015 shorthand; destructured name matches
the field name on `CreateSourceDocumentInput`).
- **Reshape Test 8** in `apps/web/tests/integration/ingestSubstrate.integration.test.ts:238`:
  - From "asserts nullable contract" (current post-amendment-cycle
    state) to "asserts NOT NULL contract" (post-Step-C state).
  - Update file-top comment + Test 8 describe-block string to reflect
    post-Step-C state.
  - Test 9 (FK enforcement when value provided) stays valid; no
    changes.
- **`apps/web/tests/integration/migration153ConstraintActivation.integration.test.ts`** (new):
  - 4 new tests covering Step D immutability, helper RPC walkable,
    helper RPC GRANT scoping (discipline-verification), RPC amendment
    regression.
- **Friction-journal entries (at chunk close)**: pre-drafted
  (D)-filter entries materialize per Friction-journal placeholder
  section.

## Out of scope

- **`ingestionService` service file + drag-drop channel-handler**
  — chunk 6.2b territory. Chunk 6.2a ships substrate-consumer-conformance
  only; the ingestion-event entry point + storage put + composition
  with chunk 6.1 RPC ship at chunk 6.2b.
- **POST `/api/orgs/[orgId]/documents/ingest/drag-drop` route handler**
  — chunk 6.2b. Sub-Q3 (multipart shape) + Sub-Q10 NEW (route-path
  convention org-scoping) lock at chunk 6.2b.
- **Per-document cards UI + read endpoints** — chunk 6.2b. Sub-Q2
  (cards endpoint scope) + sentinel-batch filter shape lock at chunk
  6.2b.
- **Drag-drop UX surface** (chat / canvas / both) — chunk 6.2b.
  Sub-Q1 lock with verify-from-disk on `apps/web/src/components/canvas/`
  + `apps/web/src/agent/canvas/` + `apps/web/src/shared/types/chatTurn.ts`.
- **Storage provider integration shape** — chunk 6.2b. Sub-Q6 confirms
  `storageProviderService.put()` contract usage at the new ingestionService.
- **Dedup-by-hash deferral semantic** — chunk 6.2b Sub-Q7 explicit
  lock. Chunk 6.2a does not touch storage layer.
- **trace_id propagation through drag-drop flow** — chunk 6.2b
  Sub-Q8 lock against ServiceContext + ADR-0013 §1 + Service
  Communication Rule 5.
- **Partial-failure error handling** (atomic batch vs partial-batch)
  — chunk 6.2b Sub-Q9 lock against ADR-0013 §1 + ADR-0014 §10.
- **forwarded_mailbox path** — chunk 6.3 (mail provider integration,
  parsing library, allowlist enforcement). Chunk 6.3 inherits the
  NOT NULL contract chunk 6.2a activates.
- **Phase 7 orchestrator runtime** — Phase 7 per ADR-0014:1249.
- **Sentinel batch retroactive cleanup** — sentinel batches are
  permanent production substrate per chunk 6.1 close meta-observation
  #4 (75 dev DB rows + future production rows). Chunk 6.2a does NOT
  delete or modify sentinel batches.
- **Status-line retroactive fix for 2026-05-13 Phase 2.5 Commit B
  amendment (ADR-0011)** — ADR-0022 §6 forward-only discipline.
  Legacy gap stays as artifact (chunk 6.1 carry-forward Flag 8).
- **Production caller updates beyond test surface** — there are 0
  production callers of `createSourceDocument` per verify-from-disk;
  the only "production reference" is a comment in
  `apps/web/src/shared/schemas/document-platform/documentCase.schema.ts:54`
  citing the service by name. No production code changes ship at
  chunk 6.2a beyond the service body itself.

## Flagged ambiguities

| # | Flag | Resolution path | Notes |
|---|---|---|---|
| 1 | **Caller-count drift between Subagent 4's preliminary count (36 across 13) and verify-from-disk (30 across 10).** | Implementing agent re-runs the grep at Task 1 (Verify-from-disk gates) and locks the per-file count table at Task 1's evidence anchor. If the count diverges from this brief's 30/10, document the divergence in Task 1 evidence + adjust the caller-refactor task plan accordingly. | Subagent 4 conflated "files containing string `createSourceDocument`" (13; includes 3 comment/import refs) with "files invoking `createSourceDocument(`" (10). Brief locks at the verified 30/10. |
| 2 | **`create_ingest_batch_for_test` RPC return shape — `RETURNS TABLE` vs `RETURNS UUID`.** Brief locks `RETURNS TABLE (ingest_batch_id UUID, trace_id UUID)` because callers may need both. If the verify-at-implementation surfaces no caller actually using `trace_id` (helper returns it but no test asserts on it), consider switching to `RETURNS UUID` and dropping `trace_id` from the helper return shape. | Implementing agent verifies at Task 7 (helper creation) which test fixtures need `trace_id`; documents in Task 7 evidence; switches return shape if no caller uses it. | YAGNI consideration. v1 lock favors flexibility (helper returns both); future simplification fires post-v1 if `trace_id` is unused. |
| 3 | **`create_ingest_batch_for_test` `p_ingest_channel` default = `'drag_drop_pdf'`.** Brief locks this default because most fixtures don't care about channel; chunk 6.3 forwarded_mailbox tests will override. If verify-at-implementation surfaces that >50% of refactored fixtures need a channel that's NOT drag_drop_pdf, flip the default to NOT have one (force callers to specify). | Implementing agent surveys the 10 invoking test files at Task 1; documents which channel each currently implies (most likely all drag_drop_pdf; chunk 6.3 will add forwarded_mailbox); locks the default. | Chunk 6.1's RPC accepts any of the 4 channel values (no Layer 1 narrowing); the helper default is purely for fixture ergonomics. |
| 4 | **Test 8 reshape — preserve as `Test 8` slot or add new test next to chunk 6.1 Test 8?** Brief locks "reshape Test 8" because the conceptual umbrella (source_documents.ingest_batch_id contract) is the same; the assertion flips from nullable to NOT NULL. Alternative: keep chunk 6.1 Test 8 as historical artifact + add new Test 8.5 / Test 10 testing NOT NULL contract. | Implementing agent reads chunk 6.1 Test 8 at Task 1 + adjudicates at Task 8 (Test 8 reshape task); friction-journal entry codifies the choice if alternative path taken. | Reshape preserves test-slot consistency + makes the contract change explicit; alternative inflates test count. Reshape preferred. |

## Task plan

13 numbered tasks at a single commit per Path C precedent. Each task
self-contained; verify-from-disk gates apply at each task boundary
per RI-6 5-grain discipline (incl. Grain 5 existing-consumer-contract-
conformance prospectively applied at Task 1).

- [ ] **Task 1: Verify-from-disk gates (Grain 1 + Grain 5).**
  - Read current `enforce_source_documents_column_immutability` body
    at `supabase/migrations/20240135000000_storage_substrate.sql:384-404`.
    Confirm 12-column comparison.
  - Read current chunk 6.1 Test 8 at
    `apps/web/tests/integration/ingestSubstrate.integration.test.ts:238`.
    Confirm tests nullable contract (`expect(row?.ingest_batch_id).toBeNull()`).
  - Read current `create_source_document_with_audit` RPC body at
    `supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql:67-153`.
    Confirm 13-column INSERT list + 13-VALUES list.
  - Re-grep `createSourceDocument` callers across `apps/web/tests/`:
    `grep -rn "createSourceDocument" apps/web --include="*.test.ts" | grep -E "createSourceDocument\(|\.createSourceDocument\(" | awk -F: '{print $1}' | sort | uniq -c | sort -rn`
  - Expected: 10 invoking files; 30 total call sites. If diverges,
    flag in Task 1 evidence + adjust Task 9 sub-tasks accordingly.
  - Write evidence summary in commit message draft (or surface at
    chunk close).

- [ ] **Task 2: Verify next free migration number is 153.**
  - Run: `ls supabase/migrations/ | tail -1 | grep -oE "^[0-9]+"`.
  - Expected: `20240152000000` (highest existing post chunk 6.1).
  - Verify next free = `20240153000000`.
  - If a migration 153 exists (unexpected), surface as a brief amendment.

- [ ] **Task 3: Write migration `20240153000000_phase_6_chunk_2a_consumer_conformance.sql`.**
  - File: `supabase/migrations/20240153000000_phase_6_chunk_2a_consumer_conformance.sql`.
  - Use the brief's "Substrate shape — migration 153" section
    verbatim as authoritative SQL (heavy comment block + 4 statements).
  - Statement 1: `CREATE OR REPLACE FUNCTION create_source_document_with_audit`
    with extended 14-column INSERT list + 14-VALUES list (per brief
    code block).
  - Statement 2: `CREATE OR REPLACE FUNCTION create_ingest_batch_for_test`
    with 5 parameters + `RETURNS TABLE` + `SECURITY INVOKER` +
    `GRANT EXECUTE`.
  - Statement 3: `ALTER TABLE source_documents ALTER COLUMN ingest_batch_id SET NOT NULL`.
  - Statement 4: `CREATE OR REPLACE FUNCTION enforce_source_documents_column_immutability`
    with 13-column comparison (12 existing + `ingest_batch_id`).
  - Verify trigger binding unchanged: migration 135:406-409 retains
    its CREATE TRIGGER body; CREATE OR REPLACE FUNCTION semantic
    propagates the new body to the existing trigger automatically.

- [ ] **Task 4: Update `CreateSourceDocumentInput` interface.**
  - File: `apps/web/src/services/document-platform/types.ts`.
  - Add `ingest_batch_id: string` (required, between `org_id` and
    `ingest_channel` per brief code block).
  - Add the 7-line comment block above the field per brief
    "Service surface — `createSourceDocument` signature change"
    section.

- [ ] **Task 5: Update `createSourceDocumentImpl` body.**
  - File: `apps/web/src/services/document-platform/documentPlatformService.ts`.
  - Lines 141-155: extend `sourceDocumentPayload` with
    `ingest_batch_id: input.ingest_batch_id` between `ingest_channel`
    and `storage_status` (per brief code block; mirrors RPC's
    INSERT column order).

- [ ] **Task 6: Update `documentPlatformService.ts` file-top comment block.**
  - File: `apps/web/src/services/document-platform/documentPlatformService.ts`.
  - Insert chunk 6.2a addendum after line 59 (closing the 6-step
    flow block; before the v1 orphan-blob acceptance block at line 62).
  - Comment text per brief "Service surface" section.

- [ ] **Task 7: Create `tests/helpers/createIngestBatchForTest.ts`.**
  - File: `apps/web/tests/helpers/createIngestBatchForTest.ts`.
  - Implementation per brief "Test helper" section (CreateIngestBatchForTestOptions
    interface + CreateIngestBatchForTestResult interface +
    `createIngestBatchForTest(orgId, options?)` function).
  - Verify the helper's return shape matches what the 30-caller
    refactor at Task 9 expects (`{ ingest_batch_id, trace_id }` object;
    snake_case to match existing `CreateSourceDocumentResult`
    convention).

- [ ] **Task 8: Reshape chunk 6.1 Test 8 from nullable to NOT NULL contract.**
  - File: `apps/web/tests/integration/ingestSubstrate.integration.test.ts`.
  - Line 4 (file-top comment): update wording from "Step C deferred"
    to "Step C activated at chunk 6.2a (migration 153)."
  - Line 237 (describe-block string): update wording from "Sub-Q4
    Step A + Step B backfill; Step C deferred per amendment 2026-05-15"
    to "Sub-Q4 Step C activated at chunk 6.2a (migration 153)."
  - Line 238 (Test 8 it-block string): update wording from "ships
    as nullable column with FK to ingest_batches (Step C deferred to
    chunks 6.2/6.3)" to "is NOT NULL with FK to ingest_batches
    (Step C activated at chunk 6.2a)."
  - Lines 257-272 (Test 8 body): replace the nullable assertion
    body with a NOT NULL violation assertion. Pattern:
    ```typescript
    const { data, error } = await db.from('source_documents').insert({
      // ... other required fields ...
      // ingest_batch_id intentionally omitted — verifies NOT NULL contract
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23502'); // NOT NULL violation
    expect(data).toBeNull();
    ```
  - Test 9 (FK enforcement at lines 275-end-of-it-block) — no changes.

- [ ] **Task 9: Refactor 30 callers across 10 test files.**
  - Per-file sub-tasks (counts from verify-at-Task-1):

    | File | Call sites | Approach |
    |---|---|---|
    | `apps/web/tests/integration/documentLinkService.integration.test.ts` | 9 | Multiple shared-batch describe-blocks; hoist `createIngestBatchForTest` to `beforeAll` per describe-block where applicable; per-test invocation where each test owns its batch. |
    | `apps/web/tests/unit/documentPlatformService.test.ts` | 7 | Mock-based unit tests; mock `createIngestBatchForTest` to return a deterministic batch_id; pass through to `createSourceDocument` mockInput fixture. |
    | `apps/web/tests/integration/documentArtifactsSubstrate.integration.test.ts` | 3 | Per-test invocation. |
    | `apps/web/tests/integration/documentCaseSourceService.integration.test.ts` | 3 | Per-test invocation. |
    | `apps/web/tests/integration/documentPlatformServiceIntegration.test.ts` | 2 | Per-test invocation. |
    | `apps/web/tests/integration/storageProviderIntegration.test.ts` | 2 | Per-test invocation. |
    | `apps/web/tests/integration/documentRouterService.resolveCandidates.integration.test.ts` | 1 | Per-test invocation. |
    | `apps/web/tests/integration/documentRouterService.dispatchTrigger.integration.test.ts` | 1 | Per-test invocation. |
    | `apps/web/tests/integration/dispatchTriggerCrossPhase.integration.test.ts` | 1 | Per-test invocation. |
    | `apps/web/tests/integration/documentRouterService.integration.test.ts` | 1 | Per-test invocation. |

  - Per call site:
    1. Add import at file top (or extend existing test-helpers
       import block): `import { createIngestBatchForTest } from '<relative-path>/tests/helpers/createIngestBatchForTest';`.
    2. Precede `createSourceDocument` invocation with
       `const { ingest_batch_id } = await createIngestBatchForTest(org_id);`
       (or hoist to `beforeEach`/`beforeAll` per shared-batch pattern).
       Use the call site's existing `org_id` variable name (commonly
       `orgId` in this codebase; rename helper invocation arg to match
       the local variable per call site).
    3. Extend args object: add `ingest_batch_id,` (ES2015 shorthand;
       destructured name matches the field name on
       `CreateSourceDocumentInput`).
  - For `documentPlatformService.test.ts` (mock-based unit tests):
    mock `createIngestBatchForTest` rather than calling the actual
    helper (no live DB at unit-test grain).
  - Run per-file vitest after each file refactored to catch regressions:
    `pnpm vitest run apps/web/tests/integration/<file>.test.ts`.

- [ ] **Task 10: Create `migration153ConstraintActivation.integration.test.ts`.**
  - File: `apps/web/tests/integration/migration153ConstraintActivation.integration.test.ts`.
  - 4 new tests:
    1. **Step D immutability**: INSERT a source_document with
       `ingest_batch_id = batch1`; UPDATE the row to
       `ingest_batch_id = batch2`; expect error code
       `feature_not_supported` (matches the trigger's `RAISE
       EXCEPTION USING ERRCODE = 'feature_not_supported'`).
    2. **`create_ingest_batch_for_test` walkable**: invoke the RPC
       with org_id; assert returned `(ingest_batch_id, trace_id)`
       row shape; SELECT the row from `ingest_batches` and assert
       `org_id` + `ingest_channel = 'drag_drop_pdf'` + `created_by
       = 'test_helper_create_ingest_batch_for_test'`.
    3. **`create_ingest_batch_for_test` GRANT scoping** (discipline-
       verification test, not behavioral test): assert
       `pg_proc.proacl` for the function includes
       `service_role=X/postgres` (or equivalent ACL representation);
       this is a substrate-discipline test — implementing agent
       does NOT wire production caller code into this test (production
       code never calls `create_ingest_batch_for_test` per Layer 3
       service-no-emit).
    4. **RPC amendment regression**: invoke
       `create_source_document_with_audit` with
       `p_source_document` JSONB OMITTING `ingest_batch_id`; expect
       NOT NULL violation propagated through the RPC; no rows in
       `source_documents` or `audit_log`.
  - Pattern reference: `createIngestBatchWithDocumentsRpcRollback.test.ts`
    (chunk 6.1) for RPC test shape; `documentArtifactsSubstrate.integration.test.ts`
    for substrate-discipline test shape.

- [ ] **Task 11: Run full validation gates.**
  - Run: `pnpm test` — full vitest suite green (1065/1065 baseline +
    4 new chunk 6.2a tests = 1069/1069 expected; the 30-caller
    refactor preserves existing test count).
  - Run: `pnpm typecheck` — green.
  - Run: `pnpm agent:validate` — 26/26 Category A floor stays green.
  - Run: `pnpm adr:check` — green (no ADR amendments at chunk 6.2a).
  - Run: URL grep check — green (no hardcoded localhost URLs).
  - If any failure: diagnose root cause per CLAUDE.md "don't bypass
    safety checks"; fix; re-run.

- [ ] **Task 12: Verify-at-close LOC count vs forecast.**
  - Run: `git diff --stat HEAD~0` (after staging) to count actual
    LOC against the ~700-1100 LOC forecast.
  - If actual LOC exceeds forecast by > 30% (i.e., > ~1430 LOC),
    surface as friction-journal entry codifying volume-forecast
    drift + propose calibration adjustment for chunk 6.2b forecast.
  - If actual LOC is within forecast band: friction-journal entry
    optional (mention in commit body if relevant).
  - Pattern reference: chunk 6.1 close pattern (count=75 sentinel
    batch was the verified evidence that locked the sentinel-batch
    path; chunk 6.2a close LOC count is the analog).

- [ ] **Task 13: Commit (single commit at chunk 6.2a per Path C precedent).**

```bash
git add supabase/migrations/20240153000000_phase_6_chunk_2a_consumer_conformance.sql
git add apps/web/src/services/document-platform/types.ts
git add apps/web/src/services/document-platform/documentPlatformService.ts
git add apps/web/tests/helpers/createIngestBatchForTest.ts
git add apps/web/tests/integration/migration153ConstraintActivation.integration.test.ts
git add apps/web/tests/integration/ingestSubstrate.integration.test.ts
# 30 caller refactor — add each modified test file
git add apps/web/tests/integration/documentLinkService.integration.test.ts
git add apps/web/tests/unit/documentPlatformService.test.ts
git add apps/web/tests/integration/documentArtifactsSubstrate.integration.test.ts
git add apps/web/tests/integration/documentCaseSourceService.integration.test.ts
git add apps/web/tests/integration/documentPlatformServiceIntegration.test.ts
git add apps/web/tests/integration/storageProviderIntegration.test.ts
git add apps/web/tests/integration/documentRouterService.resolveCandidates.integration.test.ts
git add apps/web/tests/integration/documentRouterService.dispatchTrigger.integration.test.ts
git add apps/web/tests/integration/dispatchTriggerCrossPhase.integration.test.ts
git add apps/web/tests/integration/documentRouterService.integration.test.ts
# Conditionally add friction-journal if Task 12 surfaced LOC drift or other deviations:
# git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
feat(phase-6): chunk 6.2a — Sub-Q4 Step C/D activation + signature amendment + 30-caller refactor

Phase 6 chunk 6.2a (substrate-consumer-conformance half of Path C
split per chunk 6.1 carry-forward Sub-Q4 lock). Ships migration 153
(create_source_document_with_audit RPC amendment + create_ingest_batch_for_test
test-only RPC + ALTER source_documents.ingest_batch_id SET NOT NULL +
enforce_source_documents_column_immutability trigger extension to 13
columns), documentPlatformService.createSourceDocument signature
amendment (CreateSourceDocumentInput.ingest_batch_id required),
tests/helpers/createIngestBatchForTest.ts shared helper, 30-caller
refactor across 10 invoking integration/unit test files.

Path C invocation per RI-7 evidence-driven discipline at brief-draft
(prospective, not reactive): ~1700-2300 LOC combined 6.2a+6.2b forecast
vs chunk-3-Phase-4 ~1400 LOC anchor; five framings from verify-from-disk;
chunk-arc-shape-after-amendment carry-forward from chunk 6.1
meta-observation #1; wiring-with-tests-pairing at each commit boundary.

Walkable proof: substrate-walkable + service-walkable-via-RPC at 6.2a
commit per chunk-1-Phase-2 + chunk 6.1 precedent. Drag-drop end-to-end
+ cards UI + route handlers ship at chunk 6.2b (next session).
forwarded_mailbox ships at chunk 6.3.

Per Phase 6 chunk 6.2a scope-lock 2026-05-15 (2 sub-questions locked):
- Sub-Q4 Step C activation = chunk 6.2 + Path C (a) — co-locate
  contract change with consumer updates per RI-6 fifth-grain
  (existing-consumer-contract-conformance) discipline.
- Sub-Q5 signature shape = (i.B) required field + β test-only RPC
  helper — fixture isolation eliminates 5-table atomic coupling
  cascade across 30 test fixtures.

8 sub-questions defer to chunk 6.2b session: drag-drop UX surface,
per-document cards endpoint scope + sentinel filter, multipart shape,
storage provider integration, dedup-by-hash deferral semantic,
trace_id propagation, partial-failure error handling, route-path
convention.

Pure discipline-reference consumer of Phase 4 codifications (RI-1 +
RI-6 + RI-7 + RI-10) applied at scope-lock; Path C codification
graduates to N=2 observation-grain instances (F-J-14 tier-1 entry
consolidates).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Test plan

### Test floor (must stay green)

- `pnpm agent:validate` — 26/26 Category A floor tests.
- `pnpm test` — full vitest suite (current baseline post chunk 6.1:
  1065/1065). Post chunk 6.2a: 1069/1069 expected (30-caller refactor
  preserves existing count; 4 new tests added).
- `pnpm typecheck` — green.

### Grain-5-test-floor enumeration (scope-lock evidence basis)

Per CLAUDE.md RI-6 fifth grain (existing-consumer-contract-
conformance). Verify-from-disk at brainstorming-session pre-reading:

| File | Invoking call sites | Pattern hint |
|---|---|---|
| `apps/web/tests/integration/documentLinkService.integration.test.ts` | 9 (lines 59, 116, 174, 243, 304, 402, 468, 572, 673) | Multiple describe-blocks share batches; some inline; some `beforeAll` candidates. |
| `apps/web/tests/unit/documentPlatformService.test.ts` | 7 (lines 124, 166, 182, 205, 228, 237, 249) | Mock-based unit tests; helper is mocked, not invoked live. |
| `apps/web/tests/integration/documentArtifactsSubstrate.integration.test.ts` | 3 (lines 21, 156, 505) | Each test owns its batch. |
| `apps/web/tests/integration/documentCaseSourceService.integration.test.ts` | 3 (lines 30, 231, 326) | Each test owns its batch. |
| `apps/web/tests/integration/documentPlatformServiceIntegration.test.ts` | 2 (lines 92, 184) | Each test owns its batch. |
| `apps/web/tests/integration/storageProviderIntegration.test.ts` | 2 (lines 57, 130) | Each test owns its batch. |
| `apps/web/tests/integration/documentRouterService.resolveCandidates.integration.test.ts` | 1 (line 75) | Single per-test invocation. |
| `apps/web/tests/integration/documentRouterService.dispatchTrigger.integration.test.ts` | 1 (line 97) | Single per-test invocation. |
| `apps/web/tests/integration/dispatchTriggerCrossPhase.integration.test.ts` | 1 (line 126) | Single per-test invocation. |
| `apps/web/tests/integration/documentRouterService.integration.test.ts` | 1 (line 56) | Single per-test invocation. |
| **TOTAL** | **30 across 10 files** | |

**Disambiguation of preliminary 36/13 → verified 30/10 adjustment**:
The 13-file figure from preliminary scan includes 3 files that contain
the string `createSourceDocument` only in comments / file-name
self-references (no actual invocation):

- `apps/web/tests/integration/createIngestBatchWithDocumentsRpcRollback.test.ts:5`
  — comment citing `createSourceDocumentRpcRollback.test.ts` as
  precedent for `db.rpc()` pattern. Unaffected by the signature change.
- `apps/web/tests/integration/createSourceDocumentRpcRollback.test.ts:1`
  — file path comment in the file's own header. Unaffected.
- `apps/web/tests/integration/ingestSubstrate.integration.test.ts:241`
  — comment within chunk 6.1 Test 8 block referencing the pending
  update. **Already covered by Task 8 (Test 8 reshape).**

Plus 7 in-invoking-file comment matches (e.g.,
`documentPlatformService.test.ts:2,102` describing the unit-test
target; `documentLinkService.integration.test.ts:15` framing the
test file's target service). These don't need separate refactor work
beyond the underlying invocation refactor.

The load-bearing refactor surface is the **10 invoking files × 30
call sites** locked above. The preliminary 36/13 → verified 30/10
adjustment is itself a small instance of Grain 5 working as designed
(see Friction-journal placeholder for codification of the two-phase
Grain 5 application shape: preliminary at synthesis, final at
brief-draft).

### Test 8 reshape (chunk 6.1 → chunk 6.2a)

`apps/web/tests/integration/ingestSubstrate.integration.test.ts:238` —
chunk 6.1 brief Test 8 currently asserts nullable contract:

```typescript
// CURRENT (chunk 6.1 post-amendment-cycle):
it('Test 8: source_documents.ingest_batch_id ships as nullable column with FK to ingest_batches (Step C deferred to chunks 6.2/6.3)', async () => {
  // ... INSERT without ingest_batch_id ...
  expect(error).toBeNull();
  expect(row?.ingest_batch_id).toBeNull();
});
```

Reshape to:

```typescript
// POST chunk 6.2a (migration 153 Step C):
it('Test 8: source_documents.ingest_batch_id is NOT NULL with FK to ingest_batches (Step C activated at chunk 6.2a)', async () => {
  // ... INSERT without ingest_batch_id ...
  expect(error).not.toBeNull();
  expect(error?.code).toBe('23502'); // NOT NULL violation
  expect(data).toBeNull();
});
```

Test 9 (FK enforcement when value provided, line 275) — no changes;
remains valid post-Step-C.

### New tests added at chunk 6.2a

`apps/web/tests/integration/migration153ConstraintActivation.integration.test.ts` (4 tests):

1. **Step D immutability**: UPDATE on `source_documents.ingest_batch_id`
   raises `feature_not_supported` (mirrors chunk 6.1 immutability tests
   for other source_documents columns).
2. **`create_ingest_batch_for_test` walkable**: RPC produces a valid
   `ingest_batches` row queryable by `org_id`; returned shape
   `(ingest_batch_id, trace_id)` matches helper expectations.
3. **`create_ingest_batch_for_test` GRANT scoping** (discipline-
   verification test): `pg_proc.proacl` for the function includes
   `service_role` GRANT; substrate-discipline test, not behavioral
   test. Implementing agent does NOT wire production caller code into
   this test (production code never calls
   `create_ingest_batch_for_test` per Layer 3 service-no-emit;
   the test verifies the GRANT scoping but doesn't exercise non-
   service_role rejection in production-shape code paths).
4. **RPC amendment regression**: `create_source_document_with_audit`
   payload omitting `ingest_batch_id` raises NOT NULL violation
   propagated through the RPC; no rows in `source_documents` or
   `audit_log` post-rollback.

Total: 4 new tests at chunk 6.2a. Estimated runtime: ~3-5 seconds added
to integration suite.

## Friction-journal placeholder

Pre-drafted (D)-filter entries — activate at chunk close per
chunk 6.1 Test (D)-filter precedent + Phase 4 chunk 3
F-J-13/14/15 codification precedent. Codification volume per chunk
itself is a trackable inflection (see What's-next).

- **F-J-14 second-instance tier-1 entry (PRIMARY)**: Path C
  invocation as RI-7-evidence-driven + prospective. Consolidates
  Phase 4 chunk 3 first-instance precedent (reactive at
  implementation; brief amendment cycle absorbed five framings)
  with chunk 6.2a second-instance (prospective at brief-draft;
  separate brief per Path C half). Codification graduates per
  observation-grain N=2; sub-discipline (prospective-vs-reactive)
  worth codifying even at N=2 per `CLAUDE.md` candidate (e)
  shape-refinement-via-within-arc-evidence-basis pathway.

- **Sub-Q4 split-across-chunks shape codification (TIER 1
  CANDIDATE)**: per chunk 6.1 meta-observation #3 — "constraint-
  activation chunks defer until consumer chunks ship; sub-question
  splits across chunks track this naturally with explicit cross-
  chunk activation trigger named at lock time." Friction-journal
  entry codifies the lock semantics at chunk 6.2a Step-C-activation
  moment (the moment the carry-forward predicted). Sibling
  discipline to F-J-14 + Grain 5 codification candidate.

- **`_for_test` suffix convention (TIER 1 CANDIDATE)**: first-instance
  precedent for test-only RPC suffix in the codebase. Codify alongside
  `_with_audit` (mutating RPC; F-J-ε convention from Phase 4 chunk 2)
  as a greppable substrate-naming convention. Layer 3 service-no-emit
  applies: production code MUST NOT call _for_test-suffixed
  substrate.

- **Grain-5-test-floor enumeration as scope-lock substrate (TIER 1
  CANDIDATE)**: prospective Grain 5 application — "before locking
  constraint-activation migrations, run explicit grep-and-enumerate
  over consumer surfaces (production + test); produce a per-caller
  signature-and-helper-invocation table; the table IS the scope-lock
  evidence basis." Sibling discipline to F-J-14 (Path C invocation
  evidence-driven) + chunk 6.1 RI-6 fifth-grain codification candidate.
  This entry consolidates the proposed graduation candidate from chunk
  6.1 close into the prospective application precedent.

  Two micro-flags to codify within this entry:

  - **Two-phase Grain 5 application shape**. Subagent 4's preliminary
    scan during brainstorming-session synthesis returned 36 callers
    across 13 files; the brief-draft verify-from-disk gate adjusted
    to 30 callers across 10 invoking files (3 files contain only
    comment refs; 6 in-invoking-file matches were also comment refs).
    The preliminary count surfaces the rough scope; the final count
    locks the actual refactor surface. This two-phase shape
    (preliminary at synthesis → final at brief-draft) is itself
    Grain 5 working as designed: the synthesis phase establishes the
    "this is the surface that needs Grain 5 attention" framing; the
    brief-draft phase produces the canonical evidence anchor. Sibling
    discipline to chunk 6.1's "Sub-Q4 verify gate caught production-
    row gap but missed consumer-impact gap" learning (the analogous
    two-phase shape there was: substrate verify caught row gap but
    didn't fire on consumer surface; chunk 6.2a's two-phase shape
    fires explicitly on both substrate and consumer surfaces).

  - **Disambiguation typology**. The preliminary-to-final delta has
    two possible explanations: (a) preliminary scan was over-inclusive
    (false positives via comment/import refs); (b) some preliminary-
    counted callers were in test-helpers that themselves get refactored
    (so the helper's update absorbs the caller). Chunk 6.2a is
    instance (a) — Subagent 4's regex matched comment-only refs in
    addition to invocations. No test-helper absorption applies because
    no existing test helper currently wraps `createSourceDocument`
    (chunk 6.2a is creating the first such helper at
    `tests/helpers/createIngestBatchForTest.ts`, but it doesn't wrap
    `createSourceDocument` — it creates the parent batch only).
    Disambiguation matters because (a) requires no special handling
    while (b) would require helper-update accounting separate from
    direct-caller refactor. Codify the typology so future Grain 5
    applications adjudicate the preliminary-to-final delta explicitly.

- **If Task 12 LOC count diverges from forecast by > 30%**: friction-
  journal entry codifying volume-forecast drift + proposed calibration
  adjustment for chunk 6.2b forecast.

- **If Task 1 grep produces caller count diverging from 30/10**:
  friction-journal entry codifying the divergence + adjusting Task 9
  sub-task counts.

If implementation surfaces ZERO deviations beyond the 4 pre-drafted
tier-1 entries, those 4 entries ship at chunk 6.2a close.

## What's next

**Chunk 6.2b onset notes:**

Chunk 6.2b ships drag-drop end-to-end against the constraint-activated
substrate. Brief-drafting at chunk 6.2b verifies:

- `apps/web/src/services/storage/storageProviderService.ts` — confirm
  `put()` signature + return shape for Sub-Q6 lock.
- `apps/web/src/services/spend/` — Pattern B external-wrap precedent
  for the new `ingestionService` per spend brief precedent.
- `apps/web/src/components/canvas/` + `apps/web/src/agent/canvas/`
  + `apps/web/src/shared/types/chatTurn.ts` — UX surface inventory
  for Sub-Q1 lock.
- `apps/web/src/app/api/orgs/[orgId]/` — route convention for
  Sub-Q10 NEW lock (org-scoped per 28-of-30 disk evidence).
- `docs/01_prd/triage_bucket_intake.md` — re-read the 21-line stub
  for Sub-Q1 framing (acknowledged insufficiency at chunk 6.2a
  brainstorming; lock at chunk 6.2b is genuinely open).

Chunk 6.2b scope-lock sub-questions (8 deferred from chunk 6.1
carry-forward + 1 NEW from chunk 6.2a verify-from-disk):

- **Sub-Q1**: Drag-drop UX surface — chat-only / canvas-only / both.
  Triage Bucket PRD stub provides no Phase 6 authority; lock is
  genuinely open at v1. Verify-from-disk on canvas + chat surface
  inventory at brief-draft.
- **Sub-Q2**: Per-document cards read endpoint scope + sentinel-
  batch filter shape. Cards need case_id, state, ingest_batch_id,
  drop_session_id (or sender_address for chunk 6.3), source_count.
  Sentinel filter via `channel_metadata @> '{"sentinel": true}'::jsonb`
  containment.
- **Sub-Q3**: Multipart form-data shape — single-file vs multi-file
  POST. Drag-drop UX naturally produces N-file events; chunk 6.1's
  RPC supports N-document JSONB array atomically.
- **Sub-Q6**: Storage provider integration shape — confirm
  `storageProviderService.put()` contract usage at the new
  ingestionService.
- **Sub-Q7**: Dedup-by-hash deferral semantic — explicit lock that
  chunk 6.2b never short-circuits on duplicate hash (Phase 7
  territory per ADR-0014 §6).
- **Sub-Q8**: trace_id propagation through drag-drop flow — route
  handler generates trace_id; ServiceContext propagates;
  ingestionService passes to storageProviderService.put + chunk 6.1
  RPC; audit_log.trace_id correlation per Service Communication
  Rule 5.
- **Sub-Q9**: Partial-failure error handling — atomic batch (all-or-
  nothing per file) vs partial-batch (some succeed, some fail) at
  v1. Per ADR-0013 §1 + ADR-0014 §10 (storage put + DB write not
  transactional; orphan-blob GC daily not on-demand).
- **Sub-Q10 NEW**: Route-path convention — org-scoped under
  `/api/orgs/[orgId]/documents/...` per 28-of-30 existing API surface
  evidence.

**Chunk 6.3 onset notes** (pointer carry-forward; chunk 6.2b brief
will detail):

Chunk 6.3 ships forwarded_mailbox path. Inherits NOT NULL
`source_documents.ingest_batch_id` constraint from chunk 6.2a
without further constraint work. Mail provider integration
(SES / Mailgun / Postmark / Cloudflare) + parsing library +
allowlist enforcement lock at chunk 6.3 scope-lock. Phase 6
retrospective consolidates all Phase 6 RI candidates at chunk 6.3
close.

**Codification-volume-per-chunk inflection flag**:

Phase 4 chunk 3 codified 3 tier-1 friction-journal entries at chunk
close (F-J-13 / F-J-14 / F-J-15). Chunk 6.2a is on track to ship 4
tier-1 entries (Path C second-instance, Sub-Q4 split-across-chunks,
`_for_test` convention, Grain-5-test-floor enumeration). That's a
meaningful inflection — more codification work per chunk than Phase 4
chunk 3, which was already large. Phase 6 retrospective consolidation
(at chunk 6.3 close) will need to address whether 4 tier-1 entries at
a single chunk is sustainable shape or whether some demote to memory-
only per (D)-filter at chunk close. Track at chunk 6.3 retrospective
scoping.

**RI inventory carry-forward (12+ candidates at chunk 6.2b onset):**

The 12 chunk-6.1-close RI candidates carry forward; chunk 6.2a may
add 1-2 new candidates (Path C codification graduation N=2; brief-
grain `Na`/`Nb` suffix convention precedent). Phase 6 retrospective at
chunk 6.3 close consolidates all 12-15 candidates, possibly the
largest project consolidation to date per chunk 6.1 close
meta-observation #2.

**Test baseline going into chunk 6.2b**:

`pnpm test` baseline post chunk 6.2a: 1069/1069 (1065 chunk 6.1
baseline + 4 chunk 6.2a additions). `pnpm agent:validate`: 26/26
Category A floor.

Chunk 6.2b brief-drafting starts from this baseline.
