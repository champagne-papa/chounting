"""Pydantic models mirroring TS-side Zod schemas at
apps/web/src/agent/orchestrator/extraction/sidecar/schemas.ts.

Per ADR-0014 §3 schema-bound boundary discipline:
- TS Zod is source of truth.
- JSON Schema is generated from Zod via zod-to-json-schema.
- Pydantic models are derived from JSON Schema (v1: manual sync via
  apps/web/scripts/sync-sidecar-schemas.ts emit + manual Pydantic
  authoring; post-v1: automated codegen from JSON Schema).
- Schema mismatch at boundary validation surfaces as PIPELINE_SCHEMA_MISMATCH
  ServiceError on TS side.
"""

from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict


class OCRRequest(BaseModel):
    """Input shape for run_ocr endpoint.

    bytes_b64 is base64-encoded raw document bytes (PDF/image). v1
    Modal sidecar processes bytes directly; signed-URL fetch
    alternative reserved per ADR-0014 §3 topology.
    """

    model_config = ConfigDict(strict=True, extra="forbid")

    bytes_b64: bytes
    content_hash: str
    trace_id: str


class DocumentArtifact(BaseModel):
    """Mirrors TS DocumentArtifactRow shape per ADR-0011 §5
    document_artifacts schema. pages/lines/words are JSONB-compatible
    payloads; quality_flags is text[]; confidence is numeric [0,1] or null.
    """

    model_config = ConfigDict(strict=True, extra="forbid")

    engine: str
    engine_version: str
    pages: Any
    lines: Any
    words: Any
    quality_flags: List[str]
    confidence: Optional[float]


class OCRRunMetadata(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    engine: str
    engine_version: str
    status: str
    started_at: str
    completed_at: str


class ExtractionRunMetadata(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    extraction_version: str
    started_at: str
    completed_at: str


class OCRResponse(BaseModel):
    """Output shape for run_ocr endpoint.

    artifact: payload that lands in document_artifacts row.
    ocr_run + extraction_run: metadata that TS-side runOCR.ts persists
    as ocr_runs + extraction_runs rows BEFORE document_artifacts INSERT
    (FK satisfaction sequence per chunk 7.1b Task 7.1b.6).
    trace_id: defense-in-depth trace propagation per ADR-0014 §3.
    """

    model_config = ConfigDict(strict=True, extra="forbid")

    artifact: DocumentArtifact
    ocr_run: OCRRunMetadata
    extraction_run: ExtractionRunMetadata
    trace_id: str
