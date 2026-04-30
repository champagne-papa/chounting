import { dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const servicesPlugin = require("./eslint-rules/index.js");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // .next/ build output is generated; do not lint it. Closes the
  // ~9,860-error pre-existing baseline pollution surfaced at S30
  // brief-creation pre-flight pre-1.
  { ignores: [".next/**"] },
  ...tseslint.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      // LT-03 / UF-006: adminClient is restricted to src/services/. Route
      // handlers and other layers must consume services rather than the
      // admin client directly. Override below re-enables it for the
      // service layer.
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