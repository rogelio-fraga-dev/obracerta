// Root ESLint flat config. Each app/package also has its own eslint.config.mjs;
// this one covers stray root-level files and provides editor coverage.
import base from "@obracerta/config/eslint/base";

export default [
  {
    ignores: ["**/dist/**", "**/.next/**", "**/.turbo/**", "**/node_modules/**", "**/coverage/**"],
  },
  ...base,
];
