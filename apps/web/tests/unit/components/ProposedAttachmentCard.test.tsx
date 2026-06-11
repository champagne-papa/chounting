// @vitest-environment jsdom
//
// Phase 8 chunk 5 Task 3 — ProposedAttachmentCard unit-grade test fixture.
//
// Covers @/components/canvas/ProposedAttachmentCard.tsx (Phase 7 chunk
// 7.3b). ProposedAttachment is a non-ledger commit per ADR-0011 §11 — the
// component renders the proposal and Attach/Reject affordances and reports
// the outcome via onResolved (the approval API consumer ships in a later
// chunk).
//
// Asserts the observable SubmitState surface (idle → resolved), the
// two-step reject flow (open reason → confirm), the onResolved payload
// shape (reason populated only when the trimmed reason is non-empty), and
// structural parity with ProposedEntryCard (rounded border + shadow).

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ProposedAttachmentCard } from '@/components/canvas/ProposedAttachmentCard';
import type { ProposedAttachmentCard as ProposedAttachmentCardType } from '@/shared/schemas/document-platform/proposedAttachmentCard.schema';

afterEach(cleanup);

function makeCard(): ProposedAttachmentCardType {
  return {
    org_id: '11111111-1111-1111-1111-111111111111',
    org_name: 'Bridge Real Estate Entity DEV',
    proposal_type: 'attach_invoice_to_existing_bill',
    source_document_id: '22222222-2222-2222-2222-222222222222',
    linked_entity_type: 'bill',
    linked_entity_id: '33333333-3333-3333-3333-333333333333',
    link_role: 'primary_invoice',
    confidence_score: 0.92,
    idempotency_key: '44444444-4444-4444-4444-444444444444',
    trace_id: '55555555-5555-5555-5555-555555555555',
  };
}

describe('ProposedAttachmentCard — initial render', () => {
  it('renders the org name and the Attach / Reject affordances in the idle state', () => {
    render(<ProposedAttachmentCard card={makeCard()} />);
    expect(screen.getByTestId('proposed-attachment-card')).toBeInTheDocument();
    expect(screen.getByText('Bridge Real Estate Entity DEV')).toBeInTheDocument();
    expect(screen.getByTestId('proposed-attachment-approve')).toHaveTextContent('Attach');
    expect(screen.getByTestId('proposed-attachment-reject')).toHaveTextContent('Reject');
    expect(screen.queryByTestId('proposed-attachment-resolved')).toBeNull();
  });

  it('renders with ProposedEntryCard structural parity (rounded border + shadow)', () => {
    render(<ProposedAttachmentCard card={makeCard()} />);
    expect(screen.getByTestId('proposed-attachment-card')).toHaveClass(
      'rounded-lg',
      'border',
      'shadow-sm',
    );
  });
});

describe('ProposedAttachmentCard — approve flow', () => {
  it('resolves to approved and reports { outcome: "approved" }', () => {
    const onResolved = vi.fn();
    render(<ProposedAttachmentCard card={makeCard()} onResolved={onResolved} />);

    fireEvent.click(screen.getByTestId('proposed-attachment-approve'));

    expect(onResolved).toHaveBeenCalledWith({ outcome: 'approved' });
    expect(screen.getByTestId('proposed-attachment-resolved')).toHaveTextContent('✓ Attached');
    // Action buttons are gone once resolved.
    expect(screen.queryByTestId('proposed-attachment-approve')).toBeNull();
    expect(screen.queryByTestId('proposed-attachment-reject')).toBeNull();
  });
});

describe('ProposedAttachmentCard — reject flow', () => {
  it('opens the reason field when Reject is clicked', () => {
    render(<ProposedAttachmentCard card={makeCard()} />);
    fireEvent.click(screen.getByTestId('proposed-attachment-reject'));
    expect(screen.getByTestId('proposed-attachment-reject-reason')).toBeInTheDocument();
    expect(screen.getByTestId('proposed-attachment-reject-confirm')).toBeInTheDocument();
  });

  it('resolves without a reason key when confirmed with an empty reason', () => {
    const onResolved = vi.fn();
    render(<ProposedAttachmentCard card={makeCard()} onResolved={onResolved} />);

    fireEvent.click(screen.getByTestId('proposed-attachment-reject'));
    fireEvent.click(screen.getByTestId('proposed-attachment-reject-confirm'));

    expect(onResolved).toHaveBeenCalledWith({ outcome: 'rejected' });
    expect(screen.getByTestId('proposed-attachment-resolved')).toHaveTextContent('✕ Rejected');
  });

  it('includes the trimmed reason when one is provided', () => {
    const onResolved = vi.fn();
    render(<ProposedAttachmentCard card={makeCard()} onResolved={onResolved} />);

    fireEvent.click(screen.getByTestId('proposed-attachment-reject'));
    fireEvent.change(screen.getByTestId('proposed-attachment-reject-reason'), {
      target: { value: '  duplicate of bill #42  ' },
    });
    fireEvent.click(screen.getByTestId('proposed-attachment-reject-confirm'));

    expect(onResolved).toHaveBeenCalledWith({
      outcome: 'rejected',
      reason: 'duplicate of bill #42',
    });
  });

  it('omits the reason key when only whitespace is entered', () => {
    const onResolved = vi.fn();
    render(<ProposedAttachmentCard card={makeCard()} onResolved={onResolved} />);

    fireEvent.click(screen.getByTestId('proposed-attachment-reject'));
    fireEvent.change(screen.getByTestId('proposed-attachment-reject-reason'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByTestId('proposed-attachment-reject-confirm'));

    expect(onResolved).toHaveBeenCalledWith({ outcome: 'rejected' });
  });

  it('closes the reason field and restores the affordances on Cancel', () => {
    render(<ProposedAttachmentCard card={makeCard()} />);
    fireEvent.click(screen.getByTestId('proposed-attachment-reject'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByTestId('proposed-attachment-reject-reason')).toBeNull();
    expect(screen.getByTestId('proposed-attachment-approve')).toBeInTheDocument();
  });
});
