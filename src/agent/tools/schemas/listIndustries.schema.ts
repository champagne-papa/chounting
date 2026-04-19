// src/agent/tools/schemas/listIndustries.schema.ts
// Phase 1.2 Session 2 — Zod schema for the listIndustries agent
// tool. The tool takes no arguments.

import { z } from 'zod';

export const listIndustriesInputSchema = z.object({}).strict();

export type ListIndustriesInput = z.infer<typeof listIndustriesInputSchema>;
