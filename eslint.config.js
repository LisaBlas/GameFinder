import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// eslint-plugin-react-hooks v7's "recommended" bundles a set of React
// Compiler-readiness rules (set-state-in-effect, immutability, purity,
// static-components, etc.) alongside the two long-standing hook rules.
// This app isn't targeting React Compiler adoption, and satisfying those
// rules against the existing codebase would mean behavior-affecting effect/
// render rewrites, not lint hygiene. Keep only the classic pair; the rest
// are turned off rather than left to fire unpredictably on new code later.
const reactHooksCompilerRules = {
  "react-hooks/static-components": "off",
  "react-hooks/use-memo": "off",
  "react-hooks/preserve-manual-memoization": "off",
  "react-hooks/incompatible-library": "off",
  "react-hooks/immutability": "off",
  "react-hooks/globals": "off",
  "react-hooks/refs": "off",
  "react-hooks/set-state-in-effect": "off",
  "react-hooks/error-boundaries": "off",
  "react-hooks/purity": "off",
  "react-hooks/set-state-in-render": "off",
  "react-hooks/unsupported-syntax": "off",
  "react-hooks/config": "off",
  "react-hooks/gating": "off",
};

// Unused-var/any findings against the pre-existing codebase split into two
// buckets: unambiguous dead imports (fixed directly) vs. unused locals/
// functions and external-API `any`s that need a product-owner call, not a
// lint-rollout guess. Those stay as non-blocking warnings rather than
// errors or silent excludes.
const pragmaticRules = {
  "@typescript-eslint/no-unused-vars": [
    "warn",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
  "@typescript-eslint/no-explicit-any": "warn",
  "no-empty": ["error", { allowEmptyCatch: true }],
};

export default defineConfig(
  // client/src/components/ui/** is shadcn/ui-generated (components.json),
  // not hand-authored — same treatment as dist/build.
  globalIgnores(["dist", "build", "_source", ".ux_review_venv", "client/src/components/ui/**"]),
  {
    files: ["client/**/*.{js,jsx,ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...reactHooksCompilerRules,
      ...pragmaticRules,
      "react-refresh/only-export-components": "warn",
    },
  },
  {
    files: ["server/**/*.{js,ts}", "shared/**/*.ts", "db/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: { ...pragmaticRules },
  },
);
