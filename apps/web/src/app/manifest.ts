import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/**
 * Web App Manifest (PWA, Melhoria #3). Next serve isto em `/manifest.webmanifest`
 * e injeta o `<link>` automaticamente. A marca vem do env (desacoplada).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${config.brand.name} — construção civil`,
    short_name: config.brand.name,
    description:
      "Profissionais da construção civil com reputação verificada e agenda em tempo real.",
    // Abre na landing: quem não tem sessão conhece o produto; quem tem entra por ali.
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf7f0",
    theme_color: "#e8560a",
    icons: [
      // PNGs gerados a partir da logo real (scripts/gen-pwa-icons.cjs).
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
