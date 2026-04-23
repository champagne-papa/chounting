// tests/integration/canvasDirectiveSchemaExtensions.test.ts
// CA-74: Phase 1.2 Session 6 — canvasDirectiveSchema accepts the
// five new directive-type variants (user_profile, org_profile,
// org_users, invite_user, welcome), rejects unknown fields on
// each variant, and rejects unknown discriminator values.
//
// Session 7 Commit 2: the proposed_entry_card variant tightened
// from z.unknown() (Session 2 placeholder) to the full card schema.
//
// Session 8 C6-pre (O2-v2): the proposed_entry_card variant now
// consumes the INPUT schema (ProposedEntryCardInputSchema), which
// omits the three orchestrator-owned UUIDs (org_id,
// idempotency_key, trace_id). The orchestrator post-fills those
// three at Site 2 and the strict ProposedEntryCardSchema remains
// the canonical shape shipping to clients.

import { describe, it, expect } from 'vitest';
import { canvasDirectiveSchema } from '@/shared/schemas/canvas/canvasDirective.schema';

const validOrg = '11111111-1111-1111-1111-111111111111';

// O2-v2 input shape: three UUIDs (org_id, idempotency_key,
// trace_id) are omitted — orchestrator supplies them. dry_run_entry_id
// stays because the model copies it from the postJournalEntry
// tool_result.
const validCard = {
  org_name: 'Holding Co',
  transaction_type: 'journal_entry' as const,
  entry_date: '2026-04-19',
  description: 'Office supplies',
  lines: [
    { account_code: '1000', account_name: 'Cash', debit: '0.0000', credit: '100.0000', currency: 'CAD' },
    { account_code: '6000', account_name: 'Office Supplies', debit: '100.0000', credit: '0.0000', currency: 'CAD' },
  ],
  intercompany_flag: false,
  confidence_score: 0.9,
  policy_outcome: {
    required_action: 'approve' as const,
    reason_template_id: 'proposed_entry.why.rule_matched',
    reason_params: { label: 'Vendor → Expense' },
  },
  dry_run_entry_id: '33333333-3333-3333-3333-333333333333',
};

describe('CA-74: canvasDirectiveSchema — Session 6 extensions', () => {
  it('accepts user_profile (no additional fields)', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'user_profile' });
    expect(parsed).toEqual({ type: 'user_profile' });
  });

  it('accepts welcome (no additional fields)', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'welcome' });
    expect(parsed).toEqual({ type: 'welcome' });
  });

  it('accepts org_profile + orgId', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'org_profile', orgId: validOrg });
    expect(parsed).toEqual({ type: 'org_profile', orgId: validOrg });
  });

  it('accepts org_users + orgId', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'org_users', orgId: validOrg });
    expect(parsed).toEqual({ type: 'org_users', orgId: validOrg });
  });

  it('accepts invite_user + orgId', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'invite_user', orgId: validOrg });
    expect(parsed).toEqual({ type: 'invite_user', orgId: validOrg });
  });

  it('rejects unknown fields on user_profile (.strict())', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'user_profile', extraneous: true })).toThrow();
  });

  it('rejects unknown fields on org_profile (.strict())', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'org_profile', orgId: validOrg, bogus: 1 })).toThrow();
  });

  it('rejects invalid UUID on org_profile', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'org_profile', orgId: 'not-a-uuid' })).toThrow();
  });

  it('rejects unknown discriminator type', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'not_a_directive', orgId: validOrg })).toThrow();
  });

  it('requires orgId on org_profile / org_users / invite_user', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'org_profile' })).toThrow();
    expect(() => canvasDirectiveSchema.parse({ type: 'org_users' })).toThrow();
    expect(() => canvasDirectiveSchema.parse({ type: 'invite_user' })).toThrow();
  });

  // Session 7 Commit 2 — tightened proposed_entry_card.

  it('accepts proposed_entry_card with a valid card', () => {
    const parsed = canvasDirectiveSchema.parse({
      type: 'proposed_entry_card',
      card: validCard,
    });
    expect(parsed.type).toBe('proposed_entry_card');
  });

  it('rejects proposed_entry_card when the nested card is missing required fields', () => {
    // O2-v2 note: org_id / idempotency_key / trace_id are no longer
    // required on the INPUT schema. Pick a field that IS still
    // required — dry_run_entry_id (model emits; orchestrator doesn't
    // fill) — to exercise the "missing required" path.
    const { dry_run_entry_id: _omit, ...cardMissingDryRun } = validCard;
    expect(() =>
      canvasDirectiveSchema.parse({
        type: 'proposed_entry_card',
        card: cardMissingDryRun,
      }),
    ).toThrow();
  });

  it('rejects proposed_entry_card when the nested card has extra fields (.strict())', () => {
    expect(() =>
      canvasDirectiveSchema.parse({
        type: 'proposed_entry_card',
        card: { ...validCard, bogus: true },
      }),
    ).toThrow();
  });

  it('rejects proposed_entry_card with required_action other than "approve"', () => {
    expect(() =>
      canvasDirectiveSchema.parse({
        type: 'proposed_entry_card',
        card: {
          ...validCard,
          policy_outcome: { ...validCard.policy_outcome, required_action: 'auto_post' },
        },
      }),
    ).toThrow();
  });

  // Phase 0-1.1 Arc A Step 7 — report_balance_sheet directive.

  it('accepts report_balance_sheet + orgId (asOfDate optional)', () => {
    const parsedMin = canvasDirectiveSchema.parse({
      type: 'report_balance_sheet',
      orgId: validOrg,
    });
    expect(parsedMin.type).toBe('report_balance_sheet');

    const parsedWithDate = canvasDirectiveSchema.parse({
      type: 'report_balance_sheet',
      orgId: validOrg,
      asOfDate: '2026-04-23',
    });
    expect(parsedWithDate.type).toBe('report_balance_sheet');
  });

  it('rejects report_balance_sheet with unknown fields (.strict())', () => {
    expect(() =>
      canvasDirectiveSchema.parse({
        type: 'report_balance_sheet',
        orgId: validOrg,
        bogus: true,
      }),
    ).toThrow();
  });

  // Phase 0-1.1 Arc A Step 8a — report_account_ledger directive.

  it('accepts report_account_ledger + orgId + accountId (periodId optional)', () => {
    const validAccountId = '22222222-2222-2222-2222-222222222222';
    const parsedMin = canvasDirectiveSchema.parse({
      type: 'report_account_ledger',
      orgId: validOrg,
      accountId: validAccountId,
    });
    expect(parsedMin.type).toBe('report_account_ledger');

    const parsedWithPeriod = canvasDirectiveSchema.parse({
      type: 'report_account_ledger',
      orgId: validOrg,
      accountId: validAccountId,
      periodId: '33333333-3333-3333-3333-333333333333',
    });
    expect(parsedWithPeriod.type).toBe('report_account_ledger');
  });

  it('rejects report_account_ledger with unknown fields (.strict())', () => {
    expect(() =>
      canvasDirectiveSchema.parse({
        type: 'report_account_ledger',
        orgId: validOrg,
        accountId: '22222222-2222-2222-2222-222222222222',
        bogus: true,
      }),
    ).toThrow();
  });
});
