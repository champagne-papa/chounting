// src/services/accounting/recurringJournalService.ts
// INV-SERVICE-001 export contract (structural): mutations (createTemplate, updateTemplate,
// deactivateTemplate, generateRun, approveRun, rejectRun) are route-handler-wrapped via
// withInvariants per Pattern B. Read paths: listTemplates and listRuns wrap through
// withInvariants at their export sites (S29a; Pattern A). getTemplate (Pattern C) and
// getRun (Pattern E) currently check inline; deferred to S29b for design-bearing
// migration to entity-id-only authorization.
//
// INV-SERVICE-002 adminClient discipline (structural): every database
// access in this file goes through adminClient() from '@/db/adminClient'.
// Service-role bypasses RLS; service-layer authorization via
// withInvariants is the primary enforcement for writes.
//
// INV-RECURRING-001 three-layer defense:
//   - Layer 1 (DB, deferred CONSTRAINT TRIGGER): template lines sum debits
//     = sum credits at commit. Enforced by migration 20240131000000.
//   - Layer 2 (Zod): RecurringTemplateInputSchema.refine / UpdateSchema
//     .refine balanced check. Faster ergonomic error.
//   - Layer 3 (service, this file): all mutations parse through the
//     schemas; no bypass path writes template_lines directly.
//
// ADR-0010 Layer 3 pin: no write path in this file emits
// recurring_journal_runs.status = 'approved'. Phase 1 transitions go
// pending_approval → posted (in approveRun) or pending_approval → rejected
// (in rejectRun). The 'approved' reserved state is Phase 2 scheduler-only.
//
// D10-D (A1) approveRun atomicity: best-effort sequential. Matches the
// existing journalEntryService.post() pattern (which is itself not fully
// atomic across its own multi-call path). Sequence:
//   1. Load run; guard on status / journal_entry_id.
//   2. Load template; check is_active.
//   3. Call withInvariants(journalEntryService.post, 'journal_entry.post')
//      to create the journal entry. This re-runs pre-flight on the inner
//      call — defense in depth.
//   4. UPDATE run with status='posted' + journal_entry_id.
//   5. recordMutation('recurring_run.approve').
// On UPDATE failure after post success, log
// { incident_type: 'recurring_run_orphaned', run_id, journal_entry_id }
// at ERROR level and throw POST_FAILED. The journal_entry exists and is
// committed; the run stays pending_approval. Retry of approveRun will
// hit the already-posted guard via journal_entry_id IS NOT NULL check.
// Phase 2 scheduler session may harden atomicity uniformly across the
// service layer via PL/pgSQL RPC — Step 12 queue item 19.

import {
  RecurringTemplateInputSchema,
  RecurringTemplateUpdateSchema,
  RecurringRunGenerateInputSchema,
  RecurringRunApproveInputSchema,
  RecurringRunRejectInputSchema,
  type RecurringTemplateInputRaw,
  type RecurringTemplateUpdateRaw,
  type RecurringRunGenerateInputRaw,
  type RecurringRunApproveInputRaw,
  type RecurringRunRejectInputRaw,
} from '@/shared/schemas/accounting/recurringJournal.schema';
import {
  addMoney,
  toMoneyAmount,
  oneRate,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { loggerWith } from '@/shared/logger/pino';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type RecurringTemplateListItem = {
  recurring_template_id: string;
  org_id: string;
  template_name: string;
  description: string | null;
  auto_post: boolean;
  is_active: boolean;
  created_at: string;
};

export type RecurringTemplateDetail = RecurringTemplateListItem & {
  lines: Array<{
    template_line_id: string;
    account_id: string;
    description: string | null;
    debit_amount: MoneyAmount;
    credit_amount: MoneyAmount;
    currency: string;
    tax_code_id: string | null;
  }>;
};

export type RecurringRunListItem = {
  recurring_run_id: string;
  recurring_template_id: string;
  scheduled_for: string;
  status: string;
  journal_entry_id: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type RecurringRunDetail = RecurringRunListItem;

// ---------------------------------------------------------------------------
// createTemplate
// ---------------------------------------------------------------------------

async function createTemplate(
  input: RecurringTemplateInputRaw,
  ctx: ServiceContext,
): Promise<{ recurring_template_id: string }> {
  const parsed = RecurringTemplateInputSchema.parse(input);
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const { data: template, error: templateErr } = await db
    .from('recurring_journal_templates')
    .insert({
      org_id: parsed.org_id,
      template_name: parsed.template_name,
      description: parsed.description ?? null,
      auto_post: parsed.auto_post,
      created_by: ctx.caller.user_id,
    })
    .select('recurring_template_id')
    .single();

  if (templateErr || !template) {
    log.error({ error: templateErr }, 'Failed to insert recurring_journal_template');
    throw new ServiceError('POST_FAILED', templateErr?.message ?? 'Template insert failed');
  }

  const lineRows = parsed.lines.map((line) => ({
    recurring_template_id: template.recurring_template_id,
    account_id: line.account_id,
    description: line.description ?? null,
    debit_amount: line.debit_amount,
    credit_amount: line.credit_amount,
    currency: line.currency,
    tax_code_id: line.tax_code_id ?? null,
  }));

  const { error: linesErr } = await db
    .from('recurring_journal_template_lines')
    .insert(lineRows);

  if (linesErr) {
    log.error({ error: linesErr }, 'Failed to insert recurring_journal_template_lines');
    throw new ServiceError('POST_FAILED', linesErr.message);
  }

  await recordMutation(db, ctx, {
    org_id: parsed.org_id,
    action: 'recurring_template.create',
    entity_type: 'recurring_journal_template',
    entity_id: template.recurring_template_id,
  });

  log.info(
    { recurring_template_id: template.recurring_template_id },
    'Recurring template created',
  );

  return { recurring_template_id: template.recurring_template_id };
}

// ---------------------------------------------------------------------------
// updateTemplate — ADR-0009 before_state capture
// ---------------------------------------------------------------------------

async function updateTemplate(
  input: { recurring_template_id: string; org_id: string } & RecurringTemplateUpdateRaw,
  ctx: ServiceContext,
): Promise<void> {
  const { recurring_template_id, org_id, ...updateFields } = input;
  const parsed = RecurringTemplateUpdateSchema.parse(updateFields);
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const { data: before, error: beforeErr } = await db
    .from('recurring_journal_templates')
    .select('*')
    .eq('recurring_template_id', recurring_template_id)
    .eq('org_id', org_id)
    .maybeSingle();

  if (beforeErr) throw new ServiceError('READ_FAILED', beforeErr.message);
  if (!before) {
    throw new ServiceError(
      'RECURRING_TEMPLATE_NOT_FOUND',
      `recurring_template_id=${recurring_template_id} not found in org_id=${org_id}`,
    );
  }

  const updateCols: Record<string, unknown> = {};
  if (parsed.template_name !== undefined) updateCols.template_name = parsed.template_name;
  if (parsed.description !== undefined) updateCols.description = parsed.description;
  if (parsed.auto_post !== undefined) updateCols.auto_post = parsed.auto_post;
  if (parsed.is_active !== undefined) updateCols.is_active = parsed.is_active;

  if (Object.keys(updateCols).length > 0) {
    const { error: updErr } = await db
      .from('recurring_journal_templates')
      .update(updateCols)
      .eq('recurring_template_id', recurring_template_id);
    if (updErr) throw new ServiceError('POST_FAILED', updErr.message);
  }

  // Line replacement: atomic-ish via delete-then-insert. The deferred
  // CONSTRAINT TRIGGER enforce_template_balance fires at transaction
  // commit, catching imbalance after the INSERT replays new lines.
  if (parsed.lines) {
    const { error: delErr } = await db
      .from('recurring_journal_template_lines')
      .delete()
      .eq('recurring_template_id', recurring_template_id);
    if (delErr) throw new ServiceError('POST_FAILED', delErr.message);

    const lineRows = parsed.lines.map((line) => ({
      recurring_template_id,
      account_id: line.account_id,
      description: line.description ?? null,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      currency: line.currency,
      tax_code_id: line.tax_code_id ?? null,
    }));

    const { error: insErr } = await db
      .from('recurring_journal_template_lines')
      .insert(lineRows);
    if (insErr) throw new ServiceError('POST_FAILED', insErr.message);
  }

  await recordMutation(db, ctx, {
    org_id,
    action: 'recurring_template.update',
    entity_type: 'recurring_journal_template',
    entity_id: recurring_template_id,
    before_state: before as Record<string, unknown>,
  });

  log.info({ recurring_template_id }, 'Recurring template updated');
}

// ---------------------------------------------------------------------------
// deactivateTemplate — ADR-0009 before_state capture
// ---------------------------------------------------------------------------

async function deactivateTemplate(
  input: { recurring_template_id: string; org_id: string },
  ctx: ServiceContext,
): Promise<void> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const { data: before, error: beforeErr } = await db
    .from('recurring_journal_templates')
    .select('*')
    .eq('recurring_template_id', input.recurring_template_id)
    .eq('org_id', input.org_id)
    .maybeSingle();

  if (beforeErr) throw new ServiceError('READ_FAILED', beforeErr.message);
  if (!before) {
    throw new ServiceError(
      'RECURRING_TEMPLATE_NOT_FOUND',
      `recurring_template_id=${input.recurring_template_id} not found in org_id=${input.org_id}`,
    );
  }

  const { error: updErr } = await db
    .from('recurring_journal_templates')
    .update({ is_active: false })
    .eq('recurring_template_id', input.recurring_template_id);

  if (updErr) throw new ServiceError('POST_FAILED', updErr.message);

  await recordMutation(db, ctx, {
    org_id: input.org_id,
    action: 'recurring_template.deactivate',
    entity_type: 'recurring_journal_template',
    entity_id: input.recurring_template_id,
    before_state: before as Record<string, unknown>,
  });

  log.info(
    { recurring_template_id: input.recurring_template_id },
    'Recurring template deactivated',
  );
}

// ---------------------------------------------------------------------------
// generateRun — idempotent-return-existing per brief §3.3
// ---------------------------------------------------------------------------

async function generateRun(
  input: {
    recurring_template_id: string;
    org_id: string;
  } & RecurringRunGenerateInputRaw,
  ctx: ServiceContext,
): Promise<{ recurring_run_id: string; created: boolean }> {
  const { recurring_template_id, org_id, ...generateFields } = input;
  const parsed = RecurringRunGenerateInputSchema.parse(generateFields);
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // Template existence + active check
  const { data: template, error: tplErr } = await db
    .from('recurring_journal_templates')
    .select('recurring_template_id, org_id, is_active')
    .eq('recurring_template_id', recurring_template_id)
    .eq('org_id', org_id)
    .maybeSingle();

  if (tplErr) throw new ServiceError('READ_FAILED', tplErr.message);
  if (!template) {
    throw new ServiceError(
      'RECURRING_TEMPLATE_NOT_FOUND',
      `recurring_template_id=${recurring_template_id} not found in org_id=${org_id}`,
    );
  }
  if (!template.is_active) {
    throw new ServiceError(
      'RECURRING_TEMPLATE_INACTIVE',
      `recurring_template_id=${recurring_template_id} is not active; reactivate or use a different template`,
    );
  }

  // §3.3 idempotent INSERT: ON CONFLICT DO NOTHING returns no rows if
  // the (recurring_template_id, scheduled_for) composite key already
  // exists. The subsequent SELECT returns the existing row.
  //
  // supabase-js emits `.upsert({...}, { ignoreDuplicates: true })` as
  // INSERT ... ON CONFLICT DO NOTHING when the conflict target matches
  // a UNIQUE constraint. We pass the conflict column(s) explicitly to
  // avoid ambiguity.
  const { data: insertResult, error: insErr } = await db
    .from('recurring_journal_runs')
    .upsert(
      {
        recurring_template_id,
        scheduled_for: parsed.scheduled_for,
        // status defaults to 'pending_approval' via DB DEFAULT —
        // no explicit write (ADR-0010 Layer 3 discipline).
      },
      {
        onConflict: 'recurring_template_id,scheduled_for',
        ignoreDuplicates: true,
      },
    )
    .select('recurring_run_id');

  if (insErr) throw new ServiceError('POST_FAILED', insErr.message);

  let runId: string;
  let created: boolean;

  if (insertResult && insertResult.length > 0) {
    runId = insertResult[0].recurring_run_id as string;
    created = true;
  } else {
    // Conflict — fetch existing row
    const { data: existing, error: selErr } = await db
      .from('recurring_journal_runs')
      .select('recurring_run_id')
      .eq('recurring_template_id', recurring_template_id)
      .eq('scheduled_for', parsed.scheduled_for)
      .single();
    if (selErr || !existing) {
      throw new ServiceError(
        'POST_FAILED',
        `Idempotent generateRun: conflict but existing row not found — ${selErr?.message ?? 'no row'}`,
      );
    }
    runId = existing.recurring_run_id as string;
    created = false;
  }

  // Always-audit (D10 orchestrator ratification): each call is a caller
  // action; operators see the attempt history even on conflict.
  await recordMutation(db, ctx, {
    org_id,
    action: 'recurring_run.generate',
    entity_type: 'recurring_journal_run',
    entity_id: runId,
  });

  log.info(
    { recurring_run_id: runId, created, scheduled_for: parsed.scheduled_for },
    created ? 'Recurring run generated' : 'Recurring run generate idempotent-returned-existing',
  );

  return { recurring_run_id: runId, created };
}

// ---------------------------------------------------------------------------
// approveRun — D10-D (A1) best-effort sequential
// ---------------------------------------------------------------------------

async function approveRun(
  input: { recurring_run_id: string; org_id: string } & RecurringRunApproveInputRaw,
  ctx: ServiceContext,
): Promise<{ journal_entry_id: string; entry_number: number }> {
  const { recurring_run_id, org_id, ...approveFields } = input;
  // ADR-0010 Layer 2: reject any client-provided status override.
  RecurringRunApproveInputSchema.parse(approveFields);
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // 1. Load run with the parent template (single query; status/FK guard).
  const { data: run, error: runErr } = await db
    .from('recurring_journal_runs')
    .select('recurring_run_id, recurring_template_id, scheduled_for, status, journal_entry_id')
    .eq('recurring_run_id', recurring_run_id)
    .maybeSingle();

  if (runErr) throw new ServiceError('READ_FAILED', runErr.message);
  if (!run) {
    throw new ServiceError('NOT_FOUND', `recurring_run_id=${recurring_run_id} not found`);
  }

  // Orphan-guard: a run is approvable only if pending_approval AND
  // has no linked journal_entry_id. The dual check protects against
  // retry of an approveRun whose UPDATE failed after post-succeeded
  // (the orphan-incident case): even though status lingers at
  // pending_approval, journal_entry_id IS NOT NULL blocks re-post.
  if (run.status !== 'pending_approval' || run.journal_entry_id !== null) {
    throw new ServiceError(
      'RECURRING_RUN_NOT_PENDING',
      `recurring_run_id=${recurring_run_id} is not pending approval (status=${run.status}, journal_entry_id=${run.journal_entry_id ?? 'null'})`,
    );
  }

  // 2. Load template + lines; verify is_active and org match.
  const { data: template, error: tplErr } = await db
    .from('recurring_journal_templates')
    .select('recurring_template_id, org_id, template_name, is_active')
    .eq('recurring_template_id', run.recurring_template_id)
    .maybeSingle();

  if (tplErr) throw new ServiceError('READ_FAILED', tplErr.message);
  if (!template) {
    throw new ServiceError('RECURRING_TEMPLATE_NOT_FOUND', `Template for run ${recurring_run_id} not found`);
  }
  if (template.org_id !== org_id) {
    throw new ServiceError(
      'ORG_ACCESS_DENIED',
      `Template belongs to a different org (expected ${org_id}, got ${template.org_id})`,
    );
  }
  if (!template.is_active) {
    throw new ServiceError(
      'RECURRING_TEMPLATE_INACTIVE',
      `Cannot approve run for inactive template ${template.recurring_template_id}`,
    );
  }

  const { data: templateLines, error: linesErr } = await db
    .from('recurring_journal_template_lines')
    .select('account_id, description, debit_amount, credit_amount, currency, tax_code_id')
    .eq('recurring_template_id', run.recurring_template_id);

  if (linesErr) throw new ServiceError('READ_FAILED', linesErr.message);
  if (!templateLines || templateLines.length < 2) {
    throw new ServiceError(
      'POST_FAILED',
      `Template ${run.recurring_template_id} has insufficient lines (found ${templateLines?.length ?? 0})`,
    );
  }

  // 3. Resolve fiscal_period_id for scheduled_for date.
  const { data: period, error: periodErr } = await db
    .from('fiscal_periods')
    .select('period_id, is_locked')
    .eq('org_id', org_id)
    .lte('start_date', run.scheduled_for)
    .gte('end_date', run.scheduled_for)
    .maybeSingle();

  if (periodErr) throw new ServiceError('READ_FAILED', periodErr.message);
  if (!period) {
    throw new ServiceError(
      'POST_FAILED',
      `No fiscal period covers scheduled_for=${run.scheduled_for} in org_id=${org_id}`,
    );
  }
  if (period.is_locked) {
    throw new ServiceError(
      'PERIOD_LOCKED',
      `Fiscal period covering scheduled_for=${run.scheduled_for} is locked`,
    );
  }

  // 4. Build the journal-entry input from the template (CAD-only Phase 1;
  // amount_original = debit + credit; fx_rate = 1.00000000; amount_cad = original).
  const journalLines = templateLines.map((line) => {
    const debit = toMoneyAmount(line.debit_amount as string | number);
    const credit = toMoneyAmount(line.credit_amount as string | number);
    const original = addMoney(debit, credit);
    return {
      account_id: line.account_id,
      description: line.description ?? undefined,
      debit_amount: debit,
      credit_amount: credit,
      currency: (line.currency as string) ?? 'CAD',
      amount_original: original,
      amount_cad: original,
      fx_rate: oneRate(),
      tax_code_id: line.tax_code_id ?? null,
    };
  });

  // 5. Post the journal entry. Wrap with withInvariants so the inner
  // call re-verifies permission (controller has journal_entry.post;
  // defense in depth — if a role gains recurring_run.approve without
  // journal_entry.post in a future phase, the inner wrap blocks).
  const postResult = await withInvariants(
    journalEntryService.post,
    { action: 'journal_entry.post' },
  )(
    {
      org_id,
      fiscal_period_id: period.period_id,
      entry_date: run.scheduled_for,
      description: `Recurring: ${template.template_name} (${run.scheduled_for})`,
      source: 'manual' as const,
      lines: journalLines,
    },
    ctx,
  );

  // 6. UPDATE run with status='posted' + journal_entry_id. On failure
  // after a successful post, log orphan incident and throw.
  const { error: updErr } = await db
    .from('recurring_journal_runs')
    .update({
      status: 'posted',
      journal_entry_id: postResult.journal_entry_id,
    })
    .eq('recurring_run_id', recurring_run_id);

  if (updErr) {
    log.error(
      {
        incident_type: 'recurring_run_orphaned',
        recurring_run_id,
        journal_entry_id: postResult.journal_entry_id,
        error: updErr.message,
      },
      'Recurring run UPDATE failed after journal_entry posted — orphaned state',
    );
    throw new ServiceError(
      'POST_FAILED',
      `Journal entry ${postResult.journal_entry_id} posted but run update failed: ${updErr.message}`,
    );
  }

  // 7. Audit the approve action. If audit write fails after the UPDATE
  // landed, the run state is still consistent (posted + journal_entry_id
  // linked) — the audit gap is the INV-AUDIT-001 violation window, same
  // shape as journalEntryService.post's post-insert audit risk.
  await recordMutation(db, ctx, {
    org_id,
    action: 'recurring_run.approve',
    entity_type: 'recurring_journal_run',
    entity_id: recurring_run_id,
  });

  log.info(
    {
      recurring_run_id,
      journal_entry_id: postResult.journal_entry_id,
      entry_number: postResult.entry_number,
    },
    'Recurring run approved and posted',
  );

  return postResult;
}

// ---------------------------------------------------------------------------
// rejectRun
// ---------------------------------------------------------------------------

async function rejectRun(
  input: { recurring_run_id: string; org_id: string } & RecurringRunRejectInputRaw,
  ctx: ServiceContext,
): Promise<void> {
  const { recurring_run_id, org_id, ...rejectFields } = input;
  const parsed = RecurringRunRejectInputSchema.parse(rejectFields);
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const { data: run, error: runErr } = await db
    .from('recurring_journal_runs')
    .select('recurring_run_id, recurring_template_id, status, journal_entry_id')
    .eq('recurring_run_id', recurring_run_id)
    .maybeSingle();

  if (runErr) throw new ServiceError('READ_FAILED', runErr.message);
  if (!run) {
    throw new ServiceError('NOT_FOUND', `recurring_run_id=${recurring_run_id} not found`);
  }
  if (run.status !== 'pending_approval' || run.journal_entry_id !== null) {
    throw new ServiceError(
      'RECURRING_RUN_NOT_PENDING',
      `recurring_run_id=${recurring_run_id} is not pending (status=${run.status})`,
    );
  }

  // Verify the run belongs to the claimed org via template.org_id.
  const { data: template, error: tplErr } = await db
    .from('recurring_journal_templates')
    .select('org_id')
    .eq('recurring_template_id', run.recurring_template_id)
    .maybeSingle();
  if (tplErr) throw new ServiceError('READ_FAILED', tplErr.message);
  if (!template || template.org_id !== org_id) {
    throw new ServiceError(
      'ORG_ACCESS_DENIED',
      `Run belongs to a different org (expected ${org_id})`,
    );
  }

  const { error: updErr } = await db
    .from('recurring_journal_runs')
    .update({
      status: 'rejected',
      rejection_reason: parsed.rejection_reason,
    })
    .eq('recurring_run_id', recurring_run_id);

  if (updErr) throw new ServiceError('POST_FAILED', updErr.message);

  await recordMutation(db, ctx, {
    org_id,
    action: 'recurring_run.reject',
    entity_type: 'recurring_journal_run',
    entity_id: recurring_run_id,
    reason: parsed.rejection_reason,
  });

  log.info(
    { recurring_run_id, rejection_reason: parsed.rejection_reason },
    'Recurring run rejected',
  );
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function listTemplates(
  input: { org_id: string },
  _ctx: ServiceContext,
): Promise<RecurringTemplateListItem[]> {
  const db = adminClient();
  const { data, error } = await db
    .from('recurring_journal_templates')
    .select('recurring_template_id, org_id, template_name, description, auto_post, is_active, created_at')
    .eq('org_id', input.org_id)
    .order('created_at', { ascending: false });

  if (error) throw new ServiceError('READ_FAILED', error.message);
  return (data ?? []) as RecurringTemplateListItem[];
}

async function getTemplate(
  input: { recurring_template_id: string },
  ctx: ServiceContext,
): Promise<RecurringTemplateDetail> {
  const db = adminClient();

  const { data: template, error: tplErr } = await db
    .from('recurring_journal_templates')
    .select('recurring_template_id, org_id, template_name, description, auto_post, is_active, created_at')
    .eq('recurring_template_id', input.recurring_template_id)
    .in('org_id', ctx.caller.org_ids)
    .maybeSingle();

  if (tplErr) throw new ServiceError('READ_FAILED', tplErr.message);
  if (!template) throw new ServiceError('RECURRING_TEMPLATE_NOT_FOUND', `Template not found or access denied`);

  const { data: lines, error: linesErr } = await db
    .from('recurring_journal_template_lines')
    .select('template_line_id, account_id, description, debit_amount, credit_amount, currency, tax_code_id')
    .eq('recurring_template_id', input.recurring_template_id);

  if (linesErr) throw new ServiceError('READ_FAILED', linesErr.message);

  return {
    ...(template as RecurringTemplateListItem),
    lines: (lines ?? []).map((line) => ({
      template_line_id: line.template_line_id as string,
      account_id: line.account_id as string,
      description: (line.description as string | null) ?? null,
      debit_amount: toMoneyAmount(line.debit_amount as string | number),
      credit_amount: toMoneyAmount(line.credit_amount as string | number),
      currency: line.currency as string,
      tax_code_id: (line.tax_code_id as string | null) ?? null,
    })),
  };
}

async function listRuns(
  input: { org_id: string; recurring_template_id?: string; status?: string },
  _ctx: ServiceContext,
): Promise<RecurringRunListItem[]> {
  const db = adminClient();

  // Gather template IDs for this org so runs filter correctly.
  const { data: templates, error: tplErr } = await db
    .from('recurring_journal_templates')
    .select('recurring_template_id')
    .eq('org_id', input.org_id);
  if (tplErr) throw new ServiceError('READ_FAILED', tplErr.message);
  const templateIds = (templates ?? []).map((t) => t.recurring_template_id as string);
  if (templateIds.length === 0) return [];

  let query = db
    .from('recurring_journal_runs')
    .select('recurring_run_id, recurring_template_id, scheduled_for, status, journal_entry_id, rejection_reason, created_at')
    .in('recurring_template_id', templateIds)
    .order('created_at', { ascending: false });

  if (input.recurring_template_id) {
    query = query.eq('recurring_template_id', input.recurring_template_id);
  }
  if (input.status) {
    query = query.eq('status', input.status);
  }

  const { data, error } = await query;
  if (error) throw new ServiceError('READ_FAILED', error.message);
  return (data ?? []) as RecurringRunListItem[];
}

async function getRun(
  input: { recurring_run_id: string },
  ctx: ServiceContext,
): Promise<RecurringRunDetail> {
  const db = adminClient();

  const { data: run, error: runErr } = await db
    .from('recurring_journal_runs')
    .select('recurring_run_id, recurring_template_id, scheduled_for, status, journal_entry_id, rejection_reason, created_at')
    .eq('recurring_run_id', input.recurring_run_id)
    .maybeSingle();

  if (runErr) throw new ServiceError('READ_FAILED', runErr.message);
  if (!run) throw new ServiceError('NOT_FOUND', 'Recurring run not found');

  // Verify caller has access to the parent template's org.
  const { data: template, error: tplErr } = await db
    .from('recurring_journal_templates')
    .select('org_id')
    .eq('recurring_template_id', run.recurring_template_id)
    .maybeSingle();
  if (tplErr) throw new ServiceError('READ_FAILED', tplErr.message);
  if (!template || !ctx.caller.org_ids.includes(template.org_id as string)) {
    throw new ServiceError('NOT_FOUND', 'Recurring run not found');
  }

  return run as RecurringRunDetail;
}

export const recurringJournalService = {
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  generateRun,
  approveRun,
  rejectRun,
  listTemplates: withInvariants(listTemplates),
  getTemplate,
  listRuns: withInvariants(listRuns),
  getRun,
};
