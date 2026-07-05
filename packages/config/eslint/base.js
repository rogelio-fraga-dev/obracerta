import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Base ESLint flat config shared across every workspace.
 * TypeScript-aware, Prettier-compatible (formatting rules disabled).
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "**/coverage/**",
      // Temporário efêmero do tsup (some no fim do build) — lint em paralelo no
      // Turbo pode globá-lo e falhar com ENOENT (flake visto no CI).
      "**/tsup.config.bundled_*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  // Disable formatting rules that conflict with Prettier — keep this last.
  prettier,
];
