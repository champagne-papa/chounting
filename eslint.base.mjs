import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Shared base config for all workspaces. App-specific configs (e.g.
// apps/web/eslint.config.mjs) extend this and layer on framework
// presets (next/core-web-vitals) and project-specific rules (the
// services/withInvariants plugin in apps/web).
const baseConfig = [
  { ignores: [".next/**", "dist/**", ".turbo/**"] },
  ...tseslint.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
    },
  },
];

export default baseConfig;
