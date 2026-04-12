// src/components/canvas/ChartOfAccountsView.tsx
// Standalone canvas view — fetches and displays the chart of accounts
// for an org. Works without the agent via Mainframe rail navigation.

'use client';

import { useEffect, useState } from 'react';

interface Account {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  is_intercompany_capable: boolean;
  is_active: boolean;
}

interface Props {
  orgId: string;
}

export function ChartOfAccountsView({ orgId }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/chart-of-accounts?org_id=${orgId}`)
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading chart of accounts...</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="text-sm text-neutral-400">
        No accounts found. Create an org with a CoA template first.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Chart of Accounts</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 text-left">
            <th className="py-2 pr-4 font-medium text-neutral-500">Code</th>
            <th className="py-2 pr-4 font-medium text-neutral-500">Name</th>
            <th className="py-2 pr-4 font-medium text-neutral-500">Type</th>
            <th className="py-2 pr-4 font-medium text-neutral-500">IC</th>
            <th className="py-2 font-medium text-neutral-500">Active</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.account_id} className="border-b border-neutral-100 hover:bg-neutral-50">
              <td className="py-2 pr-4 font-mono">{a.account_code}</td>
              <td className="py-2 pr-4">{a.account_name}</td>
              <td className="py-2 pr-4">{a.account_type}</td>
              <td className="py-2 pr-4">{a.is_intercompany_capable ? 'Yes' : 'No'}</td>
              <td className="py-2">{a.is_active ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
