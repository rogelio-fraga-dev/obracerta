import base from "./base.js";

/**
 * ESLint flat config for NestJS (Node) services.
 * Relaxes a few rules that fight with Nest's decorator-heavy DI style.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...base,
  {
    files: ["**/*.ts"],
    rules: {
      // Nest decorators (@Injectable, @Module) rely on metadata; classes may be
      // empty by design (marker modules), so don't flag that.
      "@typescript-eslint/no-extraneous-class": "off",
      // Interceptors/filters frequently receive framework `any` shapes.
      "@typescript-eslint/no-explicit-any": "warn",
      // CRITICAL: with emitDecoratorMetadata, constructor-injected dependencies
      // must be VALUE imports. `import type` would erase the metadata and break
      // Nest DI — so disable the type-imports rule for the backend.
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.e2e-spec.ts", "**/test/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];
