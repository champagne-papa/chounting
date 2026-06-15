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
// URL-significant chars: client.api() does NO path encoding, so itemStemPath
// percent-encodes the user-controlled segments (filename + parentPath
// segments), keeping the structural '/drives/{driveId}/root:/' and ':/<verb>'
// delimiters literal. The encode tests below fence both ends — '#' must encode
// to '%23', and the ':' delimiters must NOT become '%3A'.

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
    // Special-char filename exercises PARITY (both helpers encode it
    // identically via the shared stem); encoding correctness is asserted
    // separately below.
    for (const fileName of ['invoice.pdf', 'Invoice_#5_(Jan).pdf']) {
      const content = itemContentPath(driveId, parentPath, fileName);
      const session = itemUploadSessionPath(driveId, parentPath, fileName);
      expect(content.endsWith(':/content')).toBe(true);
      expect(session.endsWith(':/createUploadSession')).toBe(true);
      expect(stem(content)).toBe(stem(session)); // no divergence
    }
  });

  it('percent-encodes URL-significant chars in the filename segment (# → %23), keeping root:/ and the verb delimiters literal', () => {
    const content = itemContentPath(driveId, parentPath, 'Invoice_#5_(Jan).pdf');
    const session = itemUploadSessionPath(driveId, parentPath, 'Invoice_#5_(Jan).pdf');
    // '#' encoded — a raw '#' would truncate the path at fetch (client.api
    // does no path encoding); '(' ')' are left literal (not URL delimiters).
    expect(content).toContain('Invoice_%235_(Jan).pdf');
    expect(content).not.toContain('#');
    // Structural delimiters MUST survive — the encode must not escape ':' to
    // %3A (that would corrupt root:/ … :/content into root%3A…).
    expect(content).toContain('/drives/drive-1/root:/');
    expect(content).not.toContain('root%3A');
    expect(content.endsWith(':/content')).toBe(true);
    expect(session.endsWith(':/createUploadSession')).toBe(true);
  });

  it('percent-encodes URL-significant chars in a parentPath segment too, keeping the / separators literal', () => {
    const url = itemUploadSessionPath(driveId, 'sources/sd #2', 'invoice.pdf');
    expect(url).toBe(
      '/drives/drive-1/root:/sources/sd%20%232/invoice.pdf:/createUploadSession',
    );
    expect(url).not.toContain('#');
  });
});
