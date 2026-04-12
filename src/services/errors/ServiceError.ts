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
  | 'PERIOD_GENERATION_FAILED';

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
