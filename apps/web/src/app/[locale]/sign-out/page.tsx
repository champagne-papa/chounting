// src/app/[locale]/sign-out/page.tsx
// Signs the user out of Supabase and redirects to sign-in.

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function SignOutPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    supabase.auth.signOut().then(() => {
      router.push(`/${locale}/sign-in`);
    });
  }, [locale, router]);

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 text-center text-neutral-500">
      Signing out...
    </div>
  );
}
