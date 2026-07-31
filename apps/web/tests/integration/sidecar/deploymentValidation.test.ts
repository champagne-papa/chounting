// tests/integration/sidecar/deploymentValidation.test.ts
//
// Phase 8 chunk 1 Task 1 — fixture-mocked deploy validation harness per
// brief §4 Task 1 + Session 42 §2.1 N=10 substrate-staleness fix table
// inheritance. Validates sidecar-ocr/ deployment substrate against
// regression at chunk-ship grade rather than at first real Modal deployment.
//
// Sub-Q7 Round 2 lock: deploy validation ONLY (no runtime invocation
// mocking; that lives at consumer-chunk test infra).
//
// Each test asserts one of the N=10 substrate-staleness surfaces shipped at
// Session 42 (2026-05-20). Per-surface dedicated test enables per-N
// regression localization when a test fails.
//
// Path resolution: anchored to repo root via __dirname → 4 levels up
// (apps/web/tests/integration/sidecar → repo root). Pure fs.readFileSync
// assertions; no Modal, no PaddleOCR, no Python interpreter invocation.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// =====================================================================
// Path anchoring.
//
// __dirname equivalent under ESM: derive from import.meta.url. From the
// test file location apps/web/tests/integration/sidecar/, the repo root
// is four levels up. sidecar-ocr/ sits at the repo root.
// =====================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../../../..');
const SIDECAR_ROOT = resolve(REPO_ROOT, 'sidecar-ocr');

function readSidecarFile(relativePath: string): string {
  const absolutePath = resolve(SIDECAR_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(
      `sidecar-ocr file not found: ${relativePath} (resolved to ${absolutePath}; ` +
        `REPO_ROOT=${REPO_ROOT}). Check path-resolution anchor or substrate state.`,
    );
  }
  return readFileSync(absolutePath, 'utf8');
}

// =====================================================================
// Tests.
// =====================================================================

describe('Phase 8 chunk 1 — sidecar deployment validation harness', () => {
  describe('substrate root reachable', () => {
    it('REPO_ROOT/sidecar-ocr/ exists and is readable from test cwd', () => {
      expect(existsSync(SIDECAR_ROOT)).toBe(true);
      // Sanity: README.md is one of the files asserted below; if path
      // anchoring is wrong, this catches it before per-N test noise.
      expect(existsSync(resolve(SIDECAR_ROOT, 'README.md'))).toBe(true);
    });
  });

  describe('N=10 substrate-staleness surface coverage', () => {
    // -----------------------------------------------------------------
    // N=1 — Modal CLI `token info` command rename.
    //
    // Session 42 §2.1 N=1: Modal renamed `modal token current` to
    // `modal token info`. deploy.sh must use the new spelling; the old
    // spelling exits non-zero on a current Modal CLI install and the
    // deploy wrapper aborts before reaching `modal deploy`.
    // -----------------------------------------------------------------
    it('N=1 — sidecar-ocr/deploy.sh uses `modal token info` (CLI rename)', () => {
      const deploySh = readSidecarFile('deploy.sh');
      expect(deploySh).toContain('modal token info');
      // Negative assertion: the pre-rename spelling must not reappear.
      expect(deploySh).not.toMatch(/modal token current/);
    });

    // -----------------------------------------------------------------
    // N=2 — operational pipx inject pattern (pre-deploy operational step).
    //
    // Per brief §4 Task 1: N=2 is an operational pre-deploy step (pipx
    // inject for the Modal CLI environment on founder's local machine)
    // rather than a substrate surface inside sidecar-ocr/ that can be
    // asserted via fixture-mock. Skipped with explicit catalog entry
    // to preserve N=1..N=10 enumeration completeness in test output.
    // -----------------------------------------------------------------
    it.skip(
      'N=2 — operational pipx inject pattern; pre-deploy operational step not in fixture-mock scope',
      () => {
        // No substrate assertion. Operational discipline lives in the
        // founder's local Modal CLI environment, not in sidecar-ocr/.
      },
    );

    // -----------------------------------------------------------------
    // N=3 — Modal SDK `@modal.fastapi_endpoint` decorator rename.
    //
    // Session 42 §2.1 N=3: Modal renamed `@modal.web_endpoint` to
    // `@modal.fastapi_endpoint`. main.py must use the new decorator;
    // the old name no longer resolves on a current modal>=0.62.0 install.
    // -----------------------------------------------------------------
    it('N=3 — sidecar-ocr/main.py uses @modal.fastapi_endpoint decorator (SDK rename)', () => {
      const mainPy = readSidecarFile('main.py');
      expect(mainPy).toContain('@modal.fastapi_endpoint');
      // Negative assertion: the pre-rename decorator must not reappear
      // as an active decoration (commentary/docstring references are
      // tolerated; an active @-prefixed line is not).
      expect(mainPy).not.toMatch(/^\s*@modal\.web_endpoint\b/m);
    });

    // -----------------------------------------------------------------
    // N=4 — FastAPI `[standard]` extras declared.
    //
    // Session 42 §2.1 N=4: bare `fastapi>=...` lacks the uvicorn/standard
    // extras Modal needs to serve @modal.fastapi_endpoint. Requirements
    // must declare `fastapi[standard]>=0.110.0`.
    // -----------------------------------------------------------------
    it('N=4 — sidecar-ocr/requirements.txt declares fastapi[standard]>=0.110.0', () => {
      const requirements = readSidecarFile('requirements.txt');
      expect(requirements).toMatch(/fastapi\[standard\]>=0\.110\.0/);
    });

    // -----------------------------------------------------------------
    // N=5 — Modal image explicitly mounts sibling Python packages.
    //
    // Session 42 §2.1 N=5: Modal copies only the file containing
    // @app decorators by default. Sibling packages/modules must be
    // explicitly mounted via .add_local_python_source(), otherwise
    // cold-start fails with ModuleNotFoundError.
    //
    // 2026-07-31: assertion widened from the exact two-arg literal
    // '.add_local_python_source("middleware", "schemas")' to a
    // per-module membership check. The literal made every LEGITIMATE
    // addition a failure, and that is exactly what happened: the
    // config.py split (a937858a) added a third local module, and this
    // test then failed for the wrong reason — it read as "the mount is
    // broken" when the mount was correct and the assertion was stale.
    //
    // The wider history is the point of this comment. This guard was
    // written for precisely the ModuleNotFoundError it now fences, and
    // it did NOT catch the config.py omission that shipped to main:
    // nothing ran it. CI defines five jobs (typecheck, lint, adr,
    // intent-producers, build) and none invokes vitest, so "all checks
    // pass" never included this test. The bug surfaced instead at a
    // live `modal run` against the dev sidecar. Keep the assertion
    // membership-based so it survives future modules — a guard that
    // fails on correct changes gets edited away, and then it guards
    // nothing.
    // -----------------------------------------------------------------
    it('N=5 — sidecar-ocr/main.py mounts EVERY local module it imports via add_local_python_source', () => {
      const mainPy = readSidecarFile('main.py');
      const call = mainPy.match(/\.add_local_python_source\(([^)]*)\)/);
      expect(call, 'main.py must call .add_local_python_source(...)').not.toBeNull();

      const mounted = [...(call?.[1].matchAll(/"([^"]+)"/g) ?? [])].map((m) => m[1]);
      for (const required of ['middleware', 'schemas', 'config']) {
        expect(
          mounted,
          `main.py imports "${required}" at module level; unmounted modules ` +
            'ModuleNotFoundError at container start',
        ).toContain(required);
      }
    });

    // -----------------------------------------------------------------
    // N=6 — README secret-naming consistency: KEY=value, not value=...
    //
    // Session 42 §2.1 N=6: the original README documented
    // `modal secret create ... value=<secret>` but the KEY name must be
    // `MODAL_OCR_HMAC_SECRET` since it becomes the env var name inside
    // the deployed container, and main.py reads that exact env var.
    // -----------------------------------------------------------------
    it('N=6 — sidecar-ocr/README.md documents MODAL_OCR_HMAC_SECRET=<secret> KEY naming', () => {
      const readme = readSidecarFile('README.md');
      expect(readme).toContain('MODAL_OCR_HMAC_SECRET=<secret>');
      // Negative assertion: the pre-fix `value=<secret>` spelling must
      // not appear as an active `modal secret create` argument. We
      // accept descriptions that mention the wrong spelling as historical
      // context (the README itself documents the fix), so this guard
      // checks specifically for an active `value=` arg adjacent to the
      // command name rather than a blanket no-`value=` rule.
      expect(readme).not.toMatch(
        /modal secret (?:create|update) modal-ocr-hmac-secret value=/,
      );
    });

    // -----------------------------------------------------------------
    // N=7 — deploy.sh secret-naming consistency mirrors README.
    //
    // Session 42 §2.1 N=7: same KEY=value mismatch in deploy.sh's
    // warning-block hint. Must use `MODAL_OCR_HMAC_SECRET=...` form.
    // -----------------------------------------------------------------
    it('N=7 — sidecar-ocr/deploy.sh hint uses MODAL_OCR_HMAC_SECRET=<secret> KEY naming', () => {
      const deploySh = readSidecarFile('deploy.sh');
      expect(deploySh).toContain('MODAL_OCR_HMAC_SECRET=');
      expect(deploySh).not.toMatch(
        /modal secret (?:create|update) modal-ocr-hmac-secret value=/,
      );
    });

    // -----------------------------------------------------------------
    // N=8 — Pydantic 2 strict mode field type: bytes_b64 declared as str.
    //
    // Session 42 §2.1 N=8: bytes_b64 must be `str`, not `bytes`. Pydantic
    // 2 strict mode rejects str → bytes auto-coercion (Pydantic 1
    // behavior was removed). The wire shape is base64 string, decoded
    // inside main.py via base64.b64decode (which accepts str input).
    // -----------------------------------------------------------------
    it('N=8 — sidecar-ocr/schemas/extraction.py declares OCRRequest.bytes_b64 as str (Pydantic 2 strict)', () => {
      const extractionPy = readSidecarFile('schemas/extraction.py');
      expect(extractionPy).toMatch(/bytes_b64:\s*str\b/);
      // Negative assertion: the pre-fix `bytes_b64: bytes` declaration
      // must not reappear. Anchor on the field declaration to avoid
      // false-positive matches against the word `bytes` in commentary.
      expect(extractionPy).not.toMatch(/bytes_b64:\s*bytes\b/);
    });

    // -----------------------------------------------------------------
    // N=9 — PaddlePaddle 3.x incompatibility upper-bound.
    //
    // Session 42 §2.1 N=9: paddlepaddle 3.x introduced PIR executor;
    // some ops (oneDNN ArrayAttribute<DoubleAttribute>) don't fully
    // support PIR conversion → OCR inference crashes. requirements.txt
    // must upper-bound both paddleocr and paddlepaddle to <3.0.0 to
    // stay on the stable 2.x line.
    // -----------------------------------------------------------------
    it('N=9 — sidecar-ocr/requirements.txt upper-bounds paddlepaddle + paddleocr to <3.0.0', () => {
      const requirements = readSidecarFile('requirements.txt');
      expect(requirements).toMatch(/paddlepaddle>=2\.5\.0,<3\.0\.0/);
      expect(requirements).toMatch(/paddleocr>=2\.7\.0,<3\.0\.0/);
    });

    // -----------------------------------------------------------------
    // N=10 — pymupdf transitive dep for PDF rasterization.
    //
    // Session 42 §2.1 N=10: PaddleOCR's error message recommends `pip
    // install fitz` but `fitz` is an unrelated PyPI package; the correct
    // install is `pymupdf` (the `fitz` import name is historical from
    // the original MuPDF library). requirements.txt must declare
    // pymupdf>=1.23.0 so PDF page rasterization works at runtime.
    // -----------------------------------------------------------------
    it('N=10 — sidecar-ocr/requirements.txt declares pymupdf>=1.23.0 for PDF rasterization', () => {
      const requirements = readSidecarFile('requirements.txt');
      expect(requirements).toMatch(/pymupdf>=1\.23\.0/);
    });
  });
});
