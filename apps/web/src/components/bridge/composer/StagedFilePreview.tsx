'use client';

// src/components/bridge/composer/StagedFilePreview.tsx
//
// Full-size preview of a LOCAL staged File — the document the user is about
// to commit to the pipeline, rendered before anything is uploaded.
//
// NOT the stored-document preview route
// (/api/orgs/[orgId]/documents/[sourceDocumentId]/preview, build plan §4).
// That serves bytes already in SharePoint/Supabase; this renders a File
// still in browser memory, so it needs no backend and no auth — the whole
// point of confirm-before-commit is that nothing has been sent yet.
//
// No PDF library: browsers render PDFs natively from an object URL, and the
// repo carries no pdf dependency (build plan §5). An <iframe> over a blob:
// URL covers PDFs and images without adding one.
//
// Overlay pattern mirrors InertPromotionModal.tsx:34-42 (fixed inset-0,
// bg-black/40, z-50, role="dialog").

import { useEffect, useState } from 'react';

interface StagedFilePreviewProps {
  file: File;
  onClose: () => void;
}

export function StagedFilePreview({ file, onClose }: StagedFilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  // Object URLs leak until revoked — one per open, revoked on close/swap.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const renderable =
    file.type === 'application/pdf' || /^image\//.test(file.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
      data-testid="composer-preview-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${file.name}`}
        className="flex h-full w-full max-w-4xl flex-col rounded bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
        data-testid="composer-preview-dialog"
      >
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2">
          <span
            className="flex-1 truncate text-sm text-neutral-800"
            title={file.name}
          >
            {file.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close preview"
            data-testid="composer-preview-close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-neutral-100">
          {renderable && url ? (
            <iframe
              src={url}
              title={`Preview of ${file.name}`}
              className="h-full w-full border-0"
              data-testid="composer-preview-frame"
            />
          ) : (
            // Honest empty state: a .eml or .docx has no in-browser
            // renderer, and pretending otherwise would show a blank frame
            // the user reads as a broken file.
            <div
              className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500"
              data-testid="composer-preview-unsupported"
            >
              No preview available for this file type. It will still be
              uploaded when you send.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
