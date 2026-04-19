// src/agent/tools/listIndustries.ts
// Master brief §6.1. Read-only tool listing industries for the
// CoA template bridge during org creation.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { listIndustriesInputSchema } from './schemas/listIndustries.schema';

export const listIndustriesTool = {
  name: 'listIndustries',
  description: 'List all available industries (used to pick a Chart of Accounts template during onboarding).',
  input_schema: zodToJsonSchema(listIndustriesInputSchema),
  zodSchema: listIndustriesInputSchema,
} as const;
