// src/agent/tools/listChartOfAccounts.ts
// Master brief §6.1. Read-only tool listing the org's CoA.

import { zodToJsonSchema } from 'zod-to-json-schema';
import { listChartOfAccountsInputSchema } from './schemas/listChartOfAccounts.schema';

export const listChartOfAccountsTool = {
  name: 'listChartOfAccounts',
  description: 'List the organization\'s chart of accounts. Use when selecting the debit and credit accounts for a journal entry.',
  input_schema: zodToJsonSchema(listChartOfAccountsInputSchema),
  zodSchema: listChartOfAccountsInputSchema,
} as const;
