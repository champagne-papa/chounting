// tests/unit/storage/graphIo.test.ts
//
// Graph addressing for the SharePoint provider's bytes-I/O layer.
//
// The load-bearing property is PARITY: the simple (≤4 MiB) and large
// (>4 MiB) upload paths must address the SAME org drive
// (/drives/{driveId}/root:/...), differing only in the trailing Graph
// verb (:/content vs :/createUploadSession). uploadLarge previously
// addressed neither — it fell through to the SDK's /me/drive default
// (graphIo.ts uploadLarge passed no uploadSessionURL), which is invalid
// under app-only Sites.Selected auth. These tests pin the drive
// addressing and the small/large parity so the two paths can't diverge
// again.
//
// NB: the awkward-filename case asserts ONLY the parity invariant (the
// two stems are identical), NOT a literal raw-'#' URL — '#'/'%' survive
// sanitizeFilename and reach these helpers raw; correct URL-encoding of
// those is a SEPARATE concern (tracked), so this test must not codify
// raw-'#' as the intended contract.

import { describe, it, expect } from 'vitest';
import {
  itemContentPath,
  itemUploadSessionPath,
} from '@/services/storage/providers/graph/graphIo';

describe('graphIo Graph addressing — drive-addressed, small/large parity', () => {
  const driveId = 'drive-1';
  const parentPath = 'sources/sd-1';

  it('itemContentPath builds the drive-addressed simple-upload content URL', () => {
    expect(itemContentPath(driveId, parentPath, 'invoice.pdf')).toBe(
      '/drives/drive-1/root:/sources/sd-1/invoice.pdf:/content',
    );
  });

  it('itemUploadSessionPath builds the drive-addressed create-session URL (never /me/drive)', () => {
    const url = itemUploadSessionPath(driveId, parentPath, 'invoice.pdf');
    expect(url).toBe(
      '/drives/drive-1/root:/sources/sd-1/invoice.pdf:/createUploadSession',
    );
    expect(url.startsWith('/drives/drive-1/')).toBe(true);
    expect(url).not.toContain('/me/drive');
  });

  it('parity: small and large resolve to the identical stem for the same input (incl. awkward filename), differing only in the trailing verb', () => {
    const stem = (u: string) => u.replace(/:\/(content|createUploadSession)$/, '');
    // The helpers receive the already-sanitized filename; '#' survives
    // sanitizeFilename (space → '_'), so this exercises the raw-special
    // case for PARITY only.
    for (const fileName of ['invoice.pdf', 'Invoice_#5_(Jan).pdf']) {
      const content = itemContentPath(driveId, parentPath, fileName);
      const session = itemUploadSessionPath(driveId, parentPath, fileName);
      expect(content.endsWith(':/content')).toBe(true);
      expect(session.endsWith(':/createUploadSession')).toBe(true);
      expect(stem(content)).toBe(stem(session)); // no divergence
    }
  });
});
