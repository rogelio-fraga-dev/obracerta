"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

/** Uma obra com coordenadas, pronta para virar um marcador. */
export interface ObraPin {
  id: string;
  titulo: string;
  especialidade: string;
  lat: number;
  lng: number;
}

/** Escapa texto do usuário antes de injetar no HTML do popup (anti-XSS). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Centro padrão (São Paulo) quando nenhuma obra tem coordenadas. */
const DEFAULT_CENTER: [number, number] = [-23.55, -46.63];

/**
 * Mapa de descoberta de obras (Leaflet + tiles OpenStreetMap). Client-only: o
 * Leaflet toca em `window`, então é importado dinâmico dentro do efeito. Marcadores
 * levam à obra. Só obras (anúncios públicos) — não plota profissionais (privacidade).
 */
export function ObrasMap({ obras }: { obras: ObraPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center = obras.length ? ([obras[0]!.lat, obras[0]!.lng] as [number, number]) : DEFAULT_CENTER;
      const map = L.map(containerRef.current).setView(center, obras.length ? 12 : 11);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // Pino desenhado inline (divIcon) — evita depender das imagens de marcador do
      // Leaflet (que quebram com bundlers) e de assets externos. Cor via token
      // (var(--color-primary)) — marca não é final, nunca hardcodar.
      const icon = L.divIcon({
        className: "",
        html:
          '<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50% 50% 50% 0;background:var(--color-primary);transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)">' +
          '<span style="width:10px;height:10px;border-radius:50%;background:#fff"></span></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26],
      });

      const bounds: [number, number][] = [];
      for (const o of obras) {
        const marker = L.marker([o.lat, o.lng], { icon }).addTo(map);
        marker.bindPopup(
          `<strong>${escapeHtml(o.titulo)}</strong><br/>${escapeHtml(o.especialidade)}<br/>` +
            `<a href="/obras/${o.id}">Ver obra &rarr;</a>`,
        );
        bounds.push([o.lat, o.lng]);
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [obras]);

  return (
    <div
      ref={containerRef}
      aria-label="Mapa de obras abertas"
      className="h-[70vh] min-h-[320px] w-full overflow-hidden rounded-2xl border border-border"
    />
  );
}
