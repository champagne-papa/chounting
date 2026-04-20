// src/components/bridge/avatarDropdownItems.ts
// Pure visibility logic for AvatarDropdown, extracted so it can be
// tested in the node-environment vitest suite without jsdom.
// The component file consumes this helper to render items.

import type { UserRole } from '@/shared/types/userRole';

export type AvatarDropdownItemId = 'profile' | 'orgSettings' | 'team' | 'signOut';

export interface AvatarDropdownItem {
  id: AvatarDropdownItemId;
  labelKey: string;
}

export function getAvatarDropdownItems(
  role: UserRole | undefined,
): AvatarDropdownItem[] {
  const items: AvatarDropdownItem[] = [
    { id: 'profile', labelKey: 'avatarDropdown.profile' },
  ];

  if (role === 'controller') {
    items.push({ id: 'orgSettings', labelKey: 'avatarDropdown.orgSettings' });
  }

  items.push(
    { id: 'team', labelKey: 'avatarDropdown.team' },
    { id: 'signOut', labelKey: 'auth.signOut' },
  );

  return items;
}
