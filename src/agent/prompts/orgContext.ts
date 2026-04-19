// src/agent/prompts/orgContext.ts
// Phase 1.2 Session 3 — deferred-extensible OrgContext stub per
// sub-brief §6.6 / Pre-decision 1. Session 4 expands this interface
// to the full master §8 shape (legal_name, industry_display_name,
// functional_currency, fiscal_year_start_month, fiscal_periods,
// controllers). Existing call sites stay valid as fields are added.
//
// The long-term home for OrgContext is master §8's
// src/agent/memory/orgContextManager.ts. This file is the stub
// that lives until Session 4.

export interface OrgContext {
  org_id: string;
  org_name: string;
  // TODO(session-4): add legal_name, industry_display_name,
  // functional_currency, fiscal_year_start_month, fiscal_periods,
  // controllers per master §8. Also add the Phase 2 reserved
  // empty-array fields (vendor_rules, intercompany_relationships,
  // approval_rules).
}
