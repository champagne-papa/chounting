// src/components/bridge/OrgSwitcher.tsx
// Reads the current user's memberships and shows only the orgs they
// have access to. Routes to /[locale]/[orgId]/... when an org is picked.

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';

interface OrgMembership {
  org_id: string;
  name: string;
  role: 'executive' | 'controller' | 'ap_specialist';
}

interface Props {
  currentOrgId: string;
}

export function OrgSwitcher({ currentOrgId }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('orgSwitcher');
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase
      .from('memberships')
      .select('org_id, role, organizations(name)')
      .then(({ data }) => {
        if (data) {
          setOrgs(
            data.map((m: Record<string, unknown>) => ({
              org_id: m.org_id as string,
              name: (m.organizations as Record<string, unknown>)?.name as string,
              role: m.role as OrgMembership['role'],
            })),
          );
        }
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newOrgId = e.target.value;
    router.push(`/${locale}/${newOrgId}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500">{t('label')}:</span>
      <select
        value={currentOrgId}
        onChange={handleChange}
        className="border border-neutral-300 rounded px-2 py-1 bg-white"
      >
        {orgs.map((o) => (
          <option key={o.org_id} value={o.org_id}>
            {o.name} ({o.role})
          </option>
        ))}
      </select>
    </label>
  );
}
