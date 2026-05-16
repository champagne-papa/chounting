// src/components/canvas/VendorBalanceView.tsx
'use client';
//
// EC-A-5 Vendor balance canvas view (Phase 5 chunk B5-3-D2 session #1).
// Substantively novel — 2-service composition via dual fetch:
//   (1) on mount: GET /api/orgs/[orgId]/vendors → populate <select> options
//   (2) on vendor selection: GET /api/orgs/[orgId]/reports/vendor-balance
//       ?vendor_id=UUID → display 4-component partial balances + net.
// Native <select> vendor picker per D2.4 ratification (VendorPicker
// abstraction deferred to B5-3-D3 write-side UI chunk). 4-component
// balance display per ADR-0015 §5 composition spec; open_vendor_deposits
// _and_retainers carries NEGATIVE contribution.

import { useEffect, useState } from 'react';
import type { CanvasNavigateFn } from '@/shared/types/canvasDirective';
import type { SelectedEntity } from '@/shared/types/canvasContext';
import type { VendorBalanceOutput } from '@/services/spend/reports/vendorReportService';
import type { ListVendorsOutput } from '@/shared/schemas/spend/listVendors.schema';

export interface VendorBalanceViewProps {
  orgId: string;
  onNavigate: CanvasNavigateFn;
  onSelectEntity?: (entity: SelectedEntity) => void;
}

export function VendorBalanceView({ orgId }: VendorBalanceViewProps) {
  const [vendors, setVendors] = useState<ListVendorsOutput['vendors']>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState<string | null>(null);

  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [balance, setBalance] = useState<VendorBalanceOutput | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // (1) Fetch vendors on mount + orgId change.
  useEffect(() => {
    let cancelled = false;
    setVendorsLoading(true);
    setVendorsError(null);

    fetch(`/api/orgs/${orgId}/vendors`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load vendors');
        }
        return r.json();
      })
      .then((data: ListVendorsOutput) => {
        if (!cancelled) {
          setVendors(data.vendors);
          setVendorsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setVendorsError(err.message);
          setVendorsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // (2) Fetch balance on vendor selection change.
  useEffect(() => {
    if (!selectedVendorId) {
      setBalance(null);
      setBalanceError(null);
      return;
    }

    let cancelled = false;
    setBalanceLoading(true);
    setBalanceError(null);

    fetch(
      `/api/orgs/${orgId}/reports/vendor-balance?vendor_id=${selectedVendorId}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load vendor balance');
        }
        return r.json();
      })
      .then((data: VendorBalanceOutput) => {
        if (!cancelled) {
          setBalance(data);
          setBalanceLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setBalanceError(err.message);
          setBalanceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, selectedVendorId]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Vendor Balance</h2>

      <div className="mb-6">
        <label className="block text-xs text-neutral-500 mb-1">Vendor</label>
        {vendorsLoading && (
          <div className="text-sm text-neutral-400">Loading vendors...</div>
        )}
        {vendorsError && (
          <div className="text-sm text-red-500">{vendorsError}</div>
        )}
        {!vendorsLoading && !vendorsError && vendors.length === 0 && (
          <div className="text-sm text-neutral-400">
            No vendors found for this organization.
          </div>
        )}
        {!vendorsLoading && !vendorsError && vendors.length > 0 && (
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="border border-neutral-300 rounded px-2 py-1 text-sm"
          >
            <option value="">Select a vendor...</option>
            {vendors.map((v) => (
              <option key={v.vendor_id} value={v.vendor_id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedVendorId && !vendorsLoading && (
        <div className="text-sm text-neutral-400">
          Select a vendor to view balance.
        </div>
      )}

      {selectedVendorId && balanceLoading && (
        <div className="text-sm text-neutral-400">Loading balance...</div>
      )}
      {selectedVendorId && balanceError && (
        <div className="text-sm text-red-500">{balanceError}</div>
      )}
      {selectedVendorId && !balanceLoading && !balanceError && balance && (
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
                <th className="py-2 pr-4 text-left">Component</th>
                <th className="py-2 pr-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                <td className="py-2 pr-4">Open AP</td>
                <td className="py-2 pr-4 text-right font-mono">
                  {balance.partial_balances.open_AP}
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-2 pr-4">Unapplied vendor credits</td>
                <td className="py-2 pr-4 text-right font-mono">
                  {balance.partial_balances.unapplied_vendor_credits}
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-2 pr-4">
                  Open vendor deposits and retainers
                </td>
                <td className="py-2 pr-4 text-right font-mono">
                  {balance.partial_balances.open_vendor_deposits_and_retainers}
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-2 pr-4">Accrued unbilled</td>
                <td className="py-2 pr-4 text-right font-mono">
                  {balance.partial_balances.accrued_unbilled}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2 border-neutral-300">
                <td className="py-2 pr-4">Net balance</td>
                <td className="py-2 pr-4 text-right font-mono">
                  {balance.net_balance}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-4 text-xs text-neutral-500">
            As of {balance.as_of}
          </div>
        </div>
      )}
    </div>
  );
}
