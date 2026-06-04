import base from "./base.js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/**
 * ESLint flat config for Next.js / React (apps/web, packages/ui).
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...base,
  {
    files: ["**/*.{ts,tsx,jsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 17+ / Next.js automatic JSX runtime — no React import needed.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Greenfield codebase — treat stale-deps as an error, not a warning.
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
