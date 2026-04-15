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
  | 'POST_FAILED'
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
  | 'ADDRESS_WRITE_FAILED';

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
