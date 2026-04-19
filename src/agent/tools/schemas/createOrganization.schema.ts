// src/agent/tools/schemas/createOrganization.schema.ts
// Phase 1.2 Session 2 — Zod schema for the createOrganization
// agent tool. Cites master brief §6.1.

import { z } from 'zod';
import { businessStructureSchema } from '@/shared/schemas/organization/profile.schema';

export const createOrganizationInputSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  industryId: z.string().uuid(),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  baseCurrency: z.string().length(3).regex(/^[A-Z]{3}$/),
  businessStructure: businessStructureSchema,
  timeZone: z.string().min(1),
  defaultLocale: z.string().min(1),
}).strict();

export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;
