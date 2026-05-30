// src/components/ProposedRuleCard.tsx
//
// Ring 2A-authoring (ADR-0026 §3/§5/§8). The creation-time proposal card for a
// vendor-coding rule, rendered from the proposed_rule_card canvas_directive's
// ProposedRuleDraft payload (commit d). Mirrors ProposedEntryCard's Four-Questions
// grammar + SubmitState machine, with three rule-specific divergences:
//
//  - Creation-time population (V2 three-framing): Q1-Q4 render from the rule-draft
//    + the controller's utterance, NOT from MatchResult / policy_outcome.
//  - Approve POSTs to /api/orgs/[orgId]/rules (commit c's create→approve two-step),
//    NOT /api/agent/confirm. On success → navigate to the rule registry.
//  - Reject / Edit are EPHEMERAL (Decision 5): the draft persists nothing
//    pre-approval (no ai_actions row / idempotency_key), so there is no reject-POST.
//    Reject dismisses; Edit dismisses and the controller re-drafts in chat.
//
// account_hint is rendered as the controller's stated intent (v1 display-only);
// default_account_id is not resolved/sent at v1 (createVendorRule defaults it null;
// account-coding activates at Ring 2B). orgId comes from the route (useParams), not
// the directive payload.

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { ProposedRuleDraft } from '@/shared/schemas/rules/proposedRuleCard.schema';

export type ProposedRuleCardResolved =
  | { outcome: 'approved'; rule_id: string }
  | { outcome: 'rejected' }
  | { outcome: 'edited' };

interface Props {
  card: ProposedRuleDraft;
  onResolved?: (resolved: ProposedRuleCardResolved) => void;
  onNavigate?: (directive: CanvasDirective) => void;
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting'; which: 'approve' | 'reject' | 'edit' }
  | { kind: 'resolved'; outcome: 'approved' | 'rejected' | 'edited' }
  | { kind: 'error'; message: string };

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{heading}</div>
      {children}
    </div>
  );
}

export function ProposedRuleCard({ card, onResolved, onNavigate }: Props) {
  const t = useTranslations();
  const params = useParams();
  const orgId = typeof params.orgId === 'string' ? params.orgId : '';
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  const account = card.account_hint ?? '';

  async function handleApprove() {
    setSubmitState({ kind: 'submitting', which: 'approve' });
    try {
      const res = await fetch(`/api/orgs/${orgId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // v1: default_account_id omitted (display-only account_hint; createVendorRule
        // defaults it null). vendor_id + bundle_type are the resolved create inputs.
        body: JSON.stringify({ vendor_id: card.vendor_id, bundle_type: card.bundle_type }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.message ?? `Create failed (${res.status})`);
      }
      const data = (await res.json()) as { rule_id: string; created: boolean };
      setSubmitState({ kind: 'resolved', outcome: 'approved' });
      onNavigate?.({ type: 'rule_registry', orgId });
      onResolved?.({ outcome: 'approved', rule_id: data.rule_id });
    } catch (err) {
      setSubmitState({ kind: 'error', message: err instanceof Error ? err.message : 'Create failed' });
    }
  }

  // Reject / Edit are ephemeral (Decision 5): no persisted draft → no reject-POST.
  function handleReject() {
    setSubmitState({ kind: 'resolved', outcome: 'rejected' });
    onResolved?.({ outcome: 'rejected' });
  }
  function handleEdit() {
    // Edit = re-draft: dismiss this card; the controller re-states the rule in chat
    // (a fresh draftVendorRule → a new card). No reject-POST (no ai_actions path).
    setSubmitState({ kind: 'resolved', outcome: 'edited' });
    onResolved?.({ outcome: 'edited' });
  }

  if (submitState.kind === 'resolved') {
    return (
      <div data-testid="proposed-rule-resolved" className="text-sm text-neutral-500 border border-neutral-200 rounded p-3">
        {submitState.outcome === 'approved' && 'Rule created.'}
        {submitState.outcome === 'rejected' && 'Rule discarded.'}
        {submitState.outcome === 'edited' && 'Re-state the rule to draft it again.'}
      </div>
    );
  }

  return (
    <div data-testid="proposed-rule-card" className="border border-neutral-300 rounded-lg p-4 bg-white">
      <Section heading="What changed?">
        <div className="text-sm text-neutral-700">
          {t('proposed_rule.what_changed.vendor_rule', {
            vendor: card.vendor_name,
            bundle_type: card.bundle_type,
            account: account.length > 0 ? account : '—',
          })}
        </div>
      </Section>

      <Section heading="Why?">
        <div className="text-sm text-neutral-700">
          {t('proposed_rule.why.from_utterance', { utterance: card.utterance_summary ?? card.vendor_name })}
        </div>
      </Section>

      <Section heading="Track record?">
        <div className="text-sm text-neutral-700">{t('proposed_rule.track_record.new_rule')}</div>
      </Section>

      <Section heading="If rejected?">
        <div className="text-sm text-neutral-700">{t('proposed_rule.if_rejected.standard')}</div>
      </Section>

      {submitState.kind === 'error' && (
        <div data-testid="proposed-rule-error" className="text-sm text-red-600 mb-2">{submitState.message}</div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          data-testid="proposed-rule-approve"
          onClick={handleApprove}
          disabled={submitState.kind === 'submitting'}
          className="px-3 py-1.5 text-sm rounded bg-neutral-900 text-white disabled:opacity-40"
        >
          Approve
        </button>
        <button
          data-testid="proposed-rule-reject"
          onClick={handleReject}
          disabled={submitState.kind === 'submitting'}
          className="px-3 py-1.5 text-sm rounded border border-neutral-300 disabled:opacity-40"
        >
          Reject
        </button>
        <button
          data-testid="proposed-rule-edit"
          onClick={handleEdit}
          disabled={submitState.kind === 'submitting'}
          className="px-3 py-1.5 text-sm rounded border border-neutral-300 disabled:opacity-40"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
