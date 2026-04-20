// src/components/bridge/SplitScreenLayout.tsx
// The Bridge shell. Three zones:
//   1. Mainframe rail (far left, ~64px, always visible)
//   2. Agent chat panel (~380px, collapsible)
//   3. Contextual canvas (fills remaining width)
//
// Session 7.1 Commit 5: canvas context state lifts into this shell.
// `selectedEntity` + `directive` assemble into the `canvasContext`
// passed to AgentChatPanel. Every directive change routes through
// `handleCanvasNavigate`, which runs the selection reducer
// (Pre-decision 10's type-compatibility rule) before committing
// the new directive — all callsites use the wrapper, none hold a
// direct reference to setDirective.

'use client';

import { useState, useCallback } from 'react';
import { MainframeRail } from './MainframeRail';
import { AgentChatPanel } from './AgentChatPanel';
import { ContextualCanvas } from './ContextualCanvas';
import { OrgSwitcher } from './OrgSwitcher';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { CanvasContext, SelectedEntity } from '@/shared/types/canvasContext';
import { reduceSelection } from '@/agent/canvas/reduceSelection';

interface Props {
  orgId: string;
  initialDirective?: CanvasDirective;
}

export function SplitScreenLayout({ orgId, initialDirective }: Props) {
  const [directive, setDirective] = useState<CanvasDirective>(
    initialDirective ?? { type: 'none' },
  );
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | undefined>(
    undefined,
  );
  const [chatCollapsed, setChatCollapsed] = useState(false);

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
      {/* Top nav strip with org switcher */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-neutral-200 bg-white flex items-center px-4 z-10">
        <OrgSwitcher currentOrgId={orgId} />
      </div>

      <div className="flex h-screen w-screen pt-12">
        {/* Zone 1: Mainframe rail */}
        <MainframeRail
          orgId={orgId}
          onNavigate={handleCanvasNavigate}
        />

        {/* Zone 2: Agent chat panel */}
        {!chatCollapsed && (
          <AgentChatPanel
            orgId={orgId}
            onCollapse={() => setChatCollapsed(true)}
            canvasContext={canvasContext}
            onNavigate={handleCanvasNavigate}
          />
        )}

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
