// scripts/oi3-m1-validation.ts
// OI-3 Part 5 — M1 post-fix paid-API validation harness.
//
// Drives handleUserMessage against the real Anthropic API across
// 9 EC-2 shapes × 3 runs = 27 invocations. Halts on cumulative
// cost > $0.75 OR per-call cost > $0.15. Writes incremental
// run-record JSON for halt-resilience.
//
// See docs/09_briefs/phase-1.2/session-20-brief.md for the full
// spec. Convention #11 row-card pairing assertion runs per
// invocation.
//
// Cost-tracking mechanism: SDK-wrapper via __setClientForTests
// (already-exported test-only API at callClaude.ts:79-81). The
// wrapper forwards messages.create() to the real Anthropic
// client and captures usage from the response. This replaces
// the originally-planned stdout-write interception (Option
// iii.b), which failed against the project's pino logger
// because pino's default destination uses SonicBoom direct
// fd-1 writes that bypass process.stdout.write monkey-patching.
// Convention #10 EC-direction surface caught at execution;
// no src/ touches required.
//
// Invocation:
//   pnpm tsx --env-file=.env.local scripts/oi3-m1-validation.ts \
//     --output-json=$HOME/chounting-logs/oi3-m1-run-$(date -u +%Y%m%dT%H%M%SZ).json \
//     [--first-shape-only]                  # dry-run, shape 12 run 1 only
//     [--resume-from=<dry-run-JSON>]        # paid run, resumes from dry-run
//     [--shapes=13,15,20]                   # iterate only named shapes (D3 scope)
//
// Token cost rates: claude-sonnet-4-6 (per orchestrator/index.ts:78);
// rates retained from Sonnet 4 / 4.5 pricing.

import { handleUserMessage } from '@/agent/orchestrator';
import { __setClientForTests } from '@/agent/orchestrator/callClaude';
import { adminClient } from '@/db/adminClient';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

// ===== Constants =====

const ORG_REAL_ESTATE = '22222222-2222-2222-2222-222222222222';
const USER_CONTROLLER = '00000000-0000-0000-0000-000000000002';
const ANCHOR_COMMIT = '8b1e92cb6b08c685dfddf9894e56c00de0aa8e34';

const SPEND_CEILING_USD = 0.75;
const PER_CALL_CEILING_USD = 0.15;
const NEAR_CEILING_FACTOR = 0.9;

// claude-sonnet-4-6 rates (Sonnet 4 / 4.5 / 4.6 retained pricing).
// Per orchestrator/index.ts:78. USD per 1M tokens.
const RATES_USD_PER_MTOK = {
  input: 3,
  output: 15,
  cache_creation: 3.75, // 1.25× base
  cache_read: 0.3, // 0.1× base
};

// Sequential shape-major iteration per Hard Constraint 10:
// shape 12 run 1 → 2 → 3 → shape 13 run 1 → ... All 9 shapes,
// 3 runs each = 27 invocations. Prompts verbatim from
// docs/07_governance/ec-2-prompt-set.md lines 309-422.
const SHAPES: Array<{
  shape_num: number;
  shape_label: string;
  prompt: string;
}> = [
  {
    shape_num: 12,
    shape_label: 'C7-attempted, simple double-entry',
    prompt:
      'Paid the April AWS bill — $612.80 auto-debited from checking this morning.',
  },
  {
    shape_num: 13,
    shape_label: 'C7-attempted, multi-line split with discount',
    prompt:
      'Invoiced King West Studios $8,000 for the March project; they got a 5% early-payment discount offered in the contract, so if paid by April 30 they owe $7,600.',
  },
  {
    shape_num: 14,
    shape_label: 'C7-attempted, gate A short-circuit / relative-date',
    prompt:
      "Refunded $450 to Eglinton Retail — they overpaid last month's invoice. Sent a cheque today.",
  },
  {
    shape_num: 15,
    shape_label: 'C7-attempted, contra-asset adjusting Allowance',
    prompt:
      'Month-end: bump the allowance for doubtful accounts by $1,200 based on our aging review.',
  },
  {
    shape_num: 16,
    shape_label: 'C7-untried, multi-leg asset/financing',
    prompt:
      'Bought a new server rack — $14,500 total. Put $3,500 down on the corporate card and financed the remaining $11,000 with a 36-month equipment loan from RBC at 6.5%.',
  },
  {
    shape_num: 17,
    shape_label: 'C7-untried, cross-reference dependency',
    prompt:
      "Recognize April's portion of the annual insurance prepaid we booked earlier this session.",
  },
  {
    shape_num: 18,
    shape_label: 'C7-untried, intra-asset transfer',
    prompt:
      'Transferred $15,000 from checking to the high-interest savings account today.',
  },
  {
    shape_num: 19,
    shape_label: 'C7-untried, contra-intangible adjusting',
    prompt:
      "Post this month's amortization on the software license we bought in January — $12,000 license, 24-month useful life.",
  },
  {
    shape_num: 20,
    shape_label:
      'Negative-control: ambiguous + cross-entry hallucination bait, EC-11 failure-mode probe',
    prompt: 'Book the quarterly accrual.',
  },
];

// ===== Argument parsing =====

interface Args {
  outputJson: string;
  firstShapeOnly: boolean;
  resumeFrom: string | null;
  shapesFilter: number[] | null;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let outputJson: string | null = null;
  let firstShapeOnly = false;
  let resumeFrom: string | null = null;
  let shapesFilter: number[] | null = null;
  for (const a of args) {
    if (a === '--first-shape-only') firstShapeOnly = true;
    else if (a.startsWith('--output-json=')) outputJson = a.slice('--output-json='.length);
    else if (a.startsWith('--resume-from=')) resumeFrom = a.slice('--resume-from='.length);
    else if (a.startsWith('--shapes=')) {
      shapesFilter = a
        .slice('--shapes='.length)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n));
      if (shapesFilter.length === 0) throw new Error('--shapes= cannot be empty');
    } else if (a.startsWith('--session-start=')) {
      // informational; ignored
    } else throw new Error(`Unknown arg: ${a}`);
  }
  if (!outputJson) throw new Error('--output-json=<path> is required');
  return { outputJson, firstShapeOnly, resumeFrom, shapesFilter };
}

// ===== SDK-wrapper for usage capture (Option A2) =====
//
// Constraint 10 (sequential shape-major iteration) is the
// precondition that protects this single-slot accumulator
// against concurrent-invocation corruption. A parallel
// handleUserMessage call would race __activeAccumulator's
// read/write; the harness never fires concurrent invocations.
//
// The wrapper is installed once at main()'s top via
// __setClientForTests; all callClaude paths route through it
// for the duration of the run. Per callClaude.ts:95-115,
// __setMockFixtureQueue takes precedence over the injected
// client — but this harness is real-API-only, so the fixture
// queue stays null and the wrapper always fires.

interface UsageAccumulator {
  trace_id: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  num_callclaude_calls: number;
}

let __activeAccumulator: UsageAccumulator | null = null;

function makeCapturingClient(): Anthropic {
  const real = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const realCreate = real.messages.create.bind(real.messages);
  // Override messages.create — forwards to real, captures usage from response.
  // The wrapper preserves all production-path retry/classification semantics
  // because callClaude calls realCreate via the same code path (just through
  // our wrapper).
  (real.messages as { create: typeof realCreate }).create = (async (
    ...args: Parameters<typeof realCreate>
  ) => {
    const resp = await realCreate(...args);
    if (__activeAccumulator) {
      const u = (resp as { usage?: Record<string, number | null> }).usage ?? {};
      __activeAccumulator.input_tokens += u.input_tokens ?? 0;
      __activeAccumulator.output_tokens += u.output_tokens ?? 0;
      __activeAccumulator.cache_creation_tokens += u.cache_creation_input_tokens ?? 0;
      __activeAccumulator.cache_read_tokens += u.cache_read_input_tokens ?? 0;
      __activeAccumulator.num_callclaude_calls += 1;
    }
    return resp;
  }) as typeof realCreate;
  return real;
}

// ===== Cost computation =====

function computeUsdCost(acc: UsageAccumulator): number {
  return (
    (acc.input_tokens * RATES_USD_PER_MTOK.input +
      acc.output_tokens * RATES_USD_PER_MTOK.output +
      acc.cache_creation_tokens * RATES_USD_PER_MTOK.cache_creation +
      acc.cache_read_tokens * RATES_USD_PER_MTOK.cache_read) /
    1_000_000
  );
}

// ===== Pre-flight DB lookups =====

async function preflightLookups(): Promise<{
  fiscalPeriodId: string;
  accountByCode: Record<string, string>;
}> {
  const db = adminClient();
  const { data: accounts, error: accErr } = await db
    .from('chart_of_accounts')
    .select('account_id, account_code')
    .eq('org_id', ORG_REAL_ESTATE)
    .in('account_code', [
      '1000',
      '1250',
      '1600',
      '1610',
      '1700',
      '1810',
      '2010',
      '2500',
      '4300',
      '5710',
      '5760',
      '5780',
      '5790',
    ]);
  if (accErr) throw new Error(`CoA lookup failed: ${JSON.stringify(accErr)}`);
  const accountByCode: Record<string, string> = {};
  for (const a of accounts ?? []) accountByCode[a.account_code] = a.account_id;

  const { data: fp, error: fpErr } = await db
    .from('fiscal_periods')
    .select('period_id')
    .eq('org_id', ORG_REAL_ESTATE)
    .eq('name', 'FY Current')
    .eq('is_locked', false)
    .maybeSingle();
  if (fpErr) throw new Error(`Fiscal period lookup failed: ${JSON.stringify(fpErr)}`);
  if (!fp) throw new Error('Fiscal period FY Current not found for ORG_REAL_ESTATE');
  return { fiscalPeriodId: fp.period_id as string, accountByCode };
}

async function ensureSessionRow(sessionId: string): Promise<void> {
  const db = adminClient();
  const { error } = await db.from('agent_sessions').upsert(
    {
      session_id: sessionId,
      user_id: USER_CONTROLLER,
      org_id: ORG_REAL_ESTATE,
      locale: 'en',
      state: {},
      conversation: [],
      turns: [],
    },
    { onConflict: 'session_id' },
  );
  if (error) throw new Error(`Session row upsert failed: ${JSON.stringify(error)}`);
}

// ===== Run-record types + I/O =====

interface RunRecordRun {
  run_num: number;
  trace_id: string;
  started_at: string;
  status: 'in_flight' | 'complete' | 'errored';
  completed_at?: string;
  duration_ms?: number;
  response?: Record<string, unknown>;
  ai_actions_row?: Record<string, unknown>;
  usage?: Record<string, number>;
  classification?: string;
  error_message?: string;
}

interface RunRecordShape {
  shape_num: number;
  shape_label: string;
  session_id: string;
  prompt: string;
  runs: RunRecordRun[];
  shape_classification?: string;
}

interface RunRecord {
  session_label: string;
  run_mode: 'dry-run-first-shape-only' | 'paid-run-resume' | 'log-shape-verify';
  started_at: string;
  halted_at: string | null;
  halted_reason: string | null;
  cumulative_cost_usd: number;
  ceiling_usd: number;
  per_call_ceiling_usd: number;
  anchor_commit: string;
  harness_commit: string | null;
  resumed_from_dry_run: string | null;
  shapes: RunRecordShape[];
  overall_classification?: string;
}

function writeRunRecord(record: RunRecord, outputJson: string): void {
  fs.writeFileSync(outputJson, JSON.stringify(record, null, 2) + '\n');
}

// ===== Classification =====

function classifyRun(
  response: { response?: { template_id?: string }; canvas_directive?: { type?: string; card?: { tentative?: boolean } } } | null,
  aiActionsRow: { ai_action_id: string } | null,
): string {
  if (!response) return 'threw_or_errored';
  const tid = response.response?.template_id;
  const directive = response.canvas_directive;
  const cardPresent = directive?.type === 'proposed_entry_card' && directive?.card != null;
  const tentative = directive?.card?.tentative === true;

  if (tid === 'agent.entry.proposed' && cardPresent && !tentative) return 'emitted_card_no_tentative';
  if (tid === 'agent.entry.proposed' && cardPresent && tentative) return 'emitted_card_tentative';
  if (tid === 'agent.response.natural' && !directive && !aiActionsRow) return 'emitted_natural_no_card';
  if (tid === 'agent.response.natural' && !directive && aiActionsRow) return 'emitted_natural_with_orphan_row';
  if (tid?.startsWith('agent.clarify.')) return 'emitted_clarify_template';
  return 'unclassified';
}

// ===== Single invocation (skeleton-before-invocation; finalize after) =====

async function runOneInvocation(
  shape: (typeof SHAPES)[number],
  runNum: number,
  sessionId: string,
  recordRun: RunRecordRun,
  flush: () => void,
): Promise<{ usdCost: number }> {
  const traceId = randomUUID();
  recordRun.trace_id = traceId;
  flush();

  __activeAccumulator = {
    trace_id: traceId,
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_tokens: 0,
    cache_read_tokens: 0,
    num_callclaude_calls: 0,
  };

  const ctx = {
    trace_id: traceId,
    caller: {
      user_id: USER_CONTROLLER,
      email: 'controller@thebridge.local',
      verified: true as const,
      org_ids: [ORG_REAL_ESTATE],
    },
    locale: 'en' as const,
  };

  const startNs = Date.now();
  let response: Awaited<ReturnType<typeof handleUserMessage>> | null = null;
  let errorMessage: string | undefined;

  try {
    response = await handleUserMessage(
      {
        user_id: USER_CONTROLLER,
        org_id: ORG_REAL_ESTATE,
        locale: 'en',
        tz: 'UTC',
        message: shape.prompt,
        session_id: sessionId,
      },
      ctx,
    );
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  const durationMs = Date.now() - startNs;
  recordRun.completed_at = new Date().toISOString();
  recordRun.duration_ms = durationMs;

  const acc = __activeAccumulator;
  __activeAccumulator = null;
  const usdCost = acc ? computeUsdCost(acc) : 0;
  recordRun.usage = acc
    ? {
        base_input_tokens: acc.input_tokens,
        output_tokens: acc.output_tokens,
        cache_creation_tokens: acc.cache_creation_tokens,
        cache_read_tokens: acc.cache_read_tokens,
        num_callclaude_calls: acc.num_callclaude_calls,
        total_usd: usdCost,
      }
    : { base_input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0, num_callclaude_calls: 0, total_usd: 0 };

  // ai_actions row lookup by trace_id
  const db = adminClient();
  const { data: row } = await db
    .from('ai_actions')
    .select('ai_action_id, status, idempotency_key, trace_id')
    .eq('session_id', sessionId)
    .eq('trace_id', traceId)
    .maybeSingle();

  if (errorMessage) {
    recordRun.classification = 'threw_or_errored';
    recordRun.status = 'errored';
    recordRun.error_message = errorMessage;
  } else {
    const r = response as { response?: { template_id?: string; params?: unknown }; canvas_directive?: { type?: string; card?: { tentative?: boolean; lines?: Array<{ account_code?: string }>; idempotency_key?: string } } };
    recordRun.response = {
      template_id: r.response?.template_id,
      params: r.response?.params,
      canvas_directive: r.canvas_directive
        ? {
            type: r.canvas_directive.type,
            card_present: r.canvas_directive.card != null,
            card_tentative: r.canvas_directive.card?.tentative === true,
            card_lines_count: r.canvas_directive.card?.lines?.length ?? 0,
            card_account_codes:
              r.canvas_directive.card?.lines?.map((l) => l.account_code).filter((c): c is string => c != null) ?? [],
          }
        : null,
    };
    recordRun.ai_actions_row = row
      ? {
          present: true,
          status: row.status,
          idempotency_key_matches_card:
            row.idempotency_key === r.canvas_directive?.card?.idempotency_key,
        }
      : { present: false };
    recordRun.classification = classifyRun(r as { response?: { template_id?: string }; canvas_directive?: { type?: string; card?: { tentative?: boolean } } }, row);
    recordRun.status = 'complete';
  }

  flush();
  return { usdCost };
}

// ===== Main driver =====

async function main(): Promise<void> {
  const args = parseArgs();

  // Initialize run-record (or seed from --resume-from)
  let runRecord: RunRecord;
  let cumulativeCost = 0;
  const sessionIdsByShape: Record<number, string> = {};

  if (args.resumeFrom) {
    const resumed = JSON.parse(fs.readFileSync(args.resumeFrom, 'utf8')) as RunRecord;
    cumulativeCost = resumed.cumulative_cost_usd;
    runRecord = {
      ...resumed,
      run_mode: 'paid-run-resume',
      resumed_from_dry_run: args.resumeFrom,
    };
    // Reuse session_ids minted in the resumed record so paid-run iterations
    // attach to the same agent_sessions row per shape (Constraint 7).
    // Resumed shapes with 3 complete runs stay as confirmatory evidence and
    // are skipped at iteration time. Resumed shapes with <3 runs continue
    // from runStart = completeRuns + 1.
    for (const shapeRec of runRecord.shapes) {
      sessionIdsByShape[shapeRec.shape_num] = shapeRec.session_id;
    }
  } else {
    runRecord = {
      session_label: 'S20-oi-3-m1-paid-validation',
      run_mode: args.firstShapeOnly ? 'dry-run-first-shape-only' : 'paid-run-resume',
      started_at: new Date().toISOString(),
      halted_at: null,
      halted_reason: null,
      cumulative_cost_usd: 0,
      ceiling_usd: SPEND_CEILING_USD,
      per_call_ceiling_usd: PER_CALL_CEILING_USD,
      anchor_commit: ANCHOR_COMMIT,
      harness_commit: null,
      resumed_from_dry_run: null,
      shapes: [],
    };
  }

  const flush = () => {
    runRecord.cumulative_cost_usd = cumulativeCost;
    writeRunRecord(runRecord, args.outputJson);
  };

  // Pre-flight DB lookups (fail fast if missing)
  await preflightLookups();

  // Mint per-shape session_ids for any shape not yet in the record.
  for (const shape of SHAPES) {
    if (sessionIdsByShape[shape.shape_num] === undefined) {
      sessionIdsByShape[shape.shape_num] = randomUUID();
    }
  }

  // Install SDK-wrapper ONCE for the entire driver loop. Reset in finally
  // to guarantee restoration even on throw — important for any subsequent
  // dev-server runs in the same shell that should not see our wrapper.
  __setClientForTests(makeCapturingClient());
  try {
    flush();

    // Build the iteration list per --first-shape-only / --shapes filters.
    // --first-shape-only takes precedence (dry-run mode); --shapes filters
    // by shape_num for D3-style scope reduction. With both unset, iterate
    // all 9 shapes in scoping-doc-natural sequence.
    const shapesToProcess = args.firstShapeOnly
      ? [SHAPES[0]]
      : args.shapesFilter
        ? args.shapesFilter
            .map((n) => SHAPES.find((s) => s.shape_num === n))
            .filter((s): s is (typeof SHAPES)[number] => s !== undefined)
        : SHAPES;

    for (let shapeIdx = 0; shapeIdx < shapesToProcess.length; shapeIdx++) {
      const shape = shapesToProcess[shapeIdx];
      const sessionId = sessionIdsByShape[shape.shape_num];

      // Ensure shape entry in run-record (idempotent on resume).
      let shapeRec = runRecord.shapes.find((s) => s.shape_num === shape.shape_num);
      if (!shapeRec) {
        shapeRec = {
          shape_num: shape.shape_num,
          shape_label: shape.shape_label,
          session_id: sessionId,
          prompt: shape.prompt,
          runs: [],
        };
        runRecord.shapes.push(shapeRec);
      }

      // If this shape already has 3 complete runs from a prior invocation
      // (e.g., resumed run already finished it), skip — preserved as
      // confirmatory evidence in run-record without re-iterating.
      const completeRuns = shapeRec.runs.filter((r) => r.status === 'complete').length;
      if (completeRuns >= 3) continue;

      await ensureSessionRow(sessionId);

      const runsUpperBound = args.firstShapeOnly && shapeIdx === 0 ? 1 : 3;
      const runStart = completeRuns + 1;

      for (let runNum = runStart; runNum <= runsUpperBound; runNum++) {
        // Halt-near-ceiling check BEFORE next invocation.
        if (cumulativeCost > SPEND_CEILING_USD * NEAR_CEILING_FACTOR) {
          runRecord.halted_at = new Date().toISOString();
          runRecord.halted_reason = `halted_near_ceiling: cumulativeCost=$${cumulativeCost.toFixed(4)} > 0.90 × $${SPEND_CEILING_USD}`;
          flush();
          throw new Error(runRecord.halted_reason);
        }

        // Skeleton entry (status: in_flight) BEFORE invocation.
        const recordRun: RunRecordRun = {
          run_num: runNum,
          trace_id: '<pending>',
          started_at: new Date().toISOString(),
          status: 'in_flight',
        };
        shapeRec.runs.push(recordRun);
        flush();

        const { usdCost } = await runOneInvocation(shape, runNum, sessionId, recordRun, flush);
        cumulativeCost += usdCost;
        runRecord.cumulative_cost_usd = cumulativeCost;
        flush();

        // Per-call ceiling check AFTER invocation.
        if (usdCost > PER_CALL_CEILING_USD) {
          runRecord.halted_at = new Date().toISOString();
          runRecord.halted_reason = `halted_per_call_ceiling: shape=${shape.shape_num} run=${runNum} usdCost=$${usdCost.toFixed(4)} > $${PER_CALL_CEILING_USD}`;
          flush();
          throw new Error(runRecord.halted_reason);
        }
      }

      // Per-shape classification after all runs of this shape.
      shapeRec.shape_classification = computeShapeClassification(shapeRec);
      flush();
    }

    runRecord.overall_classification = computeOverallClassification(runRecord);
    flush();

    console.error(JSON.stringify({
      mode: runRecord.run_mode,
      shapes_processed: runRecord.shapes.length,
      cumulative_cost_usd: cumulativeCost,
      cumulative_cost_remaining: SPEND_CEILING_USD - cumulativeCost,
      overall_classification: runRecord.overall_classification,
      output_json: args.outputJson,
    }, null, 2));
  } finally {
    __setClientForTests(null);
  }
}

// ===== Per-shape and overall classification helpers =====

function computeShapeClassification(shapeRec: RunRecordShape): string {
  const cls = shapeRec.runs.map((r) => r.classification ?? 'unknown');
  // Shape 15: tentative is the productive shape (3/3 emitted_card_tentative = H3b-alone).
  if (shapeRec.shape_num === 15) {
    if (cls.every((c) => c === 'emitted_card_tentative')) return 'H3b-alone';
    if (cls.some((c) => c === 'emitted_natural_with_orphan_row')) return 'H3-also-live';
    return 'inconclusive';
  }
  // Shape 20: negative-control. natural-no-card or clarify is the productive outcome.
  if (shapeRec.shape_num === 20) {
    if (cls.every((c) => c === 'emitted_natural_no_card' || c === 'emitted_clarify_template'))
      return 'H3b-alone';
    if (cls.some((c) => c === 'emitted_card_no_tentative' || c === 'emitted_card_tentative'))
      return 'over-correction';
    return 'inconclusive';
  }
  // All other shapes (12, 13, 14, 16, 17, 18, 19): emitted_card_no_tentative is the productive outcome.
  if (cls.every((c) => c === 'emitted_card_no_tentative')) return 'H3b-alone';
  if (cls.some((c) => c === 'emitted_natural_with_orphan_row')) return 'H3-also-live';
  return 'inconclusive';
}

function computeOverallClassification(record: RunRecord): string {
  const byClass: Record<string, number[]> = {};
  for (const shapeRec of record.shapes) {
    const c = shapeRec.shape_classification ?? 'inconclusive';
    if (!byClass[c]) byClass[c] = [];
    byClass[c].push(shapeRec.shape_num);
  }
  const parts: string[] = [];
  for (const [c, shapes] of Object.entries(byClass)) {
    parts.push(`${c} on shapes ${shapes.sort((a, b) => a - b).join('/')}`);
  }
  return parts.join('; ');
}

main().catch((e) => {
  console.error('UNCAUGHT', e instanceof Error ? e.message : e);
  process.exit(1);
});
