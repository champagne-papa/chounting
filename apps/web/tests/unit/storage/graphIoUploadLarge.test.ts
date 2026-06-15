// tests/unit/storage/graphIoUploadLarge.test.ts
//
// uploadLarge must address the org drive via an explicit uploadSessionURL
// override — NOT the Graph SDK's /me/drive default (constructCreateSessionUrl),
// which is invalid under the app-only Sites.Selected auth this provider uses.
// The bug: uploadLarge passed only { fileName, path } to
// OneDriveLargeFileUploadTask.create, so the SDK fell through to /me/drive and
// the org's driveId was never addressed.
//
// The SDK is mocked here ONLY to capture create()'s options — the test
// exercises real uploadLarge behavior (does it compute + pass the
// drive-addressed URL). Live transfer correctness is proven by the gated
// >4 MiB e2e (sharepointDriveRealFlow.e2e.test.ts), per graphIo's testing
// boundary.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createSpy } = vi.hoisted(() => ({ createSpy: vi.fn() }));

vi.mock('@microsoft/microsoft-graph-client', () => ({
  ResponseType: { ARRAYBUFFER: 'arraybuffer' },
  OneDriveLargeFileUploadTask: {
    create: (...args: unknown[]) => {
      createSpy(...args);
      return Promise.resolve({
        upload: () => Promise.resolve({ responseBody: { id: 'item-large-x' } }),
      });
    },
  },
}));

vi.mock('@/services/storage/providers/graph/graphClient', () => ({
  getGraphClient: () => ({}),
}));

import { createRealGraphIo } from '@/services/storage/providers/graph/graphIo';

describe('graphIo.uploadLarge — drive-addressed upload session', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes a drive-addressed uploadSessionURL to the SDK (overriding the /me/drive default)', async () => {
    const io = createRealGraphIo();

    const id = await io.uploadLarge({
      driveId: 'drive-1',
      parentPath: 'sources/sd-1',
      fileName: 'invoice.pdf',
      bytes: new Uint8Array(5),
      mimeType: 'application/pdf',
    });

    expect(id).toBe('item-large-x');
    expect(createSpy).toHaveBeenCalledTimes(1);

    const options = createSpy.mock.calls[0][2] as { uploadSessionURL?: string };
    expect(options.uploadSessionURL).toBe(
      '/drives/drive-1/root:/sources/sd-1/invoice.pdf:/createUploadSession',
    );
  });
});
