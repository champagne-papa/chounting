// tests/integration/canvasDirectiveSchemaExtensions.test.ts
// CA-74: Phase 1.2 Session 6 — canvasDirectiveSchema accepts the
// five new directive-type variants (user_profile, org_profile,
// org_users, invite_user, welcome), rejects unknown fields on
// each variant, and rejects unknown discriminator values.
//
// Session 7 Commit 2 extension: the proposed_entry_card variant
// tightens from z.unknown() (Session 2 placeholder) to
// ProposedEntryCardSchema. Added cases below verify the
// discriminated union rejects malformed cards at the directive
// level rather than silently accepting them.

import { describe, it, expect } from 'vitest';
import { canvasDirectiveSchema } from '@/shared/schemas/canvas/canvasDirective.schema';

const validOrg = '11111111-1111-1111-1111-111111111111';

const validCard = {
  org_id: validOrg,
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
  idempotency_key: '22222222-2222-2222-2222-222222222222',
  dry_run_entry_id: '33333333-3333-3333-3333-333333333333',
  trace_id: '44444444-4444-4444-4444-444444444444',
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
    const { org_id: _omit, ...cardMissingOrg } = validCard;
    expect(() =>
      canvasDirectiveSchema.parse({
        type: 'proposed_entry_card',
        card: cardMissingOrg,
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
});
