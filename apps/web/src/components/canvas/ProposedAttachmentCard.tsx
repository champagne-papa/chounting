// src/components/canvas/ProposedAttachmentCard.tsx
//
// Phase 7 chunk 7.3b Task 7.3b.2 — ProposedAttachmentCard UI renderer per
// chunk 7.3 brief §3.5 Task 7.3b.2. Structural parity with existing
// ProposedEntryCard at @/components/ProposedEntryCard.tsx (Tailwind
// styling, rounded border + padding + shadow, Approve/Reject affordances).
//
// Rendered via ContextualCanvas when a `proposed_attachment_card`
// directive is routed to the canvas (post-Stage-6 emit at orchestrator
// per chunk 7.3b Task 7.3b.6 routing extension).
//
// Per ADR-0011 §11: ProposedAttachment is non-ledger commit — Approve
// triggers documentLinkService.create() (source_document_links row INSERT)
// rather than journalEntryService.post(). At v1 the API surface for that
// approval flow ships outside chunk 7.3b's scope; the component currently
// renders the proposal shape and the affordances, with stubbed approval
// handler that the future API consumer chunk wires.

'use client';

import { useState } from 'react';
import type { ProposedAttachmentCard as ProposedAttachmentCardType } from '@/shared/schemas/document-platform/proposedAttachmentCard.schema';

export type ProposedAttachmentCardResolved =
  | { outcome: 'approved' }
  | { outcome: 'rejected'; reason?: string };

interface Props {
  card: ProposedAttachmentCardType;
  onResolved?: (resolved: ProposedAttachmentCardResolved) => void;
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting'; which: 'approve' | 'reject' }
  | { kind: 'resolved'; outcome: 'approved' | 'rejected' }
  | { kind: 'error'; message: string };

export function ProposedAttachmentCard({ card, onResolved }: Props) {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isSubmitting = submitState.kind === 'submitting';
  const isResolved = submitState.kind === 'resolved';

  // Approval flow stub: API consumer for ProposedAttachment approval
  // ships outside chunk 7.3b scope. Current implementation marks the
  // card resolved locally and signals via onResolved.
  async function handleApprove() {
    setSubmitState({ kind: 'submitting', which: 'approve' });
    try {
      // Future API: documentLinkService.create() via withInvariants wrap
      // at a future route handler. For now, mark resolved locally.
      setSubmitState({ kind: 'resolved', outcome: 'approved' });
      onResolved?.({ outcome: 'approved' });
    } catch (err) {
      setSubmitState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Approve failed',
      });
    }
  }

  async function handleRejectConfirm() {
    const trimmed = rejectReason.trim();
    setSubmitState({ kind: 'submitting', which: 'reject' });
    try {
      setSubmitState({ kind: 'resolved', outcome: 'rejected' });
      setRejectOpen(false);
      onResolved?.({
        outcome: 'rejected',
        ...(trimmed.length > 0 && { reason: trimmed }),
      });
    } catch (err) {
      setSubmitState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Reject failed',
      });
    }
  }

  return (
    <div
      className="rounded-lg border border-neutral-300 bg-white p-4 max-w-2xl shadow-sm"
      data-testid="proposed-attachment-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {card.org_name}
        </div>
        <div className="text-xs text-neutral-500">Attach evidence</div>
      </div>

      <Section heading="What is this?">
        <div className="text-sm text-neutral-700 mb-2">
          <span className="font-medium">
            {proposalTypeLabel(card.proposal_type)}
          </span>
        </div>
        <div className="text-xs text-neutral-500 font-mono break-all">
          source_document: {card.source_document_id.slice(0, 8)}…
        </div>
      </Section>

      <Section heading="Linked to">
        <div className="text-sm text-neutral-700">
          <span className="font-mono text-xs text-neutral-500">
            {card.linked_entity_type}
          </span>
          {' · '}
          <span className="font-mono text-xs text-neutral-500">
            {card.linked_entity_id.slice(0, 8)}…
          </span>
          {' · role='}
          <span className="font-medium">{card.link_role}</span>
        </div>
      </Section>

      <Section heading="If approved?">
        <div className="text-sm text-neutral-700">
          A source_document_link row will record this attachment. No journal
          entry is posted; ProposedAttachment is a non-ledger commit per
          ADR-0011 §11.
        </div>
      </Section>

      {submitState.kind === 'error' && (
        <div className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitState.message}
        </div>
      )}

      {!isResolved && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={handleApprove}
            disabled={isSubmitting || rejectOpen}
            data-testid="proposed-attachment-approve"
          >
            {submitState.kind === 'submitting' && submitState.which === 'approve'
              ? 'Attaching…'
              : 'Attach'}
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            onClick={() => setRejectOpen(true)}
            disabled={isSubmitting || rejectOpen}
            data-testid="proposed-attachment-reject"
          >
            Reject
          </button>
        </div>
      )}

      {rejectOpen && !isResolved && (
        <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-3">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Why? (optional)
          </label>
          <textarea
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={isSubmitting}
            data-testid="proposed-attachment-reject-reason"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              onClick={handleRejectConfirm}
              disabled={isSubmitting}
              data-testid="proposed-attachment-reject-confirm"
            >
              {submitState.kind === 'submitting' && submitState.which === 'reject'
                ? 'Rejecting…'
                : 'Confirm'}
            </button>
            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isResolved && (
        <div className="mt-4 text-sm text-neutral-600" data-testid="proposed-attachment-resolved">
          {submitState.outcome === 'approved' && '✓ Attached'}
          {submitState.outcome === 'rejected' && '✕ Rejected'}
        </div>
      )}
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
        {heading}
      </div>
      {children}
    </div>
  );
}

function proposalTypeLabel(t: ProposedAttachmentCardType['proposal_type']): string {
  switch (t) {
    case 'attach_payment_evidence':
      return 'Attach payment evidence';
    case 'attach_invoice_to_existing_bill':
      return 'Attach invoice to existing bill';
    case 'attach_supporting_document_to_bill':
      return 'Attach supporting document';
    case 'attach_statement_to_vendor_reconciliation':
      return 'Attach statement to vendor reconciliation';
    case 'attach_retainer_agreement_to_prepayment':
      return 'Attach retainer agreement to prepayment';
  }
}
