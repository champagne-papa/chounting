// tests/helpers/classifyUnknownRepro.ts
//
// Pure logic for the board-#3 classify-unknown repro-runner. No I/O, no AI, no
// DB. The live runner (classifyUnknownRepro.integration.test.ts) wires these to
// the real adminClient + classifyDocumentType; these functions are the
// deterministic, unit-tested core.

/** The discriminating query (`group by exception_reason`), in-memory. */
export function tallyByReason(
  rows: { exception_reason: string }[],
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const r of rows) {
    tally[r.exception_reason] = (tally[r.exception_reason] ?? 0) + 1;
  }
  return tally;
}

/** The board-#3 target subset: rows queued as unknown_document_type. */
export function selectUnknownRows<T extends { exception_reason: string }>(
  rows: T[],
): T[] {
  return rows.filter((r) => r.exception_reason === 'unknown_document_type');
}

export type ReproVerdict = 'repro' | 'drop';

/**
 * Repro-or-drop. Re-running the classifier on a legible doc that was queued as
 * unknown_document_type either still emits `unknown` (the unknown REPRODUCES —
 * a genuine unknown doc, keep/investigate) or now classifies to a real type
 * (the unknown did NOT reproduce — transient/since-fixed → DROP the case).
 */
export function reproVerdict(reclassifiedType: string): ReproVerdict {
  return reclassifiedType === 'unknown' ? 'repro' : 'drop';
}
