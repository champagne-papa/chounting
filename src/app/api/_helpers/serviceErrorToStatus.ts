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
      return 404;

    // Bad request (malformed or semantically invalid input)
    case 'EXTERNAL_IDS_MALFORMED':
    case 'ADDRESS_VALIDATION_FAILED':
      return 400;

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
    default:
      return 500;
  }
}
