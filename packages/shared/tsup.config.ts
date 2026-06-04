import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  // zod is a runtime dependency — keep it external so a single instance is shared.
  external: ["zod"],
});
