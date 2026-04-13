// src/services/accounting/journalEntryService.ts
// Law 2: All journal entries are created by journalEntryService.post() only.
// No other function in the codebase may insert into journal_entries or
// journal_lines. See PLAN.md Invariant 2.
//
// Phase 1.1 supports manual entries and reversals only.
// Agent source (dry_run, idempotency) deferred to Phase 1.2 — rejected
// by the Zod schemas at the boundary, not in this service body.

import {
  PostJournalEntryInputSchema,
  ReversalInputSchema,
  type PostJournalEntryInputRaw,
  type ReversalInputRaw,
  type ReversalInput,
} from '@/shared/schemas/accounting/journalEntry.schema';
import {
  addMoney,
  zeroMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { loggerWith } from '@/shared/logger/pino';

// --- Service input: discriminated union of create and reversal ---

type JournalEntryServiceInput = PostJournalEntryInputRaw | ReversalInputRaw;

// --- Service implementation ---

async function post(
  input: JournalEntryServiceInput,
  ctx: ServiceContext,
): Promise<{ journal_entry_id: string; entry_number: number }> {
  // Route parse based on input shape
  const isReversal =
    'reverses_journal_entry_id' in input &&
    input.reverses_journal_entry_id !== undefined;

  const parsed = isReversal
    ? ReversalInputSchema.parse(input)
    : PostJournalEntryInputSchema.parse(input);

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // --- Reversal mirror check (before any writes, per ADR-001) ---
  if (isReversal && 'reverses_journal_entry_id' in parsed) {
    await validateReversalMirror(db, parsed as ReversalInput, log);
  }

  // --- Period lock check (defense-in-depth; the DB trigger also catches this) ---
  const { data: period, error: periodErr } = await db
    .from('fiscal_periods')
    .select('is_locked')
    .eq('period_id', parsed.fiscal_period_id)
    .single();

  if (periodErr || !period) {
    throw new ServiceError('POST_FAILED', 'Fiscal period not found');
  }
  if (period.is_locked) {
    throw new ServiceError('PERIOD_LOCKED', 'Cannot post to a locked fiscal period');
  }

  // Balance check is enforced by the Zod schema .refine() (Task 8) and
  // the DB deferred constraint (enforce_journal_entry_balance trigger).
  // No service-level balance check — single source of truth at the
  // schema boundary, DB as final guard.

  // --- Compute entry_number (MAX + 1, no FOR UPDATE in Phase 1.1) ---
  const { data: maxRow } = await db
    .from('journal_entries')
    .select('entry_number')
    .eq('org_id', parsed.org_id)
    .eq('fiscal_period_id', parsed.fiscal_period_id)
    .order('entry_number', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const nextEntryNumber = (maxRow?.entry_number ?? 0) + 1;

  // --- Derive entry_type (programmatic, never from input) ---
  const entryType = isReversal ? 'reversing' : 'regular';

  // --- Insert journal entry ---
  const { data: entry, error: entryErr } = await db
    .from('journal_entries')
    .insert({
      org_id: parsed.org_id,
      fiscal_period_id: parsed.fiscal_period_id,
      entry_date: parsed.entry_date,
      description: parsed.description,
      reference: parsed.reference ?? null,
      source: parsed.source,
      reverses_journal_entry_id:
        isReversal && 'reverses_journal_entry_id' in parsed
          ? (parsed as ReversalInput).reverses_journal_entry_id
          : null,
      reversal_reason:
        isReversal && 'reversal_reason' in parsed
          ? (parsed as ReversalInput).reversal_reason
          : null,
      entry_number: nextEntryNumber,
      entry_type: entryType,
      created_by: ctx.caller.user_id,
    })
    .select('journal_entry_id')
    .single();

  if (entryErr || !entry) {
    log.error({ error: entryErr }, 'Failed to insert journal_entry');
    throw new ServiceError('POST_FAILED', entryErr?.message ?? 'Insert failed');
  }

  // --- Insert journal lines ---
  const lineRows = parsed.lines.map((line) => ({
    journal_entry_id: entry.journal_entry_id,
    account_id: line.account_id,
    description: line.description ?? null,
    debit_amount: line.debit_amount,
    credit_amount: line.credit_amount,
    currency: line.currency,
    amount_original: line.amount_original,
    amount_cad: line.amount_cad,
    fx_rate: line.fx_rate,
    tax_code_id: line.tax_code_id ?? null,
  }));

  const { error: linesErr } = await db
    .from('journal_lines')
    .insert(lineRows);

  if (linesErr) {
    log.error({ error: linesErr }, 'Failed to insert journal_lines');
    throw new ServiceError('POST_FAILED', linesErr.message);
  }

  // --- Audit log (Simplification 1: synchronous write) ---
  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: isReversal ? 'journal_entry.reverse' : 'journal_entry.post',
    entity_type: 'journal_entry',
    entity_id: entry.journal_entry_id,
  });

  log.info(
    { journal_entry_id: entry.journal_entry_id, entry_number: nextEntryNumber, entry_type: entryType },
    'Journal entry posted',
  );

  return { journal_entry_id: entry.journal_entry_id, entry_number: nextEntryNumber };
}

// --- Reversal mirror validation (ADR-001 §1, PLAN.md §15e Layer 2) ---

async function validateReversalMirror(
  db: ReturnType<typeof adminClient>,
  input: ReversalInput,
  log: ReturnType<typeof loggerWith>,
): Promise<void> {
  // Step 5: reversal_reason must be present and non-empty
  if (!input.reversal_reason || input.reversal_reason.trim().length === 0) {
    throw new ServiceError('REVERSAL_NOT_MIRROR', 'reversal_reason is required and must be non-empty');
  }

  // Step 1: load the referenced entry
  const { data: original, error: origErr } = await db
    .from('journal_entries')
    .select('journal_entry_id, org_id')
    .eq('journal_entry_id', input.reverses_journal_entry_id)
    .single();

  if (origErr || !original) {
    throw new ServiceError('REVERSAL_NOT_MIRROR', 'Referenced journal entry not found');
  }

  // Step 2: same org
  if (original.org_id !== input.org_id) {
    throw new ServiceError('REVERSAL_CROSS_ORG', 'Cannot reverse an entry from a different org');
  }

  // Load original lines
  const { data: originalLines, error: linesErr } = await db
    .from('journal_lines')
    .select('account_id, debit_amount, credit_amount, currency, amount_original, amount_cad, fx_rate, tax_code_id')
    .eq('journal_entry_id', input.reverses_journal_entry_id)
    .order('account_id');

  if (linesErr || !originalLines) {
    throw new ServiceError('REVERSAL_NOT_MIRROR', 'Could not load original entry lines');
  }

  // Step 3: line count must match (no partial reversals in Phase 1)
  if (input.lines.length !== originalLines.length) {
    throw new ServiceError('REVERSAL_PARTIAL_NOT_SUPPORTED',
      `Line count mismatch: original has ${originalLines.length}, reversal has ${input.lines.length}`);
  }

  // Step 4: each line must mirror — debit/credit swapped, all else same
  // Supabase REST API may return numeric columns as JS numbers, so we
  // normalize both sides to fixed-precision strings for comparison.
  const toMoney = (v: unknown): string => Number(v).toFixed(4);
  const toRate = (v: unknown): string => Number(v).toFixed(8);

  const remainingOriginals = [...originalLines];
  for (let i = 0; i < input.lines.length; i++) {
    const newLine = input.lines[i];
    const matchIdx = remainingOriginals.findIndex((orig) =>
      orig.account_id === newLine.account_id &&
      orig.currency === newLine.currency &&
      toMoney(orig.amount_original) === toMoney(newLine.amount_original) &&
      toMoney(orig.amount_cad) === toMoney(newLine.amount_cad) &&
      toRate(orig.fx_rate) === toRate(newLine.fx_rate) &&
      // Debit/credit SWAPPED
      toMoney(orig.debit_amount) === toMoney(newLine.credit_amount) &&
      toMoney(orig.credit_amount) === toMoney(newLine.debit_amount)
    );

    if (matchIdx === -1) {
      throw new ServiceError('REVERSAL_NOT_MIRROR',
        `Line ${i} does not mirror any line in the original entry`);
    }

    // Remove matched line to prevent double-matching
    remainingOriginals.splice(matchIdx, 1);
  }

  log.debug('Reversal mirror check passed');
}

// --- Return types for read functions ---

export type JournalEntryListItem = {
  journal_entry_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  source: string;
  entry_type: string;
  reverses_journal_entry_id: string | null;
  created_at: string;
  total_debit: MoneyAmount;
  total_credit: MoneyAmount;
  reversed_by: { entry_id: string; entry_number: number } | null;
};

export type JournalEntryDetail = {
  journal_entry_id: string;
  org_id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference: string | null;
  source: string;
  entry_type: string;
  reverses_journal_entry_id: string | null;
  reversal_reason: string | null;
  created_at: string;
  created_by: string | null;
  journal_lines: Array<{
    journal_line_id: string;
    account_id: string;
    description: string | null;
    debit_amount: string;
    credit_amount: string;
    currency: string;
    amount_original: string;
    amount_cad: string;
    fx_rate: string;
    tax_code_id: string | null;
    chart_of_accounts: {
      account_code: string;
      account_name: string;
    } | null;
  }>;
};

// --- Read functions ---

async function list(
  input: { org_id: string; fiscal_period_id?: string },
  ctx: ServiceContext,
): Promise<JournalEntryListItem[]> {
  // Authorization: caller must be a member of the requested org.
  // Writes get this check from withInvariants Invariant 3; reads
  // do it inline because they don't go through withInvariants.
  if (!ctx.caller.org_ids.includes(input.org_id)) {
    throw new ServiceError('ORG_ACCESS_DENIED', `Caller does not have access to org_id=${input.org_id}`);
  }

  const db = adminClient();

  // Step 1: Fetch journal entries (header data)
  let query = db
    .from('journal_entries')
    .select('journal_entry_id, entry_number, entry_date, description, source, entry_type, reverses_journal_entry_id, created_at')
    .eq('org_id', input.org_id)
    .order('entry_number', { ascending: false });

  if (input.fiscal_period_id) {
    query = query.eq('fiscal_period_id', input.fiscal_period_id);
  }

  const { data: entries, error: entriesError } = await query;
  if (entriesError) throw new ServiceError('READ_FAILED', entriesError.message);
  if (!entries || entries.length === 0) return [];

  // Step 2: Fetch lines for those entries in one round trip
  const entryIds = entries.map((e) => e.journal_entry_id);
  const { data: lines, error: linesError } = await db
    .from('journal_lines')
    .select('journal_entry_id, debit_amount, credit_amount')
    .in('journal_entry_id', entryIds);
  if (linesError) throw new ServiceError('READ_FAILED', linesError.message);

  // Step 3: Aggregate totals per entry using branded money helpers
  const totalsByEntryId = new Map<string, { debit: MoneyAmount; credit: MoneyAmount }>();
  for (const entryId of entryIds) {
    totalsByEntryId.set(entryId, { debit: zeroMoney(), credit: zeroMoney() });
  }
  for (const line of lines ?? []) {
    const totals = totalsByEntryId.get(line.journal_entry_id);
    if (!totals) continue;
    totals.debit = addMoney(totals.debit, line.debit_amount as MoneyAmount);
    totals.credit = addMoney(totals.credit, line.credit_amount as MoneyAmount);
  }

  // Step 4: Find which entries have been reversed (separate query, Option Q)
  const { data: reversingEntries, error: revError } = await db
    .from('journal_entries')
    .select('journal_entry_id, entry_number, reverses_journal_entry_id')
    .in('reverses_journal_entry_id', entryIds);
  if (revError) throw new ServiceError('READ_FAILED', revError.message);

  const reversedByMap = new Map<string, { entry_id: string; entry_number: number }>();
  for (const rev of reversingEntries ?? []) {
    if (rev.reverses_journal_entry_id) {
      reversedByMap.set(rev.reverses_journal_entry_id, {
        entry_id: rev.journal_entry_id,
        entry_number: rev.entry_number,
      });
    }
  }

  // Step 5: Merge totals + reversed_by into entries
  return entries.map((e) => ({
    ...e,
    total_debit: totalsByEntryId.get(e.journal_entry_id)?.debit ?? zeroMoney(),
    total_credit: totalsByEntryId.get(e.journal_entry_id)?.credit ?? zeroMoney(),
    reversed_by: reversedByMap.get(e.journal_entry_id) ?? null,
  })) as JournalEntryListItem[];
}

async function get(
  input: { journal_entry_id: string },
  ctx: ServiceContext,
): Promise<JournalEntryDetail> {
  const db = adminClient();

  // Inline authorization via .in('org_id', ...) — same effect as
  // RLS but using admin client. If the caller doesn't have access
  // to the entry's org, the query returns zero rows and we throw
  // NOT_FOUND (don't leak existence).
  const { data: entry, error } = await db
    .from('journal_entries')
    .select('journal_entry_id, org_id, entry_number, entry_date, description, reference, source, entry_type, reverses_journal_entry_id, reversal_reason, created_at, created_by, journal_lines(journal_line_id, account_id, description, debit_amount, credit_amount, currency, amount_original, amount_cad, fx_rate, tax_code_id, chart_of_accounts(account_code, account_name))')
    .eq('journal_entry_id', input.journal_entry_id)
    .in('org_id', ctx.caller.org_ids)
    .maybeSingle();

  if (error) throw new ServiceError('READ_FAILED', error.message);
  if (!entry) throw new ServiceError('NOT_FOUND', 'Journal entry not found');

  // PostgREST returns chart_of_accounts as a single object for many-to-one
  // FK relationships, but Supabase's generated types model it as an array.
  // The runtime shape is { account_code, account_name }, not [{ ... }].
  // Double assertion bridges the Supabase type → our JournalEntryDetail type.
  return entry as unknown as JournalEntryDetail;
}

export const journalEntryService = {
  post,
  list,
  get,
};
