// src/agent/orchestrator/toolsForPersona.ts
// Phase 1.2 Session 2 — per-persona tool whitelist. Master
// brief §6.4. Orchestrator filters the full inventory before
// sending tool definitions to Claude so the model isn't offered
// tools it cannot execute (UX + token economy). The real
// authorization guard stays at the service layer via
// withInvariants + canUserPerformAction.

import type { UserRole } from '@/services/auth/canUserPerformAction';
import {
  updateUserProfileTool,
  createOrganizationTool,
  updateOrgProfileTool,
  listIndustriesTool,
  listChartOfAccountsTool,
  checkPeriodTool,
  listJournalEntriesTool,
  postJournalEntryTool,
  reverseJournalEntryTool,
  respondToUserTool,
} from '@/agent/tools';

export type Persona = UserRole;

type ToolDef =
  | typeof updateUserProfileTool
  | typeof createOrganizationTool
  | typeof updateOrgProfileTool
  | typeof listIndustriesTool
  | typeof listChartOfAccountsTool
  | typeof checkPeriodTool
  | typeof listJournalEntriesTool
  | typeof postJournalEntryTool
  | typeof reverseJournalEntryTool
  | typeof respondToUserTool;

export function toolsForPersona(persona: Persona): readonly ToolDef[] {
  switch (persona) {
    case 'controller':
      // Full inventory: onboarding + read-only + ledger mutations + structural.
      return [
        updateUserProfileTool,
        createOrganizationTool,
        updateOrgProfileTool,
        listIndustriesTool,
        listChartOfAccountsTool,
        checkPeriodTool,
        listJournalEntriesTool,
        postJournalEntryTool,
        reverseJournalEntryTool,
        respondToUserTool,
      ];
    case 'ap_specialist':
      // Excludes createOrganization + updateOrgProfile (not an org admin).
      return [
        updateUserProfileTool,
        listIndustriesTool,
        listChartOfAccountsTool,
        checkPeriodTool,
        listJournalEntriesTool,
        postJournalEntryTool,
        reverseJournalEntryTool,
        respondToUserTool,
      ];
    case 'executive':
      // Read-only across the ledger + own-profile edit + structural.
      // No postJournalEntry, no reverseJournalEntry, no org admin.
      return [
        updateUserProfileTool,
        listIndustriesTool,
        listChartOfAccountsTool,
        checkPeriodTool,
        listJournalEntriesTool,
        respondToUserTool,
      ];
  }
}
