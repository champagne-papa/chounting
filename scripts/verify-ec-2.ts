// scripts/verify-ec-2.ts
// Phase 1.2 Session 8 C6 — EC-2 paid-API verification harness.
//
// Reads the ledger state and a pino log file produced by a C6 run,
// joins per journal entry, computes per-entry cost, writes a CSV,
// and prints a rollup. Exit 0 iff all three pass criteria are green:
//   (a) exactly 20 source='agent' entries within the session window
//   (b) each entry has a matching ai_actions row with status='confirmed'
//   (c) every entry balances (debit_total = credit_total)
// Pass criterion (d) — cost-per-entry aggregates — is reported via the
// CSV and the rollup stdout; it is informational, not a gate.
//
// Cost math uses four rails (base input / output / cache creation / cache
// read) per Sonnet 4.6 pricing. At the time this script was written
// (Session 8 C6), the orchestrator does not set cache_control on
// callClaude invocations, so cache_creation_input_tokens and
// cache_read_input_tokens are expected to be 0 for all entries. The
// four-rail formula is maintained for forward-compatibility with Phase
// 1.3 caching enablement — when caching turns on, the math remains
// correct without revision.
//
// Aggregation across tool-loop iterations: for a given journal entry,
// all callClaude log lines sharing the entry's trace_id are summed into
// a single per-entry usage record (ratified Q-C6-f(a)). The CSV column
// num_callclaude_calls surfaces tool-loop amplification as a diagnostic
// signal.

import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
import Decimal from 'decimal.js';

// Sonnet 4.6 pricing (USD per million tokens).
const PRICE_BASE_INPUT_PER_MTOK = 3.0;
const PRICE_OUTPUT_PER_MTOK = 15.0;
const PRICE_CACHE_CREATION_PER_MTOK = 3.75; // 1.25× base, 5-min TTL
const PRICE_CACHE_READ_PER_MTOK = 0.3; // 0.10× base

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface Args {
  sessionStart: string;
  logFile: string;
  outputCsv: string;
  orgId?: string;
}

interface EntryRow {
  journal_entry_id: string;
  entry_date: string;
  description: string;
  idempotency_key: string | null;
  org_id: string;
  created_at: string;
}

interface LineRow {
  journal_entry_id: string;
  debit_amount: string;
  credit_amount: string;
}

interface AiActionRow {
  org_id: string;
  idempotency_key: string;
  status: string;
  confirmed_at: string | null;
  trace_id: string;
  tool_name: string;
}

interface UsageAggregate {
  base_input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  num_callclaude_calls: number;
}

interface CsvRow {
  entry_num: number;
  created_at: string;
  entry_date: string;
  description: string;
  idempotency_key: string;
  ai_action_status: string;
  confirmed_at: string;
  trace_id: string;
  tool_name: string;
  debit_total: string;
  credit_total: string;
  balanced: boolean;
  num_callclaude_calls: number;
  base_input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  total_usd: string;
}

function parseArgs(): Args {
  const parsed: Partial<Args> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([a-z0-9-]+)=(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    switch (key) {
      case 'session-start':
        parsed.sessionStart = value;
        break;
      case 'log-file':
        parsed.logFile = value;
        break;
      case 'output-csv':
        parsed.outputCsv = value;
        break;
      case 'org-id':
        parsed.orgId = value;
        break;
    }
  }
  if (!parsed.sessionStart && process.env.EC2_SESSION_START) {
    parsed.sessionStart = process.env.EC2_SESSION_START;
  }
  if (!parsed.sessionStart || !parsed.logFile || !parsed.outputCsv) {
    console.error(
      'FATAL: required args: --session-start=<ISO-8601> ' +
        '(or EC2_SESSION_START env), --log-file=<path>, --output-csv=<path>',
    );
    console.error('optional: --org-id=<uuid>');
    process.exit(1);
  }
  const parsedDate = new Date(parsed.sessionStart);
  if (Number.isNaN(parsedDate.getTime())) {
    console.error(
      `FATAL: --session-start is not valid ISO-8601: ${parsed.sessionStart}`,
    );
    process.exit(1);
  }
  return parsed as Args;
}

async function fetchEntries(
  sessionStart: string,
  orgId: string | undefined,
): Promise<EntryRow[]> {
  let query = admin
    .from('journal_entries')
    .select(
      'journal_entry_id, entry_date, description, idempotency_key, org_id, created_at',
    )
    .eq('source', 'agent')
    .gte('created_at', sessionStart)
    .order('created_at', { ascending: true });
  if (orgId) {
    query = query.eq('org_id', orgId);
  }
  const { data, error } = await query;
  if (error) {
    console.error(`FATAL: journal_entries query failed: ${error.message}`);
    process.exit(1);
  }
  return (data ?? []) as EntryRow[];
}

async function fetchLines(entryIds: string[]): Promise<LineRow[]> {
  if (entryIds.length === 0) return [];
  const { data, error } = await admin
    .from('journal_lines')
    .select('journal_entry_id, debit_amount, credit_amount')
    .in('journal_entry_id', entryIds);
  if (error) {
    console.error(`FATAL: journal_lines query failed: ${error.message}`);
    process.exit(1);
  }
  return (data ?? []) as LineRow[];
}

async function fetchAiActions(idempKeys: string[]): Promise<AiActionRow[]> {
  if (idempKeys.length === 0) return [];
  const { data, error } = await admin
    .from('ai_actions')
    .select('org_id, idempotency_key, status, confirmed_at, trace_id, tool_name')
    .in('idempotency_key', idempKeys);
  if (error) {
    console.error(`FATAL: ai_actions query failed: ${error.message}`);
    process.exit(1);
  }
  return (data ?? []) as AiActionRow[];
}

// Read the pino log file line-by-line, filter for the callClaude completion
// line, and aggregate usage per trace_id. Non-JSON lines (e.g., Next.js dev
// server stdout) are skipped silently.
async function readUsageLogs(
  path: string,
): Promise<Map<string, UsageAggregate>> {
  const content = await readFile(path, 'utf8');
  const out = new Map<string, UsageAggregate>();
  for (const raw of content.split('\n')) {
    if (!raw.trim()) continue;
    let obj: unknown;
    try {
      obj = JSON.parse(raw);
    } catch {
      continue;
    }
    if (
      typeof obj !== 'object' ||
      obj === null ||
      (obj as Record<string, unknown>).msg !== 'callClaude: API call complete'
    ) {
      continue;
    }
    const rec = obj as Record<string, unknown>;
    const traceId = rec.trace_id;
    const usage = rec.usage as Record<string, unknown> | undefined;
    if (typeof traceId !== 'string' || !usage) continue;
    const existing = out.get(traceId) ?? {
      base_input_tokens: 0,
      output_tokens: 0,
      cache_creation_tokens: 0,
      cache_read_tokens: 0,
      num_callclaude_calls: 0,
    };
    existing.base_input_tokens += Number(usage.input_tokens ?? 0);
    existing.output_tokens += Number(usage.output_tokens ?? 0);
    existing.cache_creation_tokens += Number(
      usage.cache_creation_input_tokens ?? 0,
    );
    existing.cache_read_tokens += Number(usage.cache_read_input_tokens ?? 0);
    existing.num_callclaude_calls += 1;
    out.set(traceId, existing);
  }
  return out;
}

function computeUsd(a: UsageAggregate): number {
  return (
    (a.base_input_tokens * PRICE_BASE_INPUT_PER_MTOK) / 1_000_000 +
    (a.output_tokens * PRICE_OUTPUT_PER_MTOK) / 1_000_000 +
    (a.cache_creation_tokens * PRICE_CACHE_CREATION_PER_MTOK) / 1_000_000 +
    (a.cache_read_tokens * PRICE_CACHE_READ_PER_MTOK) / 1_000_000
  );
}

function buildCsvRows(
  entries: EntryRow[],
  lines: LineRow[],
  aiActions: AiActionRow[],
  usages: Map<string, UsageAggregate>,
): CsvRow[] {
  const lineTotals = new Map<
    string,
    { debit: Decimal; credit: Decimal }
  >();
  for (const l of lines) {
    const cur = lineTotals.get(l.journal_entry_id) ?? {
      debit: new Decimal(0),
      credit: new Decimal(0),
    };
    cur.debit = cur.debit.plus(l.debit_amount);
    cur.credit = cur.credit.plus(l.credit_amount);
    lineTotals.set(l.journal_entry_id, cur);
  }

  const aaByKey = new Map<string, AiActionRow>();
  for (const aa of aiActions) {
    aaByKey.set(`${aa.org_id}|${aa.idempotency_key}`, aa);
  }

  return entries.map((e, idx): CsvRow => {
    const totals = lineTotals.get(e.journal_entry_id) ?? {
      debit: new Decimal(0),
      credit: new Decimal(0),
    };
    const balanced = totals.debit.eq(totals.credit);
    const aa = e.idempotency_key
      ? aaByKey.get(`${e.org_id}|${e.idempotency_key}`)
      : undefined;
    const usage = aa?.trace_id ? usages.get(aa.trace_id) : undefined;
    const agg: UsageAggregate = usage ?? {
      base_input_tokens: 0,
      output_tokens: 0,
      cache_creation_tokens: 0,
      cache_read_tokens: 0,
      num_callclaude_calls: 0,
    };
    return {
      entry_num: idx + 1,
      created_at: e.created_at,
      entry_date: e.entry_date,
      description: e.description,
      idempotency_key: e.idempotency_key ?? '',
      ai_action_status: aa?.status ?? 'MISSING',
      confirmed_at: aa?.confirmed_at ?? '',
      trace_id: aa?.trace_id ?? '',
      tool_name: aa?.tool_name ?? '',
      debit_total: totals.debit.toFixed(2),
      credit_total: totals.credit.toFixed(2),
      balanced,
      num_callclaude_calls: agg.num_callclaude_calls,
      base_input_tokens: agg.base_input_tokens,
      output_tokens: agg.output_tokens,
      cache_creation_tokens: agg.cache_creation_tokens,
      cache_read_tokens: agg.cache_read_tokens,
      total_usd: computeUsd(agg).toFixed(6),
    };
  });
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function serializeCsv(rows: CsvRow[]): string {
  const header: (keyof CsvRow)[] = [
    'entry_num',
    'created_at',
    'entry_date',
    'description',
    'idempotency_key',
    'ai_action_status',
    'confirmed_at',
    'trace_id',
    'tool_name',
    'debit_total',
    'credit_total',
    'balanced',
    'num_callclaude_calls',
    'base_input_tokens',
    'output_tokens',
    'cache_creation_tokens',
    'cache_read_tokens',
    'total_usd',
  ];
  const out = [header.join(',')];
  for (const row of rows) {
    out.push(header.map((col) => csvEscape(String(row[col]))).join(','));
  }
  return out.join('\n') + '\n';
}

interface RollupResult {
  countOk: boolean;
  allConfirmed: boolean;
  allBalanced: boolean;
}

function printRollup(rows: CsvRow[]): RollupResult {
  console.log('=== EC-2 verification rollup ===');
  console.log(`Total entries: ${rows.length} (expected 20)`);
  const countOk = rows.length === 20;
  const allConfirmed =
    rows.length > 0 && rows.every((r) => r.ai_action_status === 'confirmed');
  const allBalanced = rows.length > 0 && rows.every((r) => r.balanced);
  console.log(`(a) entry count == 20:      ${countOk ? 'PASS' : 'FAIL'}`);
  console.log(
    `(b) all status='confirmed': ${allConfirmed ? 'PASS' : 'FAIL'}`,
  );
  console.log(`(c) all balanced:           ${allBalanced ? 'PASS' : 'FAIL'}`);
  if (rows.length === 0) {
    return { countOk, allConfirmed, allBalanced };
  }
  const sumField = (f: keyof CsvRow): number =>
    rows.reduce((s, r) => s + Number(r[f]), 0);
  const baseSum = sumField('base_input_tokens');
  const outSum = sumField('output_tokens');
  const ccSum = sumField('cache_creation_tokens');
  const crSum = sumField('cache_read_tokens');
  const usdList = rows.map((r) => Number(r.total_usd));
  const usdSum = usdList.reduce((s, v) => s + v, 0);
  const usdMean = usdSum / rows.length;
  const usdMin = Math.min(...usdList);
  const usdMax = Math.max(...usdList);
  const mostExpensive = rows.reduce((max, r) =>
    Number(r.total_usd) > Number(max.total_usd) ? r : max,
  );
  console.log('---');
  console.log(`Aggregate base_input_tokens:      ${baseSum}`);
  console.log(`Aggregate output_tokens:          ${outSum}`);
  console.log(`Aggregate cache_creation_tokens:  ${ccSum}`);
  console.log(`Aggregate cache_read_tokens:      ${crSum}`);
  console.log(`Aggregate total_usd:              $${usdSum.toFixed(6)}`);
  console.log(`Mean total_usd per entry:         $${usdMean.toFixed(6)}`);
  console.log(
    `Min / Max total_usd:              $${usdMin.toFixed(6)} / $${usdMax.toFixed(6)}`,
  );
  console.log(
    `Most expensive entry: #${mostExpensive.entry_num} ` +
      `(trace_id=${mostExpensive.trace_id}, $${Number(mostExpensive.total_usd).toFixed(6)})`,
  );
  return { countOk, allConfirmed, allBalanced };
}

async function main(): Promise<void> {
  const args = parseArgs();
  console.log(`session_start=${args.sessionStart}`);
  console.log(`log_file=${args.logFile}`);
  console.log(`output_csv=${args.outputCsv}`);
  if (args.orgId) console.log(`org_id=${args.orgId}`);

  const entries = await fetchEntries(args.sessionStart, args.orgId);
  const entryIds = entries.map((e) => e.journal_entry_id);
  const idempKeys = entries
    .map((e) => e.idempotency_key)
    .filter((k): k is string => k !== null);

  const [lines, aiActions, usages] = await Promise.all([
    fetchLines(entryIds),
    fetchAiActions(idempKeys),
    readUsageLogs(args.logFile),
  ]);

  const rows = buildCsvRows(entries, lines, aiActions, usages);
  await writeFile(args.outputCsv, serializeCsv(rows), 'utf8');
  console.log(`CSV written: ${args.outputCsv}`);

  const { countOk, allConfirmed, allBalanced } = printRollup(rows);
  const pass = countOk && allConfirmed && allBalanced;
  if (!pass) {
    console.error('FAIL: not all pass criteria green');
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
