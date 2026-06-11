// src/hooks/useWorkspace.ts
//
// React hook for active workspace selection (Phase 6.5 chunk 1).
// Thin wrapper around src/shared/storage/shellStateStorage.ts —
// localStorage round-trip lives in the pure module.
//
// Default at first-time-user: 'billing' (v1 primary product surface
// per cycle Round 6 implicit default).

'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  loadActiveWorkspace,
  saveActiveWorkspace,
  type ActiveWorkspace,
} from '@/shared/storage/shellStateStorage';

const INITIAL_WORKSPACE: ActiveWorkspace = 'billing';

export type UseWorkspaceReturn = {
  activeWorkspace: ActiveWorkspace;
  setActiveWorkspace: (workspace: ActiveWorkspace) => void;
};

export function useWorkspace(): UseWorkspaceReturn {
  const [activeWorkspace, setActiveWorkspaceState] =
    useState<ActiveWorkspace>(INITIAL_WORKSPACE);

  useEffect(() => {
    setActiveWorkspaceState(loadActiveWorkspace());
  }, []);

  const setActiveWorkspace = useCallback((workspace: ActiveWorkspace) => {
    setActiveWorkspaceState(workspace);
    saveActiveWorkspace(workspace);
  }, []);

  return { activeWorkspace, setActiveWorkspace };
}
