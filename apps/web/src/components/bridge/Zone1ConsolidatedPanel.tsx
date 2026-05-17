// src/components/bridge/Zone1ConsolidatedPanel.tsx
//
// Phase 6.5 chunk 1: the consolidated left panel (Zone 1) replacing
// the pre-Phase-6.5 MainframeRail. Four regions per Sub-Q7 cycle
// leans:
//
//   Region 7.1 — Workspace tabs (vertical sidebar list per
//                Sub-Q7.1.b.β; Billing | Reports v1-active per
//                Sub-Q7.1.a 7.1.α)
//   Region 7.2 — Workspace-scoped navigation items (Billing 8
//                items incl. New Bill primary action button;
//                Reports 3 items)
//   Region 7.3 — Persistent foundational footer (CoA + Journal
//                Entries + Recurring Journals + AI Action Review;
//                4 items per Sub-Q7.3.β; cross-workspace)
//   Region 7.4 — Hidden with structural reservation per Sub-Q7.4.α'
//                (zero-render at v1; activates post-v1 multi-
//                session chat substrate per ADR-0010 substrate-
//                now-enforcement-later)
//
// Collapsed mode (64px exact match with pre-Phase-6.5 MainframeRail
// w-16) renders icons-only across Region 7.2 + 7.3 per Sub-Q8.b.α
// Zone 1 lock. Region 7.1 workspace switching requires expand.
//
// localStorage persistence via useShellState + useWorkspace hooks
// (chounting:shell:* namespace per Phase A A2 ratification).
//
// Mainframe-constraint successor (ui_architecture.md post-Phase-6.5
// statement): every nav item routes to a canvas directive that
// renders independently of the agent. AI Action Review is the
// historical exception — routes to a full-page surface
// (/[locale]/[orgId]/agent/actions) per Session 8 Commit 1
// precedent (preserves MainframeRail behavior).

'use client';

import { useParams, useRouter } from 'next/navigation';

import { useShellState } from '@/hooks/useShellState';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { ActiveWorkspace } from '@/shared/storage/shellStateStorage';
import type {
  CanvasDirective,
  CanvasNavigateFn,
} from '@/shared/types/canvasDirective';

import { ApiStatusDot } from './ApiStatusDot';

interface Props {
  orgId: string;
  onNavigate: CanvasNavigateFn;
}

type WorkspaceTab = {
  id: ActiveWorkspace;
  label: string;
  icon: string;
};

type NavItem = {
  id: string;
  label: string;
  icon: string;
  primaryAction?: boolean;
};

const WORKSPACE_TABS: ReadonlyArray<WorkspaceTab> = [
  { id: 'billing', label: 'Billing', icon: '\u{1F4BC}' },
  { id: 'reports', label: 'Reports', icon: '\u{1F4CA}' },
];

const BILLING_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { id: 'bill_form', label: 'New Bill', icon: '\u{1F4C4}', primaryAction: true },
  { id: 'open_bills', label: 'Open Bills', icon: '\u{1F4DD}' },
  { id: 'ap_aging', label: 'AP Aging', icon: '\u{1F4B0}' },
  { id: 'vendor_balance', label: 'Vendor Balance', icon: '\u{1F4B5}' },
  { id: 'payment_approval_queue', label: 'Payment Approval Queue', icon: '\u{1F4B3}' },
  { id: 'pending_approvals', label: 'Pending Approvals', icon: '\u{1F551}' },
  { id: 'active_payments', label: 'Active Payments', icon: '\u{1F4B8}' },
  { id: 'paid_bills_history', label: 'Paid Bills History', icon: '\u{1F4DC}' },
];

const REPORTS_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { id: 'pl', label: 'P&L Report', icon: '\u{1F4CA}' },
  { id: 'trial_balance', label: 'Trial Balance', icon: '⚖' },
  { id: 'balance_sheet', label: 'Balance Sheet', icon: '\u{1F3DB}' },
];

const FOOTER_ITEMS: ReadonlyArray<NavItem> = [
  { id: 'coa', label: 'Chart of Accounts', icon: '\u{1F4D2}' },
  { id: 'journals', label: 'Journal Entries', icon: '\u{1F4D4}' },
  { id: 'recurring', label: 'Recurring Journals', icon: '\u{1F504}' },
  { id: 'actions', label: 'AI Action Review', icon: '✅' },
];

function navItemToDirective(itemId: string, orgId: string): CanvasDirective | null {
  switch (itemId) {
    case 'bill_form':
      return { type: 'bill_form', orgId };
    case 'open_bills':
      return { type: 'report_open_bills', orgId };
    case 'ap_aging':
      return { type: 'report_ap_aging', orgId };
    case 'vendor_balance':
      return { type: 'report_vendor_balance', orgId };
    case 'payment_approval_queue':
      return { type: 'report_payment_approval_queue', orgId };
    case 'pending_approvals':
      return { type: 'report_pending_approvals', orgId };
    case 'active_payments':
      return { type: 'report_active_payments', orgId };
    case 'paid_bills_history':
      return { type: 'report_paid_bills_history', orgId };
    case 'pl':
      return { type: 'report_pl', orgId };
    case 'trial_balance':
      return { type: 'report_trial_balance', orgId };
    case 'balance_sheet':
      return { type: 'report_balance_sheet', orgId };
    case 'coa':
      return { type: 'chart_of_accounts', orgId };
    case 'journals':
      return { type: 'journal_entry_list', orgId };
    case 'recurring':
      return { type: 'recurring_template_list', orgId };
    case 'actions':
      return null;
    default:
      return null;
  }
}

export function Zone1ConsolidatedPanel({ orgId, onNavigate }: Props) {
  const { zone1Collapsed, setZone1Collapsed } = useShellState();
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  function handleNavClick(itemId: string) {
    if (itemId === 'actions') {
      router.push(`/${locale}/${orgId}/agent/actions`);
      return;
    }
    const directive = navItemToDirective(itemId, orgId);
    if (directive) onNavigate(directive);
  }

  const navItems =
    activeWorkspace === 'billing' ? BILLING_NAV_ITEMS : REPORTS_NAV_ITEMS;

  if (zone1Collapsed) {
    // Collapsed 64px rail-mode per Sub-Q8.b.α Zone 1 lock.
    // Icons-only across Region 7.2 + 7.3; Region 7.1 hidden; Region
    // 7.4 stays hidden.
    return (
      <nav
        data-zone="1"
        data-collapsed="true"
        aria-label="Zone 1 collapsed rail"
        className="flex h-full w-16 flex-col items-center gap-1 border-r border-neutral-200 bg-white py-3"
      >
        <button
          type="button"
          onClick={() => setZone1Collapsed(false)}
          title="Expand Zone 1 (Cmd+\\)"
          aria-label="Expand Zone 1"
          className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
        >
          {'»'}
        </button>
        <div className="text-[10px] font-bold tracking-widest text-neutral-500">
          {activeWorkspace.slice(0, 3).toUpperCase()}
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            title={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-md text-xl hover:bg-neutral-100"
          >
            {item.icon}
          </button>
        ))}
        <div className="my-1 h-px w-8 bg-neutral-200" />
        {FOOTER_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            title={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-md text-base hover:bg-neutral-100"
          >
            {item.icon}
          </button>
        ))}
        <div className="flex-1" />
        <ApiStatusDot />
      </nav>
    );
  }

  // Expanded mode: four regions stacked vertically.
  return (
    <nav
      data-zone="1"
      data-collapsed="false"
      aria-label="Zone 1 consolidated panel"
      className="flex h-full w-72 flex-col border-r border-neutral-200 bg-white"
    >
      {/* Header: brand + collapse trigger */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <span className="text-xs font-bold tracking-widest text-neutral-500">
          CHOUNTING
        </span>
        <button
          type="button"
          onClick={() => setZone1Collapsed(true)}
          title="Collapse Zone 1 (Cmd+\\)"
          aria-label="Collapse Zone 1"
          className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
        >
          {'«'}
        </button>
      </div>

      {/* Region 7.1 — Workspace tabs (vertical sidebar list) */}
      <div data-region="7.1" className="flex flex-col">
        {WORKSPACE_TABS.map((tab) => {
          const isActive = tab.id === activeWorkspace;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveWorkspace(tab.id)}
              aria-pressed={isActive}
              className={[
                'flex h-12 items-center gap-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-l-[3px] border-neutral-900 bg-neutral-100 pl-[9px] pr-3'
                  : 'border-l-[3px] border-transparent bg-white px-3 hover:bg-neutral-50',
              ].join(' ')}
            >
              <span className="text-2xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Region 7.2 — Workspace-scoped navigation items */}
      <div
        data-region="7.2"
        className="flex flex-1 flex-col overflow-y-auto border-t border-neutral-200 py-1"
      >
        {navItems.map((item) =>
          item.primaryAction ? (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              title={item.label}
              className="mx-3 my-2 flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              <span className="text-base leading-none">+</span>
              <span>{item.label}</span>
            </button>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              title={item.label}
              className="flex h-9 items-center gap-3 px-3 text-sm font-normal text-neutral-700 hover:bg-neutral-50"
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ),
        )}
      </div>

      {/* Region 7.3 — Persistent foundational footer (cross-workspace) */}
      <div
        data-region="7.3"
        className="flex flex-col border-t border-neutral-200 py-1"
      >
        {FOOTER_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            title={item.label}
            className="flex h-8 items-center gap-3 px-3 text-sm font-normal text-neutral-700 hover:bg-neutral-50"
          >
            <span className="text-sm leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="mt-1 border-t border-neutral-200 px-3 py-1">
          <ApiStatusDot />
        </div>
      </div>

      {/* Region 7.4 — Hidden with structural reservation per Sub-Q7.4.α' / ADR-0010 */}
      <div data-region="7.4" style={{ display: 'none' }} />
    </nav>
  );
}
