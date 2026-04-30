// src/components/bridge/AvatarDropdown.tsx
// Phase 1.2 Session 8 Commit 1 — top-nav avatar dropdown.
//
// Four items. Controller sees all four; non-controller sees three
// (Org settings hidden). P17's "uniform selectedEntity drop" is a
// design property that falls out of the reducer + route structure:
//   - Profile / Org settings: full router.push → shell unloads.
//   - Team: setDirective({ type: 'org_users', ... }) → reduceSelection
//     drops the selection on directive-type-incompatibility.
//   - Sign out: router.push to sign-in → shell unloads.
// No explicit selection-drop code needed on any of the four items.

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';
import type { UserRole } from '@/shared/types/userRole';
import {
  getAvatarDropdownItems,
  type AvatarDropdownItemId,
} from './avatarDropdownItems';

interface Props {
  currentUserRole: UserRole | undefined;
  orgId: string;
  onTeamClick: () => void;
}

export function AvatarDropdown({ currentUserRole, orgId, onTeamClick }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(id: AvatarDropdownItemId) {
    setOpen(false);
    switch (id) {
      case 'profile':
        router.push(`/${locale}/settings/profile`);
        return;
      case 'orgSettings':
        router.push(`/${locale}/${orgId}/settings/org`);
        return;
      case 'team':
        onTeamClick();
        return;
      case 'signOut': {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        void supabase.auth.signOut().finally(() => {
          router.push(`/${locale}/sign-in`);
        });
        return;
      }
    }
  }

  const items = getAvatarDropdownItems(currentUserRole);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('avatarDropdown.ariaLabel')}
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center text-sm font-medium text-neutral-700"
      >
        {'\u{1F464}'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-48 bg-white border border-neutral-200 rounded-md shadow-md py-1 z-20"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(item.id)}
              className="w-full text-left px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
