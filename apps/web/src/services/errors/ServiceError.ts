// src/services/errors/ServiceError.ts

export type ServiceErrorCode =
  // Auth / access
  | 'UNAUTHENTICATED'
  | 'PERMISSION_DENIED'
  | 'ORG_ACCESS_DENIED'
  | 'UNVERIFIED_CALLER'
  // Context validation
  | 'MISSING_CONTEXT'
  | 'MISSING_TRACE_ID'
  | 'MISSING_CALLER'
  // Journal posting
  | 'UNBALANCED'
  | 'PERIOD_LOCKED'
  | 'PERIOD_DATE_OUT_OF_RANGE'
  | 'POST_FAILED'
  // Wave 6 D3 — double-post guard: 23505 naming idx_je_source_external
  // (the (org_id, source_system, source_external_id) partial unique,
  // migration 20240111). Keyed on the CONSTRAINT NAME so the other
  // journal_entries 23505 source (unique_entry_number_per_org_period)
  // stays a POST_FAILED, never mis-recovered as already-posted.
  | 'DUPLICATE_SOURCE_EXTERNAL_ID'
  // Period lifecycle (Phase 1.x)
  | 'PERIOD_ALREADY_LOCKED'
  | 'PERIOD_NOT_LOCKED'
  | 'PERIOD_REASON_REQUIRED'
  // Reversals
  | 'REVERSAL_CROSS_ORG'
  | 'REVERSAL_PARTIAL_NOT_SUPPORTED'
  | 'REVERSAL_NOT_MIRROR'
  // Org / CoA
  | 'ORG_CREATE_FAILED'
  | 'TEMPLATE_NOT_FOUND'
  | 'COA_LOAD_FAILED'
  | 'PERIOD_GENERATION_FAILED'
  // Reads
  | 'NOT_FOUND'
  | 'READ_FAILED'
  // Org profile (Phase 1.5A)
  | 'ORG_NOT_FOUND'
  | 'ORG_IMMUTABLE_FIELD'
  | 'INDUSTRY_NOT_FOUND'
  | 'PARENT_ORG_NOT_FOUND'
  | 'PARENT_ORG_IS_SELF'
  | 'EXTERNAL_IDS_MALFORMED'
  | 'NO_COA_TEMPLATE_FOR_INDUSTRY'
  | 'ORG_UPDATE_FAILED'
  // Org addresses (Phase 1.5A)
  | 'ADDRESS_NOT_FOUND'
  | 'ADDRESS_TYPE_IMMUTABLE'
  | 'ADDRESS_VALIDATION_FAILED'
  | 'ADDRESS_WRITE_FAILED'
  // User profiles (Phase 1.5B)
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_UPDATE_FAILED'
  // Invitations (Phase 1.5B)
  | 'USER_ALREADY_MEMBER'
  | 'INVITATION_ALREADY_PENDING'
  | 'INVITATION_WRITE_FAILED'
  | 'INVITATION_INVALID_OR_EXPIRED'
  | 'INVITATION_NOT_FOUND'
  // Membership lifecycle (Phase 1.5B)
  | 'OWNER_CANNOT_BE_SUSPENDED'
  | 'OWNER_CANNOT_BE_REMOVED'
  | 'OWNER_ROLE_CHANGE_DENIED'
  | 'MEMBERSHIP_NOT_FOUND'
  | 'MEMBERSHIP_ALREADY_SUSPENDED'
  | 'MEMBERSHIP_NOT_SUSPENDED'
  // Agent (Phase 1.2)
  | 'AGENT_UNAVAILABLE'
  | 'AGENT_TOOL_VALIDATION_FAILED'
  | 'AGENT_SESSION_NOT_FOUND'
  | 'AGENT_SESSION_EXPIRED'
  | 'AGENT_STRUCTURED_RESPONSE_INVALID'
  | 'ONBOARDING_INCOMPLETE'
  // Recurring journals (Phase 0-1.1 Arc A Step 10)
  | 'RECURRING_TEMPLATE_NOT_FOUND'
  | 'RECURRING_TEMPLATE_INACTIVE'
  | 'RECURRING_RUN_NOT_PENDING'
  // Storage (Phase 1.Storage; ADR-0013 §7 / §8 / §9).
  // The first three codes are verbatim ADR cites. STORAGE_OPERATION_FAILED
  // is a repo-convention catchall (not in ADR text) for unexpected storage
  // operation failures not classified by the §7 three-way matrix —
  // implementations should reach for the verbatim codes first; the catchall
  // exists only when none of the three classify the failure.
  | 'STORAGE_KEY_MALFORMED'                // ADR-0013 §7 — malformed key, illegal chars, path-too-long
  | 'INTEGRITY_VERIFY_FAILED'              // ADR-0013 §7 + §9 — hash mismatch on integrity check
  | 'STORAGE_PROVIDER_TRANSIENT_EXHAUSTED' // ADR-0013 §8 — retry budget exhausted on transient failure
  | 'STORAGE_OPERATION_FAILED'             // Repo-convention catchall (not in ADR text)
  // Document core (Phase 2 chunk 2)
  | 'INVALID_TRANSITION'
  // Document core (Phase 2 chunk 5) — polymorphic integrity validator
  // in documentLinkService per ADR-0011 §4 + ADR-0016 §4.
  | 'LINKED_ENTITY_NOT_FOUND'
  // Document core (Phase 2 chunk 6) — exception queue partial UNIQUE
  // rejection in documentExceptionService per ADR-0011 §13.
  // Maps from Postgres unique_violation (23505) on
  // exception_queue_entries_open_per_case_idx.
  | 'EXCEPTION_ALREADY_OPEN'
  // Document core (Phase 4 chunk 3) — exception queue state-machine
  // rejection on dispatcher-initiated cancellation per ADR-0018
  // Subsystem 3 contract. Maps from Postgres check_violation (23514)
  // on cancel_exception_with_audit's WHERE exception_status='open'
  // guard when the entry has drifted to 'resolved' or 'cancelled'.
  // Caller-side symmetric with EXCEPTION_ALREADY_OPEN (both signal
  // "queue entry is in unexpected state for this operation").
  | 'EXCEPTION_ALREADY_CANCELLED'
  // Document core (Phase 5.1 chunk 5.1a) — INV-DOC-001 evidence-
  // completeness enforcement at billService.post(); fired when neither
  // primary_document_id nor override_evidence_completeness=true provided.
  // Per ADR-0011 §15 reservation graduation; leaf at
  // ledger_truth_model.md INV-DOC-001.
  | 'EVIDENCE_INCOMPLETE'
  // Rate limiting (Path A carve-out)
  // The route-layer policy decision returns 429 directly without
  // throwing a ServiceError; this code is added for future
  // service-layer firings where rate-limiting needs to flow
  // through the standard ServiceError → HTTP-status mapping.
  | 'RATE_LIMITED'
  // Tier 2 document pipeline (Phase 7 chunk 7.1a)
  // Per ADR-0014 §12 verbatim: transient-retry-budget-exhausted +
  // service-unavailable categories at Stages 0-7. Verbatim ADR
  // text uses these codes (§12.1: "typed ServiceError with code
  // `PIPELINE_TRANSIENT_EXHAUSTED`"; §12.2: pipeline_unavailable
  // exception class with no-retry semantics).
  | 'PIPELINE_TRANSIENT_EXHAUSTED'
  | 'PIPELINE_UNAVAILABLE'
  // Rule services (Ring 2A-core Commit 3; ADR-0025 §6). Generic IO failures
  // reuse READ_FAILED / POST_FAILED (periodService precedent); these are the
  // rule-domain semantic codes.
  | 'RULE_NOT_FOUND'          // rule_registry / vendor_rules lookup miss
  | 'RULE_LIFECYCLE_INVALID'  // illegal lifecycle transition (e.g. promote/demote/retire a retired rule)
  | 'RULE_CREATE_FAILED'      // create_vendor_rule_atomic RPC failure
  | 'RULE_BRANCH_ASSEMBLY_FAILED'; // stored condition_value fails its condition_type validator (ruleBranchService boundary)

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ServiceError';
  }
}
