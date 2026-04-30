// tests/integration/journalEntryInvalidPeriod.test.ts
//
// Phase 1.1 mutation-coverage gap 2 (Mutation 2 — invalid fiscal_period_id).
//
// REGRESSION PINNING, NOT CONTRACT PINNING.
//
// The spec (docs/02_specs/ledger_truth_model.md, docs/02_specs/invariants.md)
// is silent on the case "fiscal_period_id is a syntactically valid UUID
// that does not match any row in fiscal_periods" as of 2026-04-30. There is
// no dedicated invariant ID for this case; INV-LEDGER-002 covers locked
// periods only. This test pins the current service-layer behavior — that
// such an input rejects with ServiceError code POST_FAILED and writes no
// rows — as regression coverage. If future spec work defines a canonical
// invariant or a more specific error code for this case, this test's
// assertions may need to be updated. Until then, treat the assertions as
// "this is what the system does today," not as "this is what the spec
// requires."
//
// The DB-level FK constraint on journal_entries.fiscal_period_id
// (REFERENCES fiscal_periods(period_id), per
// supabase/migrations/20240101000000_initial_schema.sql) is the second
// line of defense; this test exercises the upstream service-layer path
// per the layer-pinning rationale used for INV-REVERSAL-001 step 1
// (clean typed error upstream of the database).

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('journal entry post rejects non-existent fiscal_period_id (regression pinning)', () => {
  const db = adminClient();
  let cashAccountId: string;
  let feesAccountId: string;
  let bogusPeriodId: string;

  const ctx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
    },
    locale: 'en',
  };

  function freshCtx(): ServiceContext {
    return { ...ctx, trace_id: crypto.randomUUID() };
  }

  beforeAll(async () => {
    const { data: cash } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();
    const { data: fees } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '4000')
      .single();
    cashAccountId = cash!.account_id;
    feesAccountId = fees!.account_id;

    // Generate a syntactically valid UUID and confirm no fiscal_periods
    // row matches it. This guards against the cosmically improbable but
    // documentation-relevant case of a UUID collision with a real seed.
    bogusPeriodId = crypto.randomUUID();
    const { data: collision } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('period_id', bogusPeriodId)
      .maybeSingle();
    if (collision) {
      throw new Error(
        `bogusPeriodId ${bogusPeriodId} unexpectedly collides with a seeded fiscal_periods row — regenerate`,
      );
    }
  });

  function buildBalancedEntry() {
    return {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: bogusPeriodId, // valid UUID, no matching row
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Invalid fiscal_period_id test entry',
      source: 'manual' as const,
      lines: [
        {
          account_id: cashAccountId,
          debit_amount: '300.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '300.0000',
          amount_cad: '300.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: feesAccountId,
          debit_amount: '0.0000',
          credit_amount: '300.0000',
          currency: 'CAD',
          amount_original: '300.0000',
          amount_cad: '300.0000',
          fx_rate: '1.00000000',
        },
      ],
    };
  }

  it('rejects with POST_FAILED and writes no rows when fiscal_period_id refers to a non-existent period', async () => {
    const { count: beforeJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: beforeAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: beforeLines } = await db
      .from('journal_lines')
      .select('*', { count: 'exact', head: true });

    let caught: unknown;
    try {
      await withInvariants(
        journalEntryService.post,
        { action: 'journal_entry.post' },
      )(buildBalancedEntry(), freshCtx());
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ServiceError);
    expect((caught as ServiceError).code).toBe('POST_FAILED');

    const { count: afterJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: afterAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: afterLines } = await db
      .from('journal_lines')
      .select('*', { count: 'exact', head: true });

    expect(afterJournals).toBe(beforeJournals);
    expect(afterAudit).toBe(beforeAudit);
    expect(afterLines).toBe(beforeLines);
  });
});
