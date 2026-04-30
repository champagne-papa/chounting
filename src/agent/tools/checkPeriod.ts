// src/agent/tools/checkPeriod.ts
// Master brief §6.1. Read-only tool checking whether the fiscal
// period containing a given date is open.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { checkPeriodInputSchema } from './schemas/checkPeriod.schema';
import { defineTool } from './types';

export const checkPeriodTool = defineTool({
  name: 'checkPeriod',
  description: `Check whether the fiscal period containing a given entry date is open. Call before proposing a journal entry so the period-lock constraint is known ahead of the post.

If checkPeriod returns null or otherwise indicates the period is not available for posting, the period either exists but is locked for posting, or has not yet been created (common just after year-end, before next year's periods are provisioned). Before proceeding, reconsider whether the date you inferred is correct — relative expressions like "this month," "today," or "yesterday" should resolve against the Current date above. If you still believe the user intends that date, confirm it with them and let them know the period is not currently available for posting — never ask for or display internal IDs, UUIDs, or dry-run handles.`,
  input_schema: zodToJsonSchema(checkPeriodInputSchema),
  zodSchema: checkPeriodInputSchema,
  gatedByDispatcherSet: true,
} as const);
