// src/app/api/_helpers/serviceErrorToStatus.ts
// Maps ServiceErrorCode to HTTP status codes.
// This is an HTTP-layer concern — the service layer doesn't know
// about status codes.
//
// When adding new ServiceErrorCode values, add a case here too.
// The default returns 500, but explicit mapping is preferred so
// callers get semantically correct status codes.

import type { ServiceErrorCode } from '@/services/errors/ServiceError';

export function serviceErrorToStatus(code: ServiceErrorCode): number {
  switch (code) {
    // Auth
    case 'UNAUTHENTICATED':
      return 401;

    // Access
    case 'PERMISSION_DENIED':
    case 'ORG_ACCESS_DENIED':
    case 'UNVERIFIED_CALLER':
      return 403;

    // Not found
    case 'NOT_FOUND':
    case 'ORG_NOT_FOUND':
    case 'ADDRESS_NOT_FOUND':
    case 'PROFILE_NOT_FOUND':
    case 'INVITATION_NOT_FOUND':
    case 'MEMBERSHIP_NOT_FOUND':
    case 'AGENT_SESSION_NOT_FOUND':
      return 404;

    // Gone (resource expired)
    case 'AGENT_SESSION_EXPIRED':
      return 410;

    // Service unavailable (external dependency)
    case 'AGENT_UNAVAILABLE':
      return 503;

    // Bad request (malformed or semantically invalid input)
    case 'EXTERNAL_IDS_MALFORMED':
    case 'ADDRESS_VALIDATION_FAILED':
    case 'PERIOD_REASON_REQUIRED':
      return 400;

    // Conflict (state mismatch — server state differs from caller expectation)
    case 'PERIOD_ALREADY_LOCKED':
    case 'PERIOD_NOT_LOCKED':
      return 409;

    // Business rule rejections (request is valid but can't be processed)
    case 'UNBALANCED':
    case 'PERIOD_LOCKED':
    case 'REVERSAL_CROSS_ORG':
    case 'REVERSAL_PARTIAL_NOT_SUPPORTED':
    case 'REVERSAL_NOT_MIRROR':
    case 'ORG_IMMUTABLE_FIELD':
    case 'INDUSTRY_NOT_FOUND':
    case 'PARENT_ORG_NOT_FOUND':
    case 'PARENT_ORG_IS_SELF':
    case 'NO_COA_TEMPLATE_FOR_INDUSTRY':
    case 'ADDRESS_TYPE_IMMUTABLE':
    case 'USER_ALREADY_MEMBER':
    case 'INVITATION_ALREADY_PENDING':
    case 'INVITATION_INVALID_OR_EXPIRED':
    case 'OWNER_CANNOT_BE_SUSPENDED':
    case 'OWNER_CANNOT_BE_REMOVED':
    case 'OWNER_ROLE_CHANGE_DENIED':
    case 'MEMBERSHIP_ALREADY_SUSPENDED':
    case 'MEMBERSHIP_NOT_SUSPENDED':
    case 'AGENT_TOOL_VALIDATION_FAILED':
    case 'AGENT_STRUCTURED_RESPONSE_INVALID':
    case 'ONBOARDING_INCOMPLETE':
      return 422;

    // Server errors (unexpected failures)
    case 'MISSING_CONTEXT':
    case 'MISSING_TRACE_ID':
    case 'MISSING_CALLER':
    case 'POST_FAILED':
    case 'READ_FAILED':
    case 'ORG_CREATE_FAILED':
    case 'TEMPLATE_NOT_FOUND':
    case 'COA_LOAD_FAILED':
    case 'PERIOD_GENERATION_FAILED':
    case 'ORG_UPDATE_FAILED':
    case 'ADDRESS_WRITE_FAILED':
    case 'PROFILE_UPDATE_FAILED':
    case 'INVITATION_WRITE_FAILED':
    default:
      return 500;
  }
}
