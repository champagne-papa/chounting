// src/app/[locale]/settings/profile/page.tsx
// Phase 1.2 Session 6 §6.7 — thin wrapper over UserProfileEditor.
// Per Pre-decision 1, route pages import the canvas component
// directly so the agent's canvas_directive and the avatar-dropdown
// navigation (Session 7) both reach the same code.

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';
import { UserProfileEditor } from '@/components/canvas/UserProfileEditor';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UserProfileSettingsPage({ params }: PageProps) {
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
      <UserProfileEditor />
    </div>
  );
}
