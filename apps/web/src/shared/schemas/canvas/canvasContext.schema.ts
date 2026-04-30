// src/shared/schemas/canvas/canvasContext.schema.ts
// Phase 1.2 Session 4 — runtime Zod schema mirroring the
// CanvasContext TypeScript type at
// src/shared/types/canvasContext.ts. Used by the
// /api/agent/message request-body validator so the canvas_context
// field sent from the client is verified before reaching the
// orchestrator.

import { z } from 'zod';
import { canvasDirectiveSchema } from './canvasDirective.schema';

const selectedEntitySchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('journal_entry'),
      id: z.string().uuid(),
      display_name: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('account'),
      id: z.string().uuid(),
      display_name: z.string(),
    })
    .strict(),
]);

export const canvasContextSchema = z
  .object({
    current_directive: canvasDirectiveSchema,
    selected_entity: selectedEntitySchema.optional(),
  })
  .strict();

export type CanvasContextParsed = z.infer<typeof canvasContextSchema>;
