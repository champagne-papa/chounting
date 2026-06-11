// apps/web/scripts/sync-sidecar-schemas.ts
//
// Phase 7 chunk 7.1b — emit JSON Schema files derived from TS-side Zod
// schemas into sidecar-ocr/schemas/json/ per ADR-0014 §3 schema-bound
// boundary discipline.
//
// Usage:
//   pnpm tsx apps/web/scripts/sync-sidecar-schemas.ts
//
// Runs after Zod schema changes at apps/web/src/agent/orchestrator/
// extraction/sidecar/schemas.ts. v1 manual sync per chunk 7.1 brief
// §4 Task 7.1b.4 partial-information value pick; automated codegen
// post-v1.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  OCRRequestSchema,
  OCRResponseSchema,
  DocumentArtifactPayloadSchema,
  OCRRunMetadataSchema,
  ExtractionRunMetadataSchema,
} from '../src/agent/orchestrator/extraction/sidecar/schemas';

const SIDECAR_SCHEMA_DIR = join(
  __dirname,
  '..',
  '..',
  '..',
  'sidecar-ocr',
  'schemas',
  'json',
);

const SCHEMAS = [
  { name: 'OCRRequest', schema: OCRRequestSchema },
  { name: 'OCRResponse', schema: OCRResponseSchema },
  { name: 'DocumentArtifactPayload', schema: DocumentArtifactPayloadSchema },
  { name: 'OCRRunMetadata', schema: OCRRunMetadataSchema },
  { name: 'ExtractionRunMetadata', schema: ExtractionRunMetadataSchema },
];

function emit(): void {
  mkdirSync(SIDECAR_SCHEMA_DIR, { recursive: true });

  for (const { name, schema } of SCHEMAS) {
    const jsonSchema = zodToJsonSchema(schema, name);
    const outPath = join(SIDECAR_SCHEMA_DIR, `${name}.json`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(jsonSchema, null, 2) + '\n');
    console.log(`Wrote ${outPath}`);
  }

  console.log(`Done. ${SCHEMAS.length} schema(s) emitted to ${SIDECAR_SCHEMA_DIR}`);
}

emit();
