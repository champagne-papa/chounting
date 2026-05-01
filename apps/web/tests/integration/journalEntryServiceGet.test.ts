// tests/integration/journalEntryServiceGet.test.ts
//
// LT-02(a) — journalEntryService.get post-S29b-wrapped coverage
// gap closure. Path C arc, S31 sub-item (a) per AMENDMENT 1
// narrow scope.
//
// Closes the S29b pre-flight pre-5 finding: journalEntryService.get
// became withInvariants-wrapped at S29b without dedicated
// integration coverage of the same-org / cross-org / not-found
// branches. CA-61 (apiAgentConfirmIdempotent) substantively covers
// the full path → service → RPC composition through agent confirm
// flow with idempotency replay; this file pins the narrow service-
// level surface that S29b's wrap exposed:
//
//   (i)   same-org caller + valid journal_entry_id → returns the
//         expected JournalEntryDetail shape (org_id matches; lines
//         populated; reversed_by/reverses surfaces hydrated).
//   (ii)  cross-org caller (caller has org_ids = [ORG_HOLDING];
//         journal_entry_id belongs to ORG_REAL_ESTATE; input.org_id
//         passed as ORG_HOLDING so withInvariants does NOT short-
//         circuit on ORG_ACCESS_DENIED) → ServiceError('NOT_FOUND')
//         per existence-leak-prevention contract.
//   (iii) non-existent UUID → ServiceError('NOT_FOUND').
//
// Soft 9 runtime-lookup-by-natural-key pattern applied — account
// IDs resolved at fixture-setup time via account_code lookups; no
// hard-coded account UUIDs.
//
// Out of scope per AMENDMENT 1: full path → service → RPC
// integration (CA-61 already covers); reactivate-route fixture-
// touching (orthogonal carry-forward per S30 closeout NOTE
// element 12).

import { describe, it, expect, beforeAll } from 'vitest';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { ServiceError } from '@/services/errors/ServiceError';
import { adminClient } from '@/db/adminClient';
import { makeTestContext } from '../setup/makeTestContext';
import { SEED } from '../setup/testDb';

interface OrgFixture {
  fiscalPeriodId: string;
  periodStart: string;
  cashId: string;
  revenueId: string;
}

async function loadFixture(orgId: string): Promise<OrgFixture> {
  const db = adminClient();
  const { data: openPeriod } = await db
    .from('fiscal_periods')
    .select('period_id, start_date')
    .eq('org_id', orgId)
    .eq('is_locked', false)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!openPeriod) throw new Error(`Seed missing open fiscal period for ${orgId}`);

  const { data: rows } = await db
    .from('chart_of_accounts')
    .select('account_id, account_type')
    .eq('org_id', orgId);
  const cash = (rows ?? []).find((r) => r.account_type === 'asset');
  const revenue = (rows ?? []).find((r) => r.account_type === 'revenue');
  if (!cash || !revenue) {
    throw new Error(`Seed CoA missing asset/revenue rows for ${orgId}`);
  }

  return {
    fiscalPeriodId: openPeriod.period_id as string,
    periodStart: openPeriod.start_date as string,
    cashId: cash.account_id as string,
    revenueId: revenue.account_id as string,
  };
}

describe('LT-02(a): journalEntryService.get post-S29b-wrapped coverage', () => {
  let holdingFixture: OrgFixture;
  let realEstateFixture: OrgFixture;
  let holdingEntryId: string;
  let realEstateEntryId: string;

  beforeAll(async () => {
    holdingFixture = await loadFixture(SEED.ORG_HOLDING);
    realEstateFixture = await loadFixture(SEED.ORG_REAL_ESTATE);

    // Pre-seed entries via journalEntryService.post() so the entries
    // exercise the full mutation path (triggers, audit_log row,
    // withInvariants wrap on post). Each entry uses a unique
    // idempotency_key for run-isolation.
    const holdingSetupCtx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const holdingResult = await journalEntryService.post(
      {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: holdingFixture.fiscalPeriodId,
        entry_date: holdingFixture.periodStart,
        description: 'LT-02(a) holding fixture entry',
        idempotency_key: crypto.randomUUID(),
        source: 'manual',
        lines: [
          {
            account_id: holdingFixture.cashId,
            debit_amount: '100.0000',
            credit_amount: '0.0000',
            currency: 'CAD',
            amount_original: '100.0000',
            amount_cad: '100.0000',
            fx_rate: '1.00000000',
          },
          {
            account_id: holdingFixture.revenueId,
            debit_amount: '0.0000',
            credit_amount: '100.0000',
            currency: 'CAD',
            amount_original: '100.0000',
            amount_cad: '100.0000',
            fx_rate: '1.00000000',
          },
        ],
      },
      holdingSetupCtx,
    );
    holdingEntryId = holdingResult.journal_entry_id;

    const realEstateSetupCtx = makeTestContext({
      user_id: SEED.USER_AP_SPECIALIST,
      org_ids: [SEED.ORG_REAL_ESTATE],
    });
    const realEstateResult = await journalEntryService.post(
      {
        org_id: SEED.ORG_REAL_ESTATE,
        fiscal_period_id: realEstateFixture.fiscalPeriodId,
        entry_date: realEstateFixture.periodStart,
        description: 'LT-02(a) real-estate fixture entry',
        idempotency_key: crypto.randomUUID(),
        source: 'manual',
        lines: [
          {
            account_id: realEstateFixture.cashId,
            debit_amount: '50.0000',
            credit_amount: '0.0000',
            currency: 'CAD',
            amount_original: '50.0000',
            amount_cad: '50.0000',
            fx_rate: '1.00000000',
          },
          {
            account_id: realEstateFixture.revenueId,
            debit_amount: '0.0000',
            credit_amount: '50.0000',
            currency: 'CAD',
            amount_original: '50.0000',
            amount_cad: '50.0000',
            fx_rate: '1.00000000',
          },
        ],
      },
      realEstateSetupCtx,
    );
    realEstateEntryId = realEstateResult.journal_entry_id;
  });

  it('(i) same-org caller + valid journal_entry_id → returns JournalEntryDetail', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const detail = await journalEntryService.get(
      { org_id: SEED.ORG_HOLDING, journal_entry_id: holdingEntryId },
      ctx,
    );

    expect(detail.journal_entry_id).toBe(holdingEntryId);
    expect(detail.org_id).toBe(SEED.ORG_HOLDING);
    expect(detail.description).toBe('LT-02(a) holding fixture entry');
    expect(detail.source).toBe('manual');
    expect(detail.fiscal_period_id).toBe(holdingFixture.fiscalPeriodId);
    expect(detail.fiscal_periods).not.toBeNull();
    expect(detail.fiscal_periods!.period_id).toBe(holdingFixture.fiscalPeriodId);

    // Lines hydrated and balanced (DR 100 / CR 100).
    expect(detail.journal_lines).toHaveLength(2);
    const debitLine = detail.journal_lines.find(
      (l) => l.account_id === holdingFixture.cashId,
    );
    const creditLine = detail.journal_lines.find(
      (l) => l.account_id === holdingFixture.revenueId,
    );
    expect(debitLine).toBeDefined();
    expect(creditLine).toBeDefined();
    expect(debitLine!.debit_amount).toBe('100.0000');
    expect(creditLine!.credit_amount).toBe('100.0000');

    // Fresh entry: not reversed; not a reversal.
    expect(detail.reversed_by).toBeNull();
    expect(detail.reverses).toBeNull();
  });

  it('(ii) cross-org caller (entry belongs to foreign org) → ServiceError(NOT_FOUND)', async () => {
    // Caller is in ORG_HOLDING; passes input.org_id matching their
    // own membership (so withInvariants does NOT short-circuit on
    // ORG_ACCESS_DENIED). The journal_entry_id, however, belongs
    // to ORG_REAL_ESTATE. The inner .in('org_id', ctx.caller.org_ids)
    // filter returns zero rows; the service throws NOT_FOUND per
    // the existence-leak-prevention contract (caller cannot probe
    // foreign-org entry existence by guessing IDs).
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });

    await expect(
      journalEntryService.get(
        { org_id: SEED.ORG_HOLDING, journal_entry_id: realEstateEntryId },
        ctx,
      ),
    ).rejects.toThrow(ServiceError);

    await expect(
      journalEntryService.get(
        { org_id: SEED.ORG_HOLDING, journal_entry_id: realEstateEntryId },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('(iii) non-existent journal_entry_id → ServiceError(NOT_FOUND)', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const phantomId = '00000000-0000-0000-0000-000000000000';

    await expect(
      journalEntryService.get(
        { org_id: SEED.ORG_HOLDING, journal_entry_id: phantomId },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
