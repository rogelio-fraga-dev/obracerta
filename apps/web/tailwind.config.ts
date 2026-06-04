import type { Config } from "tailwindcss";
import preset from "@obracerta/config/tailwind";

export default {
  presets: [preset as Partial<Config>],
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    // Scan the Design System so its Tailwind classes are generated.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
