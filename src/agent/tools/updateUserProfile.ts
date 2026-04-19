// src/agent/tools/updateUserProfile.ts
// Master brief §6.1. Uses existing updateUserProfilePatchSchema.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { updateUserProfilePatchSchema } from '@/shared/schemas/user/profile.schema';

export const updateUserProfileTool = {
  name: 'updateUserProfile',
  description: 'Update the caller\'s own user profile (display name, locale, timezone, phone). Own-profile-only — cannot edit other users.',
  input_schema: zodToJsonSchema(updateUserProfilePatchSchema),
  zodSchema: updateUserProfilePatchSchema,
} as const;
