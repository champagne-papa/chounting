// src/services/middleware/errors.ts
// Re-exports and middleware-specific error subclass.

import { ServiceError, type ServiceErrorCode } from '@/services/errors/ServiceError';

/**
 * Thrown by withInvariants() when a pre-flight invariant check fails.
 * Subclass of ServiceError so catch blocks that handle ServiceError
 * still work, while tests can assert the specific class.
 */
export class InvariantViolationError extends ServiceError {
  constructor(code: ServiceErrorCode, message: string) {
    super(code, message);
    this.name = 'InvariantViolationError';
  }
}

export { ServiceError };
