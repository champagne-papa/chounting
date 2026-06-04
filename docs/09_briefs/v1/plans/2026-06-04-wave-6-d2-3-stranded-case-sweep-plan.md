# D2.3 Stranded-Case Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `sweepStrandedCases` — the INV-WORKFLOW-002 eventual-consistency backstop that recovers document cases stranded in the automation segment by routing them through the existing D2.1 decision machinery — plus its operator runner, tests, and doc-sync.

**Architecture:** One orchestrator-layer module (`src/agent/orchestrator/maintenance/sweepStrandedCases.ts` — agent-side placement forced by ADR-0020: services may NOT import `agent/`) implementing artifact-aware bucketing (B1 matched hand-off / B2 candidate-bearing re-resolve / B3-D dedup carve-out pre-check / B3 candidate-less re-run / B4 reported re-eligible), every action flowing through `advanceCaseAutomation`, `resolveCandidates`, or `ingestDocument` — the sweep never asserts a disposition itself. Thin script runner mirrors the Tier-C shape. Dry-run is the default.

**Tech Stack:** TypeScript (Next.js app at `apps/web`), Supabase (local Postgres for integration tests), vitest, tsx (script runner).

**Spec:** `docs/09_briefs/v1/specs/2026-06-03-d2-3-stranded-case-sweep-design.md` (read-back approved, committed at `9ef64ded`).

---

## Spec deviations (grounded at plan time — surface at read-back, do not silently absorb)

1. **Signature: `sweepStrandedCases(input, deps?)` — no `ctx` parameter.** The spec (§5) wrote `(input, ctx: SystemActorServiceContext)`. Grounding: `ingestDocument` — the orchestrator-entry precedent the sweep mirrors — constructs its own `SystemActorServiceContext` internally (`ingestDocument.ts:77-88`), and the sweep needs a *fresh per-case* ctx anyway (per-case trace_id, per-case `org_id` from the case row; an all-orgs run has no single run-level org_id to put in a ctx). The scheduler-is-a-caller seam is unaffected. `deps` is the DI seam from spec §5 (injectable ingest runner).
2. **New input field `document_case_ids?: string[]`** (restrict eligibility to listed ids, still state+staleness filtered). Needed for test isolation — `document_cases` rows accumulate across suite runs (BEFORE-DELETE-protected substrate), so an unscoped `--execute` sweep inside a test would mutate other tests' stranded fixtures. Also operationally useful (targeted re-sweep).
3. **B2 branch (c) is unreachable** (spec §8 listed a "zero *pending* candidates → branch (c)" test variant). Grounding: `resolveCandidates` loads candidates with **no status filter** — `.eq('document_case_id', …)` only (`documentRouterService.ts:410-420`) — so a B2 case (≥1 candidate row) always resolves N≥1 → branch (a) or (b). Candidate-less cases go B3, where the re-run's own D2.1 wiring owns branch (c). The test variant drops out.

## Must-confirms resolved at plan time (spec §11)

- **§11.1 + §11.6 (system_actor):** `system_actor` is an unconstrained `string` (`serviceContext.ts:71`), never persisted at Layer 1 (no CHECK/enum anywhere in migrations), and **zero code sites branch on it** (only log-string references at `withInvariants.ts:87,100`). `'backlog_sweep'` needs no registration; no behavioral risk. No task needed.
- **§11.2 (idempotency_key):** `audit_log.idempotency_key` has **no UNIQUE constraint** — "forensic-correlation-not-uniqueness" (migration `20240150:80-87`; RPC at `:229-258` inserts unconditionally). The duplicate decision-audit row on B2 re-resolve after a record-then-crash is confirmed benign and not suppressed. No code change.
- **§11.4 (join direction):** `document_jobs` carries both FKs NOT NULL (`20240152:348-349`); reverse lookup is `.from('document_jobs').select('source_document_id').eq('document_case_id', …)`.
- **§11.5 (candidate semantics):** B2's predicate = the exact filter `resolveCandidates` uses — `document_relationship_candidates WHERE document_case_id = X`, no status column involved. Candidates link to the **case** directly; the `document_jobs` join is only needed for B3-D/B3 (which need `source_document_id`).
- **§11.3 (folder guardrail):** remains an impl step — Task 1 Step 1.

## Pre-flight (once per shell)

```bash
export COORD_SESSION='wave-6-ap-review'   # commit hook requires it (session lock held by this arc)
cd /home/philc/projects/chounting
# Local Supabase must be running with migrations applied for integration tests.
# If substrate state matters (it does for eligibility-count assertions, which
# this plan avoids — all assertions are scoped to own-test case ids):
# pnpm db:reset:clean
```

All test commands run from `apps/web` (the `@/` alias resolves there):

```bash
cd /home/philc/projects/chounting/apps/web
```

## File structure

| File | Responsibility |
|---|---|
| Create: `apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts` | The sweep: eligibility query, bucketing, per-bucket recovery, report. ~260 lines. |
| Create: `apps/web/tests/integration/sweepStrandedCases.integration.test.ts` | All bucket/eligibility/dry-run/anomaly tests. |
| Create: `apps/web/scripts/sweep-stranded-cases.ts` | Thin operator runner (Tier-C shape): args + env + one call + printed report. |
| Modify: `docs/02_specs/ledger_truth_model.md` (INV-WORKFLOW-002 leaf) | Scope + Residual Class 1 + Enforcement wording flips (prospective → mechanism-shipped). |
| Modify: `docs/02_specs/invariants.md`, `docs/06_audit/control_matrix.md` | Rollup narrative + evidence row test cite. |

---

### Task 1: Module skeleton — eligibility, bucketing, dry-run report

**Files:**
- Create: `apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts`
- Create: `apps/web/tests/integration/sweepStrandedCases.integration.test.ts`

- [ ] **Step 1: Read the folder-placement guardrail (spec §11.3)**

Read `apps/web/src/README.md` in full before creating the `maintenance/` folder. The new folder sits inside the existing `agent/orchestrator/` authority layer (agent-side, per ADR-0020 — the module imports `ingestDocument`, which services may not). If the guardrail raises any conflict with this placement, STOP and surface — do not bypass (Pattern 7 procedure requires operator acknowledgment).

- [ ] **Step 2: Write the failing test — eligibility + dry-run**

Create `apps/web/tests/integration/sweepStrandedCases.integration.test.ts`:

```typescript
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
import { makeTestContext } from '../setup/makeTestContext';
import { sweepStrandedCases } from '@/agent/orchestrator/maintenance/sweepStrandedCases';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';
import { completeCandidate } from '@/services/document-platform/documentRouterService';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { attachDocumentCaseSource } from '@/services/document-platform/documentCaseSourceService';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { SYSTEM_ACTOR_USER_ID } from '@/services/middleware/serviceContext';
import type { ServiceContext } from '@/services/middleware/serviceContext';

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
```

Note: in dry-run, B3-D is distinguished from B3 (the pre-check runs — it is read-only), but the outcome is still `bucketed_dry_run`; on execute, B3-D's outcome becomes `dedup_carveout` (Task 4 covers execute-mode B3-D via the seam-adjacent test).

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd /home/philc/projects/chounting/apps/web
pnpm vitest run tests/integration/sweepStrandedCases.integration.test.ts
```

Expected: FAIL — `Cannot find module '@/agent/orchestrator/maintenance/sweepStrandedCases'` (or equivalent resolution error).

- [ ] **Step 4: Write the module — types, eligibility, bucketing, dry-run**

Create `apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts`:

```typescript
// src/agent/orchestrator/maintenance/sweepStrandedCases.ts
//
// Wave 6 D2.3 — stranded-case sweep: the INV-WORKFLOW-002
// eventual-consistency backstop. Recovers document cases stranded in the
// automation segment (received/extracting/classified/matched) by routing
// them through the EXISTING D2.1 decision machinery — the sweep never
// asserts a disposition itself (Approach B: artifact-aware bucketing,
// decision-machinery-only).
//
// Design: docs/09_briefs/v1/specs/2026-06-03-d2-3-stranded-case-sweep-design.md
//
// Placement: agent layer, forced by ADR-0020 Appendix A — this module
// imports ingestDocument (agent/orchestrator), which services/ may NOT
// import (folder-structure.md:168-170; agent-first-import-boundaries at
// 'error'). Agent → services imports are the permitted direction.
//
// Bucketing (per-case, IN ORDER — the order is load-bearing):
//   B1   state='matched'            → advanceCaseAutomation(→needs_review).
//        B1 MUST precede B2: a matched case has a candidate (branch (a)
//        set the head pointer), so it would also satisfy B2's test — but
//        it must take the hand-off, not a re-resolve (resolveCandidates'
//        branch-(a) RPC guards WHERE state='classified').
//   B2   ≥1 candidate row           → advance(→classified) (no-op at/past)
//        then resolveCandidates — real decisions via real branches.
//        Predicate = the EXACT filter resolveCandidates uses:
//        document_relationship_candidates WHERE document_case_id = X,
//        no status filter (documentRouterService.ts:410-420) — so B2
//        always resolves N≥1 → branch (a) or (b); branch (c) is
//        unreachable from B2 (candidate-less cases go B3, where the
//        re-run's own wiring owns branch (c)).
//   B3-D candidate-less + content-dup → report-only carve-out. Pre-check
//        via the Stage-0 dedupByHash module itself (single source of
//        dedup truth; original_content_hash is set at ingestion, so it
//        is always present). Catching the dup BEFORE the re-run prevents
//        the forever-loop (re-run → Stage-0 short-circuit → still
//        received → re-swept → …). Leaf: "the D2.3 sweep classifies
//        these, it does not route them."
//   B3   candidate-less, not a dup  → full ingestDocument re-run (work
//        genuinely missing; no self-dedup — dedupByHash.ts:66 .neq self).
//   B4   re-run returned pipeline_failed → reported, stays re-eligible.
//
// Race posture: created_at staleness is a COARSE primary filter (no
// updated_at column exists on document_cases — migration 20240143); the
// inherited guards carry the precise race-defense weight (idempotent
// advance, FOR UPDATE, WHERE state='classified', the partial-UNIQUE on
// open exceptions). Do not over-trust the threshold.

import crypto from 'crypto';
import { adminClient } from '@/db/adminClient';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import {
  SYSTEM_ACTOR_USER_ID,
  type SystemActorServiceContext,
} from '@/services/middleware/serviceContext';
import { advanceCaseAutomation } from '@/services/document-platform/documentCaseService';
import { resolveCandidates } from '@/services/document-platform/documentRouterService';
import { dedupByHash } from '../extraction/stages/dedupByHash';
import { ingestDocument } from '../extraction/ingestDocument';
import type {
  IngestDocumentInput,
  IngestDocumentOutput,
} from '../extraction/types';

// Distinct from 'pipeline_orchestrator' so audit rows distinguish
// sweep-initiated transitions from live-pipeline ones. system_actor is an
// unconstrained string (serviceContext.ts:71) — no Layer-1 persistence,
// no branching sites (grounded 2026-06-04; spec §11.1/§11.6 resolved).
const SYSTEM_ACTOR = 'backlog_sweep';

const ELIGIBLE_STATES = [
  'received',
  'extracting',
  'classified',
  'matched',
] as const;

const DEFAULT_STALENESS_MINUTES = 30;

export interface SweepInput {
  /** Restrict to one org; default all orgs. */
  org_id?: string;
  /** Cases must be created earlier than now - threshold. Default 30. */
  staleness_minutes?: number;
  /**
   * Restrict eligibility to these case ids (still state+staleness
   * filtered). Operational: targeted re-sweep. Tests: isolation —
   * document_cases rows accumulate across runs.
   */
  document_case_ids?: string[];
  /** false (default) = dry-run: bucket + report, ZERO writes. */
  execute?: boolean;
}

export type SweepBucket = 'B1' | 'B2' | 'B3-D' | 'B3' | 'B4' | 'anomaly';

export type SweepOutcome =
  | 'bucketed_dry_run'
  /** B1: matched→needs_review hand-off completed. */
  | 'handed_off'
  /** B2 branch (a): resolved to matched + hand-off to needs_review. */
  | 'resolved_matched_handed_off'
  /** B2 branches (b): real exception enqueued, case at needs_review. */
  | 'resolved_exception'
  /** B2 EXCEPTION_ALREADY_OPEN + re-read state=needs_review: someone
   *  completed it concurrently. */
  | 'recovered_concurrent'
  /** B2 EXCEPTION_ALREADY_OPEN + re-read state still eligible: an
   *  atomicity-violating shape (enqueue_exception_with_audit is one
   *  transaction) — reported, NEVER auto-repaired, NEVER re-run. This is
   *  what makes the sweep loop-safe by construction, independent of the
   *  atomicity holding. */
  | 'anomaly_open_exception_non_terminal'
  /** B3-D: genuine content-dup of another doc; the original carries the
   *  workflow. Sweep-terminal (reported), never re-run. */
  | 'dedup_carveout'
  /** B3: full re-run reached a terminal disposition. */
  | 'rerun_recovered'
  /** B4: re-run returned pipeline_failed; re-eligible next run. */
  | 'pipeline_failed'
  /** Anomaly: case has no document_jobs row — no source document to
   *  dedup-check or re-run. Reported for operator eyes. */
  | 'no_job_row'
  /** Per-case isolation catch-all: recovery threw; reported, sweep
   *  continues. */
  | 'errored';

export interface SweepCaseOutcome {
  document_case_id: string;
  source_document_id: string | null;
  state_before: string;
  bucket: SweepBucket;
  outcome: SweepOutcome;
  /** Fresh per-case trace_id (a trace scopes one flow). */
  trace_id: string;
  exception_reason?: string;
  failure_class?: string | null;
  error_code?: string;
}

export interface SweepReport {
  run_trace_id: string;
  dry_run: boolean;
  eligible_count: number;
  counts: Record<SweepBucket, number>;
  cases: SweepCaseOutcome[];
}

/** DI seam: tests stub the ingest runner to cover B3/B4 without OCR. */
export interface SweepDeps {
  runIngest?: (input: IngestDocumentInput) => Promise<IngestDocumentOutput>;
}

interface EligibleCaseRow {
  id: string;
  org_id: string;
  state: string;
  created_at: string;
}

function caseCtx(org_id: string): SystemActorServiceContext {
  return {
    trace_id: crypto.randomUUID(),
    org_id,
    caller: {
      user_id: null,
      system_actor: SYSTEM_ACTOR,
      // Path-X service account (ADR-0007 Q78): system actors write the
      // joinable identity, not null.
      system_user_id: SYSTEM_ACTOR_USER_ID,
    },
  };
}

export async function sweepStrandedCases(
  input: SweepInput,
  deps: SweepDeps = {},
): Promise<SweepReport> {
  const runIngest = deps.runIngest ?? ingestDocument;
  const run_trace_id = crypto.randomUUID();
  const dry_run = !(input.execute ?? false);
  const stalenessMinutes =
    input.staleness_minutes ?? DEFAULT_STALENESS_MINUTES;
  const log = loggerWith({ trace_id: run_trace_id });
  const db = adminClient();

  const cutoff = new Date(
    Date.now() - stalenessMinutes * 60_000,
  ).toISOString();

  let query = db
    .from('document_cases')
    .select('id, org_id, state, created_at')
    .in('state', [...ELIGIBLE_STATES])
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true });
  if (input.org_id) {
    query = query.eq('org_id', input.org_id);
  }
  if (input.document_case_ids && input.document_case_ids.length > 0) {
    query = query.in('id', input.document_case_ids);
  }

  const { data: eligible, error } = await query;
  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `[sweepStrandedCases] eligibility query failed: ${error.message}`,
    );
  }

  const report: SweepReport = {
    run_trace_id,
    dry_run,
    eligible_count: eligible?.length ?? 0,
    counts: { B1: 0, B2: 0, 'B3-D': 0, B3: 0, B4: 0, anomaly: 0 },
    cases: [],
  };

  // Sequential, oldest-first (race-surface minimization; v1 scale).
  for (const row of (eligible ?? []) as EligibleCaseRow[]) {
    const outcome = await sweepOneCase(db, row, dry_run, runIngest, log);
    report.counts[outcome.bucket] += 1;
    report.cases.push(outcome);
  }

  log.info(
    {
      eligible: report.eligible_count,
      dry_run,
      ...report.counts,
    },
    'sweepStrandedCases complete',
  );
  return report;
}

async function sweepOneCase(
  db: ReturnType<typeof adminClient>,
  row: EligibleCaseRow,
  dry_run: boolean,
  runIngest: (input: IngestDocumentInput) => Promise<IngestDocumentOutput>,
  log: ReturnType<typeof loggerWith>,
): Promise<SweepCaseOutcome> {
  const ctx = caseCtx(row.org_id);
  let source_document_id: string | null = null;
  const base = () => ({
    document_case_id: row.id,
    source_document_id,
    state_before: row.state,
    trace_id: ctx.trace_id,
  });

  try {
    // Reverse join off document_jobs (both FKs NOT NULL on the job row —
    // migration 20240152:348-349). Oldest job wins if several.
    const { data: job, error: jobErr } = await db
      .from('document_jobs')
      .select('source_document_id')
      .eq('document_case_id', row.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (jobErr) {
      throw new ServiceError(
        'READ_FAILED',
        `[sweepStrandedCases] document_jobs read failed for case ${row.id}: ${jobErr.message}`,
      );
    }
    source_document_id = job?.source_document_id ?? null;

    // ----- B1 (must precede B2 — see module header) -----
    if (row.state === 'matched') {
      if (dry_run) {
        return { ...base(), bucket: 'B1', outcome: 'bucketed_dry_run' };
      }
      await advanceCaseAutomation(
        { document_case_id: row.id, target_state: 'needs_review' },
        ctx,
      );
      return { ...base(), bucket: 'B1', outcome: 'handed_off' };
    }

    // ----- B2 — candidate-bearing -----
    const { data: cands, error: candErr } = await db
      .from('document_relationship_candidates')
      .select('id')
      .eq('document_case_id', row.id)
      .limit(1);
    if (candErr) {
      throw new ServiceError(
        'READ_FAILED',
        `[sweepStrandedCases] candidate probe failed for case ${row.id}: ${candErr.message}`,
      );
    }
    if ((cands?.length ?? 0) > 0) {
      if (dry_run) {
        return { ...base(), bucket: 'B2', outcome: 'bucketed_dry_run' };
      }
      return await recoverCandidateBearing(db, row, ctx, base);
    }

    // ----- candidate-less: need a source document from here on -----
    if (!source_document_id) {
      return { ...base(), bucket: 'anomaly', outcome: 'no_job_row' };
    }

    // ----- B3-D — dedup carve-out pre-check (read-only; Stage-0 module) -----
    const dedup = await dedupByHash({
      org_id: row.org_id,
      source_document_id,
      trace_id: ctx.trace_id,
    });
    if (dedup.result.shortCircuited) {
      // Dry-run and execute report identically except the outcome label —
      // there is no action either way (sweep-terminal carve-out).
      return {
        ...base(),
        bucket: 'B3-D',
        outcome: dry_run ? 'bucketed_dry_run' : 'dedup_carveout',
      };
    }

    // ----- B3 — full re-run -----
    if (dry_run) {
      return { ...base(), bucket: 'B3', outcome: 'bucketed_dry_run' };
    }
    const out = await runIngest({
      org_id: row.org_id,
      source_document_id,
      trace_id: ctx.trace_id,
    });
    if (out.status === 'pipeline_failed') {
      return {
        ...base(),
        bucket: 'B4',
        outcome: 'pipeline_failed',
        failure_class: out.failure_class,
      };
    }
    if (out.status === 'dedup_short_circuit') {
      // Defensive: the pre-check should have caught it; a dup ingested
      // between pre-check and re-run lands here. Same carve-out semantics.
      return { ...base(), bucket: 'B3-D', outcome: 'dedup_carveout' };
    }
    return { ...base(), bucket: 'B3', outcome: 'rerun_recovered' };
  } catch (err) {
    // Per-case isolation: one failure never aborts the sweep.
    const error_code = err instanceof ServiceError ? err.code : 'UNKNOWN';
    log.error(
      {
        document_case_id: row.id,
        error_code,
        message: err instanceof Error ? err.message : String(err),
      },
      'sweepStrandedCases: case recovery failed',
    );
    return {
      ...base(),
      bucket: 'anomaly',
      outcome: 'errored',
      error_code,
    };
  }
}

async function recoverCandidateBearing(
  db: ReturnType<typeof adminClient>,
  row: EligibleCaseRow,
  ctx: SystemActorServiceContext,
  base: () => Omit<SweepCaseOutcome, 'bucket' | 'outcome'>,
): Promise<SweepCaseOutcome> {
  // Honest advance: candidates prove OCR + classification happened.
  // No-op when already classified (PIPELINE_ORDER at/past guard).
  await advanceCaseAutomation(
    { document_case_id: row.id, target_state: 'classified' },
    ctx,
  );

  let decision;
  try {
    decision = await resolveCandidates(
      { document_case_id: row.id, trace_id: ctx.trace_id },
      ctx,
    );
  } catch (err) {
    if (
      err instanceof ServiceError &&
      err.code === 'EXCEPTION_ALREADY_OPEN'
    ) {
      // Loop-safe by construction: re-read state; NEVER auto-repair,
      // NEVER re-run (spec §6 — the anomaly bucket breaks the re-sweep
      // loop independent of the enqueue RPC's atomicity).
      const { data: fresh, error: freshErr } = await db
        .from('document_cases')
        .select('state')
        .eq('id', row.id)
        .single();
      if (freshErr) {
        throw new ServiceError(
          'READ_FAILED',
          `[sweepStrandedCases] state re-read failed for case ${row.id}: ${freshErr.message}`,
        );
      }
      if (fresh?.state === 'needs_review') {
        return {
          ...base(),
          bucket: 'B2',
          outcome: 'recovered_concurrent',
        };
      }
      return {
        ...base(),
        bucket: 'anomaly',
        outcome: 'anomaly_open_exception_non_terminal',
      };
    }
    throw err;
  }

  if (decision.branch === 'a') {
    // D2.1 wiring order: branch (a) leaves the case at matched; the
    // matched→needs_review hand-off belongs to the caller (same shape as
    // ingestDocument's Stage-6.5 routing block).
    await advanceCaseAutomation(
      { document_case_id: row.id, target_state: 'needs_review' },
      ctx,
    );
    return {
      ...base(),
      bucket: 'B2',
      outcome: 'resolved_matched_handed_off',
    };
  }
  // Branch (b) — multi_candidate_ambiguity (branch (c) unreachable from
  // B2: N≥1 by the bucket predicate; no status filter on the candidate
  // load). The real exception_reason rides the decision record.
  return {
    ...base(),
    bucket: 'B2',
    outcome: 'resolved_exception',
    exception_reason: decision.exception_reason ?? undefined,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd /home/philc/projects/chounting/apps/web
pnpm vitest run tests/integration/sweepStrandedCases.integration.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 6: Typecheck**

```bash
cd /home/philc/projects/chounting/apps/web && pnpm typecheck
```

Expected: clean. If `decision.branch` / `decision.exception_reason` typing complains, the `RouterDecision` return type of `resolveCandidates` carries both fields (`documentRouterService.ts:1653-1662`) — fix the import-free structural use, do not add a new type.

- [ ] **Step 7: Commit**

```bash
cd /home/philc/projects/chounting
git add apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts apps/web/tests/integration/sweepStrandedCases.integration.test.ts
git commit -m "feat(document-platform): Wave 6 D2.3 T1 — sweepStrandedCases skeleton (eligibility + bucketing + dry-run)"
```

---

### Task 2: Execute-mode B1 — matched hand-off

**Files:**
- Modify: `apps/web/tests/integration/sweepStrandedCases.integration.test.ts` (append describe)
- (Module already implements B1 execute — this task proves it.)

- [ ] **Step 1: Write the failing-or-passing test (TDD checkpoint: it must exercise execute)**

Append to the test file:

```typescript
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
```

- [ ] **Step 2: Run the tests**

```bash
cd /home/philc/projects/chounting/apps/web
pnpm vitest run tests/integration/sweepStrandedCases.integration.test.ts
```

Expected: PASS (6 tests). If the attribution assertion fails on `user_id`, verify `SYSTEM_ACTOR_USER_ID` import and that the seeded hop's audit row (seed trace_id) is not being matched — the assertion filters by the SWEEP's per-case `trace_id` from the report, which is disjoint from the seed trace.

- [ ] **Step 3: Commit**

```bash
cd /home/philc/projects/chounting
git add apps/web/tests/integration/sweepStrandedCases.integration.test.ts
git commit -m "test(document-platform): Wave 6 D2.3 T2 — B1 matched hand-off execute coverage"
```

---

### Task 3: Execute-mode B2 — candidate-bearing re-resolve (+ anomaly handling)

**Files:**
- Modify: `apps/web/tests/integration/sweepStrandedCases.integration.test.ts` (append helpers + describe)

The B2 seeding follows the `resolveCandidates` test's Pattern B: service-layer case + vendor + bills + `completeCandidate` — then DELIBERATELY no `resolveCandidates` call, which is exactly the pre-D2.1 backlog shape (candidates persisted, decision-less, state frozen at `received`).

- [ ] **Step 1: Append the B2 seeding helpers**

```typescript
// --- Pattern B seeding: candidate-bearing stranding (pre-D2.1 backlog shape) ---

interface CandidateBearingCase {
  caseId: string;
  sourceDocId: string;
  vendorId: string;
  billIds: string[];
}

async function seedCandidateBearingStranding(
  ctx: ServiceContext,
  nBills: number,
): Promise<CandidateBearingCase> {
  const orgId = SEED.ORG_HOLDING;

  // Vendor (direct INSERT — Phase 5 decoupling per chunk-1 precedent).
  const vendorId = crypto.randomUUID();
  const { error: vendorErr } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: `TEST d2-3 sweep vendor ${vendorId.slice(0, 8)}`,
  });
  if (vendorErr) throw new Error(`vendor fixture failed: ${vendorErr.message}`);

  // Bills with IDENTICAL amount_cad — N≥2 must produce identical
  // aggregate confidence scores → margin 0 → branch (b). (Chunk-3
  // multi-feature scoring discipline; see resolveCandidates test
  // seedNOpenBillsForVendor rationale.)
  const billIds: string[] = [];
  for (let i = 0; i < nBills; i++) {
    const billId = crypto.randomUUID();
    const { error } = await db.from('bills').insert({
      bill_id: billId,
      org_id: orgId,
      vendor_id: vendorId,
      issue_date: '2026-06-04',
      lifecycle_state: 'approved_for_payment',
      amount_cad: 1000,
    });
    if (error) throw new Error(`bill fixture failed: ${error.message}`);
    billIds.push(billId);
  }

  // Source document + case + attach (service-layer, chunk-5/chunk-1/chunk-3 precedents).
  const { ingest_batch_id } = await createIngestBatchForTest(orgId);
  const sourceResult = await documentPlatformService.createSourceDocument(
    {
      bytes: new Uint8Array([1, 2, 3, 4]),
      mime_type: 'application/pdf',
      original_filename: `d2-3-sweep-${crypto.randomUUID().slice(0, 8)}.pdf`,
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

  // document_jobs row — the sweep's reverse join needs it.
  const { error: djErr } = await db.from('document_jobs').insert({
    id: crypto.randomUUID(),
    org_id: orgId,
    source_document_id: sourceResult.id,
    document_case_id: caseResult.id,
    state: 'queued',
    trace_id: ctx.trace_id,
    created_by: SEED.USER_CONTROLLER,
  });
  if (djErr) throw new Error(`document_jobs fixture failed: ${djErr.message}`);

  // Candidate emission via the REAL path (completeCandidate works at
  // 'received' — same as the resolveCandidates test helper, which calls
  // it before the classified transition). Then STOP: no resolveCandidates,
  // no state advance — the pre-D2.1 backlog stranding shape.
  await completeCandidate(
    {
      document_case_id: caseResult.id,
      source_document_id: sourceResult.id,
      document_type: 'vendor_invoice',
      classification_confidence: 0.95,
      extracted_fields: { invoice_amount: 1000 },
      vendor_match: {
        vendor_id: vendorId,
        confidence: 0.95,
        match_type: 'exact_name',
        candidate_alternatives: [],
      },
      trace_id: ctx.trace_id,
    },
    ctx,
  );

  return {
    caseId: caseResult.id,
    sourceDocId: sourceResult.id,
    vendorId,
    billIds,
  };
}
```

- [ ] **Step 2: Append the B2 describe (failing first run is acceptable only on fixture errors — fix fixtures, not module)**

```typescript
// =====================================================================
// Describe 3 — B2: candidate-bearing re-resolve (execute)
// =====================================================================

describe('sweepStrandedCases — B2 candidate-bearing recovery', () => {
  it('N=1: advances received→classified, resolves branch (a), hands off to needs_review', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const { caseId } = await seedCandidateBearingStranding(ctx, 1);
    expect(await caseState(caseId)).toBe('received'); // stranding shape

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({
      bucket: 'B2',
      outcome: 'resolved_matched_handed_off',
    });
    expect(await caseState(caseId)).toBe('needs_review');

    // The decision is REAL: head pointer set by branch (a).
    const { data: caseRow } = await db
      .from('document_cases')
      .select('current_relationship_candidate_id')
      .eq('id', caseId)
      .single();
    expect(caseRow!.current_relationship_candidate_id).not.toBeNull();
  });

  it('N=2 identical: resolves branch (b) — real multi_candidate_ambiguity exception, needs_review', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const { caseId } = await seedCandidateBearingStranding(ctx, 2);

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({
      bucket: 'B2',
      outcome: 'resolved_exception',
      exception_reason: 'multi_candidate_ambiguity',
    });
    expect(await caseState(caseId)).toBe('needs_review');

    const { data: exRows } = await db
      .from('exception_queue_entries')
      .select('exception_reason, exception_status')
      .eq('document_case_id', caseId);
    expect(exRows).toHaveLength(1);
    expect(exRows![0]).toMatchObject({
      exception_reason: 'multi_candidate_ambiguity',
      exception_status: 'open',
    });
  });

  it('EXCEPTION_ALREADY_OPEN + state still classified → anomaly bucket, no mutation, no loop', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    // N=2 → branch (b) → enqueueException — which will hit the
    // pre-inserted open exception's partial-UNIQUE and throw 23505 →
    // EXCEPTION_ALREADY_OPEN.
    const { caseId } = await seedCandidateBearingStranding(ctx, 2);

    // Construct the atomicity-violating shape directly (it cannot arise
    // through the RPC — that is the point of the test).
    const { error: exErr } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: caseId,
      exception_reason: 'multi_candidate_ambiguity',
      trace_id: crypto.randomUUID(),
      created_by: SEED.USER_CONTROLLER,
    });
    if (exErr) throw new Error(`exception fixture failed: ${exErr.message}`);

    const report = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });

    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({
      bucket: 'anomaly',
      outcome: 'anomaly_open_exception_non_terminal',
    });
    // NOT auto-repaired: state advanced to classified by the honest B2
    // advance (the work demonstrably happened), but NOT to needs_review.
    expect(await caseState(caseId)).toBe('classified');

    // Loop-safety: a second sweep re-buckets B2 → same anomaly outcome,
    // not an error cascade and not a re-run.
    const second = await sweepStrandedCases({
      document_case_ids: [caseId],
      staleness_minutes: 0,
      execute: true,
    });
    const c2 = second.cases.find((x) => x.document_case_id === caseId);
    expect(c2).toMatchObject({
      bucket: 'anomaly',
      outcome: 'anomaly_open_exception_non_terminal',
    });
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
cd /home/philc/projects/chounting/apps/web
pnpm vitest run tests/integration/sweepStrandedCases.integration.test.ts
```

Expected: PASS (9 tests). Likely fixture failures to debug in order: (1) `bills` insert column mismatch — the column set above is transcribed from `documentRouterService.resolveCandidates.integration.test.ts:133-140` at HEAD; re-verify from that file if it errors; (2) `completeCandidate` Zod rejection — compare against `buildCompleteInput` (`:200-219` same file).

- [ ] **Step 4: Commit**

```bash
cd /home/philc/projects/chounting
git add apps/web/tests/integration/sweepStrandedCases.integration.test.ts
git commit -m "test(document-platform): Wave 6 D2.3 T3 — B2 re-resolve (branch a/b) + EXCEPTION_ALREADY_OPEN anomaly coverage"
```

---

### Task 4: Execute-mode B3/B4 via the DI seam (+ execute-mode B3-D)

**Files:**
- Modify: `apps/web/tests/integration/sweepStrandedCases.integration.test.ts` (append describe)

- [ ] **Step 1: Append the B3/B4/B3-D describe**

```typescript
// =====================================================================
// Describe 4 — B3/B4 via DI seam + B3-D execute
// =====================================================================

describe('sweepStrandedCases — B3 re-run dispatch, B4 failure, B3-D carve-out', () => {
  it('B3: dispatches the injected runner with org/doc/fresh-trace and reports rerun_recovered', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId, sourceDocId } = await seedStrandedCase(trace_id); // received, candidate-less, unique hash

    const calls: Array<{ org_id: string; source_document_id: string; trace_id: string }> = [];
    const report = await sweepStrandedCases(
      { document_case_ids: [caseId], staleness_minutes: 0, execute: true },
      {
        runIngest: async (input) => {
          calls.push(input);
          return {
            status: 'parked_unposted',
            pipeline_trace: [],
            proposal_id: null,
            failure_class: null,
          };
        },
      },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
    });
    const c = report.cases.find((x) => x.document_case_id === caseId);
    expect(c).toMatchObject({ bucket: 'B3', outcome: 'rerun_recovered' });
    // The stub's trace must be the case's fresh per-case trace from the report.
    expect(calls[0]!.trace_id).toBe(c!.trace_id);
  });

  it('B4: pipeline_failed is reported with failure_class and the case stays re-eligible', async () => {
    const trace_id = crypto.randomUUID();
    const { caseId } = await seedStrandedCase(trace_id);

    const failingRunner = async () => ({
      status: 'pipeline_failed' as const,
      pipeline_trace: [],
      proposal_id: null,
      failure_class: 'transient_exhausted' as const,
    });

    const first = await sweepStrandedCases(
      { document_case_ids: [caseId], staleness_minutes: 0, execute: true },
      { runIngest: failingRunner },
    );
    const c1 = first.cases.find((x) => x.document_case_id === caseId);
    expect(c1).toMatchObject({
      bucket: 'B4',
      outcome: 'pipeline_failed',
      failure_class: 'transient_exhausted',
    });
    expect(await caseState(caseId)).toBe('received');

    // Re-eligible: the next sweep buckets it B3 again.
    const second = await sweepStrandedCases(
      { document_case_ids: [caseId], staleness_minutes: 0 },
    );
    const c2 = second.cases.find((x) => x.document_case_id === caseId);
    expect(c2).toMatchObject({ bucket: 'B3', outcome: 'bucketed_dry_run' });
  });

  it('B3-D execute: content-dup reports dedup_carveout, zero writes, runner NEVER invoked (no loop)', async () => {
    const hash = randomHash();
    await seedStrandedCase(crypto.randomUUID(), { content_hash: hash }); // the original
    const dup = await seedStrandedCase(crypto.randomUUID(), { content_hash: hash });

    let runnerInvoked = false;
    const report = await sweepStrandedCases(
      { document_case_ids: [dup.caseId], staleness_minutes: 0, execute: true },
      {
        runIngest: async () => {
          runnerInvoked = true;
          return {
            status: 'dedup_short_circuit',
            pipeline_trace: [],
            proposal_id: null,
            failure_class: null,
          };
        },
      },
    );

    expect(runnerInvoked).toBe(false); // the pre-check catches it BEFORE the re-run
    const c = report.cases.find((x) => x.document_case_id === dup.caseId);
    expect(c).toMatchObject({ bucket: 'B3-D', outcome: 'dedup_carveout' });
    expect(await caseState(dup.caseId)).toBe('received');
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
cd /home/philc/projects/chounting/apps/web
pnpm vitest run tests/integration/sweepStrandedCases.integration.test.ts
```

Expected: PASS (12 tests).

- [ ] **Step 3: Full-file + floor sanity**

```bash
cd /home/philc/projects/chounting/apps/web
pnpm vitest run tests/integration/sweepStrandedCases.integration.test.ts && pnpm typecheck
cd /home/philc/projects/chounting && pnpm agent:validate
```

Expected: all green (agent:validate = typecheck + no-hardcoded-URLs + Category A floor).

- [ ] **Step 4: Commit**

```bash
cd /home/philc/projects/chounting
git add apps/web/tests/integration/sweepStrandedCases.integration.test.ts
git commit -m "test(document-platform): Wave 6 D2.3 T4 — B3/B4 DI-seam dispatch + B3-D carve-out execute coverage"
```

---

### Task 5: Operator runner script

**Files:**
- Create: `apps/web/scripts/sweep-stranded-cases.ts`

- [ ] **Step 1: Write the runner (Tier-C shape: args + env + one call)**

```typescript
/**
 * Wave 6 D2.3 — stranded-case sweep operator runner.
 *
 * Thin runner over sweepStrandedCases() (the orchestrator-layer seam —
 * a future scheduler is a caller of the same method, not a refactor).
 * Mirrors scripts/tier-c-empirical-exercise.ts: arg parsing + env
 * loading + one call. No logic lives here.
 *
 * DRY-RUN IS THE DEFAULT. The dry-run report previews exact buckets —
 * and the B3 count, which IS the OCR/Claude spend — before --execute.
 *
 * Invocation (from repo root; cwd must be apps/web for the @/ alias):
 *   cd apps/web
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts                      # dry-run, all orgs
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts --org-id <uuid>
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts --staleness-minutes 60
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts --execute            # acts
 *
 * Output: JSON SweepReport to stdout (IDs only — no document content).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const SCRIPT_DIR = path.dirname(process.argv[1] ?? __filename ?? '');
const APP_WEB_DIR = path.resolve(SCRIPT_DIR, '..');

// --- CLI args ---
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// --- env (mirror tier-c-empirical-exercise.ts) ---
function loadEnvLocal(): void {
  const envPath = path.join(APP_WEB_DIR, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  // Dynamic import AFTER env is loaded — the module graph reads env at
  // import time (adminClient).
  const { sweepStrandedCases } = await import(
    '../src/agent/orchestrator/maintenance/sweepStrandedCases'
  );

  const stalenessArg = arg('staleness-minutes');
  const report = await sweepStrandedCases({
    org_id: arg('org-id'),
    staleness_minutes:
      stalenessArg !== undefined ? Number(stalenessArg) : undefined,
    execute: flag('execute'),
  });

  // eslint-disable-next-line no-console -- operator runner output surface
  console.log(JSON.stringify(report, null, 2));
  if (report.dry_run) {
    // eslint-disable-next-line no-console -- operator runner output surface
    console.log(
      `\nDRY RUN — no writes performed. B3 count (${report.counts.B3}) is the re-run OCR/Claude spend. Re-invoke with --execute to act.`,
    );
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console -- operator runner failure surface
  console.error('sweep-stranded-cases failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify against the local DB (dry-run only)**

```bash
cd /home/philc/projects/chounting/apps/web
pnpm exec tsx scripts/sweep-stranded-cases.ts --staleness-minutes 0 | head -30
```

Expected: a JSON `SweepReport` (likely with accumulated test-fixture strandings in the local DB — that is fine; this is dry-run) followed by the DRY RUN banner. Errors about missing env mean `.env.local` is absent — set `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` in the shell instead.

- [ ] **Step 3: Typecheck + commit**

```bash
cd /home/philc/projects/chounting/apps/web && pnpm typecheck
cd /home/philc/projects/chounting
git add apps/web/scripts/sweep-stranded-cases.ts
git commit -m "feat(document-platform): Wave 6 D2.3 T5 — operator runner (dry-run default, Tier-C shape)"
```

---

### Task 6: Doc-sync — INV-WORKFLOW-002 leaf + rollup + control matrix

**Files:**
- Modify: `docs/02_specs/ledger_truth_model.md` (INV-WORKFLOW-002 leaf, ~lines 2345-2426)
- Modify: `docs/02_specs/invariants.md` (row #26)
- Modify: `docs/06_audit/control_matrix.md` (INV-WORKFLOW-002 evidence row)

Per spec §9: at the CODE commit the leaf flips prospective→realized for the *mechanism*; Class 1 is marked **retirement-mechanism-shipped**, NOT flat "retired" (the backlog stays stranded until the operator runs it — registration honesty). The one-time backlog-clearing run is a separate, named deliverable; its completion flips the wording to flat "retired" in a follow-up doc-sync citing the run's report.

**Discipline: every Edit below has a multi-line `oldText` → Read the target block first and construct `oldText` from the Read, not from this plan (CLAUDE.md Z1 #11.a — the snippets here are from a 2026-06-04 read at `9ef64ded` and may have drifted by impl time).**

- [ ] **Step 1: Read the leaf** (`docs/02_specs/ledger_truth_model.md` lines 2345-2430), then apply three edits:

**Edit A — Scope paragraph.** Current text (verify by Read):

```
run that reaches the Stage-6.5 decision routes its case to a terminal
disposition, with the D2.3 sweep as the eventual-consistency backstop.
```

Replace the second line with:

```
disposition, with the D2.3 sweep (`sweepStrandedCases`,
`apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts`,
SHIPPED) as the eventual-consistency backstop.
```

**Edit B — dedup carve-out sentence.** Current text ends:

```
`dedup_short_circuit` status/trace and the hash match (the original
case carries the workflow) — the D2.3 sweep classifies these, it does
not route them.
```

Replace the final clause with:

```
`dedup_short_circuit` status/trace and the hash match (the original
case carries the workflow) — the D2.3 sweep classifies these, it does
not route them (realized: the sweep's B3-D bucket reports
`dedup_carveout` via the Stage-0 `dedupByHash` pre-check and never
re-runs them).
```

**Edit C — Residual Class 1.** Current text:

```
1. **Pre-enforcement parked backlog (transitional).** Cases stranded
   before the routing landed — `received`-parked by the Wave -1
   bleed-stop, plus any pre-T4 attachment/unknown strandings (e.g. at
   `matched`); retired by the D2.3 sweep.
```

Replace the final clause (`retired by the D2.3 sweep.`) with:

```
   `matched`); retirement mechanism SHIPPED at D2.3
   (`sweepStrandedCases` + operator runner, dry-run default);
   retirement completes at the one-time backlog-clearing run — the
   flat "retired" wording lands in the follow-up doc-sync citing that
   run's report. NOT flat-retired at the code commit: the sweep is
   operator-run, and the backlog stays stranded on disk until it
   executes.
```

**Edit D — Enforcement paragraph test cite.** Append to the existing "Test-verified by …" sentence (after the D2.1 T4 suite cite):

```
 + `apps/web/tests/integration/sweepStrandedCases.integration.test.ts`
(the D2.3 backstop: bucketing, per-bucket recovery through the
machinery, EXCEPTION_ALREADY_OPEN anomaly split, dry-run zero-writes).
```

- [ ] **Step 2: `invariants.md` row #26** — Read the INV-WORKFLOW-002 row first; append to its narrative: "D2.3 sweep (`sweepStrandedCases`) shipped as the eventual-consistency backstop; Class-1 retirement completes at the one-time backlog-clearing run." Keep the row's existing structure — additive only.

- [ ] **Step 3: `control_matrix.md`** — Read the INV-WORKFLOW-002 row; add the sweep test file to its evidence/tests column alongside the existing cites. Additive only.

- [ ] **Step 4: Reachability check**

```bash
grep -rn "INV-WORKFLOW-002" /home/philc/projects/chounting/apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts
```

If the module does not yet carry the annotation, add to the module header comment: `// INV-WORKFLOW-002 — eventual-consistency backstop (the leaf's named D2.3 sweep).` Then verify both directions: leaf names the file (Edit A), file names the invariant.

- [ ] **Step 5: Commit**

```bash
cd /home/philc/projects/chounting
git add docs/02_specs/ledger_truth_model.md docs/02_specs/invariants.md docs/06_audit/control_matrix.md apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts
git commit -m "docs(v1): Wave 6 D2.3 T6 — INV-WORKFLOW-002 leaf/rollup/matrix doc-sync (mechanism-shipped, Class-1 retirement sequenced to the backlog run)"
```

---

### Task 7: Close — full validation + read-back surface

- [ ] **Step 1: Full validation sweep**

```bash
cd /home/philc/projects/chounting
pnpm agent:validate
cd apps/web && pnpm typecheck && pnpm vitest run tests/integration/sweepStrandedCases.integration.test.ts
cd /home/philc/projects/chounting && pnpm lint
```

Expected: all green. (Full `pnpm test:full` belongs to the wave-close push gate, not this chunk — per the push-terminal-close timing pattern.)

- [ ] **Step 2: Surface for read-back**

Report to the operator: commits landed this chunk, test counts, the three spec deviations (header of this plan) for ratification, and the named remaining deliverable — the **one-time backlog-clearing run** (operator-executed: dry-run read-back of the report, then `--execute`; then the follow-up doc-sync flipping Class 1 to flat "retired" citing the run's report). D2.3 closes when both land.

---

## Self-review (run after writing — completed at plan authoring)

1. **Spec coverage:** §1-§7 → Tasks 1-5; §8 testing → Tasks 1-4 (B2 branch-(c) variant dropped per grounded deviation 3; everything else covered incl. dry-run zero-writes, anomaly, eligibility); §9 doc-sync → Task 6 (incl. the retirement-timing sequencing); §10 carry-forwards → no tasks by design (named, not built); §11 must-confirms → four resolved at plan time (recorded above), §11.3 → Task 1 Step 1.
2. **Placeholder scan:** none — every code step carries complete code; the two "verify from disk" notes (Task 3 Step 3, Task 6 preamble) are drift-discipline re-verification instructions with the expected current text shown, not gaps.
3. **Type consistency:** `SweepInput`/`SweepDeps`/`SweepReport`/`SweepCaseOutcome`/`SweepBucket`/`SweepOutcome` defined once (Task 1) and used identically in Tasks 2-5; `runIngest` stub returns match `IngestDocumentOutput` literal unions (`'parked_unposted'`/`'pipeline_failed'`/`'dedup_short_circuit'`, `failure_class: 'transient_exhausted'`); `target_state` values used (`'needs_review'`, `'classified'`) are within the grounded Zod enum `['extracting','classified','needs_review']`.
