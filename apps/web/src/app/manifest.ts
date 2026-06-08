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
    start_url: "/inicio",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf7f0",
    theme_color: "#e8560a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
