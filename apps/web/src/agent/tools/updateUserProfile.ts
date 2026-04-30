// src/agent/tools/updateUserProfile.ts
// Master brief §6.1. Uses existing updateUserProfilePatchSchema.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { updateUserProfilePatchSchema } from '@/shared/schemas/user/profile.schema';
import { defineTool } from './types';

export const updateUserProfileTool = defineTool({
  name: 'updateUserProfile',
  description: 'Update the caller\'s own user profile (display name, locale, timezone, phone). Own-profile-only — cannot edit other users.',
  input_schema: zodToJsonSchema(updateUserProfilePatchSchema),
  zodSchema: updateUserProfilePatchSchema,
  gatedByDispatcherSet: false,
} as const);
