// tests/integration/adjustmentEntry.test.ts
// Phase 0-1.1 Arc A Step 9a — integration tests for the adjusting
// branch of journalEntryService.post (three-branch discriminator
// extension per D9-A (B)).
//
// Six tests:
//
//   1. Happy path: controller posts valid adjusting entry; DB row
//      carries entry_type='adjusting', adjustment_reason, and
//      adjustment_status='posted' (DB DEFAULT). Audit log emits
//      action='journal_entry.adjust'.
//   2. Zod rejects empty adjustment_reason via .min(1).
//   3. DB CHECK catches whitespace-only adjustment_reason. Zod
//      .min(1) is length-only so '   ' passes the schema; the DB
//      CHECK's length(trim(...)) > 0 is the stricter authoritative
//      guard. Surfaces as POST_FAILED at the service boundary.
//   4. Zod rejects adjustment + reversal combination via
//      AdjustmentInputSchema's reverses_journal_entry_id:
//      z.undefined().optional().
//   5. Zod rejects client-provided adjustment_status — ADR-0010
//      Layer 2 defense. Schema has adjustment_status:
//      z.undefined().optional() so any value triggers ZodError.
//   6. Non-controller (USER_EXECUTIVE, executive role on HOLDING)
//      attempts adjusting post; withInvariants Invariant 4
//      surfaces PERMISSION_DENIED because the executive role does
//      not carry the journal_entry.adjust permission.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('adjustingEntry: three-branch discriminator + controller-only gate + three-layer reserved-state defense', () => {
  const db = adminClient();

  // Use 1300 Other Receivables + 2100 Intercompany Payables.
  // Both are HOLDING-template accounts unused by other integration
  // test files (grep-verified at Step 0: no test references either
  // account code). Keeps this file's postings out of the Cash /
  // Professional Fees / Share Capital / AP quadrant that
  // accountLedgerService, accountBalanceService, reportTrialBalance,
  // and reportProfitAndLoss exercise, avoiding parallel-execution
  // cross-file pollution.
  let otherReceivablesAccountId: string;
  let intercompanyPayablesAccountId: string;
  let periodId: string;

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

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    otherReceivablesAccountId = otherReceivables!.account_id;
    intercompanyPayablesAccountId = intercompanyPayables!.account_id;
    periodId = period!.period_id;
  });

  function buildAdjustingEntry(overrides: Record<string, unknown> = {}) {
    // DR Other Receivables (asset) / CR Intercompany Payables
    // (liability) — a period-end accrual pattern. Both accounts
    // are intentionally outside the Cash/Fees/Share Capital/AP
    // set exercised by other integration tests to avoid parallel-
    // execution cross-file pollution.
    return {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Test adjusting entry',
      source: 'manual' as const,
      entry_type: 'adjusting' as const,
      adjustment_reason: 'period-end intercompany accrual',
      lines: [
        {
          account_id: otherReceivablesAccountId,
          debit_amount: '250.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '250.0000',
          amount_cad: '250.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: intercompanyPayablesAccountId,
          debit_amount: '0.0000',
          credit_amount: '250.0000',
          currency: 'CAD',
          amount_original: '250.0000',
          amount_cad: '250.0000',
          fx_rate: '1.00000000',
        },
      ],
      ...overrides,
    };
  }

  it('controller posts valid adjusting entry; row carries entry_type=adjusting, adjustment_reason, adjustment_status=posted; audit action=journal_entry.adjust', async () => {
    const traceId = crypto.randomUUID();
    const ctx: ServiceContext = { ...controllerCtx, trace_id: traceId };

    const result = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.adjust' },
    )(buildAdjustingEntry(), ctx);

    expect(result.journal_entry_id).toBeDefined();
    expect(result.entry_number).toBeGreaterThan(0);

    const { data: row } = await db
      .from('journal_entries')
      .select('entry_type, adjustment_reason, adjustment_status')
      .eq('journal_entry_id', result.journal_entry_id)
      .single();

    expect(row?.entry_type).toBe('adjusting');
    expect(row?.adjustment_reason).toBe('period-end intercompany accrual');
    // ADR-0010 Layer 3 pin: service did NOT write adjustment_status;
    // DB DEFAULT 'posted' is the only Phase 1 value. Test verifies
    // the default fired.
    expect(row?.adjustment_status).toBe('posted');

    // Audit log carries the adjusting-branch action name.
    const { data: audit } = await db
      .from('audit_log')
      .select('action')
      .eq('trace_id', traceId)
      .eq('entity_id', result.journal_entry_id)
      .eq('action', 'journal_entry.adjust');
    expect(audit).toBeDefined();
    expect(audit!.length).toBeGreaterThanOrEqual(1);
  });

  it('Zod rejects empty adjustment_reason via .min(1)', async () => {
    await expect(
      withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.adjust' },
      )(
        buildAdjustingEntry({ adjustment_reason: '' }),
        freshCtx(),
      ),
    ).rejects.toThrow();
  });

  it('DB CHECK rejects whitespace-only adjustment_reason (Zod .min(1) is length-only; CHECK is length(trim(...)) > 0)', async () => {
    // '   ' passes Zod .min(1) because string length is 3. The DB
    // CHECK adjustment_reason_required_for_adjusting catches it via
    // length(trim(...)) > 0. Service's INSERT error handler throws
    // POST_FAILED with the underlying CHECK violation message.
    await expect(
      withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.adjust' },
      )(
        buildAdjustingEntry({ adjustment_reason: '   ' }),
        freshCtx(),
      ),
    ).rejects.toThrow(/POST_FAILED|adjustment_reason_required_for_adjusting|check/i);
  });

  it('Zod rejects adjustment + reversal combination (AdjustmentInputSchema rejects reverses_journal_entry_id)', async () => {
    // Post a valid entry first so reverses_journal_entry_id has a
    // real UUID to reference (the Zod rejection fires on the
    // "adjusting + reverses_*" combination, not on bogus UUID
    // shape — using a real one removes any ambiguity in the
    // failure mode).
    const original = await withInvariants(
      journalEntryService.post,
      { action: 'journal_entry.post' },
    )(
      {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: periodId,
        entry_date: new Date().toISOString().slice(0, 10),
        description: 'Original for combination-rejection test',
        source: 'manual' as const,
        lines: [
          {
            account_id: otherReceivablesAccountId,
            debit_amount: '100.0000',
            credit_amount: '0.0000',
            currency: 'CAD',
            amount_original: '100.0000',
            amount_cad: '100.0000',
            fx_rate: '1.00000000',
          },
          {
            account_id: intercompanyPayablesAccountId,
            debit_amount: '0.0000',
            credit_amount: '100.0000',
            currency: 'CAD',
            amount_original: '100.0000',
            amount_cad: '100.0000',
            fx_rate: '1.00000000',
          },
        ],
      },
      freshCtx(),
    );

    // Combination body: entry_type='adjusting' AND reverses_journal_entry_id set.
    // AdjustmentInputSchema has reverses_journal_entry_id:
    // z.undefined().optional() — the defined UUID fails parse.
    await expect(
      withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.adjust' },
      )(
        buildAdjustingEntry({
          reverses_journal_entry_id: original.journal_entry_id,
        }),
        freshCtx(),
      ),
    ).rejects.toThrow();
  });

  it('Zod rejects client-provided adjustment_status (ADR-0010 Layer 2 defense)', async () => {
    await expect(
      withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.adjust' },
      )(
        buildAdjustingEntry({ adjustment_status: 'pending_approval' }),
        freshCtx(),
      ),
    ).rejects.toThrow();
  });

  it('non-controller (executive) attempting adjusting post → PERMISSION_DENIED at withInvariants Invariant 4', async () => {
    // USER_EXECUTIVE has HOLDING membership with executive role
    // (seeded in dev.sql). Executive passes Invariant 3 (org
    // access) but fails Invariant 4 (canUserPerformAction) because
    // the executive role does NOT carry journal_entry.adjust in
    // role_permissions — only controller does (seeded by migration
    // 20240130000000_add_journal_entry_adjust_permission.sql).
    await expect(
      withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.adjust' },
      )(buildAdjustingEntry(), freshExecutiveCtx()),
    ).rejects.toThrow(/PERMISSION_DENIED/);
  });
});
