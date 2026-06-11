// @vitest-environment jsdom
//
// Ring 2A-core Commit 5 (ADR-0025 §11). RuleRegistryView component test —
// jsdom + RTL per the Phase 8 component-test infra precedent
// (PendingDocumentsView.test.tsx). global.fetch is stubbed so the tests
// exercise the canvas's contract against Commit 4's route handlers (list +
// four row-action sub-routes) without a network or DB.
//
// The list-route contract and the row-action sub-route shapes are verified
// here; the route handlers themselves are integration-tested at Commit 4
// (ruleRoutesAuthz.integration.test.ts). Notably the 409 (not 422) mapping for
// RULE_LIFECYCLE_INVALID is asserted, matching serviceErrorToStatus on disk.

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RuleRegistryView } from '@/components/canvas/RuleRegistryView';

const mockFetch = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mockFetch.mockReset();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function statusResponse(status: number, body: unknown = {}): Response {
  return { ok: false, status, json: async () => body } as unknown as Response;
}

function makeRule(over: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    name: 'Amazon → 5100',
    rule_type: 'vendor_category',
    current_rung: 'always_confirm',
    lifecycle_state: 'active',
    created_at: '2026-05-01T10:00:00.000Z',
    last_winning_match_at: '2026-05-20T12:00:00.000Z',
    track_record: { clean_approval_count: 3, guardrail_fire_count: 1, rejection_count: 0 },
    window_30d: { evaluation_count: 7, primary_match_count: 5 },
    ...over,
  };
}

function listResponse(rules: unknown[]) {
  return { rules, count: rules.length };
}

describe('RuleRegistryView — list states', () => {
  it('shows the loading state on mount', () => {
    mockFetch.mockResolvedValueOnce(okResponse(listResponse([])));
    render(<RuleRegistryView orgId="org-1" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the rule list with both badges, Last won, and 30d counters', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(listResponse([makeRule()])));
    render(<RuleRegistryView orgId="org-1" />);

    await screen.findByText('Amazon → 5100');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orgs/org-1/rules?'),
    );

    const row = screen.getByText('Amazon → 5100').closest('tr') as HTMLElement;
    // Two separate badges (current_rung + lifecycle_state).
    expect(within(row).getByText('always_confirm')).toBeInTheDocument();
    expect(within(row).getByText('active')).toBeInTheDocument();
    // Last won (sliced date) + 30d evaluation counter.
    expect(within(row).getByText('2026-05-20')).toBeInTheDocument();
    expect(within(row).getByText('7')).toBeInTheDocument();
  });

  it('renders the empty state when no rules exist', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(listResponse([])));
    render(<RuleRegistryView orgId="org-1" />);
    await waitFor(() =>
      expect(screen.getByTestId('rule-registry-empty')).toBeInTheDocument(),
    );
  });

  it('renders an inline error when the list fetch fails', async () => {
    mockFetch.mockResolvedValueOnce(
      statusResponse(500, { error: 'READ_FAILED', message: 'boom' }),
    );
    render(<RuleRegistryView orgId="org-1" />);
    const err = await screen.findByTestId('rule-registry-error');
    expect(err).toHaveTextContent('boom');
  });

  it('redirects to sign-in on a 401', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });
    mockFetch.mockResolvedValueOnce(statusResponse(401));
    render(<RuleRegistryView orgId="org-1" />);
    await waitFor(() => expect(window.location.href).toBe('/en/sign-in'));
  });

  it('renders the Last won date when present and "Never won" when null', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse(
        listResponse([
          makeRule({ id: 'r1', name: 'Has won', last_winning_match_at: '2026-05-20T12:00:00.000Z' }),
          makeRule({ id: 'r2', name: 'No wins', last_winning_match_at: null }),
        ]),
      ),
    );
    render(<RuleRegistryView orgId="org-1" />);

    await screen.findByText('Has won');
    const wonRow = screen.getByText('Has won').closest('tr') as HTMLElement;
    expect(within(wonRow).getByText('2026-05-20')).toBeInTheDocument();
    const neverRow = screen.getByText('No wins').closest('tr') as HTMLElement;
    expect(within(neverRow).getByText('Never won')).toBeInTheDocument();
  });
});

describe('RuleRegistryView — row actions', () => {
  it('rename: inline edit submits and refetches the list', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(listResponse([makeRule()])))
      .mockResolvedValueOnce(okResponse({ rule_id: 'rule-1', name: 'Amazon office supplies' }))
      .mockResolvedValueOnce(okResponse(listResponse([makeRule({ name: 'Amazon office supplies' })])));

    render(<RuleRegistryView orgId="org-1" />);
    await screen.findByText('Amazon → 5100');

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.change(screen.getByLabelText('Rule name'), {
      target: { value: 'Amazon office supplies' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    expect(mockFetch.mock.calls[1][0]).toContain('/api/orgs/org-1/rules/rule-1/rename');
    expect(mockFetch.mock.calls[1][1]).toMatchObject({ method: 'POST' });
    expect(mockFetch.mock.calls[1][1].body).toBe(JSON.stringify({ name: 'Amazon office supplies' }));
  });

  it('demote: amber warning + red confirm POSTs and refetches', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(listResponse([makeRule()])))
      .mockResolvedValueOnce(okResponse({ rule_id: 'rule-1' }))
      .mockResolvedValueOnce(okResponse(listResponse([makeRule({ lifecycle_state: 'demoted' })])));

    render(<RuleRegistryView orgId="org-1" />);
    await screen.findByText('Amazon → 5100');

    fireEvent.click(screen.getByRole('button', { name: 'Demote' }));
    expect(screen.getByText(/Demoting returns this rule/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm demotion' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    expect(mockFetch.mock.calls[1][0]).toContain('/api/orgs/org-1/rules/rule-1/demote');
    expect(mockFetch.mock.calls[1][1]).toMatchObject({ method: 'POST' });
  });

  it('retire: amber warning + red confirm POSTs and refetches', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(listResponse([makeRule()])))
      .mockResolvedValueOnce(okResponse({ rule_id: 'rule-1' }))
      .mockResolvedValueOnce(okResponse(listResponse([makeRule({ lifecycle_state: 'retired' })])));

    render(<RuleRegistryView orgId="org-1" />);
    await screen.findByText('Amazon → 5100');

    fireEvent.click(screen.getByRole('button', { name: 'Retire' }));
    expect(screen.getByText(/Retiring is terminal/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm retirement' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    expect(mockFetch.mock.calls[1][0]).toContain('/api/orgs/org-1/rules/rule-1/retire');
  });

  it('promote: opens the inert modal with the OQ-6 copy, closes, and fires NO POST', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(listResponse([makeRule()])));

    render(<RuleRegistryView orgId="org-1" />);
    await screen.findByText('Amazon → 5100');

    fireEvent.click(screen.getByRole('button', { name: 'Promote' }));
    expect(screen.getByTestId('inert-promotion-modal')).toBeInTheDocument();
    expect(screen.getByText(/intentionally disabled at v1/)).toBeInTheDocument();
    expect(
      screen.getByText(/becomes available when the ladder activates post-v1/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    await waitFor(() =>
      expect(screen.queryByTestId('inert-promotion-modal')).not.toBeInTheDocument(),
    );

    // Only the initial list load — promotion never hits the network at v1.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('renders an inline action error when a row action returns 409 RULE_LIFECYCLE_INVALID', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(listResponse([makeRule()])))
      .mockResolvedValueOnce(
        statusResponse(409, {
          error: 'RULE_LIFECYCLE_INVALID',
          message: 'cannot demote a retired rule',
        }),
      );

    render(<RuleRegistryView orgId="org-1" />);
    await screen.findByText('Amazon → 5100');

    fireEvent.click(screen.getByRole('button', { name: 'Demote' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm demotion' }));

    const actionErr = await screen.findByTestId('rule-action-error');
    expect(actionErr).toHaveTextContent('cannot demote a retired rule');
    // No refetch fired (only the list load + the failed POST).
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('disables promote/demote/retire on a retired rule (rename stays enabled)', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse(listResponse([makeRule({ lifecycle_state: 'retired' })])),
    );
    render(<RuleRegistryView orgId="org-1" />);
    await screen.findByText('Amazon → 5100');

    expect(screen.getByRole('button', { name: 'Promote' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Demote' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Retire' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeEnabled();
  });
});
