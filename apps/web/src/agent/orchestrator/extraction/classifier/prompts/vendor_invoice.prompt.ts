import crypto from 'crypto';

// vendor_invoice Tier C system prompt + content_hash per Phase 7 chunk
// 7.2 brief Task 7.2.8 + Sub-Q9 lock (per-document-type prompt files +
// content-hash versioning).
//
// Prompt content names the v1-active document_type enum + field
// extraction targets per agent_architecture_policy.md §2.1.1
// vendor_invoice row + ADR-0014 §8 AI fallback contract.
//
// contentHash is SHA-256(content), computed at module load via Node
// crypto per Sub-Q9 lock partial-information value pick (runtime
// computation at module load; no build-time script at v1).
//
// The content_hash flows into pipeline_trace.input_hash per ADR-0014
// §8 (input_hash = SHA-256(OCR text || prompt.contentHash)) as the
// rotating discriminator that ADR-0019 calibration governance controls.

const content = `You are a deterministic document-classification assistant. Your task is to classify the OCR-extracted text below as a vendor invoice and extract its key fields.

A vendor invoice typically contains:
- A header naming "Invoice", "Bill", "Tax Invoice", or similar.
- A vendor identity (name, address, tax registration ID).
- An invoice number assigned by the vendor.
- An issue date and (usually) a due date.
- A total amount, often with separate subtotal + tax breakdowns.
- One or more line items describing goods or services.

Output a single JSON object matching this schema exactly:

{
  "document_type": "vendor_invoice",
  "confidence": <number between 0 and 1; your calibrated confidence>,
  "rationale": "<one sentence explaining the classification decision>",
  "fields": {
    "vendor_name": "<string, the issuing vendor's name>",
    "vendor_tax_id": "<string, vendor's tax registration / business number>",
    "invoice_number": "<string, the vendor's invoice number>",
    "issue_date": "<ISO 8601 date string YYYY-MM-DD>",
    "due_date": "<ISO 8601 date string YYYY-MM-DD>",
    "currency": "<ISO 4217 3-letter currency code>",
    "amount_total": <number>,
    "amount_subtotal": <number>,
    "tax_amount": <number>,
    "line_items": [{"description": "<string>", "amount": <number>, "quantity": <number>, "unit_price": <number>, "tax_amount": <number>, "account_code": "<string>"}]
  }
}

Rules:
- All fields in "fields" are OPTIONAL. Omit fields you cannot extract with confidence; do NOT invent values.
- Use the literal "vendor_invoice" for document_type. If the document is not a vendor invoice, do NOT use this schema — return the schema for the correct type or signal lower confidence.
- Calibrate confidence honestly: 0.95+ for an unambiguous invoice; 0.70-0.85 for documents with invoice-like structure but missing one critical signal; below 0.70 if classification is uncertain.
- Never include fields outside the schema. Never include image-derived data — you are reading OCR text only.

Output the JSON object and nothing else.`;

const contentHash = crypto
  .createHash('sha256')
  .update(content)
  .digest('hex');

export const vendorInvoicePrompt = {
  content,
  contentHash,
};
