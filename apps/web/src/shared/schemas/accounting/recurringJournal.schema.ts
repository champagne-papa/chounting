// src/shared/schemas/accounting/recurringJournal.schema.ts
// Phase 0-1.1 Arc A Step 10a — recurring journals schema boundary.
//
// Five input schemas:
//   - RecurringTemplateInputSchema        — create path (balanced lines)
//   - RecurringTemplateUpdateSchema       — update path (partial; optional lines)
//   - RecurringRunGenerateInputSchema     — generateRun
//   - RecurringRunApproveInputSchema      — approveRun (no fields; status override rejected)
//   - RecurringRunRejectInputSchema       — rejectRun (rejection_reason + status override rejected)
//
// Three-layer INV-RECURRING-001 defense:
//   - Layer 1 (DB): deferred CONSTRAINT TRIGGER enforce_template_balance
//     on recurring_journal_template_lines (migration 20240131000000).
//   - Layer 2 (Zod, this file): balanced-lines .refine on the create/update schemas.
//     Faster ergonomic error than waiting for the DB trigger.
//   - Layer 3 (service): all mutations parse through these schemas; no bypass.
//
// ADR-0010 Layer 2 — reserved-state defense for recurring_journal_runs.status:
//   approveRun / rejectRun schemas carry `status: z.undefined().optional()`
//   so any client-provided status triggers a ZodError. The service emits
//   no 'approved' value (Layer 3); the DB CHECK rejects non-whitelist
//   values (Layer 1). All three layers compose per ADR-0010 §Decision.

import { z } from 'zod';
import {
  MoneyAmountSchema,
  addMoney,
  eqMoney,
  zeroMoney,
} from './money.schema';

// ---------------------------------------------------------------------------
// Template line schema (shared by create + update)
// ---------------------------------------------------------------------------
//
// Template lines are the Phase 1 shape — debit/credit/currency/tax only.
// No amount_original/amount_cad/fx_rate because recurring templates are
// CAD-only in Phase 1 (matches JournalEntryForm's implicit shape). The
// service computes amount_original = debit + credit and fx_rate = 1.0
// at run-generation / approve time when the real journal entry is posted.
// Phase 2 multi-currency recurring templates would extend this schema.

const RecurringTemplateLineSchema = z.object({
  account_id: z.string().uuid({ message: 'Account is required' }),
  description: z.string().optional(),
  debit_amount: MoneyAmountSchema,
  credit_amount: MoneyAmountSchema,
  currency: z.string().length(3).default('CAD'),
  tax_code_id: z.string().uuid().nullable().optional(),
}).refine(
  (line) => {
    const dZero = eqMoney(line.debit_amount, zeroMoney());
    const cZero = eqMoney(line.credit_amount, zeroMoney());
    if (dZero && cZero) return false;
    if (!dZero && !cZero) return false;
    return true;
  },
  { message: 'Line must have exactly one of debit or credit positive (not both, not zero).' },
);

export type RecurringTemplateLine = z.infer<typeof RecurringTemplateLineSchema>;

// ---------------------------------------------------------------------------
// Shared balanced refinement — INV-RECURRING-001 Layer 2
// ---------------------------------------------------------------------------

function balancedRefinement(input: { lines: RecurringTemplateLine[] }): boolean {
  const debits = input.lines.reduce(
    (acc, l) => addMoney(acc, l.debit_amount),
    zeroMoney(),
  );
  const credits = input.lines.reduce(
    (acc, l) => addMoney(acc, l.credit_amount),
    zeroMoney(),
  );
  return eqMoney(debits, credits);
}
const balancedMessage = {
  message: 'Template debits must equal template credits (INV-RECURRING-001).',
};

// ---------------------------------------------------------------------------
// Create template
// ---------------------------------------------------------------------------

export const RecurringTemplateInputSchema = z.object({
  org_id: z.string().uuid(),
  template_name: z.string().min(1, { message: 'Template name is required' }),
  description: z.string().optional(),
  auto_post: z.boolean().optional().default(false),
  lines: z.array(RecurringTemplateLineSchema).min(2, {
    message: 'At least 2 lines are required',
  }),
}).refine(balancedRefinement, balancedMessage);

export type RecurringTemplateInput = z.infer<typeof RecurringTemplateInputSchema>;
export type RecurringTemplateInputRaw = z.input<typeof RecurringTemplateInputSchema>;

// ---------------------------------------------------------------------------
// Update template — partial metadata; lines optional (if provided, must balance)
// ---------------------------------------------------------------------------

export const RecurringTemplateUpdateSchema = z.object({
  template_name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  auto_post: z.boolean().optional(),
  is_active: z.boolean().optional(),
  lines: z.array(RecurringTemplateLineSchema).min(2).optional(),
}).refine(
  (input) => {
    if (!input.lines) return true;
    return balancedRefinement({ lines: input.lines });
  },
  balancedMessage,
);

export type RecurringTemplateUpdate = z.infer<typeof RecurringTemplateUpdateSchema>;
export type RecurringTemplateUpdateRaw = z.input<typeof RecurringTemplateUpdateSchema>;

// ---------------------------------------------------------------------------
// Generate run
// ---------------------------------------------------------------------------

export const RecurringRunGenerateInputSchema = z.object({
  scheduled_for: z.string().date(),
});

export type RecurringRunGenerateInput = z.infer<typeof RecurringRunGenerateInputSchema>;
export type RecurringRunGenerateInputRaw = z.input<typeof RecurringRunGenerateInputSchema>;

// ---------------------------------------------------------------------------
// Approve run — ADR-0010 Layer 2: reject client-provided status override
// ---------------------------------------------------------------------------

export const RecurringRunApproveInputSchema = z.object({
  // ADR-0010 Layer 2 defense: any client attempt to submit a
  // status field triggers ZodError. The service writes 'posted'
  // via its own logic; clients cannot propose a value.
  status: z.undefined().optional(),
}).strict();

export type RecurringRunApproveInput = z.infer<typeof RecurringRunApproveInputSchema>;
export type RecurringRunApproveInputRaw = z.input<typeof RecurringRunApproveInputSchema>;

// ---------------------------------------------------------------------------
// Reject run — ADR-0010 Layer 2 + rejection_reason required
// ---------------------------------------------------------------------------

export const RecurringRunRejectInputSchema = z.object({
  rejection_reason: z.string().min(1, { message: 'Rejection reason is required' }),
  // ADR-0010 Layer 2 defense (same as approve schema)
  status: z.undefined().optional(),
}).strict();

export type RecurringRunRejectInput = z.infer<typeof RecurringRunRejectInputSchema>;
export type RecurringRunRejectInputRaw = z.input<typeof RecurringRunRejectInputSchema>;
