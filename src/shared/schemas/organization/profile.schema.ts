import { z } from 'zod';
import { orgExternalIdsSchema } from './externalIds.schema';

// Phase 1.5A — organizations profile API boundary schemas.
// See docs/09_briefs/phase-1.5/brief.md §5.1.
//
// Convention: camelCase fields on the API boundary. The service
// layer maps camelCase → snake_case DB columns when writing to
// Postgres. The existing accounting schemas under
// src/shared/schemas/accounting/ predate this convention and use
// snake_case directly; this subdirectory adopts the camelCase
// boundary for the new org-profile surface area.
//
// Immutable post-creation fields (baseCurrency, fiscalYearStartMonth)
// are part of the create shape but NOT the update-patch shape. A
// patch that attempts to include them is rejected at the service
// layer with ORG_IMMUTABLE_FIELD.

// --- Enums ---

export const BUSINESS_STRUCTURES = [
  'sole_prop',
  'partnership',
  'corporation',
  'trust',
  'non_profit',
  'other',
] as const;
export const businessStructureSchema = z.enum(BUSINESS_STRUCTURES);
export type BusinessStructure = z.infer<typeof businessStructureSchema>;

export const ACCOUNTING_FRAMEWORKS = [
  'aspe',
  'ifrs',
  'us_gaap',
  'other',
] as const;
export const accountingFrameworkSchema = z.enum(ACCOUNTING_FRAMEWORKS);
export type AccountingFramework = z.infer<typeof accountingFrameworkSchema>;

export const REPORT_BASES = ['accrual', 'cash'] as const;
export const reportBasisSchema = z.enum(REPORT_BASES);
export type ReportBasis = z.infer<typeof reportBasisSchema>;

export const ORG_STATUSES = [
  'active',
  'trial',
  'suspended',
  'archived',
  'closed',
] as const;
export const orgStatusSchema = z.enum(ORG_STATUSES);
export type OrgStatus = z.infer<typeof orgStatusSchema>;

// --- Leaf field schemas ---

// ISO 4217 three-letter currency code.
const currencySchema = z
  .string()
  .length(3, 'currency must be a 3-letter ISO 4217 code')
  .regex(/^[A-Z]{3}$/, 'currency must be upper-case (e.g. "CAD")');

// IANA time zone (light validation — full canonicalization would
// require importing the IANA DB at runtime).
const timeZoneSchema = z
  .string()
  .min(1, 'timeZone is required')
  .regex(/^[A-Za-z]+(?:\/[A-Za-z_]+)*$/, 'timeZone must be an IANA TZ string (e.g. "America/Vancouver")');

const localeSchema = z
  .string()
  .min(1)
  .max(35)
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'default locale must be a BCP-47-style tag (e.g. "en", "fr-CA")');

const phoneCountryCodeSchema = z
  .string()
  .regex(/^\+[0-9]{1,3}$/, 'phone country code must be "+" followed by 1-3 digits');

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

// --- Base shape: every field present on the API boundary ---
// Mutable fields that appear both at creation and in update patches.

const mutableFields = {
  name: z.string().min(1, 'name is required'),
  legalName: z.string().nullable().optional(),
  industryId: z.string().uuid(),
  businessStructure: businessStructureSchema,
  businessRegistrationNumber: z.string().nullable().optional(),
  taxRegistrationNumber: z.string().nullable().optional(),
  gstRegistrationDate: isoDateSchema.nullable().optional(),
  accountingFramework: accountingFrameworkSchema,
  description: z.string().nullable().optional(),
  website: z.string().url('website must be a valid URL').nullable().optional(),
  email: z.string().email('email must be a valid address').nullable().optional(),
  phone: z.string().nullable().optional(),
  phoneCountryCode: phoneCountryCodeSchema.nullable().optional(),
  timeZone: timeZoneSchema,
  defaultLocale: localeSchema,
  defaultReportBasis: reportBasisSchema,
  defaultPaymentTermsDays: z.number().int().nonnegative(),
  multiCurrencyEnabled: z.boolean(),
  status: orgStatusSchema,
  mfaRequired: z.boolean(),
  booksStartDate: isoDateSchema.nullable().optional(),
  externalIds: orgExternalIdsSchema,
  parentOrgId: z.string().uuid().nullable().optional(),
  logoStoragePath: z.string().nullable().optional(),
};

// Immutable-post-creation fields. Present in create input but
// absent from update patches.
const immutableCreateFields = {
  baseCurrency: currencySchema,           // column name functional_currency in DB
  fiscalYearStartMonth: z
    .number()
    .int()
    .min(1, 'fiscalYearStartMonth must be 1-12')
    .max(12, 'fiscalYearStartMonth must be 1-12'),
};

// --- Base schema (shared view of all columns) ---

export const orgProfileBaseSchema = z.object({
  ...mutableFields,
  ...immutableCreateFields,
});
export type OrgProfileBase = z.infer<typeof orgProfileBaseSchema>;

// --- Create schema ---
// All required-at-creation fields are required; everything else
// is optional with the DB default applying when omitted.
// Required at creation per brief §5.1.1:
//   name, industryId, businessStructure, baseCurrency,
//   fiscalYearStartMonth, timeZone, defaultLocale,
//   defaultReportBasis, accountingFramework.
// Other mutable fields accept undefined → DB default.

export const createOrgProfileSchema = z.object({
  name: mutableFields.name,
  legalName: mutableFields.legalName,
  industryId: mutableFields.industryId,
  businessStructure: mutableFields.businessStructure,
  businessRegistrationNumber: mutableFields.businessRegistrationNumber,
  taxRegistrationNumber: mutableFields.taxRegistrationNumber,
  gstRegistrationDate: mutableFields.gstRegistrationDate,
  accountingFramework: mutableFields.accountingFramework,
  description: mutableFields.description,
  website: mutableFields.website,
  email: mutableFields.email,
  phone: mutableFields.phone,
  phoneCountryCode: mutableFields.phoneCountryCode,
  timeZone: mutableFields.timeZone,
  defaultLocale: mutableFields.defaultLocale,
  defaultReportBasis: mutableFields.defaultReportBasis,
  defaultPaymentTermsDays: mutableFields.defaultPaymentTermsDays.optional(),
  multiCurrencyEnabled: mutableFields.multiCurrencyEnabled.optional(),
  status: mutableFields.status.optional(),
  mfaRequired: mutableFields.mfaRequired.optional(),
  booksStartDate: mutableFields.booksStartDate,
  externalIds: mutableFields.externalIds.optional(),
  parentOrgId: mutableFields.parentOrgId,
  logoStoragePath: mutableFields.logoStoragePath,
  baseCurrency: immutableCreateFields.baseCurrency,
  fiscalYearStartMonth: immutableCreateFields.fiscalYearStartMonth,
});
export type CreateOrgProfileInput = z.infer<typeof createOrgProfileSchema>;

// --- Update patch schema ---
// Every mutable field optional; immutable fields (baseCurrency,
// fiscalYearStartMonth) not included — a patch containing them
// should be rejected. z.strict() enforces that rejection.
// industryId remains mutable (the bridge may be updated).

export const updateOrgProfilePatchSchema = z
  .object({
    name: mutableFields.name.optional(),
    legalName: mutableFields.legalName,
    industryId: mutableFields.industryId.optional(),
    businessStructure: mutableFields.businessStructure.optional(),
    businessRegistrationNumber: mutableFields.businessRegistrationNumber,
    taxRegistrationNumber: mutableFields.taxRegistrationNumber,
    gstRegistrationDate: mutableFields.gstRegistrationDate,
    accountingFramework: mutableFields.accountingFramework.optional(),
    description: mutableFields.description,
    website: mutableFields.website,
    email: mutableFields.email,
    phone: mutableFields.phone,
    phoneCountryCode: mutableFields.phoneCountryCode.nullable().optional(),
    timeZone: mutableFields.timeZone.optional(),
    defaultLocale: mutableFields.defaultLocale.optional(),
    defaultReportBasis: mutableFields.defaultReportBasis.optional(),
    defaultPaymentTermsDays: mutableFields.defaultPaymentTermsDays.optional(),
    multiCurrencyEnabled: mutableFields.multiCurrencyEnabled.optional(),
    status: mutableFields.status.optional(),
    mfaRequired: mutableFields.mfaRequired.optional(),
    booksStartDate: mutableFields.booksStartDate,
    externalIds: mutableFields.externalIds.optional(),
    parentOrgId: mutableFields.parentOrgId,
    logoStoragePath: mutableFields.logoStoragePath,
  })
  .strict()
  .refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'update patch must include at least one field' },
  );
export type UpdateOrgProfilePatch = z.infer<typeof updateOrgProfilePatchSchema>;
