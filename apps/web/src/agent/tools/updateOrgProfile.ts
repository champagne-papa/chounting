// src/agent/tools/updateOrgProfile.ts
// Master brief §6.1. Uses existing updateOrgProfilePatchSchema.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { updateOrgProfilePatchSchema } from '@/shared/schemas/organization/profile.schema';
import { defineTool } from './types';

// gatedByDispatcherSet: false — substrate state-2 per S30 (c4)
// substrate finding. updateOrgProfile IS org-scoped, but its
// null-org rejection happens via inline check at the per-tool
// dispatcher case in orchestrator/index.ts (around the
// `if (toolName === 'updateOrgProfile')` block, not at the
// ORG_SCOPED_TOOLS Set membership lookup. The field encodes
// "where the gate lives," not "is it org-scoped"; substrate-
// honest naming per S30 (c4) ratification.
export const updateOrgProfileTool = defineTool({
  name: 'updateOrgProfile',
  description: 'Update an organization\'s profile (name, legal name, timezone, reporting basis, etc.). Controller-only.',
  input_schema: zodToJsonSchema(updateOrgProfilePatchSchema),
  zodSchema: updateOrgProfilePatchSchema,
  gatedByDispatcherSet: false,
} as const);
