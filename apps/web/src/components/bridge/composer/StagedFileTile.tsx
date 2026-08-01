'use client';

// src/components/bridge/composer/StagedFileTile.tsx
//
// One staged file in the pre-send composer. Replaces the 36px text row the
// tray shipped at Phase 6.5 chunk 3 (AgentChatPanel.tsx:864-900) — same
// data, tile presentation, plus a page count and click-to-preview.
//
// Staging semantics are UNCHANGED and are not this component's to change:
// a staged file has not been uploaded, OCR'd, or recorded. The tile is a
// confirm-before-commit affordance, so every control here is local —
// remove drops it from React state, preview reads the in-memory File.
// Nothing reaches the pipeline until Send (AgentChatPanel handleUnifiedSend).

import { useEffect, useState } from 'react';
import { derivePdfPageCount } from './pdfPageCount';

interface StagedFileTileProps {
  file: File;
  onRemove: () => void;
  onPreview: () => void;
}

function iconFor(file: File): string {
  if (/^image\//.test(file.type)) return '\u{1F5BC}';
  if (file.type === 'application/pdf') return '\u{1F4C4}';
  return '\u{1F4CE}';
}

/** KB under 1 MB, else MB to one decimal — sizes here are invoice-scale. */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StagedFileTile({
  file,
  onRemove,
  onPreview,
}: StagedFileTileProps) {
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void derivePdfPageCount(file).then((n) => {
      // Guard against a resolve landing after the tile was removed.
      if (alive) setPageCount(n);
    });
    return () => {
      alive = false;
    };
  }, [file]);

  return (
    <div
      className="group relative flex w-32 flex-col rounded border border-neutral-300 bg-white p-2 text-left hover:border-neutral-400"
      data-testid="composer-tile"
    >
      {/* Remove sits OUTSIDE the preview button: nesting interactive
          elements breaks keyboard semantics and would make × also open
          the preview. */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 z-10 rounded bg-white/80 px-1 text-neutral-400 opacity-0 hover:text-neutral-800 focus:opacity-100 group-hover:opacity-100"
        aria-label={`Remove ${file.name}`}
        data-testid="composer-tile-remove"
      >
        ×
      </button>

      <button
        type="button"
        onClick={onPreview}
        className="flex flex-col items-start gap-1 text-left"
        aria-label={`Preview ${file.name}`}
        data-testid="composer-tile-preview"
      >
        <span className="text-2xl leading-none" aria-hidden="true">
          {iconFor(file)}
        </span>
        <span
          className="w-full truncate text-xs text-neutral-800"
          title={file.name}
        >
          {file.name}
        </span>
        <span className="text-[10px] text-neutral-500">
          {formatSize(file.size)}
          {/* Page count only when derivable — see pdfPageCount.ts; a wrong
              count on a file about to be committed is worse than none. */}
          {pageCount !== null && (
            <span data-testid="composer-tile-pagecount">
              {` · ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
