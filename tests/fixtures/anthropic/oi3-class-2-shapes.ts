// tests/fixtures/anthropic/oi3-class-2-shapes.ts
// OI-3 Part 4 — Soft 9 fixture factories. Six fixtures exercise the
// four canvas_directive emission paths the §4a/§4b/§4c prompt-
// surgery teaches the model:
//   1. Productive (Entry 12 shape) — Cash + Consulting Revenue.
//   2. Tentative (Entry 15 shape) — Allowance write-off (Allowance
//      for Doubtful Accounts ↓ AR ↓). Card carries tentative: true
//      to exercise the §3c (a) flag shipped at 22b63c4.
//   3. No-directive — non-proposal clarification, agent.response
//      .natural template. No paired postTurn (no postJournalEntry
//      call).
//   4. Malformed-directive — proposed_entry_card with lines.min(2)
//      violation (single line). The respondToUser tool-input
//      wrapper Zod check rejects it (upstream of Site 2's
//      defense-in-depth parse()) after Site 1's ai_actions row
//      insert — the Class 2 orphan signature §4a/§4b/§4c defends
//      against.
//
// Pattern parallels Soft 8 (entry8FirstAttempt.ts):
//   - postTurn factories omit org_id and idempotency_key from the
//     postJournalEntry input (Site 1 pre-Zod inject supplies both
//     before validation).
//   - respondTurn factories use a placeholder dry_run_entry_id;
//     Site 2 post-fill overwrites org_id, idempotency_key, and
//     trace_id with real session/ctx values pre-validation.
//
// P2 runtime lookup: account UUIDs and period_id arrive as
// parameters. Test-side resolves them by natural key
// (org_id + account_code, org_id + name + is_locked) from the seed
// at beforeEach. Factory signatures stay parameter-pass shape so
// the divergence from Soft 8 is test-side only.

import type Anthropic from '@anthropic-ai/sdk';
import { makeMessage } from './makeMessage';

const FIXTURE_DRY_RUN_ENTRY_ID = '66666666-6666-6666-6666-666666666601';

/**
 * Entry 12 — productive double-entry: debit Cash, credit Consulting
 * Revenue. Canonical productive shape; agent emits agent.entry
 * .proposed + canvas_directive without tentative.
 */
export function entry12ProductivePostTurn(
  resolvedDate: string,
  fiscalPeriodId: string,
  accountIdCash: string,
  accountIdRevenue: string,
): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_post_soft9_e12',
        name: 'postJournalEntry',
        input: {
          fiscal_period_id: fiscalPeriodId,
          entry_date: resolvedDate,
          description: 'Consulting fee — paid in cash',
          source: 'agent',
          dry_run: true,
          lines: [
            {
              account_id: accountIdCash,
              debit_amount: '1500.00',
              credit_amount: '0.00',
              currency: 'CAD',
              amount_original: '1500.00',
              amount_cad: '1500.0000',
              fx_rate: '1.0000',
              tax_code_id: null,
            },
            {
              account_id: accountIdRevenue,
              debit_amount: '0.00',
              credit_amount: '1500.00',
              currency: 'CAD',
              amount_original: '1500.00',
              amount_cad: '1500.0000',
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

export function entry12ProductiveRespondTurn(
  resolvedDate: string,
): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_respond_soft9_e12',
        name: 'respondToUser',
        input: {
          template_id: 'agent.entry.proposed',
          params: { amount: '1500.00' },
          canvas_directive: {
            type: 'proposed_entry_card',
            card: {
              org_name: 'Bridge Real Estate Entity (DEV)',
              transaction_type: 'journal_entry',
              entry_date: resolvedDate,
              description: 'Consulting fee — paid in cash',
              lines: [
                {
                  account_code: '1000',
                  account_name: 'Cash and Cash Equivalents',
                  debit: '1500.00',
                  credit: '0.00',
                  currency: 'CAD',
                },
                {
                  account_code: '4300',
                  account_name: 'Consulting Revenue',
                  debit: '0.00',
                  credit: '1500.00',
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

/**
 * Entry 15 — tentative allowance write-off: debit Allowance for
 * Doubtful Accounts, credit Accounts Receivable. The accounting
 * treatment is ambiguous (which receivable, what amount) — agent
 * emits its best-effort values and sets tentative: true on the
 * card per §3c (a) shipped at 22b63c4.
 */
export function entry15TentativePostTurn(
  resolvedDate: string,
  fiscalPeriodId: string,
  accountIdAllowance: string,
  accountIdReceivable: string,
): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_post_soft9_e15',
        name: 'postJournalEntry',
        input: {
          fiscal_period_id: fiscalPeriodId,
          entry_date: resolvedDate,
          description: 'Allowance write-off — uncollectible receivables',
          source: 'agent',
          dry_run: true,
          lines: [
            {
              account_id: accountIdAllowance,
              debit_amount: '1000.00',
              credit_amount: '0.00',
              currency: 'CAD',
              amount_original: '1000.00',
              amount_cad: '1000.0000',
              fx_rate: '1.0000',
              tax_code_id: null,
            },
            {
              account_id: accountIdReceivable,
              debit_amount: '0.00',
              credit_amount: '1000.00',
              currency: 'CAD',
              amount_original: '1000.00',
              amount_cad: '1000.0000',
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

export function entry15TentativeRespondTurn(
  resolvedDate: string,
): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_respond_soft9_e15',
        name: 'respondToUser',
        input: {
          template_id: 'agent.entry.proposed',
          params: { amount: '1000.00' },
          canvas_directive: {
            type: 'proposed_entry_card',
            card: {
              org_name: 'Bridge Real Estate Entity (DEV)',
              transaction_type: 'journal_entry',
              entry_date: resolvedDate,
              description: 'Allowance write-off — uncollectible receivables',
              lines: [
                {
                  account_code: '1610',
                  account_name: 'Allowance for Doubtful Accounts',
                  debit: '1000.00',
                  credit: '0.00',
                  currency: 'CAD',
                },
                {
                  account_code: '1600',
                  account_name: 'Accounts Receivable',
                  debit: '0.00',
                  credit: '1000.00',
                  currency: 'CAD',
                },
              ],
              intercompany_flag: false,
              confidence_score: 0.65,
              policy_outcome: {
                required_action: 'approve',
                reason_template_id: 'policy.agent.propose',
                reason_params: {},
              },
              dry_run_entry_id: FIXTURE_DRY_RUN_ENTRY_ID,
              tentative: true,
            },
          },
        },
        caller: { type: 'direct' },
      },
    ],
    'tool_use',
  );
}

/**
 * No-directive — non-proposal clarification turn. Agent answers
 * a "why" question with agent.response.natural; no postTurn since
 * no postJournalEntry call. No paired card; no ai_actions row
 * written this turn.
 */
export function noDirectiveRespondTurn(): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_respond_soft9_no_directive',
        name: 'respondToUser',
        input: {
          template_id: 'agent.response.natural',
          params: {
            text:
              'That entry recorded a consulting fee paid in cash. Cash was debited and Consulting Revenue credited; no journal-entry proposal is needed for the explanation itself.',
          },
        },
        caller: { type: 'direct' },
      },
    ],
    'tool_use',
  );
}

/**
 * Malformed-directive — single-line lines array violates
 * ProposedEntryCardSchema's lines.min(2). The respondToUser tool-
 * input wrapper Zod check fails first (upstream of Site 2's
 * defense-in-depth parse()), throwing before Site 2 ever runs.
 * Site 1's ai_actions row insert from the paired postJournalEntry
 * tool call still lands; the orphaned row is the Class 2
 * signature §4a/§4b/§4c prompt-surgery defends against.
 */
export function malformedDirectiveRespondTurn(
  resolvedDate: string,
): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: 'toolu_respond_soft9_malformed',
        name: 'respondToUser',
        input: {
          template_id: 'agent.entry.proposed',
          params: { amount: '1500.00' },
          canvas_directive: {
            type: 'proposed_entry_card',
            card: {
              org_name: 'Bridge Real Estate Entity (DEV)',
              transaction_type: 'journal_entry',
              entry_date: resolvedDate,
              description: 'Consulting fee — paid in cash (malformed: single line)',
              lines: [
                {
                  account_code: '1000',
                  account_name: 'Cash and Cash Equivalents',
                  debit: '1500.00',
                  credit: '0.00',
                  currency: 'CAD',
                },
                // Schema-violation: lines.min(2) — only one line
                // present. The respondToUser tool-input wrapper Zod
                // check rejects (upstream of Site 2's parse()).
              ],
              intercompany_flag: false,
              confidence_score: 0.85,
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
