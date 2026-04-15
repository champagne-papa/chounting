import { z } from 'zod';
import {
  MoneyAmountSchema,
  FxRateSchema,
  addMoney,
  eqMoney,
  multiplyMoneyByRate,
  zeroMoney,
  type MoneyAmount,
  type FxRate,
} from './money.schema';

// --- Journal Line Schema ---
// Three .refine() checks per PLAN.md §3a / brief §15.1:
//   1. Debit XOR credit (both non-negative, at least one positive — matches D11 DB CHECK)
//   2. amount_original = debit_amount + credit_amount (matches D5 CHECK)
//   3. amount_cad = ROUND(amount_original * fx_rate, 4) (matches D5 CHECK)

const JournalLineBaseSchema = z.object({
  account_id: z.string().uuid(),
  description: z.string().optional(),
  debit_amount: MoneyAmountSchema,
  credit_amount: MoneyAmountSchema,
  currency: z.string().length(3).default('CAD'),
  amount_original: MoneyAmountSchema,
  amount_cad: MoneyAmountSchema,
  fx_rate: FxRateSchema,
  tax_code_id: z.string().uuid().nullable().optional(),
});

export const JournalLineSchema = JournalLineBaseSchema
  .refine(
    (line) => {
      const dZero = eqMoney(line.debit_amount, zeroMoney());
      const cZero = eqMoney(line.credit_amount, zeroMoney());
      // At least one must be positive (not all-zero, D11)
      if (dZero && cZero) return false;
      // At most one can be positive (XOR)
      if (!dZero && !cZero) return false;
      return true;
    },
    { message: 'Line must have exactly one of debit or credit positive (not both, not zero).' },
  )
  .refine(
    (line) => {
      // amount_original = debit_amount + credit_amount
      const sum = addMoney(line.debit_amount, line.credit_amount);
      return eqMoney(sum, line.amount_original);
    },
    { message: 'amount_original must equal debit_amount + credit_amount.' },
  )
  .refine(
    (line) => {
      // amount_cad = ROUND(amount_original * fx_rate, 4)
      const expected = multiplyMoneyByRate(line.amount_original, line.fx_rate);
      return eqMoney(expected, line.amount_cad);
    },
    { message: 'amount_cad must equal ROUND(amount_original * fx_rate, 4).' },
  );

export type JournalLine = z.infer<typeof JournalLineSchema>;

// --- Shared refinement helpers ---

function balancedRefinement(entry: { lines: JournalLine[] }): boolean {
  const debits = entry.lines.reduce(
    (acc, l) => addMoney(acc, l.debit_amount),
    zeroMoney(),
  );
  const credits = entry.lines.reduce(
    (acc, l) => addMoney(acc, l.credit_amount),
    zeroMoney(),
  );
  return eqMoney(debits, credits);
}
const balancedMessage = {
  message: 'Sum of debits must equal sum of credits (exact).',
};

// INV-IDEMPOTENCY-001 (service-layer pre-flight pairing): this refinement is the Zod
// boundary complement to the database CONSTRAINT idempotency_required_for_agent in
// 20240101000000_initial_schema.sql. Together they enforce "agent-sourced entries require
// an idempotency key" at two layers: Zod at the service boundary (fast ergonomic error),
// CHECK at the database (authoritative enforcement).
//
// Phase 1.1 reachability note: this refine is currently dead code at runtime. Both
// PostJournalEntryInputSchema and ReversalInputSchema include a sibling refine that rejects
// `source === 'agent'` outright ("source: 'agent' is not implemented in Phase 1.1"), so an
// input that would trigger the idempotency check is rejected by the earlier sibling refine
// first. Phase 1.2 removes the sibling gate when the agent path lands, at which point this
// refine begins firing in production and the bidirectional pairing with the database CHECK
// becomes observable. The annotation is placed now because the site is correct now; the
// runtime reachability follows in Phase 1.2.
function idempotencyRefinement(
  entry: { source: string; idempotency_key?: string },
): boolean {
  return entry.source !== 'agent' || entry.idempotency_key !== undefined;
}
const idempotencyMessage = {
  message: 'idempotency_key is required when source is "agent".',
};

// --- Base schema (never used directly) ---

const JournalEntryBaseSchema = z.object({
  org_id: z.string().uuid(),
  fiscal_period_id: z.string().uuid(),
  entry_date: z.string().date(),
  description: z.string().min(1),
  reference: z.string().optional(),
  source: z.enum(['manual', 'agent', 'import']),
  idempotency_key: z.string().uuid().optional(),
  dry_run: z.boolean().optional().default(false),
  lines: z.array(JournalLineSchema).min(2),
});

// --- Create form: reversal fields rejected if present ---

export const PostJournalEntryInputSchema = JournalEntryBaseSchema
  .extend({
    reverses_journal_entry_id: z.undefined().optional(),
    reversal_reason: z.undefined().optional(),
  })
  .refine(balancedRefinement, balancedMessage)
  .refine(idempotencyRefinement, idempotencyMessage)
  .refine(
    (entry) => entry.source !== 'agent',
    { message: 'source: "agent" is not implemented in Phase 1.1.' },
  )
  .refine(
    (entry) => entry.dry_run !== true,
    { message: 'dry_run: true is not implemented in Phase 1.1.' },
  );

// --- Reversal form: reversal fields required ---

export const ReversalInputSchema = JournalEntryBaseSchema
  .extend({
    reverses_journal_entry_id: z.string().uuid(),
    reversal_reason: z.string().min(1),
  })
  .refine(balancedRefinement, balancedMessage)
  .refine(idempotencyRefinement, idempotencyMessage)
  .refine(
    (entry) => entry.source !== 'agent',
    { message: 'source: "agent" is not implemented in Phase 1.1.' },
  )
  .refine(
    (entry) => entry.dry_run !== true,
    { message: 'dry_run: true is not implemented in Phase 1.1.' },
  );

// --- Exported types ---

// Output types (after parse — defaults applied, transforms run)
export type PostJournalEntryInput = z.infer<typeof PostJournalEntryInputSchema>;
export type ReversalInput = z.infer<typeof ReversalInputSchema>;

// Input types (before parse — optional fields allowed)
export type PostJournalEntryInputRaw = z.input<typeof PostJournalEntryInputSchema>;
export type ReversalInputRaw = z.input<typeof ReversalInputSchema>;

// --- mirrorLines pure helper (§15.7) ---
// Swaps debit_amount ↔ credit_amount per line.
// Preserves account_id, currency, amount_original, amount_cad, fx_rate, tax_code_id.
// Used by the ReversalForm to construct the reversal lines from the source entry.
// The service (validateReversalMirror) validates the mirror is correct.

export type MirrorableLine = {
  account_id: string;
  debit_amount: MoneyAmount;
  credit_amount: MoneyAmount;
  currency: string;
  amount_original: MoneyAmount;
  amount_cad: MoneyAmount;
  fx_rate: FxRate;
  tax_code_id: string | null;
};

export function mirrorLines(lines: MirrorableLine[]): MirrorableLine[] {
  return lines.map((line) => ({
    ...line,
    debit_amount: line.credit_amount,
    credit_amount: line.debit_amount,
  }));
}
