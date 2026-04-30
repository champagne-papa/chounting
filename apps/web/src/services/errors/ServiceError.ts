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
  | 'RECURRING_RUN_NOT_PENDING';

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
