// src/app/[locale]/[orgId]/page.tsx
// Org landing page — renders the Bridge split-screen layout
// with the Chart of Accounts as the default canvas view.
// S32: reads ?first_arrival=1 query param (per S32 brief
// Pre-decision 5 §B) and passes it to SplitScreenLayout for
// the post-onboarding sober handoff treatment.

import { SplitScreenLayout } from '@/components/bridge/SplitScreenLayout';

export default async function OrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ first_arrival?: string }>;
}) {
  const { orgId } = await params;
  const { first_arrival } = await searchParams;
  const firstArrival = first_arrival === '1';

  return (
    <SplitScreenLayout
      orgId={orgId}
      initialDirective={{ type: 'chart_of_accounts', orgId }}
      firstArrival={firstArrival}
    />
  );
}
