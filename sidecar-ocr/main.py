"""Modal OCR sidecar — Phase 7 chunk 7.1b.

Per ADR-0014 §2 (PaddleOCR v1 locked) + §3 (Modal sidecar topology;
shared-secret HMAC authentication; X-Trace-Id propagation; Zod-bound
schema boundary). The sidecar runs PaddleOCR PP-OCRv4 inference and
returns structured output matching the TS-side OCRResponseSchema.

Statelessness: every request carries everything it needs; no session
state persists between requests; container restarts do not affect
correctness (ADR-0014 §3).

Authentication: HMAC-SHA256 over canonical request content (the
{bytes_b64, content_hash, trace_id} fields serialized as canonical
JSON) using MODAL_OCR_HMAC_SECRET; verified via middleware/hmac.py
before any OCR work. v1 ships the signature inside the JSON body
under __hmac_signature key (Modal @modal.fastapi_endpoint simplification);
ADR-0014 §3 X-Auth-HMAC header form is post-v1 amendment per chunk
7.1b §1.2 (ζ) divergence absorption.

Trace propagation: trace_id embedded in request body and echoed in
response body for cross-process tracing.

v1 manual deployment: `modal deploy main.py` from sidecar-ocr/. See
README.md for full deployment runbook.
"""

from __future__ import annotations

import json
import os

import modal

import config
from middleware.hmac import verify_hmac
from schemas.extraction import OCRRequest, OCRResponse, DocumentArtifact


app = modal.App(config.app_name())

# PaddleOCR PP-OCRv4 weights live in a Modal Volume, populated ONCE by
# populate_models() and mounted read-write at /root/.paddleocr on run_ocr.
#
# Why a Volume, not baking weights into the image (incident 2026-06-12):
# baking added `curl` to apt_install + a `run_commands` layer, invalidating the
# image's apt layer. Modal then had to REBUILD that layer on top of the heavy
# cached paddlepaddle pip base, and materializing that multi-GB base for the
# rebuild HANGS indefinitely (>=10 min, no build stream). Proven by throwaway
# probes 2026-06-12: the identical image MINUS the pip layer deployed in 77s;
# WITH it, hung. The pip/apt image had been frozen + cache-hit since 2026-05-20,
# so the bake branch was the first real rebuild in ~3 weeks and exposed this.
# A Volume stops touching the image: it reverts to the 2026-05-20 cached
# definition (instant deploys) and weights arrive at runtime via the mount, so
# the first (cold) request pays no ~50s bcebos download. populate_models uses
# Python stdlib (urllib+tarfile) at RUNTIME, never at build, so the build is
# never re-triggered.
models_volume = modal.Volume.from_name(
    config.volume_name(), create_if_missing=True
)

PADDLE_HOME = "/root/.paddleocr"

# (url, extract_dir): extract_dir is the model_dir PARENT; each tar contains a
# <model-name>/ leaf, so files land at <extract_dir>/<model-name>/inference.*,
# the EXACT paths PaddleOCR(use_angle_cls=True, lang='en') reads at runtime
# (reconciled against the runtime Namespace model_dirs: det PP-OCRv3-en,
# rec PP-OCRv4-en, cls mobile-v2.0). Coupled to pinned paddleocr >=2.7,<3.0.
_MODEL_SPECS = [
    (
        "https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_det_infer.tar",
        f"{PADDLE_HOME}/whl/det/en",
    ),
    (
        "https://paddleocr.bj.bcebos.com/PP-OCRv4/english/en_PP-OCRv4_rec_infer.tar",
        f"{PADDLE_HOME}/whl/rec/en",
    ),
    (
        "https://paddleocr.bj.bcebos.com/dygraph_v2.0/ch/ch_ppocr_mobile_v2.0_cls_infer.tar",
        f"{PADDLE_HOME}/whl/cls",
    ),
]

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install_from_requirements("requirements.txt")
    .apt_install("libgl1", "libglib2.0-0")
    # Phase 7 v1 close demo fix-forward (2026-05-20; chunk-7.1b-impl-grade
    # local-deploy-substrate-gap N=5): Modal copies only the file
    # containing @app decorators by default; sibling middleware/ + schemas/
    # subpackages must be explicitly mounted, otherwise container crashes
    # at cold-start with `ModuleNotFoundError: No module named 'middleware'`.
    .add_local_python_source("middleware", "schemas")
)


def _canonical_signing_body(payload: dict) -> bytes:
    """Canonical JSON of the signed content fields per HMAC discipline.

    Signs only the content fields the TS-side client populates; excludes
    the __hmac_signature field itself (otherwise the signature would
    be circular with the body it signs).
    """
    signed_subset = {
        "bytes_b64": payload.get("bytes_b64", ""),
        "content_hash": payload.get("content_hash", ""),
        "trace_id": payload.get("trace_id", ""),
    }
    return json.dumps(signed_subset, sort_keys=True, separators=(",", ":")).encode(
        "utf-8"
    )


@app.function(image=image, volumes={PADDLE_HOME: models_volume}, timeout=900)
def populate_models() -> str:
    """One-time Volume populate. Run once via:

        cd sidecar-ocr && modal run main.py::populate_models

    Downloads the three PP-OCRv4 weight archives with Python stdlib
    (urllib+tarfile) at RUNTIME — never at image build, so it cannot
    re-trigger the paddle-base rebuild hang. Extracts each into its
    reconciled model_dir parent and commits the Volume so run_ocr sees the
    weights at the mounted PADDLE_HOME. Idempotent.
    """
    import urllib.request
    import tarfile
    import glob

    for url, extract_dir in _MODEL_SPECS:
        os.makedirs(extract_dir, exist_ok=True)
        tar_path = os.path.join(extract_dir, os.path.basename(url))
        urllib.request.urlretrieve(url, tar_path)
        with tarfile.open(tar_path) as tar:
            tar.extractall(extract_dir)
        os.remove(tar_path)

    found = sorted(
        glob.glob(f"{PADDLE_HOME}/whl/**/inference.pdmodel", recursive=True)
    )
    models_volume.commit()
    print(f"[populate] committed {len(found)} model dirs: {found}", flush=True)
    return f"populated {len(found)} model dirs: {found}"


@app.function(
    image=image,
    secrets=[modal.Secret.from_name(config.secret_name())],
    volumes={PADDLE_HOME: models_volume},
)
@modal.fastapi_endpoint(method="POST")
def run_ocr(request: dict) -> dict:
    """OCR endpoint per ADR-0014 §3 topology contract.

    Input: JSON request body matching OCRRequest Pydantic shape plus
    __hmac_signature field (HMAC-SHA256 of canonical signed body).
    Output: JSON response body matching OCRResponse Pydantic shape.
    """
    from fastapi import HTTPException

    secret = os.environ.get("MODAL_OCR_HMAC_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="MODAL_OCR_HMAC_SECRET missing")

    signing_body = _canonical_signing_body(request)
    signature = request.get("__hmac_signature", "")

    if not verify_hmac(signing_body, signature, secret):
        raise HTTPException(status_code=401, detail="HMAC verification failed")

    try:
        parsed = OCRRequest.model_validate(
            {
                "bytes_b64": request["bytes_b64"],
                "content_hash": request["content_hash"],
                "trace_id": request["trace_id"],
            }
        )
    except Exception as parse_err:  # pragma: no cover — Pydantic ValidationError
        raise HTTPException(
            status_code=400, detail=f"Pydantic validation failed: {parse_err}"
        ) from parse_err

    started_at = _isoformat_now()

    # Fail loud if the Volume wasn't populated, rather than letting PaddleOCR
    # silently re-download weights at runtime (the ~70s cold-start stall this
    # design eliminates). Durable runtime form of the build-time `test -f` gate:
    # an unpopulated Volume returns HTTP 503 pointing at populate_models instead
    # of regressing to per-cold-start downloads.
    _missing = [
        d
        for d in (
            f"{PADDLE_HOME}/whl/det/en/en_PP-OCRv3_det_infer/inference.pdmodel",
            f"{PADDLE_HOME}/whl/rec/en/en_PP-OCRv4_rec_infer/inference.pdmodel",
            f"{PADDLE_HOME}/whl/cls/ch_ppocr_mobile_v2.0_cls_infer/inference.pdmodel",
        )
        if not os.path.exists(d)
    ]
    if _missing:
        raise HTTPException(
            status_code=503,
            detail=(
                f"PaddleOCR weights missing from Volume ({len(_missing)}/3 model "
                "dirs). Run: cd sidecar-ocr && modal run main.py::populate_models"
            ),
        )

    # PaddleOCR inference. Lazy-import to keep cold-start lean.
    import base64
    import uuid as _uuid

    try:
        from paddleocr import PaddleOCR

        ocr_engine = PaddleOCR(use_angle_cls=True, lang="en")
        bytes_decoded = base64.b64decode(parsed.bytes_b64)
        tmp_path = f"/tmp/{_uuid.uuid4()}.pdf"
        with open(tmp_path, "wb") as f:
            f.write(bytes_decoded)
        ocr_result = ocr_engine.ocr(tmp_path)
        os.unlink(tmp_path)
    except Exception as ocr_err:
        raise HTTPException(
            status_code=500, detail=f"OCR inference failed: {ocr_err}"
        ) from ocr_err

    completed_at = _isoformat_now()

    # Marshal PaddleOCR output into DocumentArtifact shape per
    # ADR-0011 §5 document_artifacts schema.
    lines = []
    if ocr_result and isinstance(ocr_result, list):
        for page_result in ocr_result:
            if page_result:
                for line in page_result:
                    if line and len(line) >= 2:
                        bbox = line[0]
                        text, confidence = line[1]
                        lines.append(
                            {
                                "text": text,
                                "bbox": bbox,
                                "confidence": float(confidence),
                            }
                        )

    artifact = DocumentArtifact(
        engine="paddleocr",
        engine_version="paddleocr-2.7-pp-ocrv4",
        pages={"count": len(ocr_result) if ocr_result else 0},
        lines=lines,
        words={"count": sum(len((line.get("text", "")).split()) for line in lines)},
        quality_flags=[],
        confidence=(
            sum(line["confidence"] for line in lines) / len(lines) if lines else None
        ),
    )

    response = OCRResponse(
        artifact=artifact,
        ocr_run={
            "engine": "paddleocr",
            "engine_version": "paddleocr-2.7-pp-ocrv4",
            "status": "completed",
            "started_at": started_at,
            "completed_at": completed_at,
        },
        extraction_run={
            "extraction_version": "pp-ocrv4-v1",
            "started_at": started_at,
            "completed_at": completed_at,
        },
        trace_id=parsed.trace_id,
    )

    return response.model_dump()


def _isoformat_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()
