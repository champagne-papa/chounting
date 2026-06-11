// extractOcrText.ts — shared OCR-text extraction helper for Tier A
// rule modules + aiFallback per Phase 7 chunk 7.2.
//
// The document_artifacts.lines column is JSONB (unknown shape per
// ADR-0011 §5 engine-agnostic contract). At v1 the chunk 7.1b
// mockSidecar + future PaddleOCR sidecar emit a flat array of line
// objects shaped `[{ text, bbox, confidence }, ...]`. This helper
// flattens that shape into a single string for regex matching.
//
// Supports defensive fall-throughs for adjacent shapes (object with
// .lines nested array; object with .text string field) so future
// engine swaps behind the engine-agnostic contract don't immediately
// break Tier A heuristics.

import type { DocumentArtifactRow } from '../types';

interface LineObject {
  text?: string;
}

interface NestedLines {
  text?: string;
  lines?: LineObject[];
}

export function extractOcrText(artifact: DocumentArtifactRow): string {
  const lines = artifact.lines as
    | LineObject[]
    | NestedLines
    | NestedLines[]
    | undefined;

  if (!lines) return '';

  // Shape 1: flat array of line objects [{ text, ... }, ...] — chunk
  // 7.1b mockSidecar + canonical PaddleOCR shape.
  if (Array.isArray(lines)) {
    return lines
      .map((l) => {
        // Defensive: line could be flat LineObject or nested NestedLines.
        if (typeof l === 'object' && l !== null) {
          if (typeof (l as LineObject).text === 'string') {
            return (l as LineObject).text ?? '';
          }
          if (Array.isArray((l as NestedLines).lines)) {
            return ((l as NestedLines).lines ?? [])
              .map((nested) => nested.text ?? '')
              .join('\n');
          }
        }
        return '';
      })
      .join('\n');
  }

  // Shape 2: object with nested .lines array.
  if (typeof lines === 'object' && lines !== null) {
    if (Array.isArray((lines as NestedLines).lines)) {
      return ((lines as NestedLines).lines ?? [])
        .map((line) => line.text ?? '')
        .join('\n');
    }
    if (typeof (lines as NestedLines).text === 'string') {
      return (lines as NestedLines).text ?? '';
    }
  }

  return '';
}
