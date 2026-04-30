// src/agent/tools/createOrganization.ts
// Master brief §6.1. Onboarding tool for creating a new org.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { createOrganizationInputSchema } from './schemas/createOrganization.schema';
import { defineTool } from './types';

export const createOrganizationTool = defineTool({
  name: 'createOrganization',
  description: 'Create a new organization. Used during onboarding when the caller has no existing org memberships.',
  input_schema: zodToJsonSchema(createOrganizationInputSchema),
  zodSchema: createOrganizationInputSchema,
  gatedByDispatcherSet: false,
} as const);
