// src/shared/storage/shellStateStorage.ts
//
// Pure-helper module for Bridge shell state persistence (Phase 6.5
// chunk 1). Owns localStorage round-tripping for Zone 1 / Zone 2
// collapse state and active workspace selection. The React hooks at
// src/hooks/useShellState.ts + useWorkspace.ts are thin wrappers
// around this module.
//
// Phase 6.5 chunk 1 ships this module per A1-B disposition (vitest
// DOM-environment gap inherited from chunk 6.2b; unit tests target
// the pure helpers here while React component + hook coverage routes
// through E2E specs).
//
// localStorage keys per Phase A A2 ratification (Session 7):
//   chounting:shell:zone1Collapsed   — 'true' | 'false'
//   chounting:shell:zone2Collapsed   — 'true' | 'false'
//   chounting:shell:activeWorkspace  — 'billing' | 'reports'
//
// SSR-safe: every accessor checks `typeof window === 'undefined'`
// and falls back to defaults. Write errors (private browsing,
// quota exceeded) silently fail — shell state is non-critical UX
// preference, not load-bearing data.

const KEY_ZONE1_COLLAPSED = 'chounting:shell:zone1Collapsed';
const KEY_ZONE2_COLLAPSED = 'chounting:shell:zone2Collapsed';
const KEY_ACTIVE_WORKSPACE = 'chounting:shell:activeWorkspace';

export type ShellState = {
  zone1Collapsed: boolean;
  zone2Collapsed: boolean;
};

export type ActiveWorkspace = 'billing' | 'reports';

const DEFAULT_SHELL_STATE: ShellState = {
  zone1Collapsed: false,
  zone2Collapsed: false,
};

const DEFAULT_ACTIVE_WORKSPACE: ActiveWorkspace = 'billing';

function safeReadItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Silently fail: shell state is non-critical UX preference.
  }
}

function parseBoolean(raw: string | null, fallback: boolean): boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export function loadShellState(): ShellState {
  return {
    zone1Collapsed: parseBoolean(
      safeReadItem(KEY_ZONE1_COLLAPSED),
      DEFAULT_SHELL_STATE.zone1Collapsed,
    ),
    zone2Collapsed: parseBoolean(
      safeReadItem(KEY_ZONE2_COLLAPSED),
      DEFAULT_SHELL_STATE.zone2Collapsed,
    ),
  };
}

export function saveShellState(state: ShellState): void {
  safeWriteItem(KEY_ZONE1_COLLAPSED, state.zone1Collapsed ? 'true' : 'false');
  safeWriteItem(KEY_ZONE2_COLLAPSED, state.zone2Collapsed ? 'true' : 'false');
}

export function loadActiveWorkspace(): ActiveWorkspace {
  const raw = safeReadItem(KEY_ACTIVE_WORKSPACE);
  if (raw === 'billing' || raw === 'reports') return raw;
  return DEFAULT_ACTIVE_WORKSPACE;
}

export function saveActiveWorkspace(workspace: ActiveWorkspace): void {
  safeWriteItem(KEY_ACTIVE_WORKSPACE, workspace);
}
