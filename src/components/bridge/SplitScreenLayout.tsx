// src/components/bridge/SplitScreenLayout.tsx
// The Bridge shell. Three zones:
//   1. Mainframe rail (far left, ~64px, always visible)
//   2. Agent chat panel (~380px, collapsible)
//   3. Contextual canvas (fills remaining width)
//
// In Phase 1.1, the chat panel is empty (no agent). The Mainframe rail
// is the primary navigation. The canvas renders whatever the user
// selected via the Mainframe.

'use client';

import { useState } from 'react';
import { MainframeRail } from './MainframeRail';
import { AgentChatPanel } from './AgentChatPanel';
import { ContextualCanvas } from './ContextualCanvas';
import { OrgSwitcher } from './OrgSwitcher';
import type { CanvasDirective } from '@/shared/types/canvasDirective';

interface Props {
  orgId: string;
  initialDirective?: CanvasDirective;
}

export function SplitScreenLayout({ orgId, initialDirective }: Props) {
  const [directive, setDirective] = useState<CanvasDirective>(
    initialDirective ?? { type: 'none' },
  );
  const [chatCollapsed, setChatCollapsed] = useState(false);

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
          onNavigate={setDirective}
        />

        {/* Zone 2: Agent chat panel */}
        {!chatCollapsed && (
          <AgentChatPanel
            orgId={orgId}
            onCollapse={() => setChatCollapsed(true)}
          />
        )}

        {/* Zone 3: Contextual canvas */}
        <ContextualCanvas
          directive={directive}
          onDirectiveChange={setDirective}
        />
      </div>
    </div>
  );
}
