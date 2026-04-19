// src/agent/tools/checkPeriod.ts
// Master brief §6.1. Read-only tool checking whether the fiscal
// period containing a given date is open.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { checkPeriodInputSchema } from './schemas/checkPeriod.schema';

export const checkPeriodTool = {
  name: 'checkPeriod',
  description: 'Check whether the fiscal period containing a given entry date is open. Call before proposing a journal entry so the period-lock constraint is known ahead of the post.',
  input_schema: zodToJsonSchema(checkPeriodInputSchema),
  zodSchema: checkPeriodInputSchema,
} as const;
