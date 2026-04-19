// src/components/canvas/OrgUsersView.tsx
// Phase 1.2 Session 6 §6.4 — org users list + inline invite form.
// Data source: GET /api/orgs/[orgId]/users. Invite submits to
// POST /api/orgs/[orgId]/invitations. On success the returned
// token is displayed in a readonly text input with a Copy
// affordance (master §12.3 — manual sharing, no email delivery
// in Phase 1.2).
//
// `initialMode` prop is passed by ContextualCanvas dispatch for
// the `invite_user` directive type — it opens the view with the
// invite form pre-expanded.

'use client';

import { useEffect, useState } from 'react';
import { INVITATION_ROLES } from '@/shared/schemas/user/invitation.schema';

interface Props {
  orgId: string;
  initialMode?: 'list' | 'invite';
}

type OrgUser = {
  membership_id: string;
  user_id: string;
  role: string;
  status: string;
  is_org_owner: boolean;
  user_profiles: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type InviteState = 'idle' | 'submitting' | 'error';
type ZodIssue = { path: (string | number)[]; message: string };

export function OrgUsersView({ orgId, initialMode = 'list' }: Props) {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(initialMode === 'invite');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>(INVITATION_ROLES[2]);
  const [inviteState, setInviteState] = useState<InviteState>('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  async function loadUsers() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/orgs/${orgId}/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { users: OrgUser[] };
      setUsers(body.users ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteState('submitting');
    setInviteError(null);
    setFieldErrors({});
    setIssuedToken(null);

    try {
      const res = await fetch(`/api/orgs/${orgId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body?.details && Array.isArray(body.details)) {
          const errs: Record<string, string> = {};
          for (const issue of body.details as ZodIssue[]) {
            const key = String(issue.path[0] ?? '');
            if (key) errs[key] = issue.message;
          }
          setFieldErrors(errs);
          setInviteError('Please fix the highlighted fields.');
        } else if (body?.error === 'USER_ALREADY_MEMBER') {
          setInviteError('That person is already a member of this organization.');
        } else if (body?.error === 'INVITATION_ALREADY_PENDING') {
          setInviteError('A pending invitation for this email already exists.');
        } else {
          setInviteError(body?.message ?? body?.error ?? 'Invite failed.');
        }
        setInviteState('error');
        return;
      }
      setIssuedToken(body.token as string);
      setInviteState('idle');
      setInviteEmail('');
      // Refresh user list in case the API creates follow-up state;
      // safe no-op otherwise.
      loadUsers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Invite failed.');
      setInviteState('error');
    }
  }

  async function handleCopyToken() {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 1500);
    } catch {
      // clipboard may be unavailable in non-HTTPS / test contexts
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-sm text-neutral-500">
            People with access to this organization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen((v) => !v)}
          className="px-3 py-1.5 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          {inviteOpen ? 'Close invite' : 'Invite teammate'}
        </button>
      </div>

      {inviteOpen && (
        <div className="mb-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white ${
                    fieldErrors.email ? 'border-red-400' : 'border-neutral-300'
                  } focus:outline-none focus:ring-1 focus:ring-neutral-400`}
                />
                {fieldErrors.email && (
                  <span className="block text-xs text-red-600 mt-1">{fieldErrors.email}</span>
                )}
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-neutral-700 mb-1">Role</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white ${
                    fieldErrors.role ? 'border-red-400' : 'border-neutral-300'
                  } focus:outline-none focus:ring-1 focus:ring-neutral-400`}
                >
                  {INVITATION_ROLES.map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </label>
            </div>

            {inviteError && (
              <div className="text-sm text-red-600" role="alert">{inviteError}</div>
            )}

            <button
              type="submit"
              disabled={inviteState === 'submitting'}
              className="px-3 py-1.5 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {inviteState === 'submitting' ? 'Sending…' : 'Send invitation'}
            </button>
          </form>

          {issuedToken && (
            <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3">
              <div className="text-sm font-medium text-green-800 mb-2">
                Invitation created. Share this token manually:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={issuedToken}
                  className="flex-1 font-mono text-xs rounded-md border border-neutral-300 bg-white px-2 py-1.5"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-2 py-1.5 rounded-md border border-neutral-300 bg-white text-xs hover:bg-neutral-50"
                >
                  {copyStatus === 'copied' ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                The invitee visits /invitations/accept?token=… while signed in with this email.
              </p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-400">Loading team…</div>
      ) : loadError ? (
        <div className="text-sm text-red-600">Could not load team: {loadError}</div>
      ) : users.length === 0 ? (
        <div className="text-sm text-neutral-500">No members yet.</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="py-2 pr-4 font-medium text-neutral-500">Name</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Role</th>
              <th className="py-2 pr-4 font-medium text-neutral-500">Status</th>
              <th className="py-2 font-medium text-neutral-500">Owner</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.membership_id} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{displayName(u)}</td>
                <td className="py-2 pr-4">
                  <Badge tone="role">{roleLabel(u.role)}</Badge>
                </td>
                <td className="py-2 pr-4">
                  <Badge tone={u.status === 'active' ? 'active' : 'muted'}>
                    {u.status}
                  </Badge>
                </td>
                <td className="py-2">
                  {u.is_org_owner ? <Badge tone="owner">Owner</Badge> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function displayName(u: OrgUser): string {
  const p = u.user_profiles;
  if (p?.display_name) return p.display_name;
  if (p?.first_name || p?.last_name) {
    return [p.first_name, p.last_name].filter(Boolean).join(' ');
  }
  return '(no name set)';
}

function roleLabel(role: string): string {
  switch (role) {
    case 'controller':
      return 'Controller';
    case 'executive':
      return 'Executive';
    case 'ap_specialist':
      return 'AP specialist';
    default:
      return role;
  }
}

type BadgeTone = 'role' | 'active' | 'muted' | 'owner';
function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  const cls =
    tone === 'role'
      ? 'bg-blue-50 text-blue-800 border-blue-200'
      : tone === 'active'
        ? 'bg-green-50 text-green-800 border-green-200'
        : tone === 'owner'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-neutral-100 text-neutral-700 border-neutral-200';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
