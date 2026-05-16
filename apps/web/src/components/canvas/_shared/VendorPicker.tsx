// src/components/canvas/_shared/VendorPicker.tsx
'use client';
//
// Phase 5 chunk B5-3-D3 substantive session #1: thin VendorPicker
// abstraction per Surface 2 Path (X) converged disposition.
// Wraps vendorService.listVendors fetch + native <select>; single-
// immediate-consumer at this chunk (ManualBillForm); amortizes against
// future cross-feature consumers (vendor prepayment form, AR consumers).
//
// v1 thin shape: no search, no infinite scroll, no modal. Native dropdown
// with cancellation guard. Loading/empty/error stencils mirror
// BasicTrialBalanceView read-side conventions.
//
// VendorListRow shape disk-verified against listVendors.schema.ts:
// { vendor_id: string; name: string; is_active: boolean }
// API response shape: { vendors: VendorListRow[] }

import { useEffect, useState } from 'react';

interface VendorListRow {
  vendor_id: string;
  name: string;
  is_active: boolean;
}

export interface VendorPickerProps {
  orgId: string;
  value: string | null;
  onChange: (vendor_id: string) => void;
  disabled?: boolean;
}

export function VendorPicker({ orgId, value, onChange, disabled }: VendorPickerProps) {
  const [vendors, setVendors] = useState<VendorListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/orgs/${orgId}/vendors`)
      .then((res) => {
        if (!res.ok) throw new Error(`Vendors fetch failed: ${res.status}`);
        return res.json();
      })
      .then((body: { vendors: VendorListRow[] }) => {
        if (!cancelled) {
          setVendors(body.vendors);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading vendors...</div>;
  }
  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }
  if (vendors.length === 0) {
    return <div className="text-sm text-neutral-400">No vendors available.</div>;
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
    >
      <option value="" disabled>
        Select vendor...
      </option>
      {vendors.map((v) => (
        <option key={v.vendor_id} value={v.vendor_id}>
          {v.name}
        </option>
      ))}
    </select>
  );
}
