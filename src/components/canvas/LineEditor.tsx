// src/components/canvas/LineEditor.tsx
// Shared line-editor component extracted at Step 10b (third-consumer
// threshold) from the verbatim JSX duplicated across JournalEntryForm
// (Task 13 original) and AdjustmentForm (Step 9b copy-paste). Third
// consumer is RecurringTemplateForm (Step 10b).
//
// Closes Step 12 queue item 17.
//
// Contract: parent form owns react-hook-form state + useFieldArray;
// passes register + errors + fields + append + remove + accounts +
// taxCodes down. LineEditor renders the "Lines" header + "+ Add Line"
// button + the fields.map block including per-line error messages.
// Parent form retains the balance indicator, header fields, and
// submit/cancel UX.
//
// Type parameters:
//   The three consumer forms (JournalEntryForm, AdjustmentForm,
//   RecurringTemplateForm) each have different full schemas. The
//   shared line-level path string (e.g. `lines.${index}.account_id`)
//   is the same across all three, but react-hook-form's strongly-
//   typed UseFormRegister<TFieldValues> requires TFieldValues to
//   include `lines: LineEditorLine[]` as an ArrayPath. The generic
//   constraint proved too narrow across consumers (TS2344 on
//   UseFieldArrayReturn<TFieldValues, 'lines'>), so we accept
//   UseFormRegister<any> / FieldErrors<any> here and keep type
//   safety at consumer sites via their own useForm<SpecificSchema>
//   bindings. This matches the prompt's D10b-2 fallback guidance:
//   "simplify by making `register` accept `string` paths with an
//   explicit comment that the `any` is load-bearing for multi-
//   consumer reuse."

'use client';

import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
} from 'react-hook-form';

export type LineEditorLine = {
  account_id: string;
  debit_or_credit: 'debit' | 'credit';
  amount: string;
  tax_code_id?: string | '';
};

export type LineEditorAccount = {
  account_id: string;
  account_code: string;
  account_name: string;
};

export type LineEditorTaxCode = {
  tax_code_id: string;
  code: string;
  rate: string;
};

type LineEditorField = { id: string };

type LineErrorTree = {
  message?: string;
  [index: number]:
    | {
        account_id?: { message?: string };
        debit_or_credit?: { message?: string };
        amount?: { message?: string };
      }
    | undefined;
};

type LineEditorProps = {
  // Load-bearing `any` on these two types so the three consumer
  // forms (each with a different TFieldValues) can share this
  // component. See file-top comment for the constraint that
  // motivated dropping the generic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<FieldValues>;
  fields: ReadonlyArray<LineEditorField>;
  append: (value: LineEditorLine) => void;
  remove: (index: number) => void;
  accounts: LineEditorAccount[];
  taxCodes: LineEditorTaxCode[];
};

export function LineEditor({
  register,
  errors,
  fields,
  append,
  remove,
  accounts,
  taxCodes,
}: LineEditorProps) {
  const linesErrors = errors.lines as LineErrorTree | undefined;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-600">Lines</span>
        <button
          type="button"
          onClick={() =>
            append({
              account_id: '',
              debit_or_credit: 'debit',
              amount: '',
              tax_code_id: '',
            })
          }
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Line
        </button>
      </div>

      {linesErrors?.message && (
        <p className="text-sm text-red-500 mb-2">{linesErrors.message}</p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => {
          const rowErrors = linesErrors?.[index];
          return (
            <div
              key={field.id}
              className="flex items-start gap-2 p-3 border border-neutral-200 rounded"
            >
              {/* Account */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-neutral-500 mb-0.5">Account</label>
                {accounts.length === 0 ? (
                  <div className="text-sm text-neutral-400">
                    No accounts available. Contact your administrator.
                  </div>
                ) : (
                  <select
                    {...register(`lines.${index}.account_id`)}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select account...</option>
                    {accounts.map((a) => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.account_code} — {a.account_name}
                      </option>
                    ))}
                  </select>
                )}
                {rowErrors?.account_id && (
                  <p className="text-sm text-red-500 mt-0.5">
                    {rowErrors.account_id.message}
                  </p>
                )}
              </div>

              {/* Debit/Credit */}
              <div className="w-24">
                <label className="block text-xs text-neutral-500 mb-0.5">D/C</label>
                <select
                  {...register(`lines.${index}.debit_or_credit`)}
                  className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
                {rowErrors?.debit_or_credit && (
                  <p className="text-sm text-red-500 mt-0.5">
                    {rowErrors.debit_or_credit.message}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="w-32">
                <label className="block text-xs text-neutral-500 mb-0.5">Amount</label>
                <input
                  type="text"
                  {...register(`lines.${index}.amount`)}
                  placeholder="0.00"
                  className="w-full border border-neutral-300 rounded px-2 py-1 text-sm font-mono"
                />
                {rowErrors?.amount && (
                  <p className="text-sm text-red-500 mt-0.5">
                    {rowErrors.amount.message}
                  </p>
                )}
              </div>

              {/* Tax Code */}
              <div className="w-36">
                <label className="block text-xs text-neutral-500 mb-0.5">Tax Code</label>
                <select
                  {...register(`lines.${index}.tax_code_id`)}
                  className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">— No tax —</option>
                  {taxCodes.map((tc) => (
                    <option key={tc.tax_code_id} value={tc.tax_code_id}>
                      {tc.code} ({tc.rate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 2}
                  className="text-sm text-red-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
