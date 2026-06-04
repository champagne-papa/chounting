// tests/unit/wave6D3SchemaBroadens.test.ts
//
// Wave 6 D3 T2 — the four Zod broadens (decomposition T2; brief D-3.2)
// in lockstep with the chunk_9 Layer-1 CHECK (migration 20240176):
//   1. DocumentCaseStateSchema +'committed' (read-back lockstep —
//      readDocumentCase safeParses against this schema).
//   2. TransitionInputSchema +'proposed' variant (the human
//      needs_review→proposed hop; §5(A) superseded per brief D-1.1).
//   3. AdvanceCaseAutomationInputSchema.target_state +'committed'
//      (the approved→committed post-success marking, T4 edge).
//   4. PostJournalEntryInputSchema / PostBillInputSchema /
//      RecordPaymentInputSchema +source_external_id (optional, min 1 —
//      the idx_je_source_external dedup key pass-through chain).

import { describe, it, expect } from 'vitest';
import {
  DocumentCaseStateSchema,
  TransitionInputSchema,
  AdvanceCaseAutomationInputSchema,
} from '@/shared/schemas/document-platform/documentCase.schema';
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { PostBillInputSchema } from '@/shared/schemas/spend/bill.schema';
import { RecordPaymentInputSchema } from '@/shared/schemas/spend/recordPayment.schema';

describe('Wave 6 D3 T2: DocumentCaseStateSchema lockstep', () => {
  it("admits 'committed' (chunk_9 lockstep)", () => {
    expect(DocumentCaseStateSchema.safeParse('committed').success).toBe(true);
  });

  it("still rejects 'archived' (the sole Layer-1-reserved state)", () => {
    expect(DocumentCaseStateSchema.safeParse('archived').success).toBe(false);
  });
});

describe('Wave 6 D3 T2: TransitionInputSchema proposed variant', () => {
  it('parses target_state=proposed with no reason (optional)', () => {
    const r = TransitionInputSchema.safeParse({ target_state: 'proposed' });
    expect(r.success).toBe(true);
  });

  it('parses target_state=proposed with a reason', () => {
    const r = TransitionInputSchema.safeParse({
      target_state: 'proposed',
      reason: 'reviewer moved to approve-track',
    });
    expect(r.success).toBe(true);
  });

  it('existing variants unchanged: rejected still requires reason', () => {
    expect(
      TransitionInputSchema.safeParse({ target_state: 'rejected' }).success,
    ).toBe(false);
    expect(
      TransitionInputSchema.safeParse({
        target_state: 'rejected',
        reason: 'not a real invoice',
      }).success,
    ).toBe(true);
  });

  it("does NOT admit automation-only or unknown targets (e.g. 'committed', 'matched')", () => {
    expect(
      TransitionInputSchema.safeParse({ target_state: 'committed' }).success,
    ).toBe(false);
    expect(
      TransitionInputSchema.safeParse({ target_state: 'matched' }).success,
    ).toBe(false);
  });
});

describe('Wave 6 D3 T2: AdvanceCaseAutomationInputSchema +committed', () => {
  const id = '00000000-0000-0000-0000-000000000001';

  it("admits target_state='committed'", () => {
    expect(
      AdvanceCaseAutomationInputSchema.safeParse({
        document_case_id: id,
        target_state: 'committed',
      }).success,
    ).toBe(true);
  });

  it("still structurally excludes 'matched' (Subsystem 2 single ownership)", () => {
    expect(
      AdvanceCaseAutomationInputSchema.safeParse({
        document_case_id: id,
        target_state: 'matched',
      }).success,
    ).toBe(false);
  });
});

describe('Wave 6 D3 T2: source_external_id pass-through fields', () => {
  it('PostJournalEntryInputSchema: optional, min(1) rejects empty string', () => {
    const base = {
      org_id: '00000000-0000-0000-0000-000000000001',
      fiscal_period_id: '00000000-0000-0000-0000-000000000002',
      entry_date: '2026-06-04',
      description: 'd3 t2 schema test',
      source: 'manual' as const,
      lines: [
        {
          account_id: '00000000-0000-0000-0000-000000000003',
          debit_amount: '10.00',
          credit_amount: '0.00',
          currency: 'CAD',
          amount_original: '10.00',
          amount_cad: '10.00',
          fx_rate: '1',
        },
        {
          account_id: '00000000-0000-0000-0000-000000000004',
          debit_amount: '0.00',
          credit_amount: '10.00',
          currency: 'CAD',
          amount_original: '10.00',
          amount_cad: '10.00',
          fx_rate: '1',
        },
      ],
    };
    expect(PostJournalEntryInputSchema.safeParse(base).success).toBe(true);
    expect(
      PostJournalEntryInputSchema.safeParse({
        ...base,
        source_external_id: 'dc_case-uuid',
      }).success,
    ).toBe(true);
    expect(
      PostJournalEntryInputSchema.safeParse({
        ...base,
        source_external_id: '',
      }).success,
    ).toBe(false);
  });

  it('PostBillInputSchema + RecordPaymentInputSchema: field optional, empty string rejected', () => {
    // Shape-only probe: parse failures must come from source_external_id,
    // so probe the field on an otherwise-valid partial via .pick().
    const billField = PostBillInputSchema.pick({ source_external_id: true });
    expect(billField.safeParse({}).success).toBe(true);
    expect(billField.safeParse({ source_external_id: 'dc_x' }).success).toBe(true);
    expect(billField.safeParse({ source_external_id: '' }).success).toBe(false);

    const payField = RecordPaymentInputSchema.pick({
      source_external_id: true,
    });
    expect(payField.safeParse({}).success).toBe(true);
    expect(payField.safeParse({ source_external_id: 'dc_x' }).success).toBe(true);
    expect(payField.safeParse({ source_external_id: '' }).success).toBe(false);
  });
});
