// tests/unit/tabTitle.test.ts
//
// Phase 6.5 chunk 2b — exhaustive mapping check for the tabTitle
// module. Verifies that every CanvasDirective active member maps to
// a non-empty UI title; spot-checks representative mappings.

import { describe, it, expect } from 'vitest';

import { tabTitleForDirective } from '@/shared/types/tabTitle';
import type { CanvasDirective } from '@/shared/types/canvasDirective';

const ORG_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

// Representative sample of all CanvasDirective members. Compiler
// enforces exhaustiveness inside tabTitleForDirective; this sample
// covers each member to verify the runtime mapping at chunk 2b ship.
const SAMPLE: ReadonlyArray<CanvasDirective> = [
  { type: 'chart_of_accounts', orgId: ORG_A },
  {
    type: 'journal_entry',
    orgId: ORG_A,
    entryId: 'e1',
    mode: 'view',
  },
  { type: 'journal_entry_form', orgId: ORG_A },
  { type: 'journal_entry_list', orgId: ORG_A },
  {
    type: 'proposed_entry_card',
    card: { id: 'c1' } as never,
  },
  { type: 'ai_action_review_queue', orgId: ORG_A },
  { type: 'report_pl', orgId: ORG_A },
  { type: 'report_trial_balance', orgId: ORG_A },
  { type: 'report_balance_sheet', orgId: ORG_A },
  {
    type: 'report_account_ledger',
    orgId: ORG_A,
    accountId: 'a1',
  },
  {
    type: 'report_accounts_by_type',
    orgId: ORG_A,
    accountType: 'asset',
  },
  { type: 'report_ap_aging', orgId: ORG_A },
  { type: 'report_open_bills', orgId: ORG_A },
  { type: 'report_vendor_balance', orgId: ORG_A },
  { type: 'report_payment_approval_queue', orgId: ORG_A },
  { type: 'report_active_payments', orgId: ORG_A },
  { type: 'report_paid_bills_history', orgId: ORG_A },
  { type: 'report_pending_approvals', orgId: ORG_A },
  { type: 'reversal_form', orgId: ORG_A, sourceEntryId: 'e1' },
  { type: 'adjustment_form', orgId: ORG_A },
  { type: 'recurring_template_list', orgId: ORG_A },
  { type: 'recurring_template_form', orgId: ORG_A },
  { type: 'recurring_run_list', orgId: ORG_A },
  { type: 'bill_form', orgId: ORG_A },
  { type: 'payment_approval_card', orgId: ORG_A, billId: 'b1' },
  { type: 'payment_record_card', orgId: ORG_A, billId: 'b1' },
  { type: 'bill_reverse_card', orgId: ORG_A, billId: 'b1' },
  { type: 'none' },
  { type: 'user_profile' },
  { type: 'org_profile', orgId: ORG_A },
  { type: 'org_users', orgId: ORG_A },
  { type: 'invite_user', orgId: ORG_A },
  { type: 'welcome' },
  { type: 'ap_queue', orgId: ORG_A },
  { type: 'vendor_detail', vendorId: 'v1', orgId: ORG_A },
  { type: 'bank_reconciliation', accountId: 'a1' },
  { type: 'ar_aging', orgId: ORG_A },
  { type: 'consolidated_dashboard' },
];

describe('tabTitleForDirective', () => {
  it('produces non-empty title for every CanvasDirective active member', () => {
    for (const directive of SAMPLE) {
      const title = tabTitleForDirective(directive);
      expect(title.length, `empty title for ${directive.type}`).toBeGreaterThan(0);
    }
  });

  it('maps representative directives to expected punchy labels', () => {
    expect(
      tabTitleForDirective({ type: 'chart_of_accounts', orgId: ORG_A }),
    ).toBe('Chart of Accounts');
    expect(tabTitleForDirective({ type: 'report_pl', orgId: ORG_A })).toBe(
      'P&L Report',
    );
    expect(tabTitleForDirective({ type: 'report_open_bills', orgId: ORG_A })).toBe(
      'Open Bills',
    );
    expect(tabTitleForDirective({ type: 'bill_form', orgId: ORG_A })).toBe(
      'New Bill',
    );
    expect(tabTitleForDirective({ type: 'none' })).toBe('New tab');
  });

  it('counts to 38 active CanvasDirective members in the sample (sanity check)', () => {
    // Each member type appears exactly once in SAMPLE; total = 38.
    const typeSet = new Set(SAMPLE.map((d) => d.type));
    expect(typeSet.size).toBe(38);
  });
});
