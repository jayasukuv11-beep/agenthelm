import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "sdk/node/dist/**",
    "sdk/node/build-esm.js",
    "sdk/python/**",
    ".pytest_cache/**",
    "**/.pytest_cache/**",
    "**/__pycache__/**",
    "node_modules/**",
    // Minified vendor files (service worker, workbox)
    "public/**",
    // Skill templates (separate project)
    ".agents/**",
  ]),
  {
    rules: {
      // Downgrade to warning — backend API routes use `any` extensively.
      // This is tech debt to address incrementally, not a release blocker.
      "@typescript-eslint/no-explicit-any": "warn",
      // Apostrophes/quotes in JSX text are harmless and render correctly.
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
