'use client';
// apps/web/src/components/canvas/InertPromotionModal.tsx
//
// Ring 2A-core Commit 5 (ADR-0025 §10 / Decision 10). The inert promotion-
// ceremony modal, opened from a rule row's "Promote" action.
//
// The Agent Ladder is intentionally disabled at v1 ("disabled, not broken" per
// ADR-0024), so this is a *ceremony surface*, not a confirm dialog. It renders
// the OQ-6 copy, shows the promotable target rungs as visibly disabled, and
// offers a single close action. It fires NO network request — a rule cannot be
// promoted at v1, and the four row-action routes deliberately have no promote-
// from-canvas wiring here.
//
// Overlay pattern mirrors RecurringRunListView's reject modal (fixed inset-0
// backdrop + click-outside-to-close + centered white panel).

// OQ-6 resolution — candidate #2 (Explanatory), ratified 2026-05-27. Rendered
// VERBATIM as a single string literal; do not reflow or re-tokenize.
const PROMOTION_COPY =
  'The Agent Ladder is intentionally disabled at v1 — every rule operates at always_confirm (suggest with required approval). Promotion to notify_and_auto_post or silent_auto becomes available when the ladder activates post-v1.';

// The two promotable target rungs (always_confirm is the v1 floor / demote
// target, never a promotion target — mirrors PromoteRuleInputSchema).
const DISABLED_TARGET_RUNGS = ['notify_and_auto_post', 'silent_auto'] as const;

export type InertPromotionModalProps = {
  ruleName?: string | null;
  onClose: () => void;
};

export function InertPromotionModal({ ruleName, onClose }: InertPromotionModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="inert-promotion-modal"
    >
      <div
        className="bg-white rounded shadow-lg p-6 w-[480px] max-w-[90vw]"
        role="dialog"
        aria-modal="true"
        aria-label="Promote rule"
      >
        <h3 className="text-base font-semibold mb-3">
          Promote rule{ruleName ? ` — ${ruleName}` : ''}
        </h3>

        <p className="text-sm text-neutral-600 mb-4">{PROMOTION_COPY}</p>

        <div className="mb-5">
          <div className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
            Target rung
          </div>
          <div className="flex flex-col gap-2">
            {DISABLED_TARGET_RUNGS.map((rung) => (
              <button
                key={rung}
                type="button"
                disabled
                aria-disabled="true"
                className="flex items-center justify-between text-left px-3 py-2 border border-neutral-200 rounded text-sm text-neutral-400 bg-neutral-50 cursor-not-allowed"
              >
                <span className="font-mono">{rung}</span>
                <span className="text-xs">available post-v1</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="px-3 py-1 border border-neutral-300 text-sm rounded hover:bg-neutral-50"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
