// tests/integration/avatarDropdownMenuBehavior.test.ts
// Phase 1.2 Session 8 Commit 1 — AvatarDropdown item visibility
// contract.
//
// Direct React-component rendering is not set up in this suite
// (no jsdom / @testing-library). Visibility logic is extracted to
// `src/components/bridge/avatarDropdownItems.ts` as a pure helper
// and tested here. Click-handler behavior (router.push targets,
// supabase.auth.signOut() firing) is manually verified at the
// founder review gate per §6 C1.

import { describe, it, expect } from 'vitest';
import { getAvatarDropdownItems } from '@/components/bridge/avatarDropdownItems';
import type { UserRole } from '@/shared/types/userRole';

describe('Session 8 C1: AvatarDropdown item visibility', () => {
  it('controller sees all four items (Profile, Org settings, Team, Sign out)', () => {
    const items = getAvatarDropdownItems('controller');
    expect(items.map((i) => i.id)).toEqual([
      'profile',
      'orgSettings',
      'team',
      'signOut',
    ]);
  });

  it('ap_specialist sees three items (Org settings hidden)', () => {
    const items = getAvatarDropdownItems('ap_specialist');
    expect(items.map((i) => i.id)).toEqual(['profile', 'team', 'signOut']);
    expect(items.find((i) => i.id === 'orgSettings')).toBeUndefined();
  });

  it('executive sees three items (Org settings hidden)', () => {
    const items = getAvatarDropdownItems('executive');
    expect(items.map((i) => i.id)).toEqual(['profile', 'team', 'signOut']);
    expect(items.find((i) => i.id === 'orgSettings')).toBeUndefined();
  });

  it('undefined role (pre-membership-load) sees three items (Org settings hidden — safe default)', () => {
    const items = getAvatarDropdownItems(undefined);
    expect(items.map((i) => i.id)).toEqual(['profile', 'team', 'signOut']);
  });

  it('every item carries a non-empty labelKey for next-intl', () => {
    const roles: (UserRole | undefined)[] = [
      'controller',
      'ap_specialist',
      'executive',
      undefined,
    ];
    for (const role of roles) {
      for (const item of getAvatarDropdownItems(role)) {
        expect(item.labelKey.length).toBeGreaterThan(0);
      }
    }
  });
});
