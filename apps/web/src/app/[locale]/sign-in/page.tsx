// src/app/[locale]/sign-in/page.tsx
// Supabase Auth sign-in page.
//
// Phase 1.2 Session 5: post-auth redirect branches per
// sub-brief §6.8. After signInWithPassword succeeds, query the
// user's active memberships + user_profiles.display_name via
// the browser client (RLS scopes both to the caller), then call
// resolveSignInDestination to compute the target path.

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';
import { resolveSignInDestination } from '@/services/auth/resolveSignInDestination';

export default function SignInPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setSubmitting(false);
      setError(authError?.message ?? 'Sign-in failed');
      return;
    }

    // Session 5 §6.8: query memberships + display_name to decide
    // between the main-app path and /welcome. Ordered by
    // created_at so existing users land on their earliest org.
    const [{ data: memberships }, { data: profile }] = await Promise.all([
      supabase
        .from('memberships')
        .select('org_id, status')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', authData.user.id)
        .maybeSingle(),
    ]);

    const destination = resolveSignInDestination(
      locale,
      memberships ?? [],
      profile?.display_name ?? null,
    );
    setSubmitting(false);
    router.push(destination);
  }

  return (
    <div className="max-w-sm mx-auto mt-24 p-6">
      <h1 className="text-xl font-semibold mb-6">{t('signIn')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">{t('email')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm">{t('password')}</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? '...' : t('submit')}
        </button>
      </form>
    </div>
  );
}
