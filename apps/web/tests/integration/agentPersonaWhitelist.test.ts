// tests/integration/agentPersonaWhitelist.test.ts
// CA-44: per-persona tool whitelist per master brief §6.4.

import { describe, it, expect } from 'vitest';
import { toolsForPersona } from '@/agent/orchestrator/toolsForPersona';

const ALL_TOOLS = [
  'checkPeriod',
  'createOrganization',
  'listChartOfAccounts',
  'listIndustries',
  'listJournalEntries',
  'postJournalEntry',
  'respondToUser',
  'reverseJournalEntry',
  'updateOrgProfile',
  'updateUserProfile',
] as const;

describe('CA-44: per-persona tool whitelist', () => {
  it('controller sees all 10 tools', () => {
    const names = toolsForPersona('controller').map((t) => t.name).sort();
    expect(names).toEqual([...ALL_TOOLS].sort());
  });

  it('ap_specialist excludes createOrganization and updateOrgProfile', () => {
    const names = toolsForPersona('ap_specialist').map((t) => t.name).sort();
    expect(names).toHaveLength(8);
    expect(names).not.toContain('createOrganization');
    expect(names).not.toContain('updateOrgProfile');
    expect(names).toContain('postJournalEntry');
    expect(names).toContain('reverseJournalEntry');
    expect(names).toContain('respondToUser');
  });

  it('executive excludes ledger mutations and org admin', () => {
    const names = toolsForPersona('executive').map((t) => t.name).sort();
    expect(names).toHaveLength(6);
    expect(names).not.toContain('postJournalEntry');
    expect(names).not.toContain('reverseJournalEntry');
    expect(names).not.toContain('createOrganization');
    expect(names).not.toContain('updateOrgProfile');
    expect(names).toContain('respondToUser');
    expect(names).toContain('updateUserProfile');
    expect(names).toContain('listChartOfAccounts');
  });
});
