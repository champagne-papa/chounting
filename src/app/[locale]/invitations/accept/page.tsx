// src/app/[locale]/invitations/accept/page.tsx
// Phase 1.2 Session 6 §6.5 — invitation accept page with 5-state
// server-component branching per master §20 EC-26.
//
// States in order (per sub-brief §6.5 + Pre-decision 4):
//   1. not signed in    → redirect to /sign-in with returnTo
//   2. email-mismatch   → derived from preview.invitedEmail !== user.email
//                         (this check BEFORE token-validity per §6.5:
//                         the mismatch case is actionable, invalid is
//                         terminal)
//   3. invalid          → service returned state: 'invalid'
//   4. expired          → service returned state: 'expired'
//   5. already accepted → idempotent redirect to the org (not a 6th branch)
//   happy path          → Accept CTA → POST /api/invitations/accept
//
// The email-mismatch branch lives in the PAGE — the service
// returns invitation facts only. The page compares caller.email
// against the returned invitedEmail.

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';
import { invitationService } from '@/services/org/invitationService';
import { AcceptInvitationButton } from './AcceptInvitationButton';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function InvitationAcceptPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { token } = await searchParams;
  const cookieStore = await cookies();

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  if (!token) {
    return <InvalidInvitationView />;
  }

  const { data: { user } } = await supabase.auth.getUser();

  // State 1: not signed in → redirect to sign-in with returnTo.
  if (!user) {
    const returnTo = `/${locale}/invitations/accept?token=${encodeURIComponent(token)}`;
    redirect(`/${locale}/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const preview = await invitationService.previewInvitationByToken(token);

  // State 4: invalid.
  if (preview.state === 'invalid') {
    return <InvalidInvitationView />;
  }
  // State 5: expired.
  if (preview.state === 'expired') {
    return <ExpiredInvitationView />;
  }
  // Already-accepted → idempotent bounce to the org. Not a 6th
  // state per Pre-decision 4's handling: the invitee has already
  // accepted; just route them to the org.
  if (preview.state === 'already_accepted') {
    redirect(`/${locale}/${preview.orgId}`);
  }

  // State === 'pending' from here. preview.invitedEmail + preview.orgId
  // are guaranteed populated.

  // State 3: email mismatch — caller is signed in as a different
  // user than the invitation was sent to.
  const invitedEmail = preview.invitedEmail!;
  const callerEmail = (user.email ?? '').toLowerCase();
  if (invitedEmail.toLowerCase() !== callerEmail) {
    return (
      <EmailMismatchView
        invitedEmail={invitedEmail}
        callerEmail={user.email ?? ''}
      />
    );
  }

  // State 2: signed in, email matches, pending → Accept CTA.
  return (
    <AcceptPendingView
      locale={locale}
      token={token}
      orgId={preview.orgId!}
      invitedEmail={invitedEmail}
    />
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-50">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function AcceptPendingView({
  locale,
  token,
  orgId,
  invitedEmail,
}: {
  locale: string;
  token: string;
  orgId: string;
  invitedEmail: string;
}) {
  return (
    <PageFrame>
      <h1 className="text-lg font-semibold mb-2">You&rsquo;re invited</h1>
      <p className="text-sm text-neutral-600 mb-5">
        This invitation was sent to{' '}
        <span className="font-medium text-neutral-900">{invitedEmail}</span>.
        Accepting will add this organization to your account.
      </p>
      <AcceptInvitationButton
        token={token}
        redirectTo={`/${locale}/${orgId}`}
      />
    </PageFrame>
  );
}

function EmailMismatchView({
  invitedEmail,
  callerEmail,
}: {
  invitedEmail: string;
  callerEmail: string;
}) {
  return (
    <PageFrame>
      <h1 className="text-lg font-semibold mb-2">Signed in as a different account</h1>
      <p className="text-sm text-neutral-600 mb-2">
        This invitation was sent to{' '}
        <span className="font-medium text-neutral-900">{invitedEmail}</span>.
        You&rsquo;re signed in as{' '}
        <span className="font-medium text-neutral-900">{callerEmail}</span>.
      </p>
      <p className="text-sm text-neutral-600">
        Sign out and sign back in with the correct email to accept.
      </p>
    </PageFrame>
  );
}

function InvalidInvitationView() {
  return (
    <PageFrame>
      <h1 className="text-lg font-semibold mb-2">Invitation not found</h1>
      <p className="text-sm text-neutral-600">
        This invitation link is no longer valid. Ask the person who
        invited you to send a new one.
      </p>
    </PageFrame>
  );
}

function ExpiredInvitationView() {
  return (
    <PageFrame>
      <h1 className="text-lg font-semibold mb-2">Invitation expired</h1>
      <p className="text-sm text-neutral-600">
        This invitation has expired. Ask the person who invited you
        to send a new one.
      </p>
    </PageFrame>
  );
}
