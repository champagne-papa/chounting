// @vitest-environment jsdom
//
// Pre-send composer (build plan screen 2) — staged-file tiles + local preview.
//
// THE LOAD-BEARING TEST IS "no ingestion until send". The confirm-before-commit
// guarantee — drop a wrong file and it costs nothing — was shipped at Phase 6.5
// chunk 3 (Sub-Q9.b.α staged-with-explicit-ingest) and, until now, had NO test
// anywhere. Since CI runs no tests at all (docs/05_operations/ci-runs-no-tests.md),
// an accidental "fire on drop" regression would have reached main past five green
// checks. This fixture closes that.
//
// Scope: the composer pieces only. AgentChatPanel is not rendered whole — it
// mounts a conversation fetch, a toast timer and a beforeunload handler that are
// not this build's subject. The staging→send seam is asserted at the unit the
// build actually changed, plus a direct guard on the drop handler's contract.

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StagedFileTile } from '@/components/bridge/composer/StagedFileTile';
import { StagedFilePreview } from '@/components/bridge/composer/StagedFilePreview';
import { derivePdfPageCount } from '@/components/bridge/composer/pdfPageCount';
import { AgentChatPanel } from '@/components/bridge/AgentChatPanel';
import { NextIntlClientProvider } from 'next-intl';

// The panel reads useParams() for the locale (AgentChatPanel.tsx:273-274);
// outside a Next router context that returns null.
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en',
  useSearchParams: () => new URLSearchParams(),
}));
import messages from '@/../messages/en.json';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Minimal 2-page PDF: a page tree carrying /Type /Pages + /Count 2.
function pdfWithPages(n: number): File {
  const body = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count ${n} >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
  return new File([body], `invoice-${n}p.pdf`, { type: 'application/pdf' });
}

describe('composer — no ingestion until send', () => {
  // The guarantee, asserted at the seam this build touched: rendering a tile
  // for a staged file performs NO network call. Staging is inert.
  it('rendering a staged tile fires no network request', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <StagedFileTile
        file={pdfWithPages(2)}
        onRemove={() => {}}
        onPreview={() => {}}
      />,
    );

    await screen.findByTestId('composer-tile');
    // Let the async page-count derivation settle — if IT ever reached out,
    // this is where it would show.
    await waitFor(() => expect(screen.getByTestId('composer-tile')).toBeInTheDocument());

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('opening the full-size preview fires no network request', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    // jsdom has no object-URL implementation.
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });

    render(<StagedFilePreview file={pdfWithPages(1)} onClose={() => {}} />);

    expect(await screen.findByTestId('composer-preview-frame')).toBeInTheDocument();
    // The preview reads the in-memory File via an object URL — never the
    // stored-document preview ROUTE, which would require an upload first.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the preview renders the local file, not a server URL', async () => {
    const createObjectURL = vi.fn(() => 'blob:local-file');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

    render(<StagedFilePreview file={pdfWithPages(1)} onClose={() => {}} />);

    const frame = await screen.findByTestId('composer-preview-frame');
    expect(createObjectURL).toHaveBeenCalled();
    expect(frame).toHaveAttribute('src', 'blob:local-file');
    // Specifically NOT the build-plan §4 route shape.
    expect(frame.getAttribute('src')).not.toContain('/api/orgs/');
  });
});

describe('composer — tile behaviour', () => {
  it('remove is separate from preview: × removes without opening the preview', async () => {
    const onRemove = vi.fn();
    const onPreview = vi.fn();
    render(
      <StagedFileTile file={pdfWithPages(1)} onRemove={onRemove} onPreview={onPreview} />,
    );

    fireEvent.click(screen.getByTestId('composer-tile-remove'));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('clicking the tile body opens the preview', async () => {
    const onPreview = vi.fn();
    render(
      <StagedFileTile file={pdfWithPages(1)} onRemove={() => {}} onPreview={onPreview} />,
    );

    fireEvent.click(screen.getByTestId('composer-tile-preview'));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('shows a page count when derivable', async () => {
    render(
      <StagedFileTile file={pdfWithPages(3)} onRemove={() => {}} onPreview={() => {}} />,
    );
    expect(await screen.findByTestId('composer-tile-pagecount')).toHaveTextContent(
      '3 pages',
    );
  });

  it('shows NO page count when not derivable, rather than guessing', async () => {
    const notAPdf = new File(['x'], 'scan.png', { type: 'image/png' });
    render(
      <StagedFileTile file={notAPdf} onRemove={() => {}} onPreview={() => {}} />,
    );
    await screen.findByTestId('composer-tile');
    expect(screen.queryByTestId('composer-tile-pagecount')).toBeNull();
  });

  it('offers an honest empty state for unpreviewable types', async () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    const eml = new File(['x'], 'forward.eml', { type: 'message/rfc822' });

    render(<StagedFilePreview file={eml} onClose={() => {}} />);

    expect(await screen.findByTestId('composer-preview-unsupported')).toBeInTheDocument();
    expect(screen.queryByTestId('composer-preview-frame')).toBeNull();
  });
});

describe('pdfPageCount — conservative by contract', () => {
  it('returns the count for a well-formed page tree', async () => {
    expect(await derivePdfPageCount(pdfWithPages(7))).toBe(7);
  });

  it('returns null for a non-PDF rather than a wrong number', async () => {
    expect(
      await derivePdfPageCount(new File(['x'], 'a.png', { type: 'image/png' })),
    ).toBeNull();
  });

  it('returns null when /Count values disagree (incremental update)', async () => {
    const ambiguous = new File(
      [
        '%PDF-1.4\n<< /Type /Pages /Count 2 >>\n<< /Type /Pages /Count 9 >>\n%%EOF',
      ],
      'updated.pdf',
      { type: 'application/pdf' },
    );
    expect(await derivePdfPageCount(ambiguous)).toBeNull();
  });

  it('returns null for a PDF with no page tree in range', async () => {
    const noTree = new File(['%PDF-1.4\nnothing useful\n%%EOF'], 'odd.pdf', {
      type: 'application/pdf',
    });
    expect(await derivePdfPageCount(noTree)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The REAL guard. The tests above assert the composer PIECES are inert, which
// is necessary and not sufficient: they would all still pass if handleDrop
// were changed to fire the ingest endpoint, because they never exercise the
// drop handler. This block renders the actual panel and drops a file on the
// actual drop target, then asserts the ingest endpoint was not called.
//
// Mutation-verified: reintroducing a fire-on-drop in AgentChatPanel's
// handleDrop fails "does not call the ingest endpoint on drop" and nothing
// else. See the PR body for the recorded run.
// ---------------------------------------------------------------------------
describe('AgentChatPanel — drop stages, it does not ingest', () => {
  const INGEST = '/documents/ingest/drag-drop';

  function renderPanel(fetchSpy: ReturnType<typeof vi.fn>) {
    vi.stubGlobal('fetch', fetchSpy);
    // The panel is an app-tree component: it needs the intl provider the
    // real layout supplies (app/[locale]/layout.tsx:27).
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AgentChatPanel
          orgId="11111111-1111-1111-1111-111111111111"
          onCollapse={() => {}}
          currentUserRole="controller"
        />
      </NextIntlClientProvider>,
    );
  }

  function dropFiles(files: File[]) {
    const panel = screen.getByTestId('agent-chat-panel');
    fireEvent.drop(panel, { dataTransfer: { files, types: ['Files'] } });
  }

  it('does not call the ingest endpoint on drop', async () => {
    // Conversation-load and any other mount fetch resolve empty; we only
    // care which URLs are hit.
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ turns: [] }),
    })) as unknown as ReturnType<typeof vi.fn>;

    renderPanel(fetchSpy);
    await screen.findByTestId('agent-chat-panel');

    dropFiles([pdfWithPages(1)]);

    // The file must be staged...
    expect(await screen.findByTestId('agent-staged-tray')).toBeInTheDocument();

    // ...and NOTHING may have gone to the pipeline.
    await waitFor(() => {
      const urls = (fetchSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls.map(
        (c) => String(c[0]),
      );
      expect(urls.some((u) => u.includes(INGEST))).toBe(false);
    });
  });

  it('stages every dropped file as a tile, still without ingesting', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ turns: [] }),
    })) as unknown as ReturnType<typeof vi.fn>;

    renderPanel(fetchSpy);
    await screen.findByTestId('agent-chat-panel');

    dropFiles([pdfWithPages(1), pdfWithPages(2)]);

    await waitFor(() =>
      expect(screen.getAllByTestId('composer-tile')).toHaveLength(2),
    );
    const urls = (fetchSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls.map(
      (c) => String(c[0]),
    );
    expect(urls.some((u) => u.includes(INGEST))).toBe(false);
  });

  it('Send reports the staged batch count', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ turns: [] }),
    })) as unknown as ReturnType<typeof vi.fn>;

    renderPanel(fetchSpy);
    await screen.findByTestId('agent-chat-panel');

    expect(screen.getByTestId('agent-send')).toHaveTextContent('Send');
    dropFiles([pdfWithPages(1), pdfWithPages(1)]);

    await waitFor(() =>
      expect(screen.getByTestId('agent-send')).toHaveTextContent('Send 2 files'),
    );
  });
});
