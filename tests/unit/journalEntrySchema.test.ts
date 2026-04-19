import { describe, it, expect } from 'vitest';
import {
  PostJournalEntryInputSchema,
  ReversalInputSchema,
} from '@/shared/schemas/accounting/journalEntry.schema';

const validLine = {
  account_id: '00000000-0000-0000-0000-000000000001',
  debit_amount: '100.0000',
  credit_amount: '0.0000',
  currency: 'CAD',
  amount_original: '100.0000',
  amount_cad: '100.0000',
  fx_rate: '1.00000000',
};

const offsetLine = {
  account_id: '00000000-0000-0000-0000-000000000002',
  debit_amount: '0.0000',
  credit_amount: '100.0000',
  currency: 'CAD',
  amount_original: '100.0000',
  amount_cad: '100.0000',
  fx_rate: '1.00000000',
};

const baseEntry = {
  org_id: '11111111-1111-1111-1111-111111111111',
  fiscal_period_id: '22222222-2222-2222-2222-222222222222',
  entry_date: '2026-01-15',
  description: 'Test entry',
  source: 'manual' as const,
  lines: [validLine, offsetLine],
};

describe('PostJournalEntryInputSchema', () => {
  it('accepts a valid balanced entry', () => {
    const result = PostJournalEntryInputSchema.parse(baseEntry);
    expect(result.description).toBe('Test entry');
  });

  it('rejects unbalanced entry', () => {
    const unbalanced = {
      ...baseEntry,
      lines: [
        validLine,
        {
          ...offsetLine,
          credit_amount: '99.0000',
          amount_original: '99.0000',
          amount_cad: '99.0000',
        },
      ],
    };
    expect(() => PostJournalEntryInputSchema.parse(unbalanced)).toThrow(
      /debits must equal/i,
    );
  });

  it('rejects fewer than 2 lines', () => {
    const oneLine = { ...baseEntry, lines: [validLine] };
    expect(() => PostJournalEntryInputSchema.parse(oneLine)).toThrow();
  });

  it('rejects reversal fields on create input', () => {
    const withReversal = {
      ...baseEntry,
      reverses_journal_entry_id: '33333333-3333-3333-3333-333333333333',
    };
    expect(() => PostJournalEntryInputSchema.parse(withReversal)).toThrow();
  });

  // Phase 1.2 migration (Session 2): the Phase 1.1 'not implemented'
  // reject guards on source='agent' and dry_run=true have been
  // removed. The sibling idempotencyRefinement is now runtime-
  // reachable and pairs bidirectionally with the database CHECK
  // constraint idempotency_required_for_agent (migration 001).

  it('accepts agent source with idempotency_key', () => {
    const agentEntry = {
      ...baseEntry,
      source: 'agent' as const,
      idempotency_key: '00000000-0000-0000-0000-00000000a001',
    };
    const result = PostJournalEntryInputSchema.parse(agentEntry);
    expect(result.source).toBe('agent');
    expect(result.idempotency_key).toBe('00000000-0000-0000-0000-00000000a001');
  });

  it('rejects agent source without idempotency_key', () => {
    const agentEntry = { ...baseEntry, source: 'agent' as const };
    expect(() => PostJournalEntryInputSchema.parse(agentEntry)).toThrow(
      /idempotency_key is required/i,
    );
  });

  it('accepts dry_run: true', () => {
    const dryRun = {
      ...baseEntry,
      source: 'agent' as const,
      idempotency_key: '00000000-0000-0000-0000-00000000a002',
      dry_run: true,
    };
    const result = PostJournalEntryInputSchema.parse(dryRun);
    expect(result.dry_run).toBe(true);
  });
});

describe('ReversalInputSchema', () => {
  it('accepts a valid reversal entry', () => {
    const reversal = {
      ...baseEntry,
      reverses_journal_entry_id: '33333333-3333-3333-3333-333333333333',
      reversal_reason: 'Duplicate entry',
    };
    const result = ReversalInputSchema.parse(reversal);
    expect(result.reversal_reason).toBe('Duplicate entry');
  });

  it('rejects missing reverses_journal_entry_id', () => {
    const noRef = {
      ...baseEntry,
      reversal_reason: 'Some reason',
    };
    expect(() => ReversalInputSchema.parse(noRef)).toThrow();
  });

  it('rejects empty reversal_reason', () => {
    const reversal = {
      ...baseEntry,
      reverses_journal_entry_id: '33333333-3333-3333-3333-333333333333',
      reversal_reason: '',
    };
    expect(() => ReversalInputSchema.parse(reversal)).toThrow();
  });
});

describe('JournalLineSchema validation', () => {
  it('rejects a line where both debit and credit are positive', () => {
    const bothPositive = {
      ...baseEntry,
      lines: [
        {
          ...validLine,
          debit_amount: '50.0000',
          credit_amount: '50.0000',
          amount_original: '100.0000',
          amount_cad: '100.0000',
        },
        offsetLine,
      ],
    };
    expect(() => PostJournalEntryInputSchema.parse(bothPositive)).toThrow();
  });

  it('rejects a line where both debit and credit are zero', () => {
    const bothZero = {
      ...baseEntry,
      lines: [
        {
          ...validLine,
          debit_amount: '0.0000',
          credit_amount: '0.0000',
          amount_original: '0.0000',
          amount_cad: '0.0000',
        },
        offsetLine,
      ],
    };
    expect(() => PostJournalEntryInputSchema.parse(bothZero)).toThrow();
  });

  it('rejects amount_original mismatch', () => {
    const mismatch = {
      ...baseEntry,
      lines: [
        {
          ...validLine,
          amount_original: '99.0000', // should be 100.0000 = debit + credit
        },
        offsetLine,
      ],
    };
    expect(() => PostJournalEntryInputSchema.parse(mismatch)).toThrow();
  });

  it('rejects amount_cad mismatch with fx_rate', () => {
    const fxMismatch = {
      ...baseEntry,
      lines: [
        {
          ...validLine,
          fx_rate: '1.50000000',
          amount_cad: '100.0000', // should be 150.0000 = 100 * 1.5
        },
        offsetLine,
      ],
    };
    expect(() => PostJournalEntryInputSchema.parse(fxMismatch)).toThrow();
  });
});
