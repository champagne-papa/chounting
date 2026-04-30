// src/app/[locale]/[orgId]/agent/actions/page.tsx
// Phase 1.2 Session 8 Commit 2 — AI Action Review queue (functional).
// Replaces the C1 placeholder.
//
// Authz flow (P30 deviation per founder ruling — all three personas
// hold ai_actions.read, so the permission check reduces to a
// membership check; getMembership + null-redirect matches
// settings/org/page.tsx precedent):
//   1. auth.getUser() → redirect to sign-in when no user.
//   2. getMembership(user.id, orgId) → redirect to
//      /<locale>/<orgId>/?forbidden=ai-actions-read when null.
//   3. Build minimal ServiceContext inline for the service call
//      (caller.org_ids = [orgId] only; the authz gate already
//      verified membership). Not used for authorization.
//   4. aiActionsService.list → rows.
//   5. Render <AiActionReviewTable />.
//
// Phase 2: if a future requirement needs role-discriminating reads
// (e.g., only controllers see rejected rows), switch back to
// canUserPerformAction with a full ServiceContext. ~10 LOC delta.

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { env } from '@/shared/env';
import { getMembership } from '@/services/auth/getMembership';
import { aiActionsService } from '@/services/agent/aiActionsService';
import { AiActionReviewTable } from '@/components/canvas/AiActionReviewTable';
import type { ServiceContext } from '@/services/middleware/serviceContext';

type PageProps = {
  params: Promise<{ locale: string; orgId: string }>;
};

export default async function AgentActionsPage({ params }: PageProps) {
  const { locale, orgId } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const membership = await getMembership(user.id, orgId);
  if (!membership) {
    redirect(`/${locale}/${orgId}/?forbidden=ai-actions-read`);
  }

  const ctx: ServiceContext = {
    trace_id: crypto.randomUUID(),
    caller: {
      verified: true,
      user_id: user.id,
      email: user.email ?? '',
      org_ids: [orgId],
    },
    locale: locale as ServiceContext['locale'],
  };

  const rows = await aiActionsService.list({ org_id: orgId }, ctx);
  const t = await getTranslations('aiActionReview');

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-neutral-900 mb-4">{t('heading')}</h1>
      <AiActionReviewTable rows={rows} orgId={orgId} locale={locale} />
    </div>
  );
}
