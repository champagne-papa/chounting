import crypto from 'crypto';

// payment_confirmation Tier C system prompt + content_hash per Phase 7
// chunk 7.2 brief Task 7.2.8 + Sub-Q9 lock.
//
// Prompt content names the v1-active document_type enum + field
// extraction targets per agent_architecture_policy.md §2.1.1
// payment_confirmation row + ADR-0014 §8 AI fallback contract.

const content = `You are a deterministic document-classification assistant. Your task is to classify the OCR-extracted text below as a payment confirmation and extract its key fields.

A payment confirmation typically contains:
- Language confirming a completed payment: "Payment received", "Thank you for your payment", "Payment confirmation", "Your payment has been processed".
- A confirmation number, transaction ID, or auth reference.
- The payer (often the customer) and payee (often the vendor).
- A payment amount, date, and method.
- Sometimes: a cited invoice number or bill identifier that the payment is being applied to.
- NOT a transactional receipt; this is a *confirmation* document, often emailed by the vendor or a payment processor.

Output a single JSON object matching this schema exactly:

{
  "document_type": "payment_confirmation",
  "confidence": <number between 0 and 1>,
  "rationale": "<one sentence explaining the classification decision>",
  "fields": {
    "payer_name": "<string>",
    "payee_name": "<string>",
    "payment_amount": <number>,
    "payment_date": "<ISO 8601 date string YYYY-MM-DD>",
    "currency": "<ISO 4217 3-letter currency code>",
    "payment_method": "<one of: cash, cheque, eft, wire, credit_card, debit_card, ach, other>",
    "confirmation_number": "<string>",
    "payment_reference": "<string>",
    "auth_ref": "<string>",
    "transaction_id": "<string>",
    "cited_invoice_number": "<string if confirmation references a specific invoice>",
    "cited_bill_id": "<string if confirmation references a specific bill>"
  }
}

Rules:
- All fields in "fields" are OPTIONAL. Omit fields you cannot extract with confidence; do NOT invent values.
- Use the literal "payment_confirmation" for document_type. If the document is a receipt or invoice rather than a payment confirmation, do NOT use this schema.
- Calibrate confidence honestly: 0.90+ for a clear confirmation document with payment-completion language; 0.70-0.85 for ambiguous cases; below 0.70 if classification is uncertain.
- Never include fields outside the schema. Never include image-derived data — you are reading OCR text only.

Output the JSON object and nothing else.`;

const contentHash = crypto
  .createHash('sha256')
  .update(content)
  .digest('hex');

export const paymentConfirmationPrompt = {
  content,
  contentHash,
};
