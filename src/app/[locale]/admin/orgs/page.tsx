// src/app/[locale]/admin/orgs/page.tsx
// Org creation form. Selects an industry -> loads the CoA template
// into chart_of_accounts for the new org.

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const INDUSTRIES = [
  { value: 'holding_company',  label: 'Holding Company' },
  { value: 'real_estate',      label: 'Real Estate' },
  { value: 'healthcare',       label: 'Healthcare (Phase 2+)', disabled: true },
  { value: 'hospitality',      label: 'Hospitality (Phase 2+)', disabled: true },
  { value: 'trading',          label: 'Trading (Phase 2+)', disabled: true },
  { value: 'restaurant',       label: 'Restaurant (Phase 2+)', disabled: true },
] as const;

export default function OrgCreatePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<string>('holding_company');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, industry }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { org_id } = await res.json();
      router.push(`/${locale}/${org_id}`);
    } else {
      alert('Failed to create org. See logs.');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6">
      <h1 className="text-xl font-semibold mb-4">Create Organization</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm">Industry (loads CoA template)</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value} disabled={'disabled' in i && !!i.disabled}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit" disabled={submitting}
          className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create org and load CoA'}
        </button>
      </form>
    </div>
  );
}
