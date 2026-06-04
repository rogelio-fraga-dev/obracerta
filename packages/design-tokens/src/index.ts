/**
 * Design tokens as typed JS values, mirroring `tokens.css`.
 *
 * Use these when you need token values in JS (charts, canvas, inline styles).
 * For styling prefer the CSS custom properties / Tailwind classes so the token
 * stays a single source of truth and theming keeps working.
 */

export const colors = {
  orange: {
    50: "#fff0e8",
    100: "#ffe0cc",
    200: "#ffc9a8",
    300: "#ffa876",
    400: "#ff7a3d",
    500: "#e8560a",
    600: "#cc4708",
    700: "#a53a07",
    800: "#7e2d06",
    900: "#5c2105",
  },
  dark: { DEFAULT: "#18160f", soft: "#221f16" },
  cream: { DEFAULT: "#faf7f0", soft: "#f2ede0" },
  border: "#e8e0cc",
  mutedForeground: "#6b6455",
  success: "#1a9e5c",
  warning: "#e8a00a",
  danger: "#dc2626",
  info: "#2563eb",
} as const;

export const fonts = {
  display: '"Fraunces", serif',
  sans: '"Cabinet Grotesk", system-ui, sans-serif',
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
} as const;

export const spacing = {
  section: "clamp(4rem, 3rem + 5vw, 10rem)",
} as const;

export const tokens = { colors, fonts, radii, spacing } as const;
export type Tokens = typeof tokens;
