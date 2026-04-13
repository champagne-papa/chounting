// tests/integration/serviceMiddlewareAuthorization.test.ts
// Category A Floor Test 4: service middleware rejects unauthorized callers.
// Proves withInvariants() → canUserPerformAction() rejects before any DB write.

import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { InvariantViolationError } from '@/services/middleware/errors';

describe('Integration Test 4: service middleware rejects unauthorized callers', () => {
  const db = adminClient();
  let cashAccountId: string;
  let feesAccountId: string;
  let periodId: string;

  beforeAll(async () => {
    // Look up Holding Co accounts and period dynamically
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

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    cashAccountId = cash!.account_id;
    feesAccountId = fees!.account_id;
    periodId = period!.period_id;
  });

  it('throws InvariantViolationError before any DB write when the caller has no membership in the target org', async () => {
    // The AP Specialist user has membership in ORG_REAL_ESTATE ONLY.
    // Attempting a journal entry against ORG_HOLDING must be rejected
    // by withInvariants() → canUserPerformAction() BEFORE the transaction begins.
    const ctx: ServiceContext = {
      trace_id: crypto.randomUUID(),
      caller: {
        verified: true,
        user_id: SEED.USER_AP_SPECIALIST,
        email: 'ap@thebridge.local',
        org_ids: [SEED.ORG_REAL_ESTATE], // no membership in ORG_HOLDING
      },
      locale: 'en',
    };

    // Snapshot baseline row counts so we can prove nothing was written.
    const { count: beforeJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: beforeAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);

    const input = {
      org_id: SEED.ORG_HOLDING,
      fiscal_period_id: periodId,
      entry_date: new Date().toISOString().slice(0, 10),
      description: 'Test auth rejection',
      source: 'manual' as const,
      lines: [
        {
          account_id: cashAccountId,
          debit_amount: '100.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '100.0000',
          amount_cad: '100.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: feesAccountId,
          debit_amount: '0.0000',
          credit_amount: '100.0000',
          currency: 'CAD',
          amount_original: '100.0000',
          amount_cad: '100.0000',
          fx_rate: '1.00000000',
        },
      ],
    };

    await expect(
      withInvariants(journalEntryService.post, { action: 'journal_entry.post' })(input, ctx)
    ).rejects.toThrow(InvariantViolationError);

    // Verify nothing was written — the check ran before the transaction.
    const { count: afterJournals } = await db
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);
    const { count: afterAudit } = await db
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING);

    expect(afterJournals).toBe(beforeJournals);
    expect(afterAudit).toBe(beforeAudit);
  });
});
