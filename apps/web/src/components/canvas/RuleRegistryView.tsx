'use client';
// apps/web/src/components/canvas/RuleRegistryView.tsx
//
// Ring 2A-core Commit 5 (ADR-0025 §10). The Stage 1 rule-registry canvas — the
// controller-governed management surface for vendor rules. Read-view shape per
// the OpenBillsView precedent: 'use client' + fetch + loading/error/empty/data.
//
// List: one row per rule with two separate badges (current_rung +
// lifecycle_state), a "Last won" indicator (OQ-5 — rule_track_records
// .last_winning_match_at, surfaced at the response root by Commit 4's
// listForCanvas; null → "Never won"), and trailing-30-day evaluation counters.
// Sort/filter bind to the ?sort= / ?lifecycle= / ?rung= params Commit 4 ships
// (?health= deferred). An expandable per-row detail shows the track-record +
// 30-day breakdown and lifecycle anchors (ADR-0025 §10 "behavior, not logic").
//
// Row actions (raw fetch POST to each Commit-4 sub-route, then REFETCH the list
// on success — Correction 3: the rule persists in the registry, so refetch-in-
// place, no optimistic update, no navigate-away):
//   - rename → inline edit (small form).
//   - demote / retire → inline amber warning banner + red high-friction confirm
//     button (the BillReverseCard pattern; the project has no confirm-dialog
//     convention). Disabled on already-retired rules (terminal state).
//   - promote → opens the inert promotion-ceremony modal (no POST; ladder is
//     intentionally disabled at v1).
//
// Imports nothing from @/services or @/db — the canvas is below the service
// layer in the authority gradient (ADR-0020); HTTP is the only boundary. The
// response contract is typed locally at the consumer.

import { Fragment, useEffect, useState } from 'react';
import { InertPromotionModal } from '@/components/canvas/InertPromotionModal';

// --- Response contract (mirrors ruleRegistryService.listForCanvas / Commit 4).
// track_record + window_30d arrive as opaque JSON objects on the wire; typed
// here from the rule_track_records / rule_evaluation_30d_view column sets.
//
// Forward-flag: TrackRecord + Window30d are locally declared because this
// file is the sole consumer of the list-route response shape today. If a
// second consumer appears (Stage 2 canvas, Ring 2B, any other reader of
// /api/orgs/[orgId]/rules), promote both types to a new module at
// apps/web/src/shared/rules/canvas-types.ts — the shared/rules/ directory
// already exists with capping.ts + disposition.ts + types.ts; the promotion
// creates a new file alongside them. Per-instance judgment — there is no
// general type-sharing-threshold convention this instantiates. Forward-flag
// added at the hygiene-post-ring2a-core arc (item 7), post-dc1d959e.

type Rung = 'always_confirm' | 'notify_and_auto_post' | 'silent_auto';
type Lifecycle = 'proposed' | 'active' | 'demoted' | 'retired';

type TrackRecord = {
  clean_approval_count?: number;
  guardrail_fire_count?: number;
  guardrail_confirmed_count?: number;
  guardrail_resolved_into_primary_bounds_count?: number;
  rejection_count?: number;
  last_winning_match_at?: string | null;
  last_guardrail_fire_at?: string | null;
  last_rejection_at?: string | null;
  last_clean_approval_at?: string | null;
};

type Window30d = {
  evaluation_count?: number | null;
  primary_match_count?: number | null;
  guardrail_match_count?: number | null;
  almost_match_count?: number | null;
  disposition_auto_posted_count?: number | null;
  disposition_blocked_count?: number | null;
  disposition_routed_count?: number | null;
  disposition_pending_count?: number | null;
  last_evaluated_at?: string | null;
};

type RuleRow = {
  id: string;
  name: string | null;
  rule_type: string;
  current_rung: Rung;
  lifecycle_state: Lifecycle;
  created_at: string;
  last_winning_match_at: string | null;
  track_record: TrackRecord | null;
  window_30d: Window30d | null;
};

type RulesResponse = { rules: RuleRow[]; count: number };

type ActionKind = 'rename' | 'demote' | 'retire';
type ActiveAction = { ruleId: string; kind: ActionKind; draft: string };

const SIGN_IN_PATH = '/en/sign-in';

const fmtDate = (ts: string | null | undefined): string | null => (ts ? ts.slice(0, 10) : null);

function rungBadge(rung: Rung) {
  const cls: Record<Rung, string> = {
    always_confirm: 'bg-neutral-100 text-neutral-700',
    notify_and_auto_post: 'bg-blue-100 text-blue-700',
    silent_auto: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium font-mono ${cls[rung]}`}>
      {rung}
    </span>
  );
}

function lifecycleBadge(state: Lifecycle) {
  const cls: Record<Lifecycle, string> = {
    proposed: 'bg-neutral-100 text-neutral-600',
    active: 'bg-green-100 text-green-700',
    demoted: 'bg-amber-100 text-amber-800',
    retired: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls[state]}`}>
      {state}
    </span>
  );
}

export interface RuleRegistryViewProps {
  orgId: string;
}

export function RuleRegistryView({ orgId }: RuleRegistryViewProps) {
  const [rules, setRules] = useState<RuleRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lifecycle, setLifecycle] = useState('');
  const [rung, setRung] = useState('');
  const [sort, setSort] = useState('recent');

  // reloadToken bumps to re-fire the list fetch after a successful mutation.
  const [reloadToken, setReloadToken] = useState(0);

  const [action, setAction] = useState<ActiveAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [promoteFor, setPromoteFor] = useState<RuleRow | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const p = new URLSearchParams();
    if (lifecycle) p.set('lifecycle', lifecycle);
    if (rung) p.set('rung', rung);
    if (sort) p.set('sort', sort);
    const qs = p.toString();

    fetch(`/api/orgs/${orgId}/rules${qs ? `?${qs}` : ''}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = SIGN_IN_PATH;
            return null;
          }
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || body.error || 'Failed to load rules');
        }
        return res.json();
      })
      .then((body: RulesResponse | null) => {
        if (cancelled || body === null) return;
        setRules(body.rules ?? []);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, lifecycle, rung, sort, reloadToken]);

  function startAction(rule: RuleRow, kind: ActionKind) {
    setActionError(null);
    setAction({ ruleId: rule.id, kind, draft: kind === 'rename' ? rule.name ?? '' : '' });
  }

  function cancelAction() {
    setAction(null);
    setActionError(null);
  }

  // POST a row action (demote / retire / rename), then refetch on success.
  // promote is intentionally absent — it opens the inert modal, never POSTs.
  async function submitAction(rule: RuleRow, kind: ActionKind, draft: string) {
    setActionError(null);
    setActionSubmitting(true);
    try {
      const body = kind === 'rename' ? JSON.stringify({ name: draft.trim() }) : '{}';
      const res = await fetch(`/api/orgs/${orgId}/rules/${rule.id}/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = SIGN_IN_PATH;
          return;
        }
        const errorBody = await res.json().catch(() => ({}));
        if (res.status === 400 && errorBody.details) {
          const msg = errorBody.details
            .map((i: { message?: string }) => i.message)
            .filter(Boolean)
            .join('; ');
          setActionError(msg || 'Invalid request');
        } else {
          setActionError(errorBody.message || errorBody.error || 'Action failed.');
        }
        return;
      }
      setAction(null);
      setReloadToken((t) => t + 1);
    } catch {
      setActionError('Action failed. Please try again.');
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <div className="p-6" data-testid="rule-registry-view">
      <h2 className="text-lg font-semibold mb-4">Rules</h2>

      {/* Filters / sort — bound to Commit 4's ?lifecycle / ?rung / ?sort params. */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm" data-testid="rule-registry-filters">
        <select
          aria-label="Filter by lifecycle"
          value={lifecycle}
          onChange={(e) => setLifecycle(e.target.value)}
          className="border border-neutral-300 rounded px-2 py-1"
        >
          <option value="">All lifecycle states</option>
          <option value="proposed">Proposed</option>
          <option value="active">Active</option>
          <option value="demoted">Demoted</option>
          <option value="retired">Retired</option>
        </select>
        <select
          aria-label="Filter by rung"
          value={rung}
          onChange={(e) => setRung(e.target.value)}
          className="border border-neutral-300 rounded px-2 py-1"
        >
          <option value="">All rungs</option>
          <option value="always_confirm">always_confirm</option>
          <option value="notify_and_auto_post">notify_and_auto_post</option>
          <option value="silent_auto">silent_auto</option>
        </select>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-neutral-300 rounded px-2 py-1"
        >
          <option value="recent">Most recently won</option>
          <option value="name">Name</option>
          <option value="created">Newest</option>
        </select>
      </div>

      {loading && <div className="text-sm text-neutral-400">Loading...</div>}
      {error && (
        <div
          className="p-3 border border-red-300 rounded bg-red-50 text-sm text-red-600"
          data-testid="rule-registry-error"
        >
          {error}
        </div>
      )}
      {!loading && !error && rules && rules.length === 0 && (
        <div className="text-sm text-neutral-400" data-testid="rule-registry-empty">
          No rules in the registry yet.
        </div>
      )}

      {!loading && !error && rules && rules.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
              <th className="py-2 pr-4 text-left">Name</th>
              <th className="py-2 pr-4 text-left">Type</th>
              <th className="py-2 pr-4 text-left">Rung</th>
              <th className="py-2 pr-4 text-left">Lifecycle</th>
              <th className="py-2 pr-4 text-left">Last won</th>
              <th className="py-2 pr-4 text-right">30d evals</th>
              <th className="py-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => {
              const retired = r.lifecycle_state === 'retired';
              const lastWon = fmtDate(r.last_winning_match_at);
              return (
                <Fragment key={r.id}>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        className="text-left text-blue-600 hover:underline"
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        aria-expanded={expandedId === r.id}
                      >
                        {r.name ?? '(unnamed)'}
                      </button>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-neutral-600">{r.rule_type}</td>
                    <td className="py-2 pr-4">{rungBadge(r.current_rung)}</td>
                    <td className="py-2 pr-4">{lifecycleBadge(r.lifecycle_state)}</td>
                    <td className="py-2 pr-4">
                      {lastWon ? (
                        lastWon
                      ) : (
                        <span className="text-neutral-400">Never won</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {r.window_30d?.evaluation_count ?? 0}
                    </td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline disabled:text-neutral-300 disabled:no-underline"
                        onClick={() => startAction(r, 'rename')}
                        disabled={actionSubmitting}
                      >
                        Rename
                      </button>
                      <span className="text-neutral-300 mx-2">|</span>
                      <button
                        type="button"
                        className="text-blue-600 hover:underline disabled:text-neutral-300 disabled:no-underline"
                        onClick={() => setPromoteFor(r)}
                        disabled={retired || actionSubmitting}
                      >
                        Promote
                      </button>
                      <span className="text-neutral-300 mx-2">|</span>
                      <button
                        type="button"
                        className="text-amber-700 hover:underline disabled:text-neutral-300 disabled:no-underline"
                        onClick={() => startAction(r, 'demote')}
                        disabled={retired || actionSubmitting}
                      >
                        Demote
                      </button>
                      <span className="text-neutral-300 mx-2">|</span>
                      <button
                        type="button"
                        className="text-red-600 hover:underline disabled:text-neutral-300 disabled:no-underline"
                        onClick={() => startAction(r, 'retire')}
                        disabled={retired || actionSubmitting}
                      >
                        Retire
                      </button>
                    </td>
                  </tr>

                  {/* Inline action surface (replaces a confirm dialog). */}
                  {action?.ruleId === r.id && (
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <td colSpan={7} className="py-3 px-4">
                        {action.kind === 'rename' ? (
                          <div className="flex flex-col gap-2" data-testid="rule-rename-form">
                            <label className="text-sm font-medium text-neutral-600">
                              Rename rule
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={action.draft}
                                maxLength={200}
                                onChange={(e) =>
                                  setAction({ ...action, draft: e.target.value })
                                }
                                aria-label="Rule name"
                                className="flex-1 border border-neutral-300 rounded px-2 py-1 text-sm"
                              />
                              <button
                                type="button"
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => void submitAction(r, 'rename', action.draft)}
                                disabled={actionSubmitting || action.draft.trim().length === 0}
                              >
                                {actionSubmitting ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1 bg-neutral-200 text-neutral-700 rounded text-sm hover:bg-neutral-300 disabled:opacity-50"
                                onClick={cancelAction}
                                disabled={actionSubmitting}
                              >
                                Cancel
                              </button>
                            </div>
                            {actionError && (
                              <p className="text-sm text-red-600" data-testid="rule-action-error">
                                {actionError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="p-3 border border-amber-300 rounded bg-amber-50 text-sm text-amber-800">
                              {action.kind === 'demote'
                                ? 'Demoting returns this rule to always_confirm (suggest with required approval) and marks it demoted. It stays in the registry and can be promoted again post-v1.'
                                : 'Retiring is terminal — the rule stops evaluating and cannot be reactivated. To replace it, retire this rule and create a new one.'}
                            </div>
                            {actionError && (
                              <p
                                className="p-2 border border-red-300 rounded bg-red-50 text-sm text-red-600"
                                data-testid="rule-action-error"
                              >
                                {actionError}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => void submitAction(r, action.kind, '')}
                                disabled={actionSubmitting}
                              >
                                {actionSubmitting
                                  ? 'Working...'
                                  : action.kind === 'demote'
                                    ? 'Confirm demotion'
                                    : 'Confirm retirement'}
                              </button>
                              <button
                                type="button"
                                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded text-sm hover:bg-neutral-300 disabled:opacity-50"
                                onClick={cancelAction}
                                disabled={actionSubmitting}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* Expandable detail — track-record + 30d breakdown + anchors. */}
                  {expandedId === r.id && (
                    <tr className="border-b border-neutral-100 bg-neutral-50/60">
                      <td colSpan={7} className="py-3 px-4" data-testid="rule-detail">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-neutral-600">
                          <div className="col-span-2 md:col-span-4 font-medium text-neutral-500 uppercase tracking-wide">
                            Cumulative
                          </div>
                          <div>Clean approvals: {r.track_record?.clean_approval_count ?? 0}</div>
                          <div>Guardrail fires: {r.track_record?.guardrail_fire_count ?? 0}</div>
                          <div>Guardrail confirmed: {r.track_record?.guardrail_confirmed_count ?? 0}</div>
                          <div>Rejections: {r.track_record?.rejection_count ?? 0}</div>

                          <div className="col-span-2 md:col-span-4 font-medium text-neutral-500 uppercase tracking-wide mt-2">
                            Trailing 30 days
                          </div>
                          <div>Evaluations: {r.window_30d?.evaluation_count ?? 0}</div>
                          <div>Primary matches: {r.window_30d?.primary_match_count ?? 0}</div>
                          <div>Guardrail matches: {r.window_30d?.guardrail_match_count ?? 0}</div>
                          <div>Almost-matches: {r.window_30d?.almost_match_count ?? 0}</div>

                          <div className="col-span-2 md:col-span-4 font-medium text-neutral-500 uppercase tracking-wide mt-2">
                            Lifecycle
                          </div>
                          <div>Last won: {fmtDate(r.last_winning_match_at) ?? 'Never'}</div>
                          <div>Created: {fmtDate(r.created_at) ?? '—'}</div>
                          <div className="col-span-2 md:col-span-2 text-neutral-400">
                            Recent-match log view available post-Ring-2A.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      {promoteFor && (
        <InertPromotionModal ruleName={promoteFor.name} onClose={() => setPromoteFor(null)} />
      )}
    </div>
  );
}
