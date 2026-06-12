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
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import {
  findEligibleStrandedCases,
  resolvePrimaryIngestSource,
  caseHasRelationshipCandidates,
  getDocumentCaseState,
} from '@/services/document-platform/strandedCaseReadService';
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
  /**
   * Cap on B3 full re-runs (the OCR/Claude spend) per execute run. When
   * reached, further B3-eligible cases are reported 'b3_cap_skipped'
   * (re-eligible next run) instead of re-run, so a scheduled run can't
   * spike spend on a large backlog. undefined = no cap (CLI/operator
   * default). Dry-run is unaffected (it never re-runs); the read-only
   * B3-D dedup pre-check is never capped (no spend).
   */
  max_b3_reruns?: number;
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
  /** B3 cap reached this run: the re-run (OCR/Claude spend) was skipped;
   *  the case stays re-eligible for the next run. Bounds scheduled spend. */
  | 'b3_cap_skipped'
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
  /** Actual B3 full re-runs performed this run (the OCR/Claude spend) —
   *  distinct from counts.B3, which also includes capped/dry-run cases. */
  b3_reruns_executed: number;
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

/** Mutable per-run B3 re-run budget (the OCR/Claude spend ceiling) threaded
 *  through sweepOneCase. undefined max = uncapped. */
interface B3Budget {
  used: number;
  max?: number;
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

  const cutoff = new Date(
    Date.now() - stalenessMinutes * 60_000,
  ).toISOString();

  // Eligibility scan via the services layer (Arc 1 T2 — ADR-0020
  // Law 1); filter semantics identical (optional org / explicit-ids
  // narrowing applied only when provided).
  const eligible = await findEligibleStrandedCases({
    states: [...ELIGIBLE_STATES],
    cutoffIso: cutoff,
    org_id: input.org_id,
    document_case_ids: input.document_case_ids,
  });

  const report: SweepReport = {
    run_trace_id,
    dry_run,
    eligible_count: eligible?.length ?? 0,
    counts: { B1: 0, B2: 0, 'B3-D': 0, B3: 0, B4: 0, anomaly: 0 },
    b3_reruns_executed: 0,
    cases: [],
  };

  // Per-run B3 re-run budget — the OCR/Claude spend ceiling. undefined max
  // = uncapped (CLI/operator default); the scheduled caller passes a cap so
  // a large backlog drains in bounded increments instead of spiking spend.
  const b3Budget: B3Budget = { used: 0, max: input.max_b3_reruns };

  // Sequential, oldest-first (race-surface minimization; v1 scale).
  for (const row of (eligible ?? []) as EligibleCaseRow[]) {
    const outcome = await sweepOneCase(row, dry_run, runIngest, log, b3Budget);
    report.counts[outcome.bucket] += 1;
    report.cases.push(outcome);
  }
  report.b3_reruns_executed = b3Budget.used;

  log.info(
    {
      eligible: report.eligible_count,
      dry_run,
      b3_reruns_executed: report.b3_reruns_executed,
      ...report.counts,
    },
    'sweepStrandedCases complete',
  );
  return report;
}

async function sweepOneCase(
  row: EligibleCaseRow,
  dry_run: boolean,
  runIngest: (input: IngestDocumentInput) => Promise<IngestDocumentOutput>,
  log: ReturnType<typeof loggerWith>,
  b3Budget: B3Budget,
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
    // migration 20240152:348-349). One pick per case, feeding every bucket
    // below (B3-D dedup pre-check, B3 re-run, reported source_document_id,
    // no_job_row anomaly). resolvePrimaryIngestSource prefers an attachment
    // over the .eml email_body for multi-job (forwarded-mailbox) cases so
    // the dedup pre-check and re-run both target the invoice; identical
    // null-on-no-jobs contract so the anomaly bucket still fires. Shared
    // with the sync mailbox invoker (sync ≡ backstop).
    source_document_id = await resolvePrimaryIngestSource(row.id);

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
    if (await caseHasRelationshipCandidates(row.id)) {
      if (dry_run) {
        return { ...base(), bucket: 'B2', outcome: 'bucketed_dry_run' };
      }
      return await recoverCandidateBearing(row, ctx, base);
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

    // ----- B3 — full re-run (capped: this IS the OCR/Claude spend) -----
    if (dry_run) {
      return { ...base(), bucket: 'B3', outcome: 'bucketed_dry_run' };
    }
    if (b3Budget.max !== undefined && b3Budget.used >= b3Budget.max) {
      // Per-run B3 cap reached: skip the re-run (no spend) and leave the
      // case re-eligible for the next run, so a large backlog drains in
      // bounded increments. The read-only B3-D dedup pre-check above already
      // ran (no spend), so genuine content-dups are still carved out rather
      // than capped.
      return { ...base(), bucket: 'B3', outcome: 'b3_cap_skipped' };
    }
    b3Budget.used += 1;
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
      const freshState = await getDocumentCaseState(row.id);
      if (freshState === 'needs_review') {
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
