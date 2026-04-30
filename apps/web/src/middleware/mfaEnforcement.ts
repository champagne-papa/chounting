// src/middleware/mfaEnforcement.ts
// Phase 1.5B — MFA enforcement for org-scoped routes.
// Checks organizations.mfa_required and user's AAL level.
// Called from middleware.ts for routes matching /[locale]/[orgId]/...
//
// This is a utility function, not a Next.js middleware itself.
// The top-level middleware.ts calls this after i18n routing.

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function enforceMfa(
  req: NextRequest,
  orgId: string,
  locale: string,
): Promise<NextResponse | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: () => {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: org } = await supabase
    .from('organizations')
    .select('mfa_required')
    .eq('org_id', orgId)
    .maybeSingle();

  if (!org?.mfa_required) return null;

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData && aalData.currentLevel === 'aal2') return null;

  const enrollUrl = new URL(`/${locale}/mfa-enroll`, req.url);
  enrollUrl.searchParams.set('returnTo', req.nextUrl.pathname);
  return NextResponse.redirect(enrollUrl);
}
