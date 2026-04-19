// tests/fixtures/anthropic/validationRetryTrigger.ts
// Fixture C — Zod validation retry. Turn 1: postJournalEntry
// with a malformed entry_date. Turn 2: corrected postJournalEntry
// followed by a respondToUser tool_use in the same content
// array.
//
// Queue seed: [validationFailTurn, validationRetrySuccessTurn].

import type Anthropic from '@anthropic-ai/sdk';
import { SEED } from '../../setup/testDb';
import { makeMessage } from './makeMessage';

// Corresponds to the first fiscal period row for SEED.ORG_HOLDING
// seeded via dev.sql.
const HOLDING_FISCAL_PERIOD_ID = '33333333-3333-3333-3333-333333333301';
const HOLDING_ACCOUNT_CASH = '44444444-4444-4444-4444-444444444401';
const HOLDING_ACCOUNT_REVENUE = '44444444-4444-4444-4444-444444444402';
const IDEMPOTENCY_KEY_C = '00000000-0000-0000-0000-0000000000c1';

export const validationFailTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_post_C1',
      name: 'postJournalEntry',
      input: {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: HOLDING_FISCAL_PERIOD_ID,
        entry_date: 'not-a-date', // fails Zod z.string().date()
        description: 'Test entry',
        source: 'agent',
        dry_run: true,
        idempotency_key: IDEMPOTENCY_KEY_C,
        lines: [],
      },
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);

export const validationRetrySuccessTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_post_C2',
      name: 'postJournalEntry',
      input: {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id: HOLDING_FISCAL_PERIOD_ID,
        entry_date: '2026-04-18',
        description: 'Test entry',
        source: 'agent',
        dry_run: true,
        idempotency_key: IDEMPOTENCY_KEY_C,
        lines: [
          {
            account_id: HOLDING_ACCOUNT_CASH,
            debit_amount: '100.00',
            credit_amount: '0.00',
            currency: 'CAD',
            amount_original: '100.00',
            amount_cad: '100.0000',
            fx_rate: '1.0000',
            tax_code_id: null,
          },
          {
            account_id: HOLDING_ACCOUNT_REVENUE,
            debit_amount: '0.00',
            credit_amount: '100.00',
            currency: 'CAD',
            amount_original: '100.00',
            amount_cad: '100.0000',
            fx_rate: '1.0000',
            tax_code_id: null,
          },
        ],
      },
      caller: { type: 'direct' },
    },
    {
      type: 'tool_use',
      id: 'toolu_respond_C',
      name: 'respondToUser',
      input: {
        template_id: 'agent.entry.proposed',
        params: { amount: '100.00' },
      },
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);
