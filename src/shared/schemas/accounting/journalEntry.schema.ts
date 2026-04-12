import { z } from 'zod';
import {
  MoneyAmountSchema,
  FxRateSchema,
  addMoney,
  eqMoney,
  multiplyMoneyByRate,
  zeroMoney,
  type MoneyAmount,
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
  dry_run: z.boolean().default(false),
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

export type PostJournalEntryInput = z.infer<typeof PostJournalEntryInputSchema>;
export type ReversalInput = z.infer<typeof ReversalInputSchema>;
