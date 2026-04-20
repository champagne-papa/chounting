// src/app/[locale]/[orgId]/agent/actions/page.tsx
// Phase 1.2 Session 8 Commit 1 — placeholder.
// Replaced by Commit 2 with the functional AI Action Review queue
// page (role-gated on ai_actions.read, renders ai_actions rows
// with links to journal entries for confirmed rows). This commit
// ships the route slot so the Mainframe "AI Action Review" icon
// doesn't 404; role gating is added in Commit 2.

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';

type PageProps = {
  params: Promise<{ locale: string; orgId: string }>;
};

export default async function AgentActionsPage({ params }: PageProps) {
  const { locale } = await params;
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-neutral-900 mb-2">
        AI Action Review
      </h1>
      <p className="text-sm text-neutral-600">
        No AI actions yet — this page will show the agent&apos;s proposed
        entries once you start using the system.
      </p>
    </div>
  );
}
