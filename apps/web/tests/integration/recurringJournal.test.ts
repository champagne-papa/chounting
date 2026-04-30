// tests/integration/recurringJournal.test.ts
// Phase 0-1.1 Arc A Step 10a — integration tests for the recurring-
// journals data layer, service methods, and three-layer defenses.
//
// Coverage:
//   1. Happy path: createTemplate → generateRun → approveRun → journal_entry exists.
//   2. INV-RECURRING-001 Layer 2: Zod .refine rejects unbalanced template.
//   3. INV-RECURRING-001 Layer 1: deferred CONSTRAINT TRIGGER catches
//      unbalanced template_lines at transaction commit (via direct
//      adminClient INSERT bypassing Zod).
//   4. generateRun idempotency: duplicate call on same (template_id,
//      scheduled_for) returns the existing run_id; no duplicate INSERT.
//   5. ADR-0010 Layer 2: Zod rejects client-provided status override on
//      approveRun / rejectRun inputs.
//   6. ADR-0010 Layer 3 pin: after approveRun, row has status='posted'
//      (not 'approved'); the service's write path emits no reserved
//      value.
//   7. ADR-0010 Layer 1: DB CHECK recurring_run_status_phase1_allowed
//      rejects a direct INSERT that writes status='approved'.
//   8. RECURRING_TEMPLATE_NOT_FOUND.
//   9. RECURRING_TEMPLATE_INACTIVE (generateRun on deactivated template).
//  10. RECURRING_RUN_NOT_PENDING via orphan-guard retry (approveRun on
//      already-posted run).
//  11. Permission gating: executive → PERMISSION_DENIED on create.
//  12. Cross-org isolation: controller with access to HOLDING cannot
//      read REAL_ESTATE templates/runs.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { recurringJournalService } from '@/services/accounting/recurringJournalService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('recurringJournal: data layer + service + three-layer defenses', () => {
  const db = adminClient();

  // Use 1300 Other Receivables + 2100 Intercompany Payables — same
  // pattern as adjustmentEntry.test.ts (accounts outside the
  // Cash/Fees/Share-Capital/AP quadrant exercised by other tests).
  let otherReceivablesAccountId: string;
  let intercompanyPayablesAccountId: string;

  const controllerCtx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
    },
    locale: 'en',
  };

  const executiveCtx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: SEED.USER_EXECUTIVE,
      email: 'executive@thebridge.local',
      org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
    },
    locale: 'en',
  };

  function freshCtx(): ServiceContext {
    return { ...controllerCtx, trace_id: crypto.randomUUID() };
  }

  function freshExecutiveCtx(): ServiceContext {
    return { ...executiveCtx, trace_id: crypto.randomUUID() };
  }

  beforeAll(async () => {
    const { data: otherReceivables } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1300')
      .single();

    const { data: intercompanyPayables } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '2100')
      .single();

    otherReceivablesAccountId = otherReceivables!.account_id;
    intercompanyPayablesAccountId = intercompanyPayables!.account_id;
  });

  function buildTemplateInput(overrides: Record<string, unknown> = {}) {
    return {
      org_id: SEED.ORG_HOLDING,
      template_name: `Test template ${crypto.randomUUID().slice(0, 8)}`,
      description: 'Monthly accrual',
      auto_post: false,
      lines: [
        {
          account_id: otherReceivablesAccountId,
          debit_amount: '100.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
        },
        {
          account_id: intercompanyPayablesAccountId,
          debit_amount: '0.0000',
          credit_amount: '100.0000',
          currency: 'CAD',
        },
      ],
      ...overrides,
    };
  }

  it('1. happy path: createTemplate → generateRun → approveRun produces a journal_entry', async () => {
    const ctx = freshCtx();
    const { recurring_template_id } = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(buildTemplateInput(), ctx);

    // Pick a date inside an open fiscal period (today is a safe default).
    const scheduledFor = new Date().toISOString().slice(0, 10);

    const genResult = await withInvariants(
      recurringJournalService.generateRun,
      { action: 'recurring_run.generate' },
    )(
      {
        recurring_template_id,
        org_id: SEED.ORG_HOLDING,
        scheduled_for: scheduledFor,
      },
      freshCtx(),
    );

    expect(genResult.created).toBe(true);
    expect(genResult.recurring_run_id).toBeDefined();

    const approveResult = await withInvariants(
      recurringJournalService.approveRun,
      { action: 'recurring_run.approve' },
    )(
      {
        recurring_run_id: genResult.recurring_run_id,
        org_id: SEED.ORG_HOLDING,
      },
      freshCtx(),
    );

    expect(approveResult.journal_entry_id).toBeDefined();
    expect(approveResult.entry_number).toBeGreaterThan(0);

    // ADR-0010 Layer 3 pin: run transitioned to 'posted' (not 'approved').
    const { data: runRow } = await db
      .from('recurring_journal_runs')
      .select('status, journal_entry_id')
      .eq('recurring_run_id', genResult.recurring_run_id)
      .single();

    expect(runRow?.status).toBe('posted');
    expect(runRow?.journal_entry_id).toBe(approveResult.journal_entry_id);
  });

  it('2. INV-RECURRING-001 Layer 2: Zod rejects unbalanced template', async () => {
    // Debits 100, credits 50 — unbalanced.
    const unbalanced = buildTemplateInput({
      lines: [
        {
          account_id: otherReceivablesAccountId,
          debit_amount: '100.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
        },
        {
          account_id: intercompanyPayablesAccountId,
          debit_amount: '0.0000',
          credit_amount: '50.0000',
          currency: 'CAD',
        },
      ],
    });

    await expect(
      withInvariants(
        recurringJournalService.createTemplate,
        { action: 'recurring_template.create' },
      )(unbalanced, freshCtx()),
    ).rejects.toThrow();
  });

  it('3. INV-RECURRING-001 Layer 1: deferred CONSTRAINT TRIGGER rejects unbalanced at commit', async () => {
    // Create a balanced template via the service so a template row exists.
    const { recurring_template_id } = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(buildTemplateInput(), freshCtx());

    // Now attempt a direct INSERT of an unbalanced line via adminClient
    // (bypassing Zod). The deferred trigger fires at the statement-
    // transaction commit and throws check_violation.
    const { error: insErr } = await db
      .from('recurring_journal_template_lines')
      .insert({
        recurring_template_id,
        account_id: otherReceivablesAccountId,
        debit_amount: '999.0000',
        credit_amount: '0.0000',
        currency: 'CAD',
      });

    expect(insErr).toBeDefined();
    expect(insErr!.message).toMatch(/not balanced|check_violation|enforce_template_balance/i);
  });

  it('4. generateRun idempotency: duplicate call returns existing run_id', async () => {
    const { recurring_template_id } = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(buildTemplateInput(), freshCtx());

    const scheduledFor = '2026-05-01';

    const first = await withInvariants(
      recurringJournalService.generateRun,
      { action: 'recurring_run.generate' },
    )(
      {
        recurring_template_id,
        org_id: SEED.ORG_HOLDING,
        scheduled_for: scheduledFor,
      },
      freshCtx(),
    );

    const second = await withInvariants(
      recurringJournalService.generateRun,
      { action: 'recurring_run.generate' },
    )(
      {
        recurring_template_id,
        org_id: SEED.ORG_HOLDING,
        scheduled_for: scheduledFor,
      },
      freshCtx(),
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.recurring_run_id).toBe(first.recurring_run_id);
  });

  it('5. ADR-0010 Layer 2: Zod rejects client-provided status override on approveRun', async () => {
    const { recurring_template_id } = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(buildTemplateInput(), freshCtx());

    const { recurring_run_id } = await withInvariants(
      recurringJournalService.generateRun,
      { action: 'recurring_run.generate' },
    )(
      {
        recurring_template_id,
        org_id: SEED.ORG_HOLDING,
        scheduled_for: '2026-06-01',
      },
      freshCtx(),
    );

    // The RecurringRunApproveInputSchema rejects any `status` field via
    // z.undefined().optional() + .strict(). The service parse throws
    // ZodError before the approve logic executes.
    await expect(
      withInvariants(
        recurringJournalService.approveRun,
        { action: 'recurring_run.approve' },
      )(
        {
          recurring_run_id,
          org_id: SEED.ORG_HOLDING,
          // @ts-expect-error — intentional client-override attempt.
          status: 'approved',
        },
        freshCtx(),
      ),
    ).rejects.toThrow();
  });

  it('6. ADR-0010 Layer 1: DB CHECK rejects direct INSERT of status=approved', async () => {
    const { recurring_template_id } = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(buildTemplateInput(), freshCtx());

    // Direct INSERT bypassing the service (simulating a Layer 2/3 escape).
    // The CHECK recurring_run_status_phase1_allowed rejects.
    const { error } = await db
      .from('recurring_journal_runs')
      .insert({
        recurring_template_id,
        scheduled_for: '2026-07-01',
        status: 'approved',
      });

    expect(error).toBeDefined();
    expect(error!.message).toMatch(/check|approved|phase1_allowed|violation/i);
  });

  it('8. RECURRING_TEMPLATE_NOT_FOUND on generateRun with nonexistent template', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999';

    await expect(
      withInvariants(
        recurringJournalService.generateRun,
        { action: 'recurring_run.generate' },
      )(
        {
          recurring_template_id: fakeId,
          org_id: SEED.ORG_HOLDING,
          scheduled_for: '2026-08-01',
        },
        freshCtx(),
      ),
    ).rejects.toThrow(/RECURRING_TEMPLATE_NOT_FOUND/);
  });

  it('9. RECURRING_TEMPLATE_INACTIVE on generateRun against deactivated template', async () => {
    const { recurring_template_id } = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(buildTemplateInput(), freshCtx());

    await withInvariants(
      recurringJournalService.deactivateTemplate,
      { action: 'recurring_template.deactivate' },
    )(
      {
        recurring_template_id,
        org_id: SEED.ORG_HOLDING,
      },
      freshCtx(),
    );

    await expect(
      withInvariants(
        recurringJournalService.generateRun,
        { action: 'recurring_run.generate' },
      )(
        {
          recurring_template_id,
          org_id: SEED.ORG_HOLDING,
          scheduled_for: '2026-09-01',
        },
        freshCtx(),
      ),
    ).rejects.toThrow(/RECURRING_TEMPLATE_INACTIVE/);
  });

  it('10. RECURRING_RUN_NOT_PENDING on re-approve (orphan-guard)', async () => {
    const { recurring_template_id } = await withInvariants(
      recurringJournalService.createTemplate,
      { action: 'recurring_template.create' },
    )(buildTemplateInput(), freshCtx());

    const { recurring_run_id } = await withInvariants(
      recurringJournalService.generateRun,
      { action: 'recurring_run.generate' },
    )(
      {
        recurring_template_id,
        org_id: SEED.ORG_HOLDING,
        scheduled_for: new Date().toISOString().slice(0, 10),
      },
      freshCtx(),
    );

    // First approve succeeds.
    await withInvariants(
      recurringJournalService.approveRun,
      { action: 'recurring_run.approve' },
    )(
      {
        recurring_run_id,
        org_id: SEED.ORG_HOLDING,
      },
      freshCtx(),
    );

    // Second approve hits the orphan-guard (status != 'pending_approval').
    await expect(
      withInvariants(
        recurringJournalService.approveRun,
        { action: 'recurring_run.approve' },
      )(
        {
          recurring_run_id,
          org_id: SEED.ORG_HOLDING,
        },
        freshCtx(),
      ),
    ).rejects.toThrow(/RECURRING_RUN_NOT_PENDING/);
  });

  it('11. permission gating: executive attempts createTemplate → PERMISSION_DENIED', async () => {
    await expect(
      withInvariants(
        recurringJournalService.createTemplate,
        { action: 'recurring_template.create' },
      )(buildTemplateInput(), freshExecutiveCtx()),
    ).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('12. cross-org isolation: listTemplates against unauthorized org → ORG_ACCESS_DENIED', async () => {
    // Build a ctx that only lists HOLDING in org_ids, then attempt to
    // list REAL_ESTATE templates. Service's inline org-access check
    // throws before any DB query.
    const holdingOnlyCtx: ServiceContext = {
      trace_id: crypto.randomUUID(),
      caller: {
        verified: true,
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en',
    };

    await expect(
      recurringJournalService.listTemplates(
        { org_id: SEED.ORG_REAL_ESTATE },
        holdingOnlyCtx,
      ),
    ).rejects.toThrow(/ORG_ACCESS_DENIED/);
  });
});
