// src/shared/schemas/spend/listVendors.schema.ts
//
// Layer-2 boundary schema for vendorService.listVendors (Phase 5 chunk
// B5-3-D2 session #1; EC-A-5 vendor-selector substrate per Path (Y)
// ratification). Single required org_id UUID filter; returns vendor list
// for UI dropdown consumers (EC-A-5 vendor balance view at this chunk
// grain; B5-3-D3 manual bill form + payment approval card downstream).

import { z } from 'zod';

export const ListVendorsInputSchema = z.object({
  org_id: z.string().uuid(),
});

export type ListVendorsInputRaw = z.input<typeof ListVendorsInputSchema>;
export type ListVendorsInput = z.output<typeof ListVendorsInputSchema>;

export interface VendorListRow {
  vendor_id: string;
  name: string;
  is_active: boolean;
}

export interface ListVendorsOutput {
  vendors: VendorListRow[];
}
