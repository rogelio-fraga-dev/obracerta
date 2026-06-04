/**
 * Web runtime config. Brand and API URL come from env (plan §1/§2.7 — marca
 * desacoplada). NEXT_PUBLIC_* vars are inlined at build time.
 */
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333",
  brand: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "ObraCerta",
    domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "obracerta.com.br",
  },
} as const;
