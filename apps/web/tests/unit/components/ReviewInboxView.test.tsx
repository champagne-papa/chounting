// @vitest-environment jsdom
//
// Wave 6 D3 T7 — ReviewInboxView component tests. global.fetch stubbed
// (PendingDocumentsView.test.tsx idiom). Pins: both populations render
// with their facet badges (exception reason; approved post-status —
// the D-4 stranding window made operator-visible), empty state, error
// + retry, and the row-click → in-view detail swap (the one-directive
// v1 navigation).

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReviewInboxView } from '@/components/canvas/ReviewInboxView';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

function okResponse(body: unknown): Response {
  return { ok: true, json: async () => body } as unknown as Response;
}
function failResponse(status = 500): Response {
  return {
    ok: false,
    status,
    json: async () => ({ message: 'boom' }),
  } as unknown as Response;
}

const ROWS = [
  {
    document_case_id: 'case-exc',
    state: 'needs_review',
    document_type: 'vendor_invoice',
    classification_confidence: 0.9,
    created_at: '2026-06-04T10:00:00.000Z',
    open_exception: {
      exception_queue_entry_id: 'exc-1',
      exception_reason: 'unknown_document_type',
    },
    posted: false,
  },
  {
    document_case_id: 'case-posted',
    state: 'approved',
    document_type: 'vendor_invoice',
    classification_confidence: 0.8,
    created_at: '2026-06-04T11:00:00.000Z',
    open_exception: null,
    posted: true,
  },
  {
    document_case_id: 'case-unposted',
    state: 'approved',
    document_type: 'receipt',
    classification_confidence: null,
    created_at: '2026-06-04T12:00:00.000Z',
    open_exception: null,
    posted: false,
  },
];

describe('ReviewInboxView', () => {
  it('renders both populations with exception + post-status badges', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ cases: ROWS }));
    render(<ReviewInboxView orgId="org-1" />);

    await waitFor(() =>
      expect(screen.getByTestId('inbox-list')).toBeInTheDocument(),
    );
    expect(screen.getByText(/Review Inbox · 3 cases/)).toBeInTheDocument();
    // Exception-bearing population wears the reason badge.
    expect(screen.getByTestId('exception-badge-case-exc')).toHaveTextContent(
      'unknown_document_type',
    );
    // Approved population wears the post-status facet (the stranding
    // window operator-visible: posted vs not posted).
    expect(screen.getByTestId('post-status-case-posted')).toHaveTextContent(
      'posted — awaiting commit mark',
    );
    expect(screen.getByTestId('post-status-case-unposted')).toHaveTextContent(
      'not posted',
    );
  });

  it('renders the empty state', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ cases: [] }));
    render(<ReviewInboxView orgId="org-1" />);
    await waitFor(() =>
      expect(screen.getByText('Nothing awaiting review.')).toBeInTheDocument(),
    );
  });

  it('error state renders alert + retry refetches', async () => {
    mockFetch.mockResolvedValueOnce(failResponse());
    render(<ReviewInboxView orgId="org-1" />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce(okResponse({ cases: [] }));
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() =>
      expect(screen.getByText('Nothing awaiting review.')).toBeInTheDocument(),
    );
  });

  it('row click swaps to the in-view detail (detail fetch fires for the clicked case)', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ cases: ROWS }));
    render(<ReviewInboxView orgId="org-1" />);
    await waitFor(() =>
      expect(screen.getByTestId('inbox-list')).toBeInTheDocument(),
    );

    // The detail fetch response (minimal not-postable shape).
    mockFetch.mockResolvedValueOnce(
      okResponse({
        document_case: {
          id: 'case-exc',
          state: 'needs_review',
          document_type: 'vendor_invoice',
          classification_confidence: 0.9,
          created_at: '2026-06-04T10:00:00.000Z',
        },
        source_document: null,
        candidates: [],
        open_exception: {
          exception_queue_entry_id: 'exc-1',
          exception_reason: 'unknown_document_type',
        },
        proposal: null,
        extracted_fields: {},
        vendor_match: null,
        postable: false,
        not_postable_reason: 'no_artifacts',
        posted_journal_entries: [],
      }),
    );
    // Two rows are vendor_invoice; the first (case-exc) is the target.
    fireEvent.click(
      screen.getAllByText('vendor_invoice', { selector: 'span.flex-1' })[0]!,
    );

    await waitFor(() =>
      expect(screen.getByTestId('case-state')).toHaveTextContent(
        'needs_review',
      ),
    );
    const detailCall = mockFetch.mock.calls[1]![0] as string;
    expect(detailCall).toBe('/api/orgs/org-1/review/cases/case-exc');
  });
});
