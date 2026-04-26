// tests/integration/agentOrgIdInjection.test.ts
// Finding O2 regression: org-scoped read-tool schemas no longer
// require org_id; the orchestrator supplies session.org_id at
// service-call time (plan: docs/09_briefs/phase-1.2/
// session-8-c6-prereq-o2-org-id-injection-plan.md).
//
// The bug: listChartOfAccounts, checkPeriod, and listJournalEntries
// schemas required org_id: z.string().uuid(); the system prompt
// deliberately excludes UUIDs; the orchestrator didn't inject.
// Result: agent emitted non-UUID placeholders, Zod rejected, the
// Q13 retry budget exhausted, and the structured response degraded
// to asking the human for the UUID.
//
// This test drives the fix via TDD. Before the fix it fails
// because the Zod schema rejects the missing org_id and the
// tool_result is_error=true. After the fix the schema no longer
// requires org_id and the orchestrator injects session.org_id
// before calling the service; the tool_result carries real CoA
// data.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

// Fixture: agent emits listChartOfAccounts with NO org_id in its
// input (the real observed shape — prompt has no UUID for the
// model to produce). Orchestrator must succeed by injecting
// session.org_id at service-call time.
const listCoaNoOrgIdTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_list_O2',
      name: 'listChartOfAccounts',
      input: {},
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);

const respondAfterListTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_respond_O2',
      name: 'respondToUser',
      input: {
        template_id: 'agent.accounts.listed',
        params: { count: 14 },
      },
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);

describe('Finding O2: org_id injection for org-scoped tools', () => {
  beforeEach(() => {
    __setMockFixtureQueue([listCoaNoOrgIdTurn, respondAfterListTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
  });

  it('listChartOfAccounts executes successfully when agent omits org_id', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'list my accounts',
      },
      ctx,
    );

    // Load the persisted conversation and find the tool_result
    // that pairs with toolu_list_O2. Before the fix it's
    // is_error=true (Zod rejected); after the fix it carries
    // real CoA rows.
    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('conversation')
      .eq('session_id', response.session_id)
      .single();
    expect(session).not.toBeNull();

    const conv = session!.conversation as Array<{
      role: 'user' | 'assistant';
      content: string | Array<Record<string, unknown>>;
    }>;

    const toolResults = conv
      .filter((m) => m.role === 'user' && Array.isArray(m.content))
      .flatMap((m) => m.content as Array<Record<string, unknown>>)
      .filter((b) => b.type === 'tool_result' && b.tool_use_id === 'toolu_list_O2');

    expect(toolResults).toHaveLength(1);
    const result = toolResults[0];
    expect(result.is_error).not.toBe(true);
    // Tool output contains JSON-stringified array of accounts,
    // each with account_id. Presence of the field proves the
    // service call ran rather than Zod rejecting.
    expect(String(result.content)).toContain('account_id');
  });
});

// ---------------------------------------------------------------
// Finding O2-v2 regression tests
//
// Plan: docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-v2-pre-zod-
// injection-plan.md.
//
// O2-v1 injected org_id inside executeTool, which runs AFTER main-
// loop Zod validation. For ledger tools (postJournalEntry,
// reverseJournalEntry) the model emits empty/invalid UUIDs, Zod
// rejects, executeTool never runs, O2-v1's overwrite is unreachable.
// Additionally, respondToUser's canvas_directive.proposed_entry_card
// requires three orchestrator-owned UUIDs (org_id, idempotency_key,
// trace_id) that the model has no legitimate source for.
//
// O2-v2 fix: pre-Zod injection at Site 1 (ledger tool input) and
// post-fill at Site 2 (ProposedEntryCard in respondToUser). Schema
// split: ProposedEntryCardInputSchema (loose — model emits, UUIDs
// omitted) vs ProposedEntryCardSchema (strict — ships to client).
// ---------------------------------------------------------------

const HOLDING_FISCAL_PERIOD_ID = '33333333-3333-3333-3333-333333333301';
const HOLDING_ACCOUNT_CASH = '44444444-4444-4444-4444-444444444401';
const HOLDING_ACCOUNT_REVENUE = '44444444-4444-4444-4444-444444444402';
// A valid UUID the model would echo from the tool_result for
// dry_run_entry_id; its exact value doesn't need to match the
// real ai_actions row's id — the orchestrator doesn't cross-check
// this field.
const FIXTURE_DRY_RUN_ENTRY_ID = '55555555-5555-5555-5555-555555555501';

// Shared helper: build balanced journal-entry lines.
function balancedLines() {
  return [
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
  ];
}

// Shared helper: model's ProposedEntryCard emission WITHOUT the
// three orchestrator-owned UUIDs (org_id, idempotency_key,
// trace_id). Model emits dry_run_entry_id from the tool_result.
function modelEmittedCardShape() {
  return {
    org_name: 'The Bridge Holding Co.',
    transaction_type: 'journal_entry',
    entry_date: '2026-04-18',
    description: 'O2-v2 test entry',
    lines: [
      {
        account_code: '1000',
        account_name: 'Cash',
        debit: '100.00',
        credit: '0.00',
        currency: 'CAD',
      },
      {
        account_code: '4000',
        account_name: 'Revenue',
        debit: '0.00',
        credit: '100.00',
        currency: 'CAD',
      },
    ],
    intercompany_flag: false,
    confidence_score: 0.9,
    policy_outcome: {
      required_action: 'approve',
      reason_template_id: 'policy.agent.propose',
      reason_params: {},
    },
    dry_run_entry_id: FIXTURE_DRY_RUN_ENTRY_ID,
  };
}

describe('Finding O2-v2: pre-Zod injection for ledger tools + card post-fill', () => {
  afterEach(async () => {
    __setMockFixtureQueue(null);
    const db = adminClient();
    // Clean ai_actions rows written by these tests. UNIQUE
    // constraint on (org_id, idempotency_key) would otherwise reject
    // the next run's insert. Filter by user to avoid cross-test
    // collateral damage.
    await db.from('ai_actions').delete().eq('user_id', SEED.USER_CONTROLLER);
    await db.from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  it('postJournalEntry succeeds when agent omits org_id AND idempotency_key (Site 1)', async () => {
    const postTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_post_O2v2_A',
          name: 'postJournalEntry',
          input: {
            // NO org_id, NO idempotency_key — orchestrator must inject pre-Zod
            fiscal_period_id: HOLDING_FISCAL_PERIOD_ID,
            entry_date: '2026-04-18',
            description: 'O2-v2 Site 1 test',
            source: 'agent',
            dry_run: true,
            lines: balancedLines(),
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    const respondTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_O2v2_A',
          name: 'respondToUser',
          input: {
            template_id: 'agent.entry.proposed',
            params: { amount: '100.00' },
            canvas_directive: {
              type: 'proposed_entry_card',
              card: modelEmittedCardShape(),
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    __setMockFixtureQueue([postTurn, respondTurn]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'post a $100 revenue entry',
      },
      ctx,
    );

    // No Zod rejection → response is the success template, not the
    // validation-failed fallback.
    expect(response.response.template_id).toBe('agent.entry.proposed');
    expect(response.trace_id).toBe(ctx.trace_id);
  });

  it('ai_actions.tool_input captures orchestrator-minted org_id + idempotency_key (audit trail)', async () => {
    const postTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_post_O2v2_B',
          name: 'postJournalEntry',
          input: {
            fiscal_period_id: HOLDING_FISCAL_PERIOD_ID,
            entry_date: '2026-04-18',
            description: 'O2-v2 audit trail test',
            source: 'agent',
            dry_run: true,
            lines: balancedLines(),
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    const respondTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_O2v2_B',
          name: 'respondToUser',
          input: {
            template_id: 'agent.entry.proposed',
            params: { amount: '100.00' },
            canvas_directive: {
              type: 'proposed_entry_card',
              card: modelEmittedCardShape(),
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    __setMockFixtureQueue([postTurn, respondTurn]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'post',
      },
      ctx,
    );

    // Confirm-route replay (route.ts:136) re-parses
    // ai_actions.tool_input through PostJournalEntryInputSchema.
    // So the stored tool_input must be post-Zod-valid AND contain
    // the authoritative session-derived values (not whatever the
    // model emitted, which was empty).
    const { data: row } = await adminClient()
      .from('ai_actions')
      .select('org_id, tool_input, trace_id')
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(row).not.toBeNull();
    expect(row!.org_id).toBe(SEED.ORG_HOLDING);
    const toolInput = row!.tool_input as Record<string, unknown>;
    expect(toolInput.org_id).toBe(SEED.ORG_HOLDING);
    expect(typeof toolInput.idempotency_key).toBe('string');
    expect(toolInput.idempotency_key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('card post-fill sets org_id, idempotency_key, trace_id from session/ctx (Site 2)', async () => {
    const postTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_post_O2v2_C',
          name: 'postJournalEntry',
          input: {
            fiscal_period_id: HOLDING_FISCAL_PERIOD_ID,
            entry_date: '2026-04-18',
            description: 'O2-v2 Site 2 test',
            source: 'agent',
            dry_run: true,
            lines: balancedLines(),
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    const respondTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_O2v2_C',
          name: 'respondToUser',
          input: {
            template_id: 'agent.entry.proposed',
            params: { amount: '100.00' },
            canvas_directive: {
              type: 'proposed_entry_card',
              card: modelEmittedCardShape(),
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    __setMockFixtureQueue([postTurn, respondTurn]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'post',
      },
      ctx,
    );

    // The returned card carries session/ctx-derived UUIDs, not
    // placeholders from the model's emission.
    expect(response.canvas_directive).toBeDefined();
    const cd = response.canvas_directive as { type: string; card?: Record<string, unknown> };
    expect(cd.type).toBe('proposed_entry_card');
    expect(cd.card).toBeDefined();
    expect(cd.card!.org_id).toBe(SEED.ORG_HOLDING);
    expect(cd.card!.trace_id).toBe(ctx.trace_id);
    // idempotency_key is minted — valid UUID, matches the ai_actions row.
    const { data: row } = await adminClient()
      .from('ai_actions')
      .select('idempotency_key')
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(row).not.toBeNull();
    expect(cd.card!.idempotency_key).toBe(row!.idempotency_key);
  });

  it('respondToUser with card but no prior successful ledger call throws', async () => {
    // Only respondToUser with a card — no postJournalEntry before it.
    // lastLedgerIdempotencyKey is undefined; Site 2 must throw rather
    // than silently minting a fresh key that would diverge from any
    // ai_actions row and break confirm.
    const respondTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_O2v2_D',
          name: 'respondToUser',
          input: {
            template_id: 'agent.entry.proposed',
            params: { amount: '100.00' },
            canvas_directive: {
              type: 'proposed_entry_card',
              card: modelEmittedCardShape(),
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    __setMockFixtureQueue([respondTurn]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    await expect(
      handleUserMessage(
        {
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_HOLDING,
          locale: 'en',
          tz: 'UTC',
          message: 'post',
        },
        ctx,
      ),
    ).rejects.toThrow(/prior successful ledger/i);
  });

  it('fiscal_period_id still required — injection scope does NOT cover it', async () => {
    // Agent emits postJournalEntry with valid lines but NO
    // fiscal_period_id. The orchestrator injects org_id +
    // idempotency_key (Site 1), but Zod still rejects because
    // fiscal_period_id is model-owned (agent must call checkPeriod
    // first and copy the result). Retry budget decrements. The
    // fixture queue runs out of messages on the next iteration
    // which is a test misconfiguration, so we exhaust to the
    // structural-retry / Q13 failure path. Either way: final
    // template is NOT agent.entry.proposed.
    const postTurnMissingPeriod: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_post_O2v2_E',
          name: 'postJournalEntry',
          input: {
            // NO fiscal_period_id — O2-v2 deliberately does not inject this.
            entry_date: '2026-04-18',
            description: 'missing fiscal_period_id',
            source: 'agent',
            dry_run: true,
            lines: balancedLines(),
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    // Three retry turns all emit the same invalid shape — exhausts
    // Q13 budget and surfaces the validation-failed template.
    __setMockFixtureQueue([
      postTurnMissingPeriod,
      postTurnMissingPeriod,
      postTurnMissingPeriod,
    ]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'post',
      },
      ctx,
    );
    expect(response.response.template_id).toBe('agent.error.tool_validation_failed');
  });

  it('idempotency_key is unconditionally overwritten (empty string does not survive)', async () => {
    // Agent emits postJournalEntry with idempotency_key: "" (empty
    // string — a documented degenerate emission for constrained-
    // grammar tool calls). With nullish-coalescing (??=) semantics
    // the empty string would survive and Zod would reject. The
    // ratified design uses unconditional overwrite, so "" is
    // replaced with a minted UUID.
    const postTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_post_O2v2_F',
          name: 'postJournalEntry',
          input: {
            org_id: '',
            idempotency_key: '',
            fiscal_period_id: HOLDING_FISCAL_PERIOD_ID,
            entry_date: '2026-04-18',
            description: 'O2-v2 empty-string overwrite test',
            source: 'agent',
            dry_run: true,
            lines: balancedLines(),
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    const respondTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_O2v2_F',
          name: 'respondToUser',
          input: {
            template_id: 'agent.entry.proposed',
            params: { amount: '100.00' },
            canvas_directive: {
              type: 'proposed_entry_card',
              card: modelEmittedCardShape(),
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );
    __setMockFixtureQueue([postTurn, respondTurn]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'post',
      },
      ctx,
    );
    expect(response.response.template_id).toBe('agent.entry.proposed');
  });
});
