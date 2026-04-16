import { z } from 'zod';

// Phase 1.5B — user_profiles API boundary schema.
// Convention: camelCase at the boundary; service maps to snake_case.

const phoneCountryCodeSchema = z
  .string()
  .regex(/^\+[0-9]{1,3}$/, 'phone country code must be "+" followed by 1-3 digits')
  .nullable()
  .optional();

const timeZoneSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z]+(?:\/[A-Za-z_]+)*$/, 'must be an IANA TZ string')
  .nullable()
  .optional();

const localeSchema = z
  .string()
  .min(1)
  .max(35)
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'must be a BCP-47-style tag')
  .nullable()
  .optional();

export const updateUserProfilePatchSchema = z
  .object({
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    displayName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    phoneCountryCode: phoneCountryCodeSchema,
    preferredLocale: localeSchema,
    preferredTimezone: timeZoneSchema,
    avatarStoragePath: z.string().nullable().optional(),
  })
  .strict()
  .refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'update patch must include at least one field' },
  );

export type UpdateUserProfilePatch = z.infer<typeof updateUserProfilePatchSchema>;
