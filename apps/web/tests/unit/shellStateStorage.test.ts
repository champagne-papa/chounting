// tests/unit/shellStateStorage.test.ts
//
// Phase 6.5 chunk 1 — unit tests for the pure-helper shell state
// storage module. Per A1-B disposition (Session 7 Phase A): React
// hook + component tests are blocked by vitest DOM-environment gap
// inherited from chunk 6.2b; this module is the testable layer.
//
// localStorage keys per Phase A A2 ratification:
//   chounting:shell:zone1Collapsed
//   chounting:shell:zone2Collapsed
//   chounting:shell:activeWorkspace

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadActiveWorkspace,
  loadShellState,
  saveActiveWorkspace,
  saveShellState,
} from '@/shared/storage/shellStateStorage';

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('shellStateStorage — loadShellState / saveShellState', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createMockStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns defaults when no localStorage values exist', () => {
    expect(loadShellState()).toEqual({
      zone1Collapsed: false,
      zone2Collapsed: false,
    });
  });

  it('round-trips collapse state through localStorage', () => {
    saveShellState({ zone1Collapsed: true, zone2Collapsed: true });
    expect(loadShellState()).toEqual({
      zone1Collapsed: true,
      zone2Collapsed: true,
    });
  });

  it('handles mixed collapse state correctly', () => {
    saveShellState({ zone1Collapsed: true, zone2Collapsed: false });
    expect(loadShellState()).toEqual({
      zone1Collapsed: true,
      zone2Collapsed: false,
    });
  });

  it('falls back to default on corrupted localStorage value', () => {
    window.localStorage.setItem('chounting:shell:zone1Collapsed', 'maybe');
    window.localStorage.setItem('chounting:shell:zone2Collapsed', '');
    expect(loadShellState()).toEqual({
      zone1Collapsed: false,
      zone2Collapsed: false,
    });
  });

  it('writes the canonical chounting:shell:* localStorage keys', () => {
    saveShellState({ zone1Collapsed: true, zone2Collapsed: false });
    expect(window.localStorage.getItem('chounting:shell:zone1Collapsed')).toBe(
      'true',
    );
    expect(window.localStorage.getItem('chounting:shell:zone2Collapsed')).toBe(
      'false',
    );
  });
});

describe('shellStateStorage — loadActiveWorkspace / saveActiveWorkspace', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createMockStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns default billing workspace when no localStorage value exists', () => {
    expect(loadActiveWorkspace()).toBe('billing');
  });

  it('round-trips active workspace through localStorage', () => {
    saveActiveWorkspace('reports');
    expect(loadActiveWorkspace()).toBe('reports');
    saveActiveWorkspace('billing');
    expect(loadActiveWorkspace()).toBe('billing');
  });

  it('falls back to billing on corrupted workspace value', () => {
    window.localStorage.setItem('chounting:shell:activeWorkspace', 'tax');
    expect(loadActiveWorkspace()).toBe('billing');
  });

  it('writes the canonical chounting:shell:activeWorkspace key', () => {
    saveActiveWorkspace('reports');
    expect(window.localStorage.getItem('chounting:shell:activeWorkspace')).toBe(
      'reports',
    );
  });
});

describe('shellStateStorage — SSR-safe behavior', () => {
  it('returns defaults when window is undefined (server-render context)', () => {
    // No vi.stubGlobal — window stays undefined in node env.
    expect(loadShellState()).toEqual({
      zone1Collapsed: false,
      zone2Collapsed: false,
    });
    expect(loadActiveWorkspace()).toBe('billing');
  });

  it('saveShellState + saveActiveWorkspace are no-ops when window is undefined', () => {
    // No vi.stubGlobal — saves should not throw.
    expect(() => saveShellState({ zone1Collapsed: true, zone2Collapsed: true }))
      .not.toThrow();
    expect(() => saveActiveWorkspace('reports')).not.toThrow();
  });
});
