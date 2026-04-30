// src/components/ProposedEntryCard.tsx
// Phase 1.2 Session 7 Commit 2 — real render per sub-brief §4.
// Four Questions framing (master §10.2), policy-outcome prose
// per ADR-0002, Approve / Reject / Edit buttons with the
// interaction shapes documented in the sub-brief.
//
// The card is rendered in two contexts:
//   1. Inline in the production chat transcript (Commit 3, via
//      AgentChatPanel / ProductionChat)
//   2. Via ContextualCanvas when a proposed_entry_card
//      directive is routed to the canvas (pre-existing path)
//
// The callbacks (onResolved, onNavigate) are optional so the
// canvas render path works without wiring: the card still
// approves/rejects/edits via its own fetch, just without
// transcript-level side effects.

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { ProposedEntryCard as ProposedEntryCardType } from '@/shared/types/proposedEntryCard';

export type ProposedEntryCardResolved =
  | {
      outcome: 'approved';
      journal_entry_id: string;
      entry_number?: number;
    }
  | { outcome: 'rejected'; reason?: string }
  | { outcome: 'edited' };

interface Props {
  card: ProposedEntryCardType;
  onResolved?: (resolved: ProposedEntryCardResolved) => void;
  onNavigate?: (directive: CanvasDirective) => void;
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting'; which: 'approve' | 'reject' | 'edit' }
  | { kind: 'resolved'; outcome: 'approved' | 'rejected' | 'edited' }
  | { kind: 'error'; message: string };

export function ProposedEntryCard({ card, onResolved, onNavigate }: Props) {
  const t = useTranslations();
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isSubmitting = submitState.kind === 'submitting';
  const isResolved = submitState.kind === 'resolved';

  async function handleApprove() {
    setSubmitState({ kind: 'submitting', which: 'approve' });
    try {
      const res = await fetch('/api/agent/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: card.org_id,
          idempotency_key: card.idempotency_key,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.message ?? `Confirm failed (${res.status})`);
      }
      const data = (await res.json()) as {
        journal_entry_id: string;
        entry_number?: number;
      };
      setSubmitState({ kind: 'resolved', outcome: 'approved' });
      onNavigate?.({
        type: 'journal_entry',
        orgId: card.org_id,
        entryId: data.journal_entry_id,
        mode: 'view',
      });
      onResolved?.({
        outcome: 'approved',
        journal_entry_id: data.journal_entry_id,
        entry_number: data.entry_number,
      });
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
      const res = await fetch('/api/agent/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: card.org_id,
          idempotency_key: card.idempotency_key,
          outcome: 'rejected',
          ...(trimmed.length > 0 && { reason: trimmed }),
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.message ?? `Reject failed (${res.status})`);
      }
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

  async function handleEdit() {
    setSubmitState({ kind: 'submitting', which: 'edit' });
    try {
      const res = await fetch('/api/agent/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: card.org_id,
          idempotency_key: card.idempotency_key,
          outcome: 'edited',
          reason: 'edited_and_replaced',
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.message ?? `Edit failed (${res.status})`);
      }
      setSubmitState({ kind: 'resolved', outcome: 'edited' });
      onNavigate?.({
        type: 'journal_entry_form',
        orgId: card.org_id,
        prefill: buildPrefillFromCard(card),
      });
      onResolved?.({ outcome: 'edited' });
    } catch (err) {
      setSubmitState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Edit failed',
      });
    }
  }

  const policyProse = safeTranslate(
    t,
    card.policy_outcome.reason_template_id,
    card.policy_outcome.reason_params,
  );

  return (
    <div
      className={`rounded-lg border border-neutral-300 bg-white p-4 max-w-2xl shadow-sm${
        card.tentative ? ' opacity-75 italic' : ''
      }`}
      data-testid="proposed-entry-card"
    >
      {card.tentative && (
        <div
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600"
          data-testid="proposed-entry-tentative-badge"
        >
          Tentative
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {card.org_name}
        </div>
        <div className="text-xs text-neutral-500">
          {t('proposed_entry.policy.approve_required')}
        </div>
      </div>

      <Section heading={t('proposed_entry.what_changed')}>
        <div className="text-sm text-neutral-700 mb-2">
          <span className="text-neutral-500">{card.entry_date}</span>
          {' · '}
          <span>{card.description}</span>
          {card.vendor_name && (
            <>
              {' · '}
              <span className="text-neutral-500">{card.vendor_name}</span>
            </>
          )}
        </div>
        <LinesTable lines={card.lines} />
      </Section>

      <Section heading="Why?">
        <div className="text-sm text-neutral-700">{policyProse}</div>
      </Section>

      <Section heading="Track record?">
        <div className="text-sm text-neutral-700">
          {card.matched_rule_label
            ? t('proposed_entry.why.rule_matched', { label: card.matched_rule_label })
            : t('proposed_entry.track_record.no_rule')}
        </div>
      </Section>

      <Section heading="If rejected?">
        <div className="text-sm text-neutral-700">
          {t('proposed_entry.if_rejected.journal_entry')}
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
            data-testid="proposed-entry-approve"
          >
            {submitState.kind === 'submitting' && submitState.which === 'approve'
              ? 'Confirming…'
              : 'Approve'}
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            onClick={() => setRejectOpen(true)}
            disabled={isSubmitting || rejectOpen}
            data-testid="proposed-entry-reject"
          >
            Reject
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            onClick={handleEdit}
            disabled={isSubmitting || rejectOpen}
            data-testid="proposed-entry-edit"
          >
            {submitState.kind === 'submitting' && submitState.which === 'edit'
              ? 'Opening…'
              : 'Edit'}
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
            data-testid="proposed-entry-reject-reason"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              onClick={handleRejectConfirm}
              disabled={isSubmitting}
              data-testid="proposed-entry-reject-confirm"
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
        <div className="mt-4 text-sm text-neutral-600" data-testid="proposed-entry-resolved">
          {submitState.outcome === 'approved' && '✓ Approved'}
          {submitState.outcome === 'rejected' && '✕ Rejected'}
          {submitState.outcome === 'edited' && '✎ Edited and replaced'}
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

function LinesTable({ lines }: { lines: ProposedEntryCardType['lines'] }) {
  return (
    <table className="w-full text-sm" data-testid="proposed-entry-lines">
      <thead>
        <tr className="text-left text-xs text-neutral-500">
          <th className="py-1 pr-2 font-normal">Account</th>
          <th className="py-1 pr-2 font-normal text-right">Debit</th>
          <th className="py-1 pr-2 font-normal text-right">Credit</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, i) => (
          <tr key={i} className="border-t border-neutral-100">
            <td className="py-1 pr-2">
              <div className="font-mono text-xs text-neutral-500">{line.account_code}</div>
              <div>{line.account_name}</div>
              {line.description && (
                <div className="text-xs text-neutral-500">{line.description}</div>
              )}
            </td>
            <td className="py-1 pr-2 text-right font-mono tabular-nums">
              {renderAmount(line.debit, line.currency)}
            </td>
            <td className="py-1 pr-2 text-right font-mono tabular-nums">
              {renderAmount(line.credit, line.currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderAmount(amount: string, currency: string): string {
  // INV-MONEY-001: amount is a canonical MoneyAmount string (4dp). Render
  // "0.0000" as blank so the debit/credit column is sparse, not zero-littered.
  if (/^-?0+(\.0+)?$/.test(amount)) return '';
  return `${amount} ${currency}`;
}

function buildPrefillFromCard(
  card: ProposedEntryCardType,
): Record<string, unknown> {
  // The journal-entry form consumes `prefill` as a loose record
  // (canvasDirective.schema.ts: prefill?: z.record(...)). Edit
  // path passes the card's core fields; the form maps them into
  // its shape. Values the form doesn't recognize are ignored.
  return {
    entry_date: card.entry_date,
    description: card.description,
    lines: card.lines,
    source_idempotency_key: card.idempotency_key,
  };
}

function safeTranslate(
  t: ReturnType<typeof useTranslations>,
  key: string,
  params: Record<string, unknown>,
): string {
  // next-intl throws if a key is missing; a malformed reason_template_id
  // from the agent shouldn't crash the card render. Fall back to the
  // key itself — loud enough for debugging, silent enough for the user.
  try {
    return t(key, params as never);
  } catch {
    return key;
  }
}
