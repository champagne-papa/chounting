// tests/fixtures/anthropic/entry8FirstAttempt.ts
// OI-2 fix-stack handshake Soft 8 — canonical Entry 8 replay
// fixtures. Source prompt: docs/07_governance/ec-2-prompt-set.md
// lines 199-208 (the original failing form, before any
// explicit-date recovery the operator added live during C6 EC-2).
//
// Two factories instead of static fixtures because the runtime
// resolves "today" against the actual system clock — the
// canonical spec assumed today=2026-04-20 but the runtime emits
// whatever the calendar date actually is in the request's tz.
// Tests compute the expected resolved date and stamp it onto
// both fixtures.
//
// Fixture 1 (entry8PostTurn) omits org_id and idempotency_key
// from the postJournalEntry input — the orchestrator's Site 1
// pre-Zod injection (orchestrator/index.ts:408-431) supplies
// both before validation. Fixture 2 (entry8RespondTurn) emits a
// ProposedEntryCard with placeholder-shaped UUIDs that the
// orchestrator's Site 2 post-fill (orchestrator/index.ts:845-864)
// overwrites with the real session/ctx-derived values.

import type Anthropic from '@anthropic-ai/sdk';
import { makeMessage } from './makeMessage';

// Placeholder UUID echoed by the model on dry_run_entry_id. The
// orchestrator does not cross-check this field; the value's
// presence + UUID shape is what matters for ProposedEntryCardSchema.
const FIXTURE_DRY_RUN_ENTRY_ID = '55555555-5555-5555-5555-555555555599';

/**
 * Fixture 1 — assistant turn containing the postJournalEntry
 * tool_use the agent SHOULD emit when the temporal-context block
 * carries the resolved entry_date. Omits org_id and
 * idempotency_key (orchestrator's Site 1 pre-Zod injection
 * supplies both).
 */
export function entry8PostTurn(
  resolvedDate: string,
  fiscalPeriodId: string,
  accountIdCash: string,
  accountIdUnearnedRevenue: string,
): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_post_soft8_entry8',
        name: 'postJournalEntry',
        input: {
          fiscal_period_id: fiscalPeriodId,
          entry_date: resolvedDate,
          description:
            'Client Yonge Dental — six-month retainer prepayment, May 1 start',
          source: 'agent',
          dry_run: true,
          lines: [
            {
              account_id: accountIdCash,
              debit_amount: '12000.00',
              credit_amount: '0.00',
              currency: 'CAD',
              amount_original: '12000.00',
              amount_cad: '12000.0000',
              fx_rate: '1.0000',
              tax_code_id: null,
            },
            {
              account_id: accountIdUnearnedRevenue,
              debit_amount: '0.00',
              credit_amount: '12000.00',
              currency: 'CAD',
              amount_original: '12000.00',
              amount_cad: '12000.0000',
              fx_rate: '1.0000',
              tax_code_id: null,
            },
          ],
        },
        caller: { type: 'direct' },
      },
    ],
    'tool_use',
  );
}

/**
 * Fixture 2 — assistant turn containing the respondToUser
 * tool_use that wraps the ProposedEntryCard. The card emits
 * placeholder UUIDs for org_id/idempotency_key/trace_id; Site 2
 * post-fill overwrites them with the real session/ctx values
 * before returning to the caller. params.amount mirrors the
 * canonical Entry 8 figure ($12,000).
 */
export function entry8RespondTurn(
  resolvedDate: string,
): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_respond_soft8_entry8',
        name: 'respondToUser',
        input: {
          template_id: 'agent.entry.proposed',
          params: { amount: '12000.00' },
          canvas_directive: {
            type: 'proposed_entry_card',
            card: {
              org_name: 'The Bridge Real Estate Entity DEV',
              transaction_type: 'journal_entry',
              entry_date: resolvedDate,
              description:
                'Client Yonge Dental — six-month retainer prepayment, May 1 start',
              lines: [
                {
                  account_code: '1000',
                  account_name: 'Cash and Cash Equivalents',
                  debit: '12000.00',
                  credit: '0.00',
                  currency: 'CAD',
                },
                {
                  account_code: '2400',
                  account_name: 'Unearned Revenue',
                  debit: '0.00',
                  credit: '12000.00',
                  currency: 'CAD',
                },
              ],
              intercompany_flag: false,
              confidence_score: 0.95,
              policy_outcome: {
                required_action: 'approve',
                reason_template_id: 'policy.agent.propose',
                reason_params: {},
              },
              dry_run_entry_id: FIXTURE_DRY_RUN_ENTRY_ID,
            },
          },
        },
        caller: { type: 'direct' },
      },
    ],
    'tool_use',
  );
}
