// src/app/[locale]/[orgId]/page.tsx
// Org landing page — renders the Bridge split-screen layout
// with the Chart of Accounts as the default canvas view.

import { SplitScreenLayout } from '@/components/bridge/SplitScreenLayout';

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <SplitScreenLayout
      orgId={orgId}
      initialDirective={{ type: 'chart_of_accounts', orgId }}
    />
  );
}
