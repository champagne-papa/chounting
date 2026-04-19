// src/app/[locale]/welcome/page.tsx
// Phase 1.2 Session 5 / sub-brief §6.7 — onboarding entry point.
//
// Server component: reads the authenticated user's memberships +
// user_profiles.display_name, computes the initial OnboardingState
// per master §11.5(c), and renders the minimal-functional welcome
// layout with AgentChatPanel in onboarding mode.
//
// Pre-decision 1: no Mainframe rail, no ContextualCanvas, no
// ProposedEntryCard, no SuggestedPrompts. A flat layout with the
// chat panel full-width.
//
// Pre-decision 3: invited-user detection via server component —
// one round trip, no client-side loading flash, onboarding suffix
// is correct from turn one.
//
// Pre-decision 4: invited-user orgId is null uniformly. The
// onboardingCompletionHref prop is computed server-side from the
// invited user's first-membership org (if any) so the client's
// router.push target is known before the first chat message —
// fresh users who create their org mid-onboarding re-query
// client-side via the helper in AgentChatPanel.

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';
import { AgentChatPanel } from '@/components/bridge/AgentChatPanel';
import type { OnboardingState } from '@/agent/onboarding/state';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function WelcomePage({ params }: PageProps) {
  const { locale } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // no-op for server components
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: the sign-in redirect (§6.8) should route
  // unauthenticated users away from /welcome, but handle the
  // case of direct navigation anyway.
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Query memberships (active) + display_name. Both reads are
  // scoped to the caller by RLS (user_has_org_access / own-row
  // policies from Phase 1.5B).
  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase
      .from('memberships')
      .select('org_id')
      .eq('status', 'active'),
    supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const activeMemberships = memberships ?? [];
  const displayName = profile?.display_name ?? null;

  // Defense-in-depth: a user who shouldn't be on /welcome (has
  // membership AND display_name) is routed back to the main app.
  // Normally the sign-in redirect catches this before the user
  // reaches /welcome; deep-link scenarios land here.
  if (activeMemberships.length > 0 && displayName !== null && displayName.length > 0) {
    const firstOrgId = activeMemberships[0].org_id;
    redirect(`/${locale}/${firstOrgId}`);
  }

  // Compute the initial OnboardingState per master §11.5(c).
  const isInvitedUser = activeMemberships.length > 0;
  const initialState: OnboardingState = {
    in_onboarding: true,
    current_step: 1,
    // Fresh user: nothing pre-completed. Invited user: org and
    // industry already exist (steps 2 and 3), profile still
    // needed (step 1) — which is why they're on /welcome.
    completed_steps: isInvitedUser ? [2, 3] : [],
    invited_user: isInvitedUser,
  };

  // Pre-decision 4: invited-user orgId is null uniformly. The
  // completion-href hint lets the invited-user branch of the
  // chat panel route to their existing org without re-querying;
  // fresh users re-query client-side when they complete
  // onboarding (see AgentChatPanel.resolveCompletionHref).
  const completionHref = isInvitedUser
    ? `/${locale}/${activeMemberships[0].org_id}`
    : undefined;

  // Phase 1.2 Session 6 §6.8 — skip-link to the form-based profile
  // surface. Visible at step 1 only per Pre-decision 3 (step 2/3
  // have no form-escape — org creation is conversational-only;
  // step 4 is not skippable). The link is a sibling to the chat
  // panel, not inside it — AgentChatPanel stays untouched (Session
  // 7 rewrite seam).
  const showSkipLink = initialState.current_step === 1;

  return (
    <div className="fixed inset-0 flex bg-white">
      {showSkipLink && (
        <a
          href={`/${locale}/settings/profile`}
          className="fixed top-4 right-4 z-10 text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-4 decoration-neutral-300"
        >
          Skip to form
        </a>
      )}
      <div className="flex-1 max-w-2xl mx-auto flex flex-col">
        <AgentChatPanel
          orgId={null}
          initialOnboardingState={initialState}
          onboardingCompletionHref={completionHref}
        />
      </div>
    </div>
  );
}
