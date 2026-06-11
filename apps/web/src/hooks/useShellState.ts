// src/hooks/useShellState.ts
//
// React hook for Bridge shell collapse state (Phase 6.5 chunk 1).
// Thin wrapper around src/shared/storage/shellStateStorage.ts —
// localStorage round-trip lives in the pure module.
//
// SSR-safe pattern: initial render uses defaults (server-safe);
// useEffect at mount hydrates from localStorage (client-only).
// Subsequent state mutations write through to localStorage
// synchronously.

'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  loadShellState,
  saveShellState,
  type ShellState,
} from '@/shared/storage/shellStateStorage';

const INITIAL_STATE: ShellState = {
  zone1Collapsed: false,
  zone2Collapsed: false,
};

export type UseShellStateReturn = {
  zone1Collapsed: boolean;
  zone2Collapsed: boolean;
  setZone1Collapsed: (value: boolean) => void;
  setZone2Collapsed: (value: boolean) => void;
};

export function useShellState(): UseShellStateReturn {
  const [state, setState] = useState<ShellState>(INITIAL_STATE);

  useEffect(() => {
    setState(loadShellState());
  }, []);

  const setZone1Collapsed = useCallback((value: boolean) => {
    setState((prev) => {
      const next = { ...prev, zone1Collapsed: value };
      saveShellState(next);
      return next;
    });
  }, []);

  const setZone2Collapsed = useCallback((value: boolean) => {
    setState((prev) => {
      const next = { ...prev, zone2Collapsed: value };
      saveShellState(next);
      return next;
    });
  }, []);

  return {
    zone1Collapsed: state.zone1Collapsed,
    zone2Collapsed: state.zone2Collapsed,
    setZone1Collapsed,
    setZone2Collapsed,
  };
}
