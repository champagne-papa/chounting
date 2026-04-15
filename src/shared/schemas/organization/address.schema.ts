import { z } from 'zod';

// Phase 1.5A — organization_addresses API boundary schema.
// See docs/09_briefs/phase-1.5/brief.md §14.
//
// Convention: camelCase fields on the API boundary. The service
// layer maps camelCase → snake_case (line1 unchanged; addressType
// → address_type; isPrimary → is_primary; postalCode → postal_code)
// when translating to DB columns. The existing accounting schemas
// under src/shared/schemas/accounting/ predate this convention and
// use snake_case directly; this subdirectory adopts the camelCase
// boundary.
//
// region validation is cross-field (depends on country), so it
// uses superRefine rather than a per-field refine. For country='CA'
// the value must be one of the 13 ISO 3166-2:CA province/territory
// codes; for country='US' a state code; other countries accept any
// text. Two-letter codes only — "British Columbia" is rejected
// (test CB-02 asserts this).

export const ADDRESS_TYPES = [
  'mailing',
  'physical',
  'registered',
  'payment_stub',
] as const;

export const CA_REGIONS = [
  'BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU',
] as const;

// ISO 3166-2:US — 50 states + DC.
export const US_REGIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
] as const;

export const addressTypeSchema = z.enum(ADDRESS_TYPES);
export type AddressType = z.infer<typeof addressTypeSchema>;

// Base shape (no cross-field rules yet). Fields are camelCase at
// the boundary; service layer translates to snake_case DB columns.
const addressBaseShape = z.object({
  addressType: addressTypeSchema,
  line1: z.string().min(1, 'line1 is required'),
  line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z
    .string()
    .length(2, 'country must be a 2-letter ISO 3166-1 alpha-2 code')
    .regex(/^[A-Z]{2}$/, 'country must be upper-case (e.g. "CA", not "ca")'),
  attention: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
});

function regionRefine(
  val: { country: string; region?: string | null },
  ctx: z.RefinementCtx,
): void {
  if (val.region == null || val.region === '') return;

  if (val.country === 'CA') {
    if (!(CA_REGIONS as readonly string[]).includes(val.region)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `region must be a Canadian province/territory code (one of ${CA_REGIONS.join(', ')}); got "${val.region}"`,
        path: ['region'],
      });
    }
  } else if (val.country === 'US') {
    if (!(US_REGIONS as readonly string[]).includes(val.region)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `region must be a US state code (two letters, uppercase); got "${val.region}"`,
        path: ['region'],
      });
    }
  }
  // All other countries: free text accepted.
}

// Input shape for addressService.addAddress — full row minus
// server-generated columns.
export const addAddressSchema = addressBaseShape.superRefine(regionRefine);
export type AddAddressInput = z.infer<typeof addAddressSchema>;

// Input shape for addressService.updateAddress — partial patch.
// address_type is immutable: omit() strips it from the patch shape,
// but Zod omit() silently discards rather than rejecting an
// addressType key in the raw input. The service must check the raw
// input pre-parse and throw ServiceError('ADDRESS_TYPE_IMMUTABLE')
// if addressType is present, so the caller learns their patch was
// rejected rather than silently no-op'd. Defense in depth.
const addressPatchShape = addressBaseShape.omit({ addressType: true }).partial();

export const updateAddressPatchSchema = addressPatchShape.superRefine(
  (val, ctx) => {
    // Only validate region when both country and region are present
    // in the patch. A country-change without region, or a region
    // change without country, would need the service to merge
    // current DB state before validating — that's the service's job.
    if (val.country != null && val.region != null) {
      regionRefine({ country: val.country, region: val.region }, ctx);
    }
  },
);
export type UpdateAddressPatch = z.infer<typeof updateAddressPatchSchema>;
