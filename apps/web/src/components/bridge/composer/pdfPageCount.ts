// src/components/bridge/composer/pdfPageCount.ts
//
// Best-effort page count for a LOCAL File the user has staged but not yet
// uploaded. Browser-only, no dependency: the repo has no PDF library
// (build plan §5) and adding one to put a number on a tile is not worth
// the bundle.
//
// DELIBERATELY CONSERVATIVE. This reads the PDF's page-tree /Count, which
// is correct for ordinary documents but not for every producer: linearized
// or incrementally-updated files can carry several /Count values, and an
// object-stream-compressed page tree (PDF 1.5+, /ObjStm) hides it entirely.
// So the contract is "a number you can trust, or null" — never a guess.
// Callers render nothing when null rather than showing a wrong count on a
// tile the user is about to commit to the pipeline.
//
// The alternative (counting `/Type /Page` occurrences) over-counts on
// nearly every real invoice because the string also appears inside
// /Pages nodes and annotation dictionaries, so it is not used.

/** Bytes read from the head/tail before giving up. PDFs put the catalog
 *  and page tree near one end or the other; scanning a whole multi-MB
 *  scan on the UI thread is not worth it for a tile label. */
const SCAN_BYTES = 256 * 1024;

/**
 * Page count for a staged PDF, or null when it cannot be determined
 * confidently. Never throws — a preview tile must not be able to break
 * the composer.
 */
export async function derivePdfPageCount(file: File): Promise<number | null> {
  if (file.type !== 'application/pdf') return null;

  try {
    const head = await readSlice(file, 0, Math.min(SCAN_BYTES, file.size));
    const fromHead = pageTreeCount(head);
    if (fromHead !== null) return fromHead;

    if (file.size > SCAN_BYTES) {
      const tail = await readSlice(
        file,
        Math.max(0, file.size - SCAN_BYTES),
        file.size,
      );
      return pageTreeCount(tail);
    }
    return null;
  } catch {
    // Unreadable slice, revoked blob, anything: no count, no failure.
    return null;
  }
}

async function readSlice(file: File, start: number, end: number): Promise<string> {
  const buf = await file.slice(start, end).arrayBuffer();
  // latin1 keeps byte values intact for regex over mixed binary/ASCII.
  return new TextDecoder('latin1').decode(buf);
}

/**
 * Extract the page-tree count. Requires agreement: if multiple /Count
 * values appear under a /Type /Pages node and they disagree, we cannot
 * tell which is the live one (incremental update), so return null.
 */
function pageTreeCount(text: string): number | null {
  const counts = [...text.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (counts.length === 0) {
    // /Count may precede /Type within the same dictionary.
    const alt = [...text.matchAll(/\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (alt.length === 0) return null;
    return alt.every((n) => n === alt[0]) ? alt[0] : null;
  }

  return counts.every((n) => n === counts[0]) ? counts[0] : null;
}
