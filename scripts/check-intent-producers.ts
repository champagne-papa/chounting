// scripts/check-intent-producers.ts
//
// ADR-0031 — No-AI-Only-Paths producer-coverage check (TEETH — blocking).
//
// Reads the pure, code-defined producer registry (apps/web/src/core/intent/producers.ts)
// and FAILS (exit 1) on any Intent lacking a non-AI producer, except the ratified
// V1 carve-out (V1_TEETH_SCOPE_OUT — `query`, per the Wave-6 build-plan §2 Q2
// scope-out; re-include trigger named at the constant). Build-time static, no DB,
// no runtime, no org context (D-0031.5). Pattern mirrors scripts/adr/lint.ts.
//
// PROVENANCE (the warn→teeth lineage, ADR-0031 D-0031.2/.3):
//   - Wave 4 shipped this check WARN-ONLY (gaps at warning, exit 0 — declare now,
//     enforce later; charter §2 Inv 3 "teeth at Wave 6").
//   - Wave 6 D6 landed the teeth under register-on-enforcement: exit is now
//     `gaps > 0 ? 1 : 0` over the UNSCOPED gap set; INV-WORKFLOW-001 registers at
//     D6 T3 (invariants.md row 28 + ledger_truth_model.md leaf); gate wiring
//     (ci.yml job; harness per the T2-decided variant) lands at D6 T2.
//   - The Query gap was dispositioned per the precondition this header carried
//     since Wave 4: formally scoped out (Q2 ratified) with a Phase-2 rationale +
//     a named re-include trigger — see V1_TEETH_SCOPE_OUT in producers.ts.
//
// The pure core (runCheck) lives in producers.ts beside the gap-finder, so this
// script stays a thin print-and-exit wrapper and the unit tests import the logic
// with no script side effects (this file's unconditional main() is never imported).

import { runCheck } from '../apps/web/src/core/intent/producers';

function main(): void {
  const result = runCheck();

  for (const intentKey of result.scopedOut) {
    // Visible, per Q2 ("not silent"): the carve-out and its re-include trigger.
    process.stdout.write(
      `intent-producers:check scoped-out ${intentKey} — no non-AI producer; ` +
        `SCOPED OUT of V1 teeth (Q2 ratified; QuerySpec is Phase-2-reserved). ` +
        `Re-include trigger: when QuerySpec lands and query separates from ` +
        `navigation, query rejoins the teeth and needs its own non-AI producer.\n`,
    );
  }

  for (const intentKey of result.effectiveGaps) {
    process.stdout.write(
      `intent-producers:check ERROR ${intentKey} — no non-AI producer ` +
        `(INV-WORKFLOW-001; build-failing since Wave 6 D6)\n`,
    );
  }

  console.log(
    `intent-producers:check — ${result.gaps.length} gap(s); ` +
      `${result.scopedOut.length} scoped out (V1 carve-out); ` +
      `${result.effectiveGaps.length} ERROR(s) (unscoped intent(s) with no non-AI producer).`,
  );

  // Wave 6 D6 teeth (INV-WORKFLOW-001): non-zero on any unscoped gap.
  process.exit(result.exitCode);
}

main();
