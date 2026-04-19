// src/agent/tools/updateOrgProfile.ts
// Master brief §6.1. Uses existing updateOrgProfilePatchSchema.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { updateOrgProfilePatchSchema } from '@/shared/schemas/organization/profile.schema';

export const updateOrgProfileTool = {
  name: 'updateOrgProfile',
  description: 'Update an organization\'s profile (name, legal name, timezone, reporting basis, etc.). Controller-only.',
  input_schema: zodToJsonSchema(updateOrgProfilePatchSchema),
  zodSchema: updateOrgProfilePatchSchema,
} as const;
