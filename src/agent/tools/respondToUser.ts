// src/agent/tools/respondToUser.ts
// Master brief §6.2. Structural tool — every agent turn MUST end
// with a call to this. The orchestrator extracts the tool_use
// args as the AgentResponse.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { respondToUserInputSchema } from './schemas/respondToUser.schema';

export const respondToUserTool = {
  name: 'respondToUser',
  description: 'The final step of every turn. You MUST end every turn with a call to respondToUser carrying a template_id and params, and — when the response surfaces a renderable artifact for the user (most commonly a journal-entry proposal) — a canvas_directive describing the artifact. The user-facing response is rendered from template_id and params via next-intl; do not output English prose.',
  input_schema: zodToJsonSchema(respondToUserInputSchema),
  zodSchema: respondToUserInputSchema,
} as const;
