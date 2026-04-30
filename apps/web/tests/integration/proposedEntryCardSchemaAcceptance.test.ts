// tests/integration/proposedEntryCardSchemaAcceptance.test.ts
// Phase 1.2 Session 7 Commit 2 — ProposedEntryCardSchema
// acceptance: valid card parses, strict fields reject extras,
// loose reason_params accepts any record, reciprocal_entry_preview
// undefined passes, required_action literal rejects other values.

import { describe, it, expect } from 'vitest';
import { ProposedEntryCardSchema } from '@/shared/schemas/accounting/proposedEntryCard.schema';

const validCard = {
  org_id: '11111111-1111-1111-1111-111111111111',
  org_name: 'Holding Co',
  transaction_type: 'journal_entry' as const,
  entry_date: '2026-04-19',
  description: 'Office supplies from Acme',
  vendor_name: 'Acme Corp',
  matched_rule_label: 'Vendor → Expense',
  lines: [
    {
      account_code: '1000',
      account_name: 'Cash',
      debit: '0.0000',
      credit: '100.0000',
      currency: 'CAD',
    },
    {
      account_code: '6000',
      account_name: 'Office Supplies',
      debit: '100.0000',
      credit: '0.0000',
      currency: 'CAD',
      description: 'Printer paper',
      tax_code: 'HST_ON',
    },
  ],
  intercompany_flag: false,
  confidence_score: 0.92,
  policy_outcome: {
    required_action: 'approve' as const,
    reason_template_id: 'proposed_entry.why.rule_matched',
    reason_params: { label: 'Vendor → Expense' },
  },
  idempotency_key: '22222222-2222-2222-2222-222222222222',
  dry_run_entry_id: '33333333-3333-3333-3333-333333333333',
  trace_id: '44444444-4444-4444-4444-444444444444',
};

describe('ProposedEntryCardSchema — acceptance', () => {
  it('accepts a fully valid card', () => {
    const parsed = ProposedEntryCardSchema.parse(validCard);
    expect(parsed.org_name).toBe('Holding Co');
    expect(parsed.lines).toHaveLength(2);
    expect(parsed.policy_outcome.required_action).toBe('approve');
  });

  it('accepts a card with reciprocal_entry_preview undefined', () => {
    const parsed = ProposedEntryCardSchema.parse(validCard);
    expect(parsed.reciprocal_entry_preview).toBeUndefined();
  });

  it('accepts a card with reciprocal_entry_preview: any unknown value', () => {
    // Loose per sub-brief — no speculation about Phase 2 shape.
    const withPreview = { ...validCard, reciprocal_entry_preview: { anything: [1, 2, 3] } };
    expect(() => ProposedEntryCardSchema.parse(withPreview)).not.toThrow();
  });

  it('accepts policy_outcome.reason_params as any loose record', () => {
    const looseParams = {
      ...validCard,
      policy_outcome: {
        ...validCard.policy_outcome,
        reason_params: { anything: 1, at: 'all', nested: { ok: true } },
      },
    };
    expect(() => ProposedEntryCardSchema.parse(looseParams)).not.toThrow();
  });

  it('rejects extra fields on the card root (.strict())', () => {
    expect(() =>
      ProposedEntryCardSchema.parse({ ...validCard, extraneous: true }),
    ).toThrow();
  });

  it('rejects extra fields on a line (.strict())', () => {
    const withExtraLine = {
      ...validCard,
      lines: [
        validCard.lines[0],
        { ...validCard.lines[1], bogus: 'nope' },
      ],
    };
    expect(() => ProposedEntryCardSchema.parse(withExtraLine)).toThrow();
  });

  it('rejects extra fields on policy_outcome (.strict())', () => {
    const withExtraPolicy = {
      ...validCard,
      policy_outcome: { ...validCard.policy_outcome, extra: 'nope' },
    };
    expect(() => ProposedEntryCardSchema.parse(withExtraPolicy)).toThrow();
  });

  it('rejects required_action other than the "approve" literal', () => {
    const withWrongAction = {
      ...validCard,
      policy_outcome: {
        ...validCard.policy_outcome,
        required_action: 'auto_post' as unknown as 'approve',
      },
    };
    expect(() => ProposedEntryCardSchema.parse(withWrongAction)).toThrow();
  });

  it('rejects invalid UUID on idempotency_key', () => {
    expect(() =>
      ProposedEntryCardSchema.parse({ ...validCard, idempotency_key: 'not-a-uuid' }),
    ).toThrow();
  });

  it('rejects fewer than 2 lines', () => {
    expect(() =>
      ProposedEntryCardSchema.parse({ ...validCard, lines: [validCard.lines[0]] }),
    ).toThrow();
  });

  it('rejects malformed MoneyAmount on debit/credit', () => {
    const badMoney = {
      ...validCard,
      lines: [
        { ...validCard.lines[0], debit: '100.999999' }, // too many decimals
        validCard.lines[1],
      ],
    };
    expect(() => ProposedEntryCardSchema.parse(badMoney)).toThrow();
  });

  it('rejects unknown transaction_type', () => {
    expect(() =>
      ProposedEntryCardSchema.parse({ ...validCard, transaction_type: 'unknown' }),
    ).toThrow();
  });
});
