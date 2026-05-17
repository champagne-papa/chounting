// src/components/bridge/SplitScreenLayout.tsx
// The Bridge shell. Three zones (post-Phase-6.5 chunk 1) with multi-
// tab substrate state lift (Phase 6.5 chunk 2a):
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
// Phase 6.5 chunk 2a — tab data model state lift per Sub-Q11.b.α.
// `tabsState: { tabs: ReadonlyArray<Tab>, activeTabId }` replaces the
// pre-chunk-2 singleton `(directive, selectedEntity)` state. Each
// Tab carries its own `directive` + `selectedEntity` + navigation
// `history` + `historyIndex`. ContextualCanvas is now pure render-
// from-Props for the active tab; back/forward callbacks flow from
// SplitScreenLayout's tabsState. canvasContext derivation reads
// active tab's directive + selectedEntity (Sub-Q18.α singleton-shape
// preserved at TYPE level; zero touch to canvasContext.ts /
// canvasContext.schema.ts / canvasContextSuffix.ts).
//
// Per-source callback decomposition: handleCanvasNavigate is gone;
// three per-source handlers replace it:
//   - handleMainframeNavigate → passed to Zone1ConsolidatedPanel as `onNavigate`
//   - handleAgentDirective    → passed to AgentChatPanel as `onNavigate`
//   - handleCanvasDrillDown   → passed to ContextualCanvas as `onDirectiveChange`
//
// At chunk-2a (this commit), all three handlers share an inlined
// `appendToActiveTab` semantic — append directive to active tab's
// history (matches pre-chunk-2 single-history-stack behavior;
// preserves all existing canvas-view E2E specs). At chunk-2b
// (Session 10b), the handlers diverge per Pattern γ Rules 1-4 +
// edge cases:
//   - handleMainframeNavigate → Rule 3 (replace active; EC1.β prompt)
//   - handleAgentDirective    → Rule 2 (new tab; EC2.β focus-existing)
//   - handleCanvasDrillDown   → Rule 4 (stays in active; append; unchanged from 2a)
//   - chunk 3 wires handleDropEvent + onDropEvent Prop on AgentChatPanel
//     for Rule 1 (new tab; EC3.β one-tab-per-batch).
//
// Collapse state for both zones persists via useShellState
// localStorage keys (chounting:shell:zone1Collapsed +
// chounting:shell:zone2Collapsed) per chunk 1 A2 ratification.
// Workspace selection persists via useWorkspace
// (chounting:shell:activeWorkspace). Keyboard shortcuts: Cmd+\ (Zone 1)
// + Cmd+Shift+\ (Zone 2) per chunk 1 A3 ratification.
//
// Pre-Phase-6.5 four-zone shape (Mainframe rail + chat + canvas +
// DocumentIntakeRail) preserved in docs/03_architecture/
// ui_architecture.md § Shell architecture history (pre-Phase-6.5)
// per ADR-0022 §2 supersession discipline.
//
// Session 7.1 Commit 5 (preserved): canvas context state lifts
// into this shell. The selection reducer (Pre-decision 10's type-
// compatibility rule) runs at active-tab grain on directive change
// — chunk-2a updates `appendToActiveTab` to invoke reduceSelection
// against active tab's selectedEntity before committing the new
// directive. All callsites use the per-source handlers; none hold
// direct references to setTabsState.
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
import type { Tab, TabsState } from '@/shared/types/canvasTab';
import { createTab } from '@/shared/types/canvasTab';
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
  const [tabsState, setTabsState] = useState<TabsState>(() => {
    const initialTab = createTab(initialDirective ?? { type: 'none' });
    return { tabs: [initialTab], activeTabId: initialTab.tabId };
  });
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

  // Phase 6.5 chunk 1: keyboard shortcuts (Cmd+\ Zone 1; Cmd+Shift+\ Zone 2).
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

  // Derived: active tab (defensive fallback to first tab; should
  // always match in practice since activeTabId is always set to a
  // valid tab id at construction + Pattern γ transitions).
  const activeTab: Tab | undefined =
    tabsState.tabs.find((t) => t.tabId === tabsState.activeTabId) ??
    tabsState.tabs[0];

  // Phase 6.5 chunk-2a: append directive to active tab's history.
  // Pattern γ degenerate fallback — all per-source handlers share
  // this semantic at chunk-2a (matches pre-chunk-2 single-history-
  // stack behavior). chunk-2b refines per-source semantics per
  // Pattern γ Rules 1-4 + EC1.β / EC2.β / EC3.β edge cases.
  const appendToActiveTab = useCallback((directive: CanvasDirective) => {
    setTabsState((prev) => {
      const active = prev.tabs.find((t) => t.tabId === prev.activeTabId);
      if (!active) return prev;
      const newHistory = [
        ...active.history.slice(0, active.historyIndex + 1),
        directive,
      ];
      const newSelectedEntity = reduceSelection(active.selectedEntity, {
        type: 'directive_change',
        new_directive: directive,
      });
      const updatedTab: Tab = {
        ...active,
        directive,
        selectedEntity: newSelectedEntity,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
      return {
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.tabId === prev.activeTabId ? updatedTab : t,
        ),
      };
    });
  }, []);

  // Per-source callback handlers. At chunk-2a, all three share
  // appendToActiveTab semantics (degenerate Pattern γ). chunk-2b
  // refines:
  //   - handleMainframeNavigate → routeReplaceActive + EC1.β prompt
  //   - handleAgentDirective    → routeNewTab + EC2.β focus-existing
  //   - handleCanvasDrillDown   → continues to append (Pattern γ Rule 4)
  // chunk 3: handleDropEvent + onDropEvent Prop on AgentChatPanel
  // land as Pattern γ Rule 1 + EC3.β one-tab-per-batch.
  const handleMainframeNavigate = useCallback(
    (directive: CanvasDirective) => {
      appendToActiveTab(directive);
    },
    [appendToActiveTab],
  );

  const handleAgentDirective = useCallback(
    (directive: CanvasDirective) => {
      appendToActiveTab(directive);
    },
    [appendToActiveTab],
  );

  const handleCanvasDrillDown = useCallback(
    (directive: CanvasDirective) => {
      appendToActiveTab(directive);
    },
    [appendToActiveTab],
  );

  const handleSelectEntity = useCallback((entity: SelectedEntity) => {
    setTabsState((prev) => {
      const active = prev.tabs.find((t) => t.tabId === prev.activeTabId);
      if (!active) return prev;
      const newSelectedEntity = reduceSelection(active.selectedEntity, {
        type: 'select',
        entity,
      });
      return {
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.tabId === prev.activeTabId
            ? { ...t, selectedEntity: newSelectedEntity }
            : t,
        ),
      };
    });
  }, []);

  const handleGoBack = useCallback(() => {
    setTabsState((prev) => {
      const active = prev.tabs.find((t) => t.tabId === prev.activeTabId);
      if (!active || active.historyIndex === 0) return prev;
      const newIndex = active.historyIndex - 1;
      const newDirective = active.history[newIndex];
      return {
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.tabId === prev.activeTabId
            ? { ...t, historyIndex: newIndex, directive: newDirective }
            : t,
        ),
      };
    });
  }, []);

  const handleGoForward = useCallback(() => {
    setTabsState((prev) => {
      const active = prev.tabs.find((t) => t.tabId === prev.activeTabId);
      if (!active || active.historyIndex >= active.history.length - 1) {
        return prev;
      }
      const newIndex = active.historyIndex + 1;
      const newDirective = active.history[newIndex];
      return {
        ...prev,
        tabs: prev.tabs.map((t) =>
          t.tabId === prev.activeTabId
            ? { ...t, historyIndex: newIndex, directive: newDirective }
            : t,
        ),
      };
    });
  }, []);

  // canvasContext derives from active tab per Sub-Q18.α. Singleton-
  // shape preserved at TYPE level; zero touch to canvasContext.ts /
  // canvasContext.schema.ts / canvasContextSuffix.ts.
  const canvasContext: CanvasContext = {
    current_directive: activeTab?.directive ?? { type: 'none' },
    selected_entity: activeTab?.selectedEntity,
  };

  // Derived display state for ContextualCanvas back/forward arrows.
  const canGoBack = activeTab !== undefined && activeTab.historyIndex > 0;
  const canGoForward =
    activeTab !== undefined &&
    activeTab.historyIndex < activeTab.history.length - 1;
  const historyPositionLabel = activeTab
    ? `${activeTab.historyIndex + 1} / ${activeTab.history.length}`
    : '1 / 1';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50">
      {/* Top nav strip with org switcher + avatar dropdown */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-neutral-200 bg-white flex items-center justify-between px-4 z-10">
        <OrgSwitcher currentOrgId={orgId} />
        <AvatarDropdown
          currentUserRole={currentUserRole}
          orgId={orgId}
          onTeamClick={() => handleAgentDirective({ type: 'org_users', orgId })}
        />
      </div>

      <div className="flex h-screen w-screen pt-12">
        {/* Zone 1: Consolidated left panel */}
        <Zone1ConsolidatedPanel
          orgId={orgId}
          onNavigate={handleMainframeNavigate}
        />

        {/* Zone 2: Agent chat panel (collapsed rail-mode rendered inside) */}
        <AgentChatPanel
          orgId={orgId}
          onCollapse={() => setZone2Collapsed(true)}
          onExpand={() => setZone2Collapsed(false)}
          collapsed={zone2Collapsed}
          currentUserRole={currentUserRole}
          canvasContext={canvasContext}
          onNavigate={handleAgentDirective}
          firstArrival={firstArrival}
        />

        {/* Zone 3: Contextual canvas (pure render-from-Props for active tab) */}
        <ContextualCanvas
          directive={activeTab?.directive ?? { type: 'none' }}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          historyPositionLabel={historyPositionLabel}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onDirectiveChange={handleCanvasDrillDown}
          onSelectEntity={handleSelectEntity}
        />
      </div>
    </div>
  );
}
