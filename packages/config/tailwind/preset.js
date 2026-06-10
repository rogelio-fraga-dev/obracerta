/**
 * Shared Tailwind CSS preset.
 *
 * Maps Tailwind theme keys to the design tokens exposed as CSS custom
 * properties by `@obracerta/design-tokens/tokens.css`. The token VALUES live in
 * design-tokens (single source of truth); this preset only wires the names so
 * both apps/web and packages/ui resolve the same palette/typography/spacing.
 *
 * @type {Partial<import("tailwindcss").Config>}
 */
export default {
  theme: {
    extend: {
      colors: {
        // Brand primary — orange scale
        orange: {
          DEFAULT: "var(--color-orange)",
          50: "var(--color-orange-50)",
          100: "var(--color-orange-100)",
          200: "var(--color-orange-200)",
          300: "var(--color-orange-300)",
          400: "var(--color-orange-400)",
          500: "var(--color-orange-500)",
          600: "var(--color-orange-600)",
          700: "var(--color-orange-700)",
          800: "var(--color-orange-800)",
          900: "var(--color-orange-900)",
        },
        dark: {
          DEFAULT: "var(--color-dark)",
          soft: "var(--color-dark-soft)",
        },
        cream: {
          DEFAULT: "var(--color-cream)",
          soft: "var(--color-cream-soft)",
        },
        // Semantic tokens
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        border: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "serif"],
        sans: ["var(--font-sans)", "Cabinet Grotesk", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      spacing: {
        section: "var(--space-section)",
      },
      // Gradientes do DS como classes (bg-gradient-brand etc.) — evita style inline.
      backgroundImage: {
        "gradient-brand": "var(--gradient-brand)",
        "gradient-brand-soft": "var(--gradient-brand-soft)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-glass": "var(--gradient-glass)",
      },
    },
  },
  plugins: [],
};
