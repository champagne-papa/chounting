// scripts/check-intent-producers.ts
//
// ADR-0031 Wave-4 — No-AI-Only-Paths producer-coverage check (WARN-ONLY).
//
// Reads the pure, code-defined producer registry (apps/web/src/core/intent/producers.ts)
// and reports any Intent lacking a non-AI producer. Build-time static, no DB, no runtime,
// no org context (D-0031.5). Pattern mirrors scripts/adr/lint.ts (warn-permissive /
// error-blocking).
//
// Wave 4: gaps emit at WARNING; the process exits 0 (NON-BLOCKING — declare now,
// enforce later; charter §2 Inv 3 "teeth at Wave 6").
//
// WAVE-6 TEETH-FLIP (the one-line change): replace the final `process.exit(0)` with
//   process.exit(gaps.length > 0 ? 1 : 0);
// and register INV-WORKFLOW-001 in docs/02_specs/invariants.md (+ a ledger_truth_model.md
// leaf) at that point (register-on-enforcement). Before flipping, the Query gap must be
// dispositioned (a non-AI producer lands, or Query is formally scoped out with a Phase-2
// rationale) — see apps/web/src/core/intent/producers.ts `query`.

import {
  INTENT_PRODUCERS,
  intentsLackingNonAiProducer,
} from '../apps/web/src/core/intent/producers';

function main(): void {
  const total = Object.keys(INTENT_PRODUCERS).length;
  const gaps = intentsLackingNonAiProducer();

  for (const intentKey of gaps) {
    // Warnings → stdout (non-blocking), matching the adr:lint convention.
    process.stdout.write(
      `intent-producers:check warning ${intentKey} — no non-AI producer ` +
        `(INV-WORKFLOW-001; warn-only at Wave 4, teeth at Wave 6)\n`,
    );
  }

  console.log(
    `intent-producers:check — ${total} intent(s) checked; ` +
      `${gaps.length} warning(s) (intent(s) with no non-AI producer).`,
  );

  // WAVE 4: warn-only — non-blocking. Wave-6 teeth-flip: process.exit(gaps.length > 0 ? 1 : 0).
  process.exit(0);
}

main();
