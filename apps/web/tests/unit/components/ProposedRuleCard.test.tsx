// @vitest-environment jsdom
//
// tests/unit/components/ProposedRuleCard.test.tsx
//
// Ring 2A-authoring commit (e) (ADR-0026 §3/§5/§8). ProposedRuleCard renders the
// creation-time Four Questions from a ProposedRuleDraft, POSTs the create→approve
// to /api/orgs/[orgId]/rules on Approve (navigating to the rule registry), and
// treats Reject/Edit as ephemeral (no fetch — the draft persists nothing
// pre-approval, Decision 5).

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const ORG_ID = '11111111-1111-1111-1111-111111111111';

// useParams supplies orgId (the card is rendered within /[orgId]/); next-intl's
// t() is stubbed to echo the key (assertions key off the template IDs + testids).
vi.mock('next/navigation', () => ({ useParams: () => ({ orgId: ORG_ID }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

import { ProposedRuleCard } from '@/components/ProposedRuleCard';
import type { ProposedRuleDraft } from '@/shared/schemas/rules/proposedRuleCard.schema';

const draft: ProposedRuleDraft = {
  vendor_id: '22222222-2222-2222-2222-222222222222',
  vendor_name: 'Spotify',
  bundle_type: 'born_paid_bill',
  account_hint: 'subscriptions',
  utterance_summary: 'always code Spotify to subscriptions',
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ProposedRuleCard', () => {
  it('renders the four creation-time questions + Approve/Reject/Edit', () => {
    render(<ProposedRuleCard card={draft} />);
    expect(screen.getByTestId('proposed-rule-card')).toBeInTheDocument();
    expect(screen.getByTestId('proposed-rule-approve')).toBeInTheDocument();
    expect(screen.getByTestId('proposed-rule-reject')).toBeInTheDocument();
    expect(screen.getByTestId('proposed-rule-edit')).toBeInTheDocument();
    // Q3 uses the creation-time template (V6: NOT the match-time track_record.no_rule).
    expect(screen.getByText('proposed_rule.track_record.new_rule')).toBeInTheDocument();
  });

  it('approve POSTs the create→approve to /api/orgs/[orgId]/rules, navigates to the registry, resolves approved', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ rule_id: 'rule-123', created: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const onResolved = vi.fn();
    const onNavigate = vi.fn();

    render(<ProposedRuleCard card={draft} onResolved={onResolved} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByTestId('proposed-rule-approve'));

    await waitFor(() =>
      expect(onResolved).toHaveBeenCalledWith({ outcome: 'approved', rule_id: 'rule-123' }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/orgs/${ORG_ID}/rules`,
      expect.objectContaining({ method: 'POST' }),
    );
    // body carries the resolved create inputs; default_account_id omitted (v1 display-only).
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body);
    expect(body).toEqual({ vendor_id: draft.vendor_id, bundle_type: 'born_paid_bill' });
    expect(onNavigate).toHaveBeenCalledWith({ type: 'rule_registry', orgId: ORG_ID });
  });

  it('reject is ephemeral — no fetch, resolves rejected', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const onResolved = vi.fn();

    render(<ProposedRuleCard card={draft} onResolved={onResolved} />);
    fireEvent.click(screen.getByTestId('proposed-rule-reject'));

    expect(onResolved).toHaveBeenCalledWith({ outcome: 'rejected' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('edit is ephemeral — no fetch, resolves edited (re-draft in chat)', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const onResolved = vi.fn();

    render(<ProposedRuleCard card={draft} onResolved={onResolved} />);
    fireEvent.click(screen.getByTestId('proposed-rule-edit'));

    expect(onResolved).toHaveBeenCalledWith({ outcome: 'edited' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
