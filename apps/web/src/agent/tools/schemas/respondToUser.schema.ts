// src/agent/tools/schemas/respondToUser.schema.ts
// Phase 1.2 Session 2 — Zod schema for the respondToUser
// structural tool that enforces the template_id + params
// response contract. Master brief §6.2.

import { z } from 'zod';
import { canvasDirectiveSchema } from '@/shared/schemas/canvas/canvasDirective.schema';

export const respondToUserInputSchema = z.object({
  template_id: z.string(),
  params: z.record(z.string(), z.unknown()),
  canvas_directive: canvasDirectiveSchema.optional(),
}).strict();

export type RespondToUserInput = z.infer<typeof respondToUserInputSchema>;
