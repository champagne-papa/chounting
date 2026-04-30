import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import baseConfig from "../../eslint.base.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
// Custom services-layer plugin lives at the monorepo root; it is
// shared infrastructure (LT-01b enforcement) but currently only
// targets apps/web/src/services/**.
const servicesPlugin = require(resolve(__dirname, "../../eslint-rules/index.js"));

const eslintConfig = [
  ...baseConfig,
  {
    rules: {
      // LT-03 / UF-006: adminClient is restricted to src/services/.
      // Route handlers and other layers must consume services rather
      // than the admin client directly.
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/db/adminClient", "**/db/adminClient"],
          message: "adminClient import is restricted to src/services/. Route handlers and other layers must consume services rather than the admin client directly (UF-006).",
        }],
      }],
    },
  },
  {
    files: ["src/services/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    // Tests legitimately bypass RLS via adminClient for fixture setup;
    // standard pattern across tests/integration/. LT-03 surface is
    // production code paths, not verification infrastructure.
    files: ["tests/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    // Operational/validation scripts (oi3 paid-API harness, audit
    // verifier, seed scripts, etc.) hold the same role as tests/
    // for LT-03 purposes. Pre-monorepo, scripts/ lived at the
    // repo root and was outside `next lint`'s default scope; the
    // monorepo move brought them into apps/web/scripts/, so this
    // exception preserves the pre-existing lint baseline.
    files: ["scripts/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    // LT-01(b): every property of every `export const <serviceName>
    // = { ... }` literal in src/services/**/*.ts must be either
    // wrapped in withInvariants(...) or preceded by a canonical-form
    // skip-org-check annotation. UF-006 mechanism facet.
    files: ["src/services/**/*.ts"],
    plugins: { services: servicesPlugin },
    rules: {
      "services/withInvariants-wrap-or-annotate": "error",
    },
  },
];

export default eslintConfig;
