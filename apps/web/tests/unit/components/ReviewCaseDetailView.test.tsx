// @vitest-environment jsdom
//
// Wave 6 D3 T7 — ReviewCaseDetailView component tests. Pins the action
// gating: Approve & Post rendered ONLY for postable previews (the T5
// population-mapping correction made UI-real: attachment/NOT_POSTABLE
// cases get the steering banner, never the post button); reject stays
// disabled until a reason is typed (the Zod mirror); the resolve
// surface appears only for exception-bearing cases and posts the
// entry id + chosen action.

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReviewCaseDetailView } from '@/components/canvas/ReviewCaseDetailView';

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

function previewPayload(overrides: Record<string, unknown> = {}) {
  return {
    document_case: {
      id: 'case-1',
      state: 'needs_review',
      document_type: 'vendor_invoice',
      classification_confidence: 0.9,
      created_at: '2026-06-04T10:00:00.000Z',
    },
    source_document: {
      original_filename: 'inv.pdf',
      mime_type: 'application/pdf',
      original_byte_size: 42,
    },
    candidates: [],
    open_exception: null,
    proposal: { kind: 'proposed_entry_card' },
    extracted_fields: { amount: '250.00', accounting_date: '2026-06-01' },
    vendor_match: { vendor_id: 'v-1', match_type: 'exact_name' },
    postable: true,
    not_postable_reason: null,
    posted_journal_entries: [],
    ...overrides,
  };
}

describe('ReviewCaseDetailView', () => {
  it('postable preview: Approve & Post renders; click POSTs approve-post and shows done', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(previewPayload()));
    render(
      <ReviewCaseDetailView orgId="org-1" caseId="case-1" onBack={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('approve-post')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('not-postable-banner')).toBeNull();
    // The rebuilt fields render (the normalized money string visible).
    expect(screen.getByText('250.00')).toBeInTheDocument();

    mockFetch.mockResolvedValueOnce(
      okResponse({ status: 'posted', case_state: 'committed' }),
    );
    fireEvent.click(screen.getByTestId('approve-post'));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Posted and committed.',
      ),
    );
    const [url, init] = mockFetch.mock.calls[1]! as [string, RequestInit];
    expect(url).toBe('/api/orgs/org-1/review/cases/case-1/approve-post');
    expect(init.method).toBe('POST');
  });

  it('NOT_POSTABLE preview: steering banner renders, approve button absent', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse(
        previewPayload({
          proposal: { kind: 'proposed_attachment_card' },
          postable: false,
          not_postable_reason: 'attachment_kind_no_ledger_post',
        }),
      ),
    );
    render(
      <ReviewCaseDetailView orgId="org-1" caseId="case-1" onBack={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('not-postable-banner')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('not-postable-banner')).toHaveTextContent(
      'attachment_kind_no_ledger_post',
    );
    expect(screen.queryByTestId('approve-post')).toBeNull();
  });

  it('reject stays disabled until a reason is typed; click POSTs the reason', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(previewPayload()));
    render(
      <ReviewCaseDetailView orgId="org-1" caseId="case-1" onBack={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('reject')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('reject')).toBeDisabled();

    fireEvent.change(screen.getByTestId('reject-reason'), {
      target: { value: 'not a real invoice' },
    });
    expect(screen.getByTestId('reject')).toBeEnabled();

    mockFetch.mockResolvedValueOnce(okResponse({ case_state: 'rejected' }));
    fireEvent.click(screen.getByTestId('reject'));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Rejected.'),
    );
    const [url, init] = mockFetch.mock.calls[1]! as [string, RequestInit];
    expect(url).toBe('/api/orgs/org-1/review/cases/case-1/reject');
    expect(JSON.parse(init.body as string)).toEqual({
      reason: 'not a real invoice',
    });
  });

  it('exception-bearing case: resolve surface renders and POSTs entry id + chosen action', async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse(
        previewPayload({
          open_exception: {
            exception_queue_entry_id: 'exc-9',
            exception_reason: 'unknown_document_type',
          },
          postable: false,
          not_postable_reason: 'no_proposal',
          proposal: null,
        }),
      ),
    );
    render(
      <ReviewCaseDetailView orgId="org-1" caseId="case-1" onBack={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('exception-banner')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId('resolution-action'), {
      target: { value: 'mark_duplicate' },
    });
    mockFetch.mockResolvedValueOnce(
      okResponse({
        exception_status: 'resolved',
        resolution_action: 'mark_duplicate',
        document_case_id: 'case-1',
      }),
    );
    fireEvent.click(screen.getByTestId('resolve-exception'));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Exception resolved.',
      ),
    );
    const [url, init] = mockFetch.mock.calls[1]! as [string, RequestInit];
    expect(url).toBe('/api/orgs/org-1/review/cases/case-1/resolve-exception');
    expect(JSON.parse(init.body as string)).toEqual({
      exception_queue_entry_id: 'exc-9',
      resolution_action: 'mark_duplicate',
    });
  });

  it('no exception → resolve surface absent', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(previewPayload()));
    render(
      <ReviewCaseDetailView orgId="org-1" caseId="case-1" onBack={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('approve-post')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('resolve-exception')).toBeNull();
  });
});
