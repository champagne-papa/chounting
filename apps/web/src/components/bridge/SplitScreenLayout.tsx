// src/components/bridge/SplitScreenLayout.tsx
// The Bridge shell. Three zones (post-Phase-6.5 chunk 1):
//   1. Zone 1 — Consolidated left panel (Zone1ConsolidatedPanel;
//      ~288px expanded, 64px collapsed rail-mode). Four regions:
//      workspace tabs (Billing | Reports) + workspace-scoped nav +
//      persistent foundational footer + hidden v1 structural
//      reservation per Sub-Q7.4.α' / ADR-0010 substrate-now-
//      enforcement-later.
//   2. Zone 2 — Agent chat panel (~380px expanded, 44px collapsed
//      rail-mode with new-output badge).
//   3. Zone 3 — Contextual canvas (fills remaining width).
//
// Collapse state for both zones persists via useShellState
// localStorage keys (chounting:shell:zone1Collapsed +
// chounting:shell:zone2Collapsed) per Phase A A2 ratification.
// Workspace selection persists via useWorkspace (chounting:shell:
// activeWorkspace). Keyboard shortcuts: Cmd+\ (Zone 1) +
// Cmd+Shift+\ (Zone 2) per Phase A A3 ratification.
//
// Pre-Phase-6.5 four-zone shape (Mainframe rail + chat + canvas +
// DocumentIntakeRail) preserved in docs/03_architecture/
// ui_architecture.md § Shell architecture history (pre-Phase-6.5)
// per ADR-0022 §2 supersession discipline.
//
// Session 7.1 Commit 5 (preserved): canvas context state lifts
// into this shell. `selectedEntity` + `directive` assemble into the
// `canvasContext` passed to AgentChatPanel. Every directive change
// routes through `handleCanvasNavigate`, which runs the selection
// reducer (Pre-decision 10's type-compatibility rule) before
// committing the new directive — all callsites use the wrapper,
// none hold a direct reference to setDirective.
//
// Session 8 Commit 1 (preserved): reads the caller's role via a
// memberships query scoped by (user_id, org_id) — the UNIQUE
// (user_id, org_id) constraint guarantees at most one row so
// .maybeSingle() is safe. Passes the resolved role to
// AgentChatPanel (persona-aware prompts) and AvatarDropdown (Org-
// settings visibility). The query runs unconditionally — the shell
// is only mounted at src/app/[locale]/[orgId]/page.tsx where orgId
// is always a string. See C1 bug history in friction-journal for
// the RLS-expansion finding (memberships_select broadens for
// controllers via user_is_controller) that shaped this shape.

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useCallback, useEffect, useState } from 'react';

import { reduceSelection } from '@/agent/canvas/reduceSelection';
import { useShellState } from '@/hooks/useShellState';
import type { CanvasContext, SelectedEntity } from '@/shared/types/canvasContext';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { UserRole } from '@/shared/types/userRole';

import { AgentChatPanel } from './AgentChatPanel';
import { AvatarDropdown } from './AvatarDropdown';
import { ContextualCanvas } from './ContextualCanvas';
import { OrgSwitcher } from './OrgSwitcher';
import { Zone1ConsolidatedPanel } from './Zone1ConsolidatedPanel';

interface Props {
  orgId: string;
  initialDirective?: CanvasDirective;
  firstArrival?: boolean;
}

export function SplitScreenLayout({ orgId, initialDirective, firstArrival }: Props) {
  const [directive, setDirective] = useState<CanvasDirective>(
    initialDirective ?? { type: 'none' },
  );
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | undefined>(
    undefined,
  );
  const {
    zone1Collapsed,
    zone2Collapsed,
    setZone1Collapsed,
    setZone2Collapsed,
  } = useShellState();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | undefined>(
    undefined,
  );

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('memberships')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.role) {
        setCurrentUserRole(data.role as UserRole);
      }
    })().catch(() => { /* auth session may not be available yet */ });
  }, [orgId]);

  // Phase 6.5 chunk 1: keyboard shortcuts per Phase A A3 ratification.
  //   Cmd+\         (Ctrl+\ on non-Mac) toggles Zone 1 collapsed
  //   Cmd+Shift+\   (Ctrl+Shift+\ on non-Mac) toggles Zone 2 collapsed
  // Browser default for both is unassigned at session-onset re-grep
  // (Phase A finding); preventDefault is defensive against keyboard-
  // layout-specific defaults.
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;
      if (event.key !== '\\') return;
      event.preventDefault();
      if (event.shiftKey) {
        setZone2Collapsed(!zone2Collapsed);
      } else {
        setZone1Collapsed(!zone1Collapsed);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zone1Collapsed, zone2Collapsed, setZone1Collapsed, setZone2Collapsed]);

  const handleCanvasNavigate = useCallback((newDirective: CanvasDirective) => {
    setSelectedEntity((prev) =>
      reduceSelection(prev, { type: 'directive_change', new_directive: newDirective }),
    );
    setDirective(newDirective);
  }, []);

  const handleSelectEntity = useCallback((entity: SelectedEntity) => {
    setSelectedEntity((prev) => reduceSelection(prev, { type: 'select', entity }));
  }, []);

  const canvasContext: CanvasContext = {
    current_directive: directive,
    selected_entity: selectedEntity,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50">
      {/* Top nav strip with org switcher + avatar dropdown */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-neutral-200 bg-white flex items-center justify-between px-4 z-10">
        <OrgSwitcher currentOrgId={orgId} />
        <AvatarDropdown
          currentUserRole={currentUserRole}
          orgId={orgId}
          onTeamClick={() => handleCanvasNavigate({ type: 'org_users', orgId })}
        />
      </div>

      <div className="flex h-screen w-screen pt-12">
        {/* Zone 1: Consolidated left panel */}
        <Zone1ConsolidatedPanel
          orgId={orgId}
          onNavigate={handleCanvasNavigate}
        />

        {/* Zone 2: Agent chat panel (collapsed rail-mode rendered inside) */}
        <AgentChatPanel
          orgId={orgId}
          onCollapse={() => setZone2Collapsed(true)}
          onExpand={() => setZone2Collapsed(false)}
          collapsed={zone2Collapsed}
          currentUserRole={currentUserRole}
          canvasContext={canvasContext}
          onNavigate={handleCanvasNavigate}
          firstArrival={firstArrival}
        />

        {/* Zone 3: Contextual canvas */}
        <ContextualCanvas
          directive={directive}
          onDirectiveChange={handleCanvasNavigate}
          onSelectEntity={handleSelectEntity}
        />
      </div>
    </div>
  );
}
