// src/components/bridge/CanvasTabStrip.tsx
//
// Phase 6.5 chunk 2b: browser-tab-shape UI for multi-tab canvas per
// Sub-Q11.c.α. Build-from-scratch per Sub-Q19.α (no Radix / shadcn /
// TanStack dependency; agent_interface.md verify-from-disk at
// Session 8 brief drafting confirmed no component-library direction
// per cycle Round 4 framing 5 candidate (c) finding — full design
// discretion).
//
// Mounted above ContextualCanvas's back/forward header at Zone 3 root
// in SplitScreenLayout. Receives `tabs` + `activeTabId` from
// SplitScreenLayout state; fires onSwitch + onClose callbacks
// consumed by canvasTabRouting helpers.
//
// Visual treatment per Session 8 brief operationalization:
//   - Each tab: 140px fixed width; 36px height (h-9 strip; per-tab
//     content vertically centered).
//   - Truncated title via CSS overflow:hidden + text-overflow:ellipsis.
//   - Active tab: white background + 2px bottom-border accent
//     (border-b-neutral-900) overlapping the strip's border-b for
//     "connected to canvas" effect.
//   - Inactive tab: bg-neutral-50 + hover:bg-neutral-100.
//   - Close button (×): appears on hover; click stops propagation so
//     it doesn't fire onSwitch.
//   - Overflow at N≥6 tabs: horizontal scroll via overflow-x-auto;
//     shadow indicators (gradient masks) on left/right when scrolled.
//   - Tabs-zero handling: closeTab in canvasTabRouting creates a
//     fresh `{type: 'none'}` tab when the last tab is closed; this
//     component is always rendered with at least one tab. Close
//     buttons are hidden when tabs.length === 1 (user can't close
//     the only tab visually).

'use client';

import { useEffect, useRef, useState } from 'react';

import type { Tab } from '@/shared/types/canvasTab';
import { tabTitleForDirective } from '@/shared/types/tabTitle';

interface Props {
  tabs: ReadonlyArray<Tab>;
  activeTabId: string;
  onSwitch: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export function CanvasTabStrip({ tabs, activeTabId, onSwitch, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateShadows = () => {
      setShowLeftShadow(el.scrollLeft > 0);
      setShowRightShadow(
        el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      );
    };
    updateShadows();
    el.addEventListener('scroll', updateShadows);
    const ro = new ResizeObserver(updateShadows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateShadows);
      ro.disconnect();
    };
  }, [tabs.length]);

  // Hide close buttons when tabs.length === 1 — user can't close the
  // only tab (tabs-zero state would dance: close → fresh 'none' tab
  // → identical visual; better UX to prevent the no-op click).
  const showCloseButtons = tabs.length > 1;

  return (
    <div
      className="relative h-9 border-b border-neutral-200 bg-neutral-50 flex-shrink-0"
      data-zone="3-tabs"
    >
      <div
        ref={scrollRef}
        className="flex h-full overflow-x-auto scrollbar-thin"
        data-testid="canvas-tab-strip"
        role="tablist"
        aria-label="Canvas tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.tabId === activeTabId;
          const title = tabTitleForDirective(tab.directive);
          return (
            <div
              key={tab.tabId}
              role="tab"
              tabIndex={0}
              aria-selected={isActive}
              data-tab-id={tab.tabId}
              data-active={isActive}
              className={[
                'group flex h-full flex-shrink-0 cursor-pointer items-center gap-2 border-r border-neutral-200 px-3',
                isActive
                  ? '-mb-px border-b-2 border-b-neutral-900 bg-white text-neutral-900'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
              style={{ width: '140px' }}
              onClick={() => onSwitch(tab.tabId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSwitch(tab.tabId);
                }
              }}
            >
              <span
                className="flex-1 truncate text-xs font-medium"
                title={title}
              >
                {title}
              </span>
              {showCloseButtons && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose(tab.tabId);
                  }}
                  aria-label={`Close ${title}`}
                  className="flex h-4 w-4 items-center justify-center rounded text-neutral-400 opacity-0 hover:bg-neutral-200 hover:text-neutral-700 group-hover:opacity-100"
                  data-testid="canvas-tab-close"
                >
                  &times;
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Shadow indicators for overflow scroll at N≥6 tabs */}
      {showLeftShadow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-full w-4 bg-gradient-to-r from-neutral-50 to-transparent"
        />
      )}
      {showRightShadow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-neutral-50 to-transparent"
        />
      )}
    </div>
  );
}
