// classifier/index.ts — Stage 3 classifier entrypoint per Phase 7 chunk
// 7.2 brief Task 7.2.4 + ADR-0014 §7.
//
// Thin wrapper around coordinateTiers — exists to give the orchestrator
// a stable per-stage entrypoint name ('classifyDocumentType') matching
// the ADR-0014 §1 illustrative orchestrator shape (parallels
// dedupByHash, byteFetch, runOCR at Stages 0+1+2).

import { coordinateTiers, type TierCoordinationResult } from './tierCoordination';
import type {
  ClassificationInput,
} from '../types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

export async function classifyDocumentType(
  input: ClassificationInput,
  ctx: SystemActorServiceContext,
): Promise<TierCoordinationResult> {
  return coordinateTiers(input, ctx);
}

export type { TierCoordinationResult } from './tierCoordination';
