// tests/integration/vendorNameMatcherUnblock.integration.test.ts
//
// Wave 6 D1 T4 (integration) — the matcher-gap closure, end-to-end. Tier-A
// extraction produces vendor_name → matchVendor resolves a non-null vendor_id
// (the precondition completeCandidate gates on at documentRouterService.ts:834).
// Plus the safe-degradation properties verified by reading the matcher:
//   - a customer-block capture is never produced → no wrong match;
//   - a contaminated capture → matchVendor no_match (never the wrong vendor);
//   - a null vendor_id makes completeCandidate take the :834 skip (→ needs_review),
//     which confirms that skip site directly.

import { describe, it, expect, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { vendorService } from '@/services/spend/vendorService';
import { extractVendorInvoiceFieldsTierA } from '@/agent/orchestrator/extraction/vendorInvoiceExtractor';
import { completeCandidate } from '@/services/document-platform/documentRouterService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { CompleteCandidateInputRaw } from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';

const db = adminClient();

function makeCtx(trace_id: string): ServiceContext {
  return {
    trace_id,
    caller: {
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      verified: true,
      org_ids: [SEED.ORG_HOLDING],
    },
  };
}

const createdVendorIds: string[] = [];
afterEach(async () => {
  for (const id of createdVendorIds.splice(0)) {
    await db.from('vendors').delete().eq('vendor_id', id);
  }
});

async function seedVendor(name: string): Promise<string> {
  const { data, error } = await db
    .from('vendors')
    .insert({ org_id: SEED.ORG_HOLDING, name })
    .select('vendor_id')
    .single();
  if (error) throw new Error(`seedVendor failed: ${error.message}`);
  const id = (data as { vendor_id: string }).vendor_id;
  createdVendorIds.push(id);
  return id;
}

// matchVendor takes the bridge's vendorField shape; the bridge maps
// fields.vendor_name → vendorField.vendor_name (ingestDocument.ts:1061-1078).
function vendorFieldFrom(extracted: { vendor_name?: string }) {
  return { vendor_name: extracted.vendor_name };
}

describe('Wave 6 D1 — vendor_name extraction → matchVendor unblock', () => {
  it('crux: sender-labeled OCR → extracted name → matchVendor resolves the seeded vendor', async () => {
    const trace_id = crypto.randomUUID();
    const vendorId = await seedVendor('Acme Corp');

    const extracted = extractVendorInvoiceFieldsTierA(
      'Vendor: Acme Corp\nInvoice #: 1001\nTotal: $500.00\n',
    );
    expect(extracted.vendor_name).toBe('Acme Corp');

    const result = await vendorService.matchVendor(
      { org_id: SEED.ORG_HOLDING, vendorField: vendorFieldFrom(extracted), trace_id },
      makeCtx(trace_id),
    );
    expect(result.vendor_id).toBe(vendorId);
    expect(result.match_type).toBe('exact_name');
  });

  it('safety: a customer-block name is never captured → matchVendor no_match (no wrong vendor)', async () => {
    const trace_id = crypto.randomUUID();
    // "Acme Corp" IS a seeded vendor, but here it is the CUSTOMER (Bill To).
    await seedVendor('Acme Corp');

    const extracted = extractVendorInvoiceFieldsTierA(
      'Bill To: Acme Corp\nInvoice #: 1001\nTotal: $500.00\n',
    );
    expect(extracted.vendor_name).toBeUndefined();

    const result = await vendorService.matchVendor(
      { org_id: SEED.ORG_HOLDING, vendorField: vendorFieldFrom(extracted), trace_id },
      makeCtx(trace_id),
    );
    expect(result.vendor_id).toBeNull();
    expect(result.match_type).toBe('no_match');
  });

  it('safety: trailing-field contamination → matchVendor no_match (never the wrong Acme)', async () => {
    const trace_id = crypto.randomUUID();
    await seedVendor('Acme Corp');

    const extracted = extractVendorInvoiceFieldsTierA(
      'Vendor: Acme Corp   Tax ID: 5\nInvoice #: 1001\n',
    );
    // contaminated capture (name + trailing field) — longer than the seeded name.
    expect(extracted.vendor_name).toContain('Acme Corp');
    expect(extracted.vendor_name).not.toBe('Acme Corp');

    const result = await vendorService.matchVendor(
      { org_id: SEED.ORG_HOLDING, vendorField: vendorFieldFrom(extracted), trace_id },
      makeCtx(trace_id),
    );
    expect(result.vendor_id).toBeNull();
  });
});

describe('Wave 6 D1 — completeCandidate :834 skip gates on vendor_id', () => {
  it('null vendor_id → completeCandidate returns [] (the :834 skip → needs_review)', async () => {
    const trace_id = crypto.randomUUID();
    const input: CompleteCandidateInputRaw = {
      document_case_id: crypto.randomUUID(),
      source_document_id: crypto.randomUUID(),
      document_type: 'vendor_invoice',
      classification_confidence: 0.95,
      extracted_fields: { amount: 1000 },
      vendor_match: {
        vendor_id: null,
        confidence: 0,
        match_type: 'no_match',
        candidate_alternatives: [],
      },
      trace_id,
    };
    const result = await completeCandidate(input, makeCtx(trace_id));
    expect(result).toHaveLength(0);
  });
});
