// src/app/[locale]/sign-in/page.tsx
// Supabase Auth sign-in page.

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';

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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
    } else {
router.push(`/${locale}/admin/orgs`);  
    }
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
