// @vitest-environment jsdom
//
// Phase 8 chunk 5 Task 2 — DocumentCard unit-grade test fixture.
//
// Covers the chunk 7.3b state machine surface on
// @/components/canvas/DocumentCard.tsx:
//   - 7-state badge color mapping (stateBadgeClasses) per ADR-0011
//     DocumentCaseStateSchema enum (received, classified, proposed,
//     approved, needs_review, matched, rejected);
//   - per-state action affordances (actionForState): proposed → Review,
//     approved → View receipt, needs_review → Re-process, all other
//     states → no action button;
//   - onAction callback wiring via fireEvent.click;
//   - defensive unknown-state fallback to the neutral badge.
//
// Renders in jsdom (per-file directive above); jest-dom matchers are
// registered per-file below. Component test infrastructure landed in this
// chunk — see vitest.config.ts include glob extension.

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DocumentCard } from '@/components/canvas/DocumentCard';

// Auto-cleanup is not registered (vitest globals are off in this project),
// so unmount between tests explicitly.
afterEach(cleanup);

interface CardOverrides {
  case_id?: string;
  state?: string;
  original_filename?: string;
  channel_metadata?: Record<string, unknown>;
}

function makeCard(overrides: CardOverrides = {}) {
  return {
    case_id: overrides.case_id ?? 'case-1',
    state: overrides.state ?? 'received',
    source_document_id: 'doc-1',
    original_filename: overrides.original_filename ?? 'invoice.pdf',
    ingest_batch_id: 'batch-1',
    channel_metadata: overrides.channel_metadata ?? {},
    received_at: '2026-05-21T12:00:00.000Z',
    created_at: '2026-05-21T12:00:00.000Z',
  };
}

describe('DocumentCard — state badge colors', () => {
  // Exact per-state class assertion per stateBadgeClasses mapping. The
  // badge also carries shared layout classes; toHaveClass checks presence
  // of the state-specific triplet which is the discriminating surface.
  const cases: Array<[string, string[]]> = [
    ['received', ['bg-neutral-100', 'text-neutral-700', 'border-neutral-300']],
    ['classified', ['bg-neutral-100', 'text-neutral-700', 'border-neutral-300']],
    ['proposed', ['bg-yellow-100', 'text-yellow-800', 'border-yellow-300']],
    ['approved', ['bg-emerald-100', 'text-emerald-800', 'border-emerald-300']],
    ['needs_review', ['bg-orange-100', 'text-orange-800', 'border-orange-300']],
    ['matched', ['bg-blue-100', 'text-blue-800', 'border-blue-300']],
    ['rejected', ['bg-red-100', 'text-red-800', 'border-red-300']],
  ];

  it.each(cases)('renders %s with its badge color classes', (state, classes) => {
    render(<DocumentCard card={makeCard({ state })} />);
    const badge = screen.getByTestId('document-card-state');
    expect(badge).toHaveTextContent(state);
    expect(badge).toHaveClass(...classes);
  });
});

describe('DocumentCard — action affordances', () => {
  it('renders a Review button for the proposed state', () => {
    render(<DocumentCard card={makeCard({ state: 'proposed' })} onAction={vi.fn()} />);
    const btn = screen.getByTestId('document-card-action-review');
    expect(btn).toHaveTextContent('Review');
  });

  it('renders a View receipt button for the approved state', () => {
    render(<DocumentCard card={makeCard({ state: 'approved' })} onAction={vi.fn()} />);
    const btn = screen.getByTestId('document-card-action-view_receipt');
    expect(btn).toHaveTextContent('View receipt');
  });

  it('renders a Re-process button for the needs_review state', () => {
    render(<DocumentCard card={makeCard({ state: 'needs_review' })} onAction={vi.fn()} />);
    const btn = screen.getByTestId('document-card-action-re_process');
    expect(btn).toHaveTextContent('Re-process');
  });

  it.each(['received', 'classified', 'matched', 'rejected'])(
    'renders no action button for the %s state',
    (state) => {
      const { container } = render(<DocumentCard card={makeCard({ state })} />);
      expect(container.querySelector('button')).toBeNull();
    },
  );
});

describe('DocumentCard — onAction callback', () => {
  it('invokes onAction with the action and case_id on click', () => {
    const onAction = vi.fn();
    render(
      <DocumentCard card={makeCard({ state: 'proposed', case_id: 'case-42' })} onAction={onAction} />,
    );
    fireEvent.click(screen.getByTestId('document-card-action-review'));
    expect(onAction).toHaveBeenCalledWith('review', 'case-42');
  });

  it('passes view_receipt for the approved action', () => {
    const onAction = vi.fn();
    render(<DocumentCard card={makeCard({ state: 'approved', case_id: 'case-7' })} onAction={onAction} />);
    fireEvent.click(screen.getByTestId('document-card-action-view_receipt'));
    expect(onAction).toHaveBeenCalledWith('view_receipt', 'case-7');
  });

  it('disables the action button when no onAction is wired', () => {
    render(<DocumentCard card={makeCard({ state: 'proposed' })} />);
    expect(screen.getByTestId('document-card-action-review')).toBeDisabled();
  });
});

describe('DocumentCard — defensive fallback', () => {
  it('falls back to the neutral badge for an unknown state', () => {
    render(<DocumentCard card={makeCard({ state: 'totally_unknown' })} />);
    const badge = screen.getByTestId('document-card-state');
    expect(badge).toHaveClass('bg-neutral-100', 'text-neutral-500', 'border-neutral-300');
  });

  it('renders no action button for an unknown state', () => {
    const { container } = render(<DocumentCard card={makeCard({ state: 'totally_unknown' })} />);
    expect(container.querySelector('button')).toBeNull();
  });
});
