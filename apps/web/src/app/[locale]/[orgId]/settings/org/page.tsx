// src/app/[locale]/[orgId]/settings/org/page.tsx
// Phase 1.2 Session 6 §6.3 — OrgProfileEditor route with server-
// component role check per Pre-decision 5. Non-controllers redirect
// with ?forbidden=org-settings (named Session 6 ↔ Session 7
// contract — Session 6 emits the flag, Session 7 wires a toast).

import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';
import { getMembership } from '@/services/auth/getMembership';
import { OrgProfileEditor } from '@/components/canvas/OrgProfileEditor';

type PageProps = {
  params: Promise<{ locale: string; orgId: string }>;
};

export default async function OrgProfileSettingsPage({ params }: PageProps) {
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
  if (!membership || membership.role !== 'controller') {
    redirect(`/${locale}/${orgId}/?forbidden=org-settings`);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <OrgProfileEditor orgId={orgId} />
    </div>
  );
}
