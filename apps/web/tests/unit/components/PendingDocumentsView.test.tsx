// @vitest-environment jsdom
//
// Phase 8 chunk 5 Task 4 — PendingDocumentsView unit-grade test fixture.
//
// Covers @/components/canvas/PendingDocumentsView.tsx (Phase 6.5 chunk 3 /
// Phase 7 chunk 7.3b). The view drives a mount-time fetch state machine
// (idle → fetching_recent/fetching_batch → idle_with_recent_cards/
// showing_batch → error). global.fetch is stubbed so the tests exercise
// the branch logic without a network or DB:
//   - mount WITH ingestBatchId → batch fetch → showing_batch;
//   - mount WITHOUT ingestBatchId → recent fetch → idle_with_recent_cards;
//   - batch-fetch failure → defensive fallback to the recent fetch;
//   - recent-fetch failure → soft-fall to idle;
//   - empty-state rendering at both cards-rendered branches;
//   - DocumentCard composition (one card per row).

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { PendingDocumentsView } from '@/components/canvas/PendingDocumentsView';

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

function failResponse(): Response {
  return { ok: false, json: async () => ({}) } as unknown as Response;
}

function makeCard(id: string) {
  return {
    case_id: id,
    state: 'received',
    source_document_id: `doc-${id}`,
    original_filename: `${id}.pdf`,
    ingest_batch_id: 'batch-1',
    channel_metadata: {},
    received_at: '2026-05-21T12:00:00.000Z',
    created_at: '2026-05-21T12:00:00.000Z',
  };
}

function view() {
  return screen.getByTestId('pending-documents-view');
}

describe('PendingDocumentsView — recent cards (no ingestBatchId)', () => {
  it('fetches recent cards on mount and renders them', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ cards: [makeCard('a'), makeCard('b')] }));

    render(<PendingDocumentsView orgId="org-1" />);

    await waitFor(() =>
      expect(view()).toHaveAttribute('data-state', 'idle_with_recent_cards'),
    );
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/orgs/org-1/documents/cases?limit=50'));
    expect(screen.getByTestId('pending-documents-recent-cards')).toBeInTheDocument();
    expect(screen.getAllByTestId('document-card')).toHaveLength(2);
  });

  it('renders the empty state when no recent cards are returned', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ cards: [] }));

    render(<PendingDocumentsView orgId="org-1" />);

    await waitFor(() =>
      expect(view()).toHaveAttribute('data-state', 'idle_with_recent_cards'),
    );
    expect(screen.getByText('No pending documents.')).toBeInTheDocument();
    expect(screen.queryAllByTestId('document-card')).toHaveLength(0);
  });
});

describe('PendingDocumentsView — batch cards (ingestBatchId provided)', () => {
  it('fetches batch-specific cards on mount and renders the just-dropped heading', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ cards: [makeCard('a')] }));

    render(<PendingDocumentsView orgId="org-1" ingestBatchId="batch-9" />);

    await waitFor(() => expect(view()).toHaveAttribute('data-state', 'showing_batch'));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('ingest_batch_id=batch-9'));
    expect(screen.getByTestId('pending-documents-batch-cards')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('just dropped');
  });

  it('renders the empty state at showing_batch when the batch has no cards', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ cards: [] }));

    render(<PendingDocumentsView orgId="org-1" ingestBatchId="batch-9" />);

    await waitFor(() => expect(view()).toHaveAttribute('data-state', 'showing_batch'));
    expect(screen.getByText('No pending documents.')).toBeInTheDocument();
  });
});

describe('PendingDocumentsView — defensive fallbacks', () => {
  it('falls back to the recent fetch when the batch fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(failResponse()) // batch fetch fails
      .mockResolvedValueOnce(okResponse({ cards: [makeCard('r')] })); // recent fetch succeeds

    render(<PendingDocumentsView orgId="org-1" ingestBatchId="batch-x" />);

    await waitFor(() =>
      expect(view()).toHaveAttribute('data-state', 'idle_with_recent_cards'),
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain('ingest_batch_id=batch-x');
    expect(mockFetch.mock.calls[1][0]).toContain('limit=50');
    expect(screen.getAllByTestId('document-card')).toHaveLength(1);
  });

  it('soft-falls to idle when the recent fetch fails', async () => {
    mockFetch.mockResolvedValueOnce(failResponse());

    render(<PendingDocumentsView orgId="org-1" />);

    await waitFor(() => expect(view()).toHaveAttribute('data-state', 'idle'));
    expect(screen.getByText(/No pending documents yet/)).toBeInTheDocument();
  });
});
